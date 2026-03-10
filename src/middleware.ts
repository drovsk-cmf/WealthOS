import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  checkRateLimit,
  extractRouteKey,
  rateLimitHeaders,
} from "@/lib/auth/rate-limiter";

/**
 * WealthOS Middleware
 *
 * Responsibilities:
 * 1. Rate-limit auth routes (login, register, forgot/reset-password)
 * 2. Refresh auth session on every request
 * 3. Redirect unauthenticated users to /login
 * 4. Redirect authenticated users away from public auth pages
 * 5. Allow MFA challenge and onboarding pages for authenticated users
 * 6. Add Server-Timing headers for performance monitoring
 *
 * MFA AAL check happens client-side (app layout) because middleware
 * should stay fast - MFA API calls add latency on every route.
 *
 * NOTA sobre rate limiting:
 * - O rate limiter é in-memory (não compartilha estado entre instâncias)
 * - Protege contra brute-force básico em login/register/reset
 * - A proteção principal de auth vem do Supabase (GoTrue built-in rate limits)
 * - Para produção multi-região: migrar para Upstash Redis ou Vercel KV
 * - WAF (Vercel/Cloudflare) recomendado como camada adicional
 */

// Routes accessible without authentication
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/api/auth/callback",
  "/privacy",
];

// Auth routes that authenticated users CAN access (not redirected away)
const AUTH_FLOW_ROUTES = [
  "/onboarding",
  "/mfa-challenge",
  "/api/auth/callback",
];

export async function middleware(request: NextRequest) {
  const startMs = performance.now();
  const { pathname } = request.nextUrl;

  // ── Rate Limiting (auth routes only) ──
  const routeKey = extractRouteKey(pathname);
  if (routeKey) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const rlResult = checkRateLimit(routeKey, ip);

    if (!rlResult.allowed) {
      const headers = rateLimitHeaders(rlResult);
      return new NextResponse(
        JSON.stringify({
          error: "Muitas tentativas. Aguarde antes de tentar novamente.",
          retryAfterSeconds: Math.ceil(rlResult.retryAfterMs / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        }
      );
    }
  }

  // ── Supabase session refresh ──
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Refresh the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect root to dashboard
  if (pathname === "/" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  if (pathname === "/" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthFlowRoute = AUTH_FLOW_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Unauthenticated user trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user on public auth pages (but not auth flow pages)
  if (user && isPublicRoute && !isAuthFlowRoute) {
    // Check onboarding status to decide where to redirect
    const { data: profile } = await supabase
      .from("users_profile")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();

    if (profile && !profile.onboarding_completed) {
      url.pathname = "/onboarding";
    } else {
      url.pathname = "/dashboard";
    }

    return NextResponse.redirect(url);
  }

  // ── Performance monitoring (Server-Timing header) ──
  const elapsedMs = (performance.now() - startMs).toFixed(1);
  supabaseResponse.headers.set(
    "Server-Timing",
    `middleware;dur=${elapsedMs};desc="Auth middleware"`
  );

  // Rate limit headers on auth routes (even when allowed)
  if (routeKey) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const rlResult = checkRateLimit(routeKey, ip);
    const headers = rateLimitHeaders(rlResult);
    Object.entries(headers).forEach(([k, v]) => {
      supabaseResponse.headers.set(k, v);
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

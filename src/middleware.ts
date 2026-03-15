import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  checkRateLimit,
  extractRouteKey,
  rateLimitHeaders,
  type RateLimitResult,
} from "@/lib/auth/rate-limiter";

/**
 * Oniefy Middleware
 *
 * Responsibilities:
 * 1. Rate-limit auth routes (login, register, forgot/reset-password)
 * 2. Refresh auth session on every request
 * 3. Redirect unauthenticated users to /login
 * 4. Redirect authenticated users away from public auth pages
 * 5. Allow MFA challenge and onboarding pages for authenticated users
 * 6. Add Server-Timing headers for performance monitoring
 * 7. CSP nonce generation (P2: production-safe Content-Security-Policy)
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

// ── CSP Nonce (P2) ──

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // btoa is available in edge runtime (Buffer may not be)
  return btoa(String.fromCharCode(...array));
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";

  // In dev: unsafe-eval required for Next.js HMR + React Fast Refresh
  // In prod: no unsafe-eval/unsafe-inline. Uses nonce + strict-dynamic.
  // strict-dynamic allows scripts loaded by nonce'd scripts to execute.
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  // style-src: unsafe-inline needed for Tailwind inline style attributes
  const styleSrc = "style-src 'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://api.bcb.gov.br wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

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

  // ── CSP Nonce (P2: remove unsafe-eval in production) ──
  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  // ── Rate Limiting (auth routes only) ──
  const routeKey = extractRouteKey(pathname);
  let rlResultForHeaders: RateLimitResult | null = null;

  if (routeKey) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const rlResult = checkRateLimit(routeKey, ip);
    rlResultForHeaders = rlResult;

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
  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

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
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
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

  // ── CSP header (P2) ──
  supabaseResponse.headers.set("Content-Security-Policy", buildCsp(nonce));

  // Rate limit headers on auth routes (reuse result from first check)
  if (rlResultForHeaders) {
    const headers = rateLimitHeaders(rlResultForHeaders);
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

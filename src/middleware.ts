import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  checkRateLimit,
  extractRouteKey,
  rateLimitHeaders,
  type RateLimitResult,
} from "@/lib/auth/rate-limiter";
import { validateEnv } from "@/lib/config/env";

// Fail fast if env vars are missing
validateEnv();

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
 * 7. CSP header (Content-Security-Policy)
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

// ── CSP ──

function buildCsp(): string {
  const isDev = process.env.NODE_ENV === "development";

  // Next.js pre-renders pages statically (x-nextjs-prerender: 1).
  // Nonce-based CSP requires nonce attributes on every <script> tag,
  // but static HTML is generated at build time without per-request nonces.
  // Result: browser blocks ALL scripts and the page never hydrates.
  //
  // Safe approach: 'unsafe-inline' for scripts. This is standard for
  // Next.js apps using static/ISR rendering. The remaining CSP directives
  // (frame-ancestors, form-action, connect-src, etc.) still provide
  // meaningful protection against clickjacking, form hijacking, and
  // unauthorized API calls.
  //
  // TODO: revisit nonce-based CSP when Next.js supports nonce injection
  // for statically pre-rendered pages.
  //
  // Turnstile (opt-in via NEXT_PUBLIC_TURNSTILE_SITE_KEY):
  //   script-src + frame-src + connect-src need challenges.cloudflare.com
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com"
    : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com";

  // style-src: unsafe-inline needed for Tailwind inline style attributes
  const styleSrc = "style-src 'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://api.bcb.gov.br wss://*.supabase.co https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
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
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/push/send",    // Cron endpoint (auth via CRON_SECRET, not session)
  "/api/digest/send",  // Cron endpoint (auth via DIGEST_CRON_SECRET, not session)
  "/privacy",
  "/terms",
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

  const requestHeaders = new Headers(request.headers);

  // ── Rate Limiting (auth routes, POST only) ──
  // Only count form submissions, not page views.
  // GET /forgot-password = viewing the page (no limit)
  // POST /api/auth/forgot-password = submitting the form (rate limited)
  const routeKey = request.method === "POST" ? extractRouteKey(pathname) : null;
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

  // Helper: redirect while preserving session cookies set by getUser() refresh.
  // Without this, token refreshes written to supabaseResponse are lost on redirect,
  // causing the client to land with stale/missing tokens (e.g. OAuth double-click bug).
  function redirectWithCookies(url: URL) {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });
    return response;
  }

  // ── Route classification ──
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthFlowRoute = AUTH_FLOW_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect root
  if (pathname === "/" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Unauthenticated user trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // ── Onboarding gate (authenticated users only) ──
  // Uses cookie cache to avoid DB roundtrip on every navigation.
  // Cookie stores user_id to prevent cross-user inheritance on shared browsers.
  // Set once after confirming onboarding_completed=true. Re-checked after 7 days.
  if (user) {
    const onboardingDone = request.cookies.get("onboarding_done")?.value === user.id;

    if (!onboardingDone) {
      // No cache or different user: query DB (happens once per session after login)
      const { data: profile } = await supabase
        .from("users_profile")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      const completed = profile?.onboarding_completed === true;

      if (completed) {
        // Set cookie with user_id as value (validated on next request)
        supabaseResponse.cookies.set("onboarding_done", user.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days (re-checked after expiry)
          path: "/",
        });
      } else {
        // Not completed: redirect to onboarding (unless already there)
        if (!isAuthFlowRoute) {
          const url = request.nextUrl.clone();
          url.pathname = "/onboarding";
          return redirectWithCookies(url);
        }
      }
    }

    // Root redirect for authenticated users (onboarding done)
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return redirectWithCookies(url);
    }

    // Authenticated user on public auth pages: redirect away
    if (isPublicRoute && !isAuthFlowRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return redirectWithCookies(url);
    }
  }

  // ── Performance monitoring (Server-Timing header) ──
  const elapsedMs = (performance.now() - startMs).toFixed(1);
  supabaseResponse.headers.set(
    "Server-Timing",
    `middleware;dur=${elapsedMs};desc="Auth middleware"`
  );

  // ── CSP header (P2) ──
  supabaseResponse.headers.set("Content-Security-Policy", buildCsp());

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

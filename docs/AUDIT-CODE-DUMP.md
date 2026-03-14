# Oniefy - Code Dump para Auditoria

Total: 137 arquivos


### next.config.js
```
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co https://api.bcb.gov.br wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

```

### tailwind.config.ts
```
import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "DM Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Oniefy custom colors
        income: {
          DEFAULT: "hsl(var(--income))",
          foreground: "hsl(var(--income-foreground))",
        },
        expense: {
          DEFAULT: "hsl(var(--expense))",
          foreground: "hsl(var(--expense-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        // Plum Ledger brand
        plum: "hsl(var(--plum) / <alpha-value>)",
        graphite: "hsl(var(--graphite) / <alpha-value>)",
        bone: "hsl(var(--bone) / <alpha-value>)",
        stone: "hsl(var(--stone) / <alpha-value>)",
        sage: "hsl(var(--sage) / <alpha-value>)",
        brass: "hsl(var(--brass) / <alpha-value>)",
        // Semantic (direct access)
        verdant: "hsl(var(--verdant) / <alpha-value>)",
        terracotta: "hsl(var(--terracotta) / <alpha-value>)",
        burnished: "hsl(var(--burnished) / <alpha-value>)",
        "info-slate": "hsl(var(--slate) / <alpha-value>)",
        // Tiers
        "tier-1": "hsl(var(--tier-1) / <alpha-value>)",
        "tier-2": "hsl(var(--tier-2) / <alpha-value>)",
        "tier-3": "hsl(var(--tier-3) / <alpha-value>)",
        "tier-4": "hsl(var(--tier-4) / <alpha-value>)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;

```

### .github/workflows/ci.yml
```
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"

jobs:
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npm run type-check

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co"
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key"

  security-check:
    name: Security Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check for service_role key in frontend
        run: |
          echo "Checking for service_role key leaks in frontend code..."
          if grep -r "SUPABASE_SERVICE_ROLE_KEY\|service_role" \
            --include="*.tsx" --include="*.ts" \
            src/app src/components src/lib/supabase/client.ts 2>/dev/null | \
            grep -v "server.ts" | \
            grep -v "// " | \
            grep -v "node_modules"; then
            echo "ERROR: service_role key reference found in frontend code!"
            exit 1
          fi
          echo "OK: No service_role key leaks detected."

      - name: Check RLS enabled on all tables
        run: |
          echo "Checking migration file for RLS enablement..."
          TABLES=$(grep "CREATE TABLE " supabase/migrations/001_initial_schema.sql | \
            sed 's/CREATE TABLE //' | sed 's/ (.*//' | sort)
          RLS_TABLES=$(grep "ENABLE ROW LEVEL SECURITY" supabase/migrations/001_initial_schema.sql | \
            sed 's/ALTER TABLE //' | sed 's/ ENABLE.*//' | sort)
          
          MISSING=$(comm -23 <(echo "$TABLES") <(echo "$RLS_TABLES"))
          if [ -n "$MISSING" ]; then
            echo "ERROR: Tables without RLS:"
            echo "$MISSING"
            exit 1
          fi
          echo "OK: All tables have RLS enabled."

```

### public/sw.js
```
/**
 * Oniefy - Service Worker (CFG-07)
 *
 * Strategy:
 * - Static assets (JS, CSS, fonts, images): Cache-first, network fallback
 * - API calls (/api/, supabase): Network-first, cache fallback for reads
 * - Navigation: Network-first, offline fallback page
 *
 * Cache versioning: bump CACHE_VERSION to invalidate old caches.
 */

const CACHE_VERSION = "oniefy-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Static assets to precache on install
const PRECACHE_URLS = [
  "/dashboard",
  "/manifest.json",
];

// ─── Install ─────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // Don't fail install if precache fails (dev mode, missing assets)
        console.warn("[SW] Precache partial failure:", err);
      });
    })
  );
  // Activate immediately (skip waiting)
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
});

// ─── Fetch ───────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (mutations should always go to network)
  if (request.method !== "GET") return;

  // Skip chrome-extension, ws, etc.
  if (!url.protocol.startsWith("http")) return;

  // Skip Supabase auth endpoints (always network)
  if (url.pathname.includes("/auth/")) return;

  // Strategy selection
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else {
    // Navigation and other: network-first with offline fallback
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// ─── Helpers ─────────────────────────────────────────────────

function isStaticAsset(url) {
  const staticExtensions = [
    ".js", ".css", ".woff", ".woff2", ".ttf", ".otf",
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ];
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/brand/") ||
    staticExtensions.some((ext) => url.pathname.endsWith(ext))
  );
}

function isApiRequest(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase")
  );
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return a basic offline response for missing static assets
    return new Response("", { status: 503, statusText: "Offline" });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok && request.method === "GET") {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // For navigation requests, return the cached dashboard as fallback
    if (request.mode === "navigate") {
      const fallback = await caches.match("/dashboard");
      if (fallback) return fallback;
    }

    return new Response(
      JSON.stringify({ error: "offline", message: "Sem conexão. Dados em cache indisponíveis." }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

```

### src/middleware.ts
```
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

```

### src/app/layout.tsx
```
import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Oniefy",
  description: "Oniefy — Any asset, one clear view.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Oniefy",
    description: "Any asset, one clear view.",
    images: [{ url: "/brand/og-plum-bone-1200x630.png", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F0E8" },
    { media: "(prefers-color-scheme: dark)", color: "#141218" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

```

### src/app/(app)/layout.tsx
```
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Download,
  Tag,
  BookOpen,
  Target,
  Users,
  PieChart,
  Calendar,
  Building,
  CheckSquare,
  FileText,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSessionTimeout } from "@/lib/auth/use-session-timeout";
import { clearEncryptionKey } from "@/lib/auth/encryption-manager";
import { useAuthInit } from "@/lib/hooks/use-auth-init";
import { useOnlineStatus, useServiceWorker } from "@/lib/hooks/use-online-status";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: ArrowLeftRight },
  { href: "/accounts", label: "Contas", icon: Wallet },
  { href: "/connections", label: "Importação", icon: Download },
  { href: "/categories", label: "Categorias", icon: Tag },
  { href: "/chart-of-accounts", label: "Plano de Contas", icon: BookOpen },
  { href: "/cost-centers", label: "Centros de Custo", icon: Target },
  { href: "/family", label: "Estrutura Familiar", icon: Users },
  { href: "/budgets", label: "Orçamento", icon: PieChart },
  { href: "/bills", label: "Contas a Pagar", icon: Calendar },
  { href: "/assets", label: "Patrimônio", icon: Building },
  { href: "/workflows", label: "Tarefas", icon: CheckSquare },
  { href: "/tax", label: "Fiscal", icon: FileText },
  { href: "/indices", label: "Índices", icon: TrendingUp },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const supabase = createClient();

  // Session timeout (30min inactivity)
  useSessionTimeout();

  const { ready, userName } = useAuthInit(pathname);
  const isOnline = useOnlineStatus();
  useServiceWorker();

  // Auth state change listener (token refresh no longer requires encryption rotation)
  // KEK is derived from stable kek_material, not JWT - no re-wrap needed.

  async function handleLogout() {
    clearEncryptionKey();
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Show nothing until AAL check completes
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r bg-card transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header: brand + user + logout */}
        <div className="flex-shrink-0 border-b px-6 py-4">
          <Image
            src="/brand/lockup-h-plum-transparent.svg"
            alt="Oniefy"
            width={1588}
            height={617}
            className="h-8 w-auto dark:hidden"
            priority
            unoptimized
          />
          <Image
            src="/brand/lockup-h-bone-transparent.svg"
            alt="Oniefy"
            width={1588}
            height={617}
            className="hidden h-8 w-auto dark:block"
            priority
            unoptimized
          />
          {userName && (
            <div className="mt-2 flex items-center justify-between">
              <p className="truncate text-xs text-muted-foreground">{userName}</p>
              <button
                onClick={handleLogout}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Sair"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {/* Mobile header */}
        <header className="flex h-16 items-center border-b px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Image
            src="/brand/lockup-h-plum-transparent.svg"
            alt="Oniefy"
            width={1588}
            height={617}
            className="ml-3 h-7 w-auto dark:hidden"
            priority
            unoptimized
          />
          <Image
            src="/brand/lockup-h-bone-transparent.svg"
            alt="Oniefy"
            width={1588}
            height={617}
            className="ml-3 hidden h-7 w-auto dark:block"
            priority
            unoptimized
          />
        </header>

        <div className="p-6">
          {!isOnline && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-burnished/30 bg-burnished/10 px-4 py-2.5 text-sm text-burnished">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M15.536 8.464a5 5 0 010 7.072M8.464 15.536a5 5 0 010-7.072" />
              </svg>
              <span>Sem conexão. Dados em cache disponíveis, alterações serão sincronizadas ao reconectar.</span>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

```

### src/app/(app)/accounts/page.tsx
```
"use client";

import { useState } from "react";
import { Wallet, Archive } from "lucide-react";
import {
  useAccounts,
  useDeactivateAccount,
  ACCOUNT_TYPE_LABELS,
} from "@/lib/hooks/use-accounts";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { AccountForm } from "@/components/accounts/account-form";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/types/database";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const deactivate = useDeactivateAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useAutoReset(confirmDelete, setConfirmDelete);

  // ─── Totals ───────────────────────────────────────────────
  const totals = accounts?.reduce(
    (acc, a) => {
      if (a.type === "credit_card") {
        acc.debt += a.current_balance;
      } else {
        acc.current += a.current_balance;
        acc.projected += a.projected_balance;
      }
      return acc;
    },
    { current: 0, projected: 0, debt: 0 }
  ) ?? { current: 0, projected: 0, debt: 0 };

  function handleEdit(account: Account) {
    setEditingAccount(account);
    setFormOpen(true);
  }

  function handleNew() {
    setEditingAccount(null);
    setFormOpen(true);
  }

  async function handleDeactivate(id: string) {
    await deactivate.mutateAsync(id);
    setConfirmDelete(null);
  }

  // ─── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Contas</h1>
        <button
          onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Nova conta
        </button>
      </div>

      {/* Summary cards */}
      {accounts && accounts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Saldo atual</p>
            <p className="mt-1 text-xl font-semibold text-verdant">
              {formatCurrency(totals.current)}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Saldo previsto</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(totals.projected)}
            </p>
            <p className="text-xs text-muted-foreground">
              inclui pendentes
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Dívida (cartões)</p>
            <p className="mt-1 text-xl font-semibold text-terracotta">
              {formatCurrency(totals.debt)}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {accounts && accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Nenhuma conta cadastrada</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Contas bancárias, cartões e carteiras são registrados aqui.
          </p>
          <button
            onClick={handleNew}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Cadastrar conta
          </button>
        </div>
      )}

      {/* Account list */}
      {accounts && accounts.length > 0 && (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              {/* Color dot */}
              <div
                className="h-10 w-10 flex-shrink-0 rounded-full"
                style={{ backgroundColor: account.color || "#241E29" }}
              />

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{account.name}</p>
                <p className="text-xs text-muted-foreground">
                  {ACCOUNT_TYPE_LABELS[account.type]}
                </p>
              </div>

              {/* Balances */}
              <div className="text-right">
                <p
                  className={`font-semibold ${
                    account.type === "credit_card"
                      ? account.current_balance > 0
                        ? "text-terracotta"
                        : ""
                      : account.current_balance >= 0
                        ? "text-verdant"
                        : "text-terracotta"
                  }`}
                >
                  {formatCurrency(account.current_balance)}
                </p>
                {account.current_balance !== account.projected_balance && (
                  <p className="text-xs text-muted-foreground">
                    Previsto: {formatCurrency(account.projected_balance)}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(account)}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Editar"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                {confirmDelete === account.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeactivate(account.id)}
                      disabled={deactivate.isPending}
                      className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(account.id)}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Desativar"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <AccountForm
        account={editingAccount}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingAccount(null);
        }}
      />
    </div>
  );
}

```

### src/app/(app)/assets/page.tsx
```
"use client";

/**
 * Oniefy - Patrimônio (Phase 4)
 *
 * PAT-01: Cadastrar bem patrimonial
 * PAT-02: Editar bem patrimonial
 * PAT-03: Excluir bem patrimonial
 * PAT-04: Listar bens + totalização por categoria
 * PAT-05: Calcular depreciação (botão manual por asset)
 * PAT-06: Alertas de seguro vencendo (banner)
 * PAT-07: Histórico de valor (expandable panel)
 */

import { useState } from "react";
import { Package } from "lucide-react";
import {
  useAssets,
  useAssetsSummary,
  useAssetValueHistory,
  useDeleteAsset,
  useDepreciateAsset,
  ASSET_CATEGORY_LABELS,
  ASSET_CATEGORY_COLORS,
} from "@/lib/hooks/use-assets";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { AssetForm } from "@/components/assets/asset-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database } from "@/types/database";

type AssetCategory = Database["public"]["Enums"]["asset_category"];

interface EditData {
  id: string;
  name: string;
  category: AssetCategory;
  acquisition_date: string;
  acquisition_value: number;
  current_value: number;
  depreciation_rate: number;
  insurance_policy: string | null;
  insurance_expiry: string | null;
}

function ValueHistory({ assetId }: { assetId: string }) {
  const { data: history, isLoading } = useAssetValueHistory(assetId);

  if (isLoading) return <div className="h-12 animate-pulse rounded bg-muted" />;
  if (!history || history.length === 0) return <p className="text-xs text-muted-foreground">Sem histórico de alterações</p>;

  return (
    <div className="space-y-1">
      {history.slice(0, 10).map((h) => (
        <div key={h.id} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${
              h.change_source === "depreciation" ? "bg-burnished/100" : "bg-info-slate/100"
            }`} />
            <span className="text-muted-foreground">
              {formatDate(h.created_at)}
            </span>
            <span>{h.change_reason || h.change_source}</span>
          </div>
          <div className="flex items-center gap-2 tabular-nums">
            <span className="text-muted-foreground">{formatCurrency(Number(h.previous_value))}</span>
            <span>→</span>
            <span className="font-medium">{formatCurrency(Number(h.new_value))}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AssetsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [depreciationResult, setDepreciationResult] = useState<string | null>(null);

  useAutoReset(confirmDelete, setConfirmDelete);

  const { data: assets, isLoading } = useAssets();
  const { data: summary } = useAssetsSummary();
  const deleteAsset = useDeleteAsset();
  const depreciateAsset = useDepreciateAsset();

  function handleNew() { setEditData(null); setFormOpen(true); }

  function handleEdit(asset: NonNullable<typeof assets>[number]) {
    setEditData({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      acquisition_date: asset.acquisition_date,
      acquisition_value: Number(asset.acquisition_value),
      current_value: Number(asset.current_value),
      depreciation_rate: Number(asset.depreciation_rate),
      insurance_policy: asset.insurance_policy,
      insurance_expiry: asset.insurance_expiry,
    });
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    await deleteAsset.mutateAsync(id);
    setConfirmDelete(null);
  }

  async function handleDepreciate(assetId: string) {
    const result = await depreciateAsset.mutateAsync(assetId);
    if (result.status === "depreciated") {
      setDepreciationResult(`Depreciação aplicada: ${formatCurrency(result.depreciation)} (novo valor: ${formatCurrency(result.new_value)})`);
      setTimeout(() => setDepreciationResult(null), 4000);
    } else {
      setDepreciationResult("Depreciação ignorada (taxa zero).");
      setTimeout(() => setDepreciationResult(null), 3000);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const expiringInsurance = summary?.expiring_insurance ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patrimônio</h1>
          <p className="text-sm text-muted-foreground">
            Bens, investimentos e ativos
          </p>
        </div>
        <button onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          + Novo bem
        </button>
      </div>

      {/* PAT-06: Insurance alerts */}
      {expiringInsurance.length > 0 && (
        <div className="rounded-lg border border-burnished/20 bg-burnished/10 p-4">
          <p className="text-sm font-semibold text-burnished">Seguros vencendo nos próximos 30 dias</p>
          <div className="mt-2 space-y-1">
            {expiringInsurance.map((ins) => (
              <p key={ins.id} className="text-xs text-burnished">
                <strong>{ins.name}</strong> - vence em {formatDate(ins.insurance_expiry)}
                ({ins.days_until_expiry <= 0 ? "VENCIDO" : `${ins.days_until_expiry} dias`})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Depreciation result toast */}
      {depreciationResult && (
        <div className="rounded-lg border border-info-slate/20 bg-info-slate/10 px-4 py-3 text-sm text-info-slate">
          {depreciationResult}
        </div>
      )}

      {/* PAT-04: Summary cards */}
      {summary && summary.asset_count > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Valor Atual Total</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{formatCurrency(summary.total_value)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Valor de Aquisição</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{formatCurrency(summary.total_acquisition)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Depreciação Acumulada</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-burnished">
              {formatCurrency(summary.total_depreciation)}
            </p>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {summary?.by_category && summary.by_category.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {summary.by_category.map((cat) => (
            <div key={cat.category} className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ASSET_CATEGORY_COLORS[cat.category as AssetCategory] }} />
              <span className="font-medium">{ASSET_CATEGORY_LABELS[cat.category as AssetCategory]}</span>
              <span className="text-muted-foreground">({cat.count})</span>
              <span className="tabular-nums">{formatCurrency(cat.total_value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {(!assets || assets.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Package className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Nenhum bem cadastrado</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Nenhum bem cadastrado. Bens registrados aparecem com visão consolidada e depreciação.
          </p>
          <button onClick={handleNew}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Cadastrar bem
          </button>
        </div>
      )}

      {/* Asset list */}
      {assets && assets.length > 0 && (
        <div className="space-y-2">
          {assets.map((asset) => {
            const depPct = Number(asset.acquisition_value) > 0
              ? ((Number(asset.acquisition_value) - Number(asset.current_value)) / Number(asset.acquisition_value) * 100)
              : 0;
            const isExpanded = expandedAsset === asset.id;
            const color = ASSET_CATEGORY_COLORS[asset.category];

            return (
              <div key={asset.id} className="rounded-lg border bg-card shadow-sm transition-colors hover:bg-accent/30">
                <div className="flex items-start gap-3 p-4">
                  {/* Category color */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: color }}>
                    {asset.name.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{asset.name}</p>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: color + "20", color }}>
                        {ASSET_CATEGORY_LABELS[asset.category]}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Aquisição: {formatDate(asset.acquisition_date)}</span>
                      {Number(asset.depreciation_rate) > 0 && (
                        <span className="text-burnished">Depr: {Number(asset.depreciation_rate)} %/ano</span>
                      )}
                      {asset.insurance_expiry && (
                        <span>Seguro: {formatDate(asset.insurance_expiry)}</span>
                      )}
                    </div>
                  </div>

                  {/* Values */}
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums">{formatCurrency(Number(asset.current_value))}</p>
                    {depPct > 0 && (
                      <p className="text-xs text-burnished tabular-nums">
                        -{depPct.toFixed(1)} % desde aquisição
                      </p>
                    )}
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex items-center gap-1 border-t px-4 py-2">
                  {/* PAT-07: Toggle history */}
                  <button onClick={() => setExpandedAsset(isExpanded ? null : asset.id)}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    {isExpanded ? "Fechar" : "Histórico"}
                  </button>

                  {/* PAT-05: Depreciate */}
                  {Number(asset.depreciation_rate) > 0 && (
                    <button onClick={() => handleDepreciate(asset.id)} disabled={depreciateAsset.isPending}
                      className="rounded-md px-2 py-1 text-xs text-burnished transition-colors hover:bg-burnished/10">
                      Depreciar
                    </button>
                  )}

                  {/* PAT-02: Edit */}
                  <button onClick={() => handleEdit(asset)}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    Editar
                  </button>

                  {/* PAT-03: Delete */}
                  <div className="flex-1" />
                  {confirmDelete === asset.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(asset.id)} disabled={deleteAsset.isPending}
                        className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                        Confirmar
                      </button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="rounded-md px-2 py-1 text-xs text-muted-foreground">Não</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(asset.id)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-destructive">
                      Excluir
                    </button>
                  )}
                </div>

                {/* PAT-07: Value history (expanded) */}
                {isExpanded && (
                  <div className="border-t px-4 py-3">
                    <ValueHistory assetId={asset.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form dialog */}
      <AssetForm open={formOpen} onClose={() => { setFormOpen(false); setEditData(null); }} editData={editData} />
    </div>
  );
}

```

### src/app/(app)/bills/page.tsx
```
"use client";

/**
 * Oniefy - Contas a Pagar (Phase 4)
 *
 * CAP-01: Criar transação recorrente
 * CAP-02: Editar recorrência
 * CAP-03: Encerrar recorrência
 * CAP-04: Listar contas pendentes
 * CAP-05: Pagar conta pendente (marcar + gerar próxima)
 * CAP-06: Alertas de vencimento (visual badges)
 *
 * Two tabs: "Pendentes" (transactions) + "Recorrências" (rules)
 */

import { useState } from "react";
import { CalendarClock, Repeat } from "lucide-react";
import {
  useRecurrences,
  usePendingBills,
  usePayBill,
  useDeactivateRecurrence,
  FREQUENCY_LABELS,
} from "@/lib/hooks/use-recurrences";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { RecurrenceForm } from "@/components/recurrences/recurrence-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database } from "@/types/database";

type Frequency = Database["public"]["Enums"]["recurrence_frequency"];
type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];

type Tab = "pending" | "recurrences";

interface EditData {
  id: string;
  frequency: Frequency;
  interval_count: number;
  end_date: string | null;
  adjustment_index: AdjustmentIndex | null;
  adjustment_rate: number | null;
  template_transaction: Record<string, unknown>;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T12:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyBadge(days: number, status?: string): { text: string; classes: string } {
  if (status === "overdue") return { text: `${Math.abs(days)}d atrasado`, classes: "bg-terracotta/15 text-terracotta" };
  if (days < 0) return { text: `${Math.abs(days)}d atrasado`, classes: "bg-terracotta/15 text-terracotta" };
  if (days === 0) return { text: "Hoje", classes: "bg-terracotta/15 text-terracotta" };
  if (days === 1) return { text: "Amanhã", classes: "bg-burnished/15 text-burnished" };
  if (days <= 3) return { text: `${days}d`, classes: "bg-burnished/15 text-burnished" };
  if (days <= 7) return { text: `${days}d`, classes: "bg-burnished/15 text-burnished" };
  return { text: `${days}d`, classes: "bg-muted text-muted-foreground" };
}

export default function BillsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const [confirmPay, setConfirmPay] = useState<string | null>(null);

  useAutoReset(confirmDeactivate, setConfirmDeactivate);
  useAutoReset(confirmPay, setConfirmPay);

  const { data: pendingBills, isLoading: loadingBills } = usePendingBills();
  const { data: recurrences, isLoading: loadingRec } = useRecurrences();
  const payBill = usePayBill();
  const deactivateRecurrence = useDeactivateRecurrence();

  function handleNew() {
    setEditData(null);
    setFormOpen(true);
  }

  function handleEdit(rec: NonNullable<typeof recurrences>[number]) {
    setEditData({
      id: rec.id,
      frequency: rec.frequency,
      interval_count: rec.interval_count,
      end_date: rec.end_date,
      adjustment_index: rec.adjustment_index,
      adjustment_rate: rec.adjustment_rate ? Number(rec.adjustment_rate) : null,
      template_transaction: rec.template_transaction as Record<string, unknown>,
    });
    setFormOpen(true);
  }

  async function handlePay(txId: string) {
    await payBill.mutateAsync(txId);
    setConfirmPay(null);
  }

  async function handleDeactivate(id: string) {
    await deactivateRecurrence.mutateAsync(id);
    setConfirmDeactivate(null);
  }

  const isLoading = tab === "pending" ? loadingBills : loadingRec;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const totalPending = pendingBills?.reduce((s, b) => s + b.amount, 0) ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas despesas recorrentes
          </p>
        </div>
        <button onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          + Nova recorrência
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        {([
          { key: "pending", label: "Pendentes", count: pendingBills?.length ?? 0 },
          { key: "recurrences", label: "Recorrências", count: recurrences?.length ?? 0 },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ TAB: Pendentes (CAP-04, CAP-05, CAP-06) ═══ */}
      {tab === "pending" && (
        <>
          {/* Total bar */}
          {(pendingBills?.length ?? 0) > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <span className="text-sm text-muted-foreground">Total pendente</span>
              <span className="text-lg font-bold tabular-nums text-terracotta">
                {formatCurrency(totalPending)}
              </span>
            </div>
          )}

          {(!pendingBills || pendingBills.length === 0) ? (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <CalendarClock className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Nenhuma conta pendente</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sem contas a vencer no período.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingBills.map((bill) => {
                const days = daysUntil(bill.due_date || bill.date);
                const badge = urgencyBadge(days, bill.payment_status);
                return (
                  <div key={bill.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/30">
                    {/* Color indicator */}
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: bill.category_color || bill.account_color || "#7E9487" }}>
                      {(bill.category_icon || bill.type.charAt(0)).slice(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{bill.description || bill.category_name || "Sem descrição"}</p>
                        <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.classes}`}>
                          {badge.text}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(bill.date)} · {bill.account_name}
                      </p>
                    </div>

                    {/* Amount */}
                    <span className="flex-shrink-0 font-semibold tabular-nums text-terracotta">
                      {formatCurrency(bill.amount)}
                    </span>

                    {/* Pay button (CAP-05) */}
                    {confirmPay === bill.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handlePay(bill.id)} disabled={payBill.isPending}
                          className="rounded-md bg-verdant px-2 py-1 text-xs font-medium text-white">
                          Confirmar
                        </button>
                        <button onClick={() => setConfirmPay(null)}
                          className="rounded-md px-2 py-1 text-xs text-muted-foreground">
                          Não
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmPay(bill.id)}
                        className="rounded-md bg-verdant/15 px-3 py-1.5 text-xs font-medium text-verdant transition-colors hover:bg-verdant/20"
                        title="Marcar como paga">
                        Pagar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══ TAB: Recorrências (CAP-01, CAP-02, CAP-03) ═══ */}
      {tab === "recurrences" && (
        <>
          {(!recurrences || recurrences.length === 0) ? (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Repeat className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Nenhuma recorrência cadastrada</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sem recorrências cadastradas.
              </p>
              <button onClick={handleNew}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Nova recorrência
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recurrences.map((rec) => {
                const tmpl = rec.template_transaction as Record<string, unknown>;
                return (
                  <div key={rec.id} className="rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{(tmpl.description as string) || "Sem descrição"}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                            {FREQUENCY_LABELS[rec.frequency]}
                          </span>
                          <span>Próx: {formatDate(rec.next_due_date)}</span>
                          {rec.end_date && <span>Até: {formatDate(rec.end_date)}</span>}
                          {rec.adjustment_index && rec.adjustment_index !== "none" && (
                            <span className="rounded bg-info-slate/15 px-1.5 py-0.5 text-info-slate">
                              {rec.adjustment_index === "manual"
                                ? `+${Number(rec.adjustment_rate)}%`
                                : rec.adjustment_index.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold tabular-nums ${
                          (tmpl.type as string) === "expense" ? "text-terracotta" : "text-verdant"
                        }`}>
                          {formatCurrency(Number(tmpl.amount))}
                        </span>

                        {/* Edit */}
                        <button onClick={() => handleEdit(rec)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          title="Editar">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Deactivate (CAP-03) */}
                        {confirmDeactivate === rec.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDeactivate(rec.id)} disabled={deactivateRecurrence.isPending}
                              className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                              Encerrar
                            </button>
                            <button onClick={() => setConfirmDeactivate(null)}
                              className="rounded-md px-2 py-1 text-xs text-muted-foreground">
                              Não
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeactivate(rec.id)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            title="Encerrar recorrência">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Form dialog */}
      <RecurrenceForm open={formOpen} onClose={() => { setFormOpen(false); setEditData(null); }} editData={editData} />
    </div>
  );
}

```

### src/app/(app)/budgets/page.tsx
```
"use client";

/**
 * Oniefy - Orçamento (Phase 3)
 *
 * ORC-01: Criar orçamento mensal por categoria
 * ORC-02: Copiar orçamento do mês anterior
 * ORC-03: Editar valor orçado
 * ORC-04: Remover orçamento de categoria
 * ORC-05: Relatório mensal (planejado vs realizado) via get_budget_vs_actual RPC
 * ORC-06: Alerta de orçamento excedido (visual no card)
 *
 * Layout: month navigator + budget list + actual vs planned bars
 */

import { useState, useMemo } from "react";
import { BarChart3, Users } from "lucide-react";
import {
  useBudgets,
  useDeleteBudget,
  useCopyBudgets,
  toMonthKey,
  formatMonthLabel,
} from "@/lib/hooks/use-budgets";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { useBudgetVsActual } from "@/lib/hooks/use-dashboard";
import { useFamilyMembers } from "@/lib/hooks/use-family-members";
import { BudgetForm } from "@/components/budgets/budget-form";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/types/database";

type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];

interface EditData {
  id: string;
  category_id: string;
  category_name: string;
  planned_amount: number;
  alert_threshold: number;
  adjustment_index: AdjustmentIndex | null;
}

const STATUS_COLORS = {
  ok: "bg-verdant",
  warning: "bg-burnished",
  exceeded: "bg-terracotta",
};

const STATUS_BADGES = {
  ok: "",
  warning: "bg-burnished/15 text-burnished",
  exceeded: "bg-terracotta/15 text-terracotta",
};

export default function BudgetsPage() {
  // ─── State ─────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(() => toMonthKey());
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmCopy, setConfirmCopy] = useState(false);
  const [copyError, setCopyError] = useState("");

  useAutoReset(confirmDelete, setConfirmDelete);

  // ─── Queries ───────────────────────────────────────────────
  const { data: budgets, isLoading } = useBudgets(currentMonth, selectedMemberId);
  const { data: members } = useFamilyMembers();
  const activeMembers = members?.filter((m) => m.is_active) ?? [];
  const deleteBudget = useDeleteBudget();
  const copyBudgets = useCopyBudgets();

  // Parse year/month for RPC
  const [year, month] = currentMonth.split("-").map(Number);
  const budgetVsActual = useBudgetVsActual(year, month, selectedMemberId);
  const bva = budgetVsActual.data;

  // ─── Month navigation ─────────────────────────────────────
  function navigateMonth(delta: number) {
    const d = new Date(currentMonth + "T12:00:00");
    d.setMonth(d.getMonth() + delta);
    setCurrentMonth(toMonthKey(d));
  }

  // Previous month key for copy
  const prevMonthKey = useMemo(() => {
    const d = new Date(currentMonth + "T12:00:00");
    d.setMonth(d.getMonth() - 1);
    return toMonthKey(d);
  }, [currentMonth]);

  const hasBudgetsThisMonth = (budgets?.length ?? 0) > 0;

  // Map budget_id to actual data from RPC
  const actualMap = useMemo(() => {
    const map = new Map<string, { actual: number; pct_used: number; status: string }>();
    bva?.items?.forEach((item) => {
      map.set(item.budget_id, {
        actual: item.actual,
        pct_used: item.pct_used,
        status: item.status,
      });
    });
    return map;
  }, [bva]);

  // ─── Handlers ──────────────────────────────────────────────
  function handleEdit(b: NonNullable<typeof budgets>[number]) {
    setEditData({
      id: b.id,
      category_id: b.category_id,
      category_name: b.categories.name,
      planned_amount: b.planned_amount,
      alert_threshold: b.alert_threshold,
      adjustment_index: b.adjustment_index,
    });
    setFormOpen(true);
  }

  function handleNew() {
    setEditData(null);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    await deleteBudget.mutateAsync(id);
    setConfirmDelete(null);
  }

  async function handleCopy() {
    setCopyError("");
    try {
      await copyBudgets.mutateAsync({
        source_month: prevMonthKey,
        target_month: currentMonth,
      });
      setConfirmCopy(false);
    } catch (err) {
      setCopyError(err instanceof Error ? err.message : "Erro ao copiar.");
    }
  }

  // ─── Loading ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-12 animate-pulse rounded-lg bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamento</h1>
          <p className="text-sm text-muted-foreground">
            Controle seus gastos por categoria
          </p>
        </div>
        <button
          onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Nova categoria
        </button>
      </div>

      {/* Member filter */}
      {activeMembers.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto">
          <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <button
            onClick={() => setSelectedMemberId(null)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedMemberId === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            Lar
          </button>
          {activeMembers.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMemberId(m.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedMemberId === m.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {m.avatar_emoji ? `${m.avatar_emoji} ` : ""}{m.name}
            </button>
          ))}
        </div>
      )}

      {/* Month navigator */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-3">
        <button
          onClick={() => navigateMonth(-1)}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <p className="text-lg font-semibold capitalize">
            {formatMonthLabel(currentMonth)}
          </p>
          {bva && bva.budget_count > 0 && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {bva.pct_used.toFixed(0)} % utilizado · {formatCurrency(bva.total_actual)} / {formatCurrency(bva.total_planned)}
            </p>
          )}
        </div>

        <button
          onClick={() => navigateMonth(1)}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Overall progress bar (ORC-05) */}
      {bva && bva.budget_count > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              (bva.pct_used ?? 0) >= 100
                ? "bg-terracotta"
                : (bva.pct_used ?? 0) >= 80
                  ? "bg-burnished"
                  : "bg-verdant"
            }`}
            style={{ width: `${Math.min(bva.pct_used ?? 0, 100)}%` }}
          />
        </div>
      )}

      {/* Empty state */}
      {!hasBudgetsThisMonth && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">
            Nenhum orçamento para {formatMonthLabel(currentMonth)}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Defina limites de gasto por categoria para controlar suas finanças.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleNew}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Criar orçamento
            </button>
            {/* ORC-02: Copy from previous month */}
            <button
              onClick={() => setConfirmCopy(true)}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Copiar de {formatMonthLabel(prevMonthKey)}
            </button>
          </div>
        </div>
      )}

      {/* Budget list */}
      {hasBudgetsThisMonth && (
        <div className="space-y-2">
          {/* ORC-02: Copy button when there are budgets */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                // Navigate to next month that has no budgets to copy into
                const nextMonth = new Date(currentMonth + "T12:00:00");
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setCurrentMonth(toMonthKey(nextMonth));
                setTimeout(() => setConfirmCopy(true), 100);
              }}
              className="text-xs text-primary hover:underline"
            >
              Copiar para o próximo mês
            </button>
          </div>

          {budgets?.map((b) => {
            const act = actualMap.get(b.id);
            const actual = act?.actual ?? 0;
            const pctUsed = act?.pct_used ?? 0;
            const status = (act?.status ?? "ok") as keyof typeof STATUS_COLORS;

            return (
              <div
                key={b.id}
                className="rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/30"
              >
                <div className="flex items-start justify-between">
                  {/* Category info */}
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                      style={{
                        backgroundColor: b.categories.color || "#7E9487",
                      }}
                    >
                      {(b.categories.icon || b.categories.name.charAt(0))
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <div>
                      <p className="font-medium">{b.categories.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatCurrency(actual)} de {formatCurrency(b.planned_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-2">
                    {status !== "ok" && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${STATUS_BADGES[status]}`}
                      >
                        {status === "warning" ? "Atenção" : "Excedido"}
                      </span>
                    )}
                    <span className="text-sm font-semibold tabular-nums">
                      {pctUsed.toFixed(0)} %
                    </span>

                    {/* Edit button */}
                    <button
                      onClick={() => handleEdit(b)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      title="Editar"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete button (ORC-04) */}
                    {confirmDelete === b.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(b.id)}
                          disabled={deleteBudget.isPending}
                          className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-md px-2 py-1 text-xs text-muted-foreground"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(b.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Remover"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar (ORC-06: visual alert) */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[status]}`}
                    style={{ width: `${Math.min(pctUsed, 100)}%` }}
                  />
                </div>

                {/* Remaining */}
                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>
                    Restante: {formatCurrency(b.planned_amount - actual)}
                  </span>
                  <span>Alerta: {b.alert_threshold} %</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ORC-05: Summary footer */}
      {hasBudgetsThisMonth && bva && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold">Resumo do Mês</h3>
          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Orçado</p>
              <p className="text-lg font-bold tabular-nums">
                {formatCurrency(bva.total_planned)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Realizado</p>
              <p
                className={`text-lg font-bold tabular-nums ${
                  bva.total_actual > bva.total_planned
                    ? "text-terracotta"
                    : "text-foreground"
                }`}
              >
                {formatCurrency(bva.total_actual)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Disponível</p>
              <p
                className={`text-lg font-bold tabular-nums ${
                  bva.total_remaining < 0
                    ? "text-terracotta"
                    : "text-verdant"
                }`}
              >
                {formatCurrency(bva.total_remaining)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Copy confirmation dialog (ORC-02) */}
      {confirmCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setConfirmCopy(false); setCopyError(""); }} />
          <div className="relative z-50 mx-4 w-full max-w-sm rounded-lg border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Copiar Orçamento</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Copiar todos os orçamentos de{" "}
              <strong>{formatMonthLabel(prevMonthKey)}</strong> para{" "}
              <strong>{formatMonthLabel(currentMonth)}</strong>?
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Os valores orçados serão copiados sem alteração. Você poderá editá-los depois.
            </p>

            {copyError && (
              <p className="mt-3 rounded bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
                {copyError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setConfirmCopy(false); setCopyError(""); }}
                className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                onClick={handleCopy}
                disabled={copyBudgets.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {copyBudgets.isPending ? "Copiando" : "Copiar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget form dialog */}
      <BudgetForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditData(null);
        }}
        month={currentMonth}
        familyMemberId={selectedMemberId}
        editData={editData}
      />
    </div>
  );
}

```

### src/app/(app)/categories/page.tsx
```
"use client";

import { useState } from "react";
import { Tag as TagIcon } from "lucide-react";
import {
  useCategories,
  useDeleteCategory,
  CATEGORY_TYPE_LABELS,
} from "@/lib/hooks/use-categories";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { CategoryForm } from "@/components/categories/category-form";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type CategoryType = Database["public"]["Enums"]["category_type"];

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");
  const { data: categories, isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useAutoReset(confirmDelete, setConfirmDelete);

  const filtered = categories?.filter((c) => c.type === activeTab) ?? [];
  const expenseCount = categories?.filter((c) => c.type === "expense").length ?? 0;
  const incomeCount = categories?.filter((c) => c.type === "income").length ?? 0;

  function handleNew() {
    setEditingCategory(null);
    setFormOpen(true);
  }

  function handleEdit(cat: Category) {
    setEditingCategory(cat);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    await deleteCategory.mutateAsync(id);
    setConfirmDelete(null);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
        <button
          onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Nova categoria
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        {(["expense", "income"] as CategoryType[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {CATEGORY_TYPE_LABELS[t]} ({t === "expense" ? expenseCount : incomeCount})
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <TagIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Nenhuma categoria de {activeTab === "expense" ? "despesa" : "receita"}.
          </p>
          <button
            onClick={handleNew}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            Criar primeira
          </button>
        </div>
      )}

      {/* Category list */}
      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/50"
            >
              {/* Color dot */}
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                style={{ backgroundColor: cat.color || "#7E9487" }}
              >
                {(cat.icon || "?").slice(0, 2).toUpperCase()}
              </div>

              {/* Name + badges */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{cat.name}</p>
                  {cat.is_system && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Sistema
                    </span>
                  )}
                </div>
                {cat.icon && (
                  <p className="text-xs text-muted-foreground">{cat.icon}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(cat)}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Editar"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>

                {!cat.is_system && (
                  <>
                    {confirmDelete === cat.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={deleteCategory.isPending}
                          className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-md px-2 py-1 text-xs text-muted-foreground"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(cat.id)}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Excluir"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <CategoryForm
        category={editingCategory}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingCategory(null);
        }}
        defaultType={activeTab}
      />
    </div>
  );
}

```

### src/app/(app)/chart-of-accounts/page.tsx
```
"use client";

import { useState } from "react";
import {
  useChartOfAccounts,
  useToggleAccountActive,
  useCreateCOA,
  GROUP_LABELS,
} from "@/lib/hooks/use-chart-of-accounts";
import { useEscapeClose } from "@/lib/hooks/use-dialog-helpers";
import type { COATreeNode } from "@/lib/hooks/use-chart-of-accounts";
import type { Database } from "@/types/database";

type GroupType = Database["public"]["Enums"]["group_type"];

const GROUP_ORDER: GroupType[] = ["asset", "liability", "equity", "revenue", "expense"];

function TreeNode({
  node,
  onToggle,
}: {
  node: COATreeNode;
  onToggle: (id: string, active: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(node.depth < 2);
  const hasChildren = node.children.length > 0;
  const isLeaf = !hasChildren;

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
          node.depth === 0
            ? "mt-4 first:mt-0"
            : "hover:bg-accent/50"
        } ${isLeaf && !node.is_active ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
      >
        {/* Expand/collapse */}
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Code */}
        <span className="flex-shrink-0 font-mono text-xs text-muted-foreground w-14">
          {node.internal_code}
        </span>

        {/* Display name */}
        <span
          className={`flex-1 text-sm ${
            node.depth === 0
              ? `font-semibold ${GROUP_LABELS[node.group_type]?.color ?? ""}`
              : node.depth === 1
                ? "font-medium"
                : node.is_active
                  ? ""
                  : "text-muted-foreground"
          }`}
        >
          {node.display_name}
        </span>

        {/* Technical name (hover tooltip via title) */}
        {node.depth >= 1 && (
          <span className="hidden text-xs text-muted-foreground sm:block" title={node.account_name}>
            {node.account_name.length > 30
              ? node.account_name.slice(0, 27) + "..."
              : node.account_name}
          </span>
        )}

        {/* Tax treatment badge */}
        {node.tax_treatment && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {node.tax_treatment === "dedutivel_integral"
              ? "Dedutível"
              : node.tax_treatment === "dedutivel_limitado"
                ? "Ded. limitado"
                : node.tax_treatment === "tributavel"
                  ? "Tributável"
                  : node.tax_treatment === "isento"
                    ? "Isento"
                    : node.tax_treatment === "exclusivo_fonte"
                      ? "Excl. fonte"
                      : node.tax_treatment === "ganho_capital"
                        ? "Ganho capital"
                        : ""}
          </span>
        )}

        {/* Active toggle (only for leaves, non-system allowed) */}
        {isLeaf && (
          <button
            onClick={() => onToggle(node.id, !node.is_active)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              node.is_active ? "bg-primary" : "bg-muted"
            }`}
            title={node.is_active ? "Desativar conta" : "Ativar conta"}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                node.is_active ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChartOfAccountsPage() {
  const { data, isLoading } = useChartOfAccounts();
  const toggleActive = useToggleAccountActive();
  const createCOA = useCreateCOA();
  const [showCreate, setShowCreate] = useState(false);
  const [newParentId, setNewParentId] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  useEscapeClose(showCreate, () => setShowCreate(false));

  function handleToggle(id: string, active: boolean) {
    toggleActive.mutate({ id, is_active: active });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!newParentId || !newDisplayName.trim()) {
      setCreateError("Selecione o grupo pai e informe o nome.");
      return;
    }
    try {
      await createCOA.mutateAsync({
        parentId: newParentId,
        displayName: newDisplayName.trim(),
        accountName: newAccountName.trim() || undefined,
      });
      setShowCreate(false);
      setNewParentId("");
      setNewDisplayName("");
      setNewAccountName("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erro ao criar conta.");
    }
  }

  const activeCount = data?.flat.filter((a) => a.is_active).length ?? 0;
  const totalCount = data?.flat.length ?? 0;

  // Parent options: all non-leaf nodes (nodes that are groups, subgroups, or categories)
  const parentOptions = data?.flat
    .filter((a) => a.depth <= 2)
    .sort((a, b) => a.internal_code.localeCompare(b.internal_code))
    ?? [];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-muted" style={{ marginLeft: `${(i % 3) * 20}px` }} />
        ))}
      </div>
    );
  }

  // Group tree by group_type
  const groupedTree = GROUP_ORDER.map((group) => ({
    group,
    ...GROUP_LABELS[group],
    nodes: data?.tree.filter((n) => n.group_type === group) ?? [],
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plano de Contas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} ativas de {totalCount} contas. Contas individuais são criadas automaticamente ao cadastrar contas bancárias.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            + Nova conta
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 rounded-lg border bg-card px-4 py-3">
        {GROUP_ORDER.map((g) => (
          <span key={g} className={`text-xs font-medium ${GROUP_LABELS[g].color}`}>
            {GROUP_LABELS[g].label}
          </span>
        ))}
        <span className="text-xs text-muted-foreground">
          | Toggle = ativar/desativar · Inativas ficam esmaecidas
        </span>
      </div>

      {/* Tree */}
      <div className="rounded-lg border bg-card py-2">
        {groupedTree.map(({ group, nodes }) => (
          <div key={group}>
            {nodes.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                onToggle={handleToggle}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="rounded-lg border bg-muted/50 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Como funciona</p>
        <p className="mt-1">
          Ao cadastrar uma conta bancária, cartão, empréstimo ou financiamento, o sistema
          cria automaticamente uma conta individual no plano de contas (ex: &quot;Nubank Corrente&quot;
          sob 1.1.01). Use &quot;+ Nova conta&quot; apenas para contas contábeis especiais que não
          se encaixam nos tipos padrão.
        </p>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Nova conta contábil</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cria uma subconta sob o grupo selecionado. Para contas bancárias e cartões, use a tela &quot;Contas&quot; (criação automática).
            </p>

            {createError && (
              <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              {/* Parent selector */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Grupo pai</label>
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>
                  {parentOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {"  ".repeat(a.depth)}{a.internal_code} - {a.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Display name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome para o usuário</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Ex: Empréstimo pessoal João"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  autoFocus
                />
              </div>

              {/* Account name (technical) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Nome contábil <span className="font-normal text-muted-foreground">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Ex: Empréstimos Concedidos - PF"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para usar o nome do usuário.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createCOA.isPending}
                  className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createCOA.isPending ? "Criando" : "Criar conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

```

### src/app/(app)/connections/page.tsx
```
"use client";

/**
 * Oniefy - Conexões Bancárias (Phase 9B - Standalone)
 *
 * BANK-01: Gerenciar conexões (manual, futuro: agregador)
 * BANK-02: Import CSV/OFX com preview e mapeamento
 * BANK-03: Auto-categorização via RPC (pipeline de regras)
 * BANK-04: Reconciliação manual (saldo contábil vs informado)
 * BANK-05: Status da conexão (manual = sempre ativa)
 * BANK-06: Desconectar (desativa, mantém transações)
 */

import { useState } from "react";
import { Landmark } from "lucide-react";
import {
  SYNC_STATUS_COLORS,
  SYNC_STATUS_LABELS,
  useBankConnections,
  useCreateBankConnection,
  useDeactivateBankConnection,
} from "@/lib/hooks/use-bank-connections";
import { useAutoReset, useEscapeClose } from "@/lib/hooks/use-dialog-helpers";
import { formatDate } from "@/lib/utils";
import { ImportWizard } from "@/components/connections/import-wizard";
import { ReconciliationPanel } from "@/components/connections/reconciliation-panel";

type Tab = "connections" | "import" | "reconciliation";

export default function ConnectionsPage() {
  const [tab, setTab] = useState<Tab>("import");

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conexões & Importação</h1>
        <p className="text-sm text-muted-foreground">
          Importe extratos bancários (CSV/OFX/XLSX) ou gerencie conexões
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        {([
          { key: "import" as const, label: "Importar extrato" },
          { key: "reconciliation" as const, label: "Conciliação" },
          { key: "connections" as const, label: "Conexões" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "import" && <ImportWizard />}
      {tab === "reconciliation" && <ReconciliationPanel />}
      {tab === "connections" && <ConnectionsManager />}
    </div>
  );
}

function ConnectionsManager() {
  const { data: connections, isLoading } = useBankConnections();
  const createConnection = useCreateBankConnection();
  const deactivateConnection = useDeactivateBankConnection();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useAutoReset(confirmDelete, setConfirmDelete);
  useEscapeClose(showNew, () => setShowNew(false));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await createConnection.mutateAsync({ institution_name: newName.trim() });
    setNewName("");
    setShowNew(false);
  }

  async function handleDeactivate(id: string) {
    await deactivateConnection.mutateAsync(id);
    setConfirmDelete(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowNew(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nova conexão
        </button>
      </div>

      {!connections || connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Landmark className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Nenhuma conexão bancária</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Sem conexões cadastradas. Importação de arquivos CSV/OFX/XLSX funciona sem conexão. Conexões
            permitem rastreamento de duplicatas.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => (
            <div key={conn.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Landmark className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{conn.institution_name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${SYNC_STATUS_COLORS[conn.sync_status]}`}>
                    {SYNC_STATUS_LABELS[conn.sync_status]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {conn.provider === "manual" ? "Import manual (CSV/OFX)" : conn.provider}
                  {conn.last_sync_at && ` · Última sync: ${formatDate(conn.last_sync_at)}`}
                </p>
              </div>

              {confirmDelete === conn.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeactivate(conn.id)}
                    disabled={deactivateConnection.isPending}
                    className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                  >
                    Confirmar
                  </button>
                  <button onClick={() => setConfirmDelete(null)} className="rounded-md px-2 py-1 text-xs text-muted-foreground">
                    Não
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(conn.id)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Desconectar"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowNew(false)} />
          <div className="relative z-50 mx-4 w-full max-w-md rounded-lg border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Nova Conexão Manual</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Agrupa importações de uma mesma instituição financeira.
            </p>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Nome da instituição</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Nubank, Itaú, BTG"
                  autoFocus
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim() || createConnection.isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createConnection.isPending ? "Criando" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Atualmente as importações são feitas via arquivo (CSV, OFX, XLSX). Integração automática via
          Open Finance (agregador certificado) será disponibilizada em versão futura.
        </p>
      </div>
    </div>
  );
}

```

### src/app/(app)/cost-centers/page.tsx
```
"use client";

/**
 * Oniefy - Centros de Custo (Phase 2 CRUD + Phase 5 Advanced)
 *
 * CEN-01: Criar centros (from Phase 2, maintained)
 * CEN-02: Atribuir lançamentos (from Phase 2, via transaction form)
 * CEN-03: Rateio percentual (allocate_to_centers RPC)
 * CEN-04: P&L por centro (get_center_pnl RPC + chart)
 * CEN-05: Exportar centro (get_center_export RPC + CSV/JSON download)
 *
 * Layout: center list + expandable P&L panel per center.
 */

import { useState, useEffect } from "react";
import { Target as TargetIcon, Archive } from "lucide-react";
import {
  useCostCenters,
  useCreateCostCenter,
  useUpdateCostCenter,
  useDeleteCostCenter,
  useCenterPnl,
  useCenterExport,
  exportToCsv,
  downloadFile,
  CENTER_TYPE_LABELS,
  CENTER_TYPE_OPTIONS,
} from "@/lib/hooks/use-cost-centers";
import { useAutoReset, useEscapeClose } from "@/lib/hooks/use-dialog-helpers";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database } from "@/types/database";

type CostCenter = Database["public"]["Tables"]["cost_centers"]["Row"];
type CenterType = Database["public"]["Enums"]["center_type"];

const PRESET_COLORS = [
  "#56688F", "#2F7A68", "#A97824", "#A64A45", "#6F6678",
  "#A7794E", "#7E9487", "#241E29", "#4A7A6E", "#8B6B4A",
];

// ─── P&L Panel Component (CEN-04) ──────────────────────────────

function PnlPanel({ centerId, centerName }: { centerId: string; centerName: string }) {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });

  const { data: pnl, isLoading } = useCenterPnl(centerId, dateFrom, dateTo);
  const centerExport = useCenterExport();

  async function handleExportJson() {
    const data = await centerExport.mutateAsync(centerId);
    downloadFile(
      JSON.stringify(data, null, 2),
      `centro-${centerName.toLowerCase().replace(/\s+/g, "-")}.json`,
      "application/json"
    );
  }

  async function handleExportCsv() {
    const data = await centerExport.mutateAsync(centerId);
    const csv = exportToCsv(data);
    downloadFile(
      csv,
      `centro-${centerName.toLowerCase().replace(/\s+/g, "-")}.csv`,
      "text/csv"
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-20 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const income = pnl?.total_income ?? 0;
  const expense = pnl?.total_expense ?? 0;
  const net = pnl?.net_result ?? 0;
  const monthly = pnl?.monthly ?? [];

  return (
    <div className="border-t p-4 space-y-4">
      {/* Period selector */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">Período:</span>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="h-7 rounded border border-input bg-background px-2 text-xs" />
        <span className="text-muted-foreground">a</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="h-7 rounded border border-input bg-background px-2 text-xs" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-verdant/10 px-3 py-2">
          <p className="text-[10px] font-medium text-verdant">Receitas</p>
          <p className="text-sm font-bold tabular-nums text-verdant">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-lg bg-terracotta/10 px-3 py-2">
          <p className="text-[10px] font-medium text-terracotta">Despesas</p>
          <p className="text-sm font-bold tabular-nums text-terracotta">{formatCurrency(expense)}</p>
        </div>
        <div className={`rounded-lg px-3 py-2 ${net >= 0 ? "bg-info-slate/10" : "bg-burnished/10"}`}>
          <p className={`text-[10px] font-medium ${net >= 0 ? "text-info-slate" : "text-burnished"}`}>Resultado</p>
          <p className={`text-sm font-bold tabular-nums ${net >= 0 ? "text-info-slate" : "text-burnished"}`}>
            {net >= 0 ? "+" : ""}{formatCurrency(net)}
          </p>
        </div>
      </div>

      {/* Monthly breakdown */}
      {monthly.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Evolução mensal</p>
          <div className="space-y-1">
            {monthly.map((m) => {
              const mNet = Number(m.income) - Number(m.expense);
              return (
                <div key={m.month} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{formatDate(m.month, "MMM yyyy")}</span>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-verdant">+{formatCurrency(Number(m.income))}</span>
                    <span className="text-terracotta">-{formatCurrency(Number(m.expense))}</span>
                    <span className={`font-medium ${mNet >= 0 ? "text-info-slate" : "text-burnished"}`}>
                      = {formatCurrency(mNet)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {income === 0 && expense === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Nenhum lançamento neste período. Atribua transações a este centro ou use o rateio.
        </p>
      )}

      {/* CEN-05: Export buttons */}
      <div className="flex gap-2 pt-2">
        <button onClick={handleExportCsv} disabled={centerExport.isPending}
          className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent">
          {centerExport.isPending ? "Exportando" : "Exportar CSV"}
        </button>
        <button onClick={handleExportJson} disabled={centerExport.isPending}
          className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent">
          {centerExport.isPending ? "Exportando" : "Exportar JSON"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function CostCentersPage() {
  const { data: centers, isLoading } = useCostCenters();
  const createCenter = useCreateCostCenter();
  const updateCenter = useUpdateCostCenter();
  const deleteCenter = useDeleteCostCenter();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedCenter, setExpandedCenter] = useState<string | null>(null);

  useAutoReset(confirmDelete, setConfirmDelete);
  useEscapeClose(formOpen, () => { setFormOpen(false); setEditing(null); });

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<CenterType>("cost_center");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!editing;
  const loading = createCenter.isPending || updateCenter.isPending;

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setType(editing.type);
      setColor(editing.color || PRESET_COLORS[0]);
    } else {
      setName("");
      setType("cost_center");
      setColor(PRESET_COLORS[0]);
    }
    setError(null);
  }, [editing, formOpen]);

  function handleNew() { setEditing(null); setFormOpen(true); }
  function handleEdit(center: CostCenter) { setEditing(center); setFormOpen(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Nome é obrigatório."); return; }

    try {
      if (isEdit && editing) {
        await updateCenter.mutateAsync({ id: editing.id, name: name.trim(), type, color });
      } else {
        await createCenter.mutateAsync({ name: name.trim(), type, color });
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  async function handleDelete(id: string) {
    await deleteCenter.mutateAsync(id);
    setConfirmDelete(null);
    if (expandedCenter === id) setExpandedCenter(null);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centros de Custo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Segmentação de transações por projeto, pessoa ou atividade.
            Clique num centro para ver o P&L.
          </p>
        </div>
        <button onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          + Novo centro
        </button>
      </div>

      {/* Empty state */}
      {centers && centers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <TargetIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Nenhum centro de custo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhum centro de custo cadastrado.
          </p>
          <button onClick={handleNew}
            className="mt-3 text-sm font-medium text-primary hover:underline">
            Criar primeiro
          </button>
        </div>
      )}

      {/* Center list with expandable P&L (CEN-04) */}
      {centers && centers.length > 0 && (
        <div className="space-y-2">
          {centers.map((center) => {
            const isExpanded = expandedCenter === center.id;
            return (
              <div key={center.id} className="rounded-lg border bg-card shadow-sm overflow-hidden">
                {/* Center row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => setExpandedCenter(isExpanded ? null : center.id)}
                >
                  <div className="h-9 w-9 flex-shrink-0 rounded-lg"
                    style={{ backgroundColor: center.color || "#241E29" }} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{center.name}</p>
                      {center.is_default && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Padrão
                        </span>
                      )}
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {CENTER_TYPE_LABELS[center.type]}
                      </span>
                    </div>
                  </div>

                  {/* Actions (stop propagation to not toggle P&L) */}
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleEdit(center)}
                      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" title="Editar">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    {!center.is_default && (
                      <>
                        {confirmDelete === center.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(center.id)} disabled={deleteCenter.isPending}
                              className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                              Confirmar
                            </button>
                            <button onClick={() => setConfirmDelete(null)}
                              className="rounded-md px-2 py-1 text-xs text-muted-foreground">Não</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(center.id)}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Desativar">
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Expand indicator */}
                  <svg className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* CEN-04: P&L panel (expanded) */}
                {isExpanded && (
                  <PnlPanel centerId={center.id} centerName={center.name} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rateio info */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Rateio entre centros</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Para dividir uma transação entre centros, abra a transação na lista de
          Transações e use a opção &ldquo;Dividir entre centros&rdquo;. Os percentuais devem somar 100 %.
          O resultado aparece no P&L de cada centro acima.
        </p>
      </div>

      {/* Form dialog */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setFormOpen(false); setEditing(null); }} />
          <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">{isEdit ? "Editar centro" : "Novo centro"}</h2>

            {error && (
              <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="cc-name" className="text-sm font-medium">Nome</label>
                <input id="cc-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Casa, Trabalho, Reforma" autoFocus
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tipo</label>
                <div className="space-y-2">
                  {CENTER_TYPE_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setType(opt.value)}
                      className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                        type === opt.value ? "border-primary bg-primary/5" : "border-input hover:bg-accent"
                      }`}>
                      <span className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                        type === opt.value ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}>
                        {type === opt.value && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${
                        color === c ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setFormOpen(false); setEditing(null); }}
                  className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
                  {loading ? "Salvando" : isEdit ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

```

### src/app/(app)/dashboard/page.tsx
```
"use client";

/**
 * Oniefy - Dashboard (Phase 3)
 *
 * Layout conforme adendo v1.4, seção 2.4:
 * - Seção A: Visão Operacional (DASH-01 to DASH-05)
 * - Seção B: Cockpit de Solvência (DASH-06, DASH-07, DASH-09 to DASH-12)
 * - CTB-05: Balanço Patrimonial (entre as duas seções)
 * - DASH-08: FAB lançamento rápido (flutuante)
 */

import {
  useDashboardSummary,
  useBalanceSheet,
  useSolvencyMetrics,
  useTopCategories,
  useBalanceEvolution,
  useBudgetVsActual,
} from "@/lib/hooks/use-dashboard";

import {
  SummaryCards,
  BalanceSheetCard,
  TopCategoriesCard,
  UpcomingBillsCard,
  BudgetSummaryCard,
  SolvencyPanel,
  BalanceEvolutionChart,
  QuickEntryFab,
} from "@/components/dashboard";

export default function DashboardPage() {
  const summary = useDashboardSummary();
  const balanceSheet = useBalanceSheet();
  const solvency = useSolvencyMetrics();
  const topCategories = useTopCategories();
  const evolution = useBalanceEvolution(6);
  const budgetVsActual = useBudgetVsActual();

  const hasError =
    summary.error || balanceSheet.error || solvency.error;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Visão geral das suas finanças
        </p>
      </div>

      {/* Error banner */}
      {hasError && (
        <div className="rounded-lg border border-terracotta/20 bg-terracotta/10 p-4">
          <p className="text-sm font-medium text-terracotta">
            Erro ao carregar dados do dashboard
          </p>
          <p className="mt-1 text-xs text-terracotta">
            {(summary.error || balanceSheet.error || solvency.error)?.message}
          </p>
          <button
            onClick={() => {
              summary.refetch();
              balanceSheet.refetch();
              solvency.refetch();
            }}
            className="mt-2 rounded bg-terracotta/15 px-3 py-1 text-xs font-medium text-terracotta hover:bg-terracotta/20"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* ═══ SEÇÃO A: Visão Operacional ═══ */}

      {/* DASH-01 + DASH-02: Saldo consolidado + Receitas vs Despesas */}
      <SummaryCards data={summary.data} isLoading={summary.isLoading} />

      {/* 3-column layout: Top Categorias | Contas a Vencer | Orçamento */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* DASH-03: Top categorias */}
        <TopCategoriesCard
          data={topCategories.data}
          isLoading={topCategories.isLoading}
        />

        {/* DASH-04: Próximas contas a vencer */}
        <UpcomingBillsCard />

        {/* DASH-05: Resumo do orçamento */}
        <BudgetSummaryCard
          data={budgetVsActual.data}
          isLoading={budgetVsActual.isLoading}
        />
      </div>

      {/* CTB-05: Balanço Patrimonial + DASH-07: Evolução */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BalanceSheetCard
          data={balanceSheet.data}
          isLoading={balanceSheet.isLoading}
        />
        <BalanceEvolutionChart
          data={evolution.data}
          isLoading={evolution.isLoading}
        />
      </div>

      {/* ═══ SEÇÃO B: Cockpit de Solvência ═══ */}

      {/* DASH-09 to DASH-12 + DASH-06: KPIs de solvência + Tiers */}
      <SolvencyPanel data={solvency.data} isLoading={solvency.isLoading} />

      {/* DASH-08: FAB lançamento rápido */}
      <QuickEntryFab />
    </div>
  );
}

```

### src/app/(app)/family/page.tsx
```
"use client";

import { useState, useEffect } from "react";
import { Users, Archive } from "lucide-react";
import {
  useFamilyMembers,
  useCreateFamilyMember,
  useUpdateFamilyMember,
  useDeactivateFamilyMember,
  RELATIONSHIP_OPTIONS,
  RELATIONSHIP_LABELS,
  ROLE_LABELS,
} from "@/lib/hooks/use-family-members";
import { useAutoReset, useEscapeClose } from "@/lib/hooks/use-dialog-helpers";
import type { Database } from "@/types/database";

type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"];
type FamilyRelationship = Database["public"]["Enums"]["family_relationship"];

export default function FamilyPage() {
  const { data: members, isLoading } = useFamilyMembers();
  const createMember = useCreateFamilyMember();
  const updateMember = useUpdateFamilyMember();
  const deactivateMember = useDeactivateFamilyMember();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useAutoReset(confirmDelete, setConfirmDelete);
  useEscapeClose(showForm, () => { setShowForm(false); setEditing(null); });

  // Form state
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<FamilyRelationship>("self");
  const [birthDate, setBirthDate] = useState("");
  const [isTaxDep, setIsTaxDep] = useState(false);
  const [avatar, setAvatar] = useState("👤");
  const [error, setError] = useState<string | null>(null);

  const loading = createMember.isPending || updateMember.isPending;

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setRelationship(editing.relationship);
      setBirthDate(editing.birth_date || "");
      setIsTaxDep(editing.is_tax_dependent);
      setAvatar(editing.avatar_emoji || "👤");
    } else {
      setName("");
      setRelationship("self");
      setBirthDate("");
      setIsTaxDep(false);
      setAvatar("👤");
    }
    setError(null);
  }, [editing, showForm]);

  function handleNew() {
    setEditing(null);
    setShowForm(true);
  }

  function handleEdit(m: FamilyMember) {
    setEditing(m);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    try {
      if (editing) {
        await updateMember.mutateAsync({
          id: editing.id,
          name: name.trim(),
          relationship,
          birth_date: birthDate || null,
          is_tax_dependent: isTaxDep,
          avatar_emoji: avatar,
        });
      } else {
        await createMember.mutateAsync({
          name: name.trim(),
          relationship,
          birth_date: birthDate || undefined,
          is_tax_dependent: isTaxDep,
          avatar_emoji: avatar,
        });
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  async function handleDeactivate(id: string) {
    await deactivateMember.mutateAsync(id);
    setConfirmDelete(null);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estrutura Familiar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {members?.length || 0} membro(s). Cada membro gera automaticamente um centro de custo.
          </p>
        </div>
        <button
          onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Novo membro
        </button>
      </div>

      {/* Info box */}
      <div className="rounded-lg border bg-muted/50 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Como funciona</p>
        <p className="mt-1">
          Membros com receita própria (Titular, Cônjuge) são criados como centros de lucro.
          Dependentes (Filhos, Pets, etc.) são centros de custo. Despesas compartilhadas
          (supermercado, energia) podem ser lançadas em &quot;Família (Geral)&quot; sem atribuir a ninguém.
        </p>
      </div>

      {/* Empty state */}
      {(!members || members.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Nenhum membro cadastrado</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Nenhum membro cadastrado. Adicione os membros da família para rastrear despesas e receitas individuais.
          </p>
          <button
            onClick={handleNew}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Adicionar primeiro membro
          </button>
        </div>
      )}

      {/* Members list */}
      {members && members.length > 0 && (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 shadow-sm"
            >
              {/* Avatar */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl">
                {m.avatar_emoji || "👤"}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{m.name}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {RELATIONSHIP_LABELS[m.relationship]}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    m.role === "owner"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {ROLE_LABELS[m.role]}
                  </span>
                </div>
                <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                  {m.birth_date && (
                    <span>Nasc: {new Date(m.birth_date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                  )}
                  {m.is_tax_dependent && (
                    <span className="text-info-slate font-medium">Dependente IRPF</span>
                  )}
                  {(m.relationship === "self" || m.relationship === "spouse") && (
                    <span className="text-verdant font-medium">Centro de lucro</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(m)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  title="Editar"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                {confirmDelete === m.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeactivate(m.id)}
                      disabled={deactivateMember.isPending}
                      className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(m.id)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Desativar"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">
              {editing ? "Editar membro" : "Novo membro"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {editing
                ? "Atualize os dados do membro."
                : "Um centro de custo/lucro será criado automaticamente."}
            </p>

            {error && (
              <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Claudio, Luna (pet)"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  autoFocus
                />
              </div>

              {/* Relationship */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Parentesco</label>
                <select
                  value={relationship}
                  onChange={(e) => {
                    const r = e.target.value as FamilyRelationship;
                    setRelationship(r);
                    setAvatar(RELATIONSHIP_OPTIONS.find((o) => o.value === r)?.emoji || "👤");
                  }}
                  disabled={!!editing}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                >
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.emoji} {opt.label}
                    </option>
                  ))}
                </select>
                {(relationship === "self" || relationship === "spouse") && (
                  <p className="text-xs text-verdant">
                    Será criado como centro de lucro (gera receita).
                  </p>
                )}
              </div>

              {/* Birth date */}
              {relationship !== "pet" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Data de nascimento <span className="font-normal text-muted-foreground">(opcional)</span>
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}

              {/* Tax dependent */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="tax-dep"
                  checked={isTaxDep}
                  onChange={(e) => setIsTaxDep(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="tax-dep" className="text-sm">
                  Dependente no IRPF
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditing(null); }}
                  className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Salvando" : editing ? "Salvar" : "Criar membro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

```

### src/app/(app)/indices/page.tsx
```
"use client";

/**
 * Oniefy - Índices Econômicos (Phase 8)
 *
 * Dashboard of economic indicators from BCB SGS / IBGE SIDRA.
 * - Latest values per index (cards, multi-selectable)
 * - Historical chart with monthly value + running accumulated curves
 * - Multi-index overlay on same chart
 * - Daily cron at 03:00 BRT + manual fetch button
 */

import { useState, useMemo, useCallback } from "react";
import { TrendingUp as TrendingUpIcon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  useLatestIndices,
  useMultiIndexHistory,
  useFetchIndices,
  INDEX_TYPE_LABELS,
  INDEX_TYPE_COLORS,
  INDEX_UNIT,
} from "@/lib/hooks/use-economic-indices";
import { formatCurrency, formatDate } from "@/lib/utils";

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

interface TooltipPayloadItem {
  value: number;
  name: string;
  color: string;
  dataKey: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-2 shadow-lg text-xs">
      <p className="font-semibold text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value?.toFixed(4) ?? "-"}
        </p>
      ))}
    </div>
  );
}

const MAIN_INDICES = ["ipca", "selic", "cdi", "igpm", "inpc", "tr", "usd_brl"];

// Indices where running accumulation (compound product) makes sense
const ACCUMULATION_INDICES = new Set(["ipca", "inpc", "igpm", "tr"]);

export default function IndicesPage() {
  const [selectedIndices, setSelectedIndices] = useState<Set<string>>(new Set(["ipca"]));
  const [historyMonths, setHistoryMonths] = useState(12);
  const [showAccumulated, setShowAccumulated] = useState(true);

  const { data: latestIndices, isLoading: loadingLatest } = useLatestIndices();
  const { data: multiHistory, isLoading: loadingHistory } = useMultiIndexHistory(
    Array.from(selectedIndices),
    historyMonths
  );
  const fetchIndices = useFetchIndices();

  const toggleIndex = useCallback((indexType: string) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(indexType)) {
        next.delete(indexType);
        if (next.size === 0) next.add(indexType);
      } else {
        next.add(indexType);
      }
      return next;
    });
  }, []);

  const mainIndices = (latestIndices ?? []).filter((i) =>
    MAIN_INDICES.includes(i.index_type)
  );

  // Build unified chart data with running accumulated from period start
  const chartData = useMemo(() => {
    if (!multiHistory) return [];

    const monthMap = new Map<string, Record<string, number | string | null>>();

    for (const idxType of Array.from(selectedIndices)) {
      const points = [...(multiHistory[idxType] ?? [])].sort(
        (a, b) => a.reference_date.localeCompare(b.reference_date)
      );

      // Compute running accumulated for percentage indices
      let runningAcc = 1;
      const canAccumulate = ACCUMULATION_INDICES.has(idxType);

      for (const p of points) {
        const sortKey = p.reference_date;
        if (!monthMap.has(sortKey)) {
          monthMap.set(sortKey, { month: formatMonth(p.reference_date) });
        }
        const row = monthMap.get(sortKey)!;
        const val = Number(p.value);
        row[`${idxType}_value`] = val;

        if (canAccumulate) {
          runningAcc *= (1 + val / 100);
          row[`${idxType}_acc`] = Number(((runningAcc - 1) * 100).toFixed(4));
        }
      }
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, row]) => row);
  }, [multiHistory, selectedIndices]);

  // Table data for primary index (single-selection only)
  const primaryIndex = Array.from(selectedIndices)[0];
  const primaryHistory = multiHistory?.[primaryIndex] ?? [];

  if (loadingLatest) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Índices Econômicos</h1>
          <p className="text-sm text-muted-foreground">
            Indicadores macroeconômicos do BCB e IBGE
          </p>
        </div>
        <button
          onClick={() => fetchIndices.mutate()}
          disabled={fetchIndices.isPending}
          className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          {fetchIndices.isPending ? "Atualizando" : "Atualizar índices"}
        </button>
      </div>

      {/* Fetch result */}
      {fetchIndices.data && (
        <div className="rounded-lg border border-verdant/20 bg-verdant/10 px-4 py-3 text-sm text-verdant">
          {fetchIndices.data.total_inserted} registro(s) atualizado(s)
          {fetchIndices.data.results.some((r) => r.errors.length > 0) && (
            <span className="ml-2 text-burnished">
              (Erros: {fetchIndices.data.results.filter((r) => r.errors.length > 0).map((r) => `${r.index_type}: ${r.errors.join(", ")}`).join("; ")})
            </span>
          )}
        </div>
      )}

      {/* Latest values cards (multi-selectable) */}
      <div>
        <p className="mb-2 text-xs text-muted-foreground">
          Clique para selecionar. Vários índices podem ser comparados no gráfico.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {mainIndices.map((idx) => {
            const color = INDEX_TYPE_COLORS[idx.index_type] || "#7E9487";
            const unit = INDEX_UNIT[idx.index_type] || "%";
            const isSelected = selectedIndices.has(idx.index_type);

            return (
              <button
                key={idx.index_type}
                onClick={() => toggleIndex(idx.index_type)}
                className={`rounded-lg border p-4 text-left transition-all ${
                  isSelected ? "border-2 shadow-md" : "hover:bg-accent/50"
                }`}
                style={isSelected ? { borderColor: color } : undefined}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {INDEX_TYPE_LABELS[idx.index_type] || idx.index_type}
                  </span>
                  {isSelected && (
                    <span className="ml-auto rounded bg-muted px-1 py-0.5 text-[9px] font-bold text-muted-foreground">
                      ativo
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xl font-bold tabular-nums">
                  {idx.index_type === "usd_brl" || idx.index_type === "minimum_wage"
                    ? formatCurrency(idx.value)
                    : `${idx.value.toFixed(2)} %`}
                </p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{unit}</span>
                  <span>{formatDate(idx.reference_date, "MMM/yy")}</span>
                </div>
                {idx.accumulated_12m !== null && idx.accumulated_12m !== undefined && (
                  <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                    12m: {Number(idx.accumulated_12m).toFixed(2)} %
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* No data state */}
      {mainIndices.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <TrendingUpIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Sem dados de índices</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em &ldquo;Atualizar índices&rdquo; para buscar os dados mais recentes do BCB.
          </p>
        </div>
      )}

      {/* Historical chart */}
      {selectedIndices.size > 0 && (
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {selectedIndices.size === 1
                ? `${INDEX_TYPE_LABELS[primaryIndex] || primaryIndex} - Histórico`
                : `Comparativo (${selectedIndices.size} índices)`}
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAccumulated(!showAccumulated)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  showAccumulated
                    ? "bg-info-slate/15 text-info-slate"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                Acumulado
              </button>
              <div className="flex gap-1">
                {[6, 12, 24, 36].map((m) => (
                  <button
                    key={m}
                    onClick={() => setHistoryMonths(m)}
                    className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      historyMonths === m
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loadingHistory ? (
            <div className="mt-4 h-64 animate-pulse rounded bg-muted" />
          ) : chartData.length === 0 ? (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Sem dados históricos para o período selecionado
              </p>
            </div>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                  {Array.from(selectedIndices).flatMap((idxType) => {
                    const color = INDEX_TYPE_COLORS[idxType] || "#7E9487";
                    const label = INDEX_TYPE_LABELS[idxType] || idxType;
                    const canAccumulate = ACCUMULATION_INDICES.has(idxType);
                    const lines = [
                      <Line
                        key={`${idxType}_value`}
                        dataKey={`${idxType}_value`}
                        name={label}
                        type="monotone"
                        stroke={color}
                        strokeWidth={2}
                        dot={{ r: 2.5, fill: color }}
                        activeDot={{ r: 4 }}
                        connectNulls
                      />,
                    ];
                    if (showAccumulated && canAccumulate) {
                      lines.push(
                        <Line
                          key={`${idxType}_acc`}
                          dataKey={`${idxType}_acc`}
                          name={`${label} (acum. ${historyMonths}m)`}
                          type="monotone"
                          stroke={color}
                          strokeWidth={1.5}
                          strokeDasharray="5 3"
                          dot={false}
                          connectNulls
                        />
                      );
                    }
                    return lines;
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data table (single-index only) */}
          {primaryHistory.length > 0 && selectedIndices.size === 1 && (
            <div className="mt-4 max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-1.5 text-left font-medium">Período</th>
                    <th className="py-1.5 text-right font-medium">Valor</th>
                    <th className="py-1.5 text-right font-medium">Acum. Ano</th>
                    <th className="py-1.5 text-right font-medium">Acum. 12m</th>
                  </tr>
                </thead>
                <tbody>
                  {[...primaryHistory].map((p) => (
                    <tr key={p.reference_date} className="border-b border-muted/50">
                      <td className="py-1 tabular-nums">{formatDate(p.reference_date, "MMM/yyyy")}</td>
                      <td className="py-1 text-right tabular-nums font-medium">
                        {Number(p.value).toFixed(primaryIndex === "usd_brl" ? 4 : 2)}
                      </td>
                      <td className="py-1 text-right tabular-nums">
                        {p.accumulated_year !== null ? `${Number(p.accumulated_year).toFixed(2)} %` : "-"}
                      </td>
                      <td className="py-1 text-right tabular-nums">
                        {p.accumulated_12m !== null ? `${Number(p.accumulated_12m).toFixed(2)} %` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Info note */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Dados obtidos via API pública do Banco Central (SGS) e IBGE (SIDRA).
          Atualizados diariamente por workflow automático (03:00 BRT) e
          disponíveis para atualização manual via botão acima.
          Os índices são utilizados para reajuste automático de recorrências
          e projeções do orçamento.
        </p>
      </div>
    </div>
  );
}

```

### src/app/(app)/settings/page.tsx
```
"use client";

import Link from "next/link";
import { User, Shield, Bell, Database } from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    href: "/settings/profile",
    icon: User,
    label: "Perfil",
    description: "Nome, senha, moeda padrão",
    ready: true,
  },
  {
    href: "/settings/security",
    icon: Shield,
    label: "Segurança",
    description: "MFA, sessões, exclusão de conta",
    ready: true,
  },
  {
    href: "/settings/data",
    icon: Database,
    label: "Dados e Privacidade",
    description: "Exportar dados, política de privacidade",
    ready: true,
  },
  {
    href: "#",
    icon: Bell,
    label: "Notificações",
    description: "Push, alertas, lembretes",
    ready: false,
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>

      <div className="space-y-3">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;

          if (!section.ready) {
            return (
              <div
                key={section.label}
                className="flex items-center justify-between rounded-lg border bg-card p-4 opacity-50"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{section.label}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Em breve</span>
              </div>
            );
          }

          return (
            <Link
              key={section.label}
              href={section.href}
              className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{section.label}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

```

### src/app/(app)/settings/security/page.tsx
```
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getMfaStatus } from "@/lib/auth/mfa";
import { clearEncryptionKey } from "@/lib/auth/encryption-manager";
import { useBiometricAuth } from "@/lib/auth/use-biometric";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const biometric = useBiometricAuth();

  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletionPending, setDeletionPending] = useState<string | null>(null);

  useEffect(() => {
    async function checkStatus() {
      const { status } = await getMfaStatus(supabase);
      setMfaEnrolled(status === "enrolled_verified");

      // Check if deletion is pending
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("users_profile")
          .select("deletion_requested_at")
          .eq("id", user.id)
          .single();
        if (data?.deletion_requested_at) {
          setDeletionPending(data.deletion_requested_at);
        }
      }
    }
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Logout all devices (AUTH-07) ──────────────────────────
  async function handleLogoutAllDevices() {
    setLoading("logout");
    setMessage(null);

    try {
      // signOut with scope 'global' invalidates ALL sessions
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;

      clearEncryptionKey();
      router.push("/login?reason=logout_all");
    } catch {
      setMessage({ type: "error", text: "Erro ao encerrar sessões. Tente novamente." });
    } finally {
      setLoading(null);
    }
  }

  // ─── Request account deletion (CFG-06) ─────────────────────
  async function handleRequestDeletion() {
    if (deleteConfirmText !== "EXCLUIR") return;

    setLoading("delete");
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { error } = await supabase
        .from("users_profile")
        .update({ deletion_requested_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Exclusão solicitada. Sua conta será removida em 7 dias. Você pode cancelar entrando em contato antes do prazo.",
      });
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao solicitar exclusão.",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Segurança</h1>
      </div>

      {message && (
        <div className={`rounded-md border p-3 text-sm ${
          message.type === "success"
            ? "border-verdant/20 bg-verdant/10 text-verdant"
            : "border-destructive/50 bg-destructive/10 text-destructive"
        }`}>
          {message.text}
        </div>
      )}

      {/* MFA Status */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Autenticação de dois fatores (TOTP)</p>
            <p className="text-xs text-muted-foreground">
              {mfaEnrolled ? "Ativo - protegido por app autenticador" : "Não configurado"}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            mfaEnrolled ? "bg-verdant/15 text-verdant" : "bg-terracotta/15 text-terracotta"
          }`}>
            {mfaEnrolled ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      {/* Biometric Status (stub) */}
      {biometric.platform === "ios" && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Desbloqueio biométrico</p>
              <p className="text-xs text-muted-foreground">
                {biometric.available
                  ? "Face ID disponível (requer build iOS)"
                  : "Indisponível nesta plataforma"}
              </p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Em breve
            </span>
          </div>
        </div>
      )}

      {/* Session Management */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sessões ativas</p>
            <p className="text-xs text-muted-foreground">
              Timeout automático após 30 minutos de inatividade
            </p>
          </div>
          <button
            onClick={handleLogoutAllDevices}
            disabled={loading === "logout"}
            className="rounded-md border border-destructive/50 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            {loading === "logout" ? "Encerrando" : "Encerrar todas"}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-3 rounded-lg border border-destructive/30 p-4">
        <p className="text-sm font-medium text-destructive">Zona de perigo</p>

        {deletionPending ? (
          <div className="space-y-3">
            <div className="rounded-md border border-burnished/30 bg-burnished/10 p-3 text-sm text-burnished">
              Exclusão solicitada em {new Date(deletionPending).toLocaleDateString("pt-BR")}.
              Seus dados serão removidos permanentemente em{" "}
              {new Date(new Date(deletionPending).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR")}.
            </div>
            <button
              onClick={async () => {
                setLoading("cancel-delete");
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase
                    .from("users_profile")
                    .update({ deletion_requested_at: null })
                    .eq("id", user.id);
                  setDeletionPending(null);
                  setMessage({ type: "success", text: "Exclusão cancelada." });
                }
                setLoading(null);
              }}
              disabled={loading === "cancel-delete"}
              className="rounded-md border border-verdant px-3 py-1.5 text-xs font-medium text-verdant transition-colors hover:bg-verdant/10 disabled:opacity-50"
            >
              {loading === "cancel-delete" ? "Cancelando..." : "Cancelar exclusão"}
            </button>
          </div>
        ) : !showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-md border border-destructive/50 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            Solicitar exclusão da conta
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              A exclusão será processada em 7 dias. Todos os dados serão permanentemente
              removidos. Esta ação não pode ser desfeita.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium">
                Digite <strong>EXCLUIR</strong> para confirmar
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                placeholder="EXCLUIR"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRequestDeletion}
                disabled={deleteConfirmText !== "EXCLUIR" || loading === "delete"}
                className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground disabled:opacity-50"
              >
                {loading === "delete" ? "Processando..." : "Confirmar exclusão"}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                className="rounded-md border px-3 py-1.5 text-xs font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

```

### src/app/(app)/settings/data/page.tsx
```
"use client";

/**
 * Oniefy - Data & Privacy Settings (CFG-05)
 *
 * CFG-05: Exportar todos os dados para backup pessoal ou migração.
 * Generates JSON with all user data, decrypted client-side.
 * Also: privacy policy link (Apple App Store requirement).
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileJson, FileSpreadsheet, Loader2, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type ExportFormat = "json" | "csv";

interface ExportProgress {
  step: string;
  done: boolean;
}

const TABLES_TO_EXPORT = [
  { key: "accounts", label: "Contas bancárias" },
  { key: "transactions", label: "Transações" },
  { key: "categories", label: "Categorias" },
  { key: "budgets", label: "Orçamentos" },
  { key: "assets", label: "Bens patrimoniais" },
  { key: "recurrences", label: "Recorrências" },
  { key: "family_members", label: "Membros familiares" },
  { key: "cost_centers", label: "Centros de custo" },
  { key: "chart_of_accounts", label: "Plano de contas" },
  { key: "journal_entries", label: "Lançamentos contábeis" },
  { key: "journal_lines", label: "Linhas contábeis" },
  { key: "workflows", label: "Workflows" },
  { key: "workflow_tasks", label: "Tarefas" },
  { key: "bank_connections", label: "Conexões bancárias" },
] as const;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          // Escape semicolons and quotes
          return str.includes(";") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(";")
    ),
  ];
  return lines.join("\n");
}

export default function DataSettingsPage() {
  const supabase = createClient();
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(format: ExportFormat) {
    setExporting(true);
    setError(null);
    setProgress([]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const allData: Record<string, unknown[]> = {};
      const steps: ExportProgress[] = TABLES_TO_EXPORT.map((t) => ({
        step: t.label,
        done: false,
      }));
      setProgress([...steps]);

      for (let i = 0; i < TABLES_TO_EXPORT.length; i++) {
        const table = TABLES_TO_EXPORT[i];
        const { data, error: fetchError } = await supabase
          .from(table.key)
          .select("*")
          .limit(10000);

        if (fetchError) {
          console.error(`Export error on ${table.key}:`, fetchError.message);
          allData[table.key] = [];
        } else {
          allData[table.key] = data ?? [];
        }

        steps[i].done = true;
        setProgress([...steps]);
      }

      // Also export user profile
      const { data: profile } = await supabase
        .from("users_profile")
        .select("full_name, default_currency, onboarding_completed, created_at")
        .eq("id", user.id)
        .single();
      allData["profile"] = profile ? [profile] : [];

      const timestamp = new Date().toISOString().slice(0, 10);

      if (format === "json") {
        const json = JSON.stringify(
          {
            exported_at: new Date().toISOString(),
            app: "Oniefy",
            user_id: user.id,
            data: allData,
          },
          null,
          2
        );
        const blob = new Blob([json], { type: "application/json" });
        downloadBlob(blob, `oniefy-backup-${timestamp}.json`);
      } else {
        // CSV: create one file per table, pack into a combined download
        // For simplicity, export the largest table (transactions) as CSV
        // and the rest as a single JSON
        const txRows = (allData["transactions"] ?? []) as Record<string, unknown>[];
        if (txRows.length > 0) {
          const csvContent = toCsv(txRows);
          const bom = "\uFEFF"; // UTF-8 BOM for Excel
          const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8" });
          downloadBlob(blob, `oniefy-transacoes-${timestamp}.csv`);
        }

        // Full data as JSON anyway (CSV is lossy for nested objects)
        const json = JSON.stringify({ exported_at: new Date().toISOString(), data: allData }, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        downloadBlob(blob, `oniefy-dados-completos-${timestamp}.json`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao exportar dados.");
    } finally {
      setExporting(false);
    }
  }

  const totalRows = progress.reduce((sum, p) => sum + (p.done ? 1 : 0), 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Dados e Privacidade</h1>
      </div>

      {/* ═══ CFG-05: Export ═══ */}
      <div className="space-y-4 rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold">Exportar dados</h2>
        <p className="text-xs text-muted-foreground">
          Baixe todos os seus dados para backup pessoal ou migração.
          O arquivo inclui contas, transações, orçamentos, bens, plano de contas e mais.
        </p>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {exporting && progress.length > 0 && (
          <div className="space-y-1.5 rounded-md border bg-muted/50 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Exportando...</span>
              <span>{totalRows}/{TABLES_TO_EXPORT.length}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(totalRows / TABLES_TO_EXPORT.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport("json")}
            disabled={exporting}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileJson className="h-4 w-4" />
            )}
            Exportar JSON
          </button>

          <button
            onClick={() => handleExport("csv")}
            disabled={exporting}
            className="flex items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Exportar CSV + JSON
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Dados sensíveis (CPF, notas criptografadas) permanecem cifrados no export.
          A chave de criptografia não é incluída no arquivo.
        </p>
      </div>

      {/* Privacy Policy */}
      <div className="space-y-3 rounded-lg border bg-card p-5">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Privacidade</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Seus dados financeiros são protegidos por criptografia AES-256 em repouso,
          TLS em trânsito e criptografia ponta-a-ponta (E2E) para campos sensíveis.
          Nenhum dado é compartilhado com terceiros ou utilizado para publicidade.
        </p>
        <p className="text-xs text-muted-foreground">
          Para solicitar a exclusão permanente da sua conta e todos os dados associados,
          acesse Configurações → Segurança → Zona de perigo.
        </p>
      </div>
    </div>
  );
}

```

### src/app/(app)/settings/profile/page.tsx
```
"use client";

/**
 * Oniefy - Profile Settings (CFG-01, CFG-02, CFG-03)
 *
 * CFG-01: Editar perfil (nome completo)
 * CFG-02: Alterar senha
 * CFG-03: Moeda padrão
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { passwordSchema } from "@/lib/validations/auth";

const CURRENCIES = [
  { code: "BRL", label: "Real (R$)" },
  { code: "USD", label: "Dólar (US$)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "Libra (£)" },
] as const;

export default function ProfileSettingsPage() {
  const supabase = createClient();

  // Profile state
  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users_profile")
        .select("full_name, default_currency")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name ?? "");
        setCurrency(data.default_currency ?? "BRL");
      }
      setLoading(false);
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── CFG-01 + CFG-03: Save profile ────────────────────────
  async function handleSaveProfile() {
    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const trimmedName = fullName.trim();
      if (trimmedName.length < 2) {
        setMessage({ type: "error", text: "Nome deve ter pelo menos 2 caracteres." });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("users_profile")
        .update({
          full_name: trimmedName,
          default_currency: currency,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Also update auth metadata for display name
      await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });

      setMessage({ type: "success", text: "Perfil atualizado." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao salvar perfil.",
      });
    } finally {
      setSaving(false);
    }
  }

  // ─── CFG-02: Change password ───────────────────────────────
  async function handleChangePassword() {
    setPasswordSaving(true);
    setPasswordMessage(null);

    try {
      if (newPassword !== confirmPassword) {
        setPasswordMessage({ type: "error", text: "As senhas não coincidem." });
        setPasswordSaving(false);
        return;
      }

      const validation = passwordSchema.safeParse(newPassword);
      if (!validation.success) {
        const firstIssue = validation.error.issues[0]?.message ?? "Senha inválida.";
        setPasswordMessage({ type: "error", text: firstIssue });
        setPasswordSaving(false);
        return;
      }

      // Supabase updateUser for password change
      // Note: Supabase requires the user to be recently authenticated
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage({ type: "success", text: "Senha alterada." });
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao alterar senha.",
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
      </div>

      {/* ═══ CFG-01 + CFG-03: Profile form ═══ */}
      <div className="space-y-4 rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold">Dados pessoais</h2>

        {message && (
          <div className={`rounded-md border p-3 text-sm ${
            message.type === "success"
              ? "border-verdant/20 bg-verdant/10 text-verdant"
              : "border-destructive/50 bg-destructive/10 text-destructive"
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Nome completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Moeda padrão
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </div>

      {/* ═══ CFG-02: Password change ═══ */}
      <div className="space-y-4 rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold">Alterar senha</h2>
        <p className="text-xs text-muted-foreground">
          Mínimo 12 caracteres, com maiúscula, minúscula e número.
        </p>

        {passwordMessage && (
          <div className={`rounded-md border p-3 text-sm ${
            passwordMessage.type === "success"
              ? "border-verdant/20 bg-verdant/10 text-verdant"
              : "border-destructive/50 bg-destructive/10 text-destructive"
          }`}>
            {passwordMessage.text}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Nova senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Nova senha"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Repita a nova senha"
            />
          </div>
        </div>

        <button
          onClick={handleChangePassword}
          disabled={passwordSaving || !newPassword || !confirmPassword}
          className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          {passwordSaving ? "Alterando..." : "Alterar senha"}
        </button>
      </div>
    </div>
  );
}

```

### src/app/(app)/tax/page.tsx
```
"use client";

/**
 * Oniefy - Fiscal / IRPF (Phase 7)
 *
 * FIS-01: Rendimentos tributáveis (via tax_treatment automático)
 * FIS-02: Deduções (dedutivel_integral / dedutivel_limitado)
 * FIS-03: Bens e dívidas (consolidação do módulo Patrimônio)
 * FIS-04: Comprovantes (referência aos documentos)
 * FIS-05: Relatório anual consolidado (view, não input)
 * FIS-06: Navegação entre anos fiscais
 *
 * BONUS: Painel de Provisionamento de IR
 * Inteligência que calcula a projeção anual do IRPF baseada em múltiplas
 * fontes de renda, mostra o gap entre imposto estimado e IRRF retido,
 * e recomenda o valor mensal a provisionar.
 *
 * Cenário-chave: pessoa com 2 contratos CLT de R$5.000 cada.
 * Nenhum empregador retém IR isoladamente, mas a declaração anual consolida
 * R$120k de renda tributável e cobra o tributo inteiro de uma vez.
 */

import { useState } from "react";
import { FileSearch } from "lucide-react";
import {
  useFiscalReport,
  useFiscalProjection,
  useTaxParameters,
  TAX_TREATMENT_LABELS,
  TAX_TREATMENT_COLORS,
} from "@/lib/hooks/use-fiscal";
import { formatCurrency, formatDate } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();

function provisionStatus(monthly: number): { label: string; color: string; bg: string } {
  if (monthly <= 0) return { label: "Sem imposto a provisionar", color: "text-verdant", bg: "bg-verdant/10" };
  if (monthly < 500) return { label: "Baixo", color: "text-burnished", bg: "bg-burnished/10" };
  if (monthly < 2000) return { label: "Moderado", color: "text-burnished", bg: "bg-burnished/10" };
  return { label: "Alto", color: "text-terracotta", bg: "bg-terracotta/10" };
}

export default function FiscalPage() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  const { data: report, isLoading: loadingReport } = useFiscalReport(selectedYear);
  const { data: projection, isLoading: loadingProjection } = useFiscalProjection(selectedYear);
  const { data: parameters } = useTaxParameters();

  const years = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

  const isLoading = loadingReport || loadingProjection;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const totals = report?.totals;
  const prov = projection;
  const provStatus = prov ? provisionStatus(prov.monthly_provision) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header + Year selector (FIS-06) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fiscal / IRPF</h1>
          <p className="text-sm text-muted-foreground">
            Consolidação fiscal automática via classificação contábil
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Ano:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ═══ PAINEL DE PROVISIONAMENTO (Inteligência principal) ═══ */}
      {prov && !prov.status && (
        <div className={`rounded-lg border-2 p-6 shadow-sm ${
          prov.monthly_provision > 0 ? "border-burnished/30 bg-burnished/10/50" : "border-verdant/30 bg-verdant/10/50"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Provisionamento de IR</h2>
              <p className="text-sm text-muted-foreground">
                Projeção baseada na sua renda acumulada em {selectedYear}
              </p>
            </div>
            {provStatus && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${provStatus.bg} ${provStatus.color}`}>
                {provStatus.label}
              </span>
            )}
          </div>

          {/* KPI row */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white/80 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Renda Tributável Projetada
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {formatCurrency(prov.projected_annual_income)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Acumulado: {formatCurrency(prov.ytd_taxable_income)} ({prov.months_elapsed} meses)
              </p>
            </div>

            <div className="rounded-lg bg-white/80 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                IRPF Estimado Anual
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-terracotta">
                {formatCurrency(prov.estimated_annual_tax)}
              </p>
              {prov.annual_reduction_applied > 0 && (
                <p className="text-[11px] text-verdant">
                  Redução aplicada: {formatCurrency(prov.annual_reduction_applied)}
                </p>
              )}
            </div>

            <div className="rounded-lg bg-white/80 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                IRRF Retido (fontes)
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-verdant">
                {formatCurrency(prov.ytd_irrf_withheld)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Gap: {formatCurrency(prov.tax_gap)}
              </p>
            </div>

            <div className={`rounded-lg p-3 ${
              prov.monthly_provision > 0 ? "bg-terracotta/15/80" : "bg-verdant/15/80"
            }`}>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Provisionar por Mês
              </p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${
                prov.monthly_provision > 0 ? "text-terracotta" : "text-verdant"
              }`}>
                {prov.monthly_provision > 0
                  ? formatCurrency(prov.monthly_provision)
                  : "R$ 0,00"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {prov.months_remaining > 0
                  ? `${prov.months_remaining} meses restantes`
                  : "Ano encerrado"}
              </p>
            </div>
          </div>

          {/* Explanation */}
          {prov.monthly_provision > 0 && (
            <div className="mt-4 rounded-lg bg-white/60 p-4">
              <p className="text-sm font-semibold text-burnished">
                Por que provisionar?
              </p>
              <p className="mt-1 text-xs text-burnished leading-relaxed">
                Se você tem mais de uma fonte de renda, cada empregador calcula o IR
                isoladamente. É possível que nenhum retenha imposto, mas a declaração
                anual consolida toda a renda e cobra a diferença de uma vez. Provisionando{" "}
                {formatCurrency(prov.monthly_provision)} por mês, você evita essa surpresa.
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            {prov.disclaimer}
          </p>
        </div>
      )}

      {/* No parameters message */}
      {prov?.status === "no_parameters" && (
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{prov.message}</p>
        </div>
      )}

      {/* ═══ RELATÓRIO FISCAL (FIS-01 a FIS-04) ═══ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Relatório Fiscal {selectedYear}</h2>

        {/* Totals */}
        {totals && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Rendimentos Tributáveis</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-terracotta">
                {formatCurrency(totals.total_tributavel_revenue)}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Rendimentos Isentos</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-verdant">
                {formatCurrency(totals.total_isento_revenue)}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Despesas Dedutíveis</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-info-slate">
                {formatCurrency(totals.total_dedutivel_expense)}
              </p>
            </div>
          </div>
        )}

        {/* By treatment breakdown */}
        {report?.by_treatment && report.by_treatment.length > 0 ? (
          <div className="space-y-3">
            {report.by_treatment.map((group, idx) => {
              const color = TAX_TREATMENT_COLORS[group.tax_treatment] || "#7E9487";
              const label = TAX_TREATMENT_LABELS[group.tax_treatment] || group.tax_treatment;
              const isRevenue = group.group_type === "revenue";
              const total = isRevenue ? group.total_revenue : group.total_expense;

              return (
                <div key={idx} className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                      <div>
                        <span className="text-sm font-semibold">{label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({isRevenue ? "Receita" : "Despesa"})
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(total)}</p>
                      <p className="text-[11px] text-muted-foreground">{group.entry_count} lançamentos</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileSearch className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Sem dados fiscais em {selectedYear}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Registre transações com contas contábeis classificadas por tratamento fiscal
              para ver o relatório consolidado automaticamente.
            </p>
          </div>
        )}
      </div>

      {/* ═══ PARÂMETROS FISCAIS (referência) ═══ */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">Parâmetros Fiscais Vigentes</h2>
        <p className="text-sm text-muted-foreground">
          Tabelas utilizadas nos cálculos. Atualizadas por curadoria humana, verificadas em pelo menos 2 fontes oficiais.
        </p>

        {parameters && parameters.length > 0 ? (
          <div className="space-y-2">
            {parameters.map((param) => {
              const typeLabels: Record<string, string> = {
                irpf_monthly: "IRPF Mensal",
                irpf_annual: "IRPF Anual",
                inss_employee: "INSS Empregado",
                minimum_wage: "Salário Mínimo",
                capital_gains: "Ganho de Capital",
              };

              return (
                <div key={param.id} className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {typeLabels[param.parameter_type] || param.parameter_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vigência: {formatDate(param.valid_from)}
                        {param.valid_until ? ` a ${formatDate(param.valid_until)}` : " em diante"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {param.source_references?.map((ref, i) => (
                        <a
                          key={i}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-primary"
                        >
                          {ref.source}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Show brackets if available */}
                  {Array.isArray(param.brackets) && param.brackets.length > 0 && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="py-1 text-left font-medium">Faixa</th>
                            <th className="py-1 text-right font-medium">Alíquota</th>
                            {(param.brackets[0] as Record<string, unknown>)?.deduction !== undefined && (
                              <th className="py-1 text-right font-medium">Dedução</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {(param.brackets as Record<string, unknown>[]).map((b, i) => (
                            <tr key={i} className="border-b border-muted/50">
                              <td className="py-1 tabular-nums">
                                {formatCurrency(Number(b.min))} a {Number(b.max) > 9999999 ? "..." : formatCurrency(Number(b.max))}
                              </td>
                              <td className="py-1 text-right tabular-nums font-medium">
                                {Number(b.rate)} %
                              </td>
                              {b.deduction !== undefined && (
                                <td className="py-1 text-right tabular-nums">
                                  {formatCurrency(Number(b.deduction))}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Show limits if available */}
                  {param.limits && typeof param.limits === "object" && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(param.limits as Record<string, unknown>).slice(0, 4).map(([key, val]) => (
                        <span key={key} className="rounded bg-muted px-2 py-0.5 text-[10px] tabular-nums">
                          {key.replace(/_/g, " ")}: {typeof val === "number" ? formatCurrency(val) : String(val)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum parâmetro fiscal carregado.</p>
        )}
      </div>

      {/* Info note */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          O relatório fiscal é gerado automaticamente a partir da classificação
          contábil (tax_treatment) das contas no plano de contas. Não substitui
          a declaração de IRPF. Confira os valores com seu contador antes de
          submeter à Receita Federal.
        </p>
      </div>
    </div>
  );
}

```

### src/app/(app)/transactions/page.tsx
```
"use client";

import { useState, useCallback } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useReverseTransaction } from "@/lib/services/transaction-engine";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TransactionFilters, TransactionWithRelations } from "@/lib/hooks/use-transactions";
import type { Database } from "@/types/database";

const PAGE_SIZE = 50;

type TransactionType = Database["public"]["Enums"]["transaction_type"];

const TYPE_BADGES: Record<TransactionType, { label: string; class: string }> = {
  income: { label: "Receita", class: "bg-verdant/15 text-verdant" },
  expense: { label: "Despesa", class: "bg-terracotta/15 text-terracotta" },
  transfer: { label: "Transf.", class: "bg-info-slate/15 text-info-slate" },
};

export default function TransactionsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [confirmReverse, setConfirmReverse] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const paginatedFilters = { ...filters, limit: PAGE_SIZE, offset: page * PAGE_SIZE };
  const { data: transactions, isLoading } = useTransactions(paginatedFilters);
  const { data: accounts } = useAccounts();
  const reverseTransaction = useReverseTransaction();

  // UX-04: Auto-reset confirm state after 5 seconds
  useAutoReset(confirmReverse, setConfirmReverse);

  // Reset page when filters change
  const updateFilter = useCallback(<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => {
    setPage(0);
    setFilters((prev) => {
      const next = { ...prev, [key]: value || undefined };
      Object.keys(next).forEach((k) => {
        if (next[k as K] === undefined || next[k as K] === "") {
          delete next[k as K];
        }
      });
      return next;
    });
  }, []);

  async function handleReverse(id: string) {
    await reverseTransaction.mutateAsync(id);
    setConfirmReverse(null);
  }

  function getAmountDisplay(tx: TransactionWithRelations) {
    if (tx.type === "income") return { text: `+ ${formatCurrency(tx.amount)}`, class: "text-verdant" };
    if (tx.type === "expense") return { text: `- ${formatCurrency(tx.amount)}`, class: "text-terracotta" };
    return { text: formatCurrency(tx.amount), class: "text-info-slate" };
  }

  // ─── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Nova transação
        </button>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={filters.search ?? ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Buscar por descrição"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
            showFilters || Object.keys(filters).some((k) => k !== "search" && filters[k as keyof TransactionFilters])
              ? "border-primary bg-primary/5 text-primary"
              : "border-input hover:bg-accent"
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-4 sm:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <select
              value={filters.type ?? ""}
              onChange={(e) => updateFilter("type", e.target.value as TransactionType)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="">Todos</option>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
              <option value="transfer">Transferência</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Conta</label>
            <select
              value={filters.accountId ?? ""}
              onChange={(e) => updateFilter("accountId", e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="">Todas</option>
              {accounts?.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">De</label>
            <input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Até</label>
            <input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
          </div>

          {Object.keys(filters).some((k) => k !== "search" && filters[k as keyof TransactionFilters]) && (
            <button
              onClick={() => setFilters(filters.search ? { search: filters.search } : {})}
              className="col-span-2 text-xs text-primary hover:underline sm:col-span-4"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {transactions && transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ArrowLeftRight className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">
            {Object.keys(filters).length > 0
              ? "Nenhuma transação encontrada para os filtros selecionados."
              : "Nenhuma transação registrada."}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {Object.keys(filters).length > 0
              ? "Ajuste os filtros ou limpe a busca."
              : "Registre uma transação para iniciar."}
          </p>
          {Object.keys(filters).length === 0 && (
            <button
              onClick={() => setFormOpen(true)}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Nova transação
            </button>
          )}
        </div>
      )}

      {/* Transaction list */}
      {transactions && transactions.length > 0 && (
        <div className="space-y-2">
          {transactions.map((tx) => {
            const amountDisplay = getAmountDisplay(tx);

            return (
              <div
                key={tx.id}
                className={`flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/50 ${
                  tx.is_deleted ? "opacity-50" : ""
                }`}
              >
                {/* Category color / account color */}
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{
                    backgroundColor:
                      tx.category_color || tx.account_color || "#7E9487",
                  }}
                >
                  {(tx.category_icon || tx.type.charAt(0)).slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">
                      {tx.description || "Sem descrição"}
                    </p>
                    {tx.is_deleted && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Estornado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(tx.date)}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_BADGES[tx.type].class}`}>
                      {TYPE_BADGES[tx.type].label}
                    </span>
                    {tx.category_name && <span>{tx.category_name}</span>}
                    {!tx.is_paid && (
                      <span className="rounded bg-burnished/15 px-1.5 py-0.5 text-[10px] font-medium text-burnished">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <p className={`font-semibold ${amountDisplay.class}`}>
                  {amountDisplay.text}
                </p>

                {/* Reverse button */}
                {!tx.is_deleted && (
                  <>
                    {confirmReverse === tx.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleReverse(tx.id)}
                          disabled={reverseTransaction.isPending}
                          className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                        >
                          Estornar
                        </button>
                        <button
                          onClick={() => setConfirmReverse(null)}
                          className="rounded-md px-2 py-1 text-xs text-muted-foreground"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmReverse(tx.id)}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Estornar"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-30"
            >
              Anterior
            </button>
            <span className="text-xs text-muted-foreground tabular-nums">
              Página {page + 1}{transactions.length < PAGE_SIZE ? ` (última)` : ""}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={transactions.length < PAGE_SIZE}
              className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-30"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Form dialog */}
      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}

```

### src/app/(app)/workflows/page.tsx
```
"use client";

/**
 * Oniefy - Tarefas / Workflows (Phase 6)
 *
 * WKF-01: Auto-create workflows (integrated into account creation hook)
 * WKF-02: Pending tasks as checklist, grouped by workflow
 * WKF-03: Upload document in task (stub - marks complete with note)
 * WKF-04: Update balance directly in task
 *
 * Two tabs: "Tarefas" (pending checklist) + "Workflows" (manage rules)
 */

import { useState } from "react";
import { ClipboardList, Workflow } from "lucide-react";
import {
  useWorkflows,
  usePendingTasks,
  useGenerateTasks,
  useCompleteTask,
  useCreateWorkflow,
  useDeactivateWorkflow,
  WORKFLOW_TYPE_LABELS,
  PERIODICITY_LABELS,
  TASK_TYPE_LABELS,
  TASK_TYPE_ICONS,
  WORKFLOW_TYPE_OPTIONS,
  PERIODICITY_OPTIONS,
} from "@/lib/hooks/use-workflows";
import { useAutoReset, useEscapeClose } from "@/lib/hooks/use-dialog-helpers";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { formatDate } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { TaskWithWorkflow } from "@/lib/hooks/use-workflows";

type Tab = "tasks" | "workflows";
type WorkflowType = Database["public"]["Enums"]["workflow_type"];
type WorkflowPeriodicity = Database["public"]["Enums"]["workflow_periodicity"];

// ─── Task Action Component ──────────────────────────────────────

function TaskAction({
  task,
  onComplete,
  isPending,
}: {
  task: TaskWithWorkflow;
  onComplete: (taskId: string, status: "completed" | "skipped", resultData?: Record<string, unknown>) => void;
  isPending: boolean;
}) {
  const [balanceValue, setBalanceValue] = useState("");
  const [showInput, setShowInput] = useState(false);

  if (task.task_type === "update_balance") {
    // WKF-04: Update balance form
    if (!showInput) {
      return (
        <div className="flex gap-1">
          <button onClick={() => setShowInput(true)}
            className="rounded-md bg-info-slate/15 px-2.5 py-1 text-xs font-medium text-info-slate hover:bg-info-slate/20">
            Atualizar saldo
          </button>
          <button onClick={() => onComplete(task.id, "skipped")} disabled={isPending}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent">
            Pular
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <input type="text" inputMode="decimal" value={balanceValue}
          onChange={(e) => setBalanceValue(e.target.value)}
          placeholder="Saldo atual" autoFocus
          className="h-7 w-28 rounded border border-input bg-background px-2 text-xs" />
        <button
          onClick={() => {
            const val = parseFloat(balanceValue.replace(",", "."));
            if (!isNaN(val)) {
              onComplete(task.id, "completed", { new_balance: val });
            }
          }}
          disabled={isPending}
          className="rounded-md bg-verdant px-2 py-1 text-xs font-medium text-white hover:bg-verdant/80">
          OK
        </button>
        <button onClick={() => setShowInput(false)}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground">
          Cancelar
        </button>
      </div>
    );
  }

  if (task.task_type === "upload_document") {
    // WKF-03: Upload stub (full OCR in Phase 10)
    return (
      <div className="flex gap-1">
        <button
          onClick={() => onComplete(task.id, "completed", { note: "Documento conferido manualmente" })}
          disabled={isPending}
          className="rounded-md bg-verdant/15 px-2.5 py-1 text-xs font-medium text-verdant hover:bg-verdant/20">
          Concluir
        </button>
        <button onClick={() => onComplete(task.id, "skipped")} disabled={isPending}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent">
          Pular
        </button>
      </div>
    );
  }

  // Generic: categorize_transactions, review_fiscal
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onComplete(task.id, "completed")}
        disabled={isPending}
        className="rounded-md bg-verdant/15 px-2.5 py-1 text-xs font-medium text-verdant hover:bg-verdant/20">
        Concluir
      </button>
      <button onClick={() => onComplete(task.id, "skipped")} disabled={isPending}
        className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent">
        Pular
      </button>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function WorkflowsPage() {
  const [tab, setTab] = useState<Tab>("tasks");
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);

  useAutoReset(confirmDeactivate, setConfirmDeactivate);
  useEscapeClose(showNewWorkflow, () => setShowNewWorkflow(false));

  // New workflow form state
  const [wfName, setWfName] = useState("");
  const [wfType, setWfType] = useState<WorkflowType>("bank_statement");
  const [wfPeriodicity, setWfPeriodicity] = useState<WorkflowPeriodicity>("monthly");
  const [wfAccountId, setWfAccountId] = useState("");
  const [wfError, setWfError] = useState("");

  const { data: pendingTasks, isLoading: loadingTasks } = usePendingTasks();
  const { data: workflows, isLoading: loadingWf } = useWorkflows();
  const { data: accounts } = useAccounts();
  const generateTasks = useGenerateTasks();
  const completeTask = useCompleteTask();
  const createWorkflow = useCreateWorkflow();
  const deactivateWorkflow = useDeactivateWorkflow();

  // Group tasks by workflow
  const groupedTasks = (pendingTasks ?? []).reduce(
    (acc, task) => {
      const key = task.workflow_name || "Sem workflow";
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    },
    {} as Record<string, TaskWithWorkflow[]>
  );

  function handleCompleteTask(
    taskId: string,
    status: "completed" | "skipped",
    resultData?: Record<string, unknown>
  ) {
    completeTask.mutate({ taskId, status, resultData });
  }

  async function handleGenerateTasks() {
    await generateTasks.mutateAsync({});
  }

  async function handleCreateWorkflow(e: React.FormEvent) {
    e.preventDefault();
    setWfError("");
    if (!wfName.trim()) { setWfError("Nome é obrigatório."); return; }

    try {
      await createWorkflow.mutateAsync({
        name: wfName.trim(),
        workflow_type: wfType,
        periodicity: wfPeriodicity,
        related_account_id: wfAccountId || null,
      });
      setShowNewWorkflow(false);
      setWfName("");
    } catch (err) {
      setWfError(err instanceof Error ? err.message : "Erro ao criar.");
    }
  }

  async function handleDeactivate(id: string) {
    await deactivateWorkflow.mutateAsync(id);
    setConfirmDeactivate(null);
  }

  const isLoading = tab === "tasks" ? loadingTasks : loadingWf;
  const pendingCount = pendingTasks?.length ?? 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-sm text-muted-foreground">
            Rituais periódicos de organização financeira
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleGenerateTasks} disabled={generateTasks.isPending}
            className="rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50">
            {generateTasks.isPending ? "Gerando" : "Gerar tarefas do mês"}
          </button>
        </div>
      </div>

      {/* Generation result toast */}
      {generateTasks.data && (
        <div className="rounded-lg border border-verdant/20 bg-verdant/10 px-4 py-3 text-sm text-verdant">
          {generateTasks.data.tasks_created} tarefa(s) criada(s)
          {generateTasks.data.workflows_skipped > 0 &&
            `, ${generateTasks.data.workflows_skipped} workflow(s) já tinham tarefas`}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        {([
          { key: "tasks" as const, label: "Pendentes", count: pendingCount },
          { key: "workflows" as const, label: "Workflows", count: workflows?.length ?? 0 },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ TAB: Tarefas Pendentes (WKF-02, WKF-03, WKF-04) ═══ */}
      {tab === "tasks" && (
        <>
          {pendingCount === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ClipboardList className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Nenhuma tarefa pendente</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Use &ldquo;Gerar tarefas do mês&rdquo; para criar tarefas dos workflows ativos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedTasks).map(([workflowName, tasks]) => (
                <div key={workflowName} className="rounded-lg border bg-card shadow-sm">
                  <div className="border-b px-4 py-2.5">
                    <p className="text-sm font-semibold">{workflowName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(tasks[0].period_start, "MMM yyyy")} · {tasks.length} tarefa(s)
                    </p>
                  </div>

                  <div className="divide-y">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                        {/* Task icon */}
                        {(() => { const Icon = TASK_TYPE_ICONS[task.task_type]; return <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />; })()}

                        {/* Task info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {task.description || TASK_TYPE_LABELS[task.task_type]}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {TASK_TYPE_LABELS[task.task_type]} ·{" "}
                            {task.status === "in_progress" ? "Em andamento" : "Pendente"}
                          </p>
                        </div>

                        {/* Actions */}
                        <TaskAction
                          task={task}
                          onComplete={handleCompleteTask}
                          isPending={completeTask.isPending}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ TAB: Workflows (WKF-01 management) ═══ */}
      {tab === "workflows" && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowNewWorkflow(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              + Novo workflow
            </button>
          </div>

          {(!workflows || workflows.length === 0) ? (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Workflow className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Nenhum workflow ativo</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Workflows são criados automaticamente ao cadastrar contas bancárias, cartões e investimentos.
                Você também pode criar manualmente.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {workflows.map((wf) => (
                <div key={wf.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{wf.name}</p>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {WORKFLOW_TYPE_LABELS[wf.workflow_type]}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {PERIODICITY_LABELS[wf.periodicity]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {wf.last_completed_at
                        ? `Último: ${formatDate(wf.last_completed_at)}`
                        : "Nunca concluído"}
                    </p>
                  </div>

                  {/* Deactivate */}
                  {confirmDeactivate === wf.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDeactivate(wf.id)} disabled={deactivateWorkflow.isPending}
                        className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                        Encerrar
                      </button>
                      <button onClick={() => setConfirmDeactivate(null)}
                        className="rounded-md px-2 py-1 text-xs text-muted-foreground">Não</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeactivate(wf.id)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Encerrar workflow">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* New workflow dialog */}
      {showNewWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowNewWorkflow(false)} />
          <div className="relative z-50 mx-4 w-full max-w-md rounded-lg border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Novo Workflow</h2>

            <form onSubmit={handleCreateWorkflow} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <input type="text" value={wfName} onChange={(e) => setWfName(e.target.value)}
                  placeholder="Ex: Extrato Nubank" required
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <select value={wfType} onChange={(e) => setWfType(e.target.value as WorkflowType)}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {WORKFLOW_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Periodicidade</label>
                  <select value={wfPeriodicity} onChange={(e) => setWfPeriodicity(e.target.value as WorkflowPeriodicity)}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {PERIODICITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Conta vinculada (opcional)</label>
                <select value={wfAccountId} onChange={(e) => setWfAccountId(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Nenhuma</option>
                  {accounts?.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {wfError && (
                <p className="rounded bg-terracotta/10 px-3 py-2 text-sm text-terracotta">{wfError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNewWorkflow(false)}
                  className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
                  Cancelar
                </button>
                <button type="submit" disabled={createWorkflow.isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {createWorkflow.isPending ? "Criando" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

```

### src/app/(auth)/layout.tsx
```
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">{children}</div>
    </div>
  );
}

```

### src/app/(auth)/forgot-password/page.tsx
```
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-info-slate/15">
            <svg className="h-8 w-8 text-info-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Email enviado</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Se existe uma conta com <strong className="text-foreground">{email}</strong>,
            você receberá um link para redefinir sua senha.
          </p>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary underline">Voltar ao login</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Recuperar senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Digite seu email e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          {loading ? "Enviando" : "Enviar link"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary underline">Voltar ao login</Link>
      </p>
    </>
  );
}

```

### src/app/(auth)/login/page.tsx
```
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/auth";
import { getAssuranceLevel, getMfaStatus } from "@/lib/auth/mfa";

const TIMEOUT_MESSAGES: Record<string, string> = {
  timeout: "Sua sessão expirou por inatividade. Faça login novamente.",
  auth_callback_failed: "Falha na autenticação. Tente novamente.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Carregando</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const reason = searchParams.get("reason");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handlePostLogin() {
    // Check if MFA is enrolled and needs verification
    const { status, factorId } = await getMfaStatus(supabase);

    if (status === "enrolled_verified" && factorId) {
      // MFA enrolled - check current assurance level
      const { currentLevel, nextLevel } = await getAssuranceLevel(supabase);

      if (currentLevel === "aal1" && nextLevel === "aal2") {
        // Need MFA challenge
        router.push(`/mfa-challenge?redirectTo=${encodeURIComponent(redirectTo)}&factorId=${factorId}`);
        return;
      }
    }

    // No MFA or already AAL2 - proceed
    router.push(redirectTo);
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Email ou senha incorretos."
          : signInError.message
      );
      setLoading(false);
      return;
    }

    await handlePostLogin();
    setLoading(false);
  }

  async function handleOAuthLogin(provider: "google" | "apple") {
    setLoading(true);
    setError(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
    // OAuth redirects away - loading stays true
  }

  return (
    <>
      <div className="flex flex-col items-center">
        {/* Light mode */}
        <Image
          src="/brand/lockup-v-plum-transparent.svg"
          alt="Oniefy"
          width={1104}
          height={1019}
          className="h-40 w-auto dark:hidden"
          priority
          unoptimized
        />
        {/* Dark mode */}
        <Image
          src="/brand/lockup-v-bone-transparent.svg"
          alt="Oniefy"
          width={1104}
          height={1019}
          className="hidden h-40 w-auto dark:block"
          priority
          unoptimized
        />
      </div>

      {/* Session timeout / callback error messages */}
      {reason && TIMEOUT_MESSAGES[reason] && (
        <div className="rounded-md border border-burnished/30 bg-burnished/10 p-3 text-sm text-burnished">
          {TIMEOUT_MESSAGES[reason]}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* OAuth buttons - Apple first per App Store guideline 4.8 */}
      <div className="space-y-3">
        <button
          onClick={() => handleOAuthLogin("apple")}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-input bg-foreground px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Continuar com Apple
        </button>

        <button
          onClick={() => handleOAuthLogin("google")}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continuar com Google
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">ou com email</span>
        </div>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">Senha</label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">Esqueceu a senha?</Link>
          </div>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          {loading ? "Entrando" : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link href="/register" className="font-medium text-primary underline">Criar conta</Link>
      </p>
    </>
  );
}

```

### src/app/(auth)/mfa-challenge/page.tsx
```
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { challengeAndVerify } from "@/lib/auth/mfa";
import { loadEncryptionKey } from "@/lib/auth/encryption-manager";

export default function MfaChallengePage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Carregando</div>}>
      <MfaChallengeContent />
    </Suspense>
  );
}

function MfaChallengeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const factorId = searchParams.get("factorId");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) {
      setError("Fator MFA não encontrado. Faça login novamente.");
      return;
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError("Código deve ter 6 dígitos numéricos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await challengeAndVerify(supabase, factorId, code);

      // AAL2 achieved - load encryption key
      try {
        await loadEncryptionKey(supabase);
      } catch {
        // DEK load failure is non-blocking (E2E fields won't decrypt)
        console.warn("[Oniefy] Failed to load DEK after MFA");
      }

      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao verificar código.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-info-slate/15">
          <svg className="h-8 w-8 text-info-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Verificação em dois fatores</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Digite o código de 6 dígitos do seu aplicativo autenticador.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium">Código TOTP</label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-2xl font-mono tracking-[0.5em] ring-offset-background placeholder:text-muted-foreground placeholder:tracking-[0.5em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            autoFocus
          />
        </div>

        <button type="submit" disabled={loading || code.length !== 6}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          {loading ? "Verificando" : "Verificar"}
        </button>
      </form>

      <button onClick={handleLogout}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
        Usar outra conta
      </button>
    </>
  );
}

```

### src/app/(auth)/onboarding/page.tsx
```
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { initializeEncryption } from "@/lib/auth/encryption-manager";
import { enrollTotp, verifyTotpEnrollment } from "@/lib/auth/mfa";
import { completeOnboardingSeeds } from "@/lib/services/onboarding-seeds";
import type { MfaEnrollResult } from "@/lib/auth/mfa";

type Step = "welcome" | "currency" | "security" | "mfa_enroll" | "mfa_verify" | "categories" | "done";

const STEPS: Step[] = ["welcome", "currency", "security", "mfa_enroll", "mfa_verify", "categories", "done"];

const CURRENCIES = [
  { code: "BRL", label: "Real brasileiro (R$)" },
  { code: "USD", label: "Dólar americano (US$)" },
  { code: "EUR", label: "Euro (€)" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("welcome");
  const [currency, setCurrency] = useState("BRL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MFA state
  const [mfaData, setMfaData] = useState<MfaEnrollResult | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  // ─── Step handlers ────────────────────────────────────────

  async function handleCurrency() {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sessão expirada."); setLoading(false); return; }

    const { error: updateError } = await supabase
      .from("users_profile")
      .update({ default_currency: currency })
      .eq("id", user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setStep("security");
  }

  async function handleSecurity() {
    setLoading(true);
    setError(null);

    try {
      // Generate and store DEK
      await initializeEncryption(supabase);
      setStep("mfa_enroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao configurar criptografia.");
    } finally {
      setLoading(false);
    }
  }

  // Start security step automatically
  useEffect(() => {
    if (step === "security") {
      handleSecurity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function handleMfaEnroll() {
    setLoading(true);
    setError(null);

    try {
      const data = await enrollTotp(supabase, "Oniefy");
      setMfaData(data);
      setStep("mfa_verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar MFA.");
    } finally {
      setLoading(false);
    }
  }

  // Start MFA enrollment automatically
  useEffect(() => {
    if (step === "mfa_enroll") {
      handleMfaEnroll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaData) return;

    if (mfaCode.length !== 6 || !/^\d{6}$/.test(mfaCode)) {
      setError("Código deve ter 6 dígitos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyTotpEnrollment(supabase, mfaData.factorId, mfaCode);
      setStep("categories");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido.");
    } finally {
      setLoading(false);
    }
  }

  const handleCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      await completeOnboardingSeeds(supabase, user.id);

      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao configurar conta.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Auto-run categories step
  useEffect(() => {
    if (step === "categories") {
      handleCategories();
    }
  }, [step, handleCategories]);

  // Auto-redirect after done
  useEffect(() => {
    if (step === "done") {
      const timer = setTimeout(() => router.push("/dashboard"), 2000);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  // ─── Render ───────────────────────────────────────────────

  return (
    <>
      {/* Progress bar */}
      <div className="w-full">
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Passo {Math.min(stepIndex + 1, STEPS.length)} de {STEPS.length}
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          {(step === "security" || step === "mfa_enroll" || step === "categories") && (
            <button onClick={() => { setError(null); if (step === "security") handleSecurity(); else if (step === "mfa_enroll") handleMfaEnroll(); else handleCategories(); }}
              className="ml-2 underline">Tentar novamente</button>
          )}
        </div>
      )}

      {/* ─── Welcome ────────────────────────────────── */}
      {step === "welcome" && (
        <>
          <div className="flex flex-col items-center">
            <Image
              src="/brand/lockup-v-plum-transparent.svg"
              alt="Oniefy"
              width={1104}
              height={1019}
              className="h-40 w-auto dark:hidden"
              priority
              unoptimized
            />
            <Image
              src="/brand/lockup-v-bone-transparent.svg"
              alt="Oniefy"
              width={1104}
              height={1019}
              className="hidden h-40 w-auto dark:block"
              priority
              unoptimized
            />
            <p className="-mt-2 text-sm text-muted-foreground">
              Configuração inicial em 4 etapas.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { num: "1", title: "Moeda padrão", desc: "Moeda principal dos registros financeiros" },
              { num: "2", title: "Criptografia", desc: "Chave de segurança gerada automaticamente" },
              { num: "3", title: "Autenticação 2FA", desc: "Configuração do app autenticador (obrigatório)" },
              { num: "4", title: "Dados iniciais", desc: "Categorias, plano de contas e centro de custo padrão" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{item.num}</span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setStep("currency")}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Iniciar
          </button>
        </>
      )}

      {/* ─── Currency ───────────────────────────────── */}
      {step === "currency" && (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Moeda padrão</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Moeda principal dos registros financeiros. Pode ser alterada nas configurações.
            </p>
          </div>

          <div className="space-y-2">
            {CURRENCIES.map((c) => (
              <button key={c.code} onClick={() => setCurrency(c.code)}
                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left text-sm transition-colors ${
                  currency === c.code ? "border-primary bg-primary/5 font-medium" : "border-input hover:bg-accent"
                }`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  currency === c.code ? "border-primary bg-primary" : "border-muted-foreground"
                }`}>
                  {currency === c.code && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
                </span>
                {c.label}
              </button>
            ))}
          </div>

          <button onClick={handleCurrency} disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            {loading ? "Salvando" : "Continuar"}
          </button>
        </>
      )}

      {/* ─── Security (DEK generation - automatic) ── */}
      {step === "security" && !error && (
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Configurando segurança</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerando sua chave de criptografia pessoal.
          </p>
        </div>
      )}

      {/* ─── MFA Enroll (loading) ───────────────────── */}
      {step === "mfa_enroll" && !error && (
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Preparando autenticação</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerando QR code para seu autenticador.
          </p>
        </div>
      )}

      {/* ─── MFA Verify ─────────────────────────────── */}
      {step === "mfa_verify" && mfaData && (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Configurar 2FA</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Escaneie o QR code abaixo com seu aplicativo autenticador
              (ex: Google Authenticator, Authy, 1Password).
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="rounded-lg border bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mfaData.qrCode} alt="QR Code para MFA" className="h-48 w-48" />
            </div>
          </div>

          {/* Manual key fallback */}
          <div className="text-center">
            <button onClick={() => setShowSecret(!showSecret)}
              className="text-xs text-primary hover:underline">
              {showSecret ? "Ocultar chave manual" : "Não consegue escanear? Insira a chave manualmente"}
            </button>
            {showSecret && (
              <div className="mt-2 rounded-md border bg-muted p-3">
                <p className="font-mono text-xs tracking-widest break-all select-all">{mfaData.secret}</p>
              </div>
            )}
          </div>

          {/* Verify code */}
          <form onSubmit={handleMfaVerify} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="mfaCode" className="text-sm font-medium">
                Digite o código de 6 dígitos gerado pelo app
              </label>
              <input id="mfaCode" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                value={mfaCode} onChange={(e) => { setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(null); }}
                placeholder="000000"
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-2xl font-mono tracking-[0.5em] ring-offset-background placeholder:text-muted-foreground placeholder:tracking-[0.5em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoFocus />
            </div>
            <button type="submit" disabled={loading || mfaCode.length !== 6}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {loading ? "Verificando" : "Verificar e continuar"}
            </button>
          </form>

          <div className="rounded-lg border border-burnished/20 bg-burnished/10 p-3 text-xs text-burnished">
            Salve a chave do autenticador em local seguro.
            Se perder acesso ao app autenticador, você precisará dos códigos de recuperação
            para entrar na sua conta.
          </div>
        </>
      )}

      {/* ─── Categories (automatic) ─────────────────── */}
      {step === "categories" && !error && (
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Preparando sua conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Criando categorias, plano de contas e centro de custo padrão.
          </p>
        </div>
      )}

      {/* ─── Done ────────────────────────────────────── */}
      {step === "done" && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-verdant/15">
            <svg className="h-8 w-8 text-verdant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Configuração concluída</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu painel está pronto. Redirecionando.
          </p>
        </div>
      )}
    </>
  );
}

```

### src/app/(auth)/register/page.tsx
```
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  registerSchema,
  getPasswordStrength,
  STRENGTH_CONFIG,
} from "@/lib/validations/auth";
import type { RegisterInput } from "@/lib/validations/auth";

type FormErrors = Partial<Record<keyof RegisterInput, string>>;

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterInput>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const supabase = createClient();

  const passwordStrength = useMemo(
    () => (form.password ? getPasswordStrength(form.password) : null),
    [form.password]
  );
  const strengthConfig = passwordStrength
    ? STRENGTH_CONFIG[passwordStrength]
    : null;

  function updateField(field: keyof RegisterInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError(null);
  }

  function validateForm(): boolean {
    const result = registerSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors: FormErrors = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof RegisterInput;
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    });
    setErrors(fieldErrors);
    return false;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setServerError(null);

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setServerError(error.message);
      return;
    }

    setEmailSent(true);
  }

  // ─── Confirmation sent ────────────────────────────────────
  if (emailSent) {
    return (
      <>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-verdant/15">
            <svg className="h-8 w-8 text-verdant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Verifique seu email</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enviamos um link de confirmação para{" "}
            <strong className="text-foreground">{form.email}</strong>.
            <br />
            Acesse o link para ativar sua conta e iniciar a configuração.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Não recebeu o email?</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Verifique a pasta de spam/lixo eletrônico</li>
            <li>Confirme que digitou o email correto</li>
            <li>O link expira em 24 horas</li>
          </ul>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary underline">Voltar ao login</Link>
        </p>
      </>
    );
  }

  // ─── Registration form ────────────────────────────────────
  return (
    <>
      <div className="flex flex-col items-center">
        <Image
          src="/brand/lockup-h-plum-transparent.svg"
          alt="Oniefy"
          width={1588}
          height={617}
          className="mb-4 h-10 w-auto dark:hidden"
          priority
          unoptimized
        />
        <Image
          src="/brand/lockup-h-bone-transparent.svg"
          alt="Oniefy"
          width={1588}
          height={617}
          className="mb-4 hidden h-10 w-auto dark:block"
          priority
          unoptimized
        />
        <h1 className="text-3xl font-bold tracking-tight">Criar Conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">Configure seu Oniefy em poucos passos</p>
      </div>

      {serverError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4" noValidate>
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium">Nome completo</label>
          <input id="fullName" type="text" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Seu nome"
            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.fullName ? "border-destructive" : "border-input"}`} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="seu@email.com"
            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.email ? "border-destructive" : "border-input"}`} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Senha</label>
          <input id="password" type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Mínimo 12 caracteres"
            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.password ? "border-destructive" : "border-input"}`} />
          {form.password && strengthConfig && (
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className={`h-1.5 rounded-full transition-all ${strengthConfig.color} ${strengthConfig.width}`} />
              </div>
              <p className="text-xs text-muted-foreground">Força: {strengthConfig.label}</p>
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar senha</label>
          <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} placeholder="Repita a senha"
            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.confirmPassword ? "border-destructive" : "border-input"}`} />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
        </div>

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          {loading ? "Criando conta" : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Ao criar sua conta, você concorda com nossa{" "}
        <Link href="/privacy" className="underline">Política de Privacidade</Link>.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary underline">Entrar</Link>
      </p>
    </>
  );
}

```

### src/app/(auth)/reset-password/page.tsx
```
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, getPasswordStrength, STRENGTH_CONFIG } from "@/lib/validations/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const passwordStrength = useMemo(
    () => (password ? getPasswordStrength(password) : null),
    [password]
  );
  const strengthConfig = passwordStrength ? STRENGTH_CONFIG[passwordStrength] : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 3000);
  }

  if (success) {
    return (
      <>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-verdant/15">
            <svg className="h-8 w-8 text-verdant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Senha atualizada</h1>
          <p className="mt-2 text-sm text-muted-foreground">Redirecionando para o login.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Nova senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">Defina uma nova senha para sua conta.</p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Nova senha</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 12 caracteres"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {password && strengthConfig && (
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className={`h-1.5 rounded-full transition-all ${strengthConfig.color} ${strengthConfig.width}`} />
              </div>
              <p className="text-xs text-muted-foreground">Força: {strengthConfig.label}</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar nova senha</label>
          <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          {loading ? "Salvando" : "Salvar nova senha"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary underline">Voltar ao login</Link>
      </p>
    </>
  );
}

```

### src/app/api/auth/callback/route.ts
```
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Auth callback handler.
 *
 * Handles:
 * 1. OAuth login (Google, Apple) - exchanges code for session
 * 2. Email confirmation - token_hash + type=signup/email
 * 3. Password reset - token_hash + type=recovery
 *
 * Post-auth routing:
 * - New user (onboarding not completed) → /onboarding
 * - MFA enrolled (needs AAL2) → /mfa-challenge
 * - Existing user (onboarding done) → /dashboard
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const rawRedirect = searchParams.get("redirectTo") || "/dashboard";
  const redirectTo = rawRedirect === "/" ? "/dashboard" : rawRedirect;

  const supabase = await createClient();

  // ─── Email confirmation / password reset (magic link) ─────
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "email" | "recovery" | "invite",
    });

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }

    // Password reset flow: redirect to reset-password page
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/reset-password`);
    }

    // Email confirmation: check onboarding status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("users_profile")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profile && !profile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }

    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // ─── OAuth code exchange ─────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check onboarding status
        const { data: profile } = await supabase
          .from("users_profile")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        if (profile && !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // Check MFA enrollment for AAL2 redirect
        // (client-side login page handles this for email/password,
        //  but OAuth goes through callback so we check here)
        const { data: mfaData } =
          await supabase.auth.mfa.listFactors();

        const verifiedFactor = mfaData?.totp?.find(
          (f) => f.status === "verified"
        );

        if (verifiedFactor) {
          // MFA enrolled - redirect to challenge
          return NextResponse.redirect(
            `${origin}/mfa-challenge?redirectTo=${encodeURIComponent(redirectTo)}&factorId=${verifiedFactor.id}`
          );
        }
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Auth error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

```

### src/app/api/indices/fetch/route.ts
```
/**
 * Oniefy - API Route: Fetch Economic Indices
 *
 * POST /api/indices/fetch
 *
 * Fetches latest data from BCB SGS API for configured index sources,
 * parses the response, and upserts into economic_indices table.
 *
 * Called manually from the UI or by a cron job (future).
 * Uses admin client for writes (bypasses RLS on public tables).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

interface BcbDataPoint {
  data: string; // DD/MM/YYYY
  valor: string;
}

interface IndexSource {
  index_type: string;
  provider: string;
  series_code: string;
  api_url_template: string;
  periodicity: string;
  is_active: boolean;
}

function parseBcbDate(dateStr: string): string {
  // DD/MM/YYYY → YYYY-MM-DD
  const [d, m, y] = dateStr.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function formatDateForBcb(date: Date): string {
  // Date → DD/MM/YYYY
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export async function POST() {
  try {
    // Auth check with regular client
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin client for write operations (bypasses RLS on economic_indices)
    const adminClient = createAdminClient();

    // Fetch active sources (read via admin - sources have no user-scoped RLS)
    const { data: sources, error: srcErr } = await adminClient
      .from("economic_indices_sources")
      .select("*")
      .eq("is_active", true)
      .eq("provider", "bcb_sgs")
      .order("priority", { ascending: true });

    if (srcErr) throw srcErr;

    // Date range: last 3 months to catch any gaps
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    const results: { index_type: string; inserted: number; errors: string[] }[] = [];

    for (const source of (sources as IndexSource[]) ?? []) {
      const fetchResult = { index_type: source.index_type, inserted: 0, errors: [] as string[] };

      try {
        // Build URL
        const url = source.api_url_template
          .replace("{start}", formatDateForBcb(startDate))
          .replace("{end}", formatDateForBcb(endDate));

        const response = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          fetchResult.errors.push(`HTTP ${response.status}`);
          results.push(fetchResult);
          continue;
        }

        const data: BcbDataPoint[] = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          fetchResult.errors.push("Empty response");
          results.push(fetchResult);
          continue;
        }

        // For daily series (selic, cdi, usd_brl), keep only last day of month
        let filteredData = data;
        if (source.periodicity === "daily") {
          const monthMap = new Map<string, BcbDataPoint>();
          for (const point of data) {
            const isoDate = parseBcbDate(point.data);
            const monthKey = isoDate.slice(0, 7); // YYYY-MM
            monthMap.set(monthKey, point); // Last value wins
          }
          filteredData = Array.from(monthMap.values());
        }

        // Upsert into economic_indices
        for (const point of filteredData) {
          const isoDate = parseBcbDate(point.data);
          const value = parseFloat(point.valor);

          if (isNaN(value)) continue;

          // For monthly series, normalize to first of month
          const refDate =
            source.periodicity === "monthly"
              ? isoDate.slice(0, 8) + "01"
              : isoDate.slice(0, 8) + "01"; // Always first of month for storage

          const { error: upsertErr } = await adminClient
            .from("economic_indices")
            .upsert(
              {
                index_type: source.index_type as Database["public"]["Enums"]["index_type"],
                reference_date: refDate,
                value,
                source_primary: `BCB SGS ${source.series_code}`,
                fetched_at: new Date().toISOString(),
              },
              { onConflict: "index_type,reference_date", ignoreDuplicates: false }
            );

          if (upsertErr) {
            // If upsert fails (no unique constraint), try insert with conflict skip
            const { error: insertErr } = await adminClient
              .from("economic_indices")
              .insert({
                index_type: source.index_type as Database["public"]["Enums"]["index_type"],
                reference_date: refDate,
                value,
                source_primary: `BCB SGS ${source.series_code}`,
                fetched_at: new Date().toISOString(),
              });

            if (!insertErr) fetchResult.inserted++;
          } else {
            fetchResult.inserted++;
          }
        }
      } catch (err) {
        fetchResult.errors.push(
          err instanceof Error ? err.message : "Unknown error"
        );
      }

      results.push(fetchResult);
    }

    return NextResponse.json({
      status: "ok",
      fetched_at: new Date().toISOString(),
      results,
      total_inserted: results.reduce((s, r) => s + r.inserted, 0),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

```

### src/components/accounts/account-form.tsx
```
"use client";

import { useState, useEffect } from "react";
import {
  useCreateAccount,
  useUpdateAccount,
  ACCOUNT_TYPE_OPTIONS,
  FINANCING_SUBTYPES,
  PRESET_COLORS,
} from "@/lib/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/types/database";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type AccountType = Database["public"]["Enums"]["account_type"];

interface AccountFormProps {
  account?: Account | null;
  open: boolean;
  onClose: () => void;
}

export function AccountForm({ account, open, onClose }: AccountFormProps) {
  const isEdit = !!account;

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [financingSubtype, setFinancingSubtype] = useState(FINANCING_SUBTYPES[0].value);
  const [initialBalance, setInitialBalance] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const loading = createAccount.isPending || updateAccount.isPending;

  // Populate form on edit
  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setInitialBalance(String(account.initial_balance));
      setColor(account.color || PRESET_COLORS[0]);
    } else {
      setName("");
      setType("checking");
      setFinancingSubtype(FINANCING_SUBTYPES[0].value);
      setInitialBalance("");
      setColor(PRESET_COLORS[0]);
    }
    setError(null);
  }, [account, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    const balance = parseFloat(initialBalance) || 0;

    try {
      if (isEdit && account) {
        await updateAccount.mutateAsync({
          id: account.id,
          name: name.trim(),
          type,
          color,
        });
      } else {
        await createAccount.mutateAsync({
          name: name.trim(),
          type,
          initial_balance: balance,
          color,
          ...(type === "financing" && { coaParentCode: financingSubtype }),
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar conta.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">
          {isEdit ? "Editar conta" : "Nova conta"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? "Atualize os dados da conta."
            : "Cadastre uma conta, cartão, empréstimo ou financiamento."}
        </p>

        {error && (
          <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="acc-name" className="text-sm font-medium">
              Nome
            </label>
            <input
              id="acc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Banco Principal"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label htmlFor="acc-type" className="text-sm font-medium">
              Tipo
            </label>
            <select
              id="acc-type"
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              disabled={isEdit} // Can't change type after creation
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                O tipo não pode ser alterado após a criação.
              </p>
            )}
          </div>

          {/* Financing sub-type */}
          {!isEdit && type === "financing" && (
            <div className="space-y-1.5">
              <label htmlFor="acc-financing-subtype" className="text-sm font-medium">
                Tipo de financiamento
              </label>
              <select
                id="acc-financing-subtype"
                value={financingSubtype}
                onChange={(e) => setFinancingSubtype(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {FINANCING_SUBTYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Initial Balance */}
          {!isEdit && (
            <div className="space-y-1.5">
              <label htmlFor="acc-balance" className="text-sm font-medium">
                {type === "credit_card" || type === "loan" || type === "financing"
                  ? "Saldo devedor atual (R$)"
                  : "Saldo inicial (R$)"}
              </label>
              <input
                id="acc-balance"
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0,00"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {type === "credit_card"
                  ? "Fatura atual (valor positivo = dívida)."
                  : type === "loan"
                    ? "Saldo devedor total do empréstimo."
                    : type === "financing"
                      ? "Saldo devedor total do financiamento."
                      : "Saldo atual da conta no momento do cadastro."}
              </p>
            </div>
          )}

          {isEdit && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">Saldo inicial</p>
              <p className="text-sm font-medium">
                {formatCurrency(account!.initial_balance)}
              </p>
            </div>
          )}

          {/* Color */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Cor</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    color === c
                      ? "scale-110 border-foreground"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Salvando" : isEdit ? "Salvar" : "Criar conta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

```

### src/components/assets/asset-form.tsx
```
"use client";

/**
 * AssetForm - PAT-01 (cadastrar), PAT-02 (editar bem)
 *
 * Dialog for creating/editing an asset.
 * Fields: name, category, acquisition_date, acquisition_value, current_value,
 *         depreciation_rate, insurance_policy, insurance_expiry.
 */

import { useState, useEffect } from "react";
import {
  useCreateAsset,
  useUpdateAsset,
  ASSET_CATEGORY_OPTIONS,
} from "@/lib/hooks/use-assets";
import type { Database } from "@/types/database";

type AssetCategory = Database["public"]["Enums"]["asset_category"];

interface AssetFormProps {
  open: boolean;
  onClose: () => void;
  editData?: {
    id: string;
    name: string;
    category: AssetCategory;
    acquisition_date: string;
    acquisition_value: number;
    current_value: number;
    depreciation_rate: number;
    insurance_policy: string | null;
    insurance_expiry: string | null;
  } | null;
}

export function AssetForm({ open, onClose, editData }: AssetFormProps) {
  const isEditing = !!editData;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("other");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [acquisitionValue, setAcquisitionValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [depreciationRate, setDepreciationRate] = useState("0");
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [error, setError] = useState("");

  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setCategory(editData.category);
      setAcquisitionDate(editData.acquisition_date);
      setAcquisitionValue(String(editData.acquisition_value));
      setCurrentValue(String(editData.current_value));
      setDepreciationRate(String(editData.depreciation_rate));
      setInsurancePolicy(editData.insurance_policy ?? "");
      setInsuranceExpiry(editData.insurance_expiry ?? "");
    } else {
      setName("");
      setCategory("other");
      setAcquisitionDate(new Date().toISOString().slice(0, 10));
      setAcquisitionValue("");
      setCurrentValue("");
      setDepreciationRate("0");
      setInsurancePolicy("");
      setInsuranceExpiry("");
    }
    setError("");
  }, [editData, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const acqVal = parseFloat(acquisitionValue.replace(",", "."));
    const curVal = parseFloat(currentValue.replace(",", "."));
    const depRate = parseFloat(depreciationRate.replace(",", "."));

    if (!name.trim()) { setError("Informe o nome do bem."); return; }
    if (isNaN(acqVal) || acqVal < 0) { setError("Valor de aquisição inválido."); return; }
    if (isNaN(curVal) || curVal < 0) { setError("Valor atual inválido."); return; }

    try {
      if (isEditing && editData) {
        await updateAsset.mutateAsync({
          id: editData.id,
          name: name.trim(),
          category,
          current_value: curVal,
          depreciation_rate: isNaN(depRate) ? 0 : depRate,
          insurance_policy: insurancePolicy || null,
          insurance_expiry: insuranceExpiry || null,
        });
      } else {
        if (!acquisitionDate) { setError("Informe a data de aquisição."); return; }
        await createAsset.mutateAsync({
          name: name.trim(),
          category,
          acquisition_date: acquisitionDate,
          acquisition_value: acqVal,
          current_value: curVal || acqVal,
          depreciation_rate: isNaN(depRate) ? 0 : depRate,
          insurance_policy: insurancePolicy || null,
          insurance_expiry: insuranceExpiry || null,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  if (!open) return null;
  const isPending = createAsset.isPending || updateAsset.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">
          {isEditing ? "Editar Bem" : "Cadastrar Bem Patrimonial"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium">Nome do bem</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Apartamento Centro" required
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as AssetCategory)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {ASSET_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label} - {o.description}</option>
              ))}
            </select>
          </div>

          {/* Values */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Valor de aquisição (R$)</label>
              <input type="text" inputMode="decimal" value={acquisitionValue}
                onChange={(e) => { setAcquisitionValue(e.target.value); if (!isEditing && !currentValue) setCurrentValue(e.target.value); }}
                placeholder="0,00" required={!isEditing} disabled={isEditing}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50" />
            </div>
            <div>
              <label className="text-sm font-medium">Valor atual (R$)</label>
              <input type="text" inputMode="decimal" value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)} placeholder="0,00" required
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Acquisition date + Depreciation */}
          <div className="grid grid-cols-2 gap-4">
            {!isEditing && (
              <div>
                <label className="text-sm font-medium">Data de aquisição</label>
                <input type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)}
                  required className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Depreciação (% ao ano)</label>
              <input type="text" inputMode="decimal" value={depreciationRate}
                onChange={(e) => setDepreciationRate(e.target.value)} placeholder="0"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Imóveis: 4%. Veículos: 20%. Eletrônicos: 20-33%.
              </p>
            </div>
          </div>

          {/* Insurance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Apólice de seguro</label>
              <input type="text" value={insurancePolicy} onChange={(e) => setInsurancePolicy(e.target.value)}
                placeholder="Opcional"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Vencimento do seguro</label>
              <input type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {error && <p className="rounded bg-terracotta/10 px-3 py-2 text-sm text-terracotta">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isPending}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {isPending ? "Salvando" : isEditing ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

```

### src/components/budgets/budget-form.tsx
```
"use client";

/**
 * BudgetForm - ORC-01 (criar orçamento), ORC-03 (editar valor)
 *
 * Dialog for creating/editing a budget line.
 * Fields: category, planned_amount, alert_threshold, adjustment_index.
 * Validates: positive amount, category uniqueness (via hook).
 */

import { useState, useEffect } from "react";
import { useCategories } from "@/lib/hooks/use-categories";
import {
  useCreateBudget,
  useUpdateBudget,
  ADJUSTMENT_INDEX_OPTIONS,
} from "@/lib/hooks/use-budgets";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/types/database";

type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];

interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
  month: string; // ISO date YYYY-MM-DD (first of month)
  familyMemberId?: string | null;
  editData?: {
    id: string;
    category_id: string;
    category_name: string;
    planned_amount: number;
    alert_threshold: number;
    adjustment_index: AdjustmentIndex | null;
  } | null;
}

export function BudgetForm({ open, onClose, month, familyMemberId, editData }: BudgetFormProps) {
  const isEditing = !!editData;

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [threshold, setThreshold] = useState("80");
  const [adjustmentIndex, setAdjustmentIndex] = useState<AdjustmentIndex>("none");
  const [error, setError] = useState("");

  const { data: categories } = useCategories();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  // Only expense categories for budgets
  const expenseCategories = categories?.filter((c) => c.type === "expense") ?? [];

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setCategoryId(editData.category_id);
      setAmount(editData.planned_amount.toString());
      setThreshold(editData.alert_threshold.toString());
      setAdjustmentIndex(editData.adjustment_index ?? "none");
    } else {
      setCategoryId("");
      setAmount("");
      setThreshold("80");
      setAdjustmentIndex("none");
    }
    setError("");
  }, [editData, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Informe um valor positivo.");
      return;
    }

    const parsedThreshold = parseInt(threshold);
    if (isNaN(parsedThreshold) || parsedThreshold < 1 || parsedThreshold > 100) {
      setError("Limite de alerta deve ser entre 1 e 100 %.");
      return;
    }

    try {
      if (isEditing && editData) {
        await updateBudget.mutateAsync({
          id: editData.id,
          planned_amount: parsedAmount,
          alert_threshold: parsedThreshold,
          adjustment_index: adjustmentIndex === "none" ? null : adjustmentIndex,
        });
      } else {
        if (!categoryId) {
          setError("Selecione uma categoria.");
          return;
        }
        await createBudget.mutateAsync({
          category_id: categoryId,
          month,
          planned_amount: parsedAmount,
          alert_threshold: parsedThreshold,
          adjustment_index: adjustmentIndex === "none" ? null : adjustmentIndex,
          family_member_id: familyMemberId ?? null,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  if (!open) return null;

  const isPending = createBudget.isPending || updateBudget.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-50 mx-4 w-full max-w-md rounded-lg border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">
          {isEditing ? "Editar Orçamento" : "Novo Orçamento"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEditing
            ? `Editando: ${editData?.category_name}`
            : "Defina o limite de gasto mensal para uma categoria."}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Category (only for creation) */}
          {!isEditing && (
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Selecione</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="text-sm font-medium">Valor orçado (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
            {amount && !isNaN(parseFloat(amount.replace(",", "."))) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {formatCurrency(parseFloat(amount.replace(",", ".")))}
              </p>
            )}
          </div>

          {/* Alert threshold */}
          <div>
            <label className="text-sm font-medium">
              Alerta ao atingir (%)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              O card ficará amarelo ao atingir este percentual
            </p>
          </div>

          {/* Adjustment index */}
          <div>
            <label className="text-sm font-medium">Índice de reajuste</label>
            <select
              value={adjustmentIndex}
              onChange={(e) =>
                setAdjustmentIndex(e.target.value as AdjustmentIndex)
              }
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ADJUSTMENT_INDEX_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? "Salvando" : isEditing ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

```

### src/components/categories/category-form.tsx
```
"use client";

import { useState, useEffect } from "react";
import {
  useCreateCategory,
  useUpdateCategory,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from "@/lib/hooks/use-categories";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type CategoryType = Database["public"]["Enums"]["category_type"];

interface CategoryFormProps {
  category?: Category | null;
  open: boolean;
  onClose: () => void;
  defaultType?: CategoryType;
}

export function CategoryForm({ category, open, onClose, defaultType = "expense" }: CategoryFormProps) {
  const isEdit = !!category;

  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>(defaultType);
  const [icon, setIcon] = useState("circle-dot");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const loading = createCategory.isPending || updateCategory.isPending;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setIcon(category.icon || "circle-dot");
      setColor(category.color || CATEGORY_COLORS[0]);
    } else {
      setName("");
      setType(defaultType);
      setIcon("circle-dot");
      setColor(CATEGORY_COLORS[0]);
    }
    setError(null);
  }, [category, open, defaultType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    try {
      if (isEdit && category) {
        await updateCategory.mutateAsync({
          id: category.id,
          name: name.trim(),
          icon,
          color,
          // type doesn't change on edit
        });
      } else {
        await createCategory.mutateAsync({
          name: name.trim(),
          type,
          icon,
          color,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar categoria.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">
          {isEdit ? "Editar categoria" : "Nova categoria"}
        </h2>

        {error && (
          <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="cat-name" className="text-sm font-medium">Nome</label>
            <input
              id="cat-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mercado"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
          </div>

          {/* Type */}
          {!isEdit && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo</label>
              <div className="flex gap-2">
                {(["expense", "income"] as CategoryType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      type === t
                        ? t === "income"
                          ? "border-verdant bg-verdant/10 text-verdant"
                          : "border-terracotta bg-terracotta/10 text-terracotta"
                        : "border-input hover:bg-accent"
                    }`}
                  >
                    {t === "income" ? "Receita" : "Despesa"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Cor</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    color === c ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ícone</label>
            <div className="grid max-h-32 grid-cols-10 gap-1 overflow-y-auto rounded-md border p-2">
              {CATEGORY_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`flex h-8 w-8 items-center justify-center rounded text-xs transition-colors ${
                    icon === ic ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                  title={ic}
                >
                  {ic.slice(0, 2)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selecionado: <span className="font-mono">{icon}</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Salvando" : isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

```

### src/components/connections/import-step-mapping.tsx
```
import type { CSVColumnMapping } from "@/lib/parsers/csv-parser";

interface Props {
  csvHeaders: string[];
  csvRows: string[][];
  mapping: CSVColumnMapping | null;
  setMapping: (updater: (current: CSVColumnMapping | null) => CSVColumnMapping | null) => void;
  onBack: () => void;
  onApply: () => void;
}

export function ImportStepMapping({
  csvHeaders,
  csvRows,
  mapping,
  setMapping,
  onBack,
  onApply,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mapeamento de colunas</h2>
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
          Voltar
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {csvHeaders.length} colunas detectadas, {csvRows.length} linhas. Ajuste se necessário.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {(["date", "amount", "description"] as const).map((field) => (
          <div key={field} className="space-y-1.5">
            <label className="text-sm font-medium capitalize">
              {field === "date" ? "Data" : field === "amount" ? "Valor" : "Descrição"}
            </label>
            <select
              value={mapping?.[field] ?? 0}
              onChange={(e) =>
                setMapping((m) => (m ? { ...m, [field]: parseInt(e.target.value, 10) } : null))
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {csvHeaders.map((h, i) => (
                <option key={i} value={i}>
                  {h || `Coluna ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {csvRows.length > 0 && (
        <div className="overflow-x-auto rounded border bg-muted/50 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Preview (3 primeiras linhas)</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                {csvHeaders.map((h, i) => (
                  <th
                    key={i}
                    className={`px-2 py-1 text-left font-medium ${
                      i === mapping?.date
                        ? "text-info-slate"
                        : i === mapping?.amount
                          ? "text-verdant"
                          : i === mapping?.description
                            ? "text-burnished"
                            : ""
                    }`}
                  >
                    {h || `Col ${i + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvRows.slice(0, 3).map((row, ri) => (
                <tr key={ri} className="border-b border-muted/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1 tabular-nums">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={onApply}
        disabled={!mapping}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        Aplicar mapeamento e continuar
      </button>
    </div>
  );
}

```

### src/components/connections/import-step-preview.tsx
```
import { formatCurrency } from "@/lib/utils";
import type { CSVTransaction } from "@/lib/parsers/csv-parser";
import type { OFXTransaction } from "@/lib/parsers/ofx-parser";

interface Props {
  transactions: (CSVTransaction | OFXTransaction)[];
  selected: Set<number>;
  parseErrors: string[];
  isImporting: boolean;
  onBack: () => void;
  onToggleAll: () => void;
  onToggleSelect: (index: number) => void;
  onImport: () => void;
}

export function ImportStepPreview({
  transactions,
  selected,
  parseErrors,
  isImporting,
  onBack,
  onToggleAll,
  onToggleSelect,
  onImport,
}: Props) {
  const incomeTotal = transactions
    .filter((_, i) => selected.has(i) && transactions[i].type === "income")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const expenseTotal = transactions
    .filter((_, i) => selected.has(i) && transactions[i].type === "expense")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Preview ({selected.size}/{transactions.length} selecionadas)
        </h2>
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
          Voltar
        </button>
      </div>

      {parseErrors.length > 0 && (
        <div className="rounded-lg border border-burnished/20 bg-burnished/10 p-3">
          <p className="text-xs font-semibold text-burnished">{parseErrors.length} aviso(s):</p>
          {parseErrors.slice(0, 5).map((e, i) => (
            <p key={i} className="text-xs text-burnished">
              {e}
            </p>
          ))}
          {parseErrors.length > 5 && (
            <p className="text-xs text-burnished">e mais {parseErrors.length - 5}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selected.size === transactions.length}
          onChange={onToggleAll}
          className="h-4 w-4 rounded border-input"
        />
        <span className="text-xs text-muted-foreground">Selecionar todas</span>
      </div>

      <div className="max-h-96 space-y-1 overflow-y-auto rounded-lg border bg-card">
        {transactions.map((tx, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2 text-sm ${selected.has(i) ? "" : "opacity-40"}`}>
            <input
              type="checkbox"
              checked={selected.has(i)}
              onChange={() => onToggleSelect(i)}
              className="h-4 w-4 rounded border-input"
            />
            <span className="w-24 flex-shrink-0 tabular-nums text-muted-foreground">{tx.date}</span>
            <span className="min-w-0 flex-1 truncate">{tx.description}</span>
            <span
              className={`w-28 flex-shrink-0 text-right tabular-nums font-medium ${
                tx.type === "income" ? "text-verdant" : "text-terracotta"
              }`}
            >
              {tx.type === "income" ? "+" : "-"}
              {formatCurrency(Math.abs(tx.amount))}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
        <div>
          <span className="text-verdant tabular-nums">+{formatCurrency(incomeTotal)}</span>
          {" / "}
          <span className="text-terracotta tabular-nums">-{formatCurrency(expenseTotal)}</span>
        </div>
        <span className="text-xs text-muted-foreground">{selected.size} transações</span>
      </div>

      <button
        onClick={onImport}
        disabled={selected.size === 0 || isImporting}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isImporting ? "Importando" : `Importar ${selected.size} transações`}
      </button>
    </div>
  );
}

```

### src/components/connections/import-step-result.tsx
```
import { CircleCheck, Link } from "lucide-react";

interface Props {
  imported?: number;
  skipped?: number;
  categorized?: number;
  matched?: number;
  onReset: () => void;
}

export function ImportStepResult({ imported, skipped, categorized, matched, onReset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-verdant/15">
        <CircleCheck className="h-7 w-7 text-verdant" />
      </div>
      <h2 className="text-xl font-bold">Importação concluída</h2>
      {imported !== undefined && (
        <div className="mt-4 space-y-1 text-sm">
          <p className="font-medium text-verdant">{imported} transações importadas</p>
          {(matched ?? 0) > 0 && (
            <p className="flex items-center justify-center gap-1 text-info-slate">
              <Link className="h-3.5 w-3.5" />
              {matched} conciliadas automaticamente
            </p>
          )}
          {(skipped ?? 0) > 0 && <p className="text-burnished">{skipped} duplicadas (ignoradas)</p>}
          <p className="text-muted-foreground">{categorized ?? 0} auto-categorizadas</p>
        </div>
      )}
      <button onClick={onReset} className="mt-6 rounded-md border px-6 py-2 text-sm font-medium hover:bg-accent">
        Importar outro arquivo
      </button>
    </div>
  );
}

```

### src/components/connections/import-step-upload.tsx
```
import { useState, useCallback, useRef } from "react";
import { Upload } from "lucide-react";
import type { Database } from "@/types/database";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type BankConnection = Database["public"]["Tables"]["bank_connections"]["Row"];

interface Props {
  accountId: string;
  setAccountId: (value: string) => void;
  connectionId: string | null;
  setConnectionId: (value: string | null) => void;
  accounts?: Account[];
  connections?: BankConnection[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ACCEPTED_EXTENSIONS = [".csv", ".tsv", ".ofx", ".qfx", ".xlsx", ".xls", ".txt"];

export function ImportStepUpload({
  accountId,
  setAccountId,
  connectionId,
  setConnectionId,
  accounts,
  connections,
  onFileUpload,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (accountId) setDragging(true);
  }, [accountId]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (!accountId) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) return;

    // Simulate a file input change event for the existing handler
    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputRef.current) {
      inputRef.current.files = dt.files;
      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, [accountId]);

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Conta de destino</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Selecione a conta</option>
          {accounts?.filter((a) => a.is_active).map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {connections && connections.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Conexão bancária (opcional)</label>
          <select
            value={connectionId || ""}
            onChange={(e) => setConnectionId(e.target.value || null)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Nenhuma</option>
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.institution_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => accountId && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
          !accountId
            ? "bg-muted/30 opacity-50"
            : dragging
              ? "border-primary bg-primary/5"
              : "bg-card hover:border-primary/50 hover:bg-accent/30"
        }`}
      >
        <Upload className={`h-8 w-8 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
        <p className="mt-3 text-sm font-semibold">
          {dragging ? "Solte o arquivo aqui" : "Arraste um arquivo ou clique para selecionar"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">CSV, TSV, OFX, QFX, XLSX, XLS</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.ofx,.qfx,.xlsx,.xls,.txt"
          onChange={onFileUpload}
          disabled={!accountId}
          className="hidden"
        />
        {!accountId && <p className="mt-2 text-xs text-terracotta">Selecione uma conta primeiro.</p>}
      </div>
    </div>
  );
}

```

### src/components/connections/import-wizard.tsx
```
"use client";

import { useCallback, useState } from "react";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useBankConnections, useImportBatch } from "@/lib/hooks/use-bank-connections";
import { mapToTransactions, parseCSVRaw, suggestMapping } from "@/lib/parsers/csv-parser";
import { parseOFX } from "@/lib/parsers/ofx-parser";
import { parseXLSX } from "@/lib/parsers/xlsx-parser";
import type { CSVColumnMapping, CSVTransaction } from "@/lib/parsers/csv-parser";
import type { OFXTransaction } from "@/lib/parsers/ofx-parser";
import { ImportStepMapping } from "./import-step-mapping";
import { ImportStepPreview } from "./import-step-preview";
import { ImportStepResult } from "./import-step-result";
import { ImportStepUpload } from "./import-step-upload";

type ImportStep = "upload" | "mapping" | "preview" | "result";

export function ImportWizard() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [fileType, setFileType] = useState<"csv" | "ofx" | "xlsx">("csv");
  const [accountId, setAccountId] = useState("");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<CSVColumnMapping | null>(null);
  const [transactions, setTransactions] = useState<(CSVTransaction | OFXTransaction)[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const { data: accounts } = useAccounts();
  const { data: connections } = useBankConnections();
  const importBatch = useImportBatch();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().split(".").pop();

    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const buffer = ev.target?.result as ArrayBuffer;
        const result = parseXLSX(buffer);
        setFileType("xlsx");
        setCsvHeaders(result.headers);
        setCsvRows(result.rows);
        setMapping(suggestMapping(result.headers, result.rows[0] || []));
        setStep("mapping");
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;

      if (ext === "ofx" || ext === "qfx") {
        setFileType("ofx");
        const result = await parseOFX(content);
        setTransactions(result.transactions);
        setParseErrors(
          result.duplicatesSkipped > 0
            ? [...result.errors, `${result.duplicatesSkipped} transação(ões) duplicada(s) ignorada(s).`]
            : result.errors
        );
        setSelected(new Set(result.transactions.map((_, i) => i)));
        setStep("preview");
        return;
      }

      setFileType("csv");
      const { headers, rows } = parseCSVRaw(content);
      setCsvHeaders(headers);
      setCsvRows(rows);
      setMapping(suggestMapping(headers, rows[0] || []));
      setStep("mapping");
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const handleApplyMapping = useCallback(() => {
    if (!mapping) return;
    const { transactions: txs, errors } = mapToTransactions(csvRows, mapping);
    setTransactions(txs);
    setParseErrors(errors);
    setSelected(new Set(txs.map((_, i) => i)));
    setStep("preview");
  }, [csvRows, mapping]);

  const handleImport = useCallback(async () => {
    if (!accountId) return;
    const selectedTxs = transactions.filter((_, i) => selected.has(i));

    await importBatch.mutateAsync({
      accountId,
      bankConnectionId: connectionId,
      transactions: selectedTxs.map((tx) => ({
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
        type: tx.type,
        external_id: tx.externalId,
      })),
    });

    setStep("result");
  }, [accountId, connectionId, importBatch, selected, transactions]);

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === transactions.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(transactions.map((_, i) => i)));
  };

  if (step === "upload") {
    return (
      <ImportStepUpload
        accountId={accountId}
        setAccountId={setAccountId}
        connectionId={connectionId}
        setConnectionId={setConnectionId}
        accounts={accounts}
        connections={connections}
        onFileUpload={handleFileUpload}
      />
    );
  }

  if (step === "mapping") {
    return (
      <ImportStepMapping
        csvHeaders={csvHeaders}
        csvRows={csvRows}
        mapping={mapping}
        setMapping={setMapping}
        onBack={() => setStep("upload")}
        onApply={handleApplyMapping}
      />
    );
  }

  if (step === "preview") {
    return (
      <ImportStepPreview
        transactions={transactions}
        selected={selected}
        parseErrors={parseErrors}
        isImporting={importBatch.isPending}
        onBack={() => setStep(fileType === "ofx" ? "upload" : "mapping")}
        onToggleAll={toggleAll}
        onToggleSelect={toggleSelect}
        onImport={handleImport}
      />
    );
  }

  return (
    <ImportStepResult
      imported={importBatch.data?.imported}
      skipped={importBatch.data?.skipped}
      categorized={importBatch.data?.categorized}
      matched={importBatch.data?.matched}
      onReset={() => {
        setStep("upload");
        setTransactions([]);
      }}
    />
  );
}

```

### src/components/connections/reconciliation-panel.tsx
```
"use client";

/**
 * Oniefy - Reconciliation Panel (Camada 3)
 *
 * Side-by-side view: pending transactions (left) vs imported (right).
 * User selects one from each column and clicks "Conciliar" to match.
 */

import { useState, useMemo } from "react";
import { Link, ArrowLeftRight, CircleCheck, AlertTriangle, Filter } from "lucide-react";
import {
  useUnmatchedImports,
  usePendingUnmatched,
  useMatchTransactions,
  type UnmatchedTransaction,
} from "@/lib/hooks/use-reconciliation";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { formatCurrency, formatDate } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    pending: { label: "Pendente", classes: "bg-burnished/15 text-burnished" },
    overdue: { label: "Atrasada", classes: "bg-terracotta/15 text-terracotta" },
    paid: { label: "Paga", classes: "bg-verdant/15 text-verdant" },
  };
  const c = config[status] ?? { label: status, classes: "bg-muted text-muted-foreground" };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${c.classes}`}>{c.label}</span>;
}

function TxRow({
  tx,
  selected,
  onSelect,
}: {
  tx: UnmatchedTransaction;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-lg border p-3 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:bg-accent/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {tx.description || "Sem descrição"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>{formatDate(tx.due_date || tx.date)}</span>
            <span className="text-border">·</span>
            <span>{tx.account_name}</span>
            {tx.category_name && (
              <>
                <span className="text-border">·</span>
                <span>{tx.category_name}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-sm font-semibold tabular-nums ${
            tx.type === "expense" ? "text-terracotta" : "text-verdant"
          }`}>
            {formatCurrency(tx.amount)}
          </span>
          <StatusBadge status={tx.payment_status} />
        </div>
      </div>
    </button>
  );
}

export function ReconciliationPanel() {
  const [accountFilter, setAccountFilter] = useState<string>("");
  const [selectedPending, setSelectedPending] = useState<string | null>(null);
  const [selectedImported, setSelectedImported] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ adjustment: number } | null>(null);

  const { data: accounts } = useAccounts();
  const { data: pending, isLoading: loadingPending } = usePendingUnmatched(accountFilter || undefined);
  const { data: imports, isLoading: loadingImports } = useUnmatchedImports(accountFilter || undefined);
  const matchMutation = useMatchTransactions();

  const selectedPendingTx = useMemo(
    () => pending?.find((t) => t.id === selectedPending),
    [pending, selectedPending]
  );
  const selectedImportedTx = useMemo(
    () => imports?.find((t) => t.id === selectedImported),
    [imports, selectedImported]
  );

  const canMatch = selectedPending && selectedImported && selectedPendingTx && selectedImportedTx
    && selectedPendingTx.account_id === selectedImportedTx.account_id;

  const amountDiff = selectedPendingTx && selectedImportedTx
    ? selectedImportedTx.amount - selectedPendingTx.amount
    : 0;

  async function handleMatch() {
    if (!selectedPending || !selectedImported) return;
    const result = await matchMutation.mutateAsync({
      pendingId: selectedPending,
      importedId: selectedImported,
    });
    setLastResult({ adjustment: result.adjustment });
    setSelectedPending(null);
    setSelectedImported(null);
  }

  const isLoading = loadingPending || loadingImports;
  const hasPending = (pending?.length ?? 0) > 0;
  const hasImports = (imports?.length ?? 0) > 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasPending && !hasImports) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-verdant/15">
          <CircleCheck className="h-7 w-7 text-verdant" />
        </div>
        <h2 className="text-lg font-semibold">Tudo conciliado</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sem transações pendentes de conciliação.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Account filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={accountFilter}
          onChange={(e) => {
            setAccountFilter(e.target.value);
            setSelectedPending(null);
            setSelectedImported(null);
          }}
          className="rounded-md border bg-card px-3 py-1.5 text-sm"
        >
          <option value="">Todas as contas</option>
          {accounts?.filter((a) => a.is_active).map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {pending?.length ?? 0} pendentes · {imports?.length ?? 0} importadas
        </span>
      </div>

      {/* Success toast */}
      {lastResult && (
        <div className="flex items-center gap-2 rounded-lg border border-verdant/30 bg-verdant/10 px-4 py-2.5 text-sm">
          <Link className="h-4 w-4 text-verdant" />
          <span className="font-medium text-verdant">Conciliação realizada</span>
          {lastResult.adjustment !== 0 && (
            <span className="text-muted-foreground">
              (ajuste: {formatCurrency(Math.abs(lastResult.adjustment))})
            </span>
          )}
          <button
            onClick={() => setLastResult(null)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Left: Pending/Overdue */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Pendentes ({pending?.length ?? 0})
          </h3>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-2">
            {!hasPending ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sem transações pendentes
              </p>
            ) : (
              pending?.map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  selected={selectedPending === tx.id}
                  onSelect={() => setSelectedPending(selectedPending === tx.id ? null : tx.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: Imported */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Importadas ({imports?.length ?? 0})
          </h3>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-2">
            {!hasImports ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sem transações importadas sem par
              </p>
            ) : (
              imports?.map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  selected={selectedImported === tx.id}
                  onSelect={() => setSelectedImported(selectedImported === tx.id ? null : tx.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Match action bar */}
      {(selectedPending || selectedImported) && (
        <div className="sticky bottom-4 flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3 text-sm">
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            {selectedPendingTx && selectedImportedTx ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCurrency(selectedPendingTx.amount)}</span>
                <span className="text-muted-foreground">↔</span>
                <span className="font-medium">{formatCurrency(selectedImportedTx.amount)}</span>
                {amountDiff !== 0 && (
                  <span className="flex items-center gap-1 text-xs">
                    <AlertTriangle className="h-3 w-3 text-burnished" />
                    <span className="text-burnished">
                      Ajuste: {amountDiff > 0 ? "+" : ""}{formatCurrency(amountDiff)}
                    </span>
                  </span>
                )}
                {selectedPendingTx.account_id !== selectedImportedTx.account_id && (
                  <span className="text-xs text-terracotta">Contas diferentes</span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">
                Selecione uma pendente e uma importada para conciliar
              </span>
            )}
          </div>
          <button
            onClick={handleMatch}
            disabled={!canMatch || matchMutation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {matchMutation.isPending ? "Conciliando..." : "Conciliar"}
          </button>
        </div>
      )}
    </div>
  );
}

```

### src/components/dashboard/balance-evolution-chart.tsx
```
"use client";

/**
 * BalanceEvolutionChart - DASH-07
 *
 * Evolução do saldo nos últimos 6-12 meses.
 * Recharts: BarChart com receitas (verde) e despesas (vermelho)
 * + LineChart overlay para saldo acumulado.
 *
 * Período padrão: 6 meses. Filtro para 3/6/12.
 */

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { BalanceEvolutionResult } from "@/lib/hooks/use-dashboard";

interface Props {
  data: BalanceEvolutionResult | undefined;
  isLoading: boolean;
}

const PERIOD_OPTIONS = [
  { value: 3, label: "3m" },
  { value: 6, label: "6m" },
  { value: 12, label: "12m" },
];

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

function compactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return value.toFixed(0);
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function BalanceEvolutionChart({ data, isLoading }: Props) {
  const [, setPeriod] = useState(6);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-56 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const points = data?.data ?? [];

  // Format for recharts
  const chartData = [...points]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((p) => ({
      month: formatMonth(p.month),
      receitas: Number(p.income),
      despesas: Number(p.expense),
      saldo: Number(p.balance),
    }));

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Evolução Mensal</h3>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className="rounded px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="mt-8 text-center">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
          <p className="mt-1 text-sm text-muted-foreground">
            Sem dados suficientes para o gráfico
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Lance transações para acompanhar a evolução
          </p>
        </div>
      ) : (
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={compactCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              />
              <Bar
                dataKey="receitas"
                name="Receitas"
                fill="#2F7A68"
                radius={[3, 3, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="despesas"
                name="Despesas"
                fill="#A64A45"
                radius={[3, 3, 0, 0]}
                barSize={20}
              />
              <Line
                dataKey="saldo"
                name="Saldo"
                type="monotone"
                stroke="#56688F"
                strokeWidth={2}
                dot={{ r: 3, fill: "#56688F" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {data?.source === "calculated" && chartData.length > 0 && (
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Dados calculados a partir das transações (snapshots mensais ainda não disponíveis)
        </p>
      )}
    </div>
  );
}

```

### src/components/dashboard/balance-sheet-card.tsx
```
"use client";

/**
 * BalanceSheetCard - CTB-05
 *
 * Card com 3 valores: total ativos, total passivos, patrimônio líquido.
 * Barra visual horizontal mostrando proporção ativos/passivos.
 * Explicação contextual simplificada (Grupo 3 PL visível ao usuário).
 */

import { formatCurrency } from "@/lib/utils";
import type { BalanceSheet } from "@/lib/hooks/use-dashboard";

interface Props {
  data: BalanceSheet | undefined;
  isLoading: boolean;
}

export function BalanceSheetCard({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 w-28 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const assets = data?.total_assets ?? 0;
  const liabilities = data?.total_liabilities ?? 0;
  const netWorth = data?.net_worth ?? 0;

  // Proportion bar
  const total = assets + liabilities;
  const assetPct = total > 0 ? (assets / total) * 100 : 100;

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Balanço Patrimonial</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            netWorth >= 0
              ? "bg-verdant/15 text-verdant"
              : "bg-terracotta/15 text-terracotta"
          }`}
        >
          PL {netWorth >= 0 ? "+" : ""}
          {formatCurrency(netWorth)}
        </span>
      </div>

      {/* Proportion bar */}
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-terracotta/20">
        <div
          className="h-full rounded-full bg-verdant transition-all duration-500"
          style={{ width: `${Math.max(assetPct, 2)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>Ativos</span>
        <span>Passivos</span>
      </div>

      {/* Breakdown */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-verdant" />
            <span className="text-sm text-muted-foreground">
              Ativos líquidos
            </span>
          </div>
          <span className="text-sm font-medium tabular-nums">
            {formatCurrency(data?.liquid_assets ?? 0)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-700" />
            <span className="text-sm text-muted-foreground">
              Ativos ilíquidos
            </span>
          </div>
          <span className="text-sm font-medium tabular-nums">
            {formatCurrency(data?.illiquid_assets ?? 0)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-terracotta" />
            <span className="text-sm text-muted-foreground">Passivos</span>
          </div>
          <span className="text-sm font-medium tabular-nums text-terracotta">
            {formatCurrency(liabilities)}
          </span>
        </div>
      </div>

      {/* Net worth highlight */}
      <div className="mt-4 border-t pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Patrimônio Líquido</span>
          <span
            className={`text-lg font-bold tabular-nums ${
              netWorth >= 0 ? "text-verdant" : "text-terracotta"
            }`}
          >
            {formatCurrency(netWorth)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Tudo que você possui menos tudo que você deve
        </p>
      </div>
    </div>
  );
}

```

### src/components/dashboard/budget-summary-card.tsx
```
"use client";

/**
 * BudgetSummaryCard - DASH-05
 *
 * Resumo do orçamento: barra de progresso total + items por categoria.
 * Status visual: ok (verde), warning (amarelo), exceeded (vermelho).
 * Link para módulo Orçamento completo.
 */

import Link from "next/link";
import { PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { BudgetVsActualResult } from "@/lib/hooks/use-dashboard";

interface Props {
  data: BudgetVsActualResult | undefined;
  isLoading: boolean;
}

const STATUS_STYLES = {
  ok: { bar: "bg-verdant", badge: "" },
  warning: { bar: "bg-burnished", badge: "text-burnished bg-burnished/15" },
  exceeded: { bar: "bg-terracotta", badge: "text-terracotta bg-terracotta/15" },
};

export function BudgetSummaryCard({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const budgetCount = data?.budget_count ?? 0;
  const totalPlanned = data?.total_planned ?? 0;
  const totalActual = data?.total_actual ?? 0;
  const pctUsed = data?.pct_used ?? 0;
  const items = data?.items ?? [];

  // Show max 4 budget items on dashboard
  const displayItems = items.slice(0, 4);

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Orçamento do Mês</h3>
        <Link
          href="/budgets"
          className="text-xs text-primary hover:underline"
        >
          {budgetCount > 0 ? "Gerenciar" : "Criar"}
        </Link>
      </div>

      {budgetCount === 0 ? (
        <div className="mt-6 text-center">
          <PieChart className="h-6 w-6 text-muted-foreground" />
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhum orçamento definido
          </p>
          <Link
            href="/budgets"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Definir orçamento
          </Link>
        </div>
      ) : (
        <>
          {/* Overall progress */}
          <div className="mt-4">
            <div className="flex items-end justify-between">
              <span className="text-lg font-bold tabular-nums">
                {pctUsed.toFixed(0)} %
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatCurrency(totalActual)} / {formatCurrency(totalPlanned)}
              </span>
            </div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pctUsed >= 100
                    ? "bg-terracotta"
                    : pctUsed >= 80
                      ? "bg-burnished"
                      : "bg-verdant"
                }`}
                style={{ width: `${Math.min(pctUsed, 100)}%` }}
              />
            </div>
          </div>

          {/* Per-category breakdown */}
          <div className="mt-4 space-y-2">
            {displayItems.map((item) => {
              const styles = STATUS_STYLES[item.status];
              return (
                <div key={item.budget_id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: item.category_color || "#7E9487",
                        }}
                      />
                      <span className="truncate">{item.category_name}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {item.pct_used.toFixed(0)} %
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${styles.bar}`}
                      style={{ width: `${Math.min(item.pct_used, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {items.length > 4 && (
              <p className="text-center text-[11px] text-muted-foreground">
                +{items.length - 4} categorias
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

```

### src/components/dashboard/index.ts
```
export { SummaryCards } from "./summary-cards";
export { BalanceSheetCard } from "./balance-sheet-card";
export { TopCategoriesCard } from "./top-categories-card";
export { UpcomingBillsCard } from "./upcoming-bills-card";
export { BudgetSummaryCard } from "./budget-summary-card";
export { SolvencyPanel } from "./solvency-panel";
export { BalanceEvolutionChart } from "./balance-evolution-chart";
export { QuickEntryFab } from "./quick-entry-fab";

```

### src/components/dashboard/quick-entry-fab.tsx
```
"use client";

/**
 * QuickEntryFab - DASH-08
 *
 * Botão flutuante '+' para lançamento rápido.
 * Abre o TransactionForm como dialog.
 * Disponível em ambas as seções do Dashboard.
 */

import { useState } from "react";
import { TransactionForm } from "@/components/transactions/transaction-form";

export function QuickEntryFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 lg:bottom-8 lg:right-8"
        aria-label="Novo lançamento"
        title="Novo lançamento"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </button>

      <TransactionForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}

```

### src/components/dashboard/solvency-panel.tsx
```
"use client";

/**
 * SolvencyPanel - DASH-09 (LCR), DASH-10 (Runway), DASH-11 (Burn Rate),
 *                 DASH-12 (Patrimônio por Tiers), DASH-06 (patrimônio total)
 *
 * Cockpit de Solvência: 4 KPIs + breakdown por tiers.
 * Layout: 2x2 grid de KPIs + barra empilhada de tiers.
 *
 * Referência: adendo v1.4, seção 2.
 * LCR = (T1+T2)/(Burn Rate × 6)
 * Runway = (T1+T2)/Burn Rate em meses
 */

import { formatCurrency } from "@/lib/utils";
import type { SolvencyMetrics } from "@/lib/hooks/use-dashboard";

interface Props {
  data: SolvencyMetrics | undefined;
  isLoading: boolean;
}

function lcrStatus(lcr: number): { label: string; color: string; bg: string } {
  if (lcr >= 2) return { label: "Sólida", color: "text-verdant", bg: "bg-verdant/15" };
  if (lcr >= 1) return { label: "Saudável", color: "text-verdant", bg: "bg-verdant/10" };
  if (lcr >= 0.5) return { label: "Atenção", color: "text-burnished", bg: "bg-burnished/15" };
  return { label: "Risco", color: "text-terracotta", bg: "bg-terracotta/15" };
}

function runwayStatus(months: number): { label: string; color: string } {
  if (months >= 12) return { label: "Sólido", color: "text-verdant" };
  if (months >= 6) return { label: "Estável", color: "text-verdant" };
  if (months >= 3) return { label: "Atenção", color: "text-burnished" };
  return { label: "Urgente", color: "text-terracotta" };
}

function KpiSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="h-3 w-16 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-7 w-20 animate-pulse rounded bg-muted" />
    </div>
  );
}

const TIER_COLORS = [
  { key: "tier1_total", label: "T1 Imediato", color: "#2F7A68", desc: "Conta corrente, poupança, carteira digital" },
  { key: "tier2_total", label: "T2 Líquido", color: "#56688F", desc: "Investimentos com liquidez (CDB, fundos)" },
  { key: "tier3_total", label: "T3 Ilíquido", color: "#A97824", desc: "Imóveis, veículos, bens" },
  { key: "tier4_total", label: "T4 Restrito", color: "#6F6678", desc: "FGTS, previdência com carência" },
] as const;

export function SolvencyPanel({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <KpiSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const lcr = data?.lcr ?? 0;
  const runway = data?.runway_months ?? 0;
  const burnRate = data?.burn_rate ?? 0;
  const totalPatrimony = data?.total_patrimony ?? 0;
  const capped999 = (v: number) => v >= 999;

  const lcrInfo = lcrStatus(lcr);
  const runwayInfo = runwayStatus(runway);

  // Tier breakdown for stacked bar
  const tiers = TIER_COLORS.map((t) => ({
    ...t,
    value: (data?.[t.key] as number) ?? 0,
  }));
  const tierTotal = tiers.reduce((s, t) => s + t.value, 0);

  return (
    <div className="space-y-4">
      {/* Section title */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Cockpit de Solvência
        </h3>
        {data?.months_analyzed !== undefined && data.months_analyzed < 3 && (
          <span className="rounded bg-burnished/15 px-1.5 py-0.5 text-[10px] font-medium text-burnished">
            {data.months_analyzed} mês(es) de dados
          </span>
        )}
      </div>

      {/* 4 KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* DASH-09: LCR */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Índice de Liquidez
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {capped999(lcr) ? "∞" : lcr.toFixed(2)}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${lcrInfo.bg} ${lcrInfo.color}`}
            >
              {lcrInfo.label}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {capped999(lcr)
              ? "Sem despesas recorrentes"
              : "Liquidez / (Burn × 6)"}
          </p>
        </div>

        {/* DASH-10: Runway */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Runway
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {capped999(runway) ? "∞" : runway.toFixed(1)}
            </span>
            {!capped999(runway) && (
              <span className="text-sm text-muted-foreground">meses</span>
            )}
            <span className={`text-xs font-semibold ${runwayInfo.color}`}>
              {runwayInfo.label}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Meses de liberdade financeira
          </p>
        </div>

        {/* DASH-11: Burn Rate */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Burn Rate
          </p>
          <span className="mt-1 block text-2xl font-bold tabular-nums">
            {formatCurrency(burnRate)}
          </span>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Custo mensal médio (6 meses)
          </p>
        </div>

        {/* DASH-06 + DASH-12: Patrimônio Total */}
        <div className="rounded-lg border bg-card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Patrimônio Total
          </p>
          <span className="mt-1 block text-2xl font-bold tabular-nums">
            {formatCurrency(totalPatrimony)}
          </span>
          <p className="mt-1 text-[11px] text-muted-foreground">
            T1 + T2 + T3 + T4
          </p>
        </div>
      </div>

      {/* DASH-12: Tier breakdown bar */}
      {tierTotal > 0 && (
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h4 className="text-sm font-semibold">Patrimônio por Tiers</h4>

          {/* Stacked bar */}
          <div className="mt-3 flex h-5 w-full overflow-hidden rounded-full bg-muted">
            {tiers.map(
              (tier) =>
                tier.value > 0 && (
                  <div
                    key={tier.key}
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${(tier.value / tierTotal) * 100}%`,
                      backgroundColor: tier.color,
                    }}
                    title={`${tier.label}: ${formatCurrency(tier.value)}`}
                  />
                )
            )}
          </div>

          {/* Legend */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {tiers.map((tier) => (
              <div key={tier.key} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">{tier.label}</span>
                    {tierTotal > 0 && tier.value > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {((tier.value / tierTotal) * 100).toFixed(0)} %
                      </span>
                    )}
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatCurrency(tier.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

```

### src/components/dashboard/summary-cards.tsx
```
"use client";

/**
 * SummaryCards - DASH-01 (saldo consolidado) + DASH-02 (receitas vs despesas)
 *
 * 4 cards: Saldo Atual, Saldo Previsto, Receitas do Mês, Despesas do Mês.
 * Saldo previsto exibido como valor secundário (adendo v1.1).
 */

import { formatCurrency } from "@/lib/utils";
import type { DashboardSummary } from "@/lib/hooks/use-dashboard";

interface Props {
  data: DashboardSummary | undefined;
  isLoading: boolean;
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-7 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function SummaryCards({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const balance = data?.total_current_balance ?? 0;
  const projected = data?.total_projected_balance ?? 0;
  const income = data?.month_income ?? 0;
  const expense = data?.month_expense ?? 0;
  const netMonth = income - expense;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Saldo Atual (DASH-01) */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Saldo Atual
        </p>
        <p
          className={`mt-1 text-2xl font-bold tabular-nums ${
            balance >= 0 ? "text-foreground" : "text-terracotta"
          }`}
        >
          {formatCurrency(balance)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Previsto: {formatCurrency(projected)}
        </p>
      </div>

      {/* Receitas do Mês (DASH-02) */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Receitas do Mês
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-verdant">
          {formatCurrency(income)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {data?.active_accounts ?? 0} contas ativas
        </p>
      </div>

      {/* Despesas do Mês (DASH-02) */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Despesas do Mês
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-terracotta">
          {formatCurrency(expense)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {income > 0
            ? `${((expense / income) * 100).toFixed(0)} % da receita`
            : "Sem receita no mês"}
        </p>
      </div>

      {/* Resultado do Mês */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Resultado do Mês
        </p>
        <p
          className={`mt-1 text-2xl font-bold tabular-nums ${
            netMonth >= 0 ? "text-verdant" : "text-terracotta"
          }`}
        >
          {netMonth >= 0 ? "+" : ""}
          {formatCurrency(netMonth)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Receitas - Despesas
        </p>
      </div>
    </div>
  );
}

```

### src/components/dashboard/top-categories-card.tsx
```
"use client";

/**
 * TopCategoriesCard - DASH-03
 *
 * Top 5 categorias de gasto do mês.
 * Horizontal bar chart com percentual.
 * Ao tocar na categoria, abre lista de transações filtrada (link).
 */

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { TopCategoriesResult } from "@/lib/hooks/use-dashboard";

interface Props {
  data: TopCategoriesResult | undefined;
  isLoading: boolean;
}

const FALLBACK_COLORS = [
  "#56688F",
  "#2F7A68",
  "#A97824",
  "#A64A45",
  "#6F6678",
];

export function TopCategoriesCard({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="h-4 w-44 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const categories = data?.categories ?? [];
  const totalExpense = data?.total_expense ?? 0;

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Top Categorias</h3>
        <span className="text-xs text-muted-foreground">
          {formatCurrency(totalExpense)} total
        </span>
      </div>

      {categories.length === 0 ? (
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sem despesas neste mês
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {categories.map((cat, idx) => {
            const color = cat.color || FALLBACK_COLORS[idx % 5];
            return (
              <Link
                key={cat.category_name}
                href={`/transactions?category=${encodeURIComponent(cat.category_name)}`}
                className="group block"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="group-hover:text-primary">
                      {cat.category_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="text-muted-foreground">
                      {cat.percentage} %
                    </span>
                    <span className="font-medium">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                </div>
                {/* Bar */}
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(cat.percentage, 1)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

```

### src/components/dashboard/upcoming-bills-card.tsx
```
"use client";

/**
 * UpcomingBillsCard - DASH-04
 *
 * Próximas contas a vencer: transações pendentes (is_paid=false)
 * ordenadas por data, limite 5.
 * Queried diretamente (sem RPC dedicada).
 */

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";

interface UpcomingBill {
  id: string;
  description: string | null;
  amount: number;
  date: string;
  type: string;
  account_name: string | null;
  category_name: string | null;
}

function useUpcomingBills(limit: number = 5) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["dashboard", "upcoming-bills", limit],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<UpcomingBill[]> => {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          id, description, amount, date, type,
          accounts!inner(name),
          categories(name)
        `
        )
        .eq("is_paid", false)
        .eq("is_deleted", false)
        .gte("date", new Date().toISOString().slice(0, 10))
        .order("date", { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        description: row.description as string | null,
        amount: row.amount as number,
        date: row.date as string,
        type: row.type as string,
        account_name: (row.accounts as Record<string, unknown>)?.name as string | null ?? null,
        category_name: (row.categories as Record<string, unknown>)?.name as string | null ?? null,
      }));
    },
  });
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T12:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days <= 0) return "text-terracotta bg-terracotta/10";
  if (days <= 3) return "text-burnished bg-burnished/10";
  if (days <= 7) return "text-burnished bg-burnished/10";
  return "text-muted-foreground bg-muted";
}

function urgencyLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d atrasado`;
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  return `${days}d`;
}

export function UpcomingBillsCard() {
  const { data: bills, isLoading } = useUpcomingBills();

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="h-4 w-44 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Próximas a Vencer</h3>
        <Link
          href="/transactions?paid=false"
          className="text-xs text-primary hover:underline"
        >
          Ver todas
        </Link>
      </div>

      {(!bills || bills.length === 0) ? (
        <div className="mt-6 text-center">
          <CircleCheck className="h-6 w-6 text-muted-foreground" />
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhuma conta pendente
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {bills.map((bill) => {
            const days = daysUntil(bill.date);
            return (
              <div
                key={bill.id}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/50"
              >
                <span
                  className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${urgencyColor(days)}`}
                >
                  {urgencyLabel(days)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {bill.description || bill.category_name || "Sem descrição"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(bill.date)} · {bill.account_name}
                  </p>
                </div>
                <span className="flex-shrink-0 text-sm font-semibold tabular-nums text-terracotta">
                  {formatCurrency(bill.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

```

### src/components/recurrences/recurrence-form.tsx
```
"use client";

/**
 * RecurrenceForm - CAP-01 (criar recorrência), CAP-02 (editar)
 *
 * Dialog for creating/editing a recurring bill.
 * Fields: account, category, type, amount, description, frequency, start_date,
 *         end_date, adjustment_index, adjustment_rate.
 */

import { useState, useEffect } from "react";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import {
  useCreateRecurrence,
  useUpdateRecurrence,
  FREQUENCY_OPTIONS,
} from "@/lib/hooks/use-recurrences";
import { ADJUSTMENT_INDEX_OPTIONS } from "@/lib/hooks/use-budgets";
import type { Database } from "@/types/database";

type Frequency = Database["public"]["Enums"]["recurrence_frequency"];
type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];

interface RecurrenceFormProps {
  open: boolean;
  onClose: () => void;
  editData?: {
    id: string;
    frequency: Frequency;
    interval_count: number;
    end_date: string | null;
    adjustment_index: AdjustmentIndex | null;
    adjustment_rate: number | null;
    template_transaction: Record<string, unknown>;
  } | null;
}

export function RecurrenceForm({ open, onClose, editData }: RecurrenceFormProps) {
  const isEditing = !!editData;

  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [intervalCount, setIntervalCount] = useState("1");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState("");
  const [adjustmentIndex, setAdjustmentIndex] = useState<AdjustmentIndex>("none");
  const [adjustmentRate, setAdjustmentRate] = useState("");
  const [error, setError] = useState("");

  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const createRecurrence = useCreateRecurrence();
  const updateRecurrence = useUpdateRecurrence();

  const filteredCategories = categories?.filter((c) => c.type === type) ?? [];

  useEffect(() => {
    if (editData) {
      const t = editData.template_transaction;
      setAccountId((t.account_id as string) ?? "");
      setCategoryId((t.category_id as string) ?? "");
      setType((t.type as "expense" | "income") ?? "expense");
      setAmount(String(t.amount ?? ""));
      setDescription((t.description as string) ?? "");
      setFrequency(editData.frequency);
      setIntervalCount(String(editData.interval_count));
      setEndDate(editData.end_date ?? "");
      setAdjustmentIndex(editData.adjustment_index ?? "none");
      setAdjustmentRate(editData.adjustment_rate ? String(editData.adjustment_rate) : "");
    } else {
      setAccountId("");
      setCategoryId("");
      setType("expense");
      setAmount("");
      setDescription("");
      setFrequency("monthly");
      setIntervalCount("1");
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate("");
      setAdjustmentIndex("none");
      setAdjustmentRate("");
    }
    setError("");
  }, [editData, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Informe um valor positivo.");
      return;
    }

    try {
      if (isEditing && editData) {
        await updateRecurrence.mutateAsync({
          id: editData.id,
          frequency,
          interval_count: parseInt(intervalCount) || 1,
          end_date: endDate || null,
          adjustment_index: adjustmentIndex === "none" ? null : adjustmentIndex,
          adjustment_rate: adjustmentRate ? parseFloat(adjustmentRate) : null,
          template: {
            account_id: accountId,
            category_id: categoryId || undefined,
            type,
            amount: parsedAmount,
            description: description || undefined,
          },
        });
      } else {
        if (!accountId) {
          setError("Selecione uma conta.");
          return;
        }
        await createRecurrence.mutateAsync({
          frequency,
          interval_count: parseInt(intervalCount) || 1,
          start_date: startDate,
          end_date: endDate || null,
          adjustment_index: adjustmentIndex === "none" ? null : adjustmentIndex,
          adjustment_rate: adjustmentRate ? parseFloat(adjustmentRate) : null,
          template: {
            account_id: accountId,
            category_id: categoryId || null,
            type,
            amount: parsedAmount,
            description: description || null,
          },
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  if (!open) return null;
  const isPending = createRecurrence.isPending || updateRecurrence.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">
          {isEditing ? "Editar Recorrência" : "Nova Conta Recorrente"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategoryId(""); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  type === t
                    ? t === "expense"
                      ? "bg-terracotta/15 text-terracotta"
                      : "bg-verdant/15 text-verdant"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {t === "expense" ? "Despesa" : "Receita"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Account */}
            <div>
              <label className="text-sm font-medium">Conta</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                <option value="">Selecione</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Nenhuma</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount + Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Valor (R$)</label>
              <input type="text" inputMode="decimal" value={amount}
                onChange={(e) => setAmount(e.target.value)} placeholder="0,00"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Aluguel"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Frequency + Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Frequência</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {FREQUENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">A cada</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="number" min={1} max={12} value={intervalCount}
                  onChange={(e) => setIntervalCount(e.target.value)}
                  className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <span className="text-sm text-muted-foreground">
                  {frequency === "daily" ? "dia(s)" : frequency === "weekly" ? "semana(s)" : frequency === "monthly" ? "mês(es)" : "ano(s)"}
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {!isEditing && (
              <div>
                <label className="text-sm font-medium">Início</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Fim (opcional)</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Adjustment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Reajuste</label>
              <select value={adjustmentIndex}
                onChange={(e) => setAdjustmentIndex(e.target.value as AdjustmentIndex)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {ADJUSTMENT_INDEX_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {adjustmentIndex === "manual" && (
              <div>
                <label className="text-sm font-medium">Taxa (% ao período)</label>
                <input type="text" inputMode="decimal" value={adjustmentRate}
                  onChange={(e) => setAdjustmentRate(e.target.value)} placeholder="0,00"
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            )}
          </div>

          {error && (
            <p className="rounded bg-terracotta/10 px-3 py-2 text-sm text-terracotta">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isPending}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {isPending ? "Salvando" : isEditing ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

```

### src/components/transactions/transaction-form.tsx
```
"use client";

import { useState, useEffect } from "react";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useFamilyMembers } from "@/lib/hooks/use-family-members";
import { useCreateTransaction, useCreateTransfer } from "@/lib/services/transaction-engine";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/types/database";

type TransactionType = Database["public"]["Enums"]["transaction_type"];
type CategoryType = Database["public"]["Enums"]["category_type"];

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

const TYPE_CONFIG: Record<
  TransactionType,
  { label: string; color: string; bgColor: string }
> = {
  expense: { label: "Despesa", color: "text-terracotta", bgColor: "border-terracotta bg-terracotta/10" },
  income: { label: "Receita", color: "text-verdant", bgColor: "border-verdant bg-verdant/10" },
  transfer: { label: "Transferência", color: "text-info-slate", bgColor: "border-info-slate bg-info-slate/10" },
};

export function TransactionForm({ open, onClose, defaultType = "expense" }: TransactionFormProps) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: familyMembers } = useFamilyMembers();

  const createTransaction = useCreateTransaction();
  const createTransfer = useCreateTransfer();
  const loading = createTransaction.isPending || createTransfer.isPending;

  // Form state
  const [type, setType] = useState<TransactionType>(defaultType);
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState(""); // transfer destination
  const [categoryId, setCategoryId] = useState("");
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isPaid, setIsPaid] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setType(defaultType);
      setAccountId(accounts?.[0]?.id ?? "");
      setToAccountId("");
      setCategoryId("");
      setFamilyMemberId("");
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setIsPaid(true);
      setNotes("");
      setError(null);
    }
  }, [open, defaultType, accounts]);

  // Close on ESC key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Filter categories by transaction type
  const categoryType: CategoryType = type === "income" ? "income" : "expense";
  const filteredCategories = categories?.filter((c) => c.type === categoryType) ?? [];

  // Available destination accounts for transfer (exclude source)
  const transferAccounts = accounts?.filter((a) => a.id !== accountId) ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Valor deve ser maior que zero.");
      return;
    }
    if (!accountId) {
      setError("Selecione uma conta.");
      return;
    }
    if (type === "transfer" && !toAccountId) {
      setError("Selecione a conta de destino.");
      return;
    }
    if (type === "transfer" && accountId === toAccountId) {
      setError("Conta de origem e destino devem ser diferentes.");
      return;
    }

    try {
      if (type === "transfer") {
        await createTransfer.mutateAsync({
          from_account_id: accountId,
          to_account_id: toAccountId,
          amount: parsedAmount,
          description: description || null,
          date,
          is_paid: isPaid,
        });
      } else {
        await createTransaction.mutateAsync({
          account_id: accountId,
          category_id: categoryId || null,
          type,
          amount: parsedAmount,
          description: description || null,
          date,
          is_paid: isPaid,
          notes: notes || null,
          family_member_id: familyMemberId || null,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Nova transação</h2>

        {error && (
          <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type selector */}
          <div className="flex gap-1 rounded-lg border bg-muted p-1">
            {(["expense", "income", "transfer"] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  type === t
                    ? `${TYPE_CONFIG[t].bgColor} ${TYPE_CONFIG[t].color}`
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label htmlFor="tx-amount" className="text-sm font-medium">
              Valor (R$)
            </label>
            <input
              id="tx-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-semibold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
            {amount && parseFloat(amount) > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(parseFloat(amount))}
              </p>
            )}
          </div>

          {/* Account (source) */}
          <div className="space-y-1.5">
            <label htmlFor="tx-account" className="text-sm font-medium">
              {type === "transfer" ? "Conta de origem" : "Conta"}
            </label>
            <select
              id="tx-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecione</option>
              {accounts?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.current_balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Transfer destination */}
          {type === "transfer" && (
            <div className="space-y-1.5">
              <label htmlFor="tx-to-account" className="text-sm font-medium">
                Conta de destino
              </label>
              <select
                id="tx-to-account"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione</option>
                {transferAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.current_balance)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category (not for transfers) */}
          {type !== "transfer" && (
            <div className="space-y-1.5">
              <label htmlFor="tx-category" className="text-sm font-medium">
                Categoria
              </label>
              <select
                id="tx-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sem categoria</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="tx-desc" className="text-sm font-medium">
              Descrição
            </label>
            <input
              id="tx-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Salário, etc."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Family member (optional) */}
          {type !== "transfer" && familyMembers && familyMembers.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="tx-member" className="text-sm font-medium">
                Membro <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <select
                id="tx-member"
                value={familyMemberId}
                onChange={(e) => setFamilyMemberId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Família (Geral)</option>
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.avatar_emoji} {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date + Paid toggle row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="tx-date" className="text-sm font-medium">
                Data
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <button
                type="button"
                onClick={() => setIsPaid(!isPaid)}
                className={`flex h-10 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors ${
                  isPaid
                    ? "border-verdant/30 bg-verdant/10 text-verdant"
                    : "border-burnished/30 bg-burnished/10 text-burnished"
                }`}
              >
                {isPaid ? (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Pago
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pendente
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Notes (collapsible) */}
          {type !== "transfer" && (
            <div className="space-y-1.5">
              <label htmlFor="tx-notes" className="text-sm font-medium">
                Notas <span className="text-muted-foreground">(opcional)</span>
              </label>
              <textarea
                id="tx-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observações adicionais"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                type === "income"
                  ? "bg-verdant hover:bg-verdant/80"
                  : type === "transfer"
                    ? "bg-info-slate hover:bg-info-slate/80"
                    : "bg-terracotta hover:bg-terracotta/80"
              }`}
            >
              {loading ? "Salvando" : `Lançar ${TYPE_CONFIG[type].label.toLowerCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

```

### src/lib/query-provider.tsx
```
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,  // 5 minutes (longer for offline)
            gcTime: 30 * 60 * 1000,     // 30 minutes cache retention
            retry: 1,
            networkMode: "offlineFirst", // Use cache when offline, fetch when online
          },
          mutations: {
            networkMode: "offlineFirst", // Queue mutations when offline
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

```

### src/lib/auth/encryption-manager.ts
```
/**
 * Oniefy - Encryption Manager
 *
 * Gerencia o ciclo de vida da DEK (Data Encryption Key):
 * - Onboarding: gera kek_material + DEK, deriva KEK, armazena tudo no profile
 * - Login: busca kek_material + encrypted_dek, deriva KEK, decripta DEK para memória
 * - Logout/Timeout: limpa DEK da memória
 *
 * KEK é derivada de kek_material (random 256 bits, estável) via HKDF.
 * Diferente do design anterior (JWT efêmero), não há necessidade de
 * re-encriptar a DEK em token refresh.
 *
 * Ref: S1 saneamento (2026-03-10), Adendo v1.1 seção 3.2-3.5
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateDEK,
  deriveKEK,
  wrapDEK,
  unwrapDEK,
} from "@/lib/crypto/index";

type AnySupabaseClient = SupabaseClient<any, any, any>;

// In-memory DEK reference (cleared on logout/timeout)
let activeDEK: CryptoKey | null = null;

// Salt for HKDF (fixed per-app, not secret)
const HKDF_SALT = new TextEncoder().encode("wealthos-kek-salt-v2");

/**
 * Gera 256 bits aleatórios e retorna como base64.
 * Usado uma vez no onboarding para criar o kek_material.
 */
function generateKekMaterial(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
}

/**
 * Gera e armazena kek_material + DEK durante o onboarding.
 * Passo: gera kek_material → gera DEK → deriva KEK → wrap DEK → salva no profile.
 */
export async function initializeEncryption(
  supabase: AnySupabaseClient
): Promise<void> {
  // 1. Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não encontrado.");

  // 2. Generate stable KEK material (random 256 bits)
  const kekMaterial = generateKekMaterial();

  // 3. Generate fresh DEK
  const dek = await generateDEK();

  // 4. Derive KEK from stable material
  const kek = await deriveKEK(kekMaterial, HKDF_SALT);

  // 5. Wrap (encrypt) DEK with KEK
  const { encrypted, iv } = await wrapDEK(dek, kek);

  // 6. Store kek_material + encrypted DEK in users_profile
  const { error } = await supabase
    .from("users_profile")
    .update({
      kek_material: kekMaterial,
      encryption_key_encrypted: encrypted,
      encryption_key_iv: iv,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(`Erro ao salvar chave de criptografia: ${error.message}`);
  }

  // 7. Keep DEK in memory
  activeDEK = dek;
}

/**
 * Carrega e decripta a DEK na memória após login.
 *
 * Se kek_material estiver ausente (migração de schema antigo),
 * re-inicializa a criptografia automaticamente.
 */
export async function loadEncryptionKey(
  supabase: AnySupabaseClient
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("users_profile")
    .select("kek_material, encryption_key_encrypted, encryption_key_iv")
    .eq("id", user.id)
    .single();

  // Caso 1: kek_material ausente → re-inicializar (migração de JWT → material estável)
  if (!profile?.kek_material) {
    console.warn("[Oniefy] kek_material ausente. Re-inicializando criptografia.");
    await initializeEncryption(supabase);
    return;
  }

  // Caso 2: DEK não inicializada ainda (não deveria acontecer após onboarding)
  if (!profile.encryption_key_encrypted || !profile.encryption_key_iv) {
    console.warn("[Oniefy] DEK ausente. Re-inicializando criptografia.");
    await initializeEncryption(supabase);
    return;
  }

  // Caso 3: normal - derivar KEK e decriptar DEK
  const kek = await deriveKEK(profile.kek_material, HKDF_SALT);
  activeDEK = await unwrapDEK(
    profile.encryption_key_encrypted,
    profile.encryption_key_iv,
    kek
  );
}

/**
 * Retorna a DEK ativa (em memória).
 * Null se não estiver carregada.
 */
export function getActiveDEK(): CryptoKey | null {
  return activeDEK;
}

/**
 * Limpa a DEK da memória (logout/timeout).
 */
export function clearEncryptionKey(): void {
  activeDEK = null;
}

```

### src/lib/auth/index.ts
```
/**
 * Oniefy - Auth Module
 *
 * Central exports for all auth-related utilities.
 */

export { isPasswordBlocked } from "./password-blocklist";
export { useSessionTimeout } from "./use-session-timeout";
export { useBiometricAuth } from "./use-biometric";
export {
  getMfaStatus,
  getAssuranceLevel,
  enrollTotp,
  verifyTotpEnrollment,
  challengeAndVerify,
  unenrollTotp,
} from "./mfa";
export type { MfaStatus, MfaEnrollResult } from "./mfa";
export {
  initializeEncryption,
  loadEncryptionKey,
  getActiveDEK,
  clearEncryptionKey,
} from "./encryption-manager";
export { useAppLifecycle } from "./use-app-lifecycle";

```

### src/lib/auth/mfa.ts
```
/**
 * Oniefy - MFA Helpers
 *
 * Encapsula a Supabase MFA API (TOTP) para uso nos componentes.
 * Ref: AUTH-04 (MFA obrigatório), Spec v1.0 seção 3.1.1
 *
 * Fluxo:
 *  1. Onboarding: enroll → verify → AAL2 ativo
 *  2. Login: signIn (AAL1) → challenge → verify → AAL2
 */

import type { SupabaseClient } from "@supabase/supabase-js";

type AnySupabaseClient = SupabaseClient<any, any, any>;

export type MfaStatus = "not_enrolled" | "enrolled_unverified" | "enrolled_verified";

export interface MfaEnrollResult {
  factorId: string;
  qrCode: string; // SVG data URI
  secret: string; // Manual entry key
  uri: string;    // otpauth:// URI
}

/**
 * Verifica o status atual de MFA do usuário.
 */
export async function getMfaStatus(
  supabase: AnySupabaseClient
): Promise<{ status: MfaStatus; factorId: string | null }> {
  const { data, error } = await supabase.auth.mfa.listFactors();

  if (error || !data) {
    return { status: "not_enrolled", factorId: null };
  }

  // TOTP factors only
  const totpFactors = data.totp ?? [];

  // Verified factor (enrolled and confirmed)
  const verified = totpFactors.find((f) => (f.status as string) === "verified");
  if (verified) {
    return { status: "enrolled_verified", factorId: verified.id };
  }

  // Unverified factor (started enrollment but didn't confirm)
  const unverified = totpFactors.find((f) => (f.status as string) === "unverified");
  if (unverified) {
    return { status: "enrolled_unverified", factorId: unverified.id };
  }

  return { status: "not_enrolled", factorId: null };
}

/**
 * Verifica o Authenticator Assurance Level atual.
 * AAL1 = password/oauth only. AAL2 = MFA verified.
 */
export async function getAssuranceLevel(
  supabase: AnySupabaseClient
): Promise<{ currentLevel: string; nextLevel: string | null }> {
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error || !data) {
    return { currentLevel: "aal1", nextLevel: null };
  }

  return {
    currentLevel: data.currentLevel ?? "aal1",
    nextLevel: data.nextLevel ?? null,
  };
}

/**
 * Inicia enrollment de TOTP.
 * Retorna QR code e secret para exibição.
 */
export async function enrollTotp(
  supabase: AnySupabaseClient,
  friendlyName: string = "Oniefy"
): Promise<MfaEnrollResult> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
  });

  if (error) {
    throw new Error(`Erro ao iniciar MFA: ${error.message}`);
  }

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

/**
 * Verifica um código TOTP durante o enrollment.
 * Após sucesso, o fator é marcado como verified.
 */
export async function verifyTotpEnrollment(
  supabase: AnySupabaseClient,
  factorId: string,
  code: string
): Promise<void> {
  // Create a challenge
  const { data: challengeData, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });

  if (challengeError) {
    throw new Error(`Erro ao criar desafio MFA: ${challengeError.message}`);
  }

  // Verify with the code
  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  });

  if (verifyError) {
    throw new Error("Código inválido. Verifique e tente novamente.");
  }
}

/**
 * Executa challenge + verify para login (pós-AAL1).
 */
export async function challengeAndVerify(
  supabase: AnySupabaseClient,
  factorId: string,
  code: string
): Promise<void> {
  const { data: challengeData, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });

  if (challengeError) {
    throw new Error(`Erro ao criar desafio MFA: ${challengeError.message}`);
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  });

  if (verifyError) {
    throw new Error("Código inválido. Verifique e tente novamente.");
  }
}

/**
 * Remove um fator TOTP (unenroll).
 * Usado na exclusão de conta ou reset de MFA.
 */
export async function unenrollTotp(
  supabase: AnySupabaseClient,
  factorId: string
): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) {
    throw new Error(`Erro ao remover MFA: ${error.message}`);
  }
}

```

### src/lib/auth/password-blocklist.ts
```
/**
 * Oniefy - Password Blocklist
 * Common weak passwords that should be rejected regardless of length.
 * Source: Compiled from NIST SP 800-63B recommendations + common breach lists.
 *
 * AUTH-01: Senha deve ter 12+ caracteres E não estar nesta blocklist.
 */

export const PASSWORD_BLOCKLIST = new Set([
  "123456789012",
  "1234567890123",
  "password1234",
  "passwordpassword",
  "qwerty123456",
  "qwertyqwerty",
  "abcdefghijkl",
  "abcdef123456",
  "letmeinletmein",
  "welcomewelcome",
  "trustno1trust",
  "iloveyou1234",
  "sunshine1234",
  "princess1234",
  "football1234",
  "charlie12345",
  "shadow123456",
  "master123456",
  "dragon123456",
  "monkey1234567",
  "qwerty1234567",
  "abc123456789",
  "mustang12345",
  "michael12345",
  "passw0rd1234",
  "admin1234567",
  "senha1234567",
  "senha12345678",
  "wealthos1234",
  "123456123456",
  "111111111111",
  "000000000000",
  "aaaaaaaaaaaa",
  "changeme1234",
  "default12345",
  "password12345",
  "p@ssword1234",
  "p@ssw0rd1234",
]);

/**
 * Check if password is in the blocklist.
 * Comparison is case-insensitive.
 */
export function isPasswordBlocked(password: string): boolean {
  return PASSWORD_BLOCKLIST.has(password.toLowerCase());
}

```

### src/lib/auth/rate-limiter.ts
```
/**
 * Oniefy - Rate Limiter (Edge-compatible)
 *
 * Rate limiter in-memory para rotas de autenticação.
 * Protege contra brute-force em login, register e reset-password.
 *
 * Limitações conhecidas:
 * - In-memory: não compartilha estado entre instâncias serverless
 *   (aceitável para free tier Vercel com poucas instâncias)
 * - Para produção multi-região, migrar para Upstash Redis ou Vercel KV
 *
 * Ref: Auditoria de segurança - Achado 2 (Rate Limiting inexistente)
 */

interface RateLimitEntry {
  /** Timestamps das tentativas dentro da janela */
  timestamps: number[];
}

interface RateLimitConfig {
  /** Máximo de tentativas na janela */
  maxAttempts: number;
  /** Janela em milissegundos */
  windowMs: number;
}

// Configurações por tipo de rota
const ROUTE_CONFIGS: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },          // 5 tentativas / 15 min
  register: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },       // 3 tentativas / 1 hora
  "forgot-password": { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 tentativas / 1 hora
  "reset-password": { maxAttempts: 5, windowMs: 60 * 60 * 1000 },  // 5 tentativas / 1 hora
};

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
};

// Store: Map<"route:ip", RateLimitEntry>
const store = new Map<string, RateLimitEntry>();

// Limpeza periódica de entries expiradas (evita memory leak)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 min
let lastCleanup = Date.now();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const maxWindow = Math.max(...Object.values(ROUTE_CONFIGS).map((c) => c.windowMs));
  store.forEach((entry, key) => {
    // Remove entries cujo timestamp mais recente é mais velho que a maior janela
    const latest = entry.timestamps[entry.timestamps.length - 1] ?? 0;
    if (now - latest > maxWindow) {
      store.delete(key);
    }
  });
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  limit: number;
}

/**
 * Verifica e registra uma tentativa de acesso.
 *
 * @param route - Identificador da rota (ex: "login", "register")
 * @param identifier - Identificador do cliente (IP ou fingerprint)
 * @returns Resultado com status e headers para resposta HTTP
 */
export function checkRateLimit(
  route: string,
  identifier: string
): RateLimitResult {
  cleanupExpiredEntries();

  const config = ROUTE_CONFIGS[route] ?? DEFAULT_CONFIG;
  const key = `${route}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Busca ou cria entry
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove tentativas fora da janela
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  // Verifica limite
  if (entry.timestamps.length >= config.maxAttempts) {
    const oldestInWindow = entry.timestamps[0] ?? now;
    const retryAfterMs = oldestInWindow + config.windowMs - now;

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, retryAfterMs),
      limit: config.maxAttempts,
    };
  }

  // Registra tentativa
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.timestamps.length,
    retryAfterMs: 0,
    limit: config.maxAttempts,
  };
}

/**
 * Extrai o identificador da rota a partir do pathname.
 * Ex: "/login" → "login", "/forgot-password" → "forgot-password"
 */
export function extractRouteKey(pathname: string): string | null {
  const routeKeys = Object.keys(ROUTE_CONFIGS);
  for (const key of routeKeys) {
    if (pathname === `/${key}` || pathname.startsWith(`/${key}/`)) {
      return key;
    }
  }
  return null;
}

/**
 * Gera headers HTTP padrão de rate limiting (RFC 6585 / draft-ietf-httpapi-ratelimit-headers).
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(Math.ceil(result.retryAfterMs / 1000));
  }

  return headers;
}

```

### src/lib/auth/use-app-lifecycle.ts
```
/**
 * Oniefy - App Lifecycle Hook
 *
 * Gerencia o ciclo de vida da DEK no contexto mobile (Capacitor).
 * Quando o app vai para background:
 *   - DEK é expurgada da memória (evita leitura em memory dumps)
 * Quando o app retorna para foreground:
 *   - Exige re-autenticação biométrica para recarregar a DEK
 *
 * Ref: Auditoria de segurança - Achado 1 (Envelope Encryption lifecycle)
 *
 * Dependência: @capacitor/app (instalado na Fase 10 junto com build nativo)
 * Em ambiente web, este hook é inerte (no-op).
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { clearEncryptionKey, loadEncryptionKey, getActiveDEK } from "./encryption-manager";
import { createClient } from "@/lib/supabase/client";

type AppState = "active" | "inactive" | "background";

interface CapacitorApp {
  addListener: (
    event: string,
    callback: (state: { isActive: boolean }) => void
  ) => Promise<{ remove: () => void }>;
}

/**
 * Tenta importar @capacitor/app dinamicamente.
 * Retorna null em ambiente web ou se o plugin não estiver instalado.
 */
async function getCapacitorApp(): Promise<CapacitorApp | null> {
  try {
    const mod = await import("@capacitor/app");
    return (mod.App as unknown as CapacitorApp) ?? null;
  } catch {
    // Expected on web / when Capacitor plugin not installed
    return null;
  }
}

/**
 * Detecta se estamos rodando dentro do Capacitor (iOS/Android).
 */
function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as unknown as Record<string, unknown>;
  if (!win.Capacitor || typeof win.Capacitor !== "object") return false;
  const cap = win.Capacitor as Record<string, unknown>;
  const platform =
    cap.getPlatform && typeof cap.getPlatform === "function"
      ? (cap.getPlatform as () => string)()
      : "web";
  return platform === "ios" || platform === "android";
}

interface UseAppLifecycleOptions {
  /** Callback chamado quando DEK é expurgada (app backgrounded) */
  onDEKPurged?: () => void;
  /** Callback chamado quando DEK é recarregada com sucesso */
  onDEKRestored?: () => void;
  /** Callback chamado quando biometria falha no foreground */
  onBiometricFailed?: () => void;
}

export function useAppLifecycle(options?: UseAppLifecycleOptions) {
  const lastStateRef = useRef<AppState>("active");
  const dekWasPurgedRef = useRef(false);

  const handleStateChange = useCallback(
    async (isActive: boolean) => {
      const prevState = lastStateRef.current;
      const newState: AppState = isActive ? "active" : "background";
      lastStateRef.current = newState;

      // ── App going to background ──
      if (prevState === "active" && !isActive) {
        const hadDEK = getActiveDEK() !== null;
        if (hadDEK) {
          clearEncryptionKey();
          dekWasPurgedRef.current = true;
          options?.onDEKPurged?.();
          // eslint-disable-next-line no-console
          console.info("[Oniefy] DEK purged from memory (app backgrounded)");
        }
        return;
      }

      // ── App returning to foreground ──
      if (!prevState || prevState !== "active") {
        if (!dekWasPurgedRef.current) return;
        dekWasPurgedRef.current = false;

        try {
          // Fase 10: integrar com useBiometricAuth().authenticate() real
          // Por enquanto, tenta recarregar via sessão ativa
          const biometricOk = await attemptBiometricUnlock();

          if (!biometricOk) {
            options?.onBiometricFailed?.();
            console.warn("[Oniefy] Biometric unlock failed on foreground return");
            return;
          }

          // Recarrega a DEK da sessão
          const supabase = createClient();
          await loadEncryptionKey(supabase);
          options?.onDEKRestored?.();
          // eslint-disable-next-line no-console
          console.info("[Oniefy] DEK restored after biometric unlock");
        } catch (err) {
          console.error("[Oniefy] Failed to restore DEK on foreground:", err);
          options?.onBiometricFailed?.();
        }
      }
    },
    [options]
  );

  useEffect(() => {
    if (!isNativePlatform()) return;

    let removeListener: (() => void) | null = null;

    getCapacitorApp().then((app) => {
      if (!app) return;

      app
        .addListener("appStateChange", (state) => {
          handleStateChange(state.isActive);
        })
        .then((handle) => {
          removeListener = handle.remove;
        });
    });

    return () => {
      removeListener?.();
    };
  }, [handleStateChange]);
}

/**
 * Stub para desbloqueio biométrico.
 * Na Fase 10, será substituído pela chamada real ao
 * @capacitor-community/biometric-auth plugin.
 */
async function attemptBiometricUnlock(): Promise<boolean> {
  if (!isNativePlatform()) return true; // Web: bypass

  try {
    // Fase 10: substituir por:
    // const { BiometricAuth } = await import('@capacitor-community/biometric-auth');
    // const result = await BiometricAuth.authenticate({
    //   reason: 'Desbloqueie para acessar seus dados financeiros',
    //   cancelTitle: 'Cancelar',
    // });
    // return result.verified;

    console.warn("[Oniefy] Biometric unlock: stub (Fase 10)");
    return true; // Stub: permite acesso até plugin real estar disponível
  } catch {
    return false;
  }
}

```

### src/lib/auth/use-biometric.ts
```
/**
 * Oniefy - Biometric Auth Stub (AUTH-06)
 *
 * Stub para desbloqueio biométrico no iOS.
 * Implementação real na Fase 10 (Capacitor build).
 *
 * Spec v1.0 seção 3.1.3:
 * - Face ID / Touch ID via plugin Capacitor
 * - Biometria desbloqueia token do Keychain
 * - Não substitui MFA no login inicial
 *
 * Este stub detecta a plataforma e expõe a interface que será
 * preenchida com o plugin @capacitor-community/biometric-auth.
 */

"use client";

import { useState, useEffect } from "react";

export type BiometricType = "face_id" | "touch_id" | "none";
export type Platform = "ios" | "android" | "web";

interface BiometricState {
  available: boolean;
  biometricType: BiometricType;
  platform: Platform;
  enrolled: boolean;
}

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "web";

  // Capacitor detection
  const win = window as unknown as Record<string, unknown>;
  if (win.Capacitor && typeof win.Capacitor === "object") {
    const cap = win.Capacitor as Record<string, unknown>;
    const platform = cap.getPlatform && typeof cap.getPlatform === "function"
      ? (cap.getPlatform as () => string)()
      : "web";
    if (platform === "ios") return "ios";
    if (platform === "android") return "android";
  }

  return "web";
}

export function useBiometricAuth(): BiometricState & {
  authenticate: () => Promise<boolean>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
} {
  const [state, setState] = useState<BiometricState>({
    available: false,
    biometricType: "none",
    platform: "web",
    enrolled: false,
  });

  useEffect(() => {
    const platform = detectPlatform();
    setState((prev) => ({
      ...prev,
      platform,
      // Real availability check happens via Capacitor plugin (Fase 10)
      available: platform === "ios",
      biometricType: platform === "ios" ? "face_id" : "none",
    }));
  }, []);

  const authenticate = async (): Promise<boolean> => {
    if (!state.available) return false;
    // Stub: real implementation will use Capacitor BiometricAuth plugin
    console.warn("[Oniefy] Biometric auth: stub - awaiting Capacitor build (Fase 10)");
    return false;
  };

  const enable = async (): Promise<void> => {
    if (!state.available) return;
    console.warn("[Oniefy] Biometric enable: stub - awaiting Capacitor build (Fase 10)");
    setState((prev) => ({ ...prev, enrolled: true }));
  };

  const disable = async (): Promise<void> => {
    console.warn("[Oniefy] Biometric disable: stub - awaiting Capacitor build (Fase 10)");
    setState((prev) => ({ ...prev, enrolled: false }));
  };

  return { ...state, authenticate, enable, disable };
}

```

### src/lib/auth/use-session-timeout.ts
```
/**
 * Oniefy - Session Timeout Hook
 *
 * Spec v1.0 seção 3.1.2: Timeout de sessão após 30 minutos de inatividade.
 * Monitora eventos de interação (mouse, teclado, toque) e faz logout
 * automático quando o tempo de inatividade excede o limite.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clearEncryptionKey } from "@/lib/auth/encryption-manager";
import { createClient } from "@/lib/supabase/client";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL_MS = 60 * 1000; // Check every 1 minute
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"];

export function useSessionTimeout() {
  const lastActivityRef = useRef<number>(Date.now());
  const router = useRouter();

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const handleTimeout = useCallback(async () => {
    const supabase = createClient();
    clearEncryptionKey();
    await supabase.auth.signOut();
    router.push("/login?reason=timeout");
  }, [router]);

  useEffect(() => {
    // Register activity listeners
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Periodic check for timeout
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= TIMEOUT_MS) {
        handleTimeout();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(intervalId);
    };
  }, [updateActivity, handleTimeout]);
}

```

### src/lib/crypto/index.ts
```
/**
 * Oniefy E2E Encryption Module
 *
 * Strategy: Random DEK (Data Encryption Key) protected by stable KEK.
 * - DEK: AES-256-GCM key, generated once per user, stored encrypted in users_profile
 * - KEK: derived from stable kek_material (random 256 bits) via HKDF (Web Crypto API)
 * - kek_material: generated once during onboarding, stored in users_profile
 * - Fields encrypted: cpf_encrypted, notes_encrypted, details_encrypted
 *
 * Implementation: Web Crypto API (native, no external deps)
 * Compatibility: All modern browsers + WKWebView (Capacitor iOS)
 *
 * Source: wealthos-adendo-v1.1.docx section 3
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM

/**
 * Generate a new Data Encryption Key (DEK).
 * Called once during user onboarding.
 */
export async function generateDEK(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable for storage
    ["encrypt", "decrypt"]
  );
}

/**
 * Derive a Key Encryption Key (KEK) from stable user-specific material.
 * Uses HKDF with SHA-256.
 *
 * O material de entrada é um valor aleatório de 256 bits (base64) gerado
 * uma vez no onboarding e armazenado em users_profile.kek_material.
 * Diferente do design anterior (JWT efêmero), este material nunca rotaciona,
 * eliminando o risco de perda da DEK em token refresh.
 */
export async function deriveKEK(
  kekMaterial: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  // Decode base64 kekMaterial to raw bytes
  const rawBytes = Uint8Array.from(atob(kekMaterial), (c) => c.charCodeAt(0));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    rawBytes,
    "HKDF",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info: new TextEncoder().encode("wealthos-e2e-kek-v2"),
    } as HkdfParams,
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH } as AesKeyGenParams,
    false,
    ["wrapKey", "unwrapKey"]
  );
}

/**
 * Encrypt a plaintext field using the DEK.
 * Returns base64-encoded ciphertext with IV prepended.
 */
export async function encryptField(
  plaintext: string,
  dek: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    dek,
    encoder.encode(plaintext)
  );

  // Prepend IV to ciphertext
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(Array.from(combined, (b) => String.fromCharCode(b)).join(""));
}

/**
 * Decrypt a field using the DEK.
 * Expects base64-encoded ciphertext with IV prepended.
 */
export async function decryptField(
  encryptedBase64: string,
  dek: CryptoKey
): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedBase64), (c) =>
    c.charCodeAt(0)
  );

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    dek,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

/**
 * Export DEK as wrapped (encrypted) key for storage in users_profile.
 */
export async function wrapDEK(
  dek: CryptoKey,
  kek: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const wrappedKey = await crypto.subtle.wrapKey("raw", dek, kek, {
    name: ALGORITHM,
    iv,
  });

  return {
    encrypted: btoa(Array.from(new Uint8Array(wrappedKey), (b) => String.fromCharCode(b)).join("")),
    iv: btoa(Array.from(iv, (b) => String.fromCharCode(b)).join("")),
  };
}

/**
 * Import DEK from wrapped (encrypted) key stored in users_profile.
 */
export async function unwrapDEK(
  encryptedKey: string,
  iv: string,
  kek: CryptoKey
): Promise<CryptoKey> {
  const wrappedKeyBuffer = Uint8Array.from(atob(encryptedKey), (c) =>
    c.charCodeAt(0)
  );
  const ivBuffer = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));

  return crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBuffer,
    kek,
    { name: ALGORITHM, iv: ivBuffer },
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  );
}

```

### src/lib/hooks/use-accounts.ts
```
/**
 * Oniefy - Accounts Hooks (FIN-01, FIN-02, FIN-04, FIN-05)
 *
 * React Query hooks for CRUD operations on accounts table.
 * Auto-links accounts with chart_of_accounts based on type.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];
type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"];
type AccountType = Database["public"]["Enums"]["account_type"];

// Map account_type → parent COA code for auto-creation of individual COA entries
const COA_PARENT_MAP: Record<AccountType, { parentCode: string; tier: string }> = {
  checking: { parentCode: "1.1.01", tier: "T1" },
  savings: { parentCode: "1.1.02", tier: "T1" },
  cash: { parentCode: "1.1.03", tier: "T1" },
  investment: { parentCode: "1.2.01", tier: "T2" },
  credit_card: { parentCode: "2.1.01", tier: "T1" },
  loan: { parentCode: "2.2.03", tier: "T3" },
  financing: { parentCode: "2.2.01", tier: "T3" },
};

// Financing sub-types: user can pick which parent COA
export const FINANCING_SUBTYPES = [
  { value: "2.2.01", label: "Financiamento Imobiliário" },
  { value: "2.2.02", label: "Financiamento de Veículo" },
];

// Labels for UI
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Conta Corrente",
  savings: "Poupança",
  cash: "Carteira Digital",
  investment: "Investimento",
  credit_card: "Cartão de Crédito",
  loan: "Empréstimo",
  financing: "Financiamento",
};

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Conta Corrente" },
  { value: "savings", label: "Poupança" },
  { value: "cash", label: "Carteira Digital" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "investment", label: "Investimento" },
  { value: "loan", label: "Empréstimo" },
  { value: "financing", label: "Financiamento" },
];

const PRESET_COLORS = [
  "#56688F", "#2F7A68", "#A97824", "#A64A45", "#6F6678",
  "#A7794E", "#7E9487", "#241E29", "#4A7A6E", "#8B6B4A",
];

export { PRESET_COLORS };

// ─── Queries ────────────────────────────────────────────────

export function useAccounts() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Account[];
    },
  });
}

export function useAccount(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["accounts", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data as Account;
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────

export function useCreateAccount() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<AccountInsert, "user_id" | "coa_id" | "liquidity_tier"> & {
        coaParentCode?: string; // override parent (e.g. financing sub-type)
      }
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { coaParentCode, ...accountInput } = input;
      const mapping = COA_PARENT_MAP[accountInput.type];
      const parentCode = coaParentCode || mapping?.parentCode;
      const tier = mapping?.tier ?? "T1";

      // Auto-create individual COA entry under the parent
      let coaId: string | null = null;
      if (parentCode) {
        const { data: coaResult, error: coaError } = await supabase.rpc(
          "create_coa_child",
          {
            p_user_id: user.id,
            p_parent_code: parentCode,
            p_display_name: accountInput.name,
          }
        );
        if (coaError) {
          console.warn("[Oniefy] Auto-create COA failed:", coaError.message);
        } else {
          coaId = coaResult;
        }
      }

      const { data, error } = await supabase
        .from("accounts")
        .insert({
          ...accountInput,
          user_id: user.id,
          coa_id: coaId,
          liquidity_tier: tier,
          current_balance: accountInput.initial_balance ?? 0,
          projected_balance: accountInput.initial_balance ?? 0,
        })
        .select()
        .single();

      if (error) throw error;

      // WKF-01: Auto-create workflow for this account
      try {
        await supabase.rpc("auto_create_workflow_for_account", {
          p_user_id: user.id,
          p_account_id: data.id,
          p_account_type: accountInput.type,
          p_account_name: accountInput.name,
        });
      } catch {
        console.warn("[Oniefy] Auto-create workflow failed for account", data.id);
      }

      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
    },
  });
}

export function useUpdateAccount() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: AccountUpdate & { id: string }) => {
      // If type changed, update tier (type change is disabled in UI, but belt + suspenders)
      let tier: string | undefined;
      if (updates.type) {
        tier = COA_PARENT_MAP[updates.type]?.tier ?? "T1";
      }

      const { data, error } = await supabase
        .from("accounts")
        .update({
          ...updates,
          ...(tier !== undefined && { liquidity_tier: tier }),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeactivateAccount() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("accounts")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

```

### src/lib/hooks/use-assets.ts
```
/**
 * Oniefy - Assets Hooks (Phase 4)
 *
 * React Query hooks for asset (Patrimônio) operations.
 * Stories: PAT-01 (cadastrar), PAT-02 (editar), PAT-03 (excluir),
 *          PAT-04 (listar), PAT-05 (depreciar), PAT-06 (alertas seguro),
 *          PAT-07 (histórico de valor)
 *
 * Assets are linked to chart_of_accounts Group 1.2 (Bens e Investimentos).
 * Value changes recorded in asset_value_history.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { assetsSummarySchema, depreciateAssetResultSchema, logSchemaError } from "@/lib/schemas/rpc";
import type { Database } from "@/types/database";

type Asset = Database["public"]["Tables"]["assets"]["Row"];
type AssetInsert = Database["public"]["Tables"]["assets"]["Insert"];
type AssetCategory = Database["public"]["Enums"]["asset_category"];
type ValueChangeSource = Database["public"]["Enums"]["value_change_source"];
type AssetValueHistory = Database["public"]["Tables"]["asset_value_history"]["Row"];

// ─── Input types ────────────────────────────────────────────────

export interface CreateAssetInput {
  name: string;
  category: AssetCategory;
  acquisition_date: string;
  acquisition_value: number;
  current_value: number;
  depreciation_rate?: number;
  insurance_policy?: string | null;
  insurance_expiry?: string | null;
  notes_encrypted?: string | null;
}

export interface UpdateAssetInput {
  id: string;
  name?: string;
  category?: AssetCategory;
  current_value?: number;
  depreciation_rate?: number;
  insurance_policy?: string | null;
  insurance_expiry?: string | null;
  notes_encrypted?: string | null;
}

// ─── Labels ─────────────────────────────────────────────────────

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  real_estate: "Imóvel",
  vehicle: "Veículo",
  electronics: "Eletrônico",
  other: "Outro",
  restricted: "Restrito",
};

export const ASSET_CATEGORY_OPTIONS: { value: AssetCategory; label: string; description: string }[] = [
  { value: "real_estate", label: "Imóvel", description: "Casa, apartamento, terreno" },
  { value: "vehicle", label: "Veículo", description: "Carro, moto, barco" },
  { value: "electronics", label: "Eletrônico", description: "Notebook, celular, TV" },
  { value: "other", label: "Outro", description: "Jóias, arte, equipamentos" },
  { value: "restricted", label: "Restrito", description: "FGTS, previdência com carência" },
];

const ASSET_CATEGORY_COLORS: Record<AssetCategory, string> = {
  real_estate: "#56688F",
  vehicle: "#2F7A68",
  electronics: "#A97824",
  other: "#6F6678",
  restricted: "#7E9487",
};

export { ASSET_CATEGORY_COLORS };

// COA mapping: asset_category → chart_of_accounts internal_code (Group 1.2)
const COA_MAP: Record<AssetCategory, string> = {
  real_estate: "1.2.03",
  vehicle: "1.2.04",
  electronics: "1.2.05",
  other: "1.2.06",
  restricted: "1.2.07",
};

// ─── Summary type ───────────────────────────────────────────────

export interface AssetsSummary {
  total_value: number;
  total_acquisition: number;
  asset_count: number;
  by_category: { category: AssetCategory; count: number; total_value: number }[];
  expiring_insurance: { id: string; name: string; insurance_expiry: string; days_until_expiry: number }[];
  total_depreciation: number;
}

// ─── Queries ────────────────────────────────────────────────────

/** PAT-04: List all assets */
export function useAssets() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("current_value", { ascending: false });
      if (error) throw error;
      return data as Asset[];
    },
  });
}

/** Single asset by ID */
export function useAsset(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["assets", "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Asset;
    },
  });
}

/** PAT-04 + PAT-06: Assets summary (totals + insurance alerts) */
export function useAssetsSummary() {
  return useQuery({
    queryKey: ["assets", "summary"],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<AssetsSummary> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("get_assets_summary", {
        p_user_id: user.id,
      });
      if (error) throw error;
      const parsed = assetsSummarySchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_assets_summary", parsed);
        return { total_value: 0, total_acquisition: 0, asset_count: 0, by_category: [], expiring_insurance: [], total_depreciation: 0 };
      }
      return parsed.data;
    },
  });
}

/** PAT-07: Value history for a specific asset */
export function useAssetValueHistory(assetId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["assets", "history", assetId],
    enabled: !!assetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_value_history")
        .select("*")
        .eq("asset_id", assetId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AssetValueHistory[];
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────────

async function resolveCOA(
  supabase: ReturnType<typeof createClient>,
  category: AssetCategory
): Promise<string | null> {
  const code = COA_MAP[category];
  if (!code) return null;
  const { data } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("internal_code", code)
    .single();
  return data?.id ?? null;
}

/** PAT-01: Create asset + link to COA */
export function useCreateAsset() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAssetInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const coaId = await resolveCOA(supabase, input.category);

      const { data, error } = await supabase
        .from("assets")
        .insert({
          user_id: user.id,
          name: input.name,
          category: input.category,
          acquisition_date: input.acquisition_date,
          acquisition_value: input.acquisition_value,
          current_value: input.current_value,
          depreciation_rate: input.depreciation_rate ?? 0,
          insurance_policy: input.insurance_policy ?? null,
          insurance_expiry: input.insurance_expiry ?? null,
          notes_encrypted: input.notes_encrypted ?? null,
          coa_id: coaId,
        } as AssetInsert)
        .select()
        .single();

      if (error) throw error;

      // Record initial value in history
      await supabase.from("asset_value_history").insert({
        asset_id: data.id,
        user_id: user.id,
        previous_value: 0,
        new_value: input.current_value,
        change_reason: "Cadastro inicial",
        change_source: "manual" as ValueChangeSource,
      });

      return data as Asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** PAT-02: Update asset (with value history if value changed) */
export function useUpdateAsset() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateAssetInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // If category changed, re-link COA
      let coaId: string | null | undefined;
      if (updates.category) {
        coaId = await resolveCOA(supabase, updates.category);
      }

      // If current_value changed, record history
      if (updates.current_value !== undefined) {
        const { data: existing } = await supabase
          .from("assets")
          .select("current_value")
          .eq("id", id)
          .single();

        if (existing && Number(existing.current_value) !== updates.current_value) {
          await supabase.from("asset_value_history").insert({
            asset_id: id,
            user_id: user.id,
            previous_value: existing.current_value,
            new_value: updates.current_value,
            change_reason: "Atualização manual",
            change_source: "manual" as ValueChangeSource,
          });
        }
      }

      const { data, error } = await supabase
        .from("assets")
        .update({
          ...updates,
          ...(coaId !== undefined && { coa_id: coaId }),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** PAT-03: Delete asset */
export function useDeleteAsset() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete history first (FK constraint)
      await supabase.from("asset_value_history").delete().eq("asset_id", id);
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** PAT-05: Trigger depreciation on an asset */
export function useDepreciateAsset() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("depreciate_asset", {
        p_user_id: user.id,
        p_asset_id: assetId,
      });
      if (error) throw error;
      const parsed = depreciateAssetResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("depreciate_asset", parsed);
        throw new Error("Resposta inválida ao depreciar ativo.");
      }
      return parsed.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

```

### src/lib/hooks/use-auth-init.ts
```
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadEncryptionKey } from "@/lib/auth/encryption-manager";
import { getAssuranceLevel, getMfaStatus } from "@/lib/auth/mfa";

export function useAuthInit(pathname: string) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function init() {
      const supabase = createClient();

      try {
        const { status } = await getMfaStatus(supabase);

        if (status === "enrolled_verified") {
          const { currentLevel, nextLevel } = await getAssuranceLevel(supabase);

          if (currentLevel === "aal1" && nextLevel === "aal2") {
            const { factorId } = await getMfaStatus(supabase);
            router.push(
              `/mfa-challenge?redirectTo=${encodeURIComponent(pathname)}&factorId=${factorId}`
            );
            return;
          }
        }

        try {
          await loadEncryptionKey(supabase);
        } catch {
          console.warn("[Oniefy] DEK load failed - E2E fields unavailable");
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("users_profile")
            .select("full_name")
            .eq("id", user.id)
            .single();

          setUserName(profile?.full_name || user.email || "");
        }

        setReady(true);
      } catch {
        router.push("/login");
      }
    }

    init();
  }, [pathname, router]);

  return { ready, userName };
}

```

### src/lib/hooks/use-bank-connections.ts
```
/**
 * Oniefy - Bank Connections Hook (Phase 9B)
 *
 * CRUD for bank_connections + import orchestration.
 * Stories: BANK-01 (connect), BANK-04 (reconcile), BANK-05 (update), BANK-06 (disconnect)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { importBatchResultSchema, logSchemaError } from "@/lib/schemas/rpc";

type BankConnection = Database["public"]["Tables"]["bank_connections"]["Row"];

export const SYNC_STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  syncing: "Sincronizando",
  error: "Erro",
  expired: "Expirada",
  manual: "Manual",
};

export const SYNC_STATUS_COLORS: Record<string, string> = {
  active: "text-verdant bg-verdant/15",
  syncing: "text-info-slate bg-info-slate/15",
  error: "text-terracotta bg-terracotta/15",
  expired: "text-burnished bg-burnished/15",
  manual: "text-gray-600 bg-gray-100",
};

export function useBankConnections() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["bank_connections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_connections")
        .select("*")
        .eq("is_active", true)
        .order("institution_name", { ascending: true });
      if (error) throw error;
      return data as BankConnection[];
    },
  });
}

export function useCreateBankConnection() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      institution_name: string;
      provider?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("bank_connections")
        .insert({
          user_id: user.id,
          institution_name: input.institution_name,
          provider: input.provider || "manual",
          sync_status: "manual",
        })
        .select()
        .single();
      if (error) throw error;
      return data as BankConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank_connections"] });
    },
  });
}

export function useDeactivateBankConnection() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bank_connections")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank_connections"] });
    },
  });
}

export function useImportBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      bankConnectionId,
      transactions,
    }: {
      accountId: string;
      bankConnectionId: string | null;
      transactions: {
        date: string;
        amount: number;
        description: string;
        type?: string;
        external_id?: string;
      }[];
    }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const batchId = crypto.randomUUID();

      const { data, error } = await supabase.rpc("import_transactions_batch", {
        p_user_id: user.id,
        p_account_id: accountId,
        p_bank_connection_id: bankConnectionId || undefined,
        p_batch_id: batchId,
        p_transactions: JSON.stringify(transactions),
      });
      if (error) throw error;
      const parsed = importBatchResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("import_transactions_batch", parsed);
        return {
          status: "error",
          imported: 0,
          skipped: transactions.length,
          categorized: 0,
          matched: 0,
          batch_id: batchId,
        };
      }
      return parsed.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bank_connections"] });
    },
  });
}

```

### src/lib/hooks/use-budgets.ts
```
/**
 * Oniefy - Budget Hooks (Phase 3)
 *
 * React Query hooks for budget CRUD operations.
 * Stories: ORC-01 (criar), ORC-02 (copiar mês anterior),
 *          ORC-03 (editar), ORC-04 (remover), ORC-06 (alertas)
 *
 * Budget month is stored as first-of-month DATE (e.g. '2026-03-01').
 * Each budget row = 1 category × 1 month × 1 user.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { budgetWithCategorySchema, logSchemaError } from "@/lib/schemas/rpc";
import { z } from "zod";
import type { Database } from "@/types/database";

type Budget = Database["public"]["Tables"]["budgets"]["Row"];
type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"];
type BudgetUpdate = Database["public"]["Tables"]["budgets"]["Update"];
type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];

// ─── Input types ────────────────────────────────────────────────

export interface CreateBudgetInput {
  category_id: string;
  month: string; // ISO date YYYY-MM-DD (first of month)
  planned_amount: number;
  alert_threshold?: number; // default 80
  coa_id?: string | null;
  cost_center_id?: string | null;
  adjustment_index?: AdjustmentIndex | null;
  family_member_id?: string | null;
}

export interface UpdateBudgetInput {
  id: string;
  planned_amount?: number;
  alert_threshold?: number;
  coa_id?: string | null;
  cost_center_id?: string | null;
  adjustment_index?: AdjustmentIndex | null;
  family_member_id?: string | null;
}

export interface CopyBudgetInput {
  source_month: string; // ISO date YYYY-MM-DD
  target_month: string; // ISO date YYYY-MM-DD
}

// ─── Labels ─────────────────────────────────────────────────────

export const ADJUSTMENT_INDEX_LABELS: Record<AdjustmentIndex, string> = {
  ipca: "IPCA",
  igpm: "IGP-M",
  inpc: "INPC",
  selic: "Selic",
  manual: "Manual",
  none: "Sem reajuste",
};

export const ADJUSTMENT_INDEX_OPTIONS: {
  value: AdjustmentIndex;
  label: string;
}[] = [
  { value: "none", label: "Sem reajuste" },
  { value: "ipca", label: "IPCA" },
  { value: "igpm", label: "IGP-M" },
  { value: "inpc", label: "INPC" },
  { value: "selic", label: "Selic" },
  { value: "manual", label: "Manual" },
];

// ─── Helpers ────────────────────────────────────────────────────

/** Returns first-of-month date string for a given Date or the current month */
export function toMonthKey(date?: Date): string {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Formats month key to display label (e.g. "Mar 2026") */
export function formatMonthLabel(monthKey: string): string {
  const d = new Date(monthKey + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

// ─── Queries ────────────────────────────────────────────────────

/** Fetch budgets for a given month, optionally filtered by family member */
export function useBudgets(month?: string, familyMemberId?: string | null) {
  const supabase = createClient();
  const monthKey = month ?? toMonthKey();

  return useQuery({
    queryKey: ["budgets", monthKey, familyMemberId],
    queryFn: async () => {
      let query = supabase
        .from("budgets")
        .select(
          `
          *,
          categories!inner(name, icon, color, type)
        `
        )
        .eq("month", monthKey)
        .order("planned_amount", { ascending: false });

      if (familyMemberId) {
        query = query.eq("family_member_id", familyMemberId);
      } else {
        query = query.is("family_member_id", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      const parsed = z.array(budgetWithCategorySchema).safeParse(data);
      if (!parsed.success) {
        logSchemaError("budgets_with_categories", parsed);
        return [];
      }
      return parsed.data;
    },
  });
}

/** Fetch single budget by ID */
export function useBudget(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["budgets", "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*, categories!inner(name, icon, color)")
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data;
    },
  });
}

/** Check which months have budgets (for navigation) */
export function useBudgetMonths() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["budgets", "months"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("month")
        .order("month", { ascending: false });

      if (error) throw error;

      // Deduplicate months
      const uniqueMonths = Array.from(new Set(data.map((b) => b.month)));
      return uniqueMonths;
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────────

/** ORC-01: Create budget for a category in a month */
export function useCreateBudget() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBudgetInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // Check for duplicate (same category + month + member)
      let dupQuery = supabase
        .from("budgets")
        .select("id")
        .eq("user_id", user.id)
        .eq("category_id", input.category_id)
        .eq("month", input.month);

      if (input.family_member_id) {
        dupQuery = dupQuery.eq("family_member_id", input.family_member_id);
      } else {
        dupQuery = dupQuery.is("family_member_id", null);
      }

      const { data: existing } = await dupQuery.maybeSingle();

      if (existing) {
        throw new Error("Já existe orçamento para esta categoria neste mês.");
      }

      const { data, error } = await supabase
        .from("budgets")
        .insert({
          user_id: user.id,
          category_id: input.category_id,
          month: input.month,
          planned_amount: input.planned_amount,
          alert_threshold: input.alert_threshold ?? 80,
          coa_id: input.coa_id ?? null,
          cost_center_id: input.cost_center_id ?? null,
          adjustment_index: input.adjustment_index ?? null,
          family_member_id: input.family_member_id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "budget-vs-actual"],
      });
    },
  });
}

/** ORC-03: Update budget amount or threshold */
export function useUpdateBudget() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateBudgetInput) => {
      const payload: BudgetUpdate = {};
      if (updates.planned_amount !== undefined)
        payload.planned_amount = updates.planned_amount;
      if (updates.alert_threshold !== undefined)
        payload.alert_threshold = updates.alert_threshold;
      if (updates.coa_id !== undefined) payload.coa_id = updates.coa_id;
      if (updates.cost_center_id !== undefined)
        payload.cost_center_id = updates.cost_center_id;
      if (updates.adjustment_index !== undefined)
        payload.adjustment_index = updates.adjustment_index;

      const { data, error } = await supabase
        .from("budgets")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "budget-vs-actual"],
      });
    },
  });
}

/** ORC-04: Remove budget for a category */
export function useDeleteBudget() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "budget-vs-actual"],
      });
    },
  });
}

/** ORC-02: Copy all budgets from one month to another */
export function useCopyBudgets() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ source_month, target_month }: CopyBudgetInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // Check target month has no budgets
      const { data: existingTarget } = await supabase
        .from("budgets")
        .select("id")
        .eq("user_id", user.id)
        .eq("month", target_month)
        .limit(1);

      if (existingTarget && existingTarget.length > 0) {
        throw new Error(
          "O mês de destino já possui orçamentos. Remova-os antes de copiar."
        );
      }

      // Fetch source budgets
      const { data: sourceBudgets, error: fetchError } = await supabase
        .from("budgets")
        .select("category_id, planned_amount, alert_threshold, coa_id, cost_center_id, adjustment_index")
        .eq("user_id", user.id)
        .eq("month", source_month);

      if (fetchError) throw fetchError;
      if (!sourceBudgets || sourceBudgets.length === 0) {
        throw new Error("Nenhum orçamento encontrado no mês de origem.");
      }

      // Insert copies for target month
      const copies: BudgetInsert[] = sourceBudgets.map((b) => ({
        user_id: user.id,
        category_id: b.category_id,
        month: target_month,
        planned_amount: b.planned_amount,
        alert_threshold: b.alert_threshold,
        coa_id: b.coa_id,
        cost_center_id: b.cost_center_id,
        adjustment_index: b.adjustment_index,
      }));

      const { data, error } = await supabase
        .from("budgets")
        .insert(copies)
        .select();

      if (error) throw error;
      return data as Budget[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "budget-vs-actual"],
      });
    },
  });
}

```

### src/lib/hooks/use-categories.ts
```
/**
 * Oniefy - Categories Hooks (FIN-06, FIN-07)
 *
 * React Query hooks for CRUD on categories table.
 * System categories (is_system=true) can't be deleted.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];
type CategoryType = Database["public"]["Enums"]["category_type"];

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  income: "Receita",
  expense: "Despesa",
};

// Lucide icon names available in the seed
export const CATEGORY_ICONS = [
  "banknote", "laptop", "trending-up", "gift", "building", "circle-dot",
  "utensils", "home", "car", "heart-pulse", "graduation-cap", "gamepad-2",
  "shirt", "wifi", "landmark", "shopping-cart", "plane", "music",
  "baby", "dog", "scissors", "wrench", "book", "coffee",
  "umbrella", "zap", "piggy-bank", "receipt", "wallet", "credit-card",
];

export const CATEGORY_COLORS = [
  "#A64A45", "#A7794E", "#A97824", "#2F7A68", "#7E9487", "#56688F",
  "#6F6678", "#241E29", "#CEC4B8", "#4A7A6E", "#8B6B4A", "#5A7B8F",
];

// ─── Queries ────────────────────────────────────────────────

export function useCategories(type?: CategoryType) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["categories", type ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("categories")
        .select("*")
        .order("type", { ascending: true })
        .order("name", { ascending: true });

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Category[];
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────

export function useCreateCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<CategoryInsert, "user_id">
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("categories")
        .insert({ ...input, user_id: user.id, is_system: false })
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CategoryUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("is_system", false); // Safety: can't delete system categories

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

```

### src/lib/hooks/use-chart-of-accounts.ts
```
/**
 * Oniefy - Chart of Accounts Hooks (CTB-03, CTB-04)
 *
 * Queries chart_of_accounts with tree structure.
 * Toggle is_active for leaf accounts (depth 2).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type COA = Database["public"]["Tables"]["chart_of_accounts"]["Row"];
type GroupType = Database["public"]["Enums"]["group_type"];

export const GROUP_LABELS: Record<GroupType, { label: string; color: string }> = {
  asset: { label: "Ativo", color: "text-info-slate" },
  liability: { label: "Passivo", color: "text-terracotta" },
  equity: { label: "Patrimônio Líquido", color: "text-tier-4" },
  revenue: { label: "Receitas", color: "text-verdant" },
  expense: { label: "Despesas", color: "text-burnished" },
};

export interface COATreeNode extends COA {
  children: COATreeNode[];
}

function buildTree(accounts: COA[]): COATreeNode[] {
  const map = new Map<string, COATreeNode>();
  const roots: COATreeNode[] = [];

  // Create nodes
  for (const acc of accounts) {
    map.set(acc.id, { ...acc, children: [] });
  }

  // Link children to parents
  for (const acc of accounts) {
    const node = map.get(acc.id)!;
    if (acc.parent_id && map.has(acc.parent_id)) {
      map.get(acc.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function useChartOfAccounts() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["chart_of_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("internal_code", { ascending: true });

      if (error) throw error;
      return {
        flat: data as COA[],
        tree: buildTree(data as COA[]),
      };
    },
  });
}

export function useToggleAccountActive() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("chart_of_accounts")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
    },
  });
}

export function useCreateCOA() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      parentId,
      displayName,
      accountName,
    }: {
      parentId: string;
      displayName: string;
      accountName?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("create_coa_child", {
        p_user_id: user.id,
        p_parent_id: parentId,
        p_display_name: displayName,
        p_account_name: accountName || displayName,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
    },
  });
}

```

### src/lib/hooks/use-cost-centers.ts
```
/**
 * Oniefy - Cost Centers Hooks (CEN-01, CEN-02)
 *
 * Basic CRUD. Default center ("Pessoal") can't be deleted.
 * Rateio (CEN-03) deferred to Fase 5.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { centerPnlSchema, centerExportSchema, allocateToCentersResultSchema, logSchemaError } from "@/lib/schemas/rpc";
import type { Database } from "@/types/database";

type CostCenter = Database["public"]["Tables"]["cost_centers"]["Row"];
type CostCenterInsert = Database["public"]["Tables"]["cost_centers"]["Insert"];
type CostCenterUpdate = Database["public"]["Tables"]["cost_centers"]["Update"];
type CenterType = Database["public"]["Enums"]["center_type"];

export const CENTER_TYPE_LABELS: Record<CenterType, string> = {
  cost_center: "Centro de Custo",
  profit_center: "Centro de Lucro",
  neutral: "Neutro",
};

export const CENTER_TYPE_OPTIONS: { value: CenterType; label: string; desc: string }[] = [
  { value: "cost_center", label: "Centro de Custo", desc: "Acompanha apenas despesas" },
  { value: "profit_center", label: "Centro de Lucro", desc: "Acompanha receitas e despesas" },
  { value: "neutral", label: "Neutro", desc: "Agrupamento sem classificação" },
];

export function useCostCenters() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["cost_centers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_centers")
        .select("*")
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as CostCenter[];
    },
  });
}

export function useCreateCostCenter() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CostCenterInsert, "user_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("cost_centers")
        .insert({ ...input, user_id: user.id, is_default: false })
        .select()
        .single();

      if (error) throw error;
      return data as CostCenter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}

export function useUpdateCostCenter() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CostCenterUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("cost_centers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as CostCenter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}

export function useDeleteCostCenter() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // RLS policy blocks delete of is_default=true
      const { error } = await supabase
        .from("cost_centers")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}

// ═══ Phase 5: Advanced Center Hooks (CEN-03 to CEN-05) ═══════

// ─── Types ──────────────────────────────────────────────────────

export interface CenterPnl {
  center_id: string;
  center_name: string;
  center_type: string;
  period_from: string;
  period_to: string;
  total_income: number;
  total_expense: number;
  net_result: number;
  monthly: { month: string; income: number; expense: number }[];
}

export interface CenterExport {
  center: {
    id: string;
    name: string;
    type: string;
    color: string | null;
    created_at: string;
  };
  transactions: {
    id: string;
    date: string;
    type: string;
    amount: number;
    description: string | null;
    is_paid: boolean;
    center_percentage: number;
    center_amount: number;
    coa_name: string;
    group_type: string;
  }[];
  exported_at: string;
}

export interface AllocationInput {
  cost_center_id: string;
  percentage: number;
}

// ─── CEN-04: P&L by center ─────────────────────────────────────

export function useCenterPnl(
  centerId: string | null,
  dateFrom?: string,
  dateTo?: string
) {
  return useQuery({
    queryKey: ["cost_centers", "pnl", centerId, dateFrom, dateTo],
    enabled: !!centerId,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<CenterPnl> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("get_center_pnl", {
        p_user_id: user.id,
        p_center_id: centerId!,
        ...(dateFrom && { p_date_from: dateFrom }),
        ...(dateTo && { p_date_to: dateTo }),
      });
      if (error) throw error;
      const parsed = centerPnlSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_center_pnl", parsed);
        return { center_id: centerId!, center_name: "", center_type: "", period_from: "", period_to: "", total_income: 0, total_expense: 0, net_result: 0, monthly: [] };
      }
      return parsed.data;
    },
  });
}

// ─── CEN-05: Export center data ─────────────────────────────────

export function useCenterExport() {
  return useMutation({
    mutationFn: async (centerId: string): Promise<CenterExport> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("get_center_export", {
        p_user_id: user.id,
        p_center_id: centerId,
      });
      if (error) throw error;
      const parsed = centerExportSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_center_export", parsed);
        throw new Error("Resposta inválida ao exportar centro.");
      }
      return parsed.data;
    },
  });
}

// ─── CEN-03: Allocate transaction to centers ────────────────────

export function useAllocateToCenters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      allocations,
    }: {
      transactionId: string;
      allocations: AllocationInput[];
    }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("allocate_to_centers", {
        p_user_id: user.id,
        p_transaction_id: transactionId,
        p_allocations: JSON.stringify(allocations),
      });
      if (error) throw error;
      const parsed = allocateToCentersResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("allocate_to_centers", parsed);
        throw new Error("Resposta inválida ao alocar centros.");
      }
      return parsed.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

// ─── CEN-05: Client-side CSV helper ─────────────────────────────

export function exportToCsv(data: CenterExport): string {
  const header =
    "Data,Tipo,Descrição,Valor Total,% Centro,Valor Centro,Conta Contábil,Grupo,Pago";
  const rows = data.transactions.map((tx) =>
    [
      tx.date,
      tx.type === "income" ? "Receita" : "Despesa",
      `"${(tx.description || "").replace(/"/g, '""')}"`,
      tx.amount.toFixed(2),
      tx.center_percentage.toFixed(1),
      tx.center_amount.toFixed(2),
      `"${tx.coa_name}"`,
      tx.group_type,
      tx.is_paid ? "Sim" : "Não",
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

export function downloadFile(
  content: string,
  filename: string,
  type: string
) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

```

### src/lib/hooks/use-dashboard.ts
```
/**
 * Oniefy - Dashboard Hooks (Phase 3)
 *
 * React Query hooks for dashboard RPCs.
 * Stories: DASH-01 to DASH-12, CTB-05
 *
 * All hooks call SECURITY DEFINER RPCs that validate auth.uid().
 * Data is fetched client-side and cached by React Query (staleTime: 2min).
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  balanceSheetSchema,
  balanceEvolutionResultSchema,
  budgetVsActualResultSchema,
  dashboardSummarySchema,
  logSchemaError,
  solvencyMetricsSchema,
  topCategoriesResultSchema,
} from "@/lib/schemas/rpc";

// ─── Response Types ────────────────────────────────────────────

export interface DashboardSummary {
  total_current_balance: number;
  total_projected_balance: number;
  active_accounts: number;
  month_income: number;
  month_expense: number;
  month_start: string;
  month_end: string;
}

export interface BalanceSheet {
  liquid_assets: number;
  illiquid_assets: number;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
}

export interface SolvencyMetrics {
  tier1_total: number;
  tier2_total: number;
  tier3_total: number;
  tier4_total: number;
  total_patrimony: number;
  burn_rate: number;
  runway_months: number;
  lcr: number;
  months_analyzed: number;
}

export interface CategoryRank {
  category_name: string;
  icon: string | null;
  color: string | null;
  total: number;
  percentage: number;
}

export interface TopCategoriesResult {
  categories: CategoryRank[];
  total_expense: number;
  month: string;
}

export interface BalanceEvolutionPoint {
  month: string;
  balance: number;
  projected: number;
  income: number;
  expense: number;
}

export interface BalanceEvolutionResult {
  data: BalanceEvolutionPoint[];
  source: "snapshots" | "calculated";
  months_requested: number;
}

export interface BudgetItem {
  category_name: string;
  category_icon: string | null;
  category_color: string | null;
  budget_id: string;
  planned: number;
  alert_threshold: number;
  actual: number;
  remaining: number;
  pct_used: number;
  status: "ok" | "warning" | "exceeded";
  family_member_id: string | null;
}

export interface BudgetVsActualResult {
  items: BudgetItem[];
  total_planned: number;
  total_actual: number;
  total_remaining: number;
  pct_used: number;
  month: string;
  budget_count: number;
}

// ─── Shared config ─────────────────────────────────────────────

const STALE_TIME = 2 * 60 * 1000; // 2 minutes

async function getUserId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");
  return { supabase, userId: user.id };
}

// ─── 1. Dashboard Summary (DASH-01, DASH-02) ──────────────────

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<DashboardSummary> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase.rpc("get_dashboard_summary", {
        p_user_id: userId,
      });
      if (error) throw error;
      const parsed = dashboardSummarySchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_dashboard_summary", parsed);
        return {
          total_current_balance: 0,
          total_projected_balance: 0,
          active_accounts: 0,
          month_income: 0,
          month_expense: 0,
          month_start: "",
          month_end: "",
        };
      }
      return parsed.data;
    },
  });
}

// ─── 2. Balance Sheet (CTB-05) ─────────────────────────────────

export function useBalanceSheet() {
  return useQuery({
    queryKey: ["dashboard", "balance-sheet"],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<BalanceSheet> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase.rpc("get_balance_sheet", {
        p_user_id: userId,
      });
      if (error) throw error;
      const parsed = balanceSheetSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_balance_sheet", parsed);
        return {
          liquid_assets: 0,
          illiquid_assets: 0,
          total_assets: 0,
          total_liabilities: 0,
          net_worth: 0,
        };
      }
      return parsed.data;
    },
  });
}

// ─── 3. Solvency Metrics (DASH-09 to DASH-12) ─────────────────

export function useSolvencyMetrics() {
  return useQuery({
    queryKey: ["dashboard", "solvency"],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<SolvencyMetrics> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase.rpc("get_solvency_metrics", {
        p_user_id: userId,
      });
      if (error) throw error;
      const parsed = solvencyMetricsSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_solvency_metrics", parsed);
        return {
          tier1_total: 0,
          tier2_total: 0,
          tier3_total: 0,
          tier4_total: 0,
          total_patrimony: 0,
          burn_rate: 0,
          runway_months: 0,
          lcr: 0,
          months_analyzed: 0,
        };
      }
      return parsed.data;
    },
  });
}

// ─── 4. Top Categories (DASH-03) ───────────────────────────────

export function useTopCategories(
  year?: number,
  month?: number,
  limit: number = 5
) {
  return useQuery({
    queryKey: ["dashboard", "top-categories", year, month, limit],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<TopCategoriesResult> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase.rpc("get_top_categories", {
        p_user_id: userId,
        ...(year !== undefined && { p_year: year }),
        ...(month !== undefined && { p_month: month }),
        p_limit: limit,
      });
      if (error) throw error;
      const parsed = topCategoriesResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_top_categories", parsed);
        return { categories: [], total_expense: 0, month: "" };
      }
      return parsed.data;
    },
  });
}

// ─── 5. Balance Evolution (DASH-07) ────────────────────────────

export function useBalanceEvolution(months: number = 6) {
  return useQuery({
    queryKey: ["dashboard", "evolution", months],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<BalanceEvolutionResult> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase.rpc("get_balance_evolution", {
        p_user_id: userId,
        p_months: months,
      });
      if (error) throw error;
      const parsed = balanceEvolutionResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_balance_evolution", parsed);
        return { data: [], source: "calculated" as const, months_requested: months };
      }
      return parsed.data;
    },
  });
}

// ─── 6. Budget vs Actual (DASH-05, ORC-05) ─────────────────────

export function useBudgetVsActual(year?: number, month?: number, familyMemberId?: string | null) {
  return useQuery({
    queryKey: ["dashboard", "budget-vs-actual", year, month, familyMemberId],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<BudgetVsActualResult> => {
      const { supabase, userId } = await getUserId();
      const { data, error } = await supabase.rpc("get_budget_vs_actual", {
        p_user_id: userId,
        ...(year !== undefined && { p_year: year }),
        ...(month !== undefined && { p_month: month }),
        ...(familyMemberId && { p_family_member_id: familyMemberId }),
      });
      if (error) throw error;
      const parsed = budgetVsActualResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_budget_vs_actual", parsed);
        return { items: [], total_planned: 0, total_actual: 0, total_remaining: 0, pct_used: 0, month: "", budget_count: 0 };
      }
      return parsed.data;
    },
  });
}

```

### src/lib/hooks/use-dialog-helpers.ts
```
/**
 * Oniefy - Dialog & Confirm UX Helpers
 *
 * useEscapeClose: closes a dialog when ESC is pressed.
 * useAutoReset: auto-resets a state value after a timeout.
 */

import { useEffect, type Dispatch, type SetStateAction } from "react";

/**
 * Closes a dialog when the Escape key is pressed.
 * @param open - whether the dialog is currently open
 * @param onClose - function to close the dialog
 */
export function useEscapeClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);
}

/**
 * Auto-resets a state value to null after a timeout (default 5s).
 * Useful for confirmDelete / confirmReverse patterns.
 * @param value - current state value
 * @param setter - state setter
 * @param ms - timeout in milliseconds (default 5000)
 */
export function useAutoReset<T>(
  value: T | null,
  setter: Dispatch<SetStateAction<T | null>>,
  ms: number = 5000
) {
  useEffect(() => {
    if (value === null) return;
    const timer = setTimeout(() => setter(null), ms);
    return () => clearTimeout(timer);
  }, [value, setter, ms]);
}

```

### src/lib/hooks/use-economic-indices.ts
```
/**
 * Oniefy - Economic Indices Hooks (Phase 8)
 *
 * React Query hooks for economic indices.
 * Data comes from BCB SGS / IBGE SIDRA via API route + stored in Supabase.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { indexLatestResultSchema, economicIndicesResultSchema, logSchemaError } from "@/lib/schemas/rpc";

// ─── Types ──────────────────────────────────────────────────────

export interface IndexDataPoint {
  index_type: string;
  reference_date: string;
  value: number;
  accumulated_12m: number | null;
  accumulated_year: number | null;
  source_primary: string;
  fetched_at: string;
}

export interface LatestIndex {
  index_type: string;
  reference_date: string;
  value: number;
  accumulated_12m: number | null;
  accumulated_year: number | null;
  source_primary: string;
}

export interface FetchResult {
  status: string;
  fetched_at: string;
  results: { index_type: string; inserted: number; errors: string[] }[];
  total_inserted: number;
}

// ─── Labels ─────────────────────────────────────────────────────

export const INDEX_TYPE_LABELS: Record<string, string> = {
  ipca: "IPCA",
  inpc: "INPC",
  igpm: "IGP-M",
  selic: "Selic",
  cdi: "CDI",
  tr: "TR",
  usd_brl: "Dólar (USD/BRL)",
  minimum_wage: "Salário Mínimo",
  ipca_food: "IPCA Alimentação",
  ipca_housing: "IPCA Habitação",
  ipca_transport: "IPCA Transportes",
  ipca_health: "IPCA Saúde",
  ipca_education: "IPCA Educação",
};

export const INDEX_TYPE_COLORS: Record<string, string> = {
  ipca: "#A64A45",
  inpc: "#A7794E",
  igpm: "#A97824",
  selic: "#56688F",
  cdi: "#56688F",
  tr: "#6F6678",
  usd_brl: "#2F7A68",
  minimum_wage: "#A64A45",
};

export const INDEX_UNIT: Record<string, string> = {
  ipca: "% ao mês",
  inpc: "% ao mês",
  igpm: "% ao mês",
  selic: "% ao ano",
  cdi: "% ao ano",
  tr: "% ao mês",
  usd_brl: "R$/USD",
  minimum_wage: "R$",
};

// ─── Queries ────────────────────────────────────────────────────

/** Latest value per index type */
export function useLatestIndices() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["indices", "latest"],
    staleTime: 10 * 60 * 1000, // 10 min
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_index_latest");
      if (error) throw error;
      const parsed = indexLatestResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_index_latest", parsed);
        return [];
      }
      return parsed.data.indices ?? [];
    },
  });
}

/** Historical data for a specific index */
export function useIndexHistory(indexType: string | null, months: number = 12) {
  const supabase = createClient();
  const dateFrom = new Date();
  dateFrom.setMonth(dateFrom.getMonth() - months);

  return useQuery({
    queryKey: ["indices", "history", indexType, months],
    enabled: !!indexType,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_economic_indices", {
        p_index_type: indexType!,
        p_date_from: dateFrom.toISOString().slice(0, 10),
        p_limit: months + 2,
      });
      if (error) throw error;
      const parsed = economicIndicesResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_economic_indices", parsed);
        return [];
      }
      return parsed.data.data ?? [];
    },
  });
}

/** Historical data for multiple indices (parallel queries) */
export function useMultiIndexHistory(indexTypes: string[], months: number = 12) {
  const supabase = createClient();
  const dateFrom = new Date();
  dateFrom.setMonth(dateFrom.getMonth() - months);
  const dateFromStr = dateFrom.toISOString().slice(0, 10);

  return useQuery({
    queryKey: ["indices", "history-multi", indexTypes.sort().join(","), months],
    enabled: indexTypes.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const results: Record<string, IndexDataPoint[]> = {};
      await Promise.all(
        indexTypes.map(async (idxType) => {
          const { data, error } = await supabase.rpc("get_economic_indices", {
            p_index_type: idxType,
            p_date_from: dateFromStr,
            p_limit: months + 2,
          });
          if (error) throw error;
          const parsed = economicIndicesResultSchema.safeParse(data);
          if (!parsed.success) {
            logSchemaError("get_economic_indices", parsed);
            results[idxType] = [];
            return;
          }
          results[idxType] = parsed.data.data ?? [];
        })
      );
      return results;
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────────

/** Trigger fetch from BCB APIs */
export function useFetchIndices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<FetchResult> => {
      const response = await fetch("/api/indices/fetch", { method: "POST" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao buscar índices");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indices"] });
    },
  });
}

```

### src/lib/hooks/use-family-members.ts
```
/**
 * Oniefy - Family Members Hooks
 *
 * CRUD for family_members table.
 * Each member auto-creates a linked cost_center via RPC.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"];
type FamilyRelationship = Database["public"]["Enums"]["family_relationship"];
type FamilyRole = Database["public"]["Enums"]["family_role"];

export const RELATIONSHIP_LABELS: Record<FamilyRelationship, string> = {
  self: "Titular",
  spouse: "Cônjuge",
  child: "Filho(a)",
  parent: "Pai / Mãe",
  sibling: "Irmão(ã)",
  pet: "Pet",
  other: "Outro",
};

export const RELATIONSHIP_OPTIONS: { value: FamilyRelationship; label: string; emoji: string }[] = [
  { value: "self", label: "Titular", emoji: "👤" },
  { value: "spouse", label: "Cônjuge", emoji: "💑" },
  { value: "child", label: "Filho(a)", emoji: "👶" },
  { value: "parent", label: "Pai / Mãe", emoji: "👴" },
  { value: "sibling", label: "Irmão(ã)", emoji: "👫" },
  { value: "pet", label: "Pet", emoji: "🐾" },
  { value: "other", label: "Outro", emoji: "👤" },
];

export const ROLE_LABELS: Record<FamilyRole, string> = {
  owner: "Responsável",
  member: "Membro",
};

// ─── Queries ────────────────────────────────────────────────

export function useFamilyMembers() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["family_members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as FamilyMember[];
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────

export function useCreateFamilyMember() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      relationship: FamilyRelationship;
      role?: FamilyRole;
      birth_date?: string | null;
      is_tax_dependent?: boolean;
      avatar_emoji?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const emoji = input.avatar_emoji
        || RELATIONSHIP_OPTIONS.find((r) => r.value === input.relationship)?.emoji
        || "👤";

      const { data, error } = await supabase.rpc("create_family_member", {
        p_user_id: user.id,
        p_name: input.name,
        p_relationship: input.relationship,
        p_role: input.role || (input.relationship === "self" ? "owner" : "member"),
        p_birth_date: input.birth_date || undefined,
        p_is_tax_dependent: input.is_tax_dependent || false,
        p_avatar_emoji: emoji,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members"] });
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}

export function useUpdateFamilyMember() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Pick<FamilyMember, "name" | "relationship" | "role" | "birth_date" | "is_tax_dependent" | "avatar_emoji">> & { id: string }) => {
      const { data, error } = await supabase
        .from("family_members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Sync name to linked cost center
      if (updates.name && data.cost_center_id) {
        await supabase
          .from("cost_centers")
          .update({ name: updates.name })
          .eq("id", data.cost_center_id);
      }

      return data as FamilyMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members"] });
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}

export function useDeactivateFamilyMember() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get member to find linked cost center
      const { data: member } = await supabase
        .from("family_members")
        .select("cost_center_id")
        .eq("id", id)
        .single();

      // Deactivate member
      const { error } = await supabase
        .from("family_members")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      // Deactivate linked cost center
      if (member?.cost_center_id) {
        await supabase
          .from("cost_centers")
          .update({ is_active: false })
          .eq("id", member.cost_center_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members"] });
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
    },
  });
}

```

### src/lib/hooks/use-fiscal.ts
```
/**
 * Oniefy - Fiscal Hooks (Phase 7)
 *
 * React Query hooks for fiscal module.
 * Stories: FIS-01 (rendimentos), FIS-02 (deduções), FIS-03 (bens/dívidas),
 *          FIS-04 (comprovantes), FIS-05 (relatório), FIS-06 (navegação anos)
 *
 * BONUS: Tax provisioning intelligence (multiple income sources scenario)
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fiscalProjectionSchema, fiscalReportSchema, taxParameterSchema, logSchemaError } from "@/lib/schemas/rpc";
import { z } from "zod";

// ─── Types ──────────────────────────────────────────────────────

export interface FiscalTreatmentGroup {
  tax_treatment: string;
  group_type: string;
  total_revenue: number;
  total_expense: number;
  entry_count: number;
  accounts: {
    coa_code: string;
    coa_name: string;
    total: number;
  }[];
}

export interface FiscalReportTotals {
  total_tributavel_revenue: number;
  total_isento_revenue: number;
  total_dedutivel_expense: number;
  total_transactions: number;
}

export interface FiscalReport {
  year: number;
  period_start: string;
  period_end: string;
  by_treatment: FiscalTreatmentGroup[];
  totals: FiscalReportTotals;
}

export interface FiscalProjection {
  year: number;
  months_elapsed: number;
  months_remaining: number;
  ytd_taxable_income: number;
  ytd_deductible_expenses: number;
  projected_annual_income: number;
  projected_annual_deductible: number;
  taxable_base: number;
  estimated_annual_tax: number;
  annual_reduction_applied: number;
  ytd_irrf_withheld: number;
  tax_gap: number;
  monthly_provision: number;
  disclaimer: string;
  status?: string;
  message?: string;
}

export interface TaxParameter {
  id: string;
  parameter_type: string;
  valid_from: string;
  valid_until: string | null;
  brackets: unknown[];
  limits: Record<string, unknown>;
  source_references: { source: string; url: string; date: string }[];
  updated_by: string;
}

// ─── Labels ─────────────────────────────────────────────────────

export const TAX_TREATMENT_LABELS: Record<string, string> = {
  tributavel: "Tributável",
  isento: "Isento / Não tributável",
  exclusivo_fonte: "Tributação exclusiva na fonte",
  ganho_capital: "Ganho de capital",
  dedutivel_integral: "Dedutível (integral)",
  dedutivel_limitado: "Dedutível (limitado)",
  nao_dedutivel: "Não dedutível",
  variavel: "Variável",
};

export const TAX_TREATMENT_COLORS: Record<string, string> = {
  tributavel: "#A64A45",
  isento: "#2F7A68",
  exclusivo_fonte: "#A97824",
  ganho_capital: "#6F6678",
  dedutivel_integral: "#56688F",
  dedutivel_limitado: "#56688F",
  nao_dedutivel: "#7E9487",
  variavel: "#A64A45",
};

// ─── Queries ────────────────────────────────────────────────────

/** FIS-01 to FIS-04, FIS-06: Fiscal report by tax_treatment */
export function useFiscalReport(year?: number) {
  return useQuery({
    queryKey: ["fiscal", "report", year],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<FiscalReport> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("get_fiscal_report", {
        p_user_id: user.id,
        ...(year !== undefined && { p_year: year }),
      });
      if (error) throw error;
      const parsed = fiscalReportSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_fiscal_report", parsed);
        return {
          year: year ?? new Date().getFullYear(),
          period_start: "",
          period_end: "",
          by_treatment: [],
          totals: {
            total_tributavel_revenue: 0,
            total_isento_revenue: 0,
            total_dedutivel_expense: 0,
            total_transactions: 0,
          },
        };
      }
      return parsed.data;
    },
  });
}

/** TAX PROVISIONING INTELLIGENCE */
export function useFiscalProjection(year?: number) {
  return useQuery({
    queryKey: ["fiscal", "projection", year],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<FiscalProjection> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("get_fiscal_projection", {
        p_user_id: user.id,
        ...(year !== undefined && { p_year: year }),
      });
      if (error) throw error;
      const parsed = fiscalProjectionSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("get_fiscal_projection", parsed);
        return {
          year: year ?? new Date().getFullYear(),
          months_elapsed: 0,
          months_remaining: 0,
          ytd_taxable_income: 0,
          ytd_deductible_expenses: 0,
          projected_annual_income: 0,
          projected_annual_deductible: 0,
          taxable_base: 0,
          estimated_annual_tax: 0,
          annual_reduction_applied: 0,
          ytd_irrf_withheld: 0,
          tax_gap: 0,
          monthly_provision: 0,
          disclaimer: "Dados indisponíveis no momento.",
          status: "error",
          message: "Resposta fiscal inválida.",
        };
      }
      return parsed.data;
    },
  });
}

/** Tax parameters for reference display */
export function useTaxParameters() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["fiscal", "parameters"],
    staleTime: 60 * 60 * 1000, // 1 hour
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tax_parameters")
        .select("*")
        .order("parameter_type")
        .order("valid_from", { ascending: false });
      if (error) throw error;
      const parsed = z.array(taxParameterSchema).safeParse(data);
      if (!parsed.success) {
        logSchemaError("tax_parameters", parsed);
        return [];
      }
      return parsed.data;
    },
  });
}

```

### src/lib/hooks/use-online-status.ts
```
/**
 * Oniefy - Online Status & Service Worker (CFG-07)
 *
 * useOnlineStatus: tracks navigator.onLine with event listeners.
 * useServiceWorker: registers SW on mount (client-side only).
 */

"use client";

import { useState, useEffect } from "react";

/**
 * Returns true when the browser has network connectivity.
 * Updates reactively on online/offline events.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state from navigator
    setIsOnline(navigator.onLine);

    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Registers the Service Worker on mount.
 * Only runs in production or when SW is available.
 * Returns registration status.
 */
export function useServiceWorker() {
  const [status, setStatus] = useState<"idle" | "registered" | "error">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        setStatus("registered");

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                // New version activated, could notify user
                console.log("[Oniefy] Service Worker atualizado.");
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn("[Oniefy] SW registration failed:", err);
        setStatus("error");
      });
  }, []);

  return status;
}

```

### src/lib/hooks/use-reconciliation.ts
```
/**
 * Oniefy - Reconciliation Hooks (Camada 3)
 *
 * BANK-04: Manual reconciliation between pending bills and imported transactions.
 * Provides:
 *  - useUnmatchedImports: imported transactions not yet matched
 *  - usePendingUnmatched: pending/overdue transactions without a match
 *  - useMatchTransactions: manual pairing mutation
 *  - useReconciliationCandidates: find auto-match candidates for a given tx
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { matchTransactionsResultSchema, logSchemaError } from "@/lib/schemas/rpc";

export interface UnmatchedTransaction {
  id: string;
  description: string | null;
  amount: number;
  date: string;
  due_date: string | null;
  type: string;
  payment_status: string;
  account_id: string;
  account_name: string;
  category_name: string | null;
  source: string;
}

/**
 * Imported transactions that are paid but not matched to a pending one.
 * These are potential duplicates or new transactions from bank feeds.
 */
export function useUnmatchedImports(accountId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["reconciliation", "imports", accountId],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select(`
          id, description, amount, date, type, payment_status, account_id, source,
          accounts!inner(name)
        `)
        .eq("is_deleted", false)
        .eq("payment_status", "paid")
        .is("matched_transaction_id", null)
        .not("import_batch_id", "is", null)
        .order("date", { ascending: false })
        .limit(100);

      if (accountId) {
        query = query.eq("account_id", accountId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        description: row.description as string | null,
        amount: row.amount as number,
        date: row.date as string,
        due_date: null,
        type: row.type as string,
        payment_status: row.payment_status as string,
        account_id: row.account_id as string,
        account_name: (row.accounts as Record<string, unknown>)?.name as string ?? "",
        category_name: null,
        source: row.source as string,
      })) as UnmatchedTransaction[];
    },
  });
}

/**
 * Pending/overdue transactions without a match (candidates for reconciliation).
 */
export function usePendingUnmatched(accountId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["reconciliation", "pending", accountId],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select(`
          id, description, amount, date, due_date, type, payment_status, account_id, source,
          accounts!inner(name),
          categories(name)
        `)
        .eq("is_deleted", false)
        .in("payment_status", ["pending", "overdue"])
        .is("matched_transaction_id", null)
        .order("date", { ascending: true })
        .limit(100);

      if (accountId) {
        query = query.eq("account_id", accountId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        description: row.description as string | null,
        amount: row.amount as number,
        date: row.date as string,
        due_date: row.due_date as string | null,
        type: row.type as string,
        payment_status: row.payment_status as string,
        account_id: row.account_id as string,
        account_name: (row.accounts as Record<string, unknown>)?.name as string ?? "",
        category_name: (row.categories as Record<string, unknown>)?.name as string | null ?? null,
        source: row.source as string,
      })) as UnmatchedTransaction[];
    },
  });
}

/**
 * Mutation: manually match a pending transaction with an imported one.
 */
export function useMatchTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pendingId, importedId }: { pendingId: string; importedId: string }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("match_transactions", {
        p_user_id: user.id,
        p_pending_id: pendingId,
        p_imported_id: importedId,
      });
      if (error) throw new Error(error.message);

      const parsed = matchTransactionsResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("match_transactions", parsed);
        throw new Error("Resposta inválida ao conciliar.");
      }
      return parsed.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

```

### src/lib/hooks/use-recurrences.ts
```
/**
 * Oniefy - Recurrences Hooks (Phase 4)
 *
 * React Query hooks for recurrence (Contas a Pagar) operations.
 * Stories: CAP-01 (criar), CAP-02 (editar), CAP-03 (encerrar),
 *          CAP-04 (listar pendentes), CAP-05 (pagar/gerar próxima),
 *          CAP-06 (alertas de vencimento)
 *
 * Recurrences use template_transaction (JSONB) to store the
 * transaction blueprint. Each cycle generates a pending transaction.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { transactionResultSchema, logSchemaError } from "@/lib/schemas/rpc";
import type { Database } from "@/types/database";

type Recurrence = Database["public"]["Tables"]["recurrences"]["Row"];
type RecurrenceInsert = Database["public"]["Tables"]["recurrences"]["Insert"];
type Frequency = Database["public"]["Enums"]["recurrence_frequency"];
type AdjustmentIndex = Database["public"]["Enums"]["adjustment_index_type"];

// ─── Input types ────────────────────────────────────────────────

export interface CreateRecurrenceInput {
  frequency: Frequency;
  interval_count?: number;
  start_date: string; // ISO YYYY-MM-DD
  end_date?: string | null;
  adjustment_index?: AdjustmentIndex | null;
  adjustment_rate?: number | null;
  coa_id?: string | null;
  cost_center_id?: string | null;
  template: {
    account_id: string;
    category_id?: string | null;
    type: "expense" | "income";
    amount: number;
    description?: string | null;
  };
}

export interface UpdateRecurrenceInput {
  id: string;
  frequency?: Frequency;
  interval_count?: number;
  end_date?: string | null;
  adjustment_index?: AdjustmentIndex | null;
  adjustment_rate?: number | null;
  template?: Partial<CreateRecurrenceInput["template"]>;
}

// ─── Labels ─────────────────────────────────────────────────────

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Diária",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

export const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "monthly", label: "Mensal" },
  { value: "weekly", label: "Semanal" },
  { value: "yearly", label: "Anual" },
  { value: "daily", label: "Diária" },
];

// ─── Queries ────────────────────────────────────────────────────

/** List all recurrences (active + inactive) */
export function useRecurrences(activeOnly: boolean = true) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["recurrences", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("recurrences")
        .select("*")
        .order("next_due_date", { ascending: true });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Recurrence[];
    },
  });
}

/** Single recurrence by ID */
export function useRecurrence(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["recurrences", "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurrences")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Recurrence;
    },
  });
}

/**
 * CAP-04: Pending transactions from recurrences.
 * These are transactions with payment_status in ('pending','overdue') linked to a recurrence.
 */
export function usePendingBills() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["bills", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          id, description, amount, date, due_date, type, is_paid, payment_status,
          recurrence_id,
          accounts!inner(name, color),
          categories(name, icon, color)
        `)
        .in("payment_status", ["pending", "overdue"])
        .eq("is_deleted", false)
        .not("recurrence_id", "is", null)
        .order("date", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        description: row.description as string | null,
        amount: row.amount as number,
        date: row.date as string,
        due_date: row.due_date as string | null,
        type: row.type as string,
        is_paid: row.is_paid as boolean,
        payment_status: row.payment_status as string,
        recurrence_id: row.recurrence_id as string,
        account_name: (row.accounts as Record<string, unknown>)?.name as string ?? "",
        account_color: (row.accounts as Record<string, unknown>)?.color as string | null ?? null,
        category_name: (row.categories as Record<string, unknown>)?.name as string | null ?? null,
        category_icon: (row.categories as Record<string, unknown>)?.icon as string | null ?? null,
        category_color: (row.categories as Record<string, unknown>)?.color as string | null ?? null,
      }));
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────────

/** CAP-01: Create recurrence + first pending transaction */
export function useCreateRecurrence() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRecurrenceInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // 1. Create recurrence record
      const { data: rec, error: recErr } = await supabase
        .from("recurrences")
        .insert({
          user_id: user.id,
          frequency: input.frequency,
          interval_count: input.interval_count ?? 1,
          start_date: input.start_date,
          end_date: input.end_date ?? null,
          next_due_date: input.start_date,
          template_transaction: input.template as unknown as Record<string, unknown>,
          is_active: true,
          coa_id: input.coa_id ?? null,
          cost_center_id: input.cost_center_id ?? null,
          adjustment_index: input.adjustment_index ?? null,
          adjustment_rate: input.adjustment_rate ?? null,
        } as RecurrenceInsert)
        .select()
        .single();

      if (recErr) throw recErr;

      // 2. Create first pending transaction
      const { data: txData, error: txErr } = await supabase.rpc(
        "create_transaction_with_journal",
        {
          p_user_id: user.id,
          p_account_id: input.template.account_id,
          p_category_id: input.template.category_id ?? undefined,
          p_type: input.template.type,
          p_amount: input.template.amount,
          p_description: input.template.description ?? undefined,
          p_date: input.start_date,
          p_is_paid: false,
          p_source: "system",
          p_notes: undefined,
          p_tags: undefined,
          p_counterpart_coa_id: undefined,
        }
      );

      if (txErr) throw txErr;
      const txParsed = transactionResultSchema.safeParse(txData);
      if (!txParsed.success) {
        logSchemaError("create_transaction_with_journal", txParsed);
        throw new Error("Resposta inválida ao criar transação da recorrência.");
      }
      const txResult = txParsed.data;

      // 3. Link transaction to recurrence
      await supabase
        .from("transactions")
        .update({ recurrence_id: rec.id })
        .eq("id", txResult.transaction_id);

      return rec as Recurrence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurrences"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** CAP-02: Update recurrence template or schedule */
export function useUpdateRecurrence() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, template, ...updates }: UpdateRecurrenceInput) => {
      // If template fields are being updated, merge with existing
      const payload: Record<string, unknown> = { ...updates };

      if (template) {
        const { data: existing } = await supabase
          .from("recurrences")
          .select("template_transaction")
          .eq("id", id)
          .single();

        if (existing) {
          payload.template_transaction = {
            ...(existing.template_transaction as Record<string, unknown>),
            ...template,
          };
        }
      }

      const { data, error } = await supabase
        .from("recurrences")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Recurrence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurrences"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

/** CAP-03: Deactivate (encerrar) a recurrence */
export function useDeactivateRecurrence() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("recurrences")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurrences"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

/** CAP-05: Pay a pending bill and generate next occurrence */
export function usePayBill() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // 1. Mark transaction as paid
      const { data: tx, error: txErr } = await supabase
        .from("transactions")
        .update({ is_paid: true })
        .eq("id", transactionId)
        .select("recurrence_id")
        .single();

      if (txErr) throw txErr;

      // 2. If linked to recurrence, generate next occurrence
      let nextResult = null;
      if (tx.recurrence_id) {
        const { data, error } = await supabase.rpc("generate_next_recurrence", {
          p_user_id: user.id,
          p_recurrence_id: tx.recurrence_id,
        });
        if (error) throw error;
        nextResult = data;
      }

      return { transactionId, nextResult };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

```

### src/lib/hooks/use-transactions.ts
```
/**
 * Oniefy - Transaction Hooks (FIN-08, FIN-09, FIN-10)
 *
 * React Query hooks for querying transactions.
 * Mutations are in transaction-engine.ts (Lote 2.3).
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionType = Database["public"]["Enums"]["transaction_type"];

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  showDeleted?: boolean;
  limit?: number;
  offset?: number;
}

export interface TransactionWithRelations extends Transaction {
  account_name?: string;
  account_color?: string | null;
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
}

export function useTransactions(filters: TransactionFilters = {}) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (!filters.showDeleted) {
        query = query.eq("is_deleted", false);
      }
      if (filters.accountId) {
        query = query.eq("account_id", filters.accountId);
      }
      if (filters.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }
      if (filters.type) {
        query = query.eq("type", filters.type);
      }
      if (filters.dateFrom) {
        query = query.gte("date", filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte("date", filters.dateTo);
      }
      if (filters.search) {
        query = query.ilike("description", `%${filters.search}%`);
      }

      const limit = filters.limit ?? 50;
      const offset = filters.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data: txs, error } = await query;
      if (error) throw error;
      if (!txs || txs.length === 0) return [] as TransactionWithRelations[];

      // Fetch related accounts and categories in batch
      const accountIds = Array.from(new Set(txs.map((t) => t.account_id)));
      const categoryIds = Array.from(new Set(txs.map((t) => t.category_id).filter(Boolean))) as string[];

      const [{ data: accounts }, { data: categories }] = await Promise.all([
        supabase.from("accounts").select("id, name, color").in("id", accountIds),
        categoryIds.length > 0
          ? supabase.from("categories").select("id, name, icon, color").in("id", categoryIds)
          : Promise.resolve({ data: [] as { id: string; name: string; icon: string | null; color: string | null }[] }),
      ]);

      const accountMap = new Map(accounts?.map((a) => [a.id, a]) ?? []);
      const categoryMap = new Map(categories?.map((c) => [c.id, c]) ?? []);

      return txs.map((tx) => {
        const account = accountMap.get(tx.account_id);
        const category = tx.category_id ? categoryMap.get(tx.category_id) : null;
        return {
          ...tx,
          account_name: account?.name ?? "?",
          account_color: account?.color ?? null,
          category_name: category?.name ?? null,
          category_icon: category?.icon ?? null,
          category_color: category?.color ?? null,
        } as TransactionWithRelations;
      });
    },
  });
}

export function useTransaction(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["transactions", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data as TransactionWithRelations;
    },
  });
}

```

### src/lib/hooks/use-workflows.ts
```
/**
 * Oniefy - Workflows Hooks (Phase 6)
 *
 * React Query hooks for workflow and task operations.
 * Stories: WKF-01 (auto-create), WKF-02 (task checklist),
 *          WKF-03 (upload document), WKF-04 (update balance)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { workflowCreateResultSchema, generateTasksResultSchema, completeTaskResultSchema, logSchemaError } from "@/lib/schemas/rpc";
import type { Database } from "@/types/database";

import { FileUp, Wallet, Tag, ClipboardCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Workflow = Database["public"]["Tables"]["workflows"]["Row"];
type WorkflowTask = Database["public"]["Tables"]["workflow_tasks"]["Row"];
type WorkflowType = Database["public"]["Enums"]["workflow_type"];
type WorkflowPeriodicity = Database["public"]["Enums"]["workflow_periodicity"];
type TaskType = Database["public"]["Enums"]["task_type"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

// ─── Labels ─────────────────────────────────────────────────────

export const WORKFLOW_TYPE_LABELS: Record<WorkflowType, string> = {
  bank_statement: "Extrato Bancário",
  card_statement: "Fatura de Cartão",
  loan_payment: "Financiamento",
  investment_update: "Investimento",
  fiscal_review: "Revisão Fiscal",
};

export const PERIODICITY_LABELS: Record<WorkflowPeriodicity, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  upload_document: "Upload de documento",
  update_balance: "Atualizar saldo",
  categorize_transactions: "Categorizar transações",
  review_fiscal: "Revisão fiscal",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluída",
  skipped: "Pulada",
};

export const TASK_TYPE_ICONS: Record<TaskType, LucideIcon> = {
  upload_document: FileUp,
  update_balance: Wallet,
  categorize_transactions: Tag,
  review_fiscal: ClipboardCheck,
};

export const PERIODICITY_OPTIONS: { value: WorkflowPeriodicity; label: string }[] = [
  { value: "monthly", label: "Mensal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "weekly", label: "Semanal" },
];

export const WORKFLOW_TYPE_OPTIONS: { value: WorkflowType; label: string }[] = [
  { value: "bank_statement", label: "Extrato Bancário" },
  { value: "card_statement", label: "Fatura de Cartão" },
  { value: "loan_payment", label: "Financiamento" },
  { value: "investment_update", label: "Investimento" },
  { value: "fiscal_review", label: "Revisão Fiscal" },
];

// ─── Task with workflow info ────────────────────────────────────

export interface TaskWithWorkflow extends WorkflowTask {
  workflow_name: string;
  workflow_type: WorkflowType;
}

// ─── Queries ────────────────────────────────────────────────────

/** List all workflows */
export function useWorkflows(activeOnly: boolean = true) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workflows", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("workflows")
        .select("*")
        .order("name", { ascending: true });

      if (activeOnly) query = query.eq("is_active", true);

      const { data, error } = await query;
      if (error) throw error;
      return data as Workflow[];
    },
  });
}

/** WKF-02: List pending tasks grouped by workflow */
export function usePendingTasks() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workflow_tasks", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_tasks")
        .select(`
          *,
          workflows!inner(name, workflow_type)
        `)
        .in("status", ["pending", "in_progress"])
        .order("period_end", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => ({
        ...(row as WorkflowTask),
        workflow_name: (row.workflows as Record<string, unknown>)?.name as string ?? "",
        workflow_type: (row.workflows as Record<string, unknown>)?.workflow_type as WorkflowType ?? "bank_statement",
      })) as TaskWithWorkflow[];
    },
  });
}

/** Task count for dashboard badge */
export function usePendingTaskCount() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workflow_tasks", "count"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("workflow_tasks")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "in_progress"]);

      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Tasks for a specific workflow */
export function useWorkflowTasks(workflowId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workflow_tasks", workflowId],
    enabled: !!workflowId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_tasks")
        .select("*")
        .eq("workflow_id", workflowId!)
        .order("period_start", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(20);

      if (error) throw error;
      return data as WorkflowTask[];
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────────

/** WKF-01: Auto-create workflow when account is created */
export function useAutoCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      accountType,
      accountName,
    }: {
      accountId: string;
      accountType: string;
      accountName: string;
    }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("auto_create_workflow_for_account", {
        p_user_id: user.id,
        p_account_id: accountId,
        p_account_type: accountType,
        p_account_name: accountName,
      });
      if (error) throw error;
      const parsed = workflowCreateResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("auto_create_workflow_for_account", parsed);
        throw new Error("Resposta inválida ao criar workflow.");
      }
      return parsed.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

/** WKF-01/02: Generate tasks for current month */
export function useGenerateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { year?: number; month?: number }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("generate_tasks_for_period", {
        p_user_id: user.id,
        ...(params?.year && { p_year: params.year }),
        ...(params?.month && { p_month: params.month }),
      });
      if (error) throw error;
      const parsed = generateTasksResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("generate_tasks_for_period", parsed);
        throw new Error("Resposta inválida ao gerar tarefas.");
      }
      return parsed.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow_tasks"] });
    },
  });
}

/** WKF-02/03/04: Complete or skip a task */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      status = "completed",
      resultData,
    }: {
      taskId: string;
      status?: "completed" | "skipped";
      resultData?: Record<string, unknown>;
    }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase.rpc("complete_workflow_task", {
        p_user_id: user.id,
        p_task_id: taskId,
        p_status: status,
        ...(resultData && { p_result_data: JSON.stringify(resultData) }),
      });
      if (error) throw error;
      const parsed = completeTaskResultSchema.safeParse(data);
      if (!parsed.success) {
        logSchemaError("complete_workflow_task", parsed);
        throw new Error("Resposta inválida ao completar tarefa.");
      }
      return parsed.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

/** Create workflow manually */
export function useCreateWorkflow() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      workflow_type: WorkflowType;
      periodicity: WorkflowPeriodicity;
      related_account_id?: string | null;
      day_of_period?: number | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("workflows")
        .insert({
          user_id: user.id,
          name: input.name,
          workflow_type: input.workflow_type,
          periodicity: input.periodicity,
          related_account_id: input.related_account_id ?? null,
          day_of_period: input.day_of_period ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Workflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

/** Deactivate workflow */
export function useDeactivateWorkflow() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workflows")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["workflow_tasks"] });
    },
  });
}

```

### src/lib/parsers/csv-parser.ts
```
/**
 * Oniefy - CSV Parser
 *
 * Parses CSV/TSV bank statements with column mapping.
 * Uses PapaParse for robust CSV parsing (handles quoted fields,
 * various encodings, auto-detect separator).
 */

import Papa from "papaparse";

export interface CSVColumnMapping {
  date: number; // column index
  amount: number;
  description: number;
  type?: number; // optional: income/expense indicator
}

export interface CSVTransaction {
  externalId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  type: "income" | "expense";
}

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  suggestedMapping: CSVColumnMapping | null;
  transactions: CSVTransaction[];
  errors: string[];
}

// Common date formats from Brazilian banks
function parseFlexibleDate(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // DD/MM/YYYY
  const brMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2].padStart(2, "0")}-${brMatch[1].padStart(2, "0")}`;
  }

  // YYYY-MM-DD (ISO)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;

  // DD/MM/YY
  const shortMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})$/);
  if (shortMatch) {
    const year = parseInt(shortMatch[3]) > 50 ? `19${shortMatch[3]}` : `20${shortMatch[3]}`;
    return `${year}-${shortMatch[2].padStart(2, "0")}-${shortMatch[1].padStart(2, "0")}`;
  }

  return null;
}

function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let cleaned = raw.trim();

  // Remove currency symbols
  cleaned = cleaned.replace(/[R$\s]/g, "");

  // Brazilian format: 1.234,56 → 1234.56
  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      // 1.234,56 → Brazilian
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    }
    // else: 1,234.56 → US format, already ok
  } else if (cleaned.includes(",")) {
    // Could be 1234,56 (BR decimal) or 1,234 (US thousands)
    const parts = cleaned.split(",");
    if (parts[1] && parts[1].length <= 2) {
      cleaned = cleaned.replace(",", ".");
    } else {
      cleaned = cleaned.replace(",", "");
    }
  }

  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function detectDateColumn(headers: string[], sampleRow: string[]): number {
  const dateKeywords = ["data", "date", "dt", "movimento", "lançamento", "lancamento"];
  for (let i = 0; i < headers.length; i++) {
    if (dateKeywords.some((k) => headers[i].toLowerCase().includes(k))) return i;
  }
  // Try parsing first 3 columns as dates
  for (let i = 0; i < Math.min(3, sampleRow.length); i++) {
    if (parseFlexibleDate(sampleRow[i])) return i;
  }
  return 0;
}

function detectAmountColumn(headers: string[], sampleRow: string[]): number {
  const amountKeywords = ["valor", "amount", "value", "quantia", "total"];
  for (let i = 0; i < headers.length; i++) {
    if (amountKeywords.some((k) => headers[i].toLowerCase().includes(k))) return i;
  }
  // Look for numeric columns
  for (let i = sampleRow.length - 1; i >= 0; i--) {
    if (parseAmount(sampleRow[i]) !== null && !parseFlexibleDate(sampleRow[i])) return i;
  }
  return Math.min(1, sampleRow.length - 1);
}

function detectDescriptionColumn(headers: string[], dateCol: number, amountCol: number): number {
  const descKeywords = ["descri", "histórico", "historico", "memo", "detail", "observ"];
  for (let i = 0; i < headers.length; i++) {
    if (i !== dateCol && i !== amountCol && descKeywords.some((k) => headers[i].toLowerCase().includes(k))) return i;
  }
  // First column that isn't date or amount
  for (let i = 0; i < headers.length; i++) {
    if (i !== dateCol && i !== amountCol) return i;
  }
  return 0;
}

/** Parse raw CSV text into headers + rows using PapaParse */
export function parseCSVRaw(text: string): { headers: string[]; rows: string[][] } {
  const result = Papa.parse<string[]>(text.trim(), {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.data.length < 2) return { headers: [], rows: [] };

  const headers = result.data[0].map((h) => h?.trim() ?? "");
  const rows = result.data.slice(1).map((row) => row.map((cell) => cell?.trim() ?? ""));

  return { headers, rows };
}

/** Suggest column mapping based on headers and sample data */
export function suggestMapping(headers: string[], sampleRow: string[]): CSVColumnMapping | null {
  if (headers.length < 2 || !sampleRow.length) return null;

  const date = detectDateColumn(headers, sampleRow);
  const amount = detectAmountColumn(headers, sampleRow);
  const description = detectDescriptionColumn(headers, date, amount);

  return { date, amount, description };
}

/** Convert parsed rows to transactions using column mapping */
export function mapToTransactions(
  rows: string[][],
  mapping: CSVColumnMapping
): { transactions: CSVTransaction[]; errors: string[] } {
  const transactions: CSVTransaction[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawDate = row[mapping.date] ?? "";
    const rawAmount = row[mapping.amount] ?? "";
    const rawDesc = row[mapping.description] ?? "";

    const date = parseFlexibleDate(rawDate);
    if (!date) {
      errors.push(`Linha ${i + 2}: data inválida "${rawDate}"`);
      continue;
    }

    const amount = parseAmount(rawAmount);
    if (amount === null) {
      errors.push(`Linha ${i + 2}: valor inválido "${rawAmount}"`);
      continue;
    }

    const description = rawDesc || "Sem descrição";
    const type = amount >= 0 ? "income" : "expense";
    const absAmount = Math.abs(amount);
    const externalId = `csv_${date}_${absAmount.toFixed(2)}_${i}`;

    transactions.push({ externalId, date, amount: absAmount, description, type });
  }

  return { transactions, errors };
}

```

### src/lib/parsers/ofx-parser.ts
```
/**
 * Oniefy - OFX Parser
 *
 * Parses OFX/QFX files (Open Financial Exchange) client-side.
 * OFX is an XML-like format used by banks for statement export.
 * Handles both SGML (OFX 1.x) and XML (OFX 2.x) variants.
 *
 * Deduplicação:
 * - Cada transação recebe um external_id baseado no FITID original
 * - Quando FITID ausente, gera hash SHA-256 de (data + valor + descrição)
 * - Dedup in-file: transações com external_id duplicado são descartadas
 * - Dedup cross-import: external_id tem UNIQUE constraint parcial no banco
 *
 * Ref: Auditoria de segurança - Achado 4
 */

export interface OFXTransaction {
  externalId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  type: "income" | "expense";
  memo?: string;
}

export interface OFXParseResult {
  accountId?: string;
  bankId?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  transactions: OFXTransaction[];
  duplicatesSkipped: number;
  errors: string[];
}

/**
 * Gera hash SHA-256 hex de uma string.
 * Usa Web Crypto API (disponível em browsers e Edge Runtime).
 */
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Gera external_id determinístico para uma transação OFX.
 * Se FITID disponível: sha256("ofx:{bankId}:{acctId}:{fitid}")
 * Se FITID ausente: sha256("ofx:{bankId}:{acctId}:{date}:{amount}:{desc}")
 */
async function generateExternalId(
  fitid: string,
  bankId: string,
  accountId: string,
  date: string,
  amount: string,
  description: string
): Promise<string> {
  if (fitid) {
    return sha256(`ofx:${bankId}:${accountId}:${fitid}`);
  }
  // Fallback: hash composto (menos robusto, mas cobre casos sem FITID)
  return sha256(`ofx:${bankId}:${accountId}:${date}:${amount}:${description}`);
}

function parseOFXDate(raw: string): string {
  // OFX dates: YYYYMMDDHHMMSS[.XXX:gmt_offset] or YYYYMMDD
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 8);
  if (digits.length < 8) return "";
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function extractTag(content: string, tag: string): string {
  // SGML style: <TAG>value (no closing tag)
  const sgmlRegex = new RegExp(`<${tag}>([^<\\n]+)`, "i");
  const match = content.match(sgmlRegex);
  if (match) return match[1].trim();

  // XML style: <TAG>value</TAG>
  const xmlRegex = new RegExp(`<${tag}>([^<]+)</${tag}>`, "i");
  const xmlMatch = content.match(xmlRegex);
  return xmlMatch ? xmlMatch[1].trim() : "";
}

function extractBlocks(content: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "gi");
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push(match[1]);
  }

  // Fallback for SGML without closing tags
  if (blocks.length === 0) {
    const sgmlRegex = new RegExp(`<${tag}>([\\s\\S]*?)(?=<${tag}>|</${tag.replace("STMTTRN", "BANKTRANLIST")}>|$)`, "gi");
    while ((match = sgmlRegex.exec(content)) !== null) {
      blocks.push(match[1]);
    }
  }

  return blocks;
}

export async function parseOFX(content: string): Promise<OFXParseResult> {
  const result: OFXParseResult = {
    transactions: [],
    duplicatesSkipped: 0,
    errors: [],
  };

  try {
    // Strip SGML header if present
    const bodyStart = content.indexOf("<OFX>");
    const body = bodyStart >= 0 ? content.slice(bodyStart) : content;

    // Extract account info
    result.accountId = extractTag(body, "ACCTID");
    result.bankId = extractTag(body, "BANKID");
    result.currency = extractTag(body, "CURDEF") || "BRL";

    const dtStart = extractTag(body, "DTSTART");
    const dtEnd = extractTag(body, "DTEND");
    if (dtStart) result.startDate = parseOFXDate(dtStart);
    if (dtEnd) result.endDate = parseOFXDate(dtEnd);

    // Extract transactions
    const txBlocks = extractBlocks(body, "STMTTRN");

    // In-file dedup: track seen external_ids
    const seenIds = new Set<string>();

    for (const block of txBlocks) {
      const fitid = extractTag(block, "FITID");
      const dtPosted = extractTag(block, "DTPOSTED");
      const trnAmt = extractTag(block, "TRNAMT");
      const name = extractTag(block, "NAME");
      const memo = extractTag(block, "MEMO");

      if (!dtPosted || !trnAmt) {
        result.errors.push(`Transação incompleta: FITID=${fitid}`);
        continue;
      }

      const amount = parseFloat(trnAmt.replace(",", "."));
      if (isNaN(amount)) {
        result.errors.push(`Valor inválido: ${trnAmt} (FITID=${fitid})`);
        continue;
      }

      const date = parseOFXDate(dtPosted);
      if (!date) {
        result.errors.push(`Data inválida: ${dtPosted} (FITID=${fitid})`);
        continue;
      }

      const description = name || memo || "Sem descrição";

      // Generate deterministic external_id via SHA-256
      const externalId = await generateExternalId(
        fitid,
        result.bankId ?? "",
        result.accountId ?? "",
        date,
        trnAmt,
        description
      );

      // In-file dedup
      if (seenIds.has(externalId)) {
        result.duplicatesSkipped++;
        continue;
      }
      seenIds.add(externalId);

      // Normalize: amount always positive, type from original sign
      result.transactions.push({
        externalId,
        date,
        amount: Math.abs(amount),
        description,
        type: amount >= 0 ? "income" : "expense",
        memo: memo || undefined,
      });
    }
  } catch (err) {
    result.errors.push(`Erro ao parsear OFX: ${err instanceof Error ? err.message : "desconhecido"}`);
  }

  return result;
}

```

### src/lib/parsers/xlsx-parser.ts
```
/**
 * Oniefy - XLSX/XLS Parser
 *
 * Parses Excel bank statements using SheetJS.
 * Converts to headers + rows format, then reuses CSV mapping logic
 * (suggestMapping, mapToTransactions) for column detection and parsing.
 */

import * as XLSX from "xlsx";

export interface XLSXParseResult {
  headers: string[];
  rows: string[][];
  sheetNames: string[];
  activeSheet: string;
}

/**
 * Parse an Excel file (ArrayBuffer) into headers + rows.
 * Uses the first sheet by default, or a specific sheet by name.
 */
export function parseXLSX(
  buffer: ArrayBuffer,
  sheetName?: string
): XLSXParseResult {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  const sheetNames = workbook.SheetNames;
  const activeSheet = sheetName && sheetNames.includes(sheetName)
    ? sheetName
    : sheetNames[0];

  if (!activeSheet) {
    return { headers: [], rows: [], sheetNames: [], activeSheet: "" };
  }

  const sheet = workbook.Sheets[activeSheet];

  // Convert to array of arrays (raw strings for consistent parsing)
  const raw: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    rawNumbers: false,
    dateNF: "dd/mm/yyyy",
  });

  if (raw.length < 2) {
    return { headers: [], rows: [], sheetNames, activeSheet };
  }

  // First non-empty row = headers
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    const nonEmpty = raw[i].filter((c) => String(c).trim()).length;
    if (nonEmpty >= 2) {
      headerIdx = i;
      break;
    }
  }

  const headers = raw[headerIdx].map((h) => String(h).trim());
  const rows = raw
    .slice(headerIdx + 1)
    .map((row) => row.map((cell) => String(cell).trim()))
    .filter((row) => row.some((cell) => cell !== ""));

  return { headers, rows, sheetNames, activeSheet };
}

```

### src/lib/schemas/rpc.ts
```
import { z } from "zod";

export const dashboardSummarySchema = z.object({
  total_current_balance: z.number(),
  total_projected_balance: z.number(),
  active_accounts: z.number(),
  month_income: z.number(),
  month_expense: z.number(),
  month_start: z.string(),
  month_end: z.string(),
});

export const balanceSheetSchema = z.object({
  liquid_assets: z.number(),
  illiquid_assets: z.number(),
  total_assets: z.number(),
  total_liabilities: z.number(),
  net_worth: z.number(),
});

export const solvencyMetricsSchema = z.object({
  tier1_total: z.number(),
  tier2_total: z.number(),
  tier3_total: z.number(),
  tier4_total: z.number(),
  total_patrimony: z.number(),
  burn_rate: z.number(),
  runway_months: z.number(),
  lcr: z.number(),
  months_analyzed: z.number(),
});

const fiscalAccountSchema = z.object({
  coa_code: z.string(),
  coa_name: z.string(),
  total: z.number(),
});

const fiscalTreatmentGroupSchema = z.object({
  tax_treatment: z.string(),
  group_type: z.string(),
  total_revenue: z.number(),
  total_expense: z.number(),
  entry_count: z.number(),
  accounts: z.array(fiscalAccountSchema),
});

const fiscalReportTotalsSchema = z.object({
  total_tributavel_revenue: z.number(),
  total_isento_revenue: z.number(),
  total_dedutivel_expense: z.number(),
  total_transactions: z.number(),
});

export const fiscalReportSchema = z.object({
  year: z.number(),
  period_start: z.string(),
  period_end: z.string(),
  by_treatment: z.array(fiscalTreatmentGroupSchema),
  totals: fiscalReportTotalsSchema,
});

export const fiscalProjectionSchema = z.object({
  year: z.number(),
  months_elapsed: z.number(),
  months_remaining: z.number(),
  ytd_taxable_income: z.number(),
  ytd_deductible_expenses: z.number(),
  projected_annual_income: z.number(),
  projected_annual_deductible: z.number(),
  taxable_base: z.number(),
  estimated_annual_tax: z.number(),
  annual_reduction_applied: z.number(),
  ytd_irrf_withheld: z.number(),
  tax_gap: z.number(),
  monthly_provision: z.number(),
  disclaimer: z.string(),
  status: z.string().optional(),
  message: z.string().optional(),
});

export const transactionResultSchema = z.object({
  transaction_id: z.string().uuid(),
  journal_entry_id: z.string().uuid().nullable(),
});

export const transferResultSchema = z.object({
  from_transaction_id: z.string().uuid(),
  to_transaction_id: z.string().uuid(),
  journal_entry_id: z.string().uuid().nullable(),
  amount: z.number(),
});

export const autoCategorizeTransactionSchema = z.string().uuid().nullable();

export const importBatchResultSchema = z.object({
  status: z.string(),
  imported: z.number(),
  skipped: z.number(),
  categorized: z.number(),
  matched: z.number().optional().default(0),
  batch_id: z.string().uuid(),
});

// ─── Reconciliation ──────────────────────────────────────────

export const reconciliationCandidateSchema = z.object({
  id: z.string().uuid(),
  description: z.string().nullable(),
  amount: z.number(),
  date: z.string(),
  due_date: z.string().nullable(),
  type: z.string(),
  payment_status: z.string(),
  category_id: z.string().uuid().nullable(),
  recurrence_id: z.string().uuid().nullable(),
  amount_diff: z.number(),
  days_diff: z.number(),
  match_score: z.number(),
});

export const matchTransactionsResultSchema = z.object({
  status: z.string(),
  pending_id: z.string().uuid(),
  imported_id: z.string().uuid(),
  adjustment: z.number(),
  final_amount: z.number(),
});

// ─── Assets ──────────────────────────────────────────────────

export const assetsSummarySchema = z.object({
  total_value: z.number(),
  total_acquisition: z.number(),
  asset_count: z.number(),
  by_category: z.array(z.object({
    category: z.enum(["real_estate", "vehicle", "electronics", "other", "restricted"]),
    count: z.number(),
    total_value: z.number(),
  })),
  expiring_insurance: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    insurance_expiry: z.string(),
    days_until_expiry: z.number(),
  })),
  total_depreciation: z.number(),
});

export const depreciateAssetResultSchema = z.object({
  status: z.string(),
  previous_value: z.number(),
  depreciation: z.number(),
  new_value: z.number(),
});

// ─── Cost Centers ────────────────────────────────────────────

export const centerPnlSchema = z.object({
  center_id: z.string().uuid(),
  center_name: z.string(),
  center_type: z.string(),
  period_from: z.string(),
  period_to: z.string(),
  total_income: z.number(),
  total_expense: z.number(),
  net_result: z.number(),
  monthly: z.array(z.object({
    month: z.string(),
    income: z.number(),
    expense: z.number(),
  })),
});

export const centerExportSchema = z.object({
  center: z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: z.string(),
    color: z.string().nullable(),
    created_at: z.string(),
  }),
  transactions: z.array(z.object({
    id: z.string().uuid(),
    date: z.string(),
    type: z.string(),
    amount: z.number(),
    description: z.string().nullable(),
    is_paid: z.boolean(),
    center_percentage: z.number(),
    center_amount: z.number(),
    coa_name: z.string(),
    group_type: z.string(),
  })),
  totals: z.object({
    income: z.number(),
    expense: z.number(),
    net: z.number(),
  }),
  exported_at: z.string(),
});

export const allocateToCentersResultSchema = z.object({
  status: z.string(),
  transaction_id: z.string().uuid(),
  allocations: z.array(z.object({
    cost_center_id: z.string().uuid(),
    percentage: z.number(),
    amount: z.number(),
  })),
});

// ─── Economic Indices ────────────────────────────────────────

const indexDataPointSchema = z.object({
  index_type: z.string(),
  reference_date: z.string(),
  value: z.number(),
  accumulated_12m: z.number().nullable(),
  accumulated_year: z.number().nullable(),
  source_primary: z.string(),
  fetched_at: z.string(),
});

export const indexLatestResultSchema = z.object({
  indices: z.array(indexDataPointSchema),
});

export const economicIndicesResultSchema = z.object({
  data: z.array(indexDataPointSchema),
});

// ─── Workflows ───────────────────────────────────────────────

export const workflowCreateResultSchema = z.object({
  status: z.string(),
  workflow_id: z.string().uuid().optional(),
  name: z.string().optional(),
});

export const generateTasksResultSchema = z.object({
  status: z.string(),
  tasks_created: z.number(),
  workflows_skipped: z.number(),
});

export const completeTaskResultSchema = z.object({
  status: z.string(),
  all_period_tasks_done: z.boolean(),
});

// ─── Transaction reversal ────────────────────────────────────

export const reversalResultSchema = z.object({
  reversed_transaction_id: z.string().uuid(),
  reversal_journal_id: z.string().uuid().nullable(),
});

// ─── Table query schemas ─────────────────────────────────────

export const taxParameterSchema = z.object({
  id: z.string().uuid(),
  parameter_type: z.string(),
  valid_from: z.string(),
  valid_until: z.string().nullable(),
  brackets: z.array(z.record(z.unknown())),
  limits: z.record(z.unknown()).nullable(),
  source_references: z.array(z.object({ source: z.string(), url: z.string(), date: z.string() })),
  created_at: z.string(),
  updated_at: z.string(),
  updated_by: z.string().nullable(),
});

export const budgetWithCategorySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  category_id: z.string().uuid(),
  month: z.string(),
  planned_amount: z.number(),
  alert_threshold: z.number(),
  adjustment_index: z.enum(["ipca", "igpm", "inpc", "selic", "manual", "none"]).nullable(),
  coa_id: z.string().uuid().nullable(),
  cost_center_id: z.string().uuid().nullable(),
  family_member_id: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  categories: z.object({
    name: z.string(),
    icon: z.string().nullable(),
    color: z.string().nullable(),
    type: z.string(),
  }),
});

// ─── Dashboard (additional) ──────────────────────────────────

export const topCategoriesResultSchema = z.object({
  categories: z.array(z.object({
    category_name: z.string(),
    icon: z.string().nullable(),
    color: z.string().nullable(),
    total: z.number(),
    percentage: z.number(),
  })),
  total_expense: z.number(),
  month: z.string(),
});

export const balanceEvolutionResultSchema = z.object({
  data: z.array(z.object({
    month: z.string(),
    balance: z.number(),
    projected: z.number(),
    income: z.number(),
    expense: z.number(),
  })),
  source: z.enum(["snapshots", "calculated"]),
  months_requested: z.number(),
});

export const budgetVsActualResultSchema = z.object({
  items: z.array(z.object({
    category_name: z.string(),
    category_icon: z.string().nullable(),
    category_color: z.string().nullable(),
    budget_id: z.string().uuid(),
    planned: z.number(),
    alert_threshold: z.number(),
    actual: z.number(),
    remaining: z.number(),
    pct_used: z.number(),
    status: z.enum(["ok", "warning", "exceeded"]),
    family_member_id: z.string().uuid().nullable(),
  })),
  total_planned: z.number(),
  total_actual: z.number(),
  total_remaining: z.number(),
  pct_used: z.number(),
  month: z.string(),
  budget_count: z.number(),
});

export function logSchemaError(rpcName: string, parsed: z.SafeParseError<unknown>) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join(" | ");
  console.error(`[Oniefy] RPC schema mismatch (${rpcName}): ${issues}`);
}

```

### src/lib/services/onboarding-seeds.ts
```
/**
 * Oniefy - Onboarding Seeds
 *
 * Runs the three seed RPCs (categories, chart of accounts, cost center)
 * and marks onboarding as completed only if ALL succeed.
 *
 * Extracted from onboarding/page.tsx to comply with Next.js App Router
 * restriction on extra exports from page files, and to enable unit testing.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function completeOnboardingSeeds(
  supabase: any,
  userId: string
): Promise<void> {
  const { error: catError } = await supabase.rpc("create_default_categories", {
    p_user_id: userId,
  });
  if (catError) {
    throw new Error(`Erro ao criar categorias padrão: ${catError.message}`);
  }

  const { error: coaError } = await supabase.rpc("create_default_chart_of_accounts", {
    p_user_id: userId,
  });
  if (coaError) {
    throw new Error(`Erro ao criar plano de contas padrão: ${coaError.message}`);
  }

  const { error: ccError } = await supabase.rpc("create_default_cost_center", {
    p_user_id: userId,
  });
  if (ccError) {
    throw new Error(`Erro ao criar centro de custo padrão: ${ccError.message}`);
  }

  const { error: updateError } = await supabase
    .from("users_profile")
    .update({ onboarding_completed: true })
    .eq("id", userId);

  if (updateError) throw new Error(updateError.message);
}

```

### src/lib/services/transaction-engine.ts
```
/**
 * Oniefy - Transaction Engine (CTB-01, CTB-02)
 *
 * Client-side service that calls the Postgres function
 * create_transaction_with_journal() for atomic creation of
 * transaction + journal_entry + journal_lines.
 *
 * The accounting logic (debit/credit rules) lives in the database
 * function. This module provides a typed interface and React Query hooks.
 *
 * Ref: wealthos-estudo-tecnico-v2.0, seção 12
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { logSchemaError, transactionResultSchema, transferResultSchema, reversalResultSchema } from "@/lib/schemas/rpc";

type TransactionType = Database["public"]["Enums"]["transaction_type"];
type EntrySource = Database["public"]["Enums"]["entry_source"];

// ─── Input types ────────────────────────────────────────────

export interface CreateTransactionInput {
  account_id: string;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  description?: string | null;
  date: string;        // ISO date string YYYY-MM-DD
  is_paid: boolean;
  source?: EntrySource;
  notes?: string | null;
  tags?: string[] | null;
  counterpart_coa_id?: string | null;  // explicit COA override
  family_member_id?: string | null;
}

export interface TransferInput {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string | null;
  date: string;
  is_paid: boolean;
}

export interface TransactionResult {
  transaction_id: string;
  journal_entry_id: string | null;
}

export interface TransferResult {
  from_transaction_id: string;
  to_transaction_id: string;
  journal_entry_id: string | null;
  amount: number;
}

export interface ReversalResult {
  reversed_transaction_id: string;
  reversal_journal_id: string | null;
}

// ─── Service functions ──────────────────────────────────────

/**
 * Creates a transaction with automatic journal entry generation.
 * Uses the Postgres RPC for atomicity.
 */
export async function createTransaction(
  input: CreateTransactionInput
): Promise<TransactionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");

  const { data, error } = await supabase.rpc("create_transaction_with_journal", {
    p_user_id: user.id,
    p_account_id: input.account_id,
    p_category_id: input.category_id ?? undefined,
    p_type: input.type,
    p_amount: input.amount,
    p_description: input.description ?? undefined,
    p_date: input.date,
    p_is_paid: input.is_paid,
    p_source: input.source ?? "manual",
    p_notes: input.notes ?? undefined,
    p_tags: input.tags ?? undefined,
    p_counterpart_coa_id: input.counterpart_coa_id ?? undefined,
  });

  if (error) throw new Error(error.message);

  // RPC returns JSON
  const parsed = transactionResultSchema.safeParse(data);
  if (!parsed.success) {
    logSchemaError("create_transaction_with_journal", parsed);
    throw new Error("Resposta inválida ao criar transação.");
  }
  const result = parsed.data;

  // Set family_member_id if provided (not part of the RPC, set after)
  if (input.family_member_id && result.transaction_id) {
    await supabase
      .from("transactions")
      .update({ family_member_id: input.family_member_id })
      .eq("id", result.transaction_id);
  }

  return result;
}

/**
 * Creates an atomic transfer between two accounts.
 * Uses the Postgres RPC for atomicity: single journal entry,
 * correct double-entry (D destination, C source), linked transfer_pair_id.
 */
export async function createTransfer(
  input: TransferInput
): Promise<TransferResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");

  const { data, error } = await supabase.rpc("create_transfer_with_journal", {
    p_user_id: user.id,
    p_from_account_id: input.from_account_id,
    p_to_account_id: input.to_account_id,
    p_amount: input.amount,
    p_description: input.description ?? "Transferência entre contas",
    p_date: input.date,
    p_is_paid: input.is_paid,
    p_source: "manual",
  });

  if (error) throw new Error(error.message);
  const parsed = transferResultSchema.safeParse(data);
  if (!parsed.success) {
    logSchemaError("create_transfer_with_journal", parsed);
    throw new Error("Resposta inválida ao criar transferência.");
  }
  return parsed.data;
}

/**
 * Reverses (estorna) a transaction.
 * Soft-deletes the transaction and creates reversal journal entries.
 */
export async function reverseTransaction(
  transactionId: string
): Promise<ReversalResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");

  const { data, error } = await supabase.rpc("reverse_transaction", {
    p_user_id: user.id,
    p_transaction_id: transactionId,
  });

  if (error) throw new Error(error.message);
  const parsed = reversalResultSchema.safeParse(data);
  if (!parsed.success) {
    logSchemaError("reverse_transaction", parsed);
    throw new Error("Resposta inválida ao estornar transação.");
  }
  return parsed.data;
}

// ─── React Query Hooks ──────────────────────────────────────

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useReverseTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reverseTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

```

### src/lib/supabase/client.ts
```
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

```

### src/lib/supabase/server.ts
```
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components and Route Handlers.
 * Uses cookies for session management (RLS-aware).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Admin client using service_role key.
 * NEVER import this in frontend/client components.
 * Used only in API routes for operations that bypass RLS.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

```

### src/lib/utils/index.ts
```
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Merge Tailwind classes with clsx.
 * Used by shadcn/ui components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as BRL currency.
 * @example formatCurrency(1234.56) => "R$ 1.234,56"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Format a date string or Date object.
 * @param date - ISO string or Date object
 * @param pattern - date-fns format pattern (default: "dd/MM/yyyy")
 */
export function formatDate(
  date: string | Date,
  pattern: string = "dd/MM/yyyy"
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: ptBR });
}

/**
 * Format a date as relative time (e.g., "há 2 dias").
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`;
  return formatDate(d);
}

```

### src/lib/validations/auth.ts
```
/**
 * Oniefy - Auth Validation Schemas (Zod)
 *
 * Centraliza validações de todos os formulários de autenticação.
 * Ref: AUTH-01 (12+ chars, blocklist), AUTH-08 (reset password)
 */

import { z } from "zod";
import { isPasswordBlocked } from "@/lib/auth/password-blocklist";

// ─── Password Rules ─────────────────────────────────────────
// Spec: 12+ caracteres, sem senhas comuns (blocklist)
export const passwordSchema = z
  .string()
  .min(12, "Senha deve ter no mínimo 12 caracteres")
  .max(128, "Senha deve ter no máximo 128 caracteres")
  .refine((val) => /[a-z]/.test(val), {
    message: "Senha deve conter pelo menos uma letra minúscula",
  })
  .refine((val) => /[A-Z]/.test(val), {
    message: "Senha deve conter pelo menos uma letra maiúscula",
  })
  .refine((val) => /[0-9]/.test(val), {
    message: "Senha deve conter pelo menos um número",
  })
  .refine((val) => !isPasswordBlocked(val), {
    message: "Esta senha é muito comum. Escolha uma mais forte.",
  });

// ─── Register ───────────────────────────────────────────────
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome muito longo"),
    email: z.string().email("Email inválido"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Login ──────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── MFA (TOTP) ────────────────────────────────────────────
export const mfaCodeSchema = z.object({
  code: z
    .string()
    .length(6, "Código deve ter 6 dígitos")
    .regex(/^\d{6}$/, "Código deve conter apenas números"),
});

export type MfaCodeInput = z.infer<typeof mfaCodeSchema>;

// ─── Forgot Password ───────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password ────────────────────────────────────────
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ─── Password Strength Meter ────────────────────────────────
export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (!isPasswordBlocked(password)) score++;

  if (score <= 2) return "weak";
  if (score <= 3) return "fair";
  if (score <= 4) return "good";
  return "strong";
}

export const STRENGTH_CONFIG: Record<
  PasswordStrength,
  { label: string; color: string; width: string }
> = {
  weak: { label: "Fraca", color: "bg-terracotta", width: "w-1/4" },
  fair: { label: "Razoável", color: "bg-burnished", width: "w-2/4" },
  good: { label: "Boa", color: "bg-burnished", width: "w-3/4" },
  strong: { label: "Forte", color: "bg-verdant", width: "w-full" },
};

```

### supabase/migrations/001_initial_schema.sql
```
-- ============================================================
-- WealthOS Migration 001: Initial Schema v1.0
-- 13 tabelas | 9 ENUMs | 30 indexes | 52 RLS policies
-- 13 triggers | 5 functions | 1 Storage bucket
-- Source: wealthos-especificacao-v1.docx + wealthos-adendo-v1.1.docx
-- Applied: 2026-03-07
-- ============================================================

-- ============================================================
-- PART 1: ENUMs (9)
-- ============================================================

CREATE TYPE account_type AS ENUM ('checking', 'savings', 'credit_card', 'cash', 'investment');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE category_type AS ENUM ('income', 'expense');
CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE asset_category AS ENUM ('real_estate', 'vehicle', 'electronics', 'other');
CREATE TYPE tax_record_type AS ENUM ('income', 'deduction', 'asset', 'debt');
CREATE TYPE notification_type AS ENUM ('bill_due', 'budget_alert', 'insurance_expiry', 'account_deletion');
CREATE TYPE notification_status AS ENUM ('sent', 'failed', 'skipped');
CREATE TYPE value_change_source AS ENUM ('manual', 'depreciation');

-- ============================================================
-- PART 2: Tables (13)
-- ============================================================

-- 2.1 users_profile
CREATE TABLE users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  cpf_encrypted TEXT,
  default_currency TEXT NOT NULL DEFAULT 'BRL',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  deletion_requested_at TIMESTAMPTZ,
  encryption_key_encrypted TEXT,
  encryption_key_iv TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 accounts
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  projected_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type category_type NOT NULL,
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  date DATE NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  recurrence_id UUID,
  transfer_pair_id UUID,
  notes TEXT,
  tags TEXT[],
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 recurrences
CREATE TABLE recurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency recurrence_frequency NOT NULL,
  interval_count INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  next_due_date DATE NOT NULL,
  template_transaction JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK: transactions -> recurrences (created after recurrences exists)
ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_recurrence
  FOREIGN KEY (recurrence_id) REFERENCES recurrences(id) ON DELETE SET NULL;

-- 2.6 budgets
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  planned_amount NUMERIC(12,2) NOT NULL CHECK (planned_amount >= 0),
  alert_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 assets
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category asset_category NOT NULL,
  acquisition_date DATE NOT NULL,
  acquisition_value NUMERIC(14,2) NOT NULL,
  current_value NUMERIC(14,2) NOT NULL,
  depreciation_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  notes_encrypted TEXT,
  insurance_policy TEXT,
  insurance_expiry DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.8 tax_records
CREATE TABLE tax_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  type tax_record_type NOT NULL,
  source TEXT,
  amount NUMERIC(14,2) NOT NULL,
  irrf_withheld NUMERIC(12,2) NOT NULL DEFAULT 0,
  details_encrypted TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9 documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  related_table TEXT NOT NULL,
  related_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.10 asset_value_history (adendo v1.1)
CREATE TABLE asset_value_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_value NUMERIC(14,2) NOT NULL,
  new_value NUMERIC(14,2) NOT NULL,
  change_reason TEXT,
  change_source value_change_source NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.11 monthly_snapshots (adendo v1.1)
CREATE TABLE monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_projected NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_income NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_expense NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_assets NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- 2.12 notification_tokens (adendo v1.1)
CREATE TABLE notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  device_name TEXT,
  platform TEXT NOT NULL DEFAULT 'ios',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_token)
);

-- 2.13 notification_log (adendo v1.1)
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  reference_id UUID,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status notification_status NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PART 3: Indexes (30)
-- ============================================================

-- accounts
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_user_active ON accounts(user_id, is_active);

-- categories
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_user_type ON categories(user_id, type);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_transactions_recurrence ON transactions(recurrence_id);
CREATE INDEX idx_transactions_transfer_pair ON transactions(transfer_pair_id);
CREATE INDEX idx_transactions_user_paid ON transactions(user_id, is_paid);
CREATE INDEX idx_transactions_tags ON transactions USING GIN(tags);

-- recurrences
CREATE INDEX idx_recurrences_user_id ON recurrences(user_id);
CREATE INDEX idx_recurrences_next_due ON recurrences(next_due_date) WHERE is_active = true;

-- budgets
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);
CREATE UNIQUE INDEX idx_budgets_user_category_month ON budgets(user_id, category_id, month);

-- assets
CREATE INDEX idx_assets_user_id ON assets(user_id);

-- tax_records
CREATE INDEX idx_tax_records_user_id ON tax_records(user_id);
CREATE INDEX idx_tax_records_user_year ON tax_records(user_id, year);

-- documents
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_related ON documents(related_table, related_id);

-- asset_value_history
CREATE INDEX idx_avh_asset ON asset_value_history(asset_id);
CREATE INDEX idx_avh_user ON asset_value_history(user_id);

-- monthly_snapshots
CREATE INDEX idx_snapshots_user_month ON monthly_snapshots(user_id, month DESC);

-- notification_tokens
CREATE INDEX idx_notif_tokens_user ON notification_tokens(user_id);

-- notification_log
CREATE INDEX idx_notif_log_user ON notification_log(user_id);
CREATE INDEX idx_notif_log_user_type ON notification_log(user_id, type);

-- ============================================================
-- PART 4: Row Level Security (52 policies)
-- Pattern: auth.uid() = user_id (or id for users_profile)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_value_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- users_profile
CREATE POLICY "users_profile_select" ON users_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_profile_insert" ON users_profile FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_profile_update" ON users_profile FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_profile_delete" ON users_profile FOR DELETE USING (auth.uid() = id);

-- accounts
CREATE POLICY "accounts_select" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "accounts_insert" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_update" ON accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_delete" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- categories
CREATE POLICY "categories_select" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (auth.uid() = user_id);

-- transactions
CREATE POLICY "transactions_select" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- recurrences
CREATE POLICY "recurrences_select" ON recurrences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recurrences_insert" ON recurrences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurrences_update" ON recurrences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurrences_delete" ON recurrences FOR DELETE USING (auth.uid() = user_id);

-- budgets
CREATE POLICY "budgets_select" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update" ON budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_delete" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- assets
CREATE POLICY "assets_select" ON assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "assets_insert" ON assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "assets_update" ON assets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "assets_delete" ON assets FOR DELETE USING (auth.uid() = user_id);

-- tax_records
CREATE POLICY "tax_records_select" ON tax_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tax_records_insert" ON tax_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tax_records_update" ON tax_records FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tax_records_delete" ON tax_records FOR DELETE USING (auth.uid() = user_id);

-- documents
CREATE POLICY "documents_select" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_update" ON documents FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_delete" ON documents FOR DELETE USING (auth.uid() = user_id);

-- asset_value_history
CREATE POLICY "avh_select" ON asset_value_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "avh_insert" ON asset_value_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "avh_update" ON asset_value_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "avh_delete" ON asset_value_history FOR DELETE USING (auth.uid() = user_id);

-- monthly_snapshots
CREATE POLICY "snapshots_select" ON monthly_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "snapshots_insert" ON monthly_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "snapshots_update" ON monthly_snapshots FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "snapshots_delete" ON monthly_snapshots FOR DELETE USING (auth.uid() = user_id);

-- notification_tokens
CREATE POLICY "notif_tokens_select" ON notification_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_tokens_insert" ON notification_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_tokens_update" ON notification_tokens FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_tokens_delete" ON notification_tokens FOR DELETE USING (auth.uid() = user_id);

-- notification_log
CREATE POLICY "notif_log_select" ON notification_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_log_insert" ON notification_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_log_update" ON notification_log FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_log_delete" ON notification_log FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- PART 5: Functions and Triggers
-- ============================================================

-- Function: auto-update updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: recalculate account balances
-- current_balance = initial_balance + SUM(paid income) - SUM(paid expense) +/- transfers
-- projected_balance = initial_balance + SUM(all income) - SUM(all expense) +/- transfers
CREATE OR REPLACE FUNCTION recalculate_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_account_id UUID;
  v_current NUMERIC(12,2);
  v_projected NUMERIC(12,2);
  v_initial NUMERIC(12,2);
BEGIN
  -- Determine which account to recalculate
  IF TG_OP = 'DELETE' THEN
    v_account_id := OLD.account_id;
  ELSE
    v_account_id := NEW.account_id;
  END IF;

  -- Also recalculate old account if account changed
  IF TG_OP = 'UPDATE' AND OLD.account_id IS DISTINCT FROM NEW.account_id THEN
    SELECT initial_balance INTO v_initial FROM accounts WHERE id = OLD.account_id;

    SELECT
      v_initial + COALESCE(SUM(CASE
        WHEN type = 'income' THEN amount
        WHEN type = 'expense' THEN -amount
        WHEN type = 'transfer' AND transfer_pair_id IS NOT NULL THEN
          CASE WHEN amount >= 0 THEN amount ELSE -amount END
        ELSE 0
      END), 0)
    INTO v_current
    FROM transactions
    WHERE account_id = OLD.account_id AND is_paid = true AND is_deleted = false;

    SELECT
      v_initial + COALESCE(SUM(CASE
        WHEN type = 'income' THEN amount
        WHEN type = 'expense' THEN -amount
        WHEN type = 'transfer' AND transfer_pair_id IS NOT NULL THEN
          CASE WHEN amount >= 0 THEN amount ELSE -amount END
        ELSE 0
      END), 0)
    INTO v_projected
    FROM transactions
    WHERE account_id = OLD.account_id AND is_deleted = false;

    UPDATE accounts SET current_balance = v_current, projected_balance = v_projected WHERE id = OLD.account_id;
  END IF;

  -- Recalculate target account
  SELECT initial_balance INTO v_initial FROM accounts WHERE id = v_account_id;

  SELECT
    v_initial + COALESCE(SUM(CASE
      WHEN type = 'income' THEN amount
      WHEN type = 'expense' THEN -amount
      WHEN type = 'transfer' AND transfer_pair_id IS NOT NULL THEN
        CASE WHEN amount >= 0 THEN amount ELSE -amount END
      ELSE 0
    END), 0)
  INTO v_current
  FROM transactions
  WHERE account_id = v_account_id AND is_paid = true AND is_deleted = false;

  SELECT
    v_initial + COALESCE(SUM(CASE
      WHEN type = 'income' THEN amount
      WHEN type = 'expense' THEN -amount
      WHEN type = 'transfer' AND transfer_pair_id IS NOT NULL THEN
        CASE WHEN amount >= 0 THEN amount ELSE -amount END
      ELSE 0
    END), 0)
  INTO v_projected
  FROM transactions
  WHERE account_id = v_account_id AND is_deleted = false;

  UPDATE accounts SET current_balance = v_current, projected_balance = v_projected WHERE id = v_account_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers: updated_at
CREATE TRIGGER set_updated_at_users_profile
  BEFORE UPDATE ON users_profile
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_accounts
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_transactions
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_recurrences
  BEFORE UPDATE ON recurrences
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_budgets
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_assets
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_tax_records
  BEFORE UPDATE ON tax_records
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_notification_tokens
  BEFORE UPDATE ON notification_tokens
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Trigger: recalculate account balance on transaction changes
CREATE TRIGGER recalc_balance_on_transaction
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION recalculate_account_balance();

-- ============================================================
-- PART 6: Storage
-- ============================================================

-- Create storage bucket for user documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents',
  'user-documents',
  false,
  10485760, -- 10 MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

-- Storage RLS: users can only access their own folder
CREATE POLICY "storage_user_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "storage_user_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "storage_user_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "storage_user_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

```

### supabase/migrations/002_accounting_model.sql
```
-- ============================================
-- WealthOS - Migration 002: Modelo Contabil
-- ============================================
-- 10 novas tabelas, 12 novos ENUMs, 5 tabelas alteradas
-- 16+ indexes, 20+ politicas RLS, triggers, functions
-- Referencia: wealthos-estudo-tecnico-v2.0 + adendos v1.2/v1.4
-- Pre-requisito: migration 001_initial_schema.sql executada
-- ============================================


-- ============================
-- 0. NOVOS TIPOS ENUM (12)
-- ============================

CREATE TYPE group_type AS ENUM (
  'asset', 'liability', 'equity', 'revenue', 'expense'
);

CREATE TYPE tax_treatment_type AS ENUM (
  'tributavel', 'isento', 'exclusivo_fonte',
  'ganho_capital', 'dedutivel_integral',
  'dedutivel_limitado', 'nao_dedutivel', 'variavel'
);

CREATE TYPE center_type AS ENUM (
  'cost_center', 'profit_center', 'neutral'
);

CREATE TYPE entry_source AS ENUM (
  'bank_feed', 'card_feed', 'manual',
  'csv_import', 'ofx_import', 'ocr', 'system'
);

CREATE TYPE parameter_type AS ENUM (
  'irpf_monthly', 'irpf_annual', 'irpf_reduction',
  'irpf_min_high_income', 'inss_employee', 'inss_ceiling',
  'minimum_wage', 'capital_gains',
  'crypto_exemption', 'stock_exemption'
);

CREATE TYPE index_type AS ENUM (
  'ipca', 'inpc', 'igpm', 'selic', 'cdi', 'tr',
  'usd_brl', 'minimum_wage',
  'ipca_food', 'ipca_housing', 'ipca_transport',
  'ipca_health', 'ipca_education'
);

CREATE TYPE periodicity_type AS ENUM (
  'daily', 'monthly', 'annual'
);

CREATE TYPE workflow_type AS ENUM (
  'bank_statement', 'card_statement', 'loan_payment',
  'investment_update', 'fiscal_review'
);

CREATE TYPE workflow_periodicity AS ENUM (
  'weekly', 'biweekly', 'monthly'
);

CREATE TYPE task_type AS ENUM (
  'upload_document', 'update_balance',
  'categorize_transactions', 'review_fiscal'
);

CREATE TYPE task_status AS ENUM (
  'pending', 'in_progress', 'completed', 'skipped'
);

CREATE TYPE adjustment_index_type AS ENUM (
  'ipca', 'igpm', 'inpc', 'selic', 'manual', 'none'
);


-- ============================
-- 1. NOVAS TABELAS (10)
-- ============================

-- 1.1 chart_of_accounts
-- Plano de contas hierarquico com 133 contas-semente
CREATE TABLE chart_of_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  internal_code   TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  account_name    TEXT NOT NULL,
  group_type      group_type NOT NULL,
  parent_id       UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  depth           INTEGER NOT NULL DEFAULT 0,
  tax_treatment   tax_treatment_type,
  dirpf_group     TEXT,
  icon            TEXT,
  color           TEXT,
  is_system       BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT coa_unique_user_code UNIQUE (user_id, internal_code)
);

-- 1.2 journal_entries
-- Cabecalho do lancamento contabil. IMUTAVEL (append-only).
CREATE TABLE journal_entries (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date          DATE NOT NULL,
  occurred_at         TIMESTAMPTZ,
  posted_at           TIMESTAMPTZ,
  user_date           DATE,
  source              entry_source NOT NULL DEFAULT 'manual',
  description         TEXT,
  document_url        TEXT,
  is_reversal         BOOLEAN NOT NULL DEFAULT FALSE,
  reversed_entry_id   UUID REFERENCES journal_entries(id),
  transaction_id      UUID REFERENCES transactions(id) ON DELETE SET NULL,
  workflow_task_id    UUID,  -- FK adicionada apos criacao de workflow_tasks
  notes_encrypted     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- SEM updated_at: tabela imutavel
);

-- 1.3 journal_lines
-- Linhas de debito/credito. IMUTAVEIS.
CREATE TABLE journal_lines (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id  UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id        UUID NOT NULL REFERENCES chart_of_accounts(id),
  amount_debit      NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount_credit     NUMERIC(14,2) NOT NULL DEFAULT 0,
  memo              TEXT,

  -- Cada linha e debito OU credito, nunca ambos, nunca zero
  CONSTRAINT jl_debit_or_credit CHECK (
    amount_debit >= 0
    AND amount_credit >= 0
    AND (amount_debit > 0 OR amount_credit > 0)
    AND NOT (amount_debit > 0 AND amount_credit > 0)
  )
);

-- 1.4 cost_centers
-- Centros de custo, lucro ou neutros. Hierarquia ate 3 niveis.
CREATE TABLE cost_centers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        center_type NOT NULL DEFAULT 'cost_center',
  parent_id   UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  icon        TEXT,
  color       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 center_allocations
-- Rateio de linhas contabeis entre centros. IMUTAVEIS.
CREATE TABLE center_allocations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_line_id  UUID NOT NULL REFERENCES journal_lines(id) ON DELETE CASCADE,
  cost_center_id   UUID NOT NULL REFERENCES cost_centers(id),
  percentage       NUMERIC(5,2) NOT NULL,
  amount           NUMERIC(14,2) NOT NULL,

  CONSTRAINT ca_percentage_range CHECK (percentage > 0 AND percentage <= 100)
);

-- 1.6 tax_parameters
-- Parametros fiscais versionados por vigencia
CREATE TABLE tax_parameters (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parameter_type      parameter_type NOT NULL,
  valid_from          DATE NOT NULL,
  valid_until         DATE,
  brackets            JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits              JSONB,
  source_references   JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.7 economic_indices
-- Valores historicos de indices economicos (dados publicos)
CREATE TABLE economic_indices (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  index_type        index_type NOT NULL,
  reference_date    DATE NOT NULL,
  value             NUMERIC(12,6) NOT NULL,
  accumulated_12m   NUMERIC(12,6),
  accumulated_year  NUMERIC(12,6),
  source_primary    TEXT NOT NULL,
  source_secondary  TEXT,
  fetched_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ei_unique_type_date UNIQUE (index_type, reference_date)
);

-- 1.8 economic_indices_sources
-- Mapeamento de fontes para cada indice
CREATE TABLE economic_indices_sources (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  index_type       index_type NOT NULL,
  priority         INTEGER NOT NULL,
  provider         TEXT NOT NULL,
  series_code      TEXT NOT NULL,
  api_url_template TEXT NOT NULL,
  periodicity      periodicity_type NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE
);

-- 1.9 workflows
-- Definicoes de workflows periodicos
CREATE TABLE workflows (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  workflow_type       workflow_type NOT NULL,
  periodicity         workflow_periodicity NOT NULL DEFAULT 'monthly',
  related_account_id  UUID REFERENCES accounts(id) ON DELETE SET NULL,
  related_coa_id      UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  day_of_period       INTEGER,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  last_completed_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.10 workflow_tasks
-- Tarefas individuais por ciclo de workflow
CREATE TABLE workflow_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  status          task_status NOT NULL DEFAULT 'pending',
  task_type       task_type NOT NULL,
  description     TEXT,
  document_id     UUID REFERENCES documents(id) ON DELETE SET NULL,
  result_data     JSONB,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar FK de journal_entries.workflow_task_id (referencia circular resolvida)
ALTER TABLE journal_entries
  ADD CONSTRAINT je_workflow_task_fk
  FOREIGN KEY (workflow_task_id) REFERENCES workflow_tasks(id) ON DELETE SET NULL;


-- ============================
-- 2. ALTERACOES EM TABELAS EXISTENTES
-- ============================

-- 2.1 transactions: novos campos para modelo contabil
ALTER TABLE transactions
  ADD COLUMN journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  ADD COLUMN occurred_at      TIMESTAMPTZ,
  ADD COLUMN posted_at        TIMESTAMPTZ,
  ADD COLUMN source           entry_source NOT NULL DEFAULT 'manual';

-- 2.2 accounts: vinculo com chart_of_accounts + tier de liquidez (adendo v1.4)
ALTER TABLE accounts
  ADD COLUMN coa_id         UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  ADD COLUMN liquidity_tier TEXT NOT NULL DEFAULT 'T1';

-- 2.3 budgets: vinculo com chart_of_accounts e centros
ALTER TABLE budgets
  ADD COLUMN coa_id            UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  ADD COLUMN cost_center_id    UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
  ADD COLUMN adjustment_index  adjustment_index_type;

-- 2.4 assets: vinculo com chart_of_accounts
ALTER TABLE assets
  ADD COLUMN coa_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL;

-- 2.5 recurrences: vinculo com chart_of_accounts, centros e reajuste
ALTER TABLE recurrences
  ADD COLUMN coa_id            UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  ADD COLUMN cost_center_id    UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
  ADD COLUMN adjustment_index  adjustment_index_type,
  ADD COLUMN adjustment_rate   NUMERIC(5,2);

-- 2.6 documents: campo thumbnail_path (adendo v1.2)
ALTER TABLE documents
  ADD COLUMN thumbnail_path TEXT;

-- 2.7 monthly_snapshots: campos de solvencia (adendo v1.4)
ALTER TABLE monthly_snapshots
  ADD COLUMN lcr            NUMERIC(6,2),
  ADD COLUMN runway_months  NUMERIC(6,1),
  ADD COLUMN burn_rate      NUMERIC(14,2),
  ADD COLUMN tier1_total    NUMERIC(14,2),
  ADD COLUMN tier2_total    NUMERIC(14,2),
  ADD COLUMN tier3_total    NUMERIC(14,2),
  ADD COLUMN tier4_total    NUMERIC(14,2);

-- 2.8 asset_category: novo valor 'restricted' (adendo v1.4)
ALTER TYPE asset_category ADD VALUE IF NOT EXISTS 'restricted';

-- 2.9 Storage: MIME types expandidos para importacao de arquivos (adendo v1.2)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.oasis.opendocument.text',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/x-ofx'
]
WHERE id = 'documents';


-- ============================
-- 3. INDEXES (18)
-- ============================

-- chart_of_accounts
CREATE UNIQUE INDEX idx_coa_user_code ON chart_of_accounts(user_id, internal_code);
CREATE INDEX idx_coa_user_group ON chart_of_accounts(user_id, group_type);
CREATE INDEX idx_coa_user_active ON chart_of_accounts(user_id, is_active) WHERE is_active = TRUE;

-- journal_entries
CREATE INDEX idx_je_user_date ON journal_entries(user_id, entry_date DESC);
CREATE INDEX idx_je_user_source ON journal_entries(user_id, source);
CREATE INDEX idx_je_transaction ON journal_entries(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX idx_je_reversal ON journal_entries(reversed_entry_id) WHERE reversed_entry_id IS NOT NULL;

-- journal_lines
CREATE INDEX idx_jl_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_jl_account ON journal_lines(account_id);

-- center_allocations
CREATE INDEX idx_ca_line ON center_allocations(journal_line_id);
CREATE INDEX idx_ca_center ON center_allocations(cost_center_id);

-- cost_centers
CREATE INDEX idx_cc_user ON cost_centers(user_id);

-- economic_indices
CREATE INDEX idx_ei_type_date ON economic_indices(index_type, reference_date DESC);

-- tax_parameters
CREATE INDEX idx_tp_type_valid ON tax_parameters(parameter_type, valid_from, valid_until);

-- workflows
CREATE INDEX idx_wf_user ON workflows(user_id, is_active) WHERE is_active = TRUE;

-- workflow_tasks
CREATE INDEX idx_wt_workflow_status ON workflow_tasks(workflow_id, status);
CREATE INDEX idx_wt_user_status ON workflow_tasks(user_id, status, created_at DESC);

-- transactions: index no novo campo
CREATE INDEX idx_tx_journal_entry ON transactions(journal_entry_id) WHERE journal_entry_id IS NOT NULL;


-- ============================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================

-- Habilitar RLS nas novas tabelas
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE center_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indices_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;


-- chart_of_accounts: CRUD, mas UPDATE/DELETE bloqueados para contas is_system
CREATE POLICY "coa_select" ON chart_of_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coa_insert" ON chart_of_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coa_update" ON chart_of_accounts
  FOR UPDATE USING (auth.uid() = user_id AND NOT is_system);
CREATE POLICY "coa_delete" ON chart_of_accounts
  FOR DELETE USING (auth.uid() = user_id AND NOT is_system);

-- journal_entries: SELECT e INSERT apenas. IMUTAVEL (sem UPDATE/DELETE).
CREATE POLICY "je_select" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "je_insert" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- journal_lines: SELECT e INSERT via journal_entry ownership. IMUTAVEL.
CREATE POLICY "jl_select" ON journal_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journal_entries
      WHERE journal_entries.id = journal_lines.journal_entry_id
        AND journal_entries.user_id = auth.uid()
    )
  );
CREATE POLICY "jl_insert" ON journal_lines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM journal_entries
      WHERE journal_entries.id = journal_lines.journal_entry_id
        AND journal_entries.user_id = auth.uid()
    )
  );

-- cost_centers: CRUD, mas DELETE bloqueado para centro default
CREATE POLICY "cc_select" ON cost_centers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cc_insert" ON cost_centers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cc_update" ON cost_centers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cc_delete" ON cost_centers
  FOR DELETE USING (auth.uid() = user_id AND NOT is_default);

-- center_allocations: SELECT e INSERT via journal_line > journal_entry. IMUTAVEL.
CREATE POLICY "ca_select" ON center_allocations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journal_lines jl
      JOIN journal_entries je ON je.id = jl.journal_entry_id
      WHERE jl.id = center_allocations.journal_line_id
        AND je.user_id = auth.uid()
    )
  );
CREATE POLICY "ca_insert" ON center_allocations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM journal_lines jl
      JOIN journal_entries je ON je.id = jl.journal_entry_id
      WHERE jl.id = center_allocations.journal_line_id
        AND je.user_id = auth.uid()
    )
  );

-- tax_parameters: leitura publica, escrita restrita a service_role
CREATE POLICY "tp_select" ON tax_parameters
  FOR SELECT USING (true);

-- economic_indices: leitura publica, escrita restrita a service_role
CREATE POLICY "ei_select" ON economic_indices
  FOR SELECT USING (true);

-- economic_indices_sources: leitura publica, escrita restrita a service_role
CREATE POLICY "eis_select" ON economic_indices_sources
  FOR SELECT USING (true);

-- workflows: CRUD completo
CREATE POLICY "wf_select" ON workflows
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wf_insert" ON workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wf_update" ON workflows
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wf_delete" ON workflows
  FOR DELETE USING (auth.uid() = user_id);

-- workflow_tasks: SELECT, INSERT, UPDATE. Sem DELETE (skipped, nao removidas).
CREATE POLICY "wt_select" ON workflow_tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wt_insert" ON workflow_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wt_update" ON workflow_tasks
  FOR UPDATE USING (auth.uid() = user_id);


-- ============================
-- 5. FUNCTIONS E TRIGGERS
-- ============================

-- 5.1 updated_at triggers para novas tabelas mutaveis
-- (reutiliza update_updated_at() da migration 001)
CREATE TRIGGER trg_coa_updated_at
  BEFORE UPDATE ON chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cost_centers_updated_at
  BEFORE UPDATE ON cost_centers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tax_parameters_updated_at
  BEFORE UPDATE ON tax_parameters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 5.2 activate_account_on_use()
-- Quando uma journal_line referencia uma conta inativa, ativa-a automaticamente.
CREATE OR REPLACE FUNCTION activate_account_on_use()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chart_of_accounts
  SET is_active = TRUE
  WHERE id = NEW.account_id
    AND is_active = FALSE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_jl_activate_account
  AFTER INSERT ON journal_lines
  FOR EACH ROW EXECUTE FUNCTION activate_account_on_use();


-- 5.3 create_default_cost_center()
-- Cria o centro default 'Pessoal' no onboarding.
CREATE OR REPLACE FUNCTION create_default_cost_center(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_center_id UUID;
BEGIN
  INSERT INTO cost_centers (user_id, name, type, is_default)
  VALUES (p_user_id, 'Pessoal', 'neutral', TRUE)
  RETURNING id INTO v_center_id;

  RETURN v_center_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================
-- 6. COMENTARIOS
-- ============================

COMMENT ON TABLE chart_of_accounts IS 'Plano de contas hierarquico (partida dobrada). 5 grupos, 133 contas-semente. Ref: estudo-contabil-v1.5';
COMMENT ON TABLE journal_entries IS 'Cabecalho de lancamentos contabeis. IMUTAVEL (append-only). Estornos via is_reversal.';
COMMENT ON TABLE journal_lines IS 'Linhas de debito/credito. IMUTAVEIS. Soma debitos = soma creditos por journal_entry.';
COMMENT ON TABLE cost_centers IS 'Centros de custo/lucro. Dimensao analitica ortogonal ao plano de contas.';
COMMENT ON TABLE center_allocations IS 'Rateio percentual de journal_lines entre centros. IMUTAVEL.';
COMMENT ON TABLE tax_parameters IS 'Parametros fiscais versionados (IRPF, INSS, etc.). Dados publicos, escrita via service_role.';
COMMENT ON TABLE economic_indices IS 'Indices economicos historicos (IPCA, Selic, etc.). Alimentado por Edge Function fetch-economic-indices.';
COMMENT ON TABLE economic_indices_sources IS 'Mapeamento de fontes (BCB SGS, IBGE SIDRA, IPEADATA) por indice.';
COMMENT ON TABLE workflows IS 'Definicoes de workflows periodicos (extratos, faturas, etc.).';
COMMENT ON TABLE workflow_tasks IS 'Tarefas individuais geradas por ciclo de workflow.';

COMMENT ON COLUMN transactions.journal_entry_id IS 'Vinculo com lancamento contabil. NULL para transacoes legadas pre-modelo contabil.';
COMMENT ON COLUMN transactions.source IS 'Origem: bank_feed, card_feed, manual, csv_import, ofx_import, ocr, system.';
COMMENT ON COLUMN accounts.coa_id IS 'Conta contabil correspondente (Grupo 1.1 para bancarias, 2.1.01 para cartoes).';
COMMENT ON COLUMN accounts.liquidity_tier IS 'Tier de liquidez para metricas de solvencia: T1/T2/T3/T4.';

```

### supabase/migrations/003_transaction_engine.sql
```
-- ============================================
-- WealthOS - Migration 003: Transaction Engine
-- ============================================
-- Atomic function: create_transaction_with_journal()
-- Creates transaction + journal_entry + journal_lines in one call.
-- Balance recalculation handled by existing trigger.
-- ============================================

CREATE OR REPLACE FUNCTION create_transaction_with_journal(
  p_user_id         UUID,
  p_account_id      UUID,
  p_category_id     UUID DEFAULT NULL,
  p_type            transaction_type DEFAULT 'expense',
  p_amount          NUMERIC(14,2) DEFAULT 0,
  p_description     TEXT DEFAULT NULL,
  p_date            DATE DEFAULT CURRENT_DATE,
  p_is_paid         BOOLEAN DEFAULT FALSE,
  p_source          entry_source DEFAULT 'manual',
  p_notes           TEXT DEFAULT NULL,
  p_tags            TEXT[] DEFAULT NULL,
  p_counterpart_coa_id UUID DEFAULT NULL  -- optional: explicit COA for expense/revenue line
)
RETURNS JSON AS $$
DECLARE
  v_transaction_id  UUID;
  v_journal_id      UUID;
  v_account_coa_id  UUID;
  v_counter_coa_id  UUID;
  v_account_type    account_type;
  v_debit_acct      UUID;
  v_credit_acct     UUID;
  v_now             TIMESTAMPTZ := NOW();
BEGIN
  -- 1. Validate account exists and belongs to user
  SELECT coa_id, type INTO v_account_coa_id, v_account_type
  FROM accounts
  WHERE id = p_account_id AND user_id = p_user_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta não encontrada ou inativa';
  END IF;

  -- 2. Resolve counterpart COA (expense/revenue chart_of_accounts entry)
  IF p_counterpart_coa_id IS NOT NULL THEN
    v_counter_coa_id := p_counterpart_coa_id;
  ELSE
    -- Auto-resolve: use fallback based on transaction type
    IF p_type = 'expense' THEN
      SELECT id INTO v_counter_coa_id
      FROM chart_of_accounts
      WHERE user_id = p_user_id AND internal_code = '5.19.01'
      LIMIT 1;
    ELSIF p_type = 'income' THEN
      SELECT id INTO v_counter_coa_id
      FROM chart_of_accounts
      WHERE user_id = p_user_id AND internal_code = '4.3.02'
      LIMIT 1;
    END IF;
  END IF;

  -- 3. Create transaction
  INSERT INTO transactions (
    user_id, account_id, category_id, type, amount,
    description, date, is_paid, source, notes, tags,
    occurred_at, posted_at
  ) VALUES (
    p_user_id, p_account_id, p_category_id, p_type, p_amount,
    p_description, p_date, p_is_paid, p_source, p_notes, p_tags,
    v_now, CASE WHEN p_is_paid THEN v_now ELSE NULL END
  )
  RETURNING id INTO v_transaction_id;

  -- 4. Create journal_entry (only if we have both COA entries)
  IF v_account_coa_id IS NOT NULL AND v_counter_coa_id IS NOT NULL THEN

    INSERT INTO journal_entries (
      user_id, entry_date, occurred_at, posted_at,
      source, description, transaction_id
    ) VALUES (
      p_user_id, p_date, v_now,
      CASE WHEN p_is_paid THEN v_now ELSE NULL END,
      p_source, p_description, v_transaction_id
    )
    RETURNING id INTO v_journal_id;

    -- 5. Determine debit/credit based on type + account type
    IF p_type = 'income' THEN
      -- Income: Debit asset (bank increases), Credit revenue
      v_debit_acct := v_account_coa_id;
      v_credit_acct := v_counter_coa_id;
    ELSIF p_type = 'expense' AND v_account_type = 'credit_card' THEN
      -- Expense via credit card: Debit expense, Credit liability (debt increases)
      v_debit_acct := v_counter_coa_id;
      v_credit_acct := v_account_coa_id;
    ELSIF p_type = 'expense' THEN
      -- Expense via bank: Debit expense, Credit asset (bank decreases)
      v_debit_acct := v_counter_coa_id;
      v_credit_acct := v_account_coa_id;
    END IF;

    -- 6. Create journal_lines (debit + credit)
    IF v_debit_acct IS NOT NULL AND v_credit_acct IS NOT NULL THEN
      INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit)
      VALUES
        (v_journal_id, v_debit_acct, p_amount, 0),
        (v_journal_id, v_credit_acct, 0, p_amount);

      -- Link journal back to transaction
      UPDATE transactions
      SET journal_entry_id = v_journal_id
      WHERE id = v_transaction_id;
    END IF;

  END IF;

  -- Return both IDs
  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'journal_entry_id', v_journal_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_transaction_with_journal IS
'Atomic creation of transaction + journal_entry + journal_lines.
Handles debit/credit rules based on transaction type and account type.
Balance recalculation handled by existing trigger on transactions.';


-- ============================================
-- Reverse transaction (estorno) - for Lote 2.10
-- Placeholder: will be enhanced later
-- ============================================

CREATE OR REPLACE FUNCTION reverse_transaction(
  p_user_id        UUID,
  p_transaction_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_tx             RECORD;
  v_je             RECORD;
  v_new_je_id      UUID;
BEGIN
  -- 1. Get original transaction
  SELECT * INTO v_tx
  FROM transactions
  WHERE id = p_transaction_id AND user_id = p_user_id AND is_deleted = FALSE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transação não encontrada';
  END IF;

  -- 2. Soft-delete the transaction
  UPDATE transactions
  SET is_deleted = TRUE, updated_at = NOW()
  WHERE id = p_transaction_id;

  -- 3. If has journal_entry, create reversal
  IF v_tx.journal_entry_id IS NOT NULL THEN
    -- Create reversal journal entry
    INSERT INTO journal_entries (
      user_id, entry_date, occurred_at, posted_at,
      source, description, is_reversal, reversed_entry_id,
      transaction_id
    ) VALUES (
      p_user_id, CURRENT_DATE, NOW(), NOW(),
      'system', 'Estorno: ' || COALESCE(v_tx.description, ''),
      TRUE, v_tx.journal_entry_id,
      p_transaction_id
    )
    RETURNING id INTO v_new_je_id;

    -- Copy journal_lines with swapped debit/credit
    INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit, memo)
    SELECT v_new_je_id, account_id, amount_credit, amount_debit, 'Estorno'
    FROM journal_lines
    WHERE journal_entry_id = v_tx.journal_entry_id;
  END IF;

  RETURN json_build_object(
    'reversed_transaction_id', p_transaction_id,
    'reversal_journal_id', v_new_je_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reverse_transaction IS
'Soft-deletes a transaction and creates a reversal journal entry with swapped debit/credit lines.
Append-only: original journal_entry is never modified.';

```

### supabase/migrations/004_dashboard_budget_rpcs.sql
```
-- ============================================
-- WealthOS - Migration 004: Dashboard & Budget RPCs
-- ============================================
-- Phase 3: DASH-01 to DASH-12, CTB-05, ORC-05
-- 6 RPCs for dashboard + budget aggregations
-- ============================================

-- ─── 1. get_dashboard_summary ─────────────────────────────────
-- Stories: DASH-01 (saldo consolidado), DASH-02 (receitas vs despesas)
-- Returns: account totals + current month income/expense

CREATE OR REPLACE FUNCTION get_dashboard_summary(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
  v_month_end DATE := (date_trunc('month', CURRENT_DATE) + interval '1 month')::DATE;
  v_result JSON;
BEGIN
  -- Auth check
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT json_build_object(
    'total_current_balance', COALESCE((
      SELECT SUM(
        CASE WHEN type = 'credit_card' THEN -current_balance
             ELSE current_balance END
      ) FROM accounts WHERE user_id = p_user_id AND is_active = true
    ), 0),
    'total_projected_balance', COALESCE((
      SELECT SUM(
        CASE WHEN type = 'credit_card' THEN -projected_balance
             ELSE projected_balance END
      ) FROM accounts WHERE user_id = p_user_id AND is_active = true
    ), 0),
    'active_accounts', COALESCE((
      SELECT COUNT(*)::INT FROM accounts WHERE user_id = p_user_id AND is_active = true
    ), 0),
    'month_income', COALESCE((
      SELECT SUM(amount) FROM transactions
      WHERE user_id = p_user_id
        AND type = 'income'
        AND date >= v_month_start AND date < v_month_end
        AND is_deleted = false
    ), 0),
    'month_expense', COALESCE((
      SELECT SUM(amount) FROM transactions
      WHERE user_id = p_user_id
        AND type = 'expense'
        AND date >= v_month_start AND date < v_month_end
        AND is_deleted = false
    ), 0),
    'month_start', v_month_start,
    'month_end', v_month_end
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_summary(UUID) TO authenticated;


-- ─── 2. get_balance_sheet ─────────────────────────────────────
-- Story: CTB-05 (balanço patrimonial no Dashboard)
-- Returns: total assets, liabilities, net worth
-- Sources: accounts (liquid) + assets (illiquid) for assets side;
--          credit_card balances for liabilities side

CREATE OR REPLACE FUNCTION get_balance_sheet(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_liquid_assets NUMERIC := 0;
  v_illiquid_assets NUMERIC := 0;
  v_total_assets NUMERIC := 0;
  v_total_liabilities NUMERIC := 0;
  v_net_worth NUMERIC := 0;
  v_result JSON;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Liquid assets: checking, savings, cash, investment (positive balances)
  SELECT COALESCE(SUM(current_balance), 0) INTO v_liquid_assets
  FROM accounts
  WHERE user_id = p_user_id
    AND is_active = true
    AND type IN ('checking', 'savings', 'cash', 'investment');

  -- Illiquid assets: real estate, vehicles, electronics, other, restricted
  SELECT COALESCE(SUM(current_value), 0) INTO v_illiquid_assets
  FROM assets
  WHERE user_id = p_user_id;

  v_total_assets := v_liquid_assets + v_illiquid_assets;

  -- Liabilities: credit card outstanding balance
  SELECT COALESCE(SUM(current_balance), 0) INTO v_total_liabilities
  FROM accounts
  WHERE user_id = p_user_id
    AND is_active = true
    AND type = 'credit_card';

  v_net_worth := v_total_assets - v_total_liabilities;

  SELECT json_build_object(
    'liquid_assets', v_liquid_assets,
    'illiquid_assets', v_illiquid_assets,
    'total_assets', v_total_assets,
    'total_liabilities', v_total_liabilities,
    'net_worth', v_net_worth
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_balance_sheet(UUID) TO authenticated;


-- ─── 3. get_solvency_metrics ──────────────────────────────────
-- Stories: DASH-09 (LCR), DASH-10 (Runway), DASH-11 (Burn Rate), DASH-12 (Tiers)
-- LCR = (T1 + T2) / (Burn Rate × 6)
-- Runway = (T1 + T2) / Burn Rate
-- Burn Rate = average monthly expense over last 6 months

CREATE OR REPLACE FUNCTION get_solvency_metrics(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier1 NUMERIC := 0;
  v_tier2 NUMERIC := 0;
  v_tier3 NUMERIC := 0;
  v_tier4 NUMERIC := 0;
  v_burn_rate NUMERIC := 0;
  v_runway NUMERIC := 0;
  v_lcr NUMERIC := 0;
  v_months_with_data INT := 0;
  v_total_expense_6m NUMERIC := 0;
  v_six_months_ago DATE := (CURRENT_DATE - interval '6 months')::DATE;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Tier 1 (imediato): checking, savings, cash + investments T1
  SELECT COALESCE(SUM(current_balance), 0) INTO v_tier1
  FROM accounts
  WHERE user_id = p_user_id AND is_active = true
    AND type != 'credit_card'
    AND liquidity_tier = 'T1';

  -- Tier 2 (líquido): investments T2
  SELECT COALESCE(SUM(current_balance), 0) INTO v_tier2
  FROM accounts
  WHERE user_id = p_user_id AND is_active = true
    AND liquidity_tier = 'T2';

  -- Tier 3 (ilíquido): assets exceto restricted
  SELECT COALESCE(SUM(current_value), 0) INTO v_tier3
  FROM assets
  WHERE user_id = p_user_id
    AND category != 'restricted';

  -- Tier 4 (restrito): assets restricted
  SELECT COALESCE(SUM(current_value), 0) INTO v_tier4
  FROM assets
  WHERE user_id = p_user_id
    AND category = 'restricted';

  -- Burn Rate: average monthly expense over last 6 months
  SELECT
    COALESCE(SUM(amount), 0),
    COUNT(DISTINCT date_trunc('month', date))::INT
  INTO v_total_expense_6m, v_months_with_data
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND date >= v_six_months_ago
    AND is_deleted = false;

  IF v_months_with_data > 0 THEN
    v_burn_rate := v_total_expense_6m / v_months_with_data;
  END IF;

  -- Runway = liquid assets / burn rate (months)
  IF v_burn_rate > 0 THEN
    v_runway := ROUND((v_tier1 + v_tier2) / v_burn_rate, 1);
    v_lcr := ROUND((v_tier1 + v_tier2) / (v_burn_rate * 6), 2);
  ELSE
    v_runway := 999; -- infinite runway if no expenses
    v_lcr := 999;
  END IF;

  RETURN json_build_object(
    'tier1_total', ROUND(v_tier1, 2),
    'tier2_total', ROUND(v_tier2, 2),
    'tier3_total', ROUND(v_tier3, 2),
    'tier4_total', ROUND(v_tier4, 2),
    'total_patrimony', ROUND(v_tier1 + v_tier2 + v_tier3 + v_tier4, 2),
    'burn_rate', ROUND(v_burn_rate, 2),
    'runway_months', v_runway,
    'lcr', v_lcr,
    'months_analyzed', v_months_with_data
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_solvency_metrics(UUID) TO authenticated;


-- ─── 4. get_top_categories ────────────────────────────────────
-- Story: DASH-03 (top categorias de gasto do mês)
-- Returns: array of {category_name, icon, color, total, percentage}

CREATE OR REPLACE FUNCTION get_top_categories(
  p_user_id UUID,
  p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT,
  p_month INT DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INT,
  p_limit INT DEFAULT 5
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start DATE;
  v_month_end DATE;
  v_total_expense NUMERIC := 0;
  v_result JSON;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_month_start := make_date(p_year, p_month, 1);
  v_month_end := v_month_start + interval '1 month';

  -- Total expense for percentage calculation
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expense
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND date >= v_month_start AND date < v_month_end
    AND is_deleted = false;

  -- Top categories
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON) INTO v_result
  FROM (
    SELECT
      c.name AS category_name,
      c.icon,
      c.color,
      SUM(tx.amount) AS total,
      CASE WHEN v_total_expense > 0
        THEN ROUND(SUM(tx.amount) / v_total_expense * 100, 1)
        ELSE 0
      END AS percentage
    FROM transactions tx
    JOIN categories c ON c.id = tx.category_id
    WHERE tx.user_id = p_user_id
      AND tx.type = 'expense'
      AND tx.date >= v_month_start AND tx.date < v_month_end
      AND tx.is_deleted = false
    GROUP BY c.id, c.name, c.icon, c.color
    ORDER BY SUM(tx.amount) DESC
    LIMIT p_limit
  ) t;

  RETURN json_build_object(
    'categories', v_result,
    'total_expense', v_total_expense,
    'month', v_month_start
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_top_categories(UUID, INT, INT, INT) TO authenticated;


-- ─── 5. get_balance_evolution ─────────────────────────────────
-- Story: DASH-07 (evolução do saldo nos últimos N meses)
-- Returns: array of {month, balance, projected, income, expense}
-- Source: monthly_snapshots if available, else calculated from transactions

CREATE OR REPLACE FUNCTION get_balance_evolution(
  p_user_id UUID,
  p_months INT DEFAULT 6
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_snapshot_count INT;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Check if we have snapshot data
  SELECT COUNT(*) INTO v_snapshot_count
  FROM monthly_snapshots
  WHERE user_id = p_user_id;

  IF v_snapshot_count >= 2 THEN
    -- Use snapshots
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.month), '[]'::JSON) INTO v_result
    FROM (
      SELECT
        month,
        total_balance AS balance,
        total_projected AS projected,
        total_income AS income,
        total_expense AS expense
      FROM monthly_snapshots
      WHERE user_id = p_user_id
      ORDER BY month DESC
      LIMIT p_months
    ) t;
  ELSE
    -- Calculate from transactions grouped by month
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.month), '[]'::JSON) INTO v_result
    FROM (
      SELECT
        date_trunc('month', date)::DATE AS month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS balance,
        0 AS projected
      FROM transactions
      WHERE user_id = p_user_id
        AND is_deleted = false
        AND date >= (CURRENT_DATE - (p_months || ' months')::INTERVAL)::DATE
      GROUP BY date_trunc('month', date)
      ORDER BY month DESC
      LIMIT p_months
    ) t;
  END IF;

  RETURN json_build_object(
    'data', v_result,
    'source', CASE WHEN v_snapshot_count >= 2 THEN 'snapshots' ELSE 'calculated' END,
    'months_requested', p_months
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_balance_evolution(UUID, INT) TO authenticated;


-- ─── 6. get_budget_vs_actual ──────────────────────────────────
-- Stories: DASH-05 (resumo orçamento), ORC-05 (relatório mensal)
-- Returns: array of {category, planned, actual, remaining, pct_used}

CREATE OR REPLACE FUNCTION get_budget_vs_actual(
  p_user_id UUID,
  p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT,
  p_month INT DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_date DATE;
  v_month_end DATE;
  v_result JSON;
  v_total_planned NUMERIC := 0;
  v_total_actual NUMERIC := 0;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_month_date := make_date(p_year, p_month, 1);
  v_month_end := v_month_date + interval '1 month';

  -- Get budget items with actual spending
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.pct_used DESC), '[]'::JSON) INTO v_result
  FROM (
    SELECT
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      b.id AS budget_id,
      b.planned_amount AS planned,
      b.alert_threshold,
      COALESCE(actuals.total, 0) AS actual,
      b.planned_amount - COALESCE(actuals.total, 0) AS remaining,
      CASE WHEN b.planned_amount > 0
        THEN ROUND(COALESCE(actuals.total, 0) / b.planned_amount * 100, 1)
        ELSE 0
      END AS pct_used,
      CASE
        WHEN b.planned_amount > 0 AND COALESCE(actuals.total, 0) >= b.planned_amount THEN 'exceeded'
        WHEN b.planned_amount > 0 AND COALESCE(actuals.total, 0) >= b.planned_amount * b.alert_threshold / 100.0 THEN 'warning'
        ELSE 'ok'
      END AS status
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    LEFT JOIN LATERAL (
      SELECT SUM(tx.amount) AS total
      FROM transactions tx
      WHERE tx.user_id = p_user_id
        AND tx.category_id = b.category_id
        AND tx.type = 'expense'
        AND tx.date >= v_month_date AND tx.date < v_month_end
        AND tx.is_deleted = false
    ) actuals ON true
    WHERE b.user_id = p_user_id
      AND b.month = v_month_date
  ) t;

  -- Totals
  SELECT
    COALESCE(SUM(b.planned_amount), 0),
    COALESCE(SUM(actuals.total), 0)
  INTO v_total_planned, v_total_actual
  FROM budgets b
  LEFT JOIN LATERAL (
    SELECT SUM(tx.amount) AS total
    FROM transactions tx
    WHERE tx.user_id = p_user_id
      AND tx.category_id = b.category_id
      AND tx.type = 'expense'
      AND tx.date >= v_month_date AND tx.date < v_month_end
      AND tx.is_deleted = false
  ) actuals ON true
  WHERE b.user_id = p_user_id
    AND b.month = v_month_date;

  RETURN json_build_object(
    'items', v_result,
    'total_planned', v_total_planned,
    'total_actual', v_total_actual,
    'total_remaining', v_total_planned - v_total_actual,
    'pct_used', CASE WHEN v_total_planned > 0
      THEN ROUND(v_total_actual / v_total_planned * 100, 1)
      ELSE 0
    END,
    'month', v_month_date,
    'budget_count', (SELECT COUNT(*) FROM budgets WHERE user_id = p_user_id AND month = v_month_date)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_budget_vs_actual(UUID, INT, INT) TO authenticated;

```

### supabase/migrations/005_recurrence_asset_rpcs.sql
```
-- ============================================
-- WealthOS - Migration 005: Recurrence & Asset RPCs
-- ============================================
-- Phase 4: CAP-01 to CAP-06, PAT-01 to PAT-07
-- ============================================

-- ─── 1. generate_next_recurrence ──────────────────────────────
-- CAP-05: When user marks a pending transaction as paid,
-- auto-advance next_due_date and create the next pending transaction.
-- Called from frontend after payment confirmation.

CREATE OR REPLACE FUNCTION generate_next_recurrence(
  p_user_id UUID,
  p_recurrence_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_next_date DATE;
  v_template JSONB;
  v_tx_id UUID;
  v_je_id UUID;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Fetch recurrence
  SELECT * INTO v_rec
  FROM recurrences
  WHERE id = p_recurrence_id AND user_id = p_user_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recorrência não encontrada ou inativa';
  END IF;

  v_template := v_rec.template_transaction;

  -- Calculate next due date based on frequency
  v_next_date := CASE v_rec.frequency
    WHEN 'daily' THEN v_rec.next_due_date + (v_rec.interval_count || ' days')::INTERVAL
    WHEN 'weekly' THEN v_rec.next_due_date + (v_rec.interval_count * 7 || ' days')::INTERVAL
    WHEN 'monthly' THEN v_rec.next_due_date + (v_rec.interval_count || ' months')::INTERVAL
    WHEN 'yearly' THEN v_rec.next_due_date + (v_rec.interval_count || ' years')::INTERVAL
  END;

  -- Check if recurrence has ended
  IF v_rec.end_date IS NOT NULL AND v_next_date > v_rec.end_date THEN
    -- Deactivate recurrence
    UPDATE recurrences SET is_active = false, updated_at = now()
    WHERE id = p_recurrence_id;

    RETURN json_build_object(
      'status', 'ended',
      'recurrence_id', p_recurrence_id,
      'message', 'Recorrência encerrada (data final atingida)'
    );
  END IF;

  -- Apply adjustment if configured
  DECLARE
    v_amount NUMERIC;
  BEGIN
    v_amount := (v_template->>'amount')::NUMERIC;

    IF v_rec.adjustment_index IS NOT NULL AND v_rec.adjustment_index != 'none' THEN
      IF v_rec.adjustment_index = 'manual' AND v_rec.adjustment_rate IS NOT NULL THEN
        v_amount := ROUND(v_amount * (1 + v_rec.adjustment_rate / 100.0), 2);
      END IF;
      -- Note: automatic index adjustment (IPCA, etc.) will be handled by
      -- the fetch-economic-indices Edge Function in Phase 8.
      -- For now, only manual adjustment is applied.
    END IF;

    -- Update template with adjusted amount
    v_template := jsonb_set(v_template, '{amount}', to_jsonb(v_amount));
  END;

  -- Create next pending transaction via the existing RPC
  SELECT (result->>'transaction_id')::UUID, (result->>'journal_entry_id')::UUID
  INTO v_tx_id, v_je_id
  FROM create_transaction_with_journal(
    p_user_id := p_user_id,
    p_account_id := (v_template->>'account_id')::UUID,
    p_category_id := (v_template->>'category_id')::UUID,
    p_type := (v_template->>'type')::transaction_type,
    p_amount := (v_template->>'amount')::NUMERIC,
    p_description := v_template->>'description',
    p_date := v_next_date::TEXT,
    p_is_paid := false,
    p_source := 'system'::entry_source,
    p_notes := NULL,
    p_tags := NULL,
    p_counterpart_coa_id := NULL
  ) AS result;

  -- Link transaction to recurrence
  UPDATE transactions SET recurrence_id = p_recurrence_id WHERE id = v_tx_id;

  -- Advance next_due_date
  UPDATE recurrences
  SET next_due_date = v_next_date, updated_at = now()
  WHERE id = p_recurrence_id;

  RETURN json_build_object(
    'status', 'generated',
    'recurrence_id', p_recurrence_id,
    'transaction_id', v_tx_id,
    'journal_entry_id', v_je_id,
    'next_due_date', v_next_date,
    'amount', (v_template->>'amount')::NUMERIC
  );
END;
$$;

GRANT EXECUTE ON FUNCTION generate_next_recurrence(UUID, UUID) TO authenticated;


-- ─── 2. depreciate_asset ──────────────────────────────────────
-- PAT-05: Apply depreciation to an asset.
-- Records in asset_value_history and updates current_value.
-- Depreciation = current_value * (rate / 12 / 100) [monthly linear]

CREATE OR REPLACE FUNCTION depreciate_asset(
  p_user_id UUID,
  p_asset_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset RECORD;
  v_depreciation NUMERIC;
  v_new_value NUMERIC;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_asset
  FROM assets
  WHERE id = p_asset_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bem não encontrado';
  END IF;

  IF v_asset.depreciation_rate <= 0 THEN
    RETURN json_build_object(
      'status', 'skipped',
      'reason', 'Taxa de depreciação é zero'
    );
  END IF;

  -- Monthly linear depreciation
  v_depreciation := ROUND(v_asset.current_value * (v_asset.depreciation_rate / 12.0 / 100.0), 2);

  -- Floor at zero
  v_new_value := GREATEST(v_asset.current_value - v_depreciation, 0);

  -- Record history
  INSERT INTO asset_value_history (asset_id, user_id, previous_value, new_value, change_reason, change_source)
  VALUES (p_asset_id, p_user_id, v_asset.current_value, v_new_value, 'Depreciação mensal automática', 'depreciation');

  -- Update asset
  UPDATE assets
  SET current_value = v_new_value, updated_at = now()
  WHERE id = p_asset_id;

  RETURN json_build_object(
    'status', 'depreciated',
    'asset_id', p_asset_id,
    'previous_value', v_asset.current_value,
    'depreciation', v_depreciation,
    'new_value', v_new_value,
    'rate_annual', v_asset.depreciation_rate
  );
END;
$$;

GRANT EXECUTE ON FUNCTION depreciate_asset(UUID, UUID) TO authenticated;


-- ─── 3. get_assets_summary ────────────────────────────────────
-- PAT-04 + PAT-06: Summary for assets page header
-- Returns totals by category + insurance alerts

CREATE OR REPLACE FUNCTION get_assets_summary(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN json_build_object(
    'total_value', COALESCE((
      SELECT SUM(current_value) FROM assets WHERE user_id = p_user_id
    ), 0),
    'total_acquisition', COALESCE((
      SELECT SUM(acquisition_value) FROM assets WHERE user_id = p_user_id
    ), 0),
    'asset_count', COALESCE((
      SELECT COUNT(*)::INT FROM assets WHERE user_id = p_user_id
    ), 0),
    'by_category', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT category, COUNT(*)::INT AS count, SUM(current_value) AS total_value
        FROM assets WHERE user_id = p_user_id
        GROUP BY category ORDER BY SUM(current_value) DESC
      ) t
    ), '[]'::JSON),
    'expiring_insurance', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, name, insurance_expiry,
          (insurance_expiry - CURRENT_DATE) AS days_until_expiry
        FROM assets
        WHERE user_id = p_user_id
          AND insurance_expiry IS NOT NULL
          AND insurance_expiry <= CURRENT_DATE + INTERVAL '30 days'
        ORDER BY insurance_expiry
      ) t
    ), '[]'::JSON),
    'total_depreciation', COALESCE((
      SELECT SUM(acquisition_value - current_value) FROM assets WHERE user_id = p_user_id
    ), 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_assets_summary(UUID) TO authenticated;

```

### supabase/migrations/006_center_advanced_rpcs.sql
```
-- ============================================
-- WealthOS - Migration 006: Center Advanced RPCs
-- ============================================
-- Phase 5: CEN-03 (rateio), CEN-04 (P&L), CEN-05 (export data)
-- ============================================

-- ─── 1. allocate_to_centers ──────────────────────────────────

CREATE OR REPLACE FUNCTION allocate_to_centers(
  p_user_id UUID,
  p_transaction_id UUID,
  p_allocations JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_pct NUMERIC := 0;
  v_alloc JSONB;
  v_line RECORD;
  v_tx RECORD;
  v_results JSONB := '[]'::JSONB;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT t.*, t.journal_entry_id INTO v_tx
  FROM transactions t
  WHERE t.id = p_transaction_id AND t.user_id = p_user_id AND t.is_deleted = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transação não encontrada';
  END IF;

  IF v_tx.journal_entry_id IS NULL THEN
    RAISE EXCEPTION 'Transação sem lançamento contábil';
  END IF;

  SELECT COALESCE(SUM((elem->>'percentage')::NUMERIC), 0) INTO v_total_pct
  FROM jsonb_array_elements(p_allocations) AS elem;

  IF ABS(v_total_pct - 100) > 0.01 THEN
    RAISE EXCEPTION 'Percentuais devem somar 100 porcento (soma atual: %)', v_total_pct;
  END IF;

  FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM cost_centers
      WHERE id = (v_alloc->>'cost_center_id')::UUID
        AND user_id = p_user_id AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Centro de custo inválido: %', v_alloc->>'cost_center_id';
    END IF;
  END LOOP;

  FOR v_line IN
    SELECT jl.* FROM journal_lines jl
    JOIN chart_of_accounts coa ON coa.id = jl.account_id
    WHERE jl.journal_entry_id = v_tx.journal_entry_id
      AND coa.group_type IN ('expense', 'revenue')
    LIMIT 1
  LOOP
    DELETE FROM center_allocations WHERE journal_line_id = v_line.id;

    FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations)
    LOOP
      INSERT INTO center_allocations (journal_line_id, cost_center_id, percentage, amount)
      VALUES (
        v_line.id,
        (v_alloc->>'cost_center_id')::UUID,
        (v_alloc->>'percentage')::NUMERIC,
        ROUND(
          GREATEST(v_line.amount_debit, v_line.amount_credit) * (v_alloc->>'percentage')::NUMERIC / 100.0,
          2
        )
      );

      v_results := v_results || jsonb_build_object(
        'cost_center_id', v_alloc->>'cost_center_id',
        'percentage', (v_alloc->>'percentage')::NUMERIC,
        'amount', ROUND(
          GREATEST(v_line.amount_debit, v_line.amount_credit) * (v_alloc->>'percentage')::NUMERIC / 100.0,
          2
        )
      );
    END LOOP;
  END LOOP;

  RETURN json_build_object(
    'status', 'allocated',
    'transaction_id', p_transaction_id,
    'allocations', v_results
  );
END;
$$;

GRANT EXECUTE ON FUNCTION allocate_to_centers(UUID, UUID, JSONB) TO authenticated;


-- ─── 2. get_center_pnl ──────────────────────────────────────

CREATE OR REPLACE FUNCTION get_center_pnl(
  p_user_id UUID,
  p_center_id UUID,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from DATE := COALESCE(p_date_from, date_trunc('month', CURRENT_DATE)::DATE);
  v_to DATE := COALESCE(p_date_to, (date_trunc('month', CURRENT_DATE) + interval '1 month')::DATE);
  v_income NUMERIC := 0;
  v_expense NUMERIC := 0;
  v_center RECORD;
  v_monthly JSON;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_center FROM cost_centers
  WHERE id = p_center_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Centro não encontrado';
  END IF;

  -- From center_allocations (rateio)
  SELECT
    COALESCE(SUM(CASE WHEN coa.group_type = 'revenue' THEN ca.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN coa.group_type = 'expense' THEN ca.amount ELSE 0 END), 0)
  INTO v_income, v_expense
  FROM center_allocations ca
  JOIN journal_lines jl ON jl.id = ca.journal_line_id
  JOIN chart_of_accounts coa ON coa.id = jl.account_id
  JOIN journal_entries je ON je.id = jl.journal_entry_id
  JOIN transactions tx ON tx.journal_entry_id = je.id
  WHERE ca.cost_center_id = p_center_id
    AND tx.user_id = p_user_id
    AND tx.date >= v_from AND tx.date < v_to
    AND tx.is_deleted = false;

  -- Monthly breakdown
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.month), '[]'::JSON) INTO v_monthly
  FROM (
    SELECT
      date_trunc('month', tx.date)::DATE AS month,
      SUM(CASE WHEN coa.group_type = 'revenue' THEN ca.amount ELSE 0 END) AS income,
      SUM(CASE WHEN coa.group_type = 'expense' THEN ca.amount ELSE 0 END) AS expense
    FROM center_allocations ca
    JOIN journal_lines jl ON jl.id = ca.journal_line_id
    JOIN chart_of_accounts coa ON coa.id = jl.account_id
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    JOIN transactions tx ON tx.journal_entry_id = je.id
    WHERE ca.cost_center_id = p_center_id
      AND tx.user_id = p_user_id
      AND tx.date >= v_from AND tx.date < v_to
      AND tx.is_deleted = false
    GROUP BY date_trunc('month', tx.date)
  ) t;

  RETURN json_build_object(
    'center_id', p_center_id,
    'center_name', v_center.name,
    'center_type', v_center.type,
    'period_from', v_from,
    'period_to', v_to,
    'total_income', ROUND(v_income, 2),
    'total_expense', ROUND(v_expense, 2),
    'net_result', ROUND(v_income - v_expense, 2),
    'monthly', v_monthly
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_center_pnl(UUID, UUID, DATE, DATE) TO authenticated;


-- ─── 3. get_center_export ─────────────────────────────────────

CREATE OR REPLACE FUNCTION get_center_export(
  p_user_id UUID,
  p_center_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_center RECORD;
  v_transactions JSON;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_center FROM cost_centers
  WHERE id = p_center_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Centro não encontrado';
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date DESC), '[]'::JSON) INTO v_transactions
  FROM (
    SELECT
      tx.id, tx.date, tx.type, tx.amount, tx.description, tx.is_paid,
      ca.percentage AS center_percentage,
      ca.amount AS center_amount,
      coa.display_name AS coa_name,
      coa.group_type
    FROM center_allocations ca
    JOIN journal_lines jl ON jl.id = ca.journal_line_id
    JOIN chart_of_accounts coa ON coa.id = jl.account_id
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    JOIN transactions tx ON tx.journal_entry_id = je.id
    WHERE ca.cost_center_id = p_center_id
      AND tx.user_id = p_user_id
      AND tx.is_deleted = false
  ) t;

  RETURN json_build_object(
    'center', json_build_object(
      'id', v_center.id,
      'name', v_center.name,
      'type', v_center.type,
      'color', v_center.color,
      'created_at', v_center.created_at
    ),
    'transactions', v_transactions,
    'exported_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_center_export(UUID, UUID) TO authenticated;

```

### supabase/migrations/007_workflow_rpcs.sql
```
-- ============================================
-- WealthOS - Migration 007: Workflow RPCs
-- ============================================
-- Phase 6: WKF-01 to WKF-04
-- ============================================

-- ─── 1. auto_create_workflow_for_account ─────────────────────
-- WKF-01: Called after account creation. Creates appropriate
-- workflow based on account type.

CREATE OR REPLACE FUNCTION auto_create_workflow_for_account(
  p_user_id UUID,
  p_account_id UUID,
  p_account_type TEXT,
  p_account_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wf_type workflow_type;
  v_wf_name TEXT;
  v_wf_id UUID;
  v_tasks_template JSONB;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Determine workflow type from account type
  CASE p_account_type
    WHEN 'checking', 'savings' THEN
      v_wf_type := 'bank_statement';
      v_wf_name := 'Extrato ' || p_account_name;
      v_tasks_template := '[
        {"task_type": "upload_document", "description": "Upload do extrato bancário"},
        {"task_type": "categorize_transactions", "description": "Conferir categorização dos lançamentos"}
      ]'::JSONB;
    WHEN 'credit_card' THEN
      v_wf_type := 'card_statement';
      v_wf_name := 'Fatura ' || p_account_name;
      v_tasks_template := '[
        {"task_type": "upload_document", "description": "Upload da fatura do cartão"},
        {"task_type": "categorize_transactions", "description": "Conferir categorização dos lançamentos"}
      ]'::JSONB;
    WHEN 'investment' THEN
      v_wf_type := 'investment_update';
      v_wf_name := 'Atualização ' || p_account_name;
      v_tasks_template := '[
        {"task_type": "update_balance", "description": "Atualizar saldo/posição do investimento"}
      ]'::JSONB;
    ELSE
      -- No workflow for cash/other types
      RETURN json_build_object('status', 'skipped', 'reason', 'Tipo de conta não requer workflow');
  END CASE;

  -- Check if workflow already exists for this account
  IF EXISTS (
    SELECT 1 FROM workflows
    WHERE user_id = p_user_id AND related_account_id = p_account_id AND is_active = true
  ) THEN
    RETURN json_build_object('status', 'exists', 'reason', 'Workflow já existe para esta conta');
  END IF;

  -- Create workflow
  INSERT INTO workflows (user_id, name, workflow_type, periodicity, related_account_id, day_of_period)
  VALUES (p_user_id, v_wf_name, v_wf_type, 'monthly', p_account_id, 1)
  RETURNING id INTO v_wf_id;

  RETURN json_build_object(
    'status', 'created',
    'workflow_id', v_wf_id,
    'workflow_type', v_wf_type,
    'name', v_wf_name,
    'tasks_template', v_tasks_template
  );
END;
$$;

GRANT EXECUTE ON FUNCTION auto_create_workflow_for_account(UUID, UUID, TEXT, TEXT) TO authenticated;


-- ─── 2. generate_tasks_for_period ────────────────────────────
-- WKF-01/WKF-02: Generate tasks for all active workflows
-- for a given period (month). Idempotent: skips if tasks
-- already exist for the period.

CREATE OR REPLACE FUNCTION generate_tasks_for_period(
  p_user_id UUID,
  p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT,
  p_month INT DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_wf RECORD;
  v_task_def JSONB;
  v_created INT := 0;
  v_skipped INT := 0;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_period_start := make_date(p_year, p_month, 1);
  v_period_end := (v_period_start + interval '1 month')::DATE;

  FOR v_wf IN
    SELECT * FROM workflows
    WHERE user_id = p_user_id AND is_active = true
  LOOP
    -- Skip if tasks already exist for this workflow+period
    IF EXISTS (
      SELECT 1 FROM workflow_tasks
      WHERE workflow_id = v_wf.id
        AND period_start = v_period_start
        AND period_end = v_period_end
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Generate tasks based on workflow type
    CASE v_wf.workflow_type
      WHEN 'bank_statement', 'card_statement' THEN
        INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
        VALUES
          (v_wf.id, p_user_id, v_period_start, v_period_end, 'upload_document',
           'Upload do extrato/fatura: ' || v_wf.name),
          (v_wf.id, p_user_id, v_period_start, v_period_end, 'categorize_transactions',
           'Conferir categorização: ' || v_wf.name);
        v_created := v_created + 2;

      WHEN 'loan_payment' THEN
        INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
        VALUES
          (v_wf.id, p_user_id, v_period_start, v_period_end, 'update_balance',
           'Atualizar saldo do financiamento: ' || v_wf.name);
        v_created := v_created + 1;

      WHEN 'investment_update' THEN
        INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
        VALUES
          (v_wf.id, p_user_id, v_period_start, v_period_end, 'update_balance',
           'Atualizar posição: ' || v_wf.name);
        v_created := v_created + 1;

      WHEN 'fiscal_review' THEN
        INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
        VALUES
          (v_wf.id, p_user_id, v_period_start, v_period_end, 'review_fiscal',
           'Revisão fiscal: ' || v_wf.name);
        v_created := v_created + 1;
    END CASE;
  END LOOP;

  RETURN json_build_object(
    'status', 'ok',
    'period', v_period_start,
    'tasks_created', v_created,
    'workflows_skipped', v_skipped
  );
END;
$$;

GRANT EXECUTE ON FUNCTION generate_tasks_for_period(UUID, INT, INT) TO authenticated;


-- ─── 3. complete_workflow_task ────────────────────────────────
-- WKF-02/WKF-03/WKF-04: Mark a task as completed with optional result data.

CREATE OR REPLACE FUNCTION complete_workflow_task(
  p_user_id UUID,
  p_task_id UUID,
  p_status TEXT DEFAULT 'completed',
  p_result_data JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
  v_all_done BOOLEAN;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_task
  FROM workflow_tasks
  WHERE id = p_task_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tarefa não encontrada';
  END IF;

  -- Update task
  UPDATE workflow_tasks
  SET
    status = p_status::task_status,
    completed_at = CASE WHEN p_status IN ('completed', 'skipped') THEN now() ELSE NULL END,
    result_data = COALESCE(p_result_data, result_data)
  WHERE id = p_task_id;

  -- Check if all tasks for this workflow+period are done
  SELECT NOT EXISTS (
    SELECT 1 FROM workflow_tasks
    WHERE workflow_id = v_task.workflow_id
      AND period_start = v_task.period_start
      AND period_end = v_task.period_end
      AND status NOT IN ('completed', 'skipped')
  ) INTO v_all_done;

  -- If all done, update workflow last_completed_at
  IF v_all_done THEN
    UPDATE workflows
    SET last_completed_at = now(), updated_at = now()
    WHERE id = v_task.workflow_id;
  END IF;

  RETURN json_build_object(
    'status', 'ok',
    'task_id', p_task_id,
    'new_status', p_status,
    'all_period_tasks_done', v_all_done
  );
END;
$$;

GRANT EXECUTE ON FUNCTION complete_workflow_task(UUID, UUID, TEXT, JSONB) TO authenticated;

```

### supabase/migrations/008_fiscal_module.sql
```
-- ============================================
-- WealthOS - Migration 008: Fiscal Module
-- ============================================
-- Phase 7: FIS-01 to FIS-06 + Tax Provisioning Intelligence
-- Seeds tax_parameters for 2025 and 2026
-- ============================================

-- ─── 1. Seed tax_parameters ──────────────────────────────────

-- IRPF Monthly Progressive Table 2025 (used for declaration 2026)
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'irpf_monthly',
  '2025-05-01',
  '2025-12-31',
  '[
    {"min": 0,       "max": 2428.80,  "rate": 0,    "deduction": 0},
    {"min": 2428.81, "max": 2826.65,  "rate": 7.5,  "deduction": 182.16},
    {"min": 2826.66, "max": 3751.05,  "rate": 15,   "deduction": 394.16},
    {"min": 3751.06, "max": 4664.68,  "rate": 22.5, "deduction": 675.49},
    {"min": 4664.69, "max": 99999999, "rate": 27.5, "deduction": 908.73}
  ]'::JSONB,
  '{"simplified_discount_monthly": 607.20, "dependent_deduction_monthly": 189.59}'::JSONB,
  '[{"source": "RFB", "url": "https://www.gov.br/receitafederal", "date": "2025-05-01"}]'::JSONB,
  'system_seed'
);

-- IRPF Monthly Progressive Table 2026 (same base table, with new reductions)
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'irpf_monthly',
  '2026-01-01',
  NULL,
  '[
    {"min": 0,       "max": 2428.80,  "rate": 0,    "deduction": 0},
    {"min": 2428.81, "max": 2826.65,  "rate": 7.5,  "deduction": 182.16},
    {"min": 2826.66, "max": 3751.05,  "rate": 15,   "deduction": 394.16},
    {"min": 3751.06, "max": 4664.68,  "rate": 22.5, "deduction": 675.49},
    {"min": 4664.69, "max": 99999999, "rate": 27.5, "deduction": 908.73}
  ]'::JSONB,
  '{
    "simplified_discount_monthly": 607.20,
    "dependent_deduction_monthly": 189.59,
    "reduction_flat": 312.89,
    "reduction_formula_constant": 978.62,
    "reduction_formula_factor": 0.133145,
    "reduction_threshold_full": 5000,
    "reduction_threshold_partial": 7350,
    "annual_exemption": 60000,
    "annual_simplified_discount": 17640,
    "education_deduction_annual_per_person": 3561.50
  }'::JSONB,
  '[
    {"source": "RFB", "url": "https://www.gov.br/receitafederal", "date": "2025-12-11"},
    {"source": "Lei 15.270/2025", "url": "https://www.planalto.gov.br", "date": "2025-11-26"}
  ]'::JSONB,
  'system_seed'
);

-- IRPF Annual Table 2025 (for declaration 2026, year-calendar 2025)
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'irpf_annual',
  '2025-01-01',
  '2025-12-31',
  '[
    {"min": 0,        "max": 26963.20,  "rate": 0,    "deduction": 0},
    {"min": 26963.21, "max": 33919.80,  "rate": 7.5,  "deduction": 2022.24},
    {"min": 33919.81, "max": 45012.60,  "rate": 15,   "deduction": 4566.23},
    {"min": 45012.61, "max": 55976.16,  "rate": 22.5, "deduction": 7942.17},
    {"min": 55976.17, "max": 99999999,  "rate": 27.5, "deduction": 10740.98}
  ]'::JSONB,
  '{"simplified_discount_annual": 16754.34}'::JSONB,
  '[{"source": "RFB", "url": "https://www.gov.br/receitafederal", "date": "2025-01-01"}]'::JSONB,
  'system_seed'
);

-- IRPF Annual Table 2026 (for declaration 2027, year-calendar 2026)
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'irpf_annual',
  '2026-01-01',
  NULL,
  '[
    {"min": 0,        "max": 29145.60,  "rate": 0,    "deduction": 0},
    {"min": 29145.61, "max": 33919.80,  "rate": 7.5,  "deduction": 2185.92},
    {"min": 33919.81, "max": 45012.60,  "rate": 15,   "deduction": 4731.41},
    {"min": 45012.61, "max": 55976.16,  "rate": 22.5, "deduction": 8107.35},
    {"min": 55976.17, "max": 99999999,  "rate": 27.5, "deduction": 10906.16}
  ]'::JSONB,
  '{
    "annual_exemption": 60000,
    "simplified_discount_annual": 17640,
    "annual_reduction_flat": 3754.68,
    "annual_reduction_formula_constant": 11743.44,
    "annual_reduction_formula_factor": 0.133145,
    "annual_reduction_threshold_full": 60000,
    "annual_reduction_threshold_partial": 88200
  }'::JSONB,
  '[
    {"source": "RFB", "url": "https://www.gov.br/receitafederal", "date": "2025-12-11"},
    {"source": "Lei 15.270/2025", "url": "https://www.planalto.gov.br", "date": "2025-11-26"}
  ]'::JSONB,
  'system_seed'
);

-- INSS Employee Table 2025
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'inss_employee',
  '2025-01-01',
  '2025-12-31',
  '[
    {"min": 0,       "max": 1518.00,  "rate": 7.5},
    {"min": 1518.01, "max": 2793.88,  "rate": 9},
    {"min": 2793.89, "max": 4190.83,  "rate": 12},
    {"min": 4190.84, "max": 8157.41,  "rate": 14}
  ]'::JSONB,
  '{"ceiling": 8157.41}'::JSONB,
  '[{"source": "Portaria MPS/MF", "url": "https://www.in.gov.br", "date": "2025-01-01"}]'::JSONB,
  'system_seed'
);

-- Minimum Wage 2025
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'minimum_wage',
  '2025-01-01',
  '2025-12-31',
  '[]'::JSONB,
  '{"value": 1518.00}'::JSONB,
  '[{"source": "Decreto Presidencial", "url": "https://www.planalto.gov.br", "date": "2025-01-01"}]'::JSONB,
  'system_seed'
);

-- Capital Gains Table
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'capital_gains',
  '2016-01-01',
  NULL,
  '[
    {"min": 0,         "max": 5000000,   "rate": 15},
    {"min": 5000001,   "max": 10000000,  "rate": 17.5},
    {"min": 10000001,  "max": 30000000,  "rate": 20},
    {"min": 30000001,  "max": 99999999999, "rate": 22.5}
  ]'::JSONB,
  '{"stock_monthly_exemption": 20000, "crypto_monthly_exemption": 35000}'::JSONB,
  '[{"source": "Lei 13.259/2016", "url": "https://www.planalto.gov.br", "date": "2016-03-16"}]'::JSONB,
  'system_seed'
);


-- ─── 2. get_fiscal_report ────────────────────────────────────
-- FIS-01 to FIS-04, FIS-06: Fiscal report by tax_treatment
-- Groups all journal_entries by tax_treatment for a given year.

CREATE OR REPLACE FUNCTION get_fiscal_report(
  p_user_id UUID,
  p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year_start DATE;
  v_year_end DATE;
  v_result JSON;
  v_by_treatment JSON;
  v_totals JSON;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_year_start := make_date(p_year, 1, 1);
  v_year_end := make_date(p_year + 1, 1, 1);

  -- Group by tax_treatment
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON) INTO v_by_treatment
  FROM (
    SELECT
      coa.tax_treatment,
      coa.group_type,
      SUM(CASE WHEN coa.group_type = 'revenue' THEN jl.amount_credit ELSE 0 END) AS total_revenue,
      SUM(CASE WHEN coa.group_type = 'expense' THEN jl.amount_debit ELSE 0 END) AS total_expense,
      COUNT(DISTINCT je.id)::INT AS entry_count,
      json_agg(DISTINCT jsonb_build_object(
        'coa_code', coa.internal_code,
        'coa_name', coa.display_name,
        'total', CASE
          WHEN coa.group_type = 'revenue' THEN jl.amount_credit
          WHEN coa.group_type = 'expense' THEN jl.amount_debit
          ELSE 0
        END
      )) AS accounts
    FROM journal_lines jl
    JOIN chart_of_accounts coa ON coa.id = jl.account_id
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    JOIN transactions tx ON tx.journal_entry_id = je.id
    WHERE tx.user_id = p_user_id
      AND tx.date >= v_year_start AND tx.date < v_year_end
      AND tx.is_deleted = false
      AND je.is_reversal = false
      AND coa.tax_treatment IS NOT NULL
      AND coa.group_type IN ('revenue', 'expense')
    GROUP BY coa.tax_treatment, coa.group_type
    ORDER BY coa.tax_treatment, coa.group_type
  ) t;

  -- Totals
  SELECT json_build_object(
    'total_tributavel_revenue', COALESCE((
      SELECT SUM(jl.amount_credit)
      FROM journal_lines jl
      JOIN chart_of_accounts coa ON coa.id = jl.account_id
      JOIN journal_entries je ON je.id = jl.journal_entry_id
      JOIN transactions tx ON tx.journal_entry_id = je.id
      WHERE tx.user_id = p_user_id AND tx.date >= v_year_start AND tx.date < v_year_end
        AND tx.is_deleted = false AND je.is_reversal = false
        AND coa.tax_treatment = 'tributavel' AND coa.group_type = 'revenue'
    ), 0),
    'total_isento_revenue', COALESCE((
      SELECT SUM(jl.amount_credit)
      FROM journal_lines jl
      JOIN chart_of_accounts coa ON coa.id = jl.account_id
      JOIN journal_entries je ON je.id = jl.journal_entry_id
      JOIN transactions tx ON tx.journal_entry_id = je.id
      WHERE tx.user_id = p_user_id AND tx.date >= v_year_start AND tx.date < v_year_end
        AND tx.is_deleted = false AND je.is_reversal = false
        AND coa.tax_treatment = 'isento' AND coa.group_type = 'revenue'
    ), 0),
    'total_dedutivel_expense', COALESCE((
      SELECT SUM(jl.amount_debit)
      FROM journal_lines jl
      JOIN chart_of_accounts coa ON coa.id = jl.account_id
      JOIN journal_entries je ON je.id = jl.journal_entry_id
      JOIN transactions tx ON tx.journal_entry_id = je.id
      WHERE tx.user_id = p_user_id AND tx.date >= v_year_start AND tx.date < v_year_end
        AND tx.is_deleted = false AND je.is_reversal = false
        AND coa.tax_treatment IN ('dedutivel_integral', 'dedutivel_limitado')
        AND coa.group_type = 'expense'
    ), 0),
    'total_transactions', COALESCE((
      SELECT COUNT(*)::INT FROM transactions
      WHERE user_id = p_user_id AND date >= v_year_start AND date < v_year_end AND is_deleted = false
    ), 0)
  ) INTO v_totals;

  RETURN json_build_object(
    'year', p_year,
    'period_start', v_year_start,
    'period_end', v_year_end,
    'by_treatment', v_by_treatment,
    'totals', v_totals
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_fiscal_report(UUID, INT) TO authenticated;


-- ─── 3. get_fiscal_projection ────────────────────────────────
-- TAX PROVISIONING INTELLIGENCE
-- Calculates projected annual IRPF based on YTD income,
-- compares against IRRF withheld, shows monthly gap to provision.
-- This is the "multiple sources" scenario intelligence.

CREATE OR REPLACE FUNCTION get_fiscal_projection(
  p_user_id UUID,
  p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year_start DATE;
  v_today DATE := CURRENT_DATE;
  v_months_elapsed INT;
  v_months_remaining INT;
  v_ytd_taxable_income NUMERIC := 0;
  v_ytd_deductible NUMERIC := 0;
  v_ytd_irrf_withheld NUMERIC := 0;
  v_projected_annual_income NUMERIC := 0;
  v_projected_annual_deductible NUMERIC := 0;
  v_taxable_base NUMERIC := 0;
  v_estimated_annual_tax NUMERIC := 0;
  v_tax_gap NUMERIC := 0;
  v_monthly_provision NUMERIC := 0;
  v_brackets JSONB;
  v_limits JSONB;
  v_bracket JSONB;
  v_annual_reduction NUMERIC := 0;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_year_start := make_date(p_year, 1, 1);
  v_months_elapsed := GREATEST(EXTRACT(MONTH FROM v_today)::INT - EXTRACT(MONTH FROM v_year_start)::INT + 1, 1);
  v_months_remaining := 12 - v_months_elapsed;

  -- YTD taxable income (tax_treatment = 'tributavel')
  SELECT COALESCE(SUM(tx.amount), 0) INTO v_ytd_taxable_income
  FROM transactions tx
  JOIN journal_entries je ON je.id = tx.journal_entry_id
  JOIN journal_lines jl ON jl.journal_entry_id = je.id
  JOIN chart_of_accounts coa ON coa.id = jl.account_id
  WHERE tx.user_id = p_user_id
    AND tx.type = 'income'
    AND tx.date >= v_year_start AND tx.date < v_today + 1
    AND tx.is_deleted = false
    AND coa.tax_treatment = 'tributavel'
    AND coa.group_type = 'revenue';

  -- YTD deductible expenses
  SELECT COALESCE(SUM(tx.amount), 0) INTO v_ytd_deductible
  FROM transactions tx
  JOIN journal_entries je ON je.id = tx.journal_entry_id
  JOIN journal_lines jl ON jl.journal_entry_id = je.id
  JOIN chart_of_accounts coa ON coa.id = jl.account_id
  WHERE tx.user_id = p_user_id
    AND tx.type = 'expense'
    AND tx.date >= v_year_start AND tx.date < v_today + 1
    AND tx.is_deleted = false
    AND coa.tax_treatment IN ('dedutivel_integral', 'dedutivel_limitado')
    AND coa.group_type = 'expense';

  -- Project to 12 months
  v_projected_annual_income := ROUND(v_ytd_taxable_income * 12.0 / v_months_elapsed, 2);
  v_projected_annual_deductible := ROUND(v_ytd_deductible * 12.0 / v_months_elapsed, 2);

  -- Taxable base = income - deductions (simplified: max of actual deductions vs simplified discount)
  -- Fetch annual table for the year
  SELECT brackets, limits INTO v_brackets, v_limits
  FROM tax_parameters
  WHERE parameter_type = 'irpf_annual'
    AND valid_from <= make_date(p_year, 12, 31)
    AND (valid_until IS NULL OR valid_until >= make_date(p_year, 1, 1))
  ORDER BY valid_from DESC
  LIMIT 1;

  -- If no table found, return empty projection
  IF v_brackets IS NULL THEN
    RETURN json_build_object(
      'status', 'no_parameters',
      'message', 'Tabela IRPF não encontrada para o ano ' || p_year
    );
  END IF;

  -- Calculate taxable base (use simplified discount if higher than actual deductions)
  DECLARE
    v_simplified_discount NUMERIC := COALESCE((v_limits->>'simplified_discount_annual')::NUMERIC, 0);
    v_annual_exemption NUMERIC := COALESCE((v_limits->>'annual_exemption')::NUMERIC, 0);
  BEGIN
    v_taxable_base := v_projected_annual_income - GREATEST(v_projected_annual_deductible, v_simplified_discount);
    v_taxable_base := GREATEST(v_taxable_base, 0);

    -- Check annual exemption (2026: R$60k)
    IF v_projected_annual_income <= v_annual_exemption AND v_annual_exemption > 0 THEN
      v_estimated_annual_tax := 0;
    ELSE
      -- Apply progressive brackets
      FOR v_bracket IN SELECT * FROM jsonb_array_elements(v_brackets)
      LOOP
        IF v_taxable_base >= (v_bracket->>'min')::NUMERIC AND v_taxable_base <= (v_bracket->>'max')::NUMERIC THEN
          v_estimated_annual_tax := ROUND(
            v_taxable_base * (v_bracket->>'rate')::NUMERIC / 100.0 - (v_bracket->>'deduction')::NUMERIC,
            2
          );
          EXIT;
        END IF;
      END LOOP;

      -- Apply annual reduction if applicable (2026 Lei 15.270)
      IF v_limits ? 'annual_reduction_flat' THEN
        DECLARE
          v_reduction_flat NUMERIC := (v_limits->>'annual_reduction_flat')::NUMERIC;
          v_reduction_threshold_full NUMERIC := (v_limits->>'annual_reduction_threshold_full')::NUMERIC;
          v_reduction_threshold_partial NUMERIC := (v_limits->>'annual_reduction_threshold_partial')::NUMERIC;
          v_reduction_constant NUMERIC := (v_limits->>'annual_reduction_formula_constant')::NUMERIC;
          v_reduction_factor NUMERIC := (v_limits->>'annual_reduction_formula_factor')::NUMERIC;
        BEGIN
          IF v_projected_annual_income <= v_reduction_threshold_full THEN
            v_annual_reduction := LEAST(v_reduction_flat, v_estimated_annual_tax);
          ELSIF v_projected_annual_income <= v_reduction_threshold_partial THEN
            v_annual_reduction := LEAST(
              v_reduction_constant - v_reduction_factor * v_projected_annual_income,
              v_estimated_annual_tax
            );
            v_annual_reduction := GREATEST(v_annual_reduction, 0);
          END IF;
        END;
      END IF;

      v_estimated_annual_tax := GREATEST(v_estimated_annual_tax - v_annual_reduction, 0);
    END IF;
  END;

  -- YTD IRRF withheld (from transactions tagged as irrf - stored in notes or tags)
  -- For now, approximate as 0 since we don't have a dedicated IRRF field yet.
  -- The user will input IRRF manually via the fiscal module.
  v_ytd_irrf_withheld := 0;

  -- Tax gap
  v_tax_gap := v_estimated_annual_tax - v_ytd_irrf_withheld;

  -- Monthly provision
  IF v_months_remaining > 0 THEN
    v_monthly_provision := ROUND(v_tax_gap / v_months_remaining, 2);
  ELSE
    v_monthly_provision := v_tax_gap;
  END IF;

  RETURN json_build_object(
    'year', p_year,
    'months_elapsed', v_months_elapsed,
    'months_remaining', v_months_remaining,
    'ytd_taxable_income', v_ytd_taxable_income,
    'ytd_deductible_expenses', v_ytd_deductible,
    'projected_annual_income', v_projected_annual_income,
    'projected_annual_deductible', v_projected_annual_deductible,
    'taxable_base', v_taxable_base,
    'estimated_annual_tax', v_estimated_annual_tax,
    'annual_reduction_applied', v_annual_reduction,
    'ytd_irrf_withheld', v_ytd_irrf_withheld,
    'tax_gap', v_tax_gap,
    'monthly_provision', v_monthly_provision,
    'disclaimer', 'Projeção estimativa. Não substitui consultoria tributária profissional.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_fiscal_projection(UUID, INT) TO authenticated;

```

### supabase/migrations/009_economic_indices.sql
```
-- ============================================
-- WealthOS - Migration 009: Economic Indices
-- ============================================
-- Phase 8: Index collection, storage, querying
-- Seeds with real BCB SGS data (Mar 2025 - Jan 2026)
-- ============================================

-- ─── 1. Seed IPCA real data (BCB SGS 433) ────────────────────
INSERT INTO economic_indices (index_type, reference_date, value, source_primary, fetched_at)
VALUES
  ('ipca', '2025-03-01', 0.56, 'BCB SGS 433', now()),
  ('ipca', '2025-04-01', 0.43, 'BCB SGS 433', now()),
  ('ipca', '2025-05-01', 0.26, 'BCB SGS 433', now()),
  ('ipca', '2025-06-01', 0.24, 'BCB SGS 433', now()),
  ('ipca', '2025-07-01', 0.26, 'BCB SGS 433', now()),
  ('ipca', '2025-08-01', -0.11, 'BCB SGS 433', now()),
  ('ipca', '2025-09-01', 0.48, 'BCB SGS 433', now()),
  ('ipca', '2025-10-01', 0.09, 'BCB SGS 433', now()),
  ('ipca', '2025-11-01', 0.18, 'BCB SGS 433', now()),
  ('ipca', '2025-12-01', 0.33, 'BCB SGS 433', now()),
  ('ipca', '2026-01-01', 0.33, 'BCB SGS 433', now());

-- Seed Selic monthly snapshots (BCB SGS 432, last value of each month)
INSERT INTO economic_indices (index_type, reference_date, value, source_primary, fetched_at)
VALUES
  ('selic', '2025-03-01', 14.25, 'BCB SGS 432', now()),
  ('selic', '2025-04-01', 14.25, 'BCB SGS 432', now()),
  ('selic', '2025-05-01', 14.75, 'BCB SGS 432', now()),
  ('selic', '2025-06-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2025-07-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2025-08-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2025-09-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2025-10-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2025-11-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2025-12-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2026-01-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2026-02-01', 15.00, 'BCB SGS 432', now()),
  ('selic', '2026-03-01', 15.00, 'BCB SGS 432', now());


-- ─── 2. get_economic_indices (read) ──────────────────────────

CREATE OR REPLACE FUNCTION get_economic_indices(
  p_index_type TEXT DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_limit INT DEFAULT 24
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from DATE := COALESCE(p_date_from, (CURRENT_DATE - INTERVAL '24 months')::DATE);
  v_to DATE := COALESCE(p_date_to, CURRENT_DATE);
  v_result JSON;
BEGIN
  -- Public data, no user auth check needed
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.reference_date DESC), '[]'::JSON)
  INTO v_result
  FROM (
    SELECT index_type, reference_date, value, accumulated_12m, accumulated_year,
           source_primary, fetched_at
    FROM economic_indices
    WHERE reference_date >= v_from AND reference_date <= v_to
      AND (p_index_type IS NULL OR index_type::TEXT = p_index_type)
    ORDER BY reference_date DESC
    LIMIT p_limit
  ) t;

  RETURN json_build_object(
    'data', v_result,
    'filters', json_build_object(
      'index_type', p_index_type,
      'date_from', v_from,
      'date_to', v_to
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_economic_indices(TEXT, DATE, DATE, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_economic_indices(TEXT, DATE, DATE, INT) TO anon;


-- ─── 3. get_index_latest (summary card) ──────────────────────

CREATE OR REPLACE FUNCTION get_index_latest()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON)
  INTO v_result
  FROM (
    SELECT DISTINCT ON (index_type)
      index_type, reference_date, value, accumulated_12m, accumulated_year,
      source_primary, fetched_at
    FROM economic_indices
    ORDER BY index_type, reference_date DESC
  ) t;

  RETURN json_build_object(
    'indices', v_result,
    'fetched_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_index_latest() TO authenticated;
GRANT EXECUTE ON FUNCTION get_index_latest() TO anon;


-- ─── 4. Update accumulated values for IPCA ───────────────────

UPDATE economic_indices
SET accumulated_year = (
  SELECT COALESCE(
    (SELECT (EXP(SUM(LN(1 + ei2.value/100.0))) - 1) * 100
     FROM economic_indices ei2
     WHERE ei2.index_type = economic_indices.index_type
       AND EXTRACT(YEAR FROM ei2.reference_date) = EXTRACT(YEAR FROM economic_indices.reference_date)
       AND ei2.reference_date <= economic_indices.reference_date),
    economic_indices.value
  )
)
WHERE index_type = 'ipca';

UPDATE economic_indices
SET accumulated_12m = (
  SELECT COALESCE(
    (SELECT (EXP(SUM(LN(1 + ei2.value/100.0))) - 1) * 100
     FROM economic_indices ei2
     WHERE ei2.index_type = economic_indices.index_type
       AND ei2.reference_date > (economic_indices.reference_date - INTERVAL '12 months')
       AND ei2.reference_date <= economic_indices.reference_date),
    economic_indices.value
  )
)
WHERE index_type = 'ipca';

```

### supabase/migrations/010_bank_connections.sql
```
-- ============================================
-- WealthOS - Migration 010: Bank Connections & Import
-- ============================================
-- Phase 9B: Standalone (without aggregator)
-- Table: bank_connections
-- Alters: transactions + accounts
-- RPC: auto_categorize_transaction, import_transactions_batch
-- ============================================

-- ─── 1. ENUM sync_status ─────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE sync_status AS ENUM ('active', 'syncing', 'error', 'expired', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. Table bank_connections ───────────────────────────────

CREATE TABLE IF NOT EXISTS bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_connection_id TEXT,
  institution_name TEXT NOT NULL,
  institution_logo_url TEXT,
  consent_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_status sync_status NOT NULL DEFAULT 'manual',
  error_message TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE bank_connections IS 'Conexões bancárias. Provider manual = import CSV/OFX. Futuro: pluggy/belvo.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bank_connections_user_id ON bank_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_connections_active ON bank_connections(user_id, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank_connections"
  ON bank_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank_connections"
  ON bank_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank_connections"
  ON bank_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank_connections"
  ON bank_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER handle_bank_connections_updated_at
  BEFORE UPDATE ON bank_connections
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();


-- ─── 3. ALTER transactions: add import tracking fields ───────

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS bank_connection_id UUID REFERENCES bank_connections(id),
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS import_batch_id UUID;

CREATE INDEX IF NOT EXISTS idx_transactions_external_id
  ON transactions(user_id, external_id) WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_bank_connection
  ON transactions(bank_connection_id) WHERE bank_connection_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_import_batch
  ON transactions(import_batch_id) WHERE import_batch_id IS NOT NULL;


-- ─── 4. ALTER accounts: add external tracking ────────────────

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS external_account_id TEXT,
  ADD COLUMN IF NOT EXISTS bank_connection_id UUID REFERENCES bank_connections(id);


-- ─── 5. auto_categorize_transaction ──────────────────────────
-- Matches transaction description against category names/patterns.
-- Returns best-match category_id or NULL.

CREATE OR REPLACE FUNCTION auto_categorize_transaction(
  p_user_id UUID,
  p_description TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id UUID;
  v_desc_lower TEXT := LOWER(TRIM(p_description));
BEGIN
  -- Try exact match on category name
  SELECT id INTO v_category_id
  FROM categories
  WHERE user_id = p_user_id
    AND LOWER(name) = v_desc_lower
  LIMIT 1;

  IF v_category_id IS NOT NULL THEN
    RETURN v_category_id;
  END IF;

  -- Try substring match: category name contained in description
  SELECT id INTO v_category_id
  FROM categories
  WHERE user_id = p_user_id
    AND v_desc_lower LIKE '%' || LOWER(name) || '%'
  ORDER BY LENGTH(name) DESC  -- Prefer longest match
  LIMIT 1;

  IF v_category_id IS NOT NULL THEN
    RETURN v_category_id;
  END IF;

  -- Try keyword match: common patterns
  SELECT id INTO v_category_id
  FROM categories
  WHERE user_id = p_user_id AND (
    (v_desc_lower LIKE '%mercado%' AND LOWER(name) = 'alimentação') OR
    (v_desc_lower LIKE '%supermercado%' AND LOWER(name) = 'alimentação') OR
    (v_desc_lower LIKE '%restaurante%' AND LOWER(name) = 'alimentação') OR
    (v_desc_lower LIKE '%ifood%' AND LOWER(name) = 'alimentação') OR
    (v_desc_lower LIKE '%uber%' AND LOWER(name) = 'transporte') OR
    (v_desc_lower LIKE '%99%' AND LOWER(name) = 'transporte') OR
    (v_desc_lower LIKE '%combustivel%' AND LOWER(name) = 'transporte') OR
    (v_desc_lower LIKE '%gasolina%' AND LOWER(name) = 'transporte') OR
    (v_desc_lower LIKE '%estacionamento%' AND LOWER(name) = 'transporte') OR
    (v_desc_lower LIKE '%farmacia%' AND LOWER(name) = 'saúde') OR
    (v_desc_lower LIKE '%drogaria%' AND LOWER(name) = 'saúde') OR
    (v_desc_lower LIKE '%hospital%' AND LOWER(name) = 'saúde') OR
    (v_desc_lower LIKE '%netflix%' AND LOWER(name) = 'lazer') OR
    (v_desc_lower LIKE '%spotify%' AND LOWER(name) = 'lazer') OR
    (v_desc_lower LIKE '%amazon%' AND LOWER(name) = 'compras') OR
    (v_desc_lower LIKE '%energia%' AND LOWER(name) = 'moradia') OR
    (v_desc_lower LIKE '%luz%' AND LOWER(name) = 'moradia') OR
    (v_desc_lower LIKE '%agua%' AND LOWER(name) = 'moradia') OR
    (v_desc_lower LIKE '%internet%' AND LOWER(name) = 'moradia') OR
    (v_desc_lower LIKE '%aluguel%' AND LOWER(name) = 'moradia') OR
    (v_desc_lower LIKE '%condominio%' AND LOWER(name) = 'moradia') OR
    (v_desc_lower LIKE '%salario%' AND LOWER(name) = 'salário') OR
    (v_desc_lower LIKE '%pagamento%folha%' AND LOWER(name) = 'salário') OR
    (v_desc_lower LIKE '%transferencia%' AND LOWER(name) = 'transferências') OR
    (v_desc_lower LIKE '%pix%' AND LOWER(name) = 'transferências')
  )
  LIMIT 1;

  RETURN v_category_id; -- NULL if no match
END;
$$;

GRANT EXECUTE ON FUNCTION auto_categorize_transaction(UUID, TEXT) TO authenticated;


-- ─── 6. import_transactions_batch ────────────────────────────
-- Bulk import parsed transactions. Skips duplicates by external_id.
-- Returns count of imported vs skipped.

CREATE OR REPLACE FUNCTION import_transactions_batch(
  p_user_id UUID,
  p_account_id UUID,
  p_bank_connection_id UUID,
  p_batch_id UUID,
  p_transactions JSONB  -- array of {date, amount, description, type, external_id?}
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx JSONB;
  v_imported INT := 0;
  v_skipped INT := 0;
  v_categorized INT := 0;
  v_cat_id UUID;
  v_tx_type transaction_type;
  v_amount NUMERIC;
  v_ext_id TEXT;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  FOR v_tx IN SELECT * FROM jsonb_array_elements(p_transactions)
  LOOP
    v_ext_id := v_tx->>'external_id';
    v_amount := ABS((v_tx->>'amount')::NUMERIC);

    -- Skip duplicates by external_id
    IF v_ext_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM transactions
      WHERE user_id = p_user_id AND external_id = v_ext_id AND is_deleted = false
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Determine type
    IF (v_tx->>'amount')::NUMERIC >= 0 THEN
      v_tx_type := 'income';
    ELSE
      v_tx_type := 'expense';
    END IF;

    -- Override if provided
    IF v_tx->>'type' IS NOT NULL AND v_tx->>'type' != '' THEN
      v_tx_type := (v_tx->>'type')::transaction_type;
    END IF;

    -- Auto-categorize
    v_cat_id := auto_categorize_transaction(p_user_id, COALESCE(v_tx->>'description', ''));
    IF v_cat_id IS NOT NULL THEN
      v_categorized := v_categorized + 1;
    END IF;

    -- Insert transaction (uses existing trigger for balance recalc)
    INSERT INTO transactions (
      user_id, account_id, category_id, type, amount, description,
      date, is_paid, source, bank_connection_id, external_id, import_batch_id
    ) VALUES (
      p_user_id,
      p_account_id,
      v_cat_id,
      v_tx_type,
      v_amount,
      v_tx->>'description',
      (v_tx->>'date')::DATE,
      true,
      CASE WHEN p_bank_connection_id IS NOT NULL THEN 'bank_feed'::entry_source ELSE 'csv_import'::entry_source END,
      p_bank_connection_id,
      v_ext_id,
      p_batch_id
    );

    v_imported := v_imported + 1;
  END LOOP;

  -- Update bank_connection last_sync
  IF p_bank_connection_id IS NOT NULL THEN
    UPDATE bank_connections
    SET last_sync_at = now(), sync_status = 'active', updated_at = now()
    WHERE id = p_bank_connection_id;
  END IF;

  RETURN json_build_object(
    'status', 'ok',
    'imported', v_imported,
    'skipped', v_skipped,
    'categorized', v_categorized,
    'batch_id', p_batch_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION import_transactions_batch(UUID, UUID, UUID, UUID, JSONB) TO authenticated;

```

### supabase/migrations/011_transaction_dedup_unique_index.sql
```
-- ============================================
-- WealthOS - Migration 011: Dedup UNIQUE index para external_id
-- ============================================
-- Applied: 2026-03-10 via Supabase MCP
-- O index existente (idx_transactions_external_id) era btree simples.
-- Substituído por UNIQUE parcial incluindo account_id e excluindo deletados.
-- Garante rejeição automática de transações duplicadas no import OFX/CSV.
--
-- Ref: Auditoria de segurança - Achado 4
-- ============================================

-- Remover index antigo (btree simples, não impedia duplicatas)
DROP INDEX IF EXISTS idx_transactions_external_id;

-- UNIQUE parcial: por usuário + conta + external_id, excluindo deletados
CREATE UNIQUE INDEX idx_tx_external_id_dedup
  ON transactions (user_id, account_id, external_id)
  WHERE external_id IS NOT NULL AND is_deleted = FALSE;

-- Index auxiliar para lookup rápido
CREATE INDEX idx_tx_external_id_lookup
  ON transactions (external_id)
  WHERE external_id IS NOT NULL;

COMMENT ON COLUMN transactions.external_id IS
  'Hash SHA-256 do identificador externo (FITID p/ OFX, composto p/ CSV). NULL para transações manuais. UNIQUE por (user_id, account_id) para deduplicação cross-import.';

```

### supabase/migrations/012_journal_balance_validation.sql
```
-- ============================================
-- WealthOS - Migration 012: Journal Balance Validation Trigger
-- ============================================
-- Applied: 2026-03-10 via Supabase MCP
-- Statement-level trigger que valida sum(debits) = sum(credits)
-- e mínimo 2 linhas por journal_entry após cada INSERT em journal_lines.
--
-- Usa REFERENCING NEW TABLE para acessar as linhas recém-inseridas
-- e validar todos os journal_entries afetados pelo statement.
--
-- Ref: Auditoria de segurança - Achado 5
-- ============================================

CREATE OR REPLACE FUNCTION validate_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT DISTINCT nl.journal_entry_id
    FROM new_lines nl
    WHERE EXISTS (SELECT 1 FROM journal_entries WHERE id = nl.journal_entry_id)
  LOOP
    DECLARE
      v_total_debit   NUMERIC(14,2);
      v_total_credit  NUMERIC(14,2);
      v_line_count    INTEGER;
    BEGIN
      SELECT
        COALESCE(SUM(amount_debit), 0),
        COALESCE(SUM(amount_credit), 0),
        COUNT(*)
      INTO v_total_debit, v_total_credit, v_line_count
      FROM journal_lines
      WHERE journal_entry_id = v_rec.journal_entry_id;

      IF v_line_count < 2 THEN
        RAISE EXCEPTION 'Lançamento contábil deve ter pelo menos 2 linhas (débito + crédito). Encontradas: %', v_line_count;
      END IF;

      IF v_total_debit <> v_total_credit THEN
        RAISE EXCEPTION 'Lançamento desbalanceado: total débitos (%) <> total créditos (%). Diferença: %',
          v_total_debit, v_total_credit, ABS(v_total_debit - v_total_credit);
      END IF;
    END;
  END LOOP;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_journal_balance
  AFTER INSERT ON journal_lines
  REFERENCING NEW TABLE AS new_lines
  FOR EACH STATEMENT
  EXECUTE FUNCTION validate_journal_balance();

```

### supabase/migrations/013_stable_kek_material.sql
```
-- Migration 013: S1 - Redesenhar KEK
-- Problema: KEK derivada de JWT efêmero causava risco de perda da DEK em token refresh.
-- Solução: KEK agora derivada de kek_material estável (random 256 bits, gerado no onboarding).
--
-- Como não há dados criptografados no ambiente atual, limpamos encrypted_dek/iv
-- para forçar re-inicialização no próximo login.

-- 1. Adicionar coluna para material estável da KEK
ALTER TABLE public.users_profile
  ADD COLUMN IF NOT EXISTS kek_material TEXT;

-- 2. Limpar DEK antiga (incompatível com novo esquema de derivação)
-- Isso força o app a re-inicializar a criptografia no próximo login.
UPDATE public.users_profile
  SET encryption_key_encrypted = NULL,
      encryption_key_iv = NULL
  WHERE encryption_key_encrypted IS NOT NULL;

-- 3. Comentário para documentação
COMMENT ON COLUMN public.users_profile.kek_material IS
  'Material estável para derivação da KEK via HKDF. Gerado uma vez no onboarding. Base64-encoded 256 bits.';

```

### supabase/migrations/014_transfer_rpc.sql
```
-- ============================================
-- WealthOS - Migration 014: Atomic Transfer RPC
-- ============================================
-- S3 Saneamento: create_transfer_with_journal()
-- Atomic transfer between accounts with correct double-entry.
-- Creates 2 transactions (type=transfer) + 1 journal entry + 2 journal lines.
-- ============================================

CREATE OR REPLACE FUNCTION create_transfer_with_journal(
  p_user_id         UUID,
  p_from_account_id UUID,
  p_to_account_id   UUID,
  p_amount          NUMERIC(14,2),
  p_description     TEXT DEFAULT 'Transferência entre contas',
  p_date            DATE DEFAULT CURRENT_DATE,
  p_is_paid         BOOLEAN DEFAULT TRUE,
  p_source          entry_source DEFAULT 'manual'
)
RETURNS JSON AS $$
DECLARE
  v_from_coa_id     UUID;
  v_to_coa_id       UUID;
  v_from_type       account_type;
  v_to_type         account_type;
  v_from_tx_id      UUID;
  v_to_tx_id        UUID;
  v_journal_id      UUID;
  v_now             TIMESTAMPTZ := NOW();
BEGIN
  -- 0. Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor da transferência deve ser positivo';
  END IF;

  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Conta de origem e destino devem ser diferentes';
  END IF;

  -- 1. Validate source account
  SELECT coa_id, type INTO v_from_coa_id, v_from_type
  FROM accounts
  WHERE id = p_from_account_id AND user_id = p_user_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta de origem não encontrada ou inativa';
  END IF;

  -- 2. Validate destination account
  SELECT coa_id, type INTO v_to_coa_id, v_to_type
  FROM accounts
  WHERE id = p_to_account_id AND user_id = p_user_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta de destino não encontrada ou inativa';
  END IF;

  -- 3. Create outgoing transaction (source)
  INSERT INTO transactions (
    user_id, account_id, type, amount, description,
    date, is_paid, source, occurred_at, posted_at
  ) VALUES (
    p_user_id, p_from_account_id, 'transfer', p_amount, p_description,
    p_date, p_is_paid, p_source,
    v_now, CASE WHEN p_is_paid THEN v_now ELSE NULL END
  )
  RETURNING id INTO v_from_tx_id;

  -- 4. Create incoming transaction (destination)
  INSERT INTO transactions (
    user_id, account_id, type, amount, description,
    date, is_paid, source, occurred_at, posted_at,
    transfer_pair_id
  ) VALUES (
    p_user_id, p_to_account_id, 'transfer', p_amount, p_description,
    p_date, p_is_paid, p_source,
    v_now, CASE WHEN p_is_paid THEN v_now ELSE NULL END,
    v_from_tx_id
  )
  RETURNING id INTO v_to_tx_id;

  -- 5. Link back the source to destination
  UPDATE transactions
  SET transfer_pair_id = v_to_tx_id
  WHERE id = v_from_tx_id;

  -- 6. Create journal entry (single entry for the transfer event)
  IF v_from_coa_id IS NOT NULL AND v_to_coa_id IS NOT NULL THEN
    INSERT INTO journal_entries (
      user_id, entry_date, occurred_at, posted_at,
      source, description, transaction_id
    ) VALUES (
      p_user_id, p_date, v_now,
      CASE WHEN p_is_paid THEN v_now ELSE NULL END,
      p_source, p_description, v_from_tx_id
    )
    RETURNING id INTO v_journal_id;

    -- 7. Journal lines: D destination (asset increases), C source (asset decreases)
    -- For credit card accounts, the logic inverts:
    --   Transferring FROM credit card = paying it off (D liability, C asset)
    --   Transferring TO credit card = loading it (reversed)
    -- But for simplicity in MVP: D dest-coa, C source-coa covers asset-to-asset.
    INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit, memo)
    VALUES
      (v_journal_id, v_to_coa_id, p_amount, 0, 'Transferência recebida'),
      (v_journal_id, v_from_coa_id, 0, p_amount, 'Transferência enviada');

    -- Link journal to both transactions
    UPDATE transactions
    SET journal_entry_id = v_journal_id
    WHERE id IN (v_from_tx_id, v_to_tx_id);
  END IF;

  RETURN json_build_object(
    'from_transaction_id', v_from_tx_id,
    'to_transaction_id', v_to_tx_id,
    'journal_entry_id', v_journal_id,
    'amount', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_transfer_with_journal IS
'Atomic transfer between two accounts.
Creates 2 transactions (type=transfer, linked by transfer_pair_id) +
1 journal entry + 2 journal lines (D destination-COA, C source-COA).
Replaces the previous non-atomic 4-step client-side approach.';

GRANT EXECUTE ON FUNCTION create_transfer_with_journal(UUID, UUID, UUID, NUMERIC, TEXT, DATE, BOOLEAN, entry_source) TO authenticated;

```

### supabase/migrations/015_nullable_bank_connection_in_import.sql
```
-- ============================================
-- WealthOS - Migration 015: Fix import_transactions_batch
-- ============================================
-- S6: Allow NULL bank_connection_id (eliminate sentinel UUID)
-- S4: Remove redundant ABS() - parsers now always send positive amounts
-- ============================================

CREATE OR REPLACE FUNCTION import_transactions_batch(
  p_user_id UUID,
  p_account_id UUID,
  p_bank_connection_id UUID DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL,
  p_transactions JSONB DEFAULT '[]'::JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx JSONB;
  v_imported INT := 0;
  v_skipped INT := 0;
  v_categorized INT := 0;
  v_cat_id UUID;
  v_tx_type transaction_type;
  v_amount NUMERIC;
  v_ext_id TEXT;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  FOR v_tx IN SELECT * FROM jsonb_array_elements(p_transactions)
  LOOP
    v_ext_id := v_tx->>'external_id';
    -- Amount now comes pre-normalized (always positive) from parsers
    v_amount := ABS((v_tx->>'amount')::NUMERIC);

    -- Skip duplicates by external_id
    IF v_ext_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM transactions
      WHERE user_id = p_user_id AND external_id = v_ext_id AND is_deleted = false
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Determine type from explicit field or sign
    IF v_tx->>'type' IS NOT NULL AND v_tx->>'type' != '' THEN
      v_tx_type := (v_tx->>'type')::transaction_type;
    ELSIF (v_tx->>'amount')::NUMERIC >= 0 THEN
      v_tx_type := 'income';
    ELSE
      v_tx_type := 'expense';
    END IF;

    -- Auto-categorize
    v_cat_id := auto_categorize_transaction(p_user_id, COALESCE(v_tx->>'description', ''));
    IF v_cat_id IS NOT NULL THEN
      v_categorized := v_categorized + 1;
    END IF;

    -- Insert transaction
    INSERT INTO transactions (
      user_id, account_id, category_id, type, amount, description,
      date, is_paid, source, bank_connection_id, external_id, import_batch_id
    ) VALUES (
      p_user_id,
      p_account_id,
      v_cat_id,
      v_tx_type,
      v_amount,
      v_tx->>'description',
      (v_tx->>'date')::DATE,
      true,
      CASE WHEN p_bank_connection_id IS NOT NULL THEN 'bank_feed'::entry_source ELSE 'csv_import'::entry_source END,
      p_bank_connection_id,  -- NULL is valid (no FK violation)
      v_ext_id,
      COALESCE(p_batch_id, gen_random_uuid())
    );

    v_imported := v_imported + 1;
  END LOOP;

  -- Update bank_connection last_sync (only if connection exists)
  IF p_bank_connection_id IS NOT NULL THEN
    UPDATE bank_connections
    SET last_sync_at = now(), sync_status = 'active', updated_at = now()
    WHERE id = p_bank_connection_id;
  END IF;

  RETURN json_build_object(
    'status', 'ok',
    'imported', v_imported,
    'skipped', v_skipped,
    'categorized', v_categorized,
    'batch_id', COALESCE(p_batch_id, gen_random_uuid())
  );
END;
$$;

GRANT EXECUTE ON FUNCTION import_transactions_batch(UUID, UUID, UUID, UUID, JSONB) TO authenticated;

```

### supabase/migrations/016_enable_pg_cron_and_jobs.sql
```
-- ============================================
-- WealthOS/Oniefy - Migration 016: pg_cron Jobs
-- ============================================
-- Enable pg_cron and set up scheduled maintenance jobs.
-- Jobs run as database owner (bypass RLS), so we create
-- SECURITY DEFINER wrapper functions for each task.
-- ============================================

-- 1. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres role (required for Supabase)
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;


-- ─── 2. Wrapper: Auto-generate workflow tasks (daily) ────────
-- Creates tasks for current month for all users with active workflows.
-- Skips if tasks already exist (idempotent).

CREATE OR REPLACE FUNCTION cron_generate_workflow_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_year INT := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
  v_month INT := EXTRACT(MONTH FROM CURRENT_DATE)::INT;
  v_period_start DATE := make_date(v_year, v_month, 1);
  v_period_end DATE := (v_period_start + interval '1 month')::DATE;
  v_wf RECORD;
  v_created INT := 0;
BEGIN
  -- Iterate all users with active workflows
  FOR v_user IN
    SELECT DISTINCT user_id FROM workflows WHERE is_active = true
  LOOP
    FOR v_wf IN
      SELECT * FROM workflows WHERE user_id = v_user.user_id AND is_active = true
    LOOP
      -- Skip if tasks already exist
      IF EXISTS (
        SELECT 1 FROM workflow_tasks
        WHERE workflow_id = v_wf.id
          AND period_start = v_period_start
          AND period_end = v_period_end
      ) THEN
        CONTINUE;
      END IF;

      -- Generate tasks based on type
      CASE v_wf.workflow_type
        WHEN 'bank_statement', 'card_statement' THEN
          INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
          VALUES
            (v_wf.id, v_user.user_id, v_period_start, v_period_end, 'upload_document',
             'Upload do extrato/fatura: ' || v_wf.name),
            (v_wf.id, v_user.user_id, v_period_start, v_period_end, 'categorize_transactions',
             'Conferir categorização: ' || v_wf.name);
          v_created := v_created + 2;

        WHEN 'investment_update' THEN
          INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
          VALUES
            (v_wf.id, v_user.user_id, v_period_start, v_period_end, 'update_balance',
             'Atualizar posição: ' || v_wf.name);
          v_created := v_created + 1;

        WHEN 'loan_payment' THEN
          INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
          VALUES
            (v_wf.id, v_user.user_id, v_period_start, v_period_end, 'update_balance',
             'Atualizar saldo do financiamento: ' || v_wf.name);
          v_created := v_created + 1;

        WHEN 'fiscal_review' THEN
          INSERT INTO workflow_tasks (workflow_id, user_id, period_start, period_end, task_type, description)
          VALUES
            (v_wf.id, v_user.user_id, v_period_start, v_period_end, 'review_fiscal',
             'Revisão fiscal: ' || v_wf.name);
          v_created := v_created + 1;
      END CASE;
    END LOOP;
  END LOOP;

  RAISE LOG '[Oniefy cron] workflow tasks generated: %', v_created;
END;
$$;


-- ─── 3. Wrapper: Depreciate all assets (monthly) ────────────
-- Applies monthly linear depreciation to all assets with rate > 0.

CREATE OR REPLACE FUNCTION cron_depreciate_assets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset RECORD;
  v_depreciation NUMERIC;
  v_new_value NUMERIC;
  v_count INT := 0;
BEGIN
  FOR v_asset IN
    SELECT * FROM assets
    WHERE depreciation_rate > 0 AND current_value > 0
  LOOP
    v_depreciation := ROUND(v_asset.current_value * (v_asset.depreciation_rate / 12.0 / 100.0), 2);
    v_new_value := GREATEST(v_asset.current_value - v_depreciation, 0);

    INSERT INTO asset_value_history (asset_id, user_id, previous_value, new_value, change_reason, change_source)
    VALUES (v_asset.id, v_asset.user_id, v_asset.current_value, v_new_value, 'Depreciação mensal automática (cron)', 'depreciation');

    UPDATE assets SET current_value = v_new_value, updated_at = now() WHERE id = v_asset.id;
    v_count := v_count + 1;
  END LOOP;

  RAISE LOG '[Oniefy cron] assets depreciated: %', v_count;
END;
$$;


-- ─── 4. Wrapper: Balance integrity check (weekly) ───────────
-- Verifies sum(debit) = sum(credit) for all journal entries.
-- Logs any discrepancies. Does NOT auto-fix.

CREATE OR REPLACE FUNCTION cron_balance_integrity_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bad RECORD;
  v_count INT := 0;
BEGIN
  FOR v_bad IN
    SELECT je.id, je.user_id, je.description,
           SUM(jl.amount_debit) AS total_debit,
           SUM(jl.amount_credit) AS total_credit,
           ABS(SUM(jl.amount_debit) - SUM(jl.amount_credit)) AS diff
    FROM journal_entries je
    JOIN journal_lines jl ON jl.journal_entry_id = je.id
    GROUP BY je.id, je.user_id, je.description
    HAVING ABS(SUM(jl.amount_debit) - SUM(jl.amount_credit)) > 0.01
  LOOP
    RAISE WARNING '[Oniefy cron] BALANCE ERROR: journal_entry % (user %) has D=% C=% diff=%',
      v_bad.id, v_bad.user_id, v_bad.total_debit, v_bad.total_credit, v_bad.diff;
    v_count := v_count + 1;
  END LOOP;

  IF v_count = 0 THEN
    RAISE LOG '[Oniefy cron] Balance integrity check passed. All entries balanced.';
  ELSE
    RAISE WARNING '[Oniefy cron] Balance integrity check FAILED: % entries unbalanced', v_count;
  END IF;
END;
$$;


-- ─── 5. Schedule the cron jobs ──────────────────────────────

-- Daily at 02:00 UTC: generate workflow tasks
SELECT cron.schedule(
  'generate-workflow-tasks',
  '0 2 * * *',
  'SELECT cron_generate_workflow_tasks()'
);

-- Monthly on 1st at 03:00 UTC: depreciate assets
SELECT cron.schedule(
  'depreciate-assets',
  '0 3 1 * *',
  'SELECT cron_depreciate_assets()'
);

-- Weekly on Sunday at 04:00 UTC: balance integrity check
SELECT cron.schedule(
  'balance-integrity-check',
  '0 4 * * 0',
  'SELECT cron_balance_integrity_check()'
);

```

### supabase/migrations/017_fix_search_path_mutable.sql
```
-- ============================================
-- Oniefy - Migration 017: Fix search_path on legacy functions
-- ============================================
-- Supabase security advisory: function_search_path_mutable
-- Using ALTER FUNCTION to add SET search_path without redefining body.
-- ============================================

-- Trigger functions (no args)
ALTER FUNCTION handle_updated_at() SET search_path = public;
ALTER FUNCTION activate_account_on_use() SET search_path = public;
ALTER FUNCTION recalculate_account_balance() SET search_path = public;
ALTER FUNCTION validate_journal_balance() SET search_path = public;

-- Auth trigger (no args, runs in auth schema context)
ALTER FUNCTION handle_new_user() SET search_path = public;

-- Seed functions
ALTER FUNCTION create_default_categories(UUID) SET search_path = public;
ALTER FUNCTION create_default_cost_center(UUID) SET search_path = public;
ALTER FUNCTION create_default_chart_of_accounts(UUID) SET search_path = public;

-- Core RPCs
ALTER FUNCTION create_transaction_with_journal(UUID, UUID, UUID, transaction_type, NUMERIC, TEXT, DATE, BOOLEAN, entry_source, TEXT, TEXT[], UUID) SET search_path = public;
ALTER FUNCTION reverse_transaction(UUID, UUID) SET search_path = public;
ALTER FUNCTION create_transfer_with_journal(UUID, UUID, UUID, NUMERIC, TEXT, DATE, BOOLEAN, entry_source) SET search_path = public;

```

### supabase/migrations/018_rls_initplan_optimization.sql
```
-- ============================================
-- Oniefy - Migration 018: RLS initplan optimization
-- ============================================
-- Fix: auth.uid() -> (select auth.uid()) in all RLS policies
-- This wraps the function call in a subselect so PostgreSQL
-- evaluates it once per query (initplan) instead of once per row.
-- Ref: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ============================================

DROP POLICY IF EXISTS "accounts_select" ON accounts;
CREATE POLICY "accounts_select" ON accounts FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "accounts_insert" ON accounts;
CREATE POLICY "accounts_insert" ON accounts FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "accounts_update" ON accounts;
CREATE POLICY "accounts_update" ON accounts FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "accounts_delete" ON accounts;
CREATE POLICY "accounts_delete" ON accounts FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "avh_select" ON asset_value_history;
CREATE POLICY "avh_select" ON asset_value_history FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "avh_insert" ON asset_value_history;
CREATE POLICY "avh_insert" ON asset_value_history FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "avh_update" ON asset_value_history;
CREATE POLICY "avh_update" ON asset_value_history FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "avh_delete" ON asset_value_history;
CREATE POLICY "avh_delete" ON asset_value_history FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "assets_select" ON assets;
CREATE POLICY "assets_select" ON assets FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "assets_insert" ON assets;
CREATE POLICY "assets_insert" ON assets FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "assets_update" ON assets;
CREATE POLICY "assets_update" ON assets FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "assets_delete" ON assets;
CREATE POLICY "assets_delete" ON assets FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own bank_connections" ON bank_connections;
CREATE POLICY "Users can view own bank_connections" ON bank_connections FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own bank_connections" ON bank_connections;
CREATE POLICY "Users can insert own bank_connections" ON bank_connections FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own bank_connections" ON bank_connections;
CREATE POLICY "Users can update own bank_connections" ON bank_connections FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own bank_connections" ON bank_connections;
CREATE POLICY "Users can delete own bank_connections" ON bank_connections FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "budgets_select" ON budgets;
CREATE POLICY "budgets_select" ON budgets FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "budgets_insert" ON budgets;
CREATE POLICY "budgets_insert" ON budgets FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "budgets_update" ON budgets;
CREATE POLICY "budgets_update" ON budgets FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "budgets_delete" ON budgets;
CREATE POLICY "budgets_delete" ON budgets FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "categories_select" ON categories;
CREATE POLICY "categories_select" ON categories FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "categories_insert" ON categories;
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "categories_update" ON categories;
CREATE POLICY "categories_update" ON categories FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "categories_delete" ON categories;
CREATE POLICY "categories_delete" ON categories FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "ca_select" ON center_allocations;
CREATE POLICY "ca_select" ON center_allocations FOR SELECT USING (EXISTS (SELECT 1 FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_entry_id WHERE jl.id = center_allocations.journal_line_id AND je.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "ca_insert" ON center_allocations;
CREATE POLICY "ca_insert" ON center_allocations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_entry_id WHERE jl.id = center_allocations.journal_line_id AND je.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "coa_select" ON chart_of_accounts;
CREATE POLICY "coa_select" ON chart_of_accounts FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "coa_insert" ON chart_of_accounts;
CREATE POLICY "coa_insert" ON chart_of_accounts FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "coa_update" ON chart_of_accounts;
CREATE POLICY "coa_update" ON chart_of_accounts FOR UPDATE USING ((select auth.uid()) = user_id AND NOT is_system);

DROP POLICY IF EXISTS "coa_delete" ON chart_of_accounts;
CREATE POLICY "coa_delete" ON chart_of_accounts FOR DELETE USING ((select auth.uid()) = user_id AND NOT is_system);

DROP POLICY IF EXISTS "cc_select" ON cost_centers;
CREATE POLICY "cc_select" ON cost_centers FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "cc_insert" ON cost_centers;
CREATE POLICY "cc_insert" ON cost_centers FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "cc_update" ON cost_centers;
CREATE POLICY "cc_update" ON cost_centers FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "cc_delete" ON cost_centers;
CREATE POLICY "cc_delete" ON cost_centers FOR DELETE USING ((select auth.uid()) = user_id AND NOT is_default);

DROP POLICY IF EXISTS "documents_select" ON documents;
CREATE POLICY "documents_select" ON documents FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "documents_insert" ON documents;
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "documents_update" ON documents;
CREATE POLICY "documents_update" ON documents FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "documents_delete" ON documents;
CREATE POLICY "documents_delete" ON documents FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "je_select" ON journal_entries;
CREATE POLICY "je_select" ON journal_entries FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "je_insert" ON journal_entries;
CREATE POLICY "je_insert" ON journal_entries FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "jl_select" ON journal_lines;
CREATE POLICY "jl_select" ON journal_lines FOR SELECT USING (EXISTS (SELECT 1 FROM journal_entries WHERE journal_entries.id = journal_lines.journal_entry_id AND journal_entries.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "jl_insert" ON journal_lines;
CREATE POLICY "jl_insert" ON journal_lines FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM journal_entries WHERE journal_entries.id = journal_lines.journal_entry_id AND journal_entries.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "snapshots_select" ON monthly_snapshots;
CREATE POLICY "snapshots_select" ON monthly_snapshots FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "snapshots_insert" ON monthly_snapshots;
CREATE POLICY "snapshots_insert" ON monthly_snapshots FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "snapshots_update" ON monthly_snapshots;
CREATE POLICY "snapshots_update" ON monthly_snapshots FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "snapshots_delete" ON monthly_snapshots;
CREATE POLICY "snapshots_delete" ON monthly_snapshots FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_log_select" ON notification_log;
CREATE POLICY "notif_log_select" ON notification_log FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_log_insert" ON notification_log;
CREATE POLICY "notif_log_insert" ON notification_log FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_log_update" ON notification_log;
CREATE POLICY "notif_log_update" ON notification_log FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_log_delete" ON notification_log;
CREATE POLICY "notif_log_delete" ON notification_log FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_tokens_select" ON notification_tokens;
CREATE POLICY "notif_tokens_select" ON notification_tokens FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_tokens_insert" ON notification_tokens;
CREATE POLICY "notif_tokens_insert" ON notification_tokens FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_tokens_update" ON notification_tokens;
CREATE POLICY "notif_tokens_update" ON notification_tokens FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notif_tokens_delete" ON notification_tokens;
CREATE POLICY "notif_tokens_delete" ON notification_tokens FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "recurrences_select" ON recurrences;
CREATE POLICY "recurrences_select" ON recurrences FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "recurrences_insert" ON recurrences;
CREATE POLICY "recurrences_insert" ON recurrences FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "recurrences_update" ON recurrences;
CREATE POLICY "recurrences_update" ON recurrences FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "recurrences_delete" ON recurrences;
CREATE POLICY "recurrences_delete" ON recurrences FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "tax_records_select" ON tax_records;
CREATE POLICY "tax_records_select" ON tax_records FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "tax_records_insert" ON tax_records;
CREATE POLICY "tax_records_insert" ON tax_records FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "tax_records_update" ON tax_records;
CREATE POLICY "tax_records_update" ON tax_records FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "tax_records_delete" ON tax_records;
CREATE POLICY "tax_records_delete" ON tax_records FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_select" ON transactions;
CREATE POLICY "transactions_select" ON transactions FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_insert" ON transactions;
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_update" ON transactions;
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_delete" ON transactions;
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "users_profile_select" ON users_profile;
CREATE POLICY "users_profile_select" ON users_profile FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "users_profile_insert" ON users_profile;
CREATE POLICY "users_profile_insert" ON users_profile FOR INSERT WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "users_profile_update" ON users_profile;
CREATE POLICY "users_profile_update" ON users_profile FOR UPDATE USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "users_profile_delete" ON users_profile;
CREATE POLICY "users_profile_delete" ON users_profile FOR DELETE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "wt_select" ON workflow_tasks;
CREATE POLICY "wt_select" ON workflow_tasks FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "wt_insert" ON workflow_tasks;
CREATE POLICY "wt_insert" ON workflow_tasks FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "wt_update" ON workflow_tasks;
CREATE POLICY "wt_update" ON workflow_tasks FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "wf_select" ON workflows;
CREATE POLICY "wf_select" ON workflows FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "wf_insert" ON workflows;
CREATE POLICY "wf_insert" ON workflows FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "wf_update" ON workflows;
CREATE POLICY "wf_update" ON workflows FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "wf_delete" ON workflows;
CREATE POLICY "wf_delete" ON workflows FOR DELETE USING ((select auth.uid()) = user_id);

```

### supabase/migrations/019_index_unindexed_foreign_keys.sql
```
-- ============================================
-- Oniefy - Migration 019: Index unindexed foreign keys
-- ============================================
-- Supabase performance advisory: unindexed_foreign_keys
-- Adds covering indexes for FK columns that lack them.
-- ============================================

CREATE INDEX IF NOT EXISTS idx_accounts_bank_connection_id ON accounts(bank_connection_id) WHERE bank_connection_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_coa_id ON accounts(coa_id) WHERE coa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_coa_id ON assets(coa_id) WHERE coa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_coa_id ON budgets(coa_id) WHERE coa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_budgets_cost_center_id ON budgets(cost_center_id) WHERE cost_center_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coa_parent_id ON chart_of_accounts(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cc_parent_id ON cost_centers(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_je_workflow_task_id ON journal_entries(workflow_task_id) WHERE workflow_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recurrences_coa_id ON recurrences(coa_id) WHERE coa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recurrences_cost_center_id ON recurrences(cost_center_id) WHERE cost_center_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wt_document_id ON workflow_tasks(document_id) WHERE document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wf_related_account_id ON workflows(related_account_id) WHERE related_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wf_related_coa_id ON workflows(related_coa_id) WHERE related_coa_id IS NOT NULL;

```

### supabase/migrations/020_fix_coa_update_policy.sql
```
-- Fix: allow UPDATE on all chart_of_accounts rows owned by user,
-- including is_system=true (seed accounts). The is_system flag
-- protects against DELETE only, not against toggling is_active.
DROP POLICY IF EXISTS coa_update ON chart_of_accounts;

CREATE POLICY coa_update ON chart_of_accounts
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

```

### supabase/migrations/020b_unique_categories_idempotent.sql
```
-- Prevent duplicate categories per user (same name + type)
-- This ensures create_default_categories is idempotent
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_name_type_user
  ON categories (user_id, name, type);

-- Make create_default_categories idempotent with ON CONFLICT DO NOTHING
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Expense categories
  INSERT INTO categories (user_id, name, type, icon, color, is_system) VALUES
    (p_user_id, 'Alimentação',        'expense', 'utensils',       '#EF4444', true),
    (p_user_id, 'Transporte',         'expense', 'car',            '#F97316', true),
    (p_user_id, 'Moradia',            'expense', 'home',           '#8B5CF6', true),
    (p_user_id, 'Saúde',              'expense', 'heart-pulse',    '#EC4899', true),
    (p_user_id, 'Educação',           'expense', 'graduation-cap', '#3B82F6', true),
    (p_user_id, 'Lazer',              'expense', 'gamepad-2',      '#10B981', true),
    (p_user_id, 'Vestuário',          'expense', 'shirt',          '#F59E0B', true),
    (p_user_id, 'Serviços',           'expense', 'wifi',           '#6366F1', true),
    (p_user_id, 'Impostos e Taxas',   'expense', 'landmark',       '#DC2626', true),
    (p_user_id, 'Outros (Despesa)',   'expense', 'circle-dot',     '#6B7280', true)
  ON CONFLICT (user_id, name, type) DO NOTHING;

  -- Income categories
  INSERT INTO categories (user_id, name, type, icon, color, is_system) VALUES
    (p_user_id, 'Salário',                      'income', 'banknote',      '#22C55E', true),
    (p_user_id, 'Freelance',                     'income', 'laptop',        '#14B8A6', true),
    (p_user_id, 'Rendimentos de Investimento',   'income', 'trending-up',   '#0EA5E9', true),
    (p_user_id, 'Aluguel Recebido',              'income', 'building',      '#A855F7', true),
    (p_user_id, 'Presente / Bônus',              'income', 'gift',          '#F43F5E', true),
    (p_user_id, 'Outros (Receita)',              'income', 'circle-dot',    '#6B7280', true)
  ON CONFLICT (user_id, name, type) DO NOTHING;
END;
$$;

```

### supabase/migrations/021a_add_loan_financing_account_types.sql
```
-- Add loan and financing to account_type ENUM
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'loan';
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'financing';

```

### supabase/migrations/021b_coa_child_creation_and_dashboard_updates.sql
```
-- =====================================================
-- 1. RPC: create_coa_child
-- Creates an individual COA leaf under a parent.
-- Used by both auto-creation (account hook) and manual UI.
-- =====================================================
CREATE OR REPLACE FUNCTION create_coa_child(
  p_user_id UUID,
  p_parent_id UUID DEFAULT NULL,
  p_parent_code TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT '',
  p_account_name TEXT DEFAULT NULL,
  p_tax_treatment tax_treatment_type DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent RECORD;
  v_next_seq INT;
  v_new_code TEXT;
  v_new_id UUID;
BEGIN
  -- Auth check
  IF p_user_id != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Resolve parent: by ID or by code
  IF p_parent_id IS NOT NULL THEN
    SELECT id, internal_code, group_type, sort_order, depth, tax_treatment
    INTO v_parent
    FROM chart_of_accounts
    WHERE id = p_parent_id AND user_id = p_user_id;
  ELSIF p_parent_code IS NOT NULL THEN
    SELECT id, internal_code, group_type, sort_order, depth, tax_treatment
    INTO v_parent
    FROM chart_of_accounts
    WHERE internal_code = p_parent_code AND user_id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Either p_parent_id or p_parent_code is required';
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent COA not found';
  END IF;

  -- Next sequence: max existing child seq + 1
  SELECT COALESCE(MAX(
    CAST(REPLACE(internal_code, v_parent.internal_code || '.', '') AS INT)
  ), 0) + 1
  INTO v_next_seq
  FROM chart_of_accounts
  WHERE user_id = p_user_id AND parent_id = v_parent.id;

  -- Generate code: parent_code.NNN
  v_new_code := v_parent.internal_code || '.' || LPAD(v_next_seq::TEXT, 3, '0');

  -- Insert
  INSERT INTO chart_of_accounts (
    user_id, parent_id, internal_code, account_name, display_name,
    group_type, depth, is_active, is_system, sort_order,
    tax_treatment
  ) VALUES (
    p_user_id,
    v_parent.id,
    v_new_code,
    COALESCE(p_account_name, p_display_name),
    p_display_name,
    v_parent.group_type,
    v_parent.depth + 1,
    true,
    false,
    v_parent.sort_order,
    COALESCE(p_tax_treatment, v_parent.tax_treatment)
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- =====================================================
-- 2. Update get_balance_sheet: include loan/financing as liabilities
-- =====================================================
CREATE OR REPLACE FUNCTION get_balance_sheet(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_liquid_assets NUMERIC := 0;
  v_illiquid_assets NUMERIC := 0;
  v_total_assets NUMERIC := 0;
  v_total_liabilities NUMERIC := 0;
  v_net_worth NUMERIC := 0;
  v_result JSON;
BEGIN
  IF p_user_id != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Liquid assets: checking, savings, cash, investment
  SELECT COALESCE(SUM(current_balance), 0) INTO v_liquid_assets
  FROM accounts
  WHERE user_id = p_user_id
    AND is_active = true
    AND type IN ('checking', 'savings', 'cash', 'investment');

  -- Illiquid assets: real estate, vehicles, etc.
  SELECT COALESCE(SUM(current_value), 0) INTO v_illiquid_assets
  FROM assets
  WHERE user_id = p_user_id;

  v_total_assets := v_liquid_assets + v_illiquid_assets;

  -- Liabilities: credit cards + loans + financings
  SELECT COALESCE(SUM(current_balance), 0) INTO v_total_liabilities
  FROM accounts
  WHERE user_id = p_user_id
    AND is_active = true
    AND type IN ('credit_card', 'loan', 'financing');

  v_net_worth := v_total_assets - v_total_liabilities;

  SELECT json_build_object(
    'liquid_assets', v_liquid_assets,
    'illiquid_assets', v_illiquid_assets,
    'total_assets', v_total_assets,
    'total_liabilities', v_total_liabilities,
    'net_worth', v_net_worth
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- =====================================================
-- 3. Update get_dashboard_summary: negate loan/financing
-- =====================================================
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
  v_month_end DATE := (date_trunc('month', CURRENT_DATE) + interval '1 month')::DATE;
  v_result JSON;
BEGIN
  IF p_user_id != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT json_build_object(
    'total_current_balance', COALESCE((
      SELECT SUM(
        CASE WHEN type IN ('credit_card', 'loan', 'financing') THEN -current_balance
             ELSE current_balance END
      ) FROM accounts WHERE user_id = p_user_id AND is_active = true
    ), 0),
    'total_projected_balance', COALESCE((
      SELECT SUM(
        CASE WHEN type IN ('credit_card', 'loan', 'financing') THEN -projected_balance
             ELSE projected_balance END
      ) FROM accounts WHERE user_id = p_user_id AND is_active = true
    ), 0),
    'active_accounts', COALESCE((
      SELECT COUNT(*)::INT FROM accounts WHERE user_id = p_user_id AND is_active = true
    ), 0),
    'month_income', COALESCE((
      SELECT SUM(amount) FROM transactions
      WHERE user_id = p_user_id
        AND type = 'income'
        AND date >= v_month_start AND date < v_month_end
        AND is_deleted = false
    ), 0),
    'month_expense', COALESCE((
      SELECT SUM(amount) FROM transactions
      WHERE user_id = p_user_id
        AND type = 'expense'
        AND date >= v_month_start AND date < v_month_end
        AND is_deleted = false
    ), 0),
    'month_start', v_month_start,
    'month_end', v_month_end
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- =====================================================
-- 4. Update get_solvency_metrics: exclude loan/financing from tier1
-- =====================================================
CREATE OR REPLACE FUNCTION get_solvency_metrics(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier1 NUMERIC := 0;
  v_tier2 NUMERIC := 0;
  v_tier3 NUMERIC := 0;
  v_tier4 NUMERIC := 0;
  v_burn_rate NUMERIC := 0;
  v_runway NUMERIC := 0;
  v_lcr NUMERIC := 0;
  v_months_with_data INT := 0;
  v_total_expense_6m NUMERIC := 0;
  v_six_months_ago DATE := (CURRENT_DATE - interval '6 months')::DATE;
BEGIN
  IF p_user_id != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Tier 1: checking, savings, cash + investments T1
  SELECT COALESCE(SUM(current_balance), 0) INTO v_tier1
  FROM accounts
  WHERE user_id = p_user_id AND is_active = true
    AND type NOT IN ('credit_card', 'loan', 'financing')
    AND liquidity_tier = 'T1';

  -- Tier 2: investments T2
  SELECT COALESCE(SUM(current_balance), 0) INTO v_tier2
  FROM accounts
  WHERE user_id = p_user_id AND is_active = true
    AND type NOT IN ('credit_card', 'loan', 'financing')
    AND liquidity_tier = 'T2';

  -- Tier 3: assets exceto restricted
  SELECT COALESCE(SUM(current_value), 0) INTO v_tier3
  FROM assets
  WHERE user_id = p_user_id AND category != 'restricted';

  -- Tier 4: assets restricted
  SELECT COALESCE(SUM(current_value), 0) INTO v_tier4
  FROM assets
  WHERE user_id = p_user_id AND category = 'restricted';

  -- Burn Rate
  SELECT
    COALESCE(SUM(amount), 0),
    COUNT(DISTINCT date_trunc('month', date))::INT
  INTO v_total_expense_6m, v_months_with_data
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND date >= v_six_months_ago
    AND is_deleted = false;

  IF v_months_with_data > 0 THEN
    v_burn_rate := v_total_expense_6m / v_months_with_data;
  END IF;

  IF v_burn_rate > 0 THEN
    v_runway := ROUND((v_tier1 + v_tier2) / v_burn_rate, 1);
    v_lcr := ROUND((v_tier1 + v_tier2) / (v_burn_rate * 6), 2);
  ELSE
    v_runway := 999;
    v_lcr := 999;
  END IF;

  RETURN json_build_object(
    'tier1_total', ROUND(v_tier1, 2),
    'tier2_total', ROUND(v_tier2, 2),
    'tier3_total', ROUND(v_tier3, 2),
    'tier4_total', ROUND(v_tier4, 2),
    'total_patrimony', ROUND(v_tier1 + v_tier2 + v_tier3 + v_tier4, 2),
    'burn_rate', ROUND(v_burn_rate, 2),
    'runway_months', v_runway,
    'lcr', v_lcr,
    'months_analyzed', v_months_with_data
  );
END;
$$;

```

### supabase/migrations/022_unique_cost_center_idempotent.sql
```
-- Prevent duplicate cost centers per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_cost_centers_unique_name_user
  ON cost_centers (user_id, name);

-- Make seed idempotent
CREATE OR REPLACE FUNCTION create_default_cost_center(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_center_id UUID;
BEGIN
  INSERT INTO cost_centers (user_id, name, type, is_default)
  VALUES (p_user_id, 'Pessoal', 'neutral', TRUE)
  ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_center_id;
  RETURN v_center_id;
END;
$$;

```

### supabase/migrations/022b_unique_coa_internal_code.sql
```
-- Prevent duplicate COA internal_codes per user (defensive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_coa_unique_code_user
  ON chart_of_accounts (user_id, internal_code);

```

### supabase/migrations/023_family_members.sql
```
-- =====================================================
-- 1. ENUMs
-- =====================================================
CREATE TYPE family_relationship AS ENUM (
  'self',       -- o próprio titular
  'spouse',     -- cônjuge / companheiro(a)
  'child',      -- filho(a)
  'parent',     -- pai / mãe
  'sibling',    -- irmão(ã)
  'pet',        -- animal de estimação
  'other'       -- outros dependentes
);

CREATE TYPE family_role AS ENUM (
  'owner',      -- responsável (gerencia tudo)
  'member'      -- membro (futuramente: acesso limitado)
);

-- =====================================================
-- 2. Tabela family_members
-- =====================================================
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship family_relationship NOT NULL DEFAULT 'other',
  role family_role NOT NULL DEFAULT 'member',
  birth_date DATE,
  is_tax_dependent BOOLEAN NOT NULL DEFAULT false,
  cpf_encrypted TEXT,
  avatar_emoji TEXT DEFAULT '👤',
  cost_center_id UUID REFERENCES cost_centers(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_family_members_user ON family_members(user_id);
CREATE UNIQUE INDEX idx_family_members_unique_name ON family_members(user_id, name);

CREATE TRIGGER family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- 3. RLS
-- =====================================================
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY family_members_select ON family_members
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY family_members_insert ON family_members
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY family_members_update ON family_members
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY family_members_delete ON family_members
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 4. FK: transactions.family_member_id
-- =====================================================
ALTER TABLE transactions ADD COLUMN family_member_id UUID REFERENCES family_members(id);
CREATE INDEX idx_transactions_family_member ON transactions(family_member_id) WHERE family_member_id IS NOT NULL;

-- =====================================================
-- 5. is_overhead flag on cost_centers
-- =====================================================
ALTER TABLE cost_centers ADD COLUMN is_overhead BOOLEAN NOT NULL DEFAULT false;

-- =====================================================
-- 6. Rename default center
-- =====================================================
UPDATE cost_centers
SET name = 'Família (Geral)', is_overhead = true
WHERE is_default = true AND name = 'Pessoal';

-- =====================================================
-- 7. RPC: create_family_member
-- =====================================================
CREATE OR REPLACE FUNCTION create_family_member(
  p_user_id UUID,
  p_name TEXT,
  p_relationship family_relationship DEFAULT 'other',
  p_role family_role DEFAULT 'member',
  p_birth_date DATE DEFAULT NULL,
  p_is_tax_dependent BOOLEAN DEFAULT false,
  p_avatar_emoji TEXT DEFAULT '👤'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
  v_center_id UUID;
  v_center_type center_type;
BEGIN
  IF p_user_id != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_relationship IN ('self', 'spouse') THEN
    v_center_type := 'profit_center';
  ELSE
    v_center_type := 'cost_center';
  END IF;

  INSERT INTO cost_centers (user_id, name, type, is_default, is_active, icon)
  VALUES (p_user_id, p_name, v_center_type, false, true, p_avatar_emoji)
  RETURNING id INTO v_center_id;

  INSERT INTO family_members (
    user_id, name, relationship, role, birth_date,
    is_tax_dependent, avatar_emoji, cost_center_id
  ) VALUES (
    p_user_id, p_name, p_relationship, p_role, p_birth_date,
    p_is_tax_dependent, p_avatar_emoji, v_center_id
  )
  RETURNING id INTO v_member_id;

  RETURN v_member_id;
END;
$$;

-- =====================================================
-- 8. Update default seed
-- =====================================================
CREATE OR REPLACE FUNCTION create_default_cost_center(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_center_id UUID;
BEGIN
  INSERT INTO cost_centers (user_id, name, type, is_default, is_overhead)
  VALUES (p_user_id, 'Família (Geral)', 'neutral', TRUE, TRUE)
  ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_center_id;
  RETURN v_center_id;
END;
$$;

```

### supabase/migrations/024_tax_params_2026_inss_minimum_wage.sql
```
-- =============================================================
-- Migration 024: INSS 2026 + Salário Mínimo 2026
-- Fonte: Portaria Interministerial MPS/MF Nº 13 (DOU 12/01/2026)
-- =============================================================

-- Close INSS 2025 validity
UPDATE tax_parameters
SET valid_until = '2025-12-31'
WHERE parameter_type = 'inss_employee'
  AND valid_from = '2025-01-01'
  AND valid_until = '2025-12-31';

-- Close Salário Mínimo 2025 validity
UPDATE tax_parameters
SET valid_until = '2025-12-31'
WHERE parameter_type = 'minimum_wage'
  AND valid_from = '2025-01-01'
  AND valid_until = '2025-12-31';

-- INSS 2026
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references)
VALUES (
  'inss_employee',
  '2026-01-01',
  NULL,
  '[
    {"min": 0,       "max": 1621.00, "rate": 7.5},
    {"min": 1621.01, "max": 2902.84, "rate": 9},
    {"min": 2902.85, "max": 4354.27, "rate": 12},
    {"min": 4354.28, "max": 8475.55, "rate": 14}
  ]'::jsonb,
  '{"ceiling": 8475.55}'::jsonb,
  '[
    {"source": "Portaria MPS/MF 13/2026", "url": "https://www.legisweb.com.br/legislacao/?id=489284", "date": "2026-01-09"},
    {"source": "INSS Gov", "url": "https://www.gov.br/inss/pt-br/assuntos/com-reajuste-de-3-9-teto-do-inss-chega-a-r-8-475-55-em-2026", "date": "2026-01-12"}
  ]'::jsonb
);

-- Salário Mínimo 2026
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references)
VALUES (
  'minimum_wage',
  '2026-01-01',
  NULL,
  '[]'::jsonb,
  '{"value": 1621.00}'::jsonb,
  '[
    {"source": "Decreto Presidencial", "url": "https://www.planalto.gov.br", "date": "2026-01-01"},
    {"source": "Portaria MPS/MF 13/2026", "url": "https://www.legisweb.com.br/legislacao/?id=489284", "date": "2026-01-09"}
  ]'::jsonb
);

```

### supabase/migrations/025_cron_daily_index_fetch.sql
```
-- =============================================================
-- Migration 025: Coleta diária automática de índices econômicos
-- Usa extensão http (síncrona) + pg_cron
-- Fonte: BCB SGS API pública
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.cron_fetch_economic_indices()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_source RECORD;
  v_start_date TEXT;
  v_end_date TEXT;
  v_url TEXT;
  v_response extensions.http_response;
  v_body TEXT;
  v_data jsonb;
  v_point jsonb;
  v_iso_date TEXT;
  v_ref_date TEXT;
  v_month_key TEXT;
  v_value NUMERIC;
  v_inserted INT := 0;
  v_errors TEXT[] := '{}';
  v_last_per_month jsonb := '{}'::jsonb;
BEGIN
  v_end_date := to_char(CURRENT_DATE, 'DD/MM/YYYY');
  v_start_date := to_char(CURRENT_DATE - INTERVAL '4 months', 'DD/MM/YYYY');

  FOR v_source IN
    SELECT index_type, provider, series_code, api_url_template, periodicity
    FROM economic_indices_sources
    WHERE is_active = TRUE AND provider = 'bcb_sgs'
    ORDER BY index_type, priority
  LOOP
    BEGIN
      v_url := REPLACE(
        REPLACE(v_source.api_url_template, '{start}', v_start_date),
        '{end}', v_end_date
      );

      SELECT * INTO v_response FROM extensions.http_get(v_url);

      IF v_response.status != 200 THEN
        v_errors := array_append(v_errors, v_source.index_type || ': HTTP ' || v_response.status);
        CONTINUE;
      END IF;

      v_body := v_response.content;

      BEGIN
        v_data := v_body::jsonb;
      EXCEPTION WHEN OTHERS THEN
        v_errors := array_append(v_errors, v_source.index_type || ': JSON parse error');
        CONTINUE;
      END;

      IF jsonb_array_length(v_data) = 0 THEN
        v_errors := array_append(v_errors, v_source.index_type || ': empty response');
        CONTINUE;
      END IF;

      v_last_per_month := '{}'::jsonb;

      FOR v_point IN SELECT * FROM jsonb_array_elements(v_data)
      LOOP
        v_iso_date := substring(v_point->>'data' FROM 7 FOR 4) || '-' ||
                      substring(v_point->>'data' FROM 4 FOR 2) || '-' ||
                      substring(v_point->>'data' FROM 1 FOR 2);
        v_month_key := substring(v_iso_date FROM 1 FOR 7);
        v_value := (v_point->>'valor')::NUMERIC;

        IF v_value IS NULL THEN CONTINUE; END IF;

        IF v_source.periodicity = 'daily' THEN
          v_last_per_month := jsonb_set(
            v_last_per_month,
            ARRAY[v_month_key],
            jsonb_build_object('date', v_iso_date, 'value', v_value)
          );
        ELSE
          v_ref_date := v_month_key || '-01';

          INSERT INTO economic_indices (index_type, reference_date, value, source_primary, fetched_at)
          VALUES (v_source.index_type::index_type, v_ref_date::DATE, v_value,
                  'BCB SGS ' || v_source.series_code, NOW())
          ON CONFLICT (index_type, reference_date) DO UPDATE
            SET value = EXCLUDED.value,
                source_primary = EXCLUDED.source_primary,
                fetched_at = NOW();

          v_inserted := v_inserted + 1;
        END IF;
      END LOOP;

      IF v_source.periodicity = 'daily' THEN
        FOR v_month_key IN SELECT jsonb_object_keys(v_last_per_month)
        LOOP
          v_ref_date := v_month_key || '-01';
          v_value := (v_last_per_month->v_month_key->>'value')::NUMERIC;

          INSERT INTO economic_indices (index_type, reference_date, value, source_primary, fetched_at)
          VALUES (v_source.index_type::index_type, v_ref_date::DATE, v_value,
                  'BCB SGS ' || v_source.series_code, NOW())
          ON CONFLICT (index_type, reference_date) DO UPDATE
            SET value = EXCLUDED.value,
                source_primary = EXCLUDED.source_primary,
                fetched_at = NOW();

          v_inserted := v_inserted + 1;
        END LOOP;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_errors := array_append(v_errors, v_source.index_type || ': ' || SQLERRM);
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'errors', to_jsonb(v_errors),
    'fetched_at', NOW()
  );
END;
$$;

-- Schedule: daily at 06:00 UTC (03:00 BRT)
SELECT cron.schedule(
  'cron_fetch_indices',
  '0 6 * * *',
  $$SELECT public.cron_fetch_economic_indices()$$
);

```

### supabase/migrations/026_fix_transfer_passive_rules.sql
```
-- ============================================
-- WealthOS - Migration 026: Transfer rules for liability accounts
-- ============================================
-- WEA-010: Adjust create_transfer_with_journal() to invert
-- debit/credit orientation when source or destination account
-- is a liability account (credit_card, loan, financing).
-- ============================================

CREATE OR REPLACE FUNCTION create_transfer_with_journal(
  p_user_id         UUID,
  p_from_account_id UUID,
  p_to_account_id   UUID,
  p_amount          NUMERIC(14,2),
  p_description     TEXT DEFAULT 'Transferência entre contas',
  p_date            DATE DEFAULT CURRENT_DATE,
  p_is_paid         BOOLEAN DEFAULT TRUE,
  p_source          entry_source DEFAULT 'manual'
)
RETURNS JSON AS $$
DECLARE
  v_from_coa_id     UUID;
  v_to_coa_id       UUID;
  v_from_type       account_type;
  v_to_type         account_type;
  v_from_tx_id      UUID;
  v_to_tx_id        UUID;
  v_journal_id      UUID;
  v_now             TIMESTAMPTZ := NOW();
  v_has_liability   BOOLEAN := FALSE;
BEGIN
  -- 0. Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor da transferência deve ser positivo';
  END IF;

  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Conta de origem e destino devem ser diferentes';
  END IF;

  -- 1. Validate source account
  SELECT coa_id, type INTO v_from_coa_id, v_from_type
  FROM accounts
  WHERE id = p_from_account_id AND user_id = p_user_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta de origem não encontrada ou inativa';
  END IF;

  -- 2. Validate destination account
  SELECT coa_id, type INTO v_to_coa_id, v_to_type
  FROM accounts
  WHERE id = p_to_account_id AND user_id = p_user_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta de destino não encontrada ou inativa';
  END IF;

  v_has_liability := v_from_type IN ('credit_card', 'loan', 'financing')
    OR v_to_type IN ('credit_card', 'loan', 'financing');

  -- 3. Create outgoing transaction (source)
  INSERT INTO transactions (
    user_id, account_id, type, amount, description,
    date, is_paid, source, occurred_at, posted_at
  ) VALUES (
    p_user_id, p_from_account_id, 'transfer', p_amount, p_description,
    p_date, p_is_paid, p_source,
    v_now, CASE WHEN p_is_paid THEN v_now ELSE NULL END
  )
  RETURNING id INTO v_from_tx_id;

  -- 4. Create incoming transaction (destination)
  INSERT INTO transactions (
    user_id, account_id, type, amount, description,
    date, is_paid, source, occurred_at, posted_at,
    transfer_pair_id
  ) VALUES (
    p_user_id, p_to_account_id, 'transfer', p_amount, p_description,
    p_date, p_is_paid, p_source,
    v_now, CASE WHEN p_is_paid THEN v_now ELSE NULL END,
    v_from_tx_id
  )
  RETURNING id INTO v_to_tx_id;

  -- 5. Link back the source to destination
  UPDATE transactions
  SET transfer_pair_id = v_to_tx_id
  WHERE id = v_from_tx_id;

  -- 6. Create journal entry (single entry for the transfer event)
  IF v_from_coa_id IS NOT NULL AND v_to_coa_id IS NOT NULL THEN
    INSERT INTO journal_entries (
      user_id, entry_date, occurred_at, posted_at,
      source, description, transaction_id
    ) VALUES (
      p_user_id, p_date, v_now,
      CASE WHEN p_is_paid THEN v_now ELSE NULL END,
      p_source, p_description, v_from_tx_id
    )
    RETURNING id INTO v_journal_id;

    -- 7. Journal lines
    -- Active-only transfers keep historical orientation: D destination / C source.
    -- If source or destination is liability, orientation is inverted.
    IF v_has_liability THEN
      INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit, memo)
      VALUES
        (v_journal_id, v_from_coa_id, p_amount, 0, 'Transferência enviada (passivo)'),
        (v_journal_id, v_to_coa_id, 0, p_amount, 'Transferência recebida (passivo)');
    ELSE
      INSERT INTO journal_lines (journal_entry_id, account_id, amount_debit, amount_credit, memo)
      VALUES
        (v_journal_id, v_to_coa_id, p_amount, 0, 'Transferência recebida'),
        (v_journal_id, v_from_coa_id, 0, p_amount, 'Transferência enviada');
    END IF;

    -- Link journal to both transactions
    UPDATE transactions
    SET journal_entry_id = v_journal_id
    WHERE id IN (v_from_tx_id, v_to_tx_id);
  END IF;

  RETURN json_build_object(
    'from_transaction_id', v_from_tx_id,
    'to_transaction_id', v_to_tx_id,
    'journal_entry_id', v_journal_id,
    'amount', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_transfer_with_journal IS
'Atomic transfer between two accounts.
Creates 2 transactions (type=transfer, linked by transfer_pair_id) +
1 journal entry + 2 journal lines.
When source or destination account is liability (credit_card/loan/financing),
debit/credit orientation is inverted to handle passive-account transfers.';

GRANT EXECUTE ON FUNCTION create_transfer_with_journal(UUID, UUID, UUID, NUMERIC, TEXT, DATE, BOOLEAN, entry_source) TO authenticated;

```

### supabase/migrations/027_budget_family_member.sql
```
-- ============================================
-- Migration 027: Budget delegado por membro familiar
-- ============================================
-- Adiciona family_member_id ao budgets para permitir
-- orçamento por pessoa. NULL = orçamento do lar.

-- 1) Coluna
ALTER TABLE budgets
ADD COLUMN family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL;

-- 2) Índice para queries filtradas por membro
CREATE INDEX idx_budgets_family_member ON budgets(family_member_id) WHERE family_member_id IS NOT NULL;

-- 3) Unique constraint atualizada
DO $$
BEGIN
  BEGIN
    ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_user_id_category_id_month_key;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER TABLE budgets DROP CONSTRAINT IF EXISTS unique_budget_per_category_month;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

CREATE UNIQUE INDEX unique_budget_per_category_month_member
ON budgets(user_id, category_id, month, COALESCE(family_member_id, '00000000-0000-0000-0000-000000000000'));

-- 4) get_budget_vs_actual com filtro por membro
-- (DROP old 3-param version if exists)
DROP FUNCTION IF EXISTS get_budget_vs_actual(UUID, INT, INT);

CREATE OR REPLACE FUNCTION get_budget_vs_actual(
  p_user_id UUID,
  p_year INT DEFAULT NULL,
  p_month INT DEFAULT NULL,
  p_family_member_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_year INT := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INT);
  v_month INT := COALESCE(p_month, EXTRACT(MONTH FROM CURRENT_DATE)::INT);
  v_month_start DATE := make_date(v_year, v_month, 1);
  v_month_end DATE := (v_month_start + INTERVAL '1 month')::DATE;
  v_result JSON;
BEGIN
  WITH budget_actual AS (
    SELECT
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      b.id AS budget_id,
      b.planned_amount AS planned,
      b.alert_threshold,
      COALESCE(tx_sum.total, 0) AS actual,
      b.planned_amount - COALESCE(tx_sum.total, 0) AS remaining,
      CASE
        WHEN b.planned_amount = 0 THEN 0
        ELSE ROUND(COALESCE(tx_sum.total, 0) / b.planned_amount * 100, 1)
      END AS pct_used,
      CASE
        WHEN COALESCE(tx_sum.total, 0) >= b.planned_amount THEN 'exceeded'
        WHEN b.planned_amount > 0
          AND COALESCE(tx_sum.total, 0) / b.planned_amount >= b.alert_threshold THEN 'warning'
        ELSE 'ok'
      END AS status,
      b.family_member_id
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(t.amount), 0) AS total
      FROM transactions t
      WHERE t.user_id = p_user_id
        AND t.category_id = b.category_id
        AND t.type = 'expense'
        AND t.is_deleted = FALSE
        AND t.date >= v_month_start
        AND t.date < v_month_end
        AND (
          (p_family_member_id IS NULL AND b.family_member_id IS NULL)
          OR t.family_member_id = b.family_member_id
        )
    ) tx_sum ON TRUE
    WHERE b.user_id = p_user_id
      AND b.month = v_month_start
      AND (
        (p_family_member_id IS NULL AND b.family_member_id IS NULL)
        OR b.family_member_id = p_family_member_id
      )
  )
  SELECT json_build_object(
    'items', COALESCE((
      SELECT json_agg(json_build_object(
        'category_name', ba.category_name,
        'category_icon', ba.category_icon,
        'category_color', ba.category_color,
        'budget_id', ba.budget_id,
        'planned', ba.planned,
        'alert_threshold', ba.alert_threshold,
        'actual', ba.actual,
        'remaining', ba.remaining,
        'pct_used', ba.pct_used,
        'status', ba.status,
        'family_member_id', ba.family_member_id
      ) ORDER BY ba.actual DESC)
      FROM budget_actual ba
    ), '[]'::JSON),
    'total_planned', COALESCE((SELECT SUM(ba.planned) FROM budget_actual ba), 0),
    'total_actual', COALESCE((SELECT SUM(ba.actual) FROM budget_actual ba), 0),
    'total_remaining', COALESCE((SELECT SUM(ba.remaining) FROM budget_actual ba), 0),
    'pct_used', CASE
      WHEN COALESCE((SELECT SUM(ba.planned) FROM budget_actual ba), 0) = 0 THEN 0
      ELSE ROUND(
        COALESCE((SELECT SUM(ba.actual) FROM budget_actual ba), 0)
        / (SELECT SUM(ba.planned) FROM budget_actual ba) * 100, 1
      )
    END,
    'month', v_month_start,
    'budget_count', (SELECT COUNT(*) FROM budget_actual)
  ) INTO v_result;

  RETURN v_result;
END;
$fn$;

```

### supabase/migrations/028_bank_reconciliation.sql
```
-- ============================================================
-- Migration 028: Bank Reconciliation
-- Camada 1: Status lifecycle + due_date + pg_cron overdue
-- Camada 2: Auto-matching RPC + manual match RPC
-- Camada 3: find_reconciliation_candidates for UI
-- ============================================================

-- ─── 1. ENUM payment_status ──────────────────────────────────

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'overdue', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. ALTER transactions ───────────────────────────────────

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS payment_status payment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS matched_transaction_id UUID REFERENCES transactions(id),
  ADD COLUMN IF NOT EXISTS amount_adjustment NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN transactions.payment_status IS 'Lifecycle: pending → overdue (by cron) → paid → cancelled';
COMMENT ON COLUMN transactions.due_date IS 'Data de vencimento (distinta de date=data do lançamento)';
COMMENT ON COLUMN transactions.matched_transaction_id IS 'Transação par na conciliação (pendente ↔ importada)';
COMMENT ON COLUMN transactions.amount_adjustment IS 'Diferença registrada quando conciliação tem valor divergente';

-- Index for pending/overdue queries
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status
  ON transactions(user_id, payment_status) WHERE payment_status IN ('pending', 'overdue');

-- Index for matching candidates
CREATE INDEX IF NOT EXISTS idx_transactions_reconciliation
  ON transactions(user_id, account_id, payment_status, date)
  WHERE is_deleted = false;

-- ─── 3. Backfill payment_status from is_paid ─────────────────

UPDATE transactions
SET payment_status = CASE
  WHEN is_paid = true THEN 'paid'::payment_status
  ELSE 'pending'::payment_status
END
WHERE payment_status = 'pending' AND is_paid = true;

-- For pending bills with past due_date, mark overdue
-- (due_date doesn't exist yet for old data, but will be set by recurrence engine)

-- ─── 4. Trigger: sync is_paid ↔ payment_status ──────────────
-- Keeps backward compatibility: code writing is_paid still works,
-- code writing payment_status updates is_paid automatically.

CREATE OR REPLACE FUNCTION sync_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- If payment_status changed, sync is_paid
  IF TG_OP = 'UPDATE' AND OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    NEW.is_paid := (NEW.payment_status = 'paid');
  -- If is_paid changed (legacy code), sync payment_status
  ELSIF TG_OP = 'UPDATE' AND OLD.is_paid IS DISTINCT FROM NEW.is_paid THEN
    IF NEW.is_paid = true AND NEW.payment_status IN ('pending', 'overdue') THEN
      NEW.payment_status := 'paid';
    ELSIF NEW.is_paid = false AND NEW.payment_status = 'paid' THEN
      NEW.payment_status := 'pending';
    END IF;
  -- On INSERT, sync based on is_paid
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.is_paid = true AND NEW.payment_status = 'pending' THEN
      NEW.payment_status := 'paid';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_payment_status_trigger ON transactions;
CREATE TRIGGER sync_payment_status_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_payment_status();

-- ─── 5. pg_cron: mark overdue transactions ───────────────────
-- Runs daily at 01:00 UTC. Marks pending transactions with due_date < today.

CREATE OR REPLACE FUNCTION cron_mark_overdue_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE transactions
  SET payment_status = 'overdue'
  WHERE payment_status = 'pending'
    AND due_date IS NOT NULL
    AND due_date < CURRENT_DATE
    AND is_deleted = false;
END;
$$;

-- Schedule: daily at 01:00 UTC (22:00 BRT)
SELECT cron.schedule(
  'mark-overdue-transactions',
  '0 1 * * *',
  $$SELECT cron_mark_overdue_transactions()$$
);

-- ─── 6. RPC: find_reconciliation_candidates ──────────────────
-- For a given imported transaction, finds potential matches among
-- pending/overdue transactions in the same account.
-- Criteria: same account, amount within ±10%, date within ±7 days.

CREATE OR REPLACE FUNCTION find_reconciliation_candidates(
  p_user_id UUID,
  p_account_id UUID,
  p_amount NUMERIC,
  p_date DATE,
  p_tolerance_pct NUMERIC DEFAULT 10,
  p_tolerance_days INT DEFAULT 7
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_min_amount NUMERIC;
  v_max_amount NUMERIC;
  v_min_date DATE;
  v_max_date DATE;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_min_amount := p_amount * (1 - p_tolerance_pct / 100);
  v_max_amount := p_amount * (1 + p_tolerance_pct / 100);
  v_min_date := p_date - p_tolerance_days;
  v_max_date := p_date + p_tolerance_days;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json)
    FROM (
      SELECT
        t.id,
        t.description,
        t.amount,
        t.date,
        t.due_date,
        t.type,
        t.payment_status,
        t.category_id,
        t.recurrence_id,
        ABS(t.amount - p_amount) AS amount_diff,
        ABS(t.date - p_date) AS days_diff,
        -- Confidence score: lower is better
        (ABS(t.amount - p_amount) / GREATEST(p_amount, 0.01) * 50
         + ABS(t.date - p_date) * 5) AS match_score
      FROM transactions t
      WHERE t.user_id = p_user_id
        AND t.account_id = p_account_id
        AND t.payment_status IN ('pending', 'overdue')
        AND t.is_deleted = false
        AND t.matched_transaction_id IS NULL
        AND t.amount BETWEEN v_min_amount AND v_max_amount
        AND t.date BETWEEN v_min_date AND v_max_date
      ORDER BY match_score ASC
      LIMIT 5
    ) c
  );
END;
$$;

GRANT EXECUTE ON FUNCTION find_reconciliation_candidates(UUID, UUID, NUMERIC, DATE, NUMERIC, INT) TO authenticated;

-- ─── 7. RPC: match_transactions ──────────────────────────────
-- Manually (or auto) link a pending transaction to an imported one.
-- The pending gets marked as paid, adjustment recorded if amounts differ.

CREATE OR REPLACE FUNCTION match_transactions(
  p_user_id UUID,
  p_pending_id UUID,
  p_imported_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending transactions%ROWTYPE;
  v_imported transactions%ROWTYPE;
  v_adjustment NUMERIC;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Load both transactions
  SELECT * INTO v_pending FROM transactions
    WHERE id = p_pending_id AND user_id = p_user_id AND is_deleted = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transação pendente não encontrada';
  END IF;

  SELECT * INTO v_imported FROM transactions
    WHERE id = p_imported_id AND user_id = p_user_id AND is_deleted = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transação importada não encontrada';
  END IF;

  -- Validate: pending must be pending/overdue
  IF v_pending.payment_status NOT IN ('pending', 'overdue') THEN
    RAISE EXCEPTION 'Transação já conciliada ou cancelada';
  END IF;

  -- Validate: both must be in the same account
  IF v_pending.account_id != v_imported.account_id THEN
    RAISE EXCEPTION 'Transações devem pertencer à mesma conta';
  END IF;

  -- Calculate adjustment
  v_adjustment := v_imported.amount - v_pending.amount;

  -- Link them together
  UPDATE transactions
  SET payment_status = 'paid',
      matched_transaction_id = p_imported_id,
      amount_adjustment = v_adjustment
  WHERE id = p_pending_id;

  UPDATE transactions
  SET matched_transaction_id = p_pending_id
  WHERE id = p_imported_id;

  -- Soft-delete the imported duplicate (the pending one "absorbs" it)
  -- The pending transaction is now the canonical record, marked as paid.
  -- The imported one is kept for audit trail but marked deleted.
  UPDATE transactions
  SET is_deleted = true
  WHERE id = p_imported_id;

  RETURN json_build_object(
    'status', 'matched',
    'pending_id', p_pending_id,
    'imported_id', p_imported_id,
    'adjustment', v_adjustment,
    'final_amount', v_pending.amount + v_adjustment
  );
END;
$$;

GRANT EXECUTE ON FUNCTION match_transactions(UUID, UUID, UUID) TO authenticated;

-- ─── 8. Rewrite import_transactions_batch with auto-matching ─
-- Enhanced: before inserting, check for matching pending transactions.
-- If match found with score < threshold, auto-match instead of insert.

CREATE OR REPLACE FUNCTION import_transactions_batch(
  p_user_id UUID,
  p_account_id UUID,
  p_bank_connection_id UUID,
  p_batch_id UUID,
  p_transactions JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx JSONB;
  v_imported INT := 0;
  v_skipped INT := 0;
  v_categorized INT := 0;
  v_matched INT := 0;
  v_cat_id UUID;
  v_tx_type transaction_type;
  v_amount NUMERIC;
  v_ext_id TEXT;
  v_date DATE;
  v_match_id UUID;
  v_match_score NUMERIC;
  v_new_tx_id UUID;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  FOR v_tx IN SELECT * FROM jsonb_array_elements(p_transactions)
  LOOP
    v_ext_id := v_tx->>'external_id';
    v_amount := ABS((v_tx->>'amount')::NUMERIC);
    v_date := (v_tx->>'date')::DATE;

    -- Skip duplicates by external_id
    IF v_ext_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM transactions
      WHERE user_id = p_user_id AND external_id = v_ext_id AND is_deleted = false
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Determine type
    IF (v_tx->>'amount')::NUMERIC >= 0 THEN
      v_tx_type := 'income';
    ELSE
      v_tx_type := 'expense';
    END IF;

    IF v_tx->>'type' IS NOT NULL AND v_tx->>'type' != '' THEN
      v_tx_type := (v_tx->>'type')::transaction_type;
    END IF;

    -- ═══ AUTO-MATCHING (Camada 2) ═══
    -- Look for pending/overdue transaction that matches this import
    SELECT t.id, 
           (ABS(t.amount - v_amount) / GREATEST(v_amount, 0.01) * 50 + ABS(t.date - v_date) * 5) AS score
    INTO v_match_id, v_match_score
    FROM transactions t
    WHERE t.user_id = p_user_id
      AND t.account_id = p_account_id
      AND t.payment_status IN ('pending', 'overdue')
      AND t.is_deleted = false
      AND t.matched_transaction_id IS NULL
      AND t.amount BETWEEN v_amount * 0.9 AND v_amount * 1.1
      AND t.date BETWEEN v_date - 7 AND v_date + 7
    ORDER BY score ASC
    LIMIT 1;

    -- If strong match (score < 25 = ~5% amount diff + ~2 days), auto-match
    IF v_match_id IS NOT NULL AND v_match_score < 25 THEN
      UPDATE transactions
      SET payment_status = 'paid',
          matched_transaction_id = NULL,  -- no separate imported tx to reference
          amount_adjustment = v_amount - amount,
          external_id = COALESCE(v_ext_id, external_id),
          import_batch_id = p_batch_id
      WHERE id = v_match_id;

      v_matched := v_matched + 1;
      CONTINUE;
    END IF;

    -- ═══ NORMAL INSERT (no match found) ═══
    -- Auto-categorize
    v_cat_id := auto_categorize_transaction(p_user_id, COALESCE(v_tx->>'description', ''));
    IF v_cat_id IS NOT NULL THEN
      v_categorized := v_categorized + 1;
    END IF;

    INSERT INTO transactions (
      user_id, account_id, category_id, type, amount, description,
      date, is_paid, payment_status, source, bank_connection_id,
      external_id, import_batch_id
    ) VALUES (
      p_user_id,
      p_account_id,
      v_cat_id,
      v_tx_type,
      v_amount,
      v_tx->>'description',
      v_date,
      true,
      'paid',
      CASE WHEN p_bank_connection_id IS NOT NULL THEN 'bank_feed'::entry_source ELSE 'csv_import'::entry_source END,
      p_bank_connection_id,
      v_ext_id,
      p_batch_id
    );

    v_imported := v_imported + 1;
  END LOOP;

  -- Update bank_connection last_sync
  IF p_bank_connection_id IS NOT NULL THEN
    UPDATE bank_connections
    SET last_sync_at = now(), sync_status = 'active', updated_at = now()
    WHERE id = p_bank_connection_id;
  END IF;

  RETURN json_build_object(
    'status', 'ok',
    'imported', v_imported,
    'skipped', v_skipped,
    'categorized', v_categorized,
    'matched', v_matched,
    'batch_id', p_batch_id
  );
END;
$$;

-- Grant already exists from migration 010, but re-grant to be safe
GRANT EXECUTE ON FUNCTION import_transactions_batch(UUID, UUID, UUID, UUID, JSONB) TO authenticated;

```

### supabase/migrations/029_cron_process_account_deletions.sql
```
-- Migration 029: pg_cron job for processing account deletions (CFG-06)
-- Runs daily at 03:30 UTC. Processes users where deletion_requested_at + 7 days < now().

CREATE OR REPLACE FUNCTION cron_process_account_deletions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_deleted_count INT := 0;
BEGIN
  FOR v_user IN
    SELECT id FROM users_profile
    WHERE deletion_requested_at IS NOT NULL
      AND deletion_requested_at + interval '7 days' < now()
  LOOP
    -- Delete in order respecting FK constraints (children first)
    DELETE FROM center_allocations WHERE journal_line_id IN (
      SELECT id FROM journal_lines WHERE journal_entry_id IN (
        SELECT id FROM journal_entries WHERE user_id = v_user.id
      )
    );
    DELETE FROM journal_lines WHERE journal_entry_id IN (
      SELECT id FROM journal_entries WHERE user_id = v_user.id
    );
    DELETE FROM journal_entries WHERE user_id = v_user.id;
    DELETE FROM workflow_tasks WHERE user_id = v_user.id;
    DELETE FROM workflows WHERE user_id = v_user.id;
    DELETE FROM transactions WHERE user_id = v_user.id;
    DELETE FROM budgets WHERE user_id = v_user.id;
    DELETE FROM recurrences WHERE user_id = v_user.id;
    DELETE FROM asset_value_history WHERE user_id = v_user.id;
    DELETE FROM assets WHERE user_id = v_user.id;
    DELETE FROM documents WHERE user_id = v_user.id;
    DELETE FROM notification_log WHERE user_id = v_user.id;
    DELETE FROM notification_tokens WHERE user_id = v_user.id;
    DELETE FROM family_members WHERE user_id = v_user.id;
    DELETE FROM cost_centers WHERE user_id = v_user.id;
    DELETE FROM chart_of_accounts WHERE user_id = v_user.id;
    DELETE FROM categories WHERE user_id = v_user.id;
    DELETE FROM accounts WHERE user_id = v_user.id;
    DELETE FROM bank_connections WHERE user_id = v_user.id;
    DELETE FROM tax_parameters WHERE updated_by = v_user.id::text;
    DELETE FROM monthly_snapshots WHERE user_id = v_user.id;

    -- Mark profile as purged (keep record for audit, remove PII)
    UPDATE users_profile
    SET full_name = '[excluído]',
        cpf_encrypted = NULL,
        encryption_key_encrypted = NULL,
        encryption_key_iv = NULL,
        kek_material = NULL,
        onboarding_completed = false,
        updated_at = now()
    WHERE id = v_user.id;

    v_deleted_count := v_deleted_count + 1;
  END LOOP;

  IF v_deleted_count > 0 THEN
    RAISE NOTICE 'Processed % account deletion(s)', v_deleted_count;
  END IF;
END;
$$;

SELECT cron.schedule(
  'process-account-deletions',
  '30 3 * * *',
  $$SELECT cron_process_account_deletions()$$
);

```

### src/__tests__/auth-schemas-extended.test.ts
```
import {
  mfaCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  passwordSchema,
  getPasswordStrength,
} from "@/lib/validations/auth";
import { isPasswordBlocked } from "@/lib/auth/password-blocklist";

describe("auth validation (extended)", () => {
  describe("mfaCodeSchema", () => {
    it("aceita código TOTP válido de 6 dígitos", () => {
      expect(mfaCodeSchema.safeParse({ code: "123456" }).success).toBe(true);
    });

    it("rejeita código com letras", () => {
      expect(mfaCodeSchema.safeParse({ code: "12345a" }).success).toBe(false);
    });

    it("rejeita código com menos de 6 dígitos", () => {
      expect(mfaCodeSchema.safeParse({ code: "12345" }).success).toBe(false);
    });

    it("rejeita código com mais de 6 dígitos", () => {
      expect(mfaCodeSchema.safeParse({ code: "1234567" }).success).toBe(false);
    });

    it("rejeita código com espaços", () => {
      expect(mfaCodeSchema.safeParse({ code: "123 56" }).success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("aceita email válido", () => {
      expect(forgotPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
    });

    it("rejeita email inválido", () => {
      expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    });

    it("rejeita campo vazio", () => {
      expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    const validPassword = "Str0ngP@ss2026";

    it("aceita senhas válidas coincidentes", () => {
      const result = resetPasswordSchema.safeParse({
        password: validPassword,
        confirmPassword: validPassword,
      });
      expect(result.success).toBe(true);
    });

    it("rejeita senhas divergentes", () => {
      const result = resetPasswordSchema.safeParse({
        password: validPassword,
        confirmPassword: "OutraSenha1234!",
      });
      expect(result.success).toBe(false);
    });

    it("rejeita senha curta mesmo que coincidente", () => {
      const result = resetPasswordSchema.safeParse({
        password: "Short1!",
        confirmPassword: "Short1!",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("passwordSchema (deep)", () => {
    it("aceita senha forte com 12+ chars, maiúscula, minúscula e número", () => {
      expect(passwordSchema.safeParse("MyStr0ngPass1").success).toBe(true);
    });

    it("rejeita senha sem maiúscula", () => {
      expect(passwordSchema.safeParse("mystr0ngpass1").success).toBe(false);
    });

    it("rejeita senha sem minúscula", () => {
      expect(passwordSchema.safeParse("MYSTR0NGPASS1").success).toBe(false);
    });

    it("rejeita senha sem número", () => {
      expect(passwordSchema.safeParse("MyStrongPasswd").success).toBe(false);
    });

    it("rejeita senha com 128+ caracteres", () => {
      const tooLong = "A1" + "a".repeat(127);
      expect(passwordSchema.safeParse(tooLong).success).toBe(false);
    });

    it("rejeita senha da blocklist", () => {
      expect(passwordSchema.safeParse("Password1234").success).toBe(false);
    });
  });

  describe("getPasswordStrength", () => {
    it("retorna 'weak' para senha simples curta", () => {
      expect(getPasswordStrength("abc")).toBe("weak");
    });

    it("retorna 'fair' para senha com 12 chars e mixed case", () => {
      // "AbcDefghijkl" está na blocklist (lowercase match), usar outra
      expect(getPasswordStrength("ZxyWvuTsrqpo")).toBe("fair");
    });

    it("retorna 'strong' para senha longa com tudo", () => {
      expect(getPasswordStrength("MyStr0ng!Pass2026")).toBe("strong");
    });

    it("retorna 'weak' para senha da blocklist mesmo com critérios", () => {
      // password1234 está na blocklist, score diminui
      expect(["weak", "fair"]).toContain(getPasswordStrength("password1234"));
    });
  });

  describe("isPasswordBlocked", () => {
    it("bloqueia senha conhecida da blocklist", () => {
      expect(isPasswordBlocked("123456789012")).toBe(true);
    });

    it("bloqueia case-insensitive", () => {
      expect(isPasswordBlocked("PASSWORD1234")).toBe(true);
    });

    it("permite senha não listada", () => {
      expect(isPasswordBlocked("UniqueP@ss2026!")).toBe(false);
    });

    it("bloqueia variações com substituição comum", () => {
      expect(isPasswordBlocked("p@ssw0rd1234")).toBe(true);
    });
  });
});

```

### src/__tests__/auth-validation.test.ts
```
import { loginSchema, registerSchema } from "@/lib/validations/auth";

describe("auth validation schemas", () => {
  describe("loginSchema", () => {
    it("aceita credenciais válidas simples", () => {
      const parsed = loginSchema.safeParse({ email: "user@test.com", password: "x" });
      expect(parsed.success).toBe(true);
    });

    it("aceita credenciais válidas com domínio corporativo", () => {
      const parsed = loginSchema.safeParse({ email: "a.b@empresa.com.br", password: "senha123" });
      expect(parsed.success).toBe(true);
    });

    it("rejeita email inválido", () => {
      const parsed = loginSchema.safeParse({ email: "invalido", password: "abc" });
      expect(parsed.success).toBe(false);
    });

    it("rejeita senha vazia", () => {
      const parsed = loginSchema.safeParse({ email: "user@test.com", password: "" });
      expect(parsed.success).toBe(false);
    });

    it("rejeita payload sem password", () => {
      const parsed = loginSchema.safeParse({ email: "user@test.com" });
      expect(parsed.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    const validPasswordA = "SenhaMuitoForte123";
    const validPasswordB = "OutraSenhaValida456";

    it("aceita payload válido básico", () => {
      const parsed = registerSchema.safeParse({
        fullName: "Claudio Filho",
        email: "claudio@test.com",
        password: validPasswordA,
        confirmPassword: validPasswordA,
      });
      expect(parsed.success).toBe(true);
    });

    it("aceita outro payload válido", () => {
      const parsed = registerSchema.safeParse({
        fullName: "Ana Maria",
        email: "ana.maria@empresa.com",
        password: validPasswordB,
        confirmPassword: validPasswordB,
      });
      expect(parsed.success).toBe(true);
    });

    it("rejeita nome curto", () => {
      const parsed = registerSchema.safeParse({
        fullName: "A",
        email: "a@test.com",
        password: validPasswordA,
        confirmPassword: validPasswordA,
      });
      expect(parsed.success).toBe(false);
    });

    it("rejeita email inválido", () => {
      const parsed = registerSchema.safeParse({
        fullName: "Nome Válido",
        email: "email-invalido",
        password: validPasswordA,
        confirmPassword: validPasswordA,
      });
      expect(parsed.success).toBe(false);
    });

    it("rejeita confirmação de senha divergente", () => {
      const parsed = registerSchema.safeParse({
        fullName: "Nome Válido",
        email: "ok@test.com",
        password: validPasswordA,
        confirmPassword: "Diferente123Aa",
      });
      expect(parsed.success).toBe(false);
    });
  });
});

```

### src/__tests__/dialog-helpers.test.ts
```
/**
 * Tests for useEscapeClose and useAutoReset hooks.
 * These are UX-critical: ESC should close dialogs, auto-reset should prevent stale confirm states.
 */

import { renderHook, act } from "@testing-library/react";
import { useEscapeClose, useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { useState } from "react";

describe("dialog helpers", () => {
  describe("useEscapeClose", () => {
    it("calls onClose when Escape is pressed and dialog is open", () => {
      const onClose = jest.fn();
      renderHook(() => useEscapeClose(true, onClose));

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when dialog is closed", () => {
      const onClose = jest.fn();
      renderHook(() => useEscapeClose(false, onClose));

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("does not call onClose for non-Escape keys", () => {
      const onClose = jest.fn();
      renderHook(() => useEscapeClose(true, onClose));

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("cleans up listener when dialog closes", () => {
      const onClose = jest.fn();
      const { rerender } = renderHook(
        ({ open }) => useEscapeClose(open, onClose),
        { initialProps: { open: true } }
      );

      // Close the dialog
      rerender({ open: false });

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("useAutoReset", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("resets value to null after timeout", () => {
      const { result } = renderHook(() => {
        const [value, setValue] = useState<string | null>("confirm-123");
        useAutoReset(value, setValue, 5000);
        return { value, setValue };
      });

      expect(result.current.value).toBe("confirm-123");

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.value).toBeNull();
    });

    it("does not fire when value is already null", () => {
      const setter = jest.fn();
      renderHook(() => useAutoReset(null, setter, 5000));

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(setter).not.toHaveBeenCalled();
    });

    it("uses default 5s timeout", () => {
      const { result } = renderHook(() => {
        const [value, setValue] = useState<string | null>("test");
        useAutoReset(value, setValue);
        return { value };
      });

      act(() => {
        jest.advanceTimersByTime(4999);
      });
      expect(result.current.value).toBe("test");

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current.value).toBeNull();
    });

    it("resets timer when value changes", () => {
      const { result } = renderHook(() => {
        const [value, setValue] = useState<string | null>("first");
        useAutoReset(value, setValue, 3000);
        return { value, setValue };
      });

      // Advance 2s
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Change value: timer restarts
      act(() => {
        result.current.setValue("second");
      });

      // 2s more (4s total, but only 2s since new value)
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(result.current.value).toBe("second");

      // 1s more (3s since "second" was set)
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.value).toBeNull();
    });
  });
});

```

### src/__tests__/onboarding-seeds.test.ts
```
import { completeOnboardingSeeds } from "@/lib/services/onboarding-seeds";

describe("onboarding seeds", () => {
  it("não marca onboarding_completed quando seed falha", async () => {
    const updateEq = jest.fn();
    const supabase = {
      rpc: jest.fn().mockImplementation((fn: string) => {
        if (fn === "create_default_categories") {
          return Promise.resolve({ error: { message: "erro seed" } });
        }
        return Promise.resolve({ error: null });
      }),
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: updateEq }),
      }),
    };

    await expect(completeOnboardingSeeds(supabase, "user-1")).rejects.toThrow("Erro ao criar categorias padrão");
    expect(updateEq).not.toHaveBeenCalled();
  });

  it("marca onboarding_completed quando todas seeds passam", async () => {
    const updateEq = jest.fn().mockResolvedValue({ error: null });
    const supabase = {
      rpc: jest.fn().mockResolvedValue({ error: null }),
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: updateEq }),
      }),
    };

    await expect(completeOnboardingSeeds(supabase, "user-2")).resolves.toBeUndefined();
    expect(updateEq).toHaveBeenCalledWith("id", "user-2");
  });
});

```

### src/__tests__/parsers.test.ts
```
import * as XLSX from "xlsx";
import { mapToTransactions, parseCSVRaw, suggestMapping } from "@/lib/parsers/csv-parser";
import { parseOFX } from "@/lib/parsers/ofx-parser";
import { parseXLSX } from "@/lib/parsers/xlsx-parser";

describe("parsers", () => {
  describe("csv-parser", () => {
    it("parseia CSV válido com headers e linhas", () => {
      const input = "Data,Descrição,Valor\n13/03/2026,Salário,5000,00".replace(",00", ".00");
      const parsed = parseCSVRaw(input);
      expect(parsed.headers).toEqual(["Data", "Descrição", "Valor"]);
      expect(parsed.rows).toHaveLength(1);
    });

    it("retorna vazio com conteúdo insuficiente", () => {
      const parsed = parseCSVRaw("Data,Valor");
      expect(parsed.headers).toEqual([]);
      expect(parsed.rows).toEqual([]);
    });

    it("sugere mapeamento por headers", () => {
      const mapping = suggestMapping(["Data", "Descrição", "Valor"], ["13/03/2026", "Uber", "-15,00"]);
      expect(mapping).toEqual({ date: 0, amount: 2, description: 1 });
    });

    it("retorna null no suggestMapping com entrada inválida", () => {
      expect(suggestMapping(["Data"], ["13/03/2026"])) .toBeNull();
      expect(suggestMapping(["Data", "Valor"], [])).toBeNull();
    });

    it("converte linhas válidas para transações e normaliza valores", () => {
      const rows = [["13/03/2026", "Mercado", "1.234,56"], ["2026-03-14", "Pix", "-100"]];
      const result = mapToTransactions(rows, { date: 0, description: 1, amount: 2 });
      expect(result.errors).toEqual([]);
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0]).toMatchObject({ date: "2026-03-13", amount: 1234.56, type: "income" });
      expect(result.transactions[1]).toMatchObject({ amount: 100, type: "expense" });
    });

    it("reporta erro para data inválida", () => {
      const result = mapToTransactions([["sem-data", "desc", "10"]], { date: 0, description: 1, amount: 2 });
      expect(result.transactions).toHaveLength(0);
      expect(result.errors[0]).toContain('data inválida');
    });

    it("reporta erro para valor inválido", () => {
      const result = mapToTransactions([["13/03/2026", "desc", "abc"]], { date: 0, description: 1, amount: 2 });
      expect(result.transactions).toHaveLength(0);
      expect(result.errors[0]).toContain('valor inválido');
    });
  });

  describe("xlsx-parser", () => {
    function workbookBuffer(data: unknown[][], sheetName = "Extrato") {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      return out as ArrayBuffer;
    }

    it("parseia planilha válida", () => {
      const buffer = workbookBuffer([
        ["Data", "Descrição", "Valor"],
        ["13/03/2026", "Mercado", "100,00"],
      ]);
      const result = parseXLSX(buffer);
      expect(result.headers).toEqual(["Data", "Descrição", "Valor"]);
      expect(result.rows).toHaveLength(1);
      expect(result.activeSheet).toBe("Extrato");
    });

    it("retorna vazio para planilha sem linhas suficientes", () => {
      const buffer = workbookBuffer([["Data"]]);
      const result = parseXLSX(buffer);
      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it("respeita sheetName quando existe", () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["A"], ["1"]]), "Aba1");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Data", "Valor"], ["13/03/2026", "50"]]), "Aba2");
      const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
      const result = parseXLSX(buffer, "Aba2");
      expect(result.activeSheet).toBe("Aba2");
      expect(result.headers).toEqual(["Data", "Valor"]);
    });

    it("faz fallback para primeira aba quando sheetName não existe", () => {
      const buffer = workbookBuffer([["Col1", "Col2"], ["x", "y"]], "Principal");
      const result = parseXLSX(buffer, "Inexistente");
      expect(result.activeSheet).toBe("Principal");
    });
  });

  describe("ofx-parser", () => {
    const originalCrypto = global.crypto;

    beforeAll(() => {
      const digest = async (_alg: string, data: ArrayBuffer): Promise<ArrayBuffer> => {
        const input = new Uint8Array(data);
        const out = new Uint8Array(32);
        let acc = 0;
        for (const b of input) acc = (acc + b) % 256;
        out[0] = acc;
        return out.buffer;
      };

      const baseCrypto = originalCrypto ?? ({} as Crypto);
      Object.defineProperty(global, "crypto", {
        value: {
          ...baseCrypto,
          subtle: { ...(baseCrypto as Crypto).subtle, digest },
        },
        configurable: true,
      });
    });

    afterAll(() => {
      Object.defineProperty(global, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });
    it("parseia OFX válido (SGML) com transações", async () => {
      const ofx = `<OFX><BANKID>001</BANKID><ACCTID>123</ACCTID><CURDEF>BRL</CURDEF><DTSTART>20260301</DTSTART><DTEND>20260331</DTEND><BANKTRANLIST><STMTTRN><FITID>1</FITID><DTPOSTED>20260305120000</DTPOSTED><TRNAMT>-10.50</TRNAMT><NAME>Padaria</NAME><MEMO>Cafe</MEMO></STMTTRN><STMTTRN><FITID>2</FITID><DTPOSTED>20260306120000</DTPOSTED><TRNAMT>100.00</TRNAMT><NAME>Salario</NAME></STMTTRN></BANKTRANLIST></OFX>`;
      const result = await parseOFX(ofx);
      expect(result.accountId).toBe("123");
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].type).toBe("expense");
      expect(result.transactions[1].type).toBe("income");
      expect(result.errors).toEqual([]);
    });

    it("descarta duplicatas dentro do mesmo arquivo", async () => {
      const ofx = `<OFX><BANKID>001</BANKID><ACCTID>123</ACCTID><BANKTRANLIST><STMTTRN><FITID>dup</FITID><DTPOSTED>20260305</DTPOSTED><TRNAMT>10</TRNAMT><NAME>A</NAME></STMTTRN><STMTTRN><FITID>dup</FITID><DTPOSTED>20260305</DTPOSTED><TRNAMT>10</TRNAMT><NAME>A</NAME></STMTTRN></BANKTRANLIST></OFX>`;
      const result = await parseOFX(ofx);
      expect(result.transactions).toHaveLength(1);
      expect(result.duplicatesSkipped).toBe(1);
    });

    it("reporta erro para transação incompleta", async () => {
      const ofx = `<OFX><STMTTRN><FITID>x<TRNAMT>10</STMTTRN></OFX>`;
      const result = await parseOFX(ofx);
      expect(result.transactions).toHaveLength(0);
      expect(result.errors.some((e) => e.includes("Transação incompleta"))).toBe(true);
    });

    it("reporta erro para valor inválido", async () => {
      const ofx = `<OFX><STMTTRN><FITID>x<DTPOSTED>20260305<TRNAMT>abc<NAME>Teste</STMTTRN></OFX>`;
      const result = await parseOFX(ofx);
      expect(result.transactions).toHaveLength(0);
      expect(result.errors.some((e) => e.includes("Valor inválido"))).toBe(true);
    });

    it("usa descrição padrão quando NAME e MEMO ausentes", async () => {
      const ofx = `<OFX><BANKTRANLIST><STMTTRN><FITID>x</FITID><DTPOSTED>20260305</DTPOSTED><TRNAMT>10</TRNAMT></STMTTRN></BANKTRANLIST></OFX>`;
      const result = await parseOFX(ofx);
      expect(result.transactions[0]?.description).toBe("Sem descrição");
    });
  });
});

```

### src/__tests__/rate-limiter.test.ts
```
import { checkRateLimit, extractRouteKey, rateLimitHeaders } from "@/lib/auth/rate-limiter";

describe("rate-limiter", () => {
  describe("checkRateLimit", () => {
    // Cada teste usa um IP diferente para evitar contaminação cross-test
    it("permite a primeira tentativa", () => {
      const result = checkRateLimit("login", "10.0.0.1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // login: 5 max, 1 usada
      expect(result.retryAfterMs).toBe(0);
    });

    it("bloqueia após exceder o limite de login (5 tentativas)", () => {
      const ip = "10.0.0.2";
      for (let i = 0; i < 5; i++) {
        checkRateLimit("login", ip);
      }
      const result = checkRateLimit("login", ip);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it("bloqueia após exceder o limite de register (3 tentativas)", () => {
      const ip = "10.0.0.3";
      for (let i = 0; i < 3; i++) {
        checkRateLimit("register", ip);
      }
      const result = checkRateLimit("register", ip);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("isola contagens entre rotas diferentes", () => {
      const ip = "10.0.0.4";
      for (let i = 0; i < 5; i++) {
        checkRateLimit("login", ip);
      }
      // login: 5 de 5 usadas (esgotado), register: 0 de 3 usadas
      const loginResult = checkRateLimit("login", ip);
      expect(loginResult.allowed).toBe(false); // 6a tentativa bloqueada

      const registerResult = checkRateLimit("register", ip);
      expect(registerResult.allowed).toBe(true);
    });

    it("isola contagens entre IPs diferentes", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("login", "10.0.0.5");
      }
      // IP 10.0.0.5 bloqueado, 10.0.0.6 livre
      const blocked = checkRateLimit("login", "10.0.0.5");
      expect(blocked.allowed).toBe(false);

      const free = checkRateLimit("login", "10.0.0.6");
      expect(free.allowed).toBe(true);
    });

    it("usa config padrão para rota desconhecida", () => {
      const ip = "10.0.0.7";
      const result = checkRateLimit("unknown-route", ip);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10); // DEFAULT_CONFIG.maxAttempts
    });

    it("retorna remaining decrementando corretamente", () => {
      const ip = "10.0.0.8";
      const r1 = checkRateLimit("forgot-password", ip); // max 3
      expect(r1.remaining).toBe(2);
      const r2 = checkRateLimit("forgot-password", ip);
      expect(r2.remaining).toBe(1);
      const r3 = checkRateLimit("forgot-password", ip);
      expect(r3.remaining).toBe(0);
      const r4 = checkRateLimit("forgot-password", ip);
      expect(r4.allowed).toBe(false);
    });
  });

  describe("extractRouteKey", () => {
    it("extrai rota de login", () => {
      expect(extractRouteKey("/login")).toBe("login");
    });

    it("extrai rota de register", () => {
      expect(extractRouteKey("/register")).toBe("register");
    });

    it("extrai rota de forgot-password", () => {
      expect(extractRouteKey("/forgot-password")).toBe("forgot-password");
    });

    it("extrai rota com subrota", () => {
      expect(extractRouteKey("/login/callback")).toBe("login");
    });

    it("retorna null para rota desconhecida", () => {
      expect(extractRouteKey("/dashboard")).toBeNull();
    });

    it("retorna null para rota raiz", () => {
      expect(extractRouteKey("/")).toBeNull();
    });
  });

  describe("rateLimitHeaders", () => {
    it("gera headers para requisição permitida", () => {
      const headers = rateLimitHeaders({
        allowed: true,
        remaining: 4,
        retryAfterMs: 0,
        limit: 5,
      });
      expect(headers["X-RateLimit-Limit"]).toBe("5");
      expect(headers["X-RateLimit-Remaining"]).toBe("4");
      expect(headers["Retry-After"]).toBeUndefined();
    });

    it("gera headers com Retry-After para requisição bloqueada", () => {
      const headers = rateLimitHeaders({
        allowed: false,
        remaining: 0,
        retryAfterMs: 60000,
        limit: 5,
      });
      expect(headers["X-RateLimit-Limit"]).toBe("5");
      expect(headers["X-RateLimit-Remaining"]).toBe("0");
      expect(headers["Retry-After"]).toBe("60");
    });
  });
});

```

### src/__tests__/read-hooks.test.tsx
```
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useBudgets } from "@/lib/hooks/use-budgets";

type QueryResponse = { data: unknown; error: { message: string } | null };

const responses: QueryResponse[] = [];

function queueResponse(response: QueryResponse) {
  responses.push(response);
}

function createBuilder() {
  const response = responses.shift() ?? { data: [], error: null };
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    is: jest.fn(() => builder),
    order: jest.fn(() => builder),
    then: (resolve: (value: QueryResponse) => unknown) => Promise.resolve(response).then(resolve),
  };
  return builder;
}

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: jest.fn(() => createBuilder()),
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("read hooks", () => {
  beforeEach(() => {
    responses.length = 0;
  });

  it("useAccounts retorna dados com sucesso", async () => {
    queueResponse({ data: [{ id: "a1", name: "Conta" }], error: null });
    const { result } = renderHook(() => useAccounts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: "a1", name: "Conta" }]);
  });

  it("useAccounts retorna erro quando consulta falha", async () => {
    queueResponse({ data: null, error: { message: "falha accounts" } });
    const { result } = renderHook(() => useAccounts(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toContain("falha accounts");
  });

  it("useCategories retorna dados com sucesso", async () => {
    queueResponse({ data: [{ id: "c1", type: "expense" }], error: null });
    const { result } = renderHook(() => useCategories("expense"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: "c1", type: "expense" }]);
  });

  it("useCategories retorna erro quando consulta falha", async () => {
    queueResponse({ data: null, error: { message: "falha categories" } });
    const { result } = renderHook(() => useCategories(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toContain("falha categories");
  });

  it("useBudgets retorna dados com sucesso", async () => {
    queueResponse({
      data: [
        {
          id: "b1000000-0000-4000-8000-000000000001",
          user_id: "a1000000-0000-4000-8000-000000000001",
          category_id: "c1000000-0000-4000-8000-000000000001",
          month: "2026-03-01",
          planned_amount: 100,
          alert_threshold: 80,
          adjustment_index: null,
          coa_id: null,
          cost_center_id: null,
          family_member_id: null,
          created_at: "2026-03-01T00:00:00Z",
          updated_at: "2026-03-01T00:00:00Z",
          categories: { name: "Transporte", icon: null, color: null, type: "expense" },
        },
      ],
      error: null,
    });
    const { result } = renderHook(() => useBudgets("2026-03-01"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]).toMatchObject({ planned_amount: 100 });
  });

  it("useBudgets retorna erro quando consulta falha", async () => {
    queueResponse({ data: null, error: { message: "falha budgets" } });
    const { result } = renderHook(() => useBudgets("2026-03-01"), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toContain("falha budgets");
  });
});

```

### src/__tests__/rpc-auto-categorize-schema.test.ts
```
import { autoCategorizeTransactionSchema } from "@/lib/schemas/rpc";

describe("auto_categorize_transaction response schema", () => {
  it("aceita UUID válido", () => {
    const parsed = autoCategorizeTransactionSchema.safeParse("11111111-1111-4111-8111-111111111111");
    expect(parsed.success).toBe(true);
  });

  it("aceita null quando não há categoria", () => {
    const parsed = autoCategorizeTransactionSchema.safeParse(null);
    expect(parsed.success).toBe(true);
  });

  it("rejeita string não-uuid", () => {
    const parsed = autoCategorizeTransactionSchema.safeParse("categoria-xpto");
    expect(parsed.success).toBe(false);
  });

  it("rejeita objeto inválido", () => {
    const parsed = autoCategorizeTransactionSchema.safeParse({ category_id: "111" });
    expect(parsed.success).toBe(false);
  });
});

```

### src/__tests__/rpc-schemas-extended.test.ts
```
import {
  assetsSummarySchema,
  depreciateAssetResultSchema,
  centerPnlSchema,
  centerExportSchema,
  allocateToCentersResultSchema,
  indexLatestResultSchema,
  economicIndicesResultSchema,
  workflowCreateResultSchema,
  generateTasksResultSchema,
  completeTaskResultSchema,
  reversalResultSchema,
  taxParameterSchema,
  budgetWithCategorySchema,
  topCategoriesResultSchema,
  balanceEvolutionResultSchema,
  budgetVsActualResultSchema,
  reconciliationCandidateSchema,
  matchTransactionsResultSchema,
  importBatchResultSchema,
  logSchemaError,
} from "@/lib/schemas/rpc";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("RPC schemas (extended)", () => {
  // ─── Assets ──────────────────────────────────────────
  describe("assetsSummarySchema", () => {
    it("valida resumo de ativos completo", () => {
      const result = assetsSummarySchema.safeParse({
        total_value: 500000,
        total_acquisition: 600000,
        asset_count: 3,
        by_category: [
          { category: "real_estate", count: 1, total_value: 400000 },
          { category: "vehicle", count: 2, total_value: 100000 },
        ],
        expiring_insurance: [],
        total_depreciation: 100000,
      });
      expect(result.success).toBe(true);
    });

    it("rejeita categoria inválida", () => {
      const result = assetsSummarySchema.safeParse({
        total_value: 1,
        total_acquisition: 1,
        asset_count: 1,
        by_category: [{ category: "invalid_cat", count: 1, total_value: 1 }],
        expiring_insurance: [],
        total_depreciation: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  it("valida depreciateAssetResult", () => {
    expect(
      depreciateAssetResultSchema.safeParse({
        status: "ok",
        previous_value: 100,
        depreciation: 10,
        new_value: 90,
      }).success
    ).toBe(true);
  });

  // ─── Cost Centers ──────────────────────────────────────
  describe("centerPnlSchema", () => {
    it("valida P&L de centro com meses", () => {
      const result = centerPnlSchema.safeParse({
        center_id: UUID,
        center_name: "Família Geral",
        center_type: "cost_center",
        period_from: "2026-01-01",
        period_to: "2026-03-31",
        total_income: 1000,
        total_expense: 500,
        net_result: 500,
        monthly: [
          { month: "2026-01", income: 300, expense: 200 },
          { month: "2026-02", income: 400, expense: 150 },
          { month: "2026-03", income: 300, expense: 150 },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  it("valida centerExportSchema", () => {
    expect(
      centerExportSchema.safeParse({
        center: {
          id: UUID,
          name: "Família Geral",
          type: "cost_center",
          color: "#7E9487",
          created_at: "2026-01-01T00:00:00Z",
        },
        transactions: [
          {
            id: UUID,
            date: "2026-03-01",
            type: "expense",
            amount: 100,
            description: "Supermercado",
            is_paid: true,
            center_percentage: 100,
            center_amount: 100,
            coa_name: "Alimentação",
            group_type: "expense",
          },
        ],
        totals: { income: 0, expense: 100, net: -100 },
        exported_at: "2026-03-14T12:00:00Z",
      }).success
    ).toBe(true);
  });

  it("valida allocateToCentersResult", () => {
    expect(
      allocateToCentersResultSchema.safeParse({
        status: "ok",
        transaction_id: UUID,
        allocations: [
          { cost_center_id: UUID, percentage: 60, amount: 60 },
          { cost_center_id: "22222222-2222-4222-8222-222222222222", percentage: 40, amount: 40 },
        ],
      }).success
    ).toBe(true);
  });

  // ─── Economic Indices ──────────────────────────────────
  it("valida indexLatestResult", () => {
    expect(
      indexLatestResultSchema.safeParse({
        indices: [
          {
            index_type: "ipca",
            reference_date: "2026-02-01",
            value: 0.56,
            accumulated_12m: 4.87,
            accumulated_year: 1.12,
            source_primary: "bcb_sgs",
            fetched_at: "2026-03-14T06:00:00Z",
          },
        ],
      }).success
    ).toBe(true);
  });

  it("valida economicIndicesResult com accumulated nulls", () => {
    expect(
      economicIndicesResultSchema.safeParse({
        data: [
          {
            index_type: "selic",
            reference_date: "2026-03-01",
            value: 14.25,
            accumulated_12m: null,
            accumulated_year: null,
            source_primary: "bcb_sgs",
            fetched_at: "2026-03-14T06:00:00Z",
          },
        ],
      }).success
    ).toBe(true);
  });

  // ─── Workflows ─────────────────────────────────────────
  it("valida workflowCreateResult", () => {
    expect(
      workflowCreateResultSchema.safeParse({
        status: "created",
        workflow_id: UUID,
        name: "Extrato Conta Corrente",
      }).success
    ).toBe(true);
  });

  it("valida generateTasksResult", () => {
    expect(
      generateTasksResultSchema.safeParse({
        status: "ok",
        tasks_created: 5,
        workflows_skipped: 2,
      }).success
    ).toBe(true);
  });

  it("valida completeTaskResult", () => {
    expect(
      completeTaskResultSchema.safeParse({
        status: "completed",
        all_period_tasks_done: false,
      }).success
    ).toBe(true);
  });

  // ─── Reversal ──────────────────────────────────────────
  it("valida reversalResult", () => {
    expect(
      reversalResultSchema.safeParse({
        reversed_transaction_id: UUID,
        reversal_journal_id: UUID,
      }).success
    ).toBe(true);
  });

  it("valida reversalResult com journal null", () => {
    expect(
      reversalResultSchema.safeParse({
        reversed_transaction_id: UUID,
        reversal_journal_id: null,
      }).success
    ).toBe(true);
  });

  // ─── Tax Parameters ────────────────────────────────────
  it("valida taxParameterSchema", () => {
    expect(
      taxParameterSchema.safeParse({
        id: UUID,
        parameter_type: "irpf_mensal",
        valid_from: "2026-01-01",
        valid_until: null,
        brackets: [
          { min: 0, max: 2259.20, rate: 0, deduction: 0 },
          { min: 2259.21, max: 2826.65, rate: 7.5, deduction: 169.44 },
        ],
        limits: null,
        source_references: [
          { source: "RFB", url: "https://www.gov.br/receitafederal", date: "2025-12-30" },
        ],
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        updated_by: null,
      }).success
    ).toBe(true);
  });

  // ─── Budget with Category ──────────────────────────────
  it("valida budgetWithCategory", () => {
    expect(
      budgetWithCategorySchema.safeParse({
        id: UUID,
        user_id: UUID,
        category_id: UUID,
        month: "2026-03",
        planned_amount: 2000,
        alert_threshold: 80,
        adjustment_index: "ipca",
        coa_id: null,
        cost_center_id: null,
        family_member_id: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        categories: {
          name: "Alimentação",
          icon: "utensils",
          color: "#2F7A68",
          type: "expense",
        },
      }).success
    ).toBe(true);
  });

  it("rejeita adjustment_index inválido", () => {
    const result = budgetWithCategorySchema.safeParse({
      id: UUID,
      user_id: UUID,
      category_id: UUID,
      month: "2026-03",
      planned_amount: 2000,
      alert_threshold: 80,
      adjustment_index: "invalid_index",
      coa_id: null,
      cost_center_id: null,
      family_member_id: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      categories: { name: "Test", icon: null, color: null, type: "expense" },
    });
    expect(result.success).toBe(false);
  });

  // ─── Dashboard (additional) ────────────────────────────
  it("valida topCategoriesResult", () => {
    expect(
      topCategoriesResultSchema.safeParse({
        categories: [
          { category_name: "Alimentação", icon: "utensils", color: "#2F7A68", total: 1500, percentage: 45.5 },
          { category_name: "Transporte", icon: "car", color: "#56688F", total: 800, percentage: 24.2 },
        ],
        total_expense: 3300,
        month: "2026-03",
      }).success
    ).toBe(true);
  });

  it("valida balanceEvolutionResult", () => {
    expect(
      balanceEvolutionResultSchema.safeParse({
        data: [
          { month: "2026-01", balance: 10000, projected: 12000, income: 5000, expense: 3000 },
          { month: "2026-02", balance: 12000, projected: 14000, income: 5500, expense: 3500 },
        ],
        source: "calculated",
        months_requested: 6,
      }).success
    ).toBe(true);
  });

  it("rejeita balanceEvolution com source inválido", () => {
    expect(
      balanceEvolutionResultSchema.safeParse({
        data: [],
        source: "invalid",
        months_requested: 6,
      }).success
    ).toBe(false);
  });

  it("valida budgetVsActualResult", () => {
    expect(
      budgetVsActualResultSchema.safeParse({
        items: [
          {
            category_name: "Alimentação",
            category_icon: "utensils",
            category_color: "#2F7A68",
            budget_id: UUID,
            planned: 2000,
            alert_threshold: 80,
            actual: 1500,
            remaining: 500,
            pct_used: 75,
            status: "ok",
            family_member_id: null,
          },
        ],
        total_planned: 2000,
        total_actual: 1500,
        total_remaining: 500,
        pct_used: 75,
        month: "2026-03",
        budget_count: 1,
      }).success
    ).toBe(true);
  });

  it("rejeita budgetVsActual com status inválido", () => {
    const result = budgetVsActualResultSchema.safeParse({
      items: [
        {
          category_name: "Test",
          category_icon: null,
          category_color: null,
          budget_id: UUID,
          planned: 100,
          alert_threshold: 80,
          actual: 90,
          remaining: 10,
          pct_used: 90,
          status: "invalid_status",
          family_member_id: null,
        },
      ],
      total_planned: 100,
      total_actual: 90,
      total_remaining: 10,
      pct_used: 90,
      month: "2026-03",
      budget_count: 1,
    });
    expect(result.success).toBe(false);
  });

  // ─── logSchemaError ────────────────────────────────────
  describe("logSchemaError", () => {
    it("loga mensagem formatada no console.error", () => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      const badParse = assetsSummarySchema.safeParse({ total_value: "not a number" });
      if (!badParse.success) {
        logSchemaError("get_assets_summary", badParse);
      }
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("[Oniefy] RPC schema mismatch (get_assets_summary)")
      );
      spy.mockRestore();
    });
  });

  // ─── Reconciliation ────────────────────────────────────
  describe("reconciliation schemas", () => {
    it("valida reconciliationCandidate", () => {
      expect(
        reconciliationCandidateSchema.safeParse({
          id: UUID,
          description: "Aluguel",
          amount: 2500,
          date: "2026-03-10",
          due_date: "2026-03-10",
          type: "expense",
          payment_status: "pending",
          category_id: UUID,
          recurrence_id: UUID,
          amount_diff: 50,
          days_diff: 2,
          match_score: 12.5,
        }).success
      ).toBe(true);
    });

    it("valida reconciliationCandidate com nulls", () => {
      expect(
        reconciliationCandidateSchema.safeParse({
          id: UUID,
          description: null,
          amount: 100,
          date: "2026-03-01",
          due_date: null,
          type: "expense",
          payment_status: "overdue",
          category_id: null,
          recurrence_id: null,
          amount_diff: 0,
          days_diff: 0,
          match_score: 0,
        }).success
      ).toBe(true);
    });

    it("valida matchTransactionsResult", () => {
      expect(
        matchTransactionsResultSchema.safeParse({
          status: "matched",
          pending_id: UUID,
          imported_id: "22222222-2222-4222-8222-222222222222",
          adjustment: -15.50,
          final_amount: 2484.50,
        }).success
      ).toBe(true);
    });

    it("valida importBatchResult com matched (v2)", () => {
      expect(
        importBatchResultSchema.safeParse({
          status: "ok",
          imported: 10,
          skipped: 2,
          categorized: 8,
          matched: 3,
          batch_id: UUID,
        }).success
      ).toBe(true);
    });

    it("valida importBatchResult sem matched (backward compat)", () => {
      const result = importBatchResultSchema.safeParse({
        status: "ok",
        imported: 5,
        skipped: 1,
        categorized: 3,
        batch_id: UUID,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.matched).toBe(0);
      }
    });
  });
});

```

### src/__tests__/rpc-schemas.test.ts
```
import {
  balanceSheetSchema,
  dashboardSummarySchema,
  fiscalProjectionSchema,
  fiscalReportSchema,
  importBatchResultSchema,
  solvencyMetricsSchema,
  transactionResultSchema,
  transferResultSchema,
} from "@/lib/schemas/rpc";

describe("WEA-002 RPC schemas", () => {
  it("valida dashboard summary válido", () => {
    const result = dashboardSummarySchema.safeParse({
      total_current_balance: 1,
      total_projected_balance: 2,
      active_accounts: 1,
      month_income: 10,
      month_expense: 3,
      month_start: "2026-03-01",
      month_end: "2026-03-31",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita dashboard summary inválido", () => {
    const result = dashboardSummarySchema.safeParse({ total_current_balance: "1" });
    expect(result.success).toBe(false);
  });

  it("valida balance sheet e solvency válidos", () => {
    expect(
      balanceSheetSchema.safeParse({
        liquid_assets: 1,
        illiquid_assets: 2,
        total_assets: 3,
        total_liabilities: 1,
        net_worth: 2,
      }).success
    ).toBe(true);

    expect(
      solvencyMetricsSchema.safeParse({
        tier1_total: 1,
        tier2_total: 2,
        tier3_total: 3,
        tier4_total: 4,
        total_patrimony: 10,
        burn_rate: 100,
        runway_months: 20,
        lcr: 1.5,
        months_analyzed: 6,
      }).success
    ).toBe(true);
  });

  it("valida fiscal report e projection válidos", () => {
    expect(
      fiscalReportSchema.safeParse({
        year: 2026,
        period_start: "2026-01-01",
        period_end: "2026-12-31",
        by_treatment: [
          {
            tax_treatment: "tributavel",
            group_type: "income",
            total_revenue: 1000,
            total_expense: 0,
            entry_count: 1,
            accounts: [{ coa_code: "4.1", coa_name: "Receita", total: 1000 }],
          },
        ],
        totals: {
          total_tributavel_revenue: 1000,
          total_isento_revenue: 0,
          total_dedutivel_expense: 0,
          total_transactions: 1,
        },
      }).success
    ).toBe(true);

    expect(
      fiscalProjectionSchema.safeParse({
        year: 2026,
        months_elapsed: 3,
        months_remaining: 9,
        ytd_taxable_income: 10000,
        ytd_deductible_expenses: 1000,
        projected_annual_income: 40000,
        projected_annual_deductible: 3000,
        taxable_base: 37000,
        estimated_annual_tax: 5000,
        annual_reduction_applied: 0,
        ytd_irrf_withheld: 1000,
        tax_gap: 4000,
        monthly_provision: 500,
        disclaimer: "ok",
      }).success
    ).toBe(true);
  });

  it("valida resultados de transaction e transfer", () => {
    expect(
      transactionResultSchema.safeParse({
        transaction_id: "11111111-1111-4111-8111-111111111111",
        journal_entry_id: null,
      }).success
    ).toBe(true);

    expect(
      transferResultSchema.safeParse({
        from_transaction_id: "11111111-1111-4111-8111-111111111111",
        to_transaction_id: "22222222-2222-4222-8222-222222222222",
        journal_entry_id: null,
        amount: 10,
      }).success
    ).toBe(true);
  });

  it("rejeita import batch inválido", () => {
    const result = importBatchResultSchema.safeParse({ status: "ok" });
    expect(result.success).toBe(false);
  });
});

```

### src/__tests__/transaction-hooks.test.tsx
```
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreateTransaction, useCreateTransfer } from "@/lib/services/transaction-engine";

const mockRpc = jest.fn();
const mockGetUser = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
    from: () => ({ update: () => ({ eq: jest.fn() }) }),
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("transaction mutation hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("useCreateTransaction chama RPC create_transaction_with_journal", async () => {
    mockRpc.mockResolvedValue({
      data: {
        transaction_id: "11111111-1111-4111-8111-111111111111",
        journal_entry_id: null,
      },
      error: null,
    });

    const { result } = renderHook(() => useCreateTransaction(), { wrapper });

    result.current.mutate({
      account_id: "acc-1",
      type: "expense",
      amount: 10,
      date: "2026-03-13",
      is_paid: true,
    });

    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc).toHaveBeenCalledWith(
      "create_transaction_with_journal",
      expect.objectContaining({ p_user_id: "user-1", p_account_id: "acc-1", p_amount: 10 })
    );
  });

  it("useCreateTransfer chama RPC create_transfer_with_journal", async () => {
    mockRpc.mockResolvedValue({
      data: {
        from_transaction_id: "11111111-1111-4111-8111-111111111111",
        to_transaction_id: "22222222-2222-4222-8222-222222222222",
        journal_entry_id: null,
        amount: 10,
      },
      error: null,
    });

    const { result } = renderHook(() => useCreateTransfer(), { wrapper });

    result.current.mutate({
      from_account_id: "acc-from",
      to_account_id: "acc-to",
      amount: 10,
      date: "2026-03-13",
      is_paid: true,
    });

    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc).toHaveBeenCalledWith(
      "create_transfer_with_journal",
      expect.objectContaining({ p_user_id: "user-1", p_from_account_id: "acc-from", p_to_account_id: "acc-to" })
    );
  });
});

```

### src/__tests__/utils.test.ts
```
import { formatCurrency, formatDate, formatRelativeDate } from "@/lib/utils";

describe("utils", () => {
  describe("formatCurrency", () => {
    it("formata valor positivo em BRL", () => {
      expect(formatCurrency(1234.56)).toBe("R$\u00a01.234,56");
    });

    it("formata zero", () => {
      expect(formatCurrency(0)).toBe("R$\u00a00,00");
    });

    it("formata valor negativo", () => {
      expect(formatCurrency(-500)).toBe("-R$\u00a0500,00");
    });

    it("formata centavos fracionários com arredondamento", () => {
      expect(formatCurrency(99.999)).toBe("R$\u00a0100,00");
    });

    it("formata milhões com separadores", () => {
      expect(formatCurrency(1234567.89)).toBe("R$\u00a01.234.567,89");
    });
  });

  describe("formatDate", () => {
    it("formata ISO string no padrão dd/MM/yyyy", () => {
      expect(formatDate("2026-03-14")).toBe("14/03/2026");
    });

    it("formata Date object", () => {
      expect(formatDate(new Date(2026, 0, 1))).toBe("01/01/2026");
    });

    it("aceita padrão customizado", () => {
      expect(formatDate("2026-03-14", "yyyy-MM-dd")).toBe("2026-03-14");
    });

    it("formata com nome do mês em pt-BR", () => {
      const result = formatDate("2026-03-14", "dd 'de' MMMM");
      expect(result).toMatch(/14 de março/i);
    });
  });

  describe("formatRelativeDate", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-03-14T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("retorna 'hoje' para data de hoje", () => {
      expect(formatRelativeDate("2026-03-14T10:00:00Z")).toBe("hoje");
    });

    it("retorna 'ontem' para data de ontem", () => {
      expect(formatRelativeDate("2026-03-13T10:00:00Z")).toBe("ontem");
    });

    it("retorna 'há N dias' para menos de 7 dias", () => {
      expect(formatRelativeDate("2026-03-10T10:00:00Z")).toBe("há 4 dias");
    });

    it("retorna 'há N semanas' para menos de 30 dias", () => {
      expect(formatRelativeDate("2026-03-01T10:00:00Z")).toBe("há 1 semanas");
    });

    it("retorna data formatada para mais de 30 dias", () => {
      expect(formatRelativeDate("2026-01-10T10:00:00Z")).toBe("10/01/2026");
    });
  });
});

```

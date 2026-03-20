"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Building,
  Upload,
  Settings,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSessionTimeout } from "@/lib/auth/use-session-timeout";
import { useAppLifecycle } from "@/lib/auth/use-app-lifecycle";
import { clearEncryptionKey } from "@/lib/auth/encryption-manager";
import { clearAuthCache } from "@/lib/supabase/cached-auth";
import { useAuthInit } from "@/lib/hooks/use-auth-init";
import { useOnlineStatus, useServiceWorker } from "@/lib/hooks/use-online-status";
import { usePrivacyStore } from "@/lib/stores/privacy";

/**
 * Navigation 6+1 (UX-H1-01 + P2)
 * 6 primary items + Settings icon separated at bottom.
 * Importar promoted to sidebar per adendo v1.5 §2.6.
 */
const NAV_MAIN: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/transactions", label: "Transações", icon: ArrowLeftRight },
  { href: "/connections", label: "Importar", icon: Upload },
  { href: "/accounts", label: "Contas", icon: Wallet },
  { href: "/budgets", label: "Orçamento", icon: PieChart },
  { href: "/assets", label: "Patrimônio", icon: Building },
];

/** Routes that belong to Settings (highlight Settings icon when active) */
const SETTINGS_ROUTES = [
  "/settings", "/categories", "/chart-of-accounts", "/cost-centers",
  "/family", "/bills", "/workflows", "/tax", "/indices",
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

  // Close sidebar on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [sidebarOpen]);

  // Session timeout (30min inactivity)
  useSessionTimeout();

  // DEK lifecycle: purge on background, restore on foreground (Capacitor iOS)
  // On web: no-op. On native: manages encryption key memory safety.
  useAppLifecycle();

  const { ready, userName } = useAuthInit(pathname);
  const isOnline = useOnlineStatus();
  useServiceWorker();
  const { valuesHidden, toggleValues } = usePrivacyStore();

  // Auth state change listener (token refresh no longer requires encryption rotation)
  // KEK is derived from stable kek_material, not JWT - no re-wrap needed.

  async function handleLogout() {
    clearEncryptionKey();
    clearAuthCache();
    // Clear Service Worker cache on logout (prevent stale session data)
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" });
    }
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
      {/* Skip to content (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Ir para conteúdo
      </a>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          key="sidebar-overlay"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSidebarOpen(false); }}
          role="button"
          aria-label="Fechar menu"
          tabIndex={0}
        />
      )}

      {/* Sidebar */}
      <aside
        role={sidebarOpen ? "dialog" : undefined}
        aria-modal={sidebarOpen ? true : undefined}
        aria-label={sidebarOpen ? "Menu de navegação" : undefined}
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r bg-card transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header: brand + user + logout */}
        <div className="flex-shrink-0 border-b px-4 py-5">
          <Image
            src="/brand/lockup-h-plum-transparent.svg"
            alt="Oniefy"
            width={1588}
            height={617}
            className="h-auto w-full dark:hidden"
            priority
            unoptimized
          />
          <Image
            src="/brand/lockup-h-bone-transparent.svg"
            alt="Oniefy"
            width={1588}
            height={617}
            className="hidden h-auto w-full dark:block"
            priority
            unoptimized
          />
          {userName && (
            <div className="mt-2 flex items-center justify-between">
              <p className="truncate text-xs text-muted-foreground">{userName}</p>
              <div className="flex items-center gap-0.5">
                <button type="button"
                  onClick={toggleValues}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title={valuesHidden ? "Exibir valores" : "Ocultar valores"}
                  aria-label={valuesHidden ? "Exibir valores financeiros" : "Ocultar valores financeiros"}
                >
                  {valuesHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button type="button"
                  onClick={handleLogout}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Sair"
                  aria-label="Sair"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto p-4">
          <div className="flex-1 space-y-1">
            {NAV_MAIN.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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
          </div>

          {/* Settings - separated at bottom */}
          <div className="border-t pt-3">
            <Link
              href="/settings"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                SETTINGS_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              Configurações
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main id="main-content" className="flex-1">
        {/* Mobile header */}
        <header className="flex h-16 items-center border-b px-4 lg:hidden">
          <button type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent"
            aria-label="Abrir menu"
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

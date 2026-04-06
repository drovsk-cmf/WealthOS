"use client";

import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  ArrowLeftRight,
  TrendingUp,
  CreditCard,
  Building,
  Landmark,
  Wallet,
  PieChart,
  Target,
  Receipt,
  Repeat,
  Activity,
  Calculator,
  BarChart3,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  Bell,
  CircleUser,
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
import { OnieLoader } from "@/components/ui/onie-loader";
import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";
import { NotificationPanel } from "@/components/navigation/notification-panel";
import { useNotificationItems } from "@/lib/hooks/use-notification-items";

/**
 * Navigation v3 (UX sidebar audit)
 *
 * Desktop: Sidebar with 4 semantic sections (Finanças, Patrimônio, Planejamento, Inteligência)
 *          + Settings pinned at bottom. Low-frequency items moved to /settings hub.
 * Mobile:  Top header (brand + privacy + sininho) + bottom tab bar (5 tabs).
 */

/* ------------------------------------------------------------------ */
/*  Desktop sidebar sections                                          */
/* ------------------------------------------------------------------ */

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const SIDEBAR_SECTIONS: NavSection[] = [
  {
    items: [{ href: "/dashboard", label: "Início", icon: Home }],
  },
  {
    title: "Finanças",
    items: [
      { href: "/cash-flow", label: "Fluxo de Caixa", icon: TrendingUp },
      { href: "/bills", label: "Contas a Pagar", icon: Repeat },
      { href: "/transactions", label: "Transações", icon: ArrowLeftRight },
      { href: "/cards", label: "Cartões de Crédito", icon: CreditCard },
      { href: "/loans", label: "Empréstimos", icon: Landmark },
    ],
  },
  {
    title: "Patrimônio",
    items: [
      { href: "/accounts", label: "Contas Bancárias", icon: Wallet },
      { href: "/investments", label: "Investimentos", icon: TrendingUp },
      { href: "/assets", label: "Bens e Direitos", icon: Building },
    ],
  },
  {
    title: "Planejamento",
    items: [
      { href: "/budgets", label: "Orçamento", icon: PieChart },
      { href: "/goals", label: "Metas", icon: Target },
      { href: "/tax", label: "Imposto de Renda", icon: Receipt },
    ],
  },
  {
    title: "Inteligência",
    items: [
      { href: "/diagnostics", label: "Diagnóstico", icon: Activity },
      { href: "/calculators", label: "Simuladores", icon: Calculator },
      { href: "/indices", label: "Indicadores", icon: BarChart3 },
    ],
  },
];

function isItemActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const supabase = createClient();

  useSessionTimeout();
  useAppLifecycle();

  const { ready, userName } = useAuthInit(pathname);
  const isOnline = useOnlineStatus();
  useServiceWorker();
  const { valuesHidden, toggleValues } = usePrivacyStore();

  // Notification bell (E22)
  const notifications = useNotificationItems();
  const pendingCount = notifications.actionCount;
  const hasInfo = notifications.infoCount > 0;
  const [bellOpen, setBellOpen] = useState(false);

  // Mobile avatar dropdown (C3)
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!avatarOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [avatarOpen]);

  async function handleLogout() {
    clearEncryptionKey();
    clearAuthCache();
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" });
    }
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <OnieLoader size="lg" state="processing" />
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

      {/* ============================================================ */}
      {/*  Desktop sidebar                                             */}
      {/* ============================================================ */}
      <aside
        aria-label="Menu de navegação"
        className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col bg-[hsl(var(--sidebar-bg))] lg:flex lg:sticky lg:top-0 lg:z-auto lg:h-screen"
      >
        {/* Brand + user */}
        <div className="flex-shrink-0 border-b border-[hsl(var(--sidebar-fg)/0.15)] px-4 py-5">
          <Image
            src="/brand/lockup-h-bone-transparent.svg"
            alt="Oniefy"
            width={1588}
            height={617}
            className="h-auto w-full"
            priority
            unoptimized
          />
          {userName && (
            <div className="mt-2 flex items-center justify-between">
              <p className="truncate text-xs text-[hsl(var(--sidebar-fg)/0.6)]">
                {userName}
              </p>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={toggleValues}
                  className="rounded-md p-1.5 text-[hsl(var(--sidebar-fg)/0.6)] transition-colors hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-fg))]"
                  title={valuesHidden ? "Exibir valores" : "Ocultar valores"}
                  aria-label={valuesHidden ? "Exibir valores financeiros" : "Ocultar valores financeiros"}
                >
                  {valuesHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md p-1.5 text-[hsl(var(--sidebar-fg)/0.6)] transition-colors hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-fg))]"
                  title="Sair"
                  aria-label="Sair"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Grouped navigation */}
        <nav className="flex flex-1 flex-col overflow-y-auto p-3">
          <div className="flex-1 space-y-4">
            {SIDEBAR_SECTIONS.map((section, si) => (
              <div key={si}>
                {section.title && (
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--sidebar-fg)/0.65)]">
                    {section.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isItemActive(item.href, pathname);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={`${si}-${item.href}`}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-fg))] font-semibold"
                            : "text-[hsl(var(--sidebar-fg)/0.7)] hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-fg))]"
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Settings at bottom */}
          <div className="border-t border-[hsl(var(--sidebar-fg)/0.15)] pt-3">
            <Link
              href="/settings"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isItemActive("/settings", pathname)
                  ? "bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-fg))] font-semibold"
                  : "text-[hsl(var(--sidebar-fg)/0.7)] hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-fg))]"
              }`}
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              Configurações
            </Link>
          </div>
        </nav>
      </aside>

      {/* ============================================================ */}
      {/*  Main content                                                */}
      {/* ============================================================ */}
      <main id="main-content" className="relative flex-1">
        {/* Sidebar glow edge (desktop only) */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-10 lg:block"
          style={{
            background:
              "linear-gradient(to right, hsl(273 30% 25% / 0.12), transparent)",
          }}
        />

        {/* Mobile header (C3): logomark (left) + sininho + avatar (right) */}
        <header className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
          {/* Logomark: symbol only, bigger impact */}
          <Image
            src="/brand/logomark-plum-transparent.svg"
            alt="Oniefy"
            width={200}
            height={200}
            className="h-8 w-8"
            priority
            unoptimized
          />

          <div className="flex items-center gap-1">
            {/* Sininho (E22) */}
            <button
              type="button"
              onClick={() => setBellOpen(true)}
              className="relative rounded-md p-2 text-muted-foreground hover:bg-accent"
              aria-label={`Pendências${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
            >
              <Bell className="h-5 w-5" />
              {pendingCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              ) : hasInfo ? (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
              ) : null}
            </button>

            {/* Avatar dropdown: user identity hub (C1 + C3) */}
            <div ref={avatarRef} className="relative">
              <button
                type="button"
                onClick={() => setAvatarOpen((v) => !v)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-accent"
                aria-label="Menu do usuário"
                aria-expanded={avatarOpen}
              >
                <CircleUser className="h-6 w-6" />
              </button>

              {avatarOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border bg-card shadow-lg">
                  {/* User identity */}
                  {userName && (
                    <div className="border-b px-4 py-3">
                      <p className="truncate text-sm font-medium">{userName}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="p-1.5">
                    {/* Privacy toggle */}
                    <button
                      type="button"
                      onClick={() => { toggleValues(); setAvatarOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                    >
                      {valuesHidden ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      {valuesHidden ? "Exibir valores" : "Ocultar valores"}
                    </button>

                    {/* Settings */}
                    <Link
                      href="/settings"
                      onClick={() => setAvatarOpen(false)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Configurações
                    </Link>
                  </div>

                  {/* Logout (C1) */}
                  <div className="border-t p-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Desktop sininho (E22, top-right, persistent) */}
        <div className="absolute right-6 top-10 z-20 hidden lg:block">
          <button
            type="button"
            onClick={() => setBellOpen(true)}
            className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent"
            aria-label={`Pendências${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
          >
            <Bell className="h-5 w-5" />
            {pendingCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            ) : hasInfo ? (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
            ) : null}
          </button>
        </div>

        {/* Content area — pb-24 on mobile for bottom tab bar clearance */}
        <div className="px-6 pb-24 pt-8 sm:px-8 lg:px-10 lg:pb-8 lg:pt-10">
          {!isOnline && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-burnished/30 bg-burnished/10 px-4 py-2.5 text-sm text-burnished">
              <svg
                className="h-4 w-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M15.536 8.464a5 5 0 010 7.072M8.464 15.536a5 5 0 010-7.072"
                />
              </svg>
              <span>
                Sem conexão. Dados em cache disponíveis, alterações serão
                sincronizadas ao reconectar.
              </span>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* ============================================================ */}
      {/*  Notification panel (E22)                                    */}
      {/* ============================================================ */}
      <NotificationPanel
        items={notifications.items}
        actionCount={notifications.actionCount}
        isLoading={notifications.isLoading}
        open={bellOpen}
        onClose={() => setBellOpen(false)}
      />

      {/* ============================================================ */}
      {/*  Mobile bottom tab bar                                       */}
      {/* ============================================================ */}
      <BottomTabBar />
    </div>
  );
}

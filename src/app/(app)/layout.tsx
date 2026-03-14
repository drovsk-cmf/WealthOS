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

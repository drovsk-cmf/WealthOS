"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
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
import { clearEncryptionKey, loadEncryptionKey } from "@/lib/auth/encryption-manager";
import { getAssuranceLevel, getMfaStatus } from "@/lib/auth/mfa";

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
  const [userName, setUserName] = useState<string>("");
  const [ready, setReady] = useState(false);

  const supabase = createClient();

  // Session timeout (30min inactivity)
  useSessionTimeout();

  // On mount: verify AAL2 and load encryption key
  useEffect(() => {
    async function init() {
      try {
        // Check MFA status
        const { status } = await getMfaStatus(supabase);

        if (status === "enrolled_verified") {
          const { currentLevel, nextLevel } = await getAssuranceLevel(supabase);

          if (currentLevel === "aal1" && nextLevel === "aal2") {
            // Need MFA verification - redirect
            const { factorId } = await getMfaStatus(supabase);
            router.push(
              `/mfa-challenge?redirectTo=${encodeURIComponent(pathname)}&factorId=${factorId}`
            );
            return;
          }
        }

        // Load DEK into memory
        try {
          await loadEncryptionKey(supabase);
        } catch {
          console.warn("[Oniefy] DEK load failed - E2E fields unavailable");
        }

        // Get user name for sidebar
        const { data: { user } } = await supabase.auth.getUser();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <Logo variant="lockup" height={24} />
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
          <Logo variant="lockup" height={20} className="ml-3" />
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

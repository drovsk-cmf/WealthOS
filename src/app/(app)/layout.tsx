"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSessionTimeout } from "@/lib/auth/use-session-timeout";
import { clearEncryptionKey, loadEncryptionKey } from "@/lib/auth/encryption-manager";
import { getAssuranceLevel, getMfaStatus } from "@/lib/auth/mfa";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/transactions", label: "Transações", icon: "ArrowLeftRight" },
  { href: "/accounts", label: "Contas", icon: "Wallet" },
  { href: "/categories", label: "Categorias", icon: "Tag" },
  { href: "/budgets", label: "Orçamento", icon: "PieChart" },
  { href: "/bills", label: "Contas a Pagar", icon: "Calendar" },
  { href: "/assets", label: "Patrimônio", icon: "Building" },
  { href: "/tax", label: "Fiscal", icon: "FileText" },
  { href: "/settings", label: "Configurações", icon: "Settings" },
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
          console.warn("[WealthOS] DEK load failed - E2E fields unavailable");
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

  // Listen for token refresh to rotate encryption key
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "TOKEN_REFRESHED") {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const { rotateEncryptionKey } = await import("@/lib/auth/encryption-manager");
            await rotateEncryptionKey(supabase, session.access_token);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-card transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-lg font-bold">WealthOS</h1>
        </div>

        <nav className="space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
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
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full border-t p-4">
          {userName && (
            <p className="mb-2 truncate px-3 text-xs text-muted-foreground">
              {userName}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sair
          </button>
        </div>
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
          <span className="ml-3 text-lg font-bold">WealthOS</span>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ArrowLeftRight,
  Building,
  PieChart,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Bottom tab bar for mobile (5 tabs).
 * v3: Início, Finanças, Patrimônio, Planejamento, Inteligência.
 * Low-frequency items (settings, import, categories) accessible via header gear icon.
 * Desktop: hidden (sidebar takes over).
 */

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Additional routes that should highlight this tab */
  matchPrefixes?: string[];
}

const TABS: Tab[] = [
  {
    href: "/dashboard",
    label: "Início",
    icon: Home,
  },
  {
    href: "/transactions",
    label: "Finanças",
    icon: ArrowLeftRight,
    matchPrefixes: ["/cash-flow", "/bills"],
  },
  {
    href: "/accounts",
    label: "Patrimônio",
    icon: Building,
    matchPrefixes: ["/cards", "/assets", "/loans", "/investments"],
  },
  {
    href: "/budgets",
    label: "Planejamento",
    icon: PieChart,
    matchPrefixes: ["/goals", "/tax"],
  },
  {
    href: "/diagnostics",
    label: "Inteligência",
    icon: Activity,
    matchPrefixes: ["/calculators", "/indices"],
  },
];

function isTabActive(tab: Tab, pathname: string): boolean {
  if (pathname === tab.href || pathname.startsWith(tab.href + "/")) return true;
  if (tab.matchPrefixes) {
    return tab.matchPrefixes.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
  }
  return false;
}

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden"
      role="tablist"
      aria-label="Navegação principal"
    >
      {/* Safe area padding for notched devices */}
      <div className="flex items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const active = isTabActive(tab, pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={active}
              aria-label={tab.label}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

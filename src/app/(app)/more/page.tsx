"use client";

import Link from "next/link";
import {
  Receipt,
  Activity,
  Calculator,
  CreditCard,
  FileText,
  Users,
  Upload,
  Tag,
  Settings,
  TrendingUp,
  BarChart3,
  Landmark,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * "Mais" hub page — Tab 5 per NAVIGATION-SPEC.md.
 * Organized grid of secondary features. Impostos is the first item with visual emphasis.
 */

interface HubItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Whether this item gets visual emphasis */
  highlight?: boolean;
}

const HUB_ITEMS: HubItem[] = [
  {
    href: "/tax",
    label: "Impostos / IRPF",
    description: "Declaração, deduções e calendário fiscal",
    icon: Receipt,
    highlight: true,
  },
  {
    href: "/diagnostics",
    label: "Diagnóstico financeiro",
    description: "11 métricas de saúde patrimonial",
    icon: Activity,
  },
  {
    href: "/calculators",
    label: "Calculadoras",
    description: "TVM, CET, SAC vs Price e mais",
    icon: Calculator,
  },
  {
    href: "/cash-flow",
    label: "Fluxo de caixa",
    description: "Receitas e despesas por período",
    icon: TrendingUp,
  },
  {
    href: "/bills",
    label: "Contas a pagar",
    description: "Assinaturas e recorrências",
    icon: CreditCard,
  },
  {
    href: "/indices",
    label: "Índices econômicos",
    description: "CDI, Selic, IPCA, IGP-M",
    icon: BarChart3,
  },
  {
    href: "/connections",
    label: "Importação",
    description: "Importar extratos e faturas",
    icon: Upload,
  },
  {
    href: "/goals",
    label: "Metas",
    description: "Objetivos de poupança",
    icon: Landmark,
  },
  {
    href: "/family",
    label: "Família",
    description: "Membros e dependentes",
    icon: Users,
  },
  {
    href: "/categories",
    label: "Categorias",
    description: "Plano de contas e centros de custo",
    icon: Tag,
  },
  {
    href: "/workflows",
    label: "Relatórios",
    description: "Exportações e workflows",
    icon: FileText,
  },
  {
    href: "/more/warranties",
    label: "Garantias",
    description: "Rastreie garantias de produtos",
    icon: Shield,
  },
  {
    href: "/settings",
    label: "Configurações",
    description: "Perfil, segurança e preferências",
    icon: Settings,
  },
];

export default function MorePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mais</h1>
        <p className="text-sm text-muted-foreground">
          Ferramentas, relatórios e configurações
        </p>
      </div>

      <div className="grid gap-2">
        {HUB_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-colors hover:bg-accent ${
                item.highlight
                  ? "border-primary/30 bg-primary/5"
                  : "border-border"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  item.highlight
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    item.highlight ? "text-primary" : ""
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

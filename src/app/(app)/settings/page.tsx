"use client";

/**
 * Oniefy - Settings Hub (UX-H1-01 + P3)
 *
 * 5 subcategories (reorganizadas adendo v1.5 §2.2):
 * - Pessoal: perfil, notificações
 * - Estrutura e Cadastros: categorias, divisões, família
 * - Finanças: contas a pagar, imposto de renda
 * - Dados: exportação e privacidade
 * - Avançado: plano de contas, índices, métricas
 * - Segurança: MFA, sessões, exclusão de conta
 *
 * Importação removida (promovida à sidebar em P2).
 * Tarefas removidas (acessível via /workflows e dashboard).
 */

import Link from "next/link";
import {
  User,
  Shield,
  Database,
  Bell,
  Tag,
  Target,
  Users,
  BookOpen,
  TrendingUp,
  FileText,
  Calendar,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SettingsItem {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
  ready: boolean;
}

interface SettingsGroup {
  title: string;
  items: SettingsItem[];
}

const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: "Pessoal",
    items: [
      { href: "/settings/profile", icon: User, label: "Perfil", description: "Nome, senha, moeda padrão", ready: true },
      { href: "/settings/notifications", icon: Bell, label: "Notificações", description: "Push, alertas, lembretes", ready: true },
    ],
  },
  {
    title: "Estrutura e Cadastros",
    items: [
      { href: "/categories", icon: Tag, label: "Categorias", description: "Gerenciar categorias de receita e despesa", ready: true },
      { href: "/cost-centers", icon: Target, label: "Divisões", description: "Pessoas, projetos e atividades", ready: true },
      { href: "/family", icon: Users, label: "Estrutura Familiar", description: "Membros da família e alocações", ready: true },
    ],
  },
  {
    title: "Finanças",
    items: [
      { href: "/bills", icon: Calendar, label: "Contas a Pagar", description: "Gerenciar pendências e vencimentos", ready: true },
      { href: "/tax", icon: FileText, label: "Imposto de Renda", description: "Consolidação fiscal e provisionamento IR", ready: true },
    ],
  },
  {
    title: "Dados",
    items: [
      { href: "/settings/data", icon: Database, label: "Dados e Privacidade", description: "Exportar dados, política de privacidade", ready: true },
    ],
  },
  {
    title: "Avançado",
    items: [
      { href: "/chart-of-accounts", icon: BookOpen, label: "Plano de Contas", description: "Estrutura contábil (uso avançado)", ready: true },
      { href: "/indices", icon: TrendingUp, label: "Índices Econômicos", description: "IPCA, Selic, CDI, câmbio", ready: true },
      { href: "/settings/analytics", icon: BarChart3, label: "Métricas", description: "Retenção, eventos e volume de dados", ready: true },
    ],
  },
  {
    title: "Segurança",
    items: [
      { href: "/settings/security", icon: Shield, label: "Segurança", description: "MFA, sessões, exclusão de conta", ready: true },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seu perfil, estrutura financeira e preferências do sistema.
        </p>
      </div>

      {SETTINGS_GROUPS.map((group) => (
        <div key={group.title} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </h2>
          <div className="space-y-1.5">
            {group.items.map((item) => {
              const Icon = item.icon;

              if (!item.ready) {
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border bg-card p-4 opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Em breve</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
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
      ))}
    </div>
  );
}

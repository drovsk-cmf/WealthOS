"use client";

/**
 * Oniefy - Settings Hub (Navigation v3)
 *
 * Central hub for low-frequency configuration and administrative pages.
 * High-value features (Diagnóstico, Calculadoras, Indicadores, Impostos,
 * Recorrências) live in the sidebar proper. This page houses everything
 * the user configures once and revisits rarely.
 */

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { clearEncryptionKey } from "@/lib/auth/encryption-manager";
import { clearAuthCache } from "@/lib/supabase/cached-auth";
import {
  User,
  Shield,
  Database,
  Bell,
  Tag,
  Target,
  Users,
  BookOpen,
  Upload,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  LogOut,
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
    title: "Cadastros",
    items: [
      { href: "/categories", icon: Tag, label: "Categorias", description: "Gerenciar categorias de receita e despesa", ready: true },
      { href: "/cost-centers", icon: Target, label: "Divisões", description: "Pessoas, projetos e atividades", ready: true },
      { href: "/family", icon: Users, label: "Estrutura familiar", description: "Membros da família e alocações", ready: true },
      { href: "/more/warranties", icon: ShieldCheck, label: "Garantias", description: "Rastrear garantias de produtos e equipamentos", ready: true },
    ],
  },
  {
    title: "Dados",
    items: [
      { href: "/connections", icon: Upload, label: "Importação", description: "Importar extratos, cadastro em massa, conciliação", ready: true },
      { href: "/workflows", icon: ClipboardList, label: "Tarefas", description: "Checklist de pendências e rotinas periódicas", ready: true },
      { href: "/settings/data", icon: Database, label: "Dados e privacidade", description: "Exportar dados, política de privacidade", ready: true },
    ],
  },
  {
    title: "Avançado",
    items: [
      { href: "/chart-of-accounts", icon: BookOpen, label: "Estrutura contábil", description: "Plano de contas (uso avançado)", ready: true },
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
  const supabase = createClient();

  async function handleLogout() {
    clearEncryptionKey();
    clearAuthCache();
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" });
    }
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

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

      {/* Logout (C1: acessível em todas as plataformas) */}
      <div className="border-t pt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-between rounded-lg border border-destructive/20 bg-card p-4 text-destructive transition-colors hover:bg-destructive/5"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5" />
            <div className="text-left">
              <p className="text-sm font-medium">Sair</p>
              <p className="text-xs text-destructive/70">Encerrar sessão neste dispositivo</p>
            </div>
          </div>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

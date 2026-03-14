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

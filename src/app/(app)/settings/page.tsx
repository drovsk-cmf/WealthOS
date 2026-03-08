"use client";

import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>

      <div className="space-y-3">
        <Link href="/settings/security"
          className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
          <div>
            <p className="text-sm font-medium">Segurança</p>
            <p className="text-xs text-muted-foreground">MFA, sessões, exclusão de conta</p>
          </div>
          <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Future settings sections placeholder */}
        <div className="flex items-center justify-between rounded-lg border bg-card p-4 opacity-50">
          <div>
            <p className="text-sm font-medium">Perfil</p>
            <p className="text-xs text-muted-foreground">Nome, email, moeda padrão</p>
          </div>
          <span className="text-xs text-muted-foreground">Em breve</span>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-card p-4 opacity-50">
          <div>
            <p className="text-sm font-medium">Notificações</p>
            <p className="text-xs text-muted-foreground">Push, alertas, lembretes</p>
          </div>
          <span className="text-xs text-muted-foreground">Em breve</span>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-card p-4 opacity-50">
          <div>
            <p className="text-sm font-medium">Dados e Privacidade</p>
            <p className="text-xs text-muted-foreground">Exportar dados, política de privacidade</p>
          </div>
          <span className="text-xs text-muted-foreground">Em breve</span>
        </div>
      </div>
    </div>
  );
}

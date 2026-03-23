"use client";

/**
 * Oniefy - Notification Settings (CFG-04)
 *
 * Toggle web push notifications for:
 * - Bills due / overdue alerts
 * - Budget threshold warnings
 * - Workflow task reminders
 *
 * Uses Web Push API (VAPID). Subscription stored in notification_tokens.
 */

import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Bell, BellOff, Send } from "lucide-react";
import { usePushNotifications } from "@/lib/hooks/use-push-notifications";

export default function NotificationsPage() {
  const push = usePushNotifications();

  async function handleToggle() {
    try {
      if (push.subscribed) {
        await push.unsubscribe();
        toast.success("Notificações desativadas.");
      } else {
        await push.subscribe();
        toast.success("Notificações ativadas!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao configurar notificações.");
    }
  }

  async function handleTest() {
    try {
      await push.testNotification();
      toast.success("Notificação de teste enviada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar teste.");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Back */}
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Configurações
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Receba alertas sobre contas a vencer, orçamentos e tarefas pendentes.
        </p>
      </div>

      {/* Push toggle card */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          {push.subscribed ? (
            <Bell className="h-5 w-5 text-verdant" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold">Notificações push</p>
            <p className="text-xs text-muted-foreground">
              {push.loading
                ? "Verificando..."
                : !push.supported
                  ? "Seu navegador não suporta notificações push."
                  : push.permission === "denied"
                    ? "Permissão bloqueada. Reative nas configurações do navegador."
                    : push.subscribed
                      ? "Ativas neste dispositivo."
                      : "Desativadas."}
            </p>
          </div>

          {push.supported && push.permission !== "denied" && (
            <button
              type="button"
              onClick={handleToggle}
              disabled={push.loading || push.isSubscribing || push.isUnsubscribing}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                push.subscribed
                  ? "border hover:bg-accent"
                  : "btn-cta text-primary-foreground"
              } disabled:opacity-50`}
            >
              {push.isSubscribing
                ? "Ativando..."
                : push.isUnsubscribing
                  ? "Desativando..."
                  : push.subscribed
                    ? "Desativar"
                    : "Ativar"}
            </button>
          )}
        </div>

        {/* Test button */}
        {push.subscribed && (
          <button
            type="button"
            onClick={handleTest}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            <Send className="h-3 w-3" />
            Enviar notificação de teste
          </button>
        )}
      </div>

      {/* Notification types info */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold">Tipos de alerta</p>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex gap-2">
            <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-terracotta" />
            <p>Contas vencidas ou prestes a vencer (diário, automático)</p>
          </div>
          <div className="flex gap-2">
            <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-burnished" />
            <p>Orçamento próximo do limite (ao atingir o threshold configurado)</p>
          </div>
          <div className="flex gap-2">
            <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
            <p>Tarefas pendentes no workflow (semanal, início do período)</p>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Notificações são enviadas apenas para dispositivos com push ativo.
        Cada dispositivo precisa ser habilitado individualmente.
      </p>
    </div>
  );
}

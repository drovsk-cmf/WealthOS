"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getMfaStatus } from "@/lib/auth/mfa";
import { clearEncryptionKey } from "@/lib/auth/encryption-manager";
import { useBiometricAuth } from "@/lib/auth/use-biometric";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const biometric = useBiometricAuth();

  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    async function checkMfa() {
      const { status } = await getMfaStatus(supabase);
      setMfaEnrolled(status === "enrolled_verified");
    }
    checkMfa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Logout all devices (AUTH-07) ──────────────────────────
  async function handleLogoutAllDevices() {
    setLoading("logout");
    setMessage(null);

    try {
      // signOut with scope 'global' invalidates ALL sessions
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;

      clearEncryptionKey();
      router.push("/login?reason=logout_all");
    } catch {
      setMessage({ type: "error", text: "Erro ao encerrar sessões. Tente novamente." });
    } finally {
      setLoading(null);
    }
  }

  // ─── Request account deletion (CFG-06) ─────────────────────
  async function handleRequestDeletion() {
    if (deleteConfirmText !== "EXCLUIR") return;

    setLoading("delete");
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { error } = await supabase
        .from("users_profile")
        .update({ deletion_requested_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Exclusão solicitada. Sua conta será removida em 7 dias. Você pode cancelar entrando em contato antes do prazo.",
      });
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao solicitar exclusão.",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Segurança</h1>
      </div>

      {message && (
        <div className={`rounded-md border p-3 text-sm ${
          message.type === "success"
            ? "border-verdant/20 bg-verdant/10 text-verdant"
            : "border-destructive/50 bg-destructive/10 text-destructive"
        }`}>
          {message.text}
        </div>
      )}

      {/* MFA Status */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Autenticação de dois fatores (TOTP)</p>
            <p className="text-xs text-muted-foreground">
              {mfaEnrolled ? "Ativo - protegido por app autenticador" : "Não configurado"}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            mfaEnrolled ? "bg-verdant/15 text-verdant" : "bg-terracotta/15 text-terracotta"
          }`}>
            {mfaEnrolled ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      {/* Biometric Status (stub) */}
      {biometric.platform === "ios" && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Desbloqueio biométrico</p>
              <p className="text-xs text-muted-foreground">
                {biometric.available
                  ? "Face ID disponível (requer build iOS)"
                  : "Indisponível nesta plataforma"}
              </p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Em breve
            </span>
          </div>
        </div>
      )}

      {/* Session Management */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sessões ativas</p>
            <p className="text-xs text-muted-foreground">
              Timeout automático após 30 minutos de inatividade
            </p>
          </div>
          <button
            onClick={handleLogoutAllDevices}
            disabled={loading === "logout"}
            className="rounded-md border border-destructive/50 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            {loading === "logout" ? "Encerrando..." : "Encerrar todas"}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-3 rounded-lg border border-destructive/30 p-4">
        <p className="text-sm font-medium text-destructive">Zona de perigo</p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-md border border-destructive/50 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            Solicitar exclusão da conta
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              A exclusão será processada em 7 dias. Todos os dados serão permanentemente
              removidos. Esta ação não pode ser desfeita.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium">
                Digite <strong>EXCLUIR</strong> para confirmar
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                placeholder="EXCLUIR"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRequestDeletion}
                disabled={deleteConfirmText !== "EXCLUIR" || loading === "delete"}
                className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground disabled:opacity-50"
              >
                {loading === "delete" ? "Processando..." : "Confirmar exclusão"}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                className="rounded-md border px-3 py-1.5 text-xs font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

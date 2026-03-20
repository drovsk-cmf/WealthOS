"use client";

/**
 * MfaReminderBanner - P4 (MFA diferido)
 *
 * Aparece no dashboard quando:
 * - MFA não está configurado E
 * - Conta tem mais de 24h de criação
 *
 * Dismissível por sessão (sessionStorage). Link direto para /settings.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMfaStatus } from "@/lib/auth/mfa";

export function MfaReminderBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already dismissed this session?
    if (typeof window !== "undefined" && sessionStorage.getItem("mfa_reminder_dismissed")) return;

    async function check() {
      try {
        const supabase = createClient();
        const { status } = await getMfaStatus(supabase);

        // Already enrolled - no reminder needed
        if (status === "enrolled_verified" || status === "enrolled_unverified") return;

        // Check account age (>24h)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.created_at) return;

        const ageMs = Date.now() - new Date(user.created_at).getTime();
        const h24 = 24 * 60 * 60 * 1000;

        if (ageMs > h24) {
          setVisible(true);
        }
      } catch {
        // Silent fail - don't block dashboard
      }
    }

    check();
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("mfa_reminder_dismissed", "1");
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-burnished/30 bg-burnished/10 px-4 py-3">
      <ShieldAlert className="h-5 w-5 flex-shrink-0 text-burnished" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-burnished">
          Proteja sua conta com autenticação de dois fatores
        </p>
        <p className="mt-0.5 text-xs text-burnished/80">
          O 2FA adiciona uma camada extra de segurança ao seu login.{" "}
          <Link href="/settings" className="font-medium underline hover:no-underline">
            Configurar agora
          </Link>
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="flex-shrink-0 rounded-md p-1 text-burnished/60 hover:text-burnished"
        aria-label="Dispensar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

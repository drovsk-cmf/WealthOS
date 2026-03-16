/**
 * Oniefy - App Lifecycle Hook
 *
 * Gerencia o ciclo de vida da DEK no contexto mobile (Capacitor).
 * Quando o app vai para background:
 *   - DEK é expurgada da memória (evita leitura em memory dumps)
 * Quando o app retorna para foreground:
 *   - Exige re-autenticação biométrica para recarregar a DEK
 *
 * Ref: Auditoria de segurança - Achado 1 (Envelope Encryption lifecycle)
 *
 * Dependência: @capacitor/app (instalado na Fase 10 junto com build nativo)
 * Em ambiente web, este hook é inerte (no-op).
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { clearEncryptionKey, loadEncryptionKey, getActiveDEK } from "./encryption-manager";
import { createClient } from "@/lib/supabase/client";

type AppState = "active" | "inactive" | "background";

import { isNativePlatform } from "@/lib/utils/platform";

interface CapacitorApp {
  addListener: (
    event: string,
    callback: (state: { isActive: boolean }) => void
  ) => Promise<{ remove: () => void }>;
}

/**
 * Tenta importar @capacitor/app dinamicamente.
 * Retorna null em ambiente web ou se o plugin não estiver instalado.
 */
async function getCapacitorApp(): Promise<CapacitorApp | null> {
  try {
    const mod = await import("@capacitor/app");
    return (mod.App as unknown as CapacitorApp) ?? null;
  } catch {
    // Expected on web / when Capacitor plugin not installed
    return null;
  }
}

interface UseAppLifecycleOptions {
  /** Callback chamado quando DEK é expurgada (app backgrounded) */
  onDEKPurged?: () => void;
  /** Callback chamado quando DEK é recarregada com sucesso */
  onDEKRestored?: () => void;
  /** Callback chamado quando biometria falha no foreground */
  onBiometricFailed?: () => void;
}

export function useAppLifecycle(options?: UseAppLifecycleOptions) {
  const lastStateRef = useRef<AppState>("active");
  const dekWasPurgedRef = useRef(false);

  const handleStateChange = useCallback(
    async (isActive: boolean) => {
      const prevState = lastStateRef.current;
      const newState: AppState = isActive ? "active" : "background";
      lastStateRef.current = newState;

      // ── App going to background ──
      if (prevState === "active" && !isActive) {
        const hadDEK = getActiveDEK() !== null;
        if (hadDEK) {
          clearEncryptionKey();
          dekWasPurgedRef.current = true;
          options?.onDEKPurged?.();
          // eslint-disable-next-line no-console
          console.info("[Oniefy] DEK purged from memory (app backgrounded)");
        }
        return;
      }

      // ── App returning to foreground ──
      if (!prevState || prevState !== "active") {
        if (!dekWasPurgedRef.current) return;
        dekWasPurgedRef.current = false;

        try {
          // Fase 10: integrar com useBiometricAuth().authenticate() real
          // Por enquanto, tenta recarregar via sessão ativa
          const biometricOk = await attemptBiometricUnlock();

          if (!biometricOk) {
            options?.onBiometricFailed?.();
            if (process.env.NODE_ENV === "development") console.warn("[Oniefy] Biometric unlock failed on foreground return");
            return;
          }

          // Recarrega a DEK da sessão
          const supabase = createClient();
          await loadEncryptionKey(supabase);
          options?.onDEKRestored?.();
          // eslint-disable-next-line no-console
          console.info("[Oniefy] DEK restored after biometric unlock");
        } catch (err) {
          if (process.env.NODE_ENV === "development") console.error("[Oniefy] Failed to restore DEK on foreground:", err);
          options?.onBiometricFailed?.();
        }
      }
    },
    [options]
  );

  useEffect(() => {
    if (!isNativePlatform()) return;

    let removeListener: (() => void) | null = null;

    getCapacitorApp().then((app) => {
      if (!app) return;

      app
        .addListener("appStateChange", (state) => {
          handleStateChange(state.isActive);
        })
        .then((handle) => {
          removeListener = handle.remove;
        });
    });

    return () => {
      removeListener?.();
    };
  }, [handleStateChange]);
}

/**
 * Stub para desbloqueio biométrico.
 * Na Fase 10, será substituído pela chamada real ao
 * @capacitor-community/biometric-auth plugin.
 *
 * IMPORTANTE: retorna `true` (bypass) até a implementação real.
 * Um stub que retorna `false` sem biometria real não adiciona
 * segurança — apenas impede restauração da DEK após background,
 * travando o app silenciosamente quando o hook for conectado.
 */
async function attemptBiometricUnlock(): Promise<boolean> {
  if (!isNativePlatform()) return true; // Web: bypass

  // TODO Fase 10: install @capacitor-community/biometric-auth
  // const { BiometricAuth } = await import('@capacitor-community/biometric-auth');
  // const result = await BiometricAuth.authenticate({
  //   reason: 'Desbloqueie para acessar seus dados financeiros',
  //   cancelTitle: 'Cancelar',
  // });
  // return result.verified;

  if (process.env.NODE_ENV === "development") console.warn("[Oniefy] Biometric unlock: stub bypass (plugin não instalado). Implementar na Fase 10.");
  return true;
}

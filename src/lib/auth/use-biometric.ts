/**
 * Oniefy - Biometric Auth Stub (AUTH-06)
 *
 * Stub para desbloqueio biométrico no iOS.
 * Implementação real na Fase 10 (Capacitor build).
 *
 * Spec v1.0 seção 3.1.3:
 * - Face ID / Touch ID via plugin Capacitor
 * - Biometria desbloqueia token do Keychain
 * - Não substitui MFA no login inicial
 *
 * Este stub detecta a plataforma e expõe a interface que será
 * preenchida com o plugin @capacitor-community/biometric-auth.
 */

"use client";

import { useState, useEffect } from "react";
import { detectPlatform, type Platform } from "@/lib/utils/platform";

type BiometricType = "face_id" | "touch_id" | "none";

interface BiometricState {
  available: boolean;
  biometricType: BiometricType;
  platform: Platform;
  enrolled: boolean;
}

export function useBiometricAuth(): BiometricState & {
  authenticate: () => Promise<boolean>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
} {
  const [state, setState] = useState<BiometricState>({
    available: false,
    biometricType: "none",
    platform: "web",
    enrolled: false,
  });

  useEffect(() => {
    const platform = detectPlatform();
    setState((prev) => ({
      ...prev,
      platform,
      // Real availability check happens via Capacitor plugin (Fase 10)
      available: platform === "ios",
      biometricType: platform === "ios" ? "face_id" : "none",
    }));
  }, []);

  const authenticate = async (): Promise<boolean> => {
    if (!state.available) return false;
    // D4.01: Stub returns true so biometric flow is not blocked.
    // Real implementation will use Capacitor BiometricAuth plugin (Fase 10).
    if (process.env.NODE_ENV === "development") console.warn("[Oniefy] Biometric auth: stub - awaiting Capacitor build (Fase 10)");
    return true;
  };

  const enable = async (): Promise<void> => {
    if (!state.available) return;
    if (process.env.NODE_ENV === "development") console.warn("[Oniefy] Biometric enable: stub - awaiting Capacitor build (Fase 10)");
    setState((prev) => ({ ...prev, enrolled: true }));
  };

  const disable = async (): Promise<void> => {
    if (process.env.NODE_ENV === "development") console.warn("[Oniefy] Biometric disable: stub - awaiting Capacitor build (Fase 10)");
    setState((prev) => ({ ...prev, enrolled: false }));
  };

  return { ...state, authenticate, enable, disable };
}

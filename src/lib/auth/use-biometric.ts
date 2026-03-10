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

export type BiometricType = "face_id" | "touch_id" | "none";
export type Platform = "ios" | "android" | "web";

interface BiometricState {
  available: boolean;
  biometricType: BiometricType;
  platform: Platform;
  enrolled: boolean;
}

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "web";

  // Capacitor detection
  const win = window as unknown as Record<string, unknown>;
  if (win.Capacitor && typeof win.Capacitor === "object") {
    const cap = win.Capacitor as Record<string, unknown>;
    const platform = cap.getPlatform && typeof cap.getPlatform === "function"
      ? (cap.getPlatform as () => string)()
      : "web";
    if (platform === "ios") return "ios";
    if (platform === "android") return "android";
  }

  return "web";
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
    // Stub: real implementation will use Capacitor BiometricAuth plugin
    console.warn("[Oniefy] Biometric auth: stub - awaiting Capacitor build (Fase 10)");
    return false;
  };

  const enable = async (): Promise<void> => {
    if (!state.available) return;
    console.warn("[Oniefy] Biometric enable: stub - awaiting Capacitor build (Fase 10)");
    setState((prev) => ({ ...prev, enrolled: true }));
  };

  const disable = async (): Promise<void> => {
    console.warn("[Oniefy] Biometric disable: stub - awaiting Capacitor build (Fase 10)");
    setState((prev) => ({ ...prev, enrolled: false }));
  };

  return { ...state, authenticate, enable, disable };
}

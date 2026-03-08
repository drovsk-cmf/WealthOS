/**
 * WealthOS - Session Timeout Hook
 *
 * Spec v1.0 seção 3.1.2: Timeout de sessão após 30 minutos de inatividade.
 * Monitora eventos de interação (mouse, teclado, toque) e faz logout
 * automático quando o tempo de inatividade excede o limite.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL_MS = 60 * 1000; // Check every 1 minute
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"];

export function useSessionTimeout() {
  const lastActivityRef = useRef<number>(Date.now());
  const router = useRouter();

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const handleTimeout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login?reason=timeout");
  }, [router]);

  useEffect(() => {
    // Register activity listeners
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Periodic check for timeout
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= TIMEOUT_MS) {
        handleTimeout();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(intervalId);
    };
  }, [updateActivity, handleTimeout]);
}

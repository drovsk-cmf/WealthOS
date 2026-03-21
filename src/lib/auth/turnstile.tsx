"use client";

/**
 * Turnstile CAPTCHA component (Item 4)
 *
 * Renders Cloudflare Turnstile widget when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 * Graceful bypass: if key is absent, renders nothing and onVerify fires immediately with empty string.
 * Server-side verification: /api/auth/* routes call verifyTurnstile() before processing.
 */

import { useEffect, useRef, useCallback } from "react";

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function Turnstile({ onVerify, onError }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;

  const handleLoad = useCallback(() => {
    if (!containerRef.current || !SITE_KEY) return;
    if (widgetRef.current) return;

    const w = window as unknown as Record<string, unknown>;
    const turnstile = w.turnstile as {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    } | undefined;

    if (!turnstile) return;

    widgetRef.current = turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: (token: string) => onVerifyRef.current(token),
      "error-callback": () => onError?.(),
      theme: "auto",
      size: "flexible",
    });
  }, [onError]);

  useEffect(() => {
    // No site key = graceful bypass
    if (!SITE_KEY) {
      onVerify("");
      return;
    }

    // Load Turnstile script if not already loaded
    const w = window as unknown as Record<string, unknown>;
    if (w.turnstile) {
      handleLoad();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = handleLoad;
    document.head.appendChild(script);

    return () => {
      if (widgetRef.current) {
        const turnstile = w.turnstile as { remove: (id: string) => void } | undefined;
        turnstile?.remove(widgetRef.current);
        widgetRef.current = null;
      }
    };
  }, [onVerify, handleLoad]);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} className="mt-2" />;
}

/**
 * Server-side Turnstile verification.
 * Returns true if token is valid OR if TURNSTILE_SECRET_KEY is not configured (bypass).
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Graceful bypass

  if (!token) return false;

  try {
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await resp.json();
    return data.success === true;
  } catch {
    return false;
  }
}

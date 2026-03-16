/**
 * Oniefy - Online Status & Service Worker (CFG-07)
 *
 * useOnlineStatus: tracks navigator.onLine with event listeners.
 * useServiceWorker: registers SW on mount (client-side only).
 */

"use client";

import { useState, useEffect } from "react";

/**
 * Returns true when the browser has network connectivity.
 * Updates reactively on online/offline events.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state from navigator
    setIsOnline(navigator.onLine);

    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Registers the Service Worker on mount.
 * Only runs in production or when SW is available.
 * Returns registration status.
 */
export function useServiceWorker() {
  const [status, setStatus] = useState<"idle" | "registered" | "error">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        setStatus("registered");

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                // New version activated, could notify user
                if (process.env.NODE_ENV === "development") console.log("[Oniefy] Service Worker atualizado.");
              }
            });
          }
        });
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") console.warn("[Oniefy] SW registration failed:", err);
        setStatus("error");
      });
  }, []);

  return status;
}

/**
 * Platform detection utilities (D5.01)
 *
 * Consolidates Capacitor platform detection used by
 * use-biometric.ts and use-app-lifecycle.ts.
 */

export type Platform = "ios" | "android" | "web";

export function detectPlatform(): Platform {
  if (typeof window === "undefined") return "web";

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

export function isNativePlatform(): boolean {
  return detectPlatform() !== "web";
}

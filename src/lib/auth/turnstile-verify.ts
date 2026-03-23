/**
 * Server-side Turnstile verification.
 *
 * Separated from turnstile.tsx (client component) to avoid
 * "use client" boundary issues when imported from Route Handlers.
 *
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

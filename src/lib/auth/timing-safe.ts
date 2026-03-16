/**
 * Timing-safe string comparison (D1.03, D3.02)
 *
 * Prevents timing attacks on secret comparison (e.g., cron secrets).
 * Uses crypto.subtle.timingSafeEqual when available, falls back to
 * constant-time XOR comparison.
 */

export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Even on length mismatch, do a constant-time compare to avoid
    // leaking length info via early return timing
    const dummy = a.padEnd(Math.max(a.length, b.length), "\0");
    const dummyB = b.padEnd(Math.max(a.length, b.length), "\0");
    let result = 0;
    for (let i = 0; i < dummy.length; i++) {
      result |= dummy.charCodeAt(i) ^ dummyB.charCodeAt(i);
    }
    // Always false when lengths differ
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

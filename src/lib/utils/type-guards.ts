/**
 * Type guards for Supabase RPC Json returns (DT-007)
 *
 * Supabase RPCs return `Json` type which requires `as unknown as T` casts.
 * These guards add runtime safety without overhead.
 */

/**
 * Assert that a value is a non-null object.
 * Returns the value typed as Record<string, unknown> or null.
 */
export function asObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/**
 * Assert that a value is an array.
 * Returns the value typed as unknown[] or empty array.
 */
export function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return [];
}

/**
 * Safe cast for Supabase Json → typed object.
 * Returns null if the value is not a non-null object.
 */
export function jsonAs<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return null;
  return value as T;
}

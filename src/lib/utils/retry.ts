/**
 * Retry utility with exponential backoff + jitter.
 *
 * Usage (API routes, cron jobs, or any async Supabase call):
 *
 *   const { data, error } = await withRetry(() =>
 *     supabase.rpc("get_dashboard_all", { p_user_id: userId })
 *   );
 *
 * Default: 3 attempts, 500ms base delay, exponential backoff with ±25% jitter.
 * Retries only on transient errors (network, 5xx, rate limit 429).
 */

export interface RetryOptions {
  /** Maximum number of attempts (including first). Default: 3 */
  maxAttempts?: number;
  /** Base delay in ms before first retry. Default: 500 */
  baseDelayMs?: number;
  /** Maximum delay cap in ms. Default: 10_000 */
  maxDelayMs?: number;
  /** Jitter factor (0-1). 0.25 = ±25% randomization. Default: 0.25 */
  jitterFactor?: number;
  /** Custom predicate: should we retry this error? Default: isTransientError */
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 10_000,
  jitterFactor: 0.25,
  shouldRetry: isTransientError,
};

/**
 * Determines if an error is transient and worth retrying.
 * Covers: network failures, Supabase 5xx, rate limit (429), fetch errors.
 */
export function isTransientError(error: unknown): boolean {
  if (!error) return false;

  // Supabase PostgREST errors have a `code` or `status` field
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;

    // HTTP status-based
    const status = err.status ?? err.statusCode;
    if (typeof status === "number") {
      // 429 Too Many Requests, 5xx Server Error
      if (status === 429 || (status >= 500 && status <= 599)) return true;
    }

    // Supabase error codes for transient issues
    const code = err.code;
    if (typeof code === "string") {
      // PostgreSQL: connection/availability errors
      if (code.startsWith("08") || code === "57P01" || code === "57P03") return true;
      // PGRST: timeout, overloaded
      if (code === "PGRST301" || code === "PGRST000") return true;
    }

    // Network errors (fetch failed, ECONNRESET, etc.)
    const message = err.message;
    if (typeof message === "string") {
      const lc = message.toLowerCase();
      if (
        lc.includes("fetch") ||
        lc.includes("network") ||
        lc.includes("econnreset") ||
        lc.includes("econnrefused") ||
        lc.includes("timeout") ||
        lc.includes("socket hang up") ||
        lc.includes("abort")
      ) {
        return true;
      }
    }
  }

  return false;
}

/** Calculate delay with exponential backoff + jitter */
function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitterFactor: number,
): number {
  // Exponential: base * 2^(attempt-1)
  const exponential = baseDelayMs * Math.pow(2, attempt - 1);
  const capped = Math.min(exponential, maxDelayMs);

  // Add jitter: ±jitterFactor of the capped value
  const jitter = capped * jitterFactor * (2 * Math.random() - 1);
  return Math.max(0, Math.round(capped + jitter));
}

/** Sleep for a given number of milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async operation with retry and exponential backoff.
 *
 * @param fn - Async function to execute (should return Supabase-style { data, error } or throw)
 * @param options - Retry configuration
 * @returns The result of fn() after successful execution
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => PromiseLike<T> | Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await fn();

      // Handle Supabase-style { data, error } pattern
      // If result has an `error` property that's truthy and transient, retry
      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        (result as Record<string, unknown>).error
      ) {
        const supaError = (result as Record<string, unknown>).error;
        if (attempt < opts.maxAttempts && opts.shouldRetry(supaError)) {
          lastError = supaError;
          const delay = calculateDelay(attempt, opts.baseDelayMs, opts.maxDelayMs, opts.jitterFactor);
          await sleep(delay);
          continue;
        }
      }

      return result;
    } catch (error) {
      lastError = error;
      if (attempt < opts.maxAttempts && opts.shouldRetry(error)) {
        const delay = calculateDelay(attempt, opts.baseDelayMs, opts.maxDelayMs, opts.jitterFactor);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }

  // Should not reach here, but just in case
  throw lastError;
}

/**
 * React Query retryDelay function with exponential backoff + jitter.
 * Drop-in for QueryClient defaultOptions.
 *
 *   retryDelay: exponentialBackoff
 */
export function exponentialBackoff(attemptIndex: number): number {
  return calculateDelay(attemptIndex, 500, 10_000, 0.25);
}

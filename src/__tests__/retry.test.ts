/**
 * Tests for src/lib/utils/retry.ts
 * D11: Retry with exponential backoff for Supabase
 */
import { withRetry, isTransientError, exponentialBackoff } from "@/lib/utils/retry";

// ── isTransientError ──

describe("isTransientError", () => {
  it("returns false for null/undefined", () => {
    expect(isTransientError(null)).toBe(false);
    expect(isTransientError(undefined)).toBe(false);
  });

  it("detects HTTP 429 (rate limit)", () => {
    expect(isTransientError({ status: 429, message: "Too Many Requests" })).toBe(true);
  });

  it("detects HTTP 500-599 (server errors)", () => {
    expect(isTransientError({ status: 500 })).toBe(true);
    expect(isTransientError({ status: 502 })).toBe(true);
    expect(isTransientError({ status: 503 })).toBe(true);
    expect(isTransientError({ statusCode: 504 })).toBe(true);
  });

  it("rejects HTTP 400/401/404 (client errors)", () => {
    expect(isTransientError({ status: 400 })).toBe(false);
    expect(isTransientError({ status: 401 })).toBe(false);
    expect(isTransientError({ status: 404 })).toBe(false);
    expect(isTransientError({ status: 422 })).toBe(false);
  });

  it("detects PostgreSQL connection errors (08xxx)", () => {
    expect(isTransientError({ code: "08000" })).toBe(true);
    expect(isTransientError({ code: "08001" })).toBe(true);
    expect(isTransientError({ code: "08006" })).toBe(true);
  });

  it("detects PostgreSQL admin shutdown (57P01) and recovery (57P03)", () => {
    expect(isTransientError({ code: "57P01" })).toBe(true);
    expect(isTransientError({ code: "57P03" })).toBe(true);
  });

  it("detects PostgREST errors", () => {
    expect(isTransientError({ code: "PGRST301" })).toBe(true);
    expect(isTransientError({ code: "PGRST000" })).toBe(true);
  });

  it("rejects PostgreSQL constraint violations (23xxx)", () => {
    expect(isTransientError({ code: "23505" })).toBe(false);
    expect(isTransientError({ code: "23502" })).toBe(false);
  });

  it("detects network-related error messages", () => {
    expect(isTransientError({ message: "fetch failed" })).toBe(true);
    expect(isTransientError({ message: "NetworkError" })).toBe(true);
    expect(isTransientError({ message: "ECONNRESET" })).toBe(true);
    expect(isTransientError({ message: "ECONNREFUSED" })).toBe(true);
    expect(isTransientError({ message: "request timeout" })).toBe(true);
    expect(isTransientError({ message: "socket hang up" })).toBe(true);
    expect(isTransientError({ message: "The operation was aborted" })).toBe(true);
  });

  it("rejects non-transient error messages", () => {
    expect(isTransientError({ message: "invalid input syntax" })).toBe(false);
    expect(isTransientError({ message: "permission denied" })).toBe(false);
  });
});

// ── exponentialBackoff ──

describe("exponentialBackoff", () => {
  it("returns a positive number for any attempt index", () => {
    for (let i = 0; i < 10; i++) {
      const delay = exponentialBackoff(i);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(typeof delay).toBe("number");
    }
  });

  it("generally increases with attempt index (statistical)", () => {
    // Run 100 samples and check the average trend
    const averages: number[] = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      let sum = 0;
      for (let i = 0; i < 100; i++) {
        sum += exponentialBackoff(attempt);
      }
      averages.push(sum / 100);
    }
    // Average delay should increase
    expect(averages[2]!).toBeGreaterThan(averages[0]!);
    expect(averages[4]!).toBeGreaterThan(averages[1]!);
  });

  it("caps at maxDelayMs (10s)", () => {
    // Attempt 20 would be 500 * 2^20 = 524M ms without cap
    const delay = exponentialBackoff(20);
    expect(delay).toBeLessThanOrEqual(12_500); // 10_000 + 25% jitter max
  });
});

// ── withRetry ──

describe("withRetry", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns result on first success", async () => {
    const fn = jest.fn().mockResolvedValue({ data: "ok", error: null });
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 });
    expect(result).toEqual({ data: "ok", error: null });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on transient thrown error then succeeds", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce({ message: "fetch failed" })
      .mockResolvedValue({ data: "ok", error: null });

    jest.useRealTimers(); // Need real timers for sleep
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 });
    expect(result).toEqual({ data: "ok", error: null });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on Supabase-style error in response", async () => {
    const fn = jest
      .fn()
      .mockResolvedValueOnce({ data: null, error: { status: 503, message: "Service Unavailable" } })
      .mockResolvedValue({ data: "ok", error: null });

    jest.useRealTimers();
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 });
    expect(result).toEqual({ data: "ok", error: null });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-transient errors", async () => {
    const fn = jest
      .fn()
      .mockRejectedValue({ status: 404, message: "Not Found" });

    jest.useRealTimers();
    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 })
    ).rejects.toEqual({ status: 404, message: "Not Found" });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("exhausts all retries and throws last error", async () => {
    const fn = jest.fn().mockRejectedValue({ message: "ECONNRESET" });

    jest.useRealTimers();
    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 })
    ).rejects.toEqual({ message: "ECONNRESET" });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("returns non-transient Supabase error without retrying", async () => {
    const fn = jest.fn().mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });

    jest.useRealTimers();
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 });
    // Should return the result as-is (non-transient error is not retried)
    expect(result).toEqual({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("respects custom shouldRetry predicate", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce({ code: "CUSTOM" })
      .mockResolvedValue("ok");

    jest.useRealTimers();
    const result = await withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 10,
      shouldRetry: (err) => {
        return (err as Record<string, unknown>)?.code === "CUSTOM";
      },
    });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

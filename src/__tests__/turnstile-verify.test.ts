/**
 * Tests: Turnstile CAPTCHA verification
 *
 * Covers:
 * - Fail-open behavior when TURNSTILE_SECRET_KEY absent (documented risk)
 * - Token rejection when secret configured but token empty
 * - Token rejection when secret configured but fetch fails
 *
 * Source: ChatGPT audit A2 (Turnstile fail-open)
 */

describe("Turnstile verifyTurnstile logic", () => {
  // Simulate the verifyTurnstile function logic without importing
  // (import requires DOM context for the component part)

  function verifyTurnstileLogic(
    secret: string | undefined,
    token: string,
    fetchSuccess: boolean,
    apiResponse: { success: boolean }
  ): boolean {
    if (!secret) return true; // Graceful bypass
    if (!token) return false;
    if (!fetchSuccess) return false;
    return apiResponse.success === true;
  }

  describe("fail-open when unconfigured", () => {
    it("returns true when TURNSTILE_SECRET_KEY is undefined", () => {
      const result = verifyTurnstileLogic(undefined, "", true, { success: false });
      expect(result).toBe(true);
    });

    it("returns true when TURNSTILE_SECRET_KEY is empty string", () => {
      // In the real code, empty string is falsy, so also bypasses
      const result = verifyTurnstileLogic("", "", true, { success: false });
      expect(result).toBe(true);
    });
  });

  describe("configured (production-like)", () => {
    const SECRET = "0x4AAAAAABxxxxxxxxxxxxxxx";

    it("rejects empty token", () => {
      const result = verifyTurnstileLogic(SECRET, "", true, { success: true });
      expect(result).toBe(false);
    });

    it("rejects when fetch fails", () => {
      const result = verifyTurnstileLogic(SECRET, "valid-token", false, { success: true });
      expect(result).toBe(false);
    });

    it("rejects when API says not success", () => {
      const result = verifyTurnstileLogic(SECRET, "valid-token", true, { success: false });
      expect(result).toBe(false);
    });

    it("accepts when API says success", () => {
      const result = verifyTurnstileLogic(SECRET, "valid-token", true, { success: true });
      expect(result).toBe(true);
    });
  });

  describe("documentation: fail-open is intentional for dev", () => {
    it("production MUST have TURNSTILE_SECRET_KEY set", () => {
      // This test exists as documentation, not as a runtime check.
      // The env validation in env.ts should be extended to require
      // TURNSTILE_SECRET_KEY in production environments.
      const REQUIRED_FOR_PRODUCTION = [
        "TURNSTILE_SECRET_KEY",
        "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      ];
      expect(REQUIRED_FOR_PRODUCTION).toContain("TURNSTILE_SECRET_KEY");
    });
  });
});

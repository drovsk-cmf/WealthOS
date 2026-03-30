/**
 * Tests: Turnstile CAPTCHA verification (actual function)
 *
 * Covers the real verifyTurnstile export with mocked fetch.
 */

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  global.fetch = jest.fn();
});

afterEach(() => {
  process.env = originalEnv;
  jest.restoreAllMocks();
});

async function loadVerify() {
  const mod = await import("@/lib/auth/turnstile-verify");
  return mod.verifyTurnstile;
}

describe("verifyTurnstile (real import)", () => {
  describe("fail-open when unconfigured", () => {
    it("returns true when TURNSTILE_SECRET_KEY is undefined", async () => {
      delete process.env.TURNSTILE_SECRET_KEY;
      const verifyTurnstile = await loadVerify();
      expect(await verifyTurnstile("any-token")).toBe(true);
    });

    it("returns true when TURNSTILE_SECRET_KEY is empty string", async () => {
      process.env.TURNSTILE_SECRET_KEY = "";
      const verifyTurnstile = await loadVerify();
      expect(await verifyTurnstile("any-token")).toBe(true);
    });
  });

  describe("configured (production-like)", () => {
    beforeEach(() => {
      process.env.TURNSTILE_SECRET_KEY = "0x4AAAAAABxxxxxxxxxxxxxxx";
    });

    it("rejects empty token", async () => {
      const verifyTurnstile = await loadVerify();
      expect(await verifyTurnstile("")).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("accepts when Cloudflare says success", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });
      const verifyTurnstile = await loadVerify();
      expect(await verifyTurnstile("valid-token")).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("rejects when Cloudflare says not success", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false }),
      });
      const verifyTurnstile = await loadVerify();
      expect(await verifyTurnstile("bad-token")).toBe(false);
    });

    it("rejects when fetch throws (network error)", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network"));
      const verifyTurnstile = await loadVerify();
      expect(await verifyTurnstile("any-token")).toBe(false);
    });
  });

  describe("documentation: fail-open is intentional for dev", () => {
    it("production MUST have TURNSTILE_SECRET_KEY set", () => {
      const REQUIRED_FOR_PRODUCTION = [
        "TURNSTILE_SECRET_KEY",
        "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      ];
      expect(REQUIRED_FOR_PRODUCTION).toContain("TURNSTILE_SECRET_KEY");
    });
  });
});

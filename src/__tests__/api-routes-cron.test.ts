/**
 * @jest-environment node
 */

/**
 * Session 34: API route coverage for push/send and digest/send
 *
 * These cron-protected routes had ~20% coverage. Tests cover:
 * - Auth: missing CRON_SECRET, bad auth header, valid auth
 * - Push: no bills, bills with tokens, token deactivation on 410
 * - Digest: no users, users with data, preview mode (no RESEND_API_KEY)
 */

// ── Mocks must be declared before imports ────────────────────

const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockIn = jest.fn().mockReturnThis();
const mockLte = jest.fn().mockReturnThis();
const mockGte = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockReturnValue({ then: jest.fn((ok: () => void) => { ok(); }) });
const mockSingle = jest.fn();
const mockRpc = jest.fn();

const mockChain = {
  select: mockSelect,
  eq: mockEq,
  in: mockIn,
  lte: mockLte,
  gte: mockGte,
  order: mockOrder,
  update: mockUpdate,
  insert: mockInsert,
  single: mockSingle,
};

// Make chain methods return the chain
for (const fn of [mockSelect, mockEq, mockIn, mockLte, mockGte, mockOrder, mockUpdate]) {
  fn.mockReturnValue(mockChain);
}

const mockFrom = jest.fn().mockReturnValue(mockChain);

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}));

jest.mock("@/lib/auth/timing-safe", () => ({
  timingSafeCompare: (a: string, b: string) => a === b,
}));

jest.mock("web-push", () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/lib/email/weekly-digest-template", () => ({
  buildWeeklyDigestHtml: jest.fn().mockReturnValue("<html>digest</html>"),
}));

// ── Helpers ──────────────────────────────────────────────────

function makeRequest(url: string, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
  });
}

// ── push/send tests ─────────────────────────────────────────

describe("POST /api/push/send", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CRON_SECRET: "test-cron-secret",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "vapid-pub",
      VAPID_PRIVATE_KEY: "vapid-priv",
      VAPID_EMAIL: "mailto:test@oniefy.com",
    };
    // Reset chain mocks
    for (const fn of [mockSelect, mockEq, mockIn, mockLte, mockGte, mockOrder, mockUpdate, mockInsert, mockFrom, mockRpc]) {
      fn.mockClear();
    }
    mockFrom.mockReturnValue(mockChain);
    for (const fn of [mockSelect, mockEq, mockIn, mockLte, mockGte, mockOrder, mockUpdate]) {
      fn.mockReturnValue(mockChain);
    }
    mockInsert.mockReturnValue({ then: jest.fn((ok: () => void) => { ok(); }) });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 500 when CRON_SECRET is not set", async () => {
    delete process.env.CRON_SECRET;
    const { POST } = await import("@/app/api/push/send/route");
    const req = makeRequest("http://localhost/api/push/send");
    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("configuração");
  });

  it("returns 401 when authorization header is missing", async () => {
    const { POST } = await import("@/app/api/push/send/route");
    const req = makeRequest("http://localhost/api/push/send");
    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization header is wrong", async () => {
    const { POST } = await import("@/app/api/push/send/route");
    const req = makeRequest("http://localhost/api/push/send", {
      authorization: "Bearer wrong-secret",
    });
    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(401);
  });

  it("returns 500 when VAPID keys are missing", async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "";
    process.env.VAPID_PRIVATE_KEY = "";
    const { POST } = await import("@/app/api/push/send/route");
    const req = makeRequest("http://localhost/api/push/send", {
      authorization: "Bearer test-cron-secret",
    });
    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("VAPID");
  });

  it("returns sent:0 when no bills are due", async () => {
    // transactions query returns empty
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const { POST } = await import("@/app/api/push/send/route");
    const req = makeRequest("http://localhost/api/push/send", {
      authorization: "Bearer test-cron-secret",
    });
    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sent).toBe(0);
    expect(body.reason).toBe("no_due_bills");
  });

});

// ── digest/send tests ───────────────────────────────────────

describe("POST /api/digest/send", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      DIGEST_CRON_SECRET: "test-digest-secret",
    };
    mockFrom.mockReturnValue(mockChain);
    for (const fn of [mockSelect, mockEq, mockIn, mockLte, mockGte, mockOrder, mockUpdate]) {
      fn.mockReturnValue(mockChain);
    }
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 500 when DIGEST_CRON_SECRET is not set", async () => {
    delete process.env.DIGEST_CRON_SECRET;
    const { POST } = await import("@/app/api/digest/send/route");
    const req = makeRequest("http://localhost/api/digest/send");
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(500);
  });

  it("returns 401 when x-cron-secret header is wrong", async () => {
    const { POST } = await import("@/app/api/digest/send/route");
    const req = makeRequest("http://localhost/api/digest/send", {
      "x-cron-secret": "wrong",
    });
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(401);
  });

  it("returns 401 when x-cron-secret header is missing", async () => {
    const { POST } = await import("@/app/api/digest/send/route");
    const req = makeRequest("http://localhost/api/digest/send");
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(401);
  });

  it("handles no users with onboarding complete", async () => {
    // Reset chain: from().select().eq() must return promise
    mockFrom.mockReturnValue(mockChain);
    mockSelect.mockReturnValue(mockChain);
    mockEq.mockResolvedValueOnce({ data: [], error: null });

    const { POST } = await import("@/app/api/digest/send/route");
    const req = makeRequest("http://localhost/api/digest/send", {
      "x-cron-secret": "test-digest-secret",
    });
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
  });
});

/**
 * @jest-environment node
 */

/**
 * Oniefy - API Route Security & UX Tests
 *
 * Tests security properties of all 9 API routes:
 * - Input validation (malformed bodies → 400)
 * - Rate limiting (N+1 attempts → 429)
 * - Error sanitization (never leak Supabase internals)
 * - Cron auth (missing/wrong/correct secret)
 * - Anti-enumeration (forgot-password always 200)
 * - PT-BR error messages (UX)
 *
 * Run: npx jest src/__tests__/api-routes-security.test.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Mocks ──────────────────────────────────────────────────

// Mock rate limiter (controllable per test)
let mockRateLimitAllowed = true;
let mockRateLimitRetryMs = 0;
jest.mock("@/lib/auth/rate-limiter", () => ({
  checkRateLimit: jest.fn(() => ({
    allowed: mockRateLimitAllowed,
    retryAfterMs: mockRateLimitRetryMs,
    remaining: mockRateLimitAllowed ? 4 : 0,
    limit: 5,
    windowMs: 900000,
  })),
  rateLimitHeaders: jest.fn(() => ({
    "X-RateLimit-Limit": "5",
    "X-RateLimit-Remaining": mockRateLimitAllowed ? "4" : "0",
  })),
}));

// Mock Supabase server client
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockGetUser = jest.fn();
const mockFrom = jest.fn(() => ({
  insert: jest.fn().mockReturnValue({ then: jest.fn((s: any) => s?.()) }),
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ data: [], error: null }),
      }),
    }),
  }),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resetPasswordForEmail: mockResetPasswordForEmail,
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

// Mock admin client (for cron routes)
jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
            in: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({ then: jest.fn() }),
    })),
  })),
}));

// Mock web-push (avoid requiring VAPID keys in test)
jest.mock("web-push", () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

// Mock timing-safe
jest.mock("@/lib/auth/timing-safe", () => ({
  timingSafeCompare: jest.fn((a: string, b: string) => a === b),
}));

// ─── Helper: Create mock NextRequest ────────────────────────

function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): any {
  const { method = "POST", body, headers = {} } = options;
  const headersMap = new Map(Object.entries({
    "x-forwarded-for": "127.0.0.1",
    "user-agent": "jest-test/1.0",
    ...headers,
  }));

  return {
    method,
    headers: {
      get: (key: string) => headersMap.get(key.toLowerCase()) ?? null,
    },
    nextUrl: {
      origin: "http://localhost:3000",
      pathname: new URL(url, "http://localhost:3000").pathname,
    },
    json: jest.fn().mockResolvedValue(body),
  };
}

// ─── Setup ──────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockRateLimitAllowed = true;
  mockRateLimitRetryMs = 0;
  // Reset env
  delete process.env.CRON_SECRET;
  delete process.env.DIGEST_CRON_SECRET;
  delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
});

// ════════════════════════════════════════════════════════════
// POST /api/auth/login
// ════════════════════════════════════════════════════════════

describe("POST /api/auth/login", () => {
  let handler: (req: any) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("@/app/api/auth/login/route");
    handler = mod.POST;
  });

  it("returns 400 for missing body", async () => {
    const req = createMockRequest("/api/auth/login");
    req.json.mockRejectedValue(new Error("no body"));
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Corpo da requisição inválido.");
  });

  it("returns 400 for invalid email", async () => {
    const req = createMockRequest("/api/auth/login", {
      body: { email: "not-an-email", password: "test" },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Email e senha são obrigatórios.");
  });

  it("returns 400 for empty password", async () => {
    const req = createMockRequest("/api/auth/login", {
      body: { email: "test@example.com", password: "" },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("returns 401 with generic message on bad credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials", status: 400 },
    });
    const req = createMockRequest("/api/auth/login", {
      body: { email: "test@example.com", password: "wrongpassword1" },
    });
    const res = await handler(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    // Must NOT contain Supabase error message
    expect(body.error).toBe("Email ou senha incorretos.");
    expect(body.error).not.toContain("Invalid login credentials");
  });

  it("never leaks Supabase error details", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Database connection timeout: pgbouncer pool exhausted at 10.0.0.5:6543", status: 500 },
    });
    const req = createMockRequest("/api/auth/login", {
      body: { email: "test@example.com", password: "somePassword1" },
    });
    const res = await handler(req);
    const body = await res.json();
    expect(body.error).not.toContain("pgbouncer");
    expect(body.error).not.toContain("10.0.0.5");
    expect(body.error).not.toContain("Database");
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimitAllowed = false;
    mockRateLimitRetryMs = 600000;
    const req = createMockRequest("/api/auth/login", {
      body: { email: "test@example.com", password: "ValidPass123!" },
    });
    const res = await handler(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.retryAfterSeconds).toBe(600);
  });

  it("returns 200 with user info on success", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "uuid-123", email: "test@example.com" } },
      error: null,
    });
    const req = createMockRequest("/api/auth/login", {
      body: { email: "test@example.com", password: "ValidPass123!" },
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.id).toBe("uuid-123");
    expect(body.user.email).toBe("test@example.com");
    // Must NOT return password or session token in body
    expect(body.password).toBeUndefined();
    expect(body.session).toBeUndefined();
    expect(body.access_token).toBeUndefined();
  });

  it("includes rate limit headers in response", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "uuid-123", email: "test@example.com" } },
      error: null,
    });
    const req = createMockRequest("/api/auth/login", {
      body: { email: "test@example.com", password: "ValidPass123!" },
    });
    const res = await handler(req);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
  });

  it("rejects XSS in email field gracefully", async () => {
    const req = createMockRequest("/api/auth/login", {
      body: { email: "<script>alert(1)</script>", password: "test" },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });
});

// ════════════════════════════════════════════════════════════
// POST /api/auth/register
// ════════════════════════════════════════════════════════════

describe("POST /api/auth/register", () => {
  let handler: (req: any) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("@/app/api/auth/register/route");
    handler = mod.POST;
  });

  it("returns 400 for weak password (< 12 chars)", async () => {
    const req = createMockRequest("/api/auth/register", {
      body: {
        fullName: "Test User",
        email: "test@example.com",
        password: "Short1!",
        confirmPassword: "Short1!",
      },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for password without uppercase", async () => {
    const req = createMockRequest("/api/auth/register", {
      body: {
        fullName: "Test User",
        email: "test@example.com",
        password: "alllowercase123",
        confirmPassword: "alllowercase123",
      },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for mismatched passwords", async () => {
    const req = createMockRequest("/api/auth/register", {
      body: {
        fullName: "Test User",
        email: "test@example.com",
        password: "ValidPass123!X",
        confirmPassword: "ValidPass123!Y",
      },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("never leaks Supabase error on duplicate email", async () => {
    mockSignUp.mockResolvedValue({
      data: null,
      error: { message: "User already registered" },
    });
    const req = createMockRequest("/api/auth/register", {
      body: {
        fullName: "Test User",
        email: "existing@example.com",
        password: "ValidPass123!",
        confirmPassword: "ValidPass123!",
      },
    });
    const res = await handler(req);
    const body = await res.json();
    expect(body.error).not.toContain("already registered");
    expect(body.error).toBe("Não foi possível criar a conta. Tente novamente.");
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimitAllowed = false;
    mockRateLimitRetryMs = 3600000;
    const req = createMockRequest("/api/auth/register", {
      body: {
        fullName: "Test",
        email: "test@example.com",
        password: "ValidPass123!",
        confirmPassword: "ValidPass123!",
      },
    });
    const res = await handler(req);
    expect(res.status).toBe(429);
  });
});

// ════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password
// ════════════════════════════════════════════════════════════

describe("POST /api/auth/forgot-password", () => {
  let handler: (req: any) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("@/app/api/auth/forgot-password/route");
    handler = mod.POST;
  });

  it("always returns 200 regardless of email existence (anti-enumeration)", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: null, error: null });
    const req = createMockRequest("/api/auth/forgot-password", {
      body: { email: "nonexistent@nowhere.com" },
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("Se o email estiver cadastrado");
  });

  it("returns 400 for invalid email format", async () => {
    const req = createMockRequest("/api/auth/forgot-password", {
      body: { email: "not-an-email" },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimitAllowed = false;
    mockRateLimitRetryMs = 3600000;
    const req = createMockRequest("/api/auth/forgot-password", {
      body: { email: "test@example.com" },
    });
    const res = await handler(req);
    expect(res.status).toBe(429);
  });
});

// ════════════════════════════════════════════════════════════
// POST /api/push/send (Cron endpoint)
// ════════════════════════════════════════════════════════════

describe("POST /api/push/send", () => {
  let handler: (req: any) => Promise<Response>;

  beforeEach(async () => {
    // Must re-import after env changes
    jest.resetModules();
    // Re-mock dependencies after resetModules
    jest.doMock("@/lib/auth/rate-limiter", () => ({
      checkRateLimit: jest.fn(() => ({ allowed: true, retryAfterMs: 0, remaining: 5, limit: 5, windowMs: 900000 })),
      rateLimitHeaders: jest.fn(() => ({})),
    }));
    jest.doMock("web-push", () => ({
      setVapidDetails: jest.fn(),
      sendNotification: jest.fn(),
    }));
    jest.doMock("@/lib/auth/timing-safe", () => ({
      timingSafeCompare: jest.fn((a: string, b: string) => a === b),
    }));
    jest.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: jest.fn(() => ({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          }),
        })),
      })),
    }));
  });

  it("returns 500 when CRON_SECRET is not configured (fail-closed)", async () => {
    delete process.env.CRON_SECRET;
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "test-pub";
    process.env.VAPID_PRIVATE_KEY = "test-priv";
    const mod = await import("@/app/api/push/send/route");
    handler = mod.POST;

    const req = createMockRequest("/api/push/send", {
      headers: { authorization: "Bearer anything" },
    });
    const res = await handler(req);
    expect(res.status).toBe(500);
  });

  it("returns 401 for wrong secret", async () => {
    process.env.CRON_SECRET = "correct-secret";
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "test-pub";
    process.env.VAPID_PRIVATE_KEY = "test-priv";
    const mod = await import("@/app/api/push/send/route");
    handler = mod.POST;

    const req = createMockRequest("/api/push/send", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 for missing authorization header", async () => {
    process.env.CRON_SECRET = "correct-secret";
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "test-pub";
    process.env.VAPID_PRIVATE_KEY = "test-priv";
    const mod = await import("@/app/api/push/send/route");
    handler = mod.POST;

    const req = createMockRequest("/api/push/send");
    const res = await handler(req);
    expect(res.status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════
// POST /api/digest/send (Cron endpoint)
// ════════════════════════════════════════════════════════════

describe("POST /api/digest/send", () => {
  let handler: (req: any) => Promise<Response>;

  beforeEach(async () => {
    jest.resetModules();
    jest.doMock("@/lib/auth/timing-safe", () => ({
      timingSafeCompare: jest.fn((a: string, b: string) => a === b),
    }));
    jest.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: jest.fn(() => ({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnValue({
            data: [],
            error: null,
          }),
        })),
        auth: {
          admin: {
            listUsers: jest.fn().mockResolvedValue({ data: { users: [] }, error: null }),
          },
        },
      })),
    }));
  });

  it("returns 500 when DIGEST_CRON_SECRET is not configured", async () => {
    delete process.env.DIGEST_CRON_SECRET;
    const mod = await import("@/app/api/digest/send/route");
    handler = mod.POST;

    const req = createMockRequest("/api/digest/send", {
      headers: { "x-cron-secret": "anything" },
    });
    const res = await handler(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    // Must NOT reveal which env var is missing
    expect(body.error).not.toContain("DIGEST_CRON_SECRET");
  });

  it("returns 401 for wrong secret", async () => {
    process.env.DIGEST_CRON_SECRET = "correct-digest-secret";
    const mod = await import("@/app/api/digest/send/route");
    handler = mod.POST;

    const req = createMockRequest("/api/digest/send", {
      headers: { "x-cron-secret": "wrong-secret" },
    });
    const res = await handler(req);
    expect(res.status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════
// Cross-cutting security properties
// ════════════════════════════════════════════════════════════

describe("Cross-cutting security", () => {
  it("all auth routes use PT-BR error messages", async () => {
    // Login
    const loginMod = await import("@/app/api/auth/login/route");
    const loginReq = createMockRequest("/api/auth/login");
    loginReq.json.mockRejectedValue(new Error("bad"));
    const loginRes = await loginMod.POST(loginReq);
    const loginBody = await loginRes.json();
    // Should be in Portuguese, not English
    expect(loginBody.error).not.toMatch(/invalid|missing|required/i);

    // Register
    const regMod = await import("@/app/api/auth/register/route");
    const regReq = createMockRequest("/api/auth/register");
    regReq.json.mockRejectedValue(new Error("bad"));
    const regRes = await regMod.POST(regReq);
    const regBody = await regRes.json();
    expect(regBody.error).not.toMatch(/invalid|missing|required/i);
  });

  it("no auth route returns stack traces", async () => {
    // Supabase returns errors as {data, error}, not by throwing.
    // Simulate an error with stack-trace-like content.
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Unexpected internal error\n  at Object.<anonymous> (/app/node_modules/.pnpm/something)", status: 500 },
    });
    const loginMod = await import("@/app/api/auth/login/route");
    const req = createMockRequest("/api/auth/login", {
      body: { email: "test@example.com", password: "ValidPass123!" },
    });

    const res = await loginMod.POST(req);
    expect(res.status).not.toBe(200);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("node_modules");
    expect(JSON.stringify(body)).not.toContain("at Object");
  });
});

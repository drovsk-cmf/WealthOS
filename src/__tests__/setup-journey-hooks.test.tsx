// Force module scope
export {};

/**
 * Tests: use-setup-journey
 *
 * Covers:
 * - STEP_ROUTES constant
 * - tryAdvanceStep (fire-and-forget RPC)
 * - useAdvanceStep, useSetCutoffDate (mutations)
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  STEP_ROUTES,
  tryAdvanceStep,
  useAdvanceStep,
  useSetCutoffDate,
} from "@/lib/hooks/use-setup-journey";

const mockSjRpc = jest.fn();
const mockSjFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    rpc: mockSjRpc,
    from: mockSjFrom,
  }),
}));

jest.mock("@/lib/supabase/cached-auth", () => ({
  getCachedUserId: jest.fn().mockResolvedValue("u1"),
}));

function qc() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrap(client: QueryClient) {
  return function W({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

// ─── STEP_ROUTES ────────────────────────────────────────────────

describe("STEP_ROUTES", () => {
  it("has 7 steps", () => {
    expect(Object.keys(STEP_ROUTES)).toHaveLength(7);
  });

  it("cutoff_date routes to /settings", () => {
    expect(STEP_ROUTES.cutoff_date).toBe("/settings");
  });

  it("create_accounts routes to /accounts", () => {
    expect(STEP_ROUTES.create_accounts).toBe("/accounts");
  });

  it("import_statements routes to /connections", () => {
    expect(STEP_ROUTES.import_statements).toBe("/connections");
  });

  it("create_budget routes to /budgets", () => {
    expect(STEP_ROUTES.create_budget).toBe("/budgets");
  });

  it("categorize routes to /transactions", () => {
    expect(STEP_ROUTES.categorize).toBe("/transactions");
  });

  it("all routes start with /", () => {
    for (const route of Object.values(STEP_ROUTES)) {
      expect(route).toMatch(/^\//);
    }
  });
});

// ─── tryAdvanceStep ─────────────────────────────────────────────

describe("tryAdvanceStep", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls advance_setup_journey RPC", async () => {
    mockSjRpc.mockResolvedValue({
      data: { completed_step: "create_accounts" },
      error: null,
    });

    const result = await tryAdvanceStep("create_accounts");
    expect(result).toBe(true);
    expect(mockSjRpc).toHaveBeenCalledWith("advance_setup_journey", expect.objectContaining({
      p_step_key: "create_accounts",
    }));
  });

  it("returns false on RPC error", async () => {
    mockSjRpc.mockResolvedValue({ data: null, error: { message: "fail" } });
    const result = await tryAdvanceStep("create_accounts");
    expect(result).toBe(false);
  });

  it("returns false when step not advanced", async () => {
    mockSjRpc.mockResolvedValue({ data: {}, error: null });
    const result = await tryAdvanceStep("create_accounts");
    expect(result).toBe(false);
  });

  it("never throws (fire-and-forget)", async () => {
    mockSjRpc.mockRejectedValue(new Error("network fail"));
    const result = await tryAdvanceStep("create_accounts");
    expect(result).toBe(false);
  });

  it("invalidates setup_journey when step completed and queryClient provided", async () => {
    mockSjRpc.mockResolvedValue({
      data: { completed_step: "create_budget" },
      error: null,
    });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    await tryAdvanceStep("create_budget", client);

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ["setup_journey"],
    }));
  });

  it("does not invalidate when no queryClient provided", async () => {
    mockSjRpc.mockResolvedValue({
      data: { completed_step: "create_budget" },
      error: null,
    });
    // No exception, no invalidation
    const result = await tryAdvanceStep("create_budget");
    expect(result).toBe(true);
  });

  it("passes metadata to RPC", async () => {
    mockSjRpc.mockResolvedValue({ data: { completed_step: "cutoff" }, error: null });
    await tryAdvanceStep("cutoff_date", undefined, { date: "2026-01-01" });
    expect(mockSjRpc).toHaveBeenCalledWith("advance_setup_journey", expect.objectContaining({
      p_metadata: { date: "2026-01-01" },
    }));
  });
});

// ─── useAdvanceStep ─────────────────────────────────────────────

describe("useAdvanceStep", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls advance_setup_journey RPC and invalidates setup_journey", async () => {
    mockSjRpc.mockResolvedValue({ data: { status: "ok" }, error: null });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useAdvanceStep(), { wrapper: wrap(client) });

    result.current.mutate({ stepKey: "create_accounts" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["setup_journey"]);
  });
});

// ─── useSetCutoffDate ───────────────────────────────────────────

describe("useSetCutoffDate", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates users_profile cutoff_date and invalidates setup_journey", async () => {
    mockSjFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });
    mockSjRpc.mockResolvedValue({ data: { completed_step: "cutoff_date" }, error: null });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useSetCutoffDate(), { wrapper: wrap(client) });

    result.current.mutate("2026-01-01");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["setup_journey"]);
  });
});

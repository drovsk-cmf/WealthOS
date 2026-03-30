// Force module scope
export {};

/**
 * Q1 Batch 3: Remaining coverage gaps
 * - cost-centers: useCenterPnl, useCenterExport, useDistributeOverhead
 * - economic-indices: useMultiIndexHistory
 * - recurrences: usePendingBills, useUpdateRecurrence
 * - savings-goals: useSavingsGoals, useCreateGoal, useUpdateGoal, useDeleteGoal
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRpc = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    rpc: mockRpc,
    from: mockFrom,
  }),
}));

jest.mock("@/lib/supabase/cached-auth", () => ({
  getCachedUserId: jest.fn().mockResolvedValue("u1"),
}));

jest.mock("@/lib/hooks/use-setup-journey", () => ({
  tryAdvanceStep: jest.fn(),
}));

jest.mock("@/lib/utils/map-relations", () => ({
  mapTransactionRelations: jest.fn((d: unknown) => d),
}));

function newQc() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrap(client: QueryClient) {
  return function W({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function chainBuilder(data: unknown) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.insert = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.delete = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.neq = jest.fn().mockReturnValue(chain);
  chain.is = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn().mockResolvedValue({ data, error: null });
  Object.defineProperty(chain, "then", {
    value: (resolve: (v: unknown) => void) =>
      Promise.resolve({ data: Array.isArray(data) ? data : [data], error: null }).then(resolve),
  });
  return chain;
}

beforeEach(() => jest.clearAllMocks());

// ─── COST CENTERS: remaining mutations ──────────────────────────

describe("use-cost-centers: query mutations", () => {
  const {
    useCenterPnl,
    useCenterExport,
    useDistributeOverhead,
  } = require("@/lib/hooks/use-cost-centers");

  it("useCenterPnl calls rpc get_center_pnl", async () => {
    mockRpc.mockResolvedValueOnce({
      data: { revenues: [], expenses: [], net: 0, center_name: "Test" },
      error: null,
    });
    const client = newQc();
    const { result } = renderHook(() => useCenterPnl("center-1"), { wrapper: wrap(client) });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith(
      "get_center_pnl",
      expect.objectContaining({ p_center_id: "center-1" })
    );
  });

  it("useDistributeOverhead calls rpc distribute_overhead", async () => {
    mockRpc.mockResolvedValueOnce({
      data: { status: "ok", allocated: 5000, skipped: 0 },
      error: null,
    });
    const client = newQc();
    const { result } = renderHook(() => useDistributeOverhead(), { wrapper: wrap(client) });

    await result.current.mutateAsync("2026-03-01");
    expect(mockRpc).toHaveBeenCalledWith(
      "distribute_overhead",
      expect.objectContaining({ p_month: "2026-03-01" })
    );
  });
});

// ─── ECONOMIC INDICES: history queries ──────────────────────────

describe("use-economic-indices: history queries", () => {
  const { useMultiIndexHistory } =
    require("@/lib/hooks/use-economic-indices");

  it("useMultiIndexHistory calls rpc with each type", async () => {
    mockRpc.mockResolvedValue({
      data: { data: [{ index_type: "ipca", value: 0.5, reference_date: "2026-03-01", source_primary: "bcb", accumulated_12m: null, accumulated_year: null }] },
      error: null,
    });
    const client = newQc();
    const { result } = renderHook(
      () => useMultiIndexHistory(["ipca", "selic"], 12),
      { wrapper: wrap(client) }
    );

    await waitFor(() => result.current.isSuccess || result.current.isError);
    expect(mockRpc).toHaveBeenCalledWith(
      "get_economic_indices",
      expect.objectContaining({ p_index_type: "ipca" })
    );
    expect(mockRpc).toHaveBeenCalledWith(
      "get_economic_indices",
      expect.objectContaining({ p_index_type: "selic" })
    );
  });
});

// ─── RECURRENCES: queries ───────────────────────────────────────

describe("use-recurrences: queries and update", () => {
  const { usePendingBills, useUpdateRecurrence } =
    require("@/lib/hooks/use-recurrences");

  it("usePendingBills calls from(transactions) with filters", async () => {
    const chain = chainBuilder([]);
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => usePendingBills(), { wrapper: wrap(client) });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith("transactions");
  });

  it("useUpdateRecurrence calls from(recurrences).update()", async () => {
    const chain = chainBuilder({ id: "r1" });
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useUpdateRecurrence(), { wrapper: wrap(client) });

    await result.current.mutateAsync({
      id: "r1",
      frequency: "monthly",
      end_date: "2027-01-01",
    });
    expect(mockFrom).toHaveBeenCalledWith("recurrences");
    expect(chain.update).toHaveBeenCalled();
  });
});

// ─── SAVINGS GOALS: CRUD queries ────────────────────────────────

describe("use-savings-goals: CRUD", () => {
  const { useSavingsGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } =
    require("@/lib/hooks/use-savings-goals");

  it("useSavingsGoals calls from(savings_goals)", async () => {
    const chain = chainBuilder([
      { id: "g1", name: "Reserva", target_amount: 50000, current_amount: 10000, target_date: null, is_completed: false, color: "#56688F", icon: "target", created_at: "2026-01-01", updated_at: "2026-01-01", user_id: "u1" },
    ]);
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useSavingsGoals(), { wrapper: wrap(client) });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith("savings_goals");
  });

  it("useCreateGoal inserts into savings_goals", async () => {
    const chain = chainBuilder({ id: "g2", name: "Viagem" });
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useCreateGoal(), { wrapper: wrap(client) });

    await result.current.mutateAsync({
      name: "Viagem Europa",
      target_amount: 30000,
    });
    expect(mockFrom).toHaveBeenCalledWith("savings_goals");
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Viagem Europa", target_amount: 30000 })
    );
  });

  it("useUpdateGoal calls from().update()", async () => {
    const chain = chainBuilder({ id: "g1" });
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useUpdateGoal(), { wrapper: wrap(client) });

    await result.current.mutateAsync({
      id: "g1",
      current_amount: 25000,
    });
    expect(mockFrom).toHaveBeenCalledWith("savings_goals");
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ current_amount: 25000 })
    );
  });

  it("useDeleteGoal calls from().delete()", async () => {
    const chain = chainBuilder(null);
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useDeleteGoal(), { wrapper: wrap(client) });

    await result.current.mutateAsync("g1");
    expect(mockFrom).toHaveBeenCalledWith("savings_goals");
    expect(chain.delete).toHaveBeenCalled();
  });
});

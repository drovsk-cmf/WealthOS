// Force module scope
export {};

/**
 * Tests: use-budgets (ORC-01 to ORC-06)
 *
 * Covers:
 * - toMonthKey, formatMonthLabel (pure functions)
 * - ADJUSTMENT_INDEX_LABELS, ADJUSTMENT_INDEX_OPTIONS (constants)
 * - Mutation invalidation patterns (useCreateBudget, useDeleteBudget, etc.)
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  toMonthKey,
  formatMonthLabel,
  ADJUSTMENT_INDEX_LABELS,
  ADJUSTMENT_INDEX_OPTIONS,
  useCreateBudget,
  useDeleteBudget,
} from "@/lib/hooks/use-budgets";

// ─── Mocks ──────────────────────────────────────────────────────

const mockBudgetRpc = jest.fn();
const mockBudgetFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    rpc: mockBudgetRpc,
    from: mockBudgetFrom,
  }),
}));

jest.mock("@/lib/supabase/cached-auth", () => ({
  getCachedUserId: jest.fn().mockResolvedValue("u1"),
}));

jest.mock("@/lib/hooks/use-setup-journey", () => ({
  tryAdvanceStep: jest.fn(),
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

// ─── Pure function tests ────────────────────────────────────────

describe("toMonthKey", () => {
  it("returns YYYY-MM-01 for given date", () => {
    expect(toMonthKey(new Date(2026, 2, 15))).toBe("2026-03-01");
  });

  it("pads single-digit months", () => {
    expect(toMonthKey(new Date(2026, 0, 1))).toBe("2026-01-01");
  });

  it("returns current month when no date given", () => {
    const result = toMonthKey();
    expect(result).toMatch(/^\d{4}-\d{2}-01$/);
  });

  it("handles December correctly", () => {
    expect(toMonthKey(new Date(2026, 11, 31))).toBe("2026-12-01");
  });
});

describe("formatMonthLabel", () => {
  it("formats month key to pt-BR label", () => {
    const label = formatMonthLabel("2026-03-01");
    // pt-BR: "mar. de 2026" or "mar 2026" depending on locale
    expect(label).toMatch(/mar/i);
    expect(label).toContain("2026");
  });

  it("formats January", () => {
    const label = formatMonthLabel("2026-01-01");
    expect(label).toMatch(/jan/i);
  });

  it("formats December", () => {
    const label = formatMonthLabel("2026-12-01");
    expect(label).toMatch(/dez/i);
  });
});

// ─── Constants ──────────────────────────────────────────────────

describe("ADJUSTMENT_INDEX_LABELS", () => {
  it("has 6 labels", () => {
    expect(Object.keys(ADJUSTMENT_INDEX_LABELS)).toHaveLength(6);
  });

  it("includes ipca, igpm, selic", () => {
    expect(ADJUSTMENT_INDEX_LABELS.ipca).toBe("IPCA");
    expect(ADJUSTMENT_INDEX_LABELS.igpm).toBe("IGP-M");
    expect(ADJUSTMENT_INDEX_LABELS.selic).toBe("Selic");
  });

  it("none is 'Sem reajuste'", () => {
    expect(ADJUSTMENT_INDEX_LABELS.none).toBe("Sem reajuste");
  });
});

describe("ADJUSTMENT_INDEX_OPTIONS", () => {
  it("has 6 options", () => {
    expect(ADJUSTMENT_INDEX_OPTIONS).toHaveLength(6);
  });

  it("first option is 'none'", () => {
    expect(ADJUSTMENT_INDEX_OPTIONS[0].value).toBe("none");
  });

  it("all options have value and label", () => {
    for (const opt of ADJUSTMENT_INDEX_OPTIONS) {
      expect(opt.value).toBeTruthy();
      expect(opt.label).toBeTruthy();
    }
  });
});

// ─── Mutation invalidation ──────────────────────────────────────

describe("useCreateBudget", () => {
  beforeEach(() => jest.clearAllMocks());

  it("invalidates budgets on success", async () => {
    // useCreateBudget calls from("budgets") twice:
    // 1st: select for duplicate check (maybeSingle)
    // 2nd: insert
    let callCount = 0;
    mockBudgetFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Duplicate check: no existing budget
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      // Insert
      return {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "b1", category_id: "c1", month: "2026-03-01", planned_amount: 500 },
              error: null,
            }),
          }),
        }),
      };
    });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateBudget(), { wrapper: wrap(client) });

    result.current.mutate({
      category_id: "c1",
      month: "2026-03-01",
      planned_amount: 500,
      alert_threshold: 0.8,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["budgets"]);
  });
});

describe("useDeleteBudget", () => {
  beforeEach(() => jest.clearAllMocks());

  it("invalidates budgets on success", async () => {
    mockBudgetFrom.mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useDeleteBudget(), { wrapper: wrap(client) });

    result.current.mutate("b1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["budgets"]);
  });
});

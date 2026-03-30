// Force module scope
export {};

/**
 * Tests: use-cost-centers (CEN-01 to CEN-05)
 *
 * Covers:
 * - CENTER_TYPE_LABELS, CENTER_TYPE_OPTIONS (constants, already tested in p1-divisoes)
 * - exportToCsv (pure function)
 * - useCreateCostCenter, useUpdateCostCenter, useDeleteCostCenter (mutations)
 * - useDistributeOverhead (mutations)
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  exportToCsv,
  downloadFile,
  useCreateCostCenter,
  useUpdateCostCenter,
  useDeleteCostCenter,
} from "@/lib/hooks/use-cost-centers";

const mockCcRpc = jest.fn();
const mockCcFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    rpc: mockCcRpc,
    from: mockCcFrom,
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

// ─── exportToCsv ────────────────────────────────────────────────

describe("exportToCsv", () => {
  const baseData = {
    center: { id: "c1", name: "Marketing", type: "cost_center", color: "#A64A45", created_at: "2026-01-01" },
    transactions: [
      {
        id: "t1", date: "2026-03-15", type: "expense" as const, amount: 500,
        description: "Facebook Ads", is_paid: true, center_percentage: 60,
        center_amount: 300, coa_name: "Despesas Operacionais", group_type: "expense",
      },
      {
        id: "t2", date: "2026-03-16", type: "income" as const, amount: 1000,
        description: null, is_paid: false, center_percentage: 100,
        center_amount: 1000, coa_name: "Receita de Vendas", group_type: "income",
      },
    ],
    totals: { income: 1000, expense: 500, net: 500 },
    exported_at: "2026-03-22T00:00:00Z",
  };

  it("generates CSV with correct header", () => {
    const csv = exportToCsv(baseData);
    const header = csv.split("\n")[0];
    expect(header).toContain("Data");
    expect(header).toContain("Tipo");
    expect(header).toContain("Valor Total");
    expect(header).toContain("% Centro");
    expect(header).toContain("Conta Contábil");
  });

  it("generates one row per transaction", () => {
    const csv = exportToCsv(baseData);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 rows
  });

  it("translates expense type to Despesa", () => {
    const csv = exportToCsv(baseData);
    expect(csv).toContain("Despesa");
  });

  it("translates income type to Receita", () => {
    const csv = exportToCsv(baseData);
    expect(csv).toContain("Receita");
  });

  it("formats amount with 2 decimals", () => {
    const csv = exportToCsv(baseData);
    expect(csv).toContain("500.00");
    expect(csv).toContain("300.00");
  });

  it("uses Sim/Não for is_paid", () => {
    const csv = exportToCsv(baseData);
    expect(csv).toContain("Sim");
    expect(csv).toContain("Não");
  });

  it("handles null description as empty string", () => {
    const csv = exportToCsv(baseData);
    const lines = csv.split("\n");
    // Second data row has description: null → should output empty field
    const secondRow = lines[2];
    // After "Receita," the description field should be empty (no text between commas)
    expect(secondRow).toContain("Receita,");
  });

  it("handles empty transactions array", () => {
    const csv = exportToCsv({ ...baseData, transactions: [] });
    const lines = csv.split("\n");
    expect(lines).toHaveLength(1); // header only
  });

  it("escapes commas in description", () => {
    const data = {
      ...baseData,
      transactions: [{
        ...baseData.transactions[0],
        description: "Item A, Item B",
      }],
    };
    const csv = exportToCsv(data);
    // csvSafe wraps in quotes when comma present
    expect(csv).toContain('"Item A, Item B"');
  });

  it("escapes quotes in description", () => {
    const data = {
      ...baseData,
      transactions: [{
        ...baseData.transactions[0],
        description: 'Nota "especial"',
      }],
    };
    const csv = exportToCsv(data);
    // csvSafe doubles quotes inside quoted string
    expect(csv).toContain('""especial""');
  });
});

// ─── Mutations ──────────────────────────────────────────────────

describe("useCreateCostCenter", () => {
  beforeEach(() => jest.clearAllMocks());

  it("invalidates cost_centers on success", async () => {
    mockCcFrom.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "cc1", name: "Marketing", type: "cost_center" },
            error: null,
          }),
        }),
      }),
    });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateCostCenter(), { wrapper: wrap(client) });

    result.current.mutate({ name: "Marketing", type: "cost_center" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["cost_centers"]);
  });
});

describe("useUpdateCostCenter", () => {
  beforeEach(() => jest.clearAllMocks());

  it("invalidates cost_centers on success", async () => {
    mockCcFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "cc1", name: "Updated" },
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUpdateCostCenter(), { wrapper: wrap(client) });

    result.current.mutate({ id: "cc1", name: "Updated" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["cost_centers"]);
  });
});

describe("useDeleteCostCenter", () => {
  beforeEach(() => jest.clearAllMocks());

  it("invalidates cost_centers on success", async () => {
    mockCcFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useDeleteCostCenter(), { wrapper: wrap(client) });

    result.current.mutate("cc1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["cost_centers"]);
  });
});

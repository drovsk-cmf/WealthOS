// Force module scope
export {};

/**
 * Batch coverage for hooks at 0%:
 * - use-family-members: RELATIONSHIP_LABELS/OPTIONS, ROLE_LABELS, mutations
 * - use-bank-connections: SYNC_STATUS_LABELS/COLORS, mutations
 * - use-economic-indices: INDEX_TYPE_LABELS/COLORS/UNIT
 * - use-chart-of-accounts: GROUP_LABELS, mutations
 * - use-currencies: convertToBrl, groupCurrenciesByTier
 * - use-documents: mutations
 * - use-reconciliation: mutations
 * - use-transactions: (query-only, import only)
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ─── Constants-only imports (no Supabase needed) ────────────────

import {
  RELATIONSHIP_LABELS,
  RELATIONSHIP_OPTIONS,
  ROLE_LABELS,
} from "@/lib/hooks/use-family-members";

import {
  SYNC_STATUS_LABELS,
  SYNC_STATUS_COLORS,
} from "@/lib/hooks/use-bank-connections";

import {
  INDEX_TYPE_LABELS,
  INDEX_TYPE_COLORS,
  INDEX_UNIT,
} from "@/lib/hooks/use-economic-indices";

import { GROUP_LABELS } from "@/lib/hooks/use-chart-of-accounts";

import {
  convertToBrl,
  groupCurrenciesByTier,
} from "@/lib/hooks/use-currencies";

// ─── Mocks for mutation hooks ───────────────────────────────────

const mockBatchRpc = jest.fn();
const mockBatchFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    rpc: mockBatchRpc,
    from: mockBatchFrom,
    storage: { from: jest.fn().mockReturnValue({ upload: jest.fn().mockResolvedValue({ data: { path: "p" }, error: null }), remove: jest.fn().mockResolvedValue({ error: null }) }) },
  }),
}));

jest.mock("@/lib/supabase/cached-auth", () => ({
  getCachedUserId: jest.fn().mockResolvedValue("u1"),
}));

// Lazy imports for mutation hooks (after mocks)
import { useCreateFamilyMember, useDeactivateFamilyMember } from "@/lib/hooks/use-family-members";
import { useCreateBankConnection } from "@/lib/hooks/use-bank-connections";
import { useToggleAccountActive } from "@/lib/hooks/use-chart-of-accounts";
import { useDeleteDocument } from "@/lib/hooks/use-documents";
import { useMatchTransactions } from "@/lib/hooks/use-reconciliation";

function qc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}
function wrap(c: QueryClient) {
  return function W({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
  };
}

// ═══════════════════════════════════════════════════════════════
// use-family-members
// ═══════════════════════════════════════════════════════════════

describe("use-family-members constants", () => {
  it("RELATIONSHIP_LABELS has 7 relationships", () => {
    expect(Object.keys(RELATIONSHIP_LABELS)).toHaveLength(7);
  });
  it("self is Titular", () => { expect(RELATIONSHIP_LABELS.self).toBe("Titular"); });
  it("spouse is Cônjuge", () => { expect(RELATIONSHIP_LABELS.spouse).toBe("Cônjuge"); });
  it("child is Filho(a)", () => { expect(RELATIONSHIP_LABELS.child).toBe("Filho(a)"); });
  it("pet is Pet", () => { expect(RELATIONSHIP_LABELS.pet).toBe("Pet"); });

  it("RELATIONSHIP_OPTIONS has 7 options with emoji", () => {
    expect(RELATIONSHIP_OPTIONS).toHaveLength(7);
    for (const o of RELATIONSHIP_OPTIONS) {
      expect(o.value).toBeTruthy();
      expect(o.label).toBeTruthy();
      expect(o.emoji).toBeTruthy();
    }
  });

  it("ROLE_LABELS has owner and member", () => {
    expect(ROLE_LABELS.owner).toBe("Responsável");
    expect(ROLE_LABELS.member).toBe("Membro");
  });
});

describe("useCreateFamilyMember", () => {
  beforeEach(() => jest.clearAllMocks());
  it("invalidates family_members on success", async () => {
    mockBatchRpc.mockResolvedValue({ data: "fm-1", error: null });
    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateFamilyMember(), { wrapper: wrap(client) });
    result.current.mutate({ name: "Ana", relationship: "child", role: "member" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockBatchRpc).toHaveBeenCalledWith("create_family_member", expect.objectContaining({ p_name: "Ana" }));
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["family_members"]);
  });
});

describe("useDeactivateFamilyMember", () => {
  beforeEach(() => jest.clearAllMocks());
  it("invalidates family_members on success", async () => {
    let callIdx = 0;
    mockBatchFrom.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) {
        // Select member to get cost_center_id
        return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { cost_center_id: null }, error: null }),
        }) }) }) };
      }
      // Update is_active=false
      return { update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }) };
    });
    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useDeactivateFamilyMember(), { wrapper: wrap(client) });
    result.current.mutate("fm1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["family_members"]);
  });
});

// ═══════════════════════════════════════════════════════════════
// use-bank-connections
// ═══════════════════════════════════════════════════════════════

describe("use-bank-connections constants", () => {
  it("SYNC_STATUS_LABELS has 5 statuses", () => {
    expect(Object.keys(SYNC_STATUS_LABELS)).toHaveLength(5);
    expect(SYNC_STATUS_LABELS.active).toBe("Ativa");
    expect(SYNC_STATUS_LABELS.error).toBe("Erro");
    expect(SYNC_STATUS_LABELS.manual).toBe("Manual");
  });

  it("SYNC_STATUS_COLORS has same keys as labels", () => {
    const lk = Object.keys(SYNC_STATUS_LABELS);
    const ck = Object.keys(SYNC_STATUS_COLORS);
    for (const k of lk) { expect(ck).toContain(k); }
  });
});

describe("useCreateBankConnection", () => {
  beforeEach(() => jest.clearAllMocks());
  it("invalidates bank_connections on success", async () => {
    mockBatchFrom.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: "bc1" }, error: null }),
        }),
      }),
    });
    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateBankConnection(), { wrapper: wrap(client) });
    result.current.mutate({ institution_name: "Banco do Brasil" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["bank_connections"]);
  });
});

// ═══════════════════════════════════════════════════════════════
// use-economic-indices
// ═══════════════════════════════════════════════════════════════

describe("use-economic-indices constants", () => {
  it("INDEX_TYPE_LABELS has 13 indices", () => {
    expect(Object.keys(INDEX_TYPE_LABELS)).toHaveLength(13);
    expect(INDEX_TYPE_LABELS.ipca).toBe("IPCA");
    expect(INDEX_TYPE_LABELS.selic).toBe("Selic");
    expect(INDEX_TYPE_LABELS.cdi).toBe("CDI");
    expect(INDEX_TYPE_LABELS.usd_brl).toBe("Dólar (USD/BRL)");
  });

  it("INDEX_TYPE_COLORS has 8 color entries", () => {
    expect(Object.keys(INDEX_TYPE_COLORS)).toHaveLength(8);
    expect(INDEX_TYPE_COLORS.ipca).toMatch(/^#/);
  });

  it("INDEX_UNIT has 8 unit entries", () => {
    expect(Object.keys(INDEX_UNIT)).toHaveLength(8);
    expect(INDEX_UNIT.ipca).toContain("mês");
    expect(INDEX_UNIT.selic).toContain("ano");
    expect(INDEX_UNIT.usd_brl).toContain("R$");
  });
});

// ═══════════════════════════════════════════════════════════════
// use-chart-of-accounts
// ═══════════════════════════════════════════════════════════════

describe("use-chart-of-accounts constants", () => {
  it("GROUP_LABELS has 5 groups", () => {
    expect(Object.keys(GROUP_LABELS)).toHaveLength(5);
  });
  it("asset is Ativo", () => { expect(GROUP_LABELS.asset.label).toBe("Ativo"); });
  it("liability is Passivo", () => { expect(GROUP_LABELS.liability.label).toBe("Passivo"); });
  it("equity is Patrimônio Líquido", () => { expect(GROUP_LABELS.equity.label).toBe("Patrimônio Líquido"); });
  it("revenue is Receitas", () => { expect(GROUP_LABELS.revenue.label).toBe("Receitas"); });
  it("expense is Despesas", () => { expect(GROUP_LABELS.expense.label).toBe("Despesas"); });
  it("each group has a color", () => {
    for (const g of Object.values(GROUP_LABELS)) { expect(g.color).toBeTruthy(); }
  });
});

describe("useToggleAccountActive", () => {
  beforeEach(() => jest.clearAllMocks());
  it("invalidates chart_of_accounts on success", async () => {
    mockBatchFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }),
    });
    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useToggleAccountActive(), { wrapper: wrap(client) });
    result.current.mutate({ id: "coa-1", is_active: false });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["chart_of_accounts"]);
  });
});

// ═══════════════════════════════════════════════════════════════
// use-currencies (pure functions)
// ═══════════════════════════════════════════════════════════════

describe("convertToBrl", () => {
  const rates = {
    USD: { rate: 5.5, source: "ptax", updated: "2026-03-22" },
    EUR: { rate: 6.0, source: "ptax", updated: "2026-03-22" },
  } as Record<string, { rate: number; source: string; updated: string }>;

  it("returns amount unchanged for BRL", () => {
    expect(convertToBrl(100, "BRL", rates)).toBe(100);
  });
  it("converts USD to BRL", () => {
    expect(convertToBrl(100, "USD", rates)).toBe(550);
  });
  it("converts EUR to BRL", () => {
    expect(convertToBrl(100, "EUR", rates)).toBe(600);
  });
  it("returns amount if currency is null", () => {
    expect(convertToBrl(100, null, rates)).toBe(100);
  });
  it("returns amount if currency is undefined", () => {
    expect(convertToBrl(100, undefined, rates)).toBe(100);
  });
  it("returns amount if rates is undefined", () => {
    expect(convertToBrl(100, "USD", undefined)).toBe(100);
  });
  it("returns amount if currency not found in rates", () => {
    expect(convertToBrl(100, "JPY", rates)).toBe(100);
  });
  it("is case-insensitive on currency code", () => {
    expect(convertToBrl(100, "usd", rates)).toBe(550);
  });
  it("handles zero amount", () => {
    expect(convertToBrl(0, "USD", rates)).toBe(0);
  });
  it("handles negative amount", () => {
    expect(convertToBrl(-50, "USD", rates)).toBe(-275);
  });
});

describe("groupCurrenciesByTier", () => {
  const currencies = [
    { code: "USD", name: "Dólar", tier: 1, category: "fiat" as const, symbol: "$" },
    { code: "EUR", name: "Euro", tier: 1, category: "fiat" as const, symbol: "€" },
    { code: "ARS", name: "Peso", tier: 2, category: "fiat" as const, symbol: "$" },
    { code: "BTC", name: "Bitcoin", tier: 3, category: "crypto" as const, symbol: "₿" },
  ];

  it("groups into 3 buckets", () => {
    const groups = groupCurrenciesByTier(currencies);
    expect(groups).toHaveLength(3);
  });

  it("first group is PTAX (tier 1)", () => {
    const groups = groupCurrenciesByTier(currencies);
    expect(groups[0].label).toContain("PTAX");
    expect(groups[0].currencies).toHaveLength(2);
  });

  it("second group is other fiat (tier 2)", () => {
    const groups = groupCurrenciesByTier(currencies);
    expect(groups[1].currencies).toHaveLength(1);
    expect(groups[1].currencies[0].code).toBe("ARS");
  });

  it("third group is crypto", () => {
    const groups = groupCurrenciesByTier(currencies);
    expect(groups[2].label).toContain("Cripto");
    expect(groups[2].currencies).toHaveLength(1);
  });

  it("filters empty groups", () => {
    const onlyFiat = currencies.filter(c => c.category !== "crypto");
    const groups = groupCurrenciesByTier(onlyFiat);
    expect(groups).toHaveLength(2); // no crypto group
  });

  it("handles empty input", () => {
    const groups = groupCurrenciesByTier([]);
    expect(groups).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// use-documents
// ═══════════════════════════════════════════════════════════════

describe("useDeleteDocument", () => {
  beforeEach(() => jest.clearAllMocks());
  it("invalidates documents on success", async () => {
    mockBatchFrom.mockReturnValue({
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }),
    });
    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useDeleteDocument(), { wrapper: wrap(client) });
    result.current.mutate({ id: "doc-1", file_path: "u1/docs/file.pdf" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["documents"]);
  });
});

// ═══════════════════════════════════════════════════════════════
// use-reconciliation
// ═══════════════════════════════════════════════════════════════

describe("useMatchTransactions", () => {
  beforeEach(() => jest.clearAllMocks());
  it("calls match_transactions RPC and invalidates", async () => {
    mockBatchRpc.mockResolvedValue({ data: { status: "matched", pending_id: "11111111-1111-1111-1111-111111111111", imported_id: "22222222-2222-2222-2222-222222222222", adjustment: 0, final_amount: 500 }, error: null });
    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useMatchTransactions(), { wrapper: wrap(client) });
    result.current.mutate({ pendingId: "tx-1", importedId: "imp-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["reconciliation"]);
    expect(keys).toContainEqual(["transactions"]);
  });
});

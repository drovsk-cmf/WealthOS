// Force module scope
export {};

/**
 * Q1 Batch 2: Coverage for bank-connections (29%), chart-of-accounts (34%),
 *             currencies (61%), family-members (56%)
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
  chain.maybeSingle = jest.fn().mockResolvedValue({ data, error: null });
  Object.defineProperty(chain, "then", {
    value: (resolve: (v: unknown) => void) =>
      Promise.resolve({ data: Array.isArray(data) ? data : [data], error: null }).then(resolve),
  });
  return chain;
}

beforeEach(() => jest.clearAllMocks());

// ─── BANK CONNECTIONS ───────────────────────────────────────────

describe("use-bank-connections: constants and mutations", () => {
  const {
    SYNC_STATUS_LABELS,
    SYNC_STATUS_COLORS,
    useCreateBankConnection,
    useDeactivateBankConnection,
    useImportBatch,
    useUndoImportBatch,
  } = require("@/lib/hooks/use-bank-connections");

  it("SYNC_STATUS_LABELS covers all 5 statuses", () => {
    expect(Object.keys(SYNC_STATUS_LABELS)).toHaveLength(5);
    expect(SYNC_STATUS_LABELS.active).toBe("Ativa");
    expect(SYNC_STATUS_LABELS.manual).toBe("Manual");
  });

  it("SYNC_STATUS_COLORS covers all 5 statuses", () => {
    expect(Object.keys(SYNC_STATUS_COLORS)).toHaveLength(5);
    expect(SYNC_STATUS_COLORS.error).toContain("terracotta");
  });

  it("useCreateBankConnection calls from().insert()", async () => {
    const chain = chainBuilder({ id: "bc1" });
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useCreateBankConnection(), { wrapper: wrap(client) });

    await result.current.mutateAsync({
      institution_name: "Itaú",
      provider: "manual",
    });
    expect(mockFrom).toHaveBeenCalledWith("bank_connections");
    expect(chain.insert).toHaveBeenCalled();
  });

  it("useDeactivateBankConnection calls from().update()", async () => {
    const chain = chainBuilder({ id: "bc1" });
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useDeactivateBankConnection(), { wrapper: wrap(client) });

    await result.current.mutateAsync("bc1");
    expect(mockFrom).toHaveBeenCalledWith("bank_connections");
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
  });

  it("useImportBatch calls rpc import_transactions_batch", async () => {
    const batchId = "00000000-0000-0000-0000-000000000099";
    mockRpc.mockResolvedValueOnce({
      data: { status: "ok", imported: 5, skipped: 1, categorized: 3, matched: 0, aliased: 0, batch_id: batchId },
      error: null,
    });
    const client = newQc();
    const { result } = renderHook(() => useImportBatch(), { wrapper: wrap(client) });

    await result.current.mutateAsync({
      accountId: "a1",
      bankConnectionId: null,
      transactions: [
        { date: "2026-03-01", amount: 100, description: "Test" },
      ],
    });
    expect(mockRpc).toHaveBeenCalledWith(
      "import_transactions_batch",
      expect.objectContaining({ p_account_id: "a1" })
    );
  });

  it("useUndoImportBatch calls rpc undo_import_batch", async () => {
    mockRpc.mockResolvedValueOnce({ data: { status: "ok", deleted: 5 }, error: null });
    const client = newQc();
    const { result } = renderHook(() => useUndoImportBatch(), { wrapper: wrap(client) });

    await result.current.mutateAsync("batch-123");
    expect(mockRpc).toHaveBeenCalledWith(
      "undo_import_batch",
      expect.objectContaining({ p_batch_id: "batch-123" })
    );
  });
});

// ─── CHART OF ACCOUNTS ─────────────────────────────────────────

describe("use-chart-of-accounts: constants and mutations", () => {
  const { GROUP_LABELS, useToggleAccountActive, useCreateCOA } =
    require("@/lib/hooks/use-chart-of-accounts");

  it("GROUP_LABELS has 5 groups with label and color", () => {
    expect(Object.keys(GROUP_LABELS)).toHaveLength(5);
    expect(GROUP_LABELS.asset.label).toBe("Ativo");
    expect(GROUP_LABELS.liability.label).toBe("Passivo");
    expect(GROUP_LABELS.equity.label).toBe("Patrimônio Líquido");
    expect(GROUP_LABELS.revenue.label).toBe("Receitas");
    expect(GROUP_LABELS.expense.label).toBe("Despesas");
  });

  it("all GROUP_LABELS have color starting with text-", () => {
    for (const key of Object.keys(GROUP_LABELS)) {
      expect(GROUP_LABELS[key].color).toMatch(/^text-/);
    }
  });

  it("useToggleAccountActive calls from().update()", async () => {
    const chain = chainBuilder({ id: "coa1" });
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useToggleAccountActive(), { wrapper: wrap(client) });

    await result.current.mutateAsync({ id: "coa1", is_active: false });
    expect(mockFrom).toHaveBeenCalledWith("chart_of_accounts");
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
  });

  it("useCreateCOA calls rpc create_coa_child", async () => {
    mockRpc.mockResolvedValueOnce({ data: "new-coa-id", error: null });
    const client = newQc();
    const { result } = renderHook(() => useCreateCOA(), { wrapper: wrap(client) });

    await result.current.mutateAsync({
      parentId: "parent1",
      displayName: "Nubank CC",
    });
    expect(mockRpc).toHaveBeenCalledWith(
      "create_coa_child",
      expect.objectContaining({ p_parent_id: "parent1", p_display_name: "Nubank CC" })
    );
  });
});

// ─── CURRENCIES (pure functions) ────────────────────────────────

describe("use-currencies: convertToBrl and groupCurrenciesByTier", () => {
  const { convertToBrl, groupCurrenciesByTier } =
    require("@/lib/hooks/use-currencies");

  describe("convertToBrl", () => {
    const rates = {
      USD: { rate: 5.5 },
      EUR: { rate: 6.0 },
    };

    it("BRL returns amount unchanged", () => {
      expect(convertToBrl(100, "BRL", rates)).toBe(100);
    });

    it("null currency returns amount unchanged", () => {
      expect(convertToBrl(100, null, rates)).toBe(100);
    });

    it("undefined currency returns amount unchanged", () => {
      expect(convertToBrl(100, undefined, rates)).toBe(100);
    });

    it("no rates returns amount unchanged", () => {
      expect(convertToBrl(100, "USD", undefined)).toBe(100);
    });

    it("USD conversion", () => {
      expect(convertToBrl(100, "USD", rates)).toBe(550);
    });

    it("EUR conversion", () => {
      expect(convertToBrl(100, "EUR", rates)).toBe(600);
    });

    it("unknown currency returns amount unchanged", () => {
      expect(convertToBrl(100, "GBP", rates)).toBe(100);
    });

    it("case insensitive", () => {
      expect(convertToBrl(100, "usd", rates)).toBe(550);
    });
  });

  describe("groupCurrenciesByTier", () => {
    const currencies = [
      { code: "USD", name: "Dólar", tier: 1, category: "fiat" },
      { code: "EUR", name: "Euro", tier: 1, category: "fiat" },
      { code: "CZK", name: "Coroa Tcheca", tier: 2, category: "fiat" },
      { code: "BTC", name: "Bitcoin", tier: 3, category: "crypto" },
    ];

    it("groups into up to 3 tiers", () => {
      const groups = groupCurrenciesByTier(currencies);
      expect(groups.length).toBeLessThanOrEqual(3);
    });

    it("first group is PTAX (tier 1)", () => {
      const groups = groupCurrenciesByTier(currencies);
      expect(groups[0].label).toContain("PTAX");
      expect(groups[0].currencies).toHaveLength(2);
    });

    it("crypto in separate group", () => {
      const groups = groupCurrenciesByTier(currencies);
      const cryptoGroup = groups.find((g: { label: string }) => g.label.toLowerCase().includes("cripto"));
      expect(cryptoGroup).toBeDefined();
      expect(cryptoGroup!.currencies).toHaveLength(1);
      expect(cryptoGroup!.currencies[0].code).toBe("BTC");
    });

    it("empty array returns empty groups", () => {
      const groups = groupCurrenciesByTier([]);
      expect(groups).toHaveLength(0);
    });

    it("only crypto returns single group", () => {
      const groups = groupCurrenciesByTier([
        { code: "BTC", name: "Bitcoin", tier: 3, category: "crypto" },
      ]);
      expect(groups).toHaveLength(1);
      expect(groups[0].label).toContain("ripto");
    });
  });
});

// ─── FAMILY MEMBERS ─────────────────────────────────────────────

describe("use-family-members: constants and mutations", () => {
  const {
    RELATIONSHIP_LABELS,
    RELATIONSHIP_OPTIONS,
    ROLE_LABELS,
    useCreateFamilyMember,
    useUpdateFamilyMember,
    useDeactivateFamilyMember,
  } = require("@/lib/hooks/use-family-members");

  it("RELATIONSHIP_LABELS covers 7 relationships", () => {
    expect(Object.keys(RELATIONSHIP_LABELS)).toHaveLength(7);
    expect(RELATIONSHIP_LABELS.self).toBeDefined();
    expect(RELATIONSHIP_LABELS.spouse).toBeDefined();
    expect(RELATIONSHIP_LABELS.child).toBeDefined();
    expect(RELATIONSHIP_LABELS.pet).toBeDefined();
  });

  it("RELATIONSHIP_OPTIONS is an array with emoji", () => {
    expect(Array.isArray(RELATIONSHIP_OPTIONS)).toBe(true);
    expect(RELATIONSHIP_OPTIONS.length).toBe(7);
    expect(RELATIONSHIP_OPTIONS[0]).toHaveProperty("emoji");
  });

  it("ROLE_LABELS covers owner and member", () => {
    expect(ROLE_LABELS.owner).toBeDefined();
    expect(ROLE_LABELS.member).toBeDefined();
  });

  it("useCreateFamilyMember calls rpc create_family_member", async () => {
    mockRpc.mockResolvedValueOnce({ data: "fm-id-1", error: null });
    const client = newQc();
    const { result } = renderHook(() => useCreateFamilyMember(), { wrapper: wrap(client) });

    await result.current.mutateAsync({
      name: "Maria",
      relationship: "spouse",
    });
    expect(mockRpc).toHaveBeenCalledWith(
      "create_family_member",
      expect.objectContaining({ p_name: "Maria", p_relationship: "spouse" })
    );
  });

  it("useUpdateFamilyMember calls from().update()", async () => {
    const chain = chainBuilder({ id: "fm1" });
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useUpdateFamilyMember(), { wrapper: wrap(client) });

    await result.current.mutateAsync({ id: "fm1", name: "Maria Silva" });
    expect(mockFrom).toHaveBeenCalledWith("family_members");
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ name: "Maria Silva" }));
  });

  it("useDeactivateFamilyMember calls from().update() with is_active false", async () => {
    const chain = chainBuilder({ id: "fm1" });
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useDeactivateFamilyMember(), { wrapper: wrap(client) });

    await result.current.mutateAsync("fm1");
    expect(mockFrom).toHaveBeenCalledWith("family_members");
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
  });
});

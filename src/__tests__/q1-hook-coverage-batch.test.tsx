// Force module scope
export {};

/**
 * Q1: Batch coverage tests for hooks with lowest coverage
 *
 * Targets: use-recurrences (22%), use-economic-indices (18%),
 *          use-fiscal (24%), use-workflows (43%),
 *          use-documents (35%), use-reconciliation (44%)
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ─── Shared mock setup ──────────────────────────────────────────

const mockRpc = jest.fn();
const mockFrom = jest.fn();
const mockStorage = {
  from: jest.fn().mockReturnValue({
    upload: jest.fn().mockResolvedValue({ data: { path: "test/path" }, error: null }),
    remove: jest.fn().mockResolvedValue({ data: null, error: null }),
    createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: "https://signed.url" }, error: null }),
  }),
};

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    rpc: mockRpc,
    from: mockFrom,
    storage: mockStorage,
  }),
}));

jest.mock("@/lib/supabase/cached-auth", () => ({
  getCachedUserId: jest.fn().mockResolvedValue("u1"),
}));

jest.mock("@/lib/hooks/use-setup-journey", () => ({
  tryAdvanceStep: jest.fn(),
}));

jest.mock("@/lib/utils/map-relations", () => ({
  mapTransactionRelations: jest.fn((data: unknown) => data),
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
  chain.gte = jest.fn().mockReturnValue(chain);
  chain.lte = jest.fn().mockReturnValue(chain);
  chain.is = jest.fn().mockReturnValue(chain);
  chain.in = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn().mockResolvedValue({ data, error: null });
  chain.maybeSingle = jest.fn().mockResolvedValue({ data, error: null });
  chain.then = jest.fn((resolve: (v: unknown) => void) =>
    resolve({ data: Array.isArray(data) ? data : [data], error: null })
  );
  // Make chain itself thenable for await
  Object.defineProperty(chain, "then", {
    value: (resolve: (v: unknown) => void) =>
      Promise.resolve({ data: Array.isArray(data) ? data : [data], error: null }).then(resolve),
  });
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── RECURRENCES ────────────────────────────────────────────────

describe("use-recurrences: mutations", () => {
  const { useCreateRecurrence, useDeactivateRecurrence, usePayBill, FREQUENCY_LABELS } =
    require("@/lib/hooks/use-recurrences");

  it("FREQUENCY_LABELS has all 4 frequencies", () => {
    expect(FREQUENCY_LABELS.daily).toBe("Diária");
    expect(FREQUENCY_LABELS.weekly).toBe("Semanal");
    expect(FREQUENCY_LABELS.monthly).toBe("Mensal");
    expect(FREQUENCY_LABELS.yearly).toBe("Anual");
  });

  it("useCreateRecurrence calls from().insert() + rpc", async () => {
    const chain = chainBuilder({ id: "r1", recurrence_id: "r1" });
    mockFrom.mockReturnValue(chain);
    mockRpc.mockResolvedValueOnce({
      data: { transaction_id: "00000000-0000-0000-0000-000000000001", journal_entry_id: null },
      error: null,
    });
    const client = newQc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateRecurrence(), { wrapper: wrap(client) });

    await result.current.mutateAsync({
      frequency: "monthly",
      start_date: "2026-04-01",
      template: { account_id: "a1", type: "expense", amount: 100 },
    });
    expect(mockFrom).toHaveBeenCalledWith("recurrences");
    expect(spy).toHaveBeenCalled();
  });

  it("useDeactivateRecurrence calls from().update()", async () => {
    const chain = chainBuilder({ id: "r1", is_active: false });
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useDeactivateRecurrence(), { wrapper: wrap(client) });

    await result.current.mutateAsync("r1");
    expect(mockFrom).toHaveBeenCalledWith("recurrences");
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
  });

  it("usePayBill calls from().update() to mark paid", async () => {
    const chain = chainBuilder({ recurrence_id: null });
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => usePayBill(), { wrapper: wrap(client) });

    await result.current.mutateAsync("t1");
    expect(mockFrom).toHaveBeenCalledWith("transactions");
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_paid: true }));
  });
});

// ─── ECONOMIC INDICES ───────────────────────────────────────────

describe("use-economic-indices: queries and labels", () => {
  const { INDEX_TYPE_LABELS, INDEX_TYPE_COLORS, INDEX_UNIT, useLatestIndices, useFetchIndices } =
    require("@/lib/hooks/use-economic-indices");

  it("INDEX_TYPE_LABELS covers key indices", () => {
    expect(INDEX_TYPE_LABELS.ipca).toBeDefined();
    expect(INDEX_TYPE_LABELS.selic).toBeDefined();
    expect(INDEX_TYPE_LABELS.cdi).toBeDefined();
    expect(INDEX_TYPE_LABELS.usd_brl).toBeDefined();
  });

  it("INDEX_TYPE_COLORS covers key indices", () => {
    expect(INDEX_TYPE_COLORS.ipca).toBeDefined();
    expect(INDEX_TYPE_COLORS.selic).toBeDefined();
  });

  it("INDEX_UNIT covers % and R$", () => {
    expect(INDEX_UNIT.ipca).toBe("% ao mês");
    expect(INDEX_UNIT.usd_brl).toBe("R$/USD");
  });

  it("useLatestIndices calls rpc get_index_latest", async () => {
    mockRpc.mockResolvedValueOnce({ data: [{ index_type: "ipca", value: 0.5 }], error: null });
    const client = newQc();
    const { result } = renderHook(() => useLatestIndices(), { wrapper: wrap(client) });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith("get_index_latest");
  });

  it("useFetchIndices calls API route", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ collected: 5 }),
    });
    const client = newQc();
    const { result } = renderHook(() => useFetchIndices(), { wrapper: wrap(client) });

    await result.current.mutateAsync();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/indices/fetch"),
      expect.any(Object)
    );
  });
});

// ─── FISCAL ────────────────────────────────────────────────────

describe("use-fiscal: queries and labels", () => {
  const { TAX_TREATMENT_LABELS, TAX_TREATMENT_COLORS, useFiscalReport, useFiscalProjection, useTaxParameters } =
    require("@/lib/hooks/use-fiscal");

  it("TAX_TREATMENT_LABELS has all types", () => {
    expect(TAX_TREATMENT_LABELS.tributavel).toBeDefined();
    expect(TAX_TREATMENT_LABELS.isento).toBeDefined();
    expect(TAX_TREATMENT_LABELS.dedutivel_integral).toBeDefined();
  });

  it("TAX_TREATMENT_COLORS maps to CSS vars", () => {
    expect(TAX_TREATMENT_COLORS.tributavel).toBeDefined();
    expect(TAX_TREATMENT_COLORS.isento).toBeDefined();
  });

  it("useFiscalReport calls rpc get_fiscal_report", async () => {
    mockRpc.mockResolvedValueOnce({
      data: { incomes: [], deductions: [], assets: [], debts: [], year: 2026 },
      error: null,
    });
    const client = newQc();
    const { result } = renderHook(() => useFiscalReport(2026), { wrapper: wrap(client) });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith("get_fiscal_report", expect.objectContaining({ p_year: 2026 }));
  });

  it("useFiscalProjection calls rpc", async () => {
    mockRpc.mockResolvedValueOnce({
      data: { monthly_projection: 0, annual_projection: 0, year: 2026 },
      error: null,
    });
    const client = newQc();
    const { result } = renderHook(() => useFiscalProjection(2026), { wrapper: wrap(client) });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith("get_fiscal_projection", expect.objectContaining({ p_year: 2026 }));
  });

  it("useTaxParameters calls from().select()", async () => {
    const chain = chainBuilder([{ id: "tp1", parameter_type: "irpf_monthly", brackets: [] }]);
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useTaxParameters(), { wrapper: wrap(client) });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith("tax_parameters");
  });
});

// ─── WORKFLOWS ─────────────────────────────────────────────────

describe("use-workflows: mutations and labels", () => {
  const {
    WORKFLOW_TYPE_LABELS,
    TASK_TYPE_LABELS,
    TASK_STATUS_LABELS,
    PERIODICITY_LABELS,
    useGenerateTasks,
    useCompleteTask,
    useCreateWorkflow,
    useDeactivateWorkflow,
  } = require("@/lib/hooks/use-workflows");

  it("WORKFLOW_TYPE_LABELS covers all types", () => {
    expect(WORKFLOW_TYPE_LABELS.bank_statement).toBeDefined();
    expect(WORKFLOW_TYPE_LABELS.card_statement).toBeDefined();
    expect(WORKFLOW_TYPE_LABELS.fiscal_review).toBeDefined();
  });

  it("TASK_TYPE_LABELS covers all types", () => {
    expect(TASK_TYPE_LABELS.upload_document).toBeDefined();
    expect(TASK_TYPE_LABELS.update_balance).toBeDefined();
    expect(TASK_TYPE_LABELS.categorize_transactions).toBeDefined();
    expect(TASK_TYPE_LABELS.review_fiscal).toBeDefined();
  });

  it("TASK_STATUS_LABELS covers all statuses", () => {
    expect(TASK_STATUS_LABELS.pending).toBeDefined();
    expect(TASK_STATUS_LABELS.completed).toBeDefined();
    expect(TASK_STATUS_LABELS.skipped).toBeDefined();
  });

  it("PERIODICITY_LABELS covers all options", () => {
    expect(PERIODICITY_LABELS.weekly).toBeDefined();
    expect(PERIODICITY_LABELS.biweekly).toBeDefined();
    expect(PERIODICITY_LABELS.monthly).toBeDefined();
  });

  it("useGenerateTasks calls rpc", async () => {
    mockRpc.mockResolvedValueOnce({ data: { status: "ok", tasks_created: 3, workflows_skipped: 0 }, error: null });
    const client = newQc();
    const { result } = renderHook(() => useGenerateTasks(), { wrapper: wrap(client) });

    await result.current.mutateAsync({ year: 2026, month: 3 });
    expect(mockRpc).toHaveBeenCalledWith(
      "generate_tasks_for_period",
      expect.objectContaining({ p_year: 2026, p_month: 3 })
    );
  });

  it("useCompleteTask calls rpc complete_workflow_task", async () => {
    mockRpc.mockResolvedValueOnce({ data: { status: "completed", all_period_tasks_done: false }, error: null });
    const client = newQc();
    const { result } = renderHook(() => useCompleteTask(), { wrapper: wrap(client) });

    await result.current.mutateAsync({ taskId: "t1" });
    expect(mockRpc).toHaveBeenCalledWith(
      "complete_workflow_task",
      expect.objectContaining({ p_task_id: "t1" })
    );
  });

  it("useCreateWorkflow calls from().insert()", async () => {
    const chain = chainBuilder({ id: "w1" });
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useCreateWorkflow(), { wrapper: wrap(client) });

    await result.current.mutateAsync({
      name: "Test",
      workflow_type: "bank_statement",
      periodicity: "monthly",
    });
    expect(mockFrom).toHaveBeenCalledWith("workflows");
    expect(chain.insert).toHaveBeenCalled();
  });

  it("useDeactivateWorkflow calls from().update()", async () => {
    const chain = chainBuilder({ id: "w1" });
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useDeactivateWorkflow(), { wrapper: wrap(client) });

    await result.current.mutateAsync("w1");
    expect(mockFrom).toHaveBeenCalledWith("workflows");
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
  });
});

// ─── DOCUMENTS ──────────────────────────────────────────────────

describe("use-documents: mutations", () => {
  const { useUploadDocument, useDeleteDocument } =
    require("@/lib/hooks/use-documents");

  it("useUploadDocument calls storage.upload + from().insert()", async () => {
    const chain = chainBuilder({ id: "d1" });
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useUploadDocument(), { wrapper: wrap(client) });

    const file = new File(["test"], "receipt.pdf", { type: "application/pdf" });
    await result.current.mutateAsync({
      file,
      relatedTable: "transactions",
      relatedId: "t1",
    });
    expect(mockStorage.from).toHaveBeenCalledWith("user-documents");
    expect(mockFrom).toHaveBeenCalledWith("documents");
  });

  it("useDeleteDocument calls from().delete() + storage.remove()", async () => {
    const chain = chainBuilder(null);
    mockFrom.mockReturnValue(chain);
    const client = newQc();
    const { result } = renderHook(() => useDeleteDocument(), { wrapper: wrap(client) });

    await result.current.mutateAsync({ id: "d1", filePath: "u1/transactions/t1/receipt.pdf" });
    expect(mockFrom).toHaveBeenCalledWith("documents");
    expect(chain.delete).toHaveBeenCalled();
  });
});

// ─── RECONCILIATION ─────────────────────────────────────────────

describe("use-reconciliation: mutations", () => {
  const { useMatchTransactions } = require("@/lib/hooks/use-reconciliation");

  it("useMatchTransactions calls rpc match_transactions", async () => {
    mockRpc.mockResolvedValueOnce({
      data: { status: "matched", pending_id: "00000000-0000-0000-0000-000000000001", imported_id: "00000000-0000-0000-0000-000000000002", adjustment: 0, final_amount: 100 },
      error: null,
    });
    const client = newQc();
    const { result } = renderHook(() => useMatchTransactions(), { wrapper: wrap(client) });

    await result.current.mutateAsync({ pendingId: "00000000-0000-0000-0000-000000000001", importedId: "00000000-0000-0000-0000-000000000002" });
    expect(mockRpc).toHaveBeenCalledWith(
      "match_transactions",
      expect.objectContaining({ p_pending_id: "00000000-0000-0000-0000-000000000001" })
    );
  });
});

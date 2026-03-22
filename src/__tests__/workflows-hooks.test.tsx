// Force module scope
export {};

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  WORKFLOW_TYPE_LABELS, PERIODICITY_LABELS, TASK_TYPE_LABELS, TASK_STATUS_LABELS,
  PERIODICITY_OPTIONS, WORKFLOW_TYPE_OPTIONS,
  useCompleteTask, useCreateWorkflow, useDeactivateWorkflow,
} from "@/lib/hooks/use-workflows";

const mockWfRpc = jest.fn();
const mockWfFrom = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) }, rpc: mockWfRpc, from: mockWfFrom }),
}));
jest.mock("@/lib/supabase/cached-auth", () => ({ getCachedUserId: jest.fn().mockResolvedValue("u1") }));

function qc() { return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); }
function wrap(c: QueryClient) { return function W({ children }: { children: React.ReactNode }) { return <QueryClientProvider client={c}>{children}</QueryClientProvider>; }; }

describe("WORKFLOW_TYPE_LABELS", () => {
  it("has 5 types", () => { expect(Object.keys(WORKFLOW_TYPE_LABELS)).toHaveLength(5); });
  it("includes bank_statement", () => { expect(WORKFLOW_TYPE_LABELS.bank_statement).toBe("Extrato Bancário"); });
  it("includes fiscal_review", () => { expect(WORKFLOW_TYPE_LABELS.fiscal_review).toBe("Revisão Fiscal"); });
});

describe("PERIODICITY_LABELS", () => {
  it("has 3 periodicities", () => { expect(Object.keys(PERIODICITY_LABELS)).toHaveLength(3); });
  it("monthly is Mensal", () => { expect(PERIODICITY_LABELS.monthly).toBe("Mensal"); });
  it("biweekly is Quinzenal", () => { expect(PERIODICITY_LABELS.biweekly).toBe("Quinzenal"); });
  it("weekly is Semanal", () => { expect(PERIODICITY_LABELS.weekly).toBe("Semanal"); });
});

describe("TASK_TYPE_LABELS", () => {
  it("has 4 task types", () => { expect(Object.keys(TASK_TYPE_LABELS)).toHaveLength(4); });
  it("upload_document exists", () => { expect(TASK_TYPE_LABELS.upload_document).toBeTruthy(); });
  it("update_balance exists", () => { expect(TASK_TYPE_LABELS.update_balance).toBeTruthy(); });
  it("categorize_transactions exists", () => { expect(TASK_TYPE_LABELS.categorize_transactions).toBeTruthy(); });
  it("review_fiscal exists", () => { expect(TASK_TYPE_LABELS.review_fiscal).toBeTruthy(); });
});

describe("TASK_STATUS_LABELS", () => {
  it("has pending, in_progress, completed, skipped", () => {
    expect(TASK_STATUS_LABELS.pending).toBe("Pendente");
    expect(TASK_STATUS_LABELS.in_progress).toBe("Em andamento");
    expect(TASK_STATUS_LABELS.completed).toBe("Concluída");
    expect(TASK_STATUS_LABELS.skipped).toBe("Pulada");
  });
});

describe("PERIODICITY_OPTIONS", () => {
  it("has 3 options", () => { expect(PERIODICITY_OPTIONS).toHaveLength(3); });
});

describe("WORKFLOW_TYPE_OPTIONS", () => {
  it("has 5 options", () => { expect(WORKFLOW_TYPE_OPTIONS).toHaveLength(5); });
});

describe("useCompleteTask", () => {
  beforeEach(() => jest.clearAllMocks());
  it("invalidates workflow_tasks + workflows", async () => {
    mockWfRpc.mockResolvedValue({ data: { status: "completed", all_period_tasks_done: false }, error: null });
    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCompleteTask(), { wrapper: wrap(client) });
    result.current.mutate({ taskId: "task-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["workflow_tasks"]);
    expect(keys).toContainEqual(["workflows"]);
  });
});

describe("useCreateWorkflow", () => {
  beforeEach(() => jest.clearAllMocks());
  it("invalidates workflows on success", async () => {
    mockWfFrom.mockReturnValue({
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({
        data: { id: "wf-1", name: "Extrato", workflow_type: "bank_statement" }, error: null,
      }) }) }),
    });
    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateWorkflow(), { wrapper: wrap(client) });
    result.current.mutate({ name: "Extrato", workflow_type: "bank_statement", periodicity: "monthly" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["workflows"]);
  });
});

describe("useDeactivateWorkflow", () => {
  beforeEach(() => jest.clearAllMocks());
  it("invalidates workflows + workflow_tasks on success", async () => {
    mockWfFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }),
    });
    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useDeactivateWorkflow(), { wrapper: wrap(client) });
    result.current.mutate("wf-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["workflows"]);
    expect(keys).toContainEqual(["workflow_tasks"]);
  });
});

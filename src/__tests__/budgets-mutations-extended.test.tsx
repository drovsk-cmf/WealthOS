// Force module scope
export {};

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUpdateBudget, useApproveBudget, useRejectBudget } from "@/lib/hooks/use-budgets";

const mockBudgetMutFrom = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) }, from: mockBudgetMutFrom }),
}));
jest.mock("@/lib/supabase/cached-auth", () => ({ getCachedUserId: jest.fn().mockResolvedValue("u1") }));

function qc() { return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); }
function wrap(c: QueryClient) { return function W({ children }: { children: React.ReactNode }) { return <QueryClientProvider client={c}>{children}</QueryClientProvider>; }; }

describe("useUpdateBudget", () => {
  beforeEach(() => jest.clearAllMocks());
  it("invalidates budgets on success", async () => {
    mockBudgetMutFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: "b1", planned_amount: 1000 }, error: null }) }),
      }) }) }),
    });
    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUpdateBudget(), { wrapper: wrap(client) });
    result.current.mutate({ id: "b1", planned_amount: 1000 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["budgets"]);
  });
  it("propagates error", async () => {
    mockBudgetMutFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: { message: "not found" } }) }),
      }) }) }),
    });
    const client = qc();
    const { result } = renderHook(() => useUpdateBudget(), { wrapper: wrap(client) });
    result.current.mutate({ id: "b1", planned_amount: 999 });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useApproveBudget", () => {
  beforeEach(() => jest.clearAllMocks());
  it("invalidates budgets on success", async () => {
    mockBudgetMutFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: "b1", approval_status: "approved" }, error: null }) }),
      }) }) }) }),
    });
    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useApproveBudget(), { wrapper: wrap(client) });
    result.current.mutate("b1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["budgets"]);
  });
});

describe("useRejectBudget", () => {
  beforeEach(() => jest.clearAllMocks());
  it("invalidates budgets on success", async () => {
    mockBudgetMutFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: "b1", approval_status: "rejected" }, error: null }) }),
      }) }) }) }),
    });
    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useRejectBudget(), { wrapper: wrap(client) });
    result.current.mutate({ id: "b1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["budgets"]);
  });
});

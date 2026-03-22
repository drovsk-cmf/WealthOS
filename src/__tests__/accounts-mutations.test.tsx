// Force module scope
export {};

/**
 * Tests: use-accounts mutations (audit fix: dashboard invalidation)
 *
 * Covers useCreateAccount, useUpdateAccount, useDeactivateAccount.
 * Verifies all 3 invalidate ["dashboard"] (fix from session 26).
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCreateAccount,
  useUpdateAccount,
  useDeactivateAccount,
} from "@/lib/hooks/use-accounts";

const mockAccRpc = jest.fn();
const mockAccFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    rpc: mockAccRpc,
    from: mockAccFrom,
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

describe("useCreateAccount invalidation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("invalidates accounts, workflows, chart_of_accounts, and dashboard", async () => {
    mockAccRpc.mockResolvedValue({ data: { id: "coa-1" }, error: null });
    mockAccFrom.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "acc-1", name: "Conta Corrente", type: "checking" },
            error: null,
          }),
        }),
      }),
    });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateAccount(), { wrapper: wrap(client) });

    result.current.mutate({ name: "Conta Corrente", type: "checking", initial_balance: 0 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["accounts"]);
    expect(keys).toContainEqual(["dashboard"]);
    expect(keys).toContainEqual(["workflows"]);
    expect(keys).toContainEqual(["chart_of_accounts"]);
  });
});

describe("useUpdateAccount invalidation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("invalidates accounts and dashboard", async () => {
    mockAccFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "acc-1", name: "Updated" },
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUpdateAccount(), { wrapper: wrap(client) });

    result.current.mutate({ id: "acc-1", name: "Updated" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["accounts"]);
    expect(keys).toContainEqual(["dashboard"]);
  });
});

describe("useDeactivateAccount invalidation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("invalidates accounts and dashboard", async () => {
    mockAccFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useDeactivateAccount(), { wrapper: wrap(client) });

    result.current.mutate("acc-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["accounts"]);
    expect(keys).toContainEqual(["dashboard"]);
  });
});

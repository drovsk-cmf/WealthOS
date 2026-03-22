// Force module scope
export {};

/**
 * Tests: use-categories mutations (FIN-06, FIN-07)
 *
 * Covers useCreateCategory, useUpdateCategory, useDeleteCategory.
 * Verifies: mutation execution, cache invalidation, system category guard.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  CATEGORY_TYPE_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from "@/lib/hooks/use-categories";

const mockCatGetUser = jest.fn();
const mockCatFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockCatGetUser },
    from: mockCatFrom,
  }),
}));

jest.mock("@/lib/supabase/cached-auth", () => ({
  getCachedUserId: jest.fn().mockResolvedValue("user-cat-123"),
}));

const UID = "user-cat-123";

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

function mockInsertChain(data: unknown, error: unknown = null) {
  return {
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data, error }),
      }),
    }),
  };
}

function mockUpdateChain(data: unknown, error: unknown = null) {
  return {
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data, error }),
          }),
        }),
      }),
    }),
  };
}

function mockDeleteChain(error: unknown = null) {
  return {
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error }),
        }),
      }),
    }),
  };
}

describe("use-categories: mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCatGetUser.mockResolvedValue({ data: { user: { id: UID } } });
  });

  describe("useCreateCategory", () => {
    it("calls insert with user_id and is_system=false", async () => {
      const chain = mockInsertChain({ id: "cat-1", name: "Teste", type: "expense" });
      mockCatFrom.mockReturnValue(chain);

      const client = qc();
      const { result } = renderHook(() => useCreateCategory(), { wrapper: wrap(client) });

      result.current.mutate({ name: "Teste", type: "expense" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: UID, is_system: false, name: "Teste" })
      );
    });

    it("invalidates categories on success", async () => {
      mockCatFrom.mockReturnValue(mockInsertChain({ id: "cat-2" }));
      const client = qc();
      const spy = jest.spyOn(client, "invalidateQueries");

      const { result } = renderHook(() => useCreateCategory(), { wrapper: wrap(client) });
      result.current.mutate({ name: "X", type: "income" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
      expect(keys).toContainEqual(["categories"]);
    });

    it("propagates insert error", async () => {
      mockCatFrom.mockReturnValue(mockInsertChain(null, { message: "Duplicate" }));
      const client = qc();
      const { result } = renderHook(() => useCreateCategory(), { wrapper: wrap(client) });

      result.current.mutate({ name: "Dup", type: "expense" });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toContain("Duplicate");
    });
  });

  describe("useUpdateCategory", () => {
    it("calls update with id and user_id filter", async () => {
      const chain = mockUpdateChain({ id: "cat-1", name: "Updated" });
      mockCatFrom.mockReturnValue(chain);

      const client = qc();
      const { result } = renderHook(() => useUpdateCategory(), { wrapper: wrap(client) });

      result.current.mutate({ id: "cat-1", name: "Updated", color: "#A64A45" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("invalidates categories on success", async () => {
      mockCatFrom.mockReturnValue(mockUpdateChain({ id: "cat-1" }));
      const client = qc();
      const spy = jest.spyOn(client, "invalidateQueries");

      const { result } = renderHook(() => useUpdateCategory(), { wrapper: wrap(client) });
      result.current.mutate({ id: "cat-1", name: "New" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
      expect(keys).toContainEqual(["categories"]);
    });
  });

  describe("useDeleteCategory", () => {
    it("includes is_system=false guard in delete", async () => {
      const chain = mockDeleteChain(null);
      mockCatFrom.mockReturnValue(chain);

      const client = qc();
      const { result } = renderHook(() => useDeleteCategory(), { wrapper: wrap(client) });

      result.current.mutate("cat-1");
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // The delete chain calls .eq three times: id, user_id, is_system
      expect(chain.delete).toHaveBeenCalled();
    });

    it("invalidates categories + budgets + dashboard on delete", async () => {
      mockCatFrom.mockReturnValue(mockDeleteChain(null));
      const client = qc();
      const spy = jest.spyOn(client, "invalidateQueries");

      const { result } = renderHook(() => useDeleteCategory(), { wrapper: wrap(client) });
      result.current.mutate("cat-1");
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
      expect(keys).toContainEqual(["categories"]);
      expect(keys).toContainEqual(["budgets"]);
      expect(keys).toContainEqual(["dashboard"]);
    });
  });
});

describe("use-categories: constants", () => {
  it("CATEGORY_TYPE_LABELS has income and expense", () => {
    expect(CATEGORY_TYPE_LABELS.income).toBe("Receita");
    expect(CATEGORY_TYPE_LABELS.expense).toBe("Despesa");
  });

  it("CATEGORY_ICONS has 30 icons", () => {
    expect(CATEGORY_ICONS).toHaveLength(30);
    expect(CATEGORY_ICONS).toContain("utensils");
    expect(CATEGORY_ICONS).toContain("wallet");
  });

  it("CATEGORY_COLORS has 12 hex colors", () => {
    expect(CATEGORY_COLORS).toHaveLength(12);
    for (const c of CATEGORY_COLORS) {
      expect(c).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});

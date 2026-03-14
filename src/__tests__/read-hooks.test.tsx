import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useBudgets } from "@/lib/hooks/use-budgets";

type QueryResponse = { data: unknown; error: { message: string } | null };

const responses: QueryResponse[] = [];

function queueResponse(response: QueryResponse) {
  responses.push(response);
}

function createBuilder() {
  const response = responses.shift() ?? { data: [], error: null };
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    then: (resolve: (value: QueryResponse) => unknown) => Promise.resolve(response).then(resolve),
  };
  return builder;
}

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: jest.fn(() => createBuilder()),
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("read hooks", () => {
  beforeEach(() => {
    responses.length = 0;
  });

  it("useAccounts retorna dados com sucesso", async () => {
    queueResponse({ data: [{ id: "a1", name: "Conta" }], error: null });
    const { result } = renderHook(() => useAccounts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: "a1", name: "Conta" }]);
  });

  it("useAccounts retorna erro quando consulta falha", async () => {
    queueResponse({ data: null, error: { message: "falha accounts" } });
    const { result } = renderHook(() => useAccounts(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toContain("falha accounts");
  });

  it("useCategories retorna dados com sucesso", async () => {
    queueResponse({ data: [{ id: "c1", type: "expense" }], error: null });
    const { result } = renderHook(() => useCategories("expense"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: "c1", type: "expense" }]);
  });

  it("useCategories retorna erro quando consulta falha", async () => {
    queueResponse({ data: null, error: { message: "falha categories" } });
    const { result } = renderHook(() => useCategories(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toContain("falha categories");
  });

  it("useBudgets retorna dados com sucesso", async () => {
    queueResponse({
      data: [
        {
          id: "b1000000-0000-4000-8000-000000000001",
          user_id: "a1000000-0000-4000-8000-000000000001",
          category_id: "c1000000-0000-4000-8000-000000000001",
          month: "2026-03-01",
          planned_amount: 100,
          alert_threshold: 80,
          adjustment_index: null,
          coa_id: null,
          cost_center_id: null,
          created_at: "2026-03-01T00:00:00Z",
          updated_at: "2026-03-01T00:00:00Z",
          categories: { name: "Transporte", icon: null, color: null, type: "expense" },
        },
      ],
      error: null,
    });
    const { result } = renderHook(() => useBudgets("2026-03-01"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]).toMatchObject({ planned_amount: 100 });
  });

  it("useBudgets retorna erro quando consulta falha", async () => {
    queueResponse({ data: null, error: { message: "falha budgets" } });
    const { result } = renderHook(() => useBudgets("2026-03-01"), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toContain("falha budgets");
  });
});

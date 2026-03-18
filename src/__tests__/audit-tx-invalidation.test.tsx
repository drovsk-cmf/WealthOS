/**
 * Auditoria: Teste de invalidação de cache no transaction engine
 *
 * Ref: Problema 1 (useCreateTransaction/Transfer/Reverse não invalidam dashboard)
 * Ref: Problema 9 (onSuccess sem await)
 *
 * Verifica que TODAS as mutations que alteram transações/contas
 * invalidam corretamente as queryKeys dependentes.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCreateTransaction,
  useCreateTransfer,
  useReverseTransaction,
  useEditTransaction,
  useEditTransfer,
} from "@/lib/services/transaction-engine";

// ─── Mocks ──────────────────────────────────────────────────────

const mockRpc = jest.fn();
const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
    from: mockFrom,
  }),
}));

// Mock setup-journey (tryAdvanceStep)
jest.mock("@/lib/hooks/use-setup-journey", () => ({
  tryAdvanceStep: jest.fn(),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function wrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

// ─── Helpers ────────────────────────────────────────────────────

const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const VALID_UUID_2 = "22222222-2222-4222-8222-222222222222";

function setupMocks() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: VALID_UUID } },
  });
  mockFrom.mockReturnValue({
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: {}, error: null }),
          }),
        }),
      }),
    }),
  });
}

// ─── Testes ─────────────────────────────────────────────────────

describe("transaction engine: invalidação de cache (Auditoria P0)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe("useCreateTransaction", () => {
    it("deve invalidar transactions, accounts E dashboard após sucesso", async () => {
      mockRpc.mockResolvedValue({
        data: { transaction_id: VALID_UUID, journal_entry_id: null },
        error: null,
      });

      const qc = createTestQueryClient();
      const spy = jest.spyOn(qc, "invalidateQueries");

      const { result } = renderHook(() => useCreateTransaction(), {
        wrapper: wrapper(qc),
      });

      result.current.mutate({
        account_id: "acc-1",
        type: "expense",
        amount: 100,
        date: "2026-03-18",
        is_paid: true,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const invalidatedKeys = spy.mock.calls.map(
        (call) => (call[0] as { queryKey: string[] }).queryKey
      );

      expect(invalidatedKeys).toContainEqual(["transactions"]);
      expect(invalidatedKeys).toContainEqual(["accounts"]);
      expect(invalidatedKeys).toContainEqual(["dashboard"]);
    });
  });

  describe("useCreateTransfer", () => {
    it("deve invalidar transactions, accounts E dashboard após sucesso", async () => {
      mockRpc.mockResolvedValue({
        data: {
          from_transaction_id: VALID_UUID,
          to_transaction_id: VALID_UUID_2,
          journal_entry_id: null,
          amount: 500,
        },
        error: null,
      });

      const qc = createTestQueryClient();
      const spy = jest.spyOn(qc, "invalidateQueries");

      const { result } = renderHook(() => useCreateTransfer(), {
        wrapper: wrapper(qc),
      });

      result.current.mutate({
        from_account_id: "acc-from",
        to_account_id: "acc-to",
        amount: 500,
        date: "2026-03-18",
        is_paid: true,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const invalidatedKeys = spy.mock.calls.map(
        (call) => (call[0] as { queryKey: string[] }).queryKey
      );

      expect(invalidatedKeys).toContainEqual(["transactions"]);
      expect(invalidatedKeys).toContainEqual(["accounts"]);
      expect(invalidatedKeys).toContainEqual(["dashboard"]);
    });
  });

  describe("useReverseTransaction", () => {
    it("deve invalidar transactions, accounts E dashboard após sucesso", async () => {
      mockRpc.mockResolvedValue({
        data: {
          reversed_transaction_id: VALID_UUID,
          reversal_journal_id: null,
        },
        error: null,
      });

      const qc = createTestQueryClient();
      const spy = jest.spyOn(qc, "invalidateQueries");

      const { result } = renderHook(() => useReverseTransaction(), {
        wrapper: wrapper(qc),
      });

      result.current.mutate(VALID_UUID);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const invalidatedKeys = spy.mock.calls.map(
        (call) => (call[0] as { queryKey: string[] }).queryKey
      );

      expect(invalidatedKeys).toContainEqual(["transactions"]);
      expect(invalidatedKeys).toContainEqual(["accounts"]);
      expect(invalidatedKeys).toContainEqual(["dashboard"]);
    });
  });

  describe("useEditTransaction", () => {
    it("deve invalidar transactions, accounts E dashboard após sucesso", async () => {
      mockRpc.mockResolvedValue({
        data: {
          original_id: VALID_UUID,
          new_transaction_id: VALID_UUID_2,
          new_journal_entry_id: null,
          reversal_journal_id: null,
        },
        error: null,
      });

      const qc = createTestQueryClient();
      const spy = jest.spyOn(qc, "invalidateQueries");

      const { result } = renderHook(() => useEditTransaction(), {
        wrapper: wrapper(qc),
      });

      result.current.mutate({
        original_transaction_id: VALID_UUID,
        account_id: "acc-1",
        type: "expense",
        amount: 200,
        date: "2026-03-18",
        is_paid: true,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const invalidatedKeys = spy.mock.calls.map(
        (call) => (call[0] as { queryKey: string[] }).queryKey
      );

      expect(invalidatedKeys).toContainEqual(["transactions"]);
      expect(invalidatedKeys).toContainEqual(["accounts"]);
      expect(invalidatedKeys).toContainEqual(["dashboard"]);
    });
  });

  describe("useEditTransfer", () => {
    it("deve invalidar transactions, accounts E dashboard após sucesso", async () => {
      mockRpc.mockResolvedValue({
        data: {
          original_id: VALID_UUID,
          original_pair_id: null,
          new_from_transaction_id: VALID_UUID,
          new_to_transaction_id: VALID_UUID_2,
          new_journal_entry_id: null,
        },
        error: null,
      });

      const qc = createTestQueryClient();
      const spy = jest.spyOn(qc, "invalidateQueries");

      const { result } = renderHook(() => useEditTransfer(), {
        wrapper: wrapper(qc),
      });

      result.current.mutate({
        original_transaction_id: VALID_UUID,
        from_account_id: "acc-from",
        to_account_id: "acc-to",
        amount: 300,
        date: "2026-03-18",
        is_paid: true,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const invalidatedKeys = spy.mock.calls.map(
        (call) => (call[0] as { queryKey: string[] }).queryKey
      );

      expect(invalidatedKeys).toContainEqual(["transactions"]);
      expect(invalidatedKeys).toContainEqual(["accounts"]);
      expect(invalidatedKeys).toContainEqual(["dashboard"]);
    });
  });
});

describe("transaction engine: tratamento de erros", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it("useCreateTransaction propaga erro do RPC", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Saldo insuficiente" },
    });

    const qc = createTestQueryClient();
    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: wrapper(qc),
    });

    result.current.mutate({
      account_id: "acc-1",
      type: "expense",
      amount: 9999,
      date: "2026-03-18",
      is_paid: true,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain("Saldo insuficiente");
  });

  it("useCreateTransaction rejeita resposta com schema inválido", async () => {
    mockRpc.mockResolvedValue({
      data: { invalid_field: true }, // Missing transaction_id
      error: null,
    });

    const qc = createTestQueryClient();
    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: wrapper(qc),
    });

    result.current.mutate({
      account_id: "acc-1",
      type: "income",
      amount: 50,
      date: "2026-03-18",
      is_paid: true,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain("Resposta inválida");
  });
});

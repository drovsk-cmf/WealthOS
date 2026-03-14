import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreateTransaction, useCreateTransfer } from "@/lib/services/transaction-engine";

const mockRpc = jest.fn();
const mockGetUser = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
    from: () => ({ update: () => ({ eq: jest.fn() }) }),
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("transaction mutation hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("useCreateTransaction chama RPC create_transaction_with_journal", async () => {
    mockRpc.mockResolvedValue({
      data: {
        transaction_id: "11111111-1111-4111-8111-111111111111",
        journal_entry_id: null,
      },
      error: null,
    });

    const { result } = renderHook(() => useCreateTransaction(), { wrapper });

    result.current.mutate({
      account_id: "acc-1",
      type: "expense",
      amount: 10,
      date: "2026-03-13",
      is_paid: true,
    });

    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc).toHaveBeenCalledWith(
      "create_transaction_with_journal",
      expect.objectContaining({ p_user_id: "user-1", p_account_id: "acc-1", p_amount: 10 })
    );
  });

  it("useCreateTransfer chama RPC create_transfer_with_journal", async () => {
    mockRpc.mockResolvedValue({
      data: {
        from_transaction_id: "11111111-1111-4111-8111-111111111111",
        to_transaction_id: "22222222-2222-4222-8222-222222222222",
        journal_entry_id: null,
        amount: 10,
      },
      error: null,
    });

    const { result } = renderHook(() => useCreateTransfer(), { wrapper });

    result.current.mutate({
      from_account_id: "acc-from",
      to_account_id: "acc-to",
      amount: 10,
      date: "2026-03-13",
      is_paid: true,
    });

    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(mockRpc).toHaveBeenCalledWith(
      "create_transfer_with_journal",
      expect.objectContaining({ p_user_id: "user-1", p_from_account_id: "acc-from", p_to_account_id: "acc-to" })
    );
  });
});

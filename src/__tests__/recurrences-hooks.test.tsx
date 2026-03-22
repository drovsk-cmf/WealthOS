// Force module scope
export {};

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  FREQUENCY_LABELS, FREQUENCY_OPTIONS, useDeactivateRecurrence,
} from "@/lib/hooks/use-recurrences";

const mockRecFrom = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) }, from: mockRecFrom }),
}));
jest.mock("@/lib/supabase/cached-auth", () => ({ getCachedUserId: jest.fn().mockResolvedValue("u1") }));
jest.mock("@/lib/hooks/use-setup-journey", () => ({ tryAdvanceStep: jest.fn() }));

function qc() { return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); }
function wrap(c: QueryClient) { return function W({ children }: { children: React.ReactNode }) { return <QueryClientProvider client={c}>{children}</QueryClientProvider>; }; }

describe("FREQUENCY_LABELS", () => {
  it("has 4 frequencies", () => { expect(Object.keys(FREQUENCY_LABELS)).toHaveLength(4); });
  it("monthly is Mensal", () => { expect(FREQUENCY_LABELS.monthly).toBe("Mensal"); });
  it("weekly is Semanal", () => { expect(FREQUENCY_LABELS.weekly).toBe("Semanal"); });
  it("daily is Diária", () => { expect(FREQUENCY_LABELS.daily).toBe("Diária"); });
  it("yearly is Anual", () => { expect(FREQUENCY_LABELS.yearly).toBe("Anual"); });
});

describe("FREQUENCY_OPTIONS", () => {
  it("has 4 options", () => { expect(FREQUENCY_OPTIONS).toHaveLength(4); });
  it("each has value and label", () => { for (const o of FREQUENCY_OPTIONS) { expect(o.value).toBeTruthy(); expect(o.label).toBeTruthy(); } });
});

describe("useDeactivateRecurrence", () => {
  beforeEach(() => jest.clearAllMocks());
  it("invalidates recurrences + bills on success", async () => {
    mockRecFrom.mockReturnValue({ update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }) });
    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useDeactivateRecurrence(), { wrapper: wrap(client) });
    result.current.mutate("r1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["recurrences"]);
    expect(keys).toContainEqual(["bills"]);
  });
});

// Force module scope
export {};

/**
 * Tests: use-assets (PAT-01 to PAT-07)
 *
 * Covers:
 * - ASSET_CATEGORY_LABELS, ASSET_CATEGORY_OPTIONS (constants)
 * - useCreateAsset, useUpdateAsset, useDeleteAsset (mutations + invalidation)
 * - useDepreciateAsset (RPC mutation)
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ASSET_CATEGORY_LABELS,
  ASSET_CATEGORY_OPTIONS,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useDepreciateAsset,
} from "@/lib/hooks/use-assets";

const mockAssetRpc = jest.fn();
const mockAssetFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    rpc: mockAssetRpc,
    from: mockAssetFrom,
  }),
}));

jest.mock("@/lib/supabase/cached-auth", () => ({
  getCachedUserId: jest.fn().mockResolvedValue("u1"),
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

// ─── Constants ──────────────────────────────────────────────────

describe("ASSET_CATEGORY_LABELS", () => {
  it("has 14 categories", () => {
    expect(Object.keys(ASSET_CATEGORY_LABELS)).toHaveLength(14);
  });

  it("includes real_estate", () => {
    expect(ASSET_CATEGORY_LABELS.real_estate).toBe("Imóvel");
  });

  it("includes all vehicle subtypes", () => {
    expect(ASSET_CATEGORY_LABELS.vehicle_auto).toBe("Automóvel");
    expect(ASSET_CATEGORY_LABELS.vehicle_moto).toBe("Motocicleta");
    expect(ASSET_CATEGORY_LABELS.vehicle_recreational).toBe("Embarcação/Trailer");
    expect(ASSET_CATEGORY_LABELS.vehicle_aircraft).toBe("Aeronave");
  });

  it("includes restricted", () => {
    expect(ASSET_CATEGORY_LABELS.restricted).toBe("Restrito");
  });
});

describe("ASSET_CATEGORY_OPTIONS", () => {
  it("has 14 options", () => {
    expect(ASSET_CATEGORY_OPTIONS).toHaveLength(14);
  });

  it("each option has value, label, description", () => {
    for (const opt of ASSET_CATEGORY_OPTIONS) {
      expect(opt.value).toBeTruthy();
      expect(opt.label).toBeTruthy();
      expect(opt.description).toBeTruthy();
    }
  });

  it("vehicle_auto has car-related description", () => {
    const auto = ASSET_CATEGORY_OPTIONS.find((o) => o.value === "vehicle_auto");
    expect(auto?.description).toMatch(/carro|suv|caminhonete/i);
  });
});

// ─── Mutations ──────────────────────────────────────────────────

describe("useCreateAsset", () => {
  beforeEach(() => jest.clearAllMocks());

  it("invalidates assets and dashboard on success", async () => {
    // useCreateAsset calls from() 3 times:
    // 1. chart_of_accounts (resolveCOA)
    // 2. assets (insert)
    // 3. asset_value_history (initial value record)
    let fromCallCount = 0;
    mockAssetFrom.mockImplementation((table: string) => {
      fromCallCount++;
      if (table === "chart_of_accounts") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: "coa-1" }, error: null }),
            }),
          }),
        };
      }
      if (table === "assets") {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "a1", name: "Apartamento", category: "real_estate" },
                error: null,
              }),
            }),
          }),
        };
      }
      // asset_value_history
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
    });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateAsset(), { wrapper: wrap(client) });

    result.current.mutate({
      name: "Apartamento",
      category: "real_estate",
      acquisition_date: "2026-01-01",
      acquisition_value: 500000,
      current_value: 550000,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["assets"]);
    expect(keys).toContainEqual(["dashboard"]);
  });

  it("propagates insert error", async () => {
    mockAssetFrom.mockImplementation((table: string) => {
      if (table === "chart_of_accounts") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "unique violation" },
            }),
          }),
        }),
      };
    });

    const client = qc();
    const { result } = renderHook(() => useCreateAsset(), { wrapper: wrap(client) });

    result.current.mutate({
      name: "Dup",
      category: "other",
      acquisition_date: "2026-01-01",
      acquisition_value: 100,
      current_value: 100,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useUpdateAsset", () => {
  beforeEach(() => jest.clearAllMocks());

  it("invalidates assets and dashboard on success", async () => {
    mockAssetFrom.mockImplementation((table: string) => {
      if (table === "chart_of_accounts") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: "coa-1" }, error: null }),
            }),
          }),
        };
      }
      if (table === "assets") {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: "a1", name: "Updated", current_value: 600000 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "a1", current_value: 500000 },
                error: null,
              }),
            }),
          }),
        };
      }
      // asset_value_history
      return { insert: jest.fn().mockResolvedValue({ error: null }) };
    });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUpdateAsset(), { wrapper: wrap(client) });

    result.current.mutate({ id: "a1", name: "Updated", current_value: 600000 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["assets"]);
    expect(keys).toContainEqual(["dashboard"]);
  });
});

describe("useDeleteAsset", () => {
  beforeEach(() => jest.clearAllMocks());

  it("invalidates assets and dashboard on success", async () => {
    mockAssetFrom.mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useDeleteAsset(), { wrapper: wrap(client) });

    result.current.mutate("a1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["assets"]);
    expect(keys).toContainEqual(["dashboard"]);
  });
});

describe("useDepreciateAsset", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls depreciate_asset RPC and invalidates assets + dashboard", async () => {
    mockAssetRpc.mockResolvedValue({
      data: { status: "ok", previous_value: 1000, depreciation: 100, new_value: 900 },
      error: null,
    });

    const client = qc();
    const spy = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useDepreciateAsset(), { wrapper: wrap(client) });

    result.current.mutate("a1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockAssetRpc).toHaveBeenCalledWith("depreciate_asset", expect.objectContaining({
      p_asset_id: "a1",
    }));

    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey);
    expect(keys).toContainEqual(["assets"]);
    expect(keys).toContainEqual(["dashboard"]);
  });
});

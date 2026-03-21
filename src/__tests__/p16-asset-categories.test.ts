import {
  ASSET_CATEGORY_LABELS,
  ASSET_CATEGORY_OPTIONS,
  ASSET_CATEGORY_COLORS,
} from "@/lib/hooks/use-assets";
import { LIQUIDITY_TIER_OPTIONS } from "@/lib/hooks/use-accounts";
import { assetsSummarySchema } from "@/lib/schemas/rpc";

describe("P16: Asset category expansion (5 → 14)", () => {
  const EXPECTED_CATEGORIES = [
    "real_estate", "vehicle", "vehicle_auto", "vehicle_moto",
    "vehicle_recreational", "vehicle_aircraft", "electronics",
    "jewelry", "fashion", "furniture", "sports", "collectibles",
    "other", "restricted",
  ];

  it("ASSET_CATEGORY_LABELS tem 14 entradas", () => {
    expect(Object.keys(ASSET_CATEGORY_LABELS)).toHaveLength(14);
  });

  it("ASSET_CATEGORY_OPTIONS tem 14 entradas", () => {
    expect(ASSET_CATEGORY_OPTIONS).toHaveLength(14);
  });

  it("ASSET_CATEGORY_COLORS tem 14 entradas", () => {
    expect(Object.keys(ASSET_CATEGORY_COLORS)).toHaveLength(14);
  });

  it("todas as 14 categorias têm label", () => {
    for (const cat of EXPECTED_CATEGORIES) {
      expect(ASSET_CATEGORY_LABELS[cat as keyof typeof ASSET_CATEGORY_LABELS]).toBeTruthy();
    }
  });

  it("todas as 14 categorias têm cor", () => {
    for (const cat of EXPECTED_CATEGORIES) {
      const color = ASSET_CATEGORY_COLORS[cat as keyof typeof ASSET_CATEGORY_COLORS];
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("labels são strings pt-BR não vazias", () => {
    for (const label of Object.values(ASSET_CATEGORY_LABELS)) {
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("options têm value, label e description", () => {
    for (const opt of ASSET_CATEGORY_OPTIONS) {
      expect(opt.value).toBeTruthy();
      expect(opt.label).toBeTruthy();
      expect(opt.description).toBeTruthy();
    }
  });

  it("assetsSummarySchema aceita novas categorias", () => {
    const result = assetsSummarySchema.safeParse({
      total_value: 100000,
      total_acquisition: 80000,
      asset_count: 3,
      by_category: [
        { category: "vehicle_auto", count: 1, total_value: 50000 },
        { category: "jewelry", count: 1, total_value: 15000 },
        { category: "furniture", count: 1, total_value: 4000 },
      ],
      expiring_insurance: [],
      total_depreciation: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("assetsSummarySchema rejeita categoria inválida", () => {
    const result = assetsSummarySchema.safeParse({
      total_value: 0, total_acquisition: 0, asset_count: 0,
      by_category: [{ category: "spaceship", count: 1, total_value: 99 }],
      expiring_insurance: [], total_depreciation: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("P1: Tier → Nível renaming", () => {
  it("LIQUIDITY_TIER_OPTIONS usa nomenclatura N1-N4", () => {
    expect(LIQUIDITY_TIER_OPTIONS[0].label).toContain("N1");
    expect(LIQUIDITY_TIER_OPTIONS[1].label).toContain("N2");
    expect(LIQUIDITY_TIER_OPTIONS[2].label).toContain("N3");
    expect(LIQUIDITY_TIER_OPTIONS[3].label).toContain("N4");
  });

  it("LIQUIDITY_TIER_OPTIONS não contém T1-T4", () => {
    for (const opt of LIQUIDITY_TIER_OPTIONS) {
      expect(opt.label).not.toMatch(/\bT[1-4]\b/);
    }
  });
});

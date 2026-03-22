/**
 * Tests: use-fiscal constants (FIS-01 to FIS-06) + timing-safe
 */

import { TAX_TREATMENT_LABELS, TAX_TREATMENT_COLORS } from "@/lib/hooks/use-fiscal";
import { timingSafeCompare } from "@/lib/auth/timing-safe";

describe("TAX_TREATMENT_LABELS", () => {
  it("has 8 treatments", () => {
    expect(Object.keys(TAX_TREATMENT_LABELS)).toHaveLength(8);
  });
  it("tributavel is Tributável", () => { expect(TAX_TREATMENT_LABELS.tributavel).toBe("Tributável"); });
  it("isento is Isento / Não tributável", () => { expect(TAX_TREATMENT_LABELS.isento).toContain("Isento"); });
  it("exclusivo_fonte exists", () => { expect(TAX_TREATMENT_LABELS.exclusivo_fonte).toBeTruthy(); });
  it("ganho_capital exists", () => { expect(TAX_TREATMENT_LABELS.ganho_capital).toBeTruthy(); });
  it("dedutivel_integral exists", () => { expect(TAX_TREATMENT_LABELS.dedutivel_integral).toBeTruthy(); });
  it("dedutivel_limitado exists", () => { expect(TAX_TREATMENT_LABELS.dedutivel_limitado).toBeTruthy(); });
  it("nao_dedutivel exists", () => { expect(TAX_TREATMENT_LABELS.nao_dedutivel).toBeTruthy(); });
  it("variavel exists", () => { expect(TAX_TREATMENT_LABELS.variavel).toBeTruthy(); });
});

describe("TAX_TREATMENT_COLORS", () => {
  it("has same keys as labels", () => {
    const labelKeys = Object.keys(TAX_TREATMENT_LABELS);
    const colorKeys = Object.keys(TAX_TREATMENT_COLORS);
    for (const key of labelKeys) { expect(colorKeys).toContain(key); }
  });
  it("all colors are hex", () => {
    for (const color of Object.values(TAX_TREATMENT_COLORS)) { expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/); }
  });
});

describe("timingSafeCompare", () => {
  it("returns true for identical strings", () => { expect(timingSafeCompare("abc123", "abc123")).toBe(true); });
  it("returns false for different strings same length", () => { expect(timingSafeCompare("abc123", "abc124")).toBe(false); });
  it("returns false for different length strings", () => { expect(timingSafeCompare("short", "longer-string")).toBe(false); });
  it("returns true for empty strings", () => { expect(timingSafeCompare("", "")).toBe(true); });
  it("returns false when one is empty", () => { expect(timingSafeCompare("", "a")).toBe(false); });
  it("is case-sensitive", () => { expect(timingSafeCompare("Secret", "secret")).toBe(false); });
  it("handles long strings", () => {
    const s = "a".repeat(256);
    expect(timingSafeCompare(s, s)).toBe(true);
    expect(timingSafeCompare(s, s.slice(0, -1) + "b")).toBe(false);
  });
  it("handles unicode", () => { expect(timingSafeCompare("café", "café")).toBe(true); });
  it("handles special characters", () => {
    const t = "Bearer sk-ant-api03-LeM8v5RZ3vK_";
    expect(timingSafeCompare(t, t)).toBe(true);
  });
});

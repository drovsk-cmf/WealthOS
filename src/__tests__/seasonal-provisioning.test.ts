/**
 * Oniefy - Seasonal Provisioning Tests (E33)
 */

import {
  detectSeasonalPatterns,
  getSeasonalAlerts,
  type TransactionForSeasonal,
} from "@/lib/services/seasonal-provisioning";

function tx(amount: number, date: string, category: string): TransactionForSeasonal {
  return { amount, date, category_name: category };
}

// Generate 12 months of regular spending + December spike for Supermercado
function generateSeasonalData(): TransactionForSeasonal[] {
  const txs: TransactionForSeasonal[] = [];
  for (let m = 1; m <= 12; m++) {
    const month = String(m).padStart(2, "0");
    // Regular: ~R$800/month, December: ~R$2400 (3x spike)
    const amount = m === 12 ? -2400 : -800;
    txs.push(tx(amount, `2025-${month}-15`, "Supermercado"));
    // Non-seasonal category: steady R$200/month
    txs.push(tx(-200, `2025-${month}-10`, "Transporte"));
  }
  // January spike for Educação (matrícula)
  for (let m = 1; m <= 12; m++) {
    const month = String(m).padStart(2, "0");
    const amount = m === 1 ? -5000 : -500;
    txs.push(tx(amount, `2025-${month}-05`, "Educação"));
  }
  return txs;
}

describe("Seasonal Provisioning — Detection", () => {
  const data = generateSeasonalData();

  test("detects December spike in Supermercado", () => {
    const patterns = detectSeasonalPatterns(data);
    const supermercado = patterns.find((p) => p.categoryName === "Supermercado");
    expect(supermercado).toBeDefined();
    expect(supermercado!.spikeMonths).toContain(12);
    expect(supermercado!.spikeRatio).toBeGreaterThan(2);
  });

  test("detects January spike in Educação", () => {
    const patterns = detectSeasonalPatterns(data);
    const educacao = patterns.find((p) => p.categoryName === "Educação");
    expect(educacao).toBeDefined();
    expect(educacao!.spikeMonths).toContain(1);
  });

  test("does NOT detect Transporte as seasonal (steady)", () => {
    const patterns = detectSeasonalPatterns(data);
    const transporte = patterns.find((p) => p.categoryName === "Transporte");
    expect(transporte).toBeUndefined();
  });

  test("suggestedProvision = annualTotal / 12", () => {
    const patterns = detectSeasonalPatterns(data);
    for (const p of patterns) {
      expect(p.suggestedProvision).toBeCloseTo(p.annualTotal / 12, 0);
    }
  });

  test("returns empty for insufficient data (< 6 months)", () => {
    const short = [
      tx(-800, "2025-01-15", "Supermercado"),
      tx(-800, "2025-02-15", "Supermercado"),
      tx(-2400, "2025-03-15", "Supermercado"),
    ];
    expect(detectSeasonalPatterns(short)).toHaveLength(0);
  });

  test("ignores income transactions", () => {
    const income = Array.from({ length: 12 }, (_, i) =>
      tx(10000, `2025-${String(i + 1).padStart(2, "0")}-05`, "Salário")
    );
    expect(detectSeasonalPatterns(income)).toHaveLength(0);
  });
});

describe("Seasonal Provisioning — Alerts", () => {
  const data = generateSeasonalData();
  const patterns = detectSeasonalPatterns(data);

  test("alerts 3 months before December (current = October)", () => {
    const alerts = getSeasonalAlerts(patterns, 10); // October
    const decAlert = alerts.find((a) => a.spikeMonth === 12);
    expect(decAlert).toBeDefined();
    expect(decAlert!.monthsUntil).toBe(2);
    expect(decAlert!.message).toContain("Supermercado");
  });

  test("alerts for January spike when current = November", () => {
    const alerts = getSeasonalAlerts(patterns, 11); // November
    const janAlert = alerts.find((a) => a.spikeMonth === 1);
    expect(janAlert).toBeDefined();
    expect(janAlert!.monthsUntil).toBe(2);
  });

  test("no alerts when spikes are far away", () => {
    const alerts = getSeasonalAlerts(patterns, 6); // June
    // December is 6 months away, January is 7 months away → no alerts
    expect(alerts).toHaveLength(0);
  });

  test("alerts sorted by urgency (most urgent first)", () => {
    const alerts = getSeasonalAlerts(patterns, 10);
    for (let i = 1; i < alerts.length; i++) {
      expect(alerts[i].monthsUntil).toBeGreaterThanOrEqual(alerts[i - 1].monthsUntil);
    }
  });
});

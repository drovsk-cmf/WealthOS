/**
 * Oniefy - Price Anomaly Detector Tests (E27)
 * Ref: docs/FEATURES-ROADMAP-SPEC.md §3.3
 */

import {
  checkPriceAnomaly,
  checkAllPriceAnomalies,
} from "@/lib/services/price-anomaly-detector";

describe("Price Anomaly Detector", () => {
  test("no alert when within normal range", () => {
    const r = checkPriceAnomaly("Netflix", 49.90, [49.90, 49.90, 49.90, 49.90]);
    expect(r).toBeNull();
  });

  test("amber alert at 18% increase", () => {
    // avg = 290, current = 342 → +17.9%
    const r = checkPriceAnomaly("Conta de Luz", 342, [280, 290, 300, 290]);
    expect(r).not.toBeNull();
    expect(r!.severity).toBe("amber");
    expect(r!.percentChange).toBeGreaterThan(15);
    expect(r!.percentChange).toBeLessThan(30);
  });

  test("red alert at 65% increase", () => {
    // avg = 290, current = 480 → +65.5%
    const r = checkPriceAnomaly("Conta de Luz", 480, [280, 290, 300, 290]);
    expect(r).not.toBeNull();
    expect(r!.severity).toBe("red");
    expect(r!.percentChange).toBeGreaterThan(60);
    expect(r!.message).toContain("subiu");
    expect(r!.message).toContain("Conta de Luz");
  });

  test("custom thresholds work", () => {
    // avg = 100, current = 108 → +8%
    const r = checkPriceAnomaly("Test", 108, [100, 100, 100], { amber: 5, red: 10 });
    expect(r).not.toBeNull();
    expect(r!.severity).toBe("amber");
  });

  test("returns null for insufficient history (<2 data points)", () => {
    const r = checkPriceAnomaly("Test", 100, [95]);
    expect(r).toBeNull();
  });

  test("returns null for zero/negative current amount", () => {
    const r = checkPriceAnomaly("Test", 0, [100, 100, 100]);
    expect(r).toBeNull();
  });

  test("batch check returns only alerts, sorted by severity", () => {
    const alerts = checkAllPriceAnomalies([
      { description: "Netflix", amounts: [49.9, 49.9, 49.9, 49.9] }, // no alert
      { description: "Luz", amounts: [280, 290, 300, 480] }, // red
      { description: "Água", amounts: [80, 85, 90, 108] }, // amber (~22%)
      { description: "Internet", amounts: [120, 120] }, // too few points
    ]);
    expect(alerts).toHaveLength(2);
    expect(alerts[0].severity).toBe("red"); // Luz first
    expect(alerts[0].description).toBe("Luz");
    expect(alerts[1].severity).toBe("amber"); // Água second
  });

  test("batch returns empty for all-normal recurrences", () => {
    const alerts = checkAllPriceAnomalies([
      { description: "Netflix", amounts: [49.9, 49.9, 49.9, 49.9] },
      { description: "Spotify", amounts: [21.9, 21.9, 21.9, 21.9] },
    ]);
    expect(alerts).toHaveLength(0);
  });
});

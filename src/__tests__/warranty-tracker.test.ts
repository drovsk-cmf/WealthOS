/**
 * Oniefy - Warranty Tracker Tests (E31)
 */

import {
  getWarrantyStatus,
  getExpiringWarranties,
  type Warranty,
} from "@/lib/services/warranty-tracker";

const NOW = new Date("2026-04-02T12:00:00");

function w(id: string, name: string, purchase: string, mfg: number, card = 0): Warranty {
  return { id, productName: name, purchaseDate: purchase, manufacturerMonths: mfg, cardExtensionMonths: card };
}

describe("Warranty Tracker", () => {
  test("active warranty with plenty of time", () => {
    const s = getWarrantyStatus(w("1", "MacBook", "2025-10-01", 12), 30, NOW);
    expect(s.status).toBe("active");
    expect(s.daysRemaining).toBeGreaterThan(150);
    expect(s.totalMonths).toBe(12);
    expect(s.summary).toContain("ativa");
  });

  test("expiring soon (within 30 days)", () => {
    // Purchased 11 months and 5 days ago, 12 month warranty → ~25 days left
    const s = getWarrantyStatus(w("2", "iPhone", "2025-04-07", 12), 30, NOW);
    expect(s.status).toBe("expiring_soon");
    expect(s.daysRemaining).toBeLessThanOrEqual(30);
    expect(s.daysRemaining).toBeGreaterThan(0);
    expect(s.summary).toContain("expira em");
  });

  test("expired warranty", () => {
    const s = getWarrantyStatus(w("3", "Mouse", "2024-01-01", 12), 30, NOW);
    expect(s.status).toBe("expired");
    expect(s.daysRemaining).toBeLessThan(0);
    expect(s.summary).toContain("expirou");
  });

  test("credit card extension adds to total", () => {
    // 12m manufacturer + 12m card = 24 months total
    const s = getWarrantyStatus(w("4", "TV", "2025-01-01", 12, 12), 30, NOW);
    expect(s.totalMonths).toBe(24);
    expect(s.status).toBe("active"); // 24 months from Jan 2025 = Jan 2027
    expect(s.summary).toContain("12m fabricante + 12m cartão");
  });

  test("zero card extension shows only manufacturer", () => {
    const s = getWarrantyStatus(w("5", "Fone", "2026-01-01", 6), 30, NOW);
    expect(s.summary).toContain("6m fabricante");
    expect(s.summary).not.toContain("cartão");
  });

  test("custom alert threshold (90 days)", () => {
    // Purchase May 2025, 12 months warranty → expires May 2026 → ~28 days from NOW
    // With 90-day threshold, this should be "expiring_soon"
    const s = getWarrantyStatus(w("6", "Geladeira", "2025-05-01", 12), 90, NOW);
    expect(s.status).toBe("expiring_soon");
    expect(s.daysRemaining).toBeLessThanOrEqual(90);
  });

  test("expiration date calculated correctly", () => {
    const s = getWarrantyStatus(w("7", "Tablet", "2025-06-15", 12), 30, NOW);
    expect(s.expirationDate).toBe("2026-06-15");
  });

  test("getExpiringWarranties filters and sorts", () => {
    const warranties = [
      w("a", "Ativo longe", "2026-01-01", 24),          // active, far away
      w("b", "Expirando logo", "2025-04-07", 12),        // expiring ~5 days
      w("c", "Já expirou", "2024-01-01", 12),            // expired
      w("d", "Expirando em 20d", "2025-04-20", 12),      // expiring ~18 days
    ];
    const expiring = getExpiringWarranties(warranties, 30, NOW);
    expect(expiring.length).toBeGreaterThanOrEqual(1);
    // Should be sorted by daysRemaining ascending (most urgent first)
    for (let i = 1; i < expiring.length; i++) {
      expect(expiring[i].daysRemaining).toBeGreaterThanOrEqual(expiring[i - 1].daysRemaining);
    }
    // Should NOT include expired or far-away active
    expect(expiring.every((s) => s.status === "expiring_soon")).toBe(true);
  });
});

/**
 * Tests: Weekly Digest Email Template (UX-H3-03)
 *
 * Covers buildWeeklyDigestHtml, escapeHtml (implicit), formatBRL (implicit).
 * Currently at 6% coverage - this should raise to 80%+.
 */

import {
  buildWeeklyDigestHtml,
  type WeeklyDigestData,
} from "@/lib/email/weekly-digest-template";

function makeDigest(overrides: Partial<WeeklyDigestData> = {}): WeeklyDigestData {
  return {
    week_start: "2026-03-16",
    week_end: "2026-03-22",
    total_income: 15000,
    total_expense: 8500,
    transaction_count: 42,
    top_categories: [
      { category_name: "Alimentação", total: 2500 },
      { category_name: "Transporte", total: 1800 },
    ],
    pending_count: 0,
    uncategorized_count: 0,
    user_name: "Claudio",
    ...overrides,
  };
}

describe("buildWeeklyDigestHtml", () => {
  it("returns valid HTML string", () => {
    const html = buildWeeklyDigestHtml(makeDigest());
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("accepts user_name in data (used for email personalization)", () => {
    // user_name is part of the interface but template may not render it inline
    const html = buildWeeklyDigestHtml(makeDigest({ user_name: "Maria" }));
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("includes formatted income value", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ total_income: 15000 }));
    // pt-BR format: R$ 15.000,00
    expect(html).toContain("15.000");
  });

  it("includes formatted expense value", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ total_expense: 8500 }));
    expect(html).toContain("8.500");
  });

  it("shows positive result color when income > expense", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ total_income: 10000, total_expense: 5000 }));
    // Sage color for positive
    expect(html).toContain("#7E9487");
  });

  it("shows negative result color when expense > income", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ total_income: 3000, total_expense: 8000 }));
    // Terracotta-ish for negative
    expect(html).toContain("#C4715B");
  });

  it("includes top categories", () => {
    const html = buildWeeklyDigestHtml(makeDigest());
    expect(html).toContain("Alimentação");
    expect(html).toContain("Transporte");
  });

  it("shows empty state when no categories", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ top_categories: [] }));
    expect(html).toContain("Sem despesas categorizadas");
  });

  it("shows pending alert when pending_count > 0", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ pending_count: 3 }));
    expect(html).toContain("3 transações pendentes");
  });

  it("shows singular pending when count is 1", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ pending_count: 1 }));
    expect(html).toContain("1 transação pendente");
  });

  it("shows uncategorized alert when uncategorized_count > 0", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ uncategorized_count: 5 }));
    expect(html).toContain("5 transações sem");
  });

  it("shows singular uncategorized when count is 1", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ uncategorized_count: 1 }));
    expect(html).toContain("1 transação sem");
  });

  it("omits pending alert when count is 0", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ pending_count: 0 }));
    expect(html).not.toContain("pendente");
  });

  it("omits uncategorized alert when count is 0", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ uncategorized_count: 0 }));
    expect(html).not.toContain("sem categoria");
  });

  it("escapes HTML in category names (XSS prevention)", () => {
    const html = buildWeeklyDigestHtml(
      makeDigest({
        top_categories: [{ category_name: "A&B", total: 100 }],
      })
    );
    expect(html).toContain("A&amp;B");
  });

  it("escapes special characters in category names", () => {
    const html = buildWeeklyDigestHtml(
      makeDigest({
        top_categories: [{ category_name: "Test<>\"'", total: 100 }],
      })
    );
    expect(html).toContain("&lt;");
    expect(html).toContain("&gt;");
  });

  it("includes transaction count", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ transaction_count: 42 }));
    expect(html).toContain("42");
  });

  it("includes Oniefy branding", () => {
    const html = buildWeeklyDigestHtml(makeDigest());
    expect(html).toContain("Oniefy");
  });

  it("includes week date range", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ week_start: "2026-03-16", week_end: "2026-03-22" }));
    // Should contain formatted dates
    expect(html).toContain("mar");
  });

  it("handles zero income and expense", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ total_income: 0, total_expense: 0 }));
    expect(html).toContain("R$");
  });

  it("handles large numbers", () => {
    const html = buildWeeklyDigestHtml(makeDigest({ total_income: 1234567.89 }));
    expect(html).toContain("1.234.567");
  });
});

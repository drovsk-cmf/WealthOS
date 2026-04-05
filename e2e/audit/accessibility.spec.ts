import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * AUDITORIA DE ACESSIBILIDADE (WCAG AA)
 *
 * Roda axe-core em cada página do Oniefy.
 * Detecta automaticamente: contraste, labels, roles, focus, heading hierarchy,
 * touch targets, ARIA attributes, etc.
 *
 * Execução: npx playwright test e2e/audit/accessibility.spec.ts
 * Pré-requisito: npm install @axe-core/playwright --save-dev
 */

const ROUTES = [
  "/dashboard",
  "/transactions",
  "/cards",
  "/cash-flow",
  "/bills",
  "/accounts",
  "/assets",
  "/budgets",
  "/goals",
  "/tax",
  "/diagnostics",
  "/calculators",
  "/indices",
  "/settings",
  "/settings/profile",
  "/settings/security",
  "/categories",
  "/cost-centers",
  "/family",
  "/connections",
  "/workflows",
  "/chart-of-accounts",
];

interface A11yResult {
  route: string;
  violations: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  details: { id: string; impact: string; description: string; nodes: number }[];
}

const allResults: A11yResult[] = [];

test.describe("Acessibilidade WCAG AA - todas as páginas", () => {
  test.describe.configure({ mode: "serial" });

  for (const route of ROUTES) {
    test(`a11y: ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1500); // Esperar renders assíncronos

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();

      const critical = results.violations.filter((v) => v.impact === "critical");
      const serious = results.violations.filter((v) => v.impact === "serious");
      const moderate = results.violations.filter((v) => v.impact === "moderate");
      const minor = results.violations.filter((v) => v.impact === "minor");

      const result: A11yResult = {
        route,
        violations: results.violations.length,
        critical: critical.length,
        serious: serious.length,
        moderate: moderate.length,
        minor: minor.length,
        details: results.violations.map((v) => ({
          id: v.id,
          impact: v.impact ?? "unknown",
          description: v.description,
          nodes: v.nodes.length,
        })),
      };
      allResults.push(result);

      // Log detalhes de violações críticas e sérias
      for (const v of [...critical, ...serious]) {
        console.warn(`🔴 [${route}] ${v.impact?.toUpperCase()}: ${v.id} — ${v.description}`);
        for (const node of v.nodes.slice(0, 3)) {
          console.warn(`   → ${node.html.substring(0, 100)}`);
          console.warn(`     Fix: ${node.failureSummary?.substring(0, 100)}`);
        }
      }

      // Fail only on critical violations
      expect(
        critical.length,
        `${route}: ${critical.length} violações CRÍTICAS de acessibilidade\n${critical.map((v) => `  - ${v.id}: ${v.description}`).join("\n")}`
      ).toBe(0);
    });
  }

  test("Relatório consolidado de acessibilidade", async () => {
    console.log("\n╔════════════════════════════════════════════════════╗");
    console.log("║     RELATÓRIO DE ACESSIBILIDADE WCAG AA            ║");
    console.log("╚════════════════════════════════════════════════════╝\n");

    let totalViolations = 0;
    let totalCritical = 0;
    let totalSerious = 0;

    for (const r of allResults) {
      totalViolations += r.violations;
      totalCritical += r.critical;
      totalSerious += r.serious;

      const status = r.critical > 0 ? "🔴" : r.serious > 0 ? "🟡" : r.violations > 0 ? "🟠" : "✅";
      console.log(
        `${status} ${r.route.padEnd(30)} C:${r.critical} S:${r.serious} M:${r.moderate} m:${r.minor}`
      );
    }

    console.log(`\nTotal: ${totalViolations} violações (${totalCritical} críticas, ${totalSerious} sérias)`);

    // Violações mais frequentes (agrupadas por ID)
    const byId = new Map<string, { count: number; impact: string; desc: string }>();
    for (const r of allResults) {
      for (const d of r.details) {
        const existing = byId.get(d.id);
        if (existing) {
          existing.count += d.nodes;
        } else {
          byId.set(d.id, { count: d.nodes, impact: d.impact, desc: d.description });
        }
      }
    }

    const sorted = [...byId.entries()].sort((a, b) => b[1].count - a[1].count);
    if (sorted.length > 0) {
      console.log("\n── Top violações por frequência ──");
      for (const [id, info] of sorted.slice(0, 10)) {
        console.log(`  ${info.count.toString().padStart(3)}x [${info.impact}] ${id}: ${info.desc}`);
      }
    }
  });
});

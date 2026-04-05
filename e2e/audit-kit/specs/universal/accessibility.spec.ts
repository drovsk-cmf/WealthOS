/**
 * Acessibilidade WCAG AA - todas as rotas
 * Matriz de Validação: 7.3
 *
 * Usa axe-core para verificar violações de acessibilidade em cada rota.
 * Falha em violações CRITICAL. Reporta SERIOUS como warning.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { auditConfig } from "../../audit.config";

test.describe("Acessibilidade WCAG AA - todas as rotas", () => {
  for (const route of auditConfig.routes) {
    test(`a11y: ${route.path}`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000); // aguardar renders assíncronos

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const critical = results.violations.filter(
        (v) => v.impact === "critical"
      );
      const serious = results.violations.filter((v) => v.impact === "serious");

      // Reportar SERIOUS como warning (não falha o teste)
      for (const v of serious) {
        const nodes = v.nodes.slice(0, 3);
        for (const n of nodes) {
          console.warn(
            `🔴 [${route.path}] SERIOUS: ${v.id} — ${v.description}\n` +
              `   → ${n.html.substring(0, 100)}\n` +
              `     Fix: ${n.failureSummary?.substring(0, 100)}`
          );
        }
      }

      // Falhar em CRITICAL
      expect(
        critical.length,
        `${route.path}: ${critical.length} violações CRÍTICAS de acessibilidade\n` +
          critical.map((v) => `  - ${v.id}: ${v.description}`).join("\n")
      ).toBe(0);
    });
  }
});

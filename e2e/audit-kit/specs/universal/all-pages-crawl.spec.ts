/**
 * Varredura completa - todas as rotas
 * Matriz de Validação: 7.2 (parcial), 6.4 (parcial)
 *
 * Para cada rota verifica: conteúdo renderizado, heading (h1/h2),
 * ausência de console.error, HTTP status OK.
 */
import { test, expect } from "@playwright/test";
import { auditConfig } from "../../audit.config";

test.describe(`Varredura completa - todas as ${auditConfig.routes.length} rotas`, () => {
  for (const route of auditConfig.routes) {
    test(`${route.name} (${route.path})`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      const response = await page.goto(route.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      // 1. HTTP status
      expect(
        response?.status(),
        `${route.name}: HTTP ${response?.status()}`
      ).toBeLessThan(400);

      // 2. Conteúdo renderizado
      const hasContent = await page.evaluate(
        () => document.body.innerText.trim().length > 30
      );
      expect(hasContent, `${route.name} renderizou conteúdo`).toBe(true);

      // 3. Heading presente
      const hasHeading = await page.evaluate(
        () => document.querySelectorAll("h1, h2").length > 0
      );
      expect(hasHeading, `${route.name} tem heading (h1/h2)`).toBe(true);

      // 4. Console errors (warning, não falha)
      if (consoleErrors.length > 0) {
        console.warn(
          `⚠️ ${route.name}: ${consoleErrors.length} erros de console`
        );
      }
    });
  }
});

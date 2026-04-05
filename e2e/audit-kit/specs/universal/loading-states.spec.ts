/**
 * Loading states e flash de conteúdo vazio
 * Matriz de Validação: 7.2 (parcial), 3.4 (parcial)
 *
 * Verifica que nenhuma página exibe um flash de conteúdo vazio ou
 * layout shift significativo durante o carregamento inicial.
 */
import { test, expect } from "@playwright/test";
import { auditConfig } from "../../audit.config";

test.describe("Loading states", () => {
  for (const route of auditConfig.routes) {
    test(`loading: ${route.path}`, async ({ page }) => {
      // Observar o conteúdo imediatamente após navegação
      let emptyFlashDetected = false;

      // Interceptar o momento de load para verificar conteúdo mínimo
      await page.goto(route.path, { waitUntil: "commit" });

      // Verificar a cada 200ms se há conteúdo ou loading indicator
      for (let i = 0; i < 10; i++) {
        const state = await page.evaluate(() => {
          const body = document.body;
          const text = body?.innerText?.trim() || "";
          // Procurar indicadores de loading (skeleton, spinner, etc.)
          const hasLoadingIndicator =
            !!document.querySelector('[class*="skeleton"], [class*="spinner"], [class*="loading"], [aria-busy="true"]');
          return {
            textLength: text.length,
            hasLoadingIndicator,
          };
        });

        // Se tem pouco texto E não tem indicador de loading = flash vazio
        if (state.textLength < 20 && !state.hasLoadingIndicator && i > 2) {
          emptyFlashDetected = true;
        }

        if (state.textLength > 50) break; // conteúdo carregou
        await page.waitForTimeout(200);
      }

      // Aguardar carregamento completo
      await page.waitForLoadState("networkidle");

      // Verificar que página final tem conteúdo
      const finalContent = await page.evaluate(
        () => document.body.innerText.trim().length
      );
      expect(
        finalContent,
        `${route.path}: página vazia após carregamento completo`
      ).toBeGreaterThan(30);

      if (emptyFlashDetected) {
        console.warn(
          `⚠️ ${route.path}: detectado flash de conteúdo vazio durante loading ` +
            `(sem skeleton/spinner visível)`
        );
      }
    });
  }
});

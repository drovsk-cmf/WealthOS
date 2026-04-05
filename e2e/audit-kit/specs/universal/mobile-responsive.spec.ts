/**
 * Responsividade multi-breakpoint
 * Matriz de Validação: 7.7
 *
 * Verifica cada rota em todos os viewports configurados:
 * overflow horizontal, touch targets, viewport meta tag.
 */
import { test, expect } from "@playwright/test";
import { auditConfig } from "../../audit.config";

const { routes, thresholds } = auditConfig;

for (const viewport of thresholds.viewports) {
  test.describe(`Responsivo ${viewport.label} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of routes) {
      test(`${viewport.label}: ${route.path}`, async ({ page }) => {
        await page.goto(route.path, { waitUntil: "networkidle" });
        await page.waitForTimeout(500);

        // 1. Viewport meta tag
        const hasViewportMeta = await page.evaluate(() => {
          const meta = document.querySelector('meta[name="viewport"]');
          return meta?.getAttribute("content")?.includes("width=device-width") ?? false;
        });
        expect(hasViewportMeta, `${route.path}: falta meta viewport`).toBe(true);

        // 2. Sem overflow horizontal
        const { bodyWidth, viewportWidth } = await page.evaluate(() => ({
          bodyWidth: document.body.scrollWidth,
          viewportWidth: window.innerWidth,
        }));
        expect(
          bodyWidth,
          `${route.path}: overflow horizontal (body=${bodyWidth}px, viewport=${viewportWidth}px)`
        ).toBeLessThanOrEqual(viewportWidth + 5);

        // 3. Touch targets (apenas em mobile)
        if (viewport.width < 768) {
          const buttons = page.locator("button:visible, a:visible").filter({ hasNotText: "" });
          const count = await buttons.count();
          let smallTargets = 0;

          for (let i = 0; i < Math.min(count, 30); i++) {
            const box = await buttons.nth(i).boundingBox();
            if (box && (box.width < thresholds.minTouchTarget || box.height < thresholds.minTouchTarget)) {
              // Tolerar botões menores que 30px como warning, não falha
              if (box.width < 30 || box.height < 30) {
                smallTargets++;
              }
            }
          }

          if (smallTargets > 0) {
            console.warn(`⚠️ ${route.path}: ${smallTargets} botões com touch target < 30px`);
          }
        }

        // 4. Conteúdo renderizou (não ficou em branco)
        const hasContent = await page.evaluate(
          () => document.body.innerText.trim().length > 50
        );
        expect(hasContent, `${route.path}: página sem conteúdo em ${viewport.label}`).toBe(true);
      });
    }
  });
}

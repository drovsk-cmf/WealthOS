/**
 * Navegação por teclado
 * Matriz de Validação: 7.5
 *
 * Verifica tab order, focus visible, e ausência de keyboard traps.
 */
import { test, expect } from "@playwright/test";
import { auditConfig } from "../../audit.config";

test.describe("Navegação por teclado", () => {
  for (const route of auditConfig.routes) {
    test(`keyboard: ${route.path}`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // 1. Verificar que pelo menos um elemento é focável via Tab
      await page.keyboard.press("Tab");
      const firstFocused = await page.evaluate(() => {
        const el = document.activeElement;
        return el && el !== document.body ? el.tagName : null;
      });
      expect(firstFocused, `${route.path}: nenhum elemento focável via Tab`).toBeTruthy();

      // 2. Verificar focus-visible em elementos interativos
      const interactiveCount = await page.evaluate(() => {
        const elements = document.querySelectorAll(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        let withoutFocusStyle = 0;
        for (const el of Array.from(elements).slice(0, 20)) {
          (el as HTMLElement).focus();
          const styles = window.getComputedStyle(el);
          const outline = styles.outlineStyle;
          const boxShadow = styles.boxShadow;
          // Aceita outline ou box-shadow como indicador de focus
          const hasFocusIndicator =
            (outline !== "none" && outline !== "") ||
            (boxShadow !== "none" && boxShadow !== "");
          if (!hasFocusIndicator) withoutFocusStyle++;
        }
        return { total: elements.length, withoutFocus: withoutFocusStyle };
      });

      if (interactiveCount.withoutFocus > 0) {
        console.warn(
          `⚠️ ${route.path}: ${interactiveCount.withoutFocus}/${interactiveCount.total} ` +
            `elementos interativos sem indicador de focus visível`
        );
      }

      // 3. Verificar ausência de keyboard trap (Tab 20x deve mover o foco)
      const focusedElements = new Set<string>();
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press("Tab");
        const tag = await page.evaluate(() => {
          const el = document.activeElement;
          return el ? `${el.tagName}.${el.className.split(" ")[0]}` : "body";
        });
        focusedElements.add(tag);
      }

      expect(
        focusedElements.size,
        `${route.path}: possível keyboard trap (foco preso em ${focusedElements.size} elemento(s) após 20 Tabs)`
      ).toBeGreaterThan(1);
    });
  }
});

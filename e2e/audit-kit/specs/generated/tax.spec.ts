import { test, expect } from "@playwright/test";

test.describe("Imposto de Renda: /tax", () => {
  test("Página de impostos carrega com conteúdo", async ({ page }) => {
    await page.goto("/tax", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Página deve ter heading
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();

    // Simulador CLT: clicar na aba se necessário
    const cltTab = page.locator('button:has-text("Simulador")').or(
      page.locator('button:has-text("CLT")')
    );
    if (await cltTab.first().isVisible()) {
      await cltTab.first().click();
      await page.waitForTimeout(500);
    }

    // Campo de salário bruto (pode ser name ou id)
    const grossInput = page.locator('#clt-gross, input[name="clt-gross"]');
    if (await grossInput.isVisible()) {
      await grossInput.fill("10000");
      await page.waitForTimeout(500);
      const body = await page.textContent("body");
      expect(body?.includes("R$"), "Resultado do cálculo visível").toBe(true);
    }
  });
});

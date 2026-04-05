import { test, expect } from "@playwright/test";

test.describe("Importação: /connections", () => {
  test("Página de importação carrega com opções", async ({ page }) => {
    await page.goto("/connections", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    // Deve ter upload de arquivo (OFX/CSV)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Deve ter select de conta destino
    const select = page.locator("select").first();
    await expect(select).toBeVisible();
  });
});

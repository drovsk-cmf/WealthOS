import { test, expect } from "@playwright/test";

test.describe("Segurança: /settings/security", () => {
  test("Exclusão de conta pede confirmação antes de executar", async ({ page }) => {
    await page.goto("/settings/security", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const deleteBtn = page.locator('button:has-text("Solicitar exclusão")').or(
      page.locator('button:has-text("Excluir conta")')
    );
    await expect(deleteBtn.first()).toBeVisible();

    // Clicar no botão
    await deleteBtn.first().click();
    await page.waitForTimeout(500);

    // Deve mostrar modal de confirmação — NÃO executar a ação
    const body = await page.textContent("body");
    const hasConfirmation =
      body?.includes("confirma") ||
      body?.includes("certeza") ||
      body?.includes("irreversível") ||
      body?.includes("EXCLUIR");
    expect(hasConfirmation, "Ação destrutiva deve pedir confirmação").toBe(true);

    // Fechar modal sem confirmar
    const cancelBtn = page.locator('button:has-text("Cancelar")');
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    }
  });
});

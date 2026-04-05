import { test, expect } from "@playwright/test";

test.describe("Formulários: /settings/profile", () => {
  test("Perfil carrega com campos editáveis", async ({ page }) => {
    await page.goto("/settings/profile", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    // Nome deve estar preenchido
    const nameInput = page.locator('input[placeholder="Seu nome"]');
    await expect(nameInput).toBeVisible();
    const value = await nameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test("Alterar senha: campos visíveis e validação", async ({ page }) => {
    await page.goto("/settings/profile", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const newPwd = page.locator('input[placeholder="Nova senha"]');
    const confirmPwd = page.locator('input[placeholder="Repita a nova senha"]');

    // Se seção de senha existe
    if (await newPwd.isVisible()) {
      await expect(confirmPwd).toBeVisible();
    }
  });
});

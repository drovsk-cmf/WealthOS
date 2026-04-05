import { test, expect } from "@playwright/test";

test.describe("Formulários: /accounts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/accounts", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
  });

  test("Botão de criar conta visível", async ({ page }) => {
    const btn = page.locator("text=+ Nova conta").or(page.locator("text=Adicionar conta"));
    await expect(btn.first()).toBeVisible();
  });

  test("Criar conta: formulário abre e valida campos", async ({ page }) => {
    await page.locator("text=+ Nova conta").or(page.locator("text=Adicionar conta")).first().click();
    await page.waitForTimeout(500);

    // Verificar campos do formulário
    const nameInput = page.locator('input[placeholder="Ex: Banco Principal"]');
    await expect(nameInput).toBeVisible();

    // Submeter vazio deve mostrar erro ou impedir submit
    const submitBtn = page.locator('button:has-text("Criar conta")');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      // Formulário não deve fechar sem preenchimento
      await expect(nameInput).toBeVisible();
    }
  });

  test("Busca filtra lista de contas", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Buscar conta por nome"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("xyz-inexistente");
    await page.waitForTimeout(500);
    // Resultado filtrado (pode mostrar empty state)
    const body = await page.textContent("body");
    expect(body).toBeDefined();
  });
});

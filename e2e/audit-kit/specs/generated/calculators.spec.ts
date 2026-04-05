import { test, expect } from "@playwright/test";

const CALCULATORS = [
  { path: "/calculators/independence", name: "Independência Financeira" },
  { path: "/calculators/buy-vs-rent", name: "Comprar vs Alugar" },
  { path: "/calculators/cet", name: "CET" },
  { path: "/calculators/sac-vs-price", name: "SAC vs Price" },
];

test.describe("Calculadoras: formulários interativos", () => {
  for (const calc of CALCULATORS) {
    test(`${calc.name}: página carrega com inputs`, async ({ page }) => {
      await page.goto(calc.path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      // Cada calculadora deve ter pelo menos 1 campo numérico
      const inputs = page.locator('input[type="number"]');
      const count = await inputs.count();
      expect(count, `${calc.name} deve ter campos numéricos`).toBeGreaterThan(0);

      // Preencher primeiro campo
      await inputs.first().fill("10000");
      await page.waitForTimeout(500);

      // Página deve ter conteúdo significativo
      const body = await page.textContent("body");
      expect(body!.length).toBeGreaterThan(100);
    });
  }

  test("Quitar Dívida: formulário multi-campo", async ({ page }) => {
    await page.goto("/calculators/debt-payoff", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const nameInput = page.locator('input[placeholder="Ex: Cartão Nubank"]').first();
    await expect(nameInput).toBeVisible();
  });
});

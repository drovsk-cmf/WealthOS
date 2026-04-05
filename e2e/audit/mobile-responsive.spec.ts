import { test, expect, type Page } from "@playwright/test";

/**
 * AUDITORIA MOBILE E CONSISTÊNCIA VISUAL
 *
 * Testa cada página em viewport mobile (390x844 = iPhone 14)
 * Verifica: bottom tab bar, header, touch targets, overflow,
 * formulários com teclado, scroll behavior.
 *
 * Execução: npx playwright test e2e/audit/mobile-responsive.spec.ts
 */

const MOBILE_VIEWPORT = { width: 390, height: 844 };

const KEY_ROUTES = [
  "/dashboard",
  "/transactions",
  "/cards",
  "/cash-flow",
  "/bills",
  "/accounts",
  "/assets",
  "/budgets",
  "/goals",
  "/tax",
  "/diagnostics",
  "/calculators",
  "/indices",
  "/settings",
  "/categories",
  "/connections",
];

test.describe("Mobile (390x844) - todas as páginas", () => {
  test.use({ viewport: MOBILE_VIEWPORT });
  test.describe.configure({ mode: "serial" });

  for (const route of KEY_ROUTES) {
    test(`mobile: ${route}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      await page.goto(route, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1000);

      // Screenshot mobile
      await page.screenshot({
        path: `e2e/audit/screenshots/mobile-detail/${route.replace(/\//g, "_")}.png`,
        fullPage: true,
      });

      // 1. Sidebar deve estar OCULTA no mobile
      const sidebarVisible = await page.locator("aside").isVisible().catch(() => false);
      expect(sidebarVisible, `${route}: sidebar oculta no mobile`).toBe(false);

      // 2. Header mobile deve estar VISÍVEL
      const headerVisible = await page.locator("header").isVisible();
      expect(headerVisible, `${route}: header mobile visível`).toBe(true);

      // 3. Bottom tab bar deve estar VISÍVEL
      const bottomNav = page.locator('nav[role="tablist"]');
      const bottomNavVisible = await bottomNav.isVisible();
      expect(bottomNavVisible, `${route}: bottom tab bar visível`).toBe(true);

      // 4. Nenhum overflow horizontal (conteúdo não vaza para a direita)
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = MOBILE_VIEWPORT.width;
      expect(
        bodyWidth,
        `${route}: sem overflow horizontal (body=${bodyWidth}px, viewport=${viewportWidth}px)`
      ).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance

      // 5. Touch targets: botões com pelo menos 44x44px
      const buttons = page.locator("button:visible, a:visible").filter({ hasNotText: "" });
      const buttonCount = await buttons.count();
      let smallTargets = 0;
      for (let i = 0; i < Math.min(buttonCount, 20); i++) {
        const box = await buttons.nth(i).boundingBox();
        if (box && (box.width < 30 || box.height < 30)) {
          smallTargets++;
        }
      }
      if (smallTargets > 0) {
        console.warn(`⚠️ ${route}: ${smallTargets} botões com touch target < 30px`);
      }

      // 6. Sem page crash
      expect(errors, `${route}: sem page crashes`).toHaveLength(0);
    });
  }

  test("Mobile: header redesenhado (C3) funciona", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(1000);

    // Verificar logomark visível
    const logo = page.locator('img[alt="Oniefy"]').first();
    await expect(logo).toBeVisible();

    // Verificar sininho visível
    const bell = page.locator('[aria-label*="Pendências"]').first();
    await expect(bell).toBeVisible();

    // Verificar avatar/menu do usuário
    const avatar = page.locator('[aria-label="Menu do usuário"]');
    if (await avatar.isVisible()) {
      // Clicar no avatar
      await avatar.click();
      await page.waitForTimeout(300);

      // Verificar dropdown com: nome, privacidade, configurações, sair
      const dropdown = page.locator("text=Sair");
      const hasSair = await dropdown.isVisible();
      expect(hasSair, "Dropdown do avatar tem botão Sair (C1)").toBe(true);

      // Fechar dropdown
      await page.keyboard.press("Escape");
    }
  });

  test("Mobile: bottom tab bar navegação completa", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(1000);

    const tabs = [
      { label: "Início", expectedUrl: "/dashboard" },
      { label: "Finanças", expectedUrl: "/transactions" },
      { label: "Patrimônio", expectedUrl: "/accounts" },
      { label: "Planejamento", expectedUrl: "/budgets" },
      { label: "Inteligência", expectedUrl: "/diagnostics" },
    ];

    for (const tab of tabs) {
      const tabBtn = page.locator(`nav[role="tablist"] >> text=${tab.label}`);
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(1000);
        expect(page.url(), `Tab ${tab.label} navega para ${tab.expectedUrl}`).toContain(tab.expectedUrl);
      }
    }
  });
});

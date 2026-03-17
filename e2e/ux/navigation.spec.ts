import { test, expect } from "@playwright/test";

test.describe("Navigation 5+1", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    // Wait for the heading to confirm page is loaded (avoid networkidle
    // which may never settle due to dashboard polling/WebSocket connections)
    await expect(
      page.getByRole("heading", { name: "Início" })
    ).toBeVisible({ timeout: 15000 });
  });

  test("sidebar has exactly 6 nav items", async ({ page }) => {
    // On desktop, sidebar is always visible
    const navLinks = page.locator("aside nav a");
    await expect(navLinks).toHaveCount(6);

    // Verify labels: 5 main + 1 settings
    const expectedLabels = [
      "Início",
      "Transações",
      "Contas",
      "Orçamento",
      "Patrimônio",
      "Configurações",
    ];
    for (const label of expectedLabels) {
      await expect(
        page.locator("aside nav").getByRole("link", { name: label })
      ).toBeVisible();
    }
  });

  test("clicking Início navigates to /dashboard", async ({ page }) => {
    await page
      .locator("aside nav")
      .getByRole("link", { name: "Início" })
      .click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("clicking Transações navigates to /transactions", async ({ page }) => {
    await page
      .locator("aside nav")
      .getByRole("link", { name: "Transações" })
      .click();
    await expect(page).toHaveURL(/\/transactions/);
  });

  test("clicking Configurações navigates to /settings", async ({ page }) => {
    await page
      .locator("aside nav")
      .getByRole("link", { name: "Configurações" })
      .click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test("settings page has 5 subcategories", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("domcontentloaded");

    const groups = [
      "Pessoal",
      "Estrutura e Cadastros",
      "Dados e Importação",
      "Avançado",
      "Segurança",
    ];
    for (const group of groups) {
      await expect(
        page.getByText(group, { exact: true }).first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("clicking Segurança within Settings navigates to /settings/security", async ({
    page,
  }) => {
    await page.goto("/settings");
    await page.waitForLoadState("domcontentloaded");

    // Find the Segurança link inside the settings page content (not sidebar)
    await page
      .locator("#main-content")
      .getByRole("link", { name: "Segurança" })
      .click();
    await expect(page).toHaveURL(/\/settings\/security/);
  });

  test("mobile: hamburger opens sidebar, click outside closes it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    // Wait for mobile header to be visible
    await expect(page.getByLabel("Abrir menu")).toBeVisible({
      timeout: 15000,
    });

    // Sidebar should NOT have dialog role when closed
    await expect(page.locator('aside[role="dialog"]')).toHaveCount(0);

    // Click hamburger to open
    await page.getByLabel("Abrir menu").click();

    // Sidebar should now be visible (dialog role appears)
    await expect(page.locator('aside[role="dialog"]')).toBeVisible({
      timeout: 5000,
    });

    // Click overlay to close
    await page.getByLabel("Fechar menu").click();

    // Sidebar dialog should be gone
    await expect(page.locator('aside[role="dialog"]')).toHaveCount(0, {
      timeout: 5000,
    });
  });

  test("skip-to-content link exists and works", async ({ page }) => {
    // The skip link is sr-only but becomes visible on focus
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Tab to focus the skip link
    await page.keyboard.press("Tab");

    // Click the skip link
    await skipLink.click();

    // Main content should be present
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeAttached();
  });
});

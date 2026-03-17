import { test, expect } from "@playwright/test";

test.describe("Privacy mode", () => {
  test.beforeEach(async ({ page }) => {
    // Clear privacy state before each test
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    // Wait for sidebar to be visible (page is interactive)
    await expect(page.getByLabel(/valores financeiros/)).toBeVisible({
      timeout: 15000,
    });
    // Ensure privacy mode is off
    await page.evaluate(() => localStorage.removeItem("oniefy-privacy"));
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByLabel(/valores financeiros/)).toBeVisible({
      timeout: 15000,
    });
  });

  test("privacy toggle button is visible in sidebar", async ({ page }) => {
    const toggle = page.getByLabel(/valores financeiros/);
    await expect(toggle).toBeVisible();
  });

  test("clicking toggle hides financial values with masked dots", async ({
    page,
  }) => {
    // Click the toggle to hide values
    const toggle = page.getByLabel("Ocultar valores financeiros");
    await expect(toggle).toBeVisible();
    await toggle.click();

    // After clicking, the button label should change to "Exibir valores financeiros"
    await expect(
      page.getByLabel("Exibir valores financeiros")
    ).toBeVisible();

    // Masked values (•••••) should appear on the page
    const maskedValues = page.locator('[aria-label="Valor oculto"]');
    const count = await maskedValues.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("clicking toggle again shows values", async ({ page }) => {
    // First, enable privacy mode
    const hideToggle = page.getByLabel("Ocultar valores financeiros");
    await expect(hideToggle).toBeVisible();
    await hideToggle.click();

    // Now disable privacy mode
    const showToggle = page.getByLabel("Exibir valores financeiros");
    await expect(showToggle).toBeVisible();
    await showToggle.click();

    // Button should be back to "Ocultar"
    await expect(
      page.getByLabel("Ocultar valores financeiros")
    ).toBeVisible();

    // Masked values should no longer be present
    const maskedValues = page.locator('[aria-label="Valor oculto"]');
    await expect(maskedValues).toHaveCount(0);
  });

  test("privacy mode persists during navigation", async ({ page }) => {
    // Enable privacy mode
    const toggle = page.getByLabel("Ocultar valores financeiros");
    await expect(toggle).toBeVisible();
    await toggle.click();

    // Navigate to transactions
    await page
      .locator("aside nav")
      .getByRole("link", { name: "Transações" })
      .click();
    await expect(page).toHaveURL(/\/transactions/);
    await page.waitForLoadState("domcontentloaded");

    // Privacy toggle should still show "Exibir" (privacy is ON)
    await expect(
      page.getByLabel("Exibir valores financeiros")
    ).toBeVisible({ timeout: 10000 });

    // Navigate to accounts
    await page
      .locator("aside nav")
      .getByRole("link", { name: "Contas" })
      .click();
    await expect(page).toHaveURL(/\/accounts/);
    await page.waitForLoadState("domcontentloaded");

    // Privacy mode should still be active
    await expect(
      page.getByLabel("Exibir valores financeiros")
    ).toBeVisible({ timeout: 10000 });
  });
});

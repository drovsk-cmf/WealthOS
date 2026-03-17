import { test, expect } from "@playwright/test";

// Helper: the transactions page has 2 "+ Nova transação" buttons
// (one in header, one in empty state). Use the header button.
function newTxButton(page: import("@playwright/test").Page) {
  return page
    .getByRole("button", { name: /Nova transação/ })
    .first();
}

test.describe("Quick transaction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transactions");
    await page.waitForLoadState("networkidle");
  });

  test("new transaction button is visible", async ({ page }) => {
    await expect(newTxButton(page)).toBeVisible({ timeout: 10000 });
  });

  test("clicking new transaction opens form", async ({ page }) => {
    await newTxButton(page).click();

    // Amount field should be present (form opened)
    await expect(page.locator("#tx-amount")).toBeVisible({ timeout: 5000 });
  });

  test("amount field has placeholder 0,00", async ({ page }) => {
    await newTxButton(page).click();
    await expect(page.locator("#tx-amount")).toBeVisible();

    await expect(page.locator("#tx-amount")).toHaveAttribute(
      "placeholder",
      "0,00"
    );
  });

  test("amount field accepts BR format with comma", async ({ page }) => {
    await newTxButton(page).click();
    const amount = page.locator("#tx-amount");
    await expect(amount).toBeVisible();

    await amount.fill("150,50");
    await expect(amount).toHaveValue("150,50");
  });

  test("type toggle defaults to Despesa and can switch to Receita", async ({
    page,
  }) => {
    await newTxButton(page).click();
    await expect(page.locator("#tx-amount")).toBeVisible();

    // Type toggle radio group should be present
    const radioGroup = page.locator(
      '[role="radiogroup"][aria-label="Tipo de transação"]'
    );
    await expect(radioGroup).toBeVisible();

    // Despesa should be selected by default
    await expect(
      radioGroup.getByRole("radio", { name: "Despesa" })
    ).toBeChecked();

    // Click Receita
    await radioGroup.getByRole("radio", { name: "Receita" }).click();
    await expect(
      radioGroup.getByRole("radio", { name: "Receita" })
    ).toBeChecked();
  });

  test("Mais opções expands additional fields", async ({ page }) => {
    await newTxButton(page).click();
    await expect(page.locator("#tx-amount")).toBeVisible();

    // Description should not be visible initially
    await expect(page.locator("#tx-desc")).not.toBeVisible();

    // Click "Mais opções"
    await page.getByText(/Mais opções/).click();

    // Additional fields should now be visible
    await expect(page.locator("#tx-desc")).toBeVisible();
    await expect(page.locator("#tx-category")).toBeVisible();
    await expect(page.locator("#tx-date")).toBeVisible();
  });

  test("ESC closes the form without saving", async ({ page }) => {
    await newTxButton(page).click();
    await expect(page.locator("#tx-amount")).toBeVisible();

    // Fill some data
    await page.locator("#tx-amount").fill("100");

    // Press ESC
    await page.keyboard.press("Escape");

    // Form should be closed
    await expect(page.locator("#tx-amount")).not.toBeVisible();
  });
});

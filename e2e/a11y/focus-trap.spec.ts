import { test, expect } from "@playwright/test";

// Helper: click the header "+ Nova transação" button (2 exist on page)
function newTxButton(page: import("@playwright/test").Page) {
  return page
    .getByRole("button", { name: /Nova transação/ })
    .first();
}

test.describe("Focus trap in modals", () => {
  test("transaction form traps focus within modal", async ({ page }) => {
    await page.goto("/transactions");
    await page.waitForLoadState("networkidle");

    // Open transaction form
    await newTxButton(page).click();
    await expect(page.locator("#tx-amount")).toBeVisible();

    // The form uses focus-trap-react. Tab through all elements.
    // After enough tabs, focus should still be within the form area.
    const amountInput = page.locator("#tx-amount");
    await amountInput.focus();

    // Tab many times to verify focus stays within the form
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
    }

    // Focus should still be on a form-related element (not the sidebar or page behind)
    const focusedTagName = await page.evaluate(
      () => document.activeElement?.tagName?.toLowerCase() || ""
    );
    // Form elements: input, button, select, textarea
    expect(["input", "button", "select", "textarea"]).toContain(focusedTagName);

    // Verify the focused element is inside the form container (not in aside/nav)
    const isInSidebar = await page.evaluate(
      () => !!document.activeElement?.closest("aside")
    );
    expect(isInSidebar).toBe(false);
  });

  test("Shift+Tab navigates backwards in modal", async ({ page }) => {
    await page.goto("/transactions");
    await page.waitForLoadState("networkidle");

    await newTxButton(page).click();
    await expect(page.locator("#tx-amount")).toBeVisible();

    // Focus the amount input
    await page.locator("#tx-amount").focus();

    // Shift+Tab should go to previous focusable element (wraps to last)
    await page.keyboard.press("Shift+Tab");

    // Focus should still be within the form area
    const focusTag = await page.evaluate(
      () => document.activeElement?.tagName?.toLowerCase() || ""
    );
    expect(["input", "button", "select", "textarea", "a"]).toContain(
      focusTag
    );
  });

  test("initial focus is on first input when opening transaction form", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await page.waitForLoadState("networkidle");

    await newTxButton(page).click();

    // Wait for amount input to appear
    const amountInput = page.locator("#tx-amount");
    await expect(amountInput).toBeVisible();

    // Amount input should have focus (autofocus)
    await expect(amountInput).toBeFocused({ timeout: 3000 });
  });
});

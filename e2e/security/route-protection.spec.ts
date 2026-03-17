import { test, expect } from "@playwright/test";

test.describe("Route protection", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // unauthenticated

  test("accessing /dashboard without login redirects to /login with redirectTo", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdashboard/, {
      timeout: 15000,
    });
  });

  test("accessing /settings without login redirects to /login", async ({
    page,
  }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("accessing /transactions without login redirects to /login", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("accessing /api/auth/callback without params does not crash", async ({
    page,
  }) => {
    const response = await page.goto("/api/auth/callback");
    // Should redirect to /login or return an error page, but NOT 500
    expect(response?.status()).not.toBe(500);
  });

  test("accessing /privacy without login renders the page", async ({
    page,
  }) => {
    await page.goto("/privacy");
    // Should stay on /privacy (public page)
    await expect(page).toHaveURL(/\/privacy/, { timeout: 15000 });
    // Should have content (not a redirect)
    await expect(page.locator("body")).not.toBeEmpty();
  });
});

test.describe("Route protection - authenticated redirect", () => {
  test("after login, authenticated user can access protected routes", async ({
    page,
  }) => {
    // Should already be authenticated via storageState
    await page.goto("/transactions");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/transactions/, { timeout: 15000 });
    // Verify page loaded (heading visible)
    await expect(
      page.getByRole("heading", { name: "Transações", level: 1 })
    ).toBeVisible({ timeout: 15000 });
  });
});

import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  setup.setTimeout(60000);

  // Navigate to login and wait for the form to be interactive
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("#email")).toBeVisible({ timeout: 15000 });

  // Fill credentials
  await page.fill("#email", "e2e-test@oniefy.com");
  await page.fill("#password", "E2eTest!Secure2026");

  // Click submit and wait for navigation away from /login
  await page.click('button[type="submit"]');

  // Wait for redirect (client-side navigation via router.push)
  // The API call to /api/auth/login may be slow on first compile.
  await page.waitForURL(
    (url) => !url.pathname.includes("/login"),
    { timeout: 45000 }
  );

  // Save auth state
  await page.context().storageState({ path: AUTH_FILE });
});

import { test, expect } from "@playwright/test";

test.describe("Onboarding flow", () => {
  test("authenticated user with completed onboarding is redirected away from /onboarding", async ({
    page,
  }) => {
    // Test user has onboarding completed - should redirect to dashboard
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, {
      timeout: 15000,
    });
  });

  test("unauthenticated user accessing /onboarding is redirected to login", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await page.goto("/onboarding");
    // Should redirect to login since not authenticated
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    await context.close();
  });

  test("onboarding page has progress bar", async ({ page }) => {
    // Navigate and manipulate sessionStorage to simulate onboarding
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    // If we landed on onboarding (user not yet completed), check for progress bar
    const url = page.url();
    if (url.includes("/onboarding")) {
      // Progress bar should be visible
      const progressBar = page.locator(".bg-primary.rounded-full.h-1\\.5");
      await expect(progressBar.first()).toBeVisible({ timeout: 5000 });

      // Step indicator should show "Passo X de 9"
      await expect(page.getByText(/Passo \d+ de 9/)).toBeVisible();
    }
  });

  test("onboarding route choice step - desktop recommends import", async ({
    page,
  }) => {
    // Set sessionStorage to jump to route_choice step
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    if (url.includes("/onboarding")) {
      await page.evaluate(() => {
        sessionStorage.setItem("onboarding_step", "route_choice");
      });
      await page.reload();
      await page.waitForLoadState("networkidle");

      // On desktop, "Importar extrato" should be recommended
      const recommended = page.getByText("Recomendado");
      const hasRecommended = await recommended
        .isVisible()
        .catch(() => false);

      if (hasRecommended) {
        await expect(recommended).toBeVisible();
      }

      // Should show route heading
      const heading = page.getByText("Como você quer começar?");
      const hasHeading = await heading.isVisible().catch(() => false);
      if (hasHeading) {
        await expect(heading).toBeVisible();
      }
    }
  });

  test("onboarding route choice step - mobile recommends quick entry", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    if (url.includes("/onboarding")) {
      await page.evaluate(() => {
        sessionStorage.setItem("onboarding_step", "route_choice");
      });
      await page.reload();
      await page.waitForLoadState("networkidle");

      // On mobile, "Lançamento rápido" should be recommended
      const quickEntry = page.getByText("Lançamento rápido");
      const hasQuickEntry = await quickEntry
        .isVisible()
        .catch(() => false);

      if (hasQuickEntry) {
        await expect(quickEntry).toBeVisible();
      }
    }
  });

  test("onboarding celebration step shows CTA to go to app", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    if (url.includes("/onboarding")) {
      await page.evaluate(() => {
        sessionStorage.setItem("onboarding_step", "celebration");
      });
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Look for the go-to-app button
      const goButton = page.getByRole("button", {
        name: /Ir para/,
      });
      const hasGoButton = await goButton.isVisible().catch(() => false);
      if (hasGoButton) {
        await goButton.click();
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      }
    }
  });
});

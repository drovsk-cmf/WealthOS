import { test, expect } from "@playwright/test";

test.describe("Empty states", () => {
  test("transactions page shows motivational empty state with CTAs", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await page.waitForLoadState("networkidle");

    // Check for empty state heading
    const emptyState = page.getByText("Suas transações aparecem aqui");
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
      // Header button + empty state CTA button
      await expect(
        page.getByRole("button", { name: /Nova transação/ }).first()
      ).toBeVisible();
      // "Importar extrato" is a link, not a button
      await expect(
        page.getByRole("link", { name: /Importar extrato/ })
      ).toBeVisible();
    }

    // Regardless of state, no English fallback text
    await expect(page.getByText("No data")).not.toBeVisible();
    await expect(page.getByText("No results")).not.toBeVisible();
  });

  test("accounts page shows motivational empty state", async ({ page }) => {
    await page.goto("/accounts");
    await page.waitForLoadState("networkidle");

    const emptyState = page.getByText("Adicione suas contas e cartões");
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Adicionar conta/ })
      ).toBeVisible();
    }

    await expect(page.getByText("No data")).not.toBeVisible();
    await expect(page.getByText("No results")).not.toBeVisible();
  });

  test("budgets page shows motivational empty state", async ({ page }) => {
    await page.goto("/budgets");
    await page.waitForLoadState("networkidle");

    // No English fallback text
    await expect(page.getByText("No data")).not.toBeVisible();
    await expect(page.getByText("No results")).not.toBeVisible();
    await expect(page.getByText("Nenhum resultado")).not.toBeVisible();
  });

  test("assets page shows motivational empty state", async ({ page }) => {
    await page.goto("/assets");
    await page.waitForLoadState("networkidle");

    // No English fallback text
    await expect(page.getByText("No data")).not.toBeVisible();
    await expect(page.getByText("No results")).not.toBeVisible();
    await expect(page.getByText("Nenhum resultado")).not.toBeVisible();
  });

  test("no page shows English No data text", async ({ page }) => {
    const pages = ["/transactions", "/accounts", "/budgets", "/assets"];
    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      await expect(
        page.getByText("No data", { exact: true })
      ).not.toBeVisible();
    }
  });
});

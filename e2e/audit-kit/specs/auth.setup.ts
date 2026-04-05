import { test as setup, expect } from "@playwright/test";
import { auditConfig } from "../audit.config";

const { auth } = auditConfig;

setup("authenticate", async ({ page }) => {
  // Limpar cookies para garantir contexto limpo
  await page.context().clearCookies();
  await page.goto(auth.loginUrl);
  await page.waitForLoadState("domcontentloaded");
  await page.locator(auth.emailSelector).waitFor({ timeout: 15_000 });
  await page.fill(auth.emailSelector, auth.credentials.email);
  await page.fill(auth.passwordSelector, auth.credentials.password);
  await page.click(auth.submitSelector);
  await page.waitForURL(`**${auth.successUrl}**`, { timeout: 45_000 });
  await expect(page).toHaveURL(new RegExp(auth.successUrl));
  await page.context().storageState({
    path: auth.storageStatePath || "e2e/.auth/user.json",
  });
});

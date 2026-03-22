import { defineConfig, devices } from "@playwright/test";

/**
 * PLAYWRIGHT_BASE_URL: quando definida, testa contra URL externa (produção/preview).
 * Nesse caso, webServer é desabilitado (não precisa subir dev server local).
 *
 * Uso local:     npx playwright test                      → localhost:3000
 * Uso produção:  PLAYWRIGHT_BASE_URL=https://oniefy.com npx playwright test smoke.spec.ts
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const isExternal = !baseURL.includes("localhost");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "html",
  timeout: 60000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  // Só sobe dev server quando testando localhost
  ...(isExternal
    ? {}
    : {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 60000,
        },
      }),
});

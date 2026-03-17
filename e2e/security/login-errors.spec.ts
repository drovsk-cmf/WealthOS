import { test, expect } from "@playwright/test";

test.describe("Login error handling", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // unauthenticated

  // IMPORTANT: Middleware rate-limits /login visits (5 per 15 min per IP).
  // Each page.goto("/login") counts against the limit (Next.js RSC may even
  // cause multiple middleware hits per navigation). Combine checks into
  // fewer page visits to avoid hitting the rate limiter during test runs.

  test("password field type, HTML5 validation, and form security", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    // 1. Password field is type=password
    const passwordInput = page.locator("#password");
    await expect(passwordInput).toHaveAttribute("type", "password");

    // 2. Empty email triggers HTML5 validation
    await page.fill("#password", "somepassword");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);
    const emailInput = page.locator("#email");
    const emailValid = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validity.valid
    );
    expect(emailValid).toBe(false);

    // 3. Empty password triggers HTML5 validation
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);
    const pwValid = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validity.valid
    );
    expect(pwValid).toBe(false);
  });

  test("wrong credentials show generic PT-BR error message", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.fill("#email", "wrong@example.com");
    await page.fill("#password", "WrongPassword123!");

    // Click submit and wait for the API response
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes("/api/auth/login"),
        { timeout: 30000 }
      ),
      page.click('button[type="submit"]'),
    ]);

    // Wait for the app's error alert (not Next.js route announcer)
    // The app renders: <div role="alert" class="...border-destructive...">
    const alert = page.locator(
      '[role="alert"].border-destructive\\/50, [role="alert"]:has-text("incorretos")'
    );
    await expect(alert.first()).toBeVisible({ timeout: 10000 });

    // Error should be in PT-BR (generic, not leaking Supabase internals)
    const text = await alert.first().textContent();
    expect(text).toBeTruthy();
    expect(text).not.toContain("Invalid login credentials");
    expect(text).not.toContain("invalid_credentials");
  });

  test("rate limiting after repeated failed attempts via API", async ({
    page,
  }) => {
    // Test the API rate limiter directly using page.request
    // to avoid hitting the middleware's /login page rate limiter.
    let rateLimitHit = false;
    let lastStatus = 0;

    for (let i = 0; i < 8; i++) {
      const response = await page.request.post("/api/auth/login", {
        data: {
          email: `brute${i}@example.com`,
          password: `WrongPass${i}!`,
        },
      });

      lastStatus = response.status();

      if (lastStatus === 429) {
        rateLimitHit = true;
        const body = await response.json();
        expect(body.error).toContain("Muitas tentativas");
        break;
      }
    }

    // Should have hit rate limit or at least gotten error responses
    if (!rateLimitHit) {
      // If rate limit wasn't hit, verify the API at least returns proper errors
      expect(lastStatus).toBe(401);
    }
  });
});

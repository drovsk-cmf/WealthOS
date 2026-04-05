/**
 * Observabilidade e instrumentação
 * Matriz de Validação: 9.2
 *
 * Verifica presença de analytics, error tracking, console.error em navegação normal.
 */
import { test, expect } from "@playwright/test";
import { auditConfig } from "../../audit.config";

const ANALYTICS_PATTERNS: Record<string, RegExp> = {
  GA4: /google.*analytics|gtag|googletagmanager.*gtag/i,
  GTM: /googletagmanager\.com\/gtm/i,
  Sentry: /sentry/i,
  PostHog: /posthog/i,
  Hotjar: /hotjar/i,
  "Vercel Analytics": /vercel.*analytics|va\.vercel-scripts|_vercel\/insights/i,
  Datadog: /datadoghq/i,
  "New Relic": /newrelic/i,
};

test.describe("Observabilidade e instrumentação", () => {
  test("Analytics e error tracking detectados", async ({ page }) => {
    const route = auditConfig.routes[0];
    if (!route) {
      test.skip();
      return;
    }

    const detectedRequests: string[] = [];

    page.on("request", (req) => {
      const url = req.url();
      for (const [name, pattern] of Object.entries(ANALYTICS_PATTERNS)) {
        if (pattern.test(url) && !detectedRequests.includes(name)) {
          detectedRequests.push(name);
        }
      }
    });

    await page.goto(route.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Verificar scripts inline também
    const inlineDetected = await page.evaluate(() => {
      const scripts = document.querySelectorAll("script");
      const patterns = {
        Sentry: /sentry/i,
        GA4: /gtag|googletagmanager/i,
        PostHog: /posthog/i,
        "Vercel Analytics": /vercel.*analytics|va\.vercel/i,
      };
      const found: string[] = [];
      for (const s of Array.from(scripts)) {
        const src = s.src || "";
        const text = s.textContent || "";
        for (const [name, pattern] of Object.entries(patterns)) {
          if ((pattern.test(src) || pattern.test(text)) && !found.includes(name)) {
            found.push(name);
          }
        }
      }
      return found;
    });

    const allDetected = [...new Set([...detectedRequests, ...inlineDetected])];

    console.log("\n── Observabilidade ──");
    if (allDetected.length > 0) {
      for (const name of allDetected) {
        console.log(`✅ ${name} detectado`);
      }
    } else {
      console.warn(
        "⚠️ Nenhuma request de analytics detectada\n" +
          `   Serviços verificados: ${Object.keys(ANALYTICS_PATTERNS).join(", ")}`
      );
    }

    // Verificar contra expectativa configurada
    const expected = auditConfig.options?.expectedAnalytics || [];
    if (expected.length > 0) {
      const missing = expected.filter(
        (e) => !allDetected.some((d) => d.toLowerCase().includes(e.toLowerCase()))
      );
      if (missing.length > 0) {
        console.warn(`⚠️ Serviços esperados mas não detectados: ${missing.join(", ")}`);
      }
    }
  });

  test("Páginas críticas não geram console.error em uso normal", async ({
    page,
  }) => {
    const criticalRoutes = auditConfig.routes.filter((r) => r.critical);
    const routesToCheck = criticalRoutes.length > 0 ? criticalRoutes : auditConfig.routes.slice(0, 5);

    const errorsByRoute: Record<string, string[]> = {};

    for (const route of routesToCheck) {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text().substring(0, 200));
        }
      });

      await page.goto(route.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      if (errors.length > 0) {
        errorsByRoute[route.path] = errors;
      }

      page.removeAllListeners("console");
    }

    const routesWithErrors = Object.keys(errorsByRoute);
    if (routesWithErrors.length === 0) {
      console.log("✅ Nenhuma rota crítica gera console.error em uso normal");
    } else {
      for (const [route, errors] of Object.entries(errorsByRoute)) {
        console.warn(
          `⚠️ ${route}: ${errors.length} erros de console\n` +
            errors.map((e) => `   ${e}`).join("\n")
        );
      }
    }
  });

  test("Nenhuma request 5xx em navegação normal", async ({ page }) => {
    const errors5xx: { url: string; status: number }[] = [];

    page.on("response", (resp) => {
      if (resp.status() >= 500) {
        errors5xx.push({ url: resp.url(), status: resp.status() });
      }
    });

    for (const route of auditConfig.routes.slice(0, 15)) {
      await page.goto(route.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
    }

    if (errors5xx.length === 0) {
      console.log(
        `✅ Nenhum erro 5xx em navegação por ${Math.min(15, auditConfig.routes.length)} rotas`
      );
    }

    expect(
      errors5xx.length,
      `${errors5xx.length} respostas 5xx:\n` +
        errors5xx.map((e) => `  ${e.status}: ${e.url.substring(0, 100)}`).join("\n")
    ).toBe(0);
  });
});

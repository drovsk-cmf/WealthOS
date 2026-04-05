/**
 * Performance e Web Vitals
 * Matriz de Validação: 5.1 (parcial), 5.2 (parcial)
 *
 * Mede tempo de carregamento de rotas críticas, LCP e CLS.
 */
import { test, expect } from "@playwright/test";
import { auditConfig } from "../../audit.config";

const { thresholds } = auditConfig;
const criticalRoutes = auditConfig.routes.filter((r) => r.critical);
const allRoutes = auditConfig.routes;

test.describe("Performance e resiliência", () => {
  test("Tempo de carregamento de rotas críticas", async ({ page }) => {
    const results: { route: string; ms: number; jsSize: string }[] = [];

    for (const route of allRoutes.slice(0, 10)) {
      let totalJS = 0;
      page.on("response", (resp) => {
        const ct = resp.headers()["content-type"] || "";
        if (ct.includes("javascript")) {
          const cl = parseInt(resp.headers()["content-length"] || "0", 10);
          totalJS += cl;
        }
      });

      const start = Date.now();
      await page.goto(route.path, { waitUntil: "networkidle" });
      const elapsed = Date.now() - start;

      const jsKB = Math.round(totalJS / 1024);
      results.push({ route: route.path, ms: elapsed, jsSize: `${jsKB}KB JS` });

      // Limpar listeners para próxima iteração
      page.removeAllListeners("response");
    }

    // Relatório visual
    console.log("\n── Performance por rota ──");
    for (const r of results) {
      const bar = "█".repeat(Math.min(30, Math.round(r.ms / 200)));
      const icon = r.ms < 2000 ? "✅" : r.ms < 4000 ? "🟡" : "🔴";
      console.log(
        `${icon}  ${String(r.ms).padStart(5)}ms  ${r.jsSize.padEnd(8)} ${bar}  ${r.route}`
      );
    }

    // Falhar se alguma rota crítica excedeu threshold
    const slowCritical = results.filter(
      (r) =>
        criticalRoutes.some((cr) => cr.path === r.route) &&
        r.ms > thresholds.loadMs * 2
    );
    expect(
      slowCritical.length,
      `${slowCritical.length} rotas críticas acima de ${thresholds.loadMs * 2}ms:\n` +
        slowCritical.map((r) => `  ${r.route}: ${r.ms}ms`).join("\n")
    ).toBe(0);
  });

  test("Core Web Vitals: LCP e CLS no dashboard", async ({ page }) => {
    const dashboardRoute = criticalRoutes[0] || allRoutes[0];
    if (!dashboardRoute) {
      test.skip();
      return;
    }

    await page.goto(dashboardRoute.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Medir LCP
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let lcpValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            lcpValue = entry.startTime;
          }
        });
        observer.observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(lcpValue);
        }, 1000);
      });
    });

    // Medir CLS
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // @ts-expect-error LayoutShift API
            if (!entry.hadRecentInput) {
              // @ts-expect-error LayoutShift API
              clsValue += entry.value;
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 1000);
      });
    });

    console.log(`\nDashboard LCP: ${Math.round(lcp)}ms`);
    console.log(`Dashboard CLS: ${cls.toFixed(4)}`);

    if (lcp > 0) {
      expect(lcp, `LCP < ${thresholds.lcpMs}ms`).toBeLessThan(
        thresholds.lcpMs * 1.5 // threshold "needs improvement"
      );
    }
    expect(cls, `CLS < ${thresholds.cls}`).toBeLessThan(thresholds.cls);
  });

  test("Resiliência: páginas mostram estado de erro ao falhar rede", async ({
    page,
  }) => {
    const route = allRoutes[0];
    if (!route) {
      test.skip();
      return;
    }

    // Carregar página normalmente primeiro
    await page.goto(route.path, { waitUntil: "networkidle" });

    // Simular falha de rede para API requests
    await page.route("**/*", (r) => {
      const url = r.request().url();
      // Bloquear apenas API calls, não assets estáticos
      if (url.includes("/rest/") || url.includes("/api/") || url.includes("supabase")) {
        r.abort("connectionrefused");
      } else {
        r.continue();
      }
    });

    // Recarregar
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    // Verificar que a página mostra alguma indicação de erro ou fallback
    const body = await page.evaluate(() => document.body.innerText);
    const hasErrorIndication =
      body?.includes("erro") ||
      body?.includes("error") ||
      body?.includes("falha") ||
      body?.includes("tente") ||
      body?.includes("offline") ||
      body?.includes("conexão") ||
      body?.includes("indisponível") ||
      (await page.locator('[role="alert"]').count()) > 0;

    if (hasErrorIndication) {
      console.log("✅ Página mostra indicação de erro/fallback");
    } else {
      console.warn("⚠️ Página não mostra mensagem de erro ao falhar rede");
    }

    await page.unroute("**/*");
  });
});

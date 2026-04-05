import { test, expect, type Page } from "@playwright/test";

/**
 * AUDITORIA 12: OBSERVABILIDADE E INSTRUMENTAÇÃO
 *
 * Verifica que eventos críticos de UX estão instrumentados:
 * - Login/logout geram eventos trackáveis
 * - CRUD de ativos, transações e orçamentos dispara analytics
 * - Erros de frontend são capturados (Sentry ou console)
 * - Core Web Vitals são monitoráveis
 * - Funil de onboarding é rastreável
 *
 * Nota: este teste não verifica GA4/Hotjar diretamente (dependem
 * de configuração externa), mas verifica se os hooks de analytics
 * disparam e se erros são logados adequadamente.
 *
 * Execução: npx playwright test e2e/audit/observability.spec.ts
 */

async function waitForPage(page: Page, timeout = 15000) {
  await page.waitForLoadState("networkidle", { timeout });
  await page.waitForTimeout(500);
}

test.describe("Observabilidade e instrumentação", () => {
  test.describe.configure({ mode: "serial" });

  // ── ANALYTICS EVENTS ───────────────────────────────────

  test("Dashboard view dispara evento de analytics", async ({ page }) => {
    const analyticsRequests: string[] = [];

    // Monitorar requests que parecem analytics
    page.on("request", (req) => {
      const url = req.url();
      if (
        url.includes("analytics") ||
        url.includes("collect") ||
        url.includes("gtag") ||
        url.includes("gtm") ||
        url.includes("sentry") ||
        url.includes("posthog") ||
        url.includes("hotjar") ||
        url.includes("_vercel/insights")
      ) {
        analyticsRequests.push(url.split("?")[0]);
      }
    });

    await page.goto("/dashboard");
    await waitForPage(page);
    await page.waitForTimeout(2000); // Esperar beacons assíncronos

    if (analyticsRequests.length > 0) {
      console.log(`✅ ${analyticsRequests.length} request(s) de analytics detectada(s):`);
      for (const url of [...new Set(analyticsRequests)]) {
        console.log(`   → ${url}`);
      }
    } else {
      console.log("⚠️ Nenhuma request de analytics detectada no dashboard");
      console.log("   Serviços verificados: GA4, GTM, Sentry, PostHog, Hotjar, Vercel Insights");
    }
  });

  test("Vercel Web Analytics / Speed Insights estão carregados", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPage(page);

    // Verificar se o script de Vercel Analytics está no DOM
    const hasVercelAnalytics = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("script[src]"));
      return scripts.some(
        (s) =>
          s.getAttribute("src")?.includes("vercel") ||
          s.getAttribute("src")?.includes("vitals") ||
          s.getAttribute("src")?.includes("_vercel")
      );
    });

    // Verificar se web-vitals está instrumentado
    const hasWebVitals = await page.evaluate(() => {
      return typeof (window as Record<string, unknown>).__WEB_VITALS_POLYFILL__ !== "undefined" ||
        document.querySelector('script[src*="web-vitals"]') !== null;
    });

    console.log(
      hasVercelAnalytics
        ? "✅ Vercel Analytics/Speed Insights detectado"
        : "⚠️ Vercel Analytics não detectado — considere ativar em vercel.json"
    );

    console.log(
      hasWebVitals
        ? "✅ Web Vitals instrumentado"
        : "ℹ️ Web Vitals polyfill não detectado (pode usar Vercel Speed Insights nativamente)"
    );
  });

  // ── SENTRY / ERROR TRACKING ────────────────────────────

  test("Sentry DSN está configurado (ou alternativa de error tracking)", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPage(page);

    // Verificar se Sentry está no DOM
    const hasSentry = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("script[src]"));
      return (
        scripts.some((s) => s.getAttribute("src")?.includes("sentry")) ||
        typeof (window as Record<string, unknown>).__SENTRY__ !== "undefined"
      );
    });

    console.log(
      hasSentry
        ? "✅ Sentry detectado — erros de frontend são rastreados"
        : "⚠️ Sentry NÃO detectado — erros de frontend não são rastreados em produção.\n" +
          "   Ação: configurar NEXT_PUBLIC_SENTRY_DSN no Vercel (pendência A11)"
    );
  });

  // ── CONSOLE ERRORS EM PRODUÇÃO ─────────────────────────

  test("Páginas críticas não geram console.error em uso normal", async ({ page }) => {
    const criticalRoutes = [
      "/dashboard",
      "/transactions",
      "/accounts",
      "/budgets",
      "/bills",
      "/settings",
    ];

    const errorsByRoute: Record<string, string[]> = {};

    for (const route of criticalRoutes) {
      const errors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          // Ignorar erros conhecidos de terceiros
          if (
            !text.includes("favicon") &&
            !text.includes("chrome-extension") &&
            !text.includes("ResizeObserver") &&
            !text.includes("Loading chunk")
          ) {
            errors.push(text);
          }
        }
      });

      await page.goto(route, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(1500);

      if (errors.length > 0) {
        errorsByRoute[route] = errors;
      }

      // Limpar listeners para próxima iteração
      page.removeAllListeners("console");
    }

    const routesWithErrors = Object.keys(errorsByRoute);
    if (routesWithErrors.length > 0) {
      console.warn(`⚠️ ${routesWithErrors.length} rota(s) com console.error:`);
      for (const [route, errors] of Object.entries(errorsByRoute)) {
        console.warn(`  ${route}: ${errors.length} erro(s)`);
        for (const err of errors.slice(0, 3)) {
          console.warn(`    → ${err.substring(0, 120)}`);
        }
      }
    } else {
      console.log("✅ Nenhuma rota crítica gera console.error em uso normal");
    }

    // Não deveria ter mais de 2 rotas com erros
    expect(
      routesWithErrors.length,
      `${routesWithErrors.length} rotas com console.error: ${routesWithErrors.join(", ")}`
    ).toBeLessThanOrEqual(2);
  });

  // ── NETWORK ERRORS ─────────────────────────────────────

  test("Nenhuma request 5xx em navegação normal", async ({ page }) => {
    const serverErrors: { route: string; url: string; status: number }[] = [];

    page.on("response", (res) => {
      if (res.status() >= 500) {
        serverErrors.push({
          route: page.url(),
          url: res.url().split("?")[0],
          status: res.status(),
        });
      }
    });

    const routes = [
      "/dashboard", "/transactions", "/accounts", "/cards",
      "/budgets", "/bills", "/goals", "/assets", "/tax",
      "/diagnostics", "/calculators", "/indices", "/settings",
    ];

    for (const route of routes) {
      await page.goto(route, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(500);
    }

    if (serverErrors.length > 0) {
      console.warn("🔴 Erros 5xx detectados:");
      for (const err of serverErrors) {
        console.warn(`  ${err.status} ${err.url} (em ${err.route})`);
      }
    } else {
      console.log("✅ Nenhum erro 5xx em navegação por 13 rotas");
    }

    expect(serverErrors, "Sem erros 5xx em navegação normal").toHaveLength(0);
  });

  // ── FUNIL DE ONBOARDING ────────────────────────────────

  test("Setup journey rastreia progresso do usuário", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPage(page);

    // Verificar se o setup journey está visível e mostra progresso
    const body = await page.textContent("body");
    const hasJourney =
      body?.includes("plano de") ||
      body?.includes("etapas") ||
      body?.includes("Primeiros passos") ||
      body?.includes("Importação");

    if (hasJourney) {
      // Extrair progresso
      const progressMatch = body?.match(/(\d+)\/(\d+)\s*etapas/);
      if (progressMatch) {
        console.log(`✅ Setup journey ativo: ${progressMatch[1]}/${progressMatch[2]} etapas completadas`);
      } else {
        console.log("✅ Setup journey visível (progresso não extraível pelo regex)");
      }
    } else {
      console.log("ℹ️ Setup journey não visível (pode estar concluído ou usuário avançado)");
    }
  });

  // ── TIMESTAMP DE ATUALIZAÇÃO ───────────────────────────

  test("Dashboard mostra timestamp de última atualização", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPage(page);

    // Scroll até o final para ver o timestamp
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const body = await page.textContent("body");
    const hasTimestamp =
      body?.includes("Atualizado há") ||
      body?.includes("atualizado") ||
      body?.includes("min ago") ||
      body?.includes("min");

    console.log(
      hasTimestamp
        ? "✅ Dashboard mostra timestamp de última atualização"
        : "⚠️ Timestamp de atualização não encontrado no dashboard"
    );
  });

  // ── MÉTRICAS INTERNAS ──────────────────────────────────

  test("/settings/analytics: página de métricas internas existe", async ({ page }) => {
    await page.goto("/settings/analytics");
    await waitForPage(page);

    const body = await page.textContent("body");
    const hasMetrics =
      body?.includes("Métricas") ||
      body?.includes("métricas") ||
      body?.includes("eventos") ||
      body?.includes("Analytics") ||
      body?.includes("retenção");

    expect(body?.length, "Página de métricas renderizou conteúdo").toBeGreaterThan(50);

    console.log(
      hasMetrics
        ? "✅ Página de métricas internas existe e tem conteúdo"
        : "⚠️ Página de métricas existe mas sem conteúdo de analytics"
    );
  });
});

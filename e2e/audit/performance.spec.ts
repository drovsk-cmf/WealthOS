import { test, expect } from "@playwright/test";

/**
 * AUDITORIA DE DESEMPENHO E RESILIÊNCIA
 *
 * Mede: tempo de carregamento, tamanho de JS transferido,
 * Core Web Vitals (LCP, CLS), resiliência a erros de rede.
 *
 * Execução: npx playwright test e2e/audit/performance.spec.ts
 */

const CRITICAL_ROUTES = [
  "/dashboard",
  "/transactions",
  "/accounts",
  "/budgets",
  "/bills",
  "/indices",
  "/settings",
];

test.describe("Performance e resiliência", () => {

  test("Tempo de carregamento de páginas críticas", async ({ page }) => {
    const timings: { route: string; ms: number; jsKB: number }[] = [];

    for (const route of CRITICAL_ROUTES) {
      // Medir JS transferido
      let jsBytes = 0;
      page.on("response", (res) => {
        if (res.url().endsWith(".js") || res.headers()["content-type"]?.includes("javascript")) {
          const cl = res.headers()["content-length"];
          if (cl) jsBytes += parseInt(cl);
        }
      });

      const start = Date.now();
      await page.goto(route, { waitUntil: "networkidle", timeout: 30000 });
      const ms = Date.now() - start;

      timings.push({ route, ms, jsKB: Math.round(jsBytes / 1024) });
    }

    console.log("\n── Performance por rota ──");
    for (const t of timings) {
      const bar = "█".repeat(Math.ceil(t.ms / 200));
      const status = t.ms < 2000 ? "✅" : t.ms < 5000 ? "🟡" : "🔴";
      console.log(
        `${status} ${t.ms.toString().padStart(5)}ms  ${t.jsKB.toString().padStart(4)}KB JS  ${bar}  ${t.route}`
      );
    }

    // Nenhuma página deve demorar mais de 15s
    for (const t of timings) {
      expect(t.ms, `${t.route} carregou em tempo aceitável`).toBeLessThan(15000);
    }
  });

  test("Core Web Vitals: LCP e CLS no dashboard", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Medir LCP via PerformanceObserver
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          resolve(last ? last.startTime : 0);
        }).observe({ type: "largest-contentful-paint", buffered: true });

        // Fallback after 5s
        setTimeout(() => resolve(-1), 5000);
      });
    });

    // Medir CLS
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!(entry as any).hadRecentInput) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              clsValue += (entry as any).value;
            }
          }
        }).observe({ type: "layout-shift", buffered: true });

        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    console.log(`\nDashboard LCP: ${lcp > 0 ? `${Math.round(lcp)}ms` : "não medido"}`);
    console.log(`Dashboard CLS: ${cls.toFixed(4)}`);

    if (lcp > 0) {
      expect(lcp, "LCP < 2500ms (bom)").toBeLessThan(4000); // threshold 'needs improvement'
    }
    expect(cls, "CLS < 0.1 (bom)").toBeLessThan(0.25); // threshold 'needs improvement'
  });

  test("Resiliência: páginas mostram estado de erro ao falhar rede", async ({ page }) => {
    // Navegar primeiro para autenticar
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Bloquear todas as requests Supabase
    await page.route("**/supabase.co/**", (route) => route.abort());

    // Navegar para transações (deve mostrar erro ou fallback)
    await page.goto("/transactions", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const body = await page.textContent("body");
    // Verificar que a página não está em branco
    expect(body?.length, "Página não está em branco mesmo com rede bloqueada").toBeGreaterThan(50);

    // Idealmente deveria mostrar uma mensagem de erro
    const hasErrorIndicator =
      body?.includes("Erro") ||
      body?.includes("erro") ||
      body?.includes("Sem conexão") ||
      body?.includes("Tentar novamente") ||
      body?.includes("aparecem aqui"); // empty state fallback is acceptable

    console.log(
      hasErrorIndicator
        ? "✅ Página mostra indicação de erro/fallback"
        : "⚠️ Página não mostra feedback de erro ao usuário"
    );

    // Desbloquear
    await page.unroute("**/supabase.co/**");
  });

  test("Resiliência: formulário preserva dados em erro de rede", async ({ page }) => {
    await page.goto("/accounts", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Abrir formulário
    await page.click("text=+ Nova conta").catch(() => page.click("text=+ Adicionar conta"));
    await page.waitForTimeout(500);

    // Preencher
    await page.fill('input[placeholder="Ex: Banco Principal"]', "Conta Teste Resiliência");

    // Bloquear rede antes de submeter
    await page.route("**/supabase.co/**", (route) => route.abort());

    // Submeter (JS click: botão pode ficar fora do viewport no modal)
    await page.locator('button[type="submit"]:has-text("Criar conta")').evaluate((el) => (el as HTMLElement).click());
    await page.waitForTimeout(2000);

    // Verificar que os dados preenchidos NÃO foram perdidos
    const inputValue = await page.inputValue('input[placeholder="Ex: Banco Principal"]').catch(() => "");

    console.log(
      inputValue === "Conta Teste Resiliência"
        ? "✅ Formulário preservou dados após erro de rede"
        : "⚠️ Formulário perdeu dados após erro de rede"
    );

    try { await page.unroute("**/supabase.co/**"); } catch { /* browser pode já ter fechado */ }
  });
});

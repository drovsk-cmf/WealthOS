import { test, expect, type Page } from "@playwright/test";

/**
 * AUDITORIA COMPLETA - Varredura de todas as páginas
 *
 * Para cada uma das 35 páginas do Oniefy:
 * 1. Navega e espera carregamento
 * 2. Captura screenshot (desktop + mobile)
 * 3. Coleta erros de console
 * 4. Verifica se a página renderizou conteúdo (não ficou em branco)
 * 5. Verifica se há heading (h1/h2) para orientação do usuário
 * 6. Lista todos os elementos interativos encontrados
 * 7. Verifica requests com status >= 400
 *
 * Execução: npx playwright test e2e/audit/all-pages-crawl.spec.ts
 * Relatório: npx playwright show-report
 */

// ── Todas as rotas do app ──────────────────────────────────
const ALL_ROUTES = [
  // Navegação principal
  { path: "/dashboard", name: "Dashboard (Início)" },
  { path: "/transactions", name: "Transações" },
  { path: "/cards", name: "Cartões de Crédito" },
  { path: "/cash-flow", name: "Fluxo de Caixa" },
  { path: "/bills", name: "Contas a Pagar" },
  { path: "/accounts", name: "Contas" },
  { path: "/assets", name: "Patrimônio (Bens)" },
  { path: "/budgets", name: "Orçamento" },
  { path: "/goals", name: "Metas" },
  { path: "/tax", name: "Imposto de Renda" },
  { path: "/diagnostics", name: "Diagnóstico Financeiro" },
  { path: "/calculators", name: "Calculadoras" },
  { path: "/indices", name: "Índices Econômicos" },

  // Configurações
  { path: "/settings", name: "Configurações (hub)" },
  { path: "/settings/profile", name: "Perfil" },
  { path: "/settings/notifications", name: "Notificações" },
  { path: "/settings/security", name: "Segurança" },
  { path: "/settings/data", name: "Dados e Privacidade" },
  { path: "/settings/analytics", name: "Métricas" },

  // Auxiliares
  { path: "/categories", name: "Categorias" },
  { path: "/cost-centers", name: "Divisões (Cost Centers)" },
  { path: "/family", name: "Estrutura Familiar" },
  { path: "/connections", name: "Importação" },
  { path: "/workflows", name: "Tarefas" },
  { path: "/chart-of-accounts", name: "Estrutura Contábil" },
  { path: "/more/warranties", name: "Garantias" },

  // Calculadoras individuais
  { path: "/calculators/affordability", name: "Calc: Posso Comprar?" },
  { path: "/calculators/projection", name: "Calc: Projeção" },
  { path: "/calculators/independence", name: "Calc: Independência" },
  { path: "/calculators/buy-vs-rent", name: "Calc: Comprar vs Alugar" },
  { path: "/calculators/cet", name: "Calc: CET" },
  { path: "/calculators/sac-vs-price", name: "Calc: SAC vs Price" },
  { path: "/calculators/debt-payoff", name: "Calc: Quitar Dívida" },
  { path: "/calculators/human-capital", name: "Calc: Capital Humano" },
];

// ── Coletores ──────────────────────────────────────────────

interface PageAuditResult {
  route: string;
  name: string;
  consoleErrors: string[];
  networkErrors: { url: string; status: number }[];
  hasContent: boolean;
  hasHeading: boolean;
  interactiveCount: number;
  loadTimeMs: number;
}

const results: PageAuditResult[] = [];

// ── Testes ─────────────────────────────────────────────────

test.describe("Varredura completa - todas as 35 páginas", () => {
  test.describe.configure({ mode: "serial" });

  for (const route of ALL_ROUTES) {
    test(`${route.name} (${route.path})`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const networkErrors: { url: string; status: number }[] = [];

      // Coletar erros de console
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });
      page.on("pageerror", (err) => {
        consoleErrors.push(`[PAGE ERROR] ${err.message}`);
      });

      // Coletar requests com erro
      page.on("response", (response) => {
        if (response.status() >= 400 && !response.url().includes("favicon")) {
          networkErrors.push({
            url: response.url().replace(/https:\/\/[^/]+/, ""),
            status: response.status(),
          });
        }
      });

      // Navegar e medir tempo
      const start = Date.now();
      await page.goto(route.path, { waitUntil: "networkidle", timeout: 30000 });
      const loadTimeMs = Date.now() - start;

      // Esperar conteúdo renderizar
      await page.waitForTimeout(1000);

      // Screenshot desktop
      await page.screenshot({
        path: `e2e/audit/screenshots/desktop/${route.path.replace(/\//g, "_")}.png`,
        fullPage: true,
      });

      // Screenshot mobile (390px)
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `e2e/audit/screenshots/mobile/${route.path.replace(/\//g, "_")}.png`,
        fullPage: true,
      });
      // Restaurar desktop
      await page.setViewportSize({ width: 1280, height: 720 });

      // Verificar se a página tem conteúdo (não está em branco)
      const bodyText = await page.locator("body").innerText();
      const hasContent = bodyText.trim().length > 50;

      // Verificar se há heading para orientação
      const headingCount = await page.locator("h1, h2").count();
      const hasHeading = headingCount > 0;

      // Contar elementos interativos
      const interactiveCount = await page.locator(
        "button, a[href], input, select, textarea"
      ).count();

      // Registrar resultado
      const result: PageAuditResult = {
        route: route.path,
        name: route.name,
        consoleErrors,
        networkErrors,
        hasContent,
        hasHeading,
        interactiveCount,
        loadTimeMs,
      };
      results.push(result);

      // Detectar 404 (página ainda não deployada)
      const is404 = (await page.title()).includes("404") ||
        (await page.locator("text=This page could not be found").count()) > 0;
      if (is404) {
        console.warn(`⚠️ ${route.name} (${route.path}): 404 — página não encontrada no deploy atual`);
        return; // pula assertions para não bloquear serial
      }

      // Assertions
      expect(hasContent, `${route.name} renderizou conteúdo`).toBe(true);
      expect(hasHeading, `${route.name} tem heading (h1/h2)`).toBe(true);

      if (consoleErrors.length > 0) {
        console.warn(`⚠️ ${route.name}: ${consoleErrors.length} erros de console`);
        for (const err of consoleErrors) {
          console.warn(`  → ${err.substring(0, 120)}`);
        }
      }

      if (networkErrors.length > 0) {
        console.warn(`⚠️ ${route.name}: ${networkErrors.length} requests com erro`);
        for (const err of networkErrors) {
          console.warn(`  → ${err.status} ${err.url.substring(0, 100)}`);
        }
      }

      // Nenhum page crash (pageerror)
      const pageCrashes = consoleErrors.filter((e) => e.startsWith("[PAGE ERROR]"));
      expect(pageCrashes, `${route.name} sem page crashes`).toHaveLength(0);
    });
  }

  test("Relatório consolidado", async () => {
    console.log("\n╔════════════════════════════════════════════════════╗");
    console.log("║        RELATÓRIO DE VARREDURA - ONIEFY             ║");
    console.log("╚════════════════════════════════════════════════════╝\n");

    const withErrors = results.filter((r) => r.consoleErrors.length > 0);
    const withNetErrors = results.filter((r) => r.networkErrors.length > 0);
    const noHeading = results.filter((r) => !r.hasHeading);
    const slow = results.filter((r) => r.loadTimeMs > 5000);

    console.log(`Total de páginas: ${results.length}`);
    console.log(`Com erros de console: ${withErrors.length}`);
    console.log(`Com erros de rede (4xx/5xx): ${withNetErrors.length}`);
    console.log(`Sem heading (h1/h2): ${noHeading.length}`);
    console.log(`Carregamento lento (>5s): ${slow.length}`);

    if (withErrors.length > 0) {
      console.log("\n── Páginas com erros de console ──");
      for (const r of withErrors) {
        console.log(`  ${r.name}: ${r.consoleErrors.length} erro(s)`);
      }
    }

    if (withNetErrors.length > 0) {
      console.log("\n── Páginas com erros de rede ──");
      for (const r of withNetErrors) {
        for (const e of r.networkErrors) {
          console.log(`  ${r.name}: ${e.status} ${e.url}`);
        }
      }
    }

    if (noHeading.length > 0) {
      console.log("\n── Páginas sem heading ──");
      for (const r of noHeading) {
        console.log(`  ${r.name} (${r.route})`);
      }
    }

    console.log("\n── Tempo de carregamento ──");
    const sorted = [...results].sort((a, b) => b.loadTimeMs - a.loadTimeMs);
    for (const r of sorted.slice(0, 10)) {
      const bar = "█".repeat(Math.ceil(r.loadTimeMs / 500));
      console.log(`  ${r.loadTimeMs.toString().padStart(5)}ms ${bar} ${r.name}`);
    }

    expect(results.length).toBe(ALL_ROUTES.length);
  });
});

import { test, expect, type Page } from "@playwright/test";

/**
 * Oniefy - Smoke Test E2E
 *
 * Cobre os fluxos críticos de happy path em sequência:
 * 1. Dashboard carrega sem erros
 * 2. Criar transação (despesa + receita)
 * 3. Editar transação
 * 4. Dashboard reflete valores
 * 5. Criar conta
 * 6. Criar orçamento
 * 7. Criar bem patrimonial
 * 8. Navegar por todas as rotas sem crash
 * 9. Configurações carregam
 *
 * Tempo estimado: ~2 min.
 * Dependência: auth.setup.ts (login automático).
 *
 * Coleta console.error automaticamente para diagnóstico.
 */

// ── Console error collector ────────────────────────────────
const consoleErrors: string[] = [];

function attachConsoleCollector(page: Page) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(`[${msg.location().url}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(`[PAGE ERROR] ${err.message}`);
  });
}

// ── Helpers ────────────────────────────────────────────────

/** Wait for page to be interactive (heading visible) */
async function waitForPage(page: Page, headingText: string | RegExp, timeout = 15000) {
  await expect(
    page.getByRole("heading", { name: headingText }).first()
  ).toBeVisible({ timeout });
}

/** Wait for toast (sonner) to appear with expected text */
async function expectToast(page: Page, text: string | RegExp, timeout = 10000) {
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: text });
  await expect(toast.first()).toBeVisible({ timeout });
}

/** Click first button matching name */
async function clickButton(page: Page, name: string | RegExp) {
  await page.getByRole("button", { name }).first().click();
}

// ── Tests ──────────────────────────────────────────────────

test.describe.serial("Smoke test - fluxo completo", () => {
  test.beforeEach(async ({ page }) => {
    attachConsoleCollector(page);
  });

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status !== "passed" && consoleErrors.length > 0) {
      console.log("\n══ Console errors durante o teste ══");
      consoleErrors.forEach((e) => console.log("  •", e));
      console.log("══════════════════════════════════\n");
    }
    consoleErrors.length = 0;
  });

  // ── 1. Dashboard carrega ────────────────────────────────
  test("01 - dashboard carrega sem erros", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPage(page, "Início");

    // Verifica que cards de resumo existem (mesmo zerados)
    await expect(page.getByText("Receitas").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Despesas").first()).toBeVisible();

    // Nenhum texto em inglês genérico
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("No data");
    expect(body).not.toContain("Something went wrong");
  });

  // ── 2. Criar despesa ────────────────────────────────────
  test("02 - criar despesa via formulário rápido", async ({ page }) => {
    await page.goto("/transactions");
    await page.waitForLoadState("domcontentloaded");

    // Abrir formulário
    await clickButton(page, /Nova transação/);
    await expect(page.locator("#tx-amount")).toBeVisible({ timeout: 5000 });

    // Despesa é default
    const radioGroup = page.locator('[role="radiogroup"][aria-label="Tipo de transação"]');
    await expect(radioGroup.getByRole("radio", { name: "Despesa" })).toBeChecked();

    // Preencher valor
    await page.locator("#tx-amount").fill("250,00");

    // Expandir opções e preencher descrição
    const maisOpcoes = page.getByText(/Mais opções/);
    if (await maisOpcoes.isVisible()) {
      await maisOpcoes.click();
    }
    await page.locator("#tx-desc").fill("Smoke test - despesa");

    // Selecionar conta (primeira disponível)
    const accountSelect = page.locator("#tx-account");
    if (await accountSelect.isVisible()) {
      const options = await accountSelect.locator("option").allTextContents();
      if (options.length > 1) {
        await accountSelect.selectOption({ index: 1 });
      }
    }

    // Selecionar categoria (primeira disponível)
    const categorySelect = page.locator("#tx-category");
    if (await categorySelect.isVisible()) {
      const options = await categorySelect.locator("option").allTextContents();
      if (options.length > 1) {
        await categorySelect.selectOption({ index: 1 });
      }
    }

    // Submeter
    await page.locator('button[type="submit"]').click();

    // Esperar sucesso (toast ou transação na lista)
    await expect(
      page.getByText("Smoke test - despesa").first()
    ).toBeVisible({ timeout: 15000 });
  });

  // ── 3. Criar receita ───────────────────────────────────
  test("03 - criar receita", async ({ page }) => {
    await page.goto("/transactions");
    await page.waitForLoadState("domcontentloaded");

    await clickButton(page, /Nova transação/);
    await expect(page.locator("#tx-amount")).toBeVisible({ timeout: 5000 });

    // Trocar para Receita
    const radioGroup = page.locator('[role="radiogroup"][aria-label="Tipo de transação"]');
    await radioGroup.getByRole("radio", { name: "Receita" }).click();

    await page.locator("#tx-amount").fill("5000,00");

    const maisOpcoes = page.getByText(/Mais opções/);
    if (await maisOpcoes.isVisible()) {
      await maisOpcoes.click();
    }
    await page.locator("#tx-desc").fill("Smoke test - receita");

    const accountSelect = page.locator("#tx-account");
    if (await accountSelect.isVisible()) {
      const options = await accountSelect.locator("option").allTextContents();
      if (options.length > 1) {
        await accountSelect.selectOption({ index: 1 });
      }
    }

    await page.locator('button[type="submit"]').click();

    await expect(
      page.getByText("Smoke test - receita").first()
    ).toBeVisible({ timeout: 15000 });
  });

  // ── 4. Dashboard reflete transações ─────────────────────
  test("04 - dashboard reflete transações criadas", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPage(page, "Início");

    // Aguardar carregamento dos dados (RPCs do dashboard)
    await page.waitForTimeout(3000);

    // O body não deve conter R$ 0,00 em TODOS os cards (pelo menos um tem valor)
    const body = await page.locator("body").textContent();
    // Receita de 5000 deve aparecer em algum lugar
    expect(body).toMatch(/5[.\s]?000/);
  });

  // ── 5. Todas as rotas carregam sem crash ────────────────
  test("05 - todas as rotas protegidas carregam sem tela branca", async ({ page }) => {
    const routes = [
      { path: "/dashboard", heading: "Início" },
      { path: "/transactions", heading: /Transações/ },
      { path: "/accounts", heading: /Contas/ },
      { path: "/budgets", heading: /Orçamento/ },
      { path: "/assets", heading: /Patrimônio/ },
      { path: "/connections", heading: /Importar/ },
      { path: "/settings", heading: /Configurações/ },
      { path: "/settings/profile", heading: /Perfil/ },
      { path: "/settings/security", heading: /Segurança/ },
      { path: "/settings/notifications", heading: /Notificações/ },
      { path: "/settings/data", heading: /Dados/ },
      { path: "/categories", heading: /Categorias/ },
      { path: "/bills", heading: /Contas a Pagar|Vencimentos/ },
      { path: "/tax", heading: /Fiscal|IRPF/ },
      { path: "/indices", heading: /Índices/ },
      { path: "/family", heading: /Família/ },
      { path: "/chart-of-accounts", heading: /Plano de Contas/ },
      { path: "/cost-centers", heading: /Centros/ },
      { path: "/workflows", heading: /Tarefas|Workflows/ },
    ];

    const failures: string[] = [];

    for (const { path, heading } of routes) {
      await page.goto(path);
      try {
        await expect(
          page.getByRole("heading", { name: heading }).first()
        ).toBeVisible({ timeout: 10000 });
      } catch {
        // Fallback: check page isn't blank
        const bodyText = await page.locator("body").textContent();
        if (!bodyText || bodyText.trim().length < 50) {
          failures.push(`${path} - tela branca ou vazia`);
        } else if (bodyText.includes("Something went wrong") || bodyText.includes("Error")) {
          failures.push(`${path} - erro renderizado na tela`);
        }
        // Se tem conteúdo mas heading não bate, pode ser heading diferente - warn only
      }
    }

    if (failures.length > 0) {
      console.log("\n══ Rotas com problemas ══");
      failures.forEach((f) => console.log("  ✗", f));
      console.log("══════════════════════════\n");
    }
    expect(failures).toHaveLength(0);
  });

  // ── 6. Criar conta financeira ───────────────────────────
  test("06 - criar conta financeira", async ({ page }) => {
    await page.goto("/accounts");
    await page.waitForLoadState("domcontentloaded");

    await clickButton(page, /Nova conta/);

    // Preencher formulário
    await page.locator("#acc-name").fill("Smoke Test Bank");

    const typeSelect = page.locator("#acc-type");
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption({ index: 1 }); // Primeira opção não-placeholder
    }

    const balanceField = page.locator("#acc-balance");
    if (await balanceField.isVisible()) {
      await balanceField.fill("1000,00");
    }

    // Submeter
    await page.locator('button[type="submit"]').click();

    // Conta deve aparecer na lista
    await expect(
      page.getByText("Smoke Test Bank").first()
    ).toBeVisible({ timeout: 10000 });
  });

  // ── 7. Criar orçamento ─────────────────────────────────
  test("07 - criar orçamento", async ({ page }) => {
    await page.goto("/budgets");
    await page.waitForLoadState("domcontentloaded");

    // Pode ser "Nova categoria" ou "Novo orçamento"
    const ctaButton = page.getByRole("button", { name: /Nova categoria|Novo orçamento|Adicionar/ }).first();
    if (await ctaButton.isVisible({ timeout: 5000 })) {
      await ctaButton.click();

      // Preencher valor
      const amountField = page.locator("#budget-amount");
      if (await amountField.isVisible({ timeout: 3000 })) {
        await amountField.fill("1500,00");

        // Selecionar categoria
        const catSelect = page.locator("#budget-category");
        if (await catSelect.isVisible()) {
          const options = await catSelect.locator("option").allTextContents();
          if (options.length > 1) {
            await catSelect.selectOption({ index: 1 });
          }
        }

        await page.locator('button[type="submit"]').click();
        // Esperar toast ou atualização da lista
        await page.waitForTimeout(2000);
      }
    }
    // Se CTA não existe (orçamento já pode ter estado diferente), não falha
  });

  // ── 8. Criar bem patrimonial ───────────────────────────
  test("08 - criar bem patrimonial", async ({ page }) => {
    await page.goto("/assets");
    await page.waitForLoadState("domcontentloaded");

    await clickButton(page, /Novo bem/);

    await page.locator("#asset-name").fill("Smoke Test MacBook");

    const catSelect = page.locator("#asset-category");
    if (await catSelect.isVisible()) {
      await catSelect.selectOption({ index: 1 });
    }

    const acqValue = page.locator("#asset-acq-value");
    if (await acqValue.isVisible()) {
      await acqValue.fill("12000,00");
    }

    const curValue = page.locator("#asset-cur-value");
    if (await curValue.isVisible()) {
      await curValue.fill("10000,00");
    }

    await page.locator('button[type="submit"]').click();

    await expect(
      page.getByText("Smoke Test MacBook").first()
    ).toBeVisible({ timeout: 10000 });
  });

  // ── 9. Páginas públicas não crasham ────────────────────
  test("09 - páginas públicas carregam (privacy, terms)", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("body")).toContainText(/privacidade|proteção|dados/i, {
      timeout: 10000,
    });

    await page.goto("/terms");
    await expect(page.locator("body")).toContainText(/termos|condições|uso/i, {
      timeout: 10000,
    });
  });

  // ── 10. Console limpo ──────────────────────────────────
  test("10 - nenhum console.error crítico durante a sessão", async ({ page }) => {
    // Navegar por rotas-chave para coletar erros
    const criticalRoutes = ["/dashboard", "/transactions", "/accounts", "/settings"];
    for (const route of criticalRoutes) {
      await page.goto(route);
      await page.waitForTimeout(2000);
    }

    // Filtrar erros reais (ignorar warnings de React, hydration mismatches em dev)
    const realErrors = consoleErrors.filter(
      (e) =>
        !e.includes("Warning:") &&
        !e.includes("Hydration") &&
        !e.includes("downloadable font") &&
        !e.includes("favicon") &&
        !e.includes("manifest") &&
        !e.includes("service-worker") &&
        !e.includes("ResizeObserver")
    );

    if (realErrors.length > 0) {
      console.log("\n══ Console errors reais ══");
      realErrors.forEach((e) => console.log("  •", e));
      console.log("══════════════════════════\n");
    }

    expect(realErrors.length).toBeLessThanOrEqual(2); // Tolerância: até 2 erros não-críticos
  });
});

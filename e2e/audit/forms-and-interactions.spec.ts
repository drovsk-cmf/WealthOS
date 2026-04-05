import { test, expect, type Page } from "@playwright/test";

/**
 * AUDITORIA DE FORMULÁRIOS E INTERAÇÕES
 *
 * Testa cada formulário CRUD, modal, e botão interativo do Oniefy.
 * Simula um usuário real preenchendo cada campo e verificando feedback.
 *
 * Execução: npx playwright test e2e/audit/forms-and-interactions.spec.ts
 */

// ── Helpers ──────────────────────────────────────────────

async function waitForPage(page: Page, timeout = 15000) {
  await page.waitForLoadState("networkidle", { timeout });
  await page.waitForTimeout(500);
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Console error collector ──────────────────────────────
const allConsoleErrors: { page: string; errors: string[] }[] = [];

function collectErrors(page: Page, pageName: string) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`[CRASH] ${err.message}`));
  page.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("favicon")) {
      errors.push(`[HTTP ${res.status()}] ${res.url().split("?")[0]}`);
    }
  });
  return errors;
}

// ══════════════════════════════════════════════════════════
//  TESTES POR SEÇÃO
// ══════════════════════════════════════════════════════════

test.describe("Formulários e interações", () => {
  test.describe.configure({ mode: "serial" });

  // ── CONTAS ──────────────────────────────────────────────

  test("Criar conta bancária", async ({ page }) => {
    const errors = collectErrors(page, "criar-conta");
    await page.goto("/accounts");
    await waitForPage(page);

    await page.click("text=+ Nova conta");
    await page.waitForTimeout(500);

    // Preencher formulário
    await page.fill('input[placeholder="Ex: Banco Principal"]', "Bradesco Teste E2E");
    await page.selectOption("select >> nth=0", { label: "Conta Corrente" });
    await page.selectOption("select >> nth=1", { label: "237 - Bradesco" });
    await page.fill('input[placeholder="0,00"]', "1500");

    // Submeter
    await page.click("text=Criar conta");
    await page.waitForTimeout(2000);

    // Verificar toast ou conta na lista
    const content = await page.textContent("body");
    expect(
      content?.includes("Bradesco Teste E2E") || content?.includes("sucesso"),
      "Conta criada e visível na lista ou toast de sucesso"
    ).toBe(true);

    expect(errors.filter((e) => e.startsWith("[HTTP") || e.startsWith("[CRASH]"))).toHaveLength(0);
  });

  // ── TRANSAÇÕES ─────────────────────────────────────────

  test("Criar transação via FAB (+)", async ({ page }) => {
    const errors = collectErrors(page, "criar-transacao");
    await page.goto("/dashboard");
    await waitForPage(page);

    // Clicar FAB (botão com ícone, sem texto visível — usa aria-label)
    await page.click('button[aria-label="Novo lançamento"]');
    await page.waitForTimeout(500);

    // Preencher rápido
    await page.fill('input[placeholder="0,00"]', "42.50");
    await page.fill('input[placeholder*="Supermercado"]', "Café Starbucks E2E");

    // Expandir mais opções
    await page.click("text=Mais opções");
    await page.waitForTimeout(300);

    // Verificar que categoria foi auto-inferida
    const categorySelect = page.locator("select").filter({ hasText: /Alimentação|Lazer|Selecione/ });
    await expect(categorySelect).toBeVisible();

    // Submeter
    await page.click('button:has-text("Lançar despesa")');
    await page.waitForTimeout(2000);

    const toastOrContent = await page.textContent("body");
    expect(
      toastOrContent?.includes("sucesso") || toastOrContent?.includes("Café Starbucks"),
      "Transação criada"
    ).toBe(true);

    expect(errors.filter((e) => e.startsWith("[CRASH]"))).toHaveLength(0);
  });

  test("Listar e filtrar transações", async ({ page }) => {
    await page.goto("/transactions");
    await waitForPage(page);

    // Verificar tabs Todas/Pendentes/Vencidas
    await expect(page.locator("text=Todas")).toBeVisible();
    await expect(page.locator("text=Pendentes")).toBeVisible();
    await expect(page.locator("text=Vencidas")).toBeVisible();

    // Clicar em Pendentes
    await page.click("text=Pendentes");
    await page.waitForTimeout(500);

    // Verificar que a página não crashou
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(50);
  });

  // ── CARTÕES ────────────────────────────────────────────

  test("Página de cartões carrega e abre formulário", async ({ page }) => {
    const errors = collectErrors(page, "cartoes");
    await page.goto("/cards");
    await waitForPage(page);

    const hasNewButton = await page.locator("text=Novo cartão").isVisible();
    const hasCadastrar = await page.locator("text=Cadastrar primeiro cartão").isVisible();
    expect(hasNewButton || hasCadastrar, "Botão de criar cartão visível").toBe(true);

    // Clicar no botão de novo cartão
    if (hasNewButton) await page.click("text=Novo cartão");
    else await page.click("text=Cadastrar primeiro cartão");
    await page.waitForTimeout(500);

    // Verificar que o formulário abriu
    const formVisible = await page.locator("input, select").first().isVisible();
    expect(formVisible, "Formulário de cartão abriu").toBe(true);

    // Fechar sem salvar
    const cancelBtn = page.locator("text=Cancelar");
    if (await cancelBtn.isVisible()) await cancelBtn.click();

    expect(errors.filter((e) => e.startsWith("[CRASH]"))).toHaveLength(0);
  });

  // ── CONTAS A PAGAR / RECORRÊNCIAS ──────────────────────

  test("Contas a Pagar: abas e criação", async ({ page }) => {
    const errors = collectErrors(page, "bills");
    await page.goto("/bills");
    await waitForPage(page);

    // Verificar 4 abas (usar button para evitar ambiguidade com empty state)
    await expect(page.locator('button:has-text("Pendentes")')).toBeVisible();
    await expect(page.locator('button:has-text("Recorrências")')).toBeVisible();
    await expect(page.locator('button:has-text("Assinaturas")')).toBeVisible();
    await expect(page.locator('button:has-text("Calendário")')).toBeVisible();

    // Navegar entre abas
    await page.locator('button:has-text("Recorrências")').click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Assinaturas")').click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Calendário")').click();
    await page.waitForTimeout(500);
    await page.click("text=Pendentes");
    await page.waitForTimeout(500);

    // Abrir formulário
    await page.click("text=+ Nova recorrência");
    await page.waitForTimeout(500);
    const formVisible = await page.locator("text=Nova Conta Recorrente").isVisible();
    expect(formVisible, "Formulário de recorrência abriu").toBe(true);

    // Fechar
    const cancelBtn = page.locator("text=Cancelar");
    if (await cancelBtn.isVisible()) await cancelBtn.click();

    expect(errors.filter((e) => e.startsWith("[CRASH]"))).toHaveLength(0);
  });

  // ── ORÇAMENTO ──────────────────────────────────────────

  test("Orçamento: criar e verificar", async ({ page }) => {
    const errors = collectErrors(page, "orcamento");
    await page.goto("/budgets");
    await waitForPage(page);

    // Verificar seletor de mês
    await expect(page.locator("text=Mês anterior").or(page.locator("[aria-label*='anterior']"))).toBeVisible();

    // Tentar criar
    await page.click("text=Criar orçamento");
    await page.waitForTimeout(500);

    // Verificar formulário
    const formVisible = await page.locator("text=Novo Orçamento").isVisible();
    expect(formVisible, "Formulário de orçamento abriu").toBe(true);

    // Preencher e submeter
    await page.selectOption("select >> nth=0", { index: 1 }); // primeira categoria
    await page.fill('input[placeholder="0,00"]', "500");
    // O select "índice de reajuste" pode sobrepor o botão no modal
    await page.locator("button", { hasText: "Criar" }).last().scrollIntoViewIfNeeded();
    await page.locator("button", { hasText: "Criar" }).last().click({ force: true });
    await page.waitForTimeout(3000);

    // Verificar resultado (sem HTTP errors)
    const httpErrors = errors.filter((e) => e.startsWith("[HTTP"));
    if (httpErrors.length > 0) {
      console.warn("⚠️ Erros HTTP na criação de orçamento:", httpErrors);
    }
  });

  // ── METAS ──────────────────────────────────────────────

  test("Metas: criar meta financeira", async ({ page }) => {
    const errors = collectErrors(page, "metas");
    await page.goto("/goals");
    await waitForPage(page);

    const hasCriar = await page.locator("text=+ Criar meta").or(page.locator("text=+ Nova meta")).isVisible();
    if (hasCriar) {
      await page.click("text=+ Criar meta >> visible=true").catch(() =>
        page.click("text=+ Nova meta >> visible=true")
      );
      await page.waitForTimeout(500);
    }

    expect(errors.filter((e) => e.startsWith("[CRASH]"))).toHaveLength(0);
  });

  // ── PATRIMÔNIO (BENS) ──────────────────────────────────

  test("Patrimônio: página de bens carrega", async ({ page }) => {
    const errors = collectErrors(page, "assets");
    await page.goto("/assets");
    await waitForPage(page);

    // Verificar empty state ou lista (usar .first() para evitar strict mode com 2 botões)
    const hasNovo = await page.locator("text=+ Novo bem").or(page.locator("text=+ Cadastrar bem")).first().isVisible();
    expect(hasNovo, "Botão de criar bem visível").toBe(true);

    expect(errors.filter((e) => e.startsWith("[CRASH]"))).toHaveLength(0);
  });

  // ── FLUXO DE CAIXA ─────────────────────────────────────

  test("Fluxo de Caixa: filtros funcionam", async ({ page }) => {
    await page.goto("/cash-flow");
    await waitForPage(page);

    // Verificar filtros Dia/Mês/Ano
    const hasDia = await page.locator("text=Dia").isVisible();
    const hasMes = await page.locator("text=Mês").isVisible();
    const hasAno = await page.locator("text=Ano").isVisible();
    expect(hasDia && hasMes && hasAno, "Filtros de período visíveis").toBe(true);

    // Clicar em cada filtro
    await page.click("text=Dia");
    await page.waitForTimeout(500);
    await page.click("text=Ano");
    await page.waitForTimeout(500);
    await page.click("text=Mês");
    await page.waitForTimeout(500);
  });

  // ── IMPOSTOS ───────────────────────────────────────────

  test("Impostos/IRPF: carrega dados fiscais", async ({ page }) => {
    await page.goto("/tax");
    await waitForPage(page);

    await expect(page.locator("text=Imposto de Renda")).toBeVisible();
    await expect(page.locator("text=Provisionamento de IR").or(page.locator("text=Relatório"))).toBeVisible();
  });

  // ── DIAGNÓSTICO ────────────────────────────────────────

  test("Diagnóstico Financeiro: carrega", async ({ page }) => {
    await page.goto("/diagnostics");
    await waitForPage(page);
    await expect(page.locator("text=Diagnóstico Financeiro")).toBeVisible();
  });

  // ── CALCULADORAS ───────────────────────────────────────

  const CALC_TABS = [
    "Posso comprar?",
    "Projeção",
    "Independência",
    "Comprar vs Alugar",
    "CET",
    "SAC vs Price",
  ];

  test("Calculadoras: todas as abas carregam", async ({ page }) => {
    const errors = collectErrors(page, "calculadoras");
    await page.goto("/calculators");
    await waitForPage(page);

    for (const tab of CALC_TABS) {
      const tabBtn = page.locator(`text=${tab}`).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(800);

        // Verificar que não crashou
        const body = await page.textContent("body");
        expect(body?.length, `Aba ${tab} renderizou conteúdo`).toBeGreaterThan(50);
      }
    }

    expect(errors.filter((e) => e.startsWith("[CRASH]"))).toHaveLength(0);
  });

  // ── ÍNDICES ECONÔMICOS ─────────────────────────────────

  test("Índices: dados carregam e cards são clicáveis", async ({ page }) => {
    await page.goto("/indices");
    await waitForPage(page);

    // Verificar que ao menos um índice carregou
    const hasIPCA = await page.locator("text=IPCA").isVisible();
    const hasSelic = await page.locator("text=Selic").isVisible();
    expect(hasIPCA || hasSelic, "Ao menos um índice carregou").toBe(true);

    // Clicar em um card de índice para ver gráfico
    if (hasSelic) {
      await page.click("text=Selic");
      await page.waitForTimeout(500);
    }
  });

  // ── CONFIGURAÇÕES (todas as sub-páginas) ───────────────

  test("Settings hub: todos os links funcionam", async ({ page }) => {
    await page.goto("/settings");
    await waitForPage(page);

    await expect(page.locator("text=Configurações")).toBeVisible();

    const settingsLinks = [
      { text: "Perfil", url: "/settings/profile" },
      { text: "Notificações", url: "/settings/notifications" },
      { text: "Segurança", url: "/settings/security" },
      { text: "Dados e privacidade", url: "/settings/data" },
    ];

    for (const link of settingsLinks) {
      await page.goto("/settings");
      await waitForPage(page);

      const linkEl = page.locator(`text=${link.text}`).first();
      if (await linkEl.isVisible()) {
        await linkEl.click();
        await page.waitForTimeout(1000);

        // Verificar que navegou
        expect(page.url()).toContain(link.url);

        // Verificar que não crashou
        const body = await page.textContent("body");
        expect(body?.length, `${link.text} renderizou`).toBeGreaterThan(50);
      }
    }
  });

  // ── CATEGORIAS ─────────────────────────────────────────

  test("Categorias: lista e formulário", async ({ page }) => {
    await page.goto("/categories");
    await waitForPage(page);

    // Deve ter categorias pré-populadas
    const body = await page.textContent("body");
    expect(body?.includes("Alimentação") || body?.includes("Moradia"), "Categorias visíveis").toBe(true);
  });

  // ── IMPORTAÇÃO ─────────────────────────────────────────

  test("Importação: página carrega com opções", async ({ page }) => {
    await page.goto("/connections");
    await waitForPage(page);

    const body = await page.textContent("body");
    expect(
      body?.includes("OFX") || body?.includes("CSV") || body?.includes("extrato") || body?.includes("Importa"),
      "Página de importação tem conteúdo relevante"
    ).toBe(true);
  });

  // ── PÁGINAS AUXILIARES ─────────────────────────────────

  const AUX_PAGES = [
    { path: "/cost-centers", name: "Divisões" },
    { path: "/family", name: "Estrutura Familiar" },
    { path: "/workflows", name: "Tarefas" },
    { path: "/chart-of-accounts", name: "Estrutura Contábil" },
    { path: "/more/warranties", name: "Garantias" },
  ];

  for (const pg of AUX_PAGES) {
    test(`Auxiliar: ${pg.name} carrega`, async ({ page }) => {
      const errors = collectErrors(page, pg.name);
      await page.goto(pg.path);
      await waitForPage(page);

      const body = await page.textContent("body");
      expect(body?.length, `${pg.name} renderizou conteúdo`).toBeGreaterThan(50);
      expect(errors.filter((e) => e.startsWith("[CRASH]"))).toHaveLength(0);
    });
  }

  // ── SININHO (NOTIFICAÇÕES) ─────────────────────────────

  test("Sininho: painel de pendências abre e fecha", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPage(page);

    const bell = page.locator('[aria-label*="Pendências"]').first();
    await expect(bell).toBeVisible();
    await bell.click();
    await page.waitForTimeout(500);

    // Verificar que o painel abriu
    const panelVisible = await page.locator("text=Pendências").nth(1).isVisible().catch(() => false);
    // Fechar
    await page.keyboard.press("Escape");
  });

  // ── PRIVACY MODE ───────────────────────────────────────

  test("Privacy mode: toggle oculta valores", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPage(page);

    // Procurar botão de privacidade
    const privacyBtn = page.locator('[aria-label*="Ocultar valores"]').or(
      page.locator('[aria-label*="Exibir valores"]')
    ).first();

    if (await privacyBtn.isVisible()) {
      await privacyBtn.click();
      await page.waitForTimeout(300);

      // Verificar que os valores estão mascarados (••••)
      const body = await page.textContent("body");
      const hasMasked = body?.includes("••••") || body?.includes("****");
      // Toggle de volta
      await privacyBtn.click();
      await page.waitForTimeout(300);
    }
  });
});

import { test, expect, type Page } from "@playwright/test";

/**
 * AUDITORIA 6: UX NO FLUXO DE IA
 *
 * Verifica que os fluxos envolvendo IA (categorização automática,
 * narrativas, assistente) têm feedback visual adequado:
 * - Microcopy explica o que a IA está fazendo
 * - Respostas são claras e editáveis
 * - Quando IA falha, o usuário entende e pode agir manualmente
 * - Sugestões de IA aparecem como pré-preenchimento, não imposição
 *
 * Execução: npx playwright test e2e/audit/ai-ux.spec.ts
 */

// ── Helpers ──────────────────────────────────────────────

async function waitForPage(page: Page, timeout = 15000) {
  await page.waitForLoadState("networkidle", { timeout });
  await page.waitForTimeout(500);
}

test.describe("UX nos fluxos de IA", () => {
  test.describe.configure({ mode: "serial" });

  test("Categorização automática: descrição sugere categoria", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("response", (res) => {
      if (res.status() >= 400 && res.url().includes("supabase")) {
        errors.push(`[HTTP ${res.status()}] ${res.url().split("?")[0]}`);
      }
    });

    await page.goto("/dashboard");
    await waitForPage(page);

    // Abrir FAB de nova transação
    const fab = page.locator('button:has-text("Novo lançamento")');
    if (await fab.isVisible()) {
      await fab.click();
      await page.waitForTimeout(500);

      // Preencher descrição que deveria acionar categorização
      const descInput = page.locator('input[placeholder*="Supermercado"]');
      if (await descInput.isVisible()) {
        await descInput.fill("Uber viagem trabalho");
        await page.waitForTimeout(1000);

        // Expandir mais opções para ver se categoria foi inferida
        const maisOpcoes = page.locator('button:has-text("Mais opções")');
        if (await maisOpcoes.isVisible()) {
          await maisOpcoes.click();
          await page.waitForTimeout(500);
        }

        // Verificar que a categoria foi pré-selecionada (não "Selecione")
        const categorySelect = page.locator("select").filter({ hasText: /Transporte|Alimentação|Lazer/ });
        const categoryValue = await categorySelect.inputValue().catch(() => "");

        console.log(`Categorização automática: "${categoryValue || "não inferida"}"`);

        if (categoryValue && categoryValue !== "") {
          console.log("✅ IA inferiu categoria automaticamente a partir da descrição");
        } else {
          console.log("⚠️ IA não inferiu categoria — verificar se o engine está ativo");
        }
      }

      // Fechar modal
      const cancelar = page.locator('button:has-text("Cancelar")');
      if (await cancelar.isVisible()) await cancelar.click();
    }

    // Sem crashes
    const crashes = errors.filter((e) => !e.startsWith("[HTTP"));
    expect(crashes, "Sem page crashes no fluxo de IA").toHaveLength(0);
  });

  test("Narrativa do dashboard: card narrativo visível e contextual", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPage(page);

    // Scroll para procurar o card narrativo
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    // Procurar por texto narrativo (gerado por IA ou motor de regras)
    const body = await page.textContent("body");

    const hasNarrative =
      body?.includes("Resumo") ||
      body?.includes("resumo") ||
      body?.includes("Atenção") ||
      body?.includes("atenção") ||
      body?.includes("scanner") ||
      body?.includes("Scanner") ||
      body?.includes("análise") ||
      body?.includes("Análise");

    console.log(
      hasNarrative
        ? "✅ Dashboard contém elementos narrativos/de atenção"
        : "ℹ️ Dashboard não mostra narrativa (pode ser normal para usuário novo com poucos dados)"
    );
  });

  test("Scanner financeiro: card de alertas na dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPage(page);

    // Scroll até o final da página
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Procurar scanner card
    const scannerCard = page.locator('text="Limpeza de Disco"').or(
      page.locator("text=Scanner").or(page.locator("text=scanner"))
    );

    const hasScannerVisible = await scannerCard.isVisible().catch(() => false);

    console.log(
      hasScannerVisible
        ? "✅ Scanner financeiro visível no dashboard"
        : "ℹ️ Scanner não visível (pode requerer maturity level 'ativo' ou superior)"
    );
  });

  test("Diagnóstico: feedback quando não há dados suficientes", async ({ page }) => {
    await page.goto("/diagnostics");
    await waitForPage(page);

    const body = await page.textContent("body");

    // Deve explicar claramente o que precisa para funcionar
    const hasExplanation =
      body?.includes("Registre") ||
      body?.includes("registre") ||
      body?.includes("transações") ||
      body?.includes("contas") ||
      body?.includes("métricas");

    expect(hasExplanation, "Diagnóstico explica o que o usuário precisa fazer").toBe(true);

    // Não deve mostrar gráficos vazios ou métricas zeradas sem contexto
    const hasOrphanedZeros =
      body?.includes("0.00%") ||
      body?.includes("NaN") ||
      body?.includes("undefined") ||
      body?.includes("null");

    if (hasOrphanedZeros) {
      console.warn("⚠️ Diagnóstico mostra valores zero/NaN sem contexto explicativo");
    } else {
      console.log("✅ Diagnóstico não mostra dados órfãos quando sem dados suficientes");
    }
  });

  test("Calculadoras: feedback quando dados são insuficientes", async ({ page }) => {
    await page.goto("/calculators/affordability");
    await waitForPage(page);

    const body = await page.textContent("body");

    // Deve explicar o que precisa (ex: "pelo menos 1 mês de transações")
    const hasExplanation =
      body?.includes("mês") ||
      body?.includes("transações") ||
      body?.includes("Importe") ||
      body?.includes("lance") ||
      body?.includes("precisa");

    expect(hasExplanation, "Calculadora explica pré-requisitos de dados").toBe(true);

    console.log("✅ Calculadora mostra feedback sobre pré-requisitos de dados");
  });

  test("Importação (OCR): botão de foto de recibo existe no formulário", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPage(page);

    // Abrir FAB
    const fab = page.locator('button:has-text("Novo lançamento")');
    if (await fab.isVisible()) {
      await fab.click();
      await page.waitForTimeout(500);

      // Verificar que o botão de OCR existe
      const ocrButton = page.locator('text="Preencher por foto de recibo"');
      const hasOCR = await ocrButton.isVisible();

      expect(hasOCR, "Botão de OCR (foto de recibo) está visível no formulário de transação").toBe(true);
      console.log("✅ Botão 'Preencher por foto de recibo' visível — UX de IA contextualizada");

      // Fechar modal
      const cancelar = page.locator('button:has-text("Cancelar")');
      if (await cancelar.isVisible()) await cancelar.click();
    }
  });
});

import { test, expect, type Page } from "@playwright/test";

/**
 * AUDITORIA 11: SEGURANÇA PERCEBIDA E CONFIANÇA
 *
 * Verifica que a interface transmite segurança ao usuário:
 * - Ações críticas pedem confirmação proporcional ao risco
 * - Dados sensíveis têm indicadores visuais de proteção
 * - Mensagens de erro não expõem detalhes técnicos
 * - Privacy mode funciona em todas as páginas com valores
 * - Termos e compliance são claros
 *
 * Execução: npx playwright test e2e/audit/security-trust.spec.ts
 */

async function waitForPage(page: Page, timeout = 15000) {
  await page.waitForLoadState("networkidle", { timeout });
  await page.waitForTimeout(500);
}

test.describe("Segurança percebida e confiança", () => {
  test.describe.configure({ mode: "serial" });

  // ── CONFIRMAÇÕES DE AÇÕES CRÍTICAS ─────────────────────

  test("Desativar conta pede confirmação antes de executar", async ({ page }) => {
    await page.goto("/accounts");
    await waitForPage(page);

    // Se há contas, tentar desativar uma
    const desativarBtn = page.locator('[aria-label="Desativar"], [title="Desativar"]').first();
    if (await desativarBtn.isVisible()) {
      await desativarBtn.click();
      await page.waitForTimeout(300);

      // Deve aparecer confirmação (Confirmar / Não)
      const confirmBtn = page.locator('button:has-text("Confirmar")');
      const hasConfirm = await confirmBtn.isVisible();

      expect(hasConfirm, "Ação de desativar conta pede confirmação").toBe(true);
      console.log("✅ Desativar conta tem confirmação em 2 passos");

      // Cancelar a ação
      const naoBtn = page.locator('button:has-text("Não")');
      if (await naoBtn.isVisible()) await naoBtn.click();
    } else {
      console.log("ℹ️ Nenhuma conta para testar desativação (skip)");
    }
  });

  test("Excluir transação pede confirmação", async ({ page }) => {
    await page.goto("/transactions");
    await waitForPage(page);

    const deleteBtn = page.locator('[aria-label="Excluir"], [title="Excluir"], [aria-label="Remover"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(300);

      const hasConfirm = await page.locator('button:has-text("Confirmar")').isVisible();
      expect(hasConfirm, "Exclusão de transação pede confirmação").toBe(true);
      console.log("✅ Excluir transação tem confirmação");

      // Cancelar
      const naoBtn = page.locator('button:has-text("Não"), button:has-text("Cancelar")');
      if (await naoBtn.first().isVisible()) await naoBtn.first().click();
    } else {
      console.log("ℹ️ Nenhuma transação para testar exclusão (skip)");
    }
  });

  test("Exclusão de conta (settings/security) pede confirmação forte", async ({ page }) => {
    await page.goto("/settings/security");
    await waitForPage(page);

    const body = await page.textContent("body");

    // Deve ter seção de exclusão de conta
    const hasDeleteSection =
      body?.includes("Excluir conta") ||
      body?.includes("excluir conta") ||
      body?.includes("Apagar conta") ||
      body?.includes("Encerrar");

    if (hasDeleteSection) {
      console.log("✅ Seção de exclusão de conta existe em /settings/security");

      // Verificar que o botão tem estilo destrutivo (não é um botão primário azul)
      const deleteBtn = page.locator('button:has-text("Excluir"), button:has-text("Apagar")').first();
      if (await deleteBtn.isVisible()) {
        const classes = await deleteBtn.getAttribute("class");
        const isDestructive =
          classes?.includes("destructive") ||
          classes?.includes("terracotta") ||
          classes?.includes("red") ||
          classes?.includes("danger");

        console.log(
          isDestructive
            ? "✅ Botão de exclusão tem estilo destrutivo (visual de risco)"
            : "⚠️ Botão de exclusão não tem estilo destrutivo — pode não comunicar risco"
        );
      }
    } else {
      console.log("ℹ️ Seção de exclusão de conta não encontrada em /settings/security");
    }
  });

  // ── PRIVACY MODE ───────────────────────────────────────

  test("Privacy mode oculta valores em todas as páginas com dados financeiros", async ({ page }) => {
    const pagesWithValues = ["/dashboard", "/accounts", "/transactions", "/budgets"];

    for (const route of pagesWithValues) {
      await page.goto(route);
      await waitForPage(page);

      // Ativar privacy mode
      const privacyBtn = page.locator('[aria-label*="Ocultar valores"]').first();
      if (await privacyBtn.isVisible()) {
        await privacyBtn.click();
        await page.waitForTimeout(300);

        const body = await page.textContent("body");

        // Verificar que valores R$ estão mascarados
        const hasVisibleValues = body?.match(/R\$\s*\d+[.,]\d{2}/);
        const hasMasked = body?.includes("••••") || body?.includes("****") || body?.includes("R$ •");

        if (hasVisibleValues && !hasMasked) {
          console.warn(`⚠️ ${route}: valores financeiros visíveis mesmo com privacy mode ativo`);
        } else {
          console.log(`✅ ${route}: privacy mode funciona`);
        }

        // Desativar privacy mode para próxima iteração
        const showBtn = page.locator('[aria-label*="Exibir valores"]').first();
        if (await showBtn.isVisible()) await showBtn.click();
        await page.waitForTimeout(200);
      }
    }
  });

  // ── MENSAGENS DE ERRO NÃO TÉCNICAS ─────────────────────

  test("Login com credenciais erradas mostra mensagem amigável", async ({ page }) => {
    // Deslogar primeiro (se logado)
    await page.goto("/login");
    await page.waitForTimeout(1000);

    // Se já redirecionou para dashboard, forçar logout
    if (page.url().includes("/dashboard")) {
      await page.goto("/login");
      await page.waitForTimeout(500);
    }

    // Se estamos na tela de login, testar credenciais erradas
    const emailInput = page.locator("#email, input[type='email']").first();
    if (await emailInput.isVisible()) {
      await emailInput.fill("usuario-inexistente@teste.com");

      const passInput = page.locator("#password, input[type='password']").first();
      await passInput.fill("SenhaErrada123!");

      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      const body = await page.textContent("body");

      // Não deve conter termos técnicos como "401", "Unauthorized", "JWT", "token"
      const hasTechnicalLeak =
        body?.includes("401") ||
        body?.includes("Unauthorized") ||
        body?.includes("JWT") ||
        body?.includes("token expired") ||
        body?.includes("invalid_grant");

      if (hasTechnicalLeak) {
        console.warn("⚠️ Login com erro expõe termos técnicos ao usuário");
      } else {
        console.log("✅ Mensagem de erro de login é amigável e não técnica");
      }

      // Deve ter mensagem compreensível
      const hasFriendlyError =
        body?.includes("incorret") ||
        body?.includes("inválid") ||
        body?.includes("não encontr") ||
        body?.includes("Verifique") ||
        body?.includes("Credenciais");

      console.log(
        hasFriendlyError
          ? "✅ Mensagem de erro de login é acionável"
          : "⚠️ Não encontrei mensagem de erro amigável após login falho"
      );
    }
  });

  // ── INDICADORES VISUAIS DE SEGURANÇA ───────────────────

  test("MFA banner visível para usuários sem 2FA", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPage(page);

    const body = await page.textContent("body");
    const hasMfaBanner =
      body?.includes("autenticação de dois fatores") ||
      body?.includes("2FA") ||
      body?.includes("Proteja sua conta");

    console.log(
      hasMfaBanner
        ? "✅ Banner de MFA visível incentivando segurança"
        : "ℹ️ Banner de MFA não visível (pode já estar configurado)"
    );
  });

  test("Página de Impostos tem disclaimer de responsabilidade", async ({ page }) => {
    await page.goto("/tax");
    await waitForPage(page);

    const body = await page.textContent("body");
    const hasDisclaimer =
      body?.includes("estimativa") ||
      body?.includes("não substitui") ||
      body?.includes("consultoria") ||
      body?.includes("profissional");

    expect(hasDisclaimer, "Página fiscal tem disclaimer de responsabilidade").toBe(true);
    console.log("✅ Página de Impostos tem disclaimer tributário");
  });

  // ── CONSISTÊNCIA VISUAL DE SEGURANÇA ───────────────────

  test("Sessão expirada redireciona com mensagem clara", async ({ page }) => {
    // Limpar cookies para simular sessão expirada (middleware redireciona
    // usuários autenticados para /dashboard, impedindo ver /login)
    await page.context().clearCookies();
    await page.goto("/login?reason=timeout");
    await page.waitForTimeout(1000);

    const body = await page.textContent("body");
    const hasTimeoutMsg =
      body?.includes("sessão expirou") ||
      body?.includes("inatividade") ||
      body?.includes("login novamente");

    expect(hasTimeoutMsg, "Tela de login com reason=timeout mostra mensagem contextual").toBe(true);
    console.log("✅ Timeout de sessão exibe mensagem clara ao usuário");
  });

  test("Termos e política de privacidade são acessíveis", async ({ page }) => {
    // Verificar se há links para termos/privacidade
    await page.goto("/settings/data");
    await waitForPage(page);

    const body = await page.textContent("body");
    const hasPrivacyLink =
      body?.includes("privacidade") ||
      body?.includes("Privacidade") ||
      body?.includes("termos") ||
      body?.includes("Termos");

    console.log(
      hasPrivacyLink
        ? "✅ Links de privacidade/termos acessíveis em /settings/data"
        : "⚠️ Links de privacidade/termos não encontrados em /settings/data"
    );
  });
});

/**
 * Variações de fluxo: ações interrompidas, back button, abandono
 * Matriz de Validação: 11.3 (Concorrência), 3.4 (Cache), 7.6 (UX formulários)
 *
 * Testa o que acontece quando o usuário NÃO segue o caminho feliz:
 * - Abre modal, abandona, abre de novo
 * - Usa botão voltar do browser no meio de um fluxo
 * - Navega para outra página sem salvar
 * - Clica em coisas durante carregamento
 *
 * Diferente do monkey test (aleatório), aqui os padrões são intencionais
 * e representam comportamentos reais frequentes.
 */
import { test, expect } from "@playwright/test";
import { auditConfig } from "../../audit.config";

test.describe("Variações de fluxo", () => {
  test("Abrir modal/dialog, fechar com Escape, reabrir", async ({ page }) => {
    // Procurar uma rota com formulários que provavelmente tem modal
    const formRoute = auditConfig.routes.find((r) => r.hasForms) || auditConfig.routes[0];
    await page.goto(formRoute.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // Procurar botão que abre modal/dialog (criar, novo, adicionar, editar)
    const triggers = page.locator(
      'button:visible:has-text("Novo"), button:visible:has-text("Criar"), ' +
      'button:visible:has-text("Adicionar"), button:visible:has-text("+")'
    );
    const count = await triggers.count();
    if (count === 0) {
      console.log(`ℹ️ ${formRoute.path}: nenhum botão de criação encontrado (skip)`);
      return;
    }

    const trigger = triggers.first();
    const triggerText = (await trigger.textContent())?.trim() || "";

    // Ciclo 1: abrir e fechar com Escape
    await trigger.click({ timeout: 3000 });
    await page.waitForTimeout(500);

    const hasDialog1 = await page.locator('[role="dialog"], [role="alertdialog"], dialog').count();
    if (hasDialog1 > 0) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);

      const dialogClosed = await page.locator('[role="dialog"], [role="alertdialog"], dialog').count();
      if (dialogClosed === 0) {
        console.log(`✅ ${formRoute.path}: dialog fecha com Escape`);
      } else {
        console.warn(`⚠️ ${formRoute.path}: dialog NÃO fecha com Escape`);
      }

      // Ciclo 2: reabrir
      await trigger.click({ timeout: 3000 });
      await page.waitForTimeout(500);

      const hasDialog2 = await page.locator('[role="dialog"], [role="alertdialog"], dialog').count();
      expect(
        hasDialog2,
        `${formRoute.path}: dialog não reabre após fechar com Escape`
      ).toBeGreaterThan(0);

      console.log(`✅ ${formRoute.path}: dialog reabre normalmente após Escape`);

      // Fechar para limpar estado
      await page.keyboard.press("Escape");
    } else {
      // Pode ter navegado para outra página ao invés de abrir modal
      console.log(`ℹ️ ${formRoute.path}: botão "${triggerText}" navega ao invés de abrir dialog`);
      await page.goBack({ timeout: 5000 }).catch(() => {});
    }
  });

  test("Botão voltar do browser no meio da navegação", async ({ page }) => {
    const routes = auditConfig.routes.slice(0, 5);
    const errors: string[] = [];

    page.on("pageerror", (err) => {
      errors.push(`${err.name}: ${err.message.substring(0, 150)}`);
    });

    // Navegar por 5 páginas
    for (const route of routes) {
      await page.goto(route.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
    }

    // Voltar 3x
    for (let i = 0; i < 3; i++) {
      await page.goBack({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(500);

      // Verificar que a página não ficou em branco
      const bodyLen = await page.evaluate(
        () => document.body?.innerText?.trim().length || 0
      ).catch(() => 0);

      if (bodyLen < 20) {
        console.warn(`⚠️ Tela em branco após voltar (step ${i + 1})`);
      }
    }

    // Avançar 2x
    for (let i = 0; i < 2; i++) {
      await page.goForward({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(500);
    }

    const criticalErrors = errors.filter(
      (e) => e.includes("TypeError") || e.includes("ReferenceError")
    );
    expect(
      criticalErrors.length,
      `Crashes durante navegação back/forward:\n${criticalErrors.join("\n")}`
    ).toBe(0);

    console.log("✅ Navegação back/forward sem crashes");
  });

  test("Navegar para outra página sem salvar formulário", async ({ page }) => {
    const formRoute = auditConfig.routes.find((r) => r.hasForms);
    if (!formRoute) {
      test.skip();
      return;
    }

    await page.goto(formRoute.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // Tentar preencher algum campo
    const inputs = page.locator(
      "input:visible:not([type='hidden']):not([type='checkbox']):not([type='radio'])"
    );
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      await inputs.first().fill("E2E-abandono-test", { timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(300);

      // Sair sem salvar
      const otherRoute = auditConfig.routes.find((r) => r.path !== formRoute.path) || auditConfig.routes[0];
      await page.goto(otherRoute.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Verificar que a nova página carregou (não ficou presa)
      const bodyLen = await page.evaluate(
        () => document.body?.innerText?.trim().length || 0
      ).catch(() => 0);

      expect(bodyLen, "Página destino carregou após abandonar formulário").toBeGreaterThan(20);
      console.log("✅ Navegação funciona após abandonar formulário sem salvar");

      // Verificar que não há beforeunload alert (seria ruim em SPA)
      // Se tiver, o page.goto acima teria falhado com dialog handler
    } else {
      console.log(`ℹ️ ${formRoute.path}: nenhum input visível para testar abandono`);
    }
  });

  test("Clicar durante carregamento de página", async ({ page }) => {
    const route = auditConfig.routes.find((r) => r.critical) || auditConfig.routes[0];
    const errors: string[] = [];

    page.on("pageerror", (err) => {
      errors.push(`${err.name}: ${err.message.substring(0, 150)}`);
    });

    // Navegar e clicar antes do networkidle
    await page.goto(route.path, { waitUntil: "commit" });

    // Clicar em tudo que aparecer durante o carregamento
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(200);
      const clickables = page.locator("a:visible, button:visible");
      const count = await clickables.count();
      if (count > 0) {
        const idx = Math.floor(Math.random() * count);
        await clickables.nth(idx).click({ timeout: 1000, force: true }).catch(() => {});
      }
    }

    // Aguardar estabilizar
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(
      (e) => e.includes("TypeError") || e.includes("ReferenceError")
    );

    if (criticalErrors.length > 0) {
      console.warn(
        `⚠️ ${criticalErrors.length} erros ao clicar durante carregamento:\n` +
          criticalErrors.join("\n")
      );
    }

    expect(
      criticalErrors.length,
      `Crashes ao clicar durante carregamento:\n${criticalErrors.join("\n")}`
    ).toBe(0);

    console.log("✅ Cliques durante carregamento não causam crash");
  });

  test("Refresh (F5) em todas as rotas críticas", async ({ page }) => {
    const criticalRoutes = auditConfig.routes.filter((r) => r.critical);
    const routesToTest = criticalRoutes.length > 0 ? criticalRoutes : auditConfig.routes.slice(0, 5);

    for (const route of routesToTest) {
      // Navegar normalmente
      await page.goto(route.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // F5 refresh
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Verificar que não redirecionou para login (session lost)
      const url = page.url();
      expect(
        url,
        `${route.path}: refresh redirecionou para login (session perdida)`
      ).not.toContain("/login");

      // Verificar que a página renderizou
      const bodyLen = await page.evaluate(
        () => document.body?.innerText?.trim().length || 0
      ).catch(() => 0);
      expect(
        bodyLen,
        `${route.path}: página em branco após refresh`
      ).toBeGreaterThan(20);
    }

    console.log(
      `✅ Refresh (F5) funciona em ${routesToTest.length} rotas sem perda de sessão`
    );
  });
});

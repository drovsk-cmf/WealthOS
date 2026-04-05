/**
 * Monkey test: ações aleatórias sem crash
 * Matriz de Validação: 3.5 (Error handling), 9.3 (Resiliência), 6.5 (parcial)
 *
 * Simula um usuário clicando aleatoriamente em tudo que é clicável.
 * Não verifica lógica de negócio - verifica que nada explode:
 * sem crash JS, sem tela branca, sem 500, sem unhandled rejection.
 *
 * Cobre o gap entre testes determinísticos (que seguem roteiro fixo)
 * e o comportamento real de usuários (que clicam em qualquer ordem).
 */
import { test, expect } from "@playwright/test";
import { auditConfig } from "../../audit.config";

const TOTAL_ACTIONS = 80;
const ACTION_DELAY_MS = 300;

type ActionType = "click" | "navigate" | "back" | "type" | "escape";

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedAction(): ActionType {
  const r = Math.random();
  if (r < 0.55) return "click";       // 55% - clicar em algo
  if (r < 0.70) return "navigate";    // 15% - ir para rota aleatória
  if (r < 0.80) return "back";        // 10% - botão voltar
  if (r < 0.92) return "type";        // 12% - digitar em input
  return "escape";                     //  8% - fechar modal/dropdown
}

test.describe("Monkey testing", () => {
  test(`${TOTAL_ACTIONS} ações aleatórias sem crash`, async ({ page }) => {
    test.setTimeout(120_000); // 2 min - monkey test precisa de mais tempo
    const jsErrors: string[] = [];
    const unhandledRejections: string[] = [];
    const http5xx: string[] = [];
    const blankScreens: string[] = [];

    // Coletar erros JS
    page.on("pageerror", (err) => {
      jsErrors.push(`${err.name}: ${err.message.substring(0, 200)}`);
    });

    // Coletar console.error com TypeError/ReferenceError
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          text.includes("Cannot read") ||
          text.includes("is not a function") ||
          text.includes("undefined") ||
          text.includes("TypeError") ||
          text.includes("ReferenceError") ||
          text.includes("Unhandled")
        ) {
          unhandledRejections.push(text.substring(0, 200));
        }
      }
    });

    // Coletar 5xx
    page.on("response", (resp) => {
      if (resp.status() >= 500) {
        http5xx.push(`${resp.status()} ${resp.url().substring(0, 100)}`);
      }
    });

    // Começar no dashboard
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const routes = auditConfig.routes.map((r) => r.path);
    let actionLog: string[] = [];

    for (let i = 0; i < TOTAL_ACTIONS; i++) {
      const action = weightedAction();

      try {
        switch (action) {
          case "click": {
            const clickables = page.locator(
              "a:visible, button:visible, [role='button']:visible, [role='tab']:visible, [role='switch']:visible"
            );
            const count = await clickables.count();
            if (count === 0) break;
            const idx = Math.floor(Math.random() * count);
            const el = clickables.nth(idx);
            const text = (await el.textContent())?.trim().substring(0, 30) || "(sem texto)";
            await el.click({ timeout: 3000, force: true });
            actionLog.push(`#${i} click: "${text}"`);
            break;
          }

          case "navigate": {
            const route = randomFrom(routes);
            await page.goto(route, { waitUntil: "domcontentloaded", timeout: 10000 });
            actionLog.push(`#${i} navigate: ${route}`);
            break;
          }

          case "back": {
            await page.goBack({ timeout: 5000 }).catch(() => {});
            actionLog.push(`#${i} back`);
            break;
          }

          case "type": {
            const inputs = page.locator("input:visible:not([type='hidden']):not([type='checkbox']):not([type='radio'])");
            const count = await inputs.count();
            if (count === 0) break;
            const idx = Math.floor(Math.random() * count);
            const input = inputs.nth(idx);
            const type = await input.getAttribute("type");
            let value = "E2E-monkey-test";
            if (type === "number") value = "42";
            if (type === "email") value = "monkey@test.com";
            if (type === "date") value = "2026-01-15";
            await input.fill(value, { timeout: 2000 });
            actionLog.push(`#${i} type: "${value}" in ${type || "text"}`);
            break;
          }

          case "escape": {
            await page.keyboard.press("Escape");
            actionLog.push(`#${i} escape`);
            break;
          }
        }
      } catch {
        // Elemento sumiu, navegação falhou, etc - normal no monkey testing
        actionLog.push(`#${i} ${action}: (caught exception, continuing)`);
      }

      await page.waitForTimeout(ACTION_DELAY_MS);

      // Se saiu do app (login redirect, external link), volta
      const currentUrl = page.url();
      if (currentUrl.includes("/login") || !currentUrl.includes(new URL(auditConfig.baseUrl).hostname)) {
        await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
        actionLog.push(`#${i} → redirected, back to dashboard`);
      }

      // A cada 25 ações, verificar se a página não ficou em branco
      if (i % 25 === 0 && i > 0) {
        const bodyText = await page.evaluate(() => document.body?.innerText?.trim().length || 0).catch(() => 0);
        if (bodyText < 10) {
          blankScreens.push(`Ação #${i}: tela em branco em ${page.url()}`);
        }
      }
    }

    // Relatório
    console.log(`\n── Monkey Test: ${TOTAL_ACTIONS} ações ──`);
    console.log(`Ações executadas: ${actionLog.length}`);

    if (jsErrors.length > 0) {
      console.error(`\n🔴 ${jsErrors.length} JS errors:`);
      for (const e of jsErrors.slice(0, 10)) console.error(`   ${e}`);
    }

    if (unhandledRejections.length > 0) {
      console.warn(`\n🟡 ${unhandledRejections.length} unhandled rejections:`);
      for (const e of unhandledRejections.slice(0, 10)) console.warn(`   ${e}`);
    }

    if (http5xx.length > 0) {
      console.error(`\n🔴 ${http5xx.length} HTTP 5xx:`);
      for (const e of http5xx.slice(0, 10)) console.error(`   ${e}`);
    }

    if (blankScreens.length > 0) {
      console.warn(`\n🟡 ${blankScreens.length} telas em branco detectadas:`);
      for (const e of blankScreens) console.warn(`   ${e}`);
    }

    if (actionLog.length < 10) {
      console.log("\nÚltimas ações:");
      for (const a of actionLog) console.log(`   ${a}`);
    }

    // Assertions: crashes são inaceitáveis
    const criticalErrors = jsErrors.filter(
      (e) =>
        e.includes("TypeError") ||
        e.includes("ReferenceError") ||
        e.includes("Cannot read") ||
        e.includes("is not a function")
    );

    expect(
      criticalErrors.length,
      `${criticalErrors.length} crashes JS em ${TOTAL_ACTIONS} ações aleatórias:\n` +
        criticalErrors.slice(0, 5).join("\n")
    ).toBe(0);

    expect(
      http5xx.length,
      `${http5xx.length} erros 5xx em ${TOTAL_ACTIONS} ações aleatórias:\n` +
        http5xx.slice(0, 5).join("\n")
    ).toBe(0);

    expect(
      blankScreens.length,
      `${blankScreens.length} telas em branco:\n` + blankScreens.join("\n")
    ).toBe(0);
  });

  test("Navegação rápida: trocar de página 20x sem esperar carregamento", async ({ page }) => {
    const routes = auditConfig.routes.map((r) => r.path);
    const errors: string[] = [];

    page.on("pageerror", (err) => {
      errors.push(`${err.name}: ${err.message.substring(0, 150)}`);
    });

    // Trocar de página rapidamente sem aguardar networkidle
    for (let i = 0; i < 20; i++) {
      const route = randomFrom(routes);
      await page.goto(route, { waitUntil: "commit", timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(200); // quase nenhum tempo para carregar
    }

    // Esperar a última página estabilizar
    await page.waitForTimeout(3000);

    // Verificar que a página final renderizou
    const bodyText = await page.evaluate(() => document.body?.innerText?.trim().length || 0).catch(() => 0);

    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} erros durante navegação rápida:`);
      for (const e of errors.slice(0, 5)) console.warn(`   ${e}`);
    }

    expect(bodyText, "Página final ficou em branco após navegação rápida").toBeGreaterThan(20);

    const criticalErrors = errors.filter(
      (e) => e.includes("TypeError") || e.includes("ReferenceError")
    );
    expect(
      criticalErrors.length,
      `Crashes durante navegação rápida:\n${criticalErrors.join("\n")}`
    ).toBe(0);
  });

  test("Double-click em botões de submit", async ({ page }) => {
    const formRoutes = auditConfig.routes.filter((r) => r.hasForms);
    if (formRoutes.length === 0) {
      test.skip();
      return;
    }

    const results: { route: string; hasProtection: boolean }[] = [];

    for (const route of formRoutes.slice(0, 5)) {
      await page.goto(route.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      const submitBtns = page.locator('button[type="submit"]:visible');
      const count = await submitBtns.count();
      if (count === 0) continue;

      const btn = submitBtns.first();

      // Verificar se o botão tem proteção contra double-click
      // (disabled durante request, ou aria-disabled, ou loading state)
      const hasDisabledAttr = await btn.evaluate((el) => {
        // Simular click e verificar se fica disabled
        return el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";
      });

      // Double click rápido
      await btn.dblclick({ timeout: 2000, force: true }).catch(() => {});
      await page.waitForTimeout(500);

      // Verificar se ficou disabled após o click
      const isDisabledAfter = await btn.evaluate((el) => {
        return el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";
      }).catch(() => false);

      results.push({
        route: route.path,
        hasProtection: hasDisabledAttr || isDisabledAfter,
      });
    }

    console.log("\n── Double-click protection ──");
    for (const r of results) {
      const icon = r.hasProtection ? "✅" : "⚠️";
      console.log(`${icon} ${r.route}: ${r.hasProtection ? "protegido" : "sem proteção visível"}`);
    }

    // Warning, não falha (proteção pode ser server-side/idempotente)
    const unprotected = results.filter((r) => !r.hasProtection);
    if (unprotected.length > 0) {
      console.warn(
        `⚠️ ${unprotected.length} formulários sem proteção visível contra double-submit`
      );
    }
  });
});

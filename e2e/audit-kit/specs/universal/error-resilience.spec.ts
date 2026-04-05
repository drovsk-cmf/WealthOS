/**
 * Resiliência a erros
 * Matriz de Validação: 9.3 (Resiliência), 7.6 (UX formulários, parcial)
 *
 * Verifica: página 404 customizada, fallback em erro de rede,
 * preservação de dados em formulário após erro.
 */
import { test, expect } from "@playwright/test";
import { auditConfig } from "../../audit.config";

const notFoundPath =
  auditConfig.options?.notFoundTestPath || "/pagina-que-nao-existe-xyz-404";

test.describe("Resiliência a erros", () => {
  test("Página 404 customizada", async ({ page }) => {
    const response = await page.goto(notFoundPath, { waitUntil: "networkidle" });

    // Deve retornar 404 (não 200 com página genérica, nem 500)
    const status = response?.status();
    if (status === 404) {
      console.log("✅ Retorna HTTP 404 corretamente");
    } else {
      console.warn(
        `⚠️ Rota inexistente retorna HTTP ${status} ao invés de 404`
      );
    }

    // Deve ter conteúdo útil (não a página padrão do framework)
    const body = await page.evaluate(() => document.body.innerText);
    const hasCustomContent =
      body?.includes("encontr") ||
      body?.includes("exist") ||
      body?.includes("404") ||
      body?.includes("voltar") ||
      body?.includes("início");

    if (hasCustomContent) {
      console.log("✅ Página 404 tem conteúdo customizado");
    } else {
      console.warn("⚠️ Página 404 pode não ter conteúdo customizado");
    }

    // Deve ter link de volta
    const hasBackLink = await page.evaluate(() => {
      const links = document.querySelectorAll("a[href]");
      return Array.from(links).some((a) => {
        const href = a.getAttribute("href") || "";
        return href === "/" || href.includes("dashboard") || href.includes("home");
      });
    });

    if (hasBackLink) {
      console.log("✅ Página 404 tem link para voltar");
    } else {
      console.warn("⚠️ Página 404 sem link de retorno");
    }
  });

  test("Formulário preserva dados em erro de rede", async ({ page }) => {
    const resilience = auditConfig.options?.resilience;
    if (!resilience) {
      console.log(
        "ℹ️ Teste de resiliência de formulário desabilitado (configure options.resilience no audit.config.ts)"
      );
      test.skip();
      return;
    }

    await page.goto(resilience.formRoute, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // Preencher campo
    const field = page.locator(resilience.fieldSelector);
    await field.fill(resilience.testValue);

    // Simular falha de rede
    await page.route("**/*", (r) => {
      const url = r.request().url();
      if (url.includes("/rest/") || url.includes("/api/") || url.includes("supabase")) {
        r.abort("connectionrefused");
      } else {
        r.continue();
      }
    });

    // Tentar submeter (clicar no primeiro submit visível)
    const submitBtn = page.locator('button[type="submit"]:visible').first();
    if ((await submitBtn.count()) > 0) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }

    // Verificar que o valor digitado ainda está no campo
    const preservedValue = await field.inputValue();
    const preserved = preservedValue === resilience.testValue;

    if (preserved) {
      console.log("✅ Formulário preservou dados após erro de rede");
    } else {
      console.warn("⚠️ Formulário perdeu dados após erro de rede");
    }

    await page.unroute("**/*");

    expect(preserved, "Formulário preserva dados em erro de rede").toBe(true);
  });
});

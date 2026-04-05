/**
 * Security headers
 * Matriz de Validação: 4.6 (parcial), 9.1 (parcial)
 *
 * Verifica headers de segurança HTTP em rotas autenticadas.
 */
import { test, expect } from "@playwright/test";
import { auditConfig } from "../../audit.config";

const STANDARD_HEADERS = [
  { name: "x-frame-options", expected: ["DENY", "SAMEORIGIN"] },
  { name: "x-content-type-options", expected: ["nosniff"] },
  { name: "referrer-policy", expected: ["strict-origin-when-cross-origin", "no-referrer", "same-origin", "origin-when-cross-origin"] },
];

const OPTIONAL_HEADERS = [
  { name: "strict-transport-security", description: "HSTS" },
  { name: "content-security-policy", description: "CSP" },
  { name: "permissions-policy", description: "Permissions-Policy" },
  { name: "x-xss-protection", description: "XSS Protection (legado)" },
];

test.describe("Security headers", () => {
  test("Headers de segurança HTTP presentes", async ({ page }) => {
    const route = auditConfig.routes[0];
    if (!route) {
      test.skip();
      return;
    }

    const response = await page.goto(route.path, { waitUntil: "networkidle" });
    const headers = response?.headers() || {};

    console.log("\n── Security Headers ──");

    // Verificar headers obrigatórios
    const missing: string[] = [];
    for (const h of STANDARD_HEADERS) {
      const value = headers[h.name];
      if (!value) {
        missing.push(h.name);
        console.log(`🔴 ${h.name}: AUSENTE`);
      } else {
        const isValid = h.expected.some(
          (e) => value.toLowerCase().includes(e.toLowerCase())
        );
        if (isValid) {
          console.log(`✅ ${h.name}: ${value}`);
        } else {
          console.warn(`🟡 ${h.name}: ${value} (esperado: ${h.expected.join(" ou ")})`);
        }
      }
    }

    // Reportar headers opcionais
    for (const h of OPTIONAL_HEADERS) {
      const value = headers[h.name];
      if (value) {
        console.log(`✅ ${h.description}: presente`);
      } else {
        console.log(`ℹ️ ${h.description}: ausente (recomendado)`);
      }
    }

    // Verificar se usa HTTPS
    const url = page.url();
    if (url.startsWith("https://")) {
      console.log("✅ HTTPS ativo");
    } else if (!url.includes("localhost")) {
      console.warn("🔴 Conexão não-HTTPS em ambiente de produção");
    }

    const configuredHeaders = auditConfig.options?.expectedSecurityHeaders || STANDARD_HEADERS.map((h) => h.name);
    const requiredMissing = missing.filter((m) => configuredHeaders.includes(m));

    if (requiredMissing.length > 0) {
      console.warn(
        `\n⚠️ ${requiredMissing.length} headers de segurança ausentes: ${requiredMissing.join(", ")}`
      );
    }
  });
});

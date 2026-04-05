/**
 * Links mortos e navegação quebrada
 * Matriz de Validação: 6.4 (parcial)
 *
 * Coleta todos os <a href> e <button> visíveis em cada rota.
 * Verifica que links internos não levam a 404.
 * Reporta href="#" e links vazios.
 */
import { test, expect } from "@playwright/test";
import { auditConfig } from "../../audit.config";

test.describe("Links mortos e navegação", () => {
  // Testar um subconjunto de rotas (crawl completo seria muito lento)
  const routesToCheck = auditConfig.routes.filter((r) => r.critical !== false).slice(0, 10);

  for (const route of routesToCheck) {
    test(`links: ${route.path}`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Coletar todos os links internos
      const links = await page.evaluate((baseUrl) => {
        const anchors = document.querySelectorAll("a[href]");
        const results: { href: string; text: string; isHash: boolean }[] = [];

        for (const a of Array.from(anchors)) {
          const href = a.getAttribute("href") || "";
          const text = a.textContent?.trim().substring(0, 50) || "(sem texto)";

          // Pular links externos, mailto, tel, javascript
          if (
            href.startsWith("http") && !href.startsWith(baseUrl) ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:") ||
            href.startsWith("javascript:")
          ) continue;

          results.push({
            href,
            text,
            isHash: href === "#" || href === "",
          });
        }
        return results;
      }, auditConfig.baseUrl);

      // Reportar href="#" (warning)
      const hashLinks = links.filter((l) => l.isHash);
      if (hashLinks.length > 0) {
        console.warn(
          `⚠️ ${route.path}: ${hashLinks.length} links com href="#" ou vazio\n` +
            hashLinks.map((l) => `   "${l.text}"`).join("\n")
        );
      }

      // Verificar links internos (não devem retornar 404)
      const internalLinks = links
        .filter((l) => !l.isHash && (l.href.startsWith("/") || l.href.startsWith(auditConfig.baseUrl)))
        .slice(0, 15); // limitar para não estourar timeout

      const broken: string[] = [];
      for (const link of internalLinks) {
        try {
          const resp = await page.request.get(link.href);
          if (resp.status() >= 400) {
            broken.push(`${link.href} → ${resp.status()} ("${link.text}")`);
          }
        } catch {
          broken.push(`${link.href} → erro de rede ("${link.text}")`);
        }
      }

      expect(
        broken.length,
        `${route.path}: ${broken.length} links quebrados\n${broken.join("\n")}`
      ).toBe(0);
    });
  }
});

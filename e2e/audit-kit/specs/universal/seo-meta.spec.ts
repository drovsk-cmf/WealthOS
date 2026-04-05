/**
 * SEO e meta tags
 * Matriz de Validação: 2.6 (parcial)
 *
 * Verifica title, meta description, og:image, canonical em cada rota.
 */
import { test, expect } from "@playwright/test";
import { auditConfig } from "../../audit.config";

test.describe("SEO e meta tags", () => {
  for (const route of auditConfig.routes) {
    test(`seo: ${route.path}`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });

      const meta = await page.evaluate(() => {
        const title = document.title;
        const description =
          document.querySelector('meta[name="description"]')?.getAttribute("content") || null;
        const ogTitle =
          document.querySelector('meta[property="og:title"]')?.getAttribute("content") || null;
        const ogDescription =
          document.querySelector('meta[property="og:description"]')?.getAttribute("content") || null;
        const ogImage =
          document.querySelector('meta[property="og:image"]')?.getAttribute("content") || null;
        const canonical =
          document.querySelector('link[rel="canonical"]')?.getAttribute("href") || null;
        const robots =
          document.querySelector('meta[name="robots"]')?.getAttribute("content") || null;
        const charset =
          document.querySelector("meta[charset]")?.getAttribute("charset") || null;
        const viewport =
          document.querySelector('meta[name="viewport"]')?.getAttribute("content") || null;
        const lang = document.documentElement.lang || null;

        return {
          title,
          description,
          ogTitle,
          ogDescription,
          ogImage,
          canonical,
          robots,
          charset,
          viewport,
          lang,
        };
      });

      // 1. Title presente e não genérico
      expect(meta.title, `${route.path}: falta <title>`).toBeTruthy();
      expect(
        meta.title.length,
        `${route.path}: title muito curto (${meta.title.length} chars)`
      ).toBeGreaterThan(5);

      // 2. Charset
      if (!meta.charset) {
        console.warn(`⚠️ ${route.path}: falta meta charset`);
      }

      // 3. Viewport
      expect(
        meta.viewport,
        `${route.path}: falta meta viewport`
      ).toBeTruthy();

      // 4. Lang
      if (!meta.lang) {
        console.warn(`⚠️ ${route.path}: falta lang no <html>`);
      }

      // 5. Meta description (recomendado)
      if (!meta.description) {
        console.warn(`ℹ️ ${route.path}: sem meta description`);
      } else if (meta.description.length < 50) {
        console.warn(
          `⚠️ ${route.path}: meta description muito curta (${meta.description.length} chars)`
        );
      }

      // 6. Open Graph (recomendado para compartilhamento)
      const ogMissing: string[] = [];
      if (!meta.ogTitle) ogMissing.push("og:title");
      if (!meta.ogDescription) ogMissing.push("og:description");
      if (!meta.ogImage) ogMissing.push("og:image");

      if (ogMissing.length > 0) {
        console.log(
          `ℹ️ ${route.path}: Open Graph incompleto (falta: ${ogMissing.join(", ")})`
        );
      }

      // 7. Canonical (recomendado)
      if (!meta.canonical) {
        console.log(`ℹ️ ${route.path}: sem canonical link`);
      }
    });
  }
});

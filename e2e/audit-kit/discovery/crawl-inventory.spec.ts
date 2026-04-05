/**
 * Discovery: inventário de elementos interativos
 *
 * Roda primeiro, antes dos specs universais.
 * Navega todas as rotas e coleta inventário de:
 * - Formulários (inputs, selects, textareas)
 * - Botões destrutivos (excluir, remover, desativar)
 * - Modais e dialogs
 * - Toggles de estado
 * - Fluxos multi-step
 *
 * Gera: reports/inventory.json
 */
import { test } from "@playwright/test";
import { auditConfig } from "../audit.config";
import * as fs from "fs";
import * as path from "path";

interface RouteInventory {
  route: string;
  name: string;
  forms: {
    inputs: { type: string; name: string; placeholder: string; required: boolean }[];
    selects: { name: string; optionCount: number }[];
    textareas: { name: string; placeholder: string }[];
    submitButtons: { text: string }[];
  };
  destructiveButtons: { text: string; selector: string }[];
  modals: { triggerText: string; hasCloseButton: boolean }[];
  toggles: { label: string; selector: string }[];
  tables: { columnCount: number; rowCount: number }[];
  links: { text: string; href: string; isExternal: boolean }[];
}

test("Inventário de elementos interativos", async ({ page }) => {
  test.setTimeout(300_000); // 5 min para 35+ rotas
  const inventory: RouteInventory[] = [];

  for (const route of auditConfig.routes) {
    await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2000);

    const data = await page.evaluate((routeInfo) => {
      const result: Omit<RouteInventory, "route" | "name"> = {
        forms: { inputs: [], selects: [], textareas: [], submitButtons: [] },
        destructiveButtons: [],
        modals: [],
        toggles: [],
        tables: [],
        links: [],
      };

      // Inputs
      document.querySelectorAll("input:not([type=hidden])").forEach((el) => {
        const input = el as HTMLInputElement;
        result.forms.inputs.push({
          type: input.type || "text",
          name: input.name || input.id || "",
          placeholder: input.placeholder || "",
          required: input.required,
        });
      });

      // Selects
      document.querySelectorAll("select").forEach((el) => {
        const select = el as HTMLSelectElement;
        result.forms.selects.push({
          name: select.name || select.id || "",
          optionCount: select.options.length,
        });
      });

      // Textareas
      document.querySelectorAll("textarea").forEach((el) => {
        const ta = el as HTMLTextAreaElement;
        result.forms.textareas.push({
          name: ta.name || ta.id || "",
          placeholder: ta.placeholder || "",
        });
      });

      // Submit buttons
      document.querySelectorAll('button[type="submit"]').forEach((el) => {
        result.forms.submitButtons.push({
          text: el.textContent?.trim().substring(0, 50) || "",
        });
      });

      // Destructive buttons
      const destructivePatterns = /exclu|delet|remov|desativ|cancel|apag/i;
      document.querySelectorAll("button").forEach((el) => {
        const text = el.textContent?.trim() || "";
        if (destructivePatterns.test(text)) {
          result.destructiveButtons.push({
            text: text.substring(0, 50),
            selector: `button:has-text("${text.substring(0, 30)}")`,
          });
        }
      });

      // Toggles (switches, checkboxes with toggle role)
      document.querySelectorAll('[role="switch"], input[type="checkbox"]').forEach((el) => {
        const label =
          el.getAttribute("aria-label") ||
          (el as HTMLElement).closest("label")?.textContent?.trim() ||
          "";
        result.toggles.push({
          label: label.substring(0, 50),
          selector: `[role="switch"]:near(:text("${label.substring(0, 20)}"))`,
        });
      });

      // Tables
      document.querySelectorAll("table").forEach((el) => {
        const table = el as HTMLTableElement;
        result.tables.push({
          columnCount: table.rows[0]?.cells.length || 0,
          rowCount: table.rows.length,
        });
      });

      // Links
      document.querySelectorAll("a[href]").forEach((el) => {
        const a = el as HTMLAnchorElement;
        const href = a.getAttribute("href") || "";
        result.links.push({
          text: a.textContent?.trim().substring(0, 50) || "",
          href: href.substring(0, 100),
          isExternal: href.startsWith("http") && !href.includes(window.location.hostname),
        });
      });

      return result;
    }, route);

    inventory.push({
      route: route.path,
      name: route.name,
      ...data,
    });
  }

  // Gerar relatório
  const reportsDir = path.join(__dirname, "..", "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportsDir, "inventory.json"),
    JSON.stringify(inventory, null, 2)
  );

  // Sumário
  console.log("\n── Inventário de Discovery ──");
  let totalForms = 0;
  let totalDestructive = 0;
  let totalToggles = 0;

  for (const item of inventory) {
    const formCount =
      item.forms.inputs.length +
      item.forms.selects.length +
      item.forms.textareas.length;
    totalForms += formCount;
    totalDestructive += item.destructiveButtons.length;
    totalToggles += item.toggles.length;

    if (formCount > 0 || item.destructiveButtons.length > 0) {
      console.log(
        `${item.name} (${item.route}): ` +
          `${formCount} campos, ` +
          `${item.destructiveButtons.length} ações destrutivas, ` +
          `${item.toggles.length} toggles`
      );
    }
  }

  console.log(
    `\nTotal: ${totalForms} campos de formulário, ${totalDestructive} ações destrutivas, ${totalToggles} toggles`
  );
  console.log(`Inventário salvo em reports/inventory.json`);
});

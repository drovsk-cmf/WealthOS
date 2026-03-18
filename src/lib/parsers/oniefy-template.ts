/**
 * Oniefy Import Template
 *
 * Generates and detects the standard Oniefy import template.
 * When detected, the import wizard skips manual column mapping.
 */

import * as XLSX from "xlsx";
import type { CSVTransaction } from "./csv-parser";

// ─── Template constants ──────────────────────────────────────

export const ONIEFY_TEMPLATE_HEADERS = [
  "Data",
  "Tipo",
  "Valor",
  "Descrição",
  "Categoria",
  "Notas",
  "Tags",
] as const;

const ONIEFY_CARD_TEMPLATE_HEADERS = [
  "Data",
  "Descrição Original",
  "Descrição Personalizada",
  "Valor",
  "Parcela",
  "Categoria",
] as const;

// Minimum headers to detect (first 4 are required)
const REQUIRED_HEADERS = ["Data", "Tipo", "Valor", "Descrição"];
const REQUIRED_CARD_HEADERS = ["Data", "Descrição Original", "Valor"];

// ─── Template detection ──────────────────────────────────────

/**
 * Checks if headers match the standard Oniefy template.
 * Returns "standard" | "card" | null.
 */
export function detectOniefyTemplate(
  headers: string[]
): "standard" | "card" | null {
  const normalized = headers.map((h) =>
    h.trim().normalize("NFC").toLowerCase()
  );

  const matchesStandard = REQUIRED_HEADERS.every((rh) =>
    normalized.includes(rh.normalize("NFC").toLowerCase())
  );
  if (matchesStandard) return "standard";

  const matchesCard = REQUIRED_CARD_HEADERS.every((rh) =>
    normalized.includes(rh.normalize("NFC").toLowerCase())
  );
  if (matchesCard) return "card";

  return null;
}

// ─── Template parser (no mapping needed) ─────────────────────

function findColumn(headers: string[], target: string): number {
  const norm = target.normalize("NFC").toLowerCase();
  return headers.findIndex(
    (h) => h.trim().normalize("NFC").toLowerCase() === norm
  );
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Try YYYY-MM-DD
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return raw.slice(0, 10);
  return null;
}

/**
 * Parse rows from a standard Oniefy template.
 * Returns transactions + errors.
 */
export function parseStandardTemplate(
  headers: string[],
  rows: string[][]
): { transactions: CSVTransaction[]; errors: string[] } {
  const iDate = findColumn(headers, "Data");
  const iType = findColumn(headers, "Tipo");
  const iAmount = findColumn(headers, "Valor");
  const iDesc = findColumn(headers, "Descrição");

  if (iDate < 0 || iAmount < 0 || iDesc < 0) {
    return {
      transactions: [],
      errors: ["Colunas obrigatórias não encontradas (Data, Valor, Descrição)."],
    };
  }

  const transactions: CSVTransaction[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawDate = row[iDate] || "";
    const rawType = (row[iType] || "").trim().toLowerCase();
    const rawAmount = (row[iAmount] || "").replace(/[R$\s.]/g, "").replace(",", ".");
    const desc = (row[iDesc] || "").trim();

    if (!rawDate && !desc) continue; // empty row

    const date = parseDate(rawDate);
    if (!date) {
      errors.push(`Linha ${i + 2}: Data inválida "${rawDate}".`);
      continue;
    }

    const amount = Math.abs(parseFloat(rawAmount));
    if (isNaN(amount) || amount === 0) {
      errors.push(`Linha ${i + 2}: Valor inválido "${row[iAmount]}".`);
      continue;
    }

    let type: "income" | "expense" = "expense";
    if (iType >= 0 && rawType) {
      if (rawType.startsWith("receita") || rawType.startsWith("income") || rawType === "r") {
        type = "income";
      }
    } else {
      // Infer: negative = expense, positive = income
      const signedAmount = parseFloat(rawAmount);
      if (!isNaN(signedAmount) && signedAmount > 0) type = "income";
    }

    transactions.push({
      externalId: `oniefy-tpl-${i}`,
      date,
      amount,
      description: desc,
      type,
    });
  }

  return { transactions, errors };
}

/**
 * Parse rows from a card (fatura) Oniefy template.
 * All transactions are expenses. Description = custom || original.
 */
export function parseCardTemplate(
  headers: string[],
  rows: string[][]
): { transactions: CSVTransaction[]; errors: string[] } {
  const iDate = findColumn(headers, "Data");
  const iOriginal = findColumn(headers, "Descrição Original");
  const iCustom = findColumn(headers, "Descrição Personalizada");
  const iAmount = findColumn(headers, "Valor");

  if (iDate < 0 || iAmount < 0 || iOriginal < 0) {
    return {
      transactions: [],
      errors: ["Colunas obrigatórias não encontradas (Data, Descrição Original, Valor)."],
    };
  }

  const transactions: CSVTransaction[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawDate = row[iDate] || "";
    const original = (row[iOriginal] || "").trim();
    const custom = iCustom >= 0 ? (row[iCustom] || "").trim() : "";
    const rawAmount = (row[iAmount] || "").replace(/[R$\s.]/g, "").replace(",", ".");

    if (!rawDate && !original) continue;

    const date = parseDate(rawDate);
    if (!date) {
      errors.push(`Linha ${i + 2}: Data inválida "${rawDate}".`);
      continue;
    }

    const amount = Math.abs(parseFloat(rawAmount));
    if (isNaN(amount) || amount === 0) {
      errors.push(`Linha ${i + 2}: Valor inválido "${row[iAmount]}".`);
      continue;
    }

    transactions.push({
      externalId: `oniefy-card-${i}`,
      date,
      amount,
      description: custom || original,
      type: "expense",
    });
  }

  return { transactions, errors };
}

// ─── Template generator (client-side download) ───────────────

export function downloadImportTemplate(variant: "standard" | "card" = "standard") {
  const wb = XLSX.utils.book_new();

  if (variant === "standard") {
    // Sheet 1: Transações (with example rows)
    const wsData = [
      [...ONIEFY_TEMPLATE_HEADERS],
      ["15/03/2026", "Despesa", "150,00", "Supermercado Pão de Açúcar", "Alimentação", "Compras semanais", "mercado"],
      ["15/03/2026", "Receita", "8.500,00", "Salário março", "Salário", "", ""],
      ["16/03/2026", "Despesa", "45,90", "Uber para escritório", "Transporte", "", "uber"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [
      { wch: 12 }, // Data
      { wch: 10 }, // Tipo
      { wch: 14 }, // Valor
      { wch: 35 }, // Descrição
      { wch: 18 }, // Categoria
      { wch: 25 }, // Notas
      { wch: 20 }, // Tags
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Transações");

    // Sheet 2: Instruções
    const instrData = [
      ["Instruções de preenchimento"],
      [""],
      ["Coluna", "Obrigatória", "Formato", "Exemplo"],
      ["Data", "Sim", "DD/MM/AAAA", "15/03/2026"],
      ["Tipo", "Sim", "Receita ou Despesa", "Despesa"],
      ["Valor", "Sim", "Numérico positivo (R$ opcional)", "150,00 ou R$ 150,00"],
      ["Descrição", "Sim", "Texto livre", "Supermercado Pão de Açúcar"],
      ["Categoria", "Não", "Texto (usa categorias existentes ou cria)", "Alimentação"],
      ["Notas", "Não", "Texto livre", "Compras semanais"],
      ["Tags", "Não", "Separadas por vírgula", "mercado, compras"],
      [""],
      ["Dicas:"],
      ["- Apague as linhas de exemplo antes de preencher."],
      ["- O sistema detecta automaticamente que este é o template Oniefy."],
      ["- A coluna Tipo aceita: Receita, Despesa, R, D, Income, Expense."],
      ["- Se Tipo estiver vazio, valores positivos = Receita, negativos = Despesa."],
      ["- Valores podem usar ponto como milhar e vírgula como decimal: 1.500,00"],
    ];
    const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
    wsInstr["!cols"] = [{ wch: 35 }, { wch: 14 }, { wch: 35 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsInstr, "Instruções");
  } else {
    // Card variant
    const wsData = [
      [...ONIEFY_CARD_TEMPLATE_HEADERS],
      ["10/03/2026", "RAPPI*RAPPIBANK", "iFood/Rappi", "45,90", "1/1", "Alimentação"],
      ["12/03/2026", "NETFLIX.COM", "Netflix", "55,90", "1/1", "Lazer"],
      ["15/03/2026", "PAG*CASASBAHIA", "Geladeira Casas Bahia", "350,00", "3/10", "Casa"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [
      { wch: 12 }, // Data
      { wch: 30 }, // Descrição Original
      { wch: 30 }, // Descrição Personalizada
      { wch: 14 }, // Valor
      { wch: 8 },  // Parcela
      { wch: 18 }, // Categoria
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Fatura");

    const instrData = [
      ["Instruções - Template Fatura de Cartão"],
      [""],
      ["Coluna", "Obrigatória", "Formato", "Exemplo"],
      ["Data", "Sim", "DD/MM/AAAA", "10/03/2026"],
      ["Descrição Original", "Sim", "Exatamente como está na fatura", "RAPPI*RAPPIBANK"],
      ["Descrição Personalizada", "Não", "Sua descrição para identificar", "iFood/Rappi"],
      ["Valor", "Sim", "Numérico positivo", "45,90"],
      ["Parcela", "Não", "Formato X/Y", "3/10"],
      ["Categoria", "Não", "Texto (usa categorias existentes)", "Alimentação"],
      [""],
      ["Dicas:"],
      ["- Todas as transações de fatura são tratadas como Despesa."],
      ["- A Descrição Personalizada facilita a identificação futura."],
      ["- Nas próximas faturas, o sistema aplica automaticamente sua descrição."],
      ["- Se a Descrição Personalizada estiver vazia, usa a Original."],
    ];
    const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
    wsInstr["!cols"] = [{ wch: 35 }, { wch: 14 }, { wch: 40 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsInstr, "Instruções");
  }

  const fileName =
    variant === "standard"
      ? "oniefy-template-importacao.xlsx"
      : "oniefy-template-fatura-cartao.xlsx";

  XLSX.writeFile(wb, fileName);
}

/**
 * Oniefy - CSV Parser
 *
 * Parses CSV/TSV bank statements with column mapping.
 * Uses PapaParse for robust CSV parsing (handles quoted fields,
 * various encodings, auto-detect separator).
 */

import Papa from "papaparse";

export interface CSVColumnMapping {
  date: number; // column index
  amount: number;
  description: number;
  type?: number; // optional: income/expense indicator
}

export interface CSVTransaction {
  externalId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  type: "income" | "expense";
}

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  suggestedMapping: CSVColumnMapping | null;
  transactions: CSVTransaction[];
  errors: string[];
}

// Common date formats from Brazilian banks
function parseFlexibleDate(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // DD/MM/YYYY
  const brMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2].padStart(2, "0")}-${brMatch[1].padStart(2, "0")}`;
  }

  // YYYY-MM-DD (ISO)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;

  // DD/MM/YY
  const shortMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})$/);
  if (shortMatch) {
    const year = parseInt(shortMatch[3]) > 50 ? `19${shortMatch[3]}` : `20${shortMatch[3]}`;
    return `${year}-${shortMatch[2].padStart(2, "0")}-${shortMatch[1].padStart(2, "0")}`;
  }

  return null;
}

function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let cleaned = raw.trim();

  // Remove currency symbols
  cleaned = cleaned.replace(/[R$\s]/g, "");

  // Brazilian format: 1.234,56 → 1234.56
  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      // 1.234,56 → Brazilian
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    }
    // else: 1,234.56 → US format, already ok
  } else if (cleaned.includes(",")) {
    // Could be 1234,56 (BR decimal) or 1,234 (US thousands)
    const parts = cleaned.split(",");
    if (parts[1] && parts[1].length <= 2) {
      cleaned = cleaned.replace(",", ".");
    } else {
      cleaned = cleaned.replace(",", "");
    }
  }

  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function detectDateColumn(headers: string[], sampleRow: string[]): number {
  const dateKeywords = ["data", "date", "dt", "movimento", "lançamento", "lancamento"];
  for (let i = 0; i < headers.length; i++) {
    if (dateKeywords.some((k) => headers[i].toLowerCase().includes(k))) return i;
  }
  // Try parsing first 3 columns as dates
  for (let i = 0; i < Math.min(3, sampleRow.length); i++) {
    if (parseFlexibleDate(sampleRow[i])) return i;
  }
  return 0;
}

function detectAmountColumn(headers: string[], sampleRow: string[]): number {
  const amountKeywords = ["valor", "amount", "value", "quantia", "total"];
  for (let i = 0; i < headers.length; i++) {
    if (amountKeywords.some((k) => headers[i].toLowerCase().includes(k))) return i;
  }
  // Look for numeric columns
  for (let i = sampleRow.length - 1; i >= 0; i--) {
    if (parseAmount(sampleRow[i]) !== null && !parseFlexibleDate(sampleRow[i])) return i;
  }
  return Math.min(1, sampleRow.length - 1);
}

function detectDescriptionColumn(headers: string[], dateCol: number, amountCol: number): number {
  const descKeywords = ["descri", "histórico", "historico", "memo", "detail", "observ"];
  for (let i = 0; i < headers.length; i++) {
    if (i !== dateCol && i !== amountCol && descKeywords.some((k) => headers[i].toLowerCase().includes(k))) return i;
  }
  // First column that isn't date or amount
  for (let i = 0; i < headers.length; i++) {
    if (i !== dateCol && i !== amountCol) return i;
  }
  return 0;
}

/** Parse raw CSV text into headers + rows using PapaParse */
export function parseCSVRaw(text: string): { headers: string[]; rows: string[][] } {
  const result = Papa.parse<string[]>(text.trim(), {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.data.length < 2) return { headers: [], rows: [] };

  const headers = result.data[0].map((h) => h?.trim() ?? "");
  const rows = result.data.slice(1).map((row) => row.map((cell) => cell?.trim() ?? ""));

  return { headers, rows };
}

/** Suggest column mapping based on headers and sample data */
export function suggestMapping(headers: string[], sampleRow: string[]): CSVColumnMapping | null {
  if (headers.length < 2 || !sampleRow.length) return null;

  const date = detectDateColumn(headers, sampleRow);
  const amount = detectAmountColumn(headers, sampleRow);
  const description = detectDescriptionColumn(headers, date, amount);

  return { date, amount, description };
}

/** Convert parsed rows to transactions using column mapping */
export function mapToTransactions(
  rows: string[][],
  mapping: CSVColumnMapping
): { transactions: CSVTransaction[]; errors: string[] } {
  const transactions: CSVTransaction[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawDate = row[mapping.date] ?? "";
    const rawAmount = row[mapping.amount] ?? "";
    const rawDesc = row[mapping.description] ?? "";

    const date = parseFlexibleDate(rawDate);
    if (!date) {
      errors.push(`Linha ${i + 2}: data inválida "${rawDate}"`);
      continue;
    }

    const amount = parseAmount(rawAmount);
    if (amount === null) {
      errors.push(`Linha ${i + 2}: valor inválido "${rawAmount}"`);
      continue;
    }

    const description = rawDesc || "Sem descrição";
    const type = amount >= 0 ? "income" : "expense";
    const absAmount = Math.abs(amount);
    const externalId = `csv_${date}_${absAmount.toFixed(2)}_${i}`;

    transactions.push({ externalId, date, amount: absAmount, description, type });
  }

  return { transactions, errors };
}

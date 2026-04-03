/**
 * Oniefy - Bank Statement Auto-Detection (E19)
 *
 * Auto-detects which bank produced a CSV/OFX file and provides
 * pre-configured column mappings. Eliminates manual mapping for
 * known banks.
 *
 * Supported banks:
 * - Nubank (CSV, fatura + extrato)
 * - BTG Pactual (CSV)
 * - XP Investimentos (CSV)
 * - Mercado Pago (CSV)
 * - Itaú (CSV, OFX)
 * - Inter (CSV)
 * - C6 Bank (CSV)
 * - Porto Bank / Bradescard (CSV)
 *
 * Ref: docs/IMPORT-ENGINE-SPEC.md
 */

import type { CSVColumnMapping } from "./csv-parser";

export interface BankDetection {
  bankId: string;
  bankName: string;
  confidence: number; // 0-1
  fileType: "extrato" | "fatura" | "unknown";
  mapping: CSVColumnMapping;
  /** Whether amount column uses negative for expenses (true) or separate type column */
  signedAmounts: boolean;
  /** Date format in the CSV (for parsing) */
  dateFormat: string;
  /** Decimal separator */
  decimalSeparator: "," | ".";
  /** Header rows to skip */
  skipRows: number;
}

interface BankPattern {
  bankId: string;
  bankName: string;
  /** Header patterns to match (case-insensitive). If all match, bank is detected. */
  headerPatterns: string[][];
  /** Content patterns to check in first few rows */
  contentPatterns?: RegExp[];
  fileType: "extrato" | "fatura" | "unknown";
  mapping: CSVColumnMapping;
  signedAmounts: boolean;
  dateFormat: string;
  decimalSeparator: "," | ".";
  skipRows: number;
}

const BANK_PATTERNS: BankPattern[] = [
  // ── Nubank Fatura ──
  {
    bankId: "nubank_fatura",
    bankName: "Nubank",
    headerPatterns: [
      ["date", "title", "amount"], // English headers
      ["data", "título", "valor"], // Portuguese
    ],
    fileType: "fatura",
    mapping: { date: 0, description: 1, amount: 2 },
    signedAmounts: false, // all positive (expenses on card)
    dateFormat: "YYYY-MM-DD",
    decimalSeparator: ".",
    skipRows: 0,
  },
  // ── Nubank Extrato ──
  {
    bankId: "nubank_extrato",
    bankName: "Nubank",
    headerPatterns: [
      ["data", "valor", "identificador", "descrição"],
      ["data", "valor", "descricao"],
    ],
    fileType: "extrato",
    mapping: { date: 0, amount: 1, description: 3 },
    signedAmounts: true,
    dateFormat: "DD/MM/YYYY",
    decimalSeparator: ",",
    skipRows: 0,
  },
  // ── BTG Pactual ──
  {
    bankId: "btg",
    bankName: "BTG Pactual",
    headerPatterns: [
      ["data", "historico", "valor"],
      ["data", "descrição", "valor", "saldo"],
    ],
    fileType: "extrato",
    mapping: { date: 0, description: 1, amount: 2 },
    signedAmounts: true,
    dateFormat: "DD/MM/YYYY",
    decimalSeparator: ",",
    skipRows: 0,
  },
  // ── XP Investimentos ──
  {
    bankId: "xp",
    bankName: "XP Investimentos",
    headerPatterns: [
      ["data", "movimentação", "valor"],
      ["data", "movimentacao", "valor"],
    ],
    fileType: "extrato",
    mapping: { date: 0, description: 1, amount: 2 },
    signedAmounts: true,
    dateFormat: "DD/MM/YYYY",
    decimalSeparator: ",",
    skipRows: 0,
  },
  // ── Mercado Pago ──
  {
    bankId: "mercadopago",
    bankName: "Mercado Pago",
    headerPatterns: [
      ["data", "descrição", "valor", "moeda"],
      ["date", "description", "amount", "currency"],
    ],
    contentPatterns: [/mercado\s*pago/i, /MP\s/i],
    fileType: "extrato",
    mapping: { date: 0, description: 1, amount: 2 },
    signedAmounts: true,
    dateFormat: "DD/MM/YYYY",
    decimalSeparator: ",",
    skipRows: 0,
  },
  // ── Itaú ──
  {
    bankId: "itau",
    bankName: "Itaú",
    headerPatterns: [
      ["data", "lançamento", "valor"],
      ["data", "lancamento", "valor"],
      ["data", "histórico", "valor"],
    ],
    fileType: "extrato",
    mapping: { date: 0, description: 1, amount: 2 },
    signedAmounts: true,
    dateFormat: "DD/MM/YYYY",
    decimalSeparator: ",",
    skipRows: 0,
  },
  // ── Inter ──
  {
    bankId: "inter",
    bankName: "Banco Inter",
    headerPatterns: [
      ["data lançamento", "histórico", "descrição", "valor", "saldo"],
      ["data lancamento", "historico", "descricao", "valor", "saldo"],
    ],
    fileType: "extrato",
    mapping: { date: 0, description: 2, amount: 3 },
    signedAmounts: true,
    dateFormat: "DD/MM/YYYY",
    decimalSeparator: ",",
    skipRows: 0,
  },
  // ── C6 Bank ──
  {
    bankId: "c6",
    bankName: "C6 Bank",
    headerPatterns: [
      ["data da compra", "estabelecimento", "valor"],
      ["data", "estabelecimento", "valor", "parcela"],
    ],
    fileType: "fatura",
    mapping: { date: 0, description: 1, amount: 2 },
    signedAmounts: false,
    dateFormat: "DD/MM/YYYY",
    decimalSeparator: ",",
    skipRows: 0,
  },
  // ── Porto Bank / Bradescard ──
  {
    bankId: "porto_bradescard",
    bankName: "Porto Bank",
    headerPatterns: [
      ["data", "descrição", "valor", "parcela"],
      ["data", "descricao", "valor"],
    ],
    contentPatterns: [/porto/i, /bradescard/i],
    fileType: "fatura",
    mapping: { date: 0, description: 1, amount: 2 },
    signedAmounts: false,
    dateFormat: "DD/MM/YYYY",
    decimalSeparator: ",",
    skipRows: 0,
  },
];

/**
 * Detect which bank produced the CSV file.
 *
 * @param headers - Parsed CSV headers (first row)
 * @param sampleRows - First 3-5 rows of data for content matching
 * @returns Best match, or null if no bank detected
 */
export function detectBank(
  headers: string[],
  sampleRows: string[][] = []
): BankDetection | null {
  const normalizedHeaders = headers.map((h) =>
    h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  );

  let bestMatch: { pattern: BankPattern; confidence: number } | null = null;

  for (const pattern of BANK_PATTERNS) {
    for (const headerSet of pattern.headerPatterns) {
      const normalizedSet = headerSet.map((h) =>
        h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
      );

      // Count how many expected headers are found (exact vs substring)
      let exactMatched = 0;
      let substringMatched = 0;
      for (const expected of normalizedSet) {
        if (normalizedHeaders.some((h) => h === expected)) {
          exactMatched++;
        } else if (normalizedHeaders.some((h) => h.includes(expected) || expected.includes(h))) {
          substringMatched++;
        }
      }

      const headerConfidence = normalizedSet.length > 0
        ? (exactMatched * 1.0 + substringMatched * 0.7) / normalizedSet.length
        : 0;

      if (headerConfidence < 0.6) continue;

      // Specificity bonus: patterns matching more headers are more specific
      const specificityBonus = normalizedSet.length >= 4 ? 0.05 : 0;

      // Content pattern bonus
      let contentBonus = 0;
      if (pattern.contentPatterns && sampleRows.length > 0) {
        const allContent = sampleRows.flat().join(" ");
        const contentMatches = pattern.contentPatterns.filter((p) => p.test(allContent)).length;
        contentBonus = contentMatches > 0 ? 0.1 : 0;
      }

      const totalConfidence = Math.min(headerConfidence + contentBonus + specificityBonus, 1);

      if (!bestMatch || totalConfidence > bestMatch.confidence) {
        bestMatch = { pattern, confidence: totalConfidence };
      }
    }
  }

  if (!bestMatch || bestMatch.confidence < 0.6) return null;

  const p = bestMatch.pattern;
  return {
    bankId: p.bankId,
    bankName: p.bankName,
    confidence: round2(bestMatch.confidence),
    fileType: p.fileType,
    mapping: p.mapping,
    signedAmounts: p.signedAmounts,
    dateFormat: p.dateFormat,
    decimalSeparator: p.decimalSeparator,
    skipRows: p.skipRows,
  };
}

/**
 * Get all supported bank names.
 */
export function getSupportedBanks(): { bankId: string; bankName: string; fileType: string }[] {
  const seen = new Set<string>();
  return BANK_PATTERNS.filter((p) => {
    const key = `${p.bankId}-${p.fileType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((p) => ({
    bankId: p.bankId,
    bankName: p.bankName,
    fileType: p.fileType,
  }));
}

/**
 * Parse a BR date string (DD/MM/YYYY) to ISO (YYYY-MM-DD).
 */
export function parseBRDate(dateStr: string): string {
  const parts = dateStr.trim().split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) return dateStr.trim();
  return dateStr;
}

/**
 * Parse a BR currency string ("1.234,56" or "-1.234,56") to number.
 */
export function parseBRCurrency(value: string): number {
  const cleaned = value
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

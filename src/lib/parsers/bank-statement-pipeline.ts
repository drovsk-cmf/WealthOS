/**
 * Oniefy - Bank Statement Pipeline (E68)
 *
 * Orchestrates the full import flow per bank:
 * 1. Auto-detect bank (bank-detection.ts)
 * 2. Parse with generic parser (csv-parser, ofx-parser, xlsx-parser)
 * 3. Normalize per bank (signed amounts, type column, date format)
 * 4. Extract installment info (installment-engine.ts)
 * 5. Return uniform ImportedTransaction[]
 *
 * Bank-specific behavior lives in BANK_NORMALIZERS, not in separate files.
 *
 * Ref: docs/IMPORT-ENGINE-SPEC.md §4
 */

import { parseInstallmentInfo, type InstallmentInfo } from "@/lib/services/installment-engine";
import { parseBRDate, parseBRCurrency, type BankDetection } from "./bank-detection";

// ── Tipos ──

export interface ImportedTransaction {
  /** SHA-256 hash or bank-provided ID */
  externalId: string;
  date: string; // YYYY-MM-DD
  amount: number; // positive
  type: "income" | "expense";
  description: string;
  /** Original raw description before cleanup */
  originalDescription: string;
  /** Installment info if detected */
  installment: InstallmentInfo | null;
  /** Source bank ID */
  bankId: string;
  /** Source file type */
  fileType: "extrato" | "fatura" | "unknown";
}

export interface ParseResult {
  transactions: ImportedTransaction[];
  bankId: string;
  bankName: string;
  fileType: "extrato" | "fatura" | "unknown";
  /** Warnings during parsing */
  warnings: string[];
  /** Total installment debt found in header (Mercado Pago, Itaú, Porto, Bradescard) */
  installmentDebtTotal?: number;
}

// ── Normalizadores por banco ──

interface BankNormalizer {
  /**
   * Given a parsed row (array of cell values) and the column mapping,
   * return a normalized transaction. Returns null to skip the row.
   */
  normalizeRow(
    row: string[],
    detection: BankDetection,
    rowIndex: number
  ): Omit<ImportedTransaction, "externalId"> | null;

  /**
   * Optional: extract metadata from header/summary rows (e.g. total parcelado).
   */
  extractMetadata?(allRows: string[][]): { installmentDebtTotal?: number };
}

/**
 * Default normalizer works for most banks via BankDetection mapping.
 */
function defaultNormalize(
  row: string[],
  det: BankDetection
): Omit<ImportedTransaction, "externalId"> | null {
  const { mapping, signedAmounts, dateFormat, decimalSeparator, bankId, fileType } = det;

  const rawDate = row[mapping.date]?.trim();
  const rawAmount = row[mapping.amount]?.trim();
  const rawDescription = row[mapping.description]?.trim();

  if (!rawDate || !rawAmount || !rawDescription) return null;

  // Parse date
  const date = dateFormat === "DD/MM/YYYY" ? parseBRDate(rawDate) : rawDate;
  if (!date || date.length < 8) return null;

  // Parse amount
  const parsedAmount = decimalSeparator === ","
    ? parseBRCurrency(rawAmount)
    : parseFloat(rawAmount.replace(/[^0-9.\-]/g, "")) || 0;

  if (parsedAmount === 0) return null;

  // Determine type + absolute amount
  let type: "income" | "expense";
  let amount: number;

  if (signedAmounts) {
    // Extrato: negative = expense, positive = income
    type = parsedAmount < 0 ? "expense" : "income";
    amount = Math.abs(parsedAmount);
  } else {
    // Fatura de cartão: all entries are expenses (positive values)
    type = "expense";
    amount = Math.abs(parsedAmount);
  }

  // Type column override (BTG: "Parcela sem juros", "Compra à vista", "Crédito", etc.)
  const typeCol = mapping.type !== undefined ? row[mapping.type]?.trim() : undefined;

  // Extract installment info (E67 integration)
  // Check for "Parcela" column (C6, Porto Bradescard have it at index 3)
  const installmentCol = (bankId === "c6" || bankId === "porto_bradescard") && row[3]
    ? row[3].trim()
    : undefined;

  const installment = parseInstallmentInfo(rawDescription, typeCol, installmentCol);
  const description = installment.matchMethod !== "none"
    ? installment.cleanDescription
    : rawDescription;

  return {
    date,
    amount: Math.round(amount * 100) / 100,
    type,
    description,
    originalDescription: rawDescription,
    installment: installment.matchMethod !== "none" ? installment : null,
    bankId,
    fileType,
  };
}

// ── Bank-specific normalizers ──

const BANK_NORMALIZERS: Record<string, BankNormalizer> = {
  nubank_fatura: {
    normalizeRow(row, det) {
      const base = defaultNormalize(row, det);
      if (!base) return null;
      // Nubank fatura uses category column (index 1 in some exports)
      // All amounts are expenses (card bill)
      base.type = "expense";
      return base;
    },
  },

  nubank_extrato: {
    normalizeRow(row, det) {
      return defaultNormalize(row, det);
    },
  },

  btg: {
    normalizeRow(row, det) {
      const base = defaultNormalize(row, det);
      if (!base) return null;

      // BTG has "Tipo" column that indicates installment
      // Also: "Crédito em conta" = income, "Débito" = expense
      const tipo = row[det.mapping.type ?? -1]?.toLowerCase() ?? "";
      if (tipo.includes("crédito") || tipo.includes("credito")) {
        base.type = "income";
      }

      return base;
    },
  },

  xp: {
    normalizeRow(row, det) {
      const base = defaultNormalize(row, det);
      if (!base) return null;

      // XP has dedicated "Parcela" column (typically index 3)
      // Re-parse installment with column info
      if (row[3]?.trim()) {
        const inst = parseInstallmentInfo(
          base.originalDescription,
          undefined,
          row[3].trim()
        );
        if (inst.matchMethod === "column") {
          base.installment = inst;
          base.description = inst.cleanDescription;
        }
      }

      return base;
    },
  },
};

// ── Pipeline principal ──

/**
 * Parse a CSV bank statement using auto-detected bank settings.
 *
 * @param rows - Parsed CSV rows (including header as first row)
 * @param detection - Result from detectBank()
 * @returns Normalized transactions ready for import
 */
export function parseBankStatement(
  rows: string[][],
  detection: BankDetection
): ParseResult {
  const warnings: string[] = [];
  const transactions: ImportedTransaction[] = [];

  // Skip header + any extra rows
  const dataRows = rows.slice(1 + detection.skipRows);

  // Get bank-specific normalizer or default
  const normalizer = BANK_NORMALIZERS[detection.bankId];

  let rowIndex = 0;
  for (const row of dataRows) {
    rowIndex++;

    // Skip empty rows
    if (row.every((cell) => !cell?.trim())) continue;

    try {
      const normalized = normalizer
        ? normalizer.normalizeRow(row, detection, rowIndex)
        : defaultNormalize(row, detection);

      if (!normalized) continue;

      // Generate external ID (hash of date+amount+description)
      const externalId = generateExternalId(
        normalized.date,
        normalized.amount,
        normalized.originalDescription,
        detection.bankId
      );

      transactions.push({
        ...normalized,
        externalId,
      });
    } catch (err) {
      warnings.push(`Linha ${rowIndex}: erro ao processar (${(err as Error).message})`);
    }
  }

  // Extract metadata (installment debt total from header)
  let installmentDebtTotal: number | undefined;
  if (normalizer?.extractMetadata) {
    const meta = normalizer.extractMetadata(rows);
    installmentDebtTotal = meta.installmentDebtTotal;
  }

  return {
    transactions,
    bankId: detection.bankId,
    bankName: detection.bankName,
    fileType: detection.fileType,
    warnings,
    installmentDebtTotal,
  };
}

/**
 * Generate a deterministic external ID for deduplication.
 * Uses a simple hash of date+amount+description+bank.
 */
function generateExternalId(
  date: string,
  amount: number,
  description: string,
  bankId: string
): string {
  // Simple hash for Node.js-less environments (browser)
  const input = `${bankId}:${date}:${amount.toFixed(2)}:${description}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return `${bankId}_${Math.abs(hash).toString(36)}`;
}

/**
 * Utility: count installments in a parse result.
 */
export function countInstallments(result: ParseResult): {
  total: number;
  withInstallment: number;
  uniquePurchases: number;
} {
  const withInst = result.transactions.filter((t) => t.installment !== null);
  const groups = new Set(
    withInst
      .filter((t) => t.installment && t.installment.total > 0)
      .map((t) => `${t.description}_${t.installment!.total}`)
  );

  return {
    total: result.transactions.length,
    withInstallment: withInst.length,
    uniquePurchases: groups.size,
  };
}

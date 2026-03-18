"use client";

/**
 * OCR Service - FIN-17 (web version)
 *
 * Uses Tesseract.js for client-side OCR on receipt images.
 * Extracts: amount (R$ values), date, vendor/description.
 *
 * Supported: JPG, PNG. PDF support requires PDF.js (future).
 * Language: Portuguese (por).
 */

import { useMutation } from "@tanstack/react-query";

export interface OcrResult {
  rawText: string;
  confidence: number;
  parsed: {
    amount: number | null;
    date: string | null; // ISO format YYYY-MM-DD
    description: string | null;
  };
}

// ─── Text parsing (Brazilian receipts) ──────────────────────────

const AMOUNT_PATTERNS = [
  // R$ 1.234,56 or R$1234,56
  /R\$\s?([\d.]+,\d{2})/gi,
  // TOTAL: 1.234,56 or VALOR: 1234,56
  /(?:TOTAL|VALOR|VLR|SUBTOTAL|V\.?\s?TOTAL)\s*:?\s*R?\$?\s?([\d.]+,\d{2})/gi,
];

const DATE_PATTERNS = [
  // DD/MM/YYYY or DD/MM/YY
  /(\d{2})\/(\d{2})\/(\d{2,4})/g,
  // DD-MM-YYYY
  /(\d{2})-(\d{2})-(\d{2,4})/g,
];

/** @internal Exportado para testes unitários */
export function parseAmount(text: string): number | null {
  // Find all amounts, pick the largest (likely the total)
  const amounts: number[] = [];

  for (const pattern of AMOUNT_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const cleaned = match[1].replace(/\./g, "").replace(",", ".");
      const val = parseFloat(cleaned);
      if (!isNaN(val) && val > 0 && val < 1_000_000) {
        amounts.push(val);
      }
    }
  }

  if (amounts.length === 0) return null;
  return Math.max(...amounts); // Largest is likely the total
}

/** @internal Exportado para testes unitários */
export function parseDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    const match = regex.exec(text);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      let year = parseInt(match[3]);
      if (year < 100) year += 2000;

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2030) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  }
  return null;
}

/** @internal Exportado para testes unitários */
export function parseDescription(text: string): string | null {
  // Try to find establishment name (usually first non-empty line or CNPJ-adjacent line)
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Skip header lines that are just numbers or very short
  for (const line of lines.slice(0, 5)) {
    if (line.length >= 5 && !/^\d+$/.test(line) && !/^[-=]+$/.test(line)) {
      // Clean up: remove excessive spaces, trim to reasonable length
      const cleaned = line.replace(/\s{2,}/g, " ").slice(0, 60);
      return cleaned;
    }
  }
  return null;
}

// ─── OCR Hook ───────────────────────────────────────────────────

/** Run OCR on an image file and extract receipt data */
export function useOcrReceipt() {
  return useMutation({
    mutationFn: async (file: File): Promise<OcrResult> => {
      if (!file.type.startsWith("image/")) {
        throw new Error("OCR disponível apenas para imagens (JPG, PNG). PDF em breve.");
      }

      // Dynamic import to avoid loading 20MB+ Tesseract in every page
      const { createWorker } = await import("tesseract.js");

      const worker = await createWorker("por", 1, {
        logger: () => {}, // suppress progress logs
      });

      try {
        const { data } = await worker.recognize(file);
        const rawText = data.text;
        const confidence = data.confidence;

        const parsed = {
          amount: parseAmount(rawText),
          date: parseDate(rawText),
          description: parseDescription(rawText),
        };

        return { rawText, confidence, parsed };
      } finally {
        await worker.terminate();
      }
    },
  });
}

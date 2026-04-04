"use client";

/**
 * OCR Service - FIN-17 (web version)
 *
 * Uses Tesseract.js for client-side OCR on receipt images.
 * Uses PDF.js for text extraction from PDFs (E64).
 * Extracts: amount (R$ values), date, vendor/description.
 *
 * Supported: JPG, PNG, PDF.
 * PDF strategy: text extraction first (fast), OCR fallback for scanned PDFs.
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
  // VALOR DO DOCUMENTO: 456,78 or VALOR DA NOTA: 1.234,56 (PDF boletos/NF-e)
  /(?:VALOR\s+D[OAE]\s+\w+)\s*:?\s*R?\$?\s?([\d.]+,\d{2})/gi,
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

// ─── PDF text extraction (E64) ─────────────────────────────────

/** Extract text from PDF using PDF.js. Falls back to OCR if text is sparse. */
async function extractPdfText(file: File): Promise<{ text: string; isTextBased: boolean }> {
  const pdfjsLib = await import("pdfjs-dist");

  // Worker via CDN (evita bundlar o worker no build)
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Extract text from all pages (max 10 for receipts)
  const maxPages = Math.min(pdf.numPages, 10);
  const texts: string[] = [];

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    texts.push(pageText);
  }

  const fullText = texts.join("\n");
  // If text has meaningful content (>30 chars), it's a text-based PDF
  return { text: fullText, isTextBased: fullText.replace(/\s/g, "").length > 30 };
}

/** Rasterize first page of PDF to image blob for OCR */
async function rasterizePdfPage(file: File): Promise<Blob> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  const scale = 2; // 2x for better OCR quality
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvas, viewport }).promise;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao rasterizar PDF."))),
      "image/png"
    );
  });
}

// ─── OCR Hook ───────────────────────────────────────────────────

/** Run OCR on an image or PDF file and extract receipt data */
export function useOcrReceipt() {
  return useMutation({
    mutationFn: async (file: File): Promise<OcrResult> => {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

      if (!isImage && !isPdf) {
        throw new Error("OCR disponível para imagens (JPG, PNG) e PDF.");
      }

      // ── PDF path ──────────────────────────────────────────────
      if (isPdf) {
        // Step 1: try text extraction (fast path for text-based PDFs)
        const { text, isTextBased } = await extractPdfText(file);

        if (isTextBased) {
          return {
            rawText: text,
            confidence: 95, // text extraction is reliable
            parsed: {
              amount: parseAmount(text),
              date: parseDate(text),
              description: parseDescription(text),
            },
          };
        }

        // Step 2: scanned PDF → rasterize + OCR
        const blob = await rasterizePdfPage(file);
        const imageFile = new File([blob], "page.png", { type: "image/png" });
        // Fall through to image OCR below
        return await ocrImage(imageFile);
      }

      // ── Image path ────────────────────────────────────────────
      return await ocrImage(file);
    },
  });
}

/** @internal OCR an image file via Tesseract.js */
async function ocrImage(file: File | Blob): Promise<OcrResult> {
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("por", 1, {
    logger: () => {},
  });

  try {
    const { data } = await worker.recognize(file);
    const rawText = data.text;
    const confidence = data.confidence;

    return {
      rawText,
      confidence,
      parsed: {
        amount: parseAmount(rawText),
        date: parseDate(rawText),
        description: parseDescription(rawText),
      },
    };
  } finally {
    await worker.terminate();
  }
}

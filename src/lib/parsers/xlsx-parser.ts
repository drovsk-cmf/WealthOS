/**
 * Oniefy - XLSX/XLS Parser
 *
 * Parses Excel bank statements using SheetJS.
 * Converts to headers + rows format, then reuses CSV mapping logic
 * (suggestMapping, mapToTransactions) for column detection and parsing.
 */

import * as XLSX from "xlsx";

export interface XLSXParseResult {
  headers: string[];
  rows: string[][];
  sheetNames: string[];
  activeSheet: string;
}

/**
 * Parse an Excel file (ArrayBuffer) into headers + rows.
 * Uses the first sheet by default, or a specific sheet by name.
 */
export function parseXLSX(
  buffer: ArrayBuffer,
  sheetName?: string
): XLSXParseResult {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  const sheetNames = workbook.SheetNames;
  const activeSheet = sheetName && sheetNames.includes(sheetName)
    ? sheetName
    : sheetNames[0];

  if (!activeSheet) {
    return { headers: [], rows: [], sheetNames: [], activeSheet: "" };
  }

  const sheet = workbook.Sheets[activeSheet];

  // Convert to array of arrays (raw strings for consistent parsing)
  const raw: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    rawNumbers: false,
    dateNF: "dd/mm/yyyy",
  });

  if (raw.length < 2) {
    return { headers: [], rows: [], sheetNames, activeSheet };
  }

  // First non-empty row = headers
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    const nonEmpty = raw[i].filter((c) => String(c).trim()).length;
    if (nonEmpty >= 2) {
      headerIdx = i;
      break;
    }
  }

  const headers = raw[headerIdx].map((h) => String(h).trim());
  const rows = raw
    .slice(headerIdx + 1)
    .map((row) => row.map((cell) => String(cell).trim()))
    .filter((row) => row.some((cell) => cell !== ""));

  return { headers, rows, sheetNames, activeSheet };
}

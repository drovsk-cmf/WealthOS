/**
 * Oniefy - XLSX/XLS Parser
 *
 * Parses Excel bank statements using ExcelJS.
 * Converts to headers + rows format, then reuses CSV mapping logic
 * (suggestMapping, mapToTransactions) for column detection and parsing.
 */

import ExcelJS from "exceljs";

export interface XLSXParseResult {
  headers: string[];
  rows: string[][];
  sheetNames: string[];
  activeSheet: string;
  error?: string;
}

/**
 * Format a cell value to string consistently.
 * Dates → dd/mm/yyyy, numbers → string, null → "".
 */
function cellToString(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (value instanceof Date) {
    const d = value.getDate().toString().padStart(2, "0");
    const m = (value.getMonth() + 1).toString().padStart(2, "0");
    const y = value.getFullYear();
    return `${d}/${m}/${y}`;
  }
  // ExcelJS rich text
  if (typeof value === "object" && "richText" in value) {
    return (value as ExcelJS.CellRichTextValue).richText
      .map((r) => r.text)
      .join("");
  }
  // ExcelJS formula result
  if (typeof value === "object" && "result" in value) {
    return cellToString((value as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue);
  }
  // ExcelJS hyperlink
  if (typeof value === "object" && "hyperlink" in value) {
    return (value as ExcelJS.CellHyperlinkValue).text ?? String(value);
  }
  // ExcelJS shared formula
  if (typeof value === "object" && "sharedFormula" in value) {
    return cellToString((value as ExcelJS.CellSharedFormulaValue).result as ExcelJS.CellValue);
  }
  // ExcelJS error
  if (typeof value === "object" && "error" in value) {
    return "";
  }
  return String(value);
}

/**
 * Parse an Excel file (ArrayBuffer) into headers + rows.
 * Uses the first sheet by default, or a specific sheet by name.
 */
export async function parseXLSX(
  buffer: ArrayBuffer,
  sheetName?: string
): Promise<XLSXParseResult> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    return { headers: [], rows: [], sheetNames: [], activeSheet: "", error: "Arquivo Excel inválido ou corrompido." };
  }

  const sheetNames = workbook.worksheets.map((ws) => ws.name);
  const activeSheet = sheetName && sheetNames.includes(sheetName)
    ? sheetName
    : sheetNames[0];

  if (!activeSheet) {
    return { headers: [], rows: [], sheetNames: [], activeSheet: "" };
  }

  const sheet = workbook.getWorksheet(activeSheet);
  if (!sheet || sheet.rowCount < 2) {
    return { headers: [], rows: [], sheetNames, activeSheet: activeSheet ?? "" };
  }

  // Read all rows as string arrays
  const raw: string[][] = [];
  sheet.eachRow((row) => {
    // row.values is 1-indexed (index 0 is undefined), so slice(1)
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    raw.push(values.map((v) => cellToString(v as ExcelJS.CellValue)));
  });

  if (raw.length < 2) {
    return { headers: [], rows: [], sheetNames, activeSheet };
  }

  // First non-empty row = headers (scan up to 5 rows)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    const nonEmpty = raw[i].filter((c) => c.trim()).length;
    if (nonEmpty >= 2) {
      headerIdx = i;
      break;
    }
  }

  const headers = raw[headerIdx].map((h) => h.trim());
  const rows = raw
    .slice(headerIdx + 1)
    .map((row) => row.map((cell) => cell.trim()))
    .filter((row) => row.some((cell) => cell !== ""));

  return { headers, rows, sheetNames, activeSheet };
}

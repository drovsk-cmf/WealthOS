/**
 * WealthOS - OFX Parser
 *
 * Parses OFX/QFX files (Open Financial Exchange) client-side.
 * OFX is an XML-like format used by banks for statement export.
 * Handles both SGML (OFX 1.x) and XML (OFX 2.x) variants.
 */

export interface OFXTransaction {
  externalId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  type: "income" | "expense";
  memo?: string;
}

export interface OFXParseResult {
  accountId?: string;
  bankId?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  transactions: OFXTransaction[];
  errors: string[];
}

function parseOFXDate(raw: string): string {
  // OFX dates: YYYYMMDDHHMMSS[.XXX:gmt_offset] or YYYYMMDD
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 8);
  if (digits.length < 8) return "";
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function extractTag(content: string, tag: string): string {
  // SGML style: <TAG>value (no closing tag)
  const sgmlRegex = new RegExp(`<${tag}>([^<\\n]+)`, "i");
  const match = content.match(sgmlRegex);
  if (match) return match[1].trim();

  // XML style: <TAG>value</TAG>
  const xmlRegex = new RegExp(`<${tag}>([^<]+)</${tag}>`, "i");
  const xmlMatch = content.match(xmlRegex);
  return xmlMatch ? xmlMatch[1].trim() : "";
}

function extractBlocks(content: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "gi");
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push(match[1]);
  }

  // Fallback for SGML without closing tags
  if (blocks.length === 0) {
    const sgmlRegex = new RegExp(`<${tag}>([\\s\\S]*?)(?=<${tag}>|</${tag.replace("STMTTRN", "BANKTRANLIST")}>|$)`, "gi");
    while ((match = sgmlRegex.exec(content)) !== null) {
      blocks.push(match[1]);
    }
  }

  return blocks;
}

export function parseOFX(content: string): OFXParseResult {
  const result: OFXParseResult = {
    transactions: [],
    errors: [],
  };

  try {
    // Strip SGML header if present
    const bodyStart = content.indexOf("<OFX>");
    const body = bodyStart >= 0 ? content.slice(bodyStart) : content;

    // Extract account info
    result.accountId = extractTag(body, "ACCTID");
    result.bankId = extractTag(body, "BANKID");
    result.currency = extractTag(body, "CURDEF") || "BRL";

    const dtStart = extractTag(body, "DTSTART");
    const dtEnd = extractTag(body, "DTEND");
    if (dtStart) result.startDate = parseOFXDate(dtStart);
    if (dtEnd) result.endDate = parseOFXDate(dtEnd);

    // Extract transactions
    const txBlocks = extractBlocks(body, "STMTTRN");

    for (const block of txBlocks) {
      const fitid = extractTag(block, "FITID");
      const dtPosted = extractTag(block, "DTPOSTED");
      const trnAmt = extractTag(block, "TRNAMT");
      const name = extractTag(block, "NAME");
      const memo = extractTag(block, "MEMO");

      if (!dtPosted || !trnAmt) {
        result.errors.push(`Transação incompleta: FITID=${fitid}`);
        continue;
      }

      const amount = parseFloat(trnAmt.replace(",", "."));
      if (isNaN(amount)) {
        result.errors.push(`Valor inválido: ${trnAmt} (FITID=${fitid})`);
        continue;
      }

      const date = parseOFXDate(dtPosted);
      if (!date) {
        result.errors.push(`Data inválida: ${dtPosted} (FITID=${fitid})`);
        continue;
      }

      result.transactions.push({
        externalId: fitid || `ofx_${date}_${Math.abs(amount).toFixed(2)}`,
        date,
        amount,
        description: name || memo || "Sem descrição",
        type: amount >= 0 ? "income" : "expense",
        memo: memo || undefined,
      });
    }
  } catch (err) {
    result.errors.push(`Erro ao parsear OFX: ${err instanceof Error ? err.message : "desconhecido"}`);
  }

  return result;
}

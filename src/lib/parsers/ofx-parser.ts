/**
 * Oniefy - OFX Parser
 *
 * Parses OFX/QFX files (Open Financial Exchange) client-side.
 * OFX is an XML-like format used by banks for statement export.
 * Handles both SGML (OFX 1.x) and XML (OFX 2.x) variants.
 *
 * Deduplicação:
 * - Cada transação recebe um external_id baseado no FITID original
 * - Quando FITID ausente, gera hash SHA-256 de (data + valor + descrição)
 * - Dedup in-file: transações com external_id duplicado são descartadas
 * - Dedup cross-import: external_id tem UNIQUE constraint parcial no banco
 *
 * Ref: Auditoria de segurança - Achado 4
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
  duplicatesSkipped: number;
  errors: string[];
}

/**
 * Gera hash SHA-256 hex de uma string.
 * Usa Web Crypto API (disponível em browsers e Edge Runtime).
 */
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Gera external_id determinístico para uma transação OFX.
 * Se FITID disponível: sha256("ofx:{bankId}:{acctId}:{fitid}")
 * Se FITID ausente: sha256("ofx:{bankId}:{acctId}:{date}:{amount}:{desc}")
 */
async function generateExternalId(
  fitid: string,
  bankId: string,
  accountId: string,
  date: string,
  amount: string,
  description: string
): Promise<string> {
  if (fitid) {
    return sha256(`ofx:${bankId}:${accountId}:${fitid}`);
  }
  // Fallback: hash composto (menos robusto, mas cobre casos sem FITID)
  return sha256(`ofx:${bankId}:${accountId}:${date}:${amount}:${description}`);
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

export async function parseOFX(content: string): Promise<OFXParseResult> {
  const result: OFXParseResult = {
    transactions: [],
    duplicatesSkipped: 0,
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

    // In-file dedup: track seen external_ids
    const seenIds = new Set<string>();

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

      const description = name || memo || "Sem descrição";

      // Generate deterministic external_id via SHA-256
      const externalId = await generateExternalId(
        fitid,
        result.bankId ?? "",
        result.accountId ?? "",
        date,
        trnAmt,
        description
      );

      // In-file dedup
      if (seenIds.has(externalId)) {
        result.duplicatesSkipped++;
        continue;
      }
      seenIds.add(externalId);

      // Normalize: amount always positive, type from original sign
      result.transactions.push({
        externalId,
        date,
        amount: Math.abs(amount),
        description,
        type: amount >= 0 ? "income" : "expense",
        memo: memo || undefined,
      });
    }
  } catch (err) {
    result.errors.push(`Erro ao parsear OFX: ${err instanceof Error ? err.message : "desconhecido"}`);
  }

  return result;
}

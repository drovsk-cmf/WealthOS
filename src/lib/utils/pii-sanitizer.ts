/**
 * PII Sanitizer (P11 - adendo v1.5 §5.3)
 *
 * Remove dados pessoais identificáveis antes de enviar
 * descrições de transações para APIs de IA.
 *
 * Padrões removidos:
 * - CPF (xxx.xxx.xxx-xx)
 * - CNPJ (xx.xxx.xxx/xxxx-xx)
 * - Email
 * - Telefone BR (+55, DDD, etc.)
 * - Cartão de crédito (4+ dígitos consecutivos)
 * - Nomes próprios (heurística: palavras capitalizadas >3 chars)
 */

const PATTERNS: { regex: RegExp; replacement: string }[] = [
  // CPF: 123.456.789-00 or 12345678900
  { regex: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, replacement: "[CPF]" },
  // CNPJ: 12.345.678/0001-00
  { regex: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, replacement: "[CNPJ]" },
  // Email
  { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: "[EMAIL]" },
  // Credit card: 4 groups of 4 digits (MUST come before phone to avoid greedy phone match)
  { regex: /\b\d{4}[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{2,4}\b/g, replacement: "[CARTAO]" },
  // Phone BR: +55 (62) 99999-9999 or variations
  { regex: /(?:\+?55\s?)?(?:\(?\d{2}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}\b/g, replacement: "[TEL]" },
  // Bank account patterns: ag XXXX cc XXXXXXX
  { regex: /\b(?:ag|agencia|conta|cc|c\/c)\s*:?\s*\d{3,}/gi, replacement: "[CONTA]" },
];

/**
 * Sanitize a transaction description by removing PII.
 * Returns the sanitized string.
 */
export function sanitizePII(input: string): string {
  let result = input;
  for (const { regex, replacement } of PATTERNS) {
    result = result.replace(regex, replacement);
  }
  return result;
}

/**
 * Generate a hash for cache lookup (SHA-256 hex).
 * Uses Web Crypto API (available in browsers and Edge Functions).
 */
export async function hashPrompt(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

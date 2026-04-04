/**
 * Oniefy - Password Derivation for Bank Statements (E69)
 *
 * Derives passwords for encrypted bank statement files (PDF/XLSX)
 * from user's CPF and CEP, following each bank's convention.
 *
 * Brazilian banks use predictable password rules:
 * - BTG: full CPF (11 digits)
 * - Mercado Pago, Itaú: first 5 digits of CPF
 * - Bradescard, Bradesco: first 6 digits of CPF
 * - Porto Bank: first 4 digits of CPF + 5 digits of CEP
 * - Santander: first 3 digits of CPF
 * - Nubank: no password (open PDF)
 *
 * Ref: docs/IMPORT-ENGINE-SPEC.md §3.1
 */

// ── Tipos ──

export interface PasswordDerivationRule {
  bankId: string;
  bankName: string;
  /** Formula identifier */
  formula: PasswordFormula;
  /** Whether the rule is confirmed or provisional */
  confirmed: boolean;
}

export type PasswordFormula =
  | "none"           // no password needed
  | "cpf_11"         // full CPF (11 digits)
  | "cpf_5"          // first 5 digits
  | "cpf_6"          // first 6 digits
  | "cpf_4_cep_5"    // first 4 CPF + 5 CEP
  | "cpf_3";         // first 3 digits

export interface DerivedPassword {
  bankId: string;
  /** The derived password candidate(s), ordered by likelihood */
  candidates: string[];
  /** Whether all required inputs (CPF, CEP) were provided */
  complete: boolean;
  /** Missing inputs if incomplete */
  missing?: string[];
}

// ── Regras por banco ──

const PASSWORD_RULES: PasswordDerivationRule[] = [
  { bankId: "nubank_fatura", bankName: "Nubank", formula: "none", confirmed: true },
  { bankId: "nubank_extrato", bankName: "Nubank", formula: "none", confirmed: true },
  { bankId: "btg", bankName: "BTG Pactual", formula: "cpf_11", confirmed: true },
  { bankId: "mercadopago", bankName: "Mercado Pago", formula: "cpf_5", confirmed: true },
  { bankId: "itau", bankName: "Itaú", formula: "cpf_5", confirmed: true },
  { bankId: "porto_bradescard", bankName: "Porto Bank / Bradescard", formula: "cpf_6", confirmed: true },
  { bankId: "porto_bank_cep", bankName: "Porto Bank (com CEP)", formula: "cpf_4_cep_5", confirmed: true },
  { bankId: "c6", bankName: "C6 Bank", formula: "none", confirmed: true },
  { bankId: "xp", bankName: "XP Investimentos", formula: "none", confirmed: true },
  { bankId: "inter", bankName: "Banco Inter", formula: "none", confirmed: true },
  // Provisórios (marcados no spec como "a confirmar")
  { bankId: "santander", bankName: "Santander", formula: "cpf_3", confirmed: false },
  { bankId: "bradesco", bankName: "Bradesco", formula: "cpf_6", confirmed: false },
];

// ── Funções ──

/**
 * Extract only digits from a string.
 */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Validate CPF format (11 digits). Does NOT validate check digits.
 */
export function isValidCPFFormat(cpf: string): boolean {
  return digitsOnly(cpf).length === 11;
}

/**
 * Validate CEP format (8 digits).
 */
export function isValidCEPFormat(cep: string): boolean {
  return digitsOnly(cep).length === 8;
}

/**
 * Derive password candidates for a bank statement.
 *
 * @param bankId - The detected bank ID (from bank-detection.ts)
 * @param cpf - User's CPF (any format: "123.456.789-00" or "12345678900")
 * @param cep - User's CEP (optional, required only for Porto Bank: "01310-100" or "01310100")
 * @returns Derived password with candidates ordered by likelihood
 */
export function derivePassword(
  bankId: string,
  cpf: string,
  cep?: string
): DerivedPassword {
  const cpfDigits = digitsOnly(cpf);
  const cepDigits = cep ? digitsOnly(cep) : "";

  // Find matching rule(s) - some banks have multiple formulas
  const rules = PASSWORD_RULES.filter((r) => r.bankId === bankId);

  // Fallback: try all common formulas if bank not found
  if (rules.length === 0) {
    return deriveUnknownBank(cpfDigits, cepDigits);
  }

  const candidates: string[] = [];
  const missing: string[] = [];

  for (const rule of rules) {
    switch (rule.formula) {
      case "none":
        // No password needed
        return { bankId, candidates: [], complete: true };

      case "cpf_11":
        if (cpfDigits.length !== 11) {
          missing.push("CPF (11 dígitos)");
          break;
        }
        candidates.push(cpfDigits);
        break;

      case "cpf_5":
        if (cpfDigits.length < 5) {
          missing.push("CPF");
          break;
        }
        candidates.push(cpfDigits.substring(0, 5));
        break;

      case "cpf_6":
        if (cpfDigits.length < 6) {
          missing.push("CPF");
          break;
        }
        candidates.push(cpfDigits.substring(0, 6));
        break;

      case "cpf_3":
        if (cpfDigits.length < 3) {
          missing.push("CPF");
          break;
        }
        candidates.push(cpfDigits.substring(0, 3));
        break;

      case "cpf_4_cep_5":
        if (cpfDigits.length < 4) missing.push("CPF");
        if (cepDigits.length < 5) missing.push("CEP");
        if (cpfDigits.length >= 4 && cepDigits.length >= 5) {
          candidates.push(cpfDigits.substring(0, 4) + cepDigits.substring(0, 5));
        }
        break;
    }
  }

  // Deduplicate candidates
  const unique = [...new Set(candidates)];

  return {
    bankId,
    candidates: unique,
    complete: missing.length === 0 && unique.length > 0,
    missing: missing.length > 0 ? [...new Set(missing)] : undefined,
  };
}

/**
 * For unknown banks, generate all common password formulas as candidates.
 * Ordered by frequency (most common first).
 */
function deriveUnknownBank(cpfDigits: string, cepDigits: string): DerivedPassword {
  const candidates: string[] = [];

  if (cpfDigits.length >= 6) candidates.push(cpfDigits.substring(0, 6)); // most common
  if (cpfDigits.length >= 5) candidates.push(cpfDigits.substring(0, 5));
  if (cpfDigits.length === 11) candidates.push(cpfDigits);
  if (cpfDigits.length >= 3) candidates.push(cpfDigits.substring(0, 3));
  if (cpfDigits.length >= 4 && cepDigits.length >= 5) {
    candidates.push(cpfDigits.substring(0, 4) + cepDigits.substring(0, 5));
  }

  return {
    bankId: "unknown",
    candidates: [...new Set(candidates)],
    complete: cpfDigits.length >= 6,
    missing: cpfDigits.length < 6 ? ["CPF"] : undefined,
  };
}

/**
 * Get the password rule for a specific bank.
 */
export function getPasswordRule(bankId: string): PasswordDerivationRule | null {
  return PASSWORD_RULES.find((r) => r.bankId === bankId) ?? null;
}

/**
 * Check if a bank requires a password for its statements.
 */
export function bankRequiresPassword(bankId: string): boolean {
  const rules = PASSWORD_RULES.filter((r) => r.bankId === bankId);
  if (rules.length === 0) return true; // unknown bank, assume yes
  return rules.some((r) => r.formula !== "none");
}

/**
 * Get all banks that require passwords (for UI: "estes bancos precisam do seu CPF").
 */
export function getBanksRequiringPassword(): PasswordDerivationRule[] {
  return PASSWORD_RULES.filter((r) => r.formula !== "none");
}

/**
 * Tests: Password Derivation (E69)
 * Ref: docs/IMPORT-ENGINE-SPEC.md §3.1
 */
import {
  derivePassword,
  isValidCPFFormat,
  isValidCEPFormat,
  bankRequiresPassword,
  getPasswordRule,
  getBanksRequiringPassword,
} from "@/lib/services/password-derivation";

const CPF = "123.456.789-00";
const CEP = "01310-100";

describe("isValidCPFFormat", () => {
  it("aceita CPF formatado", () => expect(isValidCPFFormat("123.456.789-00")).toBe(true));
  it("aceita CPF só dígitos", () => expect(isValidCPFFormat("12345678900")).toBe(true));
  it("rejeita CPF curto", () => expect(isValidCPFFormat("1234567890")).toBe(false));
  it("rejeita CPF longo", () => expect(isValidCPFFormat("123456789001")).toBe(false));
});

describe("isValidCEPFormat", () => {
  it("aceita CEP formatado", () => expect(isValidCEPFormat("01310-100")).toBe(true));
  it("aceita CEP só dígitos", () => expect(isValidCEPFormat("01310100")).toBe(true));
  it("rejeita CEP curto", () => expect(isValidCEPFormat("0131010")).toBe(false));
});

describe("derivePassword", () => {
  it("Nubank: sem senha (none)", () => {
    const r = derivePassword("nubank_fatura", CPF);
    expect(r.candidates).toHaveLength(0);
    expect(r.complete).toBe(true);
  });

  it("BTG: CPF completo (11 dígitos)", () => {
    const r = derivePassword("btg", CPF);
    expect(r.candidates).toEqual(["12345678900"]);
    expect(r.complete).toBe(true);
  });

  it("Mercado Pago: 5 primeiros dígitos do CPF", () => {
    const r = derivePassword("mercadopago", CPF);
    expect(r.candidates).toEqual(["12345"]);
  });

  it("Itaú: 5 primeiros dígitos do CPF", () => {
    const r = derivePassword("itau", CPF);
    expect(r.candidates).toEqual(["12345"]);
  });

  it("Porto Bradescard: 6 primeiros dígitos do CPF", () => {
    const r = derivePassword("porto_bradescard", CPF);
    expect(r.candidates).toEqual(["123456"]);
  });

  it("Porto Bank com CEP: 4 CPF + 5 CEP", () => {
    const r = derivePassword("porto_bank_cep", CPF, CEP);
    expect(r.candidates).toEqual(["123401310"]);
    expect(r.complete).toBe(true);
  });

  it("Porto Bank com CEP: falta CEP → incomplete", () => {
    const r = derivePassword("porto_bank_cep", CPF);
    expect(r.complete).toBe(false);
    expect(r.missing).toContain("CEP");
  });

  it("Santander (provisório): 3 primeiros dígitos", () => {
    const r = derivePassword("santander", CPF);
    expect(r.candidates).toEqual(["123"]);
    const rule = getPasswordRule("santander");
    expect(rule?.confirmed).toBe(false);
  });

  it("banco desconhecido: gera todas as fórmulas comuns", () => {
    const r = derivePassword("banco_novo", CPF, CEP);
    expect(r.bankId).toBe("unknown");
    expect(r.candidates.length).toBeGreaterThanOrEqual(4);
    // Deve incluir: 123456, 12345, 12345678900, 123, 123401310
    expect(r.candidates).toContain("123456");
    expect(r.candidates).toContain("12345");
    expect(r.candidates).toContain("12345678900");
  });

  it("C6, XP, Inter: sem senha", () => {
    for (const bankId of ["c6", "xp", "inter"]) {
      const r = derivePassword(bankId, CPF);
      expect(r.candidates).toHaveLength(0);
      expect(r.complete).toBe(true);
    }
  });
});

describe("bankRequiresPassword", () => {
  it("nubank não requer", () => expect(bankRequiresPassword("nubank_fatura")).toBe(false));
  it("btg requer", () => expect(bankRequiresPassword("btg")).toBe(true));
  it("banco desconhecido: assume que requer", () => expect(bankRequiresPassword("xyz")).toBe(true));
});

describe("getBanksRequiringPassword", () => {
  it("retorna lista com BTG, Mercado Pago, Itaú, etc.", () => {
    const banks = getBanksRequiringPassword();
    expect(banks.length).toBeGreaterThanOrEqual(5);
    expect(banks.some((b) => b.bankId === "btg")).toBe(true);
    expect(banks.some((b) => b.bankId === "mercadopago")).toBe(true);
    // Nubank não deve estar na lista
    expect(banks.some((b) => b.bankId === "nubank_fatura")).toBe(false);
  });
});

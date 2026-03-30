import { sanitizePII } from "@/lib/utils/pii-sanitizer";

describe("PII Sanitizer (P11)", () => {
  describe("CPF", () => {
    it("sanitiza CPF formatado (xxx.xxx.xxx-xx)", () => {
      expect(sanitizePII("pagamento 123.456.789-00 ref")).toBe("pagamento [CPF] ref");
    });

    it("sanitiza CPF sem formatação (11 dígitos)", () => {
      expect(sanitizePII("cpf 12345678900 ok")).toBe("cpf [CPF] ok");
    });
  });

  describe("CNPJ", () => {
    it("sanitiza CNPJ formatado", () => {
      expect(sanitizePII("empresa 12.345.678/0001-00 ltda")).toBe("empresa [CNPJ] ltda");
    });
  });

  describe("Email", () => {
    it("sanitiza endereço de email", () => {
      expect(sanitizePII("contato usuario@empresa.com.br ok")).toBe("contato [EMAIL] ok");
    });

    it("sanitiza email com subdomínio", () => {
      expect(sanitizePII("user.name+tag@sub.domain.co")).toContain("[EMAIL]");
    });
  });

  describe("Telefone", () => {
    it("sanitiza telefone BR com DDD", () => {
      expect(sanitizePII("ligar 62 99999-1234 urgente")).toBe("ligar [TEL] urgente");
    });

    it("sanitiza telefone com +55", () => {
      expect(sanitizePII("+55 11 98765-4321")).toBe("[TEL]");
    });
  });

  describe("Cartão de crédito", () => {
    it("sanitiza número de cartão com espaços", () => {
      expect(sanitizePII("cartao 4111 2222 3333 4444")).toBe("cartao [CARTAO]");
    });

    it("sanitiza número de cartão com pontos", () => {
      expect(sanitizePII("4111.2222.3333.4444")).toBe("[CARTAO]");
    });
  });

  describe("Conta bancária", () => {
    it("sanitiza agência e conta", () => {
      expect(sanitizePII("ag 1234 cc 567890")).toBe("[CONTA] [CONTA]");
    });

    it("sanitiza formato ag:", () => {
      expect(sanitizePII("agencia: 5678")).toContain("[CONTA]");
    });
  });

  describe("Preserva texto normal", () => {
    it("não altera descrição sem PII", () => {
      expect(sanitizePII("Supermercado Pão de Açúcar")).toBe("Supermercado Pão de Açúcar");
    });

    it("não altera valores monetários", () => {
      expect(sanitizePII("R$ 1.500,00")).toBe("R$ 1.500,00");
    });

    it("preserva texto vazio", () => {
      expect(sanitizePII("")).toBe("");
    });
  });

  describe("Múltiplos PIIs", () => {
    it("sanitiza CPF + email na mesma string", () => {
      const result = sanitizePII("fulano 123.456.789-00 email fulano@email.com");
      expect(result).toContain("[CPF]");
      expect(result).toContain("[EMAIL]");
      expect(result).not.toContain("123.456");
      expect(result).not.toContain("fulano@");
    });
  });
});

describe("hashPrompt", () => {
  beforeAll(() => {
    // jsdom does not expose crypto.subtle; polyfill from Node webcrypto
    if (!globalThis.crypto?.subtle) {
      const { webcrypto } = require("node:crypto");
      Object.defineProperty(globalThis, "crypto", { value: webcrypto });
    }
  });

  it("produces a 64-char hex SHA-256 hash", async () => {
    const { hashPrompt } = await import("@/lib/utils/pii-sanitizer");
    const hash = await hashPrompt("supermercado pao de acucar");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is case-insensitive and trim-insensitive", async () => {
    const { hashPrompt } = await import("@/lib/utils/pii-sanitizer");
    const h1 = await hashPrompt("Hello World");
    const h2 = await hashPrompt("  hello world  ");
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different inputs", async () => {
    const { hashPrompt } = await import("@/lib/utils/pii-sanitizer");
    const h1 = await hashPrompt("alimentação");
    const h2 = await hashPrompt("transporte");
    expect(h1).not.toBe(h2);
  });
});

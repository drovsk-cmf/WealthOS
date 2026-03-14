import { formatCurrency, formatDate, formatRelativeDate, sanitizeRedirectTo } from "@/lib/utils";

describe("utils", () => {
  describe("formatCurrency", () => {
    it("formata valor positivo em BRL", () => {
      expect(formatCurrency(1234.56)).toBe("R$\u00a01.234,56");
    });

    it("formata zero", () => {
      expect(formatCurrency(0)).toBe("R$\u00a00,00");
    });

    it("formata valor negativo", () => {
      expect(formatCurrency(-500)).toBe("-R$\u00a0500,00");
    });

    it("formata centavos fracionários com arredondamento", () => {
      expect(formatCurrency(99.999)).toBe("R$\u00a0100,00");
    });

    it("formata milhões com separadores", () => {
      expect(formatCurrency(1234567.89)).toBe("R$\u00a01.234.567,89");
    });
  });

  describe("formatDate", () => {
    it("formata ISO string no padrão dd/MM/yyyy", () => {
      expect(formatDate("2026-03-14")).toBe("14/03/2026");
    });

    it("formata Date object", () => {
      expect(formatDate(new Date(2026, 0, 1))).toBe("01/01/2026");
    });

    it("aceita padrão customizado", () => {
      expect(formatDate("2026-03-14", "yyyy-MM-dd")).toBe("2026-03-14");
    });

    it("formata com nome do mês em pt-BR", () => {
      const result = formatDate("2026-03-14", "dd 'de' MMMM");
      expect(result).toMatch(/14 de março/i);
    });
  });

  describe("formatRelativeDate", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-03-14T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("retorna 'hoje' para data de hoje", () => {
      expect(formatRelativeDate("2026-03-14T10:00:00Z")).toBe("hoje");
    });

    it("retorna 'ontem' para data de ontem", () => {
      expect(formatRelativeDate("2026-03-13T10:00:00Z")).toBe("ontem");
    });

    it("retorna 'há N dias' para menos de 7 dias", () => {
      expect(formatRelativeDate("2026-03-10T10:00:00Z")).toBe("há 4 dias");
    });

    it("retorna 'há N semanas' para menos de 30 dias", () => {
      expect(formatRelativeDate("2026-03-01T10:00:00Z")).toBe("há 1 semanas");
    });

    it("retorna data formatada para mais de 30 dias", () => {
      expect(formatRelativeDate("2026-01-10T10:00:00Z")).toBe("10/01/2026");
    });
  });

  describe("sanitizeRedirectTo", () => {
    it("aceita caminho relativo válido", () => {
      expect(sanitizeRedirectTo("/dashboard")).toBe("/dashboard");
    });

    it("aceita caminho com subpath", () => {
      expect(sanitizeRedirectTo("/settings/profile")).toBe("/settings/profile");
    });

    it("retorna fallback para null", () => {
      expect(sanitizeRedirectTo(null)).toBe("/dashboard");
    });

    it("retorna fallback para undefined", () => {
      expect(sanitizeRedirectTo(undefined)).toBe("/dashboard");
    });

    it("retorna fallback para string vazia", () => {
      expect(sanitizeRedirectTo("")).toBe("/dashboard");
    });

    it("rejeita URL absoluta", () => {
      expect(sanitizeRedirectTo("https://evil.com")).toBe("/dashboard");
    });

    it("rejeita double slash (//evil.com)", () => {
      expect(sanitizeRedirectTo("//evil.com")).toBe("/dashboard");
    });

    it("rejeita backslash", () => {
      expect(sanitizeRedirectTo("/\\evil.com")).toBe("/dashboard");
    });

    it("rejeita javascript: scheme", () => {
      expect(sanitizeRedirectTo("javascript:alert(1)")).toBe("/dashboard");
    });

    it("rejeita data: scheme", () => {
      expect(sanitizeRedirectTo("data:text/html,<h1>xss</h1>")).toBe("/dashboard");
    });

    it("rejeita URL com protocolo via colon", () => {
      expect(sanitizeRedirectTo("/redirect:evil")).toBe("/dashboard");
    });

    it("rejeita URL com @", () => {
      expect(sanitizeRedirectTo("/foo@evil.com")).toBe("/dashboard");
    });

    it("rejeita encoded double slash", () => {
      expect(sanitizeRedirectTo("/%2F/evil.com")).toBe("/dashboard");
    });

    it("rejeita encoded javascript", () => {
      expect(sanitizeRedirectTo("/%6aavascript:alert(1)")).toBe("/dashboard");
    });

    it("aceita fallback customizado", () => {
      expect(sanitizeRedirectTo(null, "/home")).toBe("/home");
    });
  });
});

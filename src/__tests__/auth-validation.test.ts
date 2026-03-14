import { loginSchema, registerSchema } from "@/lib/validations/auth";

describe("auth validation schemas", () => {
  describe("loginSchema", () => {
    it("aceita credenciais válidas simples", () => {
      const parsed = loginSchema.safeParse({ email: "user@test.com", password: "x" });
      expect(parsed.success).toBe(true);
    });

    it("aceita credenciais válidas com domínio corporativo", () => {
      const parsed = loginSchema.safeParse({ email: "a.b@empresa.com.br", password: "senha123" });
      expect(parsed.success).toBe(true);
    });

    it("rejeita email inválido", () => {
      const parsed = loginSchema.safeParse({ email: "invalido", password: "abc" });
      expect(parsed.success).toBe(false);
    });

    it("rejeita senha vazia", () => {
      const parsed = loginSchema.safeParse({ email: "user@test.com", password: "" });
      expect(parsed.success).toBe(false);
    });

    it("rejeita payload sem password", () => {
      const parsed = loginSchema.safeParse({ email: "user@test.com" });
      expect(parsed.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    const validPasswordA = "SenhaMuitoForte123";
    const validPasswordB = "OutraSenhaValida456";

    it("aceita payload válido básico", () => {
      const parsed = registerSchema.safeParse({
        fullName: "Claudio Filho",
        email: "claudio@test.com",
        password: validPasswordA,
        confirmPassword: validPasswordA,
      });
      expect(parsed.success).toBe(true);
    });

    it("aceita outro payload válido", () => {
      const parsed = registerSchema.safeParse({
        fullName: "Ana Maria",
        email: "ana.maria@empresa.com",
        password: validPasswordB,
        confirmPassword: validPasswordB,
      });
      expect(parsed.success).toBe(true);
    });

    it("rejeita nome curto", () => {
      const parsed = registerSchema.safeParse({
        fullName: "A",
        email: "a@test.com",
        password: validPasswordA,
        confirmPassword: validPasswordA,
      });
      expect(parsed.success).toBe(false);
    });

    it("rejeita email inválido", () => {
      const parsed = registerSchema.safeParse({
        fullName: "Nome Válido",
        email: "email-invalido",
        password: validPasswordA,
        confirmPassword: validPasswordA,
      });
      expect(parsed.success).toBe(false);
    });

    it("rejeita confirmação de senha divergente", () => {
      const parsed = registerSchema.safeParse({
        fullName: "Nome Válido",
        email: "ok@test.com",
        password: validPasswordA,
        confirmPassword: "Diferente123Aa",
      });
      expect(parsed.success).toBe(false);
    });
  });
});

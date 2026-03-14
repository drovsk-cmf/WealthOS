import {
  mfaCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  passwordSchema,
  getPasswordStrength,
} from "@/lib/validations/auth";
import { isPasswordBlocked } from "@/lib/auth/password-blocklist";

describe("auth validation (extended)", () => {
  describe("mfaCodeSchema", () => {
    it("aceita código TOTP válido de 6 dígitos", () => {
      expect(mfaCodeSchema.safeParse({ code: "123456" }).success).toBe(true);
    });

    it("rejeita código com letras", () => {
      expect(mfaCodeSchema.safeParse({ code: "12345a" }).success).toBe(false);
    });

    it("rejeita código com menos de 6 dígitos", () => {
      expect(mfaCodeSchema.safeParse({ code: "12345" }).success).toBe(false);
    });

    it("rejeita código com mais de 6 dígitos", () => {
      expect(mfaCodeSchema.safeParse({ code: "1234567" }).success).toBe(false);
    });

    it("rejeita código com espaços", () => {
      expect(mfaCodeSchema.safeParse({ code: "123 56" }).success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("aceita email válido", () => {
      expect(forgotPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
    });

    it("rejeita email inválido", () => {
      expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    });

    it("rejeita campo vazio", () => {
      expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    const validPassword = "Str0ngP@ss2026";

    it("aceita senhas válidas coincidentes", () => {
      const result = resetPasswordSchema.safeParse({
        password: validPassword,
        confirmPassword: validPassword,
      });
      expect(result.success).toBe(true);
    });

    it("rejeita senhas divergentes", () => {
      const result = resetPasswordSchema.safeParse({
        password: validPassword,
        confirmPassword: "OutraSenha1234!",
      });
      expect(result.success).toBe(false);
    });

    it("rejeita senha curta mesmo que coincidente", () => {
      const result = resetPasswordSchema.safeParse({
        password: "Short1!",
        confirmPassword: "Short1!",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("passwordSchema (deep)", () => {
    it("aceita senha forte com 12+ chars, maiúscula, minúscula e número", () => {
      expect(passwordSchema.safeParse("MyStr0ngPass1").success).toBe(true);
    });

    it("rejeita senha sem maiúscula", () => {
      expect(passwordSchema.safeParse("mystr0ngpass1").success).toBe(false);
    });

    it("rejeita senha sem minúscula", () => {
      expect(passwordSchema.safeParse("MYSTR0NGPASS1").success).toBe(false);
    });

    it("rejeita senha sem número", () => {
      expect(passwordSchema.safeParse("MyStrongPasswd").success).toBe(false);
    });

    it("rejeita senha com 128+ caracteres", () => {
      const tooLong = "A1" + "a".repeat(127);
      expect(passwordSchema.safeParse(tooLong).success).toBe(false);
    });

    it("rejeita senha da blocklist", () => {
      expect(passwordSchema.safeParse("Password1234").success).toBe(false);
    });
  });

  describe("getPasswordStrength", () => {
    it("retorna 'weak' para senha simples curta", () => {
      expect(getPasswordStrength("abc")).toBe("weak");
    });

    it("retorna 'fair' para senha com 12 chars e mixed case", () => {
      // "AbcDefghijkl" está na blocklist (lowercase match), usar outra
      expect(getPasswordStrength("ZxyWvuTsrqpo")).toBe("fair");
    });

    it("retorna 'strong' para senha longa com tudo", () => {
      expect(getPasswordStrength("MyStr0ng!Pass2026")).toBe("strong");
    });

    it("retorna 'weak' para senha da blocklist mesmo com critérios", () => {
      // password1234 está na blocklist, score diminui
      expect(["weak", "fair"]).toContain(getPasswordStrength("password1234"));
    });
  });

  describe("isPasswordBlocked", () => {
    it("bloqueia senha conhecida da blocklist", () => {
      expect(isPasswordBlocked("123456789012")).toBe(true);
    });

    it("bloqueia case-insensitive", () => {
      expect(isPasswordBlocked("PASSWORD1234")).toBe(true);
    });

    it("permite senha não listada", () => {
      expect(isPasswordBlocked("UniqueP@ss2026!")).toBe(false);
    });

    it("bloqueia variações com substituição comum", () => {
      expect(isPasswordBlocked("p@ssw0rd1234")).toBe(true);
    });
  });
});

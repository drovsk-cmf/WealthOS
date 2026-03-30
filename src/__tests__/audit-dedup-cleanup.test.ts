/**
 * Auditoria: Testes de dedup e cleanup
 *
 * Ref: Problema 5 (budget dedup logic, previously useBudgetMonths - removed session 34)
 * Ref: Rate limiter cleanup (memory leak prevention)
 */

import {
  checkRateLimit,
  extractRouteKey,
} from "@/lib/auth/rate-limiter";
import { toMonthKey, formatMonthLabel } from "@/lib/hooks/use-budgets";

// ─── Budget months dedup (Problema 5) ───────────────────────────

describe("Budget months dedup logic (Auditoria Problema 5)", () => {
  it("deduplica meses repetidos em order preservada", () => {
    const rawData = [
      { month: "2026-03-01" },
      { month: "2026-03-01" },
      { month: "2026-03-01" },
      { month: "2026-02-01" },
      { month: "2026-02-01" },
      { month: "2026-01-01" },
    ];
    const unique = Array.from(new Set(rawData.map((b) => b.month)));
    expect(unique).toEqual(["2026-03-01", "2026-02-01", "2026-01-01"]);
  });

  it("payload de 500 rows com ~40 categorias x 12 meses deduplicam para 12", () => {
    const months: string[] = [];
    for (let m = 1; m <= 12; m++) {
      const monthStr = `2025-${String(m).padStart(2, "0")}-01`;
      // Simular ~40 categorias por mês
      for (let c = 0; c < 40; c++) {
        months.push(monthStr);
      }
    }
    expect(months).toHaveLength(480);
    const unique = Array.from(new Set(months));
    expect(unique).toHaveLength(12);
  });

  it("array vazio retorna vazio", () => {
    const unique = Array.from(new Set(([] as { month: string }[]).map((b) => b.month)));
    expect(unique).toEqual([]);
  });

  it("um único mês retorna array com 1 elemento", () => {
    const rawData = [{ month: "2026-03-01" }];
    const unique = Array.from(new Set(rawData.map((b) => b.month)));
    expect(unique).toEqual(["2026-03-01"]);
  });
});

// ─── Budget helpers ─────────────────────────────────────────────

describe("toMonthKey helper", () => {
  it("gera primeiro dia do mês para data arbitrária", () => {
    const d = new Date(2026, 2, 18); // 18 março 2026
    expect(toMonthKey(d)).toBe("2026-03-01");
  });

  it("gera mês correto para janeiro (zero-based)", () => {
    const d = new Date(2026, 0, 15);
    expect(toMonthKey(d)).toBe("2026-01-01");
  });

  it("gera mês correto para dezembro", () => {
    const d = new Date(2026, 11, 31);
    expect(toMonthKey(d)).toBe("2026-12-01");
  });

  it("sem argumento usa mês corrente (smoke test)", () => {
    const result = toMonthKey();
    expect(result).toMatch(/^\d{4}-\d{2}-01$/);
  });
});

describe("formatMonthLabel helper", () => {
  it("formata março 2026 em pt-BR", () => {
    const result = formatMonthLabel("2026-03-01");
    expect(result.toLowerCase()).toContain("mar");
    expect(result).toContain("2026");
  });

  it("formata dezembro 2025", () => {
    const result = formatMonthLabel("2025-12-01");
    expect(result.toLowerCase()).toContain("dez");
    expect(result).toContain("2025");
  });
});

// ─── Rate limiter: cleanup e memory (complementa rate-limiter.test.ts) ──

describe("Rate limiter: edge cases de auditoria", () => {
  it("1000 IPs diferentes não causam crash", () => {
    // Simula cenário de produção com muitos IPs únicos
    for (let i = 0; i < 1000; i++) {
      const ip = `172.16.${Math.floor(i / 256)}.${i % 256}`;
      const result = checkRateLimit("login", ip);
      expect(result.allowed).toBe(true);
    }
  });

  it("rota inexistente usa config padrão (10 tentativas)", () => {
    const ip = "192.168.100.1";
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit("nonexistent", ip);
      expect(result.allowed).toBe(true);
    }
    const result = checkRateLimit("nonexistent", ip);
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(10);
  });

  it("extractRouteKey mapeia /api/auth/login e /api/auth/register corretamente", () => {
    // Estas rotas NÃO são protegidas pelo rate limiter (são API routes, não pages)
    // O rate limiter protege /login, /register, etc.
    expect(extractRouteKey("/api/auth/login")).toBeNull();
    expect(extractRouteKey("/login")).toBe("login");
    expect(extractRouteKey("/register")).toBe("register");
  });

  it("IPs com formatos variados são tratados como strings distintas", () => {
    const r1 = checkRateLimit("login", "10.0.0.100");
    const r2 = checkRateLimit("login", "10.0.0.100:8080"); // com porta
    const r3 = checkRateLimit("login", "::ffff:10.0.0.100"); // IPv6-mapped

    // Todos devem ser permitidos (IPs distintos como chave)
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
  });

  it("retryAfterMs é positivo quando bloqueado", () => {
    const ip = "10.99.99.1";
    // Esgotar o limite de forgot-password (3 tentativas)
    for (let i = 0; i < 3; i++) {
      checkRateLimit("forgot-password", ip);
    }
    const blocked = checkRateLimit("forgot-password", ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    // retryAfter deve ser <= windowMs (60 min para forgot-password)
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(60 * 60 * 1000);
  });
});

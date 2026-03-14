import { checkRateLimit, extractRouteKey, rateLimitHeaders } from "@/lib/auth/rate-limiter";

describe("rate-limiter", () => {
  describe("checkRateLimit", () => {
    // Cada teste usa um IP diferente para evitar contaminação cross-test
    it("permite a primeira tentativa", () => {
      const result = checkRateLimit("login", "10.0.0.1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // login: 5 max, 1 usada
      expect(result.retryAfterMs).toBe(0);
    });

    it("bloqueia após exceder o limite de login (5 tentativas)", () => {
      const ip = "10.0.0.2";
      for (let i = 0; i < 5; i++) {
        checkRateLimit("login", ip);
      }
      const result = checkRateLimit("login", ip);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it("bloqueia após exceder o limite de register (3 tentativas)", () => {
      const ip = "10.0.0.3";
      for (let i = 0; i < 3; i++) {
        checkRateLimit("register", ip);
      }
      const result = checkRateLimit("register", ip);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("isola contagens entre rotas diferentes", () => {
      const ip = "10.0.0.4";
      for (let i = 0; i < 5; i++) {
        checkRateLimit("login", ip);
      }
      // login: 5 de 5 usadas (esgotado), register: 0 de 3 usadas
      const loginResult = checkRateLimit("login", ip);
      expect(loginResult.allowed).toBe(false); // 6a tentativa bloqueada

      const registerResult = checkRateLimit("register", ip);
      expect(registerResult.allowed).toBe(true);
    });

    it("isola contagens entre IPs diferentes", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("login", "10.0.0.5");
      }
      // IP 10.0.0.5 bloqueado, 10.0.0.6 livre
      const blocked = checkRateLimit("login", "10.0.0.5");
      expect(blocked.allowed).toBe(false);

      const free = checkRateLimit("login", "10.0.0.6");
      expect(free.allowed).toBe(true);
    });

    it("usa config padrão para rota desconhecida", () => {
      const ip = "10.0.0.7";
      const result = checkRateLimit("unknown-route", ip);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10); // DEFAULT_CONFIG.maxAttempts
    });

    it("retorna remaining decrementando corretamente", () => {
      const ip = "10.0.0.8";
      const r1 = checkRateLimit("forgot-password", ip); // max 3
      expect(r1.remaining).toBe(2);
      const r2 = checkRateLimit("forgot-password", ip);
      expect(r2.remaining).toBe(1);
      const r3 = checkRateLimit("forgot-password", ip);
      expect(r3.remaining).toBe(0);
      const r4 = checkRateLimit("forgot-password", ip);
      expect(r4.allowed).toBe(false);
    });
  });

  describe("extractRouteKey", () => {
    it("extrai rota de login", () => {
      expect(extractRouteKey("/login")).toBe("login");
    });

    it("extrai rota de register", () => {
      expect(extractRouteKey("/register")).toBe("register");
    });

    it("extrai rota de forgot-password", () => {
      expect(extractRouteKey("/forgot-password")).toBe("forgot-password");
    });

    it("extrai rota com subrota", () => {
      expect(extractRouteKey("/login/callback")).toBe("login");
    });

    it("retorna null para rota desconhecida", () => {
      expect(extractRouteKey("/dashboard")).toBeNull();
    });

    it("retorna null para rota raiz", () => {
      expect(extractRouteKey("/")).toBeNull();
    });
  });

  describe("rateLimitHeaders", () => {
    it("gera headers para requisição permitida", () => {
      const headers = rateLimitHeaders({
        allowed: true,
        remaining: 4,
        retryAfterMs: 0,
        limit: 5,
      });
      expect(headers["X-RateLimit-Limit"]).toBe("5");
      expect(headers["X-RateLimit-Remaining"]).toBe("4");
      expect(headers["Retry-After"]).toBeUndefined();
    });

    it("gera headers com Retry-After para requisição bloqueada", () => {
      const headers = rateLimitHeaders({
        allowed: false,
        remaining: 0,
        retryAfterMs: 60000,
        limit: 5,
      });
      expect(headers["X-RateLimit-Limit"]).toBe("5");
      expect(headers["X-RateLimit-Remaining"]).toBe("0");
      expect(headers["Retry-After"]).toBe("60");
    });
  });
});

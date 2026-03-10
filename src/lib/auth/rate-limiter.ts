/**
 * WealthOS - Rate Limiter (Edge-compatible)
 *
 * Rate limiter in-memory para rotas de autenticação.
 * Protege contra brute-force em login, register e reset-password.
 *
 * Limitações conhecidas:
 * - In-memory: não compartilha estado entre instâncias serverless
 *   (aceitável para free tier Vercel com poucas instâncias)
 * - Para produção multi-região, migrar para Upstash Redis ou Vercel KV
 *
 * Ref: Auditoria de segurança - Achado 2 (Rate Limiting inexistente)
 */

interface RateLimitEntry {
  /** Timestamps das tentativas dentro da janela */
  timestamps: number[];
}

interface RateLimitConfig {
  /** Máximo de tentativas na janela */
  maxAttempts: number;
  /** Janela em milissegundos */
  windowMs: number;
}

// Configurações por tipo de rota
const ROUTE_CONFIGS: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },          // 5 tentativas / 15 min
  register: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },       // 3 tentativas / 1 hora
  "forgot-password": { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 tentativas / 1 hora
  "reset-password": { maxAttempts: 5, windowMs: 60 * 60 * 1000 },  // 5 tentativas / 1 hora
};

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
};

// Store: Map<"route:ip", RateLimitEntry>
const store = new Map<string, RateLimitEntry>();

// Limpeza periódica de entries expiradas (evita memory leak)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 min
let lastCleanup = Date.now();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const maxWindow = Math.max(...Object.values(ROUTE_CONFIGS).map((c) => c.windowMs));
  store.forEach((entry, key) => {
    // Remove entries cujo timestamp mais recente é mais velho que a maior janela
    const latest = entry.timestamps[entry.timestamps.length - 1] ?? 0;
    if (now - latest > maxWindow) {
      store.delete(key);
    }
  });
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  limit: number;
}

/**
 * Verifica e registra uma tentativa de acesso.
 *
 * @param route - Identificador da rota (ex: "login", "register")
 * @param identifier - Identificador do cliente (IP ou fingerprint)
 * @returns Resultado com status e headers para resposta HTTP
 */
export function checkRateLimit(
  route: string,
  identifier: string
): RateLimitResult {
  cleanupExpiredEntries();

  const config = ROUTE_CONFIGS[route] ?? DEFAULT_CONFIG;
  const key = `${route}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Busca ou cria entry
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove tentativas fora da janela
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  // Verifica limite
  if (entry.timestamps.length >= config.maxAttempts) {
    const oldestInWindow = entry.timestamps[0] ?? now;
    const retryAfterMs = oldestInWindow + config.windowMs - now;

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, retryAfterMs),
      limit: config.maxAttempts,
    };
  }

  // Registra tentativa
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.timestamps.length,
    retryAfterMs: 0,
    limit: config.maxAttempts,
  };
}

/**
 * Extrai o identificador da rota a partir do pathname.
 * Ex: "/login" → "login", "/forgot-password" → "forgot-password"
 */
export function extractRouteKey(pathname: string): string | null {
  const routeKeys = Object.keys(ROUTE_CONFIGS);
  for (const key of routeKeys) {
    if (pathname === `/${key}` || pathname.startsWith(`/${key}/`)) {
      return key;
    }
  }
  return null;
}

/**
 * Gera headers HTTP padrão de rate limiting (RFC 6585 / draft-ietf-httpapi-ratelimit-headers).
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(Math.ceil(result.retryAfterMs / 1000));
  }

  return headers;
}

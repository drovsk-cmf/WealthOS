import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/auth/rate-limiter";

/**
 * POST /api/auth/login
 *
 * Q3: Server-side login proxy.
 * Applies rate limiting that actually works (unlike middleware which
 * can't intercept direct SDK calls to GoTrue).
 *
 * Rate limit: 5 attempts / 15 min per IP (same as middleware config).
 */
export async function POST(request: NextRequest) {
  // ── Rate limiting ──
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const rlResult = checkRateLimit("login", ip);

  if (!rlResult.allowed) {
    return NextResponse.json(
      {
        error: "Muitas tentativas. Aguarde antes de tentar novamente.",
        retryAfterSeconds: Math.ceil(rlResult.retryAfterMs / 1000),
      },
      { status: 429, headers: rateLimitHeaders(rlResult) }
    );
  }

  // ── Parse body ──
  let email: string;
  let password: string;

  try {
    const body = await request.json();
    email = body.email;
    password = body.password;
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email e senha são obrigatórios." },
      { status: 400 }
    );
  }

  // ── Sign in via server client (sets cookies on response) ──
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const message =
      error.message === "Invalid login credentials"
        ? "Email ou senha incorretos."
        : error.message;

    return NextResponse.json(
      { error: message },
      { status: 401, headers: rateLimitHeaders(rlResult) }
    );
  }

  // ── Success: return user info (session cookies set automatically) ──
  return NextResponse.json(
    {
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    },
    { status: 200, headers: rateLimitHeaders(rlResult) }
  );
}

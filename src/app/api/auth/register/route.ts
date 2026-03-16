import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/auth/rate-limiter";
import { registerSchema } from "@/lib/validations/auth";

/**
 * POST /api/auth/register
 *
 * D1.02: Server-side register proxy with rate limiting.
 * Prevents direct SDK calls from bypassing rate limits.
 *
 * Rate limit: 3 attempts / 15 min per IP.
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const rlResult = checkRateLimit("register", ip);

  if (!rlResult.allowed) {
    return NextResponse.json(
      {
        error: "Muitas tentativas. Aguarde antes de tentar novamente.",
        retryAfterSeconds: Math.ceil(rlResult.retryAfterMs / 1000),
      },
      { status: 429, headers: rateLimitHeaders(rlResult) }
    );
  }

  let fullName: string;
  let email: string;
  let password: string;

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Verifique os campos e tente novamente." },
        { status: 400 }
      );
    }
    fullName = parsed.data.fullName;
    email = parsed.data.email;
    password = parsed.data.password;
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${request.nextUrl.origin}/api/auth/callback`,
    },
  });

  if (error) {
    // D1.08: Generic message - never leak Supabase error details
    return NextResponse.json(
      { error: "Não foi possível criar a conta. Tente novamente." },
      { status: 400, headers: rateLimitHeaders(rlResult) }
    );
  }

  return NextResponse.json(
    { message: "Verifique seu email para confirmar o cadastro." },
    { status: 200, headers: rateLimitHeaders(rlResult) }
  );
}

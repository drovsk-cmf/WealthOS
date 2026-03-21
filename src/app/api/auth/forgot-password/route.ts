import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/auth/rate-limiter";
import { z } from "zod";
import { verifyTurnstile } from "@/lib/auth/turnstile";

const forgotSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/auth/forgot-password
 *
 * D1.02: Server-side forgot-password proxy with rate limiting.
 * Rate limit: 3 attempts / 15 min per IP.
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const rlResult = checkRateLimit("forgot-password", ip);

  if (!rlResult.allowed) {
    return NextResponse.json(
      {
        error: "Muitas tentativas. Aguarde antes de tentar novamente.",
        retryAfterSeconds: Math.ceil(rlResult.retryAfterMs / 1000),
      },
      { status: 429, headers: rateLimitHeaders(rlResult) }
    );
  }

  let email: string;

  try {
    const body = await request.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Email inválido." },
        { status: 400 }
      );
    }
    email = parsed.data.email;

    const turnstileOk = await verifyTurnstile(body.turnstile_token ?? "");
    if (!turnstileOk) {
      return NextResponse.json({ error: "Verificação CAPTCHA falhou." }, { status: 403 });
    }
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Always return success to prevent email enumeration (D1.08)
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${request.nextUrl.origin}/reset-password`,
  });

  return NextResponse.json(
    { message: "Se o email estiver cadastrado, você receberá um link de redefinição." },
    { status: 200, headers: rateLimitHeaders(rlResult) }
  );
}

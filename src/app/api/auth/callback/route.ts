import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeRedirectTo } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { CookieOptions } from "@supabase/ssr";

/**
 * Auth callback handler.
 *
 * Handles:
 * 1. OAuth login (Google, Apple) - exchanges code for session
 * 2. Email confirmation - token_hash + type=signup/email
 * 3. Password reset - token_hash + type=recovery
 *
 * Post-auth routing:
 * - New user (onboarding not completed) → /onboarding
 * - MFA enrolled (needs AAL2) → /mfa-challenge
 * - Existing user (onboarding done) → /dashboard
 *
 * NOTA — Next.js 15 + @supabase/ssr cookie fix:
 * cookies().set() via next/headers modifica a resposta IMPLÍCITA do Next.js.
 * NextResponse.redirect() cria um objeto de resposta NOVO e independente.
 * As duas superfícies não se mesclam automaticamente no Next.js 15, então os
 * cookies de sessão não chegam ao browser no redirect.
 *
 * Solução: acumular os cookies que o Supabase quer gravar em um array local
 * e aplicá-los diretamente no NextResponse que será retornado.
 *
 * Referência: https://github.com/supabase/auth-helpers/issues/451
 */

function redirect(url: string, cookies: Array<{ name: string; value: string; options: CookieOptions }>) {
  const response = NextResponse.redirect(url);
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const redirectTo = sanitizeRedirectTo(searchParams.get("redirectTo"));

  // Acumula os cookies que o Supabase quer gravar.
  // Aplicados diretamente no NextResponse para garantir que chegam ao browser.
  const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = [];

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options: options ?? {} });
          });
        },
      },
    }
  );

  // ─── Email confirmation / password reset (magic link) ─────
  const VALID_OTP_TYPES = ["signup", "email", "recovery", "invite"] as const;
  type OtpType = (typeof VALID_OTP_TYPES)[number];

  if (tokenHash && type) {
    if (!VALID_OTP_TYPES.includes(type as OtpType)) {
      return redirect(`${origin}/login?reason=auth_callback_failed`, pendingCookies);
    }

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as OtpType,
    });

    if (error) {
      return redirect(`${origin}/login?reason=auth_callback_failed`, pendingCookies);
    }

    // Password reset flow
    if (type === "recovery") {
      return redirect(`${origin}/reset-password`, pendingCookies);
    }

    // Email confirmation: check onboarding status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("users_profile")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profile && !profile.onboarding_completed) {
        return redirect(`${origin}/onboarding`, pendingCookies);
      }
    }

    return redirect(`${origin}${redirectTo}`, pendingCookies);
  }

  // ─── OAuth code exchange ─────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check onboarding status
        const { data: profile } = await supabase
          .from("users_profile")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        if (profile && !profile.onboarding_completed) {
          return redirect(`${origin}/onboarding`, pendingCookies);
        }

        // Check MFA enrollment for AAL2 redirect
        const { data: mfaData } = await supabase.auth.mfa.listFactors();

        const verifiedFactor = mfaData?.totp?.find(
          (f) => f.status === "verified"
        );

        if (verifiedFactor) {
          return redirect(
            `${origin}/mfa-challenge?redirectTo=${encodeURIComponent(redirectTo)}&factorId=${verifiedFactor.id}`,
            pendingCookies
          );
        }
      }

      return redirect(`${origin}${redirectTo}`, pendingCookies);
    }
  }

  // Auth error
  return redirect(`${origin}/login?reason=auth_callback_failed`, pendingCookies);
}

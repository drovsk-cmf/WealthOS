import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const rawRedirect = searchParams.get("redirectTo") || "/dashboard";
  const redirectTo = rawRedirect === "/" ? "/dashboard" : rawRedirect;

  const supabase = await createClient();

  // ─── Email confirmation / password reset (magic link) ─────
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "email" | "recovery" | "invite",
    });

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }

    // Password reset flow: redirect to reset-password page
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/reset-password`);
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
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }

    return NextResponse.redirect(`${origin}${redirectTo}`);
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
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // Check MFA enrollment for AAL2 redirect
        // (client-side login page handles this for email/password,
        //  but OAuth goes through callback so we check here)
        const { data: mfaData } =
          await supabase.auth.mfa.listFactors();

        const verifiedFactor = mfaData?.totp?.find(
          (f) => f.status === "verified"
        );

        if (verifiedFactor) {
          // MFA enrolled - redirect to challenge
          return NextResponse.redirect(
            `${origin}/mfa-challenge?redirectTo=${encodeURIComponent(redirectTo)}&factorId=${verifiedFactor.id}`
          );
        }
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Auth error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

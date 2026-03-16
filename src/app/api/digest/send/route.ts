import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { timingSafeCompare } from "@/lib/auth/timing-safe";
import {
  buildWeeklyDigestHtml,
  type WeeklyDigestData,
} from "@/lib/email/weekly-digest-template";

/**
 * POST /api/digest/send
 *
 * UX-H3-03: Weekly digest email.
 * Called by external scheduler (e.g. pg_cron via pg_net, or Vercel cron)
 * every Monday at 11:00 UTC (8:00 BRT).
 *
 * Auth: DIGEST_CRON_SECRET header (prevents unauthorized access).
 * Uses admin client (elevated privileges) to access all users.
 * If RESEND_API_KEY is not set, returns preview data without sending.
 */
export async function POST(request: Request) {
  // ── Auth check ──
  const cronSecret = process.env.DIGEST_CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "Erro de configuração do servidor" },
      { status: 500 }
    );
  }
  const authHeader = request.headers.get("x-cron-secret");
  if (!authHeader || !timingSafeCompare(authHeader, cronSecret)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Admin client (bypasses RLS, required for cron context)
  const supabase = createAdminClient();

  // ── Fetch all users with onboarding complete ──
  const { data: users, error: usersError } = await supabase
    .from("users_profile")
    .select("id, full_name")
    .eq("onboarding_completed", true);

  if (usersError || !users) {
    console.error("[digest/send] Falha ao buscar usuários:", usersError?.message);
    return NextResponse.json(
      { error: "Erro ao buscar usuários." },
      { status: 500 }
    );
  }

  const results: { user_id: string; status: string; error?: string }[] = [];

  for (const user of users) {
    try {
      // Fetch digest data (SECURITY DEFINER RPC, works with admin client)
      const { data: digest, error: digestError } = await supabase.rpc(
        "get_weekly_digest",
        { p_user_id: user.id }
      );

      if (digestError || !digest) {
        results.push({
          user_id: user.id,
          status: "error",
          error: digestError?.message || "No data",
        });
        continue;
      }

      const digestData = digest as unknown as Omit<WeeklyDigestData, "user_name">;

      // Skip if no activity this week
      if (digestData.transaction_count === 0) {
        results.push({ user_id: user.id, status: "skipped_no_activity" });
        continue;
      }

      const html = buildWeeklyDigestHtml({
        ...digestData,
        user_name: user.full_name || "Usuário",
      });

      // ── Send email (if Resend key is configured) ──
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const { data: authData } = await supabase.auth.admin.getUserById(
          user.id
        );

        if (!authData?.user?.email) {
          results.push({
            user_id: user.id,
            status: "error",
            error: "No email found",
          });
          continue;
        }

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Oniefy <noreply@oniefy.com>",
            to: authData.user.email,
            subject: `Resumo semanal - ${formatDateRange(
              digestData.week_start,
              digestData.week_end
            )}`,
            html,
          }),
        });

        if (!emailRes.ok) {
          const errBody = await emailRes.text();
          results.push({
            user_id: user.id,
            status: "send_error",
            error: errBody,
          });
        } else {
          results.push({ user_id: user.id, status: "sent" });
        }
      } else {
        results.push({ user_id: user.id, status: "preview_only" });
      }
    } catch (err) {
      results.push({
        user_id: user.id,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown",
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  return `${s.toLocaleDateString("pt-BR", opts)} a ${e.toLocaleDateString("pt-BR", opts)}`;
}

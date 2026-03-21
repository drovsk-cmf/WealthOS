import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { timingSafeCompare } from "@/lib/auth/timing-safe";
import webpush from "web-push";

/**
 * POST /api/push/send
 *
 * Sends push notifications for upcoming/overdue bills.
 * Called by cron (Vercel Cron or external scheduler).
 * Protected by CRON_SECRET header.
 *
 * Notification types:
 * 1. Bills due today
 * 2. Bills overdue (missed payment)
 * 3. Bills due in 3 days (heads-up)
 */

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? "mailto:admin@oniefy.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function POST(request: NextRequest) {
  // Auth: verify cron secret (fail-closed: block if not configured)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${cronSecret}`;
  if (!authHeader || !timingSafeCompare(authHeader, expected)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return NextResponse.json({ error: "Missing VAPID configuration" }, { status: 500 });
  }

  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];
    const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];

    // Find pending/overdue transactions with due dates
    const { data: dueBills, error: billsError } = await supabase
      .from("transactions")
      .select("user_id, description, amount, date, payment_status")
      .eq("is_deleted", false)
      .eq("is_paid", false)
      .in("payment_status", ["pending", "overdue"])
      .lte("date", in3Days)
      .order("date", { ascending: true });

    if (billsError) throw billsError;
    if (!dueBills || dueBills.length === 0) {
      return NextResponse.json({ sent: 0, reason: "no_due_bills" });
    }

    // Group by user_id
    const byUser = new Map<string, typeof dueBills>();
    for (const bill of dueBills) {
      if (!byUser.has(bill.user_id)) byUser.set(bill.user_id, []);
      byUser.get(bill.user_id)!.push(bill);
    }

    let totalSent = 0;
    let totalErrors = 0;

    for (const [userId, bills] of byUser) {
      // Get user's web push tokens
      const { data: tokens } = await supabase
        .from("notification_tokens")
        .select("device_token, subscription_data")
        .eq("user_id", userId)
        .eq("platform", "web")
        .eq("is_active", true);

      if (!tokens || tokens.length === 0) continue;

      // Build notification
      const overdue = bills.filter(b => b.date < today);
      const dueToday = bills.filter(b => b.date === today);
      const upcoming = bills.filter(b => b.date > today && b.date <= in3Days);

      let body = "";
      if (overdue.length > 0) {
        const total = overdue.reduce((s, b) => s + b.amount, 0);
        body += `${overdue.length} conta(s) vencida(s) (R$ ${total.toFixed(2).replace(".", ",")}). `;
      }
      if (dueToday.length > 0) {
        const total = dueToday.reduce((s, b) => s + b.amount, 0);
        body += `${dueToday.length} conta(s) vence(m) hoje (R$ ${total.toFixed(2).replace(".", ",")}). `;
      }
      if (upcoming.length > 0) {
        body += `${upcoming.length} conta(s) nos próximos 3 dias.`;
      }

      if (!body) continue;

      const payload = JSON.stringify({
        title: overdue.length > 0 ? "Contas vencidas" : "Contas a pagar",
        body: body.trim(),
        tag: "due-bills",
        url: "/bills",
      });

      // Send to all user's devices
      for (const token of tokens) {
        const sub = token.subscription_data as Record<string, unknown> | null;
        if (!sub?.endpoint) continue;

        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint as string,
              keys: (sub.keys ?? {}) as { p256dh: string; auth: string },
            },
            payload
          );
          totalSent++;
        } catch (err: unknown) {
          const pushErr = err as { statusCode?: number };
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            await supabase.from("notification_tokens")
              .update({ is_active: false })
              .eq("device_token", token.device_token);
          }
          totalErrors++;
        }
      }

      // Log notification
      await supabase.from("notification_log").insert({
        user_id: userId,
        type: "bill_due",
        title: overdue.length > 0 ? "Contas vencidas" : "Contas a pagar",
        body: body.trim(),
        status: "sent",
      }).then(() => {}, (err: unknown) => {
        console.error("[Oniefy] notification_log insert failed:", (err as Error)?.message);
      }); // fire-and-forget
    }

    // ── UX-H2-02: Inactivity trigger (7+ days without transaction) ──
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const { data: allUsers } = await supabase
      .from("users_profile")
      .select("id");

    if (allUsers) {
      for (const u of allUsers) {
        // Skip users already notified above (have due bills)
        if (byUser.has(u.id)) continue;

        const { count } = await supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", u.id)
          .eq("is_deleted", false)
          .gte("created_at", sevenDaysAgo);

        if ((count ?? 0) === 0) {
          const { data: tokens } = await supabase
            .from("notification_tokens")
            .select("device_token, subscription_data")
            .eq("user_id", u.id)
            .eq("is_active", true);

          if (tokens && tokens.length > 0) {
            for (const token of tokens) {
              const sub = token.subscription_data as Record<string, unknown> | null;
              if (!sub?.endpoint) continue;
              try {
                await webpush.sendNotification(
                  {
                    endpoint: sub.endpoint as string,
                    keys: (sub.keys ?? {}) as { p256dh: string; auth: string },
                  },
                  JSON.stringify({
                    title: "Oniefy sente sua falta",
                    body: "Faz uma semana sem lançamentos. Registrar suas despesas leva menos de 10 segundos.",
                    url: "/transactions",
                  })
                );
                totalSent++;
              } catch {
                totalErrors++;
              }
            }

            await supabase.from("notification_log").insert({
              user_id: u.id,
              type: "inactivity",
              title: "Oniefy sente sua falta",
              body: "7+ dias sem lançamentos",
              status: "sent",
            }).then(() => {}, () => {});
          }
        }
      }
    }

    return NextResponse.json({ sent: totalSent, errors: totalErrors, users: byUser.size });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

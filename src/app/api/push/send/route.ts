import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
const CRON_SECRET = process.env.CRON_SECRET ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function POST(request: NextRequest) {
  // Auth: verify cron secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Missing configuration" }, { status: 500 });
  }

  try {
    // Use service role (server-side, no user context)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
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
        type: "due_bill",
        title: overdue.length > 0 ? "Contas vencidas" : "Contas a pagar",
        body: body.trim(),
        status: "sent",
      }).then(() => {}, () => {}); // fire-and-forget
    }

    return NextResponse.json({ sent: totalSent, errors: totalErrors, users: byUser.size });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? "mailto:admin@oniefy.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return NextResponse.json({ error: "VAPID keys não configuradas" }, { status: 500 });
    }

    // Get user's web push subscriptions
    const { data: tokens, error } = await supabase
      .from("notification_tokens")
      .select("device_token, subscription_data")
      .eq("user_id", user.id)
      .eq("platform", "web")
      .eq("is_active", true);

    if (error) throw error;
    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ error: "Nenhuma inscrição push ativa" }, { status: 404 });
    }

    const payload = JSON.stringify({
      title: "Oniefy",
      body: "Notificação de teste. Push está funcionando!",
      tag: "test",
      url: "/dashboard",
    });

    let sent = 0;
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
        sent++;
      } catch (err: unknown) {
        // If subscription expired, deactivate it
        const pushErr = err as { statusCode?: number };
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          await supabase.from("notification_tokens")
            .update({ is_active: false })
            .eq("device_token", token.device_token);
        }
      }
    }

    return NextResponse.json({ sent });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

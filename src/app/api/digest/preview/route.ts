import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  buildWeeklyDigestHtml,
  type WeeklyDigestData,
} from "@/lib/email/weekly-digest-template";

/**
 * GET /api/digest/preview
 *
 * Returns the weekly digest email as rendered HTML.
 * For visual testing only. Requires authenticated session.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: digest, error } = await supabase.rpc("get_weekly_digest", {
    p_user_id: user.id,
  });

  if (error || !digest) {
    return NextResponse.json(
      { error: error?.message || "No digest data" },
      { status: 500 }
    );
  }

  const digestData = digest as unknown as Omit<WeeklyDigestData, "user_name">;

  const html = buildWeeklyDigestHtml({
    ...digestData,
    user_name: profile?.full_name || "Usuário",
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

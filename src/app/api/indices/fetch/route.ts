/**
 * Oniefy - API Route: Fetch Economic Indices
 *
 * POST /api/indices/fetch
 *
 * Fetches latest data from BCB SGS API for configured index sources,
 * parses the response, and upserts into economic_indices table.
 *
 * Called manually from the UI or by a cron job (future).
 * Uses admin client for writes (bypasses RLS on public tables).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

interface BcbDataPoint {
  data: string; // DD/MM/YYYY
  valor: string;
}

interface IndexSource {
  index_type: string;
  provider: string;
  series_code: string;
  api_url_template: string;
  periodicity: string;
  is_active: boolean;
}

// Allowlist of hostnames permitted for external data fetches.
// Currently only BCB SGS is active. Add hosts here when new providers are enabled.
const ALLOWED_HOSTS = ["api.bcb.gov.br"];

function parseBcbDate(dateStr: string): string {
  // DD/MM/YYYY → YYYY-MM-DD
  const [d, m, y] = dateStr.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function formatDateForBcb(date: Date): string {
  // Date → DD/MM/YYYY
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export async function POST() {
  try {
    // Auth check with regular client
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin client for write operations (bypasses RLS on economic_indices)
    const adminClient = createAdminClient();

    // Fetch active sources (read via admin - sources have no user-scoped RLS)
    const { data: sources, error: srcErr } = await adminClient
      .from("economic_indices_sources")
      .select("*")
      .eq("is_active", true)
      .eq("provider", "bcb_sgs")
      .order("priority", { ascending: true });

    if (srcErr) throw srcErr;

    // Date range: last 3 months to catch any gaps
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    const results: { index_type: string; inserted: number; errors: string[] }[] = [];

    for (const source of (sources as IndexSource[]) ?? []) {
      const fetchResult = { index_type: source.index_type, inserted: 0, errors: [] as string[] };

      try {
        // Build URL
        const url = source.api_url_template
          .replace("{start}", formatDateForBcb(startDate))
          .replace("{end}", formatDateForBcb(endDate));

        // SSRF protection: only allow fetches to known API hosts
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(url);
        } catch {
          fetchResult.errors.push(`URL inválida: ${url}`);
          results.push(fetchResult);
          continue;
        }
        if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
          fetchResult.errors.push(`Host não permitido: ${parsedUrl.hostname}`);
          results.push(fetchResult);
          continue;
        }

        const response = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          fetchResult.errors.push(`HTTP ${response.status}`);
          results.push(fetchResult);
          continue;
        }

        let data: BcbDataPoint[];
        try {
          data = await response.json();
        } catch {
          fetchResult.errors.push("Resposta não é JSON válido");
          results.push(fetchResult);
          continue;
        }

        if (!Array.isArray(data) || data.length === 0) {
          fetchResult.errors.push("Empty response");
          results.push(fetchResult);
          continue;
        }

        // For daily series (selic, cdi, usd_brl), keep only last day of month
        let filteredData = data;
        if (source.periodicity === "daily") {
          const monthMap = new Map<string, BcbDataPoint>();
          for (const point of data) {
            const isoDate = parseBcbDate(point.data);
            const monthKey = isoDate.slice(0, 7); // YYYY-MM
            monthMap.set(monthKey, point); // Last value wins
          }
          filteredData = Array.from(monthMap.values());
        }

        // Build batch of rows for upsert
        const now = new Date().toISOString();
        const rows = filteredData
          .map((point) => {
            const isoDate = parseBcbDate(point.data);
            const value = parseFloat(point.valor);
            if (isNaN(value)) return null;
            // Normalize all dates to first of month for storage
            const refDate = isoDate.slice(0, 8) + "01";
            return {
              index_type: source.index_type as Database["public"]["Enums"]["index_type"],
              reference_date: refDate,
              value,
              source_primary: `BCB SGS ${source.series_code}`,
              fetched_at: now,
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);

        if (rows.length > 0) {
          const { error: upsertErr } = await adminClient
            .from("economic_indices")
            .upsert(rows, { onConflict: "index_type,reference_date", ignoreDuplicates: false });

          if (upsertErr) {
            fetchResult.errors.push(`Upsert falhou: ${upsertErr.message}`);
          } else {
            fetchResult.inserted = rows.length;
          }
        }
      } catch (err) {
        fetchResult.errors.push(
          err instanceof Error ? err.message : "Unknown error"
        );
      }

      results.push(fetchResult);
    }

    return NextResponse.json({
      status: "ok",
      fetched_at: new Date().toISOString(),
      results,
      total_inserted: results.reduce((s, r) => s + r.inserted, 0),
    });
  } catch (err) {
    console.error("[indices/fetch] Internal error:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar índices." },
      { status: 500 }
    );
  }
}

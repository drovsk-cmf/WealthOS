"use client";

/**
 * UX-H3-04: Dashboard interno de métricas (/settings/analytics)
 *
 * Shows:
 * 1. Retention metrics (D1/D7/D30 from get_retention_metrics RPC)
 * 2. Event counts by name (last 30 days)
 * 3. Data volume summary
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useProgressiveDisclosure } from "@/lib/hooks/use-progressive-disclosure";

interface RetentionData {
  total_users: number;
  d1_returned: number;
  d1_rate: number;
  d7_returned: number;
  d7_rate: number;
  d30_returned: number;
  d30_rate: number;
}

interface EventCount {
  event_name: string;
  count: number;
}

function useRetentionMetrics() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["analytics", "retention"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<RetentionData | null> => {
      const { data, error } = await supabase.rpc("get_retention_metrics");
      if (error) throw error;
      return data as RetentionData | null;
    },
  });
}

function useEventCounts() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["analytics", "events"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<EventCount[]> => {
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await supabase
        .from("analytics_events")
        .select("event_name")
        .gte("created_at", thirtyDaysAgo);

      if (error) throw error;
      if (!data) return [];

      // Count by event_name
      const counts = new Map<string, number>();
      for (const row of data) {
        counts.set(row.event_name, (counts.get(row.event_name) ?? 0) + 1);
      }

      return Array.from(counts.entries())
        .map(([event_name, count]) => ({ event_name, count }))
        .sort((a, b) => b.count - a.count);
    },
  });
}

function MetricCard({
  label,
  value,
  target,
  format = "number",
}: {
  label: string;
  value: number | undefined;
  target?: number;
  format?: "number" | "percent";
}) {
  const display =
    value === undefined
      ? "..."
      : format === "percent"
        ? `${(value * 100).toFixed(1)}%`
        : String(value);

  const targetMet = target !== undefined && value !== undefined && value >= target;

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{display}</p>
      {target !== undefined && (
        <p
          className={`mt-1 text-xs ${
            targetMet ? "text-verdant" : "text-burnished"
          }`}
        >
          Meta: {format === "percent" ? `${(target * 100).toFixed(0)}%` : target}
          {targetMet ? " ✓" : ""}
        </p>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const retention = useRetentionMetrics();
  const events = useEventCounts();
  const disclosure = useProgressiveDisclosure();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Métricas</h1>
        <p className="text-sm text-muted-foreground">
          Indicadores de uso e retenção (últimos 90 dias)
        </p>
      </div>

      {/* Retention metrics */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Retenção</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            label="Usuários (90d)"
            value={retention.data?.total_users}
          />
          <MetricCard
            label="D1"
            value={retention.data?.d1_rate}
            target={0.35}
            format="percent"
          />
          <MetricCard
            label="D7"
            value={retention.data?.d7_rate}
            target={0.20}
            format="percent"
          />
          <MetricCard
            label="D30"
            value={retention.data?.d30_rate}
            target={0.12}
            format="percent"
          />
        </div>
        {retention.isLoading && (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        )}
        {retention.error && (
          <p className="text-xs text-destructive">
            Erro ao carregar métricas de retenção.
          </p>
        )}
      </section>

      {/* Event counts */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Eventos (últimos 30 dias)</h2>
        {events.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : events.data && events.data.length > 0 ? (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th scope="col" className="px-4 py-2 text-left font-medium">Evento</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {events.data.map((e) => (
                  <tr key={e.event_name} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">
                      {e.event_name}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {e.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum evento registrado nos últimos 30 dias.
          </p>
        )}
      </section>

      {/* Data volume */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Volume de dados</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            label="Transações"
            value={disclosure.data?.totalTransactions}
          />
          <MetricCard
            label="Contas"
            value={disclosure.data?.totalAccounts}
          />
          <MetricCard
            label="Ativos"
            value={disclosure.data?.totalAssets}
          />
          <MetricCard
            label="Receitas"
            value={disclosure.data?.incomeTransactionCount}
          />
        </div>
      </section>
    </div>
  );
}

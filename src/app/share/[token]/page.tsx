"use client";

/**
 * E35: Public shared access page
 *
 * Displays read-only fiscal data for a user's accountant.
 * No authentication required — access controlled by token validity.
 * Token validated via validate_shared_token RPC (SECURITY DEFINER).
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Shield, Clock, FileText, AlertTriangle } from "lucide-react";

interface SharedData {
  valid: boolean;
  error?: string;
  scope?: string;
  expires_at?: string;
  user_name?: string;
  data?: {
    irpf_deductions: Array<{
      category_name: string;
      dirpf_group: string | null;
      total: number;
      count: number;
    }>;
    income_summary: Array<{
      category_name: string;
      total: number;
      count: number;
    }>;
    asset_summary: Array<{
      name: string;
      current_value: number;
      asset_type: string;
      acquisition_date: string | null;
    }>;
  };
}

function fmt(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function SharedAccessPage() {
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_ONIEFY_DB_URL!,
          process.env.NEXT_PUBLIC_ONIEFY_DB_KEY!,
        );

        const { data: result, error } = await supabase.rpc(
          "validate_shared_token",
          { p_token: params.token }
        );

        if (error) {
          setData({ valid: false, error: error.message });
        } else {
          setData(result as SharedData);
        }
      } catch (err) {
        setData({ valid: false, error: err instanceof Error ? err.message : "Erro" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Verificando acesso...</div>
      </div>
    );
  }

  if (!data?.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-sm rounded-lg border bg-card p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-burnished" />
          <h1 className="text-lg font-bold">Acesso indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data?.error ?? "Este link expirou ou foi revogado."}
          </p>
        </div>
      </div>
    );
  }

  const { irpf_deductions = [], income_summary = [], asset_summary = [] } = data.data ?? {};
  const totalDeductions = irpf_deductions.reduce((s, d) => s + d.total, 0);
  const totalIncome = income_summary.reduce((s, i) => s + i.total, 0);
  const totalAssets = asset_summary.reduce((s, a) => s + a.current_value, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-verdant" />
            <div>
              <h1 className="text-lg font-bold">Oniefy — Acesso Fiscal</h1>
              <p className="text-xs text-muted-foreground">
                Visualização somente leitura para {data.user_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Expira: {new Date(data.expires_at!).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Receitas (ano anterior)</p>
            <p className="mt-1 text-2xl font-bold">{fmt(totalIncome)}</p>
            <p className="text-xs text-muted-foreground">{income_summary.length} categorias</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deduções IRPF</p>
            <p className="mt-1 text-2xl font-bold text-verdant">{fmt(totalDeductions)}</p>
            <p className="text-xs text-muted-foreground">{irpf_deductions.length} categorias dedutíveis</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patrimônio</p>
            <p className="mt-1 text-2xl font-bold">{fmt(totalAssets)}</p>
            <p className="text-xs text-muted-foreground">{asset_summary.length} bens</p>
          </div>
        </div>

        {/* IRPF Deductions */}
        {irpf_deductions.length > 0 && (
          <section className="rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Deduções por Categoria</h2>
            </div>
            <div className="space-y-2">
              {irpf_deductions.map((d, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{d.category_name}</p>
                    {d.dirpf_group && (
                      <p className="text-xs text-muted-foreground">Grupo DIRPF: {d.dirpf_group}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fmt(d.total)}</p>
                    <p className="text-xs text-muted-foreground">{d.count} lançamentos</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Income Summary */}
        {income_summary.length > 0 && (
          <section className="rounded-lg border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold">Receitas por Categoria</h2>
            <div className="space-y-2">
              {income_summary.map((inc, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <p className="text-sm">{inc.category_name ?? "Sem categoria"}</p>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fmt(inc.total)}</p>
                    <p className="text-xs text-muted-foreground">{inc.count} lançamentos</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Assets */}
        {asset_summary.length > 0 && (
          <section className="rounded-lg border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold">Bens e Direitos</h2>
            <div className="space-y-2">
              {asset_summary.map((a, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.asset_type}{a.acquisition_date ? ` · Aquisição: ${new Date(a.acquisition_date).toLocaleDateString("pt-BR")}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{fmt(a.current_value)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground">
          Dados gerados pelo Oniefy. Uso exclusivo do destinatário. Não constitui declaração fiscal oficial.
        </p>
      </div>
    </div>
  );
}

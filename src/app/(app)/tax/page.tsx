"use client";

/**
 * Oniefy - Imposto de Renda (Phase 7)
 *
 * FIS-01: Rendimentos tributáveis (via tax_treatment automático)
 * FIS-02: Deduções (dedutivel_integral / dedutivel_limitado)
 * FIS-03: Bens e dívidas (consolidação do módulo Patrimônio)
 * FIS-04: Comprovantes (referência aos documentos)
 * FIS-05: Relatório anual consolidado (view, não input)
 * FIS-06: Navegação entre anos fiscais
 *
 * BONUS: Painel de Provisionamento de IR
 * Inteligência que calcula a projeção anual do IRPF baseada em múltiplas
 * fontes de renda, mostra o gap entre imposto estimado e IRRF retido,
 * e recomenda o valor mensal a provisionar.
 *
 * Cenário-chave: pessoa com 2 contratos CLT de R$5.000 cada.
 * Nenhum empregador retém IR isoladamente, mas a declaração anual consolida
 * R$120k de renda tributável e cobra o tributo inteiro de uma vez.
 */

import { useState } from "react";
import { FileSearch, Building, Landmark, Download } from "lucide-react";
import { toast } from "sonner";
import {
  useFiscalReport,
  useFiscalProjection,
  useTaxParameters,
  TAX_TREATMENT_LABELS,
  TAX_TREATMENT_COLORS,
} from "@/lib/hooks/use-fiscal";
import { useAssets, ASSET_CATEGORY_LABELS } from "@/lib/hooks/use-assets";
import { useAccounts, ACCOUNT_TYPE_LABELS } from "@/lib/hooks/use-accounts";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Mv } from "@/components/ui/masked-value";

const CURRENT_YEAR = new Date().getFullYear();

function provisionStatus(monthly: number): { label: string; color: string; bg: string } {
  if (monthly <= 0) return { label: "Sem imposto a provisionar", color: "text-verdant", bg: "bg-verdant/10" };
  if (monthly < 500) return { label: "Baixo", color: "text-burnished", bg: "bg-burnished/10" };
  if (monthly < 2000) return { label: "Moderado", color: "text-burnished", bg: "bg-burnished/10" };
  return { label: "Alto", color: "text-terracotta", bg: "bg-terracotta/10" };
}

export default function FiscalPage() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [exporting, setExporting] = useState(false);

  const { data: report, isLoading: loadingReport } = useFiscalReport(selectedYear);
  const { data: projection, isLoading: loadingProjection } = useFiscalProjection(selectedYear);
  const { data: parameters } = useTaxParameters();

  // FIS-03: Bens e Direitos + FIS-04: Dívidas e Ônus
  const { data: assets } = useAssets();
  const { data: accounts } = useAccounts();

  // Classify accounts for IRPF: assets (positive balance non-liability) vs liabilities (loan, financing, credit_card with balance)
  const assetAccounts = accounts?.filter(a => !["credit_card", "loan", "financing"].includes(a.type) && a.current_balance > 0) ?? [];
  const liabilityAccounts = accounts?.filter(a => ["credit_card", "loan", "financing"].includes(a.type) && a.current_balance !== 0) ?? [];

  const years = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

  const isLoading = loadingReport || loadingProjection;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const totals = report?.totals;
  const prov = projection;
  const provStatus = prov ? provisionStatus(prov.monthly_provision) : null;

  async function handleExport() {
    if (!report) return;
    setExporting(true);
    try {
      const { generateIRPFExport } = await import("@/lib/services/fiscal-export");
      const blob = await generateIRPFExport({
        year: selectedYear,
        report,
        projection: prov?.status ? null : (prov ?? null),
        assets: (assets ?? []).map((a) => ({
          name: a.name,
          category: a.category,
          acquisition_date: a.acquisition_date,
          acquisition_value: Number(a.acquisition_value),
          current_value: Number(a.current_value),
          currency: a.currency,
        })),
        debts: liabilityAccounts.map((a) => ({
          name: a.name,
          type: a.type,
          current_balance: Number(a.current_balance),
          interest_rate: a.interest_rate ? Number(a.interest_rate) : null,
          currency: a.currency,
        })),
        userName: "Contribuinte",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `oniefy-irpf-${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Relatório IRPF ${selectedYear} exportado.`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Erro ao exportar relatório.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header + Year selector (FIS-06) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Imposto de Renda</h1>
          <p className="text-sm text-muted-foreground">
            Consolidação fiscal automática via classificação contábil
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Ano:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || !report}
            className="flex items-center gap-1.5 rounded-md btn-cta px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
            title="Exportar XLSX para o contador"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Gerando" : "Exportar"}
          </button>
        </div>
      </div>

      {/* D7.10: How it works card */}
      <details className="rounded-lg border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
          Como funciona o módulo de IR?
        </summary>
        <p className="mt-2 text-sm text-muted-foreground">
          O relatório fiscal é gerado automaticamente com base na classificação contábil (tax_treatment) de cada conta.
          Receitas tributáveis, deduções e isenções são consolidadas por ano-calendário. Os valores aqui são estimativas
          para planejamento; consulte seu contador para a declaração oficial.
        </p>
      </details>

      {/* ═══ PAINEL DE PROVISIONAMENTO (Inteligência principal) ═══ */}
      {prov && !prov.status && (
        <div className={`rounded-lg border-2 p-6 shadow-card ${
          prov.monthly_provision > 0 ? "border-burnished/30 bg-burnished/10/50" : "border-verdant/30 bg-verdant/10/50"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Provisionamento de IR</h2>
              <p className="text-sm text-muted-foreground">
                Projeção baseada na sua renda acumulada em {selectedYear}
              </p>
            </div>
            {provStatus && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${provStatus.bg} ${provStatus.color}`}>
                {provStatus.label}
              </span>
            )}
          </div>

          {/* KPI row */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-card/80 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Renda Tributável Projetada
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                <Mv>{formatCurrency(prov.projected_annual_income)}</Mv>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Acumulado: <Mv>{formatCurrency(prov.ytd_taxable_income)}</Mv> ({prov.months_elapsed} meses)
              </p>
            </div>

            <div className="rounded-lg bg-card/80 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                IRPF Estimado Anual
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-terracotta">
                <Mv>{formatCurrency(prov.estimated_annual_tax)}</Mv>
              </p>
              {prov.annual_reduction_applied > 0 && (
                <p className="text-[11px] text-verdant">
                  Redução aplicada: <Mv>{formatCurrency(prov.annual_reduction_applied)}</Mv>
                </p>
              )}
            </div>

            <div className="rounded-lg bg-card/80 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                IRRF Retido (fontes)
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-verdant">
                <Mv>{formatCurrency(prov.ytd_irrf_withheld)}</Mv>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Gap: <Mv>{formatCurrency(prov.tax_gap)}</Mv>
              </p>
            </div>

            <div className={`rounded-lg p-3 ${
              prov.monthly_provision > 0 ? "bg-terracotta/15/80" : "bg-verdant/15/80"
            }`}>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Provisionar por Mês
              </p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${
                prov.monthly_provision > 0 ? "text-terracotta" : "text-verdant"
              }`}>
                {prov.monthly_provision > 0
                  ? formatCurrency(prov.monthly_provision)
                  : formatCurrency(0)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {prov.months_remaining > 0
                  ? `${prov.months_remaining} meses restantes`
                  : "Ano encerrado"}
              </p>
            </div>
          </div>

          {/* Explanation */}
          {prov.monthly_provision > 0 && (
            <div className="mt-4 rounded-lg bg-card/60 p-4">
              <p className="text-sm font-semibold text-burnished">
                Por que provisionar?
              </p>
              <p className="mt-1 text-xs text-burnished leading-relaxed">
                Se você tem mais de uma fonte de renda, cada empregador calcula o IR
                isoladamente. É possível que nenhum retenha imposto, mas a declaração
                anual consolida toda a renda e cobra a diferença de uma vez. Provisionando{" "}
                <Mv>{formatCurrency(prov.monthly_provision)}</Mv> por mês, você evita essa surpresa.
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            {prov.disclaimer}
          </p>
        </div>
      )}

      {/* No parameters message */}
      {prov?.status === "no_parameters" && (
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{prov.message}</p>
        </div>
      )}

      {/* ═══ RELATÓRIO FISCAL (FIS-01 a FIS-04) ═══ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Relatório de IR {selectedYear}</h2>

        {/* Totals */}
        {totals && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Rendimentos Tributáveis</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-terracotta">
                <Mv>{formatCurrency(totals.total_tributavel_revenue)}</Mv>
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Rendimentos Isentos</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-verdant">
                <Mv>{formatCurrency(totals.total_isento_revenue)}</Mv>
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Despesas Dedutíveis</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-info-slate">
                <Mv>{formatCurrency(totals.total_dedutivel_expense)}</Mv>
              </p>
            </div>
          </div>
        )}

        {/* By treatment breakdown */}
        {report?.by_treatment && report.by_treatment.length > 0 ? (
          <div className="space-y-3">
            {report.by_treatment.map((group, idx) => {
              const color = TAX_TREATMENT_COLORS[group.tax_treatment] || "#7E9487";
              const label = TAX_TREATMENT_LABELS[group.tax_treatment] || group.tax_treatment;
              const isRevenue = group.group_type === "revenue";
              const total = isRevenue ? group.total_revenue : group.total_expense;

              return (
                <div key={idx} className="rounded-lg bg-card p-4 shadow-card card-alive">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                      <div>
                        <span className="text-sm font-semibold">{label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({isRevenue ? "Receita" : "Despesa"})
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold tabular-nums"><Mv>{formatCurrency(total)}</Mv></p>
                      <p className="text-[11px] text-muted-foreground">{group.entry_count} lançamentos</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileSearch className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Sem dados fiscais em {selectedYear}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Registre transações com contas contábeis classificadas por tratamento fiscal
              para ver o relatório consolidado automaticamente.
            </p>
          </div>
        )}
      </div>

      {/* ═══ FIS-03: BENS E DIREITOS ═══ */}
      {(assets && assets.length > 0) || assetAccounts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-bold">Bens e Direitos</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Consolidação para declaração IRPF. Valores em 31/12/{selectedYear}.
          </p>

          <div className="space-y-2">
            {/* Contas bancárias com saldo positivo */}
            {assetAccounts.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[a.type]}</p>
                </div>
                <p className="font-semibold tabular-nums"><Mv>{formatCurrency(a.current_balance)}</Mv></p>
              </div>
            ))}

            {/* Bens patrimoniais */}
            {assets?.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{ASSET_CATEGORY_LABELS[a.category]} · Aquisição: {formatDate(a.acquisition_date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums"><Mv>{formatCurrency(a.current_value)}</Mv></p>
                  <p className="text-[11px] text-muted-foreground">Aquisição: <Mv>{formatCurrency(a.acquisition_value)}</Mv></p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="rounded-lg border bg-muted/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Bens e Direitos</p>
              <p className="text-lg font-bold tabular-nums">
                <Mv>{formatCurrency(
                  assetAccounts.reduce((s, a) => s + a.current_balance, 0) +
                  (assets?.reduce((s, a) => s + a.current_value, 0) ?? 0)
                )}</Mv>
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* ═══ FIS-04: DÍVIDAS E ÔNUS REAIS ═══ */}
      {liabilityAccounts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-bold">Dívidas e Ônus Reais</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Saldos devedores em 31/12/{selectedYear}.
          </p>

          <div className="space-y-2">
            {liabilityAccounts.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[a.type]}</p>
                </div>
                <p className="font-semibold tabular-nums text-terracotta"><Mv>{formatCurrency(Math.abs(a.current_balance))}</Mv></p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-muted/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Dívidas</p>
              <p className="text-lg font-bold tabular-nums text-terracotta">
                <Mv>{formatCurrency(Math.abs(liabilityAccounts.reduce((s, a) => s + a.current_balance, 0)))}</Mv>
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* ═══ PARÂMETROS FISCAIS (referência) ═══ */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">Parâmetros Fiscais Vigentes</h2>
        <p className="text-sm text-muted-foreground">
          Tabelas utilizadas nos cálculos. Atualizadas por curadoria humana, verificadas em pelo menos 2 fontes oficiais.
        </p>

        {parameters && parameters.length > 0 ? (
          <div className="space-y-2">
            {parameters.map((param) => {
              const typeLabels: Record<string, string> = {
                irpf_monthly: "IRPF Mensal",
                irpf_annual: "IRPF Anual",
                inss_employee: "INSS Empregado",
                minimum_wage: "Salário Mínimo",
                capital_gains: "Ganho de Capital",
              };

              return (
                <div key={param.id} className="rounded-lg bg-card p-4 shadow-card card-alive">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {typeLabels[param.parameter_type] || param.parameter_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vigência: {formatDate(param.valid_from)}
                        {param.valid_until ? ` a ${formatDate(param.valid_until)}` : " em diante"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {param.source_references?.map((ref, i) => (
                        <a
                          key={i}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-primary"
                        >
                          {ref.source}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Show brackets if available */}
                  {Array.isArray(param.brackets) && param.brackets.length > 0 && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th scope="col" className="py-1 text-left font-medium">Faixa</th>
                            <th scope="col" className="py-1 text-right font-medium">Alíquota</th>
                            {(param.brackets[0] as Record<string, unknown>)?.deduction !== undefined && (
                              <th scope="col" className="py-1 text-right font-medium">Dedução</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {(param.brackets as Record<string, unknown>[]).map((b, i) => (
                            <tr key={i} className="border-b border-muted/50">
                              <td className="py-1 tabular-nums">
                                <Mv>{formatCurrency(Number(b.min))}</Mv> a {Number(b.max) > 9999999 ? "..." : formatCurrency(Number(b.max))}
                              </td>
                              <td className="py-1 text-right tabular-nums font-medium">
                                {Number(b.rate)} %
                              </td>
                              {b.deduction !== undefined && (
                                <td className="py-1 text-right tabular-nums">
                                  <Mv>{formatCurrency(Number(b.deduction))}</Mv>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Show limits if available */}
                  {param.limits && typeof param.limits === "object" && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(param.limits as Record<string, unknown>).slice(0, 4).map(([key, val]) => (
                        <span key={key} className="rounded bg-muted px-2 py-0.5 text-[10px] tabular-nums">
                          {key.replace(/_/g, " ")}: {typeof val === "number" ? formatCurrency(val) : String(val)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum parâmetro fiscal carregado.</p>
        )}
      </div>

      {/* Info note */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          O relatório fiscal é gerado automaticamente a partir da classificação
          contábil (tax_treatment) das contas no plano de contas. Não substitui
          a declaração de IRPF. Confira os valores com seu contador antes de
          submeter à Receita Federal.
        </p>
      </div>
    </div>
  );
}

/**
 * Oniefy - IRPF Export Service (E8)
 *
 * Gera planilha XLSX formatada com dados fiscais no padrão
 * que o contador usa para a declaração do Imposto de Renda.
 *
 * Abas:
 * 1. Resumo - Totais consolidados
 * 2. Rendimentos - Por tratamento fiscal (tributável, isento, exclusivo fonte)
 * 3. Deduções - Despesas dedutíveis (integral e limitado)
 * 4. Bens e Direitos - Patrimônio (assets + contas de investimento)
 * 5. Dívidas - Empréstimos e financiamentos
 * 6. Provisionamento - Projeção de IR (se ano corrente)
 *
 * Usa ExcelJS (já no projeto para import XLSX).
 */

import ExcelJS from "exceljs";
import type { FiscalReport, FiscalProjection } from "@/lib/hooks/use-fiscal";

// ─── Types ──────────────────────────────────────────────────────

interface AssetRow {
  name: string;
  category: string;
  acquisition_date: string;
  acquisition_value: number;
  current_value: number;
  currency: string;
}

interface DebtRow {
  name: string;
  type: string;
  current_balance: number;
  interest_rate: number | null;
  currency: string;
}

export interface IRPFExportData {
  year: number;
  report: FiscalReport;
  projection: FiscalProjection | null;
  assets: AssetRow[];
  debts: DebtRow[];
  userName: string;
}

// ─── Styles ─────────────────────────────────────────────────────

const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF4F2F69" }, // Plum primary
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 11,
};

const TITLE_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 14,
  color: { argb: "FF241E29" }, // Midnight Plum
};

const CURRENCY_FORMAT = "#,##0.00";

function styleHeader(row: ExcelJS.Row, colCount: number) {
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF241E29" } },
    };
  }
  row.height = 24;
}

function addTitle(ws: ExcelJS.Worksheet, title: string, subtitle: string) {
  const titleRow = ws.addRow([title]);
  titleRow.getCell(1).font = TITLE_FONT;
  ws.addRow([subtitle]).getCell(1).font = { italic: true, color: { argb: "FF666666" }, size: 10 };
  ws.addRow([]); // spacer
}

// ─── Treatment Labels ───────────────────────────────────────────

const TREATMENT_LABELS: Record<string, string> = {
  tributavel: "Tributável",
  isento: "Isento / Não tributável",
  exclusivo_fonte: "Tributação exclusiva na fonte",
  ganho_capital: "Ganho de capital",
  dedutivel_integral: "Dedutível (integral)",
  dedutivel_limitado: "Dedutível (limitado)",
  nao_dedutivel: "Não dedutível",
  variavel: "Variável",
};

const ASSET_LABELS: Record<string, string> = {
  real_estate: "Imóvel",
  vehicle: "Veículo",
  vehicle_auto: "Veículo (auto)",
  vehicle_moto: "Veículo (moto)",
  electronics: "Eletrônicos",
  jewelry: "Jóias",
  furniture: "Móveis",
  collectibles: "Colecionáveis",
  restricted: "Restrito (FGTS, previdência)",
  other: "Outros",
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  loan: "Empréstimo",
  financing: "Financiamento",
  credit_card: "Cartão de crédito",
};

// ─── Export Function ────────────────────────────────────────────

export async function generateIRPFExport(data: IRPFExportData): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Oniefy";
  wb.created = new Date();

  const { year, report, projection, assets, debts, userName } = data;

  // ═══ 1. RESUMO ════════════════════════════════════════════════

  const wsResumo = wb.addWorksheet("Resumo");
  wsResumo.columns = [
    { width: 40 },
    { width: 20 },
  ];

  addTitle(wsResumo, `Relatório Fiscal IRPF ${year}`, `Gerado pelo Oniefy para ${userName}`);

  const hdr = wsResumo.addRow(["Descrição", "Valor (R$)"]);
  styleHeader(hdr, 2);

  const rows = [
    ["Rendimentos Tributáveis", report.totals.total_tributavel_revenue],
    ["Rendimentos Isentos", report.totals.total_isento_revenue],
    ["Deduções Elegíveis", report.totals.total_dedutivel_expense],
    ["Total de Transações no Ano", report.totals.total_transactions],
    [],
    ["Bens e Direitos (valor atual)", assets.reduce((s, a) => s + a.current_value, 0)],
    ["Dívidas (saldo devedor)", debts.reduce((s, d) => s + d.current_balance, 0)],
  ];

  for (const r of rows) {
    if (r.length === 0) {
      wsResumo.addRow([]);
      continue;
    }
    const row = wsResumo.addRow(r);
    if (typeof r[1] === "number") {
      row.getCell(2).numFmt = CURRENCY_FORMAT;
    }
  }

  // ═══ 2. RENDIMENTOS ═══════════════════════════════════════════

  const wsRend = wb.addWorksheet("Rendimentos");
  wsRend.columns = [
    { width: 35 },
    { width: 15 },
    { width: 20 },
    { width: 12 },
  ];

  addTitle(wsRend, `Rendimentos ${year}`, "Agrupados por tratamento fiscal");

  const hdrRend = wsRend.addRow(["Tratamento Fiscal", "Tipo", "Total (R$)", "Lançamentos"]);
  styleHeader(hdrRend, 4);

  const revenueGroups = report.by_treatment.filter((g) => g.group_type === "revenue");
  for (const g of revenueGroups) {
    const row = wsRend.addRow([
      TREATMENT_LABELS[g.tax_treatment] ?? g.tax_treatment,
      "Receita",
      g.total_revenue,
      g.entry_count,
    ]);
    row.getCell(3).numFmt = CURRENCY_FORMAT;
  }

  if (revenueGroups.length === 0) {
    wsRend.addRow(["Nenhum rendimento registrado no período"]);
  }

  // ═══ 3. DEDUÇÕES ══════════════════════════════════════════════

  const wsDed = wb.addWorksheet("Deduções");
  wsDed.columns = [
    { width: 35 },
    { width: 15 },
    { width: 20 },
    { width: 12 },
  ];

  addTitle(wsDed, `Deduções ${year}`, "Despesas dedutíveis do IR");

  const hdrDed = wsDed.addRow(["Tratamento Fiscal", "Tipo", "Total (R$)", "Lançamentos"]);
  styleHeader(hdrDed, 4);

  const deductionGroups = report.by_treatment.filter(
    (g) =>
      g.group_type === "expense" &&
      (g.tax_treatment === "dedutivel_integral" || g.tax_treatment === "dedutivel_limitado")
  );
  for (const g of deductionGroups) {
    const row = wsDed.addRow([
      TREATMENT_LABELS[g.tax_treatment] ?? g.tax_treatment,
      "Despesa",
      g.total_expense,
      g.entry_count,
    ]);
    row.getCell(3).numFmt = CURRENCY_FORMAT;
  }

  if (deductionGroups.length === 0) {
    wsDed.addRow(["Nenhuma dedução registrada no período"]);
  }

  // ═══ 4. BENS E DIREITOS ═══════════════════════════════════════

  const wsBens = wb.addWorksheet("Bens e Direitos");
  wsBens.columns = [
    { width: 30 },
    { width: 20 },
    { width: 15 },
    { width: 20 },
    { width: 20 },
    { width: 10 },
  ];

  addTitle(wsBens, `Bens e Direitos ${year}`, "Patrimônio declarável (ativos e investimentos)");

  const hdrBens = wsBens.addRow(["Nome", "Categoria", "Aquisição", "Valor Aquisição (R$)", "Valor Atual (R$)", "Moeda"]);
  styleHeader(hdrBens, 6);

  for (const a of assets) {
    const row = wsBens.addRow([
      a.name,
      ASSET_LABELS[a.category] ?? a.category,
      a.acquisition_date,
      a.acquisition_value,
      a.current_value,
      a.currency,
    ]);
    row.getCell(4).numFmt = CURRENCY_FORMAT;
    row.getCell(5).numFmt = CURRENCY_FORMAT;
  }

  if (assets.length === 0) {
    wsBens.addRow(["Nenhum bem ou direito cadastrado"]);
  }

  // ═══ 5. DÍVIDAS ═══════════════════════════════════════════════

  const wsDividas = wb.addWorksheet("Dívidas");
  wsDividas.columns = [
    { width: 30 },
    { width: 20 },
    { width: 20 },
    { width: 15 },
    { width: 10 },
  ];

  addTitle(wsDividas, `Dívidas e Ônus ${year}`, "Empréstimos, financiamentos e cartões");

  const hdrDiv = wsDividas.addRow(["Nome", "Tipo", "Saldo Devedor (R$)", "Taxa (% a.m.)", "Moeda"]);
  styleHeader(hdrDiv, 5);

  for (const d of debts) {
    const row = wsDividas.addRow([
      d.name,
      ACCOUNT_TYPE_LABELS[d.type] ?? d.type,
      d.current_balance,
      d.interest_rate,
      d.currency,
    ]);
    row.getCell(3).numFmt = CURRENCY_FORMAT;
    if (d.interest_rate !== null) {
      row.getCell(4).numFmt = "0.00";
    }
  }

  if (debts.length === 0) {
    wsDividas.addRow(["Nenhuma dívida cadastrada"]);
  }

  // ═══ 6. PROVISIONAMENTO (se ano corrente) ═════════════════════

  if (projection && !projection.status) {
    const wsProv = wb.addWorksheet("Provisionamento IR");
    wsProv.columns = [
      { width: 40 },
      { width: 20 },
    ];

    addTitle(wsProv, `Provisionamento IR ${year}`, "Projeção anual e recomendação de provisão mensal");

    const hdrProv = wsProv.addRow(["Indicador", "Valor (R$)"]);
    styleHeader(hdrProv, 2);

    const provRows: [string, number][] = [
      ["Renda tributável acumulada (YTD)", projection.ytd_taxable_income],
      ["Deduções acumuladas (YTD)", projection.ytd_deductible_expenses],
      ["Projeção renda anual", projection.projected_annual_income],
      ["Projeção deduções anuais", projection.projected_annual_deductible],
      ["Base de cálculo estimada", projection.taxable_base],
      ["IR estimado anual", projection.estimated_annual_tax],
      ["Redução aplicada (Lei 15.270/2025)", projection.annual_reduction_applied],
      ["IRRF retido (YTD)", projection.ytd_irrf_withheld],
      ["Gap (IR estimado - IRRF)", projection.tax_gap],
      ["Provisão mensal recomendada", projection.monthly_provision],
    ];

    for (const [label, val] of provRows) {
      const row = wsProv.addRow([label, val]);
      row.getCell(2).numFmt = CURRENCY_FORMAT;
    }

    wsProv.addRow([]);
    const disclaimer = wsProv.addRow([projection.disclaimer]);
    disclaimer.getCell(1).font = { italic: true, size: 9, color: { argb: "FF999999" } };
  }

  // ═══ Generate blob ════════════════════════════════════════════

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

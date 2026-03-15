/**
 * UX-H3-03: Weekly digest email template
 *
 * Inline CSS, responsive, dark-mode friendly.
 * Plum Ledger brand colors.
 */

export interface WeeklyDigestData {
  week_start: string;
  week_end: string;
  total_income: number;
  total_expense: number;
  transaction_count: number;
  top_categories: { category_name: string; total: number }[];
  pending_count: number;
  uncategorized_count: number;
  user_name: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateBR(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function buildWeeklyDigestHtml(data: WeeklyDigestData): string {
  const net = data.total_income - data.total_expense;
  const netColor = net >= 0 ? "#7E9487" : "#C4715B";
  const netLabel = net >= 0 ? "Resultado positivo" : "Resultado negativo";

  const topCatsHtml =
    data.top_categories.length > 0
      ? data.top_categories
          .map(
            (c, i) =>
              `<tr>
                <td style="padding:8px 0;border-bottom:1px solid #EDE8E0;font-size:14px;color:#241E29;">${i + 1}. ${escapeHtml(c.category_name)}</td>
                <td style="padding:8px 0;border-bottom:1px solid #EDE8E0;font-size:14px;color:#C4715B;text-align:right;font-family:'JetBrains Mono',monospace;">${formatBRL(c.total)}</td>
              </tr>`
          )
          .join("")
      : `<tr><td colspan="2" style="padding:12px 0;font-size:13px;color:#9CA3AF;">Sem despesas categorizadas nesta semana.</td></tr>`;

  const alertsHtml: string[] = [];
  if (data.pending_count > 0) {
    alertsHtml.push(
      `<div style="background:#FFF3E0;border-radius:8px;padding:12px 16px;margin-bottom:8px;font-size:13px;color:#C4715B;">
        ${data.pending_count} transaç${data.pending_count > 1 ? "ões pendentes" : "ão pendente"} de pagamento
      </div>`
    );
  }
  if (data.uncategorized_count > 0) {
    alertsHtml.push(
      `<div style="background:#F3F0FF;border-radius:8px;padding:12px 16px;margin-bottom:8px;font-size:13px;color:#6B5CA5;">
        ${data.uncategorized_count} transaç${data.uncategorized_count > 1 ? "ões sem" : "ão sem"} categoria
      </div>`
    );
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Oniefy - Resumo Semanal</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="text-align:center;padding:24px 0 16px;">
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#241E29;">Resumo Semanal</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#9CA3AF;">
        ${formatDateBR(data.week_start)} a ${formatDateBR(data.week_end)}
      </p>
    </div>

    <!-- Main card -->
    <div style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <!-- Summary row -->
      <div style="display:flex;border-bottom:1px solid #EDE8E0;">
        <div style="flex:1;padding:20px;text-align:center;border-right:1px solid #EDE8E0;">
          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#9CA3AF;">Receitas</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#7E9487;font-family:'JetBrains Mono',monospace;">${formatBRL(data.total_income)}</p>
        </div>
        <div style="flex:1;padding:20px;text-align:center;">
          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#9CA3AF;">Despesas</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#C4715B;font-family:'JetBrains Mono',monospace;">${formatBRL(data.total_expense)}</p>
        </div>
      </div>

      <!-- Net result -->
      <div style="padding:16px 20px;border-bottom:1px solid #EDE8E0;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;color:#9CA3AF;">${netLabel}</span>
        <span style="font-size:18px;font-weight:700;color:${netColor};font-family:'JetBrains Mono',monospace;">${formatBRL(Math.abs(net))}</span>
      </div>

      <!-- Top 3 categories -->
      <div style="padding:16px 20px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#9CA3AF;">
          Top categorias
        </p>
        <table style="width:100%;border-collapse:collapse;">
          ${topCatsHtml}
        </table>
      </div>

      <!-- Alerts -->
      ${alertsHtml.length > 0 ? `<div style="padding:0 20px 16px;">${alertsHtml.join("")}</div>` : ""}

      <!-- Stats footer -->
      <div style="padding:16px 20px;background:#FAFAF8;border-top:1px solid #EDE8E0;text-align:center;">
        <span style="font-size:12px;color:#9CA3AF;">
          ${data.transaction_count} transaç${data.transaction_count !== 1 ? "ões" : "ão"} registrada${data.transaction_count !== 1 ? "s" : ""} na semana
        </span>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;padding:24px 0;">
      <a href="https://oniefy.com/dashboard" style="display:inline-block;background:#241E29;color:#F5F0E8;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
        Abrir Oniefy
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:8px 0 24px;">
      <p style="margin:0;font-size:11px;color:#9CA3AF;">
        Oniefy - Any asset, one clear view.
      </p>
    </div>
  </div>
</body>
</html>`;
}

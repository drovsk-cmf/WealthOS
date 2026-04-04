/**
 * Oniefy - Motor de Parcelamento (E67)
 *
 * Sistema completo para parcelamento de cartão de crédito brasileiro:
 * - Aritmética do centavo (1ª parcela absorve resto)
 * - Extração de parcelas via regex (6 bancos)
 * - Distribuição por data de fechamento do cartão
 * - Projeção de faturas futuras
 * - Reconciliação parcela projetada vs fatura real
 *
 * Ref: docs/INSTALLMENT-SYSTEM-SPEC.md
 */

// ── Tipos ──

export interface InstallmentSplit {
  /** Installment number (1-based) */
  number: number;
  /** Amount in BRL (positive, 2 decimal places) */
  amount: number;
}

export interface InstallmentInfo {
  /** Current installment number (1-based) */
  current: number;
  /** Total installments */
  total: number;
  /** Cleaned description (installment pattern removed) */
  cleanDescription: string;
  /** Which regex/method matched */
  matchMethod: "column" | "type_column" | "regex" | "none";
  /** Original match text */
  matchText?: string;
}

export interface InstallmentTransaction {
  /** Shared UUID across all installments of a purchase */
  groupId: string;
  /** Installment number (1-based) */
  installmentCurrent: number;
  /** Total installments */
  installmentTotal: number;
  /** Individual installment amount */
  amount: number;
  /** Original total purchase amount */
  originalAmount: number;
  /** Projected date this installment lands on a bill */
  projectedDate: Date;
  /** Description */
  description: string;
}

export interface BillProjection {
  /** Month identifier (YYYY-MM) */
  month: string;
  /** Bill closing date */
  closingDate: Date;
  /** Bill due date */
  dueDate: Date;
  /** Total projected amount from installments */
  installmentTotal: number;
  /** Individual installments in this bill */
  installments: Array<{
    groupId: string;
    description: string;
    installmentCurrent: number;
    installmentTotal: number;
    amount: number;
  }>;
}

export interface ReconciliationResult {
  status: "matched" | "amount_mismatch" | "missing" | "unexpected";
  projected?: InstallmentTransaction;
  imported?: { description: string; amount: number; date: Date };
  /** Difference in BRL (positive = imported > projected) */
  difference?: number;
  message: string;
}

// ── Aritmética do centavo ──

/**
 * Divide valor total em N parcelas com aritmética do centavo brasileira.
 * Regra: 1ª parcela absorve a diferença de centavos.
 *
 * @param totalAmount - Valor total em BRL (ex: 143.17)
 * @param count - Número de parcelas (>= 2)
 * @returns Array de N parcelas com valores corretos
 */
export function splitInstallments(totalAmount: number, count: number): InstallmentSplit[] {
  if (count < 2) throw new Error("Parcelamento requer no mínimo 2 parcelas");
  if (totalAmount <= 0) throw new Error("Valor total deve ser positivo");

  // Trabalha em centavos para evitar floating point
  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainderCents = totalCents - baseCents * count;

  const result: InstallmentSplit[] = [];
  for (let i = 1; i <= count; i++) {
    const amountCents = i === 1 ? baseCents + remainderCents : baseCents;
    result.push({
      number: i,
      amount: amountCents / 100,
    });
  }

  return result;
}

// ── Parser de parcelas ──

/**
 * Regex patterns para extração de parcelas de descrições de fatura.
 * Ordenados do mais específico ao mais genérico (spec §4.2).
 */
const INSTALLMENT_PATTERNS: Array<{ regex: RegExp; name: string }> = [
  // 1. "Parcela 15 de 18" (Mercado Pago)
  { regex: /(?:parcela\s+)(\d{1,2})\s+de\s+(\d{1,2})/i, name: "parcela_de" },
  // 2. "(13/13)" (Bradescard, BTG)
  { regex: /\((\d{1,2})\/(\d{1,2})\)/, name: "parens_slash" },
  // 3. "*I 19/24" (Itaú) - letra maiúscula antes do N/M
  { regex: /\*[A-Z]\s*(\d{1,2})\/(\d{1,2})/, name: "itau_star" },
  // 4. "PA/05" (Porto Bank) - só captura current, não total
  { regex: /PA\/(\d{1,2})/, name: "porto_pa" },
  // 5. "6/12" genérico (cuidado com datas - filtra por contexto)
  { regex: /\b(\d{1,2})\/(\d{1,2})\b/, name: "generic_slash" },
  // 6. "14 de 18" (XP coluna, ou texto livre)
  { regex: /(\d{1,2})\s+de\s+(\d{1,2})/, name: "n_de_m" },
];

/**
 * Extrai informação de parcela de uma descrição de lançamento.
 *
 * Pipeline de 5 etapas (spec §4.3):
 * 1. Coluna dedicada (XP)
 * 2. Campo "Tipo de compra" (BTG)
 * 3. Regex na descrição (6 patterns)
 * 4. Inferência por histórico (não implementado aqui - é hook)
 * 5. Sem informação → retorna none
 *
 * @param description - Descrição do lançamento
 * @param typeColumn - Campo "Tipo de compra" (BTG), opcional
 * @param installmentColumn - Coluna "Parcela" dedicada (XP), opcional
 */
export function parseInstallmentInfo(
  description: string,
  typeColumn?: string,
  installmentColumn?: string
): InstallmentInfo {
  const original = description;

  // Etapa 1: Coluna dedicada (XP tem "14 de 18")
  if (installmentColumn) {
    const colMatch = installmentColumn.match(/(\d{1,2})\s*(?:de|\/)\s*(\d{1,2})/);
    if (colMatch) {
      return {
        current: parseInt(colMatch[1], 10),
        total: parseInt(colMatch[2], 10),
        cleanDescription: description.trim(),
        matchMethod: "column",
        matchText: installmentColumn,
      };
    }
  }

  // Etapa 2: Tipo de compra (BTG)
  if (typeColumn) {
    const lower = typeColumn.toLowerCase();
    if (lower.includes("à vista") || lower.includes("a vista")) {
      return { current: 0, total: 0, cleanDescription: description.trim(), matchMethod: "type_column" };
    }
    if (lower.includes("parcela")) {
      // Sabe que é parcela, mas sem N/M. Regex pode encontrar na descrição.
      // Cai para etapa 3.
    }
  }

  // Etapa 3: Regex na descrição
  for (const { regex, name } of INSTALLMENT_PATTERNS) {
    const match = description.match(regex);
    if (!match) continue;

    // Porto Bank: pattern "PA/05" só tem current, não total
    if (name === "porto_pa") {
      const current = parseInt(match[1], 10);
      return {
        current,
        total: 0, // desconhecido
        cleanDescription: description.replace(match[0], "").trim(),
        matchMethod: "regex",
        matchText: match[0],
      };
    }

    const current = parseInt(match[1], 10);
    const total = parseInt(match[2], 10);

    // Validação: o "genérico" (5) pode confundir com datas (15/03).
    // Filtra: se total > 48 ou current > total, provavelmente é data.
    if (name === "generic_slash") {
      if (total > 48 || current > total || total < 2) continue;
    }

    // Limpeza: remove o trecho de parcela da descrição
    const cleaned = description.replace(match[0], "").replace(/\s{2,}/g, " ").trim();

    return {
      current,
      total,
      cleanDescription: cleaned,
      matchMethod: "regex",
      matchText: match[0],
    };
  }

  // Etapa 5: sem informação
  return {
    current: 0,
    total: 0,
    cleanDescription: description.trim(),
    matchMethod: "none",
  };
}

// ── Distribuição por data de fechamento ──

/**
 * Calcula a data em que cada parcela cai na fatura do cartão.
 *
 * Lógica:
 * - Se a compra foi antes do fechamento do mês corrente → 1ª parcela na fatura atual
 * - Se depois do fechamento → 1ª parcela na fatura do mês seguinte
 * - Demais parcelas: +1 mês cada
 *
 * @param purchaseDate - Data da compra
 * @param closingDay - Dia do fechamento do cartão (1-31)
 * @param totalInstallments - Número total de parcelas
 * @returns Array de datas (uma por parcela)
 */
export function calculateInstallmentDates(
  purchaseDate: Date,
  closingDay: number,
  totalInstallments: number
): Date[] {
  const purchaseDay = purchaseDate.getDate();
  const purchaseMonth = purchaseDate.getMonth();
  const purchaseYear = purchaseDate.getFullYear();

  // Determina o mês da primeira fatura
  let firstBillMonth: number;
  let firstBillYear: number;

  if (purchaseDay <= closingDay) {
    // Compra antes do fechamento → cai na fatura deste mês
    firstBillMonth = purchaseMonth;
    firstBillYear = purchaseYear;
  } else {
    // Compra após fechamento → cai na fatura do próximo mês
    firstBillMonth = purchaseMonth + 1;
    firstBillYear = purchaseYear;
    if (firstBillMonth > 11) {
      firstBillMonth = 0;
      firstBillYear++;
    }
  }

  const dates: Date[] = [];
  for (let i = 0; i < totalInstallments; i++) {
    let month = firstBillMonth + i;
    let year = firstBillYear;
    while (month > 11) {
      month -= 12;
      year++;
    }
    // Closing day capped at last day of month
    const lastDay = new Date(year, month + 1, 0).getDate();
    const day = Math.min(closingDay, lastDay);
    dates.push(new Date(year, month, day));
  }

  return dates;
}

/**
 * Gera as transações de parcela a partir de uma compra parcelada.
 *
 * @param groupId - UUID compartilhado por todas as parcelas
 * @param description - Descrição da compra
 * @param totalAmount - Valor total da compra
 * @param totalInstallments - Número de parcelas
 * @param purchaseDate - Data da compra
 * @param closingDay - Dia de fechamento do cartão
 * @returns Array de N transações prontas para inserção
 */
export function generateInstallmentTransactions(
  groupId: string,
  description: string,
  totalAmount: number,
  totalInstallments: number,
  purchaseDate: Date,
  closingDay: number
): InstallmentTransaction[] {
  const splits = splitInstallments(totalAmount, totalInstallments);
  const dates = calculateInstallmentDates(purchaseDate, closingDay, totalInstallments);

  return splits.map((split, i) => ({
    groupId,
    installmentCurrent: split.number,
    installmentTotal: totalInstallments,
    amount: split.amount,
    originalAmount: totalAmount,
    projectedDate: dates[i],
    description: `${description} (${split.number}/${totalInstallments})`,
  }));
}

// ── Projeção de faturas futuras ──

/**
 * Agrupa parcelas projetadas em faturas mensais.
 *
 * @param installments - Todas as parcelas ativas (projetadas e futuras)
 * @param closingDay - Dia de fechamento do cartão
 * @param dueDay - Dia de vencimento do cartão
 * @param monthsAhead - Quantos meses projetar (padrão: 6)
 */
export function projectFutureBills(
  installments: InstallmentTransaction[],
  closingDay: number,
  dueDay: number,
  monthsAhead = 6
): BillProjection[] {
  const now = new Date();
  const projections: Map<string, BillProjection> = new Map();

  // Cria slots para os próximos N meses
  for (let i = 0; i < monthsAhead; i++) {
    let month = now.getMonth() + i;
    let year = now.getFullYear();
    while (month > 11) {
      month -= 12;
      year++;
    }
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    const lastDayClose = new Date(year, month + 1, 0).getDate();
    const lastDayDue = new Date(year, month + 1, 0).getDate();
    projections.set(key, {
      month: key,
      closingDate: new Date(year, month, Math.min(closingDay, lastDayClose)),
      dueDate: new Date(year, month, Math.min(dueDay, lastDayDue)),
      installmentTotal: 0,
      installments: [],
    });
  }

  // Distribui parcelas nos meses
  for (const inst of installments) {
    const d = inst.projectedDate;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bill = projections.get(key);
    if (!bill) continue; // fora da janela de projeção

    bill.installmentTotal += inst.amount;
    bill.installments.push({
      groupId: inst.groupId,
      description: inst.description,
      installmentCurrent: inst.installmentCurrent,
      installmentTotal: inst.installmentTotal,
      amount: inst.amount,
    });
  }

  return Array.from(projections.values()).sort((a, b) => a.month.localeCompare(b.month));
}

// ── Reconciliação ──

/**
 * Reconcilia uma parcela projetada com um lançamento importado.
 * Tolerância de ±2 centavos para aritmética do centavo.
 *
 * @param projected - Parcela projetada
 * @param imported - Lançamento importado (ou null se não encontrado)
 * @returns Resultado da reconciliação
 */
export function reconcileInstallment(
  projected: InstallmentTransaction,
  imported: { description: string; amount: number; date: Date } | null
): ReconciliationResult {
  if (!imported) {
    return {
      status: "missing",
      projected,
      message: `Parcela ${projected.installmentCurrent}/${projected.installmentTotal} não apareceu na fatura. Operadora pode ter pulado.`,
    };
  }

  const diff = Math.abs(imported.amount - projected.amount);
  const toleranceCents = 0.02; // 2 centavos

  if (diff <= toleranceCents) {
    return {
      status: "matched",
      projected,
      imported,
      difference: 0,
      message: `Parcela ${projected.installmentCurrent}/${projected.installmentTotal} reconciliada.`,
    };
  }

  return {
    status: "amount_mismatch",
    projected,
    imported,
    difference: imported.amount - projected.amount,
    message: `Parcela ${projected.installmentCurrent}/${projected.installmentTotal}: esperado R$ ${projected.amount.toFixed(2)}, fatura R$ ${imported.amount.toFixed(2)} (diferença R$ ${diff.toFixed(2)}).`,
  };
}

/**
 * Reconstrução reversa: estima valor total a partir de uma parcela intermediária.
 * Spec §5.
 */
export function estimateTotalFromInstallment(
  installmentAmount: number,
  installmentCurrent: number,
  installmentTotal: number
): { estimated: number; rangeMin: number; rangeMax: number } {
  const amountCents = Math.round(installmentAmount * 100);

  if (installmentCurrent === 1) {
    // 1ª parcela pode ter centavos extras. Estimativa:
    // totalMin = 1ª parcela + (total-1) * (1ª parcela - (total-1) centavos)
    // totalMax = 1ª parcela + (total-1) * 1ª parcela
    const estimated = amountCents * installmentTotal;
    return {
      estimated: estimated / 100,
      rangeMin: (estimated - (installmentTotal - 1)) / 100,
      rangeMax: estimated / 100,
    };
  }

  // Parcelas 2..N: valor base (sem centavo extra)
  const baseCents = amountCents;
  const estimatedTotal = baseCents * installmentTotal;
  // O total real pode ser até (installmentTotal - 1) centavos a mais
  return {
    estimated: estimatedTotal / 100,
    rangeMin: estimatedTotal / 100,
    rangeMax: (estimatedTotal + installmentTotal - 1) / 100,
  };
}

/**
 * Oniefy - Fiscal Calendar (E51)
 *
 * Generates tax deadlines and obligations for the current year.
 * Based on user profile (UF) and financial data.
 *
 * Sources:
 * - IRPF: fixed dates (Mar-May)
 * - IPVA: varies by UF (Jan-Mar)
 * - IPTU: varies by municipality (Feb-Nov typically)
 * - DARF: monthly (last business day)
 * - Carnê-leão: monthly (last business day)
 *
 * Ref: docs/TAX-ENGINE-SPEC.md §5
 */

export interface FiscalEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date
  type: "irpf" | "ipva" | "iptu" | "darf" | "carne_leao" | "other";
  /** Days until this event (negative if past) */
  daysUntil: number;
  /** Whether this is urgent (within 7 days) */
  isUrgent: boolean;
  /** Whether this event is past */
  isPast: boolean;
}

interface FiscalCalendarInput {
  year: number;
  /** User's state (UF) for IPVA dates */
  uf?: string;
  /** Whether user has autonomous income (triggers carnê-leão) */
  hasAutonomousIncome?: boolean;
  /** Whether user has investment gains (triggers monthly DARF) */
  hasInvestmentGains?: boolean;
  /** Whether user has vehicles (triggers IPVA) */
  hasVehicles?: boolean;
  /** Whether user has real estate (triggers IPTU) */
  hasRealEstate?: boolean;
}

/**
 * Generate fiscal calendar events for a given year.
 */
export function generateFiscalCalendar(input: FiscalCalendarInput): FiscalEvent[] {
  const { year, uf, hasAutonomousIncome, hasInvestmentGains, hasVehicles, hasRealEstate } = input;
  const events: FiscalEvent[] = [];
  const today = new Date();

  // ── IRPF Declaration (always) ──────────────────────────────
  events.push(
    makeEvent(`irpf-start-${year}`, "Início da declaração IRPF", 
      `Período de entrega da declaração de Imposto de Renda ${year} (ano-base ${year - 1})`,
      `${year}-03-15`, "irpf", today),
    makeEvent(`irpf-end-${year}`, "Prazo final IRPF",
      `Último dia para entregar a declaração sem multa`,
      `${year}-05-31`, "irpf", today),
    makeEvent(`irpf-restituicao-1-${year}`, "1º lote restituição IRPF",
      `Primeiro lote de restituição (prioritários: idosos, deficientes, professores)`,
      `${year}-05-30`, "irpf", today),
  );

  // ── IPVA (if user has vehicles) ────────────────────────────
  if (hasVehicles && uf) {
    const ipvaDates = getIPVADates(year, uf);
    for (const [quota, date] of ipvaDates) {
      events.push(
        makeEvent(`ipva-${quota}-${year}`, `IPVA ${uf} - ${quota}`,
          `Prazo para pagamento do IPVA ${year} (${quota})`,
          date, "ipva", today)
      );
    }
  }

  // ── IPTU (if user has real estate) ─────────────────────────
  if (hasRealEstate) {
    // IPTU dates vary wildly by municipality. Show generic reminders.
    events.push(
      makeEvent(`iptu-cota-unica-${year}`, "IPTU - Cota única (verificar prefeitura)",
        "Desconto para cota única varia por município. Consulte a prefeitura.",
        `${year}-02-10`, "iptu", today),
    );
    // Monthly installments (generic, Feb-Nov)
    for (let m = 2; m <= 11; m++) {
      events.push(
        makeEvent(`iptu-${m}-${year}`, `IPTU - Parcela ${m - 1}/10`,
          "Data estimada. Confira o carnê da prefeitura.",
          `${year}-${String(m).padStart(2, "0")}-15`, "iptu", today)
      );
    }
  }

  // ── Carnê-Leão (if autonomous income) ──────────────────────
  if (hasAutonomousIncome) {
    for (let m = 1; m <= 12; m++) {
      const lastBizDay = getLastBusinessDay(year, m);
      events.push(
        makeEvent(`carne-leao-${m}-${year}`, `Carnê-Leão ${monthName(m)}`,
          `DARF de IR sobre rendimentos PF recebidos em ${monthName(m)}`,
          lastBizDay, "carne_leao", today)
      );
    }
  }

  // ── DARF Ganho de Capital (if investment gains) ────────────
  if (hasInvestmentGains) {
    for (let m = 1; m <= 12; m++) {
      const lastBizDay = getLastBusinessDay(year, m);
      events.push(
        makeEvent(`darf-gcap-${m}-${year}`, `DARF Ganho de Capital ${monthName(m)}`,
          `Prazo para recolhimento de IR sobre ganho de capital em renda variável (${monthName(m - 1 || 12)})`,
          lastBizDay, "darf", today)
      );
    }
  }

  // Sort by date
  events.sort((a, b) => a.date.localeCompare(b.date));

  return events;
}

/**
 * Filter calendar to upcoming events (next N days).
 */
export function getUpcomingFiscalEvents(
  events: FiscalEvent[],
  withinDays = 30
): FiscalEvent[] {
  return events.filter((e) => !e.isPast && e.daysUntil <= withinDays);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeEvent(
  id: string,
  title: string,
  description: string,
  date: string,
  type: FiscalEvent["type"],
  today: Date
): FiscalEvent {
  const eventDate = new Date(date + "T12:00:00");
  const diffMs = eventDate.getTime() - today.getTime();
  const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    id,
    title,
    description,
    date,
    type,
    daysUntil,
    isUrgent: daysUntil >= 0 && daysUntil <= 7,
    isPast: daysUntil < 0,
  };
}

function getLastBusinessDay(year: number, month: number): string {
  // Last day of month, then walk back if weekend
  const lastDay = new Date(year, month, 0);
  while (lastDay.getDay() === 0 || lastDay.getDay() === 6) {
    lastDay.setDate(lastDay.getDate() - 1);
  }
  return lastDay.toISOString().slice(0, 10);
}

function monthName(m: number): string {
  const names = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return names[m] ?? "";
}

/**
 * IPVA dates by UF (simplified, covers SP/RJ/MG/major states).
 * Returns array of [quota_label, date] pairs.
 */
function getIPVADates(year: number, uf: string): [string, string][] {
  // SP: January (cota única with discount) or 3 parcels Jan-Mar
  // Most states: Jan-Mar with variations
  switch (uf.toUpperCase()) {
    case "SP":
      return [
        ["Cota única (desconto)", `${year}-01-13`],
        ["1ª parcela", `${year}-01-13`],
        ["2ª parcela", `${year}-02-13`],
        ["3ª parcela", `${year}-03-13`],
      ];
    case "RJ":
      return [
        ["Cota única (desconto)", `${year}-01-21`],
        ["1ª parcela", `${year}-01-21`],
        ["2ª parcela", `${year}-02-21`],
        ["3ª parcela", `${year}-03-21`],
      ];
    case "MG":
      return [
        ["Cota única (desconto)", `${year}-01-15`],
        ["1ª parcela", `${year}-02-15`],
        ["2ª parcela", `${year}-03-15`],
        ["3ª parcela", `${year}-04-15`],
      ];
    default:
      // Generic: most states follow Jan-Mar pattern
      return [
        ["Cota única", `${year}-01-31`],
        ["1ª parcela", `${year}-01-31`],
        ["2ª parcela", `${year}-02-28`],
        ["3ª parcela", `${year}-03-31`],
      ];
  }
}

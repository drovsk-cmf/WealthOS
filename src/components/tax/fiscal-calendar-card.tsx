"use client";

/**
 * Oniefy - Fiscal Calendar Card (E51)
 *
 * Shows upcoming tax deadlines on the /tax page.
 * Uses generateFiscalCalendar + getUpcomingFiscalEvents.
 */

import { useMemo } from "react";
import { Calendar, AlertTriangle, Clock } from "lucide-react";
import { generateFiscalCalendar, getUpcomingFiscalEvents, type FiscalEvent } from "@/lib/services/fiscal-calendar";

interface FiscalCalendarCardProps {
  year: number;
}

const TYPE_LABELS: Record<string, string> = {
  irpf: "IRPF",
  ipva: "IPVA",
  iptu: "IPTU",
  darf: "DARF",
  carne_leao: "Carnê-Leão",
  other: "Outro",
};

const TYPE_COLORS: Record<string, string> = {
  irpf: "text-primary",
  ipva: "text-burnished",
  iptu: "text-slate",
  darf: "text-terracotta",
  carne_leao: "text-verdant",
};

export function FiscalCalendarCard({ year }: FiscalCalendarCardProps) {
  const { upcoming, allEvents } = useMemo(() => {
    const events = generateFiscalCalendar({ year });
    const up = getUpcomingFiscalEvents(events, 60); // next 60 days
    return { upcoming: up, allEvents: events };
  }, [year]);

  const pastCount = allEvents.filter((e) => e.isPast).length;
  const futureCount = allEvents.filter((e) => !e.isPast).length;

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Calendário Fiscal {year}</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {pastCount} passados · {futureCount} futuros
        </span>
      </div>

      {upcoming.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum vencimento fiscal nos próximos 60 dias.
        </p>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Próximos vencimentos</p>
          {upcoming.slice(0, 8).map((event) => (
            <FiscalEventRow key={event.id} event={event} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        Datas estimadas baseadas na legislação vigente. IPVA e IPTU variam por estado e município.
        Confirme com seu contador.
      </p>
    </div>
  );
}

function FiscalEventRow({ event }: { event: FiscalEvent }) {
  const colorClass = TYPE_COLORS[event.type] ?? "text-muted-foreground";
  const label = TYPE_LABELS[event.type] ?? event.type;

  return (
    <div className={`flex items-start gap-3 rounded-md border p-2.5 ${
      event.isUrgent ? "border-terracotta/30 bg-terracotta/5" : ""
    }`}>
      <div className="mt-0.5">
        {event.isUrgent ? (
          <AlertTriangle className="h-3.5 w-3.5 text-terracotta" />
        ) : (
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase ${colorClass}`}>{label}</span>
          <span className="text-xs font-medium">{event.title}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{event.description}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-xs tabular-nums">{formatDate(event.date)}</p>
        <p className={`text-[10px] ${event.isUrgent ? "text-terracotta font-medium" : "text-muted-foreground"}`}>
          {event.daysUntil === 0 ? "Hoje" :
           event.daysUntil === 1 ? "Amanhã" :
           `${event.daysUntil}d`}
        </p>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  const months = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${parseInt(d)} ${months[parseInt(m)]}`;
}

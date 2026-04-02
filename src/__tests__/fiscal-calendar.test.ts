/**
 * Oniefy - Fiscal Calendar Tests (E51)
 */

import {
  generateFiscalCalendar,
  getUpcomingFiscalEvents,
} from "@/lib/services/fiscal-calendar";

describe("Fiscal Calendar", () => {
  test("always includes IRPF events", () => {
    const events = generateFiscalCalendar({ year: 2026 });
    const irpf = events.filter((e) => e.type === "irpf");
    expect(irpf.length).toBeGreaterThanOrEqual(3);
    expect(irpf.some((e) => e.title.includes("Início"))).toBe(true);
    expect(irpf.some((e) => e.title.includes("Prazo final"))).toBe(true);
  });

  test("includes IPVA when user has vehicles and UF", () => {
    const events = generateFiscalCalendar({
      year: 2026,
      uf: "SP",
      hasVehicles: true,
    });
    const ipva = events.filter((e) => e.type === "ipva");
    expect(ipva.length).toBeGreaterThanOrEqual(3);
    expect(ipva[0].title).toContain("SP");
  });

  test("no IPVA without vehicles", () => {
    const events = generateFiscalCalendar({ year: 2026, uf: "SP" });
    const ipva = events.filter((e) => e.type === "ipva");
    expect(ipva).toHaveLength(0);
  });

  test("includes carnê-leão for autonomous income (12 months)", () => {
    const events = generateFiscalCalendar({
      year: 2026,
      hasAutonomousIncome: true,
    });
    const carne = events.filter((e) => e.type === "carne_leao");
    expect(carne).toHaveLength(12);
  });

  test("includes DARF for investment gains (12 months)", () => {
    const events = generateFiscalCalendar({
      year: 2026,
      hasInvestmentGains: true,
    });
    const darf = events.filter((e) => e.type === "darf");
    expect(darf).toHaveLength(12);
  });

  test("events are sorted by date", () => {
    const events = generateFiscalCalendar({
      year: 2026,
      uf: "SP",
      hasVehicles: true,
      hasAutonomousIncome: true,
    });
    for (let i = 1; i < events.length; i++) {
      expect(events[i].date >= events[i - 1].date).toBe(true);
    }
  });

  test("daysUntil is calculated correctly", () => {
    const events = generateFiscalCalendar({ year: 2090 }); // far future
    expect(events.every((e) => e.daysUntil > 0)).toBe(true);
    expect(events.every((e) => !e.isPast)).toBe(true);
  });

  test("getUpcomingFiscalEvents filters correctly", () => {
    const events = generateFiscalCalendar({ year: 2090 });
    const upcoming = getUpcomingFiscalEvents(events, 30);
    // All events in 2090 are far future, none within 30 days
    expect(upcoming).toHaveLength(0);
  });

  test("IPTU included when user has real estate", () => {
    const events = generateFiscalCalendar({
      year: 2026,
      hasRealEstate: true,
    });
    const iptu = events.filter((e) => e.type === "iptu");
    expect(iptu.length).toBeGreaterThanOrEqual(5);
  });

  test("last business day avoids weekends", () => {
    const events = generateFiscalCalendar({
      year: 2026,
      hasAutonomousIncome: true,
    });
    for (const e of events.filter((ev) => ev.type === "carne_leao")) {
      const d = new Date(e.date + "T12:00:00");
      expect(d.getDay()).not.toBe(0); // not Sunday
      expect(d.getDay()).not.toBe(6); // not Saturday
    }
  });
});

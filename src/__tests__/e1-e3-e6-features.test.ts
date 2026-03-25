/**
 * Tests: E1 (account health badge), E3 (subscription filter), E6 (savings goals enrichment)
 */

describe("E1: account health badge logic", () => {
  function healthBadge(
    updatedAt: string,
    currentBalance: number,
    projectedBalance: number
  ): "ok" | "divergence" | "stale" | "critical" | null {
    const days = Math.floor(
      (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const hasDivergence =
      Math.abs(currentBalance - projectedBalance) >
      Math.max(Math.abs(currentBalance) * 0.01, 1);

    if (days < 7 && !hasDivergence) return "ok";
    if (hasDivergence) return "divergence";
    if (days >= 30) return "critical";
    if (days >= 7) return "stale";
    return null;
  }

  it("recente e sem divergência: conferido", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(healthBadge(yesterday, 1000, 1000)).toBe("ok");
  });

  it("recente com divergência: divergência", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(healthBadge(yesterday, 1000, 1100)).toBe("divergence");
  });

  it("divergência pequena (< 1%) não conta", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(healthBadge(yesterday, 10000, 10005)).toBe("ok");
  });

  it("7-29 dias sem atualização: stale", () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    expect(healthBadge(twoWeeksAgo, 1000, 1000)).toBe("stale");
  });

  it("30+ dias sem atualização: critical", () => {
    const twoMonthsAgo = new Date(Date.now() - 60 * 86400000).toISOString();
    expect(healthBadge(twoMonthsAgo, 1000, 1000)).toBe("critical");
  });

  it("divergência prevalece sobre staleness", () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    expect(healthBadge(twoWeeksAgo, 1000, 1500)).toBe("divergence");
  });
});

describe("E3: subscription filter logic", () => {
  interface MockRecurrence {
    frequency: string;
    is_active: boolean;
    template_transaction: { type: string; amount: number; description: string };
  }

  function filterSubscriptions(recurrences: MockRecurrence[]): MockRecurrence[] {
    return recurrences.filter(
      (r) =>
        r.is_active &&
        r.frequency === "monthly" &&
        r.template_transaction.type === "expense"
    );
  }

  const MOCK: MockRecurrence[] = [
    { frequency: "monthly", is_active: true, template_transaction: { type: "expense", amount: 49.9, description: "Netflix" } },
    { frequency: "monthly", is_active: true, template_transaction: { type: "expense", amount: 34.9, description: "Spotify" } },
    { frequency: "monthly", is_active: true, template_transaction: { type: "income", amount: 5000, description: "Salário" } },
    { frequency: "monthly", is_active: false, template_transaction: { type: "expense", amount: 29.9, description: "Cancelada" } },
    { frequency: "yearly", is_active: true, template_transaction: { type: "expense", amount: 399, description: "Domínio" } },
    { frequency: "weekly", is_active: true, template_transaction: { type: "expense", amount: 150, description: "Faxina" } },
  ];

  it("filtra apenas despesas mensais ativas", () => {
    const subs = filterSubscriptions(MOCK);
    expect(subs).toHaveLength(2);
    expect(subs[0].template_transaction.description).toBe("Netflix");
    expect(subs[1].template_transaction.description).toBe("Spotify");
  });

  it("exclui receita mensal", () => {
    const subs = filterSubscriptions(MOCK);
    expect(subs.every((s) => s.template_transaction.type === "expense")).toBe(true);
  });

  it("exclui inativas", () => {
    const subs = filterSubscriptions(MOCK);
    expect(subs.every((s) => s.is_active)).toBe(true);
  });

  it("exclui yearly e weekly", () => {
    const subs = filterSubscriptions(MOCK);
    expect(subs.every((s) => s.frequency === "monthly")).toBe(true);
  });

  it("calcula total mensal", () => {
    const subs = filterSubscriptions(MOCK);
    const total = subs.reduce((s, r) => s + r.template_transaction.amount, 0);
    expect(total).toBeCloseTo(84.8, 1);
  });

  it("calcula custo anual", () => {
    const subs = filterSubscriptions(MOCK);
    const annual = subs.reduce((s, r) => s + r.template_transaction.amount, 0) * 12;
    expect(annual).toBeCloseTo(1017.6, 1);
  });
});

describe("E6: savings goal enrichment", () => {
  function enrichGoal(goal: {
    target_amount: number;
    current_amount: number;
    target_date: string | null;
  }) {
    const remaining = Math.max(0, goal.target_amount - goal.current_amount);
    const progress =
      goal.target_amount > 0
        ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
        : 0;

    let monthsRemaining: number | null = null;
    let monthlySavings: number | null = null;

    if (goal.target_date) {
      const now = new Date();
      const target = new Date(goal.target_date + "T12:00:00");
      const diffMs = target.getTime() - now.getTime();
      monthsRemaining = Math.max(
        0,
        Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.44))
      );
      monthlySavings =
        monthsRemaining > 0 ? remaining / monthsRemaining : remaining;
    }

    return { progress, remaining, monthsRemaining, monthlySavings };
  }

  it("0% progresso no início", () => {
    const r = enrichGoal({ target_amount: 50000, current_amount: 0, target_date: null });
    expect(r.progress).toBe(0);
    expect(r.remaining).toBe(50000);
  });

  it("50% de progresso", () => {
    const r = enrichGoal({ target_amount: 10000, current_amount: 5000, target_date: null });
    expect(r.progress).toBe(50);
    expect(r.remaining).toBe(5000);
  });

  it("100% quando atingido", () => {
    const r = enrichGoal({ target_amount: 10000, current_amount: 10000, target_date: null });
    expect(r.progress).toBe(100);
    expect(r.remaining).toBe(0);
  });

  it("cap em 100% quando excedeu", () => {
    const r = enrichGoal({ target_amount: 10000, current_amount: 12000, target_date: null });
    expect(r.progress).toBe(100);
    expect(r.remaining).toBe(0);
  });

  it("sem target_date: monthly é null", () => {
    const r = enrichGoal({ target_amount: 50000, current_amount: 0, target_date: null });
    expect(r.monthlySavings).toBeNull();
    expect(r.monthsRemaining).toBeNull();
  });

  it("com target_date: calcula meses e valor mensal", () => {
    // 12 months from now
    const future = new Date();
    future.setMonth(future.getMonth() + 12);
    const dateStr = future.toISOString().split("T")[0];
    const r = enrichGoal({ target_amount: 12000, current_amount: 0, target_date: dateStr });

    expect(r.monthsRemaining).toBeGreaterThanOrEqual(11);
    expect(r.monthsRemaining).toBeLessThanOrEqual(13);
    expect(r.monthlySavings).toBeGreaterThan(900);
    expect(r.monthlySavings).toBeLessThan(1200);
  });

  it("data passada: 0 meses, valor mensal = restante total", () => {
    const r = enrichGoal({
      target_amount: 10000,
      current_amount: 3000,
      target_date: "2020-01-01",
    });
    expect(r.monthsRemaining).toBe(0);
    expect(r.monthlySavings).toBe(7000);
  });

  it("target_amount zero: progresso zero", () => {
    const r = enrichGoal({ target_amount: 0, current_amount: 0, target_date: null });
    expect(r.progress).toBe(0);
  });
});

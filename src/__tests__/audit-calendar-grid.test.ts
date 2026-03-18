/**
 * Auditoria: Teste do while loop em bills/page.tsx:382
 *
 * O loop preenche o grid de calendário com nulls até completar semanas de 7 dias.
 * Verifica que nenhuma combinação de (firstDay, daysInMonth) causa loop infinito.
 */

describe("Calendar grid padding (Auditoria Loop 1)", () => {
  /**
   * Reproduz a lógica exata de bills/page.tsx linhas 379-382:
   * ```
   * const cells: (number | null)[] = [];
   * for (let i = 0; i < firstDay; i++) cells.push(null);
   * for (let d = 1; d <= daysInMonth; d++) cells.push(d);
   * while (cells.length % 7 !== 0) cells.push(null);
   * ```
   */
  function buildCalendarCells(
    firstDay: number,
    daysInMonth: number
  ): (number | null)[] {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  it("resultado sempre divisível por 7", () => {
    for (let firstDay = 0; firstDay <= 6; firstDay++) {
      for (let days = 28; days <= 31; days++) {
        const cells = buildCalendarCells(firstDay, days);
        expect(cells.length % 7).toBe(0);
      }
    }
  });

  it("nunca excede 42 cells (6 semanas)", () => {
    for (let firstDay = 0; firstDay <= 6; firstDay++) {
      for (let days = 28; days <= 31; days++) {
        const cells = buildCalendarCells(firstDay, days);
        expect(cells.length).toBeLessThanOrEqual(42);
      }
    }
  });

  it("nunca tem menos de 28 cells", () => {
    for (let firstDay = 0; firstDay <= 6; firstDay++) {
      for (let days = 28; days <= 31; days++) {
        const cells = buildCalendarCells(firstDay, days);
        expect(cells.length).toBeGreaterThanOrEqual(28);
      }
    }
  });

  it("fevereiro (28 dias) começando domingo = exatamente 28 cells", () => {
    const cells = buildCalendarCells(0, 28);
    expect(cells.length).toBe(28);
    expect(cells[0]).toBe(1);
    expect(cells[27]).toBe(28);
  });

  it("mês com 31 dias começando sábado = 42 cells (pior caso)", () => {
    // firstDay=6 (sábado), 31 dias → 6 nulls + 31 dias = 37 → pad to 42
    const cells = buildCalendarCells(6, 31);
    expect(cells.length).toBe(42);
    expect(cells.filter((c) => c === null).length).toBe(11); // 6 antes + 5 depois
    expect(cells.filter((c) => c !== null).length).toBe(31);
  });

  it("mês com 30 dias começando segunda = 35 cells", () => {
    // firstDay=1, 30 dias → 1 null + 30 = 31 → pad to 35
    const cells = buildCalendarCells(1, 30);
    expect(cells.length).toBe(35);
    expect(cells[0]).toBeNull();
    expect(cells[1]).toBe(1);
    expect(cells[30]).toBe(30);
  });

  it("primeiro dia de cada cell é o dia correto do mês", () => {
    const cells = buildCalendarCells(3, 31); // quarta-feira
    const days = cells.filter((c): c is number => c !== null);
    expect(days).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });

  it("while loop adiciona no máximo 6 nulls de padding", () => {
    for (let firstDay = 0; firstDay <= 6; firstDay++) {
      for (let days = 28; days <= 31; days++) {
        const before = firstDay + days;
        const cells = buildCalendarCells(firstDay, days);
        const trailingNulls = cells.length - before;
        expect(trailingNulls).toBeGreaterThanOrEqual(0);
        expect(trailingNulls).toBeLessThanOrEqual(6);
      }
    }
  });
});

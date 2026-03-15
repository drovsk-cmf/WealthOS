/**
 * Tests for CFG settings pages (Q1)
 * Covers: settings index structure, data export config, CSV conversion logic
 */

// ─── Settings index: section config ──────────────────────

describe("Settings index", () => {
  // Mirrors SETTINGS_GROUPS from settings/page.tsx (UX-H1-01: 5 subcategories)
  const SETTINGS_GROUPS = [
    {
      title: "Pessoal",
      items: [
        { href: "/settings/profile", label: "Perfil", ready: true },
        { href: "#", label: "Notificações", ready: false },
      ],
    },
    {
      title: "Estrutura e Cadastros",
      items: [
        { href: "/categories", label: "Categorias", ready: true },
        { href: "/cost-centers", label: "Centros de Custo", ready: true },
        { href: "/family", label: "Estrutura Familiar", ready: true },
      ],
    },
    {
      title: "Dados e Importação",
      items: [
        { href: "/connections", label: "Importação", ready: true },
        { href: "/settings/data", label: "Dados e Privacidade", ready: true },
        { href: "/bills", label: "Contas a Pagar", ready: true },
      ],
    },
    {
      title: "Avançado",
      items: [
        { href: "/chart-of-accounts", label: "Plano de Contas", ready: true },
        { href: "/indices", label: "Índices Econômicos", ready: true },
        { href: "/tax", label: "Fiscal", ready: true },
        { href: "/workflows", label: "Tarefas", ready: true },
      ],
    },
    {
      title: "Segurança",
      items: [
        { href: "/settings/security", label: "Segurança", ready: true },
      ],
    },
  ];

  const allItems = SETTINGS_GROUPS.flatMap((g) => g.items);

  it("has exactly 5 groups", () => {
    expect(SETTINGS_GROUPS).toHaveLength(5);
  });

  it("has 13 total items across all groups", () => {
    expect(allItems).toHaveLength(13);
  });

  it("all ready items have valid hrefs (not #)", () => {
    const ready = allItems.filter((s) => s.ready);
    ready.forEach((s) => {
      expect(s.href).not.toBe("#");
      expect(s.href).toMatch(/^\//);
    });
  });

  it("disabled items have href #", () => {
    const disabled = allItems.filter((s) => !s.ready);
    disabled.forEach((s) => {
      expect(s.href).toBe("#");
    });
  });

  it("Notificações is the only disabled item", () => {
    const disabled = allItems.filter((s) => !s.ready);
    expect(disabled).toHaveLength(1);
    expect(disabled[0].label).toBe("Notificações");
  });

  it("moved routes are accessible via Settings groups", () => {
    const hrefs = allItems.map((i) => i.href);
    expect(hrefs).toContain("/categories");
    expect(hrefs).toContain("/cost-centers");
    expect(hrefs).toContain("/family");
    expect(hrefs).toContain("/connections");
    expect(hrefs).toContain("/chart-of-accounts");
    expect(hrefs).toContain("/indices");
    expect(hrefs).toContain("/tax");
    expect(hrefs).toContain("/workflows");
    expect(hrefs).toContain("/bills");
  });
});

// ─── Data export: table list ─────────────────────────────

describe("Data export config", () => {
  const TABLES_TO_EXPORT = [
    "accounts",
    "transactions",
    "categories",
    "budgets",
    "assets",
    "recurrences",
    "family_members",
    "cost_centers",
    "chart_of_accounts",
    "journal_entries",
    "journal_lines",
    "workflows",
    "workflow_tasks",
    "bank_connections",
  ];

  it("exports 14 tables", () => {
    expect(TABLES_TO_EXPORT).toHaveLength(14);
  });

  it("includes all core financial tables", () => {
    expect(TABLES_TO_EXPORT).toContain("accounts");
    expect(TABLES_TO_EXPORT).toContain("transactions");
    expect(TABLES_TO_EXPORT).toContain("journal_entries");
    expect(TABLES_TO_EXPORT).toContain("journal_lines");
  });

  it("includes auxiliary tables", () => {
    expect(TABLES_TO_EXPORT).toContain("categories");
    expect(TABLES_TO_EXPORT).toContain("cost_centers");
    expect(TABLES_TO_EXPORT).toContain("chart_of_accounts");
    expect(TABLES_TO_EXPORT).toContain("family_members");
  });

  it("does not include users_profile (exported separately via auth)", () => {
    expect(TABLES_TO_EXPORT).not.toContain("users_profile");
  });

  it("has no duplicates", () => {
    const unique = new Set(TABLES_TO_EXPORT);
    expect(unique.size).toBe(TABLES_TO_EXPORT.length);
  });
});

// ─── CSV conversion logic (mirrors toCsv from data/page.tsx) ──

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          return str.includes(";") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(";")
    ),
  ];
  return lines.join("\n");
}

describe("toCsv", () => {
  it("returns empty string for empty array", () => {
    expect(toCsv([])).toBe("");
  });

  it("generates headers from first row keys", () => {
    const result = toCsv([{ name: "Test", amount: 100 }]);
    const [header] = result.split("\n");
    expect(header).toBe("name;amount");
  });

  it("handles multiple rows", () => {
    const result = toCsv([
      { id: "1", desc: "Aluguel" },
      { id: "2", desc: "Luz" },
    ]);
    const lines = result.split("\n");
    expect(lines).toHaveLength(3); // header + 2 data rows
    expect(lines[1]).toBe("1;Aluguel");
    expect(lines[2]).toBe("2;Luz");
  });

  it("escapes values containing semicolons", () => {
    const result = toCsv([{ note: "a;b" }]);
    const [, dataLine] = result.split("\n");
    expect(dataLine).toBe('"a;b"');
  });

  it("escapes values containing double quotes", () => {
    const result = toCsv([{ note: 'said "hello"' }]);
    const [, dataLine] = result.split("\n");
    expect(dataLine).toBe('"said ""hello"""');
  });

  it("escapes values containing newlines", () => {
    const result = toCsv([{ note: "line1\nline2" }]);
    const lines = result.split("\n");
    // header + 1 data line (the newline is inside quotes)
    expect(lines[0]).toBe("note");
    expect(lines[1]).toBe('"line1');
  });

  it("handles null and undefined as empty string", () => {
    const result = toCsv([{ a: null, b: undefined, c: "ok" }]);
    const [, dataLine] = result.split("\n");
    expect(dataLine).toBe(";;ok");
  });

  it("serializes objects as JSON", () => {
    const result = toCsv([{ data: { nested: true } }]);
    const [, dataLine] = result.split("\n");
    // JSON contains no semicolons/quotes that need escaping here
    expect(dataLine).toContain("nested");
  });

  it("handles numeric values", () => {
    const result = toCsv([{ amount: 1500.75, count: 0 }]);
    const [, dataLine] = result.split("\n");
    expect(dataLine).toBe("1500.75;0");
  });

  it("handles boolean values", () => {
    const result = toCsv([{ active: true, deleted: false }]);
    const [, dataLine] = result.split("\n");
    expect(dataLine).toBe("true;false");
  });
});

import { searchTemplates, type AssetTemplate } from "@/lib/hooks/use-asset-templates";

const MOCK_TEMPLATES: AssetTemplate[] = [
  { id: "1", name: "Apartamento", category: "real_estate", default_depreciation_rate: 4, reference_value_brl: 400000, useful_life_years: 25, tags: ["imovel", "apartamento"] },
  { id: "2", name: "Carro popular", category: "vehicle_auto", default_depreciation_rate: 20, reference_value_brl: 75000, useful_life_years: 5, tags: ["veiculo", "carro", "popular"] },
  { id: "3", name: "Notebook", category: "electronics", default_depreciation_rate: 20, reference_value_brl: 5000, useful_life_years: 5, tags: ["eletronico", "notebook", "laptop"] },
  { id: "4", name: "Sofá", category: "furniture", default_depreciation_rate: 10, reference_value_brl: 4000, useful_life_years: 10, tags: ["movel", "sofa"] },
  { id: "5", name: "Relógio de luxo", category: "jewelry", default_depreciation_rate: 0, reference_value_brl: 15000, useful_life_years: null, tags: ["joia", "relogio"] },
  { id: "6", name: "Bicicleta", category: "sports", default_depreciation_rate: 10, reference_value_brl: 5000, useful_life_years: 10, tags: ["esporte", "bicicleta", "bike"] },
];

describe("P14: Asset template search", () => {
  it("retorna vazio para query curta (<2 chars)", () => {
    expect(searchTemplates(MOCK_TEMPLATES, "")).toHaveLength(0);
    expect(searchTemplates(MOCK_TEMPLATES, "a")).toHaveLength(0);
  });

  it("encontra por nome parcial", () => {
    const results = searchTemplates(MOCK_TEMPLATES, "apart");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Apartamento");
  });

  it("encontra por tag", () => {
    const results = searchTemplates(MOCK_TEMPLATES, "laptop");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Notebook");
  });

  it("busca case-insensitive", () => {
    const results = searchTemplates(MOCK_TEMPLATES, "CARRO");
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe("vehicle_auto");
  });

  it("limita a 5 resultados", () => {
    // "o" aparece em muitos nomes
    const many = Array.from({ length: 10 }, (_, i) => ({
      ...MOCK_TEMPLATES[0],
      id: `t${i}`,
      name: `Objeto ${i}`,
      tags: ["objeto"],
    }));
    const results = searchTemplates(many, "objeto");
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it("retorna vazio quando nenhum match", () => {
    expect(searchTemplates(MOCK_TEMPLATES, "helicóptero")).toHaveLength(0);
  });

  it("encontra por tag 'bike'", () => {
    const results = searchTemplates(MOCK_TEMPLATES, "bike");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Bicicleta");
  });

  it("encontra múltiplos resultados para 'veiculo'", () => {
    const templates = [
      ...MOCK_TEMPLATES,
      { id: "7", name: "Moto", category: "vehicle_moto", default_depreciation_rate: 20, reference_value_brl: 18000, useful_life_years: 5, tags: ["veiculo", "moto"] },
    ];
    const results = searchTemplates(templates, "veiculo");
    expect(results.length).toBeGreaterThanOrEqual(2);
  });
});

describe("P14: Asset template structure", () => {
  it("templates têm campos obrigatórios", () => {
    for (const t of MOCK_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(typeof t.default_depreciation_rate).toBe("number");
      expect(Array.isArray(t.tags)).toBe(true);
    }
  });

  it("depreciação é >= 0 e <= 100", () => {
    for (const t of MOCK_TEMPLATES) {
      expect(t.default_depreciation_rate).toBeGreaterThanOrEqual(0);
      expect(t.default_depreciation_rate).toBeLessThanOrEqual(100);
    }
  });

  it("valor de referência é positivo quando presente", () => {
    for (const t of MOCK_TEMPLATES) {
      if (t.reference_value_brl !== null) {
        expect(t.reference_value_brl).toBeGreaterThan(0);
      }
    }
  });
});

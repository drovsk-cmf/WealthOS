import { CENTER_TYPE_LABELS, CENTER_TYPE_OPTIONS } from "@/lib/hooks/use-cost-centers";

describe("P1: Centro de Custo → Divisão renaming", () => {
  it("CENTER_TYPE_LABELS usa 'Divisão' em vez de 'Centro'", () => {
    expect(CENTER_TYPE_LABELS.cost_center).toBe("Divisão de Custo");
    expect(CENTER_TYPE_LABELS.profit_center).toBe("Divisão de Lucro");
    expect(CENTER_TYPE_LABELS.neutral).toBe("Neutro");
  });

  it("CENTER_TYPE_OPTIONS usa 'Divisão' nos labels", () => {
    const costOpt = CENTER_TYPE_OPTIONS.find((o) => o.value === "cost_center");
    const profitOpt = CENTER_TYPE_OPTIONS.find((o) => o.value === "profit_center");
    expect(costOpt?.label).toBe("Divisão de Custo");
    expect(profitOpt?.label).toBe("Divisão de Lucro");
  });

  it("CENTER_TYPE_OPTIONS tem 3 opções", () => {
    expect(CENTER_TYPE_OPTIONS).toHaveLength(3);
  });

  it("cada opção tem value, label e desc", () => {
    for (const opt of CENTER_TYPE_OPTIONS) {
      expect(opt.value).toBeTruthy();
      expect(opt.label).toBeTruthy();
      expect(opt.desc).toBeTruthy();
    }
  });
});

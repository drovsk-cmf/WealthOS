import {
  detectOniefyTemplate,
  DOMAIN_TEMPLATE_INFO,
  type DomainTemplate,
} from "@/lib/parsers/oniefy-template";

describe("P9: Domain template metadata", () => {
  const DOMAINS: DomainTemplate[] = ["assets", "vehicles", "investments"];

  it("DOMAIN_TEMPLATE_INFO tem 3 domínios", () => {
    expect(Object.keys(DOMAIN_TEMPLATE_INFO)).toHaveLength(3);
  });

  it("cada domínio tem label, fileName e description", () => {
    for (const domain of DOMAINS) {
      const info = DOMAIN_TEMPLATE_INFO[domain];
      expect(info.label).toBeTruthy();
      expect(info.fileName).toMatch(/\.xlsx$/);
      expect(info.description).toBeTruthy();
    }
  });

  it("fileNames são únicos", () => {
    const names = DOMAINS.map((d) => DOMAIN_TEMPLATE_INFO[d].fileName);
    expect(new Set(names).size).toBe(names.length);
  });

  it("fileNames seguem padrão oniefy-template-*.xlsx", () => {
    for (const domain of DOMAINS) {
      expect(DOMAIN_TEMPLATE_INFO[domain].fileName).toMatch(/^oniefy-template-.+\.xlsx$/);
    }
  });
});

describe("Oniefy template detection (existing)", () => {
  it("detecta template standard", () => {
    expect(detectOniefyTemplate(["Data", "Tipo", "Valor", "Descrição", "Categoria"])).toBe("standard");
  });

  it("detecta template card", () => {
    expect(detectOniefyTemplate(["Data", "Descrição Original", "Valor", "Parcela"])).toBe("card");
  });

  it("retorna null para headers desconhecidos", () => {
    expect(detectOniefyTemplate(["Coluna A", "Coluna B"])).toBeNull();
  });

  it("detecta com headers normalizados (lowercase)", () => {
    expect(detectOniefyTemplate(["data", "tipo", "valor", "descrição"])).toBe("standard");
  });
});

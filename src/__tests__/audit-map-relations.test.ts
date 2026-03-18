import {
  mapTransactionRelations,
  mapAccountRelation,
  mapCategoryRelation,
} from "@/lib/utils/map-relations";

describe("mapTransactionRelations (Auditoria Problema 8)", () => {
  describe("mapAccountRelation", () => {
    it("extrai name e color de account com JOIN", () => {
      const row = { accounts: { name: "Nubank", color: "#8B2F8B" } };
      const result = mapAccountRelation(row);
      expect(result.account_name).toBe("Nubank");
      expect(result.account_color).toBe("#8B2F8B");
    });

    it("retorna defaults para accounts null", () => {
      const result = mapAccountRelation({ accounts: null });
      expect(result.account_name).toBe("");
      expect(result.account_color).toBeNull();
    });

    it("retorna defaults para accounts undefined (campo ausente)", () => {
      const result = mapAccountRelation({});
      expect(result.account_name).toBe("");
      expect(result.account_color).toBeNull();
    });

    it("retorna defaults para accounts com campos internos null", () => {
      const row = { accounts: { name: null, color: null } };
      const result = mapAccountRelation(row);
      expect(result.account_name).toBe("");
      expect(result.account_color).toBeNull();
    });
  });

  describe("mapCategoryRelation", () => {
    it("extrai name, icon e color de category com JOIN", () => {
      const row = {
        categories: { name: "Alimentação", icon: "utensils", color: "#FF5733" },
      };
      const result = mapCategoryRelation(row);
      expect(result.category_name).toBe("Alimentação");
      expect(result.category_icon).toBe("utensils");
      expect(result.category_color).toBe("#FF5733");
    });

    it("retorna nulls para categories null", () => {
      const result = mapCategoryRelation({ categories: null });
      expect(result.category_name).toBeNull();
      expect(result.category_icon).toBeNull();
      expect(result.category_color).toBeNull();
    });

    it("retorna nulls para categories undefined", () => {
      const result = mapCategoryRelation({});
      expect(result.category_name).toBeNull();
      expect(result.category_icon).toBeNull();
      expect(result.category_color).toBeNull();
    });

    it("category sem icon retorna icon null", () => {
      const row = { categories: { name: "Transporte", icon: null, color: "#333" } };
      const result = mapCategoryRelation(row);
      expect(result.category_name).toBe("Transporte");
      expect(result.category_icon).toBeNull();
      expect(result.category_color).toBe("#333");
    });
  });

  describe("mapTransactionRelations (combinado)", () => {
    it("extrai account + category de row completo", () => {
      const row = {
        id: "tx-1",
        amount: 150,
        accounts: { name: "Inter", color: "#FF6600" },
        categories: { name: "Saúde", icon: "heart", color: "#E74C3C" },
      };
      const result = mapTransactionRelations(row);
      expect(result).toEqual({
        account_name: "Inter",
        account_color: "#FF6600",
        category_name: "Saúde",
        category_icon: "heart",
        category_color: "#E74C3C",
      });
    });

    it("lida com row sem nenhuma relação", () => {
      const result = mapTransactionRelations({ id: "tx-2" });
      expect(result).toEqual({
        account_name: "",
        account_color: null,
        category_name: null,
        category_icon: null,
        category_color: null,
      });
    });

    it("pode ser espalhado com spread operator sem conflitos", () => {
      const row = {
        id: "tx-3",
        amount: 99,
        accounts: { name: "BTG", color: "#000" },
        categories: null,
      };
      const merged = { ...row, ...mapTransactionRelations(row) };
      expect(merged.id).toBe("tx-3");
      expect(merged.amount).toBe(99);
      expect(merged.account_name).toBe("BTG");
      expect(merged.category_name).toBeNull();
    });
  });
});

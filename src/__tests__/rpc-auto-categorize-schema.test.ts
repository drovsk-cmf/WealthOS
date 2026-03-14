import { autoCategorizeTransactionSchema } from "@/lib/schemas/rpc";

describe("auto_categorize_transaction response schema", () => {
  it("aceita UUID válido", () => {
    const parsed = autoCategorizeTransactionSchema.safeParse("11111111-1111-4111-8111-111111111111");
    expect(parsed.success).toBe(true);
  });

  it("aceita null quando não há categoria", () => {
    const parsed = autoCategorizeTransactionSchema.safeParse(null);
    expect(parsed.success).toBe(true);
  });

  it("rejeita string não-uuid", () => {
    const parsed = autoCategorizeTransactionSchema.safeParse("categoria-xpto");
    expect(parsed.success).toBe(false);
  });

  it("rejeita objeto inválido", () => {
    const parsed = autoCategorizeTransactionSchema.safeParse({ category_id: "111" });
    expect(parsed.success).toBe(false);
  });
});

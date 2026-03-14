import { completeOnboardingSeeds } from "@/app/(auth)/onboarding/page";

describe("onboarding seeds", () => {
  it("não marca onboarding_completed quando seed falha", async () => {
    const updateEq = jest.fn();
    const supabase = {
      rpc: jest.fn().mockImplementation((fn: string) => {
        if (fn === "create_default_categories") {
          return Promise.resolve({ error: { message: "erro seed" } });
        }
        return Promise.resolve({ error: null });
      }),
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: updateEq }),
      }),
    };

    await expect(completeOnboardingSeeds(supabase, "user-1")).rejects.toThrow("Erro ao criar categorias padrão");
    expect(updateEq).not.toHaveBeenCalled();
  });

  it("marca onboarding_completed quando todas seeds passam", async () => {
    const updateEq = jest.fn().mockResolvedValue({ error: null });
    const supabase = {
      rpc: jest.fn().mockResolvedValue({ error: null }),
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: updateEq }),
      }),
    };

    await expect(completeOnboardingSeeds(supabase, "user-2")).resolves.toBeUndefined();
    expect(updateEq).toHaveBeenCalledWith("id", "user-2");
  });
});

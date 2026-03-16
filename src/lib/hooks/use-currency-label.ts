"use client";

/**
 * useCurrencyLabel (D7.04)
 *
 * Returns the user's default currency code and display symbol
 * for use in form labels. Falls back to BRL.
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const CURRENCY_SYMBOLS: Record<string, string> = {
  BRL: "R$",
  USD: "US$",
  EUR: "€",
  GBP: "£",
};

export function useCurrencyLabel() {
  const supabase = createClient();

  const { data } = useQuery({
    queryKey: ["profile-currency"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { code: "BRL", symbol: "R$" };
      const { data: profile } = await supabase
        .from("users_profile")
        .select("default_currency")
        .eq("id", user.id)
        .single();
      const code = profile?.default_currency ?? "BRL";
      return { code, symbol: CURRENCY_SYMBOLS[code] ?? code };
    },
  });

  return data ?? { code: "BRL", symbol: "R$" };
}

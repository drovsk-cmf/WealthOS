"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface CurrencyRate {
  rate: number;
  source: string;
  updated: string;
}

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  tier: number;
  category: "fiat" | "crypto";
}

/**
 * Fetches latest exchange rates for all supported currencies (X → BRL).
 * Cached for 30 minutes (rates update daily).
 */
export function useCurrencyRates() {
  const supabase = createClient();

  return useQuery<Record<string, CurrencyRate>>({
    queryKey: ["currency_rates"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_currency_rates");
      if (error) throw error;
      return (data as unknown as Record<string, CurrencyRate>) ?? {};
    },
    staleTime: 30 * 60 * 1000, // 30 min
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Static list of supported currencies with metadata.
 * Cached indefinitely (changes only on deploy).
 */
export function useSupportedCurrencies() {
  const supabase = createClient();

  return useQuery<SupportedCurrency[]>({
    queryKey: ["supported_currencies"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_supported_currencies");
      if (error) throw error;
      return (data as unknown as SupportedCurrency[]) ?? [];
    },
    staleTime: Infinity,
  });
}

/**
 * Converts an amount from a given currency to BRL using latest rates.
 * Returns the original amount if currency is BRL or rate is unavailable.
 */
export function convertToBrl(
  amount: number,
  currency: string | null | undefined,
  rates: Record<string, CurrencyRate> | undefined
): number {
  if (!currency || currency === "BRL" || !rates) return amount;
  const rate = rates[currency.toUpperCase()];
  return rate ? amount * rate.rate : amount;
}

/**
 * Groups currencies by tier for rendering in select dropdowns.
 */
export function groupCurrenciesByTier(currencies: SupportedCurrency[]) {
  const groups: { label: string; currencies: SupportedCurrency[] }[] = [
    { label: "Moedas oficiais (PTAX)", currencies: [] },
    { label: "Outras moedas", currencies: [] },
    { label: "Criptomoedas", currencies: [] },
  ];

  for (const c of currencies) {
    if (c.category === "crypto") groups[2].currencies.push(c);
    else if (c.tier === 1) groups[0].currencies.push(c);
    else groups[1].currencies.push(c);
  }

  return groups.filter((g) => g.currencies.length > 0);
}

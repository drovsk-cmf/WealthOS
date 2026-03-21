/**
 * useAiCategorize - P11 (adendo v1.5 §5.4 etapa 3)
 *
 * Hook para categorização por IA via /api/ai/categorize.
 * Chamado como fallback quando auto_categorize_transaction (etapas 1-2) não resolve.
 *
 * Fluxo:
 * 1. Frontend chama com array de descrições sem categoria
 * 2. API route sanitiza PII, checa cache, chama Gemini se necessário
 * 3. Retorna mapeamento descrição → categoria sugerida
 *
 * Rate limit: 50 chamadas/mês (free tier), verificado server-side.
 */

import { useMutation } from "@tanstack/react-query";

interface AiCategorizeResult {
  description: string;
  category: string;
  confidence: number;
}

interface AiCategorizeResponse {
  results: AiCategorizeResult[];
  rateLimit: { used: number; limit: number; remaining: number; allowed: boolean } | null;
}

export function useAiCategorize() {
  return useMutation({
    mutationKey: ["ai-categorize"],
    mutationFn: async (descriptions: string[]): Promise<AiCategorizeResponse> => {
      const resp = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptions }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro de conexão" }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      return resp.json();
    },
  });
}

/**
 * Filter descriptions that need AI categorization
 * (no category assigned after deterministic pipeline).
 */
export function getUncategorizedDescriptions(
  transactions: { description?: string | null; category_id?: string | null }[]
): string[] {
  return transactions
    .filter((tx) => !tx.category_id && tx.description?.trim())
    .map((tx) => tx.description!.trim())
    .filter((desc, i, arr) => arr.indexOf(desc) === i); // deduplicate
}

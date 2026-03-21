/**
 * AI Gateway - POST /api/ai/categorize (P11)
 *
 * Server-side route that:
 * 1. Authenticates via Supabase session
 * 2. Checks rate limit (50/month free tier)
 * 3. Sanitizes PII from descriptions
 * 4. Checks ai_cache for cached result
 * 5. Calls AI provider (Gemini Flash-Lite) if not cached
 * 6. Saves to cache + logs usage
 *
 * Request body: { descriptions: string[] }
 * Response: { results: { description: string; category: string; confidence: number }[] }
 *
 * Requires env: GEMINI_API_KEY (optional - returns empty results if not set)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GEMINI_MODEL = "gemini-2.0-flash-lite";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_BATCH = 20;

// PII sanitizer (server-side copy to avoid client import issues)
function sanitize(input: string): string {
  return input
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF]")
    .replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, "[CNPJ]")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]")
    .replace(/(?:\+?55\s?)?(?:\(?\d{2}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}\b/g, "[TEL]")
    .replace(/\b\d{4}[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{2,4}\b/g, "[CARTAO]");
}

async function hashText(text: string): Promise<string> {
  const data = new TextEncoder().encode(text.toLowerCase().trim());
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface CategorizeResult {
  description: string;
  category: string;
  confidence: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const descriptions: string[] = body.descriptions;
    if (!Array.isArray(descriptions) || descriptions.length === 0) {
      return NextResponse.json({ error: "descriptions deve ser um array não vazio" }, { status: 400 });
    }
    if (descriptions.length > MAX_BATCH) {
      return NextResponse.json({ error: `Máximo ${MAX_BATCH} descrições por chamada` }, { status: 400 });
    }

    // 1. Check rate limit
    const { data: rateLimitRaw } = await supabase.rpc("check_ai_rate_limit", {
      p_user_id: user.id,
    });
    const rateLimit = rateLimitRaw as { used: number; limit: number; remaining: number; allowed: boolean } | null;
    if (rateLimit && !rateLimit.allowed) {
      return NextResponse.json({
        error: `Limite mensal de IA atingido (${rateLimit.used}/${rateLimit.limit}). Resets no próximo mês.`,
        rateLimit,
      }, { status: 429 });
    }

    // 2. Sanitize + hash
    const sanitized = descriptions.map(sanitize);
    const hashes = await Promise.all(sanitized.map(hashText));

    // 3. Check cache for each
    const results: CategorizeResult[] = [];
    const uncached: { idx: number; desc: string; hash: string }[] = [];

    for (let i = 0; i < sanitized.length; i++) {
      const { data: cached } = await supabase.rpc("get_ai_cache", {
        p_prompt_hash: hashes[i],
        p_model: GEMINI_MODEL,
        p_use_case: "categorize",
      });

      if (cached && typeof cached === "object" && "category" in (cached as Record<string, unknown>)) {
        const c = cached as unknown as CategorizeResult;
        results[i] = { description: descriptions[i], category: c.category, confidence: c.confidence };
        // Log cached hit
        await supabase.rpc("save_ai_result", {
          p_user_id: user.id,
          p_prompt_hash: hashes[i],
          p_model: GEMINI_MODEL,
          p_use_case: "categorize",
          p_prompt_sanitized: sanitized[i],
          p_response: cached,
          p_cached: true,
        });
      } else {
        uncached.push({ idx: i, desc: sanitized[i], hash: hashes[i] });
      }
    }

    // 4. Call AI for uncached items
    const apiKey = process.env.GEMINI_API_KEY;
    if (uncached.length > 0 && apiKey) {
      try {
        const prompt = `Categorize cada transação financeira brasileira na categoria mais apropriada.
Categorias possíveis: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Vestuário, Serviços, Seguros, Impostos e Taxas, Salário, Freelance, Rendimentos, Aluguel Recebido, Outro.
Responda APENAS com JSON: [{"index": 0, "category": "Categoria", "confidence": 0.95}]
Transações:
${uncached.map((u, i) => `${i}. ${u.desc}`).join("\n")}`;

        const resp = await fetch(`${GEMINI_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          const tokensIn = data.usageMetadata?.promptTokenCount ?? 0;
          const tokensOut = data.usageMetadata?.candidatesTokenCount ?? 0;

          // Parse JSON from response (may be wrapped in ```json)
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as { index: number; category: string; confidence: number }[];

            for (const item of parsed) {
              const u = uncached[item.index];
              if (!u) continue;

              const result: CategorizeResult = {
                description: descriptions[u.idx],
                category: item.category,
                confidence: item.confidence ?? 0.8,
              };
              results[u.idx] = result;

              // Save to cache + log
              // Cost: Gemini Flash-Lite ~$0.075/1M input, $0.30/1M output
              const costPerItem = ((tokensIn * 0.000000075) + (tokensOut * 0.0000003)) / uncached.length;
              await supabase.rpc("save_ai_result", {
                p_user_id: user.id,
                p_prompt_hash: u.hash,
                p_model: GEMINI_MODEL,
                p_use_case: "categorize",
                p_prompt_sanitized: u.desc,
                p_response: JSON.parse(JSON.stringify(result)),
                p_tokens_in: Math.ceil(tokensIn / uncached.length),
                p_tokens_out: Math.ceil(tokensOut / uncached.length),
                p_cost_usd: costPerItem,
                p_cached: false,
              });
            }
          }
        }
      } catch (aiErr) {
        // AI failure is non-fatal: items stay uncategorized
        console.error("[AI Gateway]", aiErr);
      }
    }

    // Fill any remaining gaps
    for (let i = 0; i < descriptions.length; i++) {
      if (!results[i]) {
        results[i] = { description: descriptions[i], category: "", confidence: 0 };
      }
    }

    return NextResponse.json({ results, rateLimit: rateLimit ?? null });
  } catch (err) {
    console.error("[AI Gateway]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

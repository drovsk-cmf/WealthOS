/**
 * Monthly Insights - POST /api/ai/insights (P13)
 *
 * Generates a narrative monthly summary using Claude Haiku 4.5 (or Gemini fallback).
 * Input: dashboard data snapshot (aggregated, no PII)
 * Output: 3-4 paragraph narrative in pt-BR, stored in user_insights
 *
 * Requires: ANTHROPIC_API_KEY or GEMINI_API_KEY
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface InsightInput {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  balance: number;
  net_worth: number;
  top_categories: { name: string; total: number }[];
  savings_rate: number;
  runway_months: number;
}

async function generateWithClaude(data: InsightInput, apiKey: string): Promise<{ content: string; model: string; tokens: number } | null> {
  try {
    const prompt = `Você é o assistente financeiro do Oniefy. Gere um resumo mensal narrativo em pt-BR para ${data.month}.

Dados do mês:
- Receita: R$ ${data.income.toFixed(2)}
- Despesa: R$ ${data.expense.toFixed(2)}
- Saldo: R$ ${data.balance.toFixed(2)}
- Patrimônio líquido: R$ ${data.net_worth.toFixed(2)}
- Taxa de poupança: ${data.savings_rate.toFixed(1)}%
- Fôlego: ${data.runway_months.toFixed(1)} meses
- Top categorias: ${data.top_categories.map((c) => `${c.name} (R$ ${c.total.toFixed(2)})`).join(", ")}

Escreva 3-4 parágrafos curtos. Tom: profissional, direto, com uma pitada de encorajamento quando cabível. Foque em: o que aconteceu, o que melhorou/piorou, e uma sugestão concreta para o próximo mês. Não use markdown, apenas texto corrido.`;

    const resp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) return null;
    const result = await resp.json();
    const text = result.content?.[0]?.text ?? "";
    const tokens = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);
    return { content: text, model: "claude-haiku-4-5-20251001", tokens };
  } catch {
    return null;
  }
}

async function generateWithGemini(data: InsightInput, apiKey: string): Promise<{ content: string; model: string; tokens: number } | null> {
  try {
    const prompt = `Gere um resumo financeiro mensal narrativo em pt-BR para ${data.month}.
Dados: Receita R$ ${data.income.toFixed(2)}, Despesa R$ ${data.expense.toFixed(2)}, Saldo R$ ${data.balance.toFixed(2)}, Patrimônio R$ ${data.net_worth.toFixed(2)}, Poupança ${data.savings_rate.toFixed(1)}%, Fôlego ${data.runway_months.toFixed(1)} meses.
Top categorias: ${data.top_categories.map((c) => `${c.name} R$ ${c.total.toFixed(2)}`).join(", ")}.
Escreva 3-4 parágrafos curtos, tom profissional e direto em pt-BR. Sem markdown.`;

    const resp = await fetch(`${GEMINI_URL}/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
      }),
    });

    if (!resp.ok) return null;
    const result = await resp.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const tokens = (result.usageMetadata?.promptTokenCount ?? 0) + (result.usageMetadata?.candidatesTokenCount ?? 0);
    return { content: text, model: "gemini-2.0-flash-lite", tokens };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const data: InsightInput = await request.json();
    if (!data.month?.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json({ error: "month deve ser YYYY-MM" }, { status: 400 });
    }

    // Check if insight already exists for this month
    const { data: existing } = await supabase
      .from("user_insights")
      .select("id, content")
      .eq("user_id", user.id)
      .eq("month", data.month)
      .eq("insight_type", "monthly_summary")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ insight: existing.content, cached: true });
    }

    // Rate limit
    const { data: rl } = await supabase.rpc("check_ai_rate_limit", { p_user_id: user.id });
    const rateLimit = rl as { allowed: boolean } | null;
    if (rateLimit && !rateLimit.allowed) {
      return NextResponse.json({ error: "Limite mensal de IA atingido." }, { status: 429 });
    }

    // Try Claude Haiku first, then Gemini fallback
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let result = anthropicKey ? await generateWithClaude(data, anthropicKey) : null;
    if (!result && geminiKey) {
      result = await generateWithGemini(data, geminiKey);
    }

    if (!result || !result.content) {
      return NextResponse.json({ error: "Nenhum provedor de IA disponível." }, { status: 503 });
    }

    // Save insight
    await supabase.from("user_insights").insert({
      user_id: user.id,
      month: data.month,
      insight_type: "monthly_summary",
      content: result.content,
      data_snapshot: JSON.parse(JSON.stringify(data)),
      model: result.model,
      tokens_used: result.tokens,
    });

    // Log usage
    await supabase.rpc("save_ai_result", {
      p_user_id: user.id,
      p_prompt_hash: `insight-${data.month}`,
      p_model: result.model,
      p_use_case: "insight",
      p_prompt_sanitized: `Monthly insight ${data.month}`,
      p_response: JSON.parse(JSON.stringify({ content: result.content.slice(0, 200) })),
      p_tokens_in: Math.ceil(result.tokens * 0.7),
      p_tokens_out: Math.ceil(result.tokens * 0.3),
      p_cost_usd: result.model.includes("claude") ? result.tokens * 0.0000013 : result.tokens * 0.0000002,
      p_cached: false,
    });

    return NextResponse.json({ insight: result.content, cached: false, model: result.model });
  } catch (err) {
    console.error("[AI Insights]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

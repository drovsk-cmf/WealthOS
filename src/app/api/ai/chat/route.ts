/**
 * Conversational Assistant - POST /api/ai/chat (P17)
 *
 * NLP → structured query via Claude Sonnet tool calling.
 * User asks in natural language, assistant translates to Supabase queries.
 *
 * Examples:
 * - "Quanto gastei em alimentação esse mês?" → query transactions
 * - "Qual meu patrimônio líquido?" → get_balance_sheet RPC
 * - "Me mostra as despesas do carro" → filter by asset_id
 *
 * Requires: ANTHROPIC_API_KEY (Claude Sonnet)
 * Fallback: GEMINI_API_KEY (Gemini Flash, no tool calling)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const TOOLS = [
  {
    name: "query_transactions",
    description: "Busca transações filtradas por tipo, categoria, período, conta ou ativo",
    input_schema: {
      type: "object" as const,
      properties: {
        type: { type: "string", enum: ["income", "expense", "transfer"], description: "Tipo de transação" },
        category_name: { type: "string", description: "Nome da categoria (ex: Alimentação, Transporte)" },
        date_from: { type: "string", description: "Data início ISO (YYYY-MM-DD)" },
        date_to: { type: "string", description: "Data fim ISO (YYYY-MM-DD)" },
        asset_name: { type: "string", description: "Nome do bem relacionado" },
        limit: { type: "number", description: "Máximo de resultados (default 10)" },
      },
    },
  },
  {
    name: "get_summary",
    description: "Retorna resumo financeiro do mês: receita, despesa, saldo, patrimônio",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_balance_sheet",
    description: "Retorna balanço patrimonial: ativos líquidos/ilíquidos, passivos, patrimônio líquido",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_category_spending",
    description: "Retorna gastos por categoria no mês atual",
    input_schema: { type: "object" as const, properties: {} },
  },
];

async function executeTool(toolName: string, toolInput: Record<string, unknown>, userId: string) {
  const supabase = await createClient();

  switch (toolName) {
    case "query_transactions": {
      let query = supabase
        .from("transactions")
        .select("date, type, amount, description, is_paid")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .order("date", { ascending: false })
        .limit(Number(toolInput.limit) || 10);

      if (toolInput.type) query = query.eq("type", toolInput.type);
      if (toolInput.date_from) query = query.gte("date", toolInput.date_from);
      if (toolInput.date_to) query = query.lte("date", toolInput.date_to);

      const { data } = await query;
      return data ?? [];
    }

    case "get_summary": {
      const { data } = await supabase.rpc("get_dashboard_summary", { p_user_id: userId });
      return data ?? {};
    }

    case "get_balance_sheet": {
      const { data } = await supabase.rpc("get_balance_sheet", { p_user_id: userId });
      return data ?? {};
    }

    case "get_category_spending": {
      const { data } = await supabase.rpc("get_top_categories", { p_user_id: userId });
      return data ?? {};
    }

    default:
      return { error: "Ferramenta desconhecida" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const body = await request.json();
    const message: string = body.message;
    const history: { role: string; content: string }[] = body.history ?? [];
    if (!message?.trim()) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });

    // Rate limit
    const { data: rl } = await supabase.rpc("check_ai_rate_limit", { p_user_id: user.id });
    const rateLimit = rl as { allowed: boolean } | null;
    if (rateLimit && !rateLimit.allowed) {
      return NextResponse.json({ error: "Limite mensal de IA atingido." }, { status: 429 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Assistente não configurado (ANTHROPIC_API_KEY ausente)." }, { status: 503 });
    }

    const systemPrompt = `Você é o assistente financeiro do Oniefy, um sistema de gestão patrimonial.
Responda sempre em português brasileiro, de forma concisa e profissional.
Use as ferramentas disponíveis para buscar dados reais do usuário antes de responder.
Formate valores monetários como R$ X.XXX,XX.
Nunca invente dados - se não encontrar, diga que não há registros.
Seja breve: 2-3 frases na maioria dos casos.`;

    const messages = [
      ...history.slice(-10).map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
      { role: "user" as const, content: message },
    ];

    // First call: may trigger tool use
    const resp1 = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      }),
    });

    if (!resp1.ok) {
      const err = await resp1.text();
      console.error("[AI Chat] Claude error:", err);
      return NextResponse.json({ error: "Erro ao consultar assistente." }, { status: 502 });
    }

    let result = await resp1.json();
    let totalTokens = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

    // Handle tool use loop (max 3 iterations)
    let iterations = 0;
    while (result.stop_reason === "tool_use" && iterations < 3) {
      iterations++;
      const toolUseBlocks = result.content.filter((b: { type: string }) => b.type === "tool_use");
      const toolResults = [];

      for (const block of toolUseBlocks) {
        const toolResult = await executeTool(block.name, block.input, user.id);
        toolResults.push({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: JSON.stringify(toolResult),
        });
      }

      const resp2 = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: systemPrompt,
          tools: TOOLS,
          messages: [
            ...messages,
            { role: "assistant", content: result.content },
            { role: "user", content: toolResults },
          ],
        }),
      });

      if (!resp2.ok) break;
      result = await resp2.json();
      totalTokens += (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);
    }

    // Extract text response
    const textBlocks = result.content?.filter((b: { type: string }) => b.type === "text") ?? [];
    const answer = textBlocks.map((b: { text: string }) => b.text).join("\n");

    // Log usage
    const cost = totalTokens * 0.000004; // Sonnet ~$4/1M mixed
    await supabase.rpc("save_ai_result", {
      p_user_id: user.id,
      p_prompt_hash: `chat-${Date.now()}`,
      p_model: "claude-sonnet-4-20250514",
      p_use_case: "chat",
      p_prompt_sanitized: message.slice(0, 200),
      p_response: JSON.parse(JSON.stringify({ answer: answer.slice(0, 300) })),
      p_tokens_in: Math.ceil(totalTokens * 0.6),
      p_tokens_out: Math.ceil(totalTokens * 0.4),
      p_cost_usd: cost,
      p_cached: false,
    });

    return NextResponse.json({ answer, tokens: totalTokens });
  } catch (err) {
    console.error("[AI Chat]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

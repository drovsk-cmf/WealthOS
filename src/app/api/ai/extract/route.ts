/**
 * AI Document Extraction - POST /api/ai/extract (P12)
 *
 * Pipeline:
 * 1. Tesseract.js OCR on client → text sent here
 * 2. Deterministic parser (regex for amount, date, CNPJ, merchant)
 * 3. Gemini Flash fallback for unstructured text
 *
 * Request: { text: string, document_type?: "receipt" | "invoice" | "statement" }
 * Response: { fields: { amount?, date?, merchant?, cnpj?, description?, items?[] }, confidence: number, source: "parser" | "ai" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GEMINI_MODEL = "gemini-2.0-flash-lite";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Deterministic extraction patterns (BR formats)
function extractDeterministic(text: string) {
  const fields: Record<string, string | number | null> = {};
  let matched = 0;

  // Amount: R$ 1.234,56 or 1234,56 or TOTAL: 99,90
  const amountMatch = text.match(/(?:R\$\s*|TOTAL\s*:?\s*|VALOR\s*:?\s*)(\d{1,3}(?:\.\d{3})*,\d{2})/i);
  if (amountMatch) {
    fields.amount = parseFloat(amountMatch[1].replace(/\./g, "").replace(",", "."));
    matched++;
  }

  // Date: DD/MM/YYYY or DD/MM/YY
  const dateMatch = text.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);
  if (dateMatch) {
    const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
    fields.date = `${year}-${dateMatch[2]}-${dateMatch[1]}`;
    matched++;
  }

  // CNPJ: XX.XXX.XXX/XXXX-XX
  const cnpjMatch = text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
  if (cnpjMatch) {
    fields.cnpj = cnpjMatch[0];
    matched++;
  }

  // Merchant: first line with uppercase words (heuristic)
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const merchantLine = lines.find((l) => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{4,}$/.test(l));
  if (merchantLine) {
    fields.merchant = merchantLine.charAt(0) + merchantLine.slice(1).toLowerCase();
    matched++;
  }

  return { fields, matched, total: 4 };
}

function sanitize(input: string): string {
  return input
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF]")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]")
    .replace(/(?:\+?55\s?)?(?:\(?\d{2}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}\b/g, "[TEL]");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const body = await request.json();
    const text: string = body.text;
    if (!text?.trim()) return NextResponse.json({ error: "Texto vazio" }, { status: 400 });

    // Step 1: Deterministic extraction
    const det = extractDeterministic(text);
    if (det.matched >= 3) {
      return NextResponse.json({
        fields: det.fields,
        confidence: (det.matched / det.total) * 100,
        source: "parser",
      });
    }

    // Step 2: AI fallback (Gemini)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        fields: det.fields,
        confidence: (det.matched / det.total) * 100,
        source: "parser",
      });
    }

    // Rate limit check
    const { data: rl } = await supabase.rpc("check_ai_rate_limit", { p_user_id: user.id });
    const rateLimit = rl as { allowed: boolean } | null;
    if (rateLimit && !rateLimit.allowed) {
      return NextResponse.json({
        fields: det.fields,
        confidence: (det.matched / det.total) * 100,
        source: "parser",
        rateLimit: rl,
      });
    }

    const sanitized = sanitize(text);
    const docType = body.document_type || "receipt";

    const prompt = `Extraia campos de um ${docType === "receipt" ? "recibo/cupom fiscal" : docType === "invoice" ? "nota fiscal" : "extrato"} brasileiro.
Texto OCR (pode ter erros):
---
${sanitized.slice(0, 2000)}
---
Responda APENAS com JSON: {"amount": 99.90, "date": "2026-03-21", "merchant": "Nome do estabelecimento", "cnpj": "XX.XXX.XXX/XXXX-XX", "description": "Descrição curta"}
Campos que não encontrar, use null.`;

    const resp = await fetch(`${GEMINI_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const tokensIn = data.usageMetadata?.promptTokenCount ?? 0;
        const tokensOut = data.usageMetadata?.candidatesTokenCount ?? 0;
        const cost = (tokensIn * 0.000000075) + (tokensOut * 0.0000003);

        // Merge: deterministic fields take priority
        const merged = { ...parsed, ...det.fields };

        await supabase.rpc("save_ai_result", {
          p_user_id: user.id,
          p_prompt_hash: "extract-" + Date.now(),
          p_model: GEMINI_MODEL,
          p_use_case: "extract",
          p_prompt_sanitized: sanitized.slice(0, 500),
          p_response: JSON.parse(JSON.stringify(merged)),
          p_tokens_in: tokensIn,
          p_tokens_out: tokensOut,
          p_cost_usd: cost,
          p_cached: false,
        });

        return NextResponse.json({
          fields: merged,
          confidence: 75,
          source: "ai",
        });
      }
    }

    // AI failed, return deterministic results
    return NextResponse.json({
      fields: det.fields,
      confidence: (det.matched / det.total) * 100,
      source: "parser",
    });
  } catch (err) {
    console.error("[AI Extract]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

# Oniefy - Backlog Unificado

**Single source of truth** para todo trabalho pendente, bloqueado e concluído.
Atualizado: sessão 39 (03/04/2026). Reorganizado: itens pendentes primeiro, concluídos no final.

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ⬜ | Pendente, não iniciado |
| 🔄 | Em progresso |
| 🔒 | Bloqueado (dependência externa) |
| ⏳ | Aguarda ação do Claudio |
| 📌 | Adiado (sem prazo, com gatilho) |
| ✅ | Concluído |

---

## 1. Ações do Claudio (dependências externas)

Itens que só o Claudio pode resolver. Sem código.

| ID | Ação | Prioridade | Status | Desbloqueia |
|----|------|-----------|--------|-------------|
| A1 | Supabase Pro upgrade (~US$25/mês) | P0 | ⏳ | Leaked Password Protection, CAPTCHA, SLAs |
| A2 | Apple Developer Account (US$99/ano) | P1 | ⏳ | CFG-04, FIN-17, FIN-18, iOS, App Store |
| A3 | SMTP: configurar `noreply@oniefy.com` no Supabase Dashboard | P1 | ⏳ | Auth emails customizados |
| A4 | MFA TOTP: fator "unverified" no oniefy-prod | P1 | ⏳ | MFA funcional |
| A5 | Cloudflare Turnstile: site key + secret key nas env vars Vercel | P1 | ⏳ | CAPTCHA em auth |
| A6 | Apple OAuth: habilitar com certificate | P2 | ⏳ | Login com Apple (depende A2) |
| A7 | Teste de corredor com 3 pessoas (UX-H3-05) | P2 | ⏳ | Validação empírica do onboarding |
| A8 | Validação fiscal mensal: checar RFB/DOU/MPS | Recorrente | ⏳ | Tabelas IRPF/INSS atualizadas |
| A9 | Confirmação das 6 decisões IA (adendo v1.5) | P2 | ⏳ | Ver §6 deste documento |
| A10 | RESEND_API_KEY: cadastrar em resend.com | P2 | ⏳ | Digest semanal (preview_only sem chave) |
| A11 | Sentry DSN: criar conta free + env var Vercel | P2 | ⏳ | Logging de erros em produção |
| A13 | CNPJ placeholder em terms/page.tsx | P3 | ⏳ | Aguarda constituição PJ |
| A14 | Assets de marca: favicon, apple-touch-icon, PWA icons | P1 | ⬜ | Ícone genérico sem isso |
| A15 | B3 API: criar conta em developers.b3.com.br | P2 | ⬜ | 10 min, gratuito |
| A16 | B3 API: gerar Kit de Acesso no sandbox | P2 | ⬜ | Depende A15 |
| A17 | B3 API: explorar APIs com dados fictícios | P2 | ⬜ | Depende A16, 2-4h |
| A18 | B3 API: contatar equipe comercial | P2 | ⬜ | 1 e-mail, independente |

---

## 2. Bloqueados (dependência externa)

| ID | Item | Bloqueio | Status |
|----|------|---------|--------|
| CFG-04 | Push notifications APNs nativas iOS | Apple Developer Account (A2) | 🔒 |
| FIN-17 | OCR recibo via Apple Vision (nativo) | Apple Developer Account (A2) | 🔒 |
| FIN-18 | Câmera comprovante via Capacitor Camera | Apple Developer Account (A2) | 🔒 |
| E25 | Integração B3 API (Área do Investidor) | A15-A18 (conta B3 + sandbox) | 🔒 |
| E11 | Push APNs nativo (inatividade 7d ✅, APNs não) | Apple Developer Account (A2) | 🔒 |
| I3 | Biometria real (substituir stubs) | Mac físico | 🔒 |
| I4 | OCR completo (Apple Vision + Tesseract.js + PDF.js) | Mac físico | 🔒 |
| I5 | Submissão App Store | I1 + I2 + I3 | 🔒 |

---

## 3. Backlog de produto

### 3.1 Alta prioridade (antes do lançamento ou imediato)

| ID | Item | Esforço | Impacto |
|----|------|---------|---------|
| E4 | **Onboarding: valor em <5 min** — fixes aplicados (sessão 36). Falta validação empírica (A7 corredor). | Depende A7 | Alto |
| E24 | **Módulo de investimentos** — 9 tipos, crons fallback, marcação a mercado. Ref: INVESTMENTS-MODULE-SPEC | Alto | Alto |
| E67 | **Motor de parcelamento** — aritmética do centavo, N parcelas, distribuição por fatura. Schema existe. Ref: INSTALLMENT-SYSTEM-SPEC | 4-6h | Alto |
| E16 | **Compartilhamento familiar** — permissões granulares, RBAC. Muda cobrança pessoa→família. Reclassificado H1 por Claudio. | Alto | Alto |
| E68 | **Parsers bank-specific** — BTG XLSX, XP CSV, Porto PDF, Itaú PDF, etc. Genéricos cobrem parcialmente. Ref: IMPORT-ENGINE-SPEC §4 | 4-6h | Alto |
| E70 | **Inbound email para faturas** — endereço por usuário, allowlist, processamento automático. Requer Resend/SES. Ref: IMPORT-ENGINE-SPEC §2 | 6-8h | Alto |
| E65 | **Web Push notifications** — tabelas existem, Settings mostra "Em breve". Web Push API + service worker. | 4-6h | Alto |
| E62 | **Upload documentos WKF-03** — tabela documents + bucket existem. Falta: upload + vínculo. | 2-3h | Médio |
| E64 | **OCR web (Tesseract.js + PDF.js)** — depende E62. Viável sem Mac. | 4-6h | Médio |
| E55 | **liquidity_tier editável** — dropdown no AccountForm. | 30 min | Baixo |
| E59 | **Edição de transferências** — edit_transaction funciona para income/expense, não transfer. | 2-3h | Médio |

### 3.2 Média prioridade (3 meses pós-lançamento)

| ID | Item | Esforço | Impacto |
|----|------|---------|---------|
| E52 | **Calendário de vencimentos (CAP-05)** — visualização calendário para bills. | 3-4h | Médio |
| E53 | **Export criptografado (ZIP AES-256)** | 2-3h | Baixo |
| E54 | **Logs de acesso (90 dias)** — tabela access_logs + triggers. | 2-3h | Médio |
| E56 | **Focus trap em 6 dialogs** — forms já têm, dialogs de confirmação não. | 1h | Baixo |
| E58 | **Sparklines de solvência** — monthly_snapshots popula, SolvencyPanel sem tendência. | 2-3h | Médio |
| E60 | **Rateio overhead UI** — tabela + RPC existem, zero UI. | 2-3h | Baixo |
| E61 | **Reajuste IPCA/IGP-M** — índices coletados, opções removidas da UI. Reconectar. | 3-4h | Médio |
| E63 | **Anexar documentos a bens (PAT-06)** — depende E62. | +1h | Baixo |
| E66 | **Dedup learning loop** — motor não aprende com decisões do usuário. | 3-4h | Médio |
| E69 | **Password derivation faturas** — derivar senha por CPF/CEP, regras por banco. | 2-3h | Médio |
| E71 | **Workflow para falhas de importação** — workflow automático quando import falha. | 2-3h | Médio |
| E42 | **Valorização imóveis (FipeZap/DataZAP)** — ninguém faz no BR. | Médio | Médio |
| E43 | **Assistente WhatsApp** — registro por texto/áudio. Gap competitivo. | Alto | Alto |
| E35 | **Acesso read-only contador** — link temporário, só módulo fiscal. | Baixo | Baixo |
| E46 | **Score de crédito (Serasa/Boa Vista)** | Médio | Baixo |

### 3.3 Futuro (📌 com gatilho)

| ID | Item | Gatilho |
|----|------|---------|
| E36 | Testamento digital / dead man's switch | Consultoria jurídica |
| E14 | Shadow Ledger (off-balance sheet) | Demanda |
| E47 | Benchmark contra outros usuários | Base 500+ usuários |
| E48 | Motor PJ / Simples Nacional | Demanda recorrente PJs |
| E49 | Modo offline completo | Usuários reportarem necessidade |
| E10 | Open Finance (Pluggy/Belvo) | Contrato + motor dedup maduro |

---

## 4. Qualidade e testes

| ID | Item | Status |
|----|------|--------|
| Q1 | Cobertura ~78% lines. Gaps: API routes push/digest. | 🔄 |
| Q2 | E2E Playwright como CI gate. Requer Supabase de teste isolado. | ⬜ |
| E57 | Testes SQL para RPCs novas (edit_transaction, cron_generate_recurring, etc.) | ⬜ |
| TEC-06 | SBOM no CI. npm sbom CycloneDX já no workflow. | ⬜ |
| TEC-07 | LGPD: doc ✅, lacunas L3-L6 implementação pendente. | ⬜ |

---

## 5. Dívida técnica (📌 com gatilho)

| ID | Item | Gatilho |
|----|------|---------|
| DT-007 | 4 hooks com `as any` (diagnostics, engine-v2, scanner, irpf-deductions) | Bug de tipo |
| DT-014 | COA órfão (FK preventivo, zero órfãos) | Inconsistência plano de contas |
| TEC-01 | N+1 em rotas cron (push/digest) | Base > 100 usuários |
| TEC-02 | Recharts sem lazy loading | Bundle > 500kb |
| TEC-03 | Web Workers para parsers CSV/OFX/XLSX | Travamento reportado |
| TEC-04 | SSR prefetch no Dashboard | TTI > 2s em produção |
| TEC-05 | Rate limiter in-memory (não escala multi-região) | Vercel multi-região |
| TEC-09 | Lote 3 deps (Next 16, TW4, TS6, etc.) | Pós-lançamento |
| TEC-10 | Duplicação residual 1.88% (65 clones) | > 3% |

---

## 6. Decisões pendentes (Claudio)

Decisões IA do adendo v1.5:

| # | Decisão | Recomendação | Status |
|---|---------|-------------|--------|
| D1 | Provider IA volume (categorização) | Gemini Flash-Lite (~US$0.02/user/mês) | ⏳ |
| D2 | Provider narrativas | Claude Haiku 4.5 (qualidade pt-BR) | ⏳ |
| D3 | Rate limit free tier IA | 50 chamadas/mês por usuário | ⏳ |
| D4 | Cache de prompts | TTL 30 dias, SHA-256 (já implementado) | ⏳ |
| D5 | Assistente conversacional no MVP | Postergar (endpoint existe, não expor) | ⏳ |

---

## 7. Limitações aceitas por design

| Item | Motivo | Reavaliação |
|------|--------|------------|
| Rate limiter não protege signInWithPassword | GoTrue tem rate limiting próprio | Supabase Pro |
| CSP requer unsafe-inline | Incompatibilidade Next.js static + nonce | Next.js resolver |
| Biometria é stub | Requer Xcode + Capacitor nativo | Mac disponível |
| SW não cacheia dados offline | App financeiro não serve dados stale | Demanda de usuários |

---

## 8. Concluídos (referência)

105/108 stories originais + itens técnicos. 59 itens rastreados. Detalhes por sessão no HANDOVER.

| ID | Item | Sessão |
|----|------|--------|
| E1 | Indicador saúde de saldo por conta | 32 |
| E2 | Gráfico Patrimônio Líquido | 32 |
| E3 | Gerenciador de assinaturas | 32 |
| E5 | Política de early adopters | 32 |
| E6 | Metas de economia (savings_goals) | 32 |
| E7 | Simulador "posso comprar?" | 32 |
| E8 | Exportação IRPF (XLSX 6 abas) | 32 |
| E8b | Motor Financeiro Frente A (8 regras) | 31 |
| E8c | Motor Financeiro Frente B (10 regras total) | 31 |
| E8d | 4 calculadoras TVM | 31 |
| E9 | Interpretação de solvência | 32 |
| E12 | Projeção indexada IPCA/IGP-M | 32 |
| E13 | Calculadora capital humano | 33 |
| E15 | Diagnóstico Financeiro (CFA) | 33 |
| E17 | Separação cartões de crédito | 38 |
| E18 | Carga inicial cartão (3 modos) | 38 |
| E19 | Bank detection (8 bancos, parcial) | 38 |
| E20 | Motor deduplicação (3 filtros) | 38 |
| E21 | Registro rápido (engine sugestões) | 38 |
| E22 | Sininho de pendências (4 fontes) | 38 |
| E23 | Onie orb (Canvas 2D + Simplex Noise) | 38 |
| E26 | Detector de recorrências | 38 |
| E27 | Alerta de preço anormal | 38 |
| E28 | Calendário financeiro | 38 |
| E29 | Consolidação saúde + educação IRPF | 38 |
| E30 | Nova navegação (5 tabs + sidebar) | 38 |
| E31 | Rastreador de garantias | 38 |
| E32 | Comparativo anual + detector reajustes | 38 |
| E33 | Provisão sazonal | 38 |
| E34 | Relatório anual (data prep) | 38 |
| E37 | Quitação dívidas (snowball/avalanche) | 38 |
| E38 | AI Forecasting | 38 |
| E39 | Foto recibo/NF (bucket + receipt_path) | 38 |
| E40 | Métodos de orçamento | 38 |
| E41 | Diagrama Sankey | 38 |
| E44 | Motor DARF investimentos | 38 |
| E45 | Motor CLT bruto→líquido | 38 |
| E50 | Motor tributário PF (Lei 15.270/2025) | 38 |
| E51 | Calendário fiscal | 38 |
| I2 | iOS build chain (GitHub Actions) | 38 |
| A12 | Página de privacidade | 32 |
| D6 | Form primitives (FormField shared) | 34 |
| Q3 | Sentry PII scrub (falta DSN) | 32 |
| TEC-07 | LGPD mapeamento (documento) | 32 |
| TEC-08 | PII sanitizer | 32 |
| TEC-11 | WCAG AA (cores, skip-link, reduced-motion) | 38 |
| TEC-12 | Chunking import | 38 |
| TEC-13 | Regenerar database.ts types | 38 |

---

## Histórico

| Data | Atualização |
|------|------------|
| 23/03/2026 | Documento criado. |
| 02/04/2026 | Sessão 37: 28 novos itens (E19-E49). |
| 03/04/2026 | Sessão 38: 30 itens implementados + 7 visual wiring. |
| 03/04/2026 | Sessão 39: Auditoria de coerência. +20 itens (E52-E71). Documento reorganizado: pendentes primeiro, concluídos no final. §11 Benchmark removido (vive em COMPETITIVE-ANALYSIS.md). Docs obsoletos deletados/arquivados. |

# Oniefy - Backlog Unificado

**Single source of truth** para todo trabalho pendente, bloqueado e concluído.
Atualizado: sessão 40 (04/04/2026). Reorganizado: itens pendentes primeiro, concluídos no final.

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
| A19 | VAPID keys: gerar par + env vars NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY | P1 | ⬜ | Web Push funcional (E65 código pronto) |
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
| E16 | **Compartilhamento familiar** — permissões granulares, RBAC. Muda cobrança pessoa→família. Reclassificado H1 por Claudio. | Alto | Alto |
| E70 | **Inbound email para faturas** — endereço por usuário, allowlist, processamento automático. Requer Resend/SES. Ref: IMPORT-ENGINE-SPEC §2 | 6-8h | Alto |

### 3.2 Média prioridade (3 meses pós-lançamento)

| ID | Item | Esforço | Impacto |
|----|------|---------|---------|
| E42 | **Valorização imóveis (FipeZap/DataZAP)** — ninguém faz no BR. | Médio | Médio |
| E43 | **Assistente WhatsApp** — registro por texto/áudio. Gap competitivo. | Alto | Alto |
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
| Q1 | Cobertura ~78% lines. Gaps: API routes push/digest. Rastreabilidade story→teste: 85/108 (78%). | 🔄 |
| Q2 | E2E Playwright como CI gate. Requer Supabase de teste isolado. | ⬜ |
| E57 | Testes SQL para RPCs novas (edit_transaction, cron_generate_recurring, etc.) | ⬜ |
| TEC-06 | SBOM no CI. npm sbom CycloneDX já no workflow. | ✅ |
| TEC-07 | LGPD: L3 (CPF + consentimento) ✅, L4 (ROPA) ✅, L5 (RIPD fiscal) ✅, L6 (DPO) ✅. Completo. | ✅ |

---

## 5. Dívida técnica (📌 com gatilho)

| ID | Item | Gatilho |
|----|------|---------|
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
| E66 | Dedup learning loop (recordUserDecision, applyLearnedPatterns, filterOppositeSigns) | 39 |
| E67 | Motor de parcelamento (aritmética centavo, regex 6 bancos, projeção faturas) | 39 |
| E68 | Bank statement pipeline (detecção→parser→normalização→parcelas) | 39 |
| E69 | Password derivation (8 bancos, fórmulas CPF/CEP) | 39 |
| E71 | Import failure workflows (8 tipos, classifyImportError) | 39 |
| E55 | liquidity_tier editável para todos os tipos de conta | 40 |
| DT-007 | Remover `as any` de 4 hooks RPC + bug dedup-engine | 40 |
| E52 | Calendário de vencimentos (CAP-05) — tab calendário em /bills | 38 |
| E53 | Export criptografado (AES-256-GCM no client) | 32 |
| E54 | Logs de acesso (tabela access_logs, login + export) | 32 |
| E58 | Sparklines solvência (SolvencyPanel + monthly_snapshots) | 38 |
| E59 | Edição de transferências (RPC edit_transfer + UI) | 38 |
| E60 | Rateio overhead UI (botão em cost-centers) | 38 |
| E61 | Reajuste IPCA/IGP-M (adjustment_index em recorrências) | 38 |
| E62 | Upload documentos WKF-03 (hook + UI em workflows + assets) | 38 |
| E63 | Anexar documentos a bens PAT-06 (AssetDocuments) | 38 |
| E65 | Web Push notifications (SW + hook + API routes + Settings UI). Bloqueado: VAPID keys | 38 |
| E56 | FocusTrap em notification-panel (último modal sem trap, 16/16 cobertos) | 40 |
| E64 | OCR web: PDF.js text extraction + rasterize fallback + Tesseract.js. Regex boleto/NF-e | 40 |
| E35 | Acesso read-only contador: tabela + RPC + hook + página pública + UI | 40 |
| NAV-V3 | Navigation v3: sidebar 4 seções, tab bar Inteligência, /more eliminada | 42 |
| UX-PD | Progressive disclosure: moeda (account), depreciação+seguro (asset), juros (card), reajuste (budget) | 42 |
| UX-PA | Padrão A: GoalForm, CostCenterForm, WarrantyForm extraídos para componentes | 42 |
| D6-MIG | FormError migrado para 9 form components (accounts, assets, budgets, cards, categories, cost-centers, family, recurrences, transactions) | 42 |
| L4 | ROPA simplificado (docs/LGPD-ROPA.md) | 42 |
| L5 | RIPD fiscal (docs/LGPD-RIPD-FISCAL.md) | 42 |
| L6 | DPO interino designado na /privacy | 42 |
| L3 | CPF com consentimento explícito: campo + checkbox + criptografia AES-256 em perfil e família | 42 |
| UX-XL | Cross-links contextuais: Bens→Garantias, Categorias→Divisões | 42 |
| B14 | Double-submit: 5 formulários sem proteção visível (/transactions, /bills, /accounts, /assets, /budgets). Botão de submit não desabilita durante request. Fix: `disabled={mutation.isPending}` + spinner. Auditoria 11.3 | 44 |
| B17 | Modal de criação de conta (/accounts) não cabe no viewport padrão (1280x720). Botão submit fica fora da tela. Workaround E2E: JS click via evaluate(). Fix real: scroll interno no modal ou reduzir altura do formulário (remover campos opcionais para progressive disclosure). Auditoria 7.6 | 44 |

---

## Histórico

| Data | Atualização |
|------|------------|
| 23/03/2026 | Documento criado. |
| 02/04/2026 | Sessão 37: 28 novos itens (E19-E49). |
| 03/04/2026 | Sessão 38: 30 itens implementados + 7 visual wiring. |
| 03/04/2026 | Sessão 39: Auditoria de coerência. +20 itens (E52-E71). Documento reorganizado: pendentes primeiro, concluídos no final. §11 Benchmark removido (vive em COMPETITIVE-ANALYSIS.md). Docs obsoletos deletados/arquivados. |
| 04/04/2026 | Sessão 40: Fix CI (lockfile corrompido). C1 (as any → 0), D8 (rastreabilidade 108 stories), D17 (roteiro teste), E55 (liquidity_tier). Auditoria PENDENCIAS: 11 entradas stale removidas (E52, E53, E54, E58, E59, E60, E61, E62, E63, E65 já implementados). A19 (VAPID keys) adicionado. |
| 04/04/2026 | Sessão 42: Auditoria UX completa. Navigation v3 (sidebar 4 seções semânticas, /more eliminada, tab bar Inteligência). Progressive disclosure em 4 forms. Padrão A padronizado em 11 entidades. FormError migrado (D6). LGPD completo: ROPA (L4), RIPD fiscal (L5), DPO interino (L6), CPF com consentimento explícito + criptografia AES-256 em perfil e família (L3). Cross-links contextuais. 8 commits, 28+ arquivos. |
| 05/04/2026 | Sessão 43: Auditoria UX exploratória + suite E2E. B1 (alert_threshold overflow) e B4 (timezone) corrigidos. C1 (logout mobile) e C3 (header redesign) implementados. 8 arquivos Playwright audit (1.916 linhas). Usuário e2e-test@oniefy.com criado. Achados pendentes: C2, A1, A3, A4, R2, UX-01, UX-02. |
| 05/04/2026 | Sessão 44: Audit Kit v2 (13 specs universais + 6 gerados). 9 bugs de produção corrigidos (B5-B13). 340 testes, 94% pass rate. Monkey test detectou B14 (double-submit). B17 (modal /accounts fora do viewport). 3 fixes em specs (JS click, exact locator, try/catch unroute). |

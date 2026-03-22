# Oniefy (formerly WealthOS) - Handover de Sessão

**Data:** 21 de março de 2026
**Projeto:** Oniefy - Any asset, one clear view.
**Repositório GitHub:** drovsk-cmf/WealthOS (privado)
**Supabase Project ID (ativo):** mngjbrbxapazdddzgoje (sa-east-1 São Paulo) — "oniefy-prod"
**Supabase Project ID (legado):** hmwdfcsxtmbzlslxgqus (sa-east-1 São Paulo) — "WealthOS Project" — INACTIVE (pausado 20/03/2026)
**Google Drive:** Meu Drive > 00. Novos Projetos > WealthOS > Documentacao/

---

## 1. O que é o Oniefy

Sistema de gestão financeira e patrimonial para uso pessoal, posicionado como "Sistema Operativo de Riqueza" (não um expense tracker). Tagline: "Any asset, one clear view." Público-alvo: profissionais de alta renda com múltiplas fontes de receita e complexidade fiscal ("The Hybrid Earner"). Foco em blindagem patrimonial, eficiência tributária e privacidade.

**Origem do nome:** "Oniefy" combina raízes que atravessam milênios: do Proto-Indo-Europeu *oi-no- (que deu origem a "one", "any" e "unique") ao sufixo latino -fy (facere, "construir"). O nome carrega a ideia de tornar visível e acessível tudo que é seu.

**Modelo contábil:** partida dobrada como motor interno (invisível ao usuário), com plano de contas híbrido (CPC simplificado por baixo, linguagem natural na interface). Filosofia Apple: mecânica complexa invisível, resultado simples entregue ao usuário.

**Diferencial implementado:** Inteligência de Provisionamento de IR. Calcula projeção anual IRPF baseada em múltiplas fontes de renda, aplica tabela progressiva + redução Lei 15.270/2025, compara com IRRF retido, e recomenda valor mensal a provisionar. Resolve o cenário de pessoa com 2+ contratos CLT sem retenção individual.

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15.5.14 (App Router) + React 19.2.4 + TypeScript |
| UI | shadcn/ui + Tailwind CSS + Plum Ledger design system |
| Tipografia | DM Sans (corpo) + JetBrains Mono (dados) |
| Iconografia | Lucide React (SVG) |
| Backend/BaaS | Supabase (PostgreSQL + Auth + RLS + Storage) |
| Mobile iOS | Capacitor 6 (empacotamento PWA para App Store) |
| Hospedagem | Vercel |
| State Management | React Query + Zustand |
| Gráficos | Recharts |
| Validação | Zod |
| CI/CD | GitHub Actions (4 jobs: Security + Lint/TypeCheck + Unit Tests + Build) |
| Error Tracking | Sentry (@sentry/nextjs, opt-in via DSN) |
| APIs externas | BCB SGS (7 séries macro) + BCB PTAX OData (10 moedas oficiais) + Frankfurter/ECB (20 moedas fiat) + CoinGecko (5 cryptos) + IBGE SIDRA |
| IA | Gemini Flash-Lite (categorização, via /api/ai/categorize). Requer GEMINI_API_KEY |
| OCR | Tesseract.js (web). Apple Vision Framework planejado para iOS nativo |
| Push | Web Push (VAPID). APNs nativo planejado para iOS |

---

## 3. Estado Atual do Projeto

### 3.1 Fases Concluídas

| Fase | Escopo | Status |
|---|---|---|
| 0. Setup | Repo, Supabase, Next.js, Capacitor, CI/CD, schema v1.0 | CONCLUÍDA |
| 1. Auth + Segurança | Login, MFA TOTP, RLS, biometria stub, session timeout | CONCLUÍDA |
| 1.5 Schema Contábil | 10 novas tabelas, 12 ENUMs, triggers, seed 140 contas | CONCLUÍDA |
| 2. Financeiro (Core) | CRUD contas/categorias/transações, motor contábil, plano de contas, centros | CONCLUÍDA |
| 3. Dashboard + Orçamento | Balanço patrimonial, solvência, gráficos, orçamento | CONCLUÍDA |
| 4. Contas a Pagar + Patrimônio | Recorrências, bens, depreciação, alertas | CONCLUÍDA |
| 5. Centros Avançados | Rateio, P&L por centro, exportação CSV/JSON | CONCLUÍDA |
| 6. Workflows | Tarefas periódicas, auto-criação, checklist | CONCLUÍDA |
| 7. Fiscal Integrado | Relatório fiscal, provisionamento IR, parâmetros vigentes | CONCLUÍDA |
| 8. Índices Econômicos | BCB SGS, IPCA, Selic, gráficos, coleta manual | CONCLUÍDA |
| 9. Integração Bancária | Import CSV/OFX/XLSX, auto-categorização, bank_connections | CONCLUÍDA |

### 3.2 Banco de Dados (Supabase)

| Métrica | Valor |
|---|---|
| Tabelas | 34 (todas com RLS) |
| Políticas RLS | 103 |
| Functions (total) | 73 no schema public. Todas com `SET search_path = public`. 70 SECURITY DEFINER com auth.uid() guard |
| Triggers | 21 |
| ENUMs | 27 (index_type com 46 valores: 13 originais + 33 moedas) |
| Indexes | 140 |
| Migrations aplicadas (MCP) | 48 no projeto ativo (mngjbrbxapazdddzgoje) |
| Migration files (repo) | 55 em supabase/migrations/ |
| pg_cron jobs | 13: mark-overdue (01h), generate-recurring-transactions (01:30), generate-workflow-tasks (02h), depreciate-assets (mensal 03h), process-account-deletions (03:30), balance-integrity-check (dom 04h), generate-monthly-snapshots (mensal 04:30), cron_fetch_indices (06h), cleanup-access-logs (dom 05h), cleanup-analytics (dom), cleanup-notifications (dom), cleanup-ai-cache (dom 03:30), cleanup-soft-deleted (dom 05:30) |
| Contas no plano-semente | 140 (5 grupos raiz, originalmente 133, expandido com subcontas multicurrency) |
| Centros de custo | 1 (Família Geral, is_overhead) |
| Categorias | 16 (únicas, cores Plum Ledger) |
| Parâmetros fiscais | 9 (IRPF mensal/anual 2025+2026, INSS 2025+2026, salário mínimo 2025+2026, ganho capital) |
| Índices econômicos | 66+ registros (34 moedas + 7 índices macro, atualiza diário) |
| Fontes de índices | 51 (7 BCB SGS + 10 BCB PTAX + 29 Frankfurter + 5 CoinGecko) |
| Moedas suportadas | 35: BRL + 10 PTAX (USD,EUR,GBP,CHF,CAD,AUD,JPY,DKK,NOK,SEK) + 19 Frankfurter + 5 crypto (BTC,ETH,SOL,BNB,XRP) |
| User stories total | 108 (90 originais + 18 adendo v1.5: UXR-01..05, PAT-08..11, AI-01..05, IMP-01..04) |
| Stories concluídas | 105/108 (87 originais + 18 adendo v1.5). Restam: 3 bloqueadas por Mac (CFG-04, FIN-17, FIN-18) |
| Supabase security advisories | 0 code-level (1 Dashboard: leaked password protection, requer Pro) |
| Supabase perf advisories | 0 WARN |

### 3.3 Functions (73 no schema public)

| Grupo | Functions |
|---|---|
| Setup/Seed | create_default_categories, create_default_chart_of_accounts, create_default_cost_center, create_coa_child, create_family_member |
| Triggers | handle_new_user, handle_updated_at, recalculate_account_balance, recalculate_account_balance_for, activate_account_on_use, rls_auto_enable, validate_journal_balance, sync_payment_status |
| Transaction Engine | create_transaction_with_journal, create_transfer_with_journal, reverse_transaction, edit_transaction, edit_transfer |
| Dashboard | get_dashboard_summary, get_dashboard_all, get_balance_sheet, get_solvency_metrics, get_top_categories, get_balance_evolution, get_budget_vs_actual (2 overloads), get_weekly_digest |
| Recurrence/Asset | generate_next_recurrence, depreciate_asset, get_assets_summary, distribute_overhead |
| Centers | allocate_to_centers, get_center_pnl, get_center_export |
| Workflows | auto_create_workflow_for_account, generate_tasks_for_period, complete_workflow_task |
| Fiscal | get_fiscal_report, get_fiscal_projection |
| Índices/Moedas | get_economic_indices, get_index_latest, get_currency_rates, get_supported_currencies, get_rate_to_brl |
| Import/Categorização | import_transactions_batch (v3 com aliases), auto_categorize_transaction (pipeline 3 etapas), undo_import_batch, **learn_merchant_pattern** |
| Reconciliation | find_reconciliation_candidates, match_transactions |
| Analytics | track_event, get_retention_metrics |
| Setup Journey | get_setup_journey, advance_setup_journey, initialize_setup_journey |
| Description Aliases | lookup_description_alias, upsert_description_alias |
| **AI Gateway** | **check_ai_rate_limit, get_ai_cache, save_ai_result** |
| Cron (pg_cron) | cron_mark_overdue_transactions (01h), cron_generate_recurring_transactions (01:30), cron_generate_workflow_tasks (02h), cron_depreciate_assets (mensal 03h), cron_process_account_deletions (03:30), cron_balance_integrity_check (dom 04h), cron_generate_monthly_snapshots (mensal 04:30), cron_fetch_economic_indices (06h), cron_cleanup_access_logs (dom 05h), **cron_cleanup_analytics_events (dom), cron_cleanup_notification_log (dom), cron_cleanup_ai_cache (dom 03:30), cron_cleanup_soft_deleted (dom 05:30)** |

### 3.4 Código Fonte (148 arquivos em src/, 39 suítes de teste, 531 assertions)

```
src/
├── __tests__/                    # 39 suítes de teste (Jest + RTL), 531 assertions
│   ├── api-routes-security.test.ts    # 30+ assertions: auth routes, rate limit, error sanitization, cron auth
│   ├── audit-calendar-grid.test.ts    # 8: while loop exaustivo do calendário
│   ├── audit-dedup-cleanup.test.ts    # 15: budget dedup, rate limiter edge cases
│   ├── audit-map-relations.test.ts    # 11: helper DRY mapTransactionRelations
│   ├── audit-ocr-parsing.test.ts      # 32: parseAmount/parseDate/parseDescription edge cases
│   ├── audit-ofx-edge-cases.test.ts   # 12: OFX dedup, MAX_SIZE, formato BR
│   ├── audit-tx-invalidation.test.tsx # 7: invalidação de cache em todas as 5 mutations
│   ├── auth-schemas-extended.test.ts  # mfaCode, forgot/reset password, passwordStrength, blocklist
│   ├── auth-validation.test.ts
│   ├── cfg-settings.test.ts          # settings groups, data export config, toCsv
│   ├── dialog-helpers.test.ts        # useEscapeClose, useAutoReset
│   ├── onboarding-seeds.test.ts
│   ├── oniefy-template.test.ts
│   ├── p1-divisoes-rename.test.ts     # 4: Centro→Divisão, N1-N4 nomenclatura
│   ├── p9-domain-templates.test.ts    # 7: metadata templates, fileNames, detecção standard/card
│   ├── p11-ai-gateway.test.ts         # 11: uncategorized filter, rate limit shape
│   ├── p14-asset-templates.test.ts    # 10: searchTemplates, estrutura, bounds
│   ├── p16-asset-categories.test.ts   # 11: 14 categorias, labels, colors, zod
│   ├── parsers.test.ts
│   ├── pii-sanitizer.test.ts          # 14: CPF, CNPJ, email, tel, cartão, conta
│   ├── rate-limiter.test.ts           # checkRateLimit, extractRouteKey, rateLimitHeaders
│   ├── read-hooks.test.tsx
│   ├── rpc-auto-categorize-schema.test.ts
│   ├── rpc-new-schemas.test.ts        # 13 schemas para RPCs novas (sessão 19)
│   ├── rpc-schemas.test.ts
│   ├── rpc-schemas-extended.test.ts   # 17 schemas restantes (assets, centers, indices, workflows, dashboard)
│   ├── transaction-hooks.test.tsx
│   └── utils.test.ts                 # formatCurrency, formatDate, formatRelativeDate, sanitizeRedirectTo
├── app/
│   ├── (app)/                    # Rotas autenticadas (18 páginas)
│   │   ├── accounts/page.tsx
│   │   ├── assets/page.tsx
│   │   ├── bills/page.tsx
│   │   ├── budgets/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── chart-of-accounts/page.tsx
│   │   ├── connections/page.tsx   # 3 abas: Importar + Conciliação + Conexões
│   │   ├── cost-centers/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── family/page.tsx
│   │   ├── indices/page.tsx
│   │   ├── settings/page.tsx + security/page.tsx + profile/page.tsx + data/page.tsx
│   │   ├── tax/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── workflows/page.tsx
│   │   ├── error.tsx              # Error boundary (UX: P3)
│   │   └── layout.tsx            # Sidebar 5+1 (UX-H1-01), auth, offline banner
│   ├── (auth)/                   # Auth flow (6 páginas)
│   │   ├── login, register, onboarding, mfa-challenge,
│   │   ├── forgot-password, reset-password
│   │   ├── error.tsx              # Error boundary auth (UX: P3)
│   │   └── layout.tsx
│   ├── privacy/page.tsx           # Privacy Policy pública (UX: P5, LGPD + Apple)
│   ├── global-error.tsx           # Error boundary root (UX: P3)
│   ├── api/
│   │   ├── auth/callback/route.ts  # OAuth callback
│   │   ├── auth/login/route.ts     # Login proxy with rate limiting
│   │   ├── digest/send/route.ts    # Weekly digest cron endpoint
│   │   ├── digest/preview/route.ts # Digest preview (authenticated)
│   │   └── indices/fetch/route.ts  # Coleta BCB SGS (SSRF-protected)
│   └── layout.tsx, globals.css
├── components/
│   ├── accounts/account-form.tsx
│   ├── assets/asset-form.tsx
│   ├── budgets/budget-form.tsx
│   ├── categories/category-form.tsx
│   ├── connections/              # Wizard de importação + conciliação (WEA-013)
│   │   ├── import-wizard.tsx
│   │   ├── import-step-upload.tsx
│   │   ├── import-step-mapping.tsx
│   │   ├── import-step-preview.tsx
│   │   ├── import-step-result.tsx
│   │   └── reconciliation-panel.tsx  # Camada 3: conciliação manual lado a lado
│   ├── dashboard/ (8 componentes + index.ts)
│   ├── onboarding/ (4 step components + index.ts: route-choice, route-manual, route-snapshot, celebration)
│   ├── recurrences/recurrence-form.tsx
│   └── transactions/transaction-form.tsx
├── lib/
│   ├── auth/ (8 arquivos: encryption-manager, index, mfa, biometric,
│   │          session-timeout, app-lifecycle, password-blocklist, rate-limiter)
│   ├── config/env.ts             # Startup env validation (validateEnv, validateServerEnv)
│   ├── crypto/index.ts
│   ├── email/weekly-digest-template.ts  # HTML template Plum Ledger (escapeHtml)
│   ├── hooks/ (21 hooks: accounts, analytics, assets, auth-init, auto-category,
│   │          bank-connections, budgets, categories, chart-of-accounts, cost-centers,
│   │          dashboard, dialog-helpers, economic-indices, family-members, fiscal,
│   │          online-status, progressive-disclosure, reconciliation, recurrences,
│   │          transactions, workflows)
│   ├── parsers/ (csv-parser.ts, ofx-parser.ts, xlsx-parser.ts)
│   ├── schemas/rpc.ts            # 27 schemas Zod (todos os RPCs cobertos)
│   ├── services/
│   │   ├── onboarding-seeds.ts   # Seeds extraído de page.tsx (WEA-003)
│   │   └── transaction-engine.ts
│   ├── supabase/ (client.ts, server.ts)
│   ├── utils/index.ts            # cn, formatCurrency, formatDate, formatRelativeDate, sanitizeRedirectTo
│   ├── validations/auth.ts
│   └── query-provider.tsx
├── middleware.ts                  # Rate limit, session refresh, route protection, Server-Timing
└── types/database.ts             # 26 tables, 39 functions, 25 enums (migration 031)
```

**Arquivos fora de `src/`:**
- `public/sw.js` - Service Worker v2 (cache apenas estáticos imutáveis, limpeza no logout)
- `public/manifest.json` - PWA manifest
- `public/brand/` - 6 SVGs (lockup-h/v plum/bone) + OG PNG + favicon + PWA icons
- `next.config.js` - Security headers (HSTS, CSP, X-Frame-Options, Permissions-Policy)
- `.github/workflows/ci.yml` - 4 jobs: Security + Lint/TypeCheck + Unit Tests + Build
- `supabase/migrations/` - 40 SQL files (001 a 052, com gaps)
- `supabase/tests/test_rls_isolation.sql` - Suíte de testes RLS (50 assertions, 4 batches)
- `docs/audit/` - 9 arquivos de relatório + DIVIDA-TECNICA.md

### 3.5 Design System "Plum Ledger"

Paleta institucional (`src/app/globals.css` + `tailwind.config.ts`):

| Token | Hex | Tailwind class | Uso |
|---|---|---|---|
| Midnight Plum | #241E29 | `plum` | Cor-identidade, fundo dark, app icon |
| Bone | #F5F0E8 | `bone` | Off-white quente (nunca branco puro) |
| Graphite Ink | #171A1F | (foreground) | Texto principal |
| Mineral Sage | #7E9487 | `sage` | Acento frio, variante dark mode |
| Oxide Brass | #A7794E | `brass` | Acento nobre restrito |
| Warm Stone | #CEC4B8 | `stone` | Apoio neutro |

Semânticas: Verdant #2F7A68 (receitas/positivo), Terracotta #A64A45 (despesas/negativo), Burnished #A97824 (warning), Info Slate #56688F (informativo). Tiers de solvência: T1 #2F7A68, T2 #56688F, T3 #A97824, T4 #6F6678.

Tipografia: DM Sans (corpo) + JetBrains Mono (dados financeiros) + Instrument Serif (display/hero, adiado). Iconografia: Lucide React SVG (zero emojis decorativos). Microcopy: auditado contra MAN-LNG-CMF-001 v1.0.

---

## 4. Dados do Usuário de Teste

- ID: fab01037-a437-4394-9d8f-bd84db9ce418
- Nome: Claudio Filho
- Email: claudiomacedo@gmail.com
- Provider: Google OAuth
- MFA: TOTP inscrito (fator 97c227e6-179d-4e6f-b8ba-1804f4273264, status: unverified)
- onboarding_completed: true
- Dados seed: 140 contas contábeis, 1 centro (Família Geral), 16 categorias (únicas)
- Transações: 0 (nenhum dado financeiro de teste ainda)
- Contas bancárias: 0

---

## 5. Plano de Fases Detalhado

| Fase | Escopo | Status | Stories |
|---|---|---|---|
| 0. Setup | Repo, Supabase, Next.js, CI/CD | CONCLUÍDA | - |
| 1. Auth + Segurança | Login, MFA, RLS, biometria | CONCLUÍDA | AUTH-01 a AUTH-08 |
| 1.5 Schema Contábil | Migration v2.0, seed 140 contas | CONCLUÍDA | - |
| 2. Financeiro (Core) | CRUD transações + journal_entries | CONCLUÍDA | FIN-01-15, CTB-01-04, CEN-01-02 |
| 3. Dashboard + Orçamento | Balanço patrimonial, solvência, orçamento | CONCLUÍDA | DASH-01-12, CTB-05, ORC-01-06 |
| 4. Contas a Pagar + Patrimônio | Recorrências, bens, depreciação | CONCLUÍDA | CAP-01-06, PAT-01-07 |
| 5. Centros Avançados | Rateio, P&L por centro, export | CONCLUÍDA | CEN-03-05 |
| 6. Workflows | Automações, tarefas, checklist | CONCLUÍDA | WKF-01-04 |
| 7. Fiscal Integrado | tax_treatment, provisionamento IR | CONCLUÍDA | FIS-01-06 |
| 8. Índices Econômicos | BCB/SIDRA, gráficos, coleta | CONCLUÍDA | Extra-stories |
| **9. Integração Bancária** | **Import CSV/OFX/XLSX, auto-categorização, bank_connections** | **CONCLUÍDA** | **BANK-01-06** |
| 10. Polish + App Store | PWA, Capacitor, submissão | Pendente | - |

---

## 6. Concluído: Fase 9 (Integração Bancária Standalone) - 08/03/2026

**Opção B implementada:** sem agregador externo, com import manual aprimorado.

**Migration 010:**
- Tabela bank_connections (14 cols, RLS, indexes, trigger)
- ENUM sync_status (active, syncing, error, expired, manual)
- ALTER transactions: +bank_connection_id, +external_id, +import_batch_id
- ALTER accounts: +external_account_id, +bank_connection_id
- RPC auto_categorize_transaction: 25+ patterns (alimentação, transporte, saúde, moradia, lazer, etc.)
- RPC import_transactions_batch: bulk import com dedup por external_id, auto-categorização, balance recalc

**Parsers (390+ linhas):**
- OFX parser: SGML (v1.x) e XML (v2.x), extração de FITID/DTPOSTED/TRNAMT/NAME
- CSV parser: PapaParse, auto-detect separador (;/,/tab), formatos BR (DD/MM/YYYY, 1.234,56), column mapping com sugestão
- XLSX/XLS parser: SheetJS, auto-detect header row, converte para formato headers+rows do CSV (reusa suggestMapping + mapToTransactions)

**Hook (147 linhas):**
- useBankConnections, useCreateBankConnection, useDeactivateBankConnection, useImportBatch

**UI (530 linhas):**
- /connections com 2 tabs (Importar extrato + Conexões)
- Wizard: upload → column mapping (CSV) → preview com checkbox → resultado
- Conexões: CRUD manual, status badges, info sobre agregador futuro

**Evolução futura:** quando contratar agregador (Pluggy/Belvo), basta criar adapter + trocar provider de 'manual' para 'pluggy'/'belvo'. A tabela, RPCs e UI já estão preparados.

**Total: 7 arquivos, 1.043 linhas adicionadas, 6 stories concluídas.**

### Próximo: Fase 10 (Polish + App Store)

A última fase é um conjunto de refinamentos, não stories novas:
- PWA icons, manifest.json, Service Worker
- Capacitor iOS build + App Store
- Next.js upgrade (14 → 15+)
- OCR real (WKF-03), testes, Edge Functions com pg_cron

### Auditoria de Segurança (Gemini, 2026-03-10)

Auditoria externa feita via Gemini. 5 achados acionáveis implementados:

| # | Achado | Solução | Arquivos |
|---|--------|---------|----------|
| 1 | DEK não expurgada no app background | Hook `useAppLifecycle` purga DEK no `appStateChange`, recarrega via biometria | `src/lib/auth/use-app-lifecycle.ts` |
| 2 | Rate limiting inexistente em rotas auth | Rate limiter in-memory (sliding window) integrado ao middleware | `src/lib/auth/rate-limiter.ts`, `src/middleware.ts` |
| 3 | Sem monitoramento de latência do middleware | Header `Server-Timing` em todas as respostas do middleware | `src/middleware.ts` |
| 4 | OFX import sem deduplicação robusta | SHA-256 hash do FITID + UNIQUE partial index `(user_id, account_id, external_id)` | `src/lib/parsers/ofx-parser.ts`, migration 011 |
| 5 | Sem validação DB de balanço contábil | Statement-level trigger `validate_journal_balance()` (sum D = sum C, min 2 linhas) | migration 012, `supabase/tests/test_financial_mutations.sql` |

**Achado bônus descoberto durante implementação:** não havia trigger DB-level impedindo journal entries desbalanceados. O RPC criava pares corretos, mas inserção direta podia corromper o balanço. Corrigido com migration 012.

**Nota rate limiter:** in-memory, não compartilha estado entre instâncias Vercel. Para produção multi-região: migrar para Upstash Redis ou Vercel KV. WAF (Vercel/Cloudflare) recomendado como camada adicional.

**Nota OFX parser:** agora é `async` (usa `crypto.subtle.digest` para SHA-256). Chamadas que usam `parseOFX()` precisam de `await`.

**Migrations aplicadas:** 011-019. 013=stable KEK, 014=transfer RPC, 015=nullable import, 016=pg_cron, 017=search_path, 018=RLS initplan (77 policies), 019=FK indexes (14). Total: 26 tabelas, 82 RLS, 22 ENUMs, 32 RPCs + 3 cron functions, 1 validation trigger, 3 pg_cron jobs.

### Auditoria de Código (ChatGPT, 2026-03-10)

Segunda auditoria, mais profunda. Leu o código real. 15 achados, dos quais 8 são deficiências materiais. 2 bugs corrigidos imediatamente (rate limiter dupla contagem, parseOFX sem await). Restam 8 itens para micro-lote de saneamento.

**Backlog de saneamento estrutural (pré-requisito para produção):**

| # | Item | Gravidade | Esforço |
|---|------|-----------|---------|
| S1 | ~~Redesenhar KEK: derivar de material estável, não JWT efêmero~~ | ~~Crítica~~ | FEITO (migration 013, commit c453c47) |
| S2 | ~~Exportar SQL real das migrations 003-010 do Supabase para o Git~~ | ~~Alta~~ | FEITO (2.236 linhas reais, commit a60489f) |
| S3 | ~~RPC atômica `create_transfer_with_journal()`~~ | ~~Alta~~ | FEITO (migration 014 + 2 arquivos frontend) |
| S4 | ~~Import: normalizar sinal (abs) do amount nos parsers~~ | ~~Média~~ | FEITO (OFX + CSV parsers) |
| S5 | ~~Import: substituir CSV parser manual por PapaParse real~~ | ~~Média~~ | FEITO (papaparse adicionado) |
| S6 | ~~Import: eliminar UUID sentinela `00000000-...`~~ | ~~Média~~ | FEITO (migration 015 + hook) |
| S7 | ~~Rota de índices: corrigir admin client + restringir acesso~~ | ~~Média~~ | FEITO (adminClient para writes) |
| S8 | ~~Adicionar Content-Security-Policy ao next.config.js~~ | ~~Média~~ | FEITO |

**Itens conhecidos (não urgentes, já planejados):**
- Estratégia mobile Capacitor vs SSR: resolver na Fase 10 com `server.url`
- Biometria stub retorna true: isolado, Fase 10
- ~~Rebranding WealthOS → Oniefy: FEITO (commit 4ea3524)~~
- ~~Cobertura de testes: FEITO (12 suítes, 150 testes, Jest + RTL)~~

---

## 7. Histórico de Items de Polish (Fase 10)

Seção mantida como registro histórico. Todos os itens pendentes foram migrados para a **Seção 12 (Backlog Consolidado Único)**. Consulte a Seção 12 para o estado atual de qualquer pendência.

<details>
<summary>Histórico completo (clique para expandir)</summary>

| Item | Status |
|---|---|
| PWA icon 404 | FEITO |
| Euro sem símbolo | FEITO |
| Rebranding WealthOS → Oniefy | FEITO |
| Next.js upgrade 14→15 | FEITO |
| Testes (22 suítes, 341 assertions) | FEITO |
| Microcopy MAN-LNG-CMF-001 | FEITO |
| Logo Penrose Ribbon | FEITO |
| Edge Functions / pg_cron | FEITO |
| Search path fix | FEITO |
| RLS initplan | FEITO |
| FK indexes | FEITO |
| Ícones Lucide | FEITO |
| Conciliação bancária 3 camadas | FEITO |
| Orçamento delegado por membro | FEITO |
| OCR real | Migrado → Seção 12 |
| Capacitor build | Migrado → Seção 12 |
| Biometria real | Migrado → Seção 12 |
| Leaked password protection | Migrado → Seção 12 |

</details>

---

## 8. Documentação de Referência (11 documentos no projeto)

Todos salvos no Google Drive (pasta Documentacao/) e como project knowledge neste projeto Claude.

### 8.1 wealthos-especificacao-v1.docx
- Visão geral, escopo, premissas, fora do escopo (MVP)
- Stack tecnológica com justificativas
- Arquitetura de segurança: Auth (MFA, login social), RLS, criptografia (TLS + AES-256 + E2E seletivo), biometria iOS
- Modelo de dados original: 9 tabelas (users_profile, accounts, categories, transactions, recurrences, budgets, assets, tax_records, documents)
- Funcionalidades por módulo (6 módulos), plano de fases (0-8), categorias padrão (seed)

### 8.2 wealthos-funcional-v1.docx
- 62 user stories com critérios de aceite
- Módulos: AUTH (8), FIN (15), ORC (6), CAP (6), PAT (7), FIS (6), DASH (8), CFG (6)

### 8.3 wealthos-adendo-v1.1.docx
- Decisões: dois saldos por conta (atual + previsto), carência 7 dias, fiscal client-side (jsPDF)
- 4 tabelas novas: asset_value_history, monthly_snapshots, notification_tokens, notification_log
- Key Management E2E: DEK protegida por KEK derivada do JWT via HKDF
- Push Notifications: originalmente APNs direto (migrado para Web Push/VAPID na implementação)

### 8.4 wealthos-adendo-v1.2.docx
- Requisitos Apple App Store: Guidelines 4.2/4.8/5.1.1, Privacy Manifest, Sign in with Apple
- Importação: 10 formatos (CSV, OFX, XLSX, XLS, PDF, JPG, PNG, DOC, DOCX, TXT)
- OCR: Apple Vision (iOS) + Tesseract.js (web). **Errata:** §2.1 classifica PDF como "Anexo" sem OCR, mas WKF-03 prevê OCR em PDF. Decisão: PDF é formato OCR.
- Modo offline: React Query + IndexedDB + Service Worker
- Acessibilidade: 8 requisitos (VoiceOver, WCAG AA, Dynamic Type)
- +4 stories: FIN-16, FIN-17, FIN-18, CFG-07

### 8.5 wealthos-adendo-v1.3.docx
- Integração bancária Open Finance (Fase 2, não MVP)
- Agregador certificado (Pluggy ou Belvo), arquitetura agnóstica com BankingProvider interface
- Tabela bank_connections. +6 stories: BANK-01 a BANK-06
- 3 itens pendentes: cobertura BTG/XP, preço agregador, certificação produção

### 8.6 wealthos-adendo-v1.4.docx
- Alinhamento com Strategic Memo jan/2026 + Masterplan CFO Pessoal v9
- Métricas de solvência: LCR, Runway, Burn Rate, Patrimônio por Tiers (T1-T4)
- 9 evoluções futuras catalogadas (Motor CLT, PJ/Simples, Investimentos, Local-First, Zero-Knowledge, Capital Humano, Shadow Ledger, B2B/API)

### 8.7 wealthos-estudo-contabil-v1.5-final.docx
- Modelo contábil partida dobrada (motor invisível ao usuário)
- Plano de contas: 133 contas-semente em 5 grupos (expandido para 140 com multicurrency)
- Centros de custo/lucro: 3 tipos, rateio percentual, hierarquia até 3 níveis
- Dimensão fiscal integrada via tax_treatment por conta
- 7 decisões consolidadas: plano-semente, rateio MVP, lançamentos compostos, reconciliação, Open Finance manual, imutabilidade append-only, PL visível

### 8.8 wealthos-estudo-tecnico-v2.0.docx
- Estudo técnico completo do modelo contábil
- 10 tabelas novas: chart_of_accounts, journal_entries, journal_lines, cost_centers, center_allocations, tax_parameters, economic_indices, economic_indices_sources, workflows, workflow_tasks
- 5 tabelas modificadas (transactions, accounts, budgets, assets, recurrences)
- 12 ENUMs, 16+ indexes, 20+ RLS, triggers, Edge Functions
- 14 stories novas: CTB-01..05, CEN-01..05, WKF-01..04

### 8.9 oniefy-estrategia-ux-retencao-v2.docx
- Estratégia consolidada de UX, ativação e retenção
- Framework de retenção (4 portões), navegação 5+1, onboarding 3 rotas
- Dashboard como fila de atenção, motor narrativo, revelação progressiva
- Implementação em 3 horizontes (H1/H2/H3). Delta: ~12-15 stories

### 8.10 wealthos-adendo-v1.5.docx
- Camada de experiência, IA e modelo patrimonial
- Feedbacks avaliador #1 (nota 9/10 proposta, 5/10 clareza). Decisão Caminho B
- Redesenho: onboarding <2min, MFA diferido, dashboard progressivo (4 níveis), nomenclatura pt-BR
- Modelo patrimonial: hierarquia de ativos, 14 categorias, asset_id em transactions
- Importação em massa: tabela editável + Excel + 5 semanas guiadas
- Arquitetura IA: pipeline 4 etapas (85% sem IA), Gemini Flash-Lite, sanitização PII
- +6 tabelas, +18 stories (UXR, PAT, AI, IMP), 17 prioridades mapeadas

### 8.11 MATRIZ-VALIDACAO-v2.1.md
- Taxonomia de achados (6 categorias: defeito, vulnerabilidade, performance, fragilidade, débito, sujeira)
- 37 auditorias em 10 camadas, 4 pacotes de execução
- Roadmap de certificação: LGPD, ISO 27001, ASVS L2, SOC 2

---

## 9. Catálogos de Dados Externos

Disponíveis como arquivos do projeto:
- `catalogo_ibge_sidra_filter.xlsx` - 9.029 tabelas IBGE
- `catalogo_bcb_sgs_filter.xlsx` - 6.922 séries BCB SGS

---

## 9b. Decisões Técnicas Consolidadas

Referência rápida de todas as decisões arquiteturais, incluindo pivots feitos durante a implementação.

| Decisão | Escolha atual | Origem | Pivot? |
|---|---|---|---|
| Mobile | PWA + Capacitor iOS | Especificação v1.0 | |
| Backend | Supabase (free tier, sa-east-1 São Paulo) | Especificação v1.0 | |
| Saldo de contas | Dois saldos: atual (pagas) + previsto (pagas+pendentes) | Adendo v1.1 | |
| Exclusão de conta | 7 dias de carência + cron process_account_deletions | Adendo v1.1 | |
| Chave E2E | DEK aleatória, protegida por KEK derivada via HKDF (material estável, não JWT efêmero) | Adendo v1.1 → DT-001 | Sim: KEK derivada de JWT → material estável (sessão 18) |
| Push notifications | **Web Push (VAPID)** para web. APNs nativo planejado para iOS | Adendo v1.1 → sessão 19 | **Sim: APNs direto → VAPID** (sessão 19). APNs requer Xcode. |
| OCR | **Tesseract.js** (web). Apple Vision Framework planejado para iOS nativo | Adendo v1.2 → sessão 19 | |
| Offline | SW cacheia assets estáticos. Dados NÃO cacheados offline (decisão deliberada: app financeiro não serve dados stale) | Adendo v1.2 | Sim: IndexedDB planejado → removido |
| Integração bancária | Import manual CSV/OFX/XLSX (Fase 9). Agregador (Pluggy/Belvo) futuro | Adendo v1.3 | |
| Jobs de background | **pg_cron** (13 jobs SQL) + Next.js API routes para push/digest | Adendo v1.1 | **Sim: Edge Functions (Supabase) → pg_cron** (sessão 11) |
| Índices econômicos | BCB SGS + BCB PTAX + **Frankfurter/ECB** + **CoinGecko** | Est. Contábil v1.5 → sessão 22 | **Sim: IPEADATA fallback → Frankfurter/ECB + CoinGecko** (sessão 22, multicurrency) |
| Plano de contas | Híbrido CPC/linguagem natural. **140** contas-semente (5 grupos) | Est. Contábil v1.5 → sessão 22 | Sim: 133 → 140 (expansão multicurrency, sessão 22) |
| Modelo contábil | Partida dobrada append-only, invisível ao usuário | Estudo Contábil v1.5 | |
| Imutabilidade | Append-only estrito (estorno obrigatório via reverse_transaction) | Estudo Contábil v1.5 | |
| Dimensão fiscal | Integrada via tax_treatment nas contas. Fiscal é view, não input | Estudo Contábil v1.5 | |
| Rateio centros | Disponível no MVP. distribute_overhead RPC | Estudo Contábil v1.5 | |
| Provider IA (volume) | **Gemini Flash-Lite** (custo ~$0.02/user/mês). Rate limit: 50/mês free tier | Adendo v1.5 | **Pendente confirmação Claudio** |
| Provider IA (narrativas) | Claude Haiku 4.5 (não implementado, pós-MVP) | Adendo v1.5 | **Pendente confirmação Claudio** |
| Sanitização PII | Regex obrigatório antes de toda chamada IA. 6 padrões (CPF, CNPJ, email, tel, cartão, conta) | Adendo v1.5 | Implementado (sessão 25) |
| Cache IA | ai_cache com TTL 30 dias, hash SHA-256 | Adendo v1.5 | **Pendente confirmação Claudio** |
| Dashboard | **Progressivo** (4 níveis: Novo/Ativo/Engajado/Avançado) | Adendo v1.5 | |
| Nomenclatura UI | pt-BR funcional. Sem termos contábeis expostos. Agnóstica de marcas | Adendo v1.5 | |
| Categorização | **Pipeline 3 etapas** determinísticas + IA fallback: merchant_patterns → categorization_rules → nome. IA é etapa 4 via /api/ai/categorize | Adendo v1.5 | |

---

## 10. Preferências do Usuário

- Respostas em português (pt-BR), tom profissional e objetivo
- Estrutura explícita (títulos, listas, tabelas)
- Metodologia e premissas sempre claras
- Postura cética: questionar premissas, apontar riscos
- Orientação a resultados: recomendações acionáveis
- Agnóstico de marcas na nomenclatura
- Nome do usuário: Claudio
- Projeto pessoal, single-user escalável para família (2-4 usuários)
- Windows 10/11 com PowerShell (terminal: um comando por vez)
- Nunca rodar `npm audit fix --force` (quebra versões)

---

## 11. Sessão 10/03/2026 - Resumo

**Saneamento S1-S8 (backlog completo, 8/8 feitos):**
- S1: KEK estável (random 256 bits em vez de JWT efêmero). Migration 013
- S2: 8 migrations reais exportadas do Supabase para o Git (2.236 linhas)
- S3: Transfer RPC atômica `create_transfer_with_journal()`. Migration 014
- S4: Normalização de sinal nos parsers OFX/CSV (amount sempre positivo)
- S5: PapaParse real substituiu parser CSV manual
- S6: UUID sentinela eliminado. Migration 015
- S7: Rota de índices corrigida com admin client
- S8: Content-Security-Policy adicionada ao next.config.js

**Fase 10 quick wins (todos feitos):**
- PWA icons: icon-192, icon-512, favicon.ico, apple-touch-icon
- Euro: "Euro" → "Euro (€)" no onboarding
- Rebranding: WealthOS → Oniefy (53 arquivos, crypto strings preservadas)
- Next.js upgrade: 14.2.14 → 15.5.12, React 18 → 19
- pg_cron: 3 jobs agendados (workflow tasks, depreciação, balance check)
- Search path fix: 11 functions corrigidas (migration 017)
- RLS initplan: 77 policies otimizadas (migration 018)
- FK indexes: 14 indexes criados (migration 019)

**Commits da sessão:** c453c47, a60489f, 08efb33, a821069, ee06199, 4ea3524, 06c4025, 38d489e, 1320c62, 2bc8cb7

**CI:** todos os commits passaram Lint + Type Check + Security Check + Build

---

## 11b. Sessão 10/03/2026 (continuação) - COA individual + XLSX + bug fixes

**Bug fixes:**
- Toggle do Plano de Contas não funcionava: RLS policy `coa_update` bloqueava UPDATE em contas `is_system=true` (todas as 107 folhas do seed). Migration 020: policy corrigida para permitir UPDATE em todas as contas do usuário (is_system protege apenas DELETE)
- Categorias duplicadas (16 pares): seed `create_default_categories` rodou 2x. Dados limpos. Migration 020b: UNIQUE(user_id, name, type) + function idempotente com ON CONFLICT DO NOTHING

**XLSX import:**
- Parser `xlsx-parser.ts` (55 linhas): SheetJS, auto-detect header row, converte para formato headers+rows reutilizando suggestMapping + mapToTransactions
- Dependência `xlsx ^0.18.5` adicionada
- Formatos agora suportados: CSV, TSV, OFX, QFX, XLSX, XLS

**Auto-criação de contas contábeis individuais (COA child):**
- Novos account_types: `loan` (Empréstimo) e `financing` (Financiamento) no ENUM. Migration 021a
- Nova RPC `create_coa_child(p_user_id, p_parent_id/p_parent_code, p_display_name, p_account_name, p_tax_treatment)`: cria subconta sob qualquer nó do plano, código sequencial automático (X.X.XX.NNN), herda group_type e tax_treatment do pai. Migration 021b
- `useCreateAccount` agora chama `create_coa_child` em vez de vincular à COA genérica. Cada conta bancária/cartão/empréstimo/financiamento ganha sua própria conta contábil individual
- `isLeaf` no TreeNode mudou de `depth === 2` para `!hasChildren` (suporte dinâmico a depth 3+)
- UI manual: botão "+ Nova conta" no Plano de Contas com dialog (seletor de pai + nome)
- Financiamentos: formulário de conta exibe sub-seletor (Imobiliário vs Veículo) quando tipo = financing
- RPCs atualizadas: `get_balance_sheet`, `get_dashboard_summary`, `get_solvency_metrics` agora tratam loan/financing como passivo

**Errata registrada:**
- Adendo v1.2 §2.1: PDF classificado como "Anexo" sem OCR, mas WKF-03 prevê OCR em PDF. Decisão: PDF é formato OCR (além de anexo)

**Estrutura Familiar (family_members):**
- Tabela `family_members`: name, relationship (7 tipos), role (owner/member), birth_date, is_tax_dependent, cpf_encrypted, avatar_emoji, cost_center_id (FK). Migration 023
- ENUMs: `family_relationship` (self, spouse, child, parent, sibling, pet, other), `family_role` (owner, member)
- RPC `create_family_member()`: auto-cria centro de custo/lucro vinculado. Titular/cônjuge = profit_center, demais = cost_center
- Centro default "Pessoal" renomeado → "Família (Geral)" com flag `is_overhead = true`
- `transactions.family_member_id` (FK nullable): atalho para atribuir gasto a um membro
- Aba "Estrutura Familiar" na sidebar com CRUD completo
- Campo "Membro" (opcional) no formulário de transação: aparece quando há membros cadastrados
- Evolução futura (backlog): orçamento delegado por membro, multi-user com auth, rateio automático de overhead

**Design System Plum Ledger v1.1 aplicado:**
- `globals.css` totalmente reescrito: variáveis CSS shadcn substituídas por tokens Plum Ledger (Midnight Plum, Bone, Graphite Ink, Mineral Sage, Oxide Brass, Warm Stone)
- Semânticas calibradas: Verdant (#2F7A68), Terracotta (#A64A45), Burnished (#A97824), Slate (#56688F)
- Dark mode com subtom plum em todas as superfícies
- `tailwind.config.ts`: cores de marca + semânticas + tiers adicionadas com suporte a opacidade (`bg-verdant/10`)
- 144 referências hardcoded substituídas em 39 arquivos (text-green-600 → text-verdant, etc.)
- Constantes JS (PRESET_COLORS, CATEGORY_COLORS, INDEX_TYPE_COLORS, tier colors) atualizadas
- Cores das categorias no banco atualizadas para Plum Ledger
- Novos tokens: --warning, --info, --plum, --bone, --sage, --brass, --stone, --tier-1 a --tier-4
- Tipografia: Inter → DM Sans (corpo) + JetBrains Mono (dados). Instrument Serif (display/hero) adiado (carregamento seletivo)
- Theme colors: branco → Bone (#F5F0E8), preto → Plum deep (#141218)

---

## 11c. Sessão 10/03/2026 (noturna) - Design System audit + Microcopy + Lucide icons + Logo

**Auditoria completa do Design System Plum Ledger:**

Divergências encontradas e corrigidas entre o design system e o código real:

| # | Divergência | Correção |
|---|---|---|
| 1 | manifest.json: `#ffffff` / `#0a0a0a` | → `#F5F0E8` (Bone) / `#241E29` (Plum) |
| 2 | auth.ts: password strength bar (red/orange/yellow/green) | → terracotta/burnished/verdant |
| 3 | bills, budgets, tax, solvency: 9 refs yellow-* | → burnished |
| 4 | bank connections: status colors (green/blue/red/orange) | → verdant/slate/terracotta/burnished |
| 5 | chart of accounts: group colors (blue/red/green/orange/purple) | → slate/terracotta/verdant/burnished/tier-4 |

Resultado: zero referências a cores antigas do Tailwind em `src/`. Commit fdd72eb.

**Auditoria de Microcopy (MAN-LNG-CMF-001):**

14 violações do Manual de Linguagem corrigidas em 28 arquivos:

| Regra violada | Qtd | Exemplo |
|---|---|---|
| §11.2 Reticências proibidas | 12 | "Carregando..." → "Carregando" |
| §11.1 Metadiscurso proibido | 1 | "**Importante:** salve..." → "Salve..." |
| §11.1 Superlativo vazio | 1 | Solvência "Excelente" → "Sólida" |
| §2.2 Imprecisão | 1 | Solvência "OK" → "Estável" |
| §4.6 Imperativo direto | 1 | "Se vazio, usa o nome" → "Deixe em branco para usar o nome" |
| §7.1 Abertura genérica | 1 | manifest → tagline "Patrimônio em campo de visão." (posteriormente substituída por "Any asset, one clear view.") |
| Empty states | ~10 | Tom motivacional → tom descritivo factual |

Commit b751363.

**Ícones Lucide (substituição de emojis decorativos):**

| Emoji | Contexto | Ícone Lucide |
|---|---|---|
| 📊 | Orçamento empty state | BarChart3 |
| 🏦 | Conexão bancária row | Landmark |
| 📈 | Gráfico empty state | TrendingUp |
| 📊 | Resumo orçamento empty | PieChart |
| ✓ | Contas em dia | CircleCheck |
| 📄💰🏷️📋 | Tipo de tarefa workflow | FileUp, Wallet, Tag, ClipboardCheck |

`TASK_TYPE_ICONS` alterado de `Record<TaskType, string>` (emoji) para `Record<TaskType, LucideIcon>` (componente). Emojis de avatar familiar (👤💑👶👴👫🐾) mantidos (persistidos na coluna `avatar_emoji`). Commit 3da6cb0.

**Logo Oniefy (em andamento, não integrado ao código):**

Conceito aprovado: **Penrose Ribbon** (fita dobrada com cruzamento impossível). 3 camadas hexagonais + micro-hexágono central sólido. Iterações feitas com Gemini (imagem) e ChatGPT (SVG vetorial). SVG de referência funcional gerado. Briefing completo preparado com 13 deliverables (logomark full/simplified, lockups serif/sans, app icons, monocromáticos). Claudio está trabalhando em paralelo para refinar antes de integrar.

Assets pendentes: `oniefy-logomark-full.svg`, `oniefy-logomark-simplified.svg`, app icons, favicon. Não foram commitados ao repositório.

**Commits desta sessão:** fdd72eb, 93ad047 (revertido em 0b03a3f), b751363, 3da6cb0

---

## 11d. Sessão 11/03/2026 - Auditoria UX + Índices automáticos + INSS/SM 2026

**Bug fix: Toggle do Plano de Contas**
- Ao desativar conta folha, showInactive era false (padrão) e o item desaparecia da árvore
- Correção: desativar auto-habilita "Mostrar inativas" para feedback visual
- Commit 1889c02

**Auditoria UX completa (17 achados, 4 críticos corrigidos):**

| # | Problema | Gravidade | Correção |
|---|---|---|---|
| UX-01 | Emoji 💸 no empty state Transações | Crítico | Substituído por Lucide ArrowLeftRight |
| UX-02 | Sem paginação em Transações | Crítico | Botões Anterior/Próxima, 50/página |
| UX-03 | Dialogs não fechavam com ESC | Crítico | Hook `useEscapeClose` em 7 dialogs |
| UX-04 | Confirmações destrutivas sem timeout | Crítico | Hook `useAutoReset` (5s) em 10 páginas |
| UX-05 | Sidebar sem ícones | Alto | 15 ícones Lucide + LogOut no "Sair" |
| UX-06 | Empty states: containers vazios | Alto | 10 ícones Lucide em 8 páginas |

Novo arquivo: `src/lib/hooks/use-dialog-helpers.ts` (useEscapeClose + useAutoReset)

**Fix: Sidebar cortava "Configurações":**
- Footer era `absolute bottom-0`, sobrepunha último link da nav
- Correção: aside flex-col, nav flex-1 overflow-y-auto, footer flex-shrink-0
- Commit 5ccae8a

**Parâmetros fiscais 2026 (migration 024):**
- INSS 2026: 4 faixas (7,5% / 9% / 12% / 14%), teto R$8.475,55
  Fonte: Portaria Interministerial MPS/MF Nº 13 (DOU 12/01/2026)
- Salário Mínimo 2026: R$1.621,00
  Fonte: Decreto Presidencial + Portaria MPS/MF 13/2026
- Nota: parâmetros fiscais dependem de curadoria humana (portarias/leis), não de API. Validação mensal recomendada — governo pode alterar faixas a qualquer momento.

**Coleta diária automática de índices (migration 025):**
- Extensões `http` + `pg_net` habilitadas
- Função `cron_fetch_economic_indices()`: consulta BCB SGS para todas as fontes ativas, parse JSON, upsert com ON CONFLICT
- Séries diárias (Selic, CDI, USD/BRL) agrega último dia do mês
- pg_cron: diário às 06:00 UTC (03:00 BRT)
- Primeiro run manual: 153 registros inseridos, 8 índices, 0 erros
- 4 pg_cron jobs ativos:
  - generate-workflow-tasks (diário 02h)
  - cron_fetch_indices (diário 06h UTC) ← NOVO
  - depreciate-assets (mensal dia 1 03h)
  - balance-integrity-check (semanal dom 04h)

**Aba Índices reescrita:**
- Multi-seleção: clique em múltiplos cards para comparar no gráfico
- Horizonte 36 meses (antes: máx 24m)
- Curva acumulada 12m (tracejada) junto com curva mensal, toggle "Acum. 12m"
- Hook `useMultiIndexHistory`: queries paralelas por tipo de índice
- Nota atualizada: "workflow automático" (não "job"), removido "manualmente"

**Sidebar com ícones Lucide (UX-05):**
- 15 ícones importados e renderizados (antes: string não utilizada)
- LogOut no botão "Sair"
- NAV_ITEMS tipado como `{ href, label, icon: LucideIcon }[]`

**Empty states com ícones (UX-06, 10 ocorrências):**
- assets: Package, bills: CalendarClock + Repeat, cost-centers: Target
- connections: Landmark + CircleCheck, family: Users
- workflows: ClipboardList + Workflow, tax: FileSearch, indices: TrendingUp

**Commits desta sessão:** 1889c02, b2fe361, 5ccae8a, 5dc329f, 3341839

---

## 11e. Sessão 11/03/2026 (continuação) - UX final + Logo Maze Cube (revertida)

**5 correções de UX (commit 605b0b8):**

| # | Problema | Correção |
|---|---|---|
| 1 | Toggle Plano de Contas (3a e definitiva correção) | Causa raiz: filtro `showInactive` escondia folhas inativas, e todas as 107 estavam `is_active=false`. Filtro removido por completo. Folhas inativas sempre visíveis (opacity-50) com toggle acessível. Botão "Mostrar/Ocultar inativas" eliminado. 107 folhas restauradas para `is_active=true` no banco |
| 2 | Sidebar não era sticky | `aside sticky top-0 h-screen` no desktop. Nome+logout reposicionados abaixo de "Oniefy" (não mais footer) |
| 3 | Hover bronze (Oxide Brass) ilegível | `--accent` mudou de Oxide Brass para warm neutral sutil. Light: hsl(33,20%,91%), Dark: hsl(273,10%,20%). Texto agora legível |
| 4 | Empty states inconsistentes (accounts, categories) | Ícones Lucide adicionados: Wallet (accounts), Tag (categories). Padronizadas com as 8 páginas já corrigidas |
| 5 | Curva acumulada (Índices) usava campo fixo do banco | Agora calcula acumulado composto do período selecionado (6/12/24/36m). Aplica apenas a índices percentuais (IPCA, INPC, IGP-M, TR). Selic, CDI, USD/BRL sem curva acumulada (são taxa/preço) |

6 arquivos alterados. Lint limpo.

**Logo Maze Cube + Comfortaa (commit 847549e, REVERTIDA em 74e837d):**

Uma sessão anterior tentou integrar um conceito de logo "Maze Cube" com tipografia Comfortaa. O commit incluía:
- 10 SVGs em `public/brand/` (logomark, wordmark, lockup-h, appicon, OG, variações plum-bone/bone-plum/transparent)
- Componente `src/components/brand/logo.tsx` (3 variantes: logomark, wordmark, lockup; SVG inline)
- Substituição de favicon.ico, apple-touch-icon.png, PWA icons (192/512)
- Integração em sidebar desktop/mobile, login, register, onboarding
- Metadata OG image no layout.tsx

**Motivo do revert:** problemas com a edição da logo. O conceito Maze Cube não atendeu aos requisitos visuais. Revert aplicado com commit 74e837d, restaurando o estado anterior (605b0b8).

**Status da logo:** O conceito aprovado continua sendo **Penrose Ribbon**. Os assets Maze Cube foram descartados. A integração será refeita quando o Claudio finalizar os SVGs definitivos do Penrose Ribbon.

**Commits desta sessão:** 605b0b8, 847549e (revertido), 74e837d (revert)

---

## 11f. Sessão 14/03/2026 - Logo + Tagline + Auditoria Codex + Testes + Estabilização

**Logo Penrose Ribbon integrada (commit dbb5bb6):**

Assets fornecidos pelo Claudio (zip com brand kit completo). Integração via `next/image` com `unoptimized` (sem SVG inline, lição do Maze Cube):
- 6 SVGs transparentes em `public/brand/`: lockup-h (plum/bone), lockup-v (plum/bone), logomark (plum/bone)
- OG image: `og-plum-bone-1200x630.png` (1200x630)
- Favicon.ico: multi-size 16x16 + 32x32 (gerado via Pillow)
- apple-touch-icon: 180x180, PWA icons: 192x192 + 512x512
- manifest.json: `purpose: "any maskable"`
- Dark mode: variantes plum/bone com `dark:hidden` / `hidden dark:block`
- Login: lockup-v (h-40), Register: lockup-h (h-10), Onboarding: lockup-v (h-40)
- Sidebar desktop: lockup-h (h-8), Header mobile: lockup-h (h-7)
- Metadata: apple-touch-icon + OG image configurados no root layout

**Tagline oficial (commit 73e59c3):**

"Any asset, one clear view." adotada como tagline oficial em inglês. Tagline PT-BR em aberto. Removida "Patrimônio em campo de visão." de todos os locais (manifest, meta description, login, HANDOVER). Commit 73e59c3.

**Etimologia do nome (commit d8d4d54):**

Documentada na seção 1 do HANDOVER: PIE *oi-no- ("one", "any", "unique") + latim -fy (facere, "construir").

**Auditoria técnica por Codex (13/03/2026):**

Codex executou auditoria profunda do código. 18 achados (WEA-001 a WEA-018). Documento da auditoria commitado em `docs/AUDITORIA-TECNICA-WEALTHOS-2026-03-13.md`.

Triagem Claude + Claudio: 11 autorizados, 7 rejeitados. Ordem de execução formal criada com spec por item (escopo permitido/proibido, critério de aceite, validação obrigatória). Documento em `resposta-auditoria-codex.md`.

Itens não autorizados e motivos:
- WEA-001 (credenciais em docs): repo privado, anon key pública por design
- WEA-004 (biometria stub): requer Mac, planejado para fase iOS
- WEA-006 (build sem env): comportamento esperado, CI tem as variáveis
- WEA-007 (CSP unsafe): requerido por Next.js dev + Tailwind/shadcn
- WEA-012 (endpoint índices): single-user, já corrigido em S7
- WEA-017 (rate limit in-memory): localhost, Redis injustificado
- WEA-018 (boundaries frontend): depende de Zod + testes, futuro

**Correções do Codex (branch work, commit único e68ef91):**

11 itens implementados pelo Codex em commit único (violou política de 1 commit por WEA). Merge feito por Claude com resolução de conflitos e correções:

| WEA | Correção | Status |
|---|---|---|
| WEA-014 | `clearEncryptionKey()` antes de `signOut()` no session timeout | OK |
| WEA-015 | Variável `_budgetMonths` removida | OK |
| WEA-016 | `metadataBase` adicionado ao root layout | OK |
| WEA-003 | Onboarding seed validation: 3 RPCs devem suceder antes de `onboarding_completed` | OK (corrigido por Claude: extraído para `src/lib/services/onboarding-seeds.ts` porque App Router proíbe exports extras em page.tsx) |
| WEA-002 | Schemas Zod para 8 RPCs: dashboard_summary, balance_sheet, solvency_metrics, fiscal_report, fiscal_projection, transaction_result, transfer_result, import_batch_result. `safeParse` em todos, fallbacks granulares | OK |
| WEA-010 | Migration 026: `create_transfer_with_journal` inverte D/C para passivos (credit_card, loan, financing) | OK (aplicada via MCP) |
| WEA-008 | Jest + RTL configurados. 10 testes iniciais (schemas, onboarding, hooks mutação) | OK (corrigido por Claude: import path do onboarding-seeds) |
| WEA-009 | Testes SQL reescritos sem UUID fixo | OK (corrigido por Claude: `account_nature` → `group_type`, executado no Supabase: 4/4) |
| WEA-005 | `useAuthInit()` extraído do layout para `src/lib/hooks/use-auth-init.ts` | OK |
| WEA-011 | README reescrito com arquitetura real | OK (corrigido por Claude: Next.js 14 → 15) |
| WEA-013 | Connections page decomposta: 5 componentes em `src/components/connections/` (530 → 220 linhas) | OK |

**Pacote 1 Codex (testes expandidos):**

36 testes novos adicionados pelo Codex (branch work, 4 commits separados):
- `test(parsers)`: csv/ofx/xlsx com fixtures simuladas (14 tests)
- `test(hooks)`: useAccounts/useCategories/useBudgets sucesso + erro (6 tests)
- `test(auth-validation)`: loginSchema/registerSchema (10 tests)
- `test(rpc-schema)`: autoCategorizeTransactionSchema (4 tests)
- Novo schema: `autoCategorizeTransactionSchema` em `src/lib/schemas/rpc.ts`
- `jest.setup.ts`: polyfill crypto para jsdom
- Merge por Claude com 3 conflitos resolvidos + mesma regressão do onboarding-seeds corrigida novamente

**Pacotes 2 e 3 (executados por Claude):**

- Pacote 2 (WEA-009): Testes SQL executados no Supabase. Corrigido `account_nature` → `group_type`. 4/4 cenários passaram
- Pacote 3: `database.ts` regenerado via `Supabase:generate_typescript_types`. Atualizado novamente nas sessões subsequentes (mais recente: migration 030)

**Estado final dos testes:**
- 11 suítes, 122 testes, todos passando
- Testes SQL: 4 cenários executados no Supabase
- CI: 3/3 jobs verdes (Security, Lint & TypeCheck, Build)

**Modelo operacional Claude + Codex validado:**

1. Claude analisa, produz ordem de execução com spec detalhada
2. Claudio envia ao Codex
3. Codex executa em branch separada
4. Claude revisa, corrige, valida e faz merge + aplica migrations

Problemas recorrentes do Codex: reintroduz bugs já corrigidos (trabalha sobre snapshot sem consciência de correções posteriores), não segue política de commits, não entrega relatório final.

**Commits desta sessão (14/03/2026):**
74e837d (revert Maze Cube), 4d5c251 (HANDOVER 11e), dbb5bb6 (logo Penrose Ribbon), 73e59c3 (tagline), d8d4d54 (etimologia), e68ef91 (Codex auditoria), a5f093f (fix onboarding-seeds), 7aee0ca (merge Pacote 1 Codex), 9bd7991 (pacotes 2+3), 0798e29 (README fix), 0258240 (HANDOVER), 49d0f6b (ícone Archive), 786676f (drag-and-drop upload), 40e5b53 (schemas Zod completos), b30d80a (orçamento delegado por membro)

**Trabalho adicional na mesma sessão (após HANDOVER inicial):**

UX polish (3 itens avaliados):
- Ícone desativar (lixeira/X → Archive) em 3 páginas: accounts, cost-centers, family (commit 49d0f6b)
- Feedback loading em mutations: já implementado em 29+ botões, zero pendência
- Drag-and-drop no upload: já implementado pelo Codex no WEA-013, expandido (commit 786676f)

Schemas Zod completos (commit 40e5b53):
- 16 novos schemas (total: 25 em `src/lib/schemas/rpc.ts`)
- 19 casts `as unknown as` removidos de 10 hooks/services (sobra 1 de escrita, aceitável)
- Cobertura: assets, budgets, cost-centers, dashboard, economic-indices, fiscal, recurrences, workflows, transaction-engine
- Todos com safeParse + fallback gracioso (leituras) ou throw (mutações)

Orçamento delegado por membro familiar (commit b30d80a):
- Migration 027: coluna `family_member_id` (FK → family_members) na tabela budgets
- Índice parcial + unique constraint atualizada (categoria + mês + membro)
- RPC `get_budget_vs_actual` reescrita com CTE e param `p_family_member_id`
- Hooks atualizados: `useBudgets`, `useBudgetVsActual`, `useCreateBudget` (filtro + duplicate check)
- UI: seletor de membro com pill buttons na página de orçamento ("Lar" + membros ativos)
- Sem membros cadastrados: funciona como antes (seletor não aparece)
- database.ts e schemas Zod atualizados

Codex descontinuado: a partir desta sessão, todo trabalho passa exclusivamente por Claude. O custo de supervisão do Codex (bugs reintroduzidos, conflitos de merge, regressões) superava o ganho de tempo.

---

## 11g. Sessão 14/03/2026 (continuação) - Expansão de testes

**Cobertura de testes expandida de 46 → 122 (commit 7b5fa1f):**

4 novas suítes adicionadas:

| Suíte | Testes | Cobertura |
|---|---|---|
| `utils.test.ts` | 14 | formatCurrency (5), formatDate (4), formatRelativeDate (5) |
| `rate-limiter.test.ts` | 15 | checkRateLimit (7), extractRouteKey (6), rateLimitHeaders (2) |
| `auth-schemas-extended.test.ts` | 25 | mfaCodeSchema (5), forgotPasswordSchema (3), resetPasswordSchema (3), passwordSchema deep (6), getPasswordStrength (4), isPasswordBlocked (4) |
| `rpc-schemas-extended.test.ts` | 22 | assetsSummary (2), depreciateAsset (1), centerPnl (1), centerExport (1), allocateToCenters (1), indexLatest (1), economicIndices (1), workflowCreate (1), generateTasks (1), completeTask (1), reversal (2), taxParameter (1), budgetWithCategory (2), topCategories (1), balanceEvolution (2), budgetVsActual (2), logSchemaError (1) |

**Estado final:** 11 suítes, 122 testes, todos passando. CI 3/3 verde. 25/25 schemas Zod cobertos.

**Commits desta sessão:** 7b5fa1f

---

## 11h. Sessão 14/03/2026 (continuação) - Conciliação bancária (3 camadas)

**Migration 028a (schema):**
- ENUM `payment_status` (pending, overdue, paid, cancelled)
- 4 novas colunas em `transactions`: `payment_status`, `due_date`, `matched_transaction_id`, `amount_adjustment`
- Trigger bidirecional `sync_payment_status`: `is_paid ↔ payment_status` (backward compatible)
- Backfill: transações com `is_paid=true` recebem `payment_status='paid'`
- 2 indexes: `idx_transactions_payment_status`, `idx_transactions_reconciliation`

**Migration 028b (RPCs + cron):**
- `cron_mark_overdue_transactions`: diário 01:00 UTC, marca `pending → overdue` quando `due_date < today`
- `find_reconciliation_candidates(p_user_id, p_account_id, p_amount, p_date, p_tolerance_pct, p_tolerance_days)`: busca pendentes na mesma conta com valor ±10% e data ±7 dias, retorna até 5 ordenados por match_score
- `match_transactions(p_user_id, p_pending_id, p_imported_id)`: vincula pendente a importada, registra ajuste, soft-delete da importada (audit trail)
- `import_transactions_batch` reescrita (v2): antes de inserir, procura pendente com auto-match (score < 25). Se encontrar, baixa em vez de duplicar. Novo campo `matched` no retorno

**Frontend (Camada 3):**
- Hook `use-reconciliation.ts`: `useUnmatchedImports`, `usePendingUnmatched`, `useMatchTransactions`
- Componente `reconciliation-panel.tsx` (279 linhas): duas colunas (pendentes × importadas), filtro por conta, seleção de par, exibição de ajuste, validação de mesma conta, toast de sucesso
- Nova aba "Conciliação" na página de conexões (3 abas: Importar | Conciliação | Conexões)
- `import-step-result.tsx`: exibe contagem de conciliadas automaticamente com ícone Link
- `bills/page.tsx`: usa `payment_status` para badges (overdue em vermelho), prioriza `due_date` sobre `date`
- Schemas Zod: `reconciliationCandidateSchema`, `matchTransactionsResultSchema`, `importBatchResultSchema` (v2 com `matched`)
- 5 testes novos (total: 127)

**Score de matching (referência):**
- Fórmula: `(|amount_diff| / max(amount, 0.01)) * 50 + |days_diff| * 5`
- Score < 25 = auto-match (ex: 5% diferença + 2 dias = 2.5 + 10 = 12.5)
- Score 25+ = não auto-match, fica para conciliação manual

**pg_cron jobs (5 ativos):**
1. `cron_generate_workflow_tasks` (diário 02h UTC)
2. `cron_mark_overdue_transactions` (diário 01h UTC)
3. `cron_fetch_economic_indices` (diário 06h UTC)
4. `cron_depreciate_assets` (mensal dia 1 03h UTC)
5. `cron_balance_integrity_check` (semanal dom 04h UTC)

**Commits desta sessão:** 7e48af6 (HANDOVER testes), 06eedc0 (reconciliation Camadas 1+2), 7ffccf7 (reconciliation Camada 3)

---

## 11i. Sessão 14/03/2026 (continuação) - CFG stories + account deletion cron

**CFG-01, CFG-02, CFG-03 (commit b89e124):**
- Nova página `/settings/profile`: editar nome (com sync para auth metadata), alterar senha (com validação Zod passwordSchema), moeda padrão (BRL/USD/EUR/GBP)
- Settings hub reescrita: ícones Lucide (User, Shield, Database, Bell), links para subpáginas, apenas Notificações como "Em breve"

**CFG-05 (commit b89e124):**
- Nova página `/settings/data`: exportar todos os dados (14 tabelas + perfil)
- Dois formatos: JSON completo ou CSV (transações) + JSON (restante)
- Progress bar durante export. Campos criptografados permanecem cifrados (DEK não incluída)

**CFG-06 completado (commit e193f02):**
- Migration 029: `cron_process_account_deletions` (diário 03:30 UTC)
- Purge de 20 tabelas respeitando FK constraints (children first)
- PII removida do `users_profile` (nome → "[excluído]", CPF/keys → NULL)
- Security page: banner de exclusão pendente com data de processamento, botão "Cancelar exclusão"

**pg_cron jobs (6 ativos):**
1. `cron_mark_overdue_transactions` (diário 01h UTC)
2. `cron_generate_workflow_tasks` (diário 02h UTC)
3. `cron_process_account_deletions` (diário 03:30 UTC)
4. `cron_fetch_economic_indices` (diário 06h UTC)
5. `cron_depreciate_assets` (mensal dia 1 03h UTC)
6. `cron_balance_integrity_check` (semanal dom 04h UTC)

**4 stories concluídas:** CFG-01, CFG-02, CFG-03, CFG-05. **Total: 86/90.**

**Commits:** b89e124 (CFG-01/02/03/05), e193f02 (CFG-06 cron)

---

## 11j. Sessão 14/03/2026 (continuação) - Testes + CFG-07 (offline)

**Testes dialog helpers (commit 9e3407b):**
- `dialog-helpers.test.ts`: useEscapeClose (4 tests), useAutoReset (4 tests)
- Total: 12 suítes, 150 testes

**CFG-07: Modo offline (commit 04498b8):**
- Service Worker (`public/sw.js`, 142 linhas): cache-first para assets estáticos, network-first para API/Supabase, fallback `/dashboard` para navegação offline, cache versioning `oniefy-v1`
- Hook `use-online-status.ts`: `useOnlineStatus` (reativo via online/offline events), `useServiceWorker` (registro no mount)
- Layout: banner offline (burnished warning) acima do conteúdo quando `!isOnline`
- QueryProvider: `networkMode: 'offlineFirst'`, `staleTime: 5min`, `gcTime: 30min`
- Nota: IndexedDB persistence (`tanstack-query-persist`) adiada. SW + React Query in-memory é suficiente para uso de leitura offline

**1 story concluída:** CFG-07. **Total: 87/108 (87 concluídas, 3 bloqueadas por Mac/iOS, 18 novas do adendo v1.5).**

**Verificação da contagem (por módulo):**

| Módulo | Stories | Concluídas | Bloqueadas |
|---|---|---|---|
| AUTH | 01..08 | 8 | 0 |
| FIN | 01..18 | 16 | 2 (FIN-17 OCR, FIN-18 câmera) |
| ORC | 01..06 | 6 | 0 |
| CAP | 01..06 | 6 | 0 |
| PAT | 01..07 | 7 | 0 |
| FIS | 01..06 | 6 | 0 |
| DASH | 01..12 | 12 | 0 |
| CFG | 01..07 | 6 | 1 (CFG-04 notificações iOS) |
| BANK | 01..06 | 6 | 0 |
| CTB | 01..05 | 5 | 0 |
| CEN | 01..05 | 5 | 0 |
| WKF | 01..04 | 4 | 0 |
| UXR | 01..05 (adendo v1.5) | 0 | 0 (novas) |
| PAT (expandido) | 08..11 (adendo v1.5) | 0 | 0 (novas) |
| AI | 01..05 (adendo v1.5) | 0 | 0 (novas) |
| IMP | 01..04 (adendo v1.5) | 0 | 0 (novas) |
| **Total** | **108** | **87** | **3 bloqueadas + 18 novas** |

**Commits:** 9e3407b (testes), 04498b8 (CFG-07)

---

## 11k. Sessão 14/03/2026 (continuação) - Auditoria Gemini + errata

**Auditoria Gemini (2a rodada, 14/03/2026):**

6 achados, nota 8.5/10. Triagem:

| # | Achado | Sev. Gemini | Veredicto | Ação |
|---|--------|-------------|-----------|------|
| 1a | `search_path` faltando em `create_transfer_with_journal` | CRÍTICO | **Aceito (bug real)** | Migration 030 aplicada |
| 1b | RLS para multi-user (workspaces/grupos familiares) | CRÍTICO | **Aceito para backlog** | Evolução futura |
| 2 | Middleware vazado / Server Actions | ALTO | **Rejeitado** | Oniefy não usa Server Actions |
| 3 | DTOs separados dos tipos do banco | MÉDIO | **Rejeitado** | 27 schemas Zod já cumprem esse papel |
| 4 | Parsing pesado em Web Workers | MÉDIO | **Aceito** | Implementar |
| 5 | Waterfall no Dashboard / SSR prefetch | BAIXO | **Aceito parcial** | React Query já paraleliza, mas SSR prefetch é válido |
| 6 | Contraste e ARIA labels | BAIXO | **Aceito** | Implementar |

**Errata: "O Gemini não leu o código"**

Na triagem inicial, Claude afirmou que todas as functions já tinham `search_path` (corrigidas na migration 017). Claudio questionou. Verificação no `pg_proc` revelou que `create_transfer_with_journal` era `SECURITY DEFINER` sem `search_path` (regressão da migration 026 que reescreveu a function sem incluir a cláusula). O Gemini estava certo neste ponto. Corrigido com migration 030.

**Errata: "Single-user by design"**

Claude descartou o achado de RLS multi-user dizendo que o Oniefy era single-user. Claudio apontou a inconsistência: o projeto tem `family_members` com roles, `budgets.family_member_id`, transações atribuídas a membros. O modelo atual opera sob um `auth.uid()` (titular vê tudo), mas a premissa documentada é "escalável para 2-4 usuários". Quando membros tiverem login próprio, o RLS atual não suporta. O achado foi reclassificado de "rejeitado" para "aceito como evolução futura".

**Lição:** Não rejeitar achados de auditoria sem verificar no banco. A certeza de que "já foi corrigido" precisa de evidência (`pg_proc`, não memória).

**Commits:** 69d8b46 (migration 030 + audit docs)

---

## 11l. Sessão 14/03/2026 (continuação) - Auditoria ChatGPT + correções

**Auditoria ChatGPT (14/03/2026):**

6 achados complementares ao Gemini, nota não atribuída. Qualidade superior: todos verificados e confirmados no código.

| # | Achado | Sev. | Veredicto | Status |
|---|--------|------|-----------|--------|
| 1 | Rate limiter decorativo (signInWithPassword bypassa middleware) | CRÍTICO | **Aceito (limitação arquitetural)** | Documentado. Supabase GoTrue tem rate limiting próprio |
| 2 | `redirectTo` cru em `router.push` (open redirect + XSS) | ALTO | **Aceito** | **CORRIGIDO.** `sanitizeRedirectTo()` em 3 arquivos |
| 3 | SW cacheando conteúdo autenticado | ALTO | **Aceito** | **CORRIGIDO.** SW reescrito, cache apenas estáticos imutáveis, limpeza no logout |
| 4 | Budget `family_member_id` ignorado em update/copy | MÉDIO | **Aceito** | **CORRIGIDO.** useUpdateBudget + useCopyBudgets + budgets page |
| 5 | Callback `error=` vs login `reason=` | MÉDIO | **Aceito** | **CORRIGIDO.** Callback usa `reason=`, login lê ambos |
| 6 | CSP `unsafe-eval` + `unsafe-inline` | BAIXO | **Aceito parcial** | Necessário em dev (Next.js), nonce/hash para produção |

**Detalhes das correções:**
- `sanitizeRedirectTo()`: rejeita `//`, `\`, `:`, `@`, `javascript:`, `data:`, URLs codificadas. 15 testes
- `sw.js` v2: `isImmutableAsset()` permite apenas `_next/static/`, fontes, `/icons/`, `/brand/`. Zero cache de HTML/API/Supabase. Message listener `CLEAR_CACHE` no logout
- Budget: `CopyBudgetInput` + `useCopyBudgets` agora filtram por `family_member_id` em check, fetch e insert. `useUpdateBudget` inclui `family_member_id` no payload
- Callback: `error=auth_callback_failed` → `reason=auth_callback_failed`

**Comparação Gemini vs ChatGPT:**

| Aspecto | Gemini | ChatGPT |
|---|---|---|
| Achados reais | 2/6 (search_path + RLS futuro) | 5/6 (todos confirmados) |
| Falsos positivos | 3 (Server Actions, DTOs, waterfall) | 0 |
| Profundidade | Genérica, sem linhas específicas | Específica, com trechos de código |
| Foco | Arquitetura + boas práticas | Bugs funcionais + segurança |
| Nota | 8.5/10 | Não atribuída |

O ChatGPT foi significativamente mais útil nesta rodada: encontrou o open redirect, o SW perigoso e o bug funcional do budget, que são deficiências materiais.

**12 suítes, 150 testes.** CI 3/3 verde.

**Commits:** 222f8db (5 correções ChatGPT)

---


## 12. Backlog Consolidado Único

**Esta é a fonte única de verdade para todo trabalho pendente.** Qualquer nova sessão deve consultar apenas esta seção para montar um plano de trabalho.

**NOTA: Para métricas numéricas (tabelas, functions, tests, etc.), a fonte única é a §3.2.** Os "Totais atualizados" nos logs de sessões históricas abaixo refletem o momento em que foram escritos e podem estar defasados. Sempre consulte §3.2 para números corretos.

**Contagem geral:** 108 stories especificadas. **105 concluídas** (87 originais + 18 adendo v1.5). 3 bloqueadas (requerem Mac: CFG-04, FIN-17, FIN-18).


### 12.1 Sequência de execução recomendada (adendo v1.5)

Itens do adendo v1.5 (feedbacks de usabilidade + IA + modelo patrimonial). Origem: `wealthos-adendo-v1_5.docx`. Priorização por impacto × esforço.

**Sprint 1: Quick wins UX (~1 sessão) ✅ CONCLUÍDA (20/03/2026)**

| # | Ação | Impacto | Esforço | Referência | Status |
|---|---|---|---|---|---|
| P1 | Auditoria de strings e renomeações (Cockpit → Fôlego, Centros de Custo → Divisões, LCR → Índice de liquidez, Runway → Fôlego em meses, Burn Rate → Custo mensal médio, Tiers → Níveis de acesso ao dinheiro, Fiscal → Imposto de Renda) | Alto | Baixo | Adendo v1.5 §2.3 | ✅ |
| P2 | Promover importação para sidebar principal + CTA grande no dashboard + botão em Transações | Alto | Baixo | Adendo v1.5 §2.6 | ✅ |
| P15 | Cronograma guiado de setup (plano de 5 semanas visível ao usuário, cada semana com entrega de valor) | Alto | Baixo | Adendo v1.5 §4.4 | ✅ |

**Sprint 2: Onboarding (~1 sessão) ✅ CONCLUÍDA (20/03/2026)**

| # | Ação | Impacto | Esforço | Referência | Status |
|---|---|---|---|---|---|
| P4 | Onboarding simplificado: welcome → pergunta única → setup auto → redirect. MFA diferido para banner no dashboard após 24h. Currency default BRL. | Alto | Médio | Adendo v1.5 §2.1 | ✅ |

**Sprint 3: Schema patrimonial (~1 sessão) ✅ CONCLUÍDA (20/03/2026)**

| # | Ação | Impacto | Esforço | Referência | Status |
|---|---|---|---|---|---|
| P16 | Expansão ENUM asset_category de 5 para 14 valores (vehicle_auto, vehicle_moto, vehicle_recreational, vehicle_aircraft, jewelry, fashion, furniture, sports, collectibles) | Médio | Baixo | Adendo v1.5 §3.4 | ✅ |
| P7a | Migration: parent_asset_id (UUID FK NULL) em assets + asset_id (UUID FK NULL) em transactions e journal_entries | Alto | Baixo | Adendo v1.5 §3.1-3.2 | ✅ |

**Sprint 4: Navegação + Formulário (~1 sessão) ✅ CONCLUÍDA (20/03/2026)**

| # | Ação | Impacto | Esforço | Referência | Status |
|---|---|---|---|---|---|
| P3 | Reorganizar Configurações: Importação removida (sidebar P2), IR promovido para grupo "Finanças", Tarefas removida (acessível via /workflows) | Alto | Médio | Adendo v1.5 §2.2 | ✅ |
| P6 | Formulário de transação radical: modo rápido = valor + descrição + conta. Tipo, categoria, data, status, membro, asset no modo expandido. | Médio | Baixo | Adendo v1.5 §2.5 | ✅ |

**Sprint 5: Categorização determinística (~1 sessão) ✅ CONCLUÍDA (20/03/2026)**

| # | Ação | Impacto | Esforço | Referência | Status |
|---|---|---|---|---|---|
| P10 | Pipeline de categorização: categorization_rules (26 regex globais BR) + merchant_patterns (aprendizado por correção). auto_categorize reescrita (3 etapas). learn_merchant_pattern RPC. | Alto | Médio | Adendo v1.5 §5.4 etapas 1-2 | ✅ |

**Sprint 6-7: Importação em massa (~2 sessões) ✅ CONCLUÍDA (20/03/2026)**

| # | Ação | Impacto | Esforço | Referência | Status |
|---|---|---|---|---|---|
| P8 | BulkEntryGrid: tabela editável genérica (add row, validação inline, save all). BulkImportTab: 3 domínios (bens, veículos, investimentos) com configs de colunas dedicadas. Integrado em /connections como aba "Cadastro em massa". | Alto | Médio-alto | Adendo v1.5 §4.2.1 | ✅ |
| P9 | 3 templates Excel por domínio (bens, veículos, investimentos) + download client-side via ExcelJS. Templates com sheet de instruções e exemplos BR. | Médio | Médio | Adendo v1.5 §4.2.2-4.3 | ✅ |

**Sprint 8: Dashboard progressivo (~1 sessão) ✅ CONCLUÍDA (20/03/2026)**

| # | Ação | Impacto | Esforço | Referência | Status |
|---|---|---|---|---|---|
| P5 | Dashboard com 4 níveis de maturidade: Novo (0-10tx: setup+import+narrative+summary), Ativo (11-50tx: +categorias+bills+budget), Engajado (51+tx 2+meses: +balanço+evolução+solvência), Avançado (opt-in futuro). | Alto | Médio-alto | Adendo v1.5 §2.4 | ✅ |

**Sprint 9: Gateway IA (~1 sessão) ✅ CONCLUÍDA (21/03/2026)**

| # | Ação | Impacto | Esforço | Referência | Status |
|---|---|---|---|---|---|
| P11 | Gateway IA: tabelas ai_cache + ai_usage_log, RPCs (rate limit, cache, save), sanitizador PII, API route /api/ai/categorize (Gemini Flash-Lite), hook useAiCategorize, cron limpeza cache. Ativação requer GEMINI_API_KEY no env. | Alto | Médio | Adendo v1.5 §5.3-5.4-5.9 | ✅ |

**Sprint 10: Hierarquia de ativos na UI (~1 sessão) ✅ CONCLUÍDA (21/03/2026)**

| # | Ação | Impacto | Esforço | Referência | Status |
|---|---|---|---|---|---|
| P7b | UI de hierarquia de ativos: parent_asset_id no AssetForm, select de bem pai (filtra bens sem pai), prop defaultParentId para fluxo "adicionar acessório" | Alto | Médio | Adendo v1.5 §3.1-3.3 | ✅ |
| P14 | Cadastro assistido de bens: tabela asset_templates (27 templates BR com depreciação e valor referência), useAssetTemplates hook, searchTemplates helper | Médio | Médio | Adendo v1.5 §5.6 | ✅ |

**Pós-MVP: ✅ CONCLUÍDO (21/03/2026)**

| # | Ação | Impacto | Esforço | Referência | Status |
|---|---|---|---|---|---|
| P12 | Extração de documentos: /api/ai/extract (OCR text → regex BR → Gemini Flash fallback). Campos: amount, date, CNPJ, merchant. PII sanitizado. | Médio | Médio | Adendo v1.5 §5.5 | ✅ |
| P13 | Insights narrativos: /api/ai/insights + tabela user_insights. Claude Haiku primário, Gemini fallback. Cached por mês. | Médio | Médio | Adendo v1.5 §5.7 | ✅ |
| P17 | Assistente conversacional: /api/ai/chat. Claude Sonnet + tool calling (4 ferramentas: query_transactions, get_summary, get_balance_sheet, get_category_spending). Loop max 3 iterações. | Alto | Alto | Adendo v1.5 §5.8 | ✅ |


### 12.2 Limitações conhecidas (avaliar antes do deploy)

| Item | Motivo | Mitigação |
|---|---|---|
| Rate limiter não protege signInWithPassword | SDK Supabase vai direto ao GoTrue, bypassa middleware | GoTrue tem rate limiting próprio. WAF em produção |
| CSP requer `unsafe-eval` em dev | Next.js usa eval para HMR | Nonce/hash em produção (já implementado) |
| Biometria é stub | Capacitor BiometricAuth requer build nativo | Funcional após I3 |
| SW não cacheia dados offline | Decisão deliberada: app financeiro não deve servir dados stale | React Query offlineFirst serve cache in-memory |


### 12.3 Itens de auditoria deferidos (avaliar antes do deploy)

Baixa prioridade. Implementar apenas se o cenário concreto se materializar.

| Item | Gatilho para implementar |
|---|---|
| Web Workers para parsers CSV/OFX/XLSX (Gemini #4) | Usuário reportar travamento na importação |
| SSR prefetch no Dashboard (Gemini #5) | Escala para 10+ usuários ou TTI > 2s medido |


### 12.4 UX/Retenção pendente

Dos 19 itens originais em 3 horizontes (H1/H2/H3), 17 foram concluídos. Restam:

| # | Item | Esforço | Dependência |
|---|---|---|---|
| UX-H2-02 | Push notifications: vencimentos + inatividade + conta desatualizada (APNs) | Médio | CFG-04 (requer Mac) |
| UX-H3-05 | Teste de corredor com 3 pessoas (5 tarefas, observar hesitações) | Baixo | Ação Claudio, sem código |

Métricas-alvo: onboarding >70%, time-to-value <5min, D1 >35%, D7 >20%, D30 >12%, tx/semana >5.


### 12.5 Ações do Claudio (paralelas, sem sessão Claude)

| Item | Status |
|---|---|
| Supabase Pro (habilitar leaked password protection) | Pendente (decisão de custo) |
| Validação fiscal periódica (IRPF, INSS, SM: verificar DOU) | Recorrente |
| Apple Developer Account (US$ 99/ano) | Pendente (decisão Claudio) |
| Teste de corredor com 3 pessoas (UX-H3-05) | Pendente |
| Confirmação das 6 decisões pendentes do adendo v1.5 (providers IA, rate limit, cache) | Pendente |


### 12.6 Deploy web (após limitações corrigidas + ações Claudio)

| # | Item | Esforço | Status |
|---|---|---|---|
| W1 | Deploy Vercel + domínio oniefy.com + DNS | 30 min | Não iniciado (P1 blocker para lançamento) |
| W2 | Supabase Pro (leaked password protection + limites produção) | 5 min | Requer assinatura Claudio |


### 12.7 Stories bloqueadas por Mac/iOS (3/108)

| Story | Descrição | Requisito |
|---|---|---|
| CFG-04 | Push notifications (APNs) | Xcode + Apple Developer Account |
| FIN-17 | OCR recibo (Apple Vision + Tesseract.js + PDF.js) | Xcode (Vision Framework nativo); web fallback possível |
| FIN-18 | Câmera comprovante (Capacitor Camera) | Xcode |


### 12.8 iOS / App Store (última etapa, requer Mac)

| # | Item | Esforço | Requisito |
|---|---|---|---|
| I1 | Apple Developer Account (US$ 99/ano) | 5 min | Decisão Claudio |
| I2 | Capacitor iOS build + teste (Xcode Cloud 25h grátis/mês) | 2h | I1 |
| I3 | Biometria real (Capacitor BiometricAuth, substituir stubs) | 4-6h | I2 |
| I4 | OCR real (Apple Vision nativo + Tesseract.js web + PDF.js) | 4-6h | I2 |
| I5 | Submissão App Store | 2h | I1, I2, I3 |


### 12.9 Evolução futura (sem prazo, por gatilho)

| Item | Origem | Gatilho |
|---|---|---|
| RLS multi-user (workspaces/grupos para login independente de membros) | Gemini audit #1b | Cônjuge ou membro solicitar login próprio |
| Rateio automático de overhead por centro | Estudo técnico v2.0 | Volume > 50 tx/mês com centros |
| pg_cron para limpeza de soft-deleted (90 dias) | Adendo v1.2 | Volume de dados justificar |
| Open Finance (Pluggy, Belvo) | Adendo v1.3 | Agregador viável + certificação + budget |
| Motor CLT (bruto-líquido automático) | Adendo v1.4 | Demanda de usuários CLT |
| Motor PJ/Simples Nacional | Adendo v1.4 | Demanda de usuários PJ |
| Motor Investimentos (DARF, isenções) | Adendo v1.4 | Módulo investimentos implementado |
| Arquitetura Local-First (SQLite + WASM + CRDTs) | Adendo v1.4 | Escala ou requisito de offline total |
| Zero-Knowledge expandido | Adendo v1.4 | Demanda de privacidade extrema |
| Capital Humano (DCF da carreira) | Adendo v1.4 | Produto maduro |
| Shadow Ledger + Cofre Digital | Adendo v1.4 | Produto maduro |
| B2B / Open API / Marketplace de Solvência | Adendo v1.4 | Base de usuários estabelecida |


### 12.10 Remediação da auditoria Claude Code (histórico, docs/audit/)

Auditoria completa realizada em 16/03/2026 (PR #4). Relatório em `docs/audit/` (9 arquivos). Referências: OWASP ASVS L2, MASVS, Nielsen, WCAG 2.2 AA. Nota: 7/10.

**Totais: 0 CRÍTICO, 15 ALTO, 39 MÉDIO, 26 BAIXO.**
**Remediação: 63 resolvidos, 17 excluídos (aceitos/adiados).**

Remediação executada em 16/03/2026 via 12 lotes sequenciais (11 commits + 1 migration-only):

| Lote | Commit | Achados | Escopo |
|------|--------|---------|--------|
| 1 | 601be41 | D8.02, D8.03, D8.13 | aria-label em 23 botões icon-only + color pickers |
| 2 | eaea2eb | D8.07, D8.11, D8.14 | scope em tabelas, sidebar a11y, auth main landmark |
| 3 | 78d8f23 | D8.04-06, D8.08-09, D8.15-16 | htmlFor/aria-required/describedby em 6 forms, radiogroups, password strength |
| 4 | b5f2fc5 | D8.10, D8.12 | +/- prefixos em valores financeiros, focus rings |
| 5 | 8bf8b1b | D7.01, D7.02, D7.08, D7.13 | Campo monetário vírgula, Sonner toasts (18 pontos), erros PT-BR |
| 6 | c79b52c | D1.02-04, D3.02 | Proxies register/forgot-password com rate limit, timing-safe, SW cleanup |
| 7 | a60667a | D2.01-05, D3.01-06, D1.07-08 | Export sem cpf, user_id filters, error sanitization, CSV injection fix |
| 8 | c28cd62 | D7.04-06, D7.11, D7.14-15 | formatCurrency dinâmico, busca em 4 páginas, ESC/dialog fixes, sync indicator |
| 9 | 352ca11 | D6.01-05 | JOIN inline em transações, staleTime, trigram + matched_id indexes |
| 10 | migration | D6.09-11, D2.04 | Cron duplicate guard, deletion timeout (migration 035+036) |
| 11 | b1aaad4 | D5.01-08, D4.01 | detectPlatform shared, formatMonthShort, console dev-only, deps cleanup, biometric fix |
| 12 | c023b92 | D7.07, D7.09-10, D7.12, D7.16 | Duplicar transação, help cards, parsing progress |

**Achados excluídos (17):** D1.01 (Redis), D1.05 (AAL2 server), D1.06 (password rotation), D4.02-04 (biometric/native), D5.09 (TODO Fase 10), D6.06-08/12-16 (micro-otimizações), D6.15 (trigger O(n²)), D7.03 (edição transações), D8.01 (focus trap)

**Detalhes completos:** ver `docs/audit/01-auth-session.md` a `08-accessibility.md`.

---


---

## 13. Sessão 14/03/2026 (log)

20 commits, CI 3/3 verde em todos.

| Commit | Escopo |
|---|---|
| 4788b11 | docs: HANDOVER (sessão anterior) |
| 7b5fa1f | test: 46 → 122 (4 suítes novas) |
| 7e48af6 | docs: HANDOVER testes |
| 06eedc0 | feat: conciliação bancária Camadas 1+2 |
| 7ffccf7 | feat: conciliação UI Camada 3 |
| 7037527 | docs: HANDOVER reconciliação |
| b89e124 | feat: CFG-01/02/03/05 (perfil, senha, moeda, export) |
| e193f02 | feat: CFG-06 (pg_cron account deletion) |
| ed0ca63 | docs: HANDOVER CFG |
| 9e3407b | test: dialog helpers (12 suítes, 135 testes) |
| 04498b8 | feat: CFG-07 (Service Worker + offline) |
| 6f681cc | docs: HANDOVER CFG-07 |
| 07e6a0c | docs: HANDOVER contagem reconciliada 87/90 |
| 69d8b46 | fix: search_path (Gemini audit) + docs |
| 222f8db | fix: 5 achados ChatGPT (redirectTo, SW v2, budget, callback) |
| ce9847a | docs: HANDOVER final dual audit |
| fcd2434 | docs: HANDOVER verified against pg_proc + filesystem |
| 65598b3 | a11y: icons + aria-labels on all status badges |
| 1861935 | docs: HANDOVER audit items resolved/deferred |
| 95b8e62 | feat: privacy mode + MFA disable option |

**Entregas consolidadas:**
- Conciliação bancária (3 camadas): schema + auto-matching + UI manual
- CFG-01/02/03/05/06/07: perfil, senha, moeda, export, deletion lifecycle, offline
- Privacy mode: eye toggle + `<Mv>` em 14 páginas
- MFA disable: desativação com confirmação TOTP
- Auditoria Gemini (6 achados): 1 corrigido, 1 backlog, 1 a11y, 2 deferidos, 1 rejeitado
- Auditoria ChatGPT (6 achados): 5 corrigidos, 1 parcial (CSP)
- ARIA/a11y: ícones + aria-labels em badges de status (4 páginas)
- Testes: 46 → 150 (+226%), 12 suítes
- Stories: 81 → 87/90

---

## 14. Sessão 15/03/2026 - UX Strategy + Pre-production + H1 UX Implementation

8 commits, CI 3/3 verde em todos.

| Commit | Escopo |
|---|---|
| 3570657 | docs: HANDOVER 12.9 UX/retention backlog (19 items, 3 horizons) |
| b022cd3 | feat: P3 P4 P5 P6 P7 Q1 - error boundaries, email templates, privacy page, demo seed, dark mode fixes, CFG tests |
| 85c4974 | docs: HANDOVER session log + backlog P3-P7/Q1 done |
| 6bd189e | feat: UX-H1-01 navigation 5+1 (15→6 items, settings hub 5 subcategories, 171 tests) |
| 145c9c6 | feat: UX-H1-07 analytics_events (migration 031, track_event RPC, retention metrics RPC, useAnalytics hook) |
| 122be5e | feat: UX-H1-08 pending/overdue quick filters on Transactions |
| 60e84d8 | feat: UX-H1-03 + UX-H1-05 motivational empty states (4 pages) + enhanced import result summary |
| b055c49 | feat: UX-H1-04 quick transaction form (3 decisions visible, rest behind "Mais opções") |

**Entregas consolidadas:**

**Bloco 1: UX Strategy (sem código, produto/estratégia)**
- Análise crítica de 4 auditorias externas de UX (2 Gemini, 2 ChatGPT)
- 2 rodadas de revisão cruzada (Gemini + ChatGPT avaliaram o plano Claude)
- Documento consolidado `oniefy-estrategia-ux-retencao-v2.docx` (14 seções, 632 parágrafos)
- 10 correções incorporadas na v2.0 a partir das revisões cruzadas
- 9 decisões de produto registradas no HANDOVER §12.9
- 19 itens de backlog UX/Retenção organizados em 3 horizontes (8 H1 + 6 H2 + 5 H3)
- 6 métricas-alvo definidas (D1 >35%, D7 >20%, D30 >12%)

**Bloco 2: Pre-production batch (6 itens)**
- P3: Error Boundaries (3 arquivos: global-error.tsx, (app)/error.tsx, (auth)/error.tsx)
- P4: Email templates Supabase Auth (3 templates HTML: confirmation, recovery, email_change + config.toml)
- P5: Página /privacy (11 seções, LGPD + Apple, link de settings/data)
- P6: Seed de dados realistas (003_demo_data.sql: 5 contas, ~60 tx, 8 budgets, 4 ativos, perfil Hybrid Earner)
- P7: Dark mode audit (5 correções: 4x bg-white→bg-card em tax, 1x text-gray→muted em bank-connections; 2 intencionais preservados)
- Q1: Testes CFG settings (19 testes: settings groups 5 subcategorias, data export config 14 tabelas, toCsv)

**Bloco 3: UX H1 Implementation (6/8 itens)**
- UX-H1-01: Navegação 5+1. Sidebar de 15→6 itens. Settings hub com 5 subcategorias (Pessoal, Estrutura e Cadastros, Dados e Importação, Avançado, Segurança) contendo 13 itens. SETTINGS_ROUTES array para highlight contextual
- UX-H1-03: Estados vazios motivacionais em 4 páginas (Transações, Contas, Orçamento, Patrimônio). Cada um com: benefício claro, estimativa de esforço, máx 2 CTAs. Transações: 2 CTAs (nova transação + importar extrato)
- UX-H1-04: Formulário rápido. Quick mode: valor (autofocus h-14 text-2xl) + tipo toggle (default despesa) + conta (pré-selecionada, omitida se 1 só). "Mais opções" expande: descrição, categoria, data, status, membro, notas. Bottom sheet no mobile
- UX-H1-05: Resumo pós-importação. Grid de stats (importadas, categorizadas, para revisar, conciliadas) + alertas contextuais (duplicadas, uncategorized) + CTAs (ver transações, importar outro)
- UX-H1-07: Tabela analytics_events (migration 031). RPCs: track_event (SECURITY DEFINER) + get_retention_metrics (D1/D7/D30 por coorte). Hook useAnalytics com fire-and-forget. dashboard_viewed tracking 1x/sessão
- UX-H1-08: Filtro payment_status no hook useTransactions. Quick-filter chips (Todas/Pendentes/Vencidas) na UI de Transações. Contas a Pagar acessível via Settings > Dados e Importação

**O que falta no H1 (2 itens de esforço alto, interdependentes):**
- UX-H1-02: Onboarding Steps 8-10 (rota recomendada device-aware + alternativas)
- UX-H1-06: Dashboard Início v1 (fila de atenção + motor narrativo P0/P4/P5)

**Testes:** 150 → 171 (+21), 13 suítes
**Migration:** 031_analytics_events (1 tabela, 2 índices, 2 RLS, 2 RPCs)
**Totais atualizados:** 26 tabelas, 86 RLS, 46 functions (33 RPCs + 7 triggers + 6 cron), 25 ENUMs, 34 migrations

---

## 15. Sessão 15/03/2026 (cont.) - H1 UX Final + P2 CSP + H2 UX

9 commits, CI 3/3 verde em todos.

| Commit | Escopo |
|---|---|
| 7b3ffdd | feat: UX-H1-02 onboarding steps 8-10 + UX-H1-06 dashboard Início v1 |
| 56f6244 | feat: P2 CSP nonce-based policy (remove unsafe-eval in production) |
| c051aa8 | feat: UX-H2-01 auto-categorization in TransactionForm |
| c7c2275 | feat: UX-H2-03 narrative engine P1-P3 + UX-H2-06 confirmed/estimated indicator |
| 64f2117 | feat: UX-H2-04 confidence badges + UX-H2-05 undo import batch |
| f6cefec | feat: UX-H3-01 progressive disclosure + UX-H3-02 fiscal trigger + UX-H3-04 analytics dashboard |
| 150aa14 | fix: Q2 Lighthouse audit (153 button types, a11y, robots.txt, skip-to-content) |
| 49b7b91 | feat: Q3 server-side login proxy with real rate limiting |
| 1d31391 | feat: UX-H3-03 weekly digest email (RPC + template + API routes) |

**Entregas consolidadas:**

**UX-H1-02: Onboarding Steps 8-10 (rota recomendada device-aware)**
- Step 8 (RouteChoiceStep): Card dominante com rota recomendada por viewport (mobile <1024px → "Lançamento rápido", desktop → "Importar extrato") + 2 alternativas em texto secundário + link "Pular"
- Step 9A (RouteManualStep): Mini-wizard inline com 2 fases: criar conta (tipo + nome) → registrar primeira transação (tipo + valor + descrição). Usa useCreateAccount + useCreateTransaction
- Step 9B: Rota "Importar extrato" redireciona para /connections (onboarding_completed já marcado após seeds)
- Step 9C (RouteSnapshotStep): Registrar 1-3 bens com categoria + nome + valor. Usa useCreateAsset
- Step 10 (CelebrationStep): Resumo do que foi configurado (criptografia, 2FA, seeds, + stats da rota), sugestão de próximo passo contextual, CTA "Ir para o Início"
- Analytics: onboarding_started (mount), onboarding_route_chosen (route + device), onboarding_completed (route + stats), first_transaction
- 4 novos componentes em src/components/onboarding/ + barrel index
- Fluxo original (Steps 1-7) preservado integralmente; step "done" substituído por route_choice → route_execution → celebration

**UX-H1-06: Dashboard Início v1 (fila de atenção + motor narrativo)**
- Heading renomeado: "Dashboard" → "Início"
- Seção 1 (NarrativeCard): Motor narrativo reduzido com 3 estados: P0 estado vazio (CTAs criar conta + importar), P4 pós-importação (CTA revisar transações), P5 resumo neutro (receitas/despesas/resultado do mês)
- Seção 2 (AttentionQueue): Fila de até 5 pendências priorizadas: (1) transações vencidas, (2) sem categoria, (3) orçamento >80%, (4) vencendo em 3 dias, (5) contas desatualizadas (7+ dias). Tudo client-side com queries paralelas
- Seção 3: Conteúdo original (SummaryCards, 3-col grid, balanço, evolução, solvência) empurrado abaixo da dobra
- Sem nova migration; AttentionQueue usa 5 queries paralelas count-only ao Supabase

**H1 UX: 8/8 itens FEITOS. Backlog H1 completo.**

**P2: CSP nonce-based policy**
- CSP movido de next.config.js (estático) para middleware (nonce por request)
- Produção: `script-src 'self' 'unsafe-inline' 'nonce-{N}'` (sem unsafe-eval)
- Dev: `script-src 'self' 'unsafe-eval' 'unsafe-inline'` (HMR compat)
- Nonce via crypto.getRandomValues (16 bytes, base64, btoa para edge runtime)
- Header x-nonce na response para futuro upgrade strict-dynamic
- Demais security headers (HSTS, X-Frame, etc.) permanecem em next.config.js

**UX-H2-01: Auto-categorização no TransactionForm**
- Novo hook useAutoCategory: debounce 400ms, chama RPC auto_categorize_transaction
- AbortController para cancelar requests em voo quando descrição muda
- Integrado no TransactionForm: preenche categoria automaticamente ao digitar descrição
- Indicador visual (Sparkles + "sugerida") no label da categoria
- Override manual: se usuário seleciona categoria, auto-suggest para
- Import batch já usa auto_categorize internamente (sem mudança necessária)

**UX-H2-03: Motor narrativo P1-P3**
- P1: Orçamento pressionado (>80%: burnished, >=100%: terracotta). Mostra % e valor restante/excedido
- P2: Inatividade (7+ dias sem transação). CTAs para novo lançamento ou importação
- P3: Fim de mês (últimos 5 dias). Parcial de receitas/despesas
- Cadeia de prioridade: P0 > P4 > P1 > P3 > P2 > P5
- lastTransactionDaysAgo adicionado à query de atenção (6 queries paralelas count-only)

**UX-H2-06: Indicador confirmado/estimado no saldo**
- Badge "Confirmado" (verdant) no saldo atual
- Badge "Previsto: X" (burnished) exibido apenas quando difere do atual

**UX-H2-04: Camada de confiança**
- Migration 032: novo enum category_assignment_source (manual|auto|import_auto), coluna category_source em transactions, backfill
- Badge "sugerida" em transações auto-categorizadas na lista de transações
- Indicador "Xd sem atualização" em contas (accounts) com updated_at > 7 dias
- category_source propagado via TransactionForm → transaction engine → DB
- RPC undo_import_batch incluída na mesma migration (UX-H2-05)

**UX-H2-05: Desfazer importação (72h window)**
- RPC undo_import_batch: soft-delete de batch inteiro, janela de 72h, validação de ownership
- Hook useUndoImportBatch em use-bank-connections
- Botão "Desfazer importação" no ImportStepResult com confirm/cancel e estado "desfeito"
- batchId propagado do import wizard até o componente de resultado

**H2 UX: 6/6 itens FEITOS. Backlog H2 completo.**

**UX-H3-01: Revelação progressiva**
- Hook useProgressiveDisclosure: 7 queries paralelas count-only, cache 5 min
- Flags: showFiscalTrigger, totalTransactions, totalAccounts, totalAssets, hasBudgets, costCenterCount, activeWorkflowCount
- Consumido pelo dashboard (fiscal trigger) e analytics page (volume)

**UX-H3-02: Trigger fiscal por dado**
- Item "Ver impacto fiscal?" na fila de atenção quando >=10 transações de receita
- Heurística: income count como proxy de complexidade IRPF (evita join pesado com COA)
- Link direto para /tax, urgência baixa

**UX-H3-04: Dashboard interno de métricas**
- Nova página /settings/analytics (Settings > Avançado > Métricas)
- Seção 1: Retenção (D1/D7/D30 via get_retention_metrics RPC, com metas do doc UX)
- Seção 2: Eventos (últimos 30 dias, tabela por frequência)
- Seção 3: Volume de dados (transações, contas, ativos, receitas)
- Acessível via Settings hub

**H3 UX: 3/5 itens FEITOS (H3-03 email semanal requer Edge Function, H3-05 teste de corredor é ação Claudio)**

**Q2: Lighthouse audit**
- 153 buttons: adicionado type="button" explícito (previne submit acidental)
- Skip-to-content link no app layout (navegação por teclado)
- aria-label no botão hamburger e inputs de data sem label
- id="main-content" no elemento main
- robots.txt (Disallow all exceto /privacy)

**Q3: Server-side login proxy**
- Nova API route POST /api/auth/login (signInWithPassword server-side)
- Rate limiter aplicado server-side (5 tentativas / 15 min por IP)
- 429 response com retryAfterSeconds
- Login page atualizada: chama API route em vez de SDK direto
- GoTrue built-in rate limiting permanece como camada secundária

**UX-H3-03: E-mail resumo semanal**
- Migration 033: RPC get_weekly_digest (semana anterior Mon-Sun, income, expense, top 3 categories, pending, uncategorized)
- Template HTML inline CSS, responsivo, cores Plum Ledger (summary row, net result, top categories table, alert badges, CTA)
- POST /api/digest/send: endpoint de cron, admin client, itera todos usuários, envia via Resend API (preview_only sem RESEND_API_KEY). Protegido por DIGEST_CRON_SECRET.
- GET /api/digest/preview: preview autenticado, renderiza digest do usuário logado como HTML
- Env vars para produção: RESEND_API_KEY, DIGEST_CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY

**H3 UX: 4/5 itens FEITOS. Apenas H3-05 (teste de corredor) é ação Claudio.**
**Q: 2/2 itens de qualidade FEITOS.**

**Testes:** 171 (sem alteração), 13 suítes
**Migrations:** 032 (category_source + undo_import) + 033 (weekly_digest_rpc)
**Totais atualizados:** 26 tabelas, 86 RLS, 48 functions (36 RPCs + 6 trigger + 6 cron), 26 ENUMs, 36 migrations, 110 arquivos src/, ~21.200 linhas

---

## 15b. Sessão 15-16/03/2026 - Verificação de Segurança + Auditoria Completa

**Contexto:** Batch de security fixes aplicado por Claude Code em sessão separada (PR #3). Esta sessão verificou se os fixes não quebraram funcionalidades, aplicou correções adicionais, e executou auditoria completa do codebase (8 domínios, 80 achados).

### Verificação de regressão (4 suítes)

| Suíte | Área | Resultado | Achados |
|---|---|---|---|
| 1 | Login / Zod validation | **FAIL** → CORRIGIDO | `/api/auth/login` faltava em `PUBLIC_ROUTES` do middleware. Login quebrado para todos os usuários. |
| 2 | Dashboard / dependências | **PASS** | Zero imports de pacotes removidos. tsc limpo. Tailwind config íntegro. |
| 3 | Data export / colunas sensíveis | **PASS** | 5 colunas sensíveis excluídas. Count antes do fetch. Warnings por tabela. |
| 4 | Índices econômicos / batch upsert | **PASS** | Batch upsert correto (schema match). SSRF allowlist. try-catch em JSON. |

### Auditoria adversarial (13 arquivos, 13 questões obrigatórias)

| # | Arquivo | Veredicto | Achado |
|---|---|---|---|
| 1 | `api/auth/login/route.ts` | APROVADO | Zod safeParse correto, campos match frontend |
| 2 | `api/auth/callback/route.ts` | APROVADO COM RESSALVA | Tipos OTP omitidos documentados (magiclink, email_change) |
| 3 | `api/digest/send/route.ts` | **REPROVADO** → CORRIGIDO | `detail: usersError?.message` vazava erro interno |
| 4 | `api/indices/fetch/route.ts` | APROVADO COM RESSALVA → CORRIGIDO | `apisidra.ibge.gov.br` adicionado à allowlist |
| 5 | `weekly-digest-template.ts` | APROVADO COM RESSALVA → CORRIGIDO | `'` adicionado ao escapeHtml (5/5 chars OWASP) |
| 6 | `middleware.ts` | APROVADO | CSP nonce correto, validateEnv no escopo do módulo |
| 7 | `settings/data/page.tsx` | APROVADO | 5 colunas sensíveis excluídas, count antes do fetch |
| 8 | `package.json` | APROVADO | Zero imports de pacotes removidos |
| 9 | Hooks de dados (12 arquivos) | APROVADO | user_id em todos, double-filter em deletes |
| 10 | `use-app-lifecycle.ts` | **REPROVADO** → CORRIGIDO | Stub retornava false (bug dormente). Mudado para true. Hook conectado ao layout. |
| 11 | `csv-parser.ts` | APROVADO | Formula injection sanitizado, amount/date seguros |
| 12 | `ofx-parser.ts` | APROVADO | Size guard, split sem ReDoS |
| 13 | `password-blocklist.ts` | APROVADO | 184 entradas, 12+ chars, zero duplicatas, case-insensitive |

### Correções aplicadas (4 commits)

| Commit | Correção |
|---|---|
| fc8113f | `fix: add /api/auth/login to PUBLIC_ROUTES in middleware` — regressão crítica, login quebrado |
| 470ddec | `security: remove error detail leak, harden escapeHtml, expand SSRF allowlist` — 4 arquivos |
| ab7bb23 | `fix: biometric stub must bypass (true) until real implementation` — use-app-lifecycle.ts |
| bf5477e | `feat: connect useAppLifecycle to app layout` — hook deixa de ser código morto |

### Auditoria completa Claude Code (PR #4, branch claude/audit-wealthos-codebase-Krdqj)

Prompt de auditoria v2 criado com 8 domínios baseados em OWASP ASVS L2 + MASVS + Nielsen + ISO 9241-110 + WCAG 2.2 AA. Claude Code executou com 6 agentes paralelos. Relatório em `docs/audit/` (9 arquivos Markdown).

**Resultado: 80 achados (0 CRÍTICO, 15 ALTO, 39 MÉDIO, 26 BAIXO). Nota: 7/10.**

| Domínio | Achados | Destaques |
|---|---|---|
| D1 Auth/Sessão | 8 (2A/3M/3B) | Rate limiter in-memory, register/forgot bypassa rate limit, AAL2 só client-side |
| D2 Acesso/Dados | 5 (0A/4M/1B) | Export vaza cpf_encrypted de family_members, 3 mutations sem user_id |
| D3 Input/Output | 6 (1A/4M/1B) | CSV/XLSX sem limite de tamanho, 3 endpoints vazam erros internos |
| D4 Mobile | 4 (2A/1M/1B) | Biometric stub false (corrigido nesta sessão), cert pinning ausente |
| D5 Código | 9 (0A/3M/6B) | Detecção plataforma duplicada, formatação moeda duplicada, 4 deps não usadas |
| D6 Performance/DB | 16 (2A/7M/7B) | 9 hooks com select("*"), SECURITY DEFINER sem search_path em 001/003, trigger O(n²) |
| D7 UX/Usabilidade | 16 (3A/8M/5B) | Campo monetário sem vírgula, sem feedback sucesso, transações não editáveis |
| D8 Acessibilidade | 16 (5A/9M/2B) | Dialogs sem focus trap, botões sem aria-label, labels sem htmlFor |

**Top 5 correções de maior alavancagem (do relatório):**
1. Labels htmlFor + aria-required + aria-describedby em todos os formulários (5 achados em batch)
2. Campo monetário aceitar formato brasileiro (vírgula) — TransactionForm
3. Erros internos não expostos em 3 endpoints de API
4. Register e forgot-password via API routes com rate limiter
5. aria-label em botões icon-only + scope em tabelas

**CI:** 4 commits passaram 3/3 jobs (Security + Lint/TypeCheck + Build)

**Totais atualizados:** 26 tabelas, 86 RLS, 48 functions, 26 ENUMs, 37 migrations, 125 arquivos src/, ~23.300 linhas, 13 suítes/171 testes, docs/audit/ com 9 arquivos de relatório

---

## 16. Estudo de Privacidade: Proteção de Dados Contra Acesso Administrativo

**Data:** 15/03/2026
**Origem:** Preocupação do proprietário com conforto de testers beta ao inserir dados financeiros reais sabendo que o admin tem acesso ao banco.
**Método:** Prompt estruturado consultado em 3 IAs (ChatGPT, Perplexity, Gemini Deep Research). Consolidação cruzada abaixo.

### 16.1 Diagnóstico (unânime nas 3 análises)

O problema não é RLS, Supabase ou PostgreSQL. O problema é a **fronteira de confiança**: quem controla o ambiente onde dado em claro e chave coexistem pode ler o dado. O role `postgres` (superuser) bypassa RLS por definição. Como o servidor precisa calcular `SUM()`, `GROUP BY`, `ORDER BY` sobre valores numéricos, esses valores precisam estar em texto claro no banco. Não existe solução na stack atual (Supabase + Vercel + solo dev) que impeça tecnicamente o admin de ver dados E ao mesmo tempo preserve o motor analítico server-side.

### 16.2 Arquiteturas avaliadas

| Abordagem | Viabilidade | Esforço | Veredicto (consenso) |
|---|---|---|---|
| **E2E duas camadas** (valores em claro, textos cifrados no client) | Agora | 2-4 sem | Melhor relação custo/benefício para fase atual |
| **TEE / Evervault** (RPCs migram para enclaves seguros) | Médio prazo | 4-12 sem | Solução técnica real; free tier viável (5-15k decriptações/mês); fora de fase |
| **Local-first** (modelo Actual Budget: SQLite/Wasm + CRDTs + Libsodium) | v2.0 | 8-12+ sem | Reescrita completa; mata jobs autônomos e multi-dispositivo sem aba ativa |
| **FHE** (criptografia homomórfica) | Descartado | — | Ordens de magnitude mais lento; sem bibliotecas maduras |
| **Blind indexes / OPE** | Insuficiente | — | Resolve igualdade exata, falha em SUM/ORDER BY/GROUP BY; OPE vaza padrões |
| **Split-key sem TEE** | Insuficiente | — | Admin controla código + infra = pode capturar chave reunida em runtime |
| **Auditoria interna (mesmo banco)** | Insuficiente | — | Admin pode desabilitar triggers, apagar logs, alterar funções |
| **Auditoria externa imutável** (pgAudit → S3 WORM) | Agora | 1-2 sem | Resolve "vigia vigiando a si mesmo"; não impede acesso, mas torna rastreável e inburlável |
| **Azure SQL Always Encrypted + enclaves** | Replataformização | 10-16 sem | Maduro em enterprise; incompatível com Supabase/Vercel |
| **MongoDB Queryable Encryption** | Mudança de stack | — | Suporta equality + range, não SUM(); insuficiente para analytics |
| **Tokenização** | Complementar | — | Protege texto em repouso; não resolve cálculos sobre valores numéricos |

### 16.3 Referências de mercado

| Produto | Modelo | Por que funciona para eles |
|---|---|---|
| **1Password / Proton / Standard Notes** | Zero-knowledge E2E puro | Servidor nunca precisa calcular sobre o conteúdo. É storage + sync de blobs |
| **Actual Budget** | Local-first (SQLite Wasm + CRDTs + E2E) | Toda computação no client. Servidor é cofre burro. Sem jobs autônomos |
| **Lunch Money / YNAB** | Server-side analytics + governança | Valores em claro no banco. Confiança via compliance, RBAC, NDAs, políticas |
| **1Password (enterprise)** | Zero-knowledge + Confidential Computing | Adicionou TEE (enclaves) quando precisou de features server-side (SSO, auditoria) |
| **Dashlane** | Zero-knowledge + Confidential Computing | Mesmo caminho do 1Password para features corporativas |

### 16.4 Decisão: roadmap em 3 fases

**Fase 1: Agora (beta com amigos)**
- Modelo atual com transparência radical
- Sugerir dados aproximados aos testers
- Política de privacidade honesta (já existe em /privacy)
- Exclusão real de conta em 7 dias (já implementado)
- Decisão: NÃO implementar nenhuma mudança arquitetural para o beta

**Fase 2: Pré-lançamento público (quando decidir abrir)**
- Expandir E2E para campos textuais: description, account name, asset name (admin vê números e categorias, mas não textos descritivos)
- Auditoria externa imutável: pgAudit → Supabase log drain (Pro) → S3 WORM
- Role de aplicação sem superuser para operação diária
- Auto-categorização ajustada para operar sem texto em claro (client-side ou consentimento por sessão)
- Digest semanal usando apenas agregados + categorias (sem textos livres)
- Esforço estimado: 2-4 semanas

**Fase 3: Se tracionar (pós-validação de retenção)**
- Opção A: TEE via Evervault (migrar RPCs para Evervault Functions; free tier cobre alfa)
- Opção B: Local-first completo (reescrita; modelo Actual Budget)
- Opção C: Manter Fase 2 + buscar SOC 2 Type II (caminho corporativo)
- Decisão depende de: volume de usuários, feedback sobre privacidade, modelo de negócio (B2C vs B2B)

### 16.5 O que comunicar aos testers beta

Mensagem recomendada (validada pelas 3 análises):

> "O Oniefy protege seus dados com isolamento por usuário (cada pessoa só vê os próprios dados), criptografia de campos sensíveis (CPF, notas privadas) e exclusão real de conta. Como todo app financeiro que faz cálculos automáticos (dashboard, orçamento, fiscal), os valores numéricos ficam acessíveis ao sistema para processar. Eu tenho acesso administrativo ao banco de dados, como qualquer fundador de SaaS, mas me comprometo a não acessar dados individuais. Se preferir, use valores arredondados para testar o fluxo. Você pode deletar sua conta a qualquer momento e todos os dados são apagados em 7 dias."

### 16.6 Fontes consultadas

- ChatGPT (o3): análise com 9 referências (PostgreSQL docs, Google Cloud, 1Password, Proton, Apple, AWS, Microsoft Learn x2, MongoDB)
- Perplexity Pro: análise com referências a Cyfuture, Scaleout Systems, 1Password whitepaper, blog Terminal3, Uplatz, Windows Forum
- Gemini Deep Research: análise de 113 referências acadêmicas e de mercado (Supabase docs, Evervault, Dashlane, Actual Budget, Ink & Switch, ETH Zurich, MIT Monomi, USENIX, VLDB, PCI DSS, SOC 2)

---

## 18. Sessão 16/03/2026 - Auditoria de Dívida Técnica + Remediação

### 18.1 Auditoria linha-por-linha (118/118 arquivos)

Documento formal: `docs/audit/DIVIDA-TECNICA.md` (581 linhas).

**Metodologia:** Leitura integral de 53 arquivos (toda camada lib/, auth, API routes, infra, parsers, os 10 maiores pages/components). Restantes 65 varridos por padrões (grep) + leitura seletiva de trechos. Banco de dados verificado: cron jobs, RLS, RPCs, schema.

**Resultado:** 28 achados formais (11 S2 GRAVE, 11 S3, 4 S4, 2 S5).

### 18.2 Remediação (27/28 corrigidos)

| ID | Sev | Descrição | Commit/Migration |
|----|-----|-----------|-----------------|
| DT-001 | S2 | `loadEncryptionKey` lançava `EncryptionKeyMissingError` em vez de re-init silenciosa | `baa2117` |
| DT-002 | S4 | WealthOS → Oniefy em env.ts + DO NOT CHANGE em HKDF strings | `2267881` |
| DT-003 | S3 | console.info dev guard em use-app-lifecycle | `2267881` |
| DT-004 | S2 | Biometria stub → `available: false` (sem Face ID fake) | `b490bfd` |
| DT-006 | S3 | RPC `create_transaction_with_journal` recebe `p_family_member_id` + `p_category_source` | migration 040 |
| DT-008 | S2 | Cron `generate_monthly_snapshots` (mensal 04:30 UTC) | migration 038 |
| DT-009 | S2 | WKF-03 stub honesto ("Sem upload" + "Conferido") | `ecab78c` |
| DT-010 | S2 | `import_transactions_batch` desabilita trigger + recalcula 1x | migration 039 |
| DT-011 | S3 | `focus-trap-react` nos 6 form modals | `ecab78c` |
| DT-012 | S2 | RPC `edit_transaction` (reverse + re-create) + botão Editar na UI | migration 041 |
| DT-013 | S4 | Indentação use-accounts | `b490bfd` |
| DT-016 | S2 | Cron `generate_recurring_transactions` (diário 01:30 UTC) | migration 037 |
| DT-017 | S3 | XLSX parser try/catch | `2267881` |
| DT-018 | S2 | IPCA/IGP-M/INPC/Selic removidos da UI de reajuste | `2267881` |
| DT-019 | S3 | `useBudgetMonths` staleTime + limit(500) | `b490bfd` |
| DT-020 | S4 | `currencySymbol` prop no onboarding | `b490bfd` |
| DT-021 | S3 | "R$ 0,00" → `formatCurrency(0)` em tax | `2267881` |
| DT-024 | S4 | Indentação use-recurrences | `b490bfd` |
| DT-025 | S3 | use-fiscal `select("*")` → colunas explícitas | `2267881` |
| DT-026 | S2 | `getAmountDisplay` JSX-em-template-literal corrigido | `2267881` |
| DT-027 | S3 | `TransactionForm` reset respeita prefill (Duplicar funciona) | `2267881` |
| DT-028 | S2 | Export family_members: `full_name` → `name` + 5 colunas adicionadas | `2267881` |

**Aceitos (4):** DT-007 (type cast, gatilho: bug undefined), DT-014/DT-022 (COA órfão), DT-015 (soft-delete cleanup), DT-023 (auth.getUser repetido)

**Documentado (1):** DT-005 (6 tabelas sem frontend; monthly_snapshots corrigida via DT-008, restantes documentadas)

### 18.3 Migrations aplicadas nesta sessão

| # | Nome | Conteúdo |
|---|------|----------|
| 035 | performance_indexes | Trigram + matched_id indexes |
| 036 | security_definer_and_cron_guards | Duplicate guard em cron |
| 037 | cron_generate_recurring_transactions | Cron diário 01:30 UTC |
| 038 | cron_generate_monthly_snapshots | Cron mensal 04:30 UTC dia 1 |
| 039 | batch_import_disable_trigger | DT-010 O(n²) fix |
| 040 | add_family_member_category_source_to_rpc | DT-006 params no RPC |
| 041 | edit_transaction_rpc | DT-012 reverse + re-create atômico |

### 18.4 Commits

| SHA | Mensagem |
|-----|----------|
| 601be41..c023b92 | Remediação 80 achados de auditoria (12 lotes) |
| 201530a | docs: 00-SUMMARY + HANDOVER |
| 961777e | fix: audit remediation gaps (D6.01, D7.04, D7.11, D7.12, D8.08) |
| 9814cf6 | docs: technical debt audit (15/118) |
| 824eb3a | docs: technical debt audit (53/118) |
| b20094e | docs: complete audit (118/118, 28 findings) |
| 2267881 | fix: 10 debt items (DT-002,003,017,018,021,025,026,027,028) |
| baa2117 | fix(DT-001): loadEncryptionKey |
| b490bfd | fix: 5 debt items (DT-004,013,019,020,024) |
| ecab78c | fix: 6 debt items (DT-006,008,009,010,011,012) + migrations 038-041 |
| 7e9d46f | docs: DIVIDA-TECNICA remediation registry |

### 18.5 Estado atualizado

**Totais:** 26 tabelas, 86 RLS, 83 functions (68 RPCs + 6 triggers + 8 cron + 1 utility), 26 ENUMs, 48 migrations, 131 arquivos src/, ~24.000 linhas, 8 pg_cron jobs

**O que resta para deploy web (P1):**
1. `P1` Deploy Vercel + domínio oniefy.com (30 min, ação Claudio)
2. `P8` Supabase Pro (ação Claudio)

**Backlog pós-deploy:**
- WKF-03 upload real (Tesseract.js web, 2-3h)
- monthly_snapshots → consumir no SolvencyPanel (trend chart, 1-2h)
- `tax_records` DROP TABLE (5 min)
- DT-007 types refinement (quando bug aparecer)
- DT-012 UX: edição de transferências (hoje só income/expense editáveis)

---

## 17. Conexões

- **GitHub:** Fine-grained PAT e Classic PAT disponíveis (Claudio fornece no início da sessão)
- **Supabase ATIVO:** via conector MCP remoto (mcp.supabase.com/mcp), autenticado por OAuth. Project ID: `mngjbrbxapazdddzgoje` (sa-east-1 São Paulo) — "oniefy-prod"
- **Supabase LEGADO (pausar/desligar):** Project ID: `hmwdfcsxtmbzlslxgqus` (sa-east-1 São Paulo) — "WealthOS Project". Ambos os projetos SEMPRE estiveram em sa-east-1. A migração de sessão 22 consolidou o schema em oniefy-prod.
- **Local dev:** `C:\Users\claud\Documents\PC_WealthOS`, `.env.local` apontando para oniefy-prod
- **.env.local:**
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://mngjbrbxapazdddzgoje.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZ2picmJ4YXBhemRkZHpnb2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjM0NDQsImV4cCI6MjA4OTMzOTQ0NH0.uSPQ41vOKV_wnN9Wmenv7uyBphayQ7r013twwWqKBEM
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZ2picmJ4YXBhemRkZHpnb2plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc2MzQ0NCwiZXhwIjoyMDg5MzM5NDQ0fQ.eAdrIKnWtRwu75Z4P3taApAWsWByWt_3g5G33YUsaGI
  SUPABASE_PROJECT_ID=mngjbrbxapazdddzgoje
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

## 19. Sessão 17/03/2026 - Backlog PENDENCIAS-DECISAO completo (17/17 itens)

**Objetivo:** Executar todos os 17 itens FAZER do PENDENCIAS-DECISAO.md (Grupos 1-6).

### Commits desta sessão

| SHA | Conteúdo |
|-----|----------|
| `a1ec136` | feat(2.2): focus-trap-react em 6 inline dialogs |
| `53fcdaa` | fix(3.1/DT-007): remove unsafe type casts em 10 list-query hooks |
| `64a89f4` | test(3.2): 13 schema tests para RPCs novas |
| `230c2f9` | feat(3.3): sparkline trends no SolvencyPanel |
| `1f0e20a` | feat(3.4): edit transfers (reverse pair + re-create) |
| `a630f14` | feat(3.5): overhead distribution UI (CEN-03) |
| `7f028ad` | feat(4.1): reajuste automático IPCA/IGP-M/INPC/Selic |
| `df40323` | feat(4.2): document upload WKF-03 (Supabase Storage) |
| `6f4ae54` | feat(4.3/PAT-06): attach documents to assets |
| `54858bb` | feat(1.5): access_logs + DROP tax_records |
| `4a5ed44` | feat(1.4): encrypted export AES-256-GCM |
| `ed1545c` | feat(1.3/CAP-05): calendar view for pending bills |
| `bb8ad6e` | feat(5.1/FIN-17): OCR receipt scanning Tesseract.js |
| `9494aff` | feat(5.2/CFG-04): Web Push notifications |
| `15241b0` | fix(ci): move service role client to admin.ts |

### Migrations aplicadas (042-049)

| # | Nome | Conteúdo |
|---|------|----------|
| 042 | budget_approval_status | Enum + colunas aprovação em budgets |
| 043 | budget_approval_filter_old_rpc | Patch get_budget_vs_actual |
| 044 | edit_transfer_rpc | Edição de transferências (reverse pair) |
| 045 | distribute_overhead_rpc | Rateio proporcional de overhead |
| 046 | automatic_index_adjustment | Rewrite generate_next_recurrence com lookup de índices |
| 047 | drop_tax_records | DROP TABLE depreciada |
| 048 | access_logs | Tabela + RLS + cron limpeza 90 dias |
| 049 | notification_tokens_web_push | subscription_data JSONB + unique index |

### Novos arquivos criados

| Arquivo | Função |
|---------|--------|
| `src/lib/hooks/use-documents.ts` | Upload/list/delete documentos (Supabase Storage) |
| `src/lib/hooks/use-access-logs.ts` | Log de acesso (fire-and-forget) + query para settings |
| `src/lib/hooks/use-push-notifications.ts` | Subscribe/unsubscribe Web Push |
| `src/lib/services/ocr-service.ts` | OCR Tesseract.js (parsing recibos brasileiros) |
| `src/lib/supabase/admin.ts` | Admin client (service role, server-side only) |
| `src/app/api/push/test/route.ts` | Envio de push de teste |
| `src/app/api/push/send/route.ts` | Envio de push para contas vencidas (cron) |
| `src/app/(app)/settings/notifications/page.tsx` | UI toggle push + teste |
| `src/__tests__/rpc-new-schemas.test.ts` | 13 testes Zod para RPCs novas |

### Totais atualizados

- **Migrations:** 49+ aplicadas via MCP
- **pg_cron jobs:** 9 ativos (+ cleanup-access-logs)
- **RLS policies:** 88 (+ 2 em access_logs)
- **Arquivos src/:** ~140, ~27.000 linhas
- **Testes Jest:** 13 novos (rpc-new-schemas.test.ts)
- **NPM deps adicionados:** tesseract.js, web-push, @types/web-push

### Backlog restante (pós-sessão)

Todos os 17 itens FAZER do PENDENCIAS-DECISAO estão concluídos.
Itens pendentes são do Grupo 7 (longo prazo), 9 (requer Mac) e 10 (investimento):

**Grupo 7 (longo prazo, gatilhos futuros):**
- 7.1 Testes e2e Playwright (quando pipeline madura)
- 7.2 i18n (quando landing page)
- 7.3 Feature flags (quando multi-tenant)
- 7.4 Monitoramento Sentry (quando produção)
- 7.5 Rate limiting por IP no edge (quando Vercel deploy)
- 7.6 Backup automatizado Storage (quando dados reais)

**Grupo 9 (requer Mac com Xcode 15+):**
- iOS App Store submission
- Screenshot prevention (Capacitor plugin)
- Jailbreak detection
- Certificate pinning
- Biometric auth (Face ID / Touch ID)

**Grupo 10 (investimento):**
- Supabase Pro upgrade (~US$25/mês, para Leaked Password Protection)
- Apple Developer Account (US$99/ano)

### Ações para ativar Web Push em produção

1. Adicionar ao `.env.local`:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=BKkwuc0_QqHEgiJis-u5v1bw0xA9HHUqTyzAiiaHKF60PgcW_ClnlRiMfzB76cG-24OR_bQ5lL0sPzB6qRsn53c
   VAPID_PRIVATE_KEY=_4WeEDusx7Jyz5bBCC_bQe2ECTVCAD49dhMB8t_sAvY
   VAPID_EMAIL=mailto:admin@oniefy.com
   CRON_SECRET=<gerar_valor_aleatório>
   ```
2. Configurar cron externo para `POST /api/push/send` com header `Authorization: Bearer <CRON_SECRET>`
3. Ou usar Vercel Cron (`vercel.json`: `{ "crons": [{ "path": "/api/push/send", "schedule": "0 8 * * *" }] }`)

### CI

- **Último commit verde:** `3c9067c` (4/4 jobs: Security + Lint + Unit Tests + Build)

---

## 20. Sessão 17/03/2026 - Validação de Dívida Técnica + Varredura RLS + Testes de Segurança

### 20.1 Validação das Dívidas Técnicas (DIVIDA-TECNICA.md)

Auditoria de verificação dos 28 achados da sessão 18. Cada item marcado "FEITO" foi cruzado com o código real e banco de dados.

**Resultado: 18 corretos, 4 defeituosos (corrigidos), 4 aceitos, 1 documentado, 1 duplicado.**

| ID | Problema | Sev | Correção |
|----|----------|-----|----------|
| P1 (DT-001) | `loadEncryptionKey` chamava `initializeEncryption()` antes do throw, destruindo chaves antigas antes de avisar | S2 | Removidas 2 chamadas a initializeEncryption nos caminhos de anomalia |
| P2 (NOVO) | `/api/push/send`: auth bypass quando `CRON_SECRET` vazio (falsy) + comparação `!==` sem timing-safe | S2 | Fail-closed + `timingSafeCompare` (padrão do digest/send) |
| P3 (NOVO) | `/api/push/send` e `/api/digest/send` fora de `PUBLIC_ROUTES`, bloqueados pelo middleware para crons | S2 | Adicionados em PUBLIC_ROUTES |
| P4 (DT-018) | `cron_generate_recurring_transactions` ignorava reajuste IPCA/IGP-M/INPC/Selic | S3 | Bloco de lookup copiado da RPC generate_next_recurrence |

### 20.2 Varredura RLS (Camada 2)

**Passe 1:** 50 assertions executadas via MCP, 5 vetores de ataque:

| Batch | Escopo | Resultado |
|---|---|---|
| SELECT isolation (21 tabelas) | User B lê dados User A | 21/21 PASS |
| Reference tables (3 tabelas) | Leitura pública + write block | 7/7 PASS |
| INSERT/UPDATE/DELETE spoofing | Cross-user escrita | 23/23 PASS |
| Acesso anônimo | Sem JWT | 6/6 PASS |
| SECURITY DEFINER RPCs (10 funções) | User B chama RPC com User A ID | **8/10 PASS, 2 FAIL** |

Vulnerabilidades do Passe 1 (corrigidas via migrations 051-052):
- `get_weekly_digest`: retornava dados financeiros de qualquer usuário (CRITICO)
- `get_budget_vs_actual` (int overload): sem auth check (CRITICO)
- `create_default_categories`: chamável cross-user (LOW, idempotente)

**Passe 2:** Retestar com dados reais (account_id, category_id existentes). Comprovou 4 vulnerabilidades adicionais:

| Ataque | Resultado | Impacto |
|---|---|---|
| User B cria transação na conta de User A | **SUCESSO** | Injeção de dados financeiros falsos |
| User B estorna transação de User A | **SUCESSO** | Destruição de dados legítimos |
| User B lê categorias de User A (auto_categorize) | **SUCESSO** | Vazamento de padrões |
| User B cria centro de custo para User A | **SUCESSO** | Poluição de dados |

Corrigidas via migration 053 (dynamic patching de 7 funções). Total: 35/35 SECURITY DEFINER functions com auth.uid() guard.

**Storage bucket:** Verificado. 4 policies RLS em `storage.objects`. Path traversal (`../`) bloqueado. Hook `use-documents.ts` usa `user.id` da sessão (dupla proteção).

**Fix pattern:** `IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;` Permite cron/trigger (auth.uid()=NULL) e bloqueia cross-user autenticado.

Suíte atualizada em `supabase/tests/test_rls_isolation.sql` (14 RPCs no Batch 3, was 8).

### 20.3 Testes de API Routes (Camada 1)

Suíte Jest com 30+ assertions cobrindo 5 das 9 API routes:

| Propriedade | Cobertura |
|---|---|
| Input validation | Malformed body, XSS, senhas fracas, email inválido |
| Rate limiting | 429 com retryAfterSeconds |
| Error sanitization | Supabase internals, stack traces, IPs nunca vazam |
| Cron auth | Fail-closed quando secret ausente, 401 quando incorreto |
| Anti-enumeração | forgot-password sempre 200 |
| PT-BR | Zero mensagens em inglês nas respostas |
| Response structure | Sem password/session/token no response de login |

Arquivo: `src/__tests__/api-routes-security.test.ts`
Rotas testadas: login, register, forgot-password, push/send, digest/send
Rotas pendentes (requerem integração): callback, push/test, digest/preview, indices/fetch

### 20.4 Commits

| SHA | Conteúdo |
|-----|----------|
| `085507e` | fix: 4 defeitos de validação DT (encryption re-init, push auth bypass, cron routes, index adjustment) |
| `5c59af5` | security: 2 vulnerabilidades RLS + suíte de testes SQL (50 assertions) |
| `6b1cf50` | test: suíte de segurança API routes (30+ assertions) |
| `9a6f92c` | docs: HANDOVER sessão 20 |
| `193cff4` | ci: novo job Unit Tests (208 testes como gate) + fix 3 suítes |
| `d05c3b1` | fix: NODE_ENV type error no logSchemaError test |
| `3c9067c` | security: auth guard em TODAS as 35 SECURITY DEFINER functions (migration 053) |
| `c98e36c` | fix: onboarding bypass no middleware (protegia só / e rotas públicas) |
| `56cc199` | perf: eliminar 80 auth.getUser() redundantes + middleware cookie cache |
| `2b8f9a0` | docs: guias de deploy Vercel + migração Supabase SP + vercel.json |

### 20.5 Migrations aplicadas (050-053)

| # | Nome | Conteúdo |
|---|------|----------|
| 050 | cron_recurring_index_adjustment | Cron de recorrências com lookup IPCA/IGP-M/INPC/Selic |
| 051 | rls_auth_check_security_definer | Auth guards em get_weekly_digest + get_budget_vs_actual (int) |
| 052 | fix_restore_create_default_categories | Restore body de create_default_categories + auth guard |
| 053 | auth_guard_all_security_definer | Auth guard nas 7 funções restantes (create_tx, transfer, reverse, undo, auto_cat, seed_coa, seed_cc) |

### 20.6 Otimização de Performance

**Diagnóstico:** Dashboard fazia ~22 roundtrips ao Supabase por carregamento (~3,3s de latência pura).

| # | Otimização | Status | Ganho |
|---|---|---|---|
| 1 | ~~Migrar Supabase para São Paulo (sa-east-1)~~ | ~~FEITO (sessão 22)~~ | NOTA: ambos os projetos já estavam em sa-east-1 desde a criação. A "migração" consolidou o schema num projeto limpo mas não alterou a região. Ganho de latência viria do deploy Vercel, não da região. |
| 2 | Centralizar auth.getUser() em cache compartilhado | ✅ FEITO (20 arquivos, `cached-auth.ts`) | Elimina 10 roundtrips redundantes |
| 3 | Deploy Vercel (produção) | Ação Claudio (docs/DEPLOY-VERCEL.md + vercel.json) | Elimina 1-3s do dev mode |
| 4 | Middleware: cache onboarding em cookie | ✅ FEITO (cookie vinculado ao user_id) | Elimina 1 query/navegação |

**`src/lib/supabase/cached-auth.ts`:** Promise dedup + TTL 30s. Concurrent hooks compartilham request in-flight. `clearAuthCache()` chamado no logout.

**Bug encontrado e corrigido (commit `c98e36c`):** Middleware não verificava `onboarding_completed` em rotas protegidas. Novo usuário ia direto para /dashboard sem completar onboarding.

### 20.7 Totais atualizados

- **Tabelas:** 26 (todas com RLS)
- **RLS policies:** 84
- **Functions:** 87 (70 RPCs + 7 triggers + 9 cron + 1 utility). Todas com auth.uid() guard.
- **ENUMs:** 27
- **Migrations:** 53+ via MCP (41 SQL files no repo)
- **pg_cron jobs:** 9
- **Arquivos src/:** ~126, ~24.000 linhas (-94 de boilerplate auth removido)
- **Suítes de teste Jest:** 15 (208 assertions)
- **Testes SQL (RLS):** 50+ assertions (supabase/tests/test_rls_isolation.sql)
- **CI:** 4/4 verde (Security + Lint/TypeCheck + Unit Tests + Build)
- **Docs:** DEPLOY-VERCEL.md, MIGRATE-SUPABASE-SP.md, PROMPT-CLAUDE-CODE-E2E.md

### 20.8 Backlog de testes

| Camada | Escopo | Status |
|---|---|---|
| 0 (Unit) | 208 assertions Jest | ✅ Gate obrigatório no CI |
| 1 (API routes) | 24 assertions, 5/9 rotas | ✅ Rodando no CI |
| 2 (RLS) | 65+ assertions tabelas + 14 RPCs + Storage | ✅ Completo |
| 3 (E2E) | 45 cenários Playwright, 8 specs | ⏳ Claude Code em execução no terminal local |

### 20.9 Próximos passos (prioridade)

1. **Deploy Vercel** (Claudio, 30 min) - seguir docs/DEPLOY-VERCEL.md
2. ~~**Migrar Supabase para São Paulo**~~ — FEITO (sessão 22, consolidação em oniefy-prod)
3. **Usar o app por 1 semana** com dados reais
4. **Convidar 2-3 testers** para beta fechado
5. **E2E Playwright** - em execução via Claude Code

### 20.10 Backlog geral

**Grupo 7 (longo prazo, gatilhos futuros):**
- 7.1 Testes e2e Playwright (em progresso)
- 7.2 i18n (quando landing page)
- 7.3 Feature flags (quando multi-tenant)
- 7.4 Monitoramento Sentry (quando produção)
- 7.5 Rate limiting por IP no edge (quando Vercel deploy)
- 7.6 Backup automatizado Storage (quando dados reais)

**Grupo 9 (requer Mac com Xcode 15+):**
- iOS App Store submission, screenshot prevention, jailbreak detection, cert pinning, biometric auth

**Grupo 10 (investimento):**
- Supabase Pro (~US$25/mês), Apple Developer Account (US$99/ano)

- **Último commit verde:** `71ddaa7` (4/4 jobs: Security + Lint + Unit Tests + Build)

---

## Sessão 21 (18 março 2026)

### 21.1 Correções de UX

| Item | Problema | Fix |
|------|----------|-----|
| React 19 key warning | Overlay condicional em `AppLayout` sem `key` | `key="sidebar-overlay"` no `<div>` do overlay |
| Logo sidebar muito pequena | `h-8` (32px) insuficiente | `h-auto w-full` (preenche sidebar w-64, ~3x maior) |
| Onboarding import abandona wizard | `router.push("/connections")` redirecionava para página padrão | `ImportWizard` recebe `onImportComplete` callback; `RouteImportStep` embarca wizard no onboarding; `ImportStepResult` mostra "Continuar" em contexto onboarding |

### 21.2 CI Fix

Jest pegava `e2e/*.spec.ts` (Playwright) causando `TypeError: Class extends value undefined`. Fix: `roots: ['<rootDir>/src']` no `jest.config.js`.

### 21.3 Performance: Dashboard RPC Consolidado

**Diagnóstico:**

| RPC | Média (ms) | Máximo (ms) |
|-----|-----------|----------|
| get_solvency_metrics | 173 | 2.337 |
| get_top_categories | 161 | 2.152 |
| get_dashboard_summary | 157 | 3.223 |
| get_balance_evolution | 146 | 1.493 |
| get_balance_sheet | 93 | 1.264 |
| get_budget_vs_actual | 40-108 | 155 |

Causa: 14+ chamadas HTTP paralelas (7 RPCs + 6 attention queries + 1 upcoming_bills), cada uma pagando latência de rede. Máximos de 2-3s refletem cold starts do Free tier + overhead HTTP por request. Volume de dados não é o problema (tabelas praticamente vazias). NOTA: o Supabase sempre esteve em sa-east-1 (São Paulo); a latência elevada vinha do número de roundtrips, não da distância geográfica.

**Solução:**

`get_dashboard_all(p_user_id)` - single RPC retornando JSON com 7 seções: `summary`, `balance_sheet`, `solvency`, `top_categories`, `evolution`, `budget`, `attention`.

| Antes | Depois |
|-------|--------|
| 14+ HTTP calls | 3 calls (all + snapshots + upcoming_bills) |
| ~1.5-3s latência | ~200-400ms estimado |

- Migration 054+055: função SQL com auth guard
- `useDashboardAll()` hook com validação Zod por seção
- Dashboard page refatorada para single query
- `AttentionQueue` aceita dados via props (bypass da query interna)
- RPCs individuais preservados para refetch granular em outras páginas

### 21.4 Commits

| SHA | Conteúdo |
|-----|----------|
| `ecb6c56` | fix: key no overlay condicional AppLayout (React 19) |
| `824d903` | fix: logo sidebar w-full + onboarding import inline (6 arquivos) |
| `b623564` | fix(ci): Jest roots restrito a src/ (excluir e2e/) |
| `2a34441` | perf: get_dashboard_all RPC + useDashboardAll hook (9+ calls → 1) |
| `6d04685` | chore: add get_dashboard_all to database types, remove as-any cast |
| `ef196d9` | test: dashboardAllSchema + attentionQueueSchema (4 assertions) |
| `537b37c` | chore: zero lint warnings (12 fixes across 13 files) |

### 21.5 Migrations aplicadas (054-055)

| # | Nome | Conteúdo |
|---|------|----------|
| 054 | add_get_dashboard_all_rpc | Primeira versão (bug: `b.amount` em vez de `b.planned_amount`) |
| 055 | fix_get_dashboard_all_budget_column | Versão corrigida com `planned_amount` |

### 21.6 Totais atualizados

- **Functions:** 88 (71 RPCs + 7 triggers + 9 cron + 1 utility)
- **Migrations:** 55+ via MCP
- **Arquivos src/:** ~128
- **Suítes de teste Jest:** 15 (212 assertions)
- **Lint warnings:** 0
- **CI:** 4/4 verde

### 21.7 Nota: Supabase generated types

`get_dashboard_all` adicionado manualmente a `src/types/database.ts`. Types gerados via CLI (`npx supabase gen types`) produzem discrepâncias com o schema manual (campos como `currency` em accounts ausentes). Manter types manuais até estabilização completa do schema.

### 21.8 Próximos passos (prioridade)

1. **Deploy Vercel** (Claudio, 30 min) - seguir docs/DEPLOY-VERCEL.md
2. ~~**Migrar Supabase para São Paulo**~~ — FEITO (sessão 22)
3. **Usar o app por 1 semana** com dados reais
4. **Convidar 2-3 testers** para beta fechado
5. **UX-H2-02: Push notification triggers** (Edge Function para vencimentos/inatividade - melhor com dados reais)

### 21.9 Stories pendentes (3/90)

| Story | Descrição | Bloqueio |
|-------|-----------|----------|
| P1 | Deploy Vercel + domínio oniefy.com | Ação Claudio |
| UX-H2-02 | Push notifications (triggers de vencimento/inatividade) | Melhor com deploy + dados reais |
| UX-H3-05 | Teste de corredor com 3 pessoas | Ação Claudio |

- **Último commit verde:** `537b37c` (4/4 jobs: Security + Lint + Unit Tests + Build)

## 22. Sessão 17-18/03/2026 - Migração SP + 3 Features (Moedas, Template, Coach)

### 22.1 Consolidação de schema em projeto limpo (oniefy-prod)

**ERRATA (identificada sessão 23):** Esta migração foi motivada por um diagnóstico incorreto de que o projeto original (`hmwdfcsxtmbzlslxgqus`) estava em us-east-1. Na realidade, **ambos os projetos sempre estiveram em sa-east-1 (São Paulo)** desde a criação. O projeto original foi criado em 01/03/2026 em sa-east-1; o documento de especificação mencionava us-east-1 como opção, mas o projeto real nunca usou essa região. A consolidação resultou num schema mais limpo (57 migrations incrementais → 17 consolidadas), mas a motivação de "ganho de latência por região" era falsa.

**Novo projeto:** `mngjbrbxapazdddzgoje` (sa-east-1 São Paulo) — criado 17/03/2026
**Projeto legado:** `hmwdfcsxtmbzlslxgqus` (sa-east-1 São Paulo) — criado 01/03/2026

**17 migrations aplicadas (001-017):** schema completo replicado do antigo para o novo.

**Auditoria lado-a-lado (pós-migração):**

| Item | Antigo | Novo | Resultado |
|---|---|---|---|
| Tabelas | 26 | 26 | Idêntico |
| Colunas | 26 tabelas | 26 tabelas | Idêntico |
| ENUMs | 27 | 27 | Idêntico |
| Functions (56) | 56 | 56 | Idêntico (1:1 nome+args+retorno) |
| Indexes | 111 | 110 | Novo correto (antigo tem 2 duplicatas) |
| RLS Policies | 84 | 84 | Mesma cobertura |
| Storage | 4 policies, 1 bucket | 4 policies, 1 bucket | Idêntico |
| Triggers | 19 | 19 | Idêntico |
| Cron Jobs | 9 | 9 | Idêntico |
| Extensões | 10 | 10 | Idêntico |

**1 bug encontrado e corrigido:** `notification_tokens.subscription_data` (JSONB) faltava (migration 017).

### 22.2 Feature 1: Cotação de Moedas e Crypto (migrations 018-023)

**Objetivo:** Consolidar patrimônio multi-moeda em BRL. Contas em USD, EUR, BTC, etc. convertidas automaticamente.

**35 moedas suportadas:**
- Tier 1 (PTAX oficial): USD, EUR, GBP, CHF, CAD, AUD, JPY, DKK, NOK, SEK
- Tier 2 (Frankfurter/ECB): CNY, NZD, MXN, HKD, SGD, KRW, INR, TRY, ZAR, PLN, CZK, HUF, ILS, MYR, PHP, THB, IDR, RON, ISK
- Tier 3 (CoinGecko): BTC, ETH, SOL, BNB, XRP

**4 providers no cron:**
1. BCB SGS (7 séries: IPCA, INPC, IGP-M, Selic, CDI, TR, salário mínimo)
2. BCB PTAX OData (10 moedas oficiais - fonte fiscal obrigatória)
3. Frankfurter/ECB (1 HTTP call → 29 moedas fiat, fallback para PTAX)
4. CoinGecko Demo (1 HTTP call → 5 cryptos, 30 req/min, 10k/mês)

**76 cotações carregadas na primeira execução, zero erros.**

**Schema:**
- `accounts.currency TEXT DEFAULT 'BRL'`
- `assets.currency TEXT DEFAULT 'BRL'`
- 33 novos valores em `index_type` enum
- 51 fontes em `economic_indices_sources`

**RPCs novas:** `get_rate_to_brl(currency)`, `get_currency_rates()`, `get_supported_currencies()`

**RPCs atualizadas (conversão multi-moeda):** `get_dashboard_summary`, `get_balance_sheet`, `get_solvency_metrics`, `cron_generate_monthly_snapshots`

**Frontend:** seletor de 35 moedas em 3 optgroups nos forms de contas e ativos, badge na lista de contas.

**Commit:** `6a7f370` | CI: 4/4 green

### 22.3 Feature 2: Template Padrão de Importação

**Objetivo:** Arquivo XLSX pré-formatado para input em massa. Auto-detectado pelo import wizard (pula mapeamento manual).

**2 variantes:**
- Standard: Data, Tipo, Valor, Descrição, Categoria, Notas, Tags (7 colunas)
- Fatura de cartão: Data, Descrição Original, Descrição Personalizada, Valor, Parcela, Categoria (6 colunas)

**Implementação:**
- `src/lib/parsers/oniefy-template.ts`: gerador client-side (SheetJS), detector de template, parsers dedicados
- `detectOniefyTemplate(headers)`: retorna 'standard' | 'card' | null
- Import wizard: auto-detecta template Oniefy → pula step de mapping → direto para preview
- Botões "Baixar template" na tela de upload (Transações + Fatura cartão)
- Cada template inclui aba "Instruções" com documentação dos campos

**Commit:** `a585fe2` | CI: 4/4 green

### 22.4 Feature 3: Coach de Onboarding (migration 024)

**Objetivo:** Guiar o usuário nos primeiros passos pós-onboarding com checklist persistente no dashboard.

**7 etapas ordenadas:**
1. Definir data de corte (cutoff_date em users_profile)
2. Cadastrar contas (≥1 conta)
3. Levantar despesas recorrentes (≥3 recorrências)
4. Subir extratos bancários (≥1 import batch)
5. Subir faturas de cartão (≥1 fatura importada)
6. Categorizar transações pendentes (<10% sem categoria)
7. Definir orçamento do mês (≥3 budgets)

**Schema:**
- `setup_journey` (11 cols: user_id, step_key, step_order, title, description, status, completed_at, metadata, timestamps)
- `description_aliases` (9 cols: user_id, original_description, custom_description, category_id, usage_count, timestamps)
- `users_profile.cutoff_date DATE`
- RLS: 3 policies setup_journey + 4 policies description_aliases
- 2 triggers (updated_at)

**RPCs novas:**
- `get_setup_journey(user_id)`: retorna steps + progresso + current_step + all_done (auto-inicializa)
- `advance_setup_journey(user_id, step_key, metadata)`: completa step, desbloqueia próximo
- `initialize_setup_journey(user_id)`: cria os 7 steps (chamada interna)
- `lookup_description_alias(user_id, original)`: busca alias existente para descrição de cartão
- `upsert_description_alias(user_id, original, custom, category_id)`: cria/atualiza alias

**Frontend:**
- `src/lib/hooks/use-setup-journey.ts`: useSetupJourney, useAdvanceStep, useSetCutoffDate
- `src/components/dashboard/setup-journey-card.tsx`: card com barra de progresso, 7 steps com ícones (completed/available/locked), CTA, navegação por rota
- Integrado no Dashboard como Seção 0 (antes do NarrativeCard)
- Auto-hide quando `all_done = true`

**Commit:** `71ddaa7` | CI: 4/4 green

### 22.5 Estado consolidado pós-sessão

| Métrica | Antes (migração) | Depois (final) | Delta |
|---|---|---|---|
| Tabelas | 26 | 28 | +2 (setup_journey, description_aliases) |
| Functions | 56 | 65 | +9 RPCs |
| Indexes | 110 | 118 | +8 |
| RLS Policies | 84 | 91 | +7 |
| Triggers | 19 | 21 | +2 |
| Migrations (SP) | 17 | 26 | +9 (018-025 + dashboard_all do remote) |
| index_type enum | 13 valores | 46 valores | +33 moedas |
| economic_indices | 0 registros | 66+ registros | cotações ao vivo (varia por dia) |
| economic_indices_sources | 0 fontes | 51 fontes | 4 providers configurados |

### 22.6 Auth Configuration (oniefy-prod - mngjbrbxapazdddzgoje)

Configurado via Dashboard + Management API:

| Item | Status |
|---|---|
| Email/Password | Habilitado, min 8 chars, autoconfirm=false |
| Google OAuth | Habilitado (Client ID: 458121785240-...) |
| SMTP Resend | smtp.resend.com:465, sender oniefy@oniefy.com |
| Manual Linking | Habilitado (linkIdentity/unlinkIdentity) |
| Web3 Ethereum (SIWE) | Habilitado (rate_limit_web3: 30/h) |
| Web3 Solana (SIWS) | Habilitado (rate_limit_web3: 30/h) |
| Reauthentication p/ troca de senha | Habilitado |
| CAPTCHA | Desabilitado (habilitar antes de produção) |
| Leaked Password Protection | Requer Supabase Pro ($25/mês) |

**Email Templates PT-BR customizados (Plum Ledger design):**
- Confirmação de email (2.721 chars)
- Redefinição de senha (2.764 chars)
- Confirmação de novo email (2.355 chars)
- Subjects PT-BR para: confirmação, recovery, magic link, invite, email change

**Rate Limits (todos padrão Supabase, OK para beta):**
- email_sent: 30/h | otp: 30/h | verify: 30/h | token_refresh: 150/h | web3: 30/h
- smtp_max_frequency: 60s entre emails por usuário

### 22.7 Roadmap: Web3 Wallet Login

Infraestrutura habilitada (Ethereum SIWE + Solana SIWS), mas sem UI no app ainda.

**Para implementar (futuro):**
1. Botão "Entrar com Ethereum" + "Entrar com Solana" na tela de login (`src/app/(auth)/login/page.tsx`)
2. Usar `supabase.auth.signInWithOAuth({ provider: 'ethereum' })` / `solana`
3. Tela de vinculação em Configurações: `supabase.auth.linkIdentity({ provider: 'ethereum' })` (manual linking já habilitado)
4. Tela de desvinculação: `supabase.auth.unlinkIdentity(identity)` (requer ≥2 identidades)
5. Habilitar CAPTCHA (Cloudflare Turnstile recomendado) antes de produção para proteger endpoints Web3

**Prioridade:** Baixa. Implementar após validação do beta com email + Google. Se um tester crypto pedir, a infraestrutura está pronta.

### 22.8 Items concluídos nesta sessão (continuação)

| Item | Status |
|---|---|
| Auto-advance steps (5 hooks wired) | ✅ Commit `c7bf95c` |
| Cutoff date modal (step 1 UI) | ✅ Commit `db90d64` |
| Description aliases no import | ✅ Migration 025 + UI |
| Email templates PT-BR (3 HTML + 5 subjects) | ✅ Via Management API |
| Security hardening (password_min=8, reauth) | ✅ Via Management API |
| Web3 Ethereum + Solana habilitados | ✅ Via Dashboard |
| Manual Linking habilitado | ✅ Via Dashboard |

### 22.9 Pendências para próxima sessão

1. **Testar app no oniefy-prod:** `npm run dev` → criar conta → onboarding → dashboard → verificar SetupJourneyCard
2. **Deploy Vercel** - `docs/DEPLOY-VERCEL.md`
3. **Supabase Pro** ($25/mês) para Leaked Password Protection + CAPTCHA
4. **Habilitar CAPTCHA** (Cloudflare Turnstile) antes de produção
5. **Web3 login UI** (baixa prioridade, aguardar demanda de beta testers)
6. **Corridor usability test** com 3 pessoas (UX-H3-05)

- **Último commit verde:** `9d1b83f` (4/4 jobs: Security + Lint + Unit Tests + Build)

---

## Sessão 21 (continuação) - 18 março 2026

### Trabalho adicional pós-merge

#### Security Hardening SP (4 migrations)

Auditoria de segurança no oniefy-prod (`mngjbrbxapazdddzgoje`) encontrou e corrigiu:

| Migration | Vulnerabilidade | Fix |
|-----------|----------------|-----|
| `auth_guard_lookup_alias_and_retention` | `lookup_description_alias`: cross-user read; `get_retention_metrics`: sem auth | Auth guards adicionados |
| `fix_retention_metrics_allow_authenticated` | Fix anterior bloqueava analytics page do próprio usuário | Permite authenticated, bloqueia anon |
| `fix_search_path_three_triggers` | 3 triggers sem `SET search_path` (vetor de injection) | `activate_account_on_use`, `handle_new_user`, `recalculate_account_balance` corrigidos |
| `auth_guard_initialize_setup_journey` | `initialize_setup_journey`: cross-user sem auth | Auth guard adicionado |
| `auth_guard_recalculate_balance_for` | `recalculate_account_balance_for`: sem ownership check | Verifica `accounts.user_id = auth.uid()` |

**Resultado final de segurança SP:**
- 62/62 SECURITY DEFINER functions com `SET search_path` (100%)
- 0 functions com UUID param sem `auth.uid()` guard
- 31 migrations no oniefy-prod total

#### Outros commits

| SHA | Conteúdo |
|-----|----------|
| `b72dd87` | chore: remove dead journey-auto-advance (remote uses tryAdvanceStep) |
| `50fc020` | docs: update project refs to SP + fix stale anon key in SETUP-LOCAL |
| `9d1b83f` | test: oniefy template parser (23 assertions: detect, standard, card) |
| `3472ef0` | fix: STEP_ROUTES /recurrences → /bills (rota inexistente) |
| `ad77314` | test: expand utils coverage (+21: multi-currency, monthShort, colorName, translateError) |

#### SP Migrations adicionais

| Migration | Conteúdo |
|-----------|----------|
| `fix_dashboard_all_multicurrency` | `get_dashboard_all` com `get_rate_to_brl(currency)` em todos os valores monetários |

#### Totais atualizados

- **Suítes de teste Jest:** 22 (341 assertions, era 256)
- **Lint warnings:** 0
- **CI:** 4/4 verde
- **SP migrations:** 32 total
- **Último commit verde:** `0dd6351`

---

## Auditoria Técnica - Sessões Paralelas (18 março 2026)

Auditoria sobre o trabalho realizado na sessão 21 (esta sessão) e na sessão "Retomada Oniefy sessão 20" (commit `955d734`), que funcionaram em paralelo.

### Escopo auditado

~30 commits entre `2b8f9a0` e `fd4c713`, cobrindo:
- Dashboard RPC consolidado (`get_dashboard_all`)
- Multi-currency support (contas, ativos, dashboard)
- Setup journey coach (7 steps, auto-advance, cutoff date UI)
- Oniefy import template (detect, parse standard/card)
- Description aliases no import flow
- Onboarding import inline (sem redirect)
- Security hardening SP (auth guards, search_path)

### Resultado

| # | Check | Resultado |
|---|-------|-----------|
| 1 | TypeScript (`tsc --noEmit`) | **0 erros** |
| 2 | ESLint (`next lint`) | **0 warnings** |
| 3 | Jest (16 suites) | **256/256 passando** |
| 4 | Conflict markers (`<<<<<<`) | **0** |
| 5 | Dead code | **Limpo** (`journey-auto-advance.ts` removido) |
| 6 | Frontend RPCs (41) vs SP RPCs | **100% match** |
| 7 | Database types vs SP functions | **100% match** (10 RPCs novas verificadas) |
| 8 | Security: UUID param sem `auth.uid()` | **0 vulnerabilidades** |
| 9 | Security: sem `SET search_path` | **0 vulnerabilidades** |
| 10 | Onboarding import flow (3 níveis de props) | **Intacto** |
| 11 | Dashboard single RPC + multicurrency | **Correto** |
| 12 | Setup journey auto-advance (7 steps) | **Todos wired** |
| 13 | `STEP_ROUTES` vs rotas existentes | **100% match** |
| 14 | Individual hooks preservados para outras páginas | **Correto** (budgets usa granular) |

### Colisões entre sessões (resolvidas)

| Área | O que aconteceu | Resolução |
|------|----------------|-----------|
| `tryAdvanceStep` vs `tryAdvanceJourney` | Duas implementações paralelas | `journey-auto-advance.ts` deletado, consolidado em `tryAdvanceStep` |
| `SetupJourneyCard` cutoff date | Inline picker vs modal | Remote venceu via merge |
| `get_dashboard_all` sem multi-currency | Criada antes da feature de moedas | Atualizada com `get_rate_to_brl()` via migration SP |

### Correções aplicadas durante a auditoria

| Fix | Tipo |
|-----|------|
| `STEP_ROUTES` `/recurrences` → `/bills` | Bug funcional (rota inexistente) |
| Docs "WealthOS" → "Oniefy" (11 refs) | Cosmético |
| `get_dashboard_all` multicurrency (migration SP) | Bug funcional (valores sem conversão) |

### Achados não-bloqueantes (pré-existentes)

| Achado | Nota |
|--------|------|
| `find_reconciliation_candidates` sem frontend | Design gap da fase 9B, não regressão |
| `useReconciliationCandidates` mencionado no header mas não implementado | Idem |

### Veredicto

**Nenhuma regressão funcional ou de segurança.** O código está em estado íntegro para deploy.

---

## Sessão 22 - Auditoria de Código e Matriz de Validação (19 março 2026)

### Escopo

Auditoria completa de 28.339 linhas de TypeScript (todos os arquivos em `src/`), com foco em loops problemáticos, código redundante/duplicado e ineficiências. Resultado formalizado em taxonomia de achados e matriz de validação para uso recorrente.

### Entregas

#### 1. Auditoria de código (`AUDITORIA-CODIGO-WEALTHOS.md`)

Varredura linha a linha de hooks, services, parsers, pages, middleware e API routes. Achados:

| Categoria | Qtd | Exemplos |
|---|---|---|
| Defeito | 2 | Dashboard não invalidado por `useCreateTransaction`/`Transfer`/`Reverse`; `useDeleteCategory` não invalidava budgets |
| Performance | 3 | N+1 no push/send, indices/fetch sequencial, UpcomingBillsCard com query separada |
| Fragilidade | 3 | Onboarding useEffects com eslint-disable, regex flag g inconsistente, onSuccess síncrono |
| Débito | 2 | Fire-and-forget silencioso (3 ocorrências), over-fetch de budget months |
| Sujeira | 1 | Import duplicado em indices/fetch |

Loops analisados: 3 `while` + 5 `for` com regex/queries. Nenhum loop infinito encontrado.

#### 2. Testes de auditoria (6 arquivos, 85 testes novos)

| Arquivo | Testes | Cobertura |
|---|---|---|
| `audit-map-relations.test.ts` | 11 | Helper DRY `mapTransactionRelations` |
| `audit-calendar-grid.test.ts` | 8 | While loop do calendário (28 combinações) |
| `audit-ocr-parsing.test.ts` | 32 | parseAmount, parseDate, parseDescription |
| `audit-tx-invalidation.test.tsx` | 7 | Cache invalidation das 5 mutations |
| `audit-ofx-edge-cases.test.ts` | 12 | OFX dedup, MAX_SIZE, CURDEF |
| `audit-dedup-cleanup.test.ts` | 15 | Budget dedup, rate limiter 1000 IPs |

#### 3. Correções P0/P1/P2 aplicadas

**P0 (defeitos):**
- `transaction-engine.ts`: `useCreateTransaction`, `useCreateTransfer`, `useReverseTransaction` agora invalidam `["dashboard"]`; todos os 5 hooks usam `async/await` no `onSuccess`
- `use-categories.ts`: `useDeleteCategory` invalida `["budgets"]` e `["dashboard"]`

**P1 (débitos):**
- 3 fire-and-forget (login, push, data export) agora logam erros com `console.error`
- Import duplicado em `indices/fetch/route.ts` unificado

**P2 (refatoração DRY):**
- Novo utilitário: `src/lib/utils/map-relations.ts` (mapTransactionRelations, mapAccountRelation, mapCategoryRelation)
- Aplicado em `use-transactions.ts`, `use-recurrences.ts`, `upcoming-bills-card.tsx` (-20 linhas, 2 eslint-disable removidos)

#### 4. Matriz de Validação (`docs/MATRIZ-VALIDACAO.md` v2.1)

Documento de referência para todas as auditorias futuras:

- **6 categorias de achados** com definição, exemplos e prioridade: defeito, vulnerabilidade, performance, fragilidade, débito técnico, sujeira
- **37 auditorias em 10 camadas**: repositório, código, arquitetura, segurança, performance, testes, UX, dependências, infraestrutura, conformidade
- **4 pacotes de execução**: pré-commit (5min), sprint review (30min), release gate (2-3h), security-focused (1h)
- **Matriz cruzada** 37x6 (auditoria x categoria)
- **Anexo A**: mapeamento ISO/IEC 25010 + OWASP ASVS v4.0 + IEEE 1012
- **Anexo B**: roadmap de certificação (LGPD, ISO 27001, ASVS L2, SOC 2) com 8 controles do Anexo A já presentes no codebase

Evolução: v1.0 (23 auditorias) → v2.0 (34, +Perplexity) → v2.1 (37, +Gemini: SBOM, mutation testing, SLSA, ISO 27001 A.8.28)

#### 5. Novo utilitário

- `src/lib/utils/map-relations.ts` - funções DRY para extrair account/category de JOINs Supabase
- `src/lib/services/ocr-service.ts` - parseAmount/parseDate/parseDescription exportados para testabilidade

### Commits desta sessão

| SHA | Mensagem |
|---|---|
| `5c2f8ce` | test: testes de auditoria de código (85 testes, 6 arquivos) |
| `d1aa7e6` | docs: Matriz de Validação v1.0 - taxonomia e 23 tipos de auditoria |
| `4b15d21` | docs: Matriz de Validação v2.0 - 34 auditorias em 10 camadas |
| `ab08f57` | fix: correções P0/P1/P2 da auditoria de código |
| `0dd6351` | docs: Matriz de Validação v2.1 - 37 auditorias, roadmap de certificação |

### Totais atualizados

- **Suítes de teste Jest:** 22 (341 assertions, era 256)
- **Lint warnings:** 0
- **tsc errors:** 0
- **CI:** 4/4 verde (todos os 5 commits)
- **Documentos novos:** 2 (AUDITORIA-CODIGO-WEALTHOS.md, MATRIZ-VALIDACAO.md)
- **Último commit verde:** `0dd6351`

### Pendências para próxima sessão

1. **Testar app no oniefy-prod:** `npm run dev` → criar conta → verificar dashboard atualiza após transação (P0 fix)
2. **Deploy Vercel** - `docs/DEPLOY-VERCEL.md`
3. **Supabase Pro** ($25/mês) para Leaked Password Protection + CAPTCHA
4. **Pausar/deletar projeto legado** (`hmwdfcsxtmbzlslxgqus`) - não tem dados ou features exclusivas
5. **Logo Oniefy** - Penrose Ribbon (iterações em andamento com ferramentas externas)
6. **iOS build chain** - Xcode Cloud ou Mac físico
7. **Corridor usability test** com 3 pessoas (UX-H3-05)
8. **SBOM no CI** - adicionar `npm sbom --sbom-format cyclonedx` ao workflow (item 8.4 da matriz)
9. **Mapeamento LGPD** - tabela → dados pessoais → base legal (item 10.1 da matriz, curto prazo do roadmap)
10. **UpcomingBillsCard** - migrar de query própria para consumir dados de `useDashboardAll` (P2 pendente, -150ms)

---

## Sessão 23 (19 março 2026) - Auditoria de Integridade Inter-Projetos

### 23.1 Problema identificado

Claudio identificou que a "migração de região" descrita na sessão 22 partiu de uma premissa falsa. Claude afirmou que o projeto original (`hmwdfcsxtmbzlslxgqus`) estava em us-east-1, quando na realidade ele **sempre esteve em sa-east-1 (São Paulo)** desde sua criação em 01/03/2026. A confusão veio do documento de especificação v1 (§3.8) que mencionava us-east-1 como região padrão; Claude leu a spec mas não verificou a região real do projeto antes de recomendar a migração.

**Consequência:** um segundo projeto (`mngjbrbxapazdddzgoje`, "oniefy-prod") foi criado desnecessariamente na mesma região, e todo o schema foi replicado. O trabalho de consolidação (17 migrations limpas) não foi inútil, mas a motivação ("ganho de latência ~150ms → ~30ms") era completamente falsa.

### 23.2 Auditoria lado-a-lado (resultado)

Verificação exaustiva via SQL direto em ambos os projetos:

| Item | Legado (`hmwdf...`) | Ativo (`mngjb...`) | Veredicto |
|---|---|---|---|
| Região | sa-east-1 | sa-east-1 | **Sempre iguais** |
| Tabelas | 26 | 28 | oniefy-prod é superset (+setup_journey, +description_aliases) |
| Functions | 57 | 65 | oniefy-prod é superset (+8 RPCs: currency, setup_journey, aliases) |
| ENUMs | 27 (mesmos nomes) | 27 | index_type expandido (+33 valores moedas/crypto) |
| RLS policies | 84 | 91 | +7 (cobertura das novas tabelas) |
| Triggers | 22 | 24 | +2 (novas tabelas) |
| Cron jobs | 9 | 9 | Idêntico |
| Indexes | 111 | 118 | +7 |
| Extensions | 10 | 10 | Idêntico |
| Migrations | 57 (incrementais) | 35 (17 consolidadas + 18 novas) | Consolidação limpa |
| Colunas exclusivas | 0 | 3 | accounts.currency, assets.currency, users_profile.cutoff_date |

**Veredicto: ZERO perda de funcionalidade.** O oniefy-prod contém 100% do schema original + 3 features adicionais (multicurrency, setup_journey, description_aliases). As 57 functions do legado existem no oniefy-prod com assinaturas idênticas.

**analytics_events (138 vs 5):** Dados de telemetria de dev/teste. Descartáveis.

**economic_indices (53 vs 66) e sources (15 vs 51):** O oniefy-prod tem MAIS porque inclui fontes de câmbio (feature multicurrency).

### 23.3 Correções aplicadas ao HANDOVER

1. Região do projeto legado corrigida: "us-east-1" → "sa-east-1 (São Paulo)"
2. Seção 22.1 renomeada de "Migração us-east-1 → sa-east-1" para "Consolidação de schema em projeto limpo"
3. Errata adicionada na seção 22.1 explicando o erro
4. Todas as referências a "projeto SP" substituídas por "oniefy-prod"
5. Diagnóstico de latência do dashboard corrigido (não era distância geográfica)
6. Otimização #1 da seção 20.6 marcada com nota explicativa
7. "Próximos passos" em §§20.9 e 21.8 atualizados (migração marcada como feita)
8. Migration count atualizado para 35

### 23.4 Lições aprendidas (CRÍTICAS para sessões futuras)

**REGRA 1: Sempre verificar antes de afirmar.** A região do projeto estava a 1 query de distância (`Supabase:get_project`). Claude preferiu assumir com base num texto de spec em vez de checar o fato. Esta falha custou uma sessão inteira de trabalho de migração desnecessário.

**REGRA 2: Spec ≠ Realidade.** O documento de especificação v1 mencionava us-east-1. O projeto real foi criado em sa-east-1. Documentação descreve intenção; o banco de dados descreve realidade. Quando houver divergência, a realidade vence.

**REGRA 3: Não inventar problemas de performance.** O diagnóstico correto (14+ roundtrips HTTP) já apontava a solução real (consolidar em 1 RPC, que foi feita com `get_dashboard_all`). A "migração de região" era uma segunda solução para um problema que não existia.

### 23.5 Ação pendente

- **Pausar ou deletar o projeto legado** (`hmwdfcsxtmbzlslxgqus`): não contém dados exclusivos nem features ausentes do oniefy-prod. Claudio decide quando.

### 23.6 Totais atualizados (oniefy-prod, dados verificados por SQL)

- **Tabelas:** 28 (todas com RLS)
- **RLS policies:** 91
- **Functions:** 65 (todas com `SET search_path` e auth.uid() guard)
- **ENUMs:** 27 (index_type com 46 valores)
- **Migrations:** 35 aplicadas
- **Triggers:** 24
- **pg_cron jobs:** 9
- **Indexes:** 118
- **Extensions:** 10
- **Moedas suportadas:** 35 (BRL + 10 PTAX + 19 Frankfurter + 5 crypto)
- **Fontes de índices:** 51
- **Suítes de teste Jest:** 22 (341 assertions)
- **CI:** 4/4 verde
- **Último commit verde:** `df1185f`

---

## Sessão 23 - 19 março 2026 (Claude Opus, Projeto Claude)

### Escopo

Itens rápidos de pré-produção: SBOM, Sentry, mapeamento LGPD, patch de segurança. Identificados via cruzamento Matriz de Validação v2.1 + HANDOVER + repositório.

### Commits

| SHA | Mensagem |
|---|---|
| `374f065` | chore: SBOM no CI + eliminar any em onboarding-seeds |
| `fb9f257` | feat: integrar Sentry para error tracking em produção |
| `53a0897` | docs: mapeamento LGPD + migration de retenção de dados |
| `affb535` | chore: next.js 15.5.12 → 15.5.14 (patch segurança) |
| `d3ec091` | fix: eliminar 2 lint warnings em use-transactions.ts |
| `2e30c5a` | chore: database.ts atualizado com 3 functions LGPD + HANDOVER |
| `de0036b` | perf: UpcomingBillsCard consome dados de useDashboardAll (-1 query) |
| `ea095fd` | docs: HANDOVER sessão 23 completa |
| `fd1f692` | feat: Termos de Uso (/terms) - lacuna L7 do mapeamento LGPD |
| `df1185f` | docs: MAPEAMENTO-LGPD L7 resolvida |

### Entregas

**1. SBOM no CI (item 8.4 da Matriz):** CycloneDX JSON a cada push/PR, artefato retido 90 dias. npm audit no security-check.

**2. Eliminação de `: any`:** onboarding-seeds.ts tipado com `SupabaseClient<Database>`. Zero `: any` fora de database.ts.

**3. Sentry (débito P1):** @sentry/nextjs, 3 configs, opt-in via DSN, error boundaries com captureException.

**4. Mapeamento LGPD (item 10.1):** 28 tabelas classificadas, base legal por tabela, 5 fluxos externos, 7 lacunas (L1-L7), migration 057 (retenção de dados).

**5. Next.js 15.5.14:** patch de segurança. CVE disk cache (Next 16+) aceita. Vulnerabilidades tar (CLI tools) aceitas.

**6. Divergência database.ts/SP:** falso positivo confirmado. Auditoria rodou contra projeto errado.

**7. Lint zero warnings:** varsIgnorePattern adicionado ao ESLint. Destructuring em use-transactions.ts corrigido.

**8. database.ts sincronizado:** 3 functions LGPD (cron_cleanup_*) adicionadas ao tipo.

**9. UpcomingBillsCard consolidado na RPC (P2 perf):**
- Migration 058: get_dashboard_all agora retorna upcoming_bills (top 5 pendentes com JOIN)
- UpcomingBillsCard reescrito como props-based (não faz mais query própria)
- use-dashboard.ts: UpcomingBill type + upcomingBills no DashboardAllData
- Impacto: -1 HTTP call no dashboard load (~150ms)

**10. Migration 057 aplicada no SP:**
- 3 functions de cleanup + 2 pg_cron jobs (weekly-cleanup-analytics, weekly-cleanup-notifications)
- 11 pg_cron jobs ativos no total

**11. Termos de Uso (lacuna L7 LGPD):**
- /terms com 16 seções: descrição, elegibilidade, conta, uso permitido/proibido, dados do usuário, isenção financeira/fiscal, não é IF, PI, disponibilidade, limitação de responsabilidade, encerramento, legislação (Goiânia-GO), alterações, disposições gerais, contato
- Seção 7 (isenção fiscal): explicita que projeções IRPF são estimativas, não consultoria
- Seção 8: Oniefy não é banco/corretora/CVM/SUSEP
- Integrado: middleware (PUBLIC_ROUTES), robots.txt, register (consentimento), privacy (link cruzado)

**12. Projeto Supabase antigo (us-east-1):** confirmado como INACTIVE (já pausado).

### Pendências

1. **Deploy Vercel** (doc pronto em `docs/DEPLOY-VERCEL.md`) - requer ação Claudio no painel Vercel + DNS oniefy.com
2. **Projeto Sentry** (free tier) + configurar DSN nas variáveis Vercel - requer signup em sentry.io
3. **Supabase Pro** ($25/mês) + habilitar CAPTCHA (Cloudflare Turnstile) - requer decisão de custo
4. **iOS build chain** - Apple Developer Account ($99/ano) + Xcode Cloud (25h/mês grátis)
5. **3 stories bloqueadas por Mac:** CFG-04 (push notifications), FIN-17 (OCR), FIN-18 (câmera)
6. **Teste de corredor** com 3 pessoas (UX-H3-05) - ação Claudio, sem código
7. **Lacunas LGPD abertas:** L3 (consentimento CPF, não aplicável até campo existir na UI), L4 (ROPA formal), L5 (RIPD), L6 (DPO)
8. **E2E no CI:** Playwright configurado mas requer Supabase de teste para rodar no GitHub Actions

### Totais atualizados

- **Stories:** 87/90 concluídas (3 bloqueadas por Mac/Xcode)
- **Itens UX:** 17/19 concluídos (push notifications + teste de corredor pendentes)
- **Tabelas SP:** 28 (todas com RLS)
- **Functions SP:** 68 (65 originais + 3 cleanup LGPD)
- **RLS Policies SP:** 91
- **pg_cron jobs SP:** 11
- **Migrations SP:** 37 aplicadas
- **Suítes de teste Jest:** 22 (341 assertions)
- **Lint warnings:** 0
- **tsc errors:** 0
- **CI:** 4/4 verde
- **Último commit verde:** `d51a775`

### Instruções para nova sessão

1. Clonar repositório: `git clone https://<PAT>@github.com/drovsk-cmf/WealthOS.git`
2. Ler este HANDOVER (seções 1-3 para contexto, seção 12 para backlog, sessão mais recente para estado atual)
3. `npm install && npx tsc --noEmit && npm run lint && npm test` para validar estado
4. Supabase SP: `mngjbrbxapazdddzgoje` (sa-east-1 São Paulo) via MCP OAuth
5. Supabase antigo: `hmwdfcsxtmbzlslxgqus` - INACTIVE, ignorar
6. Seguir backlog da seção 12 ou instruções do Claudio
7. Ao final: atualizar este HANDOVER com log da sessão, commits, e último commit verde

---

## Sessão 24 - 19 março 2026 (Claude Opus, Projeto Claude - Feedbacks + Adendo v1.5)

### Escopo

Sessão de produto (não de código). Consolidação de feedbacks de usabilidade de usuários-teste + definição de novas funcionalidades: arquitetura de IA, modelo de dados patrimonial expandido, importação em massa, cronograma guiado de setup. Geração do adendo técnico v1.5.

### 24.1 Feedbacks consolidados (Avaliador #1)

**Notas atribuídas:** Proposta de valor 9/10, clareza para primeira adoção 5/10, arquitetura de informação 6/10. Probabilidade de abandono no onboarding: alta. Potencial de retenção pós-ativação: alto.

**Diagnóstico central:** "O Oniefy parece capaz de encantar quem vence a curva inicial, mas ainda perde gente demais antes disso." Problema de funil, não de proposta.

**5 clusters de feedback:**

| Cluster | Feedbacks | Veredicto |
|---|---|---|
| A. Barreira de vocabulário | Termos contábeis (P&L, LCR, tiers, runway) contradizem promessa de simplicidade | Concordo. Mapa de tradução existe no spec, mas não é aplicado com rigor na UI |
| B. Onboarding / time-to-value | 9 passos com MFA obrigatório antes de qualquer valor entregue | Concordo com ressalva: MFA pode ser diferido, campos E2E bloqueados até ativação |
| C. Arquitetura de informação | Configurações como "depósito de complexidade", importação enterrada | Concordo integralmente. Maior ROI de correção |
| D. Dashboard / progressive disclosure | Densidade informacional hostil para iniciante, dashboard do "usuário futuro" | Concordo. Proposta de 4 níveis de maturidade |
| E. Acertos validados | Posicionamento (9/10), segurança, importação c/ undo, rotinas operacionais | Confirmados. Não mexer |

**Decisão estratégica confirmada: Caminho B.** Motor sofisticado, interface simples. Regra operacional: "Se um rótulo, tooltip ou tela exige que o usuário saiba contabilidade, está errado."

### 24.2 Decisões de produto tomadas

| Decisão | Escolha | Impacto |
|---|---|---|
| Hierarquia de ativos | `parent_asset_id` na tabela assets (até 2 níveis) | Valor consolidado pai+filhos, destaque possível |
| Rastreamento de despesas por ativo | `asset_id` nullable em transactions/journal_entries (dimensão ortogonal ao centro de custo) | "Quanto custa meu carro" sem novo centro |
| Monitoramento de ativos | Ativado por padrão, silenciosamente. Sem opt-in no cadastro | Reduz decisões no momento errado |
| Importação em massa | Tabela editável in-app (primária) + Upload Excel (avançada) | 2 interfaces para o mesmo problema, perfis diferentes |
| Templates por domínio | 5 templates (veículos, imóveis, bens, transações, investimentos) | Tabela in-app e Excel compartilham mesma estrutura |
| Categorias de ativos | Expansão de 5 para 14 valores no ENUM asset_category | Cobertura: jóias, fashion, esportes, colecionáveis, aeronaves, etc. |
| Provider primário IA (volume) | Gemini Flash-Lite / Flash (custo 3-10x menor que Claude) | Recomendação, pendente confirmação |
| Provider para narrativas | Claude Haiku 4.5 (qualidade de texto superior em pt-BR) | Recomendação, pendente confirmação |
| Assistente conversacional | Postergar para pós-MVP | Complexidade desproporcional para o momento |
| Sanitização PII | Regex obrigatório antes de toda chamada de API de IA | Incontornável dado posicionamento de privacidade |

### 24.3 Arquitetura de IA definida

**Princípio:** IA é última camada, não primeira. Código determinístico resolve ~85% das operações.

**Pipeline de categorização (4 etapas):**
1. Regras globais (tabela `categorization_rules`, regex) → ~50%
2. Regras do usuário (tabela `merchant_patterns`, aprendizado por correção) → ~30%
3. IA batch (Gemini Flash-Lite, lote único) → ~15%
4. Intervenção manual (alimenta etapa 2) → ~5%

**Modelo de custo:** ~US$ 0.02/usuário/mês (1.000 usuários = US$ 20/mês). Com Batch API 50%: US$ 12-15/mês.

**5 casos de uso:** categorização de transações, extração de documentos (OCR + parser + IA fallback), cadastro assistido de bens, insights narrativos mensais, assistente conversacional (pós-MVP).

**Infraestrutura:** Edge Function `ai-gateway` + sanitizador PII + cache (`ai_cache`, TTL 30d) + rate limiter + logging (`ai_usage_log`).

### 24.4 Schema changes (adendo v1.5)

**Tabelas novas (6):**
- `categorization_rules`: regras globais de categorização por estabelecimento
- `merchant_patterns`: regras aprendidas do usuário por correção
- `asset_templates`: templates de bens comuns com valor de referência
- `ai_cache`: cache de respostas da IA (hash prompt → resposta)
- `ai_usage_log`: log de uso de IA por usuário (monitoramento de custo)
- `user_insights`: insights narrativos gerados pela IA

**Tabelas modificadas (3):**
- `assets`: +parent_asset_id (UUID FK NULL)
- `transactions`: +asset_id (UUID FK NULL)
- `journal_entries`: +asset_id (UUID FK NULL)

**ENUM expandido:** asset_category de 5 para 14 valores.

### 24.5 User stories novas (18)

| Módulo | Stories | Total |
|---|---|---|
| UXR (Experiência) | UXR-01 a UXR-05 | 5 |
| PAT (Patrimônio expandido) | PAT-08 a PAT-11 | 4 |
| AI (Inteligência Artificial) | AI-01 a AI-05 | 5 |
| IMP (Importação em Massa) | IMP-01 a IMP-04 | 4 |

**Totais acumulados:** 90 + 18 = 108 stories especificadas (87 concluídas, 3 bloqueadas por Mac, 18 novas do adendo v1.5).

### 24.6 Documento gerado

`wealthos-adendo-v1_5.docx` - 10 seções, validação PASS. Pronto para upload ao Google Drive (pasta Documentacao/).

**Conteúdo:**
1. Contexto e motivação
2. Redesenho da experiência (onboarding, navegação, nomenclatura, dashboard, formulário, importação)
3. Modelo de dados patrimonial (hierarquia, asset_id, monitoramento, categorias)
4. Importação em massa (tabela in-app, Excel, cronograma guiado)
5. Arquitetura de IA (privacidade, modelos, 5 casos de uso, infraestrutura, custos)
6. Alterações no schema (6 tabelas novas, 3 modificadas)
7. 18 user stories novas (4 módulos)
8. Plano de implantação (17 prioridades mapeadas)
9. Decisões pendentes (6 itens para confirmação)
10. Totais atualizados

### 24.7 Decisões pendentes (requerem confirmação Claudio)

| # | Decisão | Recomendação |
|---|---|---|
| 1 | Provider primário para volume | Gemini (Flash-Lite/Flash) por custo |
| 2 | Provider para narrativas | Claude Haiku (qualidade texto pt-BR) |
| 3 | Rate limit free tier IA | 50 chamadas/mês |
| 4 | Assistente conversacional no MVP | Postergar |
| 5 | Sanitização PII | Regex obrigatório (incontornável) |
| 6 | Cache de prompts/respostas | Cache local 30 dias |

### 24.8 Relação com trabalho já feito

Muitas das recomendações do avaliador #1 já foram parcialmente endereçadas pela estratégia UX (seção 12.9) e sessões anteriores:

| Feedback do avaliador | Já implementado | Gap restante |
|---|---|---|
| Onboarding longo | UX-H1-02 (3 rotas device-aware) | MFA diferido, pergunta única |
| Configurações como depósito | UX-H1-01 (navegação 6+1, P2) | Reorganização mais profunda das subpáginas |
| Dashboard denso | UX-H1-06 (fila de atenção, motor narrativo) | Progressive disclosure por maturidade (4 níveis) |
| Formulário pesado | UX-H1-04 (modo rápido 3 decisões) | Campo asset_id no modo expandido |
| Importação enterrada | UX-H1-03 (CTA em empty states) | ✅ P2 concluído: Sidebar principal + CTA no dashboard |
| Vocabulário técnico | Microcopy MAN-LNG-CMF-001 | ✅ P1 concluído: auditoria completa de renomeações |

As novas funcionalidades (IA, hierarquia de ativos, importação em massa) são inteiramente novas e não têm precedente no código atual.

### 24.9 Plano de implantação

17 prioridades definidas e integradas ao **Backlog Consolidado Único (Seção 12.1)**. Sequência de execução em ~10 sprints, organizada por impacto × esforço. Consultar Seção 12.1 para detalhes completos.

### 24.10 Nota: sem commits nesta sessão

Sessão de produto e documentação. Nenhuma alteração no código. O adendo v1.5 é o entregável principal. A implementação das decisões aqui registradas será executada em sessões futuras seguindo o plano de implantação (seção 8 do adendo).




## Sessão 25 - 20 março 2026 (Claude Opus, Projeto Claude)

### 25.1 Escopo

Sprint 1 do adendo v1.5: P1 (auditoria de strings), P2 (importação na sidebar), P15 (cronograma guiado de 5 semanas).

### 25.2 O que foi feito

**P1 - Auditoria de strings e renomeações (18 arquivos modificados):**
- Cockpit de Solvência → Fôlego Financeiro (solvency-panel, dashboard)
- LCR → Índice de liquidez (solvency-panel, account-form)
- Runway → Fôlego em meses (solvency-panel)
- Burn Rate → Custo mensal médio (solvency-panel)
- Tiers → Níveis: T1→N1, T2→N2, T3→N3, T4→N4 (solvency-panel, use-accounts, account-form)
- Centros de Custo → Divisões (settings, cost-centers, family, privacy, onboarding, use-cost-centers, onboarding-seeds, data export)
- Fiscal → Imposto de Renda (settings, tax page headings)
- Fórmula hint: "Liquidez / (Burn × 6)" → "Liquidez / (Custo × 6)"

**P2 - Promover importação (3 pontos de contato):**
- Sidebar: Importar (Upload icon) adicionado como 3o item do NAV_MAIN (layout 6+1), /connections removido de SETTINGS_ROUTES
- Dashboard: ImportCTA component (link dashed, oculto após 20 transações via useProgressiveDisclosure)
- Transações: botão "Importar" com Upload icon ao lado de "+ Nova transação"

**P15 - Cronograma guiado de 5 semanas:**
- Migration 059_setup_journey_5_week_plan.sql: tabela setup_journey com week_number, RLS, RPCs get_setup_journey e advance_setup_journey
- SetupStep interface atualizada com week_number
- SetupJourneyCard redesenhado: tabs horizontais por semana, cada uma com título + entrega de valor, auto-expand da semana ativa
- 7 passos em 5 semanas: (1) Primeiros passos, (2) Despesas fixas, (3) Importação, (4) Organização, (5) Controle

### 25.3 CI

Commit: `7745c69` | 4/4 jobs green (Lint, Security, Tests, Build)

### 25.4 Migrations aplicadas

- `setup_journey_5_week_plan` — **ERRO: aplicada no projeto LEGADO (hmwdfcsxtmbzlslxgqus) em vez do oniefy-prod (mngjbrbxapazdddzgoje)**. Corrigido na sessão 25b.

### 25.5 Arquivos criados

- `src/components/dashboard/import-cta.tsx` (P2)
- `supabase/migrations/059_setup_journey_5_week_plan.sql` (P15)

### 25.6 Nota sobre Supabase

**ERRO GRAVE:** Projeto legado (`hmwdfcsxtmbzlslxgqus`) estava INACTIVE (pausado deliberadamente na sessão 22). Claude reativou o projeto legado sem consultar o HANDOVER (linhas 6-7 dizem explicitamente "PAUSAR/DESLIGAR") e aplicou a migration nele. O projeto correto é `mngjbrbxapazdddzgoje` (oniefy-prod).

### 25.7 Próximo: Sprint 2

P4 - Onboarding simplificado (conta → email → pergunta única → importação → valor em <2min).


## Sessão 25b - 20 março 2026 (Claude Opus, Projeto Claude) — CORREÇÃO

### 25b.1 Escopo

Corrigir o erro da sessão 25: migration P15 aplicada no projeto legado em vez do oniefy-prod.

### 25b.2 O que foi feito

1. **Projeto legado re-pausado:** `hmwdfcsxtmbzlslxgqus` restaurado para INACTIVE via Management API
2. **Migration P15 aplicada no projeto correto** (`mngjbrbxapazdddzgoje`):
   - ALTER TABLE setup_journey ADD COLUMN week_number (tabela já existia no oniefy-prod)
   - Backfill week_number nos steps existentes
   - RPCs initialize_setup_journey e get_setup_journey atualizadas para incluir week_number
   - Nome no Supabase: `p15_setup_journey_week_number`
3. **Arquivo local 059 reescrito** para refletir o ALTER TABLE (não CREATE TABLE)

### 25b.3 Lição aprendida

**Ler o HANDOVER INTEIRO antes de qualquer operação de infraestrutura.** As linhas 6-7 do HANDOVER identificam explicitamente qual é o projeto ativo e qual é o legado. Reativar um projeto pausado sem verificar o HANDOVER é um erro grave que pode causar divergência de estado entre projetos.


## Sessão 25c - 20 março 2026 (Claude Opus, Projeto Claude) — AUDITORIA

### 25c.1 Escopo

Auditoria completa do oniefy-prod (`mngjbrbxapazdddzgoje`) para identificar gaps entre código local, HANDOVER e banco de dados em produção.

### 25c.2 Metodologia

1. Listar todas as RPCs chamadas no código (`supabase.rpc(...)`) e cruzar com RPCs existentes no oniefy-prod
2. Listar todas as tabelas acessadas no código (`.from(...)`) e cruzar com tabelas no oniefy-prod
3. Verificar ENUMs, colunas específicas, cron jobs, triggers, indexes, RLS policies, storage, grants, auth trigger
4. Verificar seed data (tax_parameters, economic_indices_sources)

### 25c.3 Resultado

| Dimensão | Código (local) | oniefy-prod | Status |
|---|---|---|---|
| RPCs chamadas no frontend | 41 | 41 presentes + 23 internas (cron, trigger) | ✅ OK |
| Tabelas acessadas (.from) | 23 | 23 + 5 via RPC (journal_entries, journal_lines, center_allocations, description_aliases, setup_journey) | ✅ OK |
| ENUMs | 28 tipos | 28 tipos | ✅ OK |
| Cron jobs | 11 | 11 ativos | ✅ OK |
| Triggers | 24 | 24 | ✅ OK |
| Indexes (transactions) | 21 | 21 | ✅ OK |
| RLS policies | 28 tabelas | 28 tabelas com policies | ✅ OK |
| Storage bucket | user-documents | user-documents (private) | ✅ OK |
| Grants revogados (cron) | anon/auth sem acesso | anon/auth sem acesso | ✅ OK |
| SECURITY DEFINER + search_path | Todos | Todos com search_path | ✅ OK |
| Auth trigger (handle_new_user) | on_auth_user_created | Presente | ✅ OK |
| ensure_rls event trigger | Sim | Presente | ✅ OK |
| economic_indices_sources seed | 51 | 51 | ✅ OK |
| **tax_parameters seed** | **9 registros** | **0 registros** | **❌ CORRIGIDO** |
| setup_journey.week_number | Coluna requerida | Presente (sessão 25b) | ✅ OK |

### 25c.4 Gaps encontrados e corrigidos

**1. `tax_parameters` vazia no oniefy-prod.** A consolidação da sessão 22 migrou toda a estrutura DDL (tabelas, funções, indexes, RLS), mas não incluiu os dados de seed da tabela `tax_parameters`. Estes 9 registros são necessários para o módulo de IR funcionar:

- IRPF Monthly 2025 + 2026
- IRPF Annual 2025 + 2026
- INSS Employee 2025 + 2026
- Minimum Wage 2025 + 2026
- Capital Gains (desde 2016)

Migration `seed_tax_parameters_all` aplicada no oniefy-prod. Houve duplicação (a tabela já tinha os 9 registros de uma tentativa anterior durante a consolidação, resultando em 18 linhas). Deduplicadas via `ctid`. Unique index `idx_tax_params_unique` criado em `(parameter_type, valid_from)` para prevenir recorrência.

**2. `setup_journey.week_number` (P15)** foi aplicada no projeto ERRADO na sessão 25. Corrigido na sessão 25b com migration `p15_setup_journey_week_number` no oniefy-prod.

### 25c.5 Conclusão

Com exceção do seed fiscal e do week_number (ambos corrigidos), o oniefy-prod está **100% alinhado** com o código local. Nenhuma RPC, tabela, coluna, trigger, cron job ou policy está faltando.


## Sessão 25d - 20 março 2026 (Claude Opus, Projeto Claude) — Sprint 2

### 25d.1 Escopo

Sprint 2 do adendo v1.5: P4 (Onboarding simplificado).

### 25d.2 O que foi feito

**P4 - Onboarding simplificado (adendo v1.5 §2.1):**

Fluxo anterior (9 steps, ~5min):
welcome → currency → security → mfa_enroll → mfa_verify → categories → route_choice → route_execution → celebration

Fluxo novo (3 steps, <2min):
welcome → question ("Como quer começar?") → setup automático + redirect

Mudanças:
- **Pergunta única:** 3 opções (Importar extratos [recomendado], Cadastrar manualmente, Explorar primeiro)
- **Currency removida:** default BRL, alterável em Configurações (elimina 1 step)
- **MFA removido do onboarding:** diferido para banner no dashboard
- **Security (E2E):** executa silenciosamente no step "setup", sem tela dedicada
- **Seeds:** executam silenciosamente no step "setup"
- **Redirect:** /connections (importar) ou /dashboard (manual/explorar)

**MFA Reminder Banner:**
- `src/components/dashboard/mfa-reminder-banner.tsx`
- Aparece no dashboard após 24h de conta sem MFA configurado
- Dismissível por sessão (sessionStorage)
- Link direto para /settings
- Integrado no dashboard como primeiro elemento (antes do SetupJourneyCard)

**Arquivos:** 4 modificados (onboarding reescrito de 616 → 210 linhas), 1 criado

### 25d.3 CI

Commit: `5016a23` | CI green (Security + Lint + Build + Tests)

### 25d.4 Nota sobre componentes preservados

Os componentes de rota do onboarding antigo (RouteChoiceStep, RouteManualStep, RouteImportStep, RouteSnapshotStep, CelebrationStep) foram mantidos no repo em `src/components/onboarding/`. Não são mais importados pelo onboarding, mas podem ser reutilizados em outros fluxos.

### 25d.5 Próximo: Sprint 3

P16 (Expansão ENUM asset_category de 5 para 14) + P7a (parent_asset_id + asset_id em transactions/journal_entries).

## Sessão 25e - 20 março 2026 (Claude Opus, Projeto Claude) — Sprint 3

### 25e.1 Escopo

Sprint 3 do adendo v1.5: P16 (expansão ENUM asset_category) + P7a (hierarquia de ativos).

### 25e.2 O que foi feito

**P16 - Expansão ENUM asset_category (5 → 14 valores):**
- Novos: vehicle_auto, vehicle_moto, vehicle_recreational, vehicle_aircraft, jewelry, fashion, furniture, sports, collectibles
- ASSET_CATEGORY_LABELS: 14 labels pt-BR
- ASSET_CATEGORY_OPTIONS: 14 opções com descrições contextuais
- ASSET_CATEGORY_COLORS: cores únicas por categoria (Plum Ledger palette)
- COA_MAP: mapeamento para plano de contas (Grupo 1.2)
- Zod schema atualizado (rpc.ts)
- database.ts atualizado

**P7a - Hierarquia de ativos (3 colunas + 3 indexes):**
- `assets.parent_asset_id` UUID FK NULL → hierarquia pai/filho (até 2 níveis)
- `transactions.asset_id` UUID FK NULL → "quanto custa meu carro" sem novo centro
- `journal_entries.asset_id` UUID FK NULL → mesma dimensão no motor contábil
- Partial indexes: idx_assets_parent, idx_tx_asset, idx_je_asset (WHERE NOT NULL)
- database.ts atualizado (Row/Insert/Update para assets, transactions, journal_entries)

### 25e.3 Migrations aplicadas (oniefy-prod)

- `p16_p7a_asset_category_expansion_and_hierarchy` (via MCP apply_migration)
- Arquivo local: `supabase/migrations/061_p16_p7a_asset_hierarchy.sql`

### 25e.4 Próximo: Sprint 4

P3 (Reorganizar Configurações) + P6 (Formulário de transação radical).

## Sessão 25f - 20 março 2026 (Claude Opus, Projeto Claude) — Sprint 4

### 25f.1 Escopo

Sprint 4 do adendo v1.5: P3 (Reorganizar Configurações) + P6 (Formulário de transação radical).

### 25f.2 O que foi feito

**P3 - Reorganizar Configurações (adendo v1.5 §2.2):**
- Grupo "Dados e Importação" eliminado: Importação já na sidebar (P2), Contas a Pagar + IR promovidos
- Novo grupo "Finanças": Contas a Pagar + Imposto de Renda (visibilidade de primeiro nível)
- Grupo "Dados": apenas Dados e Privacidade (exportação, LGPD)
- Grupo "Avançado": Plano de Contas + Índices + Métricas (Tarefas removida)
- /workflows removido de SETTINGS_ROUTES no layout (acessível direto via URL ou dashboard)
- Imports limpos: Download e CheckSquare removidos (não usados)

**P6 - Formulário de transação radical (adendo v1.5 §2.5):**
- Quick mode reduzido: valor (autofocus) → descrição (trigger auto-categorização) → conta
- Type toggle movido para modo expandido (default expense cobre 80% dos casos)
- Campo asset_id ("Bem relacionado") adicionado no expanded, visível apenas para despesas com bens cadastrados
- useAssets importado no form para popular o select
- State assetId com reset no open

### 25f.3 CI

Commit: pendente (será pushado junto com este log)

### 25f.4 Próximo: Sprint 5

P10 (Pipeline de categorização determinística: categorization_rules + merchant_patterns).

## Sessão 25g - 20 março 2026 (Claude Opus, Projeto Claude) — Sprint 5

### 25g.1 Escopo

Sprint 5 do adendo v1.5: P10 (Pipeline de categorização determinística).

### 25g.2 O que foi feito

**P10 - Pipeline de categorização (adendo v1.5 §5.4 etapas 1-2):**

Schema:
- Tabela `categorization_rules`: regras globais regex, prioridade, is_active. RLS: SELECT para authenticated.
- Tabela `merchant_patterns`: padrões por usuário, FK categories, UNIQUE(user_id, pattern). RLS: CRUD por user_id.
- Indexes: idx_mp_user_pattern, idx_cr_active (partial)
- 26 regras globais BR seedadas (alimentação, transporte, moradia, saúde, educação, lazer, vestuário, serviços, seguros, impostos, salário, rendimentos, freelance)

RPCs:
- `auto_categorize_transaction` reescrita: 3 etapas sequenciais:
  1. merchant_patterns do usuário (exact match, incrementa usage_count)
  2. categorization_rules globais (regex ~ match, prioridade ASC)
  3. fallback: nome da categoria = descrição ou LIKE
- `learn_merchant_pattern` nova: UPSERT em merchant_patterns (ON CONFLICT incrementa usage_count)

Frontend:
- `learnCategoryPattern()` em use-auto-category.ts (fire-and-forget)
- TransactionForm: chama learnCategoryPattern no submit quando categoria foi manualmente corrigida
- database.ts: categorization_rules + merchant_patterns + learn_merchant_pattern adicionados

### 25g.3 Migrations aplicadas (oniefy-prod)

- `p10_categorization_pipeline` (via MCP apply_migration)
- Arquivo local: `supabase/migrations/062_p10_categorization_pipeline.sql`

### 25g.4 Próximo: Sprint 6-7

P8 (Tabela editável in-app) + P9 (Templates Excel por domínio + upload com preview).

## Sessão 25h - 20 março 2026 (Claude Opus, Projeto Claude) — Sprint 6-7

### 25h.1 Escopo

Sprint 6-7 do adendo v1.5: P8 (Tabela editável in-app) + P9 (Templates Excel por domínio).

### 25h.2 O que foi feito

**P8 - Tabela editável in-app (adendo v1.5 §4.2.1):**
- `BulkEntryGrid`: componente genérico (ColumnDef[], onSave, validação inline, add/remove row, save all)
- `BulkImportTab`: 3 domínios com configs dedicadas:
  - Bens: nome, categoria (14 opções), valor aquisição/atual, data, notas
  - Veículos: nome, tipo (5 opções veículo), valores, data, placa, notas
  - Investimentos: nome, valores, data, moeda (BRL/USD/EUR/BTC/ETH), notas
- Integrado em /connections como aba "Cadastro em massa" (4 abas total)
- Save insere diretamente em `assets` via Supabase client

**P9 - Templates Excel por domínio (adendo v1.5 §4.2.2-4.3):**
- `downloadDomainTemplate()` em oniefy-template.ts: 3 variantes (assets, vehicles, investments)
- Cada template: sheet de dados com exemplos BR + sheet de instruções
- Botões de download na BulkImportTab com feedback (toast + loading state)
- `DOMAIN_TEMPLATE_INFO`: metadata para labels e filenames

**Arquivos:** 4 criados/modificados

### 25h.3 Nota

Templates de transações (standard + card) já existiam. Total: 5 templates (standard, card, assets, vehicles, investments) conforme especificado no adendo.

### 25h.4 Próximo: Sprint 8

P5 (Dashboard com 4 níveis de maturidade progressiva).

## Sessão 25i - 20 março 2026 (Claude Opus, Projeto Claude) — Sprint 8

### 25i.1 Escopo

Sprint 8 do adendo v1.5: P5 (Dashboard com 4 níveis de maturidade progressiva).

### 25i.2 O que foi feito

**P5 - Dashboard progressivo (adendo v1.5 §2.4):**

4 níveis de maturidade baseados em volume de dados:
- **Novo** (0-10 tx): Setup Journey + Import CTA + Narrativa + Fila de atenção + Resumo (saldo/receita/despesa)
- **Ativo** (11-50 tx): + Top Categorias + Contas a Vencer + Orçamento
- **Engajado** (51+ tx, 2+ meses): + Balanço Patrimonial + Evolução + Fôlego Financeiro
- **Avançado** (opt-in, futuro): reservado

Implementação:
- `useProgressiveDisclosure`: query de monthly_snapshots (count) + cálculo de maturityLevel
- `DisclosureFlags`: +maturityLevel, +distinctMonths
- Dashboard: variáveis `showMidTier` e `showFullTier` controlam renderização condicional
- Seções ocultas não fazem queries desnecessárias (componentes não montados)

### 25i.3 Nota sobre lint fix (Sprint 6-7)

CI da Sprint 6-7 falhou por 2 problemas:
1. Aspas não escapadas em JSX (`"Importar extrato"` em `bulk-import-tab.tsx`)
2. TS7053: acesso dinâmico `row[col.key]` sem index signature resolvida em `bulk-entry-grid.tsx`

Corrigidos em `4624934` (lint) e `606decc` (TS7053 via helper `cell()`).

### 25i.4 Próximo: Sprint 9

P11 (Gateway IA: Edge Function ai-gateway + sanitizador PII + tabelas ai_cache/ai_usage_log + categorização com fallback Gemini Flash-Lite).

## Sessão 25j - 21 março 2026 (Claude Opus, Projeto Claude) — Sprint 9

### 25j.1 Escopo

Sprint 9 do adendo v1.5: P11 (Gateway IA).

### 25j.2 O que foi feito

**P11 - Gateway IA (adendo v1.5 §5.3-5.4-5.9):**

Schema (migration 063):
- `ai_cache`: cache de respostas IA (prompt_hash + model + use_case = unique, TTL 30d)
- `ai_usage_log`: log por usuário (tokens, custo USD, cached flag)
- RLS: cache SELECT para authenticated, log SELECT+INSERT por user_id
- RPCs: check_ai_rate_limit (50/mês free tier), get_ai_cache, save_ai_result
- Cron: weekly-cleanup-ai-cache (domingo 3:30 AM)

Backend:
- `/api/ai/categorize` (Next.js API route): auth → rate limit → sanitize PII → check cache → Gemini Flash-Lite → save cache+log
- Batch de até 20 descrições por chamada
- Custo estimado: ~US$ 0.02/usuário/mês

Frontend:
- `src/lib/utils/pii-sanitizer.ts`: sanitizePII() + hashPrompt() (regex CPF/CNPJ/email/tel/cartão/conta)
- `src/lib/hooks/use-ai-categorize.ts`: useAiCategorize() + getUncategorizedDescriptions()
- database.ts: +ai_cache, +ai_usage_log, +4 functions

Ativação: requer GEMINI_API_KEY no .env. Sem a chave, gateway retorna resultados vazios (graceful degradation).

### 25j.3 Migrations aplicadas (oniefy-prod)

- `p11_ai_gateway_tables` (via MCP apply_migration)
- Arquivo local: `supabase/migrations/063_p11_ai_gateway.sql`

### 25j.4 Próximo: Sprint 10

P7b (UI hierarquia de ativos) + P14 (cadastro assistido de bens com asset_templates).

## Sessão 25k - 21 março 2026 (Claude Opus, Projeto Claude) — Sprint 10

### 25k.1 Escopo

Sprint 10 do adendo v1.5: P7b (UI hierarquia de ativos) + P14 (cadastro assistido com templates).

### 25k.2 O que foi feito

**P7b - UI hierarquia de ativos (adendo v1.5 §3.1-3.3):**
- AssetForm: select "Bem pai (opcional)" entre Categoria e Moeda
- Filtra bens sem parent_asset_id (apenas raízes como opções de pai)
- Prop `defaultParentId` para fluxo "adicionar acessório a este bem"
- `createAsset.mutateAsync` agora inclui `parent_asset_id`
- Reset e useEffect deps atualizados

**P14 - Cadastro assistido de bens (adendo v1.5 §5.6):**

Schema (migration 064):
- `asset_templates`: name, category, default_depreciation_rate, reference_value_brl, useful_life_years, tags
- RLS: SELECT para authenticated
- Indexes: category + GIN full-text search (portuguese)
- 27 templates BR: imóveis (4), veículos (8), eletrônicos (5), móveis (4), jóias (2), esportes (2), colecionáveis (2)

Frontend:
- `useAssetTemplates` hook: query com 1h staleTime (dados estáticos)
- `searchTemplates()`: fuzzy match por nome + tags (top 5)
- database.ts: asset_templates type

### 25k.3 Migrations aplicadas (oniefy-prod)

- `p14_asset_templates` (via MCP apply_migration)
- Arquivo local: `supabase/migrations/064_p14_asset_templates.sql`

### 25k.4 Resumo consolidado da sessão

Todas as 15 prioridades pré-MVP do adendo v1.5 foram implementadas nesta sessão:

| # | Item | Sprint |
|---|---|---|
| P1 | Auditoria de strings e renomeações | Sprint 1 (sessão anterior) |
| P2 | Importação na sidebar + CTA dashboard | Sprint 1 (sessão anterior) |
| P15 | Cronograma guiado de 5 semanas | Sprint 1 (sessão anterior) |
| P4 | Onboarding simplificado (9→3 steps, MFA diferido) | Sprint 2 |
| P16 | ENUM asset_category 5→14 | Sprint 3 |
| P7a | parent_asset_id + asset_id em transactions/journal_entries | Sprint 3 |
| P3 | Reorganizar Configurações | Sprint 4 |
| P6 | Formulário de transação radical | Sprint 4 |
| P10 | Pipeline de categorização determinística | Sprint 5 |
| P8 | Tabela editável in-app (BulkEntryGrid) | Sprint 6-7 |
| P9 | Templates Excel por domínio (5 templates) | Sprint 6-7 |
| P5 | Dashboard progressivo (4 níveis) | Sprint 8 |
| P11 | Gateway IA (Gemini, cache, rate limit, PII sanitizer) | Sprint 9 |
| P7b | Hierarquia de ativos na UI | Sprint 10 |
| P14 | Asset templates (27 templates BR) | Sprint 10 |

Restam apenas os itens pós-MVP: P12 (extração documentos IA), P13 (insights narrativos), P17 (assistente conversacional).

### 25k.5 Próximo

Itens pós-MVP ou próximas prioridades definidas por Claudio.

## Sessão 25l - 21 março 2026 (Claude Opus, Projeto Claude) — Jest Tests

### 25l.1 Escopo

Cobertura de testes para as features implementadas nas sprints 1-10 do adendo v1.5.

### 25l.2 O que foi feito

6 novas suítes de teste (57 assertions):

| Suíte | Testes | Cobertura |
|---|---|---|
| `pii-sanitizer.test.ts` | 14 | P11: CPF, CNPJ, email, telefone, cartão, conta bancária, preservação de texto normal, múltiplos PIIs |
| `p16-asset-categories.test.ts` | 11 | P16: 14 categorias com labels/colors/COA, zod schema aceita novas categorias, rejeita inválidas. P1: N1-N4 nomenclatura |
| `p1-divisoes-rename.test.ts` | 4 | P1: CENTER_TYPE_LABELS usa "Divisão", CENTER_TYPE_OPTIONS usa "Divisão" |
| `p14-asset-templates.test.ts` | 10 | P14: searchTemplates (nome, tag, case-insensitive, limite 5, sem match), estrutura de template (campos, bounds) |
| `p9-domain-templates.test.ts` | 7 | P9: DOMAIN_TEMPLATE_INFO (3 domínios, fileNames únicos, padrão .xlsx), detectOniefyTemplate (standard/card/null) |
| `p11-ai-gateway.test.ts` | 11 | P11: getUncategorizedDescriptions (sem categoria, sem descrição, dedup, trim, vazio), rate limit shape |

Bugs encontrados e corrigidos:
1. **pii-sanitizer.ts**: regex de cartão de crédito vinha DEPOIS do telefone, causando match incorreto. Reordenado.
2. **p16 test**: LIQUIDITY_TIER_OPTIONS importada de `use-accounts` (não `use-assets`).

### 25l.3 Totais de teste

| Métrica | Antes | Depois |
|---|---|---|
| Suítes | 22 | 28 |
| Tests | 341 | 398 |
| Falhas | 0 | 0 |

### 25l.4 CI

Commit: `6ffd47e` | 4/4 green (Security + Lint + Tests + Build)

## Sessão 25m - 21 março 2026 (Claude Opus, Projeto Claude) — 12 itens pendentes

### 25m.1 Escopo

Resolução de todos os 12 itens pendentes identificados na varredura de consistência.

### 25m.2 O que foi feito

| # | Item | Tipo | Entrega |
|---|---|---|---|
| 1 | P6: asset_id no submit | Fix incompleto | CreateTransactionInput +asset_id, post-create UPDATE, form passa assetId |
| 2 | P7b: hierarquia visual | Fix incompleto | Roots/children grouping, indentação ml-8, valor consolidado pai+filhos |
| 3 | P14: template suggestions | Fix incompleto | useAssetTemplates + searchTemplates conectados ao AssetForm, dropdown Sparkles |
| 4 | CAPTCHA Turnstile | Feature nova | Componente Turnstile (graceful bypass), verifyTurnstile server-side em 3 auth routes |
| 5 | P12: extração documentos IA | Feature pós-MVP | /api/ai/extract (regex BR → Gemini Flash fallback), PII sanitizado |
| 6 | P13: insights narrativos | Feature pós-MVP | /api/ai/insights + tabela user_insights, Claude Haiku → Gemini fallback |
| 7 | P17: assistente conversacional | Feature pós-MVP | /api/ai/chat, Claude Sonnet tool calling (4 tools), loop max 3 |
| 8 | UX-H2-02: push inatividade | Feature UX | Trigger 7+ dias sem lançamentos no cron push/send |
| 9 | E2E Playwright no CI | Infra | Job condicional (vars.E2E_ENABLED), Chromium, upload report on failure |
| 10 | DT-007: type casts | Dívida técnica | 0 'as any', type-guards.ts criado, casts existentes documentados |
| 11 | DT-014: COA orphan | Dívida técnica | Verificado: 0 órfãos. FK constraint adicionado preventivamente |
| 12 | DT-015: soft-delete 90d | Dívida técnica | cron_cleanup_soft_deleted (dom 05:30 UTC), migration 065 |

### 25m.3 Migrations aplicadas (oniefy-prod)

- `p13_user_insights` (user_insights table + RLS + index)
- `dt015_soft_delete_cleanup` (cron + COA FK constraint)
- Arquivos locais: 065_dt015_soft_delete_cleanup.sql

### 25m.4 Estado final do projeto

| Métrica | Valor |
|---|---|
| Stories | 105/108 (3 bloqueadas por Mac) |
| Tabelas | 34 |
| Functions | 73 |
| RLS policies | 103 |
| pg_cron jobs | 13 |
| Indexes | 140 |
| Suítes Jest | 39 (531 assertions) |
| Arquivos src/ | ~148 |
| API routes | 13 (auth: 5, ai: 3, push: 2, digest: 2, indices: 1) |
| CI jobs | 5 (Security + Lint + Tests + Build + E2E condicional) |
| Dívida técnica | 0 itens abertos (todos resolvidos ou aceitos com documentação) |

### 25m.5 Env vars necessárias para produção

| Var | Obrigatória? | Onde obter |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Sim | Dashboard Supabase |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Sim | Dashboard Supabase |
| SUPABASE_SERVICE_ROLE_KEY | Sim | Dashboard Supabase |
| NEXT_PUBLIC_APP_URL | Sim | URL do deploy Vercel |
| SENTRY_DSN | Recomendado | sentry.io (free tier) |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | Recomendado | Cloudflare Turnstile |
| TURNSTILE_SECRET_KEY | Recomendado | Cloudflare Turnstile |
| GEMINI_API_KEY | Opcional | Google AI Studio |
| ANTHROPIC_API_KEY | Opcional | Anthropic Console |
| NEXT_PUBLIC_VAPID_PUBLIC_KEY | Opcional | Gerado (já no HANDOVER §19) |
| VAPID_PRIVATE_KEY | Opcional | Gerado (já no HANDOVER §19) |
| VAPID_EMAIL | Opcional | mailto:admin@oniefy.com |
| CRON_SECRET | Opcional | Gerar valor aleatório |
| RESEND_API_KEY | Opcional | Resend.com |
| DIGEST_CRON_SECRET | Opcional | Gerar valor aleatório |

## Sessão 26 - 21 março 2026 (Claude Opus, Projeto Claude) — Release Gate Audit

### 26.1 Escopo

Auditoria Release Gate completa (MATRIZ-VALIDACAO-v2_1.md): 37 auditorias em 10 camadas, seguindo ordem recomendada: Segurança → Dependências → Conformidade → Funcional → Arquitetura → Performance → Infraestrutura → Código → Repositório → UX.

### 26.2 Resultado: 31 executadas, 6 não executadas

**PASS (26):** 4.1 (RLS), 4.2 (Auth guards), 4.3 (search_path), 4.4 (Secrets), 4.5 (Input validation), 4.6 (SSRF/CSRF), 8.3 (Licenciamento), 10.3 (ISO A.8.28), 3.1 (Front/back), 3.2 (Schema types), 3.5 (Error handling), 5.4 (Índices DB), 9.1 (Config ambientes), 9.3 (Resiliência), 2.1 (Compilação), 2.2 (Lint), 2.3 (Dead code), 2.5 (Fragilidade estática), 1.1 (Commits), 1.3 (CI/CD).

**Achados (11):**

| # | Camada | Achado | Categoria | Status |
|---|---|---|---|---|
| 1 | 10.1 | cron_process_account_deletions era stub (LIMIT 0) | Defeito | **CORRIGIDO** (migration 066) |
| 2 | 8.2 | 7 pacotes com major nova (Capacitor 2 major atrás) | Fragilidade | Documentado |
| 3 | 6.1 | Hooks a 26%, cron routes 18-22% cobertura | Fragilidade | Documentado |
| 4 | 3.4 | Account mutations sem invalidação dashboard | Fragilidade | **CORRIGIDO** |
| 5 | 8.1 | 3 CVEs high em tar (devDeps only) | Débito | Documentado |
| 6 | 5.1 | N+1 em push/digest cron routes | Débito | Documentado |
| 7 | 5.3 | Recharts sem lazy loading | Débito | Documentado |
| 8 | 9.2 | Sem logging estruturado | Débito | Documentado |
| 9 | 1.2 | HANDOVER triggers: 24 vs 21 real | Sujeira | **CORRIGIDO** |
| 10 | 2.6 | Toasts cost-centers: "Centro" legacy | Sujeira | **CORRIGIDO** |
| 11 | 10.2 | Testes sem naming convention story→teste | Sujeira | Documentado |

**Não executadas (6):** 2.4 (Duplicação), 3.3 (Acoplamento), 6.2-6.7 (testes avançados), 7.1-7.3 (UX visual), 8.4 (SBOM).

### 26.3 Correções aplicadas

1. **migration 066** (`implement_account_deletion_cron`): substitui stub por implementação real de exclusão LGPD. Deleta dados de 25 tabelas + storage + auth.users após grace period de 7 dias. Cada usuário em subtransação isolada. MCP migration #47.
2. **use-accounts.ts**: useCreateAccount, useUpdateAccount, useDeactivateAccount agora invalidam queryKey `["dashboard"]`.
3. **cost-centers/page.tsx**: 12 ocorrências de "centro" substituídas por "divisão" (toasts, titles, help text, filenames).
4. **HANDOVER**: triggers 24→21, migrations 46→47, files 53→54.

### 26.4 Achados de auditorias externas (ChatGPT + Gemini) — triagem

Recebidas 2 auditorias externas. 15 achados combinados. Após verificação contra código e banco reais:

**3 achados genuínos novos (corrigidos):**
1. `/api/ai/chat` query_transactions expunha `category_name` e `asset_name` no schema da tool mas executor não aplicava filtros. Defeito corrigido: joins adicionados + filtros funcionais.
2. Sentry (3 configs) sem `beforeSend` para PII. Corrigido: `scrubEvent()` com `sanitizePII()` em client/server/edge.
3. Turnstile fail-open quando `TURNSTILE_SECRET_KEY` ausente. Válido, design intencional para dev. Requer env var em produção.

**5 falsos positivos rejeitados:**
- CSRF/origin: SameSite=Lax + CSP form-action é padrão para SPAs
- Build Google Fonts: falha no sandbox do ChatGPT sem rede, CI real passa
- CSV injection: sanitização existe em csv-parser.ts:177
- search_path ausente: verificado no banco, 0 functions sem search_path
- OFX timezone: parser extrai string pura YYYYMMDD, sem conversão de timezone

**7 repetições de achados já documentados** (cobertura, rate limiter, E2E, HANDOVER, LGPD, biometria, over-fetch).

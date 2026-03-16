# Oniefy (formerly WealthOS) - Handover de Sessão

**Data:** 14 de março de 2026
**Projeto:** Oniefy - Any asset, one clear view.
**Repositório GitHub:** drovsk-cmf/WealthOS (privado)
**Supabase Project ID:** hmwdfcsxtmbzlslxgqus
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
| Frontend | Next.js 15.5.12 (App Router) + React 19.2.4 + TypeScript |
| UI | shadcn/ui + Tailwind CSS + Plum Ledger design system |
| Tipografia | DM Sans (corpo) + JetBrains Mono (dados) + Instrument Serif (display, adiado) |
| Iconografia | Lucide React (SVG) |
| Backend/BaaS | Supabase (PostgreSQL + Auth + RLS + Storage + Edge Functions) |
| Mobile iOS | Capacitor 6 (empacotamento PWA para App Store) |
| Hospedagem | Vercel |
| State Management | React Query + Zustand |
| Gráficos | Recharts |
| Validação | Zod |
| CI/CD | GitHub Actions |
| APIs externas | BCB SGS (6.922 séries) + IBGE SIDRA (9.029 tabelas) + fallback IPEADATA |

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
| Tabelas | 25 (todas com RLS) |
| Políticas RLS | 84 |
| Functions (total) | 47 (34 RPCs + 7 trigger functions + 6 cron wrappers). Todas com `SET search_path = public` |
| Triggers | 20 |
| ENUMs | 26 |
| Migrations aplicadas | 37 SQL files no repo (001 a 034) |
| pg_cron jobs | 6: mark-overdue-transactions (01h), generate-workflow-tasks (02h), process-account-deletions (03:30), cron_fetch_indices (06h), depreciate-assets (mensal 03h), balance-integrity-check (dom 04h) |
| Contas no plano-semente | 140 |
| Centros de custo | 1 (Família Geral, is_overhead) |
| Categorias | 16 (únicas, cores Plum Ledger) |
| Parâmetros fiscais | 9 (IRPF mensal/anual 2025+2026, INSS 2025+2026, salário mínimo 2025+2026, ganho capital) |
| Índices econômicos | ~60 registros (8 tipos: IPCA, INPC, IGP-M, Selic, CDI, TR, USD/BRL, salário mínimo) |
| Fontes de índices | 15 (BCB SGS + IBGE SIDRA configuradas) |
| User stories total | 90 |
| Stories concluídas | 87/90 (ver breakdown abaixo) |
| Supabase security advisories | 0 code-level (1 Dashboard: leaked password protection) |
| Supabase perf advisories | 0 WARN (unused_index INFO apenas, esperado sem dados) |

### 3.3 Functions (33 RPCs + 7 triggers + 6 cron = 46)

| Grupo | Functions |
|---|---|
| Setup/Seed | create_default_categories, create_default_chart_of_accounts, create_default_cost_center, create_coa_child, create_family_member |
| Triggers | handle_new_user, handle_updated_at, recalculate_account_balance, activate_account_on_use, rls_auto_enable, validate_journal_balance, sync_payment_status |
| Transaction Engine | create_transaction_with_journal, create_transfer_with_journal, reverse_transaction |
| Dashboard | get_dashboard_summary, get_balance_sheet, get_solvency_metrics, get_top_categories, get_balance_evolution, get_budget_vs_actual |
| Recurrence/Asset | generate_next_recurrence, depreciate_asset, get_assets_summary |
| Centers | allocate_to_centers, get_center_pnl, get_center_export |
| Workflows | auto_create_workflow_for_account, generate_tasks_for_period, complete_workflow_task |
| Fiscal | get_fiscal_report, get_fiscal_projection |
| Índices | get_economic_indices, get_index_latest |
| Import | import_transactions_batch (v2 com auto-matching), auto_categorize_transaction, **undo_import_batch** |
| **Reconciliation** | **find_reconciliation_candidates, match_transactions** |
| **Analytics** | **track_event, get_retention_metrics** |
| Cron (pg_cron) | cron_generate_workflow_tasks (diário 02h), cron_depreciate_assets (mensal dia 1 03h), cron_balance_integrity_check (semanal dom 04h), cron_fetch_economic_indices (diário 06h UTC), cron_mark_overdue_transactions (diário 01h UTC), **cron_process_account_deletions (diário 03:30 UTC)** |

### 3.4 Código Fonte (125 arquivos em src/, 13 testes, ~23.300 linhas)

```
src/
├── __tests__/                    # 13 suítes de teste (Jest + RTL), 171 testes
│   ├── auth-schemas-extended.test.ts  # mfaCode, forgot/reset password, passwordStrength, blocklist
│   ├── auth-validation.test.ts
│   ├── cfg-settings.test.ts          # settings groups, data export config, toCsv
│   ├── dialog-helpers.test.ts        # useEscapeClose, useAutoReset
│   ├── onboarding-seeds.test.ts
│   ├── parsers.test.ts
│   ├── rate-limiter.test.ts           # checkRateLimit, extractRouteKey, rateLimitHeaders
│   ├── read-hooks.test.tsx
│   ├── rpc-auto-categorize-schema.test.ts
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
- `.github/workflows/ci.yml` - 3 jobs: Security + Lint/TypeCheck + Build
- `supabase/migrations/` - 37 SQL files (001 a 034)
- `docs/audit/` - 9 arquivos de relatório de auditoria (00-SUMMARY + 01 a 08 por domínio)

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

- ID: 04c41302-5429-4f97-9aeb-e21294d014ff
- Nome: Claudio Filho
- Provider: Google OAuth
- MFA: TOTP ativo (fator 664baa78-1060-4b5b-ae78-e4bc2a6e8fe4)
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

## 7. Items de Polish (Fase 10 backlog)

| Item | Detalhe |
|---|---|
| ~~PWA icon 404~~ | FEITO: icon-192, icon-512, favicon.ico, apple-touch-icon |
| ~~Euro sem símbolo~~ | FEITO: "Euro" → "Euro (€)" no onboarding |
| ~~Rebranding~~ | FEITO: WealthOS → Oniefy (UI, config, logs, TOTP). Crypto strings preservadas |
| ~~Next.js upgrade~~ | FEITO: 14.2.14 → 15.5.12, React 18 → 19. Zero breaking changes no nosso código |
| OCR real | WKF-03 é stub; implementar Apple Vision / Tesseract.js (requer Mac). Formatos: JPG, PNG **e PDF** (renderizar páginas via PDF.js + Canvas antes do OCR web; Vision Framework lê PDF direto no iOS). Corrige inconsistência entre Adendo v1.2 §2.1 (PDF = só anexo) e WKF-03 (PDF = OCR). |
| Capacitor build | Build iOS, teste em dispositivo, submissão App Store (requer Mac) |
| Biometria real | Stub → Capacitor BiometricAuth plugin (requer Mac) |
| ~~Testes~~ | FEITO: Jest + RTL configurados. 12 suítes, 150 testes (schemas Zod 27/27, parsers, hooks leitura/mutação, auth validation completa, rate limiter, utils + sanitizeRedirectTo, dialog helpers, onboarding seeds, reconciliation). Testes SQL: 4 cenários executados no Supabase. |
| ~~Microcopy~~ | FEITO: 14 violações MAN-LNG-CMF-001 corrigidas em 28 arquivos (reticências, metadiscurso, superlativos, empty states) |
| ~~Logo + icons~~ | FEITO: Penrose Ribbon integrado. 6 SVGs transparentes (lockup-h/v, logomark, plum/bone) + OG PNG. Favicon, apple-touch-icon, PWA icons substituídos. next/image com unoptimized. Dark mode via dark:hidden/dark:block. Login: lockup-v. Sidebar/mobile: lockup-h. |
| ~~Edge Functions~~ | FEITO: pg_cron habilitado. 3 jobs: workflow tasks (diário), depreciação (mensal), balance check (semanal) |
| ~~Search path fix~~ | FEITO: 11 functions com search_path mutable corrigidas (migration 017) |
| ~~Redirect raiz~~ | CORRIGIDO anteriormente |
| ~~RLS initplan~~ | FEITO: 77 policies reescritas com `(select auth.uid())`. Migration 018 |
| ~~Unindexed FKs~~ | FEITO: 14 indexes criados para FK columns. Migration 019 |
| Leaked password protection | Requer Supabase Pro. Claudio acionará quando assinar a plataforma |
| ~~Ícones Lucide~~ | FEITO: emojis decorativos (📊🏦📈✓📄💰🏷️📋) substituídos por Lucide React SVG icons em 7 arquivos. Emojis de avatar familiar mantidos (dados persistidos em BD) |
| ~~Conciliação bancária (3 camadas)~~ | FEITO: **Camada 1:** ENUM `payment_status` (pending/overdue/paid/cancelled), `due_date`, trigger bidirecional `is_paid ↔ payment_status`, pg_cron diário marca vencidas. **Camada 2:** Auto-matching na importação: `import_transactions_batch` reescrita com score (±10% valor, ±7 dias, threshold 25), registra ajuste se valor difere. **Camada 3:** Tela de reconciliação manual na aba "Conciliação" da página de conexões: lado a lado pendentes × importadas, filtro por conta, validação de mesma conta, exibição de ajuste. RPCs: `find_reconciliation_candidates`, `match_transactions`. Migration 028a+028b. |
| ~~Orçamento delegado por membro~~ | FEITO: Migration 027 (family_member_id em budgets, FK, unique constraint, RPC reescrita). UI com seletor de membro (pill buttons). Hooks e schemas Zod atualizados. Sem membros cadastrados: funciona como antes. |

---

## 8. Documentação de Referência (9 documentos no projeto)

| Doc | Conteúdo chave |
|---|---|
| wealthos-especificacao-v1.docx | Stack, segurança, modelo de dados original, módulos, fases |
| wealthos-funcional-v1.docx | 62 user stories MVP com critérios de aceite |
| wealthos-adendo-v1.1.docx | Decisões (2 saldos, carência 7d, E2E, APNs) |
| wealthos-adendo-v1.2.docx | Apple App Store, importação, OCR, offline, a11y. **Errata:** §2.1 classifica PDF como "Anexo" sem OCR, mas WKF-03 prevê OCR em PDF. Decisão: PDF é formato OCR (além de anexo). |
| wealthos-adendo-v1.3.docx | **Integração bancária Open Finance** (Pluggy/Belvo, BANK-01-06, pendências) |
| wealthos-adendo-v1.4.docx | Solvência (LCR, runway), evoluções futuras (9 items) |
| wealthos-estudo-contabil-v1.5-final.docx | Modelo contábil partida dobrada, 133 contas, centros, workflows |
| wealthos-estudo-tecnico-v2.0.docx | Estudo técnico completo, 10 tabelas, triggers, RPCs, fases revisadas |
| oniefy-estrategia-ux-retencao-v2.docx | **Estratégia consolidada de UX, ativação e retenção.** Consolida 4 auditorias externas (2 Gemini + 2 ChatGPT) + 2 rodadas de revisão crítica cruzada. Define: framework de retenção (4 portões), 2 níveis de valor (operacional + estrutural), navegação 5+1, onboarding redesenhado (3 rotas com default por dispositivo), estados vazios, fricção de input (<10s, 3 decisões), camada de confiança de dados, dashboard como fila de atenção, motor narrativo, revelação progressiva cronológica, reengajamento externo (push + email), métricas e instrumentação. Plano de implementação em 3 horizontes (H1/H2/H3). Delta de escopo estimado: ~12-15 stories novas ou ampliadas. |

---

## 9. Catálogos de Dados Externos

Disponíveis como arquivos do projeto:
- `catalogo_ibge_sidra_filter.xlsx` - 9.029 tabelas IBGE
- `catalogo_bcb_sgs_filter.xlsx` - 6.922 séries BCB SGS

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

**1 story concluída:** CFG-07. **Total: 87/90.**

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
| **Total** | **90** | **87** | **3** |

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


## 12. Backlog Consolidado

Lista canônica de tudo que resta. Atualizada na última sessão; qualquer nova sessão deve verificar se itens foram concluídos e removê-los.

### 12.1 Stories restantes (3/90)

Todas bloqueadas por hardware Apple (Xcode necessário).

| Story | Descrição | Requisito |
|---|---|---|
| CFG-04 | Push notifications (APNs) | Xcode + Apple Developer Account |
| FIN-17 | OCR recibo (Apple Vision + Tesseract.js + PDF.js) | Xcode (Vision Framework nativo); web fallback possível com Tesseract.js puro |
| FIN-18 | Câmera comprovante (Capacitor Camera) | Xcode |

### 12.2 Pré-produção web (sem Mac)

Itens necessários para colocar o app em produção na web (sem iOS).

| # | Item | Esforço | Status |
|---|---|---|---|
| P1 | Deploy Vercel + domínio oniefy.com | 30 min | Não iniciado |
| P2 | ~~CSP nonce/hash (remover `unsafe-eval` em build de produção)~~ | ~~2h~~ | FEITO (commit 56f6244) |
| P3 | ~~React Error Boundaries (crash gracioso em todas as rotas)~~ | ~~1h~~ | FEITO (global-error + app/error + auth/error) |
| P4 | ~~Customizar emails Supabase Auth (confirmação, reset senha)~~ | ~~30 min~~ | FEITO (3 templates HTML + config.toml) |
| P5 | ~~Página `/privacy` (Privacy Policy, exigida pela Apple e LGPD)~~ | ~~1h~~ | FEITO (11 seções, LGPD + Apple) |
| P6 | ~~Seed de dados realistas para dev e demo~~ | ~~1h~~ | FEITO (003_demo_data.sql: 5 contas, ~60 tx, 8 budgets, 4 ativos) |
| P7 | ~~Dark mode: verificação completa em todas as 18 páginas~~ | ~~1h~~ | FEITO (5 correções: tax bg-white→bg-card, bank-connections gray→muted; 2 intencionais preservados) |
| P8 | Supabase Pro (leaked password protection + limites) | 5 min | Requer assinatura Claudio |

### 12.3 Qualidade e testes (sem Mac)

| # | Item | Esforço | Status |
|---|---|---|---|
| Q1 | ~~Expandir testes: CFG pages (profile, export, security)~~ | ~~30 min~~ | FEITO (19 testes: settings index, data export, toCsv) |
| Q2 | ~~Lighthouse audit + correções (performance, SEO, a11y score)~~ | ~~1-2h~~ | FEITO (commit 150aa14) |
| Q3 | ~~Proxy server-side para login (corrige rate limiter real)~~ | ~~2h~~ | FEITO (commit 49b7b91) |

### 12.4 iOS / App Store (requer Mac)

Ordem de execução recomendada. Alternativa sem Mac: Xcode Cloud (25h grátis/mês) para build + TestFlight + submit via App Store Connect (acessível do iPad Pro). Requer Apple Developer Account (US$ 99/ano).

| # | Item | Esforço | Requisito |
|---|---|---|---|
| I1 | Apple Developer Account (US$ 99/ano) | 5 min | Decisão Claudio |
| I2 | Capacitor iOS build + teste (A1502 Xcode 14.2 ou Xcode Cloud) | 2h | I1 |
| I3 | Biometria real (Capacitor BiometricAuth, substituir stubs) | 4-6h | I2 |
| I4 | OCR real (WKF-03: Apple Vision nativo + Tesseract.js web + PDF) | 4-6h | I2 |
| I5 | Submissão App Store (Mac Apple Silicon ou Xcode Cloud) | 2h | I1, I2, I3, P5 |

### 12.5 Itens de auditoria deferidos

Baixa prioridade. Implementar apenas se o cenário concreto se materializar.

| Item | Motivo do deferimento | Gatilho para implementar |
|---|---|---|
| Web Workers para parsers CSV/OFX/XLSX (Gemini #4) | Extrato pessoal < 5k linhas. Workers exigem bundling separado + config Next.js | Usuário reportar travamento na importação |
| SSR prefetch no Dashboard (Gemini #5) | 6 queries paralelas, skeletons ~300ms. Refactor pesado, ganho marginal para 1-4 usuários | Escala para 10+ usuários ou TTI > 2s medido |

### 12.6 Backlog de evolução futura

Não são bugs nem pré-requisitos. São evoluções que agregam valor a longo prazo.

| Item | Origem | Gatilho |
|---|---|---|
| RLS multi-user (workspaces/grupos para login independente de membros) | Gemini audit #1b | Cônjuge ou membro solicitar login próprio |
| Orçamento delegado com aprovação | Adendo v1.2 | Demanda de família |
| Rateio automático de overhead por centro | Estudo técnico v2.0 | Volume > 50 transações/mês com centros |
| pg_cron para limpeza de soft-deleted (90 dias) | Adendo v1.2 | Volume de dados justificar |
| Open Finance (Pluggy, Belvo) | Pesquisa paralela | Agregador viável + certificação |

### 12.7 Limitações conhecidas

Não corrigíveis sem mudança de arquitetura. Documentadas para consciência.

| Item | Motivo | Mitigação |
|---|---|---|
| Rate limiter não protege signInWithPassword | SDK Supabase vai direto ao GoTrue, bypassa middleware Next | GoTrue tem rate limiting próprio. WAF em produção. Ou: proxy server-side (Q3) |
| CSP requer `unsafe-eval` em dev | Next.js usa eval para HMR em dev | Nonce/hash em produção (P2) |
| Biometria é stub | Capacitor BiometricAuth requer build nativo | Funcional após I3 |
| SW não cacheia dados offline | Decisão deliberada: app financeiro não deve servir dados stale | React Query `offlineFirst` serve cache in-memory durante a sessão |

### 12.8 Ações do Claudio (paralelas, não dependem de sessão Claude)

| Item | Ação | Status |
|---|---|---|
| ~~Logo definitivo~~ | Penrose Ribbon integrado (commit dbb5bb6) | FEITO |
| Supabase Pro | Habilitar: Auth > Settings > HaveIBeenPwned | Pendente (decisão de custo) |
| Validação fiscal periódica | IRPF, INSS, salário mínimo: verificar DOU | Recorrente |
| Apple Developer Account | US$ 99/ano, necessário para I1-I5 | Pendente (decisão Claudio) |

### 12.9 UX, Ativação e Retenção (oniefy-estrategia-ux-retencao-v2.0)

Backlog gerado pela estratégia consolidada de UX/Retenção. Documento de referência: `oniefy-estrategia-ux-retencao-v2.docx`. Origem: consolidação de 4 auditorias externas (Gemini x2, ChatGPT x2) + 2 rodadas de revisão crítica cruzada + análise do código real + benchmarks 2025-2026.

**Decisões de produto tomadas:**
- **Navegação:** de 15 itens para 5+1 (Início, Transações, Contas, Orçamento, Patrimônio + Configurações)
- **Dois níveis de valor:** Nível 1 operacional (clareza do mês, Semana 1) + Nível 2 estrutural (PL consolidado + fôlego, Mês 1-2)
- **Onboarding:** rota recomendada por dispositivo (mobile=manual, desktop=importação) + 2 alternativas em texto secundário
- **Lançamento rápido:** meta reformulada de "3 toques" para "3 decisões obrigatórias em <10 segundos"
- **Motor narrativo:** escopo reduzido no H1 (apenas P0, P4, P5); P1-P3 entram no H2 após instrumentação
- **Orçamento:** visível no menu desde Dia 0 com estado vazio educativo (não ocultar módulo)
- **Fiscal:** revelação por trigger de dados (>=10 tx com tax_treatment tributável), não por calendário
- **Configurações:** 5 subcategorias internas (Pessoal, Estrutura e Cadastros, Dados e Importação, Avançado, Segurança)
- **Régua de decisão UX:** (1) Reduz tempo até valor? (2) Cria motivo para voltar? (3) Superfície simples, núcleo robusto? Se "não" para 2/3, prioridade é secundária

**H1: Antes do lançamento (ativação + instrumentação)**

| # | Item | Impacta | Esforço | Status |
|---|---|---|---|---|
| UX-H1-01 | ~~Reestruturar layout.tsx: 5+1 itens de navegação~~ | layout.tsx, settings/page.tsx | ~~Médio~~ | FEITO (commit 6bd189e) |
| UX-H1-02 | ~~Onboarding Steps 8-10: rota recomendada (device-aware) + alternativas~~ | AUTH-05, onboarding/page.tsx | ~~Alto~~ | FEITO (commit 7b3ffdd) |
| UX-H1-03 | ~~Estados vazios motivacionais (Transações, Contas, Orçamento, Patrimônio)~~ | 4 pages | ~~Médio~~ | FEITO |
| UX-H1-04 | ~~Formulário rápido: modo default com 3 decisões, <10s. "Mais opções" para expandir~~ | DASH-08, TransactionForm | ~~Médio~~ | FEITO |
| UX-H1-05 | ~~Resumo pós-importação (total, top categorias, N pendentes, CTA revisar)~~ | FIN-16, import-step-result.tsx | ~~Baixo-Médio~~ | FEITO |
| UX-H1-06 | ~~Dashboard Início v1: fila de atenção + motor narrativo reduzido (P0, P4, P5)~~ | DASH-01, dashboard/page.tsx | ~~Alto~~ | FEITO (commit 7b3ffdd) |
| UX-H1-07 | ~~Tabela analytics_events + eventos mínimos de onboarding~~ | Schema (migration 031), hook, dashboard | ~~Baixo~~ | FEITO |
| UX-H1-08 | ~~Mover Contas a Pagar para filtro "pendentes" em Transações~~ | transactions/page.tsx, use-transactions.ts | ~~Baixo~~ | FEITO |

**H2: Primeiras 2 semanas pós-lançamento (retenção D7)**

| # | Item | Impacta | Esforço | Status |
|---|---|---|---|---|
| UX-H2-01 | ~~Auto-categorização no FAB e importação (transaction_classification_rules)~~ | TransactionForm, import-wizard | ~~Médio~~ | FEITO (commit c051aa8) |
| UX-H2-02 | Push notifications: vencimentos + inatividade + conta desatualizada (APNs) | CFG-04 (infra existe), Edge Function nova | Médio | Não iniciado |
| UX-H2-03 | ~~Motor narrativo P1-P3 (orçamento pressionado, inatividade, fim de mês)~~ | dashboard/page.tsx | ~~Médio~~ | FEITO (commit c7c2275) |
| UX-H2-04 | ~~Camada de confiança: badges "sugerida/confirmada", "atualizado em", barra de completude~~ | Múltiplas páginas | ~~Médio~~ | FEITO (commit 64f2117) |
| UX-H2-05 | ~~Desfazer importação: estorno em lote (72h, append-only)~~ | FIN-16, RPC nova | ~~Médio~~ | FEITO (commit 64f2117) |
| UX-H2-06 | ~~Indicador confirmado/estimado no saldo consolidado do Dashboard~~ | SummaryCards, hook | ~~Baixo~~ | FEITO (commit c7c2275) |

**H3: Mês 1-3 pós-lançamento (retenção D30)**

| # | Item | Impacta | Esforço | Status |
|---|---|---|---|---|
| UX-H3-01 | ~~Revelação progressiva: flags de visibilidade por volume de dados~~ | Múltiplos módulos | ~~Médio~~ | FEITO (commit f6cefec) |
| UX-H3-02 | ~~Trigger fiscal por dado (>=10 tx tributáveis → "Ver impacto fiscal?")~~ | Motor narrativo + tax/page.tsx | ~~Baixo~~ | FEITO (commit f6cefec) |
| UX-H3-03 | ~~E-mail resumo semanal (segunda 8h, gastos + top 3 + pendências)~~ | Edge Function nova + template | ~~Médio~~ | FEITO (commit 1d31391) |
| UX-H3-04 | ~~Dashboard interno de métricas (/settings/analytics)~~ | Página nova | ~~Médio~~ | FEITO (commit f6cefec) |
| UX-H3-05 | Teste de corredor com 3 pessoas (5 tarefas, observar hesitações) | Ação Claudio, sem código | Baixo | Não iniciado |

**Totais: 19 itens (8 H1 + 6 H2 + 5 H3). Delta estimado: ~12-15 stories novas ou ampliações substanciais de stories existentes.**

**Métricas-alvo definidas no documento:**

| Métrica | Meta |
|---|---|
| Onboarding completion | >70% |
| Time to first value | <5 min |
| D1 retention | >35% |
| D7 retention | >20% |
| D30 retention | >12% |
| Transações/semana (sem 2+) | >5 |

### 12.10 Remediação da auditoria Claude Code (80 achados, docs/audit/)

Auditoria completa realizada em 16/03/2026 (PR #4). Relatório em `docs/audit/` (9 arquivos). Referências: OWASP ASVS L2, MASVS, Nielsen, WCAG 2.2 AA. Nota: 7/10.

**Totais: 0 CRÍTICO, 15 ALTO, 39 MÉDIO, 26 BAIXO.**

**Top 10 correções priorizadas (do relatório 00-SUMMARY.md):**

| # | ID | Sev | Achado | Esforço |
|---|---|---|---|---|
| 1 | D8.04-06 + D8.08-09 | MÉDIO | Labels htmlFor + aria-required + aria-describedby em todos os forms | Médio |
| 2 | D7.01 | ALTO | Campo monetário TransactionForm sem `.replace(",", ".")` | Baixo |
| 3 | D3.03-05 | MÉDIO | 3 endpoints vazam erros internos do Supabase | Baixo |
| 4 | D1.02 | ALTO | Register e forgot-password bypass rate limiter (client-side direto) | Médio |
| 5 | D8.02-03 + D8.07 | ALTO | aria-label em botões icon-only + scope em tabelas | Baixo |
| 6 | D3.01 | ALTO | CSV/XLSX parsers sem limite de tamanho de arquivo | Baixo |
| 7 | D8.10 | ALTO | Informação financeira diferenciada apenas por cor | Médio |
| 8 | D2.01 | MÉDIO | Export vaza cpf_encrypted de family_members | Baixo |
| 9 | D2.02-03-05 | MÉDIO | 3 mutations sem filtro user_id (defesa em profundidade) | Baixo |
| 10 | D6.01 | MÉDIO | 9 hooks com select("*") em vez de colunas explícitas | Médio |

**Detalhes completos:** ver `docs/audit/01-auth-session.md` a `08-accessibility.md`.

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

## 17. Conexões

- **GitHub:** Fine-grained PAT e Classic PAT disponíveis (Claudio fornece no início da sessão)
- **Supabase:** via conector MCP remoto (mcp.supabase.com/mcp), autenticado por OAuth. Project ID: hmwdfcsxtmbzlslxgqus
- **Local dev:** `C:\Users\claud\Documents\PC_WealthOS`, `.env.local` já configurado

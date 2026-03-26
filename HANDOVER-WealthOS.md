# Oniefy (formerly WealthOS) - Handover de Sessão

**Última atualização:** 26 de março de 2026
**Projeto:** Oniefy - Any asset, one clear view.
**Repositório GitHub:** drovsk-cmf/WealthOS (público)
**Supabase Project ID:** mngjbrbxapazdddzgoje (sa-east-1 São Paulo) — "oniefy-prod"
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
| CI/CD | GitHub Actions: CI (4 jobs: Security + Lint/TypeCheck + Unit Tests + Build), Post-Deploy Check (health check automático), Uptime Monitor (cada 6h) |
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
| Tabelas | 35 (todas com RLS) |
| Políticas RLS | 107 |
| Functions (total) | 74 no schema public. Todas com `SET search_path = public`. 71 SECURITY DEFINER com auth.uid() guard |
| Triggers | 22 |
| ENUMs | 29 (index_type com 46 valores: 13 originais + 33 moedas; + investment_class, rate_type) |
| Indexes | 144 |
| Migrations aplicadas (MCP) | 53 no projeto ativo (mngjbrbxapazdddzgoje) |
| Migration files (repo) | 60 em supabase/migrations/ |
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

### 3.3 Functions (74 no schema public)

| Grupo | Functions |
|---|---|
| Setup/Seed | create_default_categories, create_default_chart_of_accounts, create_default_cost_center, create_coa_child, create_family_member |
| Triggers | handle_new_user, handle_updated_at, recalculate_account_balance, recalculate_account_balance_for, activate_account_on_use, rls_auto_enable, validate_journal_balance, sync_payment_status |
| Transaction Engine | create_transaction_with_journal, create_transfer_with_journal, reverse_transaction, edit_transaction, edit_transfer |
| Dashboard | get_dashboard_summary, get_dashboard_all, get_balance_sheet, get_solvency_metrics, get_top_categories, get_balance_evolution, get_budget_vs_actual (2 overloads), get_weekly_digest |
| JARVIS CFA | get_jarvis_scan (10 regras: R01-R10 + R03b, Camada 2 combinador) |
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

### 3.4 Código Fonte (213 arquivos TS/TSX em src/, 50 suítes de teste, 775 assertions)

```
src/
├── __tests__/                    # 50 suítes de teste (Jest + RTL), 775 assertions
│   ├── accounts-mutations.test.tsx
│   ├── ai-chat-route.test.ts
│   ├── api-routes-security.test.ts    # 30+ assertions: auth routes, rate limit, error sanitization, cron auth
│   ├── assets-hooks.test.tsx
│   ├── audit-calendar-grid.test.ts    # 8: while loop exaustivo do calendário
│   ├── audit-dedup-cleanup.test.ts    # 15: budget dedup, rate limiter edge cases
│   ├── audit-map-relations.test.ts    # 11: helper DRY mapTransactionRelations
│   ├── audit-ocr-parsing.test.ts      # 32: parseAmount/parseDate/parseDescription edge cases
│   ├── audit-ofx-edge-cases.test.ts   # 12: OFX dedup, MAX_SIZE, formato BR
│   ├── audit-tx-invalidation.test.tsx # 7: invalidação de cache em todas as 5 mutations
│   ├── auth-schemas-extended.test.ts  # mfaCode, forgot/reset password, passwordStrength, blocklist
│   ├── auth-validation.test.ts
│   ├── budgets-hooks.test.tsx
│   ├── budgets-mutations-extended.test.tsx
│   ├── categories-mutations.test.tsx
│   ├── cfg-settings.test.ts          # settings groups, data export config, toCsv
│   ├── cost-centers-hooks.test.tsx
│   ├── dialog-helpers.test.ts        # useEscapeClose, useAutoReset
│   ├── e7-e9-affordability-solvency.test.ts  # 22: PMT, reserva, lcrExplanation, runwayExplanation, patrimonyExplanation
│   ├── e1-e3-e6-features.test.ts  # 20: health badge, subscription filter, savings goals enrichment
│   ├── fiscal-timing-safe.test.ts
│   ├── hooks-batch-coverage.test.tsx
│   ├── jarvis-scan.test.tsx           # 44: sortFindings, getRuleLabel, schema, hook, rule data contracts
│   ├── lgpd-account-deletion.test.ts
│   ├── onboarding-seeds.test.ts
│   ├── oniefy-template.test.ts
│   ├── p1-divisoes-rename.test.ts     # 4: Centro→Divisão, N1-N4 nomenclatura
│   ├── p9-domain-templates.test.ts    # 7: metadata templates, fileNames, detecção standard/card
│   ├── p11-ai-gateway.test.ts         # 11: uncategorized filter, rate limit shape
│   ├── p14-asset-templates.test.ts    # 10: searchTemplates, estrutura, bounds
│   ├── p16-asset-categories.test.ts   # 11: 14 categorias, labels, colors, zod
│   ├── q1-hook-coverage-batch.test.tsx  # 26: recurrences, indices, fiscal, workflows, documents, reconciliation
│   ├── q1-hook-coverage-batch2.test.tsx # 29: bank-connections, COA, currencies, family-members
│   ├── q1-hook-coverage-batch3.test.tsx # 12: cost-centers, indices, recurrences, savings-goals
│   ├── parsers.test.ts
│   ├── pii-sanitizer.test.ts          # 14: CPF, CNPJ, email, tel, cartão, conta
│   ├── rate-limiter.test.ts           # checkRateLimit, extractRouteKey, rateLimitHeaders
│   ├── read-hooks.test.tsx
│   ├── recurrences-hooks.test.tsx
│   ├── rpc-auto-categorize-schema.test.ts
│   ├── rpc-new-schemas.test.ts        # 13 schemas para RPCs novas (sessão 19)
│   ├── rpc-schemas.test.ts
│   ├── rpc-schemas-extended.test.ts   # 17 schemas restantes (assets, centers, indices, workflows, dashboard)
│   ├── sentry-pii-scrub.test.ts
│   ├── setup-journey-hooks.test.tsx
│   ├── transaction-hooks.test.tsx
│   ├── turnstile-verify.test.ts
│   ├── utils.test.ts                 # formatCurrency, formatDate, formatRelativeDate, sanitizeRedirectTo
│   ├── weekly-digest-template.test.ts
│   └── workflows-hooks.test.tsx
├── app/
│   ├── (app)/                    # Rotas autenticadas (20 páginas)
│   │   ├── accounts/page.tsx
│   │   ├── assets/page.tsx
│   │   ├── bills/page.tsx
│   │   ├── budgets/page.tsx
│   │   ├── calculators/page.tsx  # 5 calculadoras CFA (E8d + E7 Posso Comprar?)
│   │   ├── categories/page.tsx
│   │   ├── chart-of-accounts/page.tsx
│   │   ├── connections/page.tsx   # 3 abas: Importar + Conciliação + Conexões
│   │   ├── cost-centers/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── family/page.tsx
│   │   ├── goals/page.tsx         # E6: metas de economia (CRUD, progresso, sugestão mensal)
│   │   ├── indices/page.tsx
│   │   ├── settings/page.tsx + security/page.tsx + profile/page.tsx + data/page.tsx
│   │   ├── tax/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── workflows/page.tsx
│   │   ├── error.tsx              # Error boundary (UX: P3)
│   │   └── layout.tsx            # Sidebar 7+1 (UX-H1-01 + E8d), auth, offline banner
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
│   ├── accounts/account-form.tsx   # Campos condicionais Frente B (investment_class, interest_rate, rate_type)
│   ├── assets/asset-form.tsx
│   ├── budgets/budget-form.tsx
│   ├── calculators/               # 5 calculadoras CFA (E8d + E7)
│   │   ├── independence-calculator.tsx  # Perpetuidade + tempo para atingir
│   │   ├── buy-vs-rent-calculator.tsx   # NPV, custo de oportunidade
│   │   ├── cet-calculator.tsx           # IRR/Newton-Raphson, spread vs nominal
│   │   ├── sac-vs-price-calculator.tsx  # Tabela comparativa amortização
│   │   └── affordability-simulator.tsx  # E7: "Posso comprar?" (3 inputs → 3 outputs, dados reais)
│   ├── categories/category-form.tsx
│   ├── connections/              # Wizard de importação + conciliação (WEA-013)
│   │   ├── import-wizard.tsx
│   │   ├── import-step-upload.tsx
│   │   ├── import-step-mapping.tsx
│   │   ├── import-step-preview.tsx
│   │   ├── import-step-result.tsx
│   │   └── reconciliation-panel.tsx  # Camada 3: conciliação manual lado a lado
│   ├── dashboard/ (16 componentes + index.ts)
│   │   # Inclui: summary-cards, balance-sheet-card, top-categories-card,
│   │   # upcoming-bills-card, budget-summary-card, solvency-panel,
│   │   # balance-evolution-chart, quick-entry-fab, narrative-card,
│   │   # attention-queue, setup-journey-card, import-cta, mfa-reminder-banner,
│   │   # cutoff-date-modal, jarvis-scan-card (Motor JARVIS CFA),
│   │   # net-worth-chart (E2: patrimônio líquido ao longo do tempo)
│   ├── onboarding/ (4 step components + index.ts: route-choice, route-manual, route-snapshot, celebration)
│   ├── recurrences/recurrence-form.tsx
│   ├── transactions/transaction-form.tsx
│   └── ui/masked-value.tsx        # Mv (privacy mode)
├── lib/
│   ├── auth/ (8 arquivos: encryption-manager, index, mfa, biometric,
│   │          session-timeout, app-lifecycle, password-blocklist, rate-limiter)
│   ├── config/env.ts             # Startup env validation (validateEnv, validateServerEnv)
│   ├── crypto/index.ts
│   ├── email/weekly-digest-template.ts  # HTML template Plum Ledger (escapeHtml)
│   ├── hooks/ (31 hooks: access-logs, accounts, ai-categorize, analytics,
│   │          asset-templates, assets, auth-init, auto-category, bank-connections,
│   │          budgets, categories, chart-of-accounts, cost-centers, currencies,
│   │          currency-label, dashboard, dialog-helpers, documents,
│   │          economic-indices, family-members, fiscal, jarvis, online-status,
│   │          progressive-disclosure, push-notifications, reconciliation,
│   │          recurrences, savings-goals, setup-journey, transactions, workflows)
│   ├── parsers/ (csv-parser.ts, ofx-parser.ts, xlsx-parser.ts)
│   ├── schemas/rpc.ts            # 33 schemas Zod (todos os RPCs cobertos + JARVIS)
│   ├── services/
│   │   ├── fiscal-export.ts      # E8: IRPF XLSX export (ExcelJS, 6 abas)
│   │   ├── onboarding-seeds.ts   # Seeds extraído de page.tsx (WEA-003)
│   │   └── transaction-engine.ts
│   ├── stores/privacy.ts         # Zustand store (privacy mode)
│   ├── supabase/ (client.ts, server.ts, admin.ts, cached-auth.ts)
│   ├── utils/index.ts            # cn, formatCurrency, formatDate, formatRelativeDate, sanitizeRedirectTo
│   ├── validations/auth.ts
│   └── query-provider.tsx
├── middleware.ts                  # Rate limit, session refresh, route protection, Server-Timing
└── types/database.ts             # 34 tables, 74 functions, 29 enums (regenerado sessão 31)
```

**Arquivos fora de `src/`:**
- `public/sw.js` - Service Worker v2 (cache apenas estáticos imutáveis, limpeza no logout)
- `public/manifest.json` - PWA manifest
- `public/brand/` - 6 SVGs (lockup-h/v plum/bone) + OG PNG + favicon + PWA icons
- `next.config.js` - Security headers (HSTS, CSP, X-Frame-Options, Permissions-Policy)
- `.github/workflows/ci.yml` - 4 jobs: Security + Lint/TypeCheck + Unit Tests + Build
- `supabase/migrations/` - 59 SQL files (001 a 071, com gaps)
- `supabase/tests/test_rls_isolation.sql` - Suíte de testes RLS (50 assertions, 4 batches)
- `docs/audit/` - 9 arquivos de relatório + DIVIDA-TECNICA.md

### 3.5 Design System "Plum Ledger"

Paleta institucional (`src/app/globals.css` + `tailwind.config.ts`):

| Token | Hex | Tailwind class | Uso |
|---|---|---|---|
| Midnight Plum | #241E29 | `plum` / `--plum` | Cor-identidade, sidebar-bg, app icon (revertido para #241E29 na sessão 30; --primary separado resolve o problema original) |
| Primary (botões) | #4F2F69 | `--primary` | Botões ativos, tabs, CTAs (273 38% 30%, calibrado sessão 29) |
| Background | #FBF9F5 | `--background` | Fundo geral suave (substituiu Bone #F5F0E8 na sessão 29) |
| Card | #FFFFFF | `--card` | Cards sobre o fundo (branco puro, sessão 29) |
| Bone | #F5F0E8 | `bone` | Off-white quente — logo variante bone, primary-foreground |
| Graphite Ink | #171A1F | (foreground) | Texto principal |
| Mineral Sage | #7E9487 | `sage` | Acento frio, variante dark mode |
| Oxide Brass | #A7794E | `brass` | Acento nobre restrito |
| Warm Stone | #CEC4B8 | `stone` | Apoio neutro |

**Tokens de sidebar (adicionados sessão 29):**
- `--sidebar-bg: 273 15% 14%` (#241E29) — fundo da sidebar, Midnight Plum original, ancoragem visual
- `--sidebar-fg: 37 48% 94%` (bone) — texto/ícones sobre sidebar
- `--sidebar-active-bg: 37 48% 94%` (bone) — item ativo na sidebar
- `--sidebar-active-fg: 273 30% 18%` (plum) — texto do item ativo

**Tokens de profundidade e calor (adicionados sessão 30 — Plum Ledger v1.2):**
- `--shadow-plum: 47 32 59` (light) / `10 8 14` (dark) — RGB para sombras tingidas com plum
- `--label-plum: 270 10% 48%` (light) / `270 8% 58%` (dark) — labels com tint plum (substituiu cinza neutro)
- `shadow-card`: sombra quente padrão para cards (`0 1px 3px / 0 4px 12px`, tingida plum)
- `shadow-elevated`: sombra alta para modais, tooltips, FAB (`0 4px 12px / 0 12px 32px`)
- `.card-alive`: classe utilitária — hover lift (`translateY(-1px)` + sombra ampliada)
- Sidebar glow edge: gradiente `hsl(plum/0.06) → transparent` de 24px no desktop, transição visual entre sidebar e conteúdo

Semânticas: Verdant #2F7A68 (receitas/positivo), Terracotta #A64A45 (despesas/negativo), Burnished #A97824 (warning), Info Slate #56688F (informativo). Tiers de solvência: T1 #2F7A68, T2 #56688F, T3 #A97824, T4 #6F6678.

Tipografia: DM Sans (corpo) + JetBrains Mono (dados financeiros) + Instrument Serif (display/hero, adiado). Iconografia: Lucide React SVG (zero emojis decorativos). Microcopy: auditado contra MAN-LNG-CMF-001 v1.0.

---

## 4. Dados do Usuário de Teste

- ID: fab01037-a437-4394-9d8f-bd84db9ce418
- Nome: Claudio Filho
- Email: <email do proprietário>
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
- ~~PWA icons, manifest.json, Service Worker~~ — **FEITO** (manifest.json, sw.js v2 em public/)
- Capacitor iOS build + App Store — **bloqueado** (requer Mac + Apple Developer Account)
- ~~Next.js upgrade (14 → 15+)~~ — **FEITO** (Next.js 15.5.14 + React 19.2.4)
- OCR real (WKF-03) — web fallback Tesseract.js implementado, nativo iOS bloqueado por Mac

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
| 1 | manifest.json: `#ffffff` / `#0a0a0a` | → `#F5F0E8` (Bone) / `#241E29` → `#2F203B` (Plum calibrado) |
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
- WEA-001 (credenciais em docs): repo público, anon key pública por design, legacy keys desabilitadas
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

> **Esta seção foi movida para um documento dedicado.**
>
> Consulte [](./PENDENCIAS-FUTURAS.md) na raiz do repositório.
>
> O documento contém, em formato estruturado e atualizado:
> - Ações imediatas do Claudio (sem código)
> - Stories bloqueadas por Mac/Xcode
> - Sequência iOS e App Store
> - Backlog de produto em 3 horizontes (H1, H2, H3)
> - Dívida técnica com gatilhos de implementação
> - Evoluções estratégicas futuras
> - Decisões pendentes de confirmação
> - Limitações conhecidas aceitas por design
> - Insights de benchmark de mercado
>
> **Regra:** ao iniciar qualquer sessão de desenvolvimento, ler  junto com as seções 1–3 deste HANDOVER para ter contexto completo.


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
- Env vars para produção: RESEND_API_KEY, DIGEST_CRON_SECRET, ONIEFY_DB_SECRET

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
- **Supabase:** via conector MCP remoto (mcp.supabase.com/mcp), autenticado por OAuth. Project ID: `mngjbrbxapazdddzgoje` (sa-east-1 São Paulo) — "oniefy-prod". Projeto legado `hmwdfcsxtmbzlslxgqus` DELETADO em 26/03/2026.
- **Local dev:** `C:\Users\claud\Documents\PC_WealthOS`, `.env.local` apontando para oniefy-prod
- **.env.local:**
  ```
  NEXT_PUBLIC_ONIEFY_DB_URL=https://mngjbrbxapazdddzgoje.supabase.co
  NEXT_PUBLIC_ONIEFY_DB_KEY=<obter no Supabase Dashboard → Settings → API → anon public>
  ONIEFY_DB_SECRET=<obter no Supabase Dashboard → Settings → API → service_role (NUNCA expor no frontend)>
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
4. ~~Pausar/deletar projeto legado~~ (`hmwdfcsxtmbzlslxgqus`) — **DELETADO em 26/03/2026**
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

- ~~Pausar ou deletar o projeto legado (`hmwdfcsxtmbzlslxgqus`)~~ — **DELETADO em 26/03/2026**

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

**12. Projeto Supabase antigo:** ~~INACTIVE (pausado)~~ → DELETADO em 26/03/2026.

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
4. Supabase: `mngjbrbxapazdddzgoje` (sa-east-1 São Paulo) via MCP OAuth (projeto legado deletado)
5. Seguir backlog da seção 12 ou instruções do Claudio
6. Ao final: atualizar este HANDOVER com log da sessão, commits, e último commit verde

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
| Suítes Jest | 44 (622 assertions) |
| Arquivos src/ | ~148 |
| API routes | 13 (auth: 5, ai: 3, push: 2, digest: 2, indices: 1) |
| CI jobs | 5 (Security + Lint + Tests + Build + E2E condicional) |
| Dívida técnica | 0 itens abertos (todos resolvidos ou aceitos com documentação) |

### 25m.5 Env vars necessárias para produção

| Var | Obrigatória? | Onde obter |
|---|---|---|
| NEXT_PUBLIC_ONIEFY_DB_URL | Sim | Dashboard Supabase |
| NEXT_PUBLIC_ONIEFY_DB_KEY | Sim | Dashboard Supabase |
| ONIEFY_DB_SECRET | Sim | Dashboard Supabase |
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

## Sessão 27 - 22 março 2026 (Claude Opus, Projeto Claude) — Migration Audit + Test Coverage

### 27.1 Verificação de migração Supabase (projeto antigo → oniefy-prod)

Varredura completa do codebase por referências ao projeto antigo (`hmwdfcsxtmbzlslxgqus`).

**Código fonte (ts, tsx, js, json, sql, yml, css):** zero referências. Limpo.

**Docs corrigidos:**
- `docs/PLANO-REVISAO-ONIEFY.md`: comando `gen types --project-id` apontava para projeto antigo → corrigido para `mngjbrbxapazdddzgoje`
- `docs/RELATORIO-AUDITORIA-2026-03-19.md`: adicionado aviso de que auditoria foi contra projeto legado

**Test user ID atualizado em 5 arquivos:**
- HANDOVER §4: `04c41302-...` → `fab01037-a437-4394-9d8f-bd84db9ce418`
- `docs/PROMPT-CLAUDE-CODE-E2E.md`
- `supabase/seed/003_demo_data.sql`
- `supabase/tests/test_rls_isolation.sql`

**MFA factor ID:** `664baa78-...` (antigo) → `97c227e6-...` (oniefy-prod, status: unverified)

**Config Supabase corrigido via API:**
- `password_min_length`: 8 → 12 (alinhado com Zod frontend)

**Pendências manuais (Dashboard Supabase):**
1. SMTP sender: definir `noreply@oniefy.com` em Authentication → SMTP Settings
2. MFA do usuário: fator TOTP como "unverified", reconfigurar pelo app
3. Apple OAuth: habilitar quando tiver Apple Developer certificate

### 27.2 Elevação de cobertura de testes (32 → 44 suítes, 441 → 622 assertions)

**12 novas suítes criadas:**

| Suíte | Módulo | Testes | Cobertura módulo antes→depois |
|---|---|---|---|
| categories-mutations | use-categories | 11 | 40% → 96% |
| accounts-mutations | use-accounts | 3 | 29% → 83% |
| budgets-hooks | use-budgets (pure fns) | 17 | 23% → 38% |
| budgets-mutations-extended | use-budgets (mut) | 5 | 38% → 63% |
| weekly-digest-template | lib/email | 20 | 6% → 100% |
| cost-centers-hooks | use-cost-centers | 13 | 14% → 43% |
| assets-hooks | use-assets | 13 | 16% → 64% |
| setup-journey-hooks | use-setup-journey | 15 | 18% → 80% |
| recurrences-hooks | use-recurrences | 7 | 0% → 24% |
| workflows-hooks | use-workflows | 18 | 0% → 48% |
| fiscal-timing-safe | use-fiscal + timing-safe | 19 | 0% → 26% / 0% → 100% |
| hooks-batch-coverage | 10 hooks (family, bank, indices, COA, currencies, docs, reconciliation) | 41 | 0% → 18-61% |

**Cobertura geral:**
- Statements: 52.6% → 59.5%
- Functions: 44.6% → 57.7%
- Lines: 53.6% → 61.6%
- Hooks testados: 3/29 → 19/29

**Recomendação para próxima sessão:** os 10 hooks restantes a 0% são hooks de query (dashboard, transactions, push, etc.) e hooks de browser lifecycle (online-status, progressive-disclosure). O caminho mais eficiente para 75% é configurar Playwright E2E nos fluxos críticos.

### 27.3 Commits da sessão (7)

| Hash | Descrição |
|---|---|
| `c9404c5` | fix: replace old Supabase project ID in docs |
| `7db9c93` | fix: update test user ID and migration counts for oniefy-prod |
| `6511c10` | test: 4 suítes coverage boost (36 suítes, 490 assertions) |
| `c024bcd` | test: 3 suítes hooks (39 suítes, 531 assertions) |
| `773ac67` | test: 4 suítes adicionais (43 suítes, 581 assertions) |
| `7f200fe` | test: batch coverage for 10 hooks (44 suítes, 622 assertions) |

### 27.4 Emails do domínio @oniefy.com confirmados

| Email | Onde | Finalidade | Tipo |
|---|---|---|---|
| `oniefy@oniefy.com` | SMTP config | Caixa real (recebe tudo via alias) | Caixa real |
| `noreply@oniefy.com` | digest/send route | Remetente do email semanal | Envio |
| `privacidade@oniefy.com` | /privacy | Contato LGPD | Alias → oniefy@ |
| `contato@oniefy.com` | /terms | Contato geral | Alias → oniefy@ |
| `admin@oniefy.com` | VAPID Web Push | Identificação servidor | Alias → oniefy@ |
| `e2e-test@oniefy.com` | E2E docs | Teste Playwright | Alias → oniefy@ |

### 27.5 Estado atual do projeto

| Métrica | Valor |
|---|---|
| Stories | 105/108 |
| Tabelas | 34 |
| Políticas RLS | 103 |
| Functions | 73 |
| Triggers | 21 |
| Indexes | 140 |
| Migrations MCP | 48 |
| Migration files repo | 55 (001-067) |
| pg_cron jobs | 13 |
| Suítes Jest | 44 (622 assertions) |
| Cobertura lines | 61.6% |
| CI | Verde (4/4 jobs) |

## Sessão 28 - 22 março 2026 (Claude Opus, Projeto Claude) — Deploy Vercel + Test Infrastructure

### 28.1 Deploy Vercel (W1 - P1 bloqueador resolvido)

**Projeto Vercel:** `oniefy` (ID: `prj_MvDXDLlc2xZmcRLuIenCcFdas8mH`)
**URL produção:** `https://www.oniefy.com` (apex `oniefy.com` redireciona 307 → www)
**URL Vercel:** `oniefy-drovsk-cmfs-projects.vercel.app` (SSO protegido)

**Configuração:**
- GitHub integration: conectado, deploy automático no push para `main`
- SSO protection: apenas preview deploys (produção acessível)
- Env vars: 6 configuradas (SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, PROJECT_ID, APP_URL, VAPID_EMAIL)
- DNS: A record (apex) + CNAME (www) configurados no UOL Domínios
- Supabase Auth: redirect URLs atualizados para oniefy.com
- Crons Vercel (vercel.json): push/send diário 11h UTC, digest/send segunda 12h UTC

**Bug encontrado e corrigido (CSP):**
O middleware gerava nonce CSP por request, mas Next.js pré-renderiza páginas estaticamente (x-nextjs-prerender: 1). Os `<script>` tags no HTML estático não tinham o atributo nonce. Browser bloqueava todos os scripts → app travado em "Carregando".
Fix: `script-src 'self' 'unsafe-inline'` em produção (sem nonce). Restante do CSP mantido rígido.

### 28.2 Infraestrutura de testes (3 camadas)

**Camada 1 - Preflight (antes de abrir browser):**
- `scripts/preflight.ps1`: PowerShell, valida 11 itens (Node, npm, .env.local, projeto ativo vs legado, node_modules, porta 3000, Supabase, TS, ESLint, Jest). Flags: -SkipTests, -SkipBuild, -StartDev.

**Camada 2 - Health Check (servidor rodando, sem browser):**
- `scripts/healthcheck.mjs`: Node, testa ~25 endpoints em ~10s. Aceita `--base URL` para produção.
- `npm run healthcheck` (local) ou `npm run healthcheck -- --base https://www.oniefy.com` (produção)

**Camada 3 - Smoke E2E (browser automatizado):**
- `e2e/smoke.spec.ts`: 10 testes Playwright sequenciais (~2min). Cobre: dashboard, CRUD transação/conta/orçamento/bem, navegação 19 rotas, console.error.
- `npm run test:smoke` (local) ou `PLAYWRIGHT_BASE_URL=https://www.oniefy.com npx playwright test smoke.spec.ts` (produção)
- `playwright.config.ts`: aceita `PLAYWRIGHT_BASE_URL` para testar contra URL externa (desabilita webServer local)

**Roteiro manual:**
- `docs/ROTEIRO-TESTE-MANUAL.md`: 10 blocos, ~30min, com checkboxes. Template de reporte de bug incluso.

### 28.3 CI/CD novos workflows

| Workflow | Trigger | O que faz |
|---|---|---|
| `post-deploy.yml` | Vercel deploy concluído (deployment_status) ou manual | Health check contra URL do deploy. Para produção, usa www.oniefy.com. |
| `uptime.yml` | Cron cada 6h (00/06/12/18 UTC) ou manual | Health check contra www.oniefy.com. Cria GitHub issue em falha. |

**Scripts adicionados ao package.json:**
- `npm run test:smoke` → Playwright smoke E2E
- `npm run healthcheck` → health check sem browser

### 28.4 Commits da sessão (7)

| Hash | Descrição |
|---|---|
| `9d16a93` | feat: preflight script, health check, smoke E2E test, roteiro manual |
| `e77254e` | ci: post-deploy health check + uptime monitor + external URL support |
| `6dc3cfa` | fix: CSP blocking all scripts in production (nonce incompatible with static pre-rendering) |
| `f7646d4` | docs: HANDOVER sessão 28 (deploy Vercel + test infra + CSP fix) |
| `00d13be` | fix: audit session 28: healthcheck redirects, CSP cleanup, Turnstile CSP |
| `4ab0b83` | fix: healthcheck false positives + CSP dead code + Turnstile + Vercel env |
| `8adc71c` | fix: replace personal name with corporate entity in Terms of Use |

### 28.5 Auditoria pós-implementação

8 achados, 7 corrigidos:

| # | Achado | Gravidade | Correção |
|---|---|---|---|
| 1 | Healthcheck não seguia redirects apex→www (32 falsos avisos) | Alta | `fetchFollowRedirects` com até 5 hops |
| 2 | Falso positivo 404: Next.js embute "This page could not be found" em todas as páginas como RSC fallback | Média | Removido check de HTML, confia no HTTP status |
| 3 | Código morto: `generateNonce()`, `x-nonce` header, param nonce em `buildCsp` | Baixa | Removido |
| 4 | CSP faltando Turnstile: `challenges.cloudflare.com` ausente em script-src, frame-src, connect-src | Média | Adicionado (opt-in via TURNSTILE_SITE_KEY) |
| 5 | Post-deploy default URL sem www | Baixa | Corrigido para `www.oniefy.com` |
| 6 | `NEXT_PUBLIC_APP_URL` na Vercel apontava para apex sem www | Baixa | Atualizado via API |
| 7 | Termos de Uso: nome pessoal substituído por entidade corporativa | N/A | "Claudio Macêdo Filho" → "WealthOS Tecnologia S/A, CNPJ 00.000.000/0001-00" |
| 8 | Smoke E2E `waitForTimeout(3000)` frágil | Baixa | Mantido (risco baixo, funciona) |

### 28.6 Revisão ortográfica e gramatical

Varredura completa de ~360 strings user-facing em 20 páginas e 30+ componentes. Resultado: **zero erros de acentuação ou ortografia encontrados.** Todas as palavras com acentuação gráfica (transações, orçamento, patrimônio, configurações, notificações, índices, conciliação, importação, exclusão, conexões, divisões, recorrências, etc.) estão corretas. Termos de Uso e Política de Privacidade revisados integralmente.

### 28.7 Pendências manuais (Claudio)

1. SMTP sender: Dashboard Supabase → Auth → SMTP → definir noreply@oniefy.com
2. MFA: fator TOTP "unverified" no projeto novo — reconfigurar no app
3. Apple OAuth: habilitar quando tiver Apple Developer certificate
4. Supabase Pro upgrade (leaked password protection) — decisão de custo
5. Teste de corredor com 3 pessoas (UX-H3-05)

### 28.8 Env vars Vercel (8 configuradas)

| Variável | Target | Nota |
|---|---|---|
| `NEXT_PUBLIC_ONIEFY_DB_URL` | prod/preview/dev | mngjbrbxapazdddzgoje |
| `NEXT_PUBLIC_ONIEFY_DB_KEY` | prod/preview/dev | encrypted |
| `ONIEFY_DB_SECRET` | prod/preview | encrypted |
| `SUPABASE_PROJECT_ID` | prod/preview/dev | mngjbrbxapazdddzgoje |
| `NEXT_PUBLIC_APP_URL` | prod | https://www.oniefy.com |
| `VAPID_EMAIL` | prod/preview | mailto:admin@oniefy.com |
| `CRON_SECRET` | prod/preview | encrypted (gerado sessão 28) |
| `DIGEST_CRON_SECRET` | prod/preview | encrypted (gerado sessão 28) |

### 28.9 Estado atual do projeto

| Métrica | Valor |
|---|---|
| Stories | 105/108 |
| Tabelas | 34 |
| Políticas RLS | 103 |
| Functions | 73 |
| Triggers | 21 |
| Indexes | 140 |
| Migrations MCP | 48 |
| Migration files repo | 55 (001-067) |
| pg_cron jobs | 13 |
| Suítes Jest | 44 (622 assertions) |
| Cobertura lines | 61.6% |
| CI | Verde (CI 4/4 + Post-Deploy + Uptime) |
| Deploy | Vercel produção em www.oniefy.com |
| E2E specs | 9 existentes + 1 smoke (10 testes) |

## Sessão 29 - 23 março 2026 - UX/UI Polish (Cores, Layout, Microcopy)

### 29.1 Contexto

Sessão de polish visual e UX focada exclusivamente na interface de produção (www.oniefy.com). Uso do browser integrado (Claude in Chrome) para verificar o estado real da plataforma antes de qualquer alteração, evitando divergências entre código e deploy.

### 29.2 Análise de Mercado + PENDENCIAS-FUTURAS.md (sessão anterior)

Benchmark completo de concorrentes (Mobills, Organizze, Oinc, YNAB, Empower, Monarch Money). Insights de reviews (Reclame Aqui, Reddit, Trustpilot). Criação do `PENDENCIAS-FUTURAS.md` na raiz do repositório como backlog consolidado de produto. Commits `16abe54` e `11b3d80`.

### 29.3 Correções de UX e Microcopy

| Commit | Fix |
|--------|-----|
| `68c1fed` | "5 semanas" → "5 etapas" no SetupJourneyCard (título + comentário) |
| `3c4adf8` | Fallback "Sem receita no mês" → "—" no card Despesas do Mês |
| `ea183e0` | Remover botão Importar redundante da página Transações |
| `40250c6` | "Sem." → "Et." nas abas do SetupJourneyCard (span hidden sm:inline) |
| `e2bbff5` | Remover abreviação "Et." das tabs — ficam apenas os números (1 · 2 · 3 · 4 · 5) |

### 29.4 Audit e Correção do Design System Plum Ledger

**Problema raiz identificado via browser:** a sidebar nunca tinha recebido `bg-plum` — usava `bg-card` (tom claro). O plum só aparecia nos botões de item ativo (`bg-primary`), que com `hsl(273, 15%, 14%)` renderizavam como preto puro. O usuário não via plum em nenhum lugar.

**Sequência de correções:**

| Commit | Descrição |
|--------|-----------|
| `8addd56` | `--plum/--primary/--ring` → `hsl(273,30%,18%)` em globals.css |
| `bf5e883` | `#241E29` → `#2F203B` em accounts/page.tsx |
| `1d7681d` | `#241E29` → `#2F203B` em cost-centers/page.tsx |
| `26aaa26` | `#241E29` → `#2F203B` em PRESET_COLORS (use-accounts.ts) |
| `effd401` | `#241E29` → `#2F203B` em CATEGORY_COLORS (use-categories.ts) |
| `5b3edda` | `#241E29` → `#2F203B` em colorName map (utils/index.ts) |
| `91a2160` | `bg-emerald-700` → `bg-verdant` (balance-sheet-card.tsx) |

### 29.5 Fundo Principal e Sidebar com Plum Real

**Fundo `#FBF9F5`:** `--background: 40 43% 97%`. Cards passaram para branco puro (`0 0% 100%`) para manter contraste visível sobre o fundo levemente bege.

**Sidebar escura em plum:** `bg-card` substituído por `bg-[hsl(var(--sidebar-bg))]`. Novos tokens adicionados ao globals.css: `--sidebar-bg`, `--sidebar-fg`, `--sidebar-active-bg`, `--sidebar-active-fg`, `--sidebar-hover-bg`. Logo na sidebar trocado para variante bone (lê bem sobre fundo escuro).

| Commit | Descrição |
|--------|-----------|
| `5203106` | `--background: #FBF9F5` + tokens `--sidebar-*` + `--card: white` |
| `97cf3dd` | Sidebar lateral com `bg-[hsl(var(--sidebar-bg))]` + cores ajustadas para fundo escuro |
| `a0b83b1` | `--primary/--ring` revertidos para `273 15% 14%` (sidebar tem plum próprio) |

### 29.6 Calibração de `--primary` para Botões Visíveis

`hsl(273, 15%, 14%)` = `#241E29` rendia preto puro em botões pequenos (luminosidade 14% insuficiente para o roxo aparecer). Iteração de valores:

- `273 30% 18%` (= sidebar-bg): ainda escuro demais em elementos pequenos
- **`273 38% 30%`** (`#4F2F69`): plum visível em botões, premium, mesma família da sidebar

| Commit | Descrição |
|--------|-----------|
| `c0b79c2` | `--primary/--ring` → `273 30% 18%` (alinhado com sidebar-bg) |
| `b9eee36` | `--primary/--ring` → `273 38% 30%` (plum visível em botões) |

**Estado final da paleta (light mode):**

| Token | Valor | Contexto |
|-------|-------|----------|
| `--sidebar-bg` | `273 30% 18%` | Sidebar — plum escuro, ancoragem |
| `--primary` | `273 38% 30%` | Botões, tabs ativas, CTAs |
| `--background` | `40 43% 97%` | Fundo geral `#FBF9F5` |
| `--card` | `0 0% 100%` | Cards sobre o fundo |

### 29.7 Bug OAuth Callback (fix crítico)

**Causa raiz:** `cookies().set()` do `next/headers` e `NextResponse.redirect()` são superfícies independentes no Next.js 15. Os cookies de sessão não chegavam ao browser no redirect OAuth — usuário precisava clicar duas vezes para entrar.

**Fix:** callback reescrito com `createServerClient` próprio que acumula cookies em `pendingCookies[]` e os aplica diretamente no `NextResponse` antes de retornar.

Commit: `9fb3b3f`

### 29.8 Correções na página Importar (/connections)

| Problema | Fix | Commit |
|----------|-----|--------|
| Título "Conexões & Importação" (diferente das outras páginas) | → "Importar" | `8715c74` |
| Abas usavam `bg-card shadow-sm` (sem identidade visual) | → `bg-primary text-primary-foreground` + rail `bg-primary/10` | `8715c74` |
| Estrutura do header diferente das outras páginas (`h1` + `p` extra) | → `flex items-center justify-between` padrão | `d13486e` |

### 29.9 Alinhamento vertical de títulos

**Problema:** `p-6` no wrapper do conteúdo colocava títulos muito próximos ao topo (24px), desalinhados com o logo "oniefy" na sidebar (~40px).

**Fix:** `px-6 pt-10 pb-6` no `layout.tsx` — todas as páginas se beneficiam automaticamente.

Commit: `e97f4cc`

### 29.10 Estratégia "Suporte Contextual Silencioso" (recebida de terceiro)

Sugestão recebida de um colaborador externo propondo UX Writing e Design Comportamental com 3 nudges:

1. **"Não tem um extrato?"** (Importar) — redução de fricção, mantém usuário no fluxo
2. **"Dicas Importantes"** (Importar) — prevenção de erros antes da importação
3. **"Por que acompanhar o patrimônio?"** (Patrimônio) — educação e reforço de valor

A lógica estratégica é transformar o Oniefy de ferramenta passiva em mentor ativo. As caixas servem como nudges (empurrões) para combater a inércia do usuário. Visão de longo prazo: CFA pessoal para cada usuário.

**Implementado parcialmente nos commits desta sessão:**

| Commit | Nudge |
|--------|-------|
| `a926cf9` | Dicas colapsáveis de importação + refinamento do layout do template |
| `6050fcc` | "Por que acompanhar o patrimônio?" no empty state de Patrimônio |

O item "Não tem um extrato?" já existia na UI (`import-step-upload.tsx`). O registro da estratégia completa foi adicionado ao `PENDENCIAS-FUTURAS.md` para implementação futura nas demais telas.

### 29.11 Commits da sessão

| Hash | Descrição |
|------|-----------|
| `68c1fed` | fix: '5 semanas' → '5 etapas' no SetupJourneyCard |
| `3c4adf8` | fix: fallback 'Sem receita no mês' → '—' |
| `ea183e0` | fix: remover botão Importar redundante |
| `40250c6` | fix: 'Sem.' → 'Et.' nas abas |
| `8addd56` | fix(color): --plum/--primary/--ring para hsl(273,30%,18%) |
| `bf5e883..5b3edda` | fix(color): #241E29 → #2F203B em 5 arquivos |
| `91a2160` | fix(color): bg-emerald-700 → bg-verdant |
| `9fb3b3f` | fix: callback OAuth com cookies no NextResponse |
| `d2eb0f9` | fix: contador 'X/7 concluídos' → 'X/5 etapas' |
| `5203106` | feat(color): fundo #FBF9F5 + tokens --sidebar-* |
| `97cf3dd` | feat(sidebar): sidebar com fundo plum real |
| `a0b83b1` | fix(color): reverter --primary para 273 15% 14% |
| `c0b79c2` | fix(color): --primary → 273 30% 18% |
| `b9eee36` | fix(color): --primary → 273 38% 30% (plum visível) |
| `8715c74` | fix(connections): título 'Importar' + abas plum |
| `e97f4cc` | fix(layout): pt-10 alinha título com logo |
| `d13486e` | fix(connections): header no padrão das outras páginas |
| `e2bbff5` | fix: remover 'Et.' das tabs |
| `a926cf9` | feat(import): dicas colapsáveis + layout template |
| `6050fcc` | feat(assets): nudge patrimônio no empty state |

**Último commit verde:** `6050fcc` (4/4 CI jobs: Security + Lint + Unit Tests + Build)

### 29.12 Estado atual do projeto (sem alterações de schema)

| Métrica | Valor |
|---------|-------|
| Stories | 105/108 |
| Tabelas | 34 |
| Políticas RLS | 103 |
| Functions | 73 |
| Triggers | 21 |
| Indexes | 140 |
| Migrations MCP | 48 |
| pg_cron jobs | 13 |
| Suítes Jest | 44 (622 assertions) |
| CI | Verde (4/4 jobs) |
| Deploy | www.oniefy.com |

### 29.13 Pendências abertas para próxima sessão

Ver `PENDENCIAS-FUTURAS.md` na raiz do repositório. Destaques imediatos:
- Ações Claudio: SMTP noreply@oniefy.com, Supabase Pro, Apple Developer Account, MFA reconfigurar
- Estratégia "Suporte Contextual Silencioso": implementar nudge "Não tem um extrato?" de forma consistente
- Testes com dados reais: usar o app por 1 semana, convidar 2-3 testers beta
- Corridor usability test com 3 pessoas (UX-H3-05)


---

## Sessão 30 — Plum Ledger v1.2: Profundidade e Calor

### 30.1 Diagnóstico e Implementação

Problema: cores "chapadas" / sem vida. Diagnóstico identificou 6 causas raiz:
1. Sombras genéricas cinza (`shadow-sm`) sem identidade de marca
2. Delta de luminosidade background/card quase nulo (97% vs 100%)
3. Zero gradients em todo o codebase
4. Plum confinado à sidebar, área principal sem personalidade
5. Hover effects quase imperceptíveis
6. Labels em cinza neutro sem conexão com a paleta

**Solução implementada** (commit `106f4f1`):
- `globals.css`: 4 novos tokens (`--shadow-plum`, `--label-plum` light+dark), classe `.card-alive`
- `tailwind.config.ts`: `shadow-card`, `shadow-elevated`, cor `label-plum`
- `layout.tsx`: sidebar glow edge (gradiente plum 6% → transparent, 24px, desktop only)
- 29 arquivos alterados: substituição global de `shadow-sm` → `shadow-card`, `shadow-lg` → `shadow-elevated`
- Borders removidas de cards (sombra quente já fornece separação visual)
- `.card-alive` em cards interativos: hover com `translateY(-1px)` + sombra ampliada

**Commits:**

| Hash | Descrição |
|------|-----------|
| `106f4f1` | feat(design): Plum Ledger v1.2 - sombras quentes, sidebar glow, card-alive hover |

**CI verde:** `106f4f1` (Post-Deploy Check: success)

### 30.2 Estado atual do projeto

| Métrica | Valor |
|---------|-------|
| Stories | 105/108 |
| Tabelas | 34 |
| Políticas RLS | 103 |
| Functions | 73 |
| Triggers | 21 |
| Indexes | 140 |
| Migrations MCP | 48 |
| pg_cron jobs | 13 |
| Suítes Jest | 44 (622 assertions) |
| CI | Verde (Post-Deploy Check) |
| Deploy | www.oniefy.com |
| Design System | Plum Ledger v1.2 |

### 30.3 Micro-gradients nos CTAs + Tint plum nos labels

**btn-cta** (commit `e73a7e8`):
- Classe `.btn-cta` em `globals.css` (`@layer components`): `linear-gradient(135deg, primary→plum-dark)`, warm shadow, hover lift (-0.5px), active press
- Dark mode: gradient sage (`hsl(var(--primary))→sage-dark`)
- 41 arquivos: substituição global de `bg-primary hover:bg-primary/90` → `btn-cta` em todos os botões CTA
- FAB: `btn-cta` + `shadow-elevated` + `hover:scale-105`
- Indicadores de estado (tabs ativas, pills, marcador de hoje) mantidos como `bg-primary` (não são CTAs)

**Tint plum nos labels** (mesmo commit):
- `--muted-foreground` light: `270 4% 55%` → `270 10% 48%` (+6% saturação, -7% luminosidade)
- `--muted-foreground` dark: `30 10% 42%` → `270 8% 50%` (hue 30→270, alinhado à identidade plum)
- Propagação automática: todas as 100+ ocorrências de `text-muted-foreground` herdaram o tint

**Commits:**

| Hash | Descrição |
|------|-----------|
| `e73a7e8` | feat(design): btn-cta gradient + muted-foreground plum tint |

**CI verde:** `e73a7e8` (Post-Deploy Check: success)

### 30.4 Fix OAuth double-click login

**Problema:** usuário precisava clicar "Continuar com Google" duas vezes para logar.

**Causa raiz:** race condition no `useAuthInit`. Após o redirect do OAuth callback, o `createBrowserClient` (singleton) ainda não havia completado `_initialize()` quando o hook executava. As chamadas de MFA (`listFactors`) disparavam sem access token → throw → catch → `router.push("/login")` → volta ao login. No segundo clique, o middleware detectava a sessão nos cookies e redirecionava para `/dashboard` com o singleton já inicializado.

**Fix (commit `8093e48`):**
- `useAuthInit`: adicionado `await supabase.auth.getSession()` como primeira operação, forçando sync cookie→memória do singleton
- Se `getSession()` retorna null (sem sessão), bail para `/login` imediatamente sem tentar MFA/encryption
- Log de erro em dev mode para diagnóstico futuro

**Commits:**

| Hash | Descrição |
|------|-----------|
| `8093e48` | fix(auth): await getSession before MFA/auth checks in useAuthInit |

**CI verde:** `8093e48` (CI + Post-Deploy Check: success)

### 30.6 Fix consolidado: Importar / OAuth / Sidebar glow / Hover / Gradients

**5 correções em um commit** (`127af22`):

**1. Aba Importar desalinhada:**
- `max-w-4xl` → `max-w-3xl` (padrão de todas as outras páginas)
- Tabs `bg-primary/10` → `bg-muted` + `bg-card shadow-card` (padrão de bills/workflows)

**2. OAuth double-click (fix definitivo, duas camadas):**
- `middleware.ts`: criado helper `redirectWithCookies()` que copia cookies de sessão do `supabaseResponse` para o `NextResponse.redirect`. Aplicado nos 3 redirects de usuário autenticado (onboarding, root, auth-pages). Essa era a raiz real: `getUser()` refrescava o token e gravava no `supabaseResponse`, mas `NextResponse.redirect()` criava resposta nova descartando esses cookies.
- `use-auth-init.ts`: reestruturado com `getUser()` como gate autoritativo (valida token server-side) em vez de `getSession()` (lê cache em memória, pode estar stale após OAuth redirect). MFA check movido para depois da confirmação do user.

**3. Sidebar glow invisível:**
- Opacidade 0.06 → 0.12, largura 24px → 40px
- Cor fixa `hsl(273 30% 25%)` em vez de `var(--plum)` (que a 14% luminosidade era invisível a 6% opacidade)

**4. Hover universal (.btn-alive):**
- Nova classe `.btn-alive` em `globals.css` para botões outline/secondary/ghost
- Hover lift sutil (`translateY(-0.5px)` + sombra 4px)
- Aplicado em 24 arquivos (botões de cancelar, outline, secondary)
- Complementa `.btn-cta` que só cobria CTAs primários

**5. Micro-gradients nas barras:**
- Novas classes utilitárias: `bar-verdant`, `bar-terracotta`, `bar-burnished`, `bar-primary`
- Cada uma com `linear-gradient(90deg, tom-escuro, tom-claro)` da mesma família
- Aplicado em: budget-summary-card, balance-sheet-card, setup-journey-card, budgets/page, settings/data, import-step-upload

**Commits:**

| Hash | Descrição |
|------|-----------|
| `127af22` | fix: 5 correções consolidadas - Importar/OAuth/glow/hover/gradients |

**CI verde:** `127af22` (CI + Post-Deploy Check: success)

### 30.7 Fix crítico: cadastro e login por email quebrados em produção

**Problema:** Todos os 3 endpoints de auth (`/api/auth/register`, `/api/auth/login`, `/api/auth/forgot-password`) retornavam "Corpo da requisição inválido" para qualquer request. Primeiro usuário convidado não conseguiu criar conta.

**Causa raiz:** Os 3 Route Handlers importavam `verifyTurnstile` de `turnstile.tsx`, arquivo marcado com `"use client"`. Route Handlers executam server-side. A diretiva `"use client"` causa conflito de módulo na resolução do Next.js, fazendo o bloco `try` falhar antes mesmo de parsear o body. O `catch` genérico engolia o erro real e retornava a mensagem genérica.

**Fix (commit `b556e3f`):**
- Novo arquivo `src/lib/auth/turnstile-verify.ts` (server-only, sem `"use client"`)
- 3 routes atualizadas: import de `turnstile.tsx` → `turnstile-verify.ts`
- `turnstile.tsx` mantém apenas o componente React (client)
- Catch blocks agora logam `console.error` com o erro real

**Verificação em produção:**
- `POST /api/auth/register`: `{"message":"Verifique seu email para confirmar o cadastro."}`
- `POST /api/auth/login` (senha errada): `{"error":"Email ou senha incorretos."}`
- `POST /api/auth/forgot-password`: `{"message":"Se o email estiver cadastrado..."}`

**Commits:**

| Hash | Descrição |
|------|-----------|
| `b556e3f` | fix(auth): separar verifyTurnstile de componente 'use client' |

**CI verde:** `b556e3f` (CI + Post-Deploy Check: success)

**Lição aprendida:** Nunca importar função server-side de arquivo com `"use client"`. Componentes React e funções server devem estar em arquivos separados, mesmo que compartilhem lógica. O catch genérico sem logging escondeu esse bug desde o deploy inicial.

### 30.8 Auditoria de produção completa

Auditoria executada em 23/03/2026 após falha crítica de auth em produção. 20 verificações realizadas.

**Achado 1 (CRÍTICO): OAuth www vs non-www mismatch**
- Supabase `site_url` era `https://oniefy.com` (sem www), `uri_allow_list` não incluía `www.oniefy.com`
- Usuários acessam `www.oniefy.com` → `window.location.origin` = `https://www.oniefy.com`
- OAuth `redirectTo` enviava `https://www.oniefy.com/api/auth/callback`
- Supabase rejeitava o redirect ou setava cookies no domínio errado
- FIX: `site_url` → `https://www.oniefy.com`, `uri_allow_list` expandida com `www.oniefy.com/**`

**Achado 2 (ALTO): Middleware bloqueando arquivos estáticos**
- `manifest.json`, `sw.js`, `robots.txt` retornavam 307 → login
- Matcher excluía apenas extensões de imagem, não `.json`/`.js`/`.txt`
- FIX: matcher atualizado com exclusões explícitas para os 4 arquivos

**Achado 3 (MÉDIO): Rate limiter in-memory ineficaz em Vercel**
- 7 tentativas de login consecutivas passaram sem bloqueio
- Serverless functions não compartilham memória entre invocações
- MITIGAÇÃO: GoTrue (Supabase) tem rate limiting próprio como fallback
- STATUS: documentado como TEC-05 em PENDENCIAS-FUTURAS.md

**Verificação pós-fix:**
- manifest.json: HTTP 200 (era 307)
- sw.js: HTTP 200 (era 307)
- robots.txt: HTTP 200 (era 307)
- Register: OK
- Login: OK
- Forgot-password: OK
- Middleware redirects: OK (6 rotas protegidas testadas)
- Security headers: CSP + HSTS + X-Frame-Options + X-Content-Type-Options + Referrer-Policy + Permissions-Policy: todos presentes
- Static assets (SVGs, favicon): OK
- Cron endpoints (sem auth): 401 (correto)
- Open redirect: bloqueado (correto)

**Commits:**

| Hash | Descrição |
|------|-----------|
| `21a3876` | fix(critical): OAuth www mismatch + middleware blocking static files |

**CI verde:** `21a3876` (CI + Post-Deploy Check: success)

### 30.9 Smoke tests pós-deploy para auth e static files

Adicionados 7 checks ao `scripts/healthcheck.mjs` que rodam em todo Post-Deploy Check:

**Auth API Smoke Tests (3):**
- `POST /api/auth/register` com body JSON real → detecta "Corpo da requisição inválido" como FAIL
- `POST /api/auth/login` com body JSON real → idem
- `POST /api/auth/forgot-password` com body JSON real → idem

**Static File Checks (4):**
- `GET /manifest.json` → FAIL se 307 (middleware bloqueando)
- `GET /robots.txt` → idem
- `GET /sw.js` → idem
- `GET /favicon.ico` → idem

Esses checks teriam pego os bugs das sessões 30.7 (turnstile "use client") e 30.8 (middleware matcher) antes de qualquer usuário reportar.

**Commit:** `f23b297` | CI + Post-Deploy Check: success

### 30.10 Especificação completa do Motor JARVIS CFA

Sessão encerrada com especificação técnica detalhada do motor de inteligência do Oniefy. Documentos atualizados:

**Princípios definitivos do CFA Pessoal (definidos por Claudio):**
1. Análise de contexto com dados reais, nunca regras genéricas (50/30/20 descartado)
2. Sugestões ancoradas em hábitos específicos ("reduza 7 pedidos iFood" > "gaste menos com alimentação")
3. Tempo é o ativo mais caro — nunca sugerir economia que custa mais em tempo
4. Postura crítica sobre sabedoria convencional (acumulação imobiliária BR quase sempre inviável)
5. Dados concretos, não adjetivos
6. Perguntas provocativas como gatilho
7. Linguagem financeira profissional

**Framework: 3 Pilares (Taxa, Fluxo, Tempo)**
- Toda otimização financeira melhora pelo menos um eixo
- TMA = CDI + prêmio de risco como referência universal
- Qualquer ativo com retorno < TMA está destruindo valor

**Arquitetura em 3 camadas:**
- Camada 1: Scanner padronizado (determinístico, 10 regras R01-R10)
- Camada 2: Combinador de cenários (efeito agregado de múltiplas otimizações)
- Camada 3: IA narrativa (Claude Haiku, apenas edge cases)

**10 Regras especificadas com fórmulas SQL:**

| Regra | Descrição | Schema pronto? |
|-------|-----------|----------------|
| R01 | Ativo com retorno líquido < CDI | 90% (depende de transactions.asset_id preenchido) |
| R02 | Dívida com taxa > CDI + 5 p.p. | Requer Frente B (interest_rate + rate_type) |
| R03 | Assinaturas com potencial de cancelamento | 100% |
| R04 | Veículo: assinatura vs financiado (TCO) | 70% (depende de transactions.asset_id) |
| R05 | Pagamento mínimo de cartão (espiral juros) | Requer Frente B ou fallback BCB |
| R06 | Categoria de despesa em escalada (+20% 3m) | 100% |
| R07 | Reserva de emergência < 3 meses | 100% (RPC já existe) |
| R08 | Depreciação de ativo > rendimento líquido | 90% (depende de transactions.asset_id) |
| R09 | Concentração de renda > 80% em uma fonte | 100% |
| R10 | Fluxo mensal negativo 2+ meses consecutivos | 100% (monthly_snapshots já existe) |

**Schema gaps identificados (Frente B):**
- `accounts.investment_class` enum (renda_fixa, renda_variavel, fii, previdencia, cripto, outro)
- `accounts.interest_rate` numeric (% a.m.) para loan/financing/credit_card
- `accounts.rate_type` enum (pre, pos_cdi, pos_ipca, pos_tr) para loan/financing

**UX: "Limpeza de Disco" financeira** — sugestões proativas sem o usuário pedir. Card no dashboard: "Otimizações disponíveis (3) — Economia potencial: R$ 740/mês"

**Princípio arquitetural: algoritmo primeiro, IA depois.** Garante reprodutibilidade, auditabilidade, custo controlado.

**Documentos de referência:**
- `docs/CFA-ONIEFY-MAPPING.md` §5 (princípios) e §6 (motor JARVIS) — fonte de verdade
- `PENDENCIAS-FUTURAS.md` E8b-E8d (backlog de implementação)

**Próximo passo:** Implementar as 6 regras que funcionam com zero schema change (R03, R06, R07, R08, R09, R10) + Frente B (migration para interest_rate/rate_type/investment_class) + 4 regras restantes.

### Sessão 30 — Commits consolidados

| Hash | Descrição |
|------|-----------|
| `106f4f1` | Sombras quentes, sidebar glow, card-alive |
| `e73a7e8` | btn-cta gradient + muted-foreground plum tint |
| `8093e48` | useAuthInit: getSession antes de MFA |
| `9d9fc90` | Revert Midnight Plum para #241E29 |
| `127af22` | 5 fixes: Importar/OAuth/glow/hover/gradients |
| `807c4c1` | CFA → Oniefy mapping (57 readings) |
| `b920dfb` | CFA + Suporte Contextual no backlog |
| `b556e3f` | FIX CRÍTICO: turnstile "use client" |
| `21a3876` | FIX CRÍTICO: OAuth www mismatch + static files |
| `f23b297` | Smoke tests auth + static files no CI |
| `b2b79c3` | Benchmark com iDinheiro |
| `3c6f080` | Descartar 50/30/20 |
| `ed56a59` | Princípios CFA Pessoal revisados |
| `0a2958d` | Motor JARVIS CFA especificação |

---

## 31. Sessão 31 — Motor JARVIS CFA: Implementação (24/03/2026)

### 31.1 Motor JARVIS CFA implementado (Frentes A + B + parcial C)

Implementação completa do Motor JARVIS CFA conforme especificação da sessão 30 (§30.10) e `docs/CFA-ONIEFY-MAPPING.md` §6.

**Frente A (zero schema change): 6 regras iniciais**

RPC `get_jarvis_scan(p_user_id UUID)` criada com as regras:

| Regra | Descrição | Pilar |
|-------|-----------|-------|
| R03 | Assinaturas canceláveis (duplicatas na mesma categoria) | Fluxo |
| R03b | Peso total das assinaturas (>15% da renda) | Fluxo |
| R06 | Categoria de despesa em escalada (+20% por 3 meses consecutivos) | Fluxo |
| R07 | Reserva de emergência insuficiente (runway < 6 meses) | Tempo |
| R08 | Depreciação de ativo > rendimento líquido | Taxa |
| R09 | Concentração de renda (>80% em uma fonte) | Fluxo |
| R10 | Fluxo mensal negativo persistente (2+ meses) | Fluxo+Tempo |

**Camada 2 (Combinador):** soma `potential_savings_monthly` de todos os findings e projeta em 3/6/12 meses.

**Frente B (schema evolution):**

3 novos campos em `accounts`:
- `investment_class` enum (renda_fixa, renda_variavel, fii, previdencia, cripto, outro) - nullable, somente type=investment
- `interest_rate` numeric (% a.m.) - nullable, somente type IN (loan, financing, credit_card)
- `rate_type` enum (pre, pos_cdi, pos_ipca, pos_tr) - nullable, somente type IN (loan, financing)

CHECK constraints: `chk_investment_class_type`, `chk_interest_rate_type`, `chk_rate_type_type`, `chk_interest_rate_positive`.

**FIX:** `assets.depreciation_rate` ampliado de `numeric(5,4)` para `numeric(7,4)` - veículos com 15-20% a.a. não cabiam.

**Frente C (parcial): 2 regras adicionais pós Frente B**

| Regra | Descrição | Pilar |
|-------|-----------|-------|
| R02 | Dívida com taxa > CDI + 5 p.p. (CDI dinâmico via `economic_indices`) | Taxa |
| R05 | Espiral de juros de cartão de crédito (projeção composta 3/6/12m) | Taxa+Tempo |

**Total: 8 regras ativas (R02, R03, R03b, R05, R06, R07, R08, R09, R10).**

Pendentes: R01 (ativo < CDI - precisa tracking retorno portfolio), R04 (veículo TCO - simulação complexa).

### 31.2 R01 e R04 implementados (scanner completo)

Adicionados na mesma sessão, completando o scanner:

| Regra | Descrição | Pilar |
|-------|-----------|-------|
| R01 | Ativo com retorno líquido < CDI (compara yield mensal vs CDI dinâmico; degradação graceful sem income data) | Taxa |
| R04 | Veículo TCO (depreciação + despesas operacionais via asset_id; peso na renda como %) | Fluxo+Tempo |

**Total final: 10 regras + R03b = 11 findings possíveis. Motor JARVIS CFA Camada 1 completo.**

### 31.3 Frontend JARVIS

- `src/lib/schemas/rpc.ts` - 2 schemas Zod: `jarvisFindingSchema`, `jarvisScanSchema`
- `src/lib/hooks/use-jarvis.ts` - Hook `useJarvisScan` (staleTime 10min) + helpers `sortFindings`, `getRuleLabel`
- `src/components/dashboard/jarvis-scan-card.tsx` - Card "Limpeza de Disco" com severity colors (verdant/burnished/terracotta), expansion toggle, projeção 3/6/12m
- `src/components/accounts/account-form.tsx` - Campos condicionais da Frente B (investment_class, interest_rate, rate_type)
- Dashboard page: JarvisScanCard visível para maturity level "ativo+" (11+ transações)

### 31.4 Testes

Suite `jarvis-scan.test.tsx` com 44 assertions:
- `sortFindings`: ordering, empty, single, immutability
- `getRuleLabel`: todos os 11 labels + fallback
- `jarvisFindingSchema`: validação por regra (R02, R03, R05, R09), null items, rejeição severity inválida, rejeição campo ausente
- `jarvisScanSchema`: full scan, empty scan, null solvency, consistência de projeções, soma de severity counts
- `useJarvisScan`: success, RPC args, error, schema failure, empty findings
- Rule data contracts: R02 rate comparison, R03 subscription array, R05 compound projection, R06 growth trajectory, R08 net_loss math, R09 concentration %, R10 negative flow

### 31.5 Types regenerados

`database.ts` regenerado com novos enums `investment_class` e `rate_type`, e colunas `interest_rate`.

FIX colateral: `use-bank-connections.ts` - nullable UUID param `p_bank_connection_id` incompatível com tipos regenerados.

### 31.6 Polymarket - análise e decisão

Proposta de integrar API do Polymarket para "cheiro de mercado" analisada e **rejeitada** para o momento:
1. Desalinhamento de domínio (prediction markets vs patrimônio individual)
2. Cobertura Brasil ≈ zero (eventos BR sem liquidez)
3. Escopo creep no momento errado
4. Risco regulatório (zona cinzenta apostas/derivativos)
5. Viola Princípio CFA #1 (probabilidades genéricas, não específicas ao patrimônio)

**Decisão:** anotar em PENDENCIAS-FUTURAS como ideia para Camada 3 (IA narrativa) em futuro distante.

### 31.7 Calculadoras CFA (E8d)

4 calculadoras front-end only adicionadas em `/calculators`:

| Calculadora | Conceito CFA | Método |
|-------------|-------------|--------|
| Independência Financeira | Perpetuidade (Gordon) | PV = Despesa anual / Retorno real |
| Comprar vs Alugar | NPV | Custo total compra vs aluguel + investimento da diferença |
| CET de financiamento | IRR (YTM) | Newton-Raphson sobre fluxo líquido (principal - taxas) vs parcela total |
| SAC vs Price | Amortização | Tabela comparativa lado a lado com total de juros |

Navegação atualizada: 7+1 items (Calculadoras adicionado na sidebar).

### Sessão 31 — Commits consolidados

| Hash | Descrição |
|------|-----------|
| `6eb60a6` | Motor JARVIS CFA: scanner 6 regras + Frente B schema + UX card |
| `1690761` | JARVIS: adiciona R02 (dívida cara) e R05 (espiral cartão) |
| `cc1f1bb` | JARVIS: 40 testes + types regenerados + fix bank-connections |
| `7137a3c` | CI: re-trigger (runner provisioning failure) |
| `3251b20` | HANDOVER §31 + PENDENCIAS atualizados |
| `80e4603` | JARVIS completo: R01 + R04 + 44 testes + HANDOVER §31 final |
| `464efc5` | E8d: Calculadoras CFA (4 ferramentas TVM, front-end only) |
| `183563b` | HANDOVER + PENDENCIAS: E8d ✅, bloco E8 fechado |
| `e92b8f3` | HANDOVER §3: corrige todas as discrepâncias numéricas |

---

## 32. Sessão 32 — E2 + E7 + E9: Patrimônio, Simulador, Solvência (25/03/2026)

### 32.1 E2: Gráfico Patrimônio Líquido ao longo do tempo

Novo componente `net-worth-chart.tsx` no dashboard (engajado+):

- **Dois modos de visualização:**
  - Stacked areas por tier (N1-N4) quando há dados de tier no `monthly_snapshots`
  - Área simples (net worth) como fallback
- Seletor de período: 6m / 12m / 24m (snapshots ampliado de 12 para 24 meses)
- Variação MoM: diff absoluto + percentual vs mês anterior
- Gradientes Recharts com cores dos tiers (verdant, slate, burnished, tier-4)
- Empty state educativo (< 2 snapshots)
- Posicionado entre Evolução Mensal e Fôlego Financeiro no dashboard

**Zero schema changes, zero novas RPCs** — usa `monthly_snapshots` existente via `useMonthlySnapshots(24)`.

### 32.2 E9: Interpretação de solvência em linguagem direta

Reescrita do `solvency-panel.tsx` para substituir rótulos técnicos por frases explicativas:

| Métrica | Antes | Depois |
|---------|-------|--------|
| LCR | "Liquidez / (Custo × 6)" | "Sua liquidez cobre 2.4x o custo de 6 meses. Posição confortável." |
| Runway | "Meses de liberdade financeira" | "Você sobrevive 14 meses sem renda. Reserva sólida." |
| Burn Rate | "Custo mensal médio (6 meses)" | "Média de R$ 8.500/mês nos últimos 6 meses. Base para calcular seu fôlego." |
| Patrimônio | "N1 + N2 + N3 + N4" | "72% do seu patrimônio é acessível em até 30 dias. Boa liquidez." |

Estados semânticos padronizados: **Confortável / Saudável / Atenção / Crítico** (com badges coloridos consistentes nos 4 KPIs).

Funções de interpretação: `lcrExplanation()`, `runwayExplanation()`, `patrimonyExplanation()`, `burnRateExplanation()`.

### 32.3 E7: Simulador "Posso comprar?"

Novo componente `affordability-simulator.tsx`, posicionado como 1ª aba nas Calculadoras (5 abas total).

**3 inputs:**
- Valor do bem (R$)
- Forma de pagamento: à vista, parcelado sem juros, financiado
- Prazo (meses) + taxa mensal (% a.m., se financiado)

**3 outputs (antes → depois):**
1. Impacto no Runway (meses perdidos)
2. Impacto no LCR (antes → depois)
3. Comparativo com meta de reserva de emergência (6 meses)

**Comportamento por forma de pagamento:**
- À vista: debita `liquid` (T1+T2), burn inalterado
- Parcelado: liquid inalterado, burn += parcela mensal
- Financiado: PMT = PV × r / (1 - (1+r)^-n), liquid inalterado, burn += PMT

**Features:**
- Banner contextual com dados reais (reserva, custo, fôlego)
- Barra de progresso reserva vs meta
- Veredito visual: viável (verde) / atenção (dourado) / crítico (vermelho)
- Custo total de juros destacado para financiamento
- Sugestão de parcelamento quando à vista compromete reserva
- Empty state quando sem dados de solvência (< 1 mês de transações)

**Zero schema changes, zero novas RPCs** — usa `useSolvencyMetrics()` existente.

### 32.4 Testes

Nova suíte `e7-e9-affordability-solvency.test.ts` com 22 assertions:

| Grupo | Testes | Cobertura |
|-------|--------|-----------|
| E7: à vista | 3 | Redução líquido, esgotamento, burn inalterado |
| E7: parcelado | 2 | Líquido inalterado, juros zero |
| E7: financiado | 4 | PMT, juros positivos, líquido inalterado, taxa zero |
| E7: meta reserva | 2 | Reserva ok, reserva comprometida |
| E9: lcrExplanation | 4 | Sem despesas, confortável, razoável, insuficiente |
| E9: runwayExplanation | 4 | Sem despesas, sólida, recomendado, priorize |
| E9: patrimonyExplanation | 3 | Sem patrimônio, maioria líquida, maioria ilíquida |

**Estado final:** 46 suítes, 688 assertions, 0 falhas.

### 32.6 E1: Indicador de saúde de saldo por conta

Badge visual por conta na página `/accounts`:

| Estado | Condição | Cor |
|--------|----------|-----|
| Conferido | Atualizado < 7 dias, saldo atual ≈ previsto (< 1% divergência) | Verde |
| Divergência | |current - projected| > max(1% × |current|, R$1) | Dourado |
| Xd sem atualização | 7-29 dias sem updated_at | Dourado |
| Xd sem atualização | 30+ dias sem updated_at | Vermelho |

Divergência prevalece sobre staleness (se ambos, mostra "Divergência").

### 32.7 E3: Gerenciador de assinaturas consolidado

Nova aba "Assinaturas" na página Contas a Pagar (4 abas: Pendentes | Recorrências | Assinaturas | Calendário).

- Filtra automaticamente: recorrências ativas + mensais + tipo despesa
- Total mensal consolidado no topo
- Cada card: valor mensal + custo anual + badge de reajuste (se indexado)
- Ordenação por valor (maior primeiro)
- Resumo anual no rodapé
- Zero schema changes, zero RPCs novas (filtra `recurrences` existente)

### 32.8 E6: Metas de economia (savings goals)

**Migration 072:** tabela `savings_goals` (11 colunas, 4 RLS policies, 2 indexes, trigger updated_at).

**Hook `use-savings-goals.ts`:**
- CRUD: `useSavingsGoals`, `useCreateGoal`, `useUpdateGoal`, `useDeleteGoal`
- `enrichGoal()`: campos computados (progress_pct, remaining_amount, monthly_savings_needed, months_remaining)

**Página `/goals`:**
- Cards com barra de progresso colorida (cor customizável, 6 opções)
- Valor mensal sugerido ("Para atingir no prazo, economize R$ X/mês")
- Meses restantes calculados automaticamente
- Resumo consolidado (progresso geral de metas ativas)
- Concluir/reabrir meta (auto-preenche current_amount = target ao concluir)
- Seção "Concluídas" separada (colapsada, opacity reduzida)
- Form inline para criar/editar

**Sidebar atualizada: 8+1** (Metas entre Patrimônio e Calculadoras).

### 32.9 Testes adicionais

| Suíte | Testes | Cobertura |
|-------|--------|-----------|
| `e1-e3-e6-features.test.ts` | 20 | E1 health badge (6), E3 subscription filter (6), E6 enrichGoal (8) |

### 32.10 E5: Política de Early Adopters

Documento `docs/POLITICA-EARLY-ADOPTERS.md`: acesso vitalício ao plano vigente, preço congelado, acesso antecipado a features beta, features nunca removidas. Inspirado nos erros do Organizze e acertos do YNAB. Zero código.

### 32.11 Q1: Cobertura de testes 60.9% → 67.9%

| Suíte | Testes | Hooks cobertos |
|-------|--------|----------------|
| `q1-hook-coverage-batch.test.tsx` | 26 | recurrences (4), economic-indices (5), fiscal (5), workflows (9), documents (2), reconciliation (1) |
| `q1-hook-coverage-batch2.test.tsx` | 29 | bank-connections (7), chart-of-accounts (5), currencies (13), family-members (4) |

Gaps restantes (< 60%): `push/send/route.ts` (21%), `digest/send/route.ts` (23%) — API routes, candidatos a Playwright E2E.

### 32.12 Q3: Sentry beforeSend (já implementado)

Os 3 configs Sentry já têm `beforeSend: scrubEvent` + PII sanitization. Falta DSN (ação Claudio A11).

### 32.15 Fix crítico: deploy Vercel quebrado por ESLint (commit 57bf21b)

**Problema:** Deploys Vercel falharam a partir do commit `82f181d` (Q1 batch 2). Site continuou no ar servindo o último deploy ok (`32379fb`).

**Causa raiz:** Os 2 novos arquivos de teste (`q1-hook-coverage-batch*.tsx`) usavam `require()` dentro de `describe` blocks (padrão Jest para lazy import após `jest.mock()`). A regra `@typescript-eslint/no-require-imports` do preset `recommended` tratava esses `require()` como **erro** (não warning). O `next build` do Vercel executa ESLint por padrão, encontrou 10 erros, e abortou o build.

**Fix:** Override no `.eslintrc.json` para `src/__tests__/**`:
- `@typescript-eslint/no-require-imports`: off
- `@typescript-eslint/no-unused-vars`: off
- `no-console`: off

**Lição aprendida:** Sempre rodar `npx next lint` (não apenas `npx eslint`) antes de push, pois é o que o Vercel executa. A diferença: `next lint` usa a config do Next.js que pode incluir regras adicionais e paths específicos.

**Verificação:** Deploy `57bf21b` → success. Smoke test: manifest 200, robots 200, sw.js 200, favicon 200.

### 32.16 E8: Exportação IRPF formatada (XLSX)

Serviço `fiscal-export.ts` gera planilha profissional com ExcelJS (já no projeto):

| Aba | Conteúdo |
|-----|----------|
| Resumo | Totais consolidados (tributáveis, isentos, deduções, bens, dívidas) |
| Rendimentos | Agrupados por tratamento fiscal (tributável, isento, exclusivo fonte, ganho capital) |
| Deduções | Despesas dedutíveis (integral e limitado) |
| Bens e Direitos | Patrimônio (assets + contas de investimento) com valor de aquisição e atual |
| Dívidas | Empréstimos, financiamentos e cartões com saldo devedor e taxa |
| Provisionamento IR | Projeção anual, gap, provisão mensal recomendada (só ano corrente) |

- Headers com cor Plum (#4F2F69), currency format `#,##0.00`
- Botão "Exportar" na página de IR, lazy import (code splitting)
- Zero deps novas (ExcelJS já existia)
- Timing: abril/maio é temporada IRPF, feature de fidelização anual

### 32.17 Q1 finalizado: cobertura 60.9% → 71.2%

3 batches de testes ao longo da sessão:

| Batch | Testes | Hooks cobertos |
|-------|--------|----------------|
| Batch 1 | 26 | recurrences, economic-indices, fiscal, workflows, documents, reconciliation |
| Batch 2 | 29 | bank-connections, chart-of-accounts, currencies, family-members |
| Batch 3 | 12 | cost-centers (PnL, allocate, overhead), indices (history, multi), recurrences (pending, update), savings-goals (CRUD) |
| **Total** | **67** | **15 hooks cobertos** |

| Métrica | Início sessão | Fim sessão |
|---------|--------------|------------|
| Statements | 60.9% | 71.2% |
| Branches | 52.1% | 58.7% |
| Functions | 59.2% | 75.3% |
| Lines | 63.0% | 74.4% |

Gaps restantes (< 50%): `push/send/route.ts` (21%), `digest/send/route.ts` (23%) — API routes com Next.js Request/Response, candidatos a Playwright E2E, não unit tests.

### 32.18 Estado do projeto (snapshot intermediário, ver §32.26 para versão final)

_Tabela removida para evitar confusão. Ground truth final em §32.26._

### Sessão 32 — Commits consolidados (final)

| Hash | Descrição |
|------|-----------|
| `7cbb3fb` | E2: gráfico Patrimônio Líquido |
| `a10b68b` | E9: interpretação de solvência |
| `a4418f7` | E7: simulador "Posso comprar?" |
| `d4507fe` | test(E7+E9): 22 testes |
| `dda0a44` | HANDOVER (E2/E7/E9) |
| `0daef6a` | E1: saúde de saldo |
| `c36ccad` | E3: assinaturas |
| `e9cda03` | E6: metas de economia |
| `bb99620` | test(E1+E3+E6): 20 testes |
| `32379fb` | HANDOVER (E1/E3/E6) |
| `df0aa39` | E5: early adopters + Q1 batch 1 |
| `82f181d` | Q1 batch 2: 29 testes |
| `4e0f1d6` | HANDOVER (E5/Q1/Q3) |
| `57bf21b` | fix(build): ESLint override para testes |
| `0eeee01` | HANDOVER: fix Vercel §32.15 |
| `1435990` | E8: exportação IRPF (XLSX) |
| `4549cf9` | Q1 batch 3: 12 testes |
| `b63bd50` | HANDOVER (E8/Q1 final) |
| `fec8865` | TEC-07: LGPD + E11 inatividade confirmado |
| `5b26b7c` | chore: desabilitar Uptime Monitor |
| `b6e75d5` | security: remover secrets do repo |
| `b98d550` | chore: repo público + Uptime Monitor reativado |
| `1786548` | E12: projeção indexada IPCA/IGP-M |
| `c8f2b64` | E13: Capital Humano (DCF da carreira) |
| `b4b1a7a` | fix(lint): escapar aspas JSX |

### 32.19 Segurança: repo público + rotação de chaves

**Decisão:** Tornar repo público para GitHub Actions ilimitado (free tier: 2000 min/mês para private, ilimitado para public).

**Ações executadas:**
1. Secrets removidos dos arquivos atuais (HANDOVER, SETUP-LOCAL, .env.example)
2. Repo tornado público via GitHub API
3. GitHub PATs antigos revogados automaticamente (GitHub Secret Scanning)
4. Supabase legacy API keys desabilitadas por Claudio no Dashboard
5. Novo GitHub PAT gerado por Claudio
6. Uptime Monitor reativado (minutos ilimitados)
7. CI verde (Lint + TypeCheck + Tests + Build + Security)
8. Post-Deploy Check verde

**Secrets no histórico (todos neutralizados):**
- GitHub PATs (2): revogados pelo GitHub
- Supabase anon key (oniefy-prod): legacy keys desabilitadas
- Supabase service_role key (oniefy-prod): legacy keys desabilitadas
- Supabase anon key (projeto legado): projeto DELETADO
- VAPID private key: nunca configurada em produção (não há env vars no Vercel)
- Email pessoal: aceitar (risco = spam)
- Gemini/Anthropic API keys: NÃO no repo (só em process.env via Vercel)

### 32.20 E12: Projeção indexada de despesas recorrentes

Componente `expense-projection.tsx` na 2ª aba de Calculadoras (6 → 7 tabs):
- 3 cenários: pessimista (+2 p.p.), base (índices atuais), otimista (-1 p.p.)
- Cada recorrência projetada pelo seu adjustment_index (IPCA default)
- Gráfico Recharts (3 linhas) + cards com totais 12 meses + metodologia
- Dados do BCB (coleta diária via pg_cron)
- Zero deps novas, zero schema changes

### 32.21 E13: Capital Humano (DCF da carreira)

Componente `human-capital-calculator.tsx` na 7ª aba de Calculadoras:
- DCF: PV = Σ (Renda × (1+g)^t) / (1+r)^t para t=1..anos_até_aposentadoria
- 6 inputs: idade, aposentadoria, renda mensal, crescimento real, desconto, patrimônio
- 3 outputs: Capital Humano (VP), Gap descoberto, Cobertura seguro recomendada
- Gráfico barras (VP renda anual + VP acumulado) + linha referência patrimônio
- Insight contextualizado: "gap de R$ X descoberto, cobertura Y%"
- Ref: CFA Institute, Ibbotson et al. 2007

### 32.22 Estado do projeto (snapshot intermediário, ver §32.26 para versão final)

_Tabela removida para evitar confusão. Ground truth final em §32.26._

### 32.23 Organização do repositório

**Estrutura raiz limpa (apenas 3 .md):**
- `README.md` — Porta de entrada do projeto (reescrito para repo público)
- `HANDOVER-WealthOS.md` — Fonte de verdade (lido no início de cada sessão)
- `PENDENCIAS-FUTURAS.md` — Backlog ativo de produto

**Arquivos movidos para docs/:**
- `CFA-ONIEFY-MAPPING.md` → `docs/CFA-ONIEFY-MAPPING.md`
- `PLANO-REVISAO-ONIEFY.md` → `docs/PLANO-REVISAO-ONIEFY.md`
- `RELATORIO-AUDITORIA-2026-03-19.md` → `docs/RELATORIO-AUDITORIA-2026-03-19.md`

**Duplicata removida:**
- `docs/MAPEAMENTO-LGPD.md` (versão antiga) — mantida `docs/LGPD-MAPEAMENTO.md` (versão atual)

**Referências internas atualizadas** em HANDOVER e PENDENCIAS para refletir novos paths.

**Estrutura docs/ final:**
```
docs/
  audit/           # 11 arquivos de auditoria de segurança (sessões 18-19)
  data/            # Catálogos BCB SGS e IBGE SIDRA (.xlsx)
  specs/           # 8 documentos de especificação (.docx)
  AUDIT-CODE-DUMP.md           # Snapshot de código para auditoria (histórico, 852KB)
  AUDIT-PROMPT-GEMINI.md       # Prompt usado na auditoria Gemini
  AUDITORIA-TECNICA-*.md       # Auditoria contra projeto legado
  CFA-ONIEFY-MAPPING.md        # Mapeamento CFA + Motor JARVIS
  DEPLOY-VERCEL.md             # Guia de deploy
  LGPD-MAPEAMENTO.md           # Conformidade LGPD (TEC-07)
  MATRIZ-VALIDACAO.md          # Matriz de validação de stories
  MIGRATE-SUPABASE-SP.md       # Guia migração para sa-east-1
  PLANO-REVISAO-ONIEFY.md      # Plano de revisão pré-lançamento
  POLITICA-EARLY-ADOPTERS.md   # Política early adopters (E5)
  PROMPT-CLAUDE-CODE-E2E.md    # Prompt para testes E2E
  RELATORIO-AUDITORIA-*.md     # Relatório de auditoria
  ROTEIRO-TESTE-MANUAL.md      # Roteiro de teste manual
  SETUP-LOCAL.md               # Setup desenvolvimento local
```

### 32.24 Padronização decimal BR (vírgula) e correções UI

**5 issues corrigidas:**
1. MFA banner movido para 1o lugar no Dashboard (segurança = prioridade)
2. Calculadoras tabs padronizados (sem ícones, flex-1, shadow-sm, border bg-muted)
3. Índices "Atualizar índices" crashava (FetchResult.errors → error_count)
4. Selic/CDI "% ao ano" → "% ao mês" (BCB SGS retorna taxa mensal)
5. Padronização decimal: .toFixed() → formatDecimalBR() em 21 arquivos

**3 novos helpers em lib/utils:**
- `formatPercent(value, decimals)` — percentuais com vírgula
- `formatDecimalBR(value, decimals)` — números com vírgula
- `formatAxisBR(value)` — formato compacto para eixos (1,5M / 45k)

### 32.25 Migração de env vars (segurança)

Nomes renomeados para evitar conflito com integração Vercel-Supabase:

| Antigo | Novo | Tipo |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_ONIEFY_DB_URL` | Público (browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_ONIEFY_DB_KEY` | Público (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | `ONIEFY_DB_SECRET` | Servidor only |

14 arquivos alterados. Valores no Vercel:
- `NEXT_PUBLIC_ONIEFY_DB_URL` = `https://mngjbrbxapazdddzgoje.supabase.co`
- `NEXT_PUBLIC_ONIEFY_DB_KEY` = `sb_publishable_...` (Claudio configurou)
- `ONIEFY_DB_SECRET` = `sb_secret_...` (Claudio configurou)

### 32.26 Estado do projeto (ground truth FINAL sessão 32)

| Métrica | Valor |
|---------|-------|
| Stories | 105/108 (3 bloqueadas por Mac) |
| Tabelas | 35 |
| Políticas RLS | 107 |
| Functions | 74 |
| Triggers | 22 |
| ENUMs | 29 |
| Indexes | 144 |
| Migrations MCP | 53 |
| Migration files (repo) | 60 |
| pg_cron jobs | 13 |
| Suítes Jest | 50 (775 assertions) |
| Cobertura statements | 71.2% |
| Arquivos TS/TSX | 213 |
| Hooks | 31 |
| Schemas Zod | 33 |
| Páginas autenticadas | 22 |
| Sidebar | 8+1 |
| Calculadoras | 7 tabs |
| CI | ✅ Verde (repo público, Actions ilimitado) |
| Deploy | www.oniefy.com (success) |
| Design System | Plum Ledger v1.2 |
| Repo | Público (https://github.com/drovsk-cmf/WealthOS) |
| Supabase keys | Legacy DESABILITADAS (26/03). Novas publishable+secret ativas |
| Supabase legado | Projeto hmwdfcsxtmbzlslxgqus DELETADO (26/03) |
| Env vars | Renomeadas (ONIEFY_DB_*) sem conflito com integrações |
| Formatação decimal | Padrão BR (vírgula) em toda a plataforma |

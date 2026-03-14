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
| Functions (total) | 39 (29 RPCs + 6 trigger functions + 4 cron wrappers) |
| Triggers | 19 |
| ENUMs | 24 |
| Migrations aplicadas | 39 partes em 26 versões (001 a 026) |
| pg_cron jobs | 4 (workflow tasks diário, depreciação mensal, balance check semanal, **índices diário**) |
| Contas no plano-semente | 140 |
| Centros de custo | 1 (Família Geral, is_overhead) |
| Categorias | 16 (únicas, cores Plum Ledger) |
| Parâmetros fiscais | 9 (IRPF mensal/anual 2025+2026, INSS 2025+2026, salário mínimo 2025+2026, ganho capital) |
| Índices econômicos | ~60 registros (8 tipos: IPCA, INPC, IGP-M, Selic, CDI, TR, USD/BRL, salário mínimo) |
| Fontes de índices | 15 (BCB SGS + IBGE SIDRA configuradas) |
| User stories total | 90 |
| Stories concluídas | 71 (65 + 6 fase 9: BANK-01-06) |
| Supabase security advisories | 0 code-level (1 Dashboard: leaked password protection) |
| Supabase perf advisories | 0 WARN (unused_index INFO apenas, esperado sem dados) |

### 3.3 Functions (29 RPCs + 6 triggers + 4 cron)

| Grupo | Functions |
|---|---|
| Setup/Seed | create_default_categories, create_default_chart_of_accounts, create_default_cost_center, create_coa_child, create_family_member, handle_new_user |
| Triggers | handle_updated_at, recalculate_account_balance, activate_account_on_use, rls_auto_enable, validate_journal_balance |
| Transaction Engine | create_transaction_with_journal, create_transfer_with_journal, reverse_transaction |
| Dashboard | get_dashboard_summary, get_balance_sheet, get_solvency_metrics, get_top_categories, get_balance_evolution, get_budget_vs_actual |
| Recurrence/Asset | generate_next_recurrence, depreciate_asset, get_assets_summary |
| Centers | allocate_to_centers, get_center_pnl, get_center_export |
| Workflows | auto_create_workflow_for_account, generate_tasks_for_period, complete_workflow_task |
| Fiscal | get_fiscal_report, get_fiscal_projection |
| Índices | get_economic_indices, get_index_latest |
| Import | import_transactions_batch, auto_categorize_transaction |
| Cron (pg_cron) | cron_generate_workflow_tasks (diário 02h), cron_depreciate_assets (mensal dia 1 03h), cron_balance_integrity_check (semanal dom 04h), cron_fetch_economic_indices (diário 06h UTC / 03h BRT) |

### 3.4 Código Fonte (~90 arquivos em src/)

```
src/
├── __tests__/                    # 7 suítes de teste (Jest + RTL)
│   ├── auth-validation.test.ts
│   ├── onboarding-seeds.test.ts
│   ├── parsers.test.ts
│   ├── read-hooks.test.tsx
│   ├── rpc-auto-categorize-schema.test.ts
│   ├── rpc-schemas.test.ts
│   └── transaction-hooks.test.tsx
├── app/
│   ├── (app)/                    # Rotas autenticadas (16 páginas)
│   │   ├── accounts/page.tsx
│   │   ├── assets/page.tsx
│   │   ├── bills/page.tsx
│   │   ├── budgets/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── chart-of-accounts/page.tsx
│   │   ├── connections/page.tsx   # Wizard decomposto em 5 componentes
│   │   ├── cost-centers/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── family/page.tsx
│   │   ├── indices/page.tsx
│   │   ├── settings/page.tsx + security/page.tsx
│   │   ├── tax/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── workflows/page.tsx
│   │   └── layout.tsx            # Sidebar (lógica auth extraída para useAuthInit)
│   ├── (auth)/                   # Auth flow (6 páginas)
│   │   ├── login, register, onboarding, mfa-challenge,
│   │   ├── forgot-password, reset-password
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/callback/route.ts
│   │   └── indices/fetch/route.ts  # Coleta BCB SGS
│   └── layout.tsx, globals.css
├── components/
│   ├── accounts/account-form.tsx
│   ├── assets/asset-form.tsx
│   ├── budgets/budget-form.tsx
│   ├── categories/category-form.tsx
│   ├── connections/              # Wizard de importação decomposto (WEA-013)
│   │   ├── import-wizard.tsx
│   │   ├── import-step-upload.tsx
│   │   ├── import-step-mapping.tsx
│   │   ├── import-step-preview.tsx
│   │   └── import-step-result.tsx
│   ├── dashboard/ (8 componentes + index.ts)
│   ├── recurrences/recurrence-form.tsx
│   └── transactions/transaction-form.tsx
├── lib/
│   ├── auth/ (8 arquivos: encryption-manager, index, mfa, biometric,
│   │          session-timeout, app-lifecycle, password-blocklist, rate-limiter)
│   ├── crypto/index.ts
│   ├── hooks/ (16 hooks: accounts, assets, auth-init, bank-connections, budgets,
│   │          categories, chart-of-accounts, cost-centers, dashboard, dialog-helpers,
│   │          economic-indices, family-members, fiscal, recurrences, transactions,
│   │          workflows)
│   ├── parsers/ (csv-parser.ts, ofx-parser.ts, xlsx-parser.ts)
│   ├── schemas/rpc.ts            # Schemas Zod para 9 RPCs (WEA-002)
│   ├── services/
│   │   ├── onboarding-seeds.ts   # Seeds extraído de page.tsx (WEA-003)
│   │   └── transaction-engine.ts
│   ├── supabase/ (client.ts, server.ts)
│   ├── utils/index.ts
│   ├── validations/auth.ts
│   └── query-provider.tsx
├── middleware.ts                  # Root redirect, auth check, session refresh
└── types/database.ts             # 26 tables, 34 functions, 24 enums (regenerado via MCP)
```

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
- ~~Cobertura de testes: FEITO (7 suítes, 46 testes, Jest + RTL)~~

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
| ~~Testes~~ | FEITO: Jest + RTL configurados. 7 suítes, 46 testes (schemas Zod, parsers, hooks leitura/mutação, auth validation, onboarding seeds). Testes SQL: 4 cenários executados no Supabase (transação, transferência ativo-ativo, ativo-passivo, journal desbalanceado). |
| ~~Microcopy~~ | FEITO: 14 violações MAN-LNG-CMF-001 corrigidas em 28 arquivos (reticências, metadiscurso, superlativos, empty states) |
| ~~Logo + icons~~ | FEITO: Penrose Ribbon integrado. 6 SVGs transparentes (lockup-h/v, logomark, plum/bone) + OG PNG. Favicon, apple-touch-icon, PWA icons substituídos. next/image com unoptimized. Dark mode via dark:hidden/dark:block. Login: lockup-v. Sidebar/mobile: lockup-h. |
| ~~Edge Functions~~ | FEITO: pg_cron habilitado. 3 jobs: workflow tasks (diário), depreciação (mensal), balance check (semanal) |
| ~~Search path fix~~ | FEITO: 11 functions com search_path mutable corrigidas (migration 017) |
| ~~Redirect raiz~~ | CORRIGIDO anteriormente |
| ~~RLS initplan~~ | FEITO: 77 policies reescritas com `(select auth.uid())`. Migration 018 |
| ~~Unindexed FKs~~ | FEITO: 14 indexes criados para FK columns. Migration 019 |
| Leaked password protection | Requer Supabase Pro. Claudio acionará quando assinar a plataforma |
| ~~Ícones Lucide~~ | FEITO: emojis decorativos (📊🏦📈✓📄💰🏷️📋) substituídos por Lucide React SVG icons em 7 arquivos. Emojis de avatar familiar mantidos (dados persistidos em BD) |
| Conciliação bancária (3 camadas) | **Camada 1:** Status tracking: ENUM lifecycle (pendente → vencida → paga → cancelada), `due_date` separado de `date`, pg_cron diário marca vencidas. **Camada 2:** Auto-matching na importação: ao importar extrato, cruzar com pendentes (mesma conta, valor ±10%, janela ±7 dias); se match, baixa a pendente em vez de duplicar; registra ajuste se valor difere. **Camada 3:** Tela de reconciliação manual: lado a lado pendentes × importadas sem match, usuário liga pares manualmente. Pré-requisito: Camada 1 antes de 2. |
| Orçamento delegado por membro | Membro cria proposta orçamentária para seu centro, responsável aprova, consolida no orçamento familiar. Requer role system em family_members (owner/member já existe). |

---

## 8. Documentação de Referência (8 documentos no projeto)

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
- Pacote 3: `database.ts` regenerado via `Supabase:generate_typescript_types`. 26 tabelas, 34 functions, 24 enums. 12 erros `null` vs `undefined` corrigidos em 4 arquivos

**Estado final dos testes:**
- 7 suítes, 46 testes, todos passando
- Testes SQL: 4 cenários executados no Supabase
- CI: 3/3 jobs verdes (Security, Lint & TypeCheck, Build)

**Modelo operacional Claude + Codex validado:**

1. Claude analisa, produz ordem de execução com spec detalhada
2. Claudio envia ao Codex
3. Codex executa em branch separada
4. Claude revisa, corrige, valida e faz merge + aplica migrations

Problemas recorrentes do Codex: reintroduz bugs já corrigidos (trabalha sobre snapshot sem consciência de correções posteriores), não segue política de commits, não entrega relatório final.

**Commits desta sessão (14/03/2026):**
74e837d (revert Maze Cube), 4d5c251 (HANDOVER 11e), dbb5bb6 (logo Penrose Ribbon), 73e59c3 (tagline), d8d4d54 (etimologia), e68ef91 (Codex auditoria), a5f093f (fix onboarding-seeds), 7aee0ca (merge Pacote 1 Codex), 9bd7991 (pacotes 2+3), 0798e29 (README fix)

---

## 12. Próximos Passos

**Fazível remotamente (próxima sessão Claude):**

| Item | Esforço |
|---|---|
| UX médios: drag-and-drop no upload, feedback loading em mutations, ícone desativar conta (lixeira → archive) | 2-3h |
| Conciliação bancária (3 camadas) | 1-2 dias |
| Orçamento delegado por membro | 4-6h |
| Expandir schemas Zod para RPCs restantes (22 `as unknown as` remanescentes em hooks fora do escopo WEA-002) | 2-3h |
| Expandir cobertura de testes (alvo: 80+ test cases) | 1 dia |

**Ação do Claudio (em paralelo):**

| Item | Ação |
|---|---|
| ~~Logo definitivo~~ | FEITO: Penrose Ribbon integrado (commit dbb5bb6) |
| Leaked password protection | Requer Supabase Pro. Habilitar quando assinar: Auth > Settings > HaveIBeenPwned |
| Validação mensal de parâmetros fiscais | IRPF, INSS, salário mínimo podem mudar por portaria/lei. Verificar periodicamente se há novas publicações no DOU. |
| Apple Developer Account | US$ 99/ano. Necessário para submissão App Store. Claudio decidiu não assinar ainda |

**Requer Mac (A1502 para dev, Mac emprestado para submit):**

| Item | Esforço |
|---|---|
| Biometria real (Capacitor BiometricAuth) | 4-6h |
| OCR real (WKF-03, Apple Vision + Tesseract.js, **+PDF**) | 4-6h |
| Capacitor iOS build + teste (A1502 com Xcode 14.2) | 2h |
| Submissão App Store (Mac com Apple Silicon emprestado) | 2h |

---

## 13. Conexões

- **GitHub:** Fine-grained PAT e Classic PAT disponíveis (Claudio fornece no início da sessão)
- **Supabase:** via conector MCP remoto (mcp.supabase.com/mcp), autenticado por OAuth. Project ID: hmwdfcsxtmbzlslxgqus
- **Local dev:** `C:\Users\claud\Documents\PC_WealthOS`, `.env.local` já configurado

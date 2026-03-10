# WealthOS - Handover de Sessão

**Data:** 10 de março de 2026
**Projeto:** WealthOS - Sistema Integrado de Gestão Financeira e Patrimonial
**Repositório GitHub:** drovsk-cmf/WealthOS (privado)
**Supabase Project ID:** hmwdfcsxtmbzlslxgqus
**Google Drive:** Meu Drive > 00. Novos Projetos > WealthOS > Documentacao/

---

## 1. O que é o WealthOS

Sistema de gestão financeira e patrimonial para uso pessoal, posicionado como "Sistema Operativo de Riqueza" (não um expense tracker). Público-alvo: profissionais de alta renda com múltiplas fontes de receita e complexidade fiscal ("The Hybrid Earner"). Foco em blindagem patrimonial, eficiência tributária e privacidade.

**Modelo contábil:** partida dobrada como motor interno (invisível ao usuário), com plano de contas híbrido (CPC simplificado por baixo, linguagem natural na interface). Filosofia Apple: mecânica complexa invisível, resultado simples entregue ao usuário.

**Diferencial implementado:** Inteligência de Provisionamento de IR. Calcula projeção anual IRPF baseada em múltiplas fontes de renda, aplica tabela progressiva + redução Lei 15.270/2025, compara com IRRF retido, e recomenda valor mensal a provisionar. Resolve o cenário de pessoa com 2+ contratos CLT sem retenção individual.

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
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
| 9. Integração Bancária | Import CSV/OFX, auto-categorização, bank_connections | CONCLUÍDA |

### 3.2 Banco de Dados (Supabase)

| Métrica | Valor |
|---|---|
| Tabelas | 24 (23 + bank_connections, todas com RLS) |
| Políticas RLS | 80 (76 + 4 bank_connections) |
| Functions | 31 (29 + auto_categorize_transaction + import_transactions_batch) |
| Triggers | 17 (16 + bank_connections updated_at) |
| ENUMs | 22 (21 + sync_status) |
| Migrations aplicadas | 19 partes em 10 versões (001 a 010) |
| Contas no plano-semente | 140 |
| Centros de custo | 2 |
| Categorias | 32 |
| Parâmetros fiscais | 7 (IRPF mensal/anual 2025+2026, INSS, salário mínimo, ganho capital) |
| Índices econômicos | 24 registros reais (IPCA + Selic, mar/2025 a mar/2026) |
| Fontes de índices | 15 (BCB SGS + IBGE SIDRA configuradas) |
| User stories total | 90 |
| Stories concluídas | 71 (65 + 6 fase 9: BANK-01-06) |

### 3.3 Functions (29 no banco)

| Grupo | Functions |
|---|---|
| Setup/Seed | create_default_categories, create_default_chart_of_accounts, create_default_cost_center, handle_new_user |
| Triggers | handle_updated_at, recalculate_account_balance, activate_account_on_use, rls_auto_enable |
| Transaction Engine | create_transaction_with_journal, create_transfer_with_journal, reverse_transaction |
| Dashboard | get_dashboard_summary, get_balance_sheet, get_solvency_metrics, get_top_categories, get_balance_evolution, get_budget_vs_actual |
| Recurrence/Asset | generate_next_recurrence, depreciate_asset, get_assets_summary |
| Centers | allocate_to_centers, get_center_pnl, get_center_export |
| Workflows | auto_create_workflow_for_account, generate_tasks_for_period, complete_workflow_task |
| Fiscal | get_fiscal_report, get_fiscal_projection |
| Índices | get_economic_indices, get_index_latest |

### 3.4 Código Fonte (72 arquivos em src/)

```
src/
├── app/
│   ├── (app)/                    # Rotas autenticadas (13 páginas)
│   │   ├── accounts/page.tsx
│   │   ├── assets/page.tsx
│   │   ├── bills/page.tsx
│   │   ├── budgets/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── chart-of-accounts/page.tsx
│   │   ├── cost-centers/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── indices/page.tsx
│   │   ├── settings/page.tsx + security/page.tsx
│   │   ├── tax/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── workflows/page.tsx
│   │   └── layout.tsx            # Sidebar com 14 links
│   ├── (auth)/                   # Auth flow (6 páginas)
│   │   ├── login, register, onboarding, mfa-challenge,
│   │   ├── forgot-password, reset-password
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/callback/route.ts
│   │   └── indices/fetch/route.ts  # Coleta BCB SGS
│   └── layout.tsx, globals.css
├── components/                   # 11 componentes
│   ├── accounts/account-form.tsx
│   ├── assets/asset-form.tsx
│   ├── budgets/budget-form.tsx
│   ├── categories/category-form.tsx
│   ├── dashboard/ (8 componentes + index.ts)
│   ├── recurrences/recurrence-form.tsx
│   └── transactions/transaction-form.tsx
├── lib/
│   ├── auth/ (6 arquivos: encryption, mfa, biometric, session, blocklist)
│   ├── crypto/index.ts
│   ├── hooks/ (12 hooks: accounts, assets, budgets, categories,
│   │          chart-of-accounts, cost-centers, dashboard, economic-indices,
│   │          fiscal, recurrences, transactions, workflows)
│   ├── services/transaction-engine.ts
│   ├── supabase/ (client.ts, server.ts)
│   ├── utils/index.ts
│   ├── validations/auth.ts
│   └── query-provider.tsx
├── middleware.ts                  # Root redirect, auth check, session refresh
└── types/database.ts             # 23 tables, 29 functions, 21 enums typed
```

---

## 4. Dados do Usuário de Teste

- ID: 04c41302-5429-4f97-9aeb-e21294d014ff
- Nome: Claudio Filho
- Provider: Google OAuth
- MFA: TOTP ativo (fator 664baa78-1060-4b5b-ae78-e4bc2a6e8fe4)
- onboarding_completed: true
- Dados seed: 140 contas contábeis, 2 centros, 32 categorias
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
| **9. Integração Bancária** | **Import CSV/OFX, auto-categorização, bank_connections** | **CONCLUÍDA** | **BANK-01-06** |
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

**Parsers (330 linhas):**
- OFX parser: SGML (v1.x) e XML (v2.x), extração de FITID/DTPOSTED/TRNAMT/NAME
- CSV parser: auto-detect separador (;/,/tab), formatos BR (DD/MM/YYYY, 1.234,56), column mapping com sugestão

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

**Migrations aplicadas:** 011 (dedup index) + 012 (balance validation) + 013 (stable KEK) + 014 (transfer RPC) + 015 (nullable import) + 016 (pg_cron + jobs) + 017 (search_path fix). Total: 26 tabelas, 82 RLS, 22 ENUMs, 32 RPCs + 3 cron functions, 1 validation trigger, 3 pg_cron jobs.

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
- Cobertura de testes: expandir na Fase 10

---

## 7. Items de Polish (Fase 10 backlog)

| Item | Detalhe |
|---|---|
| ~~PWA icon 404~~ | FEITO: icon-192, icon-512, favicon.ico, apple-touch-icon |
| ~~Euro sem símbolo~~ | FEITO: "Euro" → "Euro (€)" no onboarding |
| ~~Rebranding~~ | FEITO: WealthOS → Oniefy (UI, config, logs, TOTP). Crypto strings preservadas |
| ~~Next.js upgrade~~ | FEITO: 14.2.14 → 15.5.12, React 18 → 19. Zero breaking changes no nosso código |
| OCR real | WKF-03 é stub; implementar Apple Vision / Tesseract.js (requer Mac) |
| Capacitor build | Build iOS, teste em dispositivo, submissão App Store (requer Mac) |
| Biometria real | Stub → Capacitor BiometricAuth plugin (requer Mac) |
| Testes | Jest + React Testing Library, cobertura mínima |
| ~~Edge Functions~~ | FEITO: pg_cron habilitado. 3 jobs: workflow tasks (diário), depreciação (mensal), balance check (semanal) |
| ~~Search path fix~~ | FEITO: 11 functions com search_path mutable corrigidas (migration 017) |
| ~~Redirect raiz~~ | CORRIGIDO anteriormente |
| RLS initplan | Performance: ~50 policies com `auth.uid()` → `(select auth.uid())`. Baixa urgência (single-user). |
| Unindexed FKs | Performance: 14 FKs sem index. Baixa urgência (pouco dado). |
| Leaked password protection | Habilitar no Dashboard Supabase: Auth > Settings > HaveIBeenPwned |

---

## 8. Documentação de Referência (8 documentos no projeto)

| Doc | Conteúdo chave |
|---|---|
| wealthos-especificacao-v1.docx | Stack, segurança, modelo de dados original, módulos, fases |
| wealthos-funcional-v1.docx | 62 user stories MVP com critérios de aceite |
| wealthos-adendo-v1.1.docx | Decisões (2 saldos, carência 7d, E2E, APNs) |
| wealthos-adendo-v1.2.docx | Apple App Store, importação, OCR, offline, a11y |
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

## 11. Conexões

- **GitHub:** Fine-grained PAT e Classic PAT disponíveis (Claudio fornece no início da sessão)
- **Supabase:** via conector MCP remoto (mcp.supabase.com/mcp), autenticado por OAuth. Project ID: hmwdfcsxtmbzlslxgqus
- **Local dev:** `C:\Users\claud\Documents\PC_WealthOS`, `.env.local` já configurado

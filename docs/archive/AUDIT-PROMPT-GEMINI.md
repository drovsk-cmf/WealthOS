# Auditoria Técnica Completa - Oniefy

## Contexto do Projeto

**Oniefy** é um sistema de gestão financeira e patrimonial pessoal ("Wealth Operating System"), posicionado para profissionais de alta renda com múltiplas fontes de receita e complexidade fiscal. Projeto solo-developer, single-user escalável para família (2-4 usuários). Repositório privado.

Tagline: "Any asset, one clear view."

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15.5.12 (App Router) + React 19.2.4 + TypeScript |
| UI | shadcn/ui + Tailwind CSS + design system "Plum Ledger" |
| Backend/BaaS | Supabase (PostgreSQL + Auth + RLS + Storage) |
| State Management | React Query (TanStack) + Zustand |
| Validação | Zod |
| Mobile | Capacitor 6 (PWA empacotada para iOS) |
| CI/CD | GitHub Actions (3 jobs: Security + Lint/TypeCheck + Build) |
| Testes | Jest + React Testing Library (12 suítes, 135 testes) |
| Gráficos | Recharts |
| Parsers | PapaParse (CSV), SheetJS (XLSX), custom OFX parser |

## Números do Codebase

- **102 arquivos TypeScript/TSX** em `src/` (~18.900 linhas)
- **30 migrations SQL** (~5.600 linhas)
- **25 tabelas** PostgreSQL (todas com RLS)
- **84 políticas RLS**
- **45 functions** (32 RPCs + 7 triggers + 6 pg_cron wrappers)
- **25 ENUMs**
- **18 páginas** autenticadas + 6 páginas de auth
- **18 hooks** React Query
- **27 schemas Zod** (cobertura completa dos RPCs)
- **3 parsers** (CSV, OFX, XLSX)
- **1 Service Worker** (PWA offline)
- **87/90 user stories** concluídas (3 bloqueadas por hardware iOS)

## Arquitetura Geral

### Modelo Contábil
Motor de partida dobrada invisível ao usuário. Cada transação gera automaticamente journal_entries + journal_lines via RPC PostgreSQL (`create_transaction_with_journal`). Append-only (estornos obrigatórios). 140 contas-semente no plano de contas (CPC simplificado + linguagem natural na UI).

### Segurança
- Auth: Supabase GoTrue (email/senha + Google OAuth + Apple Sign-In)
- MFA: TOTP obrigatório após cadastro
- RLS: 84 políticas, todas usando `(select auth.uid())` (initplan optimization)
- Criptografia E2E: AES-256, DEK aleatória, KEK derivada de material estável (não do JWT)
- Rate limiter: in-memory sliding window em 4 rotas de auth
- Session timeout: 30 min inatividade
- CSP: Content-Security-Policy no next.config.js

### Banco de Dados (pg_cron)
6 jobs automatizados:
1. `cron_mark_overdue_transactions` (diário 01h UTC)
2. `cron_generate_workflow_tasks` (diário 02h UTC)
3. `cron_process_account_deletions` (diário 03:30 UTC)
4. `cron_fetch_economic_indices` (diário 06h UTC)
5. `cron_depreciate_assets` (mensal dia 1 03h UTC)
6. `cron_balance_integrity_check` (semanal dom 04h UTC)

### Conciliação Bancária (3 camadas)
1. **Status lifecycle**: ENUM `payment_status` (pending/overdue/paid/cancelled), trigger bidirecional `is_paid ↔ payment_status`
2. **Auto-matching**: import_transactions_batch cruza com pendentes (±10% valor, ±7 dias, score < 25)
3. **Manual**: tela lado a lado pendentes × importadas com pareamento manual

## Estrutura de Arquivos (src/)

```
src/
├── __tests__/                    # 12 suítes (135 testes)
│   ├── auth-schemas-extended.test.ts
│   ├── auth-validation.test.ts
│   ├── dialog-helpers.test.ts
│   ├── onboarding-seeds.test.ts
│   ├── parsers.test.ts
│   ├── rate-limiter.test.ts
│   ├── read-hooks.test.tsx
│   ├── rpc-auto-categorize-schema.test.ts
│   ├── rpc-schemas.test.ts
│   ├── rpc-schemas-extended.test.ts
│   ├── transaction-hooks.test.tsx
│   └── utils.test.ts
├── app/
│   ├── (app)/                    # 18 páginas autenticadas
│   │   ├── accounts, assets, bills, budgets, categories
│   │   ├── chart-of-accounts, connections, cost-centers
│   │   ├── dashboard, family, indices
│   │   ├── settings/ (page + security + profile + data)
│   │   ├── tax, transactions, workflows
│   │   └── layout.tsx            # Sidebar, auth check, offline banner
│   ├── (auth)/                   # 6 páginas: login, register, onboarding, mfa, forgot/reset
│   ├── api/
│   │   ├── auth/callback/route.ts
│   │   └── indices/fetch/route.ts
│   └── layout.tsx, globals.css
├── components/
│   ├── accounts/account-form.tsx
│   ├── assets/asset-form.tsx
│   ├── budgets/budget-form.tsx
│   ├── categories/category-form.tsx
│   ├── connections/ (import wizard 5 steps + reconciliation-panel)
│   ├── dashboard/ (8 componentes)
│   ├── recurrences/recurrence-form.tsx
│   └── transactions/transaction-form.tsx
├── lib/
│   ├── auth/ (encryption-manager, mfa, rate-limiter, session-timeout, biometric, app-lifecycle, password-blocklist)
│   ├── crypto/index.ts (E2E: generateDEK, deriveKEK, encryptField, decryptField)
│   ├── hooks/ (18 hooks React Query)
│   ├── parsers/ (csv, ofx, xlsx)
│   ├── schemas/rpc.ts (27 schemas Zod)
│   ├── services/ (onboarding-seeds, transaction-engine)
│   ├── supabase/ (client.ts, server.ts)
│   ├── utils/index.ts (cn, formatCurrency, formatDate, formatRelativeDate)
│   ├── validations/auth.ts (login, register, mfa, forgot, reset, password strength)
│   └── query-provider.tsx
├── middleware.ts (rate limit + session refresh + route protection)
└── types/database.ts (gerado pelo Supabase CLI)
```

## Migrations SQL (30 versões)

001: Schema inicial (13 tabelas, 9 ENUMs, 48 RLS, triggers)
002: Modelo contábil (10 tabelas, 12 ENUMs, journal_entries, chart_of_accounts, cost_centers)
003-009: RPCs por módulo (transaction engine, dashboard, recurrence, centers, workflows, fiscal, indices)
010: Bank connections + import_transactions_batch + auto_categorize
011-019: Dedup index, journal validation, stable KEK, transfer RPC, pg_cron, search_path, RLS initplan, FK indexes
020-023: Bug fixes (COA update, categories unique, loan/financing types, COA child, cost center unique, family members)
024-025: Tax params 2026 (INSS, salário mínimo), cron daily index fetch
026-027: Transfer passive rules, budget family member
028a-028b: Reconciliação bancária (payment_status, auto-matching, match_transactions)
029: cron_process_account_deletions

## O que preciso que você audite

Vou colar o código de TODOS os arquivos na sequência. Faça uma **varredura técnica completa** cobrindo:

### 1. Segurança
- Vulnerabilidades em autenticação, autorização, session management
- Exposição de dados sensíveis (chaves, tokens, PII)
- Injection (SQL, XSS, CSRF)
- RLS gaps (tabelas ou operações sem proteção adequada)
- Rate limiting adequado
- CSP e security headers
- Criptografia E2E: implementação correta da derivação de chave, IV, padding
- Service Worker: cache poisoning, stale data

### 2. Qualidade do Código
- Padrões TypeScript (any, type assertions desnecessárias, null safety)
- React patterns (memory leaks, missing cleanup, stale closures)
- Error handling (try/catch adequado, error boundaries, fallbacks)
- React Query patterns (query key consistency, invalidation, race conditions)
- Componentes com responsabilidade excessiva (god components)
- Duplicação de lógica
- Dead code

### 3. Banco de Dados
- RPCs: SQL injection, permissões, SECURITY DEFINER usage
- Triggers: performance, edge cases, infinite loops
- pg_cron: robustez, error handling, idempotência
- Indexes: missing, redundant, ou mal dimensionados
- RLS: policies corretas, sem bypass possível
- Auto-matching: edge cases (valores negativos, transferências, duplicatas)

### 4. Performance
- N+1 queries
- Re-renders desnecessários (missing memoization)
- Bundle size concerns (dynamic imports necessários?)
- Supabase query patterns (selects excessivos, filtros no client vs server)
- Service Worker: precache strategy adequada

### 5. UX/Acessibilidade
- Acessibilidade (aria-labels, keyboard navigation, focus management)
- Loading states adequados
- Error states com recovery action
- Mobile responsiveness issues
- Empty states consistentes

### 6. Arquitetura
- Separação de concerns (páginas vs hooks vs services)
- Acoplamento excessivo entre módulos
- Escalabilidade (o que quebra com 10k transações? 100k?)
- Edge cases no modelo contábil (arredondamento, moedas, fusos horários)

## Formato de saída esperado

Para cada achado, use este formato:

```
[SEVERIDADE] ID - Título curto
Arquivo(s): caminho/do/arquivo.ts
Linha(s): N-M (se aplicável)
Descrição: O que está errado e por quê.
Impacto: O que pode dar errado na prática.
Correção sugerida: O que fazer para resolver.
```

Severidades: CRÍTICO (segurança/perda de dados), ALTO (bug funcional/performance), MÉDIO (code quality/manutenção), BAIXO (estilo/melhorias)

Ao final, inclua:
1. **Resumo quantitativo** (X críticos, Y altos, Z médios, W baixos)
2. **Top 5 ações prioritárias** (o que resolver primeiro)
3. **Nota geral** do codebase (1-10) com justificativa

Seja direto, específico e acionável. Não precisa elogiar o que está bom (assuma que o que não for mencionado está aceitável). Foque exclusivamente em problemas reais e riscos concretos.

---

## CÓDIGO FONTE

[Cole todos os arquivos abaixo, um por vez, com o path como header]

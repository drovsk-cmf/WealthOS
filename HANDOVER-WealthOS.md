# WealthOS - Handover de Sessão

**Data:** 08 de março de 2026
**Projeto:** WealthOS - Sistema Integrado de Gestão Financeira e Patrimonial
**Repositório GitHub:** drovsk-cmf/WealthOS (privado)
**Supabase:** projeto hmwdfcsxtmbzlslxgqus (sa-east-1)
**Google Drive:** Meu Drive > 00. Novos Projetos > WealthOS > Documentacao/

---

## 1. O que é o WealthOS

Sistema de gestão financeira e patrimonial para uso pessoal, posicionado como "Sistema Operativo de Riqueza". Público-alvo: profissionais de alta renda com múltiplas fontes de receita e complexidade fiscal ("The Hybrid Earner"). Foco em blindagem patrimonial, eficiência tributária e privacidade.

**Modelo contábil:** partida dobrada como motor interno (invisível ao usuário), com plano de contas híbrido (estrutura CPC simplificada por baixo, linguagem natural na interface).

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | 14.2.14 |
| UI | shadcn/ui + Tailwind CSS | 3.4.x |
| Backend/BaaS | Supabase (PostgreSQL + Auth + RLS + Storage) | supabase-js 2.98, ssr 0.9 |
| Mobile iOS | Capacitor 6 (empacotamento PWA) | 6.x |
| Hospedagem | Vercel | - |
| State | React Query + Zustand | RQ 5.56, Zustand 4.5 |
| Validação | Zod | 3.23 |
| CI/CD | GitHub Actions | lint + type-check + build + security |
| APIs externas | BCB SGS + IBGE SIDRA + fallback IPEADATA | - |

---

## 3. Estado Atual do Projeto

### 3.1 Fases Concluídas

| Fase | Escopo | Status |
|---|---|---|
| 0. Setup | Repo, Supabase, Next.js, Capacitor, CI/CD, schema v1.0 | CONCLUÍDA |
| 1. Auth + Segurança | Login, MFA TOTP obrigatório, RLS, biometria stub, session timeout | CONCLUÍDA |
| 1.5 Schema Contábil | 10 novas tabelas, 12 ENUMs, triggers, seed 140 contas | CONCLUÍDA |
| 2. Financeiro (Core) | CRUD contas/categorias/transações, motor contábil, plano de contas, centros | CONCLUÍDA |
| **3. Dashboard + Orçamento** | Balanço patrimonial, solvência, gráficos, orçamento | **CONCLUÍDA** |
| **4. Contas a Pagar + Patrimônio** | Recorrências, bens, depreciação, alertas | **CONCLUÍDA** |
| **5. Centros Avançados** | Rateio, P&L por centro, exportação CSV/JSON | **CONCLUÍDA** |
| **6. Workflows** | Tarefas periódicas, auto-criação, checklist | **CONCLUÍDA** |

### 3.2 Banco de Dados

| Métrica | Valor |
|---|---|
| Tabelas | 23 |
| Políticas RLS | 76 |
| Functions | 25 (22 anteriores + 3 RPCs workflow) |
| Triggers | 16 |
| ENUMs | 21 |
| Migrations aplicadas | 001-007 (schema v1.0 + contábil + transaction + dashboard + recurrence + center + workflow) |
| Contas no plano-semente (user Claudio) | 140 |
| Centros de custo | 1 ("Pessoal", neutral, default) |
| Categorias | 16 (10 despesa + 6 receita, todas system) |
| User stories total | 90 |
| Stories concluídas | 59 (55 fases 1-5 + 4 fase 6: WKF-01-04) |

### 3.3 Código Fonte (63 arquivos em src/)

```
src/
├── app/
│   ├── (app)/                          # Rotas autenticadas
│   │   ├── accounts/page.tsx           # CRUD contas bancárias (FIN-01,02,04,05)
│   │   ├── categories/page.tsx         # CRUD categorias (FIN-06,07)
│   │   ├── chart-of-accounts/page.tsx  # Plano de contas tree view (CTB-03,04)
│   │   ├── cost-centers/page.tsx       # Centros de custo (CEN-01,02)
│   │   ├── dashboard/page.tsx          # Placeholder (a implementar Fase 3)
│   │   ├── transactions/page.tsx       # Transações + filtros (FIN-01-03,08-10)
│   │   ├── settings/page.tsx           # Menu configurações
│   │   ├── settings/security/page.tsx  # MFA status, logout all, exclusão conta
│   │   └── layout.tsx                  # Sidebar + session timeout + AAL check
│   ├── (auth)/                         # Rotas públicas de auth
│   │   ├── forgot-password/page.tsx    # AUTH-08
│   │   ├── login/page.tsx              # AUTH-02,03 (Suspense wrapper)
│   │   ├── mfa-challenge/page.tsx      # AUTH-04 (Suspense wrapper)
│   │   ├── onboarding/page.tsx         # AUTH-05 (wizard 7 steps)
│   │   ├── register/page.tsx           # AUTH-01
│   │   ├── reset-password/page.tsx     # AUTH-08
│   │   └── layout.tsx                  # Layout centralizado
│   ├── api/auth/callback/route.ts      # OAuth + email confirm + MFA redirect
│   ├── globals.css                     # Tailwind + CSS vars (light/dark)
│   └── layout.tsx                      # Root layout + QueryProvider
├── components/
│   ├── accounts/account-form.tsx       # Dialog criar/editar conta
│   ├── categories/category-form.tsx    # Dialog criar/editar categoria
│   └── transactions/transaction-form.tsx # Dialog nova transação (3 tipos)
├── lib/
│   ├── auth/
│   │   ├── encryption-manager.ts       # DEK lifecycle (init, load, rotate, clear)
│   │   ├── index.ts                    # Barrel export
│   │   ├── mfa.ts                      # Supabase MFA API wrapper (TOTP)
│   │   ├── password-blocklist.ts       # 38 senhas comuns bloqueadas
│   │   ├── use-biometric.ts            # Stub Face ID/Touch ID (Fase 10)
│   │   └── use-session-timeout.ts      # 30min inatividade → logout
│   ├── crypto/index.ts                 # AES-256-GCM E2E (DEK/KEK/HKDF)
│   ├── hooks/
│   │   ├── use-accounts.ts             # CRUD + auto-link COA + liquidity tier
│   │   ├── use-categories.ts           # CRUD + type filter + icons/colors
│   │   ├── use-chart-of-accounts.ts    # Tree builder + toggle active
│   │   ├── use-cost-centers.ts         # CRUD + default protection
│   │   └── use-transactions.ts         # Query com filtros + batch join
│   ├── services/
│   │   └── transaction-engine.ts       # createTransaction, createTransfer, reverseTransaction
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   └── server.ts                   # Server client + admin client
│   ├── utils/index.ts                  # cn(), formatCurrency(), formatDate()
│   ├── validations/auth.ts             # Zod schemas + password strength meter
│   └── query-provider.tsx              # React Query provider
├── middleware.ts                        # Route protection + session refresh
└── types/database.ts                   # Supabase generated types (23 tables, 21 ENUMs, 5 RPCs)
```

### 3.4 Stored Procedures (RPCs)

| Function | Descrição | Criada em |
|---|---|---|
| create_default_categories(p_user_id) | Seed 16 categorias (10 desp + 6 rec) | Migration 001 |
| create_default_chart_of_accounts(p_user_id) | Seed 111+ contas hierárquicas | Migration 002e |
| create_default_cost_center(p_user_id) | Cria centro "Pessoal" (neutral) | Migration 002d |
| create_transaction_with_journal(...) | Atômica: transaction + journal_entry + 2 journal_lines | Migration 003 |
| reverse_transaction(p_user_id, p_transaction_id) | Soft-delete + journal reverso (append-only) | Migration 003 |

### 3.5 Motor Contábil (Regras de Débito/Crédito)

```
Receita:          D asset (banco ↑)       C revenue (receita ↑)
Despesa (banco):  D expense (gasto ↑)     C asset (banco ↓)
Despesa (cartão): D expense (gasto ↑)     C liability (dívida ↑)
Estorno:          Linhas invertidas (D↔C)  is_reversal=true, append-only
```

Mapeamento automático account_type → chart_of_accounts:
- checking → 1.1.01, savings → 1.1.02, cash → 1.1.03
- investment → 1.2.01, credit_card → 2.1.01

### 3.6 CI/CD (GitHub Actions)

Pipeline: lint → type-check → build → security checks

Fixes aplicados nesta sessão:
1. @typescript-eslint plugin instalado (rules not found)
2. @supabase/ssr 0.5→0.9 (19 type errors com supabase-js 2.98)
3. Suspense boundary em login/mfa-challenge (Next.js 14 SSG)

---

## 4. Documentação Técnica (8 documentos no Google Drive)

| Documento | Conteúdo principal |
|---|---|
| wealthos-especificacao-v1.docx | Visão geral, stack, segurança, modelo de dados v1.0, fases |
| wealthos-funcional-v1.docx | 62 user stories com critérios de aceite |
| wealthos-adendo-v1.1.docx | Decisões de negócio, 4 tabelas novas, key management E2E, Edge Functions |
| wealthos-adendo-v1.2.docx | Apple App Store, importação, OCR, offline, acessibilidade |
| wealthos-adendo-v1.3.docx | Integração bancária Open Finance (Fase 9) |
| wealthos-adendo-v1.4.docx | Solvência, evoluções futuras |
| wealthos-estudo-contabil-v1.5-final.docx | Modelo contábil partida dobrada, 133 contas, centros, workflows |
| wealthos-estudo-tecnico-v2.0.docx | Schema v2.0, 10 novas tabelas, 14 stories, plano de fases revisado |

---

## 5. Decisões Técnicas Consolidadas

| Decisão | Escolha |
|---|---|
| Saldo de contas | Dois saldos: atual (pagas) + previsto (pagas+pendentes) |
| Exclusão de conta | 7 dias de carência |
| Relatório fiscal | Client-side (jsPDF) |
| Chave E2E | DEK aleatória, KEK derivada do JWT via HKDF |
| MFA | Obrigatório sempre (TOTP) |
| Biometria | Stub agora, full na Fase 10 |
| Confirmação email | Ativada |
| Push notifications | APNs direto (sem Firebase) |
| OCR | Apple Vision (iOS) + Tesseract.js (web) |
| Modelo contábil | Partida dobrada invisível ao usuário |
| Imutabilidade journal | Append-only (estorno obrigatório) |
| Nomenclatura UI | Agnóstica de marcas |

---

## 6. Plano de Fases

| Fase | Escopo | Status | Stories |
|---|---|---|---|
| 0. Setup | Repo, Supabase, Next.js, CI/CD | CONCLUÍDA | - |
| 1. Auth + Segurança | Login, MFA, RLS, biometria | CONCLUÍDA | AUTH-01 a AUTH-08 |
| 1.5 Schema Contábil | Migration v2.0, seed 140 contas | CONCLUÍDA | - |
| 2. Financeiro (Core) | CRUD transações + journal_entries | CONCLUÍDA | FIN-01-15, CTB-01-04, CEN-01-02 |
| **3. Dashboard + Orçamento** | **Balanço patrimonial, solvência, orçamento** | **CONCLUÍDA** | **DASH-01-12, CTB-05, ORC-01-06** |
| **4. Contas a Pagar + Patrimônio** | **Recorrências, bens, depreciação** | **CONCLUÍDA** | **CAP-01-06, PAT-01-07** |
| **5. Centros Avançados** | **Rateio, P&L por centro, export** | **CONCLUÍDA** | **CEN-03-05** |
| **6. Workflows** | **Automações, tarefas, checklist** | **CONCLUÍDA** | **WKF-01-04** |
| **7. Fiscal Integrado** | **tax_treatment, IRRF tracking** | **PRÓXIMO** | **FIS-01-06** |
| 8. Índices Econômicos | BCB/SIDRA, projeções indexadas | Após Fase 3 | A definir |
| 9. Integração Bancária | Open Finance via agregador | Após Fase 2 | BANK-01-06 |
| 10. Polish + App Store | PWA, Capacitor, submissão | Todas | - |

---

## 7. Concluído: Fase 3 (Dashboard + Orçamento) - 08/03/2026

### 7.1 O que foi entregue

**Migration 004** (aplicada via Supabase MCP):
- 6 RPCs: get_dashboard_summary, get_balance_sheet, get_solvency_metrics, get_top_categories, get_balance_evolution, get_budget_vs_actual

**Hooks (2 arquivos, 555 linhas):**
- use-dashboard.ts: 6 React Query hooks com tipos exportados
- use-budgets.ts: 4 queries + 4 mutations (CRUD + copiar mês)

**Dashboard (8 componentes + page, 1.215 linhas):**
- SummaryCards (DASH-01, DASH-02): saldo atual/previsto + receitas/despesas/resultado
- BalanceSheetCard (CTB-05): ativos líquidos/ilíquidos, passivos, PL com barra proporcional
- TopCategoriesCard (DASH-03): top 5 categorias com barras horizontais e %
- UpcomingBillsCard (DASH-04): transações pendentes com badges de urgência
- BudgetSummaryCard (DASH-05): barra de progresso total + breakdown por categoria
- SolvencyPanel (DASH-06, DASH-09 a DASH-12): 4 KPIs + barra empilhada de tiers
- BalanceEvolutionChart (DASH-07): ComposedChart (recharts) barras + linha
- QuickEntryFab (DASH-08): botão flutuante '+' que abre TransactionForm

**Orçamento (2 arquivos, 703 linhas):**
- BudgetForm: criar (ORC-01) e editar (ORC-03) com validação de duplicata
- BudgetsPage: CRUD completo, navegação por mês, copiar mês anterior (ORC-02), remover (ORC-04), relatório planejado vs realizado (ORC-05), alertas visuais (ORC-06)

**Total: 16 arquivos, 2.521 linhas adicionadas, 19 stories concluídas.**

### 7.2 Concluído: Fase 4 (Contas a Pagar + Patrimônio) - 08/03/2026

**Migration 005** (aplicada via Supabase MCP):
- 3 RPCs: generate_next_recurrence, depreciate_asset, get_assets_summary

**Hooks (2 arquivos, 671 linhas):**
- use-recurrences.ts: 3 queries + 4 mutations (CRUD + pagar/gerar próxima)
- use-assets.ts: 4 queries + 4 mutations (CRUD + depreciar + histórico)

**Contas a Pagar (2 arquivos, 620 linhas):**
- RecurrenceForm: criar/editar com frequência, reajuste manual, data fim
- BillsPage: 2 tabs (Pendentes + Recorrências), pagar com auto-geração da próxima, alertas de vencimento

**Patrimônio (2 arquivos, 542 linhas):**
- AssetForm: criar/editar com categoria, depreciação, seguro
- AssetsPage: CRUD, totalização por categoria, depreciação manual, histórico expandível, alertas de seguro

**Total: 8 arquivos, 1.868 linhas adicionadas, 13 stories concluídas.**

### 7.3 Concluído: Fase 5 (Centros Avançados) - 08/03/2026

**Migration 006** (aplicada via Supabase MCP):
- 3 RPCs: allocate_to_centers, get_center_pnl, get_center_export

**Hook update (+171 linhas):**
- useCenterPnl: P&L por centro com período selecionável
- useCenterExport: export para JSON/CSV
- useAllocateToCenters: rateio percentual (validação sum=100%)
- exportToCsv + downloadFile: helpers client-side

**Page rewrite (427 linhas):**
- P&L expandível por centro com KPIs (receitas/despesas/resultado)
- Evolução mensal dentro do painel expandido
- Botões "Exportar CSV" e "Exportar JSON" por centro
- Info de rateio com referência ao fluxo via transações

**Total: 4 arquivos, 451 linhas adicionadas, 3 stories concluídas.**

### 7.4 Concluído: Fase 6 (Workflows) - 08/03/2026

**Migration 007** (aplicada via Supabase MCP):
- 3 RPCs: auto_create_workflow_for_account, generate_tasks_for_period, complete_workflow_task

**Hook (319 linhas):**
- use-workflows.ts: 5 queries + 5 mutations (CRUD + gerar + completar)
- use-accounts.ts: integração WKF-01 (auto-cria workflow ao criar conta)

**UI (447 linhas):**
- /workflows page com 2 tabs (Pendentes + Workflows)
- WKF-02: checklist agrupada por workflow
- WKF-03: stub de upload (completa manualmente; OCR real na Fase 10)
- WKF-04: campo de saldo inline na tarefa

**Total: 6 arquivos, 813 linhas adicionadas, 4 stories concluídas.**

### 7.5 Próximo: Fase 7 (Fiscal Integrado)

| Story | Escopo |
|---|---|
| FIS-01 a FIS-06 | Relatório fiscal via tax_treatment, validações, IRRF tracking |

Dependências: tabelas tax_parameters e chart_of_accounts.tax_treatment já existem.

---

## 8. Dados do Usuário de Teste

- ID: 04c41302-5429-4f97-9aeb-e21294d014ff
- Nome: Claudio Filho
- Provider: Google OAuth
- onboarding_completed: false (MFA não finalizado - completar quando testar local)
- DEK: não gerada (mesmo motivo)
- Dados seed: 140 contas contábeis, 1 centro, 16 categorias
- Transações: 0 (dados de teste foram limpos)
- Contas bancárias: 0

---

## 9. Preferências do Usuário

- Respostas em português (pt-BR), tom profissional e objetivo
- Estrutura explícita (títulos, listas, tabelas)
- Metodologia e premissas claras
- Postura cética: questionar premissas, apontar riscos
- Orientação a resultados: recomendações acionáveis
- Agnóstico de marcas na nomenclatura
- Windows 10/11 com PowerShell (terminal: um comando por vez)
- Micro-lotes para sessões curtas

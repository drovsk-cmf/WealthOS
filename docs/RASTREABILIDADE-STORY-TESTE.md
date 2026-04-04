# Oniefy - Rastreabilidade Story → Código → Teste

**Gerado:** sessão 40 (04/04/2026)
**Total stories:** 108
**Com teste funcional:** 85/108 (78%)
**Com referência em código:** 79/108
**Bloqueadas (Mac/externo):** 3

---

## AUTH - Autenticação (4/8 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| AUTH-01 ✅ | Registro com validação de senha forte | ✅ | auth-schemas-extended.test.ts, auth-validation.test.ts, rate-limiter.test.ts, turnstile-verify.test.ts | password-blocklist.ts, auth.ts |
| AUTH-02 ✅ | Login email + senha | ✅ | api-routes-security.test.ts, auth-schemas-extended.test.ts | — |
| AUTH-03 ⬜ | Login OAuth (Google) | ⬜ | — | — |
| AUTH-04 ⬜ | MFA TOTP | ⬜ | — | mfa.ts |
| AUTH-05 ✅ | Onboarding (seeds) | ✅ | onboarding-seeds.test.ts, setup-journey-hooks.test.tsx | — |
| AUTH-06 ⬜ | Biometria (stub) | ⬜ | — | use-biometric.ts |
| AUTH-07 ⬜ | Gerenciar sessão / timeout | ⬜ | — | page.tsx |
| AUTH-08 ✅ | Validação de senha (blocklist) | ✅ | auth-validation.test.ts | auth.ts |

## FIN - Financeiro (14/18 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| FIN-01 ✅ | Criar conta bancária | ✅ | accounts-mutations.test.tsx | use-accounts.ts |
| FIN-02 ✅ | Editar conta | ✅ | accounts-mutations.test.tsx | use-accounts.ts |
| FIN-03 ✅ | Excluir conta (soft delete) | ✅ | accounts-mutations.test.tsx | — |
| FIN-04 ✅ | Listar contas e saldos | ✅ | accounts-mutations.test.tsx, read-hooks.test.tsx | use-accounts.ts |
| FIN-05 ✅ | Criar/editar categorias | ✅ | categories-mutations.test.tsx | use-accounts.ts |
| FIN-06 ✅ | Listar categorias | ✅ | categories-mutations.test.tsx, read-hooks.test.tsx | use-categories.ts |
| FIN-07 ✅ | Editar categorias (cor/ícone) | ✅ | categories-mutations.test.tsx | use-categories.ts |
| FIN-08 ✅ | Listar categorias agrupadas | ✅ | read-hooks.test.tsx | use-transactions.ts |
| FIN-09 ✅ | Criar transação | ✅ | transaction-hooks.test.tsx | use-transactions.ts |
| FIN-10 ✅ | Editar transação | ✅ | transaction-hooks.test.tsx | use-transactions.ts |
| FIN-11 ✅ | Excluir transação (soft delete) | ✅ | transaction-hooks.test.tsx | — |
| FIN-12 ✅ | Transferência entre contas | ✅ | transaction-hooks.test.tsx | — |
| FIN-13 ✅ | Listar transações (filtros) | ✅ | transaction-hooks.test.tsx | — |
| FIN-14 ⬜ | Busca por descrição | ⬜ | — | — |
| FIN-15 ⬜ | Saldo atual vs previsto | ⬜ | — | — |
| FIN-16 ✅ | Importar extrato (CSV/OFX/XLSX) | ✅ | import-workflow.test.ts, installment-engine.test.ts, parsers.test.ts, password-derivation.test.ts | — |
| FIN-17 🔒 | OCR recibo (Apple Vision) | 🔒 | — | transaction-form.tsx, ocr-service.ts |
| FIN-18 🔒 | Câmera comprovante (Capacitor) | 🔒 | — | — |

## ORC - Orçamento (5/6 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| ORC-01 ✅ | Definir orçamento mensal por categoria | ✅ | budgets-hooks.test.tsx, budgets-mutations-extended.test.tsx | page.tsx, budget-form.tsx, use-budgets.ts |
| ORC-02 ✅ | Progresso do orçamento | ✅ | budgets-hooks.test.tsx, read-hooks.test.tsx | page.tsx, use-budgets.ts |
| ORC-03 ✅ | Alertas de orçamento (80%/100%) | ✅ | budgets-mutations-extended.test.tsx | page.tsx, budget-form.tsx, use-budgets.ts |
| ORC-04 ✅ | Orçamento recorrente (copiar mês) | ✅ | budgets-mutations-extended.test.tsx | page.tsx, use-budgets.ts |
| ORC-05 ⬜ | Relatório mensal por categoria | ⬜ | — | page.tsx, use-dashboard.ts |
| ORC-06 ✅ | Gráfico comparativo meses | ✅ | annual-comparison.test.ts | page.tsx, use-budgets.ts |

## CAP - Contas a Pagar (6/6 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| CAP-01 ✅ | Criar recorrência | ✅ | recurrence-detector.test.ts, recurrences-hooks.test.tsx | page.tsx, recurrence-form.tsx, use-recurrences.ts |
| CAP-02 ✅ | Listar contas a pagar | ✅ | recurrences-hooks.test.tsx | page.tsx, recurrence-form.tsx, use-recurrences.ts |
| CAP-03 ✅ | Marcar como paga | ✅ | recurrences-hooks.test.tsx | page.tsx, use-recurrences.ts |
| CAP-04 ✅ | Geração automática (cron) | ✅ | api-routes-cron.test.ts, recurrences-hooks.test.tsx | page.tsx, use-recurrences.ts |
| CAP-05 ✅ | Calendário de vencimentos | ✅ | financial-calendar.test.ts | page.tsx, use-recurrences.ts |
| CAP-06 ✅ | Reajuste de recorrência | ✅ | recurrences-hooks.test.tsx, seasonal-provisioning.test.ts | page.tsx, use-recurrences.ts |

## PAT - Patrimônio (8/11 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| PAT-01 ✅ | Criar bem patrimonial | ✅ | assets-hooks.test.tsx | page.tsx, asset-form.tsx, use-assets.ts |
| PAT-02 ✅ | Editar bem | ✅ | assets-hooks.test.tsx | page.tsx, asset-form.tsx, use-assets.ts |
| PAT-03 ✅ | Excluir bem (soft delete) | ✅ | assets-hooks.test.tsx | page.tsx, use-assets.ts |
| PAT-04 ⬜ | Depreciação automática | ⬜ | — | page.tsx, use-assets.ts |
| PAT-05 ✅ | Listar bens e total | ✅ | assets-hooks.test.tsx, read-hooks.test.tsx | page.tsx, use-assets.ts |
| PAT-06 ⬜ | Anexar documento ao bem | ⬜ | — | page.tsx, use-assets.ts, use-documents.ts |
| PAT-07 ✅ | Histórico de valorização | ✅ | warranty-tracker.test.ts | page.tsx, use-assets.ts |
| PAT-08 ✅ | Categorização por tipo de ativo | ✅ | p16-asset-categories.test.ts | — |
| PAT-09 ✅ | Templates de bens por tipo | ✅ | p14-asset-templates.test.ts | — |
| PAT-10 ✅ | Campos condicionais por tipo | ✅ | p14-asset-templates.test.ts | — |
| PAT-11 ⬜ | Indicador de saúde patrimonial | ⬜ | — | — |

## FIS - Fiscal (6/6 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| FIS-01 ✅ | Tabela progressiva IRPF | ✅ | tax-calculator.test.ts | page.tsx, use-fiscal.ts |
| FIS-02 ✅ | Classificação fiscal por categoria | ✅ | tax-calculator.test.ts | page.tsx, use-fiscal.ts |
| FIS-03 ✅ | Deduções IRPF por categoria | ✅ | tax-calculator.test.ts | page.tsx, use-fiscal.ts |
| FIS-04 ✅ | Calendário fiscal | ✅ | fiscal-calendar.test.ts, fiscal-timing-safe.test.ts | page.tsx, use-fiscal.ts |
| FIS-05 ✅ | Relatório fiscal (client-side PDF) | ✅ | annual-report.test.ts | page.tsx, use-fiscal.ts |
| FIS-06 ✅ | Parâmetros fiscais editáveis | ✅ | darf-investment.test.ts | page.tsx, use-fiscal.ts |

## DASH - Dashboard (11/12 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| DASH-01 ✅ | Dashboard home (cards resumo) | ✅ | e1-e3-e6-features.test.ts, hooks-batch-coverage.test.tsx | page.tsx, summary-cards.tsx, use-dashboard.ts |
| DASH-02 ✅ | Cards receita/despesa | ✅ | hooks-batch-coverage.test.tsx | page.tsx, summary-cards.tsx |
| DASH-03 ✅ | Top categorias | ✅ | hooks-batch-coverage.test.tsx, sankey-data.test.ts | page.tsx, top-categories-card.tsx |
| DASH-04 ✅ | Contas a pagar próximas | ✅ | hooks-batch-coverage.test.tsx | page.tsx, upcoming-bills-card.tsx |
| DASH-05 ✅ | Resumo de orçamento | ✅ | hooks-batch-coverage.test.tsx | page.tsx, budget-summary-card.tsx, use-dashboard.ts |
| DASH-06 ✅ | Painel de solvência | ✅ | debt-payoff-planner.test.ts, diagnostics.test.ts, e7-e9-affordability-solvency.test.ts, rpc-schemas.test.ts | page.tsx, solvency-panel.tsx |
| DASH-07 ✅ | Gráfico evolução de saldo | ✅ | balance-forecast.test.ts | page.tsx, balance-evolution-chart.tsx |
| DASH-08 ⬜ | Quick entry FAB | ⬜ | — | page.tsx, quick-entry-fab.tsx |
| DASH-09 ✅ | Indicador de solvência contábil | ✅ | diagnostics.test.ts, e7-e9-affordability-solvency.test.ts | page.tsx, solvency-panel.tsx, use-dashboard.ts |
| DASH-10 ✅ | Runway (meses de fôlego) | ✅ | diagnostics.test.ts | solvency-panel.tsx |
| DASH-11 ✅ | Composição ativo/passivo | ✅ | diagnostics.test.ts | solvency-panel.tsx |
| DASH-12 ✅ | Índice de cobertura | ✅ | diagnostics.test.ts | page.tsx, solvency-panel.tsx, use-dashboard.ts |

## CFG - Configurações (5/7 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| CFG-01 ✅ | Editar perfil (nome, foto) | ✅ | cfg-settings.test.ts | page.tsx |
| CFG-02 ✅ | Notificações (preferências) | ✅ | cfg-settings.test.ts | page.tsx |
| CFG-03 ✅ | Moeda / formato | ✅ | cfg-settings.test.ts | page.tsx |
| CFG-04 🔒 | Push notifications APNs | 🔒 | — | page.tsx, use-push-notifications.ts |
| CFG-05 ✅ | Exportação de dados | ✅ | cfg-settings.test.ts | page.tsx |
| CFG-06 ✅ | Excluir conta (7 dias carência) | ✅ | lgpd-account-deletion.test.ts | page.tsx |
| CFG-07 ⬜ | Modo offline (Service Worker) | ⬜ | — | use-online-status.ts |

## CTB - Contábil (2/5 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| CTB-01 ✅ | Journal entries automáticos | ✅ | rpc-new-schemas.test.ts, rpc-schemas-extended.test.ts, rpc-schemas.test.ts | transaction-engine.ts |
| CTB-02 ⬜ | Plano de contas por grupos | ⬜ | — | transaction-engine.ts |
| CTB-03 ⬜ | Criar/editar contas contábeis | ⬜ | — | use-chart-of-accounts.ts |
| CTB-04 ⬜ | Correção com histórico (estorno) | ⬜ | — | use-chart-of-accounts.ts |
| CTB-05 ✅ | Balanço patrimonial no Dashboard | ✅ | rpc-new-schemas.test.ts, rpc-schemas.test.ts | page.tsx, balance-sheet-card.tsx, use-dashboard.ts |

## CEN - Centros (5/5 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| CEN-01 ✅ | CRUD centros de custo/lucro | ✅ | cost-centers-hooks.test.tsx | page.tsx, use-cost-centers.ts |
| CEN-02 ✅ | Atribuir transação a centro | ✅ | cost-centers-hooks.test.tsx | page.tsx, use-cost-centers.ts |
| CEN-03 ✅ | Rateio entre centros | ✅ | cost-centers-hooks.test.tsx | page.tsx, use-cost-centers.ts |
| CEN-04 ✅ | P&L por centro | ✅ | cost-centers-hooks.test.tsx | page.tsx, use-cost-centers.ts |
| CEN-05 ✅ | Exportar centro com histórico | ✅ | cost-centers-hooks.test.tsx | page.tsx, use-cost-centers.ts |

## WKF - Workflows (3/4 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| WKF-01 ✅ | Workflows automáticos por conta | ✅ | workflows-hooks.test.tsx | page.tsx, use-accounts.ts, use-workflows.ts |
| WKF-02 ✅ | Tarefas pendentes (checklist) | ✅ | setup-journey-hooks.test.tsx, workflows-hooks.test.tsx | page.tsx, use-workflows.ts |
| WKF-03 ⬜ | Upload documento + OCR proposto | ⬜ | — | page.tsx, use-documents.ts, use-workflows.ts |
| WKF-04 ✅ | Atualizar saldo via tarefa | ✅ | workflows-hooks.test.tsx | page.tsx, use-workflows.ts |

## BANK - Integração Bancária (6/6 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| BANK-01 ✅ | Conexão bancária (Open Finance stub) | ✅ | bank-detection.test.ts | page.tsx, use-bank-connections.ts |
| BANK-02 ✅ | Importação CSV | ✅ | bank-statement-pipeline.test.ts, import-workflow.test.ts, installment-engine.test.ts, parsers.test.ts | page.tsx |
| BANK-03 ✅ | Importação OFX | ✅ | bank-statement-pipeline.test.ts, parsers.test.ts | page.tsx |
| BANK-04 ✅ | Auto-categorização (AI) | ✅ | rpc-auto-categorize-schema.test.ts | page.tsx, use-bank-connections.ts, use-reconciliation.ts |
| BANK-05 ✅ | Reconciliação/dedup | ✅ | dedup-engine.test.ts | page.tsx, use-bank-connections.ts |
| BANK-06 ✅ | Importação XLSX | ✅ | parsers.test.ts | page.tsx, use-bank-connections.ts |

## UXR - Experiência (2/5 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| UXR-01 ✅ | Empty states educativos | ✅ | oniefy-template.test.ts | — |
| UXR-02 ⬜ | Nudges contextuais (import/patrimônio) | ⬜ | — | — |
| UXR-03 ✅ | Quick-register (sugestões) | ✅ | quick-register.test.ts | — |
| UXR-04 ⬜ | Sininho de pendências | ⬜ | — | — |
| UXR-05 ⬜ | Onie orb (Canvas) | ⬜ | — | — |

## AI - Inteligência Artificial (4/5 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| AI-01 ✅ | Gateway IA (rate limit/cache/PII) | ✅ | p11-ai-gateway.test.ts, pii-sanitizer.test.ts | — |
| AI-02 ✅ | Auto-categorização batch | ✅ | rpc-auto-categorize-schema.test.ts | — |
| AI-03 ✅ | Scanner financeiro (10 regras) | ✅ | scanner.test.tsx | — |
| AI-04 ✅ | Motor financeiro JARVIS v2 | ✅ | engine-v2.test.ts | — |
| AI-05 ⬜ | Narrativas CFA (Haiku) | ⬜ | — | — |

## IMP - Importação (4/4 com teste)

| Story | Descrição | Status | Teste(s) | Código fonte |
|-------|-----------|--------|----------|-------------|
| IMP-01 ✅ | Bank detection (8 bancos) | ✅ | bank-detection.test.ts, bank-statement-pipeline.test.ts | — |
| IMP-02 ✅ | Dedup engine (3 filtros + learning) | ✅ | dedup-engine.test.ts | — |
| IMP-03 ✅ | Detector de recorrências | ✅ | recurrence-detector.test.ts | — |
| IMP-04 ✅ | Alerta de preço anormal | ✅ | price-anomaly-detector.test.ts | — |

---

## Resumo por módulo

| Módulo | Total | Com teste | Com código | % teste |
|--------|-------|-----------|------------|---------|
| AUTH | 8 | 4 | 5 | 50% |
| FIN | 18 | 14 | 10 | 77% |
| ORC | 6 | 5 | 6 | 83% |
| CAP | 6 | 6 | 6 | 100% |
| PAT | 11 | 8 | 7 | 72% |
| FIS | 6 | 6 | 6 | 100% |
| DASH | 12 | 11 | 12 | 91% |
| CFG | 7 | 5 | 7 | 71% |
| CTB | 5 | 2 | 5 | 40% |
| CEN | 5 | 5 | 5 | 100% |
| WKF | 4 | 3 | 4 | 75% |
| BANK | 6 | 6 | 6 | 100% |
| UXR | 5 | 2 | 0 | 40% |
| AI | 5 | 4 | 0 | 80% |
| IMP | 4 | 4 | 0 | 100% |

---

## Notas

- **Status ✅:** story tem pelo menos um teste funcional associado (pode ser indireto)
- **Status ⬜:** story implementada mas sem teste automatizado dedicado
- **Status 🔒:** bloqueada por dependência externa (Apple Developer, Mac físico)
- Mapeamento funcional: testes que validam a funcionalidade da story, mesmo sem referenciar o ID diretamente
- Coluna 'Código fonte' mostra até 3 arquivos principais que implementam a story

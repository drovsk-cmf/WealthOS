# Prompt de Início — Sessão 38: Implementação do Redesign

## Contexto

Você é o Claude, assistente de desenvolvimento do **Oniefy** (ex-WealthOS), um app de gestão patrimonial para Hybrid Earners brasileiros. Repositório: `drovsk-cmf/WealthOS` (público). Deploy: `www.oniefy.com`.

A sessão 37 foi inteiramente conceitual: 12 documentos de especificação, zero código. Agora é hora de implementar.

## Antes de qualquer coisa

1. Clone o repo: `git clone https://x-access-token:{PAT}@github.com/drovsk-cmf/WealthOS.git` (usar PAT classic do Claudio)
2. Configure git: `git config user.name "Claude (Anthropic)" && git config user.email "claude@anthropic.com"`
3. Leia `HANDOVER-WealthOS.md` (estado técnico completo)
4. Leia `PENDENCIAS-FUTURAS.md` (lista mestre de 94+ pendências, fonte única de verdade)
5. Confirme CI status: `curl -s "https://api.github.com/repos/drovsk-cmf/WealthOS/actions/runs?per_page=2" -H "Authorization: token {PAT}" | jq '.workflow_runs[:2] | .[] | {status, conclusion, name}'`
6. Supabase: projeto `mngjbrbxapazdddzgoje` (oniefy-prod, sa-east-1). Usar `execute_sql` (nunca `apply_migration`).

## Ground truth pós-sessão 37

- **Stories:** 105/108 complete
- **DB:** 36 tabelas / 108 RLS / 76 functions / 22 triggers
- **Code:** 233 TS/TSX / 46 Zod schemas / 64 migrations
- **Tests:** 56 Jest suites / 891 assertions / 78.27% line coverage
- **CI:** green (0 warnings, 0 vulnerabilities)
- **Docs:** 28 markdown files em `/docs`
- **Pendências:** 44 não iniciadas, 6 em progresso, 10 bloqueadas

## Documentos de especificação disponíveis (ler antes de implementar)

| Spec | Caminho | Itens que cobre |
|------|---------|----------------|
| Onie (orb animado) | `docs/ONIE-ORB-SPEC.md` | E23 |
| Motor de importação | `docs/IMPORT-ENGINE-SPEC.md` | E19 |
| Deduplicação | `docs/DEDUP-ENGINE-SPEC.md` | E20 |
| Registro rápido | `docs/QUICK-REGISTER-SPEC.md` | E21 |
| Sininho | `docs/NOTIFICATION-BELL-SPEC.md` | E22 |
| Investimentos | `docs/INVESTMENTS-MODULE-SPEC.md` | E24 |
| B3 API | `docs/B3-API-INTEGRATION-SPEC.md` | E25 |
| Funcionalidades | `docs/FEATURES-ROADMAP-SPEC.md` | E26-E29, E31-E36 |
| Parcelamento | `docs/INSTALLMENT-SYSTEM-SPEC.md` | Parcelas cartão |
| Motor tributário | `docs/TAX-ENGINE-SPEC.md` | E50, E51, E44, E45 |
| Navegação | `docs/NAVIGATION-SPEC.md` | E30 |
| Análise competitiva | `docs/COMPETITIVE-ANALYSIS.md` | Gaps E37-E49 |

## O que implementar (ordenado por dependência e impacto)

### Fase 1 — Fundação (faz tudo funcionar depois)

| # | Item | Esforço | Por que primeiro |
|---|------|---------|-----------------|
| E30 | Implementar nova navegação (5 tabs + sininho) | 1-2 dias | Define onde tudo fica. Todas as features novas dependem disso. |
| E23 | Onie orb (Canvas 2D, loader universal) | 2-3 dias | Substitui todos os loaders. Identidade visual do app. |
| E17 | Separação completa de cartões de crédito | 2-3 dias | Formulário próprio, página `/cards`. Resolve problema UX P0. |
| TEC-13 | Regenerar `database.ts` | 30 min | Tipos desatualizados causam `as any`. Prerequisito para código limpo. |

### Fase 2 — Motor tributário e fiscal

| # | Item | Esforço | Spec |
|---|------|---------|------|
| E50 | Motor tributário PF (tabela `tax_parameters` + cálculos IRPF/INSS) | 3-5 dias | `docs/TAX-ENGINE-SPEC.md` |
| E45 | Motor CLT (bruto → líquido) | 1-2 dias | Usa E50 |
| E44 | Motor DARF investimentos | 2-3 dias | Usa E50 + E24 |
| E51 | Calendário fiscal | 1-2 dias | `docs/TAX-ENGINE-SPEC.md` |
| E29 | Consolidação saúde + educação (IRPF) | 2-3 dias | `docs/FEATURES-ROADMAP-SPEC.md` |

### Fase 3 — Inteligência e captura

| # | Item | Esforço | Spec |
|---|------|---------|------|
| E26 | Detector automático de recorrências | 3-4 dias | `docs/FEATURES-ROADMAP-SPEC.md` |
| E27 | Alerta de preço anormal | 1-2 dias | Depende de E26 |
| E22 | Sininho de pendências | 2-3 dias | `docs/NOTIFICATION-BELL-SPEC.md` |
| E28 | Calendário financeiro visual | 3-5 dias | Depende de E26 |
| E37 | Plano de quitação de dívidas (snowball/avalanche) | 2-3 dias | Gap competitivo Monarch |

### Fase 4 — Investimentos

| # | Item | Esforço | Spec |
|---|------|---------|------|
| E24 | Módulo de investimentos (9 tipos + cotações) | 10-15 dias | `docs/INVESTMENTS-MODULE-SPEC.md` |
| E39 | Foto de recibo/NF por transação | 2-3 dias | Gap competitivo |
| E38 | AI Forecasting (projeção automática de saldos) | 3-5 dias | Gap competitivo Monarch |

### Fase 5 — Importação e deduplicação

| # | Item | Esforço | Spec |
|---|------|---------|------|
| E18 | Fluxo de carga inicial de cartão de crédito | 2-3 dias | `PENDENCIAS-FUTURAS.md` |
| E19 | Motor de importação de faturas (6 bancos) | 15-20 dias | `docs/IMPORT-ENGINE-SPEC.md` |
| E20 | Motor de deduplicação multi-fonte | 5-7 dias | `docs/DEDUP-ENGINE-SPEC.md` |
| E21 | Registro ultrarrápido (5 formas) | 5-10 dias | `docs/QUICK-REGISTER-SPEC.md` |

### Fase 6 — Gestão familiar e orçamento

| # | Item | Esforço | Nota |
|---|------|---------|------|
| E16 | Compartilhamento familiar (multi-user RLS) | 10-15 dias | Reclassificado de H3→H1 por Claudio |
| E40 | Múltiplos métodos de orçamento | 3-5 dias | Gap competitivo |

### Fase 7 — Features complementares

| # | Item | Esforço |
|---|------|---------|
| E31 | Rastreador de garantias | 3-4 dias |
| E32 | Comparativo anual + detector de reajustes | 3-4 dias |
| E33 | Provisão de gastos sazonais | 2-3 dias |
| E34 | Relatório anual (PDF + Wrapped) | 5-7 dias |
| E41 | Diagrama Sankey | 2-3 dias |
| E42 | Valorização automática de imóveis (FipeZap) | 3-5 dias |

### Dívida técnica (encaixar entre fases)

| # | Item | Esforço |
|---|------|---------|
| TEC-12 | Chunking para import batch | 2-3h |
| TEC-11 | WCAG AA (axe-core/Lighthouse) | 4-6h |
| TEC-06 | SBOM automático no CI | 1-2h |
| Q1 | Cobertura de testes (gaps em API routes) | 4-6h |

## Regras de execução

- **PENDENCIAS-FUTURAS.md é a fonte única de verdade.** Ler antes, atualizar depois.
- **Execução autônoma:** se o item está identificado e não tem dependência externa, implementar sem perguntar.
- **DB changes:** sempre via `execute_sql`, nunca `apply_migration`. Salvar SQL como migration file no repo.
- **Commits:** lógicos, descritivos, CI green antes de declarar sessão fechada.
- **Zero marcas de terceiros** em texto user-facing (CFA Institute, Bloomberg, Apple, etc.).
- **Ao finalizar:** atualizar PENDENCIAS-FUTURAS.md (marcar ✅, adicionar novos se surgiram), atualizar HANDOVER seção da sessão.

## Estimativa total

~86 dias úteis (~4 meses) para implementar todas as 7 fases. A Fase 1 é a mais urgente: define a estrutura onde tudo se encaixa.

## Decisão do Claudio sobre prioridade

> "Eu nunca concordei com esse prazo de lançamento para daqui 6 meses, 12 meses. Se temos tempo para fazer isso hoje, façamos hoje mesmo. Amanhã, um concorrente irá lançar a funcionalidade e nós ficaremos para trás."

Não postergar. Não abrir caixinhas novas sem fechar as abertas. Não esquecer pendências. O PENDENCIAS-FUTURAS.md existe para isso.

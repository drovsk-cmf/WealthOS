# Sessão 39 — Prompt de Início

## Contexto

Repo: `drovsk-cmf/WealthOS` (público). Deploy: `www.oniefy.com`.
PAT: usar o token vigente do memory/userMemories. Git user: `Claude (Anthropic) / claude@anthropic.com`.
Supabase: projeto `mngjbrbxapazdddzgoje` (sa-east-1). MCP via OAuth.
Todas as operações de schema via `execute_sql` (não `apply_migration`).

## Ground truth (sessão 38, CI green)

| Métrica | Valor |
|---------|-------|
| Tabelas | 37 |
| RLS | 119 (112 public + 7 storage) |
| Functions | 77 |
| Triggers | 23 |
| ENUMs | 29 |
| Indexes | 151 |
| Migrations (repo) | 70 |
| Suítes Jest | 72 (1.079 assertions) |
| TS/TSX | 286 |
| Hooks | 42 |
| Schemas Zod | 58 |
| Páginas | 35 |
| Calculadoras | 8 + diagnostics |
| eslint-disable (prod) | 6 |
| Engines puros (sessão 38) | 16 |
| iOS build | ✅ (GitHub Actions macOS, grátis) |

## O que foi feito na sessão 38 (30 itens + 7 visual wiring, 70 commits)

**Fase 1 (nav):** E30 navegação, TEC-13 database.ts, E17 cartões separados, E23 Onie orb.
**Fase 2 (fiscal):** E50 motor tributário, E45 CLT, E29 IRPF deductions, E51 calendário fiscal, E44 DARF investimentos.
**Fase 3 (inteligência):** E26 recorrências, E27 alerta preço, E37 dívidas, E22 sininho, E33 sazonal, E32 anual, E38 forecast, E40 orçamento, E31 garantias, E41 Sankey, E20 dedup, E28 calendário financeiro, E34 relatório anual, E21 registro rápido.
**Infra:** I2 iOS, E18 carga cartão, TEC-12 chunking, E39 receipts, TEC-11 WCAG, E19 bank detection, TEC-10 cleanup.
**Visual wiring:** Debt Payoff calc, Sankey→cash-flow, Forecast→dashboard, FiscalCalendar→/tax, Fiscal→sininho, Warranties page, AnnualComparison→cash-flow.

## Backlog priorizado para sessão 39

### P0 — Bloqueadores de lançamento

| Item | Descrição | Dependência |
|------|-----------|-------------|
| A2 | Apple Developer Account (US$99/ano) — desbloqueia CFG-04, FIN-17, FIN-18, I3-I5 | Claudio (externo) |
| A1 | Supabase Pro upgrade — desbloqueia Leaked Password Protection | Claudio (externo) |
| A14 | Brand assets (favicon, apple-touch-icon, PWA icons) — app usa ícone genérico | Claudio (design) |

### P1 — Código (sem dependência externa)

| Item | Descrição | Estimativa |
|------|-----------|------------|
| **E24** | Módulo de investimentos (cadastro manual + cotações, 9 tipos, crons fallback) | 10-15h |
| **E16** | Compartilhamento familiar (multi-user, RBAC, RLS) — reclassificado H1 | 10-15h |
| **E19 cont.** | CSV body parsing por banco (Nubank, BTG, XP, Itaú, Inter, C6, Porto) | 4-6h |
| **Story→test gap** | Maioria das stories sem teste associado (RASTREABILIDADE-STORY-TESTE.md) | 6-8h |

### P2 — Polish e diferenciação

| Item | Descrição | Estimativa |
|------|-----------|------------|
| E34-UI | Relatório anual Wrapped (Spotify-style) — engine pronto, falta UI | 3-4h |
| E21-UI | Quick register suggestions no FAB do dashboard — engine pronto | 2-3h |
| E28-UI | Calendário financeiro visual (component) — engine pronto | 3-4h |
| E35 | Acesso read-only para contador (link temporário) | 2-3h |
| Form primitives | Migração incremental dos forms para form-primitives.tsx | 4-6h |

### P3 — Dívida técnica

| Item | Descrição |
|------|-----------|
| npm Lote 3 | TypeScript 6.0 + 14 major outdated (deferred, ts-jest peer dep) |
| TEC-10 cont. | 4 RPCs com `as any` (irpf, scanner, engine-v2, diagnostics) — precisam tipos |
| Corridor test | UX-H3-05: teste de usabilidade com 3 pessoas (Claudio) |

## Instruções

1. Ler `HANDOVER-WealthOS.md` §38 para contexto completo.
2. Ler `PENDENCIAS-FUTURAS.md` para backlog detalhado.
3. Executar autonomamente contra o backlog P1 acima.
4. Manter ground truth no HANDOVER.
5. CI green antes de encerrar.

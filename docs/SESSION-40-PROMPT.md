# Sessão 40 do Oniefy

## Contexto imediato

Sessão anterior (39): auditoria de coerência documental + implementação de 5 engines do redesign. 12 commits (`5355341`→`d4f5aa9`). CI green (docs + engines puros, sem alterações de componentes React).

Ler `HANDOVER-WealthOS.md` §39 para o contexto completo da sessão anterior. O HANDOVER é o source of truth do projeto.

## Ground truth (verificado sessão 39, commit `d4f5aa9`)

| Métrica | Valor |
|---------|-------|
| Tabelas | 37 |
| Políticas RLS | 119 (112 public + 7 storage) |
| Functions | 77 (todas com search_path=public) |
| Triggers | 23 (26 event bindings) |
| ENUMs | 29 |
| Indexes | 152 |
| Migration files (repo) | 71 |
| pg_cron jobs | 13 |
| Suítes Jest | 76 |
| Assertions | ~1.164 |
| Arquivos TS/TSX | 294 |
| Hooks | 42 |
| Schemas Zod | 61 |
| Páginas (total) | 43 (35 autenticadas + 8 auth/public) |
| Calculadoras | 8 + diagnostics |
| Engines puros (services/) | 21 |
| Parsers | 6 |
| Navegação | 5 tabs mobile + sidebar 18 links desktop + sininho |
| eslint-disable (produção) | 6 |
| docs/ ativos | 22 |
| docs/audit/ | 10 (9 capítulos + auditoria sessão 39) |
| docs/archive/ | 6 (históricos) |

## O que a sessão 39 fez

### Parte 1: Auditoria de coerência documental

Relatório: `docs/audit/AUDITORIA-COERENCIA-2026-04-03.md` (39 achados, 3 adendos).

Execução completa dos 4 blocos do SESSION-39-PROMPT:
- B1: 22 métricas do HANDOVER verificadas contra `execute_sql` / `find` / `grep`
- B2: 59 itens ✅ verificados por filesystem, 5 DT spot-checked contra código/DB
- B3: 12/12 specs verificadas contra implementação
- B4: 44 documentos inventariados individualmente, cross-references completos

Correções documentais aplicadas (D1-D17):
- HANDOVER: §3.3 76→77, §3.2 migrations ~58→53, §38.8 Zod 58→61, sidebar 19→18, notas snapshot §35/§36
- DIVIDA-TECNICA: DT-026/027/028 ✅, header ARQUIVO HISTÓRICO
- PENDENCIAS-DECISAO: header ARQUIVO HISTÓRICO, 15 itens migrados como E52-E65
- WCAG-AA-AUDIT: 3/4 gaps ✅
- LGPD-MAPEAMENTO: +2 tabelas (warranties, savings_goals)
- CLAUDE.md, README: referências atualizadas

### Parte 2: Consolidação documental

- 3 deletados: AUDIT-CODE-DUMP (25k linhas), MIGRATE-SUPABASE-SP (obsoleto), PROMPT-CLAUDE-CODE-E2E (obsoleto)
- 6 movidos para `docs/archive/`: DIVIDA-TECNICA, PENDENCIAS-DECISAO, PLANO-REVISAO, AUDITORIA-TECNICA-2026-03-13, RELATORIO-AUDITORIA-2026-03-19, AUDIT-PROMPT-GEMINI
- PENDENCIAS-FUTURAS reorganizado: pendentes primeiro, concluídos no final. 361→226 linhas. §11 Benchmark removido (vive em COMPETITIVE-ANALYSIS.md).

### Parte 3: Implementação de 5 engines do redesign (85 testes)

| Feature | Engine | Testes |
|---------|--------|--------|
| E67 | Motor de parcelamento (aritmética centavo, regex 6 bancos, projeção faturas, reconciliação) | 29 |
| E68 | Bank statement pipeline (detecção→parser→normalização→parcelas por banco) | 8 |
| E66 | Dedup learning loop (recordUserDecision, applyLearnedPatterns, filterOppositeSigns) | 8 |
| E69 | Password derivation (8 bancos, fórmulas CPF/CEP, fallback desconhecido) | 21 |
| E71 | Import failure workflows (8 tipos de falha, classifyImportError) | 19 |

Migration 082: installment_group_id, installment_current, installment_total, installment_original_amount em transactions.

## Pendente da sessão 39 (não executado)

| Item | Esforço | Notas |
|------|---------|-------|
| D8: Regenerar RASTREABILIDADE-STORY-TESTE (108 stories) | 2-3h | Cobre 65/108, datado sessão 34, sem E-items |
| D17: Revisar ROTEIRO-TESTE-MANUAL vs UI atual | 1h | Navegação mudou na sessão 38 |
| C1: Resolver `as any` em 4 hooks (use-diagnostics, use-engine-v2, use-scanner, use-irpf-deductions) | 1-2h | Requer regenerar database.ts types ou criar overloads |

## Backlog do redesign (pendências executáveis sem bloqueio externo)

Das 16 pendências do redesign identificadas na sessão 39, 5 foram implementadas. Restam 11:

| ID | Item | Bloqueio |
|----|------|---------|
| E24 | Módulo de investimentos (9 tipos, cotações, marcação a mercado) | Nenhum. Maior item do backlog (~8-12h). |
| E16 | Compartilhamento familiar (RBAC, permissões granulares) | Nenhum. Alto impacto. |
| E42 | Valorização imóveis FipeZap | API externa (pesquisa) |
| E43 | Assistente WhatsApp | WhatsApp Business API |
| E46 | Score crédito Serasa/Boa Vista | API externa |
| E35 | Acesso read-only contador | Nenhum. Baixo esforço. |
| E25 | Integração B3 API | A15-A18 (conta B3) |
| E70 | Inbound email faturas | Serviço inbound (Resend/SES) |
| E36 | Testamento digital | Consultoria jurídica |
| E47/E48/E49 | Benchmark, PJ, Offline | Gatilhos de tração |

## Documentos-chave

| Documento | Papel |
|-----------|-------|
| `HANDOVER-WealthOS.md` | Source of truth (contexto + histórico + ground truth). §39 tem tudo desta sessão. |
| `PENDENCIAS-FUTURAS.md` | Backlog unificado. Pendentes primeiro, concluídos no final. |
| `docs/audit/AUDITORIA-COERENCIA-2026-04-03.md` | Relatório da auditoria (39 achados + 3 adendos). |
| `docs/MATRIZ-VALIDACAO.md` | Framework de auditoria (37 tipos, 10 camadas). Também em Project Knowledge. |

## Instruções

1. Ler `HANDOVER-WealthOS.md` §39 no início da sessão.
2. Verificar CI green no commit mais recente.
3. Consultar `PENDENCIAS-FUTURAS.md` para o backlog priorizado.
4. Verificar contra fonte primária (`execute_sql`, `find`, `grep`), nunca confiar no que outro documento afirma.

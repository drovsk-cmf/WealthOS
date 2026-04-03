# Sessão 39 — Auditoria de Coerência Documental

## Objetivo

Auditoria completa de coerência entre documentação e implementação do projeto Oniefy. A revisão responde 4 perguntas: o que os documentos afirmam, o que o código implementa, onde há divergência e o que precisa ser corrigido.

## Contexto do projeto

Repo: `drovsk-cmf/WealthOS` (público). Deploy: `www.oniefy.com`.
PAT: usar token vigente do memory/userMemories. Git user: `Claude (Anthropic) / claude@anthropic.com`.
Supabase: projeto `mngjbrbxapazdddzgoje` (sa-east-1). MCP via OAuth. Operações de schema via `execute_sql`.

Sessão 37 (conceitual): 12 specs, 0 código, decisões de produto.
Sessão 38 (implementação): 30 itens + 7 visual wiring, 70 commits, 16 engines puros.
Ambas documentadas no HANDOVER §37 e §38.

## Ground truth declarado (sessão 38, CI green `68823c0`)

| Métrica | Valor declarado |
|---------|----------------|
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
| Engines puros | 16 |

**ATENÇÃO:** Estes valores foram verificados na sessão 38, mas a auditoria deve re-verificar cada um contra a realidade. Não confiar nesta tabela como verdade absoluta.

---

## Inventário completo de documentação (168 artefatos)

### A. Repositório GitHub (156 artefatos)

**A1. Markdown raiz (3)**
- `HANDOVER-WealthOS.md` (~5.167L) — contexto + histórico sessão a sessão + ground truth
- `PENDENCIAS-FUTURAS.md` (331L) — backlog com status por item + histórico
- `README.md` (127L) — README público

**A2. Markdown docs/ (29)**
- Specs de features (12): B3-API-INTEGRATION-SPEC, COMPETITIVE-ANALYSIS, DEDUP-ENGINE-SPEC, FEATURES-ROADMAP-SPEC, IMPORT-ENGINE-SPEC, INSTALLMENT-SYSTEM-SPEC, INVESTMENTS-MODULE-SPEC, NAVIGATION-SPEC, NOTIFICATION-BELL-SPEC, ONIE-ORB-SPEC, QUICK-REGISTER-SPEC, TAX-ENGINE-SPEC
- Metodologia/compliance (4): FINANCIAL-METHODOLOGY, LGPD-MAPEAMENTO, POLITICA-EARLY-ADOPTERS, PLANO-REVISAO-ONIEFY
- Auditorias avulsas (5): AUDIT-CODE-DUMP, AUDIT-PROMPT-GEMINI, AUDITORIA-TECNICA-2026-03-13, RELATORIO-AUDITORIA-2026-03-19, WCAG-AA-AUDIT
- Validação/teste (2): MATRIZ-VALIDACAO, ROTEIRO-TESTE-MANUAL
- Operacional (4): DEPLOY-VERCEL, MIGRATE-SUPABASE-SP, SETUP-LOCAL, PROMPT-CLAUDE-CODE-E2E
- Rastreamento (1): RASTREABILIDADE-STORY-TESTE
- Session prompt (1): SESSION-39-PROMPT (este arquivo)

**A3. Markdown docs/audit/ (11)**
- 9 capítulos: 00-SUMMARY, 01-auth-session, 02-access-data, 03-input-output, 04-mobile, 05-code-quality, 06-performance-db, 07-ux-usability, 08-accessibility
- 2 rastreamento: DIVIDA-TECNICA, PENDENCIAS-DECISAO

**A4. Specs originais docs/specs/ (8 .docx)**
- wealthos-especificacao-v1, wealthos-funcional-v1, wealthos-estudo-tecnico-v2_0, wealthos-estudo-contabil-v1_5-final, wealthos-adendo-v1_1 a v1_4

**A5. Dados referência docs/data/ (2 .xlsx)**
- catalogo_bcb_sgs_filter, catalogo_ibge_sidra_filter

**A6-A12. Infraestrutura**
- 70 migrations (.sql), 3 seeds (.sql), 2 SQL tests, 1 supabase/config.toml
- 4 CI/CD workflows (.yml)
- 9 configs raiz (package.json, tsconfig.json, etc.)
- 14 brand/PWA assets (public/)

### B. Claude Project Knowledge — exclusivos (2)
- `MAN-LNG-CMF-001_v1_2.md` (933L) — manual de linguagem (tom de voz, terminologia)
- `MATRIZ-VALIDACAO-v2_1.md` (412L) — framework de auditoria: taxonomia + 37 tipos + 10 camadas

### C. Claude User Skills (6)
- financial-diagnostics, financial-engineering, financial-math, financial-modeling, financial-statement-analysis, impressao-digital-claudio

### D. Transcripts (2)
- session-38-redesign-implementation.txt (17.580L), journal.txt (7L)

### E. Persistentes não-arquivo (2)
- userMemories, userPreferences

### F. Google Drive — pasta 01. WealthOS
- 9 subpastas operacionais (assets, sem especificações adicionais)

---

## Metodologia da auditoria

### Framework: MATRIZ-VALIDACAO-v2_1.md

Taxonomia de achados (§1 da matriz):

| Categoria | Quando usar na auditoria |
|-----------|--------------------------|
| **Defeito** | Documento afirma X, código faz Y, e Y está errado |
| **Vulnerabilidade** | Spec de segurança (RLS, auth) não implementada como descrita |
| **Fragilidade** | Documento descreve arquitetura que o código não segue mais |
| **Débito técnico** | Decisão documentada que nunca foi implementada |
| **Sujeira** | Documento obsoleto, número stale, referência quebrada |

Tipos de auditoria relevantes (§2 da matriz): 1.2 (HANDOVER), 3.2 (schema types), 6.2 (testes vs spec), 10.2 (rastreabilidade), 4.1 (RLS).

### 4 blocos de execução

| Bloco | Escopo | Método |
|-------|--------|--------|
| **B1: Estrutura declarada vs real** | HANDOVER §3 (overview) + §38 (ground truth) vs `execute_sql` + `find` + `grep` | Cada número do HANDOVER verificado contra fonte primária |
| **B2: Pendências vs status real** | PENDENCIAS-FUTURAS + PENDENCIAS-DECISAO + DIVIDA-TECNICA: cada item verificado | Grep por ID do item no código, verificar se implementação existe |
| **B3: Regras e convenções (specs vs código)** | 12 specs de features vs implementação real | O que a spec disse, o que foi feito, onde diverge |
| **B4: Conflitos entre documentos** | Cross-reference entre todos os documentos de rastreamento | Dois documentos afirmando coisas diferentes sobre o mesmo assunto |

### Formato de cada achado

| Campo | Descrição |
|-------|-----------|
| ID | Sequencial (A001, A002...) |
| Bloco | B1, B2, B3 ou B4 |
| Tipo auditoria | ID da MATRIZ-VALIDACAO (1.2, 3.2, 6.2, 10.2, 4.1) |
| Origem | Documento que faz a afirmação |
| Afirmação | O que o documento diz |
| Evidência esperada | O que deveria existir no código/DB |
| Evidência encontrada | O que realmente existe |
| Status | Confirmado, Parcial, Divergente, Obsoleto, Não evidenciado |
| Categoria | Defeito, Vulnerabilidade, Fragilidade, Débito, Sujeira |
| Ação | Atualizar doc, Corrigir código, Revisar regra, Remover obsoleto |

---

## Falhas já identificadas (ponto de partida)

| # | Falha | Corrigido? |
|---|-------|-----------|
| 1 | HANDOVER §3.2 dizia 36 tabelas, 108 RLS, 76 functions, 149 indexes, 65 migrations | ✅ Parcial (§3.2 atualizado, seções históricas preservadas) |
| 2 | HANDOVER §3.4 dizia 233 TS/TSX, 56 suítes, 891 assertions, 33 hooks, 46 Zod | ✅ Parcial (§3.4 header atualizado) |
| 3 | Sessão 37 inteira ausente do HANDOVER (pulo de §36 para §38) | ✅ §37 criada |
| 4 | SESSION-38-PROMPT.md obsoleto no repo | ✅ Deletado |
| 5 | PENDENCIAS histórico sessão 38 desatualizado (14 itens, eram 30+7) | ✅ Corrigido |
| 6 | RASTREABILIDADE-STORY-TESTE.md desatualizado desde sessão 35 | ❌ |
| 7 | PENDENCIAS-DECISAO.md (docs/audit/) nunca cruzado com PENDENCIAS-FUTURAS | ❌ |
| 8 | DIVIDA-TECNICA.md (docs/audit/) nunca cruzado com PENDENCIAS-FUTURAS | ❌ |
| 9 | 3 fontes de pendências com sobreposição (PENDENCIAS-FUTURAS, PENDENCIAS-DECISAO, HANDOVER) | ❌ |
| 10 | Valores stale em seções históricas do HANDOVER (§35, §36 com números antigos) | ❌ (preservados como histórico) |
| 11 | 4 RPCs com `as any` sem tipo no database.ts (irpf, scanner, engine-v2, diagnostics) | ❌ |
| 12 | Zod schemas: seções antigas dizem 43, realidade é 58 | ✅ Ground truth §38.8 corrigido |

---

## Entregáveis esperados

1. **Inventário validado** — cada documento com status: ativo, obsoleto, duplicado, órfão
2. **Matriz de rastreabilidade** — tabela com todos os achados
3. **Tabela de inconsistências priorizadas** — agrupadas por categoria
4. **Lista de ações** — atualizar doc, corrigir código, revisar regra, remover obsoleto
5. **Proposta de consolidação** — quantos documentos de rastreamento devem existir, papel de cada um, protocolo de atualização
6. **Commit do relatório** — `docs/audit/AUDITORIA-COERENCIA-2026-04-03.md`

---

## Instruções

1. Ler `HANDOVER-WealthOS.md` §37-§38 para contexto.
2. Ler `MATRIZ-VALIDACAO-v2_1.md` (Project Knowledge) para taxonomia e tipos.
3. Executar B1→B2→B3→B4 sequencialmente. Para cada bloco: verificar contra fonte primária (`execute_sql`, `find`, `grep`). Nunca confiar no que outro documento afirma.
4. Produzir relatório, commitar, CI green.

## Inventário de pendências (referência)

| Status | Qtd | Itens |
|--------|-----|-------|
| ✅ Concluídos | 59 | Stories originais (105/108) + itens técnicos |
| ⬜ Pendentes | 15 | A14-A18, E16, E24, E35, E36, E42, E43, E46, Q2, TEC-06, TEC-07 |
| 🔒 Bloqueados | 8 | CFG-04, FIN-17, FIN-18, I3, I4, I5, E25, E11(APNs) |
| 📌 Adiados | 11 | E10, E14, E47-E49, TEC-01 a TEC-05, TEC-10 |

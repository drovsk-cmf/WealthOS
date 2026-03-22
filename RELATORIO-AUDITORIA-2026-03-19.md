# Relatório de Auditoria - Oniefy (WealthOS)

**Data:** 19 de março de 2026
**Pacote:** Release Gate (completo)
**Auditorias executadas:** 30 de 37 (7 diferidas conforme acordo)
**Projeto Supabase auditado:** `hmwdfcsxtmbzlslxgqus` (sa-east-1) — **ATENÇÃO: projeto LEGADO, pausado em 20/03/2026. Projeto ativo: `mngjbrbxapazdddzgoje` (oniefy-prod)**
**CI:** Verde em todos os commits da sessão

---

## 1. Resumo executivo

| Categoria | Encontrados | Corrigidos | Abertos |
|-----------|------------|------------|---------|
| Defeito | 5 | 2 | 3 |
| Vulnerabilidade | 2 | 1 | 1 |
| Performance | 1 | 1 | 0 |
| Fragilidade | 5 | 1 | 4 |
| Débito técnico | 4 | 1 | 3 |
| Sujeira | 3 | 0 | 3 |
| **Total** | **20** | **6** | **14** |

---

## 2. Correções aplicadas nesta sessão

| Commit | Achados corrigidos |
|--------|-------------------|
| `3ecd9bb` | 4.1-A: 6 UPDATE policies sem WITH CHECK (Vulnerabilidade). 4.1-B: 4 policies auth.uid() → subselect (Performance). 4.4-A: Admin client consolidado (Débito). coverage/ gitignored |
| `c7aec84` | 3.4-A: Budgets invalidation em 5 mutations (Fragilidade). 9.1-A: .env.example completo (Fragilidade) |
| Supabase | Migration 054 aplicada no banco |

---

## 3. Achados abertos por prioridade

### P0 — Corrigir antes de deploy

| # | Auditoria | Categoria | Descrição | Ação recomendada |
|---|-----------|-----------|-----------|-----------------|
| 1 | 3.2-A / 3.1 / 2.3-B | **Defeito** | `database.ts` contém tabelas fantasma (`setup_journey`, `description_aliases`), RPCs inexistentes (`get_setup_journey`, `advance_setup_journey`, `get_currency_rates`, `get_supported_currencies`), e coluna `currency` que não existe no banco | Decidir: (a) criar as RPCs/tabelas/colunas faltantes ou (b) limpar o código morto. Option (b) é mais seguro — remove hooks que falhariam em runtime |
| 2 | 3.2-B / 2.3-C | **Defeito** | `use-setup-journey.ts` importado por 8 arquivos (dashboard, transaction-engine, accounts, etc.) e `use-currencies.ts` por 2 forms. Ambos chamam RPCs inexistentes | Se opção (b) acima: remover hooks, remover imports, remover chamadas a `tryAdvanceStep` |
| 3 | 8.1 | **Vulnerabilidade** | `xlsx` 0.18.5 tem prototype pollution (GHSA-4r6h) + ReDoS (GHSA-5pgg). Parsa uploads do usuário. No fix disponível para o pacote | Migrar para `exceljs` (MIT, mantido). Alternativa: aceitar risco documentado (parse é client-side, afeta só o próprio usuário) |
| 4 | 1.2-A | **Defeito** | HANDOVER referencia **dois** Supabase projects. Auditoria foi feita em `hmwdfcsxtmbzlslxgqus` (us-east-1). Se produção é `mngjbrbxapazdddzgoje` (sa-east-1), os achados de segurança (RLS, search_path, migration 054) precisam ser reverificados no projeto correto | Confirmar qual projeto é produção. Se SP: re-executar auditorias 4.1 e 4.3 contra ele e aplicar migration 054 |

### P1 — Corrigir antes de lançamento público

| # | Auditoria | Categoria | Descrição | Ação recomendada |
|---|-----------|-----------|-----------|-----------------|
| 5 | 9.2-A | **Débito** | Sem Sentry ou error tracking remoto em produção. `console.error` com prefixo `[Oniefy]` é consistente mas não capturável remotamente | Integrar Sentry (free tier: 5k events/mês). Ou Vercel Analytics + Error Tracking |
| 6 | 8.4 | **Débito** | SBOM gerado manualmente. Falta automação no CI | Adicionar step `npm sbom --sbom-format cyclonedx` no CI, salvar como artefato do build |
| 7 | 10.2-A | **Fragilidade** | Testes não referenciam story IDs. Rastreabilidade requisito→teste não é automatizável | Adicionar tags nos describe blocks: `describe("FIN-01: Criar transação", ...)` |
| 8 | 1.2-B | **Defeito** | HANDOVER diz 28 tabelas, banco tem 26. Contagens divergem | Atualizar HANDOVER com contagens reais após resolver P0-1 (tabelas fantasma) |

### P2 — Próxima sprint

| # | Auditoria | Categoria | Descrição |
|---|-----------|-----------|-----------|
| 9 | 2.5 | **Fragilidade** | 6 `eslint-disable react-hooks/exhaustive-deps` em 3 arquivos (onboarding, dashboard, settings) |
| 10 | 7.1-A | **Sujeira** | ~25 hex codes hardcoded em charts (Plum Ledger corretos, mas não centralizados) |
| 11 | 8.2 | **Débito** | 12 pacotes major version atrás (Capacitor 6→8, ESLint 8→10, Next 15→16, Tailwind 3→4, Zod 3→4, etc.) |
| 12 | 2.3-A | **Sujeira** | `use-access-logs.ts` nunca importado (dead code) |
| 13 | 2.2 | **Sujeira** | 2 ESLint warnings (`_a`, `_c` não usados em `use-transactions.ts`) |
| 14 | 2.5-ESL | **Fragilidade** | `varsIgnorePattern: "^_"` faltando na config ESLint (warnings por variáveis de destructuring prefixadas com `_`) |

---

## 4. Resultado por auditoria

### Camada 1 — Repositório e Processo

| # | Auditoria | Status | Achados |
|---|-----------|--------|---------|
| 1.1 | Integridade de commits | ✅ PASS | 0 |
| 1.2 | Consistência do HANDOVER | ⚠️ 3 ACHADOS | 2 Defeitos (dual project, contagens), 1 Sujeira |
| 1.3 | CI/CD health | ✅ PASS | CI verde, 3 jobs OK |

### Camada 2 — Qualidade de Código

| # | Auditoria | Status | Achados |
|---|-----------|--------|---------|
| 2.1 | Compilação e tipos | ✅ PASS | Zero erros TSC |
| 2.2 | Lint | ✅ PASS | 2 warnings menores |
| 2.3 | Dead code | ⚠️ 3 ACHADOS | 1 hook não importado + 2 hooks com RPCs fantasma (confirmados de 3.2) |
| 2.4 | Duplicação | ✅ PASS | 1.49% duplicação (excelente) |
| 2.5 | Fragilidade estática | ⚠️ MENOR | 6 exhaustive-deps, 1 any |
| 2.6 | Nomenclatura | ✅ PASS | Zero termos legacy |

### Camada 3 — Arquitetura e Design

| # | Auditoria | Status | Achados |
|---|-----------|--------|---------|
| 3.1 | Consistência front/back | ⚠️ DEFEITO | 4 RPCs chamadas no frontend não existem no banco |
| 3.2 | Schema types vs banco | ⚠️ 3 ACHADOS | Defeito (tabelas/RPCs/colunas fantasma), Fragilidade, Débito |
| 3.3 | Acoplamento | ✅ PASS | Zero imports circulares |
| 3.4 | Cache invalidation | ✅ CORRIGIDO | Budgets adicionado às 5 mutations de transação |
| 3.5 | Error handling | ✅ PASS | Padrão consistente com silent fail intencional |

### Camada 4 — Segurança

| # | Auditoria | Status | Achados |
|---|-----------|--------|---------|
| 4.1 | RLS | ✅ CORRIGIDO | 26/26 tabelas com RLS. WITH CHECK e subselect corrigidos |
| 4.2 | Auth guards | ✅ PASS | Middleware + API routes robustos |
| 4.3 | search_path | ✅ PASS | 55/55 funções OK |
| 4.4 | Secrets | ✅ CORRIGIDO | Admin client consolidado. Zero exposure |
| 4.5 | Input validation | ✅ PASS | Zod, CSV, path traversal, upload |
| 4.6 | SSRF/CSRF | ✅ PASS | Allowlist, URL parse, timeout |

### Camada 5 — Performance

| # | Auditoria | Status | Achados |
|---|-----------|--------|---------|
| 5.1 | Queries N+1 | ✅ PASS | Zero N+1 encontrados |
| 5.2 | Roundtrips | ⚠️ DÉBITO KNOWN | Dashboard 9+ calls (mitigado com get_dashboard_all) |
| 5.3 | Bundle size | ⏸️ N/A | Build falha neste ambiente (Google Fonts). Requer execução local |
| 5.4 | Índices DB | ✅ PASS | Índices adequados ao volume |

### Camada 6 — Funcional (Testes)

| # | Auditoria | Status | Achados |
|---|-----------|--------|---------|
| 6.1 | Cobertura unitária | ⚠️ INFO | 63.5% statements, 56.8% branches. 341 testes, 0 falhas |
| 6.2 | Testes vs spec | ⚠️ FRAGILIDADE | 82/90 stories referenciadas no código. Sem tag formal requisito→teste |
| 6.3 | Regressão | ✅ PASS | 6 testes audit-specific para bugs anteriores |
| 6.4 | E2E/integração | ✅ PASS | 9 specs Playwright (auth, security, UX, a11y) |
| 6.5 | Carga/resiliência | ⏸️ DIFERIDO | Requer staging. Plano documentado |
| 6.6 | DAST | ⏸️ DIFERIDO | Parcial possível com scripts. OWASP ZAP após Vercel deploy |
| 6.7 | Mutation testing | ⏸️ DIFERIDO | Após cobertura unitária > 70% |

### Camada 7 — UX e Acessibilidade

| # | Auditoria | Status | Achados |
|---|-----------|--------|---------|
| 7.1 | Design system | ⚠️ SUJEIRA | ~25 hex hardcoded em charts (cores corretas, não centralizadas) |
| 7.2 | Estados vazios/erros | ✅ PASS | Todas as páginas com data fetching tratam loading/empty/error |
| 7.3 | Acessibilidade | ✅ PASS | 75 aria-labels, 42 focus handlers, E2E a11y test |

### Camada 8 — Dependências e Supply Chain

| # | Auditoria | Status | Achados |
|---|-----------|--------|---------|
| 8.1 | SCA (CVEs) | ⚠️ 1 VULN | xlsx prototype pollution + ReDoS (P0) |
| 8.2 | Obsolescência | ⚠️ DÉBITO | 12 pacotes major version atrás |
| 8.3 | Licenciamento | ✅ PASS | Zero GPL. LGPL/MPL avaliados e OK |
| 8.4 | SBOM | ✅ GERADO | CycloneDX 1.5. Falta automação CI (P1) |

### Camada 9 — Infraestrutura e Runtime

| # | Auditoria | Status | Achados |
|---|-----------|--------|---------|
| 9.1 | Config ambientes | ✅ CORRIGIDO | .env.example completado |
| 9.2 | Observabilidade | ⚠️ DÉBITO | Sem Sentry/error tracking remoto (P1) |
| 9.3 | Resiliência | ✅ PASS | React Query retry, Service Worker, online status |

### Camada 10 — Conformidade e Governança

| # | Auditoria | Status | Achados |
|---|-----------|--------|---------|
| 10.1 | LGPD | ✅ MAPEADO | 9 tabelas com dados pessoais mapeadas. Controles existentes: RLS, E2E encryption, deletion mechanism, privacy policy. Pendente: RIPD formal |
| 10.2 | Rastreabilidade | ⚠️ FRAGILIDADE | Testes sem tag de story. 82/90 stories referenciadas no código |
| 10.3 | ISO 27001 A.8.28 | ✅ PASS | 7/8 princípios verificados. Nota: falta observabilidade remota |

---

## 5. Métricas de saúde do codebase

| Métrica | Valor | Avaliação |
|---------|-------|-----------|
| Arquivos fonte | 156 | |
| Testes unitários | 22 suites, 341 testes | |
| Testes E2E | 9 specs Playwright | |
| Cobertura statements | 63.5% | Aceitável, meta > 70% |
| Cobertura branches | 56.8% | Melhorar em módulos críticos |
| Duplicação | 1.49% | Excelente |
| `@ts-ignore` | 0 | Excelente |
| `: any` | 1 (justificado) | Excelente |
| `eslint-disable` | 10 (6 exhaustive-deps) | Aceitável |
| TODO/FIXME | 1 (intencional Fase 10) | Limpo |
| Funções PG com search_path | 55/55 (100%) | Excelente |
| Tabelas com RLS | 26/26 (100%) | Excelente |
| Policies com subselect | 83/83 (100%) após fix | Excelente |
| Dependências circulares | 0 | Excelente |
| CVEs críticas abertas | 1 (xlsx) | Corrigir antes de prod |

---

## 6. Registro para seção 5 da Matriz

| Data | Pacote | Auditorias executadas | Achados | Referência |
|------|--------|----------------------|---------|------------|
| 2026-03-19 | Release Gate (30/37) | 1.1-1.3, 2.1-2.6, 3.1-3.5, 4.1-4.6, 5.1-5.4, 6.1-6.4, 7.1-7.3, 8.1-8.4, 9.1-9.3, 10.1-10.3 | 5 defeitos, 2 vulns, 1 perf, 5 fragilidades, 4 débitos, 3 sujeiras. 6 corrigidos in-session | RELATORIO-AUDITORIA-2026-03-19.md |

# Oniefy - Matriz de Validação

**Versão:** 1.0
**Data:** 18 de março de 2026
**Projeto:** Oniefy (WealthOS)

---

## 1. Taxonomia de achados

Todo achado de auditoria recebe exatamente uma classificação. As 6 categorias estão ordenadas por severidade decrescente.

### 1.1 Defeito (bug/defect)

Comportamento que diverge da especificação ou da intenção documentada. O código faz X, deveria fazer Y. Tem reprodução concreta.

Um defeito envolve 3 estágios internos (não são categorias separadas):

- **Erro**: o defeito no código-fonte (o que o desenvolvedor corrige)
- **Bug**: o comportamento incorreto resultante (o que o QA reporta)
- **Falha**: o efeito observável pelo usuário em runtime (o que o usuário experimenta)

Exemplo: dashboard não invalida cache após criar transação (erro) causa saldo desatualizado na tela (bug) que o usuário vê como valor incorreto (falha).

Prioridade: corrigir antes de qualquer merge ou deploy.

### 1.2 Vulnerabilidade

Vetor de ataque explorável. O fluxo feliz funciona normalmente, mas um atacante pode explorar o comportamento para causar dano (acesso indevido, exfiltração de dados, negação de serviço).

Exemplo: função PostgreSQL sem `SET search_path` permite search_path hijacking; regex sem proteção contra ReDoS; SSRF por fetch a host não-allowlisted.

Prioridade: corrigir antes de qualquer deploy público.

### 1.3 Problema de performance

O código funciona corretamente mas consome recursos (tempo, rede, CPU, memória) além do aceitável para a experiência do usuário ou para os limites da infraestrutura.

Exemplo: N+1 queries no endpoint de push notifications; 6 fetches sequenciais ao BCB quando poderiam ser paralelos; componente fazendo roundtrip HTTP próprio quando dados já estão disponíveis no parent.

Prioridade: corrigir quando impacta UX perceptivelmente (>300ms) ou custo de infra.

### 1.4 Fragilidade

O código funciona hoje mas quebra facilmente com mudança futura, refatoração, ou condição de borda não testada. Indica acoplamento frágil ou dependência de comportamento acidental.

Exemplo: `useEffect` com `eslint-disable` que depende de ordem de execução; regex com flag `g` desnecessário que funciona por acidente do early return; `onSuccess` síncrono que funciona porque o React Query não garante ordem.

Prioridade: corrigir junto com a próxima mudança na área afetada.

### 1.5 Débito técnico

Decisão de implementação subótima (consciente ou inconsciente) onde o código funciona corretamente mas cria custo de manutenção, extensão ou diagnóstico no futuro.

Exemplo: rate limiter in-memory (funciona em single instance, não escala para multi-região); fire-and-forget sem logging (funciona, mas sabota diagnóstico); `useBudgetMonths` fazendo over-fetch de 500 rows para extrair 12 (funciona, mas desperdiça rede).

Prioridade: pagar quando o custo acumulado justifica o investimento, ou quando tocar na área afetada.

### 1.6 Sujeira (code smell)

Degradação de qualidade sem impacto funcional, de segurança, de performance, nem custo futuro significativo. Afeta apenas legibilidade e estética do código.

Exemplo: import duplicado (`createClient` e `createAdminClient` em linhas separadas do mesmo módulo); variável declarada mas não usada; comentário desatualizado; TODO esquecido.

Prioridade: limpar oportunisticamente. Nunca justifica commit dedicado.

---

## 2. Tipos de auditoria

Organizados por camada do sistema. Cada tipo verifica uma preocupação específica e pode produzir achados de qualquer categoria da taxonomia acima.

### Camada 1 - Repositório e Processo

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 1.1 | Integridade de commits | Commits pendentes, divergência local/remote, stash esquecido, branches órfãs | `git status`, `git log`, `git stash list`, `git branch -a` | Sujeira, Débito |
| 1.2 | Consistência do HANDOVER | Contagens (migrations, stories, RPCs, arquivos) batem com a realidade do código | HANDOVER vs `find`, `grep`, Supabase MCP | Defeito (se gera decisão errada), Sujeira |
| 1.3 | CI/CD health | Pipeline verde, jobs configurados, cobertura mínima enforçada | GitHub Actions API, `curl` | Fragilidade, Débito |

### Camada 2 - Qualidade de Código (Análise Estática)

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 2.1 | Compilação e tipos | TypeScript compila sem erros, tipos consistentes | `npx tsc --noEmit` | Defeito |
| 2.2 | Lint | Regras de estilo, patterns problemáticos, `eslint-disable` justificados | `npx eslint src/` | Fragilidade, Sujeira |
| 2.3 | Dead code | Exports não usados, imports órfãos, funções mortas, variáveis não referenciadas | `ts-prune`, grep manual | Sujeira |
| 2.4 | Duplicação | Código copiado entre arquivos, patterns repetidos sem abstração | grep de patterns, `jscpd` | Débito, Sujeira |
| 2.5 | Fragilidade estática | `eslint-disable`, `any`, `@ts-ignore`, `catch {}` vazio, TODO/FIXME esquecidos | grep direcionado | Fragilidade |
| 2.6 | Nomenclatura e microcopy | UI strings consistentes com MAN-LNG-CMF-001, sem termos legacy na interface | grep | Sujeira, Defeito (se UX confusa) |

### Camada 3 - Arquitetura e Design

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 3.1 | Consistência frontend/backend | Hooks chamam RPCs existentes, parâmetros batem com assinaturas Postgres, ENUMs sincronizados | Tipos gerados vs `use-*.ts` vs Supabase MCP | Defeito |
| 3.2 | Schema types vs banco real | `database.ts` reflete o schema atual do Supabase (tabelas, colunas, enums, functions) | `npx supabase gen types` vs arquivo atual | Defeito, Fragilidade |
| 3.3 | Acoplamento e dependências | Imports circulares, módulos que sabem demais sobre outros, violações de camada | `madge`, análise de imports | Débito |
| 3.4 | Cache invalidation | Toda mutation invalida as queryKeys que dependem dos dados alterados; consistência entre hooks | grep de `invalidateQueries` cruzado com fluxo de dados | Defeito |
| 3.5 | Error handling | Erros propagados, tratados ou silenciados; observabilidade preservada em todas as camadas | grep de `catch`, `.then`, `console.error` | Débito (se silenciado), Defeito (se engolido e causa comportamento errado) |

### Camada 4 - Segurança

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 4.1 | RLS (Row Level Security) | Toda tabela tem políticas, políticas usam `(select auth.uid())`, sem bypass acidental | Supabase MCP `execute_sql`, query `pg_policies` | Vulnerabilidade |
| 4.2 | Auth guards | Rotas protegidas pelo middleware, API routes validam sessão, rate limiting funcional | Leitura do middleware + API routes | Vulnerabilidade, Defeito |
| 4.3 | `search_path` | Todas as functions PostgreSQL têm `SET search_path = ''` | Supabase MCP `execute_sql` contra `pg_proc` | Vulnerabilidade |
| 4.4 | Exposição de secrets | Service role key fora de `admin.ts`, API keys em frontend, `.env` commitado, tokens em logs | CI security check grep, `git log -p` | Vulnerabilidade |
| 4.5 | Input validation | Zod schemas em todas as RPCs, sanitização de user input (CSV injection, XSS, path traversal) | Leitura dos schemas + parsers | Vulnerabilidade |
| 4.6 | SSRF/CSRF | Fetch externo só para hosts allowlisted, CSRF tokens em mutations, origin validation | Leitura das API routes | Vulnerabilidade |

### Camada 5 - Performance

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 5.1 | Queries N+1 | Loops com query dentro, SELECTs repetidos que poderiam ser batch ou JOIN | Leitura de código, `pg_stat_statements` | Performance |
| 5.2 | Roundtrips desnecessários | Componentes fazendo fetch próprio quando dados já disponíveis no parent ou no cache | Leitura do fluxo de dados dos hooks | Performance, Débito |
| 5.3 | Bundle size | Imports pesados no client sem lazy loading, dependências não tree-shakeable | `next build --analyze`, `webpack-bundle-analyzer` | Performance, Débito |
| 5.4 | Índices do banco | Queries frequentes sem índice, sequential scans em tabelas grandes, índices não usados | `pg_stat_user_tables`, `pg_stat_user_indexes`, `EXPLAIN ANALYZE` | Performance |

### Camada 6 - Funcional (Testes)

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 6.1 | Cobertura de testes | RPCs, hooks, parsers, utils têm testes; edge cases cobertos; cobertura quantitativa | `jest --coverage` | Fragilidade (se não coberto) |
| 6.2 | Testes vs spec | Stories do funcional (AUTH-01 a WKF-04) têm validação automatizada correspondente | Cruzamento stories vs `__tests__/` | Fragilidade |
| 6.3 | Testes de regressão | Bugs corrigidos têm teste que impede recorrência | Leitura dos testes vs histórico de bugs | Fragilidade |

### Camada 7 - UX e Acessibilidade

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 7.1 | Design system | Plum Ledger aplicado sem cores legacy, tipografia DM Sans/JetBrains Mono consistente | grep de hex codes fora da paleta, Tailwind classes | Sujeira, Defeito (se inconsistente) |
| 7.2 | Estados vazios e erros | Todas as páginas tratam loading, empty state, error state com feedback visual | Leitura dos componentes | Defeito |
| 7.3 | Acessibilidade | `aria-label`, contraste WCAG AA, keyboard navigation, focus traps, Dynamic Type | Playwright a11y tests, leitura manual | Defeito, Vulnerabilidade (se legal compliance) |

---

## 3. Pacotes de execução

Nem toda sessão requer as 23 auditorias. Três pacotes pré-definidos por contexto de uso.

### 3.1 Pré-commit (rápido, ~5 min)

Executar antes de cada push. Objetivo: não quebrar nada.

| Auditorias | IDs |
|---|---|
| Integridade de commits | 1.1 |
| Compilação e tipos | 2.1 |
| Lint | 2.2 |
| CI/CD health | 1.3 |

Comando resumido: `git status && npx tsc --noEmit && npx eslint src/ && npm test`

### 3.2 Sprint review (médio, ~30 min)

Executar ao final de cada sprint ou sessão significativa. Objetivo: garantir qualidade incremental.

| Auditorias | IDs |
|---|---|
| Tudo do pré-commit | 1.1, 1.3, 2.1, 2.2 |
| Consistência do HANDOVER | 1.2 |
| Consistência frontend/backend | 3.1 |
| Schema types vs banco real | 3.2 |
| Cache invalidation | 3.4 |
| Error handling | 3.5 |
| Cobertura de testes | 6.1 |

### 3.3 Release gate (completo, ~2h)

Executar antes de deploy para produção. Objetivo: validação exaustiva.

| Auditorias | IDs |
|---|---|
| Todas as 23 | 1.1 a 7.3 |

Ordem recomendada: Segurança (camada 4) primeiro, depois Funcional (6), Arquitetura (3), Performance (5), Código (2), Repositório (1), UX (7).

---

## 4. Matriz cruzada: auditoria x categoria de achado

Cada célula indica a probabilidade de encontrar aquele tipo de achado naquela auditoria.

|  | Defeito | Vulnerabilidade | Performance | Fragilidade | Débito | Sujeira |
|---|---|---|---|---|---|---|
| **1.1 Commits** | - | - | - | - | Baixa | Média |
| **1.2 HANDOVER** | Média | - | - | - | - | Alta |
| **1.3 CI/CD** | - | - | - | Média | Média | - |
| **2.1 Compilação** | Alta | - | - | - | - | - |
| **2.2 Lint** | Baixa | - | - | Média | - | Alta |
| **2.3 Dead code** | - | - | - | - | Baixa | Alta |
| **2.4 Duplicação** | - | - | - | - | Média | Alta |
| **2.5 Fragilidade** | - | - | - | Alta | - | - |
| **2.6 Nomenclatura** | Baixa | - | - | - | - | Alta |
| **3.1 Front/back** | Alta | - | - | Média | - | - |
| **3.2 Schema types** | Alta | - | - | Alta | - | - |
| **3.3 Acoplamento** | - | - | - | Média | Alta | - |
| **3.4 Cache** | Alta | - | Baixa | - | - | - |
| **3.5 Error handling** | Média | - | - | - | Alta | - |
| **4.1 RLS** | - | Alta | - | - | - | - |
| **4.2 Auth guards** | Média | Alta | - | - | - | - |
| **4.3 search_path** | - | Alta | - | - | - | - |
| **4.4 Secrets** | - | Alta | - | - | - | - |
| **4.5 Input validation** | - | Alta | - | Média | - | - |
| **4.6 SSRF/CSRF** | - | Alta | - | - | - | - |
| **5.1 N+1 queries** | - | - | Alta | - | - | - |
| **5.2 Roundtrips** | - | - | Alta | - | Média | - |
| **5.3 Bundle size** | - | - | Alta | - | Média | - |
| **5.4 Índices DB** | - | - | Alta | - | - | - |
| **6.1 Cobertura** | - | - | - | Alta | - | - |
| **6.2 Testes vs spec** | - | - | - | Alta | - | - |
| **6.3 Regressão** | - | - | - | Alta | - | - |
| **7.1 Design system** | Baixa | - | - | - | - | Alta |
| **7.2 Estados vazios** | Média | - | - | - | - | - |
| **7.3 Acessibilidade** | Média | Baixa | - | - | - | - |

---

## 5. Registro de uso

Ao executar uma auditoria, registrar nesta seção:

| Data | Pacote | Auditorias executadas | Achados | Referência |
|---|---|---|---|---|
| 2026-03-18 | Ad hoc (loops/redundância/ineficiência) | 2.4, 3.4, 3.5, 5.1, 5.2, 6.1 | 2 defeitos, 3 performance, 3 fragilidades, 2 débitos, 1 sujeira | AUDITORIA-CODIGO-WEALTHOS.md |
| | | | | |

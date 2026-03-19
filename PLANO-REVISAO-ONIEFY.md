# Plano de Revisão - Oniefy (WealthOS)

**Data:** 19 de março de 2026
**Baseado em:** MATRIZ-VALIDACAO-v2_1.md (37 auditorias, 10 camadas)
**Escopo:** Release Gate completo (todas as 37 auditorias)
**Contexto:** Pré-lançamento web (Vercel) + iOS (TestFlight)

---

## 0. Estado atual do repositório

Snapshot do repo em 2026-03-19 (clone raso):

| Métrica | Valor | Observação |
|---------|-------|------------|
| Arquivos fonte (.ts/.tsx) | 156 | |
| Arquivos de teste | 22 | Concentrados em `src/__tests__/` |
| Diretório E2E | Existe | Subpastas: a11y, auth, security, ux |
| Migrations | 41 arquivos (até 053) | Gaps de numeração esperados |
| Dependências (deps + devDeps) | 45 pacotes | Superfície de ataque pequena |
| `eslint-disable` | 13 ocorrências | Verificar justificativas |
| `@ts-ignore` / `@ts-expect-error` | 0 | Limpo |
| `: any` | 10 ocorrências | Baixo, mas cada um merece revisão |
| TODO / FIXME | 12 | Verificar se são intencionais ou esquecidos |
| `console.error` | 17 | Verificar se há padrão de logging |

**Auditoria anterior:** 2026-03-18 (ad hoc), cobrindo 2.4, 3.4, 3.5, 5.1, 5.2, 6.1. Resultou em 2 defeitos, 3 performance, 3 fragilidades, 2 débitos, 1 sujeira.

---

## 1. Estratégia de execução

### 1.1 Ordem de prioridade

Segue a ordem recomendada pela matriz (seção 3.3), otimizada para risco decrescente:

| Sprint | Camadas | Auditorias | Estimativa | Racional |
|--------|---------|------------|------------|----------|
| S1 | Segurança + Dependências | 4.1-4.6, 8.1-8.4 | 3-4h | Blockers de deploy. Vulnerabilidades e supply chain primeiro |
| S2 | Conformidade + Funcional | 10.1-10.3, 6.1-6.7 | 4-5h | LGPD obrigatória; testes validam a base funcional |
| S3 | Arquitetura + Performance | 3.1-3.5, 5.1-5.4 | 3-4h | Integridade estrutural e gargalos perceptíveis |
| S4 | Infraestrutura + Código | 9.1-9.3, 2.1-2.6 | 2-3h | Config de ambientes e higiene estática |
| S5 | Repositório + UX | 1.1-1.3, 7.1-7.3 | 1-2h | Processo e polimento final |

**Total estimado:** 13-18 horas (3-4 sessões de trabalho)

### 1.2 Critério de bloqueio

Cada achado encontrado segue a regra da taxonomia (seção 1 da matriz):

| Categoria | Ação requerida |
|-----------|---------------|
| Defeito | Corrigir antes de qualquer merge/deploy |
| Vulnerabilidade | Corrigir antes de deploy público |
| Performance | Corrigir se impacta UX (>300ms) ou custo |
| Fragilidade | Corrigir junto com próxima mudança na área |
| Débito técnico | Registrar e priorizar por custo acumulado |
| Sujeira | Limpar oportunisticamente |

---

## 2. Detalhamento por sprint

### Sprint S1 - Segurança e Supply Chain (bloqueante)

**Objetivo:** Garantir que a superfície de ataque está protegida antes de qualquer exposição externa.

#### 4.1 RLS (Row Level Security)

**O que fazer:**
1. Executar query contra `pg_policies` para listar todas as tabelas e suas políticas
2. Cruzar com lista de tabelas do schema: toda tabela de dados de usuário TEM que ter RLS
3. Verificar que todas as políticas usam `(select auth.uid())` e não `auth.uid()` direto (O(1) vs O(n))
4. Testar bypass: chamar RPC como usuário A tentando acessar dados do usuário B

**Ferramentas:** Supabase MCP (`execute_sql`), queries contra `pg_policies`, `pg_class`
**Achados típicos:** Vulnerabilidade
**Achados da auditoria anterior:** N/A (não coberta)

#### 4.2 Auth guards

**O que fazer:**
1. Listar todas as rotas em `src/app/` e classificar: pública, autenticada, admin
2. Verificar que middleware intercepta rotas autenticadas antes do render
3. Verificar API routes (`src/app/api/`): todas validam sessão? Rate limiting presente?
4. Testar: acessar rota protegida sem cookie de sessão

**Ferramentas:** Leitura de `middleware.ts`, grep de API routes
**Achados típicos:** Vulnerabilidade, Defeito

#### 4.3 search_path

**O que fazer:**
1. Query `pg_proc` para listar todas as funções do schema `public`
2. Verificar que TODAS têm `SET search_path = ''` (ou `SET search_path TO ''`)
3. Se alguma não tiver, é vulnerabilidade (search_path hijacking)

**Ferramentas:** Supabase MCP
**Query:**
```sql
SELECT p.proname, p.prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosrc NOT LIKE '%search_path%';
```
**Achados típicos:** Vulnerabilidade

#### 4.4 Exposição de secrets

**O que fazer:**
1. Verificar que `SUPABASE_SERVICE_ROLE_KEY` só aparece em `src/lib/supabase/admin.ts`
2. Verificar CI job de segurança (grep patterns)
3. Checar `git log -p` para secrets commitados historicamente
4. Verificar que `.env.example` não contém valores reais
5. Verificar que nenhuma API key está hardcoded no frontend

**Ferramentas:** grep, CI security job, `git log -p`
**Achados típicos:** Vulnerabilidade

#### 4.5 Input validation

**O que fazer:**
1. Listar todos os schemas Zod em `src/`
2. Cruzar com RPCs: toda RPC que recebe input tem schema Zod?
3. Verificar sanitização: CSV injection (campos começando com `=`, `+`, `-`, `@`), XSS em campos de texto livre, path traversal em uploads
4. Verificar limites de tamanho em campos de texto

**Ferramentas:** grep de `z.object`, leitura dos parsers
**Achados típicos:** Vulnerabilidade

#### 4.6 SSRF/CSRF

**O que fazer:**
1. Listar todos os `fetch()` que acessam URLs externas
2. Verificar allowlist de hosts (BCB, IBGE, etc.)
3. Verificar CSRF tokens em mutations
4. Verificar origin validation em API routes

**Ferramentas:** grep de `fetch(`, leitura de API routes
**Achados típicos:** Vulnerabilidade

#### 8.1 Vulnerabilidades em dependências (SCA)

**O que fazer:**
1. Executar `npm audit`
2. Classificar por severidade CVSS (critical > high > moderate > low)
3. Para cada critical/high: avaliar se é exploitável no contexto do Oniefy

**Ferramentas:** `npm audit`, GitHub Security Advisories
**Achados típicos:** Vulnerabilidade

#### 8.2 Versionamento e obsolescência

**O que fazer:**
1. Executar `npm outdated`
2. Identificar pacotes com major version atrás
3. Verificar se algum pacote está deprecated ou sem manutenção (>1 ano)

**Ferramentas:** `npm outdated`, verificação manual
**Achados típicos:** Fragilidade, Débito

#### 8.3 Licenciamento

**O que fazer:**
1. Executar `npx license-checker --summary`
2. Verificar ausência de GPL/AGPL em dependências (incompatível com proprietário)
3. Sinalizar licenças ausentes ou ambíguas

**Ferramentas:** `license-checker`
**Achados típicos:** Vulnerabilidade (risco legal)

#### 8.4 SBOM (Software Bill of Materials)

**O que fazer:**
1. Gerar SBOM com `npm sbom --sbom-format cyclonedx`
2. Verificar se GitHub dependency graph está ativado
3. Documentar plano para gerar SBOM automaticamente no CI

**Ferramentas:** npm, GitHub
**Achados típicos:** Débito

---

### Sprint S2 - Conformidade e Funcional

**Objetivo:** Garantir adequação legal (LGPD) e que o software faz o que promete.

#### 10.1 Proteção de dados (LGPD)

**O que fazer:**
1. Mapear tabelas que contêm dados pessoais (nome, email, CPF, dados financeiros)
2. Para cada uma: identificar base legal (consentimento, execução contratual, legítimo interesse)
3. Verificar mecanismo de exclusão (direito ao esquecimento) funcional
4. Verificar privacy policy acessível na aplicação
5. Verificar se há coleta de dados sem base legal

**Ferramentas:** Leitura do schema, privacy policy, endpoint de exclusão
**Achados típicos:** Vulnerabilidade (regulatório), Defeito

#### 10.2 Rastreabilidade requisitos-código-teste

**O que fazer:**
1. Listar todas as stories (AUTH-01 a WKF-04) do funcional
2. Para cada story: localizar implementação em `src/` e teste em `__tests__/`
3. Identificar stories sem teste
4. Verificar requirement drift: specs que mudaram mas testes não acompanharam

**Ferramentas:** Cruzamento funcional vs código vs testes
**Achados típicos:** Fragilidade

#### 10.3 Codificação segura (ISO 27001 A.8.28)

**O que fazer:**
1. Verificar princípios aplicados: menor privilégio, defesa em profundidade, fail-secure
2. Verificar agilidade criptográfica: sem chaves hardcoded, algoritmos substituíveis
3. Documentar evidências coletáveis para auditoria externa

**Ferramentas:** Checklist A.8.28 vs codebase
**Achados típicos:** Vulnerabilidade, Débito

#### 6.1 Cobertura de testes unitários

**O que fazer:**
1. Executar `npx jest --coverage`
2. Analisar cobertura por módulo (hooks, parsers, utils, RPCs)
3. Identificar módulos críticos sem cobertura (transaction engine, auth, parsers de importação)
4. Meta: >80% em módulos críticos

**Ferramentas:** Jest
**Estado atual:** 22 arquivos de teste existentes
**Achados típicos:** Fragilidade

#### 6.2 Testes vs spec

**O que fazer:**
1. Cruzar stories do funcional com testes existentes
2. Mapear cobertura: story → arquivo de teste → asserções
3. Listar stories sem nenhuma validação automatizada

**Ferramentas:** Cruzamento manual
**Achados típicos:** Fragilidade

#### 6.3 Testes de regressão

**O que fazer:**
1. Verificar histórico de bugs corrigidos (commits com "fix", "bug", "hotfix")
2. Para cada bug: existe teste que impede recorrência?
3. Listar bugs sem teste de regressão

**Ferramentas:** `git log --grep`, leitura dos testes
**Achados típicos:** Fragilidade

#### 6.4 Testes de integração e E2E

**O que fazer:**
1. Avaliar diretório `e2e/` (a11y, auth, security, ux)
2. Verificar se fluxos críticos estão cobertos: onboarding, criação de transação, reconciliação
3. Verificar se falhas de rede são simuladas (MSW)
4. Executar `npm run test:e2e` e verificar resultados

**Ferramentas:** Playwright
**Achados típicos:** Defeito, Fragilidade

#### 6.5 Testes de carga e resiliência

**O que fazer:**
1. Avaliar se existe configuração de teste de carga (k6, Artillery)
2. Se não: documentar como débito e definir plano mínimo (endpoints críticos, volume esperado)
3. Verificar timeouts configurados e behavior sob falha do Supabase

**Ferramentas:** k6 ou scripts ad hoc
**Achados típicos:** Performance, Fragilidade
**Nota:** Provavelmente não existe ainda; registrar como débito com plano.

#### 6.6 DAST (Testes de segurança dinâmicos)

**O que fazer:**
1. Listar endpoints expostos (API routes, RPCs via Supabase)
2. Testar fuzzing de inputs em endpoints chave
3. Testar bypass de auth em runtime
4. Se viável: executar OWASP ZAP contra ambiente local

**Ferramentas:** OWASP ZAP, nuclei, scripts manuais
**Achados típicos:** Vulnerabilidade
**Nota:** Requer app rodando. Pode ser parcialmente feito com scripts manuais.

#### 6.7 Mutation testing

**O que fazer:**
1. Instalar Stryker (`@stryker-mutator/core`)
2. Executar em módulos selecionados: parsers, transaction engine, auth
3. Avaliar mutation score (alvo: >80%)
4. Mutantes sobreviventes revelam asserções fracas nos testes

**Ferramentas:** Stryker
**Achados típicos:** Fragilidade
**Nota:** Investimento inicial alto (setup + primeira execução lenta). Avaliar se vale fazer agora ou após testes unitários estarem mais maduros.

---

### Sprint S3 - Arquitetura e Performance

**Objetivo:** Integridade estrutural e eliminação de gargalos perceptíveis pelo usuário.

#### 3.1 Consistência frontend/backend

**O que fazer:**
1. Listar todos os hooks `use-*.ts` e as RPCs que chamam
2. Verificar que cada RPC chamada existe no Supabase
3. Verificar que parâmetros passados pelo hook batem com a assinatura da function
4. Verificar ENUMs sincronizados (TypeScript vs PostgreSQL)

**Ferramentas:** Tipos gerados vs hooks vs Supabase MCP
**Achados típicos:** Defeito

#### 3.2 Schema types vs banco real

**O que fazer:**
1. Executar `npx supabase gen types typescript --project-id hmwdfcsxtmbzlslxgqus > /tmp/fresh-types.ts`
2. Diff contra `src/types/database.ts` atual
3. Qualquer divergência é potencial defeito ou fragilidade

**Ferramentas:** Supabase CLI, diff
**Achados típicos:** Defeito, Fragilidade
**Recorrência conhecida:** Tipos com `?: T` vs `null` após regeneração (documentado em learnings)

#### 3.3 Acoplamento e dependências internas

**O que fazer:**
1. Executar `npx madge --circular src/` para detectar imports circulares
2. Analisar se módulos respeitam fronteiras (hooks não importam de outros módulos diretamente)
3. Verificar se há violações de camada (componente UI fazendo query direta)

**Ferramentas:** madge, análise de imports
**Achados típicos:** Débito

#### 3.4 Cache invalidation

**O que fazer:**
1. Listar todas as mutations (hooks com `useMutation`)
2. Para cada mutation: verificar `onSuccess` chama `invalidateQueries` com as queryKeys corretas
3. Cruzar: se mutation altera `transactions`, o hook invalida queryKeys de dashboard, saldos, etc.?

**Ferramentas:** grep de `invalidateQueries`, `useMutation`
**Achados da auditoria anterior:** Coberta parcialmente em 2026-03-18 (2 defeitos encontrados)
**Achados típicos:** Defeito

#### 3.5 Error handling

**O que fazer:**
1. Listar todos os `catch` e `.catch()` no código
2. Classificar: erro tratado, re-lançado, logado, ou silenciado?
3. Verificar se erros críticos (falha de auth, falha de RPC) têm feedback visual
4. Verificar 17 ocorrências de `console.error`: padrão consistente?

**Ferramentas:** grep, leitura de código
**Achados da auditoria anterior:** Coberta parcialmente
**Achados típicos:** Débito, Defeito

#### 5.1 Queries N+1

**O que fazer:**
1. Identificar loops que fazem query dentro (SELECTs em for/map)
2. Verificar RPCs que poderiam usar JOIN ou batch
3. Checar `pg_stat_statements` para queries repetitivas

**Ferramentas:** Leitura de código, `pg_stat_statements`
**Achados da auditoria anterior:** Coberta (achados de performance)
**Achados típicos:** Performance

#### 5.2 Roundtrips desnecessários

**O que fazer:**
1. Mapear componentes que fazem fetch próprio
2. Verificar se dados já estão disponíveis no parent ou no React Query cache
3. Dashboard: confirmar os 9+ parallel HTTP calls diagnosticados (candidato a `get_dashboard_all`)

**Ferramentas:** Leitura de fluxo de dados
**Achados da auditoria anterior:** Coberta (dashboard diagnosticado)
**Achados típicos:** Performance, Débito

#### 5.3 Bundle size

**O que fazer:**
1. Executar `next build` com análise de bundle
2. Identificar imports pesados no client sem lazy loading
3. Verificar tree-shaking de dependências grandes (se houver)

**Ferramentas:** `next build`, `@next/bundle-analyzer`
**Achados típicos:** Performance, Débito

#### 5.4 Índices do banco

**O que fazer:**
1. Query `pg_stat_user_tables` para sequential scans em tabelas grandes
2. Query `pg_stat_user_indexes` para índices não usados
3. `EXPLAIN ANALYZE` nas queries mais frequentes (via `pg_stat_statements`)

**Ferramentas:** Supabase MCP
**Achados típicos:** Performance

---

### Sprint S4 - Infraestrutura e Código Estático

**Objetivo:** Configuração correta de ambientes e limpeza de código.

#### 9.1 Configuração de ambientes

**O que fazer:**
1. Verificar segregação dev/staging/produção
2. Verificar `.env.example` completo com todas as variáveis necessárias
3. Verificar que secrets não são compartilhados entre ambientes
4. Verificar configuração Vercel (quando deploy existir)

**Ferramentas:** Leitura de `.env.example`, Vercel dashboard
**Achados típicos:** Vulnerabilidade, Débito
**Nota:** Vercel deploy ainda não existe (blocker P1). Documentar o que precisa estar configurado.

#### 9.2 Observabilidade e logging

**O que fazer:**
1. Verificar se há logging estruturado em produção (ou plano para)
2. Verificar os 17 `console.error`: são consistentes? Capturam contexto suficiente?
3. Verificar se existe Sentry ou equivalente configurado
4. Verificar se alertas estão configurados (Supabase alerts, Vercel)

**Ferramentas:** grep, configuração de serviços
**Achados típicos:** Débito, Fragilidade

#### 9.3 Resiliência operacional

**O que fazer:**
1. Verificar comportamento quando Supabase fica indisponível
2. Verificar retry com backoff em falhas transitórias
3. Verificar graceful degradation no client
4. Verificar configuração de backup do Supabase (PITR no plano Pro)

**Ferramentas:** Teste manual, Supabase settings
**Achados típicos:** Fragilidade, Defeito

#### 2.1 Compilação e tipos

**O que fazer:**
1. Executar `npx tsc --noEmit`
2. Zero erros = pass. Qualquer erro = defeito.

**Ferramentas:** TypeScript compiler
**Achados típicos:** Defeito

#### 2.2 Lint

**O que fazer:**
1. Executar `npx eslint src/`
2. Classificar warnings vs errors
3. Revisar os 13 `eslint-disable`: cada um está justificado?

**Ferramentas:** ESLint
**Achados típicos:** Fragilidade, Sujeira

#### 2.3 Dead code

**O que fazer:**
1. Executar `npx ts-prune` (se instalado) ou grep manual
2. Identificar exports não usados, imports órfãos
3. Verificar funções/componentes nunca referenciados

**Ferramentas:** ts-prune, grep
**Achados típicos:** Sujeira

#### 2.4 Duplicação

**O que fazer:**
1. Executar `npx jscpd src/` para detectar código duplicado
2. Avaliar patterns repetidos que merecem abstração

**Ferramentas:** jscpd
**Achados da auditoria anterior:** Coberta em 2026-03-18
**Achados típicos:** Débito, Sujeira

#### 2.5 Fragilidade estática

**O que fazer:**
1. Revisar os 13 `eslint-disable` (justificados?)
2. Revisar as 10 ocorrências de `: any` (necessárias?)
3. Revisar os 12 TODO/FIXME (intencionais ou esquecidos?)
4. Verificar catch blocks vazios

**Ferramentas:** grep direcionado
**Achados típicos:** Fragilidade

#### 2.6 Nomenclatura e microcopy

**O que fazer:**
1. Verificar conformidade com MAN-LNG-CMF-001
2. Verificar que não há termos legacy na UI (WealthOS em vez de Oniefy, etc.)
3. Verificar que emojis decorativos foram substituídos por Lucide icons (exceto avatares)

**Ferramentas:** grep
**Achados típicos:** Sujeira

---

### Sprint S5 - Repositório e UX

**Objetivo:** Processo limpo e polimento visual/acessibilidade.

#### 1.1 Integridade de commits

**O que fazer:**
1. `git status`: nada pendente?
2. `git stash list`: stash esquecido?
3. `git branch -a`: branches órfãs?
4. `git log --oneline -20`: commits lógicos e descritivos?

**Ferramentas:** git
**Achados típicos:** Sujeira, Débito

#### 1.2 Consistência do HANDOVER

**O que fazer:**
1. Verificar contagens no HANDOVER vs realidade:
   - Migrations: HANDOVER diz X, repo tem 41 arquivos (até 053)
   - Stories completadas
   - RPCs no banco
   - Arquivos fonte
2. Atualizar o que divergir

**Ferramentas:** HANDOVER vs `find`, `grep`, Supabase MCP
**Nota:** O HANDOVER atual (no projeto) parece desatualizado (data 07/03/2026, stack diz Next.js 14 quando provavelmente já é 15). Ajustar.
**Achados típicos:** Sujeira, Defeito (se gera decisão errada)

#### 1.3 CI/CD health

**O que fazer:**
1. Verificar que CI está verde (3 jobs: Security, Lint, Build)
2. Verificar que cobertura mínima está enforçada (ou documentar que não está)
3. Documentar nível SLSA atual (L1)

**Ferramentas:** GitHub Actions API
**Achados típicos:** Fragilidade, Débito

#### 7.1 Design system

**O que fazer:**
1. Grep por hex codes fora da paleta Plum Ledger
2. Verificar consistência DM Sans / JetBrains Mono
3. Verificar Tailwind classes consistentes

**Ferramentas:** grep
**Achados típicos:** Sujeira

#### 7.2 Estados vazios e erros

**O que fazer:**
1. Listar todas as páginas principais
2. Para cada: verificar que trata loading, empty state, error state
3. Verificar feedback visual consistente

**Ferramentas:** Leitura de componentes
**Achados típicos:** Defeito

#### 7.3 Acessibilidade

**O que fazer:**
1. Verificar `aria-label` nos elementos interativos
2. Verificar contraste WCAG AA
3. Verificar keyboard navigation
4. Verificar focus traps (modais, sidebars)
5. Executar testes de a11y do Playwright (`e2e/a11y/`)

**Ferramentas:** Playwright a11y, leitura manual
**Achados típicos:** Defeito, Vulnerabilidade (compliance)

---

## 3. Ferramentas a instalar/configurar

Algumas ferramentas não estão no projeto atualmente e precisam ser instaladas antes da revisão:

| Ferramenta | Auditoria(s) | Comando de instalação | Prioridade |
|------------|--------------|----------------------|------------|
| license-checker | 8.3 | `npm install -g license-checker` | S1 |
| ts-prune | 2.3 | `npm install -g ts-prune` | S4 |
| jscpd | 2.4 | `npm install -g jscpd` | S4 |
| madge | 3.3 | `npm install -g madge` | S3 |
| @next/bundle-analyzer | 5.3 | `npm install --save-dev @next/bundle-analyzer` | S3 |
| @stryker-mutator/core | 6.7 | `npm install --save-dev @stryker-mutator/core` | S2 (ou diferir) |
| OWASP ZAP | 6.6 | Docker ou download | S2 (parcial) |

---

## 4. Template de registro de achados

Para cada auditoria executada, registrar no formato:

```
### [ID] [Nome da auditoria]
**Data:** YYYY-MM-DD
**Status:** Pass / Achados encontrados / Não aplicável
**Achados:**
1. [Categoria] [Descrição] [Severidade] [Ação]
2. ...
**Notas:** [Contexto adicional]
```

---

## 5. Critérios de conclusão (Definition of Done)

A revisão está completa quando:

1. Todas as 37 auditorias foram executadas e registradas
2. Zero defeitos e zero vulnerabilidades abertas (ou com justificativa de aceite de risco documentada)
3. Todos os achados de performance com impacto >300ms têm plano de correção
4. Fragilidades em módulos críticos (auth, transactions, parsers) foram corrigidas
5. HANDOVER atualizado com contagens reais
6. SBOM gerado e armazenado
7. Mapeamento LGPD produzido (tabela -> dados pessoais -> base legal)
8. Registro de uso na seção 5 da matriz atualizado

---

## 6. Riscos e dependências

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| HANDOVER desatualizado causa retrabalho | Médio | Atualizar no início da S5, ou melhor, no início da revisão toda |
| Mutation testing (6.7) demanda tempo excessivo | Médio | Diferir para após testes unitários atingirem >70% cobertura |
| DAST (6.6) requer app rodando | Alto | Fazer parcial com scripts manuais; OWASP ZAP completo após Vercel deploy |
| Testes de carga (6.5) requerem staging | Alto | Documentar plano; executar quando staging existir |
| Vercel deploy (P1) ainda não existe | Alto | S4/9.1 documenta o que configurar; execução depende do deploy |
| HANDOVER diz Next.js 14, memória diz 15 | Baixo | Verificar `package.json` e corrigir HANDOVER |

---

## 7. Sequência recomendada de sessões

**Sessão 1 (4h):** Sprint S1 completo (Segurança + Dependências)
- Começar por 4.3 (search_path, rápido e objetivo)
- Depois 4.1 (RLS, mais demorado)
- 4.4 e 4.5 em sequência
- 8.1-8.4 no final (npm audit + license-checker + SBOM)

**Sessão 2 (4-5h):** Sprint S2 (Conformidade + Funcional)
- 10.1 (LGPD mapping) primeiro: produz artefato independente
- 6.1 (jest --coverage) para baseline quantitativo
- 6.2 e 6.3 em sequência (rastreabilidade)
- 10.2 e 10.3 para fechar conformidade
- 6.4, 6.5, 6.6, 6.7 conforme tempo (6.5-6.7 podem ser diferidos)

**Sessão 3 (3-4h):** Sprint S3 (Arquitetura + Performance)
- 3.2 (schema types) primeiro: `gen types` + diff
- 3.1 (frontend/backend) em sequência
- 5.4 (índices) via Supabase MCP
- 3.4, 3.5, 5.1, 5.2 com foco nos achados da auditoria anterior
- 5.3 (bundle) no final

**Sessão 4 (3h):** Sprints S4 + S5 (Infra + Código + Repo + UX)
- 2.1 + 2.2 (tsc + eslint) como warmup
- 2.5 (fragilidade estática) em sequência
- 1.2 (HANDOVER) com atualização imediata
- 7.2 e 7.3 para fechar
- Limpezas oportunísticas de sujeira ao longo da sessão

**Final:** Consolidar registro de achados, atualizar seção 5 da matriz, atualizar HANDOVER.

# Oniefy - Matriz de Validação

**Versão:** 2.2
**Data:** 05 de abril de 2026
**Projeto:** Oniefy (WealthOS)

**Changelog:**
- **v2.2** (2026-04-05): Reestruturação e ampliação. Nova Camada 11 (Integridade de Dados: 11.1-11.5). Camada 7 expandida (7.4-7.7: cross-browser, teclado, formulários, breakpoints). Camada 6 expandida (6.8-6.9: visual regression, flaky tests). Camada 9 expandida (9.4-9.5: disaster recovery, feature flags). Items 3.4, 4.2, 7.2, 9.2 com escopo ampliado. Anexo C: mapeamento bidirecional Playwright Audit Kit ↔ auditorias. Pacote 3.5 (UX Audit) adicionado. Total: 48 auditorias em 11 camadas.
- **v2.1** (2026-03-19): Incorpora análise externa (Gemini, 2026-03-18). Adicionados: 6.7 (mutation testing), 8.4 (SBOM), 10.3 (ISO 27001 readiness). Item 1.3 expandido com nível SLSA. Item 10.2 expandido com risco de requirement drift. Anexo B: roadmap de certificação. Total: 37 auditorias em 10 camadas.
- **v2.0** (2026-03-18): Incorpora análise externa (Perplexity). Adicionadas camadas 8, 9, 10. Camada 6 expandida. Pacote security-focused. Anexo A (ISO 25010, OWASP ASVS).
- **v1.0** (2026-03-18): Versão inicial. 23 auditorias em 7 camadas.

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

Vetor de ataque explorável. O fluxo feliz funciona normalmente, mas um atacante pode explorar o comportamento para causar dano (acesso indevido, exfiltração de dados, negação de serviço). Inclui riscos legais (licenciamento, LGPD).

Exemplo: função PostgreSQL sem `SET search_path` permite search_path hijacking; regex sem proteção contra ReDoS; SSRF por fetch a host não-allowlisted; dependência npm com CVE conhecida; licença GPL em projeto proprietário.

Prioridade: corrigir antes de qualquer deploy público.

### 1.3 Problema de performance

O código funciona corretamente mas consome recursos (tempo, rede, CPU, memória) além do aceitável para a experiência do usuário ou para os limites da infraestrutura.

Exemplo: N+1 queries no endpoint de push notifications; 6 fetches sequenciais ao BCB quando poderiam ser paralelos; componente fazendo roundtrip HTTP próprio quando dados já estão disponíveis no parent.

Prioridade: corrigir quando impacta UX perceptivelmente (>300ms) ou custo de infra.

### 1.4 Fragilidade

O código funciona hoje mas quebra facilmente com mudança futura, refatoração, ou condição de borda não testada. Indica acoplamento frágil ou dependência de comportamento acidental.

Exemplo: `useEffect` com `eslint-disable` que depende de ordem de execução; regex com flag `g` desnecessário que funciona por acidente do early return; `onSuccess` síncrono que funciona porque o React Query não garante ordem; dependência npm 3 major versions atrás.

Prioridade: corrigir junto com a próxima mudança na área afetada.

### 1.5 Débito técnico

Decisão de implementação subótima (consciente ou inconsciente) onde o código funciona corretamente mas cria custo de manutenção, extensão ou diagnóstico no futuro.

Exemplo: rate limiter in-memory (funciona em single instance, não escala para multi-região); fire-and-forget sem logging (funciona, mas sabota diagnóstico); `useBudgetMonths` fazendo over-fetch de 500 rows para extrair 12 (funciona, mas desperdiça rede); ausência de logging centralizado em produção.

Prioridade: pagar quando o custo acumulado justifica o investimento, ou quando tocar na área afetada.

### 1.6 Sujeira (code smell)

Degradação de qualidade sem impacto funcional, de segurança, de performance, nem custo futuro significativo. Afeta apenas legibilidade e estética do código.

Exemplo: import duplicado (`createClient` e `createAdminClient` em linhas separadas do mesmo módulo); variável declarada mas não usada; comentário desatualizado; TODO esquecido.

Prioridade: limpar oportunisticamente. Nunca justifica commit dedicado.

---

## 2. Tipos de auditoria

Organizados por camada do sistema. Cada tipo verifica uma preocupação específica e pode produzir achados de qualquer categoria da taxonomia acima. 48 auditorias em 11 camadas.

### Camada 1 - Repositório e Processo

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 1.1 | Integridade de commits | Commits pendentes, divergência local/remote, stash esquecido, branches órfãs | `git status`, `git log`, `git stash list`, `git branch -a` | Sujeira, Débito |
| 1.2 | Consistência do HANDOVER | Contagens (migrations, stories, RPCs, arquivos) batem com a realidade do código | HANDOVER vs `find`, `grep`, Supabase MCP | Defeito (se gera decisão errada), Sujeira |
| 1.3 | CI/CD health e integridade de build | Pipeline verde, jobs configurados, cobertura mínima enforçada. Nível SLSA do processo de build documentado (atual: L1 - build scriptado via GitHub Actions; alvo: L2 - procedência assinada) | GitHub Actions API, `curl` | Fragilidade, Débito |

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
| 3.3 | Acoplamento e dependências internas | Imports circulares, módulos que sabem demais sobre outros, violações de camada | `madge`, análise de imports | Débito |
| 3.4 | Cache invalidation e consistência de estado | Toda mutation invalida as queryKeys que dependem dos dados alterados. Optimistic updates fazem rollback correto em caso de erro server-side. Múltiplos tabs abertos não exibem dados contraditórios após mutation em um deles. Stale data detectável pelo usuário (timestamp de última atualização) | grep de `invalidateQueries` cruzado com fluxo de dados; teste manual com 2 tabs | Defeito |
| 3.5 | Error handling | Erros propagados, tratados ou silenciados; observabilidade preservada em todas as camadas | grep de `catch`, `.then`, `console.error` | Débito (se silenciado), Defeito (se engolido e causa comportamento errado) |

### Camada 4 - Segurança

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 4.1 | RLS (Row Level Security) | Toda tabela tem políticas, políticas usam `(select auth.uid())`, sem bypass acidental | Supabase MCP `execute_sql`, query `pg_policies` | Vulnerabilidade |
| 4.2 | Auth guards e gestão de sessão | Rotas protegidas pelo middleware; API routes validam sessão; rate limiting funcional. Cookie flags corretos (HttpOnly, SameSite=Lax, Secure). Token refresh sem race condition (dois tabs renovando simultaneamente não invalidam um ao outro). Session fixation impossível (novo session ID após login). Logout invalida sessão server-side, não apenas remove cookie local | Leitura do middleware + API routes; inspeção de cookies via DevTools; teste manual de race condition com 2 tabs | Vulnerabilidade, Defeito |
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
| 6.1 | Cobertura de testes unitários | RPCs, hooks, parsers, utils têm testes; edge cases cobertos; cobertura quantitativa | `jest --coverage` | Fragilidade |
| 6.2 | Testes vs spec | Stories do funcional (AUTH-01 a WKF-04) têm validação automatizada correspondente | Cruzamento stories vs `__tests__/` | Fragilidade |
| 6.3 | Testes de regressão | Bugs corrigidos têm teste que impede recorrência | Leitura dos testes vs histórico de bugs | Fragilidade |
| 6.4 | Testes de integração e E2E | Fluxos multi-página (onboarding, transação completa, reconciliação) validados end-to-end; falhas de rede simuladas | Playwright (`e2e/`), MSW para mocks de rede | Defeito, Fragilidade |
| 6.5 | Testes de carga e resiliência | Comportamento sob picos de uso, degradação graciosa, timeouts respeitados, recovery após falha de Supabase | k6, Artillery, ou scripts ad hoc contra staging | Performance, Fragilidade |
| 6.6 | Testes de segurança dinâmicos (DAST) | Fuzzing de inputs, scan de endpoints expostos, tentativas de bypass de auth em runtime | OWASP ZAP, nuclei, scripts manuais de pen test | Vulnerabilidade |
| 6.7 | Eficácia de testes (mutation testing) | Mutation score dos módulos críticos (parsers, transaction engine, auth). Line coverage não garante que testes detectam erros; mutantes não-mortos revelam asserções fracas | Stryker (`@stryker-mutator/core`) em módulos selecionados. Alvo: mutation score >80% em módulos críticos | Fragilidade |
| 6.8 | Visual regression | Screenshots comparados entre deploys para detectar mudanças visuais acidentais. Útil em refatorações de CSS/Tailwind e atualização de dependências de UI. Baseline armazenado no repositório | Playwright `toHaveScreenshot()`, Percy, Chromatic | Defeito, Fragilidade |
| 6.9 | Flaky test detection | Testes que passam/falham sem mudança de código. Causas comuns: dependência de timing (`setTimeout`, animações), estado compartilhado entre testes, dependência de rede real, `new Date()` sem mock. Flaky tests corroem confiança no CI e treinam o time a ignorar falhas | Re-run da suite 3x sem mudança; análise de histórico de CI; grep de `setTimeout` e `Date.now()` em testes | Fragilidade |

### Camada 7 - UX e Acessibilidade

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 7.1 | Design system | Plum Ledger aplicado sem cores legacy, tipografia DM Sans/JetBrains Mono consistente | grep de hex codes fora da paleta, Tailwind classes | Sujeira, Defeito (se inconsistente) |
| 7.2 | Estados vazios, zero e first-run | Três estados distintos verificados: (a) empty state - usuário novo, sem dados, com orientação de como começar; (b) zero state - dados existem mas resultado é zero (ex: saldo zerado), sem confundir com ausência de dados; (c) first-run / onboarding - guia o usuário nos primeiros passos com progressive disclosure. Nenhuma página exibe lista vazia sem contexto, tabela sem rows sem explicação, ou gráfico zerado sem indicação | Leitura dos componentes; Playwright com usuário novo vs. usuário com dados | Defeito |
| 7.3 | Acessibilidade | `aria-label`, contraste WCAG AA, Dynamic Type, leitores de tela (estrutura semântica, landmarks, alt text) | Playwright a11y tests (axe-core), leitura manual | Defeito, Vulnerabilidade (se legal compliance) |
| 7.4 | Cross-browser | Renderização consistente em Chrome, Safari e Firefox. Atenção especial a Safari: flexbox gaps, date inputs nativos, scroll behavior smooth, backdrop-filter, position:sticky em overflow containers. Verificar em versões mobile de Safari (iOS) e Chrome (Android) | BrowserStack, Playwright multi-browser (`--project=webkit`), teste manual em dispositivo real | Defeito, Fragilidade |
| 7.5 | Navegação por teclado | Tab order segue a ordem visual e lógica da página. Todos os elementos interativos alcançáveis via Tab. Focus ring visível (`:focus-visible`) em todos os interativos. Focus traps implementados em modais e dropdowns (Tab não escapa, Esc fecha). Skip-to-content link presente como primeiro elemento focável. Nenhum keyboard trap (elemento que captura foco sem saída) | Teste manual com Tab/Shift+Tab/Enter/Esc; Playwright keyboard navigation; axe-core `keyboard` rules | Defeito |
| 7.6 | UX de formulários | Labels visíveis associados ao campo (não apenas placeholder). Mensagens de erro inline junto ao campo (não apenas toast genérico no topo). Validação indica o que está errado e como corrigir (não apenas "campo inválido"). Campos obrigatórios marcados visualmente. Tab order dos campos segue ordem visual. Formulário preserva dados digitados em caso de erro de rede ou validação server-side. Botão de submit desabilitado durante request (anti double-click) | Playwright form interaction; teste manual de fluxos de erro | Defeito, Fragilidade |
| 7.7 | Responsividade multi-breakpoint | Verificação em 4 breakpoints: mobile (390px), tablet portrait (768px), tablet landscape (1024px), desktop (1280px+). Nenhuma página com overflow horizontal. Tabelas com muitas colunas usam scroll horizontal ou layout alternativo em mobile. Sidebar collapsa adequadamente. Tipografia legível em todas as faixas | Playwright com viewports parametrizados; DevTools responsive mode | Defeito |

### Camada 8 - Dependências e Supply Chain

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 8.1 | Vulnerabilidades em dependências (SCA) | CVEs conhecidas em pacotes npm diretos e transitivos; severidade CVSS | `npm audit`, Dependabot/Snyk, GitHub Security Advisories | Vulnerabilidade |
| 8.2 | Versionamento e obsolescência | Pacotes desatualizados (major versions atrás), pacotes sem manutenção (>1 ano sem commit), pacotes deprecated | `npm outdated`, verificação manual de repos upstream | Fragilidade, Débito |
| 8.3 | Licenciamento | Licenças incompatíveis com uso comercial (GPL em projeto proprietário), licenças ausentes, licenças ambíguas | `license-checker`, `npx license-checker --summary` | Vulnerabilidade (risco legal) |
| 8.4 | SBOM (Software Bill of Materials) | Inventário completo e versionado de todas as dependências diretas e transitivas; gerado automaticamente a cada release; armazenado como artefato do build | `npm sbom --sbom-format cyclonedx`, GitHub dependency graph | Débito (se ausente), Vulnerabilidade (se inventário incompleto impede resposta a CVEs) |

### Camada 9 - Infraestrutura e Runtime

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 9.1 | Configuração de ambientes | Segregação dev/staging/produção; variáveis de ambiente corretas por ambiente; secrets não compartilhados entre ambientes | Vercel dashboard, `.env` files, Supabase project settings | Vulnerabilidade, Débito |
| 9.2 | Observabilidade, logging e alerting | Logs estruturados em produção; erros capturados (não silenciados); métricas de saúde acessíveis. Alertas configurados para: erros 5xx acima de threshold, latência P95 degradada, falha de cron job, tentativas de login falhadas em massa. Sem alertas, logs são post-mortem; com alertas, são prevenção | Vercel logs, Supabase logs, grep de `console.error`, Sentry/equivalente, Vercel/Supabase alerting config | Débito, Fragilidade |
| 9.3 | Resiliência operacional | Comportamento quando Supabase fica indisponível; retry com backoff em falhas transitórias; graceful degradation no client | Teste manual de indisponibilidade, verificação de retry logic no código | Fragilidade, Defeito |
| 9.4 | Disaster recovery | Procedimento de restore documentado, testado pelo menos uma vez, e acessível a qualquer membro do time. Backup automático ativo e verificável (não apenas "habilitado", mas restore confirmado). RPO (Recovery Point Objective) e RTO (Recovery Time Objective) definidos e compatíveis com a criticidade dos dados. Rollback de migration testado (migration N reverte sem perda de dados). Plano de contingência documentado para indisponibilidade prolongada de Supabase ou Vercel | Supabase backup settings, teste de restore em projeto separado, documentação de runbook | Fragilidade, Débito |
| 9.5 | Feature flag hygiene | Flags temporárias removidas após rollout completo. Flags sem condição de cleanup (quem remove, quando) documentadas. Nenhuma flag morta no código (referenciada mas nunca avaliada, ou sempre avaliada como true/false). Flags que controlam lógica financeira têm logging de qual variante foi servida | grep de flags no código, revisão de config de feature flags | Sujeira, Fragilidade |

### Camada 10 - Conformidade e Governança

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 10.1 | Proteção de dados (LGPD) | Dados pessoais identificados e mapeados; base legal para cada tratamento; mecanismo de exclusão funcional (direito ao esquecimento); política de privacidade acessível e atualizada; consentimento quando aplicável | Leitura do schema + privacy policy + endpoint de exclusão | Vulnerabilidade (risco regulatório), Defeito |
| 10.2 | Rastreabilidade requisitos-código-teste | Cada story (AUTH-01 a WKF-04) tem implementação identificável e teste correspondente; mudanças de spec refletidas no código. Inclui verificação de requirement drift: specs que evoluíram mas cuja matriz ou testes não acompanharam, gerando validação de funcionalidade obsoleta ou lacuna em lógica nova | Cruzamento funcional → `src/` → `__tests__/`, diff de specs vs último baseline | Fragilidade, Sujeira |
| 10.3 | Codificação segura (ISO 27001 A.8.28) | Princípios de codificação segura documentados e aplicados: menor privilégio, defesa em profundidade, agilidade criptográfica (sem chaves hardcoded, algoritmos substituíveis), fail-secure defaults. Evidências coletáveis para auditoria externa | Checklist ISO 27001 A.8.28 vs práticas do codebase; leitura de auth, crypto, RLS | Vulnerabilidade, Débito |

### Camada 11 - Integridade de Dados

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 11.1 | Precisão numérica | Valores financeiros armazenados e calculados sem floating point drift. Arredondamento consistente (definir e aplicar: banker's rounding, truncamento, ou round half-up). Soma das parcelas/parciais sempre igual ao total exibido (sem centavo perdido). Operações em centavos usam inteiros ou `numeric`/`decimal`, nunca `float`/`double precision`. Formatação de moeda (R$ 1.234,56) consistente em toda a UI | Jest com edge cases de centavos (ex: dividir R$10,00 em 3); grep de `float`/`double precision` no schema; Playwright verificando totais | Defeito |
| 11.2 | Timezone e datas | Datas financeiras usam timezone do usuário de forma consistente: transações no dia correto independente do fuso, virada de mês sem off-by-one, relatórios mensais incluem dias 1 a 28/29/30/31 sem cortar. `new Date()` no server usa UTC; conversão para timezone local acontece apenas na UI. Cron jobs que processam dados diários respeitam o timezone configurado. Comparações de datas usam `startOfDay`/`endOfDay` com timezone explícito | Jest com mocks de timezone (São Paulo, Fernando de Noronha, Acre); Supabase MCP verificando tipos de coluna (`timestamptz` vs `timestamp`) | Defeito |
| 11.3 | Concorrência e idempotência | Double-submit prevenido em todos os formulários (botão desabilitado durante request, ou mutation idempotente server-side). Duas tabs abertas editando o mesmo recurso não corrompem dados (última escrita vence com detecção de conflito, ou lock otimista via versão/updated_at). Mutations idempotentes: reprocessar a mesma requisição não duplica o efeito. Debounce em operações de auto-save | Teste manual com 2 tabs; grep de `disabled` em botões de submit; verificação de `updated_at` checks em RPCs de update | Defeito, Fragilidade |
| 11.4 | Audit trail | Toda mutation em dados financeiros (criar/editar/excluir transação, alterar saldo manual, reconciliar, alterar meta) tem registro rastreável com: quem (user_id), quando (timestamp), o quê (tabela + ID do registro), qual mudança (valor anterior → valor novo). Registros de audit são imutáveis (INSERT only, sem UPDATE/DELETE). Retenção mínima definida e documentada. Acessível para o próprio usuário consultar histórico de alterações | Verificação de triggers de audit no schema; query de `audit_log` ou equivalente; RLS que permite leitura apenas pelo dono | Vulnerabilidade (regulatória), Débito |
| 11.5 | Backup, restore e integridade referencial | Backup automático verificável (não apenas "habilitado"). Restore testado pelo menos uma vez em ambiente separado, com verificação de que dados restaurados são íntegros (contagens batem, foreign keys válidas, sem registros órfãos). RPO e RTO definidos. Dados sobrevivem a recriação do projeto Supabase. Export de dados do usuário funcional (LGPD: portabilidade) | Supabase backup settings, teste de restore, query de integridade referencial (`pg_constraint` violations), endpoint de export | Fragilidade, Vulnerabilidade |

---

## 3. Pacotes de execução

Nem toda sessão requer as 48 auditorias. Cinco pacotes pré-definidos por contexto de uso.

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
| Cobertura de testes unitários | 6.1 |
| Vulnerabilidades em dependências | 8.1 |
| Precisão numérica (spot check) | 11.1 |

### 3.3 Release gate (completo, ~2-3h)

Executar antes de deploy para produção. Objetivo: validação exaustiva.

| Auditorias | IDs |
|---|---|
| Todas as 48 | 1.1 a 11.5 |

Ordem recomendada: Segurança (4) → Integridade de dados (11) → Dependências (8) → Conformidade (10) → Funcional (6) → Arquitetura (3) → Performance (5) → Infraestrutura (9) → Código (2) → Repositório (1) → UX (7).

### 3.4 Security-focused (direcionado, ~1h)

Executar antes de expor o sistema a usuários externos ou após mudança em auth/RLS/APIs. Objetivo: superfície de ataque verificada.

| Auditorias | IDs |
|---|---|
| Segurança completa | 4.1 a 4.6 |
| Dependências (SCA) | 8.1 |
| Licenciamento | 8.3 |
| SBOM | 8.4 |
| DAST | 6.6 |
| Configuração de ambientes | 9.1 |
| Codificação segura (ISO 27001) | 10.3 |
| LGPD | 10.1 |
| Audit trail | 11.4 |

### 3.5 UX audit (direcionado, ~45 min)

Executar antes de lançamento público, após redesign, ou após mudança significativa em UI/CSS. Objetivo: experiência do usuário validada em todas as superfícies.

| Auditorias | IDs |
|---|---|
| Design system | 7.1 |
| Estados vazios e first-run | 7.2 |
| Acessibilidade | 7.3 |
| Cross-browser | 7.4 |
| Navegação por teclado | 7.5 |
| UX de formulários | 7.6 |
| Responsividade multi-breakpoint | 7.7 |
| Core Web Vitals | 5.1, 5.2 (parcial) |
| Visual regression | 6.8 |

Comando resumido: `npx playwright test e2e/audit/ && npx playwright test --project=webkit e2e/audit/accessibility.spec.ts`

---

## 4. Matriz cruzada: auditoria x categoria de achado

Cada célula indica a probabilidade de encontrar aquele tipo de achado naquela auditoria.

|  | Defeito | Vulnerab. | Performance | Fragilidade | Débito | Sujeira |
|---|---|---|---|---|---|---|
| **1.1 Commits** | - | - | - | - | Baixa | Média |
| **1.2 HANDOVER** | Média | - | - | - | - | Alta |
| **1.3 CI/CD + SLSA** | - | - | - | Média | Média | - |
| **2.1 Compilação** | Alta | - | - | - | - | - |
| **2.2 Lint** | Baixa | - | - | Média | - | Alta |
| **2.3 Dead code** | - | - | - | - | Baixa | Alta |
| **2.4 Duplicação** | - | - | - | - | Média | Alta |
| **2.5 Fragilidade** | - | - | - | Alta | - | - |
| **2.6 Nomenclatura** | Baixa | - | - | - | - | Alta |
| **3.1 Front/back** | Alta | - | - | Média | - | - |
| **3.2 Schema types** | Alta | - | - | Alta | - | - |
| **3.3 Acoplamento** | - | - | - | Média | Alta | - |
| **3.4 Cache + estado** | Alta | - | Baixa | Média | - | - |
| **3.5 Error handling** | Média | - | - | - | Alta | - |
| **4.1 RLS** | - | Alta | - | - | - | - |
| **4.2 Auth + sessão** | Média | Alta | - | Média | - | - |
| **4.3 search_path** | - | Alta | - | - | - | - |
| **4.4 Secrets** | - | Alta | - | - | - | - |
| **4.5 Input validation** | - | Alta | - | Média | - | - |
| **4.6 SSRF/CSRF** | - | Alta | - | - | - | - |
| **5.1 N+1 queries** | - | - | Alta | - | - | - |
| **5.2 Roundtrips** | - | - | Alta | - | Média | - |
| **5.3 Bundle size** | - | - | Alta | - | Média | - |
| **5.4 Índices DB** | - | - | Alta | - | - | - |
| **6.1 Cobertura unit** | - | - | - | Alta | - | - |
| **6.2 Testes vs spec** | - | - | - | Alta | - | - |
| **6.3 Regressão** | - | - | - | Alta | - | - |
| **6.4 E2E/integração** | Alta | - | - | Média | - | - |
| **6.5 Carga/resiliência** | - | - | Alta | Média | - | - |
| **6.6 DAST** | - | Alta | - | - | - | - |
| **6.7 Mutation testing** | - | - | - | Alta | - | - |
| **6.8 Visual regression** | Média | - | - | Média | - | - |
| **6.9 Flaky tests** | - | - | - | Alta | - | Média |
| **7.1 Design system** | Baixa | - | - | - | - | Alta |
| **7.2 Estados** | Média | - | - | - | - | - |
| **7.3 Acessibilidade** | Média | Baixa | - | - | - | - |
| **7.4 Cross-browser** | Média | - | - | Média | - | - |
| **7.5 Teclado** | Média | - | - | - | - | - |
| **7.6 UX formulários** | Média | - | - | Média | - | - |
| **7.7 Responsividade** | Média | - | - | - | - | - |
| **8.1 SCA (CVEs)** | - | Alta | - | - | - | - |
| **8.2 Obsolescência** | - | - | - | Média | Alta | - |
| **8.3 Licenciamento** | - | Alta | - | - | - | - |
| **8.4 SBOM** | - | Média | - | - | Alta | - |
| **9.1 Config ambientes** | - | Alta | - | - | Média | - |
| **9.2 Observab. + alerting** | - | - | - | Média | Alta | - |
| **9.3 Resiliência op.** | Média | - | Média | Alta | - | - |
| **9.4 Disaster recovery** | - | - | - | Alta | Média | - |
| **9.5 Feature flags** | - | - | - | Média | - | Média |
| **10.1 LGPD** | Média | Alta | - | - | - | - |
| **10.2 Rastreabilidade** | - | - | - | Média | - | Média |
| **10.3 ISO 27001 A.8.28** | - | Alta | - | - | Média | - |
| **11.1 Precisão numérica** | Alta | - | - | - | - | - |
| **11.2 Timezone/datas** | Alta | - | - | Média | - | - |
| **11.3 Concorrência** | Alta | - | - | Média | - | - |
| **11.4 Audit trail** | - | Média | - | - | Alta | - |
| **11.5 Backup/restore** | - | Média | - | Alta | Média | - |

---

## 5. Registro de uso

Ao executar uma auditoria, registrar nesta seção:

| Data | Pacote | Auditorias executadas | Achados | Referência |
|---|---|---|---|---|
| 2026-03-18 | Ad hoc (loops/redundância/ineficiência) | 2.4, 3.4, 3.5, 5.1, 5.2, 6.1 | 2 defeitos, 3 performance, 3 fragilidades, 2 débitos, 1 sujeira | AUDITORIA-CODIGO-WEALTHOS.md |
| 2026-04-05 | UX audit (Playwright e2e/audit/) | 7.3, 7.5, 7.6, 7.7, 6.4, 5.1 (parcial) | 6 defeitos app, 2 defeitos spec | Sessão 43 - Playwright HTML report |
| | | | | |

---

## Anexo A - Mapeamento para modelos de referência

Para fins de due diligence externa ou auditoria por terceiros, este anexo mapeia as auditorias e categorias da matriz para modelos consolidados.

### A.1 ISO/IEC 25010

A ISO/IEC 25010 define 8 características de qualidade de produto. A tabela abaixo indica quais auditorias da matriz cobrem cada uma.

| Característica ISO 25010 | Subcaracterísticas relevantes | Auditorias que cobrem |
|---|---|---|
| Adequação funcional | Completude, correção, pertinência | 2.1, 3.1, 3.4, 6.1, 6.2, 6.4, 6.7, 11.1, 11.2 |
| Eficiência de desempenho | Tempo de resposta, uso de recursos, capacidade | 5.1, 5.2, 5.3, 5.4, 6.5 |
| Compatibilidade | Coexistência, interoperabilidade | 3.1, 3.2, 7.4, 7.7 |
| Usabilidade | Reconhecibilidade, aprendizagem, operabilidade, proteção contra erro, estética, acessibilidade | 2.6, 7.1, 7.2, 7.3, 7.5, 7.6, 7.7 |
| Confiabilidade | Maturidade, disponibilidade, tolerância a falhas, recuperabilidade | 3.5, 6.3, 6.4, 6.5, 9.3, 9.4, 11.3, 11.5 |
| Segurança | Confidencialidade, integridade, não-repúdio, responsabilização, autenticidade | 4.1 a 4.6, 6.6, 8.1, 8.3, 8.4, 9.1, 10.1, 10.3, 11.4 |
| Manutenibilidade | Modularidade, reusabilidade, analisabilidade, modificabilidade, testabilidade | 2.2 a 2.5, 3.3, 6.1, 6.2, 6.7, 6.8, 6.9, 9.5, 10.2 |
| Portabilidade | Adaptabilidade, instalabilidade, substituibilidade | 1.3, 7.4, 9.1 (parcial) |

Lacunas reconhecidas: compatibilidade multi-cloud e portabilidade de dados entre providers não são cobertas em profundidade.

### A.2 OWASP ASVS v4.0

O ASVS define 14 capítulos de verificação de segurança. A tabela abaixo indica a cobertura da matriz.

| Capítulo ASVS | Descrição | Auditorias que cobrem | Cobertura |
|---|---|---|---|
| V1 | Arquitetura, design, modelagem de ameaças | 3.1, 3.3, 3.5, 10.3 | Parcial |
| V2 | Autenticação | 4.2, 10.3 | Boa |
| V3 | Gerenciamento de sessão | 4.2 (cookie flags, session fixation, token refresh) | Boa (expandido em v2.2) |
| V4 | Controle de acesso | 4.1 (RLS), 4.2 | Boa |
| V5 | Validação, sanitização, codificação | 4.5 | Boa |
| V6 | Criptografia | 4.4 (secrets), 10.3 (agilidade criptográfica) | Parcial → Boa |
| V7 | Tratamento de erros e logging | 3.5, 9.2 | Boa |
| V8 | Proteção de dados | 10.1 (LGPD), 4.4, 11.4 (audit trail) | Boa (expandido em v2.2) |
| V9 | Comunicação | 4.6 (SSRF), 9.1 (TLS config) | Parcial |
| V10 | Código malicioso | 8.1 (SCA), 8.4 (SBOM) | Parcial → Boa |
| V11 | Lógica de negócio | 3.4, 6.2, 6.4, 6.7, 11.1, 11.3 | Boa (expandido em v2.2) |
| V12 | Arquivos e recursos | 4.5 (path traversal, upload) | Parcial |
| V13 | API e web services | 4.2, 4.5, 4.6 | Boa |
| V14 | Configuração | 9.1, 4.4, 1.3 (SLSA) | Parcial → Boa |

Cobertura geral estimada: nível L1 (oportunista) do ASVS para a maioria dos capítulos; nível L2 (padrão) para V2, V3, V4, V5, V7, V8, V11, V13. A adição de 11.4 (audit trail) e expansão de 4.2 (sessão) melhoram cobertura de V3 e V8 para nível L2.

### A.3 IEEE 1012 (Verificação e Validação)

O Oniefy opera no nível de integridade 2 da IEEE 1012 (software comercial com impacto financeiro moderado, sem risco a vida). A tabela abaixo mapeia as fases do ciclo de vida IEEE 1012 para auditorias aplicáveis.

| Fase IEEE 1012 | Tarefa de V&V | Auditorias da matriz |
|---|---|---|
| Conceito | Análise de risco e hazard | 10.1 (LGPD), 10.3 (codificação segura) |
| Requisitos | Avaliação de rastreabilidade | 10.2, 6.2 |
| Design | Análise de fluxo de controle e interfaces | 3.1, 3.3, 3.4 |
| Implementação | Auditoria de código e conformidade | Camadas 2 e 4 inteiras |
| Teste | Teste de sistema e aceitação | 6.1 a 6.9 |
| Operação | Métricas reais e monitoramento | 9.2, 9.3, 9.4, 5.4 |

### A.4 Categorias de achado vs. modelos

| Categoria da matriz | Correspondência ISO 25010 | Correspondência ASVS | IEEE 1012 |
|---|---|---|---|
| Defeito | Adequação funcional (correção) | V11 (lógica de negócio) | Anomalia de implementação |
| Vulnerabilidade | Segurança (todas subcaracterísticas) | V1 a V14 (depende do vetor) | Hazard de segurança |
| Performance | Eficiência de desempenho | Fora de escopo ASVS | Anomalia de desempenho |
| Fragilidade | Confiabilidade (maturidade), Manutenibilidade (testabilidade) | V1 (design robusto) | Risco de manutenção |
| Débito técnico | Manutenibilidade (modificabilidade, analisabilidade) | Fora de escopo ASVS | Risco de manutenção |
| Sujeira | Manutenibilidade (analisabilidade) | Fora de escopo ASVS | Fora de escopo |

---

## Anexo B - Roadmap de certificação

O Oniefy é um SaaS financeiro que lida com dados patrimoniais sensíveis. Mesmo antes de buscar certificação formal, construir com mentalidade de compliance desde o início reduz custo de adequação futura e aumenta confiança de usuários e parceiros.

### B.1 Posicionamento atual

| Norma/Framework | Relevância para Oniefy | Estado atual | Próximo passo |
|---|---|---|---|
| LGPD (Lei 13.709/2018) | Obrigatória. Dados pessoais e financeiros de residentes BR | Parcial: privacy policy existe, RLS implementado, endpoint de exclusão funcional. Falta: mapeamento formal de dados pessoais, registro de operações de tratamento, relatório de impacto (RIPD) | Produzir mapeamento de dados pessoais por tabela (auditoria 10.1) |
| ISO 27001 (SGSI) | Altamente recomendada para SaaS financeiro. Diferencial competitivo e requisito de parceiros enterprise | Parcial: muitos controles do Anexo A já implementados organicamente (A.8.28 codificação segura, A.8.9 gestão de config, A.8.24 criptografia). Falta: documentação formal de políticas, análise de riscos estruturada, ciclo PDCA | Documentar controles existentes como evidências. Iniciar gap analysis contra Anexo A |
| OWASP ASVS | Melhor prática de AppSec. Não é certificação, mas fundamenta a postura de segurança | L1 para maioria dos capítulos, L2 para V2/V3/V4/V5/V7/V8/V11/V13 (ver A.2) | Fechar gaps de V6, V9, V12 para atingir L2 completo |
| SOC 2 Type II | Requisito de clientes enterprise nos EUA; pode ser relevante se expandir | Não iniciado | Avaliar quando houver demanda de mercado |

### B.2 Controles ISO 27001 Anexo A já presentes no codebase

A tabela abaixo documenta controles do Anexo A que já existem no Oniefy de forma orgânica, servindo como evidência para futura auditoria.

| Controle Anexo A | Descrição | Evidência no Oniefy |
|---|---|---|
| A.5.15 | Controle de acesso | RLS com `(select auth.uid())` em todas as tabelas; middleware de auth; rate limiting |
| A.8.3 | Restrição de acesso à informação | Service role key isolada em `admin.ts`; CI grep proíbe exposição |
| A.8.5 | Autenticação segura | MFA TOTP obrigatório; login social (Google, Apple); Supabase GoTrue |
| A.8.9 | Gestão de configuração | `.env` por ambiente; `validateEnv()` fail-fast no middleware; CI verifica variáveis |
| A.8.24 | Uso de criptografia | E2E encryption com HKDF do JWT; TLS em trânsito; AES-256 em repouso (Supabase) |
| A.8.25 | Ciclo de vida de desenvolvimento seguro | CI com 3 jobs (security, lint, build); testes automatizados; revisão por Claude |
| A.8.28 | Codificação segura | `search_path` em todas as functions; Zod validation; CSP nonce-based; SSRF allowlist; CSV injection sanitization |
| A.8.33 | Informação de teste | Test user ID dedicado; dados de teste separados de produção |

### B.3 Ações de compliance por horizonte

**Curto prazo (próximas 4 sprints):**
- Produzir mapeamento LGPD: tabela → dados pessoais → base legal → finalidade
- Gerar SBOM automaticamente no CI (item 8.4)
- Documentar controles A.8.28 como checklist executável (item 10.3)
- Registrar nível SLSA atual (L1) e planejar L2
- Implementar audit trail para mutations financeiras (item 11.4)

**Médio prazo (antes do lançamento público):**
- Gap analysis ISO 27001 Anexo A completo
- RIPD (Relatório de Impacto à Proteção de Dados) para o módulo fiscal
- ASVS L2 completo (fechar V6, V9, V12)
- Política de retenção e descarte de dados documentada
- Disaster recovery testado (item 9.4)

**Longo prazo (pós-lançamento, conforme demanda):**
- Certificação ISO 27001 formal (se parceiros enterprise exigirem)
- SOC 2 Type II (se expansão para mercado americano)
- Pentest externo anual por empresa independente

---

## Anexo C - Playwright Audit Kit: mapeamento de automação

O Playwright Audit Kit é uma suite de testes E2E universais que automatiza parte das verificações desta matriz. Este anexo documenta o mapeamento bidirecional entre auditorias da matriz e specs do kit.

### C.1 Specs universais → auditorias cobertas

| Spec | Auditorias da matriz | Nível de cobertura |
|---|---|---|
| `accessibility.spec.ts` | 7.3 (Acessibilidade) | Alto - axe-core cobre WCAG AA automaticamente |
| `keyboard-navigation.spec.ts` | 7.5 (Navegação por teclado) | Médio - verifica tab order e focus visible, mas não focus traps em modais |
| `mobile-responsive.spec.ts` | 7.7 (Responsividade multi-breakpoint) | Alto - 4 breakpoints, overflow, touch targets |
| `all-pages-crawl.spec.ts` | 7.2 (Estados vazios, parcial), 6.4 (E2E, parcial) | Médio - verifica heading, conteúdo, console.error |
| `dead-links.spec.ts` | 6.4 (E2E, parcial) | Médio - verifica que links levam a algum lugar |
| `loading-states.spec.ts` | 7.2 (Estados vazios, parcial), 3.4 (Cache, parcial) | Baixo - detecta flash de conteúdo vazio |
| `performance.spec.ts` | 5.1 (N+1, parcial), 5.2 (Roundtrips, parcial) | Alto para Web Vitals; baixo para causas |
| `security-headers.spec.ts` | 4.6 (SSRF/CSRF, parcial), 9.1 (Config, parcial) | Médio - verifica headers mas não lógica |
| `error-resilience.spec.ts` | 9.3 (Resiliência), 7.6 (UX formulários, parcial) | Médio - 404, fallback de rede, preservação de form |
| `seo-meta.spec.ts` | 2.6 (Nomenclatura, parcial) | Alto para SEO técnico |
| `observability.spec.ts` | 9.2 (Observabilidade) | Médio - detecta presença de analytics/error tracking |
| `monkey.spec.ts` | 3.5 (Error handling), 9.3 (Resiliência), 6.5 (Carga, parcial) | Médio - detecta crashes JS, 5xx, telas em branco sob uso aleatório. Inclui navegação rápida e double-click em submits |
| `flow-variations.spec.ts` | 11.3 (Concorrência), 3.4 (Cache), 7.6 (UX formulários) | Médio - testa modal escape/reopen, botão voltar, abandono de form sem salvar, cliques durante carregamento, F5 em rotas críticas |

### C.2 Auditorias → nível de automação

| # | Auditoria | Automação | Ferramenta |
|---|---|---|---|
| 1.1 | Commits | CI | `git status` no pipeline |
| 1.2 | HANDOVER | Manual + Claude Code | Script de contagem |
| 1.3 | CI/CD + SLSA | CI | GitHub Actions health check |
| 2.1 | Compilação | CI | `tsc --noEmit` |
| 2.2 | Lint | CI | `eslint src/` |
| 2.3 | Dead code | Semi-auto | `ts-prune` |
| 2.4 | Duplicação | Semi-auto | `jscpd` |
| 2.5 | Fragilidade | Semi-auto | grep direcionado |
| 2.6 | Nomenclatura | Semi-auto + `seo-meta.spec.ts` | grep + Playwright |
| 3.1 | Front/back | Manual + Claude Code | Análise de tipos |
| 3.2 | Schema types | Semi-auto | `supabase gen types` diff |
| 3.3 | Acoplamento | Semi-auto | `madge` |
| 3.4 | Cache + estado | Manual + `loading-states.spec.ts` (parcial) | Análise + Playwright |
| 3.5 | Error handling | Manual | grep |
| 4.1 | RLS | Semi-auto | SQL query |
| 4.2 | Auth + sessão | Manual + `security-headers.spec.ts` (parcial) | Análise + Playwright |
| 4.3 | search_path | Semi-auto | SQL query |
| 4.4 | Secrets | CI | grep no pipeline |
| 4.5 | Input validation | Manual + Jest | Análise + testes |
| 4.6 | SSRF/CSRF | Manual + `security-headers.spec.ts` (parcial) | Análise + Playwright |
| 5.1 | N+1 queries | Manual | `pg_stat_statements` |
| 5.2 | Roundtrips | Manual | Análise de hooks |
| 5.3 | Bundle size | Semi-auto | `next build --analyze` |
| 5.4 | Índices DB | Semi-auto | SQL query |
| 6.1 | Cobertura unit | CI | `jest --coverage` |
| 6.2 | Testes vs spec | Manual | Cruzamento |
| 6.3 | Regressão | Manual | Revisão de testes |
| 6.4 | E2E | **Playwright** | `all-pages-crawl` + `dead-links` + specs gerados |
| 6.5 | Carga | Manual | k6/Artillery |
| 6.6 | DAST | Manual | OWASP ZAP |
| 6.7 | Mutation testing | Semi-auto | Stryker |
| 6.8 | Visual regression | **Playwright** | `toHaveScreenshot()` |
| 6.9 | Flaky tests | Semi-auto | Re-run 3x no CI |
| 7.1 | Design system | Semi-auto | grep de hex codes |
| 7.2 | Estados | **Playwright** | `all-pages-crawl` + `loading-states` |
| 7.3 | Acessibilidade | **Playwright** | `accessibility.spec.ts` |
| 7.4 | Cross-browser | **Playwright** | `--project=webkit,firefox` |
| 7.5 | Teclado | **Playwright** | `keyboard-navigation.spec.ts` |
| 7.6 | UX formulários | **Playwright** (parcial) | `error-resilience.spec.ts` + specs gerados |
| 7.7 | Responsividade | **Playwright** | `mobile-responsive.spec.ts` |
| 8.1 | SCA | CI | `npm audit` |
| 8.2 | Obsolescência | Semi-auto | `npm outdated` |
| 8.3 | Licenciamento | Semi-auto | `license-checker` |
| 8.4 | SBOM | CI | `npm sbom` |
| 9.1 | Config ambientes | Manual | Revisão |
| 9.2 | Observab. + alerting | **Playwright** (parcial) | `observability.spec.ts` |
| 9.3 | Resiliência op. | **Playwright** (parcial) | `error-resilience.spec.ts` + `monkey.spec.ts` |
| 9.4 | Disaster recovery | Manual | Teste de restore |
| 9.5 | Feature flags | Manual | grep |
| 10.1 | LGPD | Manual | Análise |
| 10.2 | Rastreabilidade | Manual | Cruzamento |
| 10.3 | ISO 27001 A.8.28 | Manual | Checklist |
| 11.1 | Precisão numérica | Jest + Manual | Testes unitários |
| 11.2 | Timezone/datas | Jest + Manual | Testes unitários |
| 11.3 | Concorrência | **Playwright** (parcial) + Manual | `flow-variations.spec.ts` + `monkey.spec.ts` + teste manual com 2 tabs |
| 11.4 | Audit trail | Semi-auto | SQL query |
| 11.5 | Backup/restore | Manual | Teste de restore |

### C.3 Processo de discovery para specs específicos

Para gerar specs de auditoria específicos ao projeto (formulários, fluxos de negócio, interações customizadas), executar o processo de discovery em 3 fases:

**Fase 1 - Inventário automático:** rodar `discovery/crawl-inventory.spec.ts`, que navega todas as rotas e coleta: formulários (`<form>`, `<select>`, `<input>`), botões com ação destrutiva (excluir, desativar, remover), modais e dialogs, toggles de estado, fluxos multi-step.

**Fase 2 - Classificação:** submeter o inventário ao Claude Code com o prompt em `discovery/PROMPT-GENERATE.md`. O prompt classifica cada elemento em categorias de teste (CRUD, confirmação destrutiva, validação, multi-step, toggle) e propõe specs.

**Fase 3 - Geração:** Claude Code gera os specs em `specs/generated/`, seguindo os templates disponíveis.

Comando completo:
```bash
npx playwright test discovery/crawl-inventory.spec.ts
# Abrir Claude Code:
# "Leia reports/inventory.json e gere specs de auditoria em specs/generated/"
```

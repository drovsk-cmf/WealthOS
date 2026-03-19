# Oniefy - Matriz de Validação

**Versão:** 2.1
**Data:** 19 de março de 2026
**Projeto:** Oniefy (WealthOS)

**Changelog:**
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

Organizados por camada do sistema. Cada tipo verifica uma preocupação específica e pode produzir achados de qualquer categoria da taxonomia acima. 37 auditorias em 10 camadas.

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
| 6.1 | Cobertura de testes unitários | RPCs, hooks, parsers, utils têm testes; edge cases cobertos; cobertura quantitativa | `jest --coverage` | Fragilidade |
| 6.2 | Testes vs spec | Stories do funcional (AUTH-01 a WKF-04) têm validação automatizada correspondente | Cruzamento stories vs `__tests__/` | Fragilidade |
| 6.3 | Testes de regressão | Bugs corrigidos têm teste que impede recorrência | Leitura dos testes vs histórico de bugs | Fragilidade |
| 6.4 | Testes de integração e E2E | Fluxos multi-página (onboarding, transação completa, reconciliação) validados end-to-end; falhas de rede simuladas | Playwright (`e2e/`), MSW para mocks de rede | Defeito, Fragilidade |
| 6.5 | Testes de carga e resiliência | Comportamento sob picos de uso, degradação graciosa, timeouts respeitados, recovery após falha de Supabase | k6, Artillery, ou scripts ad hoc contra staging | Performance, Fragilidade |
| 6.6 | Testes de segurança dinâmicos (DAST) | Fuzzing de inputs, scan de endpoints expostos, tentativas de bypass de auth em runtime | OWASP ZAP, nuclei, scripts manuais de pen test | Vulnerabilidade |
| 6.7 | Eficácia de testes (mutation testing) | Mutation score dos módulos críticos (parsers, transaction engine, auth). Line coverage não garante que testes detectam erros; mutantes não-mortos revelam asserções fracas | Stryker (`@stryker-mutator/core`) em módulos selecionados. Alvo: mutation score >80% em módulos críticos | Fragilidade |

### Camada 7 - UX e Acessibilidade

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 7.1 | Design system | Plum Ledger aplicado sem cores legacy, tipografia DM Sans/JetBrains Mono consistente | grep de hex codes fora da paleta, Tailwind classes | Sujeira, Defeito (se inconsistente) |
| 7.2 | Estados vazios e erros | Todas as páginas tratam loading, empty state, error state com feedback visual | Leitura dos componentes | Defeito |
| 7.3 | Acessibilidade | `aria-label`, contraste WCAG AA, keyboard navigation, focus traps, Dynamic Type | Playwright a11y tests, leitura manual | Defeito, Vulnerabilidade (se legal compliance) |

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
| 9.2 | Observabilidade e logging | Logs estruturados em produção; erros capturados (não silenciados); métricas de saúde acessíveis; alertas configurados | Vercel logs, Supabase logs, grep de `console.error`, Sentry/equivalente | Débito, Fragilidade |
| 9.3 | Resiliência operacional | Comportamento quando Supabase fica indisponível; retry com backoff em falhas transitórias; graceful degradation no client; plano de backup/restore do banco | Teste manual de indisponibilidade, Supabase backup settings | Fragilidade, Defeito |

### Camada 10 - Conformidade e Governança

| # | Tipo de auditoria | O que verifica | Ferramentas | Achados típicos |
|---|---|---|---|---|
| 10.1 | Proteção de dados (LGPD) | Dados pessoais identificados e mapeados; base legal para cada tratamento; mecanismo de exclusão funcional (direito ao esquecimento); política de privacidade acessível e atualizada; consentimento quando aplicável | Leitura do schema + privacy policy + endpoint de exclusão | Vulnerabilidade (risco regulatório), Defeito |
| 10.2 | Rastreabilidade requisitos-código-teste | Cada story (AUTH-01 a WKF-04) tem implementação identificável e teste correspondente; mudanças de spec refletidas no código. Inclui verificação de requirement drift: specs que evoluíram mas cuja matriz ou testes não acompanharam, gerando validação de funcionalidade obsoleta ou lacuna em lógica nova | Cruzamento funcional → `src/` → `__tests__/`, diff de specs vs último baseline | Fragilidade, Sujeira |
| 10.3 | Codificação segura (ISO 27001 A.8.28) | Princípios de codificação segura documentados e aplicados: menor privilégio, defesa em profundidade, agilidade criptográfica (sem chaves hardcoded, algoritmos substituíveis), fail-secure defaults. Evidências coletáveis para auditoria externa | Checklist ISO 27001 A.8.28 vs práticas do codebase; leitura de auth, crypto, RLS | Vulnerabilidade, Débito |

---

## 3. Pacotes de execução

Nem toda sessão requer as 37 auditorias. Quatro pacotes pré-definidos por contexto de uso.

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

### 3.3 Release gate (completo, ~2-3h)

Executar antes de deploy para produção. Objetivo: validação exaustiva.

| Auditorias | IDs |
|---|---|
| Todas as 37 | 1.1 a 10.3 |

Ordem recomendada: Segurança (4) → Dependências (8) → Conformidade (10) → Funcional (6) → Arquitetura (3) → Performance (5) → Infraestrutura (9) → Código (2) → Repositório (1) → UX (7).

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
| **6.1 Cobertura unit** | - | - | - | Alta | - | - |
| **6.2 Testes vs spec** | - | - | - | Alta | - | - |
| **6.3 Regressão** | - | - | - | Alta | - | - |
| **6.4 E2E/integração** | Alta | - | - | Média | - | - |
| **6.5 Carga/resiliência** | - | - | Alta | Média | - | - |
| **6.6 DAST** | - | Alta | - | - | - | - |
| **6.7 Mutation testing** | - | - | - | Alta | - | - |
| **7.1 Design system** | Baixa | - | - | - | - | Alta |
| **7.2 Estados vazios** | Média | - | - | - | - | - |
| **7.3 Acessibilidade** | Média | Baixa | - | - | - | - |
| **8.1 SCA (CVEs)** | - | Alta | - | - | - | - |
| **8.2 Obsolescência** | - | - | - | Média | Alta | - |
| **8.3 Licenciamento** | - | Alta | - | - | - | - |
| **8.4 SBOM** | - | Média | - | - | Alta | - |
| **9.1 Config ambientes** | - | Alta | - | - | Média | - |
| **9.2 Observabilidade** | - | - | - | Média | Alta | - |
| **9.3 Resiliência op.** | Média | - | Média | Alta | - | - |
| **10.1 LGPD** | Média | Alta | - | - | - | - |
| **10.2 Rastreabilidade** | - | - | - | Média | - | Média |
| **10.3 ISO 27001 A.8.28** | - | Alta | - | - | Média | - |

---

## 5. Registro de uso

Ao executar uma auditoria, registrar nesta seção:

| Data | Pacote | Auditorias executadas | Achados | Referência |
|---|---|---|---|---|
| 2026-03-18 | Ad hoc (loops/redundância/ineficiência) | 2.4, 3.4, 3.5, 5.1, 5.2, 6.1 | 2 defeitos, 3 performance, 3 fragilidades, 2 débitos, 1 sujeira | AUDITORIA-CODIGO-WEALTHOS.md |
| | | | | |

---

## Anexo A - Mapeamento para modelos de referência

Para fins de due diligence externa ou auditoria por terceiros, este anexo mapeia as auditorias e categorias da matriz para modelos consolidados.

### A.1 ISO/IEC 25010

A ISO/IEC 25010 define 8 características de qualidade de produto. A tabela abaixo indica quais auditorias da matriz cobrem cada uma.

| Característica ISO 25010 | Subcaracterísticas relevantes | Auditorias que cobrem |
|---|---|---|
| Adequação funcional | Completude, correção, pertinência | 2.1, 3.1, 3.4, 6.1, 6.2, 6.4, 6.7 |
| Eficiência de desempenho | Tempo de resposta, uso de recursos, capacidade | 5.1, 5.2, 5.3, 5.4, 6.5 |
| Compatibilidade | Coexistência, interoperabilidade | 3.1, 3.2, 7.3 (parcial) |
| Usabilidade | Reconhecibilidade, aprendizagem, operabilidade, proteção contra erro, estética, acessibilidade | 2.6, 7.1, 7.2, 7.3 |
| Confiabilidade | Maturidade, disponibilidade, tolerância a falhas, recuperabilidade | 3.5, 6.3, 6.4, 6.5, 9.3 |
| Segurança | Confidencialidade, integridade, não-repúdio, responsabilização, autenticidade | 4.1 a 4.6, 6.6, 8.1, 8.3, 8.4, 9.1, 10.1, 10.3 |
| Manutenibilidade | Modularidade, reusabilidade, analisabilidade, modificabilidade, testabilidade | 2.2 a 2.5, 3.3, 6.1, 6.2, 6.7, 10.2 |
| Portabilidade | Adaptabilidade, instalabilidade, substituibilidade | 1.3, 9.1 (parcial) |

Lacunas reconhecidas: compatibilidade cross-browser/device e portabilidade multi-cloud não são cobertas em profundidade. São tratáveis na Fase 10 (Polish + App Store) do plano de fases do Oniefy.

### A.2 OWASP ASVS v4.0

O ASVS define 14 capítulos de verificação de segurança. A tabela abaixo indica a cobertura da matriz.

| Capítulo ASVS | Descrição | Auditorias que cobrem | Cobertura |
|---|---|---|---|
| V1 | Arquitetura, design, modelagem de ameaças | 3.1, 3.3, 3.5, 10.3 | Parcial |
| V2 | Autenticação | 4.2, 10.3 | Boa |
| V3 | Gerenciamento de sessão | 4.2 (middleware session refresh) | Parcial |
| V4 | Controle de acesso | 4.1 (RLS), 4.2 | Boa |
| V5 | Validação, sanitização, codificação | 4.5 | Boa |
| V6 | Criptografia | 4.4 (secrets), 10.3 (agilidade criptográfica) | Parcial → Boa |
| V7 | Tratamento de erros e logging | 3.5, 9.2 | Boa |
| V8 | Proteção de dados | 10.1 (LGPD), 4.4 | Parcial |
| V9 | Comunicação | 4.6 (SSRF), 9.1 (TLS config) | Parcial |
| V10 | Código malicioso | 8.1 (SCA), 8.4 (SBOM) | Parcial → Boa |
| V11 | Lógica de negócio | 3.4, 6.2, 6.4, 6.7 | Parcial |
| V12 | Arquivos e recursos | 4.5 (path traversal, upload) | Parcial |
| V13 | API e web services | 4.2, 4.5, 4.6 | Boa |
| V14 | Configuração | 9.1, 4.4, 1.3 (SLSA) | Parcial → Boa |

Cobertura geral estimada: nível L1 (oportunista) do ASVS para a maioria dos capítulos; nível L2 (padrão) para V2, V4, V5, V7, V13. A adição de 10.3 (ISO 27001 A.8.28) e 8.4 (SBOM) melhora cobertura de V6, V10 e V14 para próximo de L2.

### A.3 IEEE 1012 (Verificação e Validação)

O Oniefy opera no nível de integridade 2 da IEEE 1012 (software comercial com impacto financeiro moderado, sem risco a vida). A tabela abaixo mapeia as fases do ciclo de vida IEEE 1012 para auditorias aplicáveis.

| Fase IEEE 1012 | Tarefa de V&V | Auditorias da matriz |
|---|---|---|
| Conceito | Análise de risco e hazard | 10.1 (LGPD), 10.3 (codificação segura) |
| Requisitos | Avaliação de rastreabilidade | 10.2, 6.2 |
| Design | Análise de fluxo de controle e interfaces | 3.1, 3.3, 3.4 |
| Implementação | Auditoria de código e conformidade | Camadas 2 e 4 inteiras |
| Teste | Teste de sistema e aceitação | 6.1 a 6.7 |
| Operação | Métricas reais e monitoramento | 9.2, 9.3, 5.4 |

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
| OWASP ASVS | Melhor prática de AppSec. Não é certificação, mas fundamenta a postura de segurança | L1 para maioria dos capítulos, L2 para V2/V4/V5/V7/V13 (ver A.2) | Fechar gaps de V3, V6, V8, V12 para atingir L2 completo |
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

**Médio prazo (antes do lançamento público):**
- Gap analysis ISO 27001 Anexo A completo
- RIPD (Relatório de Impacto à Proteção de Dados) para o módulo fiscal
- ASVS L2 completo (fechar V3, V6, V8, V12)
- Política de retenção e descarte de dados documentada

**Longo prazo (pós-lançamento, conforme demanda):**
- Certificação ISO 27001 formal (se parceiros enterprise exigirem)
- SOC 2 Type II (se expansão para mercado americano)
- Pentest externo anual por empresa independente

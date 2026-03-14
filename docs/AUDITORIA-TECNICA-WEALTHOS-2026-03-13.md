# 1. Resumo executivo
- O projeto **não é toy**: há escopo amplo (financeiro, fiscal, índices, workflows, import bancário) e 28 migrations SQL, mas a execução está concentrada em UI client-heavy + RPCs sem validação de contrato no frontend.
- A espinha dorsal real é: **Next.js App Router client components + hooks React Query + Supabase RPC/SQL**; o domínio crítico está no banco e não no TypeScript.
- A tipagem no frontend passa segurança parcial: uso sistemático de `as unknown as` em respostas de RPC sem validação runtime.
- Há um desalinhamento sério entre narrativa de maturidade e sinais de produto em evolução: biometria e lifecycle de segurança ainda são stubs e/ou não integrados.
- Há risco operacional em onboarding: falhas de seed são apenas `console.warn`, mas onboarding é marcado como concluído mesmo com setup incompleto.
- Build de produção falha sem variáveis Supabase, e há rota que tenta prerenderar com dependência de env em runtime.
- Segurança de repositório está comprometida por documentação com credenciais/token explícitos em `docs/SETUP-LOCAL.md`.
- O modelo de transação contábil no SQL é um ponto forte (RPCs atômicas + trigger de balanço), mas há comentários de “MVP simplificado” em regras de transferência com implicação contábil.
- A arquitetura frontend está degenerando para páginas monolíticas grandes (ex.: conexão/importação e layout autenticado com múltiplas responsabilidades).
- Não há suíte de testes de aplicação (frontend/backend TS) e o único teste SQL depende de ID fixo/manual.
- Há qualidade de engenharia boa em organização por domínio (hooks/forms/pages por módulo), porém sem isolamento real de camadas.
- A documentação principal está parcialmente desatualizada (stack/estrutura declarada difere da base atual).
- Dependências e stack estão modernas, mas higiene de operação/documentação ainda expõe risco de governança.
- **Grau de maturidade**: intermediário funcional, com lacunas estruturais para produção séria.
- **Avaliação final**: **promissor porém frágil**. **Nota geral: 5.9/10** (bom núcleo SQL + segurança parcial, porém risco crítico de credenciais/documentação, baixa testabilidade e fragilidade de contratos).

# 2. Matriz de progresso por domínio
| Domínio | Nota (0-10) | Nível de risco | Evidência principal | Impacto no negócio | Prioridade |
|---|---:|---|---|---|---|
| Arquitetura | 6.0 | Alto | Domínio em RPC/SQL, UI com páginas extensas e lógica distribuída em hooks/pages | Aumenta custo de mudança e risco de regressão | Alta |
| Modelo de domínio | 6.5 | Médio | Modelo contábil explícito no SQL, mas semântica duplicada em UI/RPCs | Erros de negócio difíceis de detectar cedo | Alta |
| Contratos e integrações | 4.5 | Alto | Casts `as unknown as` generalizados sem schema runtime | Quebras silenciosas entre RPC e UI | Crítica |
| Persistência e estado | 7.0 | Médio | RLS + RPC atômica + trigger de validação contábil | Boa integridade base, com pontos de bypass operacional | Alta |
| Front-end / UI | 5.0 | Alto | Componentes/páginas grandes, placeholders e fluxo de segurança misturado no layout | UX inconsistente e manutenção cara | Alta |
| Qualidade de código | 5.5 | Médio | Organização por módulos boa, mas complexidade elevada em arquivos-chave | Lentidão para evolução e revisão | Alta |
| Tipagem e validação | 4.5 | Alto | Tipagem estática sem validação de payload runtime | Falhas em produção sem erro explícito | Crítica |
| Testes | 2.5 | Crítico | Sem `npm test`; testes SQL manuais com user fixo | Alto risco de regressão funcional e contábil | Crítica |
| Segurança e privacidade | 3.5 | Crítico | Exposição de token/credenciais em doc; biometria/lifecycle em stub | Risco direto de incidente e comprometimento | Crítica |
| Performance | 5.5 | Médio | Muitos fetches client-side e múltiplos RPCs por tela | Degradação em escala e UX | Média |
| Operação / DX | 5.0 | Alto | Build sensível a env; supabase CLI com config incompatível local | Dificulta CI/CD e onboarding técnico | Alta |
| Documentação | 3.0 | Crítico | README e setup com divergências e segredo exposto | Risco de uso incorreto + vazamento | Crítica |
| Escalabilidade estrutural | 5.0 | Alto | Crescimento por adição de módulos sem boundary robusto | Pode colapsar ao crescer equipe/escopo | Alta |

# 3. Mapa da arquitetura real
- **Organização real**
  - `src/app/(app)` contém páginas autenticadas client-side por módulo de negócio.
  - `src/lib/hooks` concentra acesso a dados (Supabase query/RPC + React Query) e parte de regras de aplicação.
  - `src/lib/services/transaction-engine.ts` encapsula mutações críticas contábeis via RPC.
  - `supabase/migrations` contém o núcleo de domínio e regras de integridade (RLS, RPCs, triggers).
- **Pontos de entrada**
  - Web: rotas App Router (`(auth)` e `(app)`).
  - API interna: `/api/auth/callback` e `/api/indices/fetch`.
- **Onde estão as regras de negócio**
  - Regras contábeis principais no SQL (ex.: `create_transaction_with_journal`, `create_transfer_with_journal`, validação de journal balance).
  - Regras auxiliares e orquestração no frontend (onboarding seed, filtros, fluxos de confirmação).
- **Principais acoplamentos**
  - UI ↔ RPC acoplada por nomes/formatos implícitos e casts manuais.
  - Layout autenticado acopla navegação + autenticação + MFA + criptografia de sessão.
  - Onboarding acopla setup de segurança, MFA e seed de dados operacionais.
- **Onde está limpa**
  - Separação por domínio em páginas/hook/forms é consistente.
  - Persistência com RLS e migrações incrementais é disciplinada.
- **Onde está degenerando**
  - “Contratos por confiança” sem validação runtime.
  - Crescimento de arquivos monolíticos em UI e layout.
  - Documentação/claims de maturidade acima da implementação real em áreas sensíveis (biometria/lifecycle/testes).

# 4. Achados detalhados
- ID: WEA-001
  - Título: Credenciais/token expostos em documentação versionada
  - Severidade: Crítica
  - Domínio: Segurança e privacidade
  - Evidência: `docs/SETUP-LOCAL.md` inclui token GitHub e chave anon do Supabase em texto explícito.
  - Por que isso é um problema: Exposição de segredo em repositório permite abuso de API, acesso indevido e compromete governança.
  - Consequência prática: Incidente de segurança e potencial bloqueio/rotação emergencial de credenciais.
  - Recomendação objetiva: Revogar credenciais imediatamente; remover segredos do histórico Git; adotar varredura de secrets em CI.
  - Complexidade estimada de correção: Média
  - Arquivos afetados: `docs/SETUP-LOCAL.md`

- ID: WEA-002
  - Título: Contratos RPC sem validação runtime no frontend
  - Severidade: Alta
  - Domínio: Contratos e integrações
  - Evidência: Múltiplos hooks retornam `data as unknown as ...` sem schema (`use-dashboard`, `use-fiscal`, `use-bank-connections`, `transaction-engine`).
  - Por que isso é um problema: Mudanças no payload do RPC quebram UI silenciosamente.
  - Consequência prática: Erros de cálculo/visualização financeira sem detecção precoce.
  - Recomendação objetiva: Introduzir schemas Zod para respostas RPC críticas e fail-fast com erro rastreável.
  - Complexidade estimada de correção: Média
  - Arquivos afetados: `src/lib/hooks/*.ts`, `src/lib/services/transaction-engine.ts`

- ID: WEA-003
  - Título: Onboarding conclui mesmo com seed falhando
  - Severidade: Alta
  - Domínio: Persistência e estado
  - Evidência: falhas em RPCs de seed são `console.warn`, mas `onboarding_completed` é setado mesmo assim.
  - Por que isso é um problema: Usuário pode entrar com base incompleta (categorias/COA/centro) e gerar falhas posteriores.
  - Consequência prática: inconsistência de estado inicial e bugs difíceis de rastrear.
  - Recomendação objetiva: transformar seed em etapa transacional lógica (ou validação pós-seed) antes de marcar onboarding completo.
  - Complexidade estimada de correção: Média
  - Arquivos afetados: `src/app/(auth)/onboarding/page.tsx`

- ID: WEA-004
  - Título: Segurança biométrica em stub e lifecycle não integrado no app
  - Severidade: Alta
  - Domínio: Segurança e privacidade
  - Evidência: `use-biometric` e `attemptBiometricUnlock` são stubs; `useAppLifecycle` existe, mas não está ligado no layout/app.
  - Por que isso é um problema: requisito de proteção em mobile fica parcialmente cosmético.
  - Consequência prática: falsa sensação de segurança para dados sensíveis.
  - Recomendação objetiva: integrar lifecycle no layout mobile e implementar plugin biométrico real antes de publicação nativa.
  - Complexidade estimada de correção: Média
  - Arquivos afetados: `src/lib/auth/use-biometric.ts`, `src/lib/auth/use-app-lifecycle.ts`, `src/app/(app)/layout.tsx`

- ID: WEA-005
  - Título: Layout autenticado com responsabilidades excessivas
  - Severidade: Média
  - Domínio: Arquitetura
  - Evidência: `src/app/(app)/layout.tsx` mistura navegação, sessão, MFA, criptografia, perfil e rendering responsivo.
  - Por que isso é um problema: aumenta acoplamento e risco de regressão transversal.
  - Consequência prática: alterações simples de UI podem quebrar autenticação/segurança.
  - Recomendação objetiva: extrair orquestração de sessão/segurança para provider dedicado.
  - Complexidade estimada de correção: Média
  - Arquivos afetados: `src/app/(app)/layout.tsx`

- ID: WEA-006
  - Título: Build não resiliente sem env e falha em prerender de rotas autenticadas
  - Severidade: Alta
  - Domínio: Operação / DX
  - Evidência: `npm run build` falha em `/settings/security` e `/accounts` sem `NEXT_PUBLIC_SUPABASE_*`.
  - Por que isso é um problema: pipeline de build/deploy e validação local tornam-se frágeis.
  - Consequência prática: quebra de CI e atraso de entrega.
  - Recomendação objetiva: evitar inicialização de cliente Supabase em build path sem env; proteger com fallback/guard SSR.
  - Complexidade estimada de correção: Média
  - Arquivos afetados: `src/lib/supabase/client.ts`, páginas client com execução em build

- ID: WEA-007
  - Título: Política CSP com `unsafe-inline` e `unsafe-eval`
  - Severidade: Alta
  - Domínio: Segurança e privacidade
  - Evidência: `next.config.js` define `script-src 'unsafe-eval' 'unsafe-inline'`.
  - Por que isso é um problema: amplia superfície de XSS.
  - Consequência prática: maior risco de execução de script malicioso.
  - Recomendação objetiva: reduzir para nonce/hash quando possível e remover `unsafe-eval` gradualmente.
  - Complexidade estimada de correção: Média
  - Arquivos afetados: `next.config.js`

- ID: WEA-008
  - Título: Testabilidade quase inexistente na aplicação
  - Severidade: Crítica
  - Domínio: Testes
  - Evidência: ausência de script `test`; sem suíte unit/integration para frontend/hooks/serviços.
  - Por que isso é um problema: sistema financeiro evolui sem rede de segurança.
  - Consequência prática: regressões funcionais em produção.
  - Recomendação objetiva: estabelecer baseline de testes para hooks críticos e fluxos de mutação contábil.
  - Complexidade estimada de correção: Alta
  - Arquivos afetados: `package.json`, base `src/`

- ID: WEA-009
  - Título: Testes SQL dependem de usuário hardcoded/manual
  - Severidade: Média
  - Domínio: Testes
  - Evidência: `supabase/tests/test_financial_mutations.sql` usa UUID fixo e instrução manual de substituição.
  - Por que isso é um problema: baixa reprodutibilidade e difícil automação CI.
  - Consequência prática: cobertura de integridade contábil não entra no fluxo padrão de qualidade.
  - Recomendação objetiva: parametrizar setup/teardown automático por fixture e integrar em pipeline.
  - Complexidade estimada de correção: Média
  - Arquivos afetados: `supabase/tests/test_financial_mutations.sql`

- ID: WEA-010
  - Título: Regras contábeis de transferência explicitamente simplificadas
  - Severidade: Alta
  - Domínio: Modelo de domínio
  - Evidência: comentário no SQL diz “for simplicity in MVP” para casos de cartão de crédito.
  - Por que isso é um problema: simplificação contábil em fluxo central pode gerar classificação incorreta.
  - Consequência prática: demonstrações e métricas de solvência enviesadas.
  - Recomendação objetiva: formalizar regra completa por tipo de conta e cobrir com testes SQL.
  - Complexidade estimada de correção: Média
  - Arquivos afetados: `supabase/migrations/014_transfer_rpc.sql`

- ID: WEA-011
  - Título: Inconsistência entre documentação de estrutura e código real
  - Severidade: Média
  - Domínio: Documentação
  - Evidência: README descreve diretórios (`components/ui`, `hooks`, `stores`) que não representam fielmente o estado atual.
  - Por que isso é um problema: onboarding técnico cria expectativa errada de arquitetura.
  - Consequência prática: tempo perdido e decisões incorretas de manutenção.
  - Recomendação objetiva: reescrever seção de arquitetura com mapa real e ownership por módulo.
  - Complexidade estimada de correção: Baixa
  - Arquivos afetados: `README.md`

- ID: WEA-012
  - Título: API de coleta de índices sem autorização granular (apenas autenticado)
  - Severidade: Média
  - Domínio: Segurança e privacidade
  - Evidência: `/api/indices/fetch` aceita qualquer usuário autenticado e escreve via admin client.
  - Por que isso é um problema: qualquer usuário pode disparar job custoso e mutação global de índices.
  - Consequência prática: abuso operacional/custo e concorrência desnecessária.
  - Recomendação objetiva: restringir endpoint por role interna/secret/cron signature.
  - Complexidade estimada de correção: Baixa
  - Arquivos afetados: `src/app/api/indices/fetch/route.ts`

- ID: WEA-013
  - Título: Página de conexões/importação com alta complexidade monolítica
  - Severidade: Média
  - Domínio: Front-end / UI
  - Evidência: `connections/page.tsx` concentra wizard, parser flow, preview, seleção e gestão de conexões.
  - Por que isso é um problema: dificulta manutenção e aumenta risco de regressão de UX.
  - Consequência prática: lentidão para evoluir import pipeline.
  - Recomendação objetiva: separar wizard em subcomponentes/steps com estado controlado por reducer.
  - Complexidade estimada de correção: Média
  - Arquivos afetados: `src/app/(app)/connections/page.tsx`

- ID: WEA-014
  - Título: Session timeout não limpa DEK explicitamente
  - Severidade: Média
  - Domínio: Segurança e privacidade
  - Evidência: `use-session-timeout` faz `signOut` e redirect, sem `clearEncryptionKey()`.
  - Por que isso é um problema: janela de exposição em memória até reciclagem do contexto.
  - Consequência prática: risco reduzido, porém desnecessário para dados sensíveis.
  - Recomendação objetiva: limpar DEK antes de logout por timeout.
  - Complexidade estimada de correção: Baixa
  - Arquivos afetados: `src/lib/auth/use-session-timeout.ts`

- ID: WEA-015
  - Título: Nível de qualidade/lint com pendências básicas
  - Severidade: Baixa
  - Domínio: Qualidade de código
  - Evidência: warning de variável não usada em budgets page.
  - Por que isso é um problema: sinal de baixa disciplina de higiene contínua.
  - Consequência prática: pequena erosão de legibilidade e confiança em checks.
  - Recomendação objetiva: tornar lint sem warnings em main branch.
  - Complexidade estimada de correção: Baixa
  - Arquivos afetados: `src/app/(app)/budgets/page.tsx`

- ID: WEA-016
  - Título: Falta de metadataBase para URLs de metadados
  - Severidade: Baixa
  - Domínio: Operação / DX
  - Evidência: warning no build sobre `metadataBase` ausente.
  - Por que isso é um problema: OpenGraph/Twitter podem resolver URLs incorretas em ambientes reais.
  - Consequência prática: SEO/social cards inconsistentes.
  - Recomendação objetiva: configurar `metadataBase` via env por ambiente.
  - Complexidade estimada de correção: Baixa
  - Arquivos afetados: `src/app/layout.tsx`

- ID: WEA-017
  - Título: Rate limiting in-memory sem estratégia robusta de produção
  - Severidade: Média
  - Domínio: Segurança e privacidade
  - Evidência: comentários admitem limitação multi-instância no middleware/rate-limiter.
  - Por que isso é um problema: proteção inconsistente em ambiente escalado.
  - Consequência prática: brute force distribuído mais viável.
  - Recomendação objetiva: migrar store para Redis/KV e observar métricas por rota/IP.
  - Complexidade estimada de correção: Média
  - Arquivos afetados: `src/lib/auth/rate-limiter.ts`, `src/middleware.ts`

- ID: WEA-018
  - Título: Ausência de boundaries explícitos entre domínio e infraestrutura no frontend
  - Severidade: Média
  - Domínio: Arquitetura
  - Evidência: hooks acessam Supabase diretamente e transportam objetos DB para UI.
  - Por que isso é um problema: schema físico vaza para telas e amplia impacto de mudança.
  - Consequência prática: refactor/migração de backend com alto custo de quebra.
  - Recomendação objetiva: introduzir camada de mapeamento DTO de apresentação para módulos críticos.
  - Complexidade estimada de correção: Alta
  - Arquivos afetados: `src/lib/hooks/*`, páginas em `src/app/(app)`

# 5. Inconsistências e contradições arquiteturais
- O que aparenta querer ser
  - Plataforma financeira robusta, segura, com maturidade de produção e trilhas de engenharia disciplinadas.
- O que realmente é hoje
  - Produto funcional de escopo grande, com núcleo SQL relativamente sólido, mas frontend e operação ainda em estágio de consolidação.
- Desalinhamentos entre intenção e implementação
  - Segurança “mobile-hardening” declarada vs biometria/lifecycle em stub/não integrado.
  - “Arquitetura limpa” sugerida em docs vs acoplamento direto UI↔Supabase.
  - “Maturidade de fase concluída” vs ausência de testes automatizados de aplicação.
  - “Prontidão operacional” vs docs contendo segredos e build frágil por env.
- Desalinhamentos aceitáveis por fase
  - Placeholders de features não críticas (algumas áreas de settings) podem ser toleráveis.
- Desalinhamentos que já viraram dívida perigosa
  - Exposição de segredos.
  - Contratos sem validação runtime.
  - Falta de suíte de testes para fluxos financeiros.

# 6. Lacunas críticas de teste
1. Teste de contrato RPC→UI (dashboard/fiscal/import)
   - risco coberto: quebra silenciosa de payload
   - camada afetada: integração frontend
   - cenário mínimo: mock de payload inválido/ausente e assert de fallback com erro explícito
   - consequência sem teste: métricas financeiras incorretas na interface
2. Teste de onboarding resiliente
   - risco coberto: estado inicial inconsistente
   - camada afetada: fluxo auth/setup
   - cenário mínimo: simular falha em seed RPC e impedir `onboarding_completed`
   - consequência sem teste: usuários em estado semi-configurado
3. Teste SQL de transferência por tipo de conta (incluindo crédito)
   - risco coberto: regra contábil simplificada incorreta
   - camada afetada: banco (RPC)
   - cenário mínimo: transferência envolvendo cartão com validação de débito/crédito esperado
   - consequência sem teste: balanço e relatórios distorcidos
4. Teste de segurança de endpoint `/api/indices/fetch`
   - risco coberto: abuso por usuário autenticado comum
   - camada afetada: API route
   - cenário mínimo: usuário sem role autorizada recebe 403
   - consequência sem teste: custo/abuso operacional
5. Teste de timeout limpando DEK
   - risco coberto: chave em memória pós inatividade
   - camada afetada: auth client
   - cenário mínimo: simular timeout, validar `clearEncryptionKey` invocado
   - consequência sem teste: risco residual de exposição em memória

# 7. Top 15 correções prioritárias
1. Revogar e remover segredos versionados
2. Introduzir validação Zod para respostas RPC críticas
3. Bloquear conclusão do onboarding sem seed mínima validada
4. Restringir `/api/indices/fetch` a papel interno/cron autenticado
5. Integrar `useAppLifecycle` no app autenticado mobile
6. Implementar biometria real (remover stub)
7. Criar suíte mínima de testes (unit/integration) para hooks críticos
8. Criar suíte SQL automatizada sem UUID hardcoded
9. Corrigir regra contábil de transferência para casos de passivo
10. Extrair orquestração de sessão/segurança do layout
11. Definir contrato DTO entre hooks e UI (anti-vazamento schema)
12. Corrigir build resiliente sem env em rotas client/prerender
13. Endurecer CSP removendo unsafe quando possível
14. Atualizar README para arquitetura real
15. Zerar warnings de lint e tornar gate obrigatório

# 8. Quick wins
- Remover imediatamente token/chaves do `docs/SETUP-LOCAL.md` e publicar errata.
- Adicionar `metadataBase` no `layout` com env.
- Corrigir variável não usada em budgets.
- Inserir `clearEncryptionKey()` no timeout.
- Colocar guard de autorização mais restritiva no endpoint de índices.

# 9. Refactors estruturais recomendados
1. Extrair camada `domain-gateways` no frontend
   - problema: acoplamento Supabase em hooks de UI
   - evidência: hooks fazem query/RPC e retornam shape bruto
   - escopo: módulos dashboard/transações/fiscal
   - risco: médio
   - pré-requisito: contratos Zod definidos
2. Reduzir arquivos monolíticos de página (wizard/layout)
   - problema: complexidade alta e múltiplas responsabilidades
   - evidência: `connections/page.tsx`, `(app)/layout.tsx`
   - escopo: decomposição incremental em componentes + reducer/provider
   - risco: médio
   - pré-requisito: testes de comportamento
3. Padronizar estratégia de mutações críticas
   - problema: parte no SQL, parte em sequência client-side
   - evidência: pós-operações e logs warn sem fail-fast
   - escopo: onboarding, contas, import
   - risco: médio-alto
   - pré-requisito: observabilidade e testes de regressão

# 10. Riscos para produção
- **Crítico**: Segredos expostos em documentação versionada.
- **Crítico**: Ausência de testes automatizados para fluxos financeiros centrais.
- **Alto**: Contratos RPC sem validação runtime (quebra silenciosa).
- **Alto**: Segurança mobile incompleta (biometria/lifecycle stub ou não integrado).
- **Alto**: Endpoint de ingestão de índices mutável por qualquer usuário autenticado.
- **Médio**: Build/deploy frágil por dependência rígida de env e prerender.
- **Médio**: Regras contábeis de transferência com simplificação declarada.

# 11. Plano de estabilização em 3 ondas
- **Onda 1: contenção de risco (imediata)**
  1) Rotacionar/remover segredos expostos.
  2) Bloquear endpoint de índices por autorização forte.
  3) Corrigir onboarding para não concluir com seed incompleta.
  4) Limpar DEK em timeout e integrar lifecycle no app mobile.
- **Onda 2: estabilização estrutural (curto prazo)**
  1) Validar contratos RPC com Zod.
  2) Criar suíte mínima de testes TS + SQL automatizada.
  3) Endurecer CSP e ajustar build/env resiliente.
  4) Atualizar documentação de arquitetura/operação.
- **Onda 3: base para crescimento (médio prazo)**
  1) Introduzir boundaries frontend (gateway/domain DTO).
  2) Refatorar páginas monolíticas de maior risco.
  3) Formalizar regras contábeis avançadas (transferência/passivo) com testes de regressão.

# 12. Prompt de handoff para o Claude
```text
Você vai atuar como engenheiro sênior responsável por estabilizar o WealthOS com base neste diagnóstico.

Resumo do diagnóstico:
- Há risco crítico de segurança por segredos/token em documentação versionada.
- Há fragilidade alta de contratos (frontend confia em payload RPC com casts sem validação runtime).
- O onboarding pode marcar conta como pronta mesmo com seed parcial.
- Segurança mobile está incompleta (biometria/lifecycle em stub/não integrada).
- Não existe suíte de testes automatizada suficiente para um sistema financeiro.

ORDEM EXPLÍCITA DE EXECUÇÃO (obrigatória):
1. corrigir riscos críticos;
2. corrigir contratos frágeis;
3. fortalecer validações e testes;
4. só então atacar refactors estruturais.

Regras de execução:
- Faça mudanças incrementais, seguras e verificáveis.
- Preserve a arquitetura atual quando fizer sentido; evite refactor ornamental.
- Cada PR/commit deve ter objetivo único e diffs claros.
- Toda mudança crítica deve vir com teste correspondente.
- Não introduza abstrações sem evidência do problema real.
- Ao final de cada etapa, rode build/lint/typecheck/testes relevantes.

Entregáveis obrigatórios:
- Lista priorizada das mudanças implementadas com justificativa técnica.
- Diffs claros por arquivo.
- Testes adicionados e evidência de execução.
- Validação final (build/lint/typecheck/test).
- Relatório final com:
  - o que foi alterado,
  - o que ficou pendente,
  - quais riscos permanecem e por quê.
```

## Fatos observados vs inferências vs hipóteses
- **Fatos observados**: exposição de credenciais em docs; ausência de `test` script; casts `unknown as`; stubs de biometria; onboarding com warnings e conclusão; build falhando sem env.
- **Inferências prováveis**: risco de quebra silenciosa de contrato RPC; risco de regressão elevado por ausência de testes.
- **Hipóteses para validação adicional**: impacto real da regra simplificada de transferências em cenários com cartão/financiamento sob dados de produção.

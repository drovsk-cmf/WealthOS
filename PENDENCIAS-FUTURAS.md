# Oniefy — Pendências e Implementações Futuras

**Última atualização:** 23 de março de 2026
**Mantido por:** Claude (atualizar ao final de cada sessão com impacto relevante)
**Relação com o HANDOVER:** Este documento é complementar ao `HANDOVER-WealthOS.md`. O HANDOVER registra o histórico de sessões e o estado técnico atual. Este documento é a fonte única de verdade para **o que fazer a seguir** — backlog de produto, ações pendentes, dívida técnica e evoluções estratégicas.

> **Regra de uso:** Antes de qualquer sessão de desenvolvimento, ler este documento junto com a Seção 12 do HANDOVER. Ao finalizar uma sessão, marcar itens concluídos e adicionar novos se necessário.

---

## Legenda de Status

| Símbolo | Significado |
|---------|-------------|
| ⬜ | Pendente, não iniciado |
| 🔄 | Em progresso |
| ✅ | Concluído |
| 🔒 | Bloqueado (dependência externa) |
| ⏳ | Aguarda decisão ou ação do Claudio |
| 📌 | Deferido (sem prazo, por gatilho) |

---

## 1. Ações Imediatas — Claudio (sem código necessário)

Itens que só avançam com ação manual do Claudio. Não requerem sessão Claude.

| # | Item | Prioridade | Status | Observação |
|---|------|-----------|--------|------------|
| A1 | Supabase Pro upgrade (~US$25/mês) | P0 | ⏳ | Desbloqueia: Leaked Password Protection + CAPTCHA + SLAs produção |
| A2 | Apple Developer Account (US$99/ano) | P1 | ⏳ | Desbloqueia: CFG-04, FIN-17, FIN-18, iOS build, App Store |
| A3 | SMTP sender: configurar `noreply@oniefy.com` no Supabase Dashboard | P1 | ⏳ | Auth → SMTP Settings no Dashboard |
| A4 | MFA TOTP: fator está como "unverified" no oniefy-prod | P1 | ⏳ | Reconfigurar no próprio app após login |
| A5 | CAPTCHA Cloudflare Turnstile: ativar em produção | P1 | ⏳ | Requer Turnstile site key + secret key nas env vars Vercel |
| A6 | Apple OAuth: habilitar quando tiver Apple Developer certificate | P2 | ⏳ | Depende de A2 |
| A7 | Teste de corredor com 3 pessoas (UX-H3-05) | P2 | ⏳ | 5 tarefas, observar hesitações, sem instruções prévias |
| A8 | Validação fiscal periódica: checar DOU para IRPF, INSS, SM | Recorrente | ⏳ | Portarias mudam anualmente. Próxima: jan/2027 |
| A9 | Confirmação das 6 decisões IA do adendo v1.5 | P2 | ⏳ | Ver Seção 9 deste documento |
| A10 | RESEND_API_KEY: cadastrar em resend.com para digest semanal | P2 | ⏳ | Sem a chave, preview_only mode |
| A11 | Projeto Sentry: criar conta free tier + adicionar DSN nas env vars Vercel | P2 | ⏳ | @sentry/nextjs já integrado, falta o DSN |
| A12 | Pausar/deletar projeto Supabase legado (`hmwdfcsxtmbzlslxgqus`) | P3 | ⏳ | Nenhum dado exclusivo. Evitar confusão em futuras sessões |

---

## 2. Stories Bloqueadas por Mac/Xcode (3/108)

Requerem Xcode + Apple Developer Account. Não implementáveis sem ambiente macOS.

| Story | Descrição | Bloqueio | Status |
|-------|-----------|----------|--------|
| CFG-04 | Push notifications APNs nativas para iOS | Apple Developer Account + Xcode | 🔒 |
| FIN-17 | OCR de recibo via Apple Vision Framework (nativo) | Xcode. Web fallback (Tesseract.js) já implementado | 🔒 |
| FIN-18 | Câmera para comprovante via Capacitor Camera | Xcode | 🔒 |

---

## 3. iOS e App Store (sequência obrigatória)

| # | Item | Esforço | Bloqueio | Status |
|---|------|---------|----------|--------|
| I1 | Apple Developer Account (US$99/ano) | 5 min | Decisão Claudio | ⏳ |
| I2 | Capacitor iOS build + teste (Xcode Cloud 25h grátis/mês) | 2h | I1 | 🔒 |
| I3 | Biometria real (Capacitor BiometricAuth, substituir stubs) | 4–6h | I2 | 🔒 |
| I4 | OCR real completo (Apple Vision + Tesseract.js + PDF.js) | 4–6h | I2 | 🔒 |
| I5 | Submissão App Store (screenshots, descrição, review) | 2h | I1, I2, I3 | 🔒 |

---

## 4. Backlog de Produto — Horizonte 1 (antes do lançamento público)

Itens com alta relação impacto/esforço. Devem ser resolvidos antes de abrir para usuários externos.

### 4.1 UX e Confiança

| Código | Item | Esforço | Impacto | Status |
|--------|------|---------|---------|--------|
| E1 | **Indicador de saúde de saldo por conta** — badge por conta: "Conferido" (verde, <7d sem divergência), "Divergência" (dourado, >1% diff), "Xd sem atualização" (dourado 7-29d, vermelho 30d+). Ref: HANDOVER §32. | Baixo | Alto (confiança) | ✅ |
| E2 | **Gráfico Net Worth ao longo do tempo** — linha temporal com monthly_snapshots. Componente `net-worth-chart.tsx` no dashboard (engajado+), stacked areas por tier, seletor 6/12/24m, variação MoM. Ref: HANDOVER §32. | Baixo | Alto (retenção) | ✅ |
| E3 | **Gerenciador de assinaturas** — nova aba "Assinaturas" em Contas a Pagar. Filtra recorrências mensais de despesa ativas, total consolidado mensal/anual, badge de reajuste. Ordenação por valor. Ref: HANDOVER §32. | Baixo | Médio (percepção de valor) | ✅ |
| E4 | **Onboarding: valor em menos de 5 minutos** — validar empiricamente no corredor (UX-H3-05). Se TTI > 5min, redesenhar o fluxo de boas-vindas. | Médio | Alto (ativação) | ⬜ |
| E5 | **Política de early adopters documentada** — `docs/POLITICA-EARLY-ADOPTERS.md`: acesso vitalício, preço congelado, features nunca removidas, acesso antecipado a betas. Ref: HANDOVER §32. | Zero (técnico) | Alto (reputação) | ✅ |
| E9 | **Interpretação de solvência em linguagem direta** — cada métrica do Cockpit de Fôlego com estado (Confortável/Saudável/Atenção/Crítico) + frase explicativa contextual. Funções: lcrExplanation, runwayExplanation, patrimonyExplanation, burnRateExplanation. Ref: HANDOVER §32. | Baixo | Médio (adoção das métricas) | ✅ |

### 4.2 Infra e Qualidade

| Código | Item | Esforço | Impacto | Status |
|--------|------|---------|---------|--------|
| Q1 | **Cobertura de testes: 71.2% statements** (era 60.9%). 67 testes adicionados em 3 batches cobrindo 15 hooks. Functions já em 75.3%. Gaps restantes: API routes push/digest (~20%, requerem Playwright E2E). | Médio | Alto (confiança no deploy) | 🔄 |
| Q2 | **E2E Playwright no CI como gate obrigatório** — atualmente condicional (vars.E2E_ENABLED). Requer Supabase de teste isolado para o GitHub Actions. | Médio | Alto (qualidade) | ⬜ |
| Q3 | **Logging estruturado** — Sentry `beforeSend` + PII scrub implementados nos 3 configs (client/server/edge). Falta DSN (ação Claudio A11: criar conta Sentry free + env var Vercel). | Baixo | Médio (observabilidade) | ✅ (código) / ⏳ (DSN) |

---

## 5. Backlog de Produto — Horizonte 2 (primeiros 3 meses pós-lançamento)

Itens que agregam valor significativo mas não são bloqueadores do lançamento inicial.

| Código | Item | Esforço | Impacto | Status |
|--------|------|---------|---------|--------|
| E6 | **Metas de economia (savings goals)** — tabela `savings_goals` + CRUD + página `/goals` com progresso visual, valor mensal sugerido, meses restantes, concluir/reabrir. Sidebar 8+1. Migration 072. Ref: HANDOVER §32. | Médio | Alto (retenção longa) | ✅ |
| E7 | **Simulador de decisão: "posso comprar?"** — 3 inputs (valor, forma de pagamento, prazo) → 3 outputs (impacto Runway, impacto LCR, comparativo reserva 6 meses). Cálculo determinístico com dados reais de solvência. Componente `affordability-simulator.tsx`, 1ª aba nas Calculadoras (5 abas). Ref: HANDOVER §32. | Médio | Alto (diferenciação / marketing) | ✅ |
| E8 | **Exportação IRPF formatada** — XLSX com ExcelJS (6 abas: Resumo, Rendimentos, Deduções, Bens, Dívidas, Provisionamento). Botão "Exportar" na página de IR, lazy import. Zero deps novas. Ref: HANDOVER §32. | Médio | Alto (renovação anual) | ✅ |
| E8b | **Motor JARVIS CFA: Frente A (zero schema change)** — RPC `get_jarvis_scan` com 8 regras ativas (R02, R03, R03b, R05, R06, R07, R08, R09, R10). Camada 2: combinador com projeção 3/6/12m. UX: JarvisScanCard no dashboard. 40 testes Jest. Ref: HANDOVER §31. | Médio | Alto (diferenciação CFA) | ✅ |
| E8c | **Motor JARVIS CFA: Frente B (schema evolution)** — Migration aplicada: `investment_class`, `interest_rate`, `rate_type` em accounts + CHECK constraints. FIX: `depreciation_rate` numeric(5,4)→(7,4). Todas 4 regras implementadas: R01 (ativo < CDI), R02 (dívida cara), R04 (veículo TCO), R05 (espiral cartão). Formulário de contas com campos condicionais. **Motor JARVIS Camada 1 completo: 10 regras.** Ref: HANDOVER §31. | Médio | Alto (WACC pessoal, análise de risco) | ✅ |
| E8d | **CFA Pessoal: Calculadoras TVM** — 4 calculadoras implementadas: Independência Financeira (perpetuidade), Comprar vs Alugar (NPV), CET (IRR/Newton-Raphson), SAC vs Price. Front-end only, zero RPC. Página `/calculators` com tabs. Nav 7+1. Ref: HANDOVER §31.7. | Médio | Alto (diferenciação) | ✅ |
| E8e | **Polymarket / Prediction Markets como input contextual** — Integrar API do Polymarket (ou equivalente) como sinal de mercado na Camada 3 (IA narrativa). Ex: "mercado precifica 72% de chance de Selic cair, o que favoreceria migrar CDB pré para pós-CDI". Analisado e rejeitado para agora: desalinhamento de domínio, cobertura BR ≈ zero, escopo creep. Reavaliar quando Camada 3 for implementada. | Baixo | Baixo (Camada 3 futura) | ⏳ |
| E10 | **Open Finance com motor de reconciliação maduro** — Fase 2 planejada (adendo v1.3). Só entregar quando: (1) motor de deduplicação por hash, (2) indicador de status de sincronização por conta, (3) fila de transações "suspeitas" para confirmação do usuário. Entregar Open Finance com dados inconsistentes é pior que não ter. | Alto | Alto (aquisição / paridade) | 📌 |
| E11 | **UX-H2-02: Push notifications triggers** — inatividade 7 dias implementada dentro de `/api/push/send` (Vercel cron diário 11:00 UTC). Texto: "Oniefy sente sua falta". Log em notification_log tipo "inactivity". APNs nativo depende de Mac. | Médio | Médio (engajamento) | ✅ (inatividade) / 🔒 (APNs) |

---

## 6. Backlog de Produto — Horizonte 3 (6–12 meses pós-lançamento)

Itens com alto potencial, mas justificados apenas com base de usuários estabelecida.

| Código | Item | Esforço | Impacto | Status |
|--------|------|---------|---------|--------|
| E11 | **Compartilhamento familiar com permissões granulares** — "cônjuge com acesso total" vs "filho com acesso às próprias contas". Arquitetura multi-user documentada (RLS multi-user backlog). Muda unidade de cobrança de "pessoa" para "família". | Alto | Alto (ticket médio) | 📌 |
| E12 | **Projeção indexada IPCA/CDI** — cenários pessimista/base/otimista nas despesas recorrentes dos próximos 12 meses. Aluguel por IGP-M, escola por IPCA Educação. Infra BCB/IBGE já pronta. | Médio | Alto (diferenciação BR) | 📌 |
| E13 | **Capital Humano (DCF da carreira)** — valor presente da carreira até a aposentadoria. Cálculo usa renda histórica já no banco. Argumento direto para seguros de vida: "gap de R$ 3,7M descoberto". | Médio | Alto (diferenciação radical) | 📌 |
| E14 | **Shadow Ledger (off-balance sheet)** — milhas, pontos de fidelidade, garantias judiciais, passivos contingentes. Exibidos em seção separada com nota de estimativa. Completa a foto patrimonial sem comprometer o ledger principal. | Médio | Médio (completude patrimonial) | 📌 |

---

## 7. Dívida Técnica e Qualidade

Itens técnicos que não são bugs, mas afetam qualidade, segurança ou manutenibilidade.

| Código | Item | Gravidade | Gatilho para implementar | Status |
|--------|------|-----------|--------------------------|--------|
| DT-007 | Type casts residuais — 0 `as any` no codebase exceto database.ts. Type-guards.ts criado. Casts documentados. | Baixa | Quando aparecer bug de tipo undefined | 📌 |
| DT-014 | COA órfão — FK constraint adicionado preventivamente. Zero órfãos confirmados. | Baixa | Se surgir inconsistência de plano de contas | 📌 |
| TEC-01 | N+1 em rotas cron (push/send, digest/send) — iteração por usuário com query individual dentro do loop. | Baixa | Quando base de usuários > 100 | 📌 |
| TEC-02 | Recharts sem lazy loading — bundle size impacto. | Baixa | Se bundle > 500kb medido no build | 📌 |
| TEC-03 | Web Workers para parsers CSV/OFX/XLSX (Gemini audit #4) | Baixa | Usuário reportar travamento na importação | 📌 |
| TEC-04 | SSR prefetch no Dashboard (Gemini audit #5) | Baixa | TTI > 2s medido em produção com dados reais | 📌 |
| TEC-05 | Rate limiter in-memory não compartilha estado entre instâncias Vercel | Baixa | Quando Vercel escalar para múltiplas regiões | 📌 |
| TEC-06 | SBOM atualizado automaticamente no CI — npm sbom CycloneDX já no workflow. Verificar periodicidade. | Baixa | Revisão semestral | ⬜ |
| TEC-07 | Mapeamento LGPD: `docs/LGPD-MAPEAMENTO.md`. 6 lacunas identificadas (L1-L2 ✅, L3-L6 ⬜). Medidas técnicas documentadas (12 itens). Roadmap de conformidade em 4 fases. Ref: HANDOVER §32. | Média | Antes de 100 usuários | ✅ (documento) / ⬜ (L3-L6 implementação) |

---

## 8. Evoluções Estratégicas Futuras (sem prazo, por gatilho de tração)

Catalogadas nos adendos v1.3 e v1.4. Não implementar antes dos gatilhos listados.

| Item | Origem | Gatilho para priorizar |
|------|--------|------------------------|
| Open Finance via agregador (Pluggy/Belvo) | Adendo v1.3 | Contrato com agregador viável + certificação + budget mensal definido |
| RLS multi-user (workspaces/grupos familiares) | Gemini audit | Cônjuge ou membro solicitar login próprio |
| Motor CLT (bruto→líquido automático) | Adendo v1.4 | Demanda recorrente de usuários CLT puros |
| Motor PJ/Simples Nacional | Adendo v1.4 | Demanda recorrente de usuários PJ |
| Motor Investimentos (DARF, isenções, ganho de capital) | Adendo v1.4 | Módulo de investimentos implementado |
| Arquitetura Local-First (SQLite + WASM + CRDTs) | Adendo v1.4 | Escala para 500+ usuários ou requisito de offline total |
| Zero-Knowledge expandido (E2E para valores numéricos) | Adendo v1.4 | Parceiro enterprise exigir ou feedback de privacidade relevante |
| Capital Humano (DCF da carreira) | Adendo v1.4 | Produto maduro com 6+ meses de dados por usuário |
| Shadow Ledger + Cofre Digital | Adendo v1.4 | Produto maduro com usuários mass affluent ativos |
| B2B / Open API / Marketplace de Solvência | Adendo v1.4 | Base de usuários estabelecida (500+) |
| Rateio automático de overhead por centro | Estudo técnico v2.0 | Volume > 50 transações/mês com centros ativos |
| Web3 wallet login (Ethereum/Solana) | Sessão 22 | Tester crypto solicitar — infraestrutura Supabase já habilitada |
| Assistente conversacional (AI chat) | Adendo v1.5 P17 | Pós-validação de retenção — API route já implementada |
| Insights narrativos mensais (Claude Haiku) | Adendo v1.5 P13 | Provider confirmado + custo validado — endpoint já implementado |
| **CFA Pessoal: Inteligência Ativa (Frente C)** | CFA-ONIEFY-MAPPING.md §3 Fase 3 | Frentes A+B implementadas + 3 meses de dados por usuário. Inclui: insights automáticos no dashboard, benchmarks pessoais vs médias BR (BCB/IBGE), mapa de riscos pessoal, IPS pessoal (onboarding expandido com perfil de risco). |
| **Suporte Contextual Silencioso (framework completo)** | Sessão 30 | Tipo 1 (empty states) parcialmente implementado. Tipo 2 (fricção) parcial. Tipo 3 (insights CFA) requer Frente A. Tipo 4 (progresso) requer 1+ mês de dados. Framework documentado no HANDOVER §30. |

---

## 9. Decisões Pendentes de Confirmação (Claudio)

Itens do adendo v1.5 que aguardam validação antes de serem considerados definitivos no produto.

| # | Decisão | Recomendação técnica | Status |
|---|---------|---------------------|--------|
| D1 | Provider IA para volume (categorização, extração) | Gemini Flash-Lite (~US$0.02/usuário/mês) | ⏳ |
| D2 | Provider para narrativas e insights | Claude Haiku 4.5 (qualidade texto pt-BR superior) | ⏳ |
| D3 | Rate limit free tier de IA | 50 chamadas/mês por usuário | ⏳ |
| D4 | Cache de prompts e respostas | TTL 30 dias, hash SHA-256 (já implementado) | ⏳ |
| D5 | Assistente conversacional no MVP | Postergar — endpoint existe, não expor ainda | ⏳ |
| D6 | Sanitização PII antes de toda chamada IA | Regex obrigatório — já implementado | ✅ |

---

## 10. Limitações Conhecidas (Aceitas por Design)

Documentadas, não são bugs. Reavaliar se o cenário de uso mudar.

| Item | Motivo da Aceitação | Reavaliação |
|------|---------------------|-------------|
| Rate limiter não protege `signInWithPassword` direto | SDK Supabase bypassa middleware; GoTrue tem rate limiting próprio. Supabase Pro adiciona camada extra. | Quando contratar Supabase Pro |
| CSP requer `unsafe-inline` em produção | Incompatibilidade com Next.js static pre-rendering e nonce dinâmico | Quando Next.js suportar nonce + static rendering |
| Biometria é stub (retorna bypass=true) | Requer Xcode e Capacitor nativo | Quando I2 (build iOS) estiver pronto |
| SW não cacheia dados financeiros offline | Decisão deliberada: app financeiro não deve servir dados stale | Se usuários reportarem necessidade de offline completo |

---

## 11. Contexto de Benchmark — Insights de Produto

**Origem:** análise comparativa de mercado (sessões 23-24/03/2026) com Mobills, Organizze, Oinc, YNAB, Empower, Monarch, iDinheiro. Inclui leitura de reviews, Reclame Aqui e App Store/Google Play.

### Mapa de concorrentes

| App | Mercado | Open Finance | Modelo de negócio | Público | Diferencial principal |
|-----|---------|-------------|-------------------|---------|----------------------|
| Mobills | BR | Sim | Freemium + anúncios | Massa | Maior base BR, muitos anúncios |
| Organizze | BR | Sim | Freemium | Massa | Simplicidade, mas dados inconsistentes |
| Oinc | BR | Não | Freemium | Massa | Gerenciador de assinaturas |
| iDinheiro | BR | Sim (200+ instituições) | Freemium + afiliados (marketplace crédito) | Massa | Projeção financeira + metas com sugestões automáticas + monetização via ofertas de crédito/empréstimo dentro do app |
| YNAB | US | Não (import manual) | Assinatura (US$99/ano) | Intencionais | Metodologia envelope, 6 pessoas por assinatura |
| Empower | US | Sim (Plaid) | Freemium + advisory | Mass affluent | Net Worth tracking + investment advisory |
| Monarch | US | Sim (Plaid) | Assinatura (US$99/ano) | Mass affluent | Melhor UX, compartilhamento familiar |
| **Oniefy** | **BR** | **Não (roadmap)** | **Assinatura** | **Hybrid Earner** | **Solvência, CFA pessoal, patrimônio, fiscal** |

### iDinheiro — Análise detalhada (adicionado sessão 30)

O iDinheiro opera em dois eixos: portal de conteúdo financeiro (idinheiro.com.br — comparadores, rankings, reviews) e app de gestão financeira (iOS/Android). O portal monetiza via comissões de afiliados; o app oferece marketplace de crédito integrado (ofertas de empréstimo após simulação). Isso significa que o app gratuito é viabilizado pelo lead generation, não pela assinatura.

**Features relevantes para o Oniefy:**

| Feature iDinheiro | O que faz | Tem no Oniefy? | Prioridade |
|---|---|---|---|
| Projeção financeira | Projeta receitas, gastos e faturas para os próximos meses | Não | Alta (E8d — calculadoras TVM) |
| Metas com sugestões automáticas | Calcula automaticamente como concluir a meta (quanto poupar/mês) | Não | Alta (E6 — savings goals) |
| Revisor de gastos por categoria | Agrupa transações em 6 categorias cross-conta | Sim (16 categorias) | Implementado |
| Open Finance (200+ instituições) | Conexão automática com bancos | Não | Roadmap E10 (quando reconciliação madura) |
| Calculadora 50/30/20 | Distribui orçamento em necessidades/desejos/poupança | Não | Descartado — heurística comportamental sem base em financial analysis. Oniefy calcula com dados reais (TVM, taxa de poupança necessária para objetivo X no prazo Y) |
| Marketplace de crédito | Ofertas de empréstimo/cartão dentro do app | Não (fora do modelo) | N/A — Oniefy não monetiza via afiliados |
| Patrimônio / Solvência | Não oferece | Sim (LCR, runway, tiers, balance sheet) | Vantagem Oniefy |
| Fiscal / IRPF | Não oferece | Sim (módulo fiscal, tax_parameters) | Vantagem Oniefy |
| Análise CFA | Não oferece | Implementado (E8b-E8d) | Diferenciação radical |

**Insight estratégico:** O iDinheiro valida que projeção financeira e metas com sugestões automáticas são features de alta demanda no mercado BR. O modelo de monetização via afiliados é incompatível com a proposta do Oniefy ("CFA pessoal" exige independência — não pode recomendar empréstimo e ao mesmo tempo ganhar comissão por ele). Mas a funcionalidade de projeção é universalmente valiosa e reforça a prioridade dos itens E6 e E8d no backlog.

### O que os concorrentes ensinam por negativo

| Dor do mercado | Frequência | O que o Oniefy faz diferente |
|----------------|-----------|------------------------------|
| Dados incorretos / saldo errado | Dominante (Mobills, Organizze) | Modelo append-only com estorno obrigatório — dado nunca some silenciosamente |
| Duplicatas após Open Finance | Alta | Motor de reconciliação já implementado (Camada 3 na UI) |
| Anúncios em produto pago | Moderada (Mobills) | Zero anúncios por arquitetura de negócio |
| Ofertas de crédito/empréstimo misturadas com gestão financeira | Moderada (iDinheiro) | Oniefy não monetiza via afiliados — independência de recomendação |
| Curva de aprendizagem excessiva (YNAB) | Moderada | Filosofia Apple: sem termos contábeis expostos |
| Open Finance com dados incompletos (Organizze) | Alta | Entregar Open Finance só quando reconciliação estiver madura |
| Mudança retroativa de plano (Organizze) | Pontual | Política de early adopters definida antes do lançamento (item E5) |

### O que os concorrentes ensinam por positivo

| Funcionalidade que fideliza | Quem tem | Prioridade para o Oniefy |
|-----------------------------|---------|-----------------------|
| Projeção financeira mensal (próximos meses) | iDinheiro, Monarch | E8d (calculadoras TVM) — H2 |
| Metas com sugestões automáticas ("quanto poupar/mês") | iDinheiro, YNAB | E6 (savings goals) — H2 |
| Planejamento de despesas futuras irregulares | YNAB | E6 (metas) + E7 (simulador) — H1/H2 |
| Net Worth histórico (linha temporal) | Empower, Monarch | E2 — H1, baixo esforço, alto impacto |
| Gerenciador de assinaturas consolidado | Oinc | E3 — H1, muito baixo esforço |
| Compartilhamento familiar com permissões | YNAB (6 pessoas, 1 assinatura) | E11 — H3, muda modelo de cobrança |
| Exportação formatada para contador | Mobills Premium, Organizze | E8 — H2, fideliza no IRPF |

---

## Histórico de Atualizações

| Data | Atualização | Responsável |
|------|------------|-------------|
| 23/03/2026 | Documento criado. Compilação de HANDOVER §12 + benchmark de mercado + insights de produto. | Claude |
| 23/03/2026 | Adicionados E8b-E8d (CFA Pessoal: Frentes A/B/C + Calculadoras TVM). Adicionados itens estratégicos: CFA Inteligência Ativa + Suporte Contextual Silencioso. Ref: `CFA-ONIEFY-MAPPING.md`. | Claude |
| 24/03/2026 | Benchmark expandido: iDinheiro adicionado (app + portal). Mapa de concorrentes com 8 players. Análise detalhada do modelo de afiliados. Tabelas negativo/positivo atualizadas (projeção, metas automáticas). Calculadora 50/30/20 avaliada e descartada (heurística sem base CFA). | Claude |
| 24/03/2026 | E8b-E8c reescritos com especificação detalhada do Motor JARVIS CFA: 10 regras com fórmulas SQL, 3 camadas, dependências de schema mapeadas. Ref: HANDOVER §30.10 + CFA-ONIEFY-MAPPING.md §6. | Claude |
| 24/03/2026 | E8b concluído (✅): get_jarvis_scan com 8 regras + JarvisScanCard + 40 testes. E8c parcial (🟡): schema aplicado, R02+R05 implementados, R01+R04 pendentes. E8e adicionado: Polymarket como input futuro da Camada 3 (rejeitado para agora). | Claude |
| 25/03/2026 | E8c concluído (✅): R01 (ativo < CDI) e R04 (veículo TCO) implementados. Motor JARVIS Camada 1 completo: 10 regras determinísticas. 45 suítes / 666 assertions. | Claude |
| 25/03/2026 | E8d concluído (✅): 4 calculadoras TVM (Independência, Comprar vs Alugar, CET, SAC vs Price). Bloco E8 inteiro fechado (E8b ✅, E8c ✅, E8d ✅, E8e ⏳). | Claude |
| 25/03/2026 | E2 concluído (✅): gráfico Patrimônio Líquido (net-worth-chart, stacked areas por tier, 6/12/24m). E9 concluído (✅): interpretação de solvência em linguagem direta (4 funções explicativas). E7 concluído (✅): simulador "Posso comprar?" (3 inputs → 3 outputs, dados reais). 46 suítes / 688 assertions. | Claude |
| 25/03/2026 | E1 concluído (✅): indicador de saúde de saldo por conta (3 estados visuais). E3 concluído (✅): gerenciador de assinaturas (aba em Contas a Pagar). E6 concluído (✅): metas de economia com CRUD, progresso, sugestão mensal (migration 072, nova tabela savings_goals, sidebar 8+1). 47 suítes / 708 assertions. | Claude |
| 25/03/2026 | E5 concluído (✅): política de early adopters (docs/POLITICA-EARLY-ADOPTERS.md). Q1 em progresso (🔄): cobertura 60.9%→67.9% (+55 testes em 2 batches). Q3 concluído (✅ código): Sentry beforeSend + PII scrub nos 3 configs (falta DSN = A11). 49 suítes / 763 assertions. | Claude |
| 25-26/03/2026 | E8 concluído (✅): exportação IRPF formatada (XLSX 6 abas, ExcelJS). Q1 batch 3 (+12 testes): cobertura 67.9%→71.2% statements, 75.3% functions. Fix Vercel deploy (ESLint override para testes). 50 suítes / 775 assertions. Sessão 32 total: 8 features (E1/E2/E3/E5/E6/E7/E8/E9), 109 testes novos, 17 commits. | Claude |


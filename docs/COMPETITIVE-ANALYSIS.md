# ONIEFY - Análise Competitiva Completa

## Documento de Referência

**Data de criação:** 02 de Abril de 2026
**Última atualização:** 02 de Abril de 2026
**Fontes:** Reviews de usuários, Reclame Aqui, App Store, Google Play, Engadget, TechTudo, análises especializadas, sites oficiais dos concorrentes.

---

## 1. O Mercado em 2026

O mercado de apps de finanças pessoais se divide em duas filosofias claras:

- **Orçamento ativo:** o usuário atribui propósito a cada real antes de gastar (YNAB, Monarch). Muda comportamento.
- **Rastreamento passivo:** o app categoriza gastos automaticamente para o usuário revisar (Mobills, Organizze, Empower). Mostra o problema, mas não muda comportamento.

Dado relevante: 70% dos usuários abandonam apps financeiros em 3 meses. O problema não é o app, é o hábito. O app que resolve a barreira de entrada (registro fácil) e entrega valor rápido (insight, não dados) vence.

No Brasil, o cenário é dominado por apps de massa (Mobills, Organizze) com monetização via anúncios e freemium. Não existe concorrente direto para o posicionamento do Oniefy (CFA pessoal para Hybrid Earners).

---

## 2. Concorrentes Brasileiros

### 2.1 Mobills

**O que é:** App de controle financeiro mais popular do Brasil. Fundado em Teresina (PI) em 2013.
**Público:** Massa. Desde universitários até famílias classe média.
**Modelo:** Freemium + anúncios. Premium: ~R$ 100/ano (promoções frequentes, ex: R$ 199,90/2 anos).
**Plataformas:** Android, iOS, Web.
**Reclame Aqui:** Nota 7.6/10, 340 reclamações (set/2025 a fev/2026).

**Funcionalidades:**
- Registro manual de receitas/despesas
- Categorização automática (com Open Finance)
- Gráficos e relatórios
- Metas e objetivos financeiros
- Controle de cartão de crédito
- Open Finance (integração bancária)
- Tags e membros para segmentar transações

**Deficiências identificadas nos reviews:**
- Bugs recorrentes ("Nunca vi um aplicativo com bugs recorrentes, um simples botão eles se perdem")
- Erros de cálculo matemático ("Um aplicativo financeiro que erra em cálculos matemáticos não pode ser levado a sério")
- Open Finance com Itaú parou de funcionar e suporte não resolve
- Versão gratuita infestada de anúncios
- Cobrança indevida após desinstalação
- Suporte lento (tempo médio 5-6 dias)

**O que o Oniefy aprende:** Mobills prova que existe mercado enorme no Brasil para gestão financeira. Mas o produto é medíocre: bugs, erros de cálculo e anúncios destroem a confiança. O Oniefy não pode ter nenhum desses problemas. Zero bugs em cálculos financeiros é inegociável.

---

### 2.2 Organizze

**O que é:** App focado em simplicidade e relatórios. Concorrente direto do Mobills.
**Público:** Massa, com foco em quem quer simplicidade.
**Modelo:** Freemium. Versão paga com recursos avançados.
**Plataformas:** Android, iOS, Web.
**Reclame Aqui:** Nota 8.7/10, 69 reclamações. Reputação melhor que Mobills.

**Funcionalidades:**
- Registro de despesas e receitas
- Importação via Open Finance
- Controle de limites por categoria
- Alertas de contas a pagar
- Relatórios de hábitos de consumo
- Planejamento de objetivos

**Deficiências identificadas nos reviews:**
- Dados incorretos e saldo errado (reclamação recorrente)
- Duplicatas após conectar Open Finance
- Mudança retroativa de plano (caso pontual que gerou revolta)
- Funcionalidades avançadas só no plano pago

**O que o Oniefy aprende:** A nota alta no Reclame Aqui mostra que atendimento bom compensa produto imperfeito. Mas "dados incorretos" é a pior reclamação possível para um app financeiro. O motor de deduplicação do Oniefy (DEDUP-ENGINE-SPEC.md) existe para nunca reproduzir esse problema.

---

### 2.3 GuiaBolso (descontinuado → PicPay)

**O que é:** Foi pioneiro em Open Finance no Brasil. Descontinuado em novembro/2022, funcionalidades absorvidas pelo PicPay.
**Público:** Massa.
**Modelo:** Gratuito (monetizava via marketplace de crédito).

**Legado relevante:** O GuiaBolso provou que conexão automática com bancos é a funcionalidade mais desejada pelo usuário brasileiro. Também provou que marketplace de crédito dentro de app financeiro gera conflito de interesse (recomendar empréstimo a quem está endividado).

**O que o Oniefy aprende:** Não monetizar via afiliados de crédito. A independência de recomendação é o diferencial do "CFA pessoal".

---

### 2.4 iDinheiro

**O que é:** Portal de conteúdo financeiro + app de gestão. Monetiza via comissões de afiliados (marketplace de crédito).
**Público:** Massa.
**Modelo:** Gratuito (lead generation via ofertas de crédito).

**Funcionalidades relevantes:**
- Projeção financeira (próximos meses)
- Metas com sugestões automáticas ("quanto poupar/mês")
- Categorização em 6 categorias cross-conta
- Open Finance (200+ instituições)
- Marketplace de crédito integrado

**Deficiências:**
- Sem patrimônio/solvência
- Sem módulo fiscal
- Sem análise financeira avançada
- Marketplace de crédito misturado com gestão financeira (conflito de interesse)

**O que o Oniefy aprende:** iDinheiro valida que projeção financeira e metas automáticas são features de alta demanda. Mas o modelo de afiliados é incompatível com análise financeira imparcial.

---

### 2.5 Kinvo (BTG Pactual)

**O que é:** Consolidador de investimentos. Adquirido pelo BTG Pactual.
**Público:** Investidores (foco em renda variável).
**Modelo:** Freemium. Premium R$ 15/mês ou R$ 120/ano.
**Reclame Aqui:** Nota 7.2/10, 60 reclamações.

**Funcionalidades:**
- Consolidação de carteira de investimentos
- Integração com B3 (CEI/Área do Investidor)
- Rentabilidade vs. benchmarks (CDI, Ibovespa)
- Ganho de capital (ações vs. dividendos)
- Gráficos de rentabilidade
- Integração com Tesouro Direto

**Deficiências:**
- Foco exclusivo em investimentos (sem despesas, patrimônio físico, fiscal)
- Fundos precisam ser importados manualmente
- Dados divergentes com a B3 (problema reconhecido como bug da API B3)
- Suporte lento (9 dias média)
- Após aquisição pelo BTG, viés em direção a produtos BTG

**O que o Oniefy aprende:** Kinvo mostra que integração B3 é viável e valorizada. Mas o produto é estreito: só investimentos. O Oniefy é maior (10 zonas mentais), com investimentos como uma das zonas, não a única.

---

### 2.6 Gorila

**O que é:** Consolidador de investimentos com foco em assessores e multi-family offices.
**Público:** Investidores sofisticados, assessores de investimento, family offices.
**Modelo:** B2B (licenciamento para assessorias) + B2C (app gratuito com limitações).
**Reclame Aqui:** Pouquíssimas reclamações (base pequena).

**Funcionalidades:**
- Consolidação cross-corretora (renda fixa + variável + cripto + fundos)
- Rentabilidade avançada (por ativo, estratégia, período)
- Suporte a: CDB, LCI, LCA, poupança, fundos, cripto, opções, debêntures, futuros, COE
- Versão web robusta + app mobile

**Deficiências:**
- Interface considerada menos amigável que o Kinvo
- App mobile menos robusto que a versão web
- Foco B2B (assessorias) torna o B2C secundário
- Sem gestão de despesas, patrimônio físico, fiscal

**O que o Oniefy aprende:** Gorila é o que mais se aproxima em profundidade de investimentos, mas é exclusivamente um consolidador. Pivotou para B2B. O Oniefy é B2C com visão integral.

---

### 2.7 Investidor10

**O que é:** Plataforma de análise fundamentalista + gerenciador de carteira. Parceiro homologado da B3.
**Público:** Investidores buy-and-hold, analistas.
**Modelo:** Freemium. PRO com relatórios avançados.

**Funcionalidades:**
- Integração oficial com B3 (Área do Investidor)
- Análise fundamentalista (P/L, P/VP, ROE, etc.)
- Carteira com rentabilidade e alocação
- IRPF para investimentos
- Rankings e comparativos de ativos

**Deficiências:**
- Dados da B3 às vezes com quantidades erradas (problema da API B3, não do Investidor10)
- Delay de até 3 dias na sincronização com B3
- Foco exclusivo em investimentos e análise de ativos
- Sem gestão de despesas, patrimônio, fiscal geral

**O que o Oniefy aprende:** Investidor10 prova que a integração B3 funciona e é valorizada. A ferramenta de IRPF para investimentos é diferencial. O Oniefy terá isso como parte do motor fiscal, não como produto isolado.

---

### 2.8 Apps de bancos digitais (Nubank, Inter, C6)

**O que fazem:** Ferramentas de organização financeira embutidas no app do banco. Categorização automática de gastos do cartão, "caixinhas" para metas, cofrinhos com rendimento.

**Deficiências:**
- Veem apenas os dados do próprio banco (silo)
- Sem consolidação cross-banco
- Sem análise sofisticada
- Sem patrimônio, investimentos consolidados, fiscal
- Sem cartão de crédito de outros bancos

**O que o Oniefy aprende:** A feature "caixinha" do Nubank prova que savings goals com rendimento automático são altamente desejados. Mas o Nubank só vê o Nubank. O Oniefy vê tudo.

---

## 3. Concorrentes Internacionais

### 3.1 YNAB (You Need A Budget)

**O que é:** App de orçamento zero-based. O mais respeitado do mercado. Quase uma religião para seus usuários.
**Público:** Pessoas comprometidas com mudança de comportamento financeiro.
**Modelo:** Assinatura US$ 14.99/mês ou US$ 109/ano. Gratuito para universitários.
**Plataformas:** iOS, Android, Web.

**Funcionalidades:**
- Orçamento zero-based (cada dólar tem um propósito antes de ser gasto)
- Conexão bancária via Plaid
- Metas de savings
- Relatórios de gastos
- Regra de envelopes (roll-over entre meses)

**Dado impressionante:** Usuários YNAB economizam em média US$ 6.000 no primeiro ano (55x o custo da assinatura).

**Deficiências:**
- Curva de aprendizado alta (metodologia complexa para iniciantes)
- Interface complicada, exige dedicação
- Não rastreia investimentos automaticamente (só balances manuais)
- Sem net worth tracking sofisticado
- Sem gerenciador de assinaturas
- Sem fiscal/impostos

**O que o Oniefy aprende:** YNAB prova que uma metodologia forte fideliza. O "CFA pessoal" do Oniefy é a nossa metodologia. Mas a curva de aprendizado do YNAB é o principal motivo de abandono. O Oniefy precisa ser intuitivo desde o primeiro minuto ("Suporte Contextual Silencioso").

---

### 3.2 Monarch Money

**O que é:** Considerado o melhor app de gestão financeira completa em 2026. Fundado por ex-gerente de produto do Mint.
**Público:** Casais e famílias de renda média-alta. "Big picture tracking."
**Modelo:** Assinatura US$ 14.99/mês ou US$ 99.99/ano.
**Plataformas:** iOS, Android, Web.

**Funcionalidades:**
- Orçamento com balance sheet (budgets vs. actuals por categoria)
- Projeção financeira (forecast por ano e por mês)
- Rastreamento de investimentos (todas as contas)
- Net worth tracking
- Gerenciador de recorrências e assinaturas
- Compartilhamento familiar (casais, sem custo adicional)
- Regras personalizáveis por valor, merchant, etc.
- 3 providers para conexão bancária (Plaid + MX + Finicity), raramente falha
- Integração com Apple Card, Apple Cash
- Dashboard customizável

**Deficiências:**
- Configuração inicial complexa (mobile app inferior ao web)
- Não calculou renda corretamente (precisou editar)
- Trial de 7 dias insuficiente para setup
- Precisa de pelo menos 90 dias para calibrar categorização
- Sem módulo fiscal/impostos
- Sem patrimônio físico (imóveis, veículos como bens)

**O que o Oniefy aprende:** Monarch é o concorrente mais próximo em ambição. Compartilhamento familiar sem custo adicional é genial. A projeção financeira (forecast) é feature que o Oniefy precisa ter. Mas Monarch não tem: patrimônio físico, fiscal/IRPF, solvência, análise financeira avançada, assistente inteligente. Essas são as lacunas que o Oniefy preenche.

---

### 3.3 Copilot Money

**O que é:** O app de finanças mais bonito do mercado. Apple Editor's Choice.
**Público:** Usuários Apple que valorizam design.
**Modelo:** US$ 13/mês ou US$ 95/ano.
**Plataformas:** iOS e Mac apenas (sem Android, web recém-lançada).

**Funcionalidades:**
- UI/UX excepcional (o padrão de design do mercado)
- Categorização inteligente por IA
- Recorrências e rebalanceamento de orçamento
- Rastreamento de investimentos e cripto
- Analytics detalhados
- Ícones customizáveis

**Features anunciadas (em desenvolvimento):**
- Smart financial goals
- Natural language search
- Chat interface
- Forecasting e benchmarking (comparar com outros usuários Copilot)

**Deficiências:**
- Exclusivo Apple (sem Android = exclui metade do mercado)
- Relativamente novo (lançado 2020), ainda alcançando concorrentes em features
- Sem cash flow detalhado (em construção)
- Sem módulo fiscal
- Sem patrimônio físico

**O que o Oniefy aprende:** O design do Copilot é o benchmark visual. A Onie (orb + briefing + insights) precisa entregar essa mesma sensação de polimento. Benchmarking entre usuários é uma ideia interessante para o futuro. Mas o Copilot ser só Apple é uma limitação que o Oniefy não pode ter.

---

### 3.4 Empower (ex-Personal Capital)

**O que é:** App gratuito de net worth + advisory de investimentos pago.
**Público:** Mass affluent americanos.
**Modelo:** App gratuito. Advisory pago (0,89% a.a. sobre AUM, mínimo US$ 100.000).
**Plataformas:** iOS, Android, Web.

**Funcionalidades (gratuitas):**
- Net worth tracking
- Análise de portfolio (alocação, performance)
- Rastreamento de investimentos (incluindo 401k)
- Categorização de gastos
- Retirement planner

**Deficiências:**
- Ligações de vendas persistentes após cadastro
- Categorização errada (checking/savings classificados como investimento)
- Sem ferramentas de orçamento (não permite definir limites por categoria)
- Sem roll-over de orçamento
- O app gratuito é essencialmente um funil de vendas para o advisory

**O que o Oniefy aprende:** Empower prova que net worth + investimentos + retirement planning são features altamente valorizadas pelo público affluent. Mas o modelo de monetização via advisory cria conflito (o app gratuito existe para vender o serviço pago). O Oniefy é transparente: cobra assinatura, entrega valor, sem vendas cruzadas.

---

### 3.5 Rocket Money (ex-Truebill)

**O que é:** App focado em encontrar e cancelar assinaturas esquecidas.
**Público:** Massa (americano).
**Modelo:** Freemium. Premium US$ 6-14/mês ("pay what you want").
**Plataformas:** iOS, Android, Web.

**Funcionalidades:**
- Detecção automática de assinaturas
- Cancelamento concierge (equipe cancela para você)
- Negociação de contas (luz, internet, seguros)
- Smart Savings (move pequenas quantias para poupança automaticamente)
- Net worth tracking
- Orçamento básico

**Deficiências:**
- Bill negotiation cobra 35-60% da economia do primeiro ano
- Orçamento superficial (sem zero-based, sem roll-over)
- Não substitui um app de orçamento completo

**O que o Oniefy aprende:** O gerenciador de assinaturas (E3) que o Oniefy já tem é inspirado neste conceito. O detector de recorrências (E26) e alerta de preço anormal (E27) vão além: não apenas encontram assinaturas, mas detectam qualquer cobrança recorrente e alertam sobre reajustes. O conceito de "Smart Savings" (mover dinheiro automaticamente) é interessante para o futuro.

---

### 3.6 Origin Financial

**O que é:** App de wealth planning para casais e famílias de alta renda.
**Público:** Mass affluent, HENRYs (High Earners Not Rich Yet).
**Modelo:** Assinatura (não informado publicamente). Integração opcional com advisor humano.

**Funcionalidades:**
- Planejamento patrimonial completo
- Goals financeiros de longo prazo
- Compartilhamento para casais (sem custo extra)
- Integração com advisor humano
- Categorização por IA
- Net worth + investimentos + orçamento

**Deficiências:**
- Categorização menos precisa que YNAB ou Copilot (foco é no big picture, não no granular)
- Relativamente novo, base pequena

**O que o Oniefy aprende:** Origin é o concorrente mais próximo em filosofia ao Oniefy. Ambos miram no "big picture" patrimonial para alta renda. A integração com advisor humano é um caminho que o Oniefy poderia explorar no futuro (acesso read-only para contador, E35). Mas Origin é americano e não tem as complexidades BR (IRPF, CDI, parcelamento, múltiplos cartões).

---

### 3.7 Simplifi by Quicken

**O que é:** Versão moderna do Quicken, focada em simplicidade.
**Público:** Americanos que querem gestão sem complexidade.
**Modelo:** Assinatura.

**Funcionalidades:**
- Conexão bancária (Fidelity funciona bem)
- Convite para cônjuge ou advisor financeiro co-gerenciar a conta
- Alertas de contas a pagar
- Orçamento mensal
- Marcação de reembolsos esperados

**Deficiências:**
- Não conecta com Zillow (imóveis)
- Miscategorização de transações (comum a todos os apps)
- Imóveis precisam ser adicionados manualmente

**O que o Oniefy aprende:** A feature de convidar advisor ou cônjuge para co-gerenciar é exatamente o que E35 (acesso read-only para contador) faz. Validação de que existe demanda.

---

### 3.8 Tiller Money

**O que é:** Preenche automaticamente uma planilha Google Sheets ou Excel com transações bancárias.
**Público:** Nerds financeiros que amam planilhas mas querem automação.
**Modelo:** Assinatura.

**O que o Oniefy aprende:** Existe um público significativo que prefere planilhas a apps. O Oniefy não precisa competir com planilhas, mas a exportação de dados (XLSX) precisa ser impecável para que o usuário possa usar o Oniefy como fonte e a planilha como ferramenta de análise complementar.

---

## 4. Mapa Competitivo Consolidado

### 4.1 Por funcionalidade

| Funcionalidade | Mobills | Organizze | Kinvo | YNAB | Monarch | Copilot | Empower | **Oniefy** |
|---------------|---------|-----------|-------|------|---------|---------|---------|-----------|
| Registro de despesas | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Orçamento | ✅ básico | ✅ básico | ❌ | ✅ zero-based | ✅ avançado | ✅ | ❌ | ✅ |
| Cartão de crédito (parcelas) | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ avançado |
| Open Finance / conexão bancária | ✅ | ✅ | Via B3 | Via Plaid | Via Plaid/MX/Finicity | Via Plaid | Via Plaid | Roadmap |
| Investimentos consolidados | ❌ | ❌ | ✅ avançado | ❌ (manual) | ✅ | ✅ | ✅ | ✅ (B3 API + cotações) |
| Net worth / patrimônio líquido | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ avançado |
| Patrimônio físico (imóveis, veículos) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Solvência (LCR, runway, D/E) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Fiscal / IRPF | ❌ | ❌ | Parcial (ganho capital) | ❌ | ❌ | ❌ | ❌ | ✅ avançado |
| Projeção financeira | ❌ | ❌ | ❌ | ❌ | ✅ | Em dev | ✅ (retirement) | ✅ (calculadoras TVM) |
| Metas de economia | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Gerenciador de assinaturas | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Compartilhamento familiar | ❌ | ❌ | ❌ | ✅ (6 pessoas) | ✅ (casais grátis) | ❌ | ❌ | Roadmap (E16) |
| Assistente inteligente | ❌ | ❌ | ❌ | ❌ | ❌ | IA categorização | ❌ | ✅ (Onie) |
| Importação de faturas (PDF/XLSX) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (6 bancos) |
| Inbound email para faturas | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Registro ultrarrápido (push/widget/voz) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (5 formas) |
| Detector de recorrências | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Alerta de preço anormal | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Calendário financeiro | ❌ | Alertas | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Rastreador de garantias | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Custo manutenção por bem | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Relatório anual (Wrapped) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Testamento digital | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (roadmap) |

### 4.2 Por posicionamento

| App | País | Público | Preço | Filosofia | Ponto forte | Ponto fraco |
|-----|------|---------|-------|-----------|-------------|-------------|
| Mobills | BR | Massa | ~R$100/ano | Rastreamento | Base grande, Open Finance | Bugs, erros de cálculo, anúncios |
| Organizze | BR | Massa | Freemium | Rastreamento | Simplicidade, bom suporte | Dados incorretos, duplicatas |
| iDinheiro | BR | Massa | Gratuito | Rastreamento + crédito | Projeção, Open Finance | Conflito interesse (afiliados) |
| Kinvo | BR | Investidores | R$120/ano | Consolidação invest. | Integração B3 | Só investimentos, bugs B3 |
| Gorila | BR | Assessores/FOs | B2B | Consolidação invest. | Profundidade, multi-ativo | B2C secundário, UX inferior |
| Investidor10 | BR | Investidores | Freemium | Análise + carteira | Dados fundamentalistas, B3 | Só investimentos |
| YNAB | US | Comprometidos | US$109/ano | Orçamento ativo | Metodologia, resultados comprovados | Curva de aprendizado |
| Monarch | US | Casais affluent | US$100/ano | Big picture tracking | Completude, compartilhamento | Setup complexo, sem fiscal |
| Copilot | US | Apple lovers | US$95/ano | Design + IA | UX excepcional | Só Apple, novo |
| Empower | US | Mass affluent | Gratuito + advisory | Net worth + advisory | Investimentos gratuitos | Vendas agressivas, sem orçamento |
| Rocket Money | US | Massa | US$6-14/mês | Assinaturas | Detecção + cancelamento | Orçamento fraco |
| Origin | US | HENRYs | Assinatura | Wealth planning | Big picture, advisor | Novo, categorização fraca |
| **Oniefy** | **BR** | **Hybrid Earners** | **Assinatura** | **CFA pessoal** | **Visão integral, solvência, fiscal** | **Sem Open Finance (ainda)** |

---

## 5. Lacunas que NENHUM Concorrente Preenche

O Oniefy é o único app no mercado (BR ou global) que combina:

| Lacuna | Quem mais tem? | Status Oniefy |
|--------|---------------|--------------|
| Solvência pessoal (LCR, runway, D/E, WACC pessoal) | Ninguém | Implementado (E15, JARVIS) |
| Patrimônio físico com custo de manutenção por bem | Ninguém | Especificado (Zona 6) |
| Motor fiscal brasileiro completo (IRPF, deduções saúde/educação, ganho de capital) | Kinvo e Investidor10 (parcial, só investimentos) | Implementado parcialmente |
| Importação de faturas de 6+ bancos brasileiros (PDF/XLSX/CSV) com parsing inteligente | Ninguém | Especificado (IMPORT-ENGINE-SPEC) |
| Inbound email para faturas com derivação automática de senha | Ninguém | Especificado (IMPORT-ENGINE-SPEC) |
| Motor de deduplicação multi-fonte com resolução imediata | Ninguém (Organizze/Mobills reclamam de duplicatas justamente por não ter) | Especificado (DEDUP-ENGINE-SPEC) |
| Assistente financeiro com personalidade e orb animado | Ninguém (Copilot tem IA, mas sem personalidade) | Especificado (ONIE-ORB-SPEC) |
| Análise financeira avançada (DuPont pessoal, savings rate, income CV, breakeven) | Ninguém no B2C | Implementado (E15) |
| Registro ultrarrápido com 5 formas de captura | Ninguém | Especificado (QUICK-REGISTER-SPEC) |
| Alerta de preço anormal em cobranças recorrentes | Ninguém | Especificado (FEATURES-ROADMAP) |
| Rastreador de garantias (incluindo cartão de crédito) | Ninguém | Especificado (FEATURES-ROADMAP) |
| Relatório anual estilo Wrapped | Ninguém no segmento financeiro | Especificado (FEATURES-ROADMAP) |

---

## 6. Riscos Competitivos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|-------------|---------|-----------|
| Monarch lançar versão BR com Open Finance | Baixa (focado no mercado US) | Alto | Executar rápido. Complexidade fiscal BR é barreira de entrada. |
| Nubank expandir gestão financeira para cross-banco | Média | Alto | Nubank não tem incentivo para mostrar dados de outros bancos. Conflito de interesse. |
| Mobills resolver bugs e subir de nível | Média | Médio | Oniefy mira público diferente (Hybrid Earner ≠ massa). Mobills não tem solvência, fiscal, patrimônio. |
| Kinvo expandir para gestão financeira completa | Baixa (BTG não tem incentivo) | Médio | Kinvo é ferramenta do BTG para reter clientes na plataforma, não produto independente. |
| Novo concorrente BR com mesma visão | Baixa (complexidade alta) | Alto | Vantagem de first mover. 108 stories, 35 tabelas, 64 migrations. Barreira técnica alta. |
| Open Finance não amadurecer no BR | Média | Médio | Motor de importação (faturas, email) mitiga dependência de Open Finance. |

---

## 7. Aprendizados Consolidados

### 7.1 O que copiar (por positivo)

| De quem | O que | Por quê | Onde no Oniefy |
|---------|-------|---------|---------------|
| YNAB | Metodologia forte que muda comportamento | Fideliza mais que features | "CFA pessoal" como filosofia |
| Monarch | Projeção financeira + compartilhamento familiar | Features mais desejadas pelo público affluent | E28 (calendário) + E16 (família) |
| Copilot | Design excepcional | O padrão visual do mercado | Onie orb + Plum Ledger design system |
| Rocket Money | Detecção + alerta de assinaturas | Economia passiva sem esforço | E3 (assinaturas) + E26 (recorrências) + E27 (alertas) |
| Investidor10 | Integração B3 oficial | Consolidação autoritativa | E25 (B3 API) |
| Empower | Retirement planner gratuito | Projeção de longo prazo | E13 (Capital Humano) + E8d (calculadoras) |

### 7.2 O que evitar (por negativo)

| De quem | O que evitar | Por quê | Como o Oniefy evita |
|---------|-------------|---------|-------------------|
| Mobills | Bugs e erros de cálculo | Destrói confiança instantaneamente | 891 assertions, 78% coverage, CI rigoroso |
| Mobills | Anúncios em produto pago | Experiência degradada | Zero anúncios por arquitetura de negócio |
| Organizze | Dados incorretos e duplicatas | Pior reclamação possível para app financeiro | Motor de deduplicação (DEDUP-ENGINE-SPEC) |
| Organizze | Mudança retroativa de plano | Destrói confiança | Política de early adopters (E5, já implementada) |
| GuiaBolso/iDinheiro | Marketplace de crédito dentro do app | Conflito de interesse com análise imparcial | Nunca monetizar via afiliados de crédito |
| Empower | Ligações de vendas após cadastro | Experiência agressiva e invasiva | Sem vendas cruzadas, sem upsell agressivo |
| YNAB | Curva de aprendizado alta | 70% dos usuários abandonam em 3 meses | Suporte Contextual Silencioso + Onie guiando |
| Open Finance (geral) | Duplicatas e dados inconsistentes | Pior que não ter | Só entregar quando motor de reconciliação estiver maduro (E10) |

### 7.3 O que ninguém faz (oportunidade)

| Oportunidade | Por que ninguém faz | Vantagem Oniefy |
|-------------|--------------------|--------------------|
| Patrimônio físico com custo de manutenção | Complexidade de modelagem | Motor ERP já existe como infraestrutura |
| Fiscal BR completo (IRPF) | Complexidade tributária brasileira | Motor fiscal já implementado |
| Solvência pessoal (métricas financeiras de empresa aplicadas a PF) | Conceito novo, requer formação financeira | Metodologia CFA pessoal documentada |
| Importação inteligente de faturas BR | Cada banco tem formato diferente | Análise de 6 bancos reais já feita |
| Assistente com personalidade (não chatbot genérico) | Requer investimento em design e identidade | Onie especificada com 6 estados emocionais |

---

## 8. Posicionamento Estratégico do Oniefy

O Oniefy não compete com Mobills/Organizze (massa, básico) nem com Kinvo/Investidor10 (só investimentos).

O Oniefy compete com **ninguém no Brasil** e com **Monarch + Origin no exterior** em termos de ambição, mas adiciona camadas que eles não têm:

```
Monarch/Origin:  Despesas + Investimentos + Orçamento + Net Worth
Oniefy:          Despesas + Investimentos + Orçamento + Net Worth
                 + Patrimônio Físico + Solvência + Fiscal/IRPF
                 + Análise Financeira + Assistente Inteligente
                 + Importação de Faturas BR + Registro Ultrarrápido
```

O diferencial não é uma feature. É a **profundidade combinada com inteligência contextual**. Nenhum concorrente entrega solvência + fiscal + patrimônio + assistente + importação inteligente num produto integrado.

---

## 9. Decisões Registradas

| # | Decisão | Data |
|---|---------|------|
| 1 | Nunca monetizar via afiliados de crédito (independência de recomendação) | 24/03/2026 |
| 2 | Zero anúncios por arquitetura de negócio | 24/03/2026 |
| 3 | Open Finance só quando motor de reconciliação estiver maduro | 24/03/2026 |
| 4 | Copilot é o benchmark visual (design excepcional) | 02/04/2026 |
| 5 | Monarch é o concorrente mais próximo em ambição | 02/04/2026 |
| 6 | Oniefy não tem concorrente direto no Brasil | 02/04/2026 |
| 7 | Complexidade fiscal BR + patrimônio físico + solvência são barreiras de entrada para concorrentes | 02/04/2026 |

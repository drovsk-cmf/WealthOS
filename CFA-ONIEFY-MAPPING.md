# CFA → Oniefy: Mapeamento Estratégico

> **Objetivo:** Transformar o Oniefy no "CFA pessoal" de cada assinante.
> **Base:** Currículo CFA Level I (Schweser Notes 2020, 57 Readings, 1.527 páginas) + Secret Sauce + QuickSheet.
> **Premissa regulatória:** Oniefy não dá conselho de investimento (CVM). Diagnostica, sinaliza riscos, educa. O "conselho" vem como perguntas provocativas e cenários, não como recomendações diretas.

---

## 1. Mapa Curricular CFA Level I

| # | Área | Peso | Readings | Aplicabilidade PF | Prioridade Oniefy |
|---|------|------|----------|-------------------|-------------------|
| 1 | Ethical & Professional Standards | 15% | R1-R5 | Baixa (institucional) | P3 - Educacional |
| 2 | Quantitative Methods | 10% | R6-R11 | Alta (TVM, estatística) | P1 - Core |
| 3 | Economics | 10% | R12-R18 | Média (inflação, câmbio, ciclos) | P2 - Contextual |
| 4 | Financial Reporting & Analysis | 15% | R19-R30 | Alta (ratios adaptados, DuPont pessoal) | P1 - Core |
| 5 | Corporate Finance | 10% | R31-R35 | Alta (capital budgeting pessoal, WACC de dívida, alavancagem) | P1 - Core |
| 6 | Equity Investments | 11% | R36-R41 | Média (valuations educacional) | P3 - Educacional |
| 7 | Fixed Income | 11% | R42-R47 | Alta (pricing de dívida pessoal, duration, custo efetivo) | P1 - Core |
| 8 | Derivatives | 6% | R48-R49 | Baixa (hedge educacional) | P3 - Futuro |
| 9 | Alternative Investments | 6% | R50 | Média (real estate, commodities como ativos) | P2 - Registro |
| 10 | Portfolio Management | 6% | R51-R57 | Alta (IPS pessoal, diversificação, risco) | P1 - Core |

---

## 2. Detalhamento por Área: Conceitos CFA → Features Oniefy

### 2.1 Quantitative Methods (Book 1, R6-R11)

| Conceito CFA | Fórmula/Framework | Tradução Pessoa Física | Feature Oniefy | Status |
|---|---|---|---|---|
| **Time Value of Money** | FV = PV(1+r)^n, PV = FV/(1+r)^n | "R$ 10.000 hoje valem mais que R$ 10.000 daqui a 5 anos." Projeção de patrimônio futuro, custo real de parcelas | Calculadora TVM integrada. Projeção de patrimônio com taxa real (descontada IPCA) | Novo |
| **Annuities (PMT)** | PV/FV de anuidades ordinárias e antecipadas | Valor presente de parcelas de financiamento. "Quanto realmente custa esse parcelamento em 48x?" | Custo efetivo total (CET) de financiamentos. Input: parcela, prazo, entrada. Output: CET real vs CDI | Novo |
| **Perpetuities** | PV = PMT/r | "Se você precisa de R$ 5.000/mês para sempre, precisa acumular R$ X a Y% real." | Calculadora de independência financeira (patrimônio alvo = despesa mensal / taxa real) | Novo |
| **EAR (Effective Annual Rate)** | EAR = (1 + i/m)^m - 1 | Taxa efetiva real de empréstimos, cartão, cheque especial. Bancos anunciam taxa nominal; o CFA ensina a calcular a efetiva | Comparador de custo de dívida: input = taxa anunciada + periodicidade → output = EAR + custo total | Novo |
| **Holding Period Return** | HPR = (P1 - P0 + D) / P0 | Retorno real do patrimônio mês a mês, incluindo valorização + rendimentos | Já existe parcialmente (variação patrimonial). Falta: HPR por ativo individual e consolidado | Parcial |
| **Coefficient of Variation** | CV = σ/média | Dispersão relativa: "Sua renda varia muito?" (CLT+PJ). Quanto maior o CV, maior a necessidade de reserva | Insight automático: calcular CV da renda dos últimos 6-12 meses. Se CV > 0.3 → nudge de reserva maior | Novo |
| **Probabilidade e Distribuição Normal** | μ ± 1σ = 68%, ± 2σ = 95% | Faixa provável de despesas do próximo mês. "Com 95% de confiança, suas despesas ficarão entre R$ X e R$ Y" | Projeção estatística de gastos baseada no histórico (média ± 2σ) | Futuro |

### 2.2 Economics (Book 2, R12-R18)

| Conceito CFA | Tradução Pessoa Física | Feature Oniefy | Status |
|---|---|---|---|
| **Inflação (CPI/IPCA)** | Erosão do poder de compra. "Seu patrimônio cresceu 8%, mas a inflação foi 5%. Ganho real: 2,9%." | Retorno real = (1+nominal)/(1+IPCA) - 1. Aplicar em toda variação patrimonial | Parcial (tracking IPCA existe) |
| **Taxa de juros real vs nominal** | Fisher: (1+r_nominal) = (1+r_real)(1+inflação) | "Seu financiamento custa CDI+2%, mas descontando inflação o custo real é X%" | Insight: custo real de cada dívida vs retorno real de cada ativo |
| **Ciclos econômicos** | Expansão → Pico → Contração → Vale | Contextualização macro: "O Brasil está em fase de X. Historicamente, isso significa Y para renda fixa/imóveis" | Indicador macro no dashboard (Selic, IPCA, câmbio) com nota contextual | Futuro |
| **Política monetária (Selic)** | Taxa Selic como âncora de todas as decisões | "Selic a X% a.a. significa CDI de ~X%. Seu custo de dívida está acima ou abaixo?" | Benchmark CDI já implementado via tracking de índices. Falta: comparação automática dívida vs CDI | Parcial |
| **Câmbio** | Impacto em patrimônio dolarizado e viagens | Conversão de ativos em moeda estrangeira para BRL usando câmbio atualizado | Futuro (multi-moeda fora do MVP) |

### 2.3 Financial Reporting & Analysis (Book 3, R19-R30)

**Esta é a área de maior densidade para o Oniefy.** O CFA ensina a analisar empresas; o Oniefy aplica os mesmos frameworks para a "empresa pessoal" do usuário.

| Conceito CFA (Corporativo) | Equivalente Pessoa Física | Fórmula Adaptada | Feature Oniefy | Status |
|---|---|---|---|---|
| **Income Statement (DRE)** | Receitas vs Despesas mensais | Receita total - Despesas totais = Resultado do mês | Dashboard DASH-01/02 | Implementado |
| **Balance Sheet** | Balanço patrimonial pessoal: Ativos - Passivos = Patrimônio Líquido | Contas + Ativos - Dívidas = PL | Solvency Panel + Balance Sheet Card | Implementado |
| **Cash Flow Statement** | Fluxo de caixa pessoal: operacional (salário - contas), investimento (aportes), financiamento (parcelas) | Separação por tipo de fluxo | Parcial (transações existem, classificação por fluxo não) | Novo |
| **Common-Size Analysis** | "Alimentação = 32% da despesa total", "Moradia = 28%" | despesa_categoria / despesa_total × 100 | Top Categories Card (percentual por categoria) | Implementado |
| **Horizontal Analysis** | Variação mês a mês: "Despesas com transporte cresceram 15% vs mês anterior" | (valor_atual - valor_anterior) / valor_anterior | Insight de tendência (Tipo 3 do framework nudge) | Novo |
| **Liquidity Ratios** | Liquidez pessoal: capacidade de pagar obrigações de curto prazo | Ativos líquidos / Despesas mensais = Meses de runway | LCR no Solvency Panel | Implementado |
| **DuPont Analysis (3 fatores)** | Decomposição da "eficiência financeira pessoal" | Taxa de poupança × Retorno dos ativos × Alavancagem patrimonial | DuPont Pessoal: (Poupança/Renda) × (Renda/Ativos) × (Ativos/PL) | Novo |
| **Debt-to-Equity** | Alavancagem pessoal | Dívidas totais / Patrimônio líquido | Calculável com dados existentes. Falta: exibição como métrica | Novo |
| **Interest Coverage** | Capacidade de pagar juros das dívidas | Renda líquida / Despesas com juros | Calculável. Requer classificação de juros nas transações | Novo |
| **Depreciation** | Depreciação de ativos (veículos, equipamentos) | Custo - Valor residual / Vida útil | Assets já tem campo de depreciação. Falta: cálculo automático | Parcial |
| **Warning Signs (R29)** | Sinais de alerta na "saúde financeira" pessoal | Burn rate crescente, runway decrescente, dívida/PL crescente | Alertas automáticos baseados em tendências de 3+ meses | Novo |

### 2.4 Corporate Finance (Book 4, R31-R35)

| Conceito CFA | Tradução Pessoa Física | Fórmula | Feature Oniefy | Status |
|---|---|---|---|---|
| **NPV (Net Present Value)** | "Vale a pena comprar esse imóvel?" Comparar custo total de compra vs aluguel em VPL | NPV = Σ CF_t/(1+r)^t | Simulador comprar vs alugar. Inputs: preço, entrada, taxa, aluguel equivalente, valorização estimada | Novo |
| **IRR (Internal Rate of Return)** | Taxa interna de retorno de um investimento imobiliário ou negócio | Taxa que zera o NPV | Complemento do simulador acima | Novo |
| **WACC** | Custo médio ponderado da dívida pessoal | Σ (peso_i × taxa_i) para cada dívida | "Seu custo médio de dívida é X% a.a." Comparar com CDI para saber se vale quitar ou investir | Novo |
| **Capital Budgeting** | Decisões de investimento pessoal: trocar de carro? Reformar? Abrir PJ? | NPV + payback period | Calculadora de decisão: "Em quanto tempo essa decisão se paga?" | Futuro |
| **Leverage (DOL, DFL)** | Alavancagem pessoal: quanto da renda é fixa vs variável, quanto das despesas é fixa vs variável | Despesas fixas / Despesas totais (operational leverage pessoal) | Insight: "X% das suas despesas são fixas. Isso reduz sua flexibilidade em momentos de queda de renda" | Novo |
| **Working Capital** | Capital de giro pessoal: dinheiro disponível para o dia a dia | Ativos correntes (contas checking/savings) - Passivos correntes (contas a pagar do mês) | Calculável com dados existentes | Novo |
| **Breakeven** | Ponto de equilíbrio pessoal: "Quanto preciso ganhar por mês para cobrir custos fixos?" | Despesas fixas / (1 - % despesas variáveis) | Insight útil para freelancers/PJ | Novo |

### 2.5 Fixed Income (Book 4, R42-R47)

| Conceito CFA | Tradução Pessoa Física | Feature Oniefy | Status |
|---|---|---|---|
| **Bond Pricing (YTM)** | Custo efetivo de financiamentos (imóvel, veículo, consignado). O banco diz "1,2% a.m."; qual o custo efetivo com IOF, TAC, seguros? | Calculadora CET: parcela × n - principal = custo total → converter para taxa efetiva | Novo |
| **Duration** | Sensibilidade das dívidas a mudanças na Selic. "Se Selic subir 1 p.p., quanto muda sua parcela de financiamento pós-fixado?" | Classificação de dívidas: pré-fixada (imune) vs pós-fixada (sensível) vs indexada IPCA | Novo |
| **Amortization (SAC vs Price)** | Diferença entre SAC e Price no financiamento imobiliário. "SAC: parcela decresce, total de juros menor. Price: parcela fixa, total de juros maior" | Simulador SAC vs Price com gráfico comparativo | Novo |
| **Yield Spread** | Spread da dívida pessoal sobre CDI. "Seu financiamento custa CDI+3%. Isso é bom ou ruim?" | Benchmark automático: comparar spread de cada dívida com médias do mercado (via BCB SGS) | Futuro |
| **Credit Analysis (4 Cs)** | Auto-avaliação de crédito pessoal: Capacity (renda vs dívida), Collateral (garantias), Covenants (restrições), Character (histórico) | "Score de crédito Oniefy" baseado nos 4 Cs calculados com dados reais | Futuro |
| **Reinvestment Risk** | Risco de reinvestimento quando CDB/LCI vence e Selic caiu | Alerta: "Seu CDB de R$ X vence em Y dias. A taxa atual é Z%, vs W% quando você aplicou" | Futuro |

### 2.6 Portfolio Management (Book 5, R51-R57)

**Esta é a área que define o "CFA pessoal" como conceito.**

| Conceito CFA | Tradução Pessoa Física | Feature Oniefy | Status |
|---|---|---|---|
| **Investment Policy Statement (IPS)** | Política de investimento pessoal: objetivos, tolerância a risco, horizonte, restrições | Onboarding expandido: perfil de risco, horizonte de objetivos, restrições (liquidez, fiscal) | Futuro |
| **Return Objectives** | "Preciso de retorno real de X% para atingir meu objetivo em Y anos" | Calculadora: patrimônio alvo + prazo → retorno real necessário → compatível com perfil de risco? | Novo |
| **Risk Tolerance** | Capacidade vs disposição de assumir risco. Alta renda + patrimônio baixo = alta capacidade mas talvez baixa disposição | Assessment de perfil de risco baseado em dados reais (não questionário genérico) | Futuro |
| **Markowitz / Diversificação** | Concentração patrimonial como risco. "78% em imóvel = risco de concentração" | Índice de concentração patrimonial (Herfindahl simplificado: Σ peso_i²) | Novo |
| **CAPM / Beta** | Sensibilidade do patrimônio a fatores macro (Selic, IPCA, câmbio) | Versão simplificada: "Seu patrimônio tem X% em renda fixa (sensível a Selic) e Y% em imóveis (sensível a crédito)" | Futuro |
| **Sharpe Ratio** | Retorno ajustado ao risco: "Seu patrimônio rendeu 12%, mas com volatilidade de 8%. O Sharpe é 0.75" | (Retorno patrimônio - CDI) / Volatilidade do patrimônio | Futuro (requer série histórica) |
| **Risk Management (R55)** | Identificação e mitigação de riscos pessoais: perda de emprego, doença, acidente, morte | Mapa de riscos pessoal: gap de seguros, reserva vs runway, dependência de fonte de renda | Novo |
| **Technical Analysis (R56)** | Padrões em gastos pessoais: sazonalidade (Natal, férias, IPVA/IPTU) | Detecção de sazonalidade e alertas proativos: "Historicamente, janeiro custa 30% mais que a média" | Futuro |

---

## 3. Priorização: O que implementar primeiro

### Fase 1 - Diagnóstico (dados que já existem no banco)

Features que usam dados já coletados, sem input adicional do usuário:

| Feature | Conceitos CFA | Dados necessários | Complexidade |
|---|---|---|---|
| Taxa de poupança | FRA (common-size) | receitas e despesas do mês | Baixa (RPC) |
| Concentração patrimonial | Portfolio Mgmt (Markowitz) | assets por tipo | Baixa (RPC) |
| Custo médio de dívida (WACC pessoal) | Corp Finance (WACC) | recorrências de dívida + taxas | Média (campo de taxa em recurrences) |
| Tendência de despesas por categoria | FRA (horizontal analysis) | transações dos últimos 3 meses | Baixa (RPC) |
| DuPont Pessoal simplificado | FRA (DuPont) | renda, despesa, ativos, PL | Média (RPC composto) |
| Warning Signs | FRA (R29) | runway decrescente, burn rate crescente | Baixa (já tem dados) |

### Fase 2 - Calculadoras (input do usuário + cálculos CFA)

| Feature | Conceitos CFA | Input necessário | Complexidade |
|---|---|---|---|
| Independência financeira | QM (perpetuity) | despesa mensal alvo + retorno real estimado | Baixa (front-end only) |
| Comprar vs Alugar | Corp Finance (NPV) | preço, entrada, taxa, aluguel, valorização | Média (front-end + lógica TVM) |
| CET de financiamento | Fixed Income (YTM) | parcela, prazo, principal, taxas | Média |
| SAC vs Price | Fixed Income (amortization) | valor, taxa, prazo | Média |

### Fase 3 - Inteligência ativa (o "CFA falando")

| Feature | Conceitos CFA | Infraestrutura necessária | Complexidade |
|---|---|---|---|
| Insights automáticos no dashboard | Múltiplos | RPC de análise + componente de exibição | Alta |
| Benchmark pessoal vs médias | Economics + FRA | Dados BCB/IBGE + cálculos comparativos | Alta |
| Mapa de riscos pessoal | Portfolio Mgmt (R55) | Assessment de riscos + gap analysis | Alta |
| IPS pessoal | Portfolio Mgmt (R51) | Onboarding expandido com perfil de risco | Alta |

---

## 4. Fórmulas-Chave para Implementação (do QuickSheet)

```
# Valor Futuro
FV = PV × (1 + r)^n

# Valor Presente
PV = FV / (1 + r)^n

# Perpetuidade (Independência Financeira)
PV = PMT / r
→ Patrimônio alvo = Despesa mensal × 12 / taxa_real_anual

# Taxa Efetiva Anual
EAR = (1 + i/m)^m - 1

# Retorno Real (Fisher)
r_real = (1 + r_nominal) / (1 + inflação) - 1

# Holding Period Return
HPR = (P1 - P0 + D) / P0

# Coefficient of Variation
CV = σ / μ

# DuPont Pessoal
Eficiência = (Poupança/Renda) × (Renda/Ativos) × (Ativos/PL)

# Concentração (Herfindahl simplificado)
HHI = Σ (peso_i)²
→ HHI = 1.0 = concentração total (1 ativo)
→ HHI < 0.25 = boa diversificação

# WACC Pessoal (custo médio de dívida)
WACC = Σ (saldo_i / saldo_total) × taxa_i

# Runway
Runway (meses) = Ativos líquidos / Burn rate mensal

# Taxa de Poupança
Savings Rate = (Receitas - Despesas) / Receitas × 100

# Working Capital Pessoal
WC = Ativos líquidos - Passivos de curto prazo (< 30 dias)

# Debt-to-Equity Pessoal
D/E = Dívidas totais / Patrimônio líquido
```

---

## 5. Princípios de Design para o "CFA Pessoal"

1. **Diagnóstico, não prescrição.** "Seu custo de dívida é CDI+4,2%" (fato). Nunca: "Renegocie sua dívida" (conselho).

2. **Dados concretos, não adjetivos.** "Runway de 4,2 meses" (número). Nunca: "Sua reserva é insuficiente" (julgamento).

3. **Comparação como educação.** "Sua taxa de poupança é 22%. A média brasileira para sua faixa de renda é 12%." O usuário tira a conclusão.

4. **Perguntas provocativas.** "Se sua renda PJ parasse amanhã, quantos meses a reserva cobre?" (o cálculo já está feito; a pergunta dá contexto).

5. **Progressividade.** Fase 1 mostra dados que o usuário já tem. Fase 2 pede inputs pontuais. Fase 3 conecta tudo em narrativa inteligente.

6. **Linguagem financeira profissional.** Solvência, liquidez, alavancagem, runway, burn rate. Termos que diferenciam o Oniefy de expense trackers ("onde gastei?") e posicionam como wealth management ("para onde estou indo?").

---

*Documento gerado em 23/03/2026. Base: CFA Level I Schweser Notes 2020 (Books 1-5, 1.527 págs) + Secret Sauce 2019 (243 págs) + QuickSheet 2020 (6 págs).*

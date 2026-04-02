# ONIEFY - Módulo de Investimentos: Especificação Completa

## Documento de Referência

**Data de criação:** 02 de Abril de 2026
**Status:** Em discussão (não implementar até fechar redesign conceitual)
**Zona mental:** 7 - Investimentos (solidez, riqueza)
**Dependência externa:** B3 API (passos 1-4 executáveis imediatamente pelo Claudio)

---

## 1. Visão Geral

O módulo de investimentos consolida todo o patrimônio investido do usuário em uma única tela, com atualização automática diária. O usuário cadastra suas posições uma vez; o app atualiza cotações, índices e cotas automaticamente.

### 1.1 Princípios

- **Usuário cadastra, app atualiza.** O esforço inicial é do usuário (informar o que possui). A partir daí, a atualização é 100% automática para a maioria dos tipos.
- **Múltiplas fontes com fallback.** Nenhum tipo de investimento depende de fonte única. Se a fonte primária falhar, o sistema tenta a próxima na cascata.
- **Modelo híbrido progressivo.** Hoje: cadastro manual + cotações públicas. Futuro: B3 API + Open Finance substituem o cadastro manual. A arquitetura é a mesma; muda apenas a fonte.
- **Reserva de emergência como card fixo.** O usuário marca quais investimentos compõem a reserva. O app exibe separadamente com destaque.

### 1.2 Experiência do Usuário

**Onboarding:**
```
Onie: "Vamos cadastrar seus investimentos. O que você tem?"

[Cards visuais para selecionar:]
□ Ações / FIIs / ETFs
□ Tesouro Direto
□ CDB / LCI / LCA
□ Fundos de investimento
□ Criptomoedas
□ Previdência privada
□ Poupança
□ Investimentos no exterior
□ Consórcio

Usuário seleciona → formulário específico para cada tipo → próximo.

Ao final: "Encontrei cotações para 12 dos seus 15 investimentos.
Patrimônio total: R$ 487.320. Atualizo automaticamente todo dia."
```

**Dia a dia:** o usuário abre o app e vê patrimônio atualizado com dados do dia anterior. Sem ação necessária.

**Quando B3 API estiver disponível:** "Conecte sua conta B3 para importar tudo automaticamente." Um toque, autorização na B3, posição completa importada.

---

## 2. Cadastro pelo Usuário (por tipo de investimento)

### 2.1 Renda Variável (Ações, FIIs, ETFs, BDRs)

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Ticker | TEXT (autocomplete) | Sim | PETR4, HGLG11, BOVA11, AAPL34 |
| Quantidade | NUMERIC(14,6) | Sim | 100, 2.47 (fracionário) |
| Preço médio de aquisição | NUMERIC(14,2) | Sim | R$ 28,50 |
| Corretora | SELECT (lista) | Sim | BTG, XP, Nubank, Inter |
| É reserva de emergência? | BOOLEAN | Não | false |

**Autocomplete de ticker:** busca no cadastro de ativos da B3 (Brapi fornece lista completa). Ao digitar "PETR", mostra PETR3 e PETR4 com nome completo ("Petrobras PN N2").

**Ao cadastrar:** o app imediatamente busca a cotação atual e mostra: "PETR4: R$ 30,81 × 100 = R$ 3.081,00 (ganho de R$ 231,00 / +8,1%)".

### 2.2 Criptomoedas

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Moeda | TEXT (autocomplete) | Sim | BTC, ETH, SOL, ADA |
| Quantidade | NUMERIC(18,8) | Sim | 0,25000000 |
| Preço médio de aquisição (BRL) | NUMERIC(14,2) | Sim | R$ 350.000,00 |
| Exchange/custódia | TEXT | Sim | Binance, Mercado Bitcoin, carteira própria |
| É reserva de emergência? | BOOLEAN | Não | false |

**Quantidade com 8 casas decimais:** padrão Bitcoin (satoshis). Necessário para quem tem frações pequenas.

### 2.3 Tesouro Direto

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Título | SELECT (lista atualizada) | Sim | Tesouro Selic 2029, Tesouro IPCA+ 2035, Tesouro Prefixado 2027 |
| Quantidade de títulos | NUMERIC(8,2) | Sim | 2,47 |
| Valor investido | NUMERIC(14,2) | Sim | R$ 15.000,00 |
| Data da compra | DATE | Sim | 15/03/2024 |
| Corretora | SELECT (lista) | Sim | BTG, XP, Nubank |
| É reserva de emergência? | BOOLEAN | Não | true (Tesouro Selic é comum como reserva) |

**Lista de títulos:** atualizada automaticamente via API pública do Tesouro Direto. Mostra apenas títulos vigentes (disponíveis para compra ou em custódia).

### 2.4 CDB / LCI / LCA

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Tipo | SELECT | Sim | CDB, LCI, LCA |
| Banco emissor | TEXT (autocomplete) | Sim | Nubank, BTG, Inter, C6, Daycoval |
| Tipo de rentabilidade | SELECT | Sim | Pós-fixado (% CDI), Prefixado (% a.a.), IPCA+ |
| Taxa contratada | NUMERIC(7,4) | Sim | 110 (para 110% CDI), 14.00 (para 14% a.a.), 6.50 (para IPCA+6,5%) |
| Valor aplicado | NUMERIC(14,2) | Sim | R$ 50.000,00 |
| Data da aplicação | DATE | Sim | 01/02/2025 |
| Vencimento | DATE | Sim | 01/02/2028 |
| Liquidez | SELECT | Sim | Diária, No vencimento |
| É reserva de emergência? | BOOLEAN | Não | true (CDB liquidez diária é comum como reserva) |

### 2.5 Fundos de Investimento

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Nome ou CNPJ do fundo | TEXT (busca CVM) | Sim | "Itaú Personnalité RF" ou 12.345.678/0001-90 |
| Quantidade de cotas | NUMERIC(14,6) | Sim | 1.523,456789 |
| Valor investido | NUMERIC(14,2) | Sim | R$ 25.000,00 |
| Data da aplicação | DATE | Sim | 10/06/2024 |
| Corretora/banco | SELECT | Sim | BTG, XP, Itaú |
| É reserva de emergência? | BOOLEAN | Não | false |

**Busca de fundos:** consulta o cadastro CVM por nome ou CNPJ. Retorna nome completo, tipo (RF, Multimercado, Ações, Cambial), CNPJ, gestora.

### 2.6 Previdência Privada (PGBL / VGBL)

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Tipo | SELECT | Sim | PGBL, VGBL |
| Seguradora | TEXT | Sim | Brasilprev, Icatu, SulAmérica, Porto |
| Nome do plano/fundo | TEXT | Não | "Brasilprev Top Ações FI" |
| Saldo atual | NUMERIC(14,2) | Sim | R$ 145.320,00 |
| Contribuição mensal | NUMERIC(14,2) | Não | R$ 2.000,00 |
| Data da última atualização | DATE | Auto | Data do cadastro |
| Regime tributário | SELECT | Não | Progressivo, Regressivo |

**Atualização manual mensal.** A Onie lembra: "Atualize o saldo da sua previdência [seguradora]." O usuário digita o novo saldo ou tira foto do extrato.

### 2.7 Poupança

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Banco | SELECT | Sim | Caixa, BB, Itaú, Bradesco |
| Saldo atual | NUMERIC(14,2) | Sim | R$ 20.000,00 |
| Data de aniversário | SELECT (dia 1-28) | Sim | Dia 15 |

**Atualização automática** via cálculo com TR (BCB/SGS) no dia de aniversário.

### 2.8 Investimentos no Exterior

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Ativo | TEXT (autocomplete) | Sim | AAPL, MSFT, VOO, QQQ |
| Moeda | SELECT | Sim | USD, EUR, GBP |
| Quantidade | NUMERIC(14,6) | Sim | 50 |
| Preço médio (moeda original) | NUMERIC(14,2) | Sim | US$ 175,00 |
| Corretora/plataforma | TEXT | Sim | Avenue, Nomad, Interactive Brokers |

**Atualização:** cotação do ativo (Yahoo Finance) × câmbio do dia (BCB/SGS).

### 2.9 Consórcio

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Administradora | TEXT | Sim | Porto, Rodobens, Embracon |
| Tipo de bem | SELECT | Sim | Imóvel, Veículo, Serviço |
| Valor da carta de crédito | NUMERIC(14,2) | Sim | R$ 300.000,00 |
| Parcela mensal | NUMERIC(14,2) | Sim | R$ 2.500,00 |
| Parcelas pagas | INTEGER | Sim | 24 |
| Total de parcelas | INTEGER | Sim | 180 |
| Contemplado? | BOOLEAN | Sim | Não |

**Atualização:** apenas calendário de parcelas. A Onie calcula: "Você já pagou R$ 60.000 de R$ 450.000 total. Faltam 156 parcelas."

---

## 3. Atualização Automática (como o app atualiza cada tipo)

### 3.1 Renda Variável (Ações, FIIs, ETFs, BDRs)

**Cron:** `update_equities` - diário, 19:00 BRT (após fechamento B3, apenas dias úteis)

**Cálculo:**
```
valor_atual = quantidade × cotação_fechamento
rentabilidade = (valor_atual - (quantidade × preço_médio)) / (quantidade × preço_médio)
```

**Fontes (cascata):**
```
1. Brapi (brapi.dev) - 15.000 req/mês
   → falhou?
2. Yahoo Finance (sufixo .SA) - sem limite formal
   → falhou?
3. Alpha Vantage - 500 req/dia (free)
   → falhou?
4. Mantém última cotação + alerta à Onie
```

### 3.2 Criptomoedas

**Cron:** `update_crypto` - diário, 20:00 BRT

**Cálculo:**
```
cotação_brl = cotação_usdt × câmbio_usd_brl
valor_atual = quantidade × cotação_brl
```

**Fontes (cascata):**
```
1. Binance API (endpoint público /ticker/24hr) - 1.200 req/min, sem autenticação
   Uma única chamada retorna todas as moedas simultaneamente.
   Cotações em USDT; converter para BRL via par BTCBRL ou câmbio BCB.
   → falhou?
2. CryptoCompare - 100.000 chamadas/mês (free, API key gratuita)
   → falhou?
3. CoinGecko - 30 req/min (~10.000/mês)
   → falhou?
4. CoinPaprika - 25.000 chamadas/mês (free)
   → falhou?
5. Mantém última cotação + alerta à Onie
```

**Nota sobre Binance:** endpoint público não requer conta nem API key. Uma chamada retorna preço de todos os pares. Para o cron diário (1 chamada/dia), o limite é virtualmente infinito.

### 3.3 Tesouro Direto

**Cron:** `update_treasury` - diário, 20:00 BRT (dados publicados ~18h, apenas dias úteis)

**Cálculo:**
```
valor_atual = quantidade_títulos × PU_venda (preço unitário de venda do dia)
```

O PU já incorpora marcação a mercado automaticamente. Se o usuário quiser saber quanto recebe no vencimento, é outro cálculo (valor na curva).

**Fontes (cascata):**
```
1. API pública do Tesouro Direto (tesourodireto.com.br) - sem limite
   Publica preços de compra e venda de todos os títulos vigentes.
   → falhou?
2. BCB/SGS (taxa Selic, série 11) - sem limite
   Usado para calcular na curva (Tesouro Selic).
   → falhou?
3. Mantém última cotação + alerta à Onie
```

### 3.4 CDB / LCI / LCA Pós-fixado (% do CDI)

**Cron:** `update_fixed_income_cdi` - diário, 20:00 BRT (CDI publicado ~18h, apenas dias úteis)

**Cálculo:**
```
// Acumula fatores diários do CDI desde a data de aplicação
fator_cdi_acumulado = Π (1 + cdi_diario) para cada dia útil desde data_aplicação
valor_atual = valor_aplicado × (1 + fator_cdi_acumulado × taxa_contratada / 100)

// Exemplo: CDB 110% CDI, aplicado R$ 10.000 há 6 meses
// fator_cdi_acumulado = produto dos ~126 fatores diários
// valor_atual = 10.000 × (1 + fator × 1,10)
```

**Fontes (cascata):**
```
1. BCB/SGS série 12 (CDI diário) - sem limite, fonte oficial
   → falhou?
2. BCB/SGS série 4391 (CDI acumulado mensal) - sem limite
   Alternativa com menor granularidade.
   → falhou?
3. Mantém último fator acumulado + alerta à Onie
```

### 3.5 CDB / LCI / LCA Prefixado

**Cron:** `update_fixed_income_pre` - diário, 20:00 BRT

**Duas visões disponíveis:**

```
1. Na curva (default - o que o usuário recebe se segurar até o vencimento):
   valor_atual = valor_aplicado × (1 + taxa_anual)^(dias_úteis_decorridos / 252)

2. Marcação a mercado (estimativa):
   Recalcula usando curva de juros ANBIMA do dia.
   Disclaimer: "Valor estimado. O valor real de resgate antecipado pode diferir."
```

**Fontes para marcação a mercado (cascata):**
```
1. ANBIMA (curva de juros prefixados) - cadastro gratuito para uso não comercial
   → falhou?
2. Cálculo na curva (sempre funciona, é determinístico)
```

### 3.6 CDB / LCI / LCA IPCA+

**Cron:** `update_fixed_income_ipca` - quando IBGE publicar (geralmente dia ~10 de cada mês)

**Cálculo:**
```
valor_atual = valor_aplicado × (1 + IPCA_acumulado_período) × (1 + taxa_real)^(dias_úteis / 252)

// IPCA acumulado: produto dos fatores mensais do IPCA desde a aplicação
// Taxa real: a parte fixa contratada (ex: 6,5% a.a.)
```

**Fontes (cascata):**
```
1. BCB/SGS série 433 (IPCA mensal) - sem limite, fonte oficial
   → falhou?
2. IBGE/SIDRA API (fonte primária original do IPCA) - sem limite
   → falhou?
3. Mantém último índice acumulado + alerta à Onie
```

**Entre publicações mensais do IPCA:** o app usa o IPCA projetado (BCB Focus) ou simplesmente mantém o último acumulado e atualiza quando o novo número sair.

### 3.7 Fundos de Investimento

**Cron:** `update_funds` - diário, 22:00 BRT (dados CVM com delay de 1-3 dias úteis)

**Cálculo:**
```
valor_atual = quantidade_cotas × valor_cota_dia
```

**Fontes (cascata):**
```
1. CVM dados abertos (consulta por CNPJ do fundo) - sem limite
   Delay de 1-3 dias úteis na publicação da cota.
   → falhou?
2. Mais Retorno API (agregador de fundos brasileiro) - a verificar limites
   → falhou?
3. Mantém última cota + alerta à Onie
```

### 3.8 Previdência Privada (PGBL / VGBL)

**Sem atualização automática.** Não existe API pública padronizada para saldos de previdência.

**Cron:** `remind_manual_update` - dia 1 de cada mês

```
Onie: "Qual o saldo atual da sua previdência [seguradora]?"
→ Usuário digita o valor
→ OU tira foto do app da seguradora (OCR extrai saldo)
→ OU compartilha screenshot via Share Extension
```

### 3.9 Poupança

**Cron:** `update_savings` - no dia de aniversário de cada poupança cadastrada

**Cálculo:**
```
Se Selic > 8,5% a.a.:
  rendimento_mensal = 0,5% + TR do mês
Se Selic ≤ 8,5% a.a.:
  rendimento_mensal = 70% da Selic mensal + TR do mês

valor_atual = saldo_anterior × (1 + rendimento_mensal)
```

**Fontes (cascata):**
```
1. BCB/SGS série 226 (TR diária) - sem limite, fonte oficial
   → falhou?
2. Estimativa pela Selic vigente (cálculo determinístico)
   → sempre funciona
```

### 3.10 Investimentos no Exterior

**Cron:** `update_foreign` - diário, 20:00 BRT (apenas dias úteis)

**Cálculo:**
```
cotação_moeda_original = preço do ativo na bolsa estrangeira
câmbio = taxa de conversão da moeda para BRL
valor_brl = quantidade × cotação_moeda_original × câmbio
```

**Fontes para cotação do ativo (cascata):**
```
1. Yahoo Finance (AAPL, MSFT, VOO, etc.) - sem limite formal
   → falhou?
2. Alpha Vantage - 500 req/dia (free)
   → falhou?
3. Twelve Data - 800 req/dia (free)
   → falhou?
4. Mantém última cotação + alerta à Onie
```

**Fontes para câmbio (cascata):**
```
1. BCB/SGS série 1 (PTAX USD/BRL) - sem limite, fonte oficial
   Para EUR: série 21619. Para GBP: série 21623.
   → falhou?
2. Yahoo Finance (USDBRL=X, EURBRL=X) - sem limite formal
   → falhou?
3. Brapi (endpoint de câmbio) - 15.000 req/mês
   → falhou?
4. Mantém última taxa + alerta à Onie
```

### 3.11 Consórcio

**Sem atualização automática de valor.** O app atualiza apenas o calendário de parcelas.

A Onie pode calcular e exibir:
- Total já pago: `parcelas_pagas × parcela_mensal`
- Total a pagar: `(total_parcelas - parcelas_pagas) × parcela_mensal`
- Percentual do contrato quitado: `parcelas_pagas / total_parcelas × 100`

---

## 4. Tabela Consolidada de Crons

| Cron | Horário | Frequência | O que atualiza | Fonte primária |
|------|---------|-----------|---------------|---------------|
| `update_equities` | 19:00 BRT | Dias úteis | Ações, FIIs, ETFs, BDRs | Brapi |
| `update_crypto` | 20:00 BRT | Diário | Criptomoedas | Binance API |
| `update_treasury` | 20:00 BRT | Dias úteis | Tesouro Direto | API Tesouro Direto |
| `update_fixed_income_cdi` | 20:00 BRT | Dias úteis | CDB/LCI/LCA pós (% CDI) | BCB/SGS série 12 |
| `update_fixed_income_pre` | 20:00 BRT | Dias úteis | CDB/LCI/LCA prefixado | Cálculo na curva + ANBIMA |
| `update_fixed_income_ipca` | ~Dia 10/mês | Mensal | CDB/LCI/LCA IPCA+ | BCB/SGS série 433 |
| `update_funds` | 22:00 BRT | Dias úteis | Fundos de investimento | CVM dados abertos |
| `update_savings` | Dia de aniversário | Mensal | Poupança | BCB/SGS série 226 (TR) |
| `update_foreign` | 20:00 BRT | Dias úteis | Investimentos no exterior | Yahoo Finance + BCB câmbio |
| `remind_manual_update` | 09:00 BRT, dia 1 | Mensal | Previdência, consórcio | Notificação ao usuário |

---

## 5. Fontes de Dados: Catálogo Completo

### 5.1 APIs de Cotação de Renda Variável

| Fonte | URL | Cobertura | Limite gratuito | Auth |
|-------|-----|-----------|----------------|------|
| Brapi | brapi.dev | Ações, FIIs, ETFs, BDRs da B3 | 15.000 req/mês | API key gratuita |
| Yahoo Finance | via yfinance ou query2.finance.yahoo.com | Global + B3 (sufixo .SA) | Sem limite formal (rate limit) | Sem auth |
| Alpha Vantage | alphavantage.co | Global + B3 | 500 req/dia | API key gratuita |

### 5.2 APIs de Cotação de Criptomoedas

| Fonte | URL | Cobertura | Limite gratuito | Auth |
|-------|-----|-----------|----------------|------|
| Binance | data-api.binance.vision | Todos os pares Binance | 1.200 req/min (por IP) | Sem auth (público) |
| CryptoCompare | min-api.cryptocompare.com | 7.000+ moedas | 100.000 chamadas/mês | API key gratuita |
| CoinGecko | api.coingecko.com | 14.000+ moedas | 30 req/min (~10.000/mês) | Sem auth (demo) |
| CoinPaprika | api.coinpaprika.com | 50.000+ ativos | 25.000 chamadas/mês | Sem auth |

### 5.3 APIs de Índices Econômicos (BCB/SGS)

| Série | Índice | Uso |
|-------|--------|-----|
| 12 | CDI diário | CDB/LCI/LCA pós-fixado |
| 4391 | CDI acumulado mensal | Fallback do CDI diário |
| 11 | Taxa Selic (meta) | Tesouro Selic, referência geral |
| 1178 | Fator acumulado Selic | Cálculo de Tesouro Selic |
| 433 | IPCA mensal | CDB/LCI/LCA IPCA+, Tesouro IPCA+ |
| 226 | TR diária | Poupança |
| 1 | PTAX USD/BRL (venda) | Câmbio para investimentos no exterior |
| 21619 | PTAX EUR/BRL | Câmbio EUR |
| 21623 | PTAX GBP/BRL | Câmbio GBP |
| 13522 | IGPM mensal | Referência para reajustes |

**URL padrão:** `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{serie}/dados?formato=json`

### 5.4 APIs de Renda Fixa e Fundos

| Fonte | Cobertura | Limite | Auth |
|-------|-----------|--------|------|
| API Tesouro Direto | Preços de compra/venda de títulos públicos | Sem limite | Sem auth |
| CVM dados abertos | Cotas de fundos abertos (CNPJ) | Sem limite (delay 1-3 dias) | Sem auth |
| ANBIMA | Curvas de juros, preços indicativos de debêntures | Cadastro gratuito (uso não comercial) | Cadastro |
| B3 Market Data | Preços de referência de renda fixa | A verificar | Cadastro |
| Mais Retorno | Agregador de fundos brasileiro | A verificar | A verificar |

### 5.5 APIs de Ativos no Exterior

| Fonte | Cobertura | Limite | Auth |
|-------|-----------|--------|------|
| Yahoo Finance | Ações, ETFs, bonds globais | Sem limite formal | Sem auth |
| Alpha Vantage | Global | 500 req/dia | API key gratuita |
| Twelve Data | Global | 800 req/dia | API key gratuita |

### 5.6 Custo total de APIs

**Zero.** Todas as fontes listadas são gratuitas dentro dos limites necessários para o uso do Oniefy (1 chamada por dia por tipo de ativo).

---

## 6. Cascata de Fallback (resumo visual)

```
AÇÕES/FIIs/ETFs/BDRs:     Brapi → Yahoo Finance → Alpha Vantage → última cotação
CRIPTOMOEDAS:              Binance → CryptoCompare → CoinGecko → CoinPaprika → última cotação
TESOURO DIRETO:            API Tesouro → BCB/SGS (Selic) → última cotação
CDI (renda fixa pós):      BCB/SGS s.12 → BCB/SGS s.4391 → último fator
IPCA (renda fixa IPCA+):   BCB/SGS s.433 → IBGE/SIDRA → último índice
TR (poupança):             BCB/SGS s.226 → cálculo pela Selic
CÂMBIO:                    BCB/SGS s.1 → Yahoo Finance → Brapi → última taxa
FUNDOS:                    CVM dados abertos → Mais Retorno → última cota
DEBÊNTURES MTM:            ANBIMA → B3 Market Data → cálculo na curva
EXTERIOR:                  Yahoo Finance → Alpha Vantage → Twelve Data → última cotação
```

Regra universal: se todas as fontes falharem, o app mantém a última cotação conhecida e a Onie alerta: "Cotações de [tipo] não foram atualizadas hoje." Nunca mostra saldo zerado ou desatualizado sem aviso.

O utilitário `withRetry()` com exponential backoff (já implementado, D11 sessão 33) é usado em cada chamada da cascata.

---

## 7. O que o App Consegue Entregar com Esses Dados

### 7.1 Features viáveis com cadastro manual + cotações públicas

| Feature | Viável? | Como |
|---------|---------|------|
| Patrimônio investido total consolidado | Sim | Soma de todos os `valor_atual` |
| Rentabilidade por ativo | Sim | `(valor_atual - valor_investido) / valor_investido` |
| Rentabilidade vs. benchmarks (CDI, Ibovespa, IPCA) | Sim | Compara com índices do BCB/SGS e Brapi |
| Diversificação por tipo (renda fixa, variável, cripto, exterior) | Sim | Agrupamento por tipo |
| Diversificação por corretora | Sim | Agrupamento por corretora |
| Reserva de emergência (card fixo) | Sim | Soma dos investimentos marcados como "reserva" |
| Alerta de vencimento (CDB, LCI, LCA, Tesouro) | Sim | Data de vencimento cadastrada |
| Alerta de liquidez (CDB sem liquidez diária vencendo) | Sim | Campo liquidez + vencimento |
| Projeção de rendimento futuro | Sim | Simulação com CDI/Selic/IPCA projetados |
| Evolução patrimonial (gráfico temporal) | Sim | Snapshot diário do valor total |
| Comparativo com benchmarks (gráfico) | Sim | Linha do patrimônio vs. CDI, Ibovespa, IPCA |
| Marcação a mercado (renda fixa e Tesouro) | Sim | PU do Tesouro (preciso) + ANBIMA (estimativa para CDB) |
| Proventos recebidos (ações/FIIs) | Parcial | Histórico de dividendos por ticker via Brapi. Não automático para renda fixa. |
| Ganho de capital para IRPF | Parcial | Se o usuário registrar vendas. Sem automação de notas de corretagem no MVP. |
| Custo médio de aquisição atualizado | Parcial | Correto no cadastro inicial. Se fizer novas compras, precisa atualizar manualmente. |

### 7.2 Features adicionais quando B3 API estiver ativa

| Feature | Melhoria |
|---------|---------|
| Posição completa importada automaticamente | Elimina cadastro manual de renda variável e parte de renda fixa |
| Preço médio real (todas as C&V históricas) | Preço médio exato sem dependência do usuário |
| Proventos com precisão (data e valor exatos) | Eventos corporativos D-1 |
| Detecção automática de novas compras/vendas | Sincronização diária |
| Consolidação cross-corretora automática | B3 centraliza todas as corretoras |
| Histórico de C&V para ganho de capital (IRPF) | Motor fiscal alimentado automaticamente |
| Posição em 31/12 para declaração de bens | Snapshot automático |

---

## 8. Integração B3 API (Área do Investidor)

### 8.1 O que a B3 oferece via API

- Saldo de investimentos (posição consolidada D-1)
- Transações (compras e vendas com datas, valores, quantidades)
- Eventos corporativos (dividendos, JCP, bonificações, desdobramentos)
- Ofertas públicas (participação em IPOs)
- Consentimento (verificação de autorização do investidor)

### 8.2 Cobertura da B3 API

| Tipo | Cobertura | Condição |
|------|----------|---------|
| Ações, FIIs, ETFs, BDRs | 100% | Todos custodiados na B3 |
| Tesouro Direto | 100% | Todos custodiados na B3/Selic |
| Debêntures | ~90% | As registradas na B3 |
| CRI/CRA | Parcial (principais) | Os negociados no mercado secundário |
| CDB | Parcial | Depende de o banco + ativo possuírem selo "Certifica" da B3 |
| LCI/LCA | Parcial | Mesma regra do selo "Certifica" |
| Fundos abertos | Parcial | Depende de registro na B3 |
| "Caixinhas"/cofrinhos/rendimento automático | Não | Explicitamente excluídos pela B3 |
| Cripto, previdência, poupança, exterior | Não | Fora do escopo da B3 |

### 8.3 Selo "Certifica"

A cobertura de CDB, LCI, LCA e fundos na Área do Investidor depende de o ativo e a instituição financeira possuírem o selo "Certifica", que comprova o registro na B3. Bancos grandes (Itaú, Bradesco, BB, Santander, BTG, XP, Inter) registram seus títulos. Bancos menores e digitais podem não registrar todos.

Para o perfil Hybrid Earner (que investe via corretoras grandes), a cobertura é muito alta.

### 8.4 Fluxo de consentimento

```
1. Usuário no Oniefy toca "Conectar meus investimentos"
2. Oniefy redireciona para Área do Investidor da B3
3. Usuário faz login na B3 com suas credenciais
4. B3 mostra tela de consentimento
5. Usuário autoriza
6. B3 gera token de acesso para o Oniefy
7. Oniefy importa posição completa
8. Onie: "Encontrei X ativos em Y corretoras. Patrimônio: R$ Z."
```

### 8.5 Processo de homologação do Oniefy

| Passo | Ação | Esforço | Quando |
|-------|------|---------|--------|
| 1 | Criar conta em developers.b3.com.br | 10 min | Agora |
| 2 | Gerar Kit de Acesso no sandbox | 30 min | Agora |
| 3 | Explorar APIs com dados fictícios | 2-4h | Agora |
| 4 | Contatar equipe comercial B3 (preço, requisitos) | 1 e-mail | Agora |
| 5 | Security review/scorecard pela B3 | Após app em produção | Futuro |
| 6 | Assinar contrato de licença | Após aprovação | Futuro |
| 7 | Receber pacote de acesso a produção | Após contrato | Futuro |

### 8.6 Modelo de tarifação

Cobrança por investidor autorizado com modelos de opt-out. Valor exato a negociar com equipe comercial. Apps como Kinvo (BTG), Gorila, Real Valor e Investidor10 já são licenciados, indicando viabilidade para fintechs.

### 8.7 Tabelas de suporte (B3)

```sql
-- Conexão B3 do usuário
CREATE TABLE b3_connection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profile(id),
  b3_investor_document TEXT NOT NULL,   -- CPF encrypted
  consent_status TEXT NOT NULL,          -- pending, authorized, revoked
  consent_granted_at TIMESTAMPTZ,
  consent_revoked_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,                 -- success, partial, failed
  access_token_encrypted TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cache de posições D-1
CREATE TABLE b3_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  custodian TEXT NOT NULL,
  quantity NUMERIC(14,6) NOT NULL,
  average_price NUMERIC(14,2),
  current_value NUMERIC(14,2),
  gain_loss NUMERIC(14,2),
  gain_loss_pct NUMERIC(7,4),
  reference_date DATE NOT NULL,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ticker, custodian)
);

-- Histórico de transações (C&V)
CREATE TABLE b3_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ticker TEXT NOT NULL,
  transaction_type TEXT NOT NULL,        -- buy, sell, transfer, split, etc.
  quantity NUMERIC(14,6) NOT NULL,
  price NUMERIC(14,2) NOT NULL,
  total_value NUMERIC(14,2) NOT NULL,
  transaction_date DATE NOT NULL,
  settlement_date DATE,
  custodian TEXT NOT NULL,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Eventos corporativos (proventos)
CREATE TABLE b3_corporate_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ticker TEXT NOT NULL,
  event_type TEXT NOT NULL,              -- dividend, jcp, bonus, split, etc.
  ex_date DATE NOT NULL,
  payment_date DATE,
  value_per_share NUMERIC(14,8),
  total_value NUMERIC(14,2),
  quantity_affected NUMERIC(14,6),
  tax_withheld NUMERIC(14,2),            -- IRRF retido (JCP)
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 9. Marcação a Mercado: Renda Fixa e Tesouro

### 9.1 O problema

Investimentos de renda fixa prefixada e IPCA+ têm dois valores:

- **Valor na curva:** quanto o investidor recebe se segurar até o vencimento. Calculável com precisão por fórmula.
- **Valor de mercado (MTM):** quanto o investidor receberia se vendesse hoje. Flutua conforme a taxa de juros de mercado.

### 9.2 Tesouro Direto: resolvido

O site do Tesouro Direto publica diariamente o PU (preço unitário) de compra e venda de cada título. O PU de venda já é a marcação a mercado. O app busca e multiplica pela quantidade.

### 9.3 CDB/LCI/LCA prefixado e IPCA+: estimativa

Não existe fonte pública com o preço MTM de um CDB específico. O app oferece duas visões:

**Default (na curva):** "Seu CDB rende R$ X se você segurar até o vencimento."

**Opcional (estimativa MTM):** usa a curva de juros ANBIMA para calcular o que o CDB valeria se negociado hoje. Com disclaimer: "Valor estimado. O valor real de resgate antecipado pode diferir."

### 9.4 Debêntures: ANBIMA

A ANBIMA publica preços indicativos diários para ~90% das debêntures registradas. O app pode buscar o preço indicativo e multiplicar pela quantidade.

### 9.5 Comunicação da Onie

A Onie pode explicar sem jargão:
```
"Seu Tesouro IPCA+ 2035 vale R$ 4.230 na curva (se segurar até 2035).
A valor de mercado hoje, estimo R$ 3.980 (taxa de mercado subiu desde a compra).
Se não pretende vender antes de 2035, foque no valor da curva."
```

---

## 10. Proventos e Eventos Corporativos

### 10.1 Sem B3 API

Proventos de ações e FIIs podem ser rastreados via Brapi (que fornece histórico de dividendos por ticker). O app cruza: se o usuário possuía PETR4 na data-base do dividendo, registra o provento.

Limitação: a data de pagamento e o valor líquido (após IRRF no caso de JCP) podem não ser precisos sem a fonte oficial.

### 10.2 Com B3 API

Eventos corporativos completos: dividendos, JCP (com IRRF retido), bonificações, desdobramentos, direitos de subscrição. Tudo por investidor, com datas e valores exatos. Alimenta diretamente o motor fiscal.

---

## 11. Alimentação do Motor Fiscal (IRPF)

O módulo de investimentos fornece ao motor fiscal:

| Dado fiscal | Fonte (sem B3 API) | Fonte (com B3 API) |
|------------|--------------------|--------------------|
| Posição em 31/12 (declaração de bens) | Snapshot salvo pelo app | Automático |
| Ganho de capital em vendas | Registro manual de vendas | Automático (transações C&V) |
| Dividendos isentos recebidos | Brapi (estimativa) | Automático (eventos corporativos) |
| JCP tributados (IRRF) | Brapi (estimativa) | Automático (com IRRF retido) |
| Rendimento de renda fixa | Cálculo pelo app | Automático (saldo + rendimento) |
| Aporte em PGBL (dedução) | Campo contribuição mensal × 12 | Manual (previdência fora da B3) |

---

## 12. Frequência de Atualização: Resumo por Tipo

| Tipo | Frequência | Atraso máximo | Fonte |
|------|-----------|--------------|-------|
| Ações/FIIs/ETFs/BDRs | Diária (dia útil) | D-0 (fechamento) | Brapi |
| Criptomoedas | Diária | D-0 | Binance |
| Tesouro Direto | Diária (dia útil) | D-0 | API Tesouro |
| CDB/LCI/LCA pós (CDI) | Diária (dia útil) | D-0 | BCB/SGS |
| CDB/LCI/LCA prefixado | Diária (calculada) | D-0 | Fórmula + ANBIMA |
| CDB/LCI/LCA IPCA+ | Mensal | ~10 dias (espera IBGE) | BCB/SGS |
| Fundos | Diária (dia útil) | D-1 a D-3 (delay CVM) | CVM |
| Poupança | Mensal (aniversário) | D-0 | BCB/SGS (TR) |
| Exterior | Diária (dia útil) | D-0 | Yahoo Finance + BCB câmbio |
| Previdência | Mensal (manual) | Depende do usuário | Notificação Onie |
| Consórcio | Mensal (calendário) | Depende do usuário | Calendário de parcelas |

---

## 13. Decisões Registradas

| # | Decisão | Data |
|---|---------|------|
| 1 | Usuário cadastra posições manualmente; app atualiza automaticamente via cotações públicas | 02/04/2026 |
| 2 | B3 API é fonte primária futura; modelo híbrido progressivo | 02/04/2026 |
| 3 | Toda fonte de cotação tem cascata de fallback (mínimo 2 fontes por tipo) | 02/04/2026 |
| 4 | Binance API é fonte primária para cripto (sem auth, 1.200 req/min, todas as moedas em 1 chamada) | 02/04/2026 |
| 5 | Fallback cripto: Binance → CryptoCompare → CoinGecko → CoinPaprika | 02/04/2026 |
| 6 | Custo total de APIs: zero (todas gratuitas para o volume do Oniefy) | 02/04/2026 |
| 7 | Marcação a mercado: Tesouro = preciso (PU público). CDB/LCI/LCA = estimativa (ANBIMA). Default: na curva. | 02/04/2026 |
| 8 | Previdência e consórcio: atualização manual mensal com lembrete da Onie | 02/04/2026 |
| 9 | Reserva de emergência: flag por investimento, card fixo na tela de investimentos | 02/04/2026 |
| 10 | Crons diários entre 19:00-22:00 BRT, apenas dias úteis (exceto cripto que é diário) | 02/04/2026 |
| 11 | Se todas as fontes falharem: mantém última cotação + alerta. Nunca zera saldo sem aviso. | 02/04/2026 |
| 12 | withRetry() com exponential backoff (já implementado) usado em toda chamada de API | 02/04/2026 |
| 13 | Dados B3 API alimentam motor fiscal (IRPF) automaticamente quando disponível | 02/04/2026 |
| 14 | Passos 1-4 da homologação B3 executáveis imediatamente pelo Claudio | 02/04/2026 |
| 15 | Selo "Certifica" da B3 determina cobertura de CDB/LCI/LCA; grandes corretoras cobrem bem | 02/04/2026 |

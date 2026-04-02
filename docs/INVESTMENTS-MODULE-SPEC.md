# ONIEFY - Módulo de Investimentos

## Documento de Especificação

**Data de criação:** 02 de Abril de 2026
**Status:** Em discussão (não implementar até fechar redesign conceitual)
**Documento relacionado:** `docs/B3-API-INTEGRATION-SPEC.md` (integração B3 Área do Investidor)

---

## 1. Visão Geral

O módulo de investimentos consolida todo o patrimônio financeiro investido do usuário em uma única visão. Opera em dois modos conforme a maturidade das integrações:

- **Modo manual + cotações automáticas (MVP):** o usuário cadastra suas posições, o app atualiza cotações e calcula valores automaticamente
- **Modo B3 API + híbrido (futuro):** posições importadas automaticamente da B3, complementadas por APIs públicas e entrada manual para tipos não cobertos

Este documento especifica o modo MVP. O documento `B3-API-INTEGRATION-SPEC.md` detalha o modo futuro.

---

## 2. Tipos de Investimento Suportados

### 2.1 Cobertura completa (atualização 100% automática)

| Tipo | Fonte de cotação | Frequência |
|------|-----------------|-----------|
| Ações brasileiras (PETR4, VALE3, etc.) | Brapi / Yahoo Finance | Diária |
| Fundos Imobiliários (HGLG11, XPLG11, etc.) | Brapi / Yahoo Finance | Diária |
| ETFs (BOVA11, IVVB11, etc.) | Brapi / Yahoo Finance | Diária |
| BDRs (AAPL34, AMZO34, etc.) | Brapi / Yahoo Finance | Diária |
| Criptomoedas (BTC, ETH, etc.) | Binance / CryptoCompare | Diária |
| Tesouro Direto (Selic, IPCA+, Prefixado) | API Tesouro Direto | Diária |
| CDB/LCI/LCA pós-fixado (% do CDI) | BCB/SGS (CDI) - calculado | Diária |
| Poupança | BCB/SGS (TR) - calculado | Mensal |
| Investimentos no exterior (ações, ETFs) | Yahoo Finance + BCB câmbio | Diária |

### 2.2 Cobertura parcial (atualização com estimativa)

| Tipo | Fonte | Limitação |
|------|-------|----------|
| CDB/LCI/LCA prefixado | Cálculo na curva (determinístico) + ANBIMA (MTM estimativa) | MTM é aproximação, não valor exato de resgate |
| CDB/LCI/LCA IPCA+ | BCB/SGS (IPCA) + ANBIMA (MTM estimativa) | IPCA publicado 1x/mês, MTM é aproximação |
| Debêntures | ANBIMA (preços indicativos ~90% cobertura) | Nem todas possuem preço indicativo |
| CRI/CRA | ANBIMA (principais) | Cobertura parcial |
| Fundos de investimento abertos | CVM dados abertos (valor da cota) | Delay de 1-3 dias úteis |

### 2.3 Atualização manual (sem fonte automática)

| Tipo | Razão | Frequência sugerida |
|------|-------|-------------------|
| Previdência privada (PGBL/VGBL) | Custódia na seguradora, sem API pública padronizada | Mensal |
| Fundos fechados | Sem cota pública regular | Quando disponível |
| COE (Certificado de Operações Estruturadas) | Sem fonte pública | Mensal |
| Consórcio | Custódia na administradora | Mensal |
| "Caixinhas" / cofrinhos / rendimento automático (Nubank, Inter, PicPay) | Explicitamente excluídos da Área do Investidor B3 | Mensal |

---

## 3. Cadastro pelo Usuário (1 vez por investimento)

### 3.1 Renda variável (Ações, FIIs, ETFs, BDRs)

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Ticker | TEXT (autocomplete) | Sim | PETR4 |
| Quantidade | NUMERIC(14,6) | Sim | 100 |
| Preço médio de aquisição | NUMERIC(14,2) | Sim | 28,50 |
| Corretora | SELECT (lista) | Sim | BTG Pactual |
| Data de aquisição | DATE | Não (desejável para IRPF) | 15/03/2025 |

Autocomplete: ao digitar "PETR", o app sugere PETR3, PETR4 com nome completo ("Petrobras PN", "Petrobras ON"). Fonte do autocomplete: Brapi ou cache local da lista de tickers B3.

### 3.2 Criptomoedas

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Moeda | TEXT (autocomplete) | Sim | BTC |
| Quantidade | NUMERIC(18,8) | Sim | 0,5 |
| Preço médio de aquisição (BRL) | NUMERIC(14,2) | Sim | 180.000,00 |
| Exchange / custódia | SELECT (lista) | Sim | Binance |
| Data de aquisição | DATE | Não | 01/06/2025 |

Autocomplete: ao digitar "BIT", sugere Bitcoin (BTC), Bitcoin Cash (BCH), etc. Fonte: CoinGecko lista de moedas (cache local).

### 3.3 Tesouro Direto

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Título | SELECT (lista atualizada) | Sim | Tesouro IPCA+ 2035 |
| Quantidade de títulos | NUMERIC(10,4) | Sim | 2,47 |
| Valor investido (BRL) | NUMERIC(14,2) | Sim | 7.500,00 |
| Data da compra | DATE | Sim | 10/01/2025 |
| Corretora | SELECT (lista) | Sim | Nubank |

A lista de títulos vigentes é atualizada automaticamente a partir da API pública do Tesouro Direto.

### 3.4 CDB / LCI / LCA

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Tipo | SELECT (CDB, LCI, LCA) | Sim | CDB |
| Banco emissor | TEXT (autocomplete) | Sim | Banco Inter |
| Rentabilidade | SELECT (pós-fixado, prefixado, IPCA+) | Sim | Pós-fixado |
| Taxa contratada | NUMERIC(7,4) | Sim | 110 (se pós: % do CDI) |
| Valor aplicado (BRL) | NUMERIC(14,2) | Sim | 50.000,00 |
| Data da aplicação | DATE | Sim | 01/02/2025 |
| Vencimento | DATE | Sim | 01/02/2027 |
| Liquidez | SELECT (diária, no vencimento) | Sim | Diária |
| Corretora (se diferente do emissor) | TEXT | Não | XP Investimentos |

Para prefixado: taxa em % a.a. (ex: 14,00).
Para IPCA+: taxa real em % a.a. (ex: 6,50, significa IPCA + 6,50%).

### 3.5 Fundos de investimento

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Fundo | TEXT (busca por nome ou CNPJ) | Sim | ARX Income FIA |
| CNPJ do fundo | TEXT (preenchido automaticamente pela busca) | Sim | 08.960.090/0001-33 |
| Quantidade de cotas | NUMERIC(14,6) | Sim | 1.250,000000 |
| Valor investido (BRL) | NUMERIC(14,2) | Sim | 25.000,00 |
| Data da aplicação | DATE | Sim | 15/05/2025 |
| Corretora | SELECT (lista) | Sim | BTG Pactual |

Busca de fundos: ao digitar nome parcial ou CNPJ, o app consulta o cadastro CVM e retorna nome completo, CNPJ, tipo (renda fixa, multimercado, ações, cambial), gestor.

### 3.6 Previdência privada (PGBL / VGBL)

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Tipo | SELECT (PGBL, VGBL) | Sim | VGBL |
| Seguradora | TEXT (autocomplete) | Sim | Brasilprev |
| Nome do plano / fundo vinculado | TEXT | Não | Brasilprev TOP Ações |
| Saldo atual (BRL) | NUMERIC(14,2) | Sim | 145.320,00 |
| Contribuição mensal (BRL) | NUMERIC(14,2) | Não | 2.000,00 |
| Data de início | DATE | Não | 01/01/2020 |
| Regime tributário | SELECT (progressivo, regressivo) | Não | Regressivo |

A Onie lembra mensalmente: "Atualize o saldo da sua previdência [seguradora]."

### 3.7 Poupança

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Banco | SELECT (lista) | Sim | Caixa Econômica |
| Saldo atual (BRL) | NUMERIC(14,2) | Sim | 15.000,00 |
| Data de aniversário (dia do mês) | INTEGER (1-28) | Sim | 10 |

### 3.8 Investimentos no exterior

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Ativo | TEXT (autocomplete ticker global) | Sim | AAPL |
| Bolsa / mercado | SELECT (NYSE, NASDAQ, LSE, etc.) | Sim | NASDAQ |
| Moeda | SELECT (USD, EUR, GBP) | Sim | USD |
| Quantidade | NUMERIC(14,6) | Sim | 50 |
| Preço médio (moeda original) | NUMERIC(14,4) | Sim | 175,00 |
| Corretora / plataforma | TEXT | Sim | Avenue |
| Data de aquisição | DATE | Não | 20/07/2025 |

### 3.9 Debêntures / CRI / CRA

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Código do ativo | TEXT | Sim | VALE29 |
| Emissor | TEXT | Sim | Vale S.A. |
| Tipo | SELECT (debênture, CRI, CRA) | Sim | Debênture |
| Rentabilidade | SELECT (CDI+, IPCA+, prefixada) | Sim | IPCA+ |
| Taxa contratada | NUMERIC(7,4) | Sim | 6,80 |
| Valor aplicado (BRL) | NUMERIC(14,2) | Sim | 30.000,00 |
| Data da aplicação | DATE | Sim | 01/03/2025 |
| Vencimento | DATE | Sim | 15/09/2029 |
| Corretora | SELECT | Sim | XP |

### 3.10 Consórcio

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Administradora | TEXT | Sim | Embracon |
| Tipo de bem | SELECT (imóvel, veículo, serviço) | Sim | Imóvel |
| Valor da carta de crédito (BRL) | NUMERIC(14,2) | Sim | 300.000,00 |
| Parcela mensal (BRL) | NUMERIC(14,2) | Sim | 2.500,00 |
| Parcelas pagas | INTEGER | Sim | 24 |
| Total de parcelas | INTEGER | Sim | 180 |
| Foi contemplado? | BOOLEAN | Sim | Não |
| Data de início | DATE | Não | 01/01/2024 |

### 3.11 COE (Certificado de Operações Estruturadas)

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Banco emissor | TEXT | Sim | BTG Pactual |
| Descrição / ativo de referência | TEXT | Sim | COE S&P 500 com proteção |
| Valor aplicado (BRL) | NUMERIC(14,2) | Sim | 20.000,00 |
| Valor atual (BRL) | NUMERIC(14,2) | Sim | 21.500,00 |
| Vencimento | DATE | Sim | 01/06/2027 |
| Tipo | SELECT (valor nominal protegido, valor nominal em risco) | Sim | Protegido |

---

## 4. Atualização Automática de Cotações

### 4.1 Fontes de dados por tipo com cascata de fallback

#### Ações, FIIs, ETFs, BDRs (B3)

| Prioridade | Fonte | Limite gratuito |
|-----------|-------|----------------|
| 1 | Brapi (brapi.dev) | 15.000 req/mês |
| 2 | Yahoo Finance (sufixo .SA) | Sem limite formal (rate limit por IP) |
| 3 | Alpha Vantage | 500 req/dia (25 req/min) |
| 4 | Última cotação conhecida + alerta | - |

Cálculo: `valor_atual = quantidade × cotação_fechamento`

#### Criptomoedas

| Prioridade | Fonte | Limite gratuito |
|-----------|-------|----------------|
| 1 | Binance API (`/api/v3/ticker/24hr`) | 1.200 req/min (sem autenticação) |
| 2 | CryptoCompare | 100.000 chamadas/mês |
| 3 | CoinGecko | 30 req/min (~10.000/mês) |
| 4 | CoinPaprika | 25.000 chamadas/mês |
| 5 | Última cotação conhecida + alerta | - |

Nota: Binance retorna cotações em USDT. Conversão para BRL via par BTCBRL da Binance ou câmbio BCB/SGS.

Cálculo: `valor_brl = quantidade × cotação_usdt × câmbio_usd_brl`

#### Tesouro Direto

| Prioridade | Fonte | Limite |
|-----------|-------|--------|
| 1 | API pública Tesouro Direto (tesourodireto.com.br) | Sem limite |
| 2 | BCB/SGS série 11 (taxa Selic, para cálculo na curva) | Sem limite |
| 3 | Última cotação conhecida + alerta | - |

Cálculo: `valor_atual = quantidade_títulos × PU_venda` (já inclui marcação a mercado).

#### CDI (para CDB/LCI/LCA pós-fixado)

| Prioridade | Fonte | Limite |
|-----------|-------|--------|
| 1 | BCB/SGS série 12 (CDI diário) | Sem limite |
| 2 | BCB/SGS série 4391 (CDI acumulado mensal) | Sem limite |
| 3 | Último fator conhecido + alerta | - |

#### IPCA (para CDB/LCI/LCA IPCA+ e Debêntures IPCA+)

| Prioridade | Fonte | Limite |
|-----------|-------|--------|
| 1 | BCB/SGS série 433 (IPCA mensal) | Sem limite |
| 2 | IBGE/SIDRA API (fonte primária original) | Sem limite |
| 3 | Último índice conhecido + alerta | - |

Publicação: ~dia 10 de cada mês pelo IBGE.

#### TR (para Poupança)

| Prioridade | Fonte | Limite |
|-----------|-------|--------|
| 1 | BCB/SGS série 226 (TR diária) | Sem limite |
| 2 | Cálculo pela regra da Selic (estimativa) | - |
| 3 | Último valor conhecido + alerta | - |

#### Câmbio (para investimentos no exterior)

| Prioridade | Fonte | Limite |
|-----------|-------|--------|
| 1 | BCB/SGS série 1 (PTAX USD/BRL) | Sem limite |
| 2 | Yahoo Finance (USDBRL=X) | Sem limite formal |
| 3 | Brapi (endpoint de câmbio) | Dentro dos 15k req/mês |
| 4 | Última cotação conhecida + alerta | - |

Séries BCB para outras moedas: EUR (série 21619), GBP (série 21623), JPY (série 21621).

#### Investimentos no exterior (cotações em moeda original)

| Prioridade | Fonte | Limite |
|-----------|-------|--------|
| 1 | Yahoo Finance (AAPL, MSFT, VOO) | Sem limite formal |
| 2 | Alpha Vantage | 500 req/dia |
| 3 | Twelve Data | 800 req/dia |
| 4 | Última cotação conhecida + alerta | - |

Cálculo: `valor_brl = quantidade × cotação_moeda_original × câmbio_moeda_brl`

#### Fundos de investimento (valor da cota)

| Prioridade | Fonte | Limite |
|-----------|-------|--------|
| 1 | CVM dados abertos (consulta por CNPJ) | Sem limite (delay 1-3 dias) |
| 2 | Mais Retorno API (agregador brasileiro) | A verificar |
| 3 | Última cota conhecida + alerta | - |

Cálculo: `valor_atual = quantidade_cotas × valor_cota`

#### Debêntures / CRI / CRA (marcação a mercado)

| Prioridade | Fonte | Limite |
|-----------|-------|--------|
| 1 | ANBIMA (preços indicativos diários) | Cadastro gratuito para uso não comercial |
| 2 | B3 Market Data (preços de referência) | A verificar |
| 3 | Cálculo na curva (taxa contratada + CDI/IPCA acumulado) | Sempre funciona (determinístico) |

O app oferece duas visões ao usuário:
- **Na curva (padrão):** "Este é o valor se você segurar até o vencimento"
- **Marcação a mercado (opcional):** "Este é o valor estimado se você resgatasse hoje"

### 4.2 Tabela de crons

| Cron | Horário BRT | Dias | O que atualiza | Fonte primária |
|------|-------------|------|---------------|---------------|
| `update_equities` | 19:00 | Dias úteis | Ações, FIIs, ETFs, BDRs | Brapi |
| `update_crypto` | 20:00 | Diário (7/7) | Criptomoedas | Binance |
| `update_treasury` | 20:00 | Dias úteis | Tesouro Direto | API Tesouro Direto |
| `update_cdi` | 20:00 | Dias úteis | Fator CDI (renda fixa pós) | BCB/SGS série 12 |
| `update_funds` | 22:00 | Dias úteis | Cotas de fundos | CVM dados abertos |
| `update_fx` | 20:00 | Dias úteis | Câmbio USD/EUR/GBP | BCB/SGS série 1 |
| `update_foreign` | 20:00 | Dias úteis | Cotações exterior | Yahoo Finance |
| `update_ipca` | Dia 10, 10:00 | Mensal | IPCA (renda fixa IPCA+) | BCB/SGS série 433 |
| `update_savings` | Dia de aniversário | Mensal por conta | Poupança | BCB/SGS série 226 (TR) |
| `update_debentures` | 19:30 | Dias úteis | Debêntures/CRI/CRA MTM | ANBIMA |
| `remind_manual` | 09:00, dia 1 | Mensal | Previdência, consórcio, COE, caixinhas | Notificação ao usuário |

### 4.3 Lógica de fallback (padrão para todos os crons)

```typescript
async function updateWithFallback(providers: Provider[], assetType: string) {
  for (const provider of providers) {
    try {
      const data = await withRetry(() => provider.fetch(), {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
      });
      await savePrices(data, provider.name, assetType);
      return; // sucesso, encerra
    } catch (error) {
      log.warn(`${provider.name} falhou para ${assetType}: ${error.message}`);
      continue; // tenta próximo
    }
  }
  // todas as fontes falharam
  await createOnieAlert({
    type: 'price_update_failed',
    assetType,
    message: `Cotações de ${assetType} não foram atualizadas hoje.`,
    severity: 'info',
  });
}
```

O `withRetry()` com exponential backoff já existe no código (D11, sessão 33).

---

## 5. Cálculos Detalhados

### 5.1 Renda variável

```
Valor atual = quantidade × cotação_fechamento
Ganho/Perda = valor_atual - (quantidade × preço_médio)
Ganho/Perda % = ganho_perda / (quantidade × preço_médio) × 100
Rentabilidade vs CDI = (ganho_perda_% / cdi_acumulado_mesmo_periodo) × 100
```

### 5.2 CDB pós-fixado (% do CDI)

```
// Acumular fatores diários do CDI desde data_aplicação
fator_cdi_acumulado = ∏(1 + cdi_diario_i) para cada dia útil i

// Aplicar taxa contratada
fator_rendimento = (fator_cdi_acumulado - 1) × (taxa_contratada / 100) + 1

// Valor bruto
valor_bruto = valor_aplicado × fator_rendimento

// IR (tabela regressiva, aplicável apenas a CDB, não a LCI/LCA)
dias_corridos = hoje - data_aplicação
se dias_corridos ≤ 180: aliquota_ir = 22,5%
se dias_corridos ≤ 360: aliquota_ir = 20,0%
se dias_corridos ≤ 720: aliquota_ir = 17,5%
se dias_corridos > 720: aliquota_ir = 15,0%

rendimento_bruto = valor_bruto - valor_aplicado
ir = rendimento_bruto × aliquota_ir
valor_liquido = valor_bruto - ir

// LCI e LCA: isentos de IR para PF
se tipo in ('LCI', 'LCA'): valor_liquido = valor_bruto
```

### 5.3 CDB/LCI/LCA prefixado

```
// Na curva (valor no vencimento é conhecido)
dias_uteis = dias_uteis_entre(data_aplicação, hoje)
dias_uteis_total = dias_uteis_entre(data_aplicação, vencimento)

valor_curva = valor_aplicado × (1 + taxa_contratada / 100) ^ (dias_uteis / 252)

// Marcação a mercado (estimativa)
taxa_mercado_atual = buscar curva ANBIMA para mesmo vencimento
dias_uteis_restantes = dias_uteis_entre(hoje, vencimento)
valor_vencimento = valor_aplicado × (1 + taxa_contratada / 100) ^ (dias_uteis_total / 252)
valor_mtm = valor_vencimento / (1 + taxa_mercado_atual / 100) ^ (dias_uteis_restantes / 252)
```

### 5.4 CDB/LCI/LCA IPCA+

```
// Buscar IPCA acumulado desde data_aplicação
ipca_acumulado = ∏(1 + ipca_mensal_i) para cada mês i

// Componente real (taxa contratada)
dias_uteis = dias_uteis_entre(data_aplicação, hoje)
fator_real = (1 + taxa_real / 100) ^ (dias_uteis / 252)

// Valor atualizado
valor_bruto = valor_aplicado × ipca_acumulado × fator_real

// IR igual ao CDB pós-fixado (LCI/LCA isentas)
```

### 5.5 Tesouro Direto

```
// API retorna PU (preço unitário) diretamente para todos os títulos
valor_atual = quantidade_títulos × PU_venda_api

// Na curva (fallback se API falhar):
// Tesouro Selic: valor_aplicado × fator_selic_acumulado
// Tesouro IPCA+: valor_aplicado × ipca_acumulado × (1 + taxa_real)^(du/252)
// Tesouro Prefixado: valor_aplicado × (1 + taxa)^(du/252)
```

### 5.6 Poupança

```
// Regra vigente (desde 2012):
se selic_meta > 8,5% a.a.:
    rendimento_mensal = 0,5% + TR_do_mês
senão:
    rendimento_mensal = 70% × (selic_meta / 12) + TR_do_mês

// Atualização no dia de aniversário:
valor_atual = saldo_anterior × (1 + rendimento_mensal)
```

### 5.7 Investimentos no exterior

```
// Cotação em moeda original
valor_moeda = quantidade × cotação_moeda_original

// Conversão para BRL
valor_brl = valor_moeda × câmbio_moeda_brl (PTAX BCB)

// Ganho/perda em BRL (inclui variação cambial)
ganho_brl = valor_brl - (quantidade × preço_médio_original × câmbio_na_data_compra)
```

### 5.8 Fundos de investimento

```
valor_atual = quantidade_cotas × valor_cota_cvm
ganho_perda = valor_atual - valor_investido
```

### 5.9 Consórcio

```
// Não há valorização. Apenas tracking de pagamentos.
total_pago = parcela_mensal × parcelas_pagas
total_restante = parcela_mensal × (total_parcelas - parcelas_pagas)
percentual_quitado = parcelas_pagas / total_parcelas × 100
```

---

## 6. O que a Onie consegue mostrar

### 6.1 Visão consolidada

| Feature | Como |
|---------|------|
| Patrimônio investido total | Soma de todos os `valor_atual` |
| Evolução patrimonial (gráfico) | Histórico de valores diários |
| Diversificação por tipo (pizza) | Renda fixa X%, variável Y%, cripto Z%, exterior W% |
| Diversificação por corretora | BTG X%, XP Y%, Nubank Z% |
| Rentabilidade total da carteira | Ponderada por valor de cada ativo |
| Rentabilidade vs. benchmarks | CDI, Ibovespa, IPCA, dólar (BCB/SGS + Brapi) |

### 6.2 Por investimento

| Feature | Como |
|---------|------|
| Valor atual | Cotação × quantidade |
| Ganho/perda absoluto e percentual | vs. preço médio informado |
| Rentabilidade no mês, no ano, desde a compra | Série histórica de cotações |
| Alerta de vencimento | CDB, LCI, LCA, Tesouro, debênture com data de vencimento cadastrada |
| Alerta de liquidez | CDB sem liquidez diária prestes a vencer |
| Proventos (dividendos, JCP) para ações/FIIs | Histórico via Brapi (por ticker) |
| Projeção de rendimento futuro | Para renda fixa pós, simulação com CDI projetado |

### 6.3 Reserva de emergência (card fixo)

O usuário marca investimentos como "reserva de emergência" (ex: Tesouro Selic, CDB com liquidez diária). O app mostra um card dedicado:

```
Reserva de emergência: R$ 45.000
Meta: R$ 50.000 (6 meses de despesas)
Faltam: R$ 5.000
Rendimento este mês: R$ 520
```

### 6.4 Alertas da Onie

| Alerta | Gatilho |
|--------|---------|
| "Seu Tesouro IPCA+ 2035 valorizou 2,3% este mês" | Variação significativa vs. mês anterior |
| "Dividendo de PETR4 creditado: R$ 1,23/ação (R$ 123,00 total)" | Evento corporativo detectado via Brapi |
| "Seu CDB do Inter vence em 30 dias (01/05/2026). Quer reinvestir?" | Vencimento próximo |
| "Rentabilidade da carteira este ano: 8,2% (CDI: 7,1%)" | Comparativo periódico |
| "Atualize o saldo da sua previdência Brasilprev" | Lembrete mensal para tipos manuais |
| "Cotações de cripto não foram atualizadas hoje" | Falha em todos os providers do fallback |

---

## 7. APIs e Séries Utilizadas (referência completa)

### 7.1 BCB/SGS (Banco Central, séries temporais)

| Série | Descrição | Uso no app |
|-------|-----------|-----------|
| 1 | PTAX USD/BRL (venda) | Câmbio para investimentos no exterior e conversão cripto |
| 11 | Taxa Selic (meta) | Cálculo poupança, referência geral |
| 12 | CDI (taxa diária) | CDB/LCI/LCA pós-fixado |
| 226 | TR (Taxa Referencial) | Poupança |
| 433 | IPCA (mensal) | CDB/LCI/LCA IPCA+, Tesouro IPCA+ |
| 1178 | Fator acumulado Selic | Fallback para Tesouro Selic |
| 4391 | CDI acumulado mensal | Fallback da série 12 |
| 21619 | PTAX EUR/BRL | Câmbio para investimentos em EUR |
| 21623 | PTAX GBP/BRL | Câmbio para investimentos em GBP |
| 21621 | PTAX JPY/BRL | Câmbio para investimentos em JPY |

### 7.2 APIs externas

| API | URL base | Autenticação | Uso |
|-----|---------|-------------|-----|
| Brapi | brapi.dev/api | API key (gratuita) | Ações, FIIs, ETFs, BDRs, dividendos |
| Yahoo Finance | query1.finance.yahoo.com | Nenhuma | Fallback B3 + exterior + câmbio fallback |
| Alpha Vantage | alphavantage.co/query | API key (gratuita) | Fallback B3 + exterior |
| Twelve Data | api.twelvedata.com | API key (gratuita) | Fallback exterior |
| Binance | data-api.binance.vision/api/v3 | Nenhuma | Cripto (primária, 1.200 req/min) |
| CryptoCompare | min-api.cryptocompare.com | API key (gratuita) | Cripto (fallback 1, 100k/mês) |
| CoinGecko | api.coingecko.com/api/v3 | Nenhuma (free) / API key (demo) | Cripto (fallback 2, 30 req/min) |
| CoinPaprika | api.coinpaprika.com/v1 | Nenhuma | Cripto (fallback 3, 25k/mês) |
| Tesouro Direto | tesourodireto.com.br | Nenhuma | Títulos públicos (PU diário) |
| CVM dados abertos | dados.cvm.gov.br | Nenhuma | Cotas de fundos (delay 1-3 dias) |
| ANBIMA | anbima.com.br | Cadastro gratuito | Curvas de juros, debêntures MTM |
| Mercado Bitcoin | api.mercadobitcoin.net | Nenhuma | Fallback cripto em BRL nativo |
| Mais Retorno | maisretorno.com | A verificar | Fallback cotas de fundos |

### 7.3 Resumo de fallback consolidado

| Tipo | Fonte 1 | Fonte 2 | Fonte 3 | Fonte 4 |
|------|---------|---------|---------|---------|
| Ações/FIIs/ETFs/BDRs | Brapi | Yahoo Finance | Alpha Vantage | - |
| Cripto | Binance | CryptoCompare | CoinGecko | CoinPaprika |
| Tesouro Direto | API Tesouro | BCB/SGS (Selic) | - | - |
| CDI (renda fixa pós) | BCB/SGS s.12 | BCB/SGS s.4391 | - | - |
| IPCA (renda fixa IPCA+) | BCB/SGS s.433 | IBGE/SIDRA | - | - |
| TR (poupança) | BCB/SGS s.226 | Cálculo Selic | - | - |
| Câmbio | BCB/SGS s.1 | Yahoo Finance | Brapi | - |
| Fundos | CVM dados abertos | Mais Retorno | - | - |
| Debêntures MTM | ANBIMA | B3 Market Data | Cálculo na curva | - |
| Exterior | Yahoo Finance | Alpha Vantage | Twelve Data | - |

Todas gratuitas. Nenhum tipo depende de fonte única. Custo total de APIs no MVP: zero.

---

## 8. Limitações sem B3 API / Open Finance

| Limitação | Impacto | Mitigação |
|-----------|---------|-----------|
| Preço médio depende do que o usuário informou | Novas compras sem atualização distorcem rentabilidade | Onie lembra: "Registre sua nova compra de PETR4" |
| Proventos não rastreados com precisão total | Data e valor exato do crédito dependem da corretora | Brapi fornece histórico de dividendos por ticker |
| Novas compras/vendas não detectadas automaticamente | Só quando o usuário registrar | Notificação push do banco pode servir de gatilho futuro |
| Consolidação cross-corretora é manual | Usuário cadastra cada posição em cada corretora separadamente | UX de cadastro rápido e intuitivo |
| Ganho de capital para IRPF é parcial | Sem notas de corretagem, cálculo depende de dados manuais | Campo para registrar vendas com data e valor |

Todas essas limitações desaparecem com B3 API ou Open Finance.

---

## 9. Experiência do Usuário

### 9.1 Onboarding de investimentos

```
Onie: "Vamos cadastrar seus investimentos. O que você tem?"

[Cards visuais com ícones para selecionar, múltipla escolha:]
□ Ações / FIIs / ETFs
□ Tesouro Direto
□ CDB / LCI / LCA
□ Fundos de investimento
□ Criptomoedas
□ Previdência privada
□ Poupança
□ Investimentos no exterior
□ Debêntures / CRI / CRA
□ Consórcio
□ COE

Usuário seleciona os tipos que possui → formulário específico para cada tipo
→ Autocomplete e sugestões inteligentes minimizam digitação
→ Ao final: "Encontrei cotações para X dos seus Y investimentos.
   Patrimônio investido: R$ Z. Atualizo automaticamente todo dia."
```

### 9.2 Atualização diária (zero esforço)

O usuário abre o app de manhã. Os crons rodaram durante a noite. Todos os valores estão atualizados com dados D-1. A Onie mostra briefing se houver algo relevante.

### 9.3 Registro de nova compra/venda

```
No card do ativo (ex: PETR4), botão "+ Compra" ou "- Venda"
→ Campos: quantidade, preço unitário, data
→ App recalcula preço médio automaticamente
→ Se venda: app calcula ganho de capital (para IRPF)
```

### 9.4 Atualização manual mensal (tipos sem automação)

```
Onie (notificação dia 1 do mês):
"Hora de atualizar seus investimentos manuais.
 Brasilprev VGBL: último saldo R$ 145.320 (atualizado em 01/03).
 Qual o saldo atual?"

[Campo numérico] → usuário digita → atualizado.
```

Alternativas: foto/screenshot do app da seguradora → OCR extrai o saldo → Onie confirma.

---

## 10. Evolução Futura

| Fase | O que muda | Gatilho |
|------|-----------|---------|
| B3 API integrada | Posições importadas automaticamente, proventos automáticos, cross-corretora nativo | Contrato de licença com B3 assinado |
| Open Finance investimentos | CDBs, fundos e previdência cobertos automaticamente | Regulação e maturidade do ecossistema |
| Notas de corretagem (parser) | Histórico completo de C&V, preço médio exato, ganho de capital preciso | Parser de notas implementado |
| Importação de extratos de corretora (e-mail) | Posição mensal atualizada sem digitação | Motor de importação de e-mail ativo |
| Captura de notificação push de corretora | Novas compras/vendas detectadas automaticamente | NotificationListener implementado |

---

## 11. Decisões Registradas

| # | Decisão | Data |
|---|---------|------|
| 1 | MVP opera com cadastro manual + atualização automática de cotações | 02/04/2026 |
| 2 | B3 API é evolução futura, não bloqueante para MVP | 02/04/2026 |
| 3 | Todas as fontes de cotação possuem cascata de fallback (mínimo 2 fontes por tipo) | 02/04/2026 |
| 4 | Binance é fonte primária para cripto (1.200 req/min, sem autenticação, todos os pares em 1 chamada) | 02/04/2026 |
| 5 | Fallback cripto: Binance → CryptoCompare (100k/mês) → CoinGecko (30/min) → CoinPaprika (25k/mês) | 02/04/2026 |
| 6 | Renda fixa oferece duas visões: na curva (padrão) e marcação a mercado (estimativa via ANBIMA) | 02/04/2026 |
| 7 | Reserva de emergência é card fixo na visão de investimentos | 02/04/2026 |
| 8 | Previdência, consórcio, COE, caixinhas são atualização manual mensal com lembrete da Onie | 02/04/2026 |
| 9 | Crons de atualização rodam em horários escalonados (19:00-22:00 BRT) para evitar sobrecarga | 02/04/2026 |
| 10 | withRetry() com exponential backoff em todas as chamadas externas | 02/04/2026 |
| 11 | "Caixinhas"/cofrinhos tratados como atualização manual (excluídos da B3 API) | 02/04/2026 |
| 12 | Câmbio via PTAX/BCB (oficial) como fonte primária, Yahoo Finance como fallback | 02/04/2026 |
| 13 | Custo zero de APIs no MVP (todas as fontes possuem tier gratuito suficiente) | 02/04/2026 |
| 14 | Conversão cripto USDT→BRL via par Binance BTCBRL ou PTAX BCB | 02/04/2026 |

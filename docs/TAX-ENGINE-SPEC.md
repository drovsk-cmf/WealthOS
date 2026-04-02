# ONIEFY - Motor Tributário Pessoa Física

## Documento de Especificação

**Data de criação:** 02 de Abril de 2026
**Status:** Especificado (pronto para implementação)
**Princípio:** Cálculos corretos para situações padrão. Não somos consultores de imposto de renda. Entregamos os números; o contador valida situações atípicas.

---

## 1. Escopo e Limites

### O que o motor faz:
- Calcula IRPF mensal e anual (tabela progressiva + redutores)
- Calcula INSS (CLT, autônomo, contribuinte individual)
- Calcula IR sobre investimentos (renda fixa regressiva, ações, FIIs, cripto)
- Totaliza deduções (saúde, educação, dependentes, previdência)
- Projeta restituição ou imposto a pagar
- Gera DARF de ganho de capital
- Alerta sobre prazos e obrigações

### O que o motor NÃO faz:
- Preencher a declaração na Receita Federal (o usuário exporta XLSX e preenche)
- Interpretar situações atípicas (trust no exterior, stock options, holding familiar)
- Substituir contador para planejamento tributário
- Garantir 100% de precisão em edge cases legislativos

### Disclaimer obrigatório:
> "Cálculos baseados na legislação vigente em [data]. Para situações específicas, consulte seu contador."

Exibido em toda tela que mostre valores calculados de impostos.

---

## 2. Parâmetros Fiscais - Ano-Calendário 2025 (Declaração 2026)

### 2.1 Tabela Progressiva Mensal IRPF (ano-calendário 2025)

| Faixa | Base de cálculo mensal | Alíquota | Parcela a deduzir |
|-------|----------------------|----------|-------------------|
| 1 | Até R$ 2.259,20 | 0% | R$ 0,00 |
| 2 | R$ 2.259,21 a R$ 2.826,65 | 7,5% | R$ 169,44 |
| 3 | R$ 2.826,66 a R$ 3.751,05 | 15% | R$ 381,44 |
| 4 | R$ 3.751,06 a R$ 4.664,68 | 22,5% | R$ 662,77 |
| 5 | Acima de R$ 4.664,68 | 27,5% | R$ 896,00 |

Desconto simplificado mensal: R$ 607,20 (garante isenção até ~2 SM)
Dedução mensal por dependente: R$ 189,59
Isenção previdenciária 65+: R$ 1.903,98

### 2.2 Tabela Progressiva Anual IRPF (declaração 2026, ano-base 2025)

| Faixa | Base de cálculo anual | Alíquota | Parcela a deduzir |
|-------|----------------------|----------|-------------------|
| 1 | Até R$ 27.110,40 | 0% | R$ 0,00 |
| 2 | R$ 27.110,41 a R$ 33.919,80 | 7,5% | R$ 2.033,28 |
| 3 | R$ 33.919,81 a R$ 45.012,60 | 15% | R$ 4.577,28 |
| 4 | R$ 45.012,61 a R$ 55.976,16 | 22,5% | R$ 7.953,24 |
| 5 | Acima de R$ 55.976,16 | 27,5% | R$ 10.752,00 |

Dedução anual por dependente: R$ 2.275,08
Limite anual educação: R$ 3.561,50 por pessoa
Desconto simplificado anual: até R$ 17.640,00
Saúde: sem limite

### 2.3 NOVIDADE 2026: Tabela de Redução Mensal (Lei 15.270/2025)

A partir de janeiro de 2026 (para declaração 2027):

| Renda tributável mensal | Efeito |
|------------------------|--------|
| Até R$ 5.000,00 | Isenção total (redutor zera o imposto) |
| R$ 5.000,01 a R$ 7.350,00 | Redução parcial e decrescente |
| Acima de R$ 7.350,00 | Sem redução adicional |

Tabela de redução anual: isenção até R$ 60.000,00; redução parcial entre R$ 60.000,01 e R$ 88.200,00.

IRPFM (alta renda): renda anual acima de R$ 600.000 → tributação mínima progressiva até 10% (afeta ~141 mil contribuintes). Renda acima de R$ 1.200.000 → alíquota mínima efetiva de 10%.

### 2.4 INSS

**CLT (2025):**

| Faixa | Alíquota |
|-------|----------|
| Até R$ 1.518,00 | 7,5% |
| R$ 1.518,01 a R$ 2.793,88 | 9% |
| R$ 2.793,89 a R$ 4.190,83 | 12% |
| R$ 4.190,84 a R$ 8.157,41 (teto) | 14% |

Contribuinte individual (autônomo): 20% sobre remuneração (até teto) ou 11% sobre salário mínimo.
Salário mínimo 2025: R$ 1.518,00

### 2.5 IR sobre Investimentos

**Renda fixa (tabela regressiva, Lei 11.033/2004, inalterada desde 2004):**

| Prazo | Alíquota |
|-------|----------|
| Até 180 dias | 22,5% |
| 181 a 360 dias | 20% |
| 361 a 720 dias | 17,5% |
| Acima de 720 dias | 15% |

**Fundos de curto prazo:** 22,5% (até 180d), 20% (acima)
**Fundos de ações:** 15%
**Ações (operações comuns):** 15% sobre ganho líquido. Isenção: vendas até R$ 20.000/mês.
**Ações (day trade):** 20%
**FIIs:** 20% sobre ganho de capital. Dividendos isentos (por enquanto).
**Previdência regressiva (PGBL/VGBL):** 35% (até 2 anos) → 10% (acima de 10 anos)

---

## 3. Fontes de Dados e Estratégia de Atualização

### 3.1 Dados automatizáveis (API)

| Dado | Fonte | Série/Endpoint | Frequência |
|------|-------|---------------|-----------|
| Selic meta | BCB/SGS | Série 432 | A cada reunião COPOM (~45 dias) |
| CDI | BCB/SGS | Série 12 | Diária |
| IPCA mensal | BCB/SGS | Série 433 | Mensal |
| IGP-M | BCB/SGS | Série 189 | Mensal |
| TR | BCB/SGS | Série 226 | Mensal |
| INPC | BCB/SGS | Série 188 | Mensal |
| Salário mínimo | BCB/SGS | Série 1619 | Anual (janeiro) |
| PTAX (câmbio) | BCB/SGS | Série 1 | Diária |

**Endpoint padrão BCB/SGS:**
```
https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/{N}?formato=json
```

### 3.2 Dados de atualização manual (verificação mensal)

| Dado | Fonte oficial | Quando atualizar | Quem publica |
|------|--------------|-----------------|-------------|
| Tabela progressiva IRPF | gov.br/receitafederal/tabelas/{ano} | Verificar mensalmente. Tipicamente muda em janeiro. | Receita Federal via IN |
| Limites de deduções (dependente, educação, simplificado) | Mesma página da RFB | Verificar mensalmente. | Receita Federal |
| Tabela de redução mensal (Lei 15.270/2025) | Legislação (Planalto) | Verificar mensalmente. Muda só por nova lei. | Congresso Nacional |
| Tabela INSS (faixas + teto) | Portaria MPS | Verificar mensalmente. Tipicamente muda em janeiro. | Ministério da Previdência |
| Prazos da declaração IRPF | IN RFB anual | Verificar mensalmente a partir de fevereiro. | Receita Federal |
| Alíquotas IPVA por UF | SEFAZ de cada estado | Verificar mensalmente. Tipicamente muda em janeiro. | 27 Secretarias de Fazenda |
| Calendário IPVA por UF | DETRAN de cada estado | Verificar mensalmente. | 27 DETRANs |

### 3.3 Dados que raramente mudam

| Dado | Última alteração | Risco de mudança |
|------|-----------------|-----------------|
| Tabela regressiva de renda fixa | 2004 (Lei 11.033) | Médio (reforma tributária pode alterar) |
| Alíquota ações (15%/20% day trade) | 2004 | Médio |
| Isenção R$ 20k/mês em vendas de ações | 2004 | Alto (proposta de redução para R$ 6k) |
| FIIs: dividendos isentos | 2004 | Alto (reforma tributária quer tributar) |
| Previdência tabela regressiva | 2005 | Baixo |

---

## 4. Arquitetura: Tabela `tax_parameters`

Já existe no banco. Estrutura versionada por ano-calendário:

```sql
-- Cada ano tem sua própria linha de parâmetros
-- O motor consulta: WHERE year = extract(year from current_date)
-- Quando a RFB publicar novos valores, insere nova linha para o novo ano

-- Campos principais:
-- irpf_brackets: jsonb (array de {min, max, rate, deduction})
-- irpf_reduction_brackets: jsonb (Lei 15.270/2025, array de {min, max, reduction})
-- inss_brackets: jsonb (array de {min, max, rate})
-- inss_ceiling: numeric
-- minimum_wage: numeric
-- dependent_deduction_monthly: numeric
-- dependent_deduction_annual: numeric
-- education_limit_annual: numeric
-- simplified_discount_monthly: numeric
-- simplified_discount_annual: numeric
-- health_deduction_limit: null (sem limite)
-- pgbl_limit_pct: 0.12 (12% da renda bruta)
-- investment_brackets: jsonb (tabela regressiva renda fixa)
-- stock_rate: 0.15
-- stock_daytrade_rate: 0.20
-- stock_exemption_monthly: 20000 (centavos: 2000000)
-- fii_rate: 0.20
-- irpfm_threshold_annual: 600000 (IRPFM alta renda)
-- irpfm_max_rate: 0.10
```

**Vantagem:** quando a legislação mudar, inserimos nova linha para o novo ano. O código não muda. O motor consulta os parâmetros do ano correto.

---

## 5. Cálculos que o Motor Executa

### 5.1 IRPF mensal (CLT)

```
1. salarioBruto
2. - INSS (tabela progressiva por faixa)
3. - dependentes × deduçãoMensal
4. - pensãoAlimentícia (se houver)
5. = baseDeCalculo
6. Se baseDeCalculo <= faixaIsenta: IR = 0
7. Senão: IR = (baseDeCalculo × alíquota) - parcelaDeduzir
8. Aplicar tabela de redução (Lei 15.270/2025) se ano >= 2026
9. IR final = max(0, IR - redução)
```

### 5.2 IRPF mensal (autônomo / carnê-leão)

```
1. rendimentoRecebidoPF (de pessoas físicas)
2. - INSS contribuinte individual (20% até teto)
3. - dependentes × deduçãoMensal
4. - livro-caixa (despesas dedutíveis da atividade)
5. = baseDeCalculo
6. Mesma tabela progressiva + redutor
```

### 5.3 Projeção anual (simulação de restituição)

```
1. Somar todos os rendimentos tributáveis do ano
2. Somar todas as deduções (saúde, educação, dependentes, INSS, PGBL)
3. Comparar: modelo simplificado (20% até R$ 17.640) vs. completo (soma das deduções)
4. Aplicar tabela progressiva anual sobre a base escolhida
5. Subtrair IR já retido na fonte durante o ano
6. Resultado positivo = imposto a pagar. Negativo = restituição.
```

### 5.4 Ganho de capital em investimentos

```
Ações:
1. preçoVenda - preçoCompra - custos (corretagem, emolumentos)
2. Se vendas no mês <= R$ 20.000: isento
3. Se vendas > R$ 20.000: 15% sobre ganho (ou 20% se day trade)
4. Gerar DARF código 6015 (operações comuns) ou 8468 (day trade)
5. Compensar prejuízos de meses anteriores (mesmo tipo)

Renda fixa:
1. rendimentoBruto
2. Aplicar alíquota pela tabela regressiva (baseado em dias corridos)
3. IR retido na fonte (automático pelo banco)
4. Informar na declaração como rendimento tributável exclusivo na fonte
```

---

## 6. Validação e Confiabilidade

### 6.1 Testes unitários obrigatórios

Cada cálculo tributário precisa de testes com cenários reais:

| Cenário de teste | O que valida |
|-----------------|-------------|
| CLT salário R$ 5.000 com 2 dependentes | Cálculo INSS + IRPF + redutores |
| Autônomo R$ 15.000/mês sem dependentes | Carnê-leão |
| Hybrid Earner (CLT R$ 8.000 + PJ R$ 12.000) | Consolidação de fontes |
| Venda de ações R$ 18.000 (abaixo isenção) | Isenção correta |
| Venda de ações R$ 25.000 com lucro R$ 3.000 | DARF de 15% |
| CDB resgatado com 400 dias | Alíquota 17,5% |
| Restituição com modelo simplificado vs. completo | Comparação correta |
| Renda R$ 5.000/mês em 2026 | Isenção total (Lei 15.270) |
| Renda R$ 6.500/mês em 2026 | Redução parcial |
| Alta renda R$ 80.000/mês | IRPFM 10% |

### 6.2 Checagem cruzada com simuladores oficiais

A Receita Federal disponibiliza simulador de alíquotas efetivas. Após implementar o motor, rodar os mesmos cenários no simulador da RFB e comparar resultados. Divergência = bug.

### 6.3 Verificação mensal de parâmetros (cron ou manual)

Frequência: **mensal** (todo dia 1 ou primeiro dia útil do mês).

Checklist de verificação:
1. Acessar gov.br/receitafederal/tabelas/{ano} - tabela IRPF vigente
2. Verificar se houve nova IN RFB publicada no DOU (busca: "instrução normativa" + "imposto de renda" + "pessoa física")
3. Verificar se houve nova Portaria MPS (tabela INSS)
4. Verificar se houve alteração no salário mínimo
5. Verificar se houve nova legislação aprovada (Planalto) que afete PF
6. Comparar com os valores na tabela `tax_parameters` do ano vigente

Se houver divergência: atualizar `tax_parameters` imediatamente e notificar usuários que cálculos foram corrigidos.

Se não houver divergência: registrar a verificação (log com data e resultado "sem alterações").

A Onie pode automatizar parte dessa verificação via web scraping da página da Receita Federal, mas a confirmação final é humana. Não confiar cegamente em scraping para dados fiscais.

---

## 7. O que o Oniefy Mostra ao Usuário

### 7.1 Tela de Impostos (dentro de "Mais")

**Visão geral:**
- IRPF estimado no ano corrente (barra de progresso)
- Restituição ou imposto a pagar (projeção)
- Próximo prazo fiscal (DARF, declaração)
- Total de deduções acumuladas (saúde + educação)

**Detalhamento:**
- Rendimentos tributáveis por fonte (CLT, autônomo, aluguel, investimentos)
- Deduções por categoria (saúde, educação, dependentes, previdência)
- Comparação simplificado vs. completo (qual é melhor?)
- Ganho de capital por investimento (com DARF gerado)
- Calendário fiscal (IPVA, IPTU, IRPF, DARFs)

**Exportação:**
- XLSX para preenchimento da declaração (E8, já implementado)
- PDF para o contador (E34)

### 7.2 Integração com outras funcionalidades

| Funcionalidade | Como alimenta o motor fiscal |
|---------------|----------------------------|
| Transações categorizadas como "Saúde" | Soma automática para dedução |
| Transações categorizadas como "Educação" | Soma automática com limite por pessoa |
| Módulo de investimentos (E24) | Ganho de capital, rendimentos |
| B3 API (E25) | Posições, vendas, dividendos |
| Importação de faturas (E19) | Despesas dedutíveis identificadas |
| Membros familiares (E16) | Dependentes para dedução |

---

## 8. Decisões Registradas

| # | Decisão | Data |
|---|---------|------|
| 1 | Legislação PF muda pouco. Tabela IRPF 1x/ano. Regressiva renda fixa não muda desde 2004. | 02/04/2026 |
| 2 | Arquitetura: tabela `tax_parameters` versionada por ano-calendário. Código não muda, dados sim. | 02/04/2026 |
| 3 | Verificação mensal obrigatória (A8), não anual. Mudança legislativa pode ocorrer a qualquer momento. | 02/04/2026 |
| 4 | Fontes: BCB/SGS (automático), Receita Federal (manual 1x/ano), IBGE/SIDRA (automático). | 02/04/2026 |
| 5 | Disclaimer sempre presente: "Consulte seu contador para situações específicas." | 02/04/2026 |
| 6 | Simulador da RFB como fonte de validação cruzada dos cálculos. | 02/04/2026 |
| 7 | Impostos fica na tab "Mais" como primeiro item com destaque visual. Na época do IRPF, Onie promove atalho no Início. | 02/04/2026 |
| 8 | Lei 15.270/2025 (Reforma da Renda) já incorporada: isenção até R$ 5k, redução parcial até R$ 7.350, IRPFM para alta renda. | 02/04/2026 |

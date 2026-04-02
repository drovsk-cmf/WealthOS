# ONIEFY - Sistema de Parcelamento de Cartão de Crédito

## Documento de Especificação

**Data de criação:** 02 de Abril de 2026
**Status:** Especificado (pronto para implementação)
**Dependência:** E19 (Motor de importação de faturas) para importação automática

---

## 1. O Problema

O parcelamento é o método dominante de compra no Brasil. O usuário precisa:
- Saber quanto deve no total (saldo devedor de todas as parcelas futuras)
- Projetar as próximas faturas (quanto vai pagar nos próximos 3-6 meses)
- Reconciliar parcelas com o que aparece na fatura real
- Lidar com a aritmética do centavo (primeira parcela diferente das demais)

---

## 2. Aritmética do Centavo

Regra universal do mercado brasileiro: quando a divisão gera centavos fracionários, a primeira parcela absorve a diferença.

```
valorTotal = 14317       // em centavos (R$ 143,17)
parcelas = 5
valorBase = floor(valorTotal / parcelas)           // 2863 (R$ 28,63)
restoCentavos = valorTotal - (valorBase * parcelas) // 2 centavos
primeiraParcela = valorBase + restoCentavos         // 2865 (R$ 28,65)
demaisParcelas = valorBase                          // 2863 (R$ 28,63)
```

O app faz essa conta automaticamente em toda compra parcelada. Quando o usuário registra "R$ 143,17 em 5x", o sistema gera as 5 parcelas com valores corretos e distribui nas faturas futuras.

---

## 3. Registro de Compra Parcelada (manual)

Quando o usuário registra uma compra parcelada:

**Campos:**
- Descrição (ex: "TV Samsung 55 polegadas")
- Valor total da compra
- Número de parcelas
- Cartão utilizado (select)
- Data da compra
- Categoria

**O sistema gera automaticamente:**
- N parcelas com valores corretos (aritmética do centavo)
- Distribui nas faturas futuras com base na data de fechamento do cartão
- Primeira parcela na próxima fatura (ou fatura atual, dependendo da data vs. fechamento)

---

## 4. Extração de Parcelas na Importação de Faturas

### 4.1 Formatos identificados (6 bancos analisados)

| Banco | Formato | Exemplo | Onde está |
|-------|---------|---------|-----------|
| Mercado Pago | "Parcela N de M" | "MERCADOLIVRE*RESOLVE Parcela 15 de 18" | Texto da descrição |
| Bradescard | "(NN/NN)" | "AMAZON MARKETPLACE SAO PAULO(13/13)" | Texto da descrição |
| BTG (com regex) | "(N/M)" | "Shopee (9/9)", "Decolar (6/12)" | Texto da descrição |
| BTG (sem regex) | Tipo de compra | "Parcela de compra pos", "Parcela sem juros" | Coluna Tipo (sem N/M) |
| Itaú | "*LETRA N/M" | "SAMSUNG *I 19/24" | Texto da descrição |
| Porto Bank | "PA/NN" | "PORTO SEGURO AUTO PA/05 BZ" | Texto da descrição (provável) |
| XP | Coluna dedicada | "14 de 18" | Coluna Parcela separada |

### 4.2 Regex unificado

Ordem de aplicação (do mais específico ao mais genérico):

```regex
1. (?:parcela\s+)(\d{1,2})\s+de\s+(\d{1,2})       → "Parcela 15 de 18"
2. \((\d{1,2})\/(\d{1,2})\)                          → "(13/13)"
3. \*[A-Z]\s*(\d{1,2})\/(\d{1,2})                    → "*I 19/24"
4. PA\/(\d{1,2})                                      → "PA/05"
5. \b(\d{1,2})\/(\d{1,2})\b                          → "6/12" (genérico)
6. (\d{1,2})\s+de\s+(\d{1,2})                        → "14 de 18" (XP coluna)
```

### 4.3 Pipeline de identificação de parcelas

Para cada lançamento importado, o motor executa nesta ordem:

**Etapa 1: Coluna dedicada** (XP tem coluna "Parcela")
→ Se encontrou: extrai N e M diretamente.

**Etapa 2: Campo "Tipo de compra"** (BTG tem "Parcela sem juros", "Parcela de compra pos", "Compra à vista")
→ Se tipo contém "parcela": sabe que é parcelamento.
→ Se tipo contém "à vista": sabe que não é parcelamento.

**Etapa 3: Regex na descrição**
→ Aplica os 6 patterns na ordem. Se encontrar: extrai N e M. Limpa a descrição (remove o trecho de parcela).

**Etapa 4: Inferência por histórico**
→ Se regex não encontrou nada, busca no histórico de faturas anteriores por lançamentos com mesma descrição e valor idêntico (ou ±1-2 centavos, caso da dízima).
→ Se encontrar: sugere como parcela. "Este lançamento de R$ 28,63 parece ser parcela de uma compra. Confirma?"

**Etapa 5: Sem informação**
→ Se é primeira fatura e não há regex nem tipo: registra como lançamento avulso.
→ Se tipo indica parcela mas sem N/M: marca como "Parcela ?/?" e pergunta ao usuário.

---

## 5. Reconstrução Reversa (da parcela ao valor total)

Quando o parser importa uma parcela intermediária (ex: parcela 3/10 com valor R$ 28,63):

```
Se parcelaAtual > 1:
  valorEstimadoTotal = valor * parcelaTotal
  // Mas a primeira parcela pode ter sido 1 ou 2 centavos a mais
  // Faixa: valorEstimadoTotal até valorEstimadoTotal + (parcelaTotal - 1) centavos

Se parcelaAtual == 1:
  // Esta é a primeira parcela. Para calcular o total:
  // Precisamos da segunda parcela para saber o valor base
  // valorTotal = primeiraParcela + (valorBase * (parcelaTotal - 1))
  // Mas não temos valorBase ainda → esperar próxima fatura ou perguntar
```

Se o app tiver a primeira e a segunda parcela: calcula o total com precisão.
Se não tiver: registra valor estimado e ajusta quando a informação aparecer.
A Onie pode perguntar: "Qual foi o valor total da compra?"

---

## 6. Reconciliação de Parcelas

### 6.1 Fatura importada vs. parcelas projetadas

Quando uma fatura é importada, o motor compara com as parcelas que o app projetou:

| Cenário | Detecção | Ação |
|---------|----------|------|
| Parcela esperada aparece na fatura com valor correto | Automático | Match. Marca como "reconciliado". |
| Parcela esperada aparece com valor diferente (>2 centavos) | Automático | Alerta âmbar: "Parcela 5/10 veio R$ 28,70, esperado R$ 28,63." |
| Parcela esperada NÃO aparece na fatura | Automático | Alerta vermelho: "Parcela 5/10 não apareceu nesta fatura. Operadora pode ter pulado." |
| Item da fatura é parcela mas não estava projetada | Automático | Alerta âmbar: "Encontrei parcela 3/10 de R$ 555,42 na Amazon que não estava cadastrada." |
| Valor total projetado da fatura não bate com total real | Automático | Alerta âmbar: "Projeção era R$ 4.200, fatura real R$ 4.350. Diferença de R$ 150." |

### 6.2 Parcelas que pulam misteriosamente

Problema real reportado pelo Claudio: operadoras às vezes não lançam a parcela na sequência, pulando 1 mês sem motivo.

**Solução:** quando uma parcela projetada não aparece na fatura, o app:
1. Gera alerta vermelho no sininho
2. Não remove a parcela do projetado (pode cair na próxima fatura)
3. Na fatura seguinte, se a parcela aparecer: reconcilia e resolve automaticamente
4. Se duas faturas seguidas sem a parcela: alerta crítico "Parcela ausente há 2 meses"

---

## 7. Visualização de Parcelas

### 7.1 Por compra

```
TV Samsung 55" - Magazine Luiza
Valor total: R$ 3.499,00 em 10x
Parcela atual: 4/10
Próxima parcela: R$ 349,90 (fatura mar/2026)
Restante: 6 parcelas × R$ 349,90 = R$ 2.099,40
Início: out/2025 | Término previsto: jul/2026
```

### 7.2 Por cartão (saldo devedor total)

```
Cartão BTG (final 9109)
Fatura atual: R$ 20.044,65 (vence 15/02)
Saldo devedor total (todas as parcelas futuras): R$ 12.380,00
  Próxima fatura (mar): R$ 8.200,00
  abr: R$ 6.100,00
  mai: R$ 4.800,00
  jun-jul: R$ 2.400,00 (últimas parcelas)
Compras parceladas ativas: 8
```

### 7.3 Projeção de faturas futuras (3-6 meses)

Mostra uma timeline com o valor projetado de cada fatura futura, considerando todas as parcelas em andamento. A Onie alerta se uma fatura projetada ultrapassar o limite do cartão ou se a concentração de vencimentos for perigosa.

---

## 8. Dados Disponíveis por Banco

4 dos 6 bancos analisados fornecem gratuitamente na fatura o total de parcelas a vencer:

| Banco | Campo | Valor exemplo |
|-------|-------|--------------|
| Mercado Pago | "Compras parceladas" (lançamentos futuros) | R$ 997,35 |
| Itaú | "Total para próximas faturas" | R$ 2.671,65 |
| Porto Bank | "Total de despesas parceladas a vencer" + breakdown mensal | R$ 2.471,60 (Abril R$ 494, Maio R$ 494, Demais R$ 1.483) |
| Bradescard | "Total parcelado para as próximas faturas" | R$ 2.277,26 |
| BTG | Não informado na fatura | - |
| XP | Não visível na amostra | - |

O parser extrai esses valores do cabeçalho/resumo da fatura. Mesmo sem reconstruir cada compra individualmente, o app mostra o saldo devedor total imediatamente na primeira importação.

---

## 9. Fluxo Completo de Importação + Parcelas

```
1. Usuário importa fatura (upload ou email)
2. Parser identifica banco, extrai lançamentos
3. Para cada lançamento:
   a. Regex de parcela → se encontrou, marca como parcela N/M
   b. Tipo de compra → se "parcela", marca como parcelamento
   c. Match com parcelas projetadas → se bateu, reconcilia
   d. Match com fingerprint de recorrência → se bateu, vincula à assinatura
   e. Categorização automática
4. Apresentação em 3 zonas:
   - Resolvidos (verde): matches de alta confiança. "Tudo certo" com 1 botão.
   - Sugestões (âmbar): hipóteses a confirmar. "Parece ser parcela 3/10. Confirma?"
   - Novos (neutro): nunca vistos. Categorizar e informar se é parcelamento.
5. Pós-confirmação:
   - Atualiza parcelas futuras nas projeções
   - Atualiza saldo devedor total do cartão
   - Atualiza projeção das próximas 3-6 faturas
```

---

## 10. Decisões Registradas

| # | Decisão | Data |
|---|---------|------|
| 1 | Aritmética do centavo: primeira parcela absorve a diferença | 01/04/2026 |
| 2 | 6 formatos de regex para parcela (cobre 6 bancos analisados) | 01/04/2026 |
| 3 | Pipeline de 5 etapas para identificar parcelas (coluna → tipo → regex → histórico → manual) | 01/04/2026 |
| 4 | Parcela que não aparece na fatura gera alerta vermelho imediato | 01/04/2026 |
| 5 | Total de parcelas a vencer extraído do cabeçalho da fatura (4 de 6 bancos fornecem) | 01/04/2026 |
| 6 | 3 zonas visuais na importação: resolvidos, sugestões, novos | 01/04/2026 |
| 7 | Projeção de faturas futuras com base em parcelas ativas | 01/04/2026 |

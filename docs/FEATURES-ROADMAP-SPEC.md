# ONIEFY - Funcionalidades Identificadas no Redesign

## Documento de Referência

**Data de criação:** 02 de Abril de 2026
**Status:** Decisões tomadas por Claudio, não implementar até fechar redesign conceitual
**Origem:** Exercício "como a pessoa vive" (sessão 37)

---

## 1. Visão Geral

Mapeamento de funcionalidades faltantes identificadas ao percorrer o dia, semana, mês e ano da vida do Hybrid Earner. Cada item foi avaliado pelo Claudio com prioridade e observações.

---

## 2. Funcionalidades com Decisão

| # | Funcionalidade | Avaliação Claudio | Prioridade | Observações |
|---|---------------|-------------------|-----------|-------------|
| 1 | Registro ultrarrápido (widget, voz, push, share, texto) | Fazer | H1 | Documentado em QUICK-REGISTER-SPEC.md. Combinar várias formas. |
| 2 | Controle de "quem me deve" (empréstimos informais) | Não fazer agora | - | Viraria "receita futura a receber". Não é foco. |
| 3 | Calendário financeiro visual (vencimentos no mês) | Importante | H1 | Não é lista de contas a pagar. É visualização em calendário com concentração de vencimentos e projeção de saldo. |
| 4 | Detector automático de recorrências | Super importante | H1 | Quando cobrança aparece 3 meses seguidos com valor e descrição similares, sugere como recorrente. Alimenta gerenciador de assinaturas e calendário financeiro. |
| 5 | Alerta de preço anormal em cobranças recorrentes | Super importante | H1 | "Sua conta de luz é R$ 480. Média 6 meses: R$ 290. Aumento de 65%." Vale para qualquer cobrança recorrente. |
| 6 | Consolidação por veículo (custo total) | Já decidido | - | Faz parte da Zona 6 (custo de manutenção por bem patrimonial). Gasolina, pedágio, IPVA, seguro, manutenção, estacionamento, multas, lavagem. Não deveria estar na lista como "faltando". |
| 7 | Consolidação saúde + educação (IRPF) | Crucial | H1 | Plano de saúde, consultas, exames, farmácia, dentista. Escola, faculdade, cursos. Importante para: (a) saber quanto gasta, (b) alimentar deduções do IRPF (médicas são ilimitadas, educação com limite). |
| 8 | Rastreador de garantias | Importante | H2 | Alerta 30 dias antes do vencimento. Recibo/NF no vault de documentos do patrimônio. **Especialmente garantias oferecidas pelo cartão de crédito** (garantia estendida). |
| 9 | Calendário fiscal/tributário anual | Importante | H1 | Jan: IPVA/IPTU. Mar-Abr: IRPF. DARFs de ganho de capital. **Precisa de consultas frequentes a fontes na internet** para manter atualizado (prazos mudam). |
| 10 | Comparativo anual + detector de reajustes | Básico, precisa ter | H2 | "Em 2025 gastou R$ 184k. 2026 projeta R$ 198k. +7,6%, acima da inflação de 5,2%." Detector de reajustes: compara cada reajuste com inflação oficial. "Condomínio subiu 15%, quase 3x a inflação." |
| 11 | Provisão de gastos sazonais | Importante | H2 | Deve constar no orçamento. Se não houver orçamento, alerta 3 meses antes: "Nos últimos 2 anos, compras de supermercado aumentam em dezembro. Matrícula escolar em janeiro. Quer provisionar?" |
| 12 | Acesso read-only para o contador | Nice to have | H3 | Link seguro, temporário, mostra só módulo fiscal. "Compartilhar com meu contador." Charme profissional. |
| 13 | Testamento digital / dead man's switch | Importante | H3 | Se usuário não acessar por X meses, contato de confiança recebe acesso. **Atenção a questões legais envolvidas.** Precisa de consultoria jurídica antes de implementar. |
| 14 | Relatório anual consolidado | Fazer | H2 | Duas versões: (a) PDF formal (para consultor financeiro, contador). (b) Estilo descontraído tipo Spotify Wrapped ("este fornecedor foi seu sócio ao longo do ano... 20% da receita entregue a ele"). |

---

## 3. Detalhamento dos Itens Prioritários

### 3.1 Calendário Financeiro Visual (#3)

Não é uma lista. É um calendário onde o usuário vê:
- Dia 5: cai o salário CLT
- Dia 8: vence fatura Nubank
- Dia 10: vence luz e água
- Dia 15: parcela do financiamento
- Dia 20: condomínio

A visualização mostra concentração de vencimentos e dias de "aperto". A Onie projeta: "Você tem R$ 4.800 em vencimentos entre os dias 8 e 15, mas o salário cai só no dia 5. Saldo projetado no dia 12: R$ 1.200."

Alimentado por: cobranças recorrentes detectadas + parcelas de financiamento + faturas de cartão + boletos importados por e-mail.

### 3.2 Detector de Recorrências (#4)

Lógica:
```
Se uma cobrança aparece ≥3 meses seguidos
  com valor similar (tolerância de ±5% para concessionárias, exato para assinaturas)
  e descrição similar (token overlap > 60%)
→ Sugere: "Parece uma despesa recorrente. Quer que eu acompanhe?"
```

Quando confirmada pelo usuário:
- Entra no gerenciador de assinaturas (se for assinatura)
- Entra no calendário financeiro (vencimento previsto)
- Alimenta o alerta de preço anormal (#5)
- Alimenta o detector de reajustes (#10)

### 3.3 Alerta de Preço Anormal (#5)

Lógica:
```
Para cada cobrança recorrente confirmada:
  média_6_meses = média dos últimos 6 valores
  se valor_atual > média_6_meses × 1.30 (aumento > 30%):
    alerta vermelho: "Conta de luz subiu 65%. Média era R$ 290, veio R$ 480."
  se valor_atual > média_6_meses × 1.15 (aumento > 15%):
    alerta âmbar: "Conta de água subiu 18%."
```

Limiares configuráveis pelo usuário. Default: 15% âmbar, 30% vermelho.

### 3.4 Consolidação Saúde + Educação (#7)

Categorias que alimentam o IRPF:

**Saúde (dedução ilimitada no IRPF):**
- Plano de saúde (mensal)
- Consultas médicas
- Exames laboratoriais
- Internações
- Dentista
- Psicólogo/Psiquiatra
- Fisioterapia
- Farmácia (não dedutível, mas importante para controle)
- Óculos/lentes

**Educação (dedução limitada no IRPF, ~R$ 3.561,50 por dependente em 2025):**
- Escola (mensalidade)
- Faculdade/pós-graduação
- Cursos técnicos
- Material escolar (não dedutível, mas controle)

O app consolida automaticamente por categoria e membro da família. Na época do IRPF, exporta: "Total de despesas médicas dedutíveis em 2025: R$ 24.800 (Claudio: R$ 12.300, Cônjuge: R$ 8.500, Filho: R$ 4.000)."

### 3.5 Rastreador de Garantias (#8)

Cada bem patrimonial pode ter garantias vinculadas:

| Tipo de garantia | Prazo típico | Fonte |
|-----------------|-------------|-------|
| Garantia do fabricante | 1 ano | Nota fiscal (cadastro manual) |
| Garantia estendida do cartão de crédito | +1 ano além do fabricante | Regra do cartão (automático se souber o cartão usado) |
| Garantia contratual (loja) | Variável | Contrato/recibo |
| Garantia legal (CDC) | 30 dias (não durável) ou 90 dias (durável) | Automático |

A Onie alerta 30 dias antes do vencimento: "A garantia do seu MacBook vence em 20 dias. O recibo está nos seus documentos."

**Garantias do cartão de crédito:** se a compra foi feita no cartão X que oferece garantia estendida de 1 ano, o app calcula automaticamente: garantia total = fabricante + extensão do cartão.

---

## 4. Decisões Registradas

| # | Decisão | Data |
|---|---------|------|
| 1 | Item 2 (quem me deve) não será implementado agora | 01/04/2026 |
| 2 | Item 6 (consolidação veículo) já existe como parte da Zona 6 | 01/04/2026 |
| 3 | Itens 3, 4, 5, 7, 9 são H1 (prioritários) | 01/04/2026 |
| 4 | Itens 8, 10, 11, 14 são H2 | 01/04/2026 |
| 5 | Itens 12, 13 são H3 | 01/04/2026 |
| 6 | Garantias do cartão de crédito incluídas no rastreador (#8) | 01/04/2026 |
| 7 | Calendário fiscal precisa de consultas à internet (prazos mudam) | 01/04/2026 |
| 8 | Testamento digital requer consultoria jurídica antes de implementar | 01/04/2026 |
| 9 | Relatório anual em duas versões: formal (PDF) + descontraído (Wrapped) | 01/04/2026 |
| 10 | Provisão sazonal: consta no orçamento; se não houver, alerta 3 meses antes | 01/04/2026 |

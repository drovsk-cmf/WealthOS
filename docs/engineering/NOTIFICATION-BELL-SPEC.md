# ONIEFY - Sininho de Pendências (Painel de Atenção da Onie)

## Documento de Especificação

**Data de criação:** 02 de Abril de 2026
**Status:** Decisão tomada, não implementar até fechar redesign conceitual

---

## 1. Conceito

O sininho é o ponto único de consolidação de tudo que precisa de ação ou ciência do usuário. Fica no topo direito da tela como ícone persistente e discreto, acessível de qualquer tela do app.

**Não é uma tab.** É um overlay/modal que abre sobre a tela atual. O usuário resolve pendências e continua onde estava.

### 1.1 Por que não uma tab dedicada

- Não consome espaço na tab bar (libera posição para zonas mentais prioritárias)
- Acessível de qualquer tela (o usuário vê o badge sem sair de onde está)
- Padrão universal (todo mundo sabe o que sininho com badge significa)

---

## 2. Estados Visuais

| Estado | Indicador | Significado |
|--------|-----------|------------|
| Pendências que exigem ação | Badge numérico vermelho (ex: "3") | O usuário precisa decidir algo |
| Itens informativos (sem ação necessária) | Ponto vermelho (sem número) | O usuário deveria saber, mas não precisa agir |
| Tudo limpo | Sem indicador | Nenhuma pendência. "Inbox zero financeiro." |

---

## 3. Tipos de Itens no Painel

### 3.1 Ações Necessárias (badge numérico)

| Tipo | Exemplo | Ação do usuário |
|------|---------|----------------|
| Duplicata para confirmar | "Duas compras de R$ 2,00 na Padaria Silva. São diferentes?" | [Sim, são duas] [Não, é a mesma] |
| Fatura importada aguardando revisão | "12 lançamentos do BTG, 3 para revisar" | Toque para revisar |
| Workflow de erro de importação | "Não consegui abrir a fatura do Porto Bank" | Informar senha ou descartar |
| Remetente desconhecido (e-mail) | "Recebi e-mail de fatura@xyz.com. Autorizar?" | [Autorizar] [Descartar] |
| Parcela não identificada | "R$ 555 na Amazon é parcelada? Em quantas vezes?" | Informar ou ignorar |
| Lançamento do extrato sem correspondência | "Novo: R$ 184,87 ConectCar. Quer adicionar?" | [Adicionar] [Ignorar] |
| Valor divergente | "Extrato: R$ 45,00 iFood. Seu registro: R$ 43,00. Qual correto?" | Escolher ou editar |
| Aprovação de orçamento (membro familiar) | "Filho pediu R$ 200 para material escolar" | [Aprovar] [Rejeitar] [Ajustar] |
| Atualização manual necessária | "Atualize o saldo da previdência Brasilprev" | Digitar valor |

### 3.2 Informativos (ponto vermelho sem número)

| Tipo | Exemplo |
|------|---------|
| Fatura processada com sucesso | "Importei fatura do Mercado Pago. 10 lançamentos, todos reconciliados." |
| Alerta de preço anormal | "Conta de luz subiu 65% vs. média dos últimos 6 meses." |
| Vencimento próximo | "Fatura do Nubank vence amanhã: R$ 4.200" |
| Garantia prestes a vencer | "Garantia do MacBook vence em 20 dias" |
| Provento recebido | "Dividendo HGLG11: R$ 0,78/cota. Total: R$ 156,00 creditado." |
| Parcela esperada que não apareceu | "Parcela 5/10 da compra X não apareceu na fatura deste mês." |
| Reajuste detectado | "Condomínio subiu de R$ 850 para R$ 980 (+15,3%)" |
| Processamento de e-mail encaminhado | "Recebi e processei a fatura do Itaú via e-mail." |
| Orçamento excedido | "Categoria Alimentação atingiu 95% do orçamento mensal." |

---

## 4. Estrutura de Cada Item

Cada item no painel contém:

| Campo | Descrição |
|-------|-----------|
| Prioridade visual | Vermelho (urgente), Âmbar (ação necessária), Neutro (informativo) |
| Contexto | 1-2 frases da Onie explicando o que é |
| Ação primária | Botão que resolve o caso mais comum (1 toque) |
| Ação secundária | Link para mais detalhes ou ação alternativa |
| Data de criação | Para ver há quanto tempo está pendente |
| Status | Pendente, Resolvido, Dispensado |

---

## 5. Comportamento

### 5.1 Abertura

Toque no sininho → painel desliza de cima para baixo (ou modal) sobre a tela atual. A tela anterior fica visível atrás (dimmed). O usuário resolve e fecha. Não é navegação, é overlay.

### 5.2 Resolução

Cada item resolvido some do painel com animação suave. O badge numérico decrementa em tempo real. Quando zera, mostra o orb da Onie em estado idle com mensagem: "Tudo em ordem."

### 5.3 Persistência

Itens informativos (ponto) desaparecem após 7 dias ou após o usuário visualizar. Itens de ação (badge) permanecem até resolvidos ou dispensados explicitamente.

### 5.4 Ordenação

1. Ações urgentes (vermelho) primeiro
2. Ações necessárias (âmbar) em seguida
3. Informativos (neutro) por último
4. Dentro de cada grupo, mais recentes no topo

---

## 6. Decisões Registradas

| # | Decisão | Data |
|---|---------|------|
| 1 | Sininho persistente no topo direito, não tab dedicada | 01/04/2026 |
| 2 | Badge numérico para ações, ponto vermelho para informativos | 01/04/2026 |
| 3 | Painel é overlay/modal, não página de navegação | 01/04/2026 |
| 4 | Inclui processamento de e-mails encaminhados para ciência do usuário | 02/04/2026 |
| 5 | Itens informativos desaparecem após 7 dias ou visualização | 02/04/2026 |
| 6 | "Tudo em ordem" com orb da Onie quando inbox zero | 02/04/2026 |

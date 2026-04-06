# ONIEFY - Motor de Deduplicação Multi-Fonte

## Documento de Especificação

**Data de criação:** 02 de Abril de 2026
**Status:** Em discussão (não implementar até fechar redesign conceitual)
**Criticidade:** Máxima (duplicata destrói confiança do usuário)

---

## 1. O Problema

O Oniefy recebe transações de até 5 fontes diferentes que alimentam o mesmo funil:

1. Registro manual (digitou no app)
2. Mensagem rápida / widget / voz
3. Captura de notificação push do banco
4. Importação de fatura/extrato (upload ou e-mail)
5. Open Finance (futuro)

Qualquer par dessas fontes pode gerar duplicata para a mesma transação real. São 10 combinações possíveis de colisão.

**Uma duplicata num app financeiro destrói a confiança do usuário instantaneamente.** Se ele vê R$ 45 do iFood duas vezes, pensa "esse app não funciona" e nunca mais confia nos números.

---

## 2. Princípio Fundamental

**Cada push do banco é uma transação real até que se prove o contrário.**

Se o banco enviou duas notificações de R$ 2,00 do mesmo fornecedor com 3 minutos de diferença, são duas compras. O banco não envia push duplicada com conteúdo idêntico por engano. Timestamps diferentes = transações diferentes.

A deduplicação entra apenas no **cruzamento entre fontes**, não dentro da mesma fonte.

---

## 3. Resolução Imediata de Ambiguidades

**Toda ambiguidade é resolvida no momento em que surge, não acumulada para depois. A Onie não procrastina.**

Quando a segunda push chega (14:05, R$ 2,00, Padaria Silva, 3 minutos após a primeira), a Onie imediatamente mostra:

```
"Registrei outra compra de R$ 2,00 na Padaria Silva (a anterior foi há 3 minutos).
São duas compras diferentes?
[Sim, são duas]  [Não, é a mesma]"
```

- Se confirma: ambas ficam, marcadas como "confirmadas pelo usuário". Nenhuma fonte futura questiona.
- Se diz que é a mesma: descarta a segunda, registra a decisão.
- Se não responder: ambas ficam provisoriamente. Card de confirmação permanece na fila do sininho até ser resolvido. Se o extrato/fatura confirmar as duas, o card é resolvido automaticamente.

---

## 4. Funil de 3 Filtros

Nenhum lançamento entra no banco de dados sem passar por este funil. Os filtros são aplicados na ordem.

### 4.1 Filtro 1: Match Exato (alta confiança, 95%+)

```
mesma conta/cartão
+ mesmo valor (centavo exato)
+ mesma data (ou diferença de até 1 dia)
```

**Tolerância de 1 dia na data:** a notificação push pode dizer "15/03", mas o extrato registra "16/03" (processamento D+1). A fatura do cartão pode mostrar data diferente da notificação.

**Ação:**
- Se veio de captura automática (push, import): descarta silenciosamente.
- Se veio de registro manual: alerta ao usuário: "Parece que este lançamento de R$ 45,00 no dia 15/03 já está registrado. É o mesmo?"

### 4.2 Filtro 2: Match por Similaridade (média confiança)

```
mesma conta/cartão
+ valor idêntico (centavo exato)
+ data dentro de 3 dias
+ descrição similar (distância de Levenshtein < 40% OU token overlap > 60%)
```

Exemplos:
- Manual: "iFood R$ 45" dia 15 vs. Push: "IFOOD *IFOOD R$ 45,00" dia 15 → match
- Manual: "Uber 36" dia 15 vs. Extrato: "UBER *TRIP R$ 36,00" dia 16 → match

**Ação:** marca como "possível duplicata" e pergunta ao usuário imediatamente:

```
"Encontrei um lançamento parecido:
  R$ 36,00 Uber em 15/03 (registrado manualmente)
Este novo lançamento:
  R$ 36,00 UBER *TRIP em 16/03 (extrato bancário)
É o mesmo?
[Sim, é o mesmo]  [Não, são diferentes]"
```

- Se confirma: mescla (mantém versão com mais informação, preserva categorização do usuário).
- Se diz que são diferentes: ambas ficam. O motor registra que "mesmo valor + mesma data + descrição similar NESTE caso não é duplicata". Não pergunta de novo para esse padrão.

### 4.3 Filtro 3: Match por Código de Autorização (confiança máxima, 100%)

```
mesmo código de autorização = mesma transação, sem dúvida
```

Disponível quando: BTG (já tem no extrato), Open Finance (futuro).

**Ação:** mescla automaticamente sem perguntar. O código de autorização é identificador único da transação no banco.

Exemplo: extrato BTG traz código `WHUVMC` e a captura de notificação também traz `WHUVMC` → mesma transação. O cancelamento de "Culinaria Sauda" referencia o mesmo código da compra original.

---

## 5. Hierarquia de Fontes (qual versão prevalece)

| Conflito | Qual prevalece | Razão |
|----------|---------------|-------|
| Manual vs. Notificação push | Mescla: categoria do manual + dados da push | Manual tem intenção, push tem dados precisos |
| Manual vs. Extrato/Fatura | Mescla: categoria do manual + dados do extrato | Extrato é fonte oficial |
| Notificação push vs. Extrato | Extrato prevalece | Extrato é mais completo e oficial |
| Qualquer fonte vs. Open Finance | Open Finance prevalece | Fonte mais autoritativa |
| Manual vs. Manual (duplo registro) | Pergunta ao usuário | Pode ser erro ou intencional |

**Regra geral:** dados do banco prevalecem para valor, data e descrição. Dados do usuário prevalecem para categoria, membro, notas e tags.

---

## 6. Fingerprint de Transação

Cada transação recebe um fingerprint no momento da criação:

```typescript
interface TransactionFingerprint {
  accountId: string;          // conta/cartão
  amountCents: number;        // valor em centavos
  dateRange: [Date, Date];    // data -1 dia a +1 dia
  descriptionTokens: string[]; // tokens normalizados da descrição
  authCode?: string;          // código de autorização se disponível
  source: 'manual' | 'notification' | 'import' | 'open_finance';
}
```

Busca de candidatas a duplicata:

```sql
SELECT * FROM transactions
WHERE account_id = $1
  AND amount = $2
  AND date BETWEEN $3 - interval '1 day' AND $3 + interval '1 day'
  AND deleted_at IS NULL
```

Se retornar resultados, aplica os filtros 1-3 na ordem.

---

## 7. Casos Especiais

### 7.1 Duas compras idênticas legítimas

Dois cafés de R$ 8,50 no mesmo dia no mesmo lugar. É real.

**Solução:** filtro 2 pega como "possível duplicata". Usuário diz "são diferentes". O motor registra: "transações com valor R$ 8,50 em [estabelecimento] podem ocorrer mais de 1x no mesmo dia." Nas próximas ocorrências, não pergunta (ou pergunta diferente: "Mais um café de R$ 8,50 hoje?").

### 7.2 Parcelas mensais com mesmo valor

Parcela 3/10 de R$ 285,00 no dia 10/03 e parcela 4/10 de R$ 285,00 no dia 10/04. Mesmo valor, descrição similar, mas meses diferentes.

**Solução:** o filtro de data (janela de 3 dias) resolve naturalmente. Estão a 30 dias de distância, não são candidatas.

Se faturas de meses diferentes forem importadas no mesmo dia: o diferenciador é `dataFatura` (mês de referência). Parcelas com mesma `dataCompra` mas `dataFatura` diferente não são duplicatas.

### 7.3 Transferência entre contas próprias

PIX de R$ 1.000 do Nubank para o BTG. Aparece como débito no Nubank e crédito no BTG.

**Solução:** não é duplicata, é transferência. O sistema trata com `transfer_pair_id`. O filtro de deduplicação exclui matches cross-conta.

### 7.4 Estorno/cancelamento

Compra de R$ 100 dia 10 e estorno de -R$ 100 dia 12. Mesmo valor (sinal trocado), mesma descrição.

**Solução:** transações com sinais opostos nunca são duplicatas. Se o código de autorização bate, é cancelamento vinculado à compra original.

### 7.5 Notificação push duplicada (bug do banco)

Mesmo texto, mesmo momento, mesma transação. Bug do banco que envia a push duas vezes.

**Solução:** o parser de notificação mantém cache das últimas 50 notificações processadas (hash do texto + timestamp). Se o hash se repete dentro de 5 minutos, descarta silenciosamente.

### 7.6 Push chega e depois extrato confirma

```
Push 1 (14:02): "Compra R$ 2,00 Padaria Silva" → registra
Push 2 (14:05): "Compra R$ 2,00 Padaria Silva" → registra (timestamp diferente)
Onie pergunta imediatamente: "São duas compras?" → Usuário confirma

Depois, na importação do extrato:
Extrato linha 1: "14/03 PADARIA SILVA R$ 2,00" → match com Push 1, mescla
Extrato linha 2: "14/03 PADARIA SILVA R$ 2,00" → match com Push 2, mescla
→ Tudo reconciliado automaticamente.

Se o extrato tiver apenas 1 linha mas existem 2 pushes confirmadas:
→ Alerta: "Registrei duas compras de R$ 2,00 na Padaria Silva em 14/03,
   mas o extrato mostra apenas uma. Quer revisar?"
```

---

## 8. Experiência do Usuário

O usuário nunca vê a complexidade do motor. O que ele vê:

**Cenário feliz (90%):** transação aparece classificada. Nenhuma pergunta. Nada duplicado.

**Cenário de confirmação (8%):** card na fila do sininho: "Encontrei lançamentos parecidos. São o mesmo?" com dois cards lado a lado. Botão "Mesmo" ou "Diferentes". Um toque resolve.

**Cenário de conflito (2%):** "O extrato mostra R$ 45,00 no iFood em 15/03, mas você registrou R$ 43,00. Qual está correto?" com opção de escolher ou editar.

---

## 9. Tabela de Auditoria

```sql
CREATE TABLE dedup_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profile(id),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  candidate_id UUID NOT NULL,
  decision TEXT NOT NULL,       -- 'same', 'different', 'auto_merged', 'auto_discarded'
  decided_by TEXT NOT NULL,     -- 'system' ou 'user'
  fingerprint_match JSONB,     -- detalhes do match (campos que bateram)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Serve para auditoria (saber por que uma transação foi descartada/mesclada) e aprendizado (padrões que o usuário marcou como "diferentes" refinam o motor).

---

## 10. Princípios Invioláveis

1. **Nunca descartar silenciosamente um registro manual do usuário.** Se digitou, quis dizer aquilo. No máximo, pergunte.
2. **Descartar silenciosamente apenas capturas automáticas quando match é de alta confiança.**
3. **Código de autorização é o rei.** Se bater, é o mesmo. Sem perguntas.
4. **Na dúvida, pergunte. Imediatamente.** Melhor uma pergunta do que uma duplicata ou transação perdida.
5. **A decisão do usuário ensina o motor.** Toda resposta refina o sistema.
6. **Sinais opostos nunca são duplicata.** +100 e -100 é compra + estorno.
7. **Cada push é real.** Timestamps diferentes = transações diferentes.
8. **Ambiguidade resolvida no presente.** Nunca acumular dúvidas para depois.

---

## 11. Decisões Registradas

| # | Decisão | Data |
|---|---------|------|
| 1 | Cada push do banco é transação real até prova em contrário | 02/04/2026 |
| 2 | Ambiguidade resolvida imediatamente, não acumulada | 02/04/2026 |
| 3 | 3 filtros na ordem: match exato → similaridade → código de autorização | 02/04/2026 |
| 4 | Hierarquia: Open Finance > Extrato > Push > Manual (para dados do banco) | 02/04/2026 |
| 5 | Dados do usuário (categoria, notas) sempre preservados na mesclagem | 02/04/2026 |
| 6 | Cache de 50 notificações (hash + timestamp) para descartar push duplicada do banco | 02/04/2026 |
| 7 | Tabela dedup_decisions para auditoria e aprendizado | 02/04/2026 |

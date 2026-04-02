# ONIEFY - Integração B3 Área do Investidor (API)

## Documento de Especificação

**Data de criação:** 01 de Abril de 2026
**Status:** Backlog (passos 1-4 executáveis imediatamente pelo Claudio)
**Portal:** https://developers.b3.com.br
**Manual técnico:** https://www.b3.com.br/data/files/60/72/19/05/45CDF7104532BBF7AC094EA8/Manual%20Tecnico%20-%20APIs%20vf.pdf

---

## 1. O que é

A B3 disponibiliza uma API oficial da Área do Investidor que permite a fintechs, instituições financeiras e não financeiras acessarem, mediante autorização do investidor, os dados de posições, transações e eventos corporativos de todos os investimentos custodiados na B3. Isso inclui ativos de todas as corretoras em uma única fonte consolidada.

O Oniefy pode se tornar um "Licenciado" da B3, integrando essa API para importar automaticamente a carteira de investimentos do usuário.

---

## 2. O que a API fornece (dados D-1)

| Endpoint | Dados |
|----------|-------|
| Saldo de investimentos | Posição consolidada por ativo, quantidade, valor, conta, custodiante |
| Transações | Compras e vendas de ativos listados com datas, valores, quantidades |
| Eventos corporativos | Dividendos, JCP, bonificações, desdobramentos, grupamentos por investidor |
| Ofertas públicas | Participação do investidor em IPOs e follow-ons |
| API Guia | Retorna os documentos (CPFs) dos investidores autorizados pela fintech |
| Consentimento | Verifica se o investidor autorizou o compartilhamento com a fintech |

Todos os dados são atualizados até D-1 (dia útil anterior).

---

## 3. Cobertura por tipo de investimento

| Tipo | Coberto pela B3 API | Observação |
|------|---------------------|-----------|
| Ações (PETR4, VALE3, etc.) | Sim | Custodiadas na B3 |
| FIIs (HGLG11, XPLG11, etc.) | Sim | Custodiados na B3 |
| ETFs (BOVA11, IVVB11, etc.) | Sim | Custodiados na B3 |
| BDRs (AAPL34, AMZO34, etc.) | Sim | Custodiados na B3 |
| Tesouro Direto | Sim | Custodiado na B3/Selic |
| Debêntures | Sim | Registradas na B3 (CETIP) |
| CDB, LCI, LCA | Parcial | CDBs registrados na B3 (CETIP) aparecem; nem todos estão registrados |
| Fundos abertos | Parcial | Depende de registro na B3 |
| Criptomoedas | Não | Não custodiadas na B3 |
| Previdência (PGBL/VGBL) | Não | Custódia na seguradora |
| Poupança | Não | Custódia no banco |
| Investimentos no exterior | Não | Fora da jurisdição B3 |
| COE | Parcial | Registrado na B3 (CETIP), mas cobertura a confirmar |
| Consórcio | Não | Custódia na administradora |

### Estratégia para tipos não cobertos

| Tipo | Estratégia alternativa |
|------|----------------------|
| Criptomoedas | Cotações via CoinGecko API (gratuita, tempo real). Usuário informa posição 1x. |
| Previdência (PGBL/VGBL) | Atualização manual mensal. Onie lembra o usuário. |
| Poupança | Cálculo automático via BCB/SGS (TR + regra fixa). Usuário informa saldo inicial. |
| Investimentos no exterior | Cotações via Yahoo Finance. Usuário informa posição 1x. |
| Consórcio | Atualização manual. |

---

## 4. Consolidação cross-corretora

A B3 é a central depositária de todos os ativos listados no Brasil. Quando o investidor tem ações no BTG, FIIs na XP e Tesouro no Nubank, todos estão registrados na B3 sob o mesmo CPF. A API retorna tudo consolidado.

Isso elimina a necessidade de integrar com cada corretora individualmente. Um único acesso à B3 resolve o que precisaria de N integrações com Pluggy/Belvo para cada corretora.

---

## 5. Fluxo de consentimento do investidor

```
1. Usuário no Oniefy toca "Conectar meus investimentos"
2. Oniefy redireciona para a Área do Investidor da B3 (web)
3. Usuário faz login na B3 com suas credenciais
4. B3 mostra tela de consentimento: "Oniefy deseja acessar seus dados de investimentos"
5. Usuário autoriza
6. B3 gera token de acesso para o Oniefy
7. Oniefy importa posição completa
8. Onie apresenta: "Encontrei X ativos em Y corretoras. Patrimônio investido: R$ Z."
```

O consentimento pode ser revogado pelo investidor a qualquer momento na Área do Investidor da B3. Quando revogado, o Oniefy para de receber atualizações e o mês seguinte não é cobrado.

---

## 6. Modelo de tarifação

A B3 cobra por investidor autorizado, com modelos de opt-out. O valor exato não é público e precisa ser negociado com a equipe comercial.

Referência de mercado: apps como Kinvo (BTG), Gorila, Real Valor e Investidor10 já são licenciados, o que indica viabilidade para fintechs.

Modelo provável: cobrança mensal por CPF ativo (investidor que autorizou e tem dados). Se o investidor revogar o consentimento, a cobrança cessa no mês seguinte.

---

## 7. Requisitos para homologação

### 7.1 Processo

1. Cadastro no portal developers.b3.com.br (gratuito)
2. Geração do Kit de Acesso no ambiente de certificação
3. Desenvolvimento e testes no sandbox
4. Contato com equipe comercial (preço, contrato)
5. Security review / scorecard pela B3 (avaliação de vulnerabilidades)
6. Assinatura do contrato de licença
7. Recebimento do pacote de acesso a produção

### 7.2 Security review

A B3 realiza avaliação de segurança do aplicativo. Gera relatório com vulnerabilidades que precisam ser corrigidas. Pode, no limite, recusar a contratação se o nível de segurança for insuficiente.

O Oniefy tem posição forte aqui: 107 políticas RLS, MFA obrigatório, criptografia E2E em campos sensíveis, CSP headers, rate limiting, SBOM no CI. A auditoria de segurança (Release Gate Audit 37/37) já cobre a maioria dos requisitos.

### 7.3 Requisitos de marca

A B3 tem regras sobre uso da marca e divulgação. O Oniefy precisará seguir guidelines visuais para o botão "Conectar com B3" e menções à B3 no app.

---

## 8. Impacto na arquitetura do Oniefy

### 8.1 Sem B3 API (estado atual)

- Usuário cadastra cada investimento manualmente (ticker, quantidade, preço médio)
- Cotações atualizadas via APIs públicas gratuitas (Brapi, Yahoo Finance, CoinGecko)
- Rentabilidade calculada pelo app
- Proventos rastreados manualmente
- Cross-corretora exige cadastro duplicado
- Experiência: o usuário é um digitador de dados

### 8.2 Com B3 API (estado futuro)

- Usuário autoriza 1x na Área do Investidor da B3
- Posição completa importada automaticamente (todos os ativos, todas as corretoras)
- Saldo oficial D-1 direto da central depositária
- Todas as transações de C&V com datas e valores
- Proventos (dividendos, JCP) automáticos
- Consolidação cross-corretora nativa
- Experiência: o usuário olha e vê tudo atualizado. A Onie analisa e sugere.

### 8.3 Modelo híbrido (recomendado)

O Oniefy opera com ambas as fontes:

| Fonte | Uso | Prioridade |
|-------|-----|-----------|
| B3 API | Ativos custodiados na B3 (renda variável, Tesouro, debêntures, parte de renda fixa) | Primária (fonte autoritativa) |
| APIs públicas de cotação | Cotações intraday para display (Brapi, CoinGecko) | Complementar |
| BCB/SGS | CDI, Selic, IPCA, TR para cálculo de renda fixa pós-fixada | Complementar |
| CVM | Cotas de fundos não cobertos pela B3 | Fallback |
| Manual | Previdência, cripto, exterior, consórcio | Último recurso |

Quando o usuário conecta a B3: a posição da B3 prevalece. Se o usuário já tinha cadastro manual de ações, o app reconcilia e substitui pelo dado oficial.

Quando o usuário não conecta a B3: funciona 100% com APIs públicas + manual. O app sugere: "Conecte sua conta B3 para atualização automática."

---

## 9. Dados que a B3 API resolve diretamente

### 9.1 Killer features de investimentos viabilizadas

| Feature | Sem B3 API | Com B3 API |
|---------|-----------|-----------|
| Patrimônio investido consolidado | Manual (impreciso) | Automático (preciso) |
| Rentabilidade real vs. CDI/Ibovespa/IPCA | Aproximada | Exata (preço médio real de compra) |
| Proventos recebidos no ano (IRPF) | Manual | Automático (alimenta motor fiscal) |
| Diversificação por tipo de ativo | Manual | Automática |
| Concentração por corretora | Manual | Automática |
| Histórico de C&V para ganho de capital (IRPF) | Manual | Automático |
| Alerta de provento a receber | Impossível sem dados | Automático (eventos corporativos D-1) |

### 9.2 Alimentação do motor fiscal (IRPF)

A B3 API fornece os dados necessários para o módulo de IRPF:

- Operações de compra e venda (cálculo de ganho de capital)
- Proventos recebidos (dividendos isentos, JCP tributados)
- Posição em 31/12 (declaração de bens e direitos)
- Participação em IPOs

Isso reduz drasticamente o trabalho manual do módulo fiscal para investimentos.

---

## 10. Frequência de sincronização

| Cenário | Frequência |
|---------|-----------|
| Atualização automática diária | Cron 07:00 BRT (dados D-1 disponíveis) |
| Atualização manual ("puxar agora") | Sob demanda do usuário |
| Primeira conexão | Importação completa do histórico disponível |
| Após compra/venda | D+1 (aparece na próxima sincronização matinal) |

A Onie pode informar: "Seus investimentos estão atualizados até ontem, 31/03/2026."

---

## 11. Tabelas de suporte no banco de dados

### 11.1 `b3_connection`

```
id: UUID (PK)
user_id: UUID (FK)
b3_investor_document: TEXT (encrypted) -- CPF do investidor na B3
consent_status: ENUM (pending, authorized, revoked)
consent_granted_at: TIMESTAMPTZ (nullable)
consent_revoked_at: TIMESTAMPTZ (nullable)
last_sync_at: TIMESTAMPTZ (nullable)
last_sync_status: ENUM (success, partial, failed)
access_token_encrypted: TEXT -- token de acesso criptografado
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
```

### 11.2 `b3_positions` (cache da posição D-1)

```
id: UUID (PK)
user_id: UUID (FK)
ticker: TEXT -- código do ativo (PETR4, HGLG11, etc.)
asset_type: TEXT -- ação, FII, ETF, BDR, tesouro, debênture, CDB, etc.
custodian: TEXT -- corretora/banco custodiante
quantity: NUMERIC(14,6) -- quantidade (6 decimais para frações)
average_price: NUMERIC(14,2) -- preço médio de aquisição
current_value: NUMERIC(14,2) -- valor de mercado D-1
gain_loss: NUMERIC(14,2) -- ganho/perda não realizado
gain_loss_pct: NUMERIC(7,4) -- % de ganho/perda
reference_date: DATE -- data de referência (D-1)
raw_data: JSONB -- dados brutos da B3 para auditoria
synced_at: TIMESTAMPTZ
UNIQUE(user_id, ticker, custodian)
```

### 11.3 `b3_transactions` (histórico de C&V)

```
id: UUID (PK)
user_id: UUID (FK)
ticker: TEXT
transaction_type: ENUM (buy, sell, transfer, split, reverse_split, subscription)
quantity: NUMERIC(14,6)
price: NUMERIC(14,2)
total_value: NUMERIC(14,2)
transaction_date: DATE
settlement_date: DATE (nullable)
custodian: TEXT
raw_data: JSONB
synced_at: TIMESTAMPTZ
```

### 11.4 `b3_corporate_events` (proventos e eventos)

```
id: UUID (PK)
user_id: UUID (FK)
ticker: TEXT
event_type: ENUM (dividend, jcp, bonus, split, reverse_split, subscription_right, rental)
ex_date: DATE
payment_date: DATE (nullable)
value_per_share: NUMERIC(14,8) (nullable)
total_value: NUMERIC(14,2) (nullable)
quantity_affected: NUMERIC(14,6) (nullable)
tax_withheld: NUMERIC(14,2) (nullable) -- IRRF retido (JCP)
raw_data: JSONB
synced_at: TIMESTAMPTZ
```

---

## 12. Apps que já são licenciados (referência)

| App | Tipo | Observação |
|-----|------|-----------|
| Kinvo (BTG) | Consolidador de investimentos | Adquirido pelo BTG Pactual |
| Gorila | Consolidador + advisory | Foco em assessores de investimento |
| Real Valor | Consolidador | Foco em pessoa física |
| Investidor10 | Análise fundamentalista + carteira | Parceiro homologado da B3 |
| Trademap | Consolidador + análise | Foco em trader e investidor ativo |

Todos esses operam como licenciados da B3 API. O Oniefy se diferencia por não ser apenas um consolidador de investimentos, mas sim uma plataforma de gestão patrimonial completa onde investimentos são uma das 10 zonas mentais.

---

## 13. Ações imediatas (Claudio)

| # | Ação | Esforço | Dependência |
|---|------|---------|-------------|
| 1 | Criar conta no portal developers.b3.com.br | 10 min | Nenhuma |
| 2 | Gerar Kit de Acesso no ambiente de certificação | 30 min | Passo 1 |
| 3 | Explorar documentação das APIs no sandbox | 2-4h | Passo 2 |
| 4 | Contatar equipe comercial da B3 (preço, requisitos, timeline) | 1 e-mail | Nenhuma |

Todos os 4 passos podem ser executados imediatamente, em paralelo ao desenvolvimento do app. Não dependem de código.

---

## 14. Decisões registradas

| # | Decisão | Data |
|---|---------|------|
| 1 | B3 API é a fonte primária para investimentos custodiados no Brasil | 01/04/2026 |
| 2 | Modelo híbrido: B3 API + APIs públicas + manual para tipos não cobertos | 01/04/2026 |
| 3 | Passos 1-4 de homologação executáveis imediatamente pelo Claudio | 01/04/2026 |
| 4 | Dados da B3 alimentam diretamente o motor fiscal (IRPF) | 01/04/2026 |
| 5 | Sincronização diária automática às 07:00 BRT | 01/04/2026 |

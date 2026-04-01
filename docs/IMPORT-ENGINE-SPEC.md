# ONIEFY - Motor de Importação de Faturas e Cobranças

## Documento de Especificação

**Data de criação:** 01 de Abril de 2026
**Status:** Em discussão (não implementar até fechar redesign conceitual)
**Escopo:** Importação de faturas de cartão de crédito, boletos e cobranças recorrentes (água, energia, gás, telefone, internet, condomínio, etc.)

---

## 1. Visão Geral

O motor de importação é responsável por receber, decriptar, parsear, normalizar e reconciliar faturas e cobranças de qualquer origem. Opera em dois modos:

- **Upload manual:** usuário faz upload do arquivo (PDF, XLSX, CSV, OFX) dentro do app
- **Inbound email:** usuário encaminha e-mails com faturas para um endereço dedicado; o sistema processa automaticamente

Ambos os modos convergem para o mesmo pipeline de processamento.

---

## 2. Inbound Email (Importação Automática por E-mail)

### 2.1 Conceito

Cada usuário recebe um endereço de e-mail único e permanente:

```
{hash_curto_8_chars}@faturas.oniefy.com
```

Exemplo: `a7x9k2mf@faturas.oniefy.com`

O usuário configura encaminhamento automático no seu e-mail pessoal (Gmail, Outlook, Yahoo) para este endereço. Toda fatura que chegar no e-mail pessoal é automaticamente encaminhada e processada pelo Oniefy.

### 2.2 Remetentes Autorizados (Allowlist)

O sistema mantém uma lista de e-mails autorizados a enviar para a caixa de entrada do usuário. Isso previne spam e processamento de e-mails irrelevantes.

**Configuração pelo usuário:**
- Tela de configuração em Perfil > Importação por E-mail
- Adicionar remetente: informar o e-mail (ex: `faturas@btgpactual.com`, `noreply@mercadopago.com`, `fatura@enel.com.br`)
- Opção "Aceitar qualquer remetente" (desativada por padrão, para usuários avançados)
- Lista de remetentes sugeridos por banco/concessionária (pré-cadastrada pelo Oniefy)

**Comportamento:**
- E-mail de remetente autorizado → processamento normal
- E-mail de remetente desconhecido → rejeitado silenciosamente (sem processamento, sem alerta)
- Exceção: se o remetente é o próprio e-mail do usuário (forward manual) → aceitar sempre

### 2.3 Fluxo de Processamento do E-mail

```
1. E-mail chega em {hash}@faturas.oniefy.com
2. Verificar remetente contra allowlist do usuário
   → Se não autorizado: descartar, registrar log
3. Extrair anexos (PDF, XLSX, CSV, OFX)
   → Se nenhum anexo: tentar extrair dados do corpo do e-mail (algumas faturas vêm inline)
4. Identificar banco/emissor (por remetente, nome do arquivo, ou conteúdo)
5. Aplicar senha automaticamente (derivada do CPF/CEP do usuário, conforme regras por banco)
   → Se falhar: gerar Workflow para o usuário informar a senha
6. Executar parser específico do banco
   → Se falhar: gerar Workflow para o usuário fazer mapeamento manual
7. Normalizar lançamentos
8. Reconciliar com lançamentos existentes
9. Depositar na fila de revisão do usuário
10. Notificação via Onie: "Importei sua fatura do [banco]. X lançamentos, Y para revisar."
```

### 2.4 Workflows de Erro

Sempre que houver falha na leitura do e-mail ou abertura do anexo, o sistema gera um Workflow (tarefa pendente) para o usuário resolver da forma mais simples possível. O Workflow aparece na fila de atenção da Onie.

| Erro | Workflow gerado | Ação do usuário |
|------|----------------|-----------------|
| Remetente não autorizado | "Recebi um e-mail de [remetente] mas não está na sua lista de autorizados. Quer adicionar?" | Toque para autorizar ou descartar |
| Anexo protegido com senha desconhecida | "Não consegui abrir a fatura do [banco]. Qual é a senha do arquivo?" | Campo de texto para digitar a senha. O sistema salva a regra para próximas faturas. |
| Formato de anexo não reconhecido | "Recebi um arquivo [nome.ext] que não sei processar. É uma fatura?" | Opções: "Sim, é uma fatura (vou fazer upload manual)" / "Não, pode descartar" |
| Parser falhou (layout desconhecido) | "Consegui abrir a fatura do [banco] mas não entendi o formato. Preciso da sua ajuda para mapear as colunas." | Tela de mapeamento visual (apontar qual coluna é data, descrição, valor) |
| E-mail sem anexo | "Recebi um e-mail de [remetente] sem anexo. A fatura pode estar no corpo do e-mail ou em um link." | Opções: "Tente ler o corpo do e-mail" / "Descartar" |
| Valor total da fatura não bate com soma dos lançamentos | "A soma dos lançamentos (R$ X) não bate com o total da fatura (R$ Y). Diferença de R$ Z." | Opções: "Aceitar com a diferença" / "Vou verificar manualmente" |
| Fatura duplicada (já importada anteriormente) | "Esta fatura do [banco] com vencimento [data] já foi importada em [data_import]. Quer substituir?" | Opções: "Substituir" / "Manter a anterior" / "Comparar" |

### 2.5 Infraestrutura

- **Serviço de inbound email:** Resend (já no roadmap, item A10) ou AWS SES Inbound
- **Processamento:** Edge Function (Supabase) disparada por webhook do serviço de e-mail
- **Armazenamento do anexo original:** Supabase Storage (bucket `invoices`, organizado por `user_id/ano/mes/`)
- **Custo estimado:** ~R$ 0,001 por e-mail recebido (marginal)

### 2.6 Tabela `email_import_config`

```
id: UUID (PK)
user_id: UUID (FK)
import_email: TEXT (unique) -- hash@faturas.oniefy.com
is_active: BOOLEAN (default true)
accept_any_sender: BOOLEAN (default false)
created_at: TIMESTAMPTZ
```

### 2.7 Tabela `authorized_senders`

```
id: UUID (PK)
user_id: UUID (FK)
email_address: TEXT -- ex: faturas@btgpactual.com
label: TEXT -- ex: "BTG Pactual"
is_active: BOOLEAN (default true)
created_at: TIMESTAMPTZ
UNIQUE(user_id, email_address)
```

### 2.8 Tabela `import_workflows`

```
id: UUID (PK)
user_id: UUID (FK)
type: ENUM (unknown_sender, password_required, unknown_format, parser_failed, no_attachment, total_mismatch, duplicate)
status: ENUM (pending, resolved, dismissed)
source_email: TEXT (nullable) -- remetente
file_path: TEXT (nullable) -- caminho do anexo no Storage
metadata: JSONB -- dados contextuais (banco detectado, erro específico, etc.)
resolution: JSONB (nullable) -- ação tomada pelo usuário
created_at: TIMESTAMPTZ
resolved_at: TIMESTAMPTZ (nullable)
```

---

## 3. Senhas de Faturas (Derivação Automática)

### 3.1 Regras por Banco

O sistema armazena as regras de derivação de senha por banco. Com o CPF e CEP do usuário, gera automaticamente as senhas candidatas.

| Banco | Regra de senha | Fórmula |
|-------|---------------|---------|
| BTG Pactual | CPF completo (11 dígitos) | `cpf_digits_11` |
| Mercado Pago | 5 primeiros dígitos do CPF | `cpf_digits_5` |
| Itaú | 5 primeiros dígitos do CPF | `cpf_digits_5` |
| Bradescard | 6 primeiros dígitos do CPF | `cpf_digits_6` |
| Porto Bank | 4 dígitos CPF + 5 dígitos CEP | `cpf_digits_4 + cep_digits_5` |
| Nubank | Sem senha (PDF aberto) | `null` |
| Santander | 3 primeiros dígitos do CPF | `cpf_digits_3` (a confirmar) |
| Bradesco | 6 primeiros dígitos do CPF | `cpf_digits_6` (a confirmar) |

### 3.2 Algoritmo de Desbloqueio

```
1. Identificar banco (pelo remetente, nome do arquivo, ou conteúdo)
2. Se arquivo não está criptografado → prosseguir
3. Se criptografado:
   a. Buscar senha salva anteriormente para este banco (tabela password_rules)
   b. Se não encontrou, gerar candidatas pelas regras do banco
   c. Tentar cada candidata na ordem
   d. Se alguma funcionar → salvar como regra para este banco
   e. Se nenhuma funcionar → gerar Workflow "password_required"
```

### 3.3 Dados necessários no perfil do usuário

Para o motor de senhas funcionar, o perfil precisa conter:

- **CPF** (já existe: `cpf_encrypted` em `users_profile`)
- **CEP** (novo campo necessário: `zip_code` em `users_profile`)

O CEP também alimenta o módulo fiscal (IRPF exige endereço) e pode ser usado para geolocalização de sugestões contextuais.

### 3.4 Tabela `bank_password_rules`

```
id: UUID (PK)
user_id: UUID (FK)
bank_identifier: TEXT -- slug do banco (ex: "btg", "mercado_pago", "porto_bank")
password_encrypted: TEXT -- senha que funcionou, criptografada E2E
derivation_rule: TEXT (nullable) -- regra usada (ex: "cpf_11", "cpf_5", "cpf_4_cep_5")
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
UNIQUE(user_id, bank_identifier)
```

---

## 4. Parsers por Banco (Templates de Extração)

### 4.1 Arquitetura de Parsers

Cada banco tem um parser dedicado que entende a estrutura específica do arquivo. Todos os parsers produzem o mesmo formato normalizado (seção 5).

```
ParserRegistry:
  "btg"          → ParserBTG (XLSX criptografado, multi-seção)
  "xp"           → ParserXP (CSV com separador ";")
  "mercado_pago" → ParserMercadoPago (PDF, tabela com "Parcela N de M")
  "itau"         → ParserItau (PDF, seções Pagamentos + Lançamentos + Parcelados)
  "porto_bank"   → ParserPortoBank (PDF, layout visual com cards)
  "bradescard"   → ParserBradescard (PDF, tabela com "(NN/NN)")
  "nubank"       → ParserNubank (CSV, formato data,category,title,amount)
  "generic_csv"  → ParserGenericoCSV (mapeamento manual de colunas)
  "generic_ofx"  → ParserOFX (formato bancário universal)
```

### 4.2 Análise Detalhada por Banco

#### BTG Pactual (XLSX criptografado)

- **Formato:** XLSX com criptografia CDFV2
- **Estrutura:** Cabeçalho com metadados (período, vencimento, resumo) + 3 seções separadas por linhas vazias: Pagamentos (3 colunas), Créditos (6 colunas), Compras (7 colunas)
- **Colunas de compras:** Data, Descrição, Valor, Tipo de compra, Código de autorização, Final Cartão
- **Parcela:** INCONSISTENTE. Às vezes na descrição com formato "(N/M)" ex: `Shopee (9/9)`, `Lvmh Fashion Group Bra (6/10)`. Às vezes apenas no campo Tipo: "Parcela sem juros" ou "Parcela de compra pos" sem indicar N/M.
- **Data:** Data da compra ORIGINAL (não da cobrança). Compras de 2024 aparecem em fatura 2026.
- **Diferencial:** Código de autorização (útil para reconciliação e identificação de cancelamentos). Múltiplos finais de cartão na mesma fatura (pai/filho).

#### XP (CSV)

- **Formato:** CSV, separador ";", UTF-8 com BOM, CRLF
- **Colunas:** Data, Estabelecimento, Portador, Valor, Parcela
- **Parcela:** Coluna dedicada, formato "14 de 18"
- **Valor:** Formato "R$ 551,00" (prefixo R$, vírgula decimal)
- **Diferencial:** Coluna Portador (nome do titular do cartão adicional). Melhor estrutura para mapeamento automático.

#### Mercado Pago (PDF)

- **Formato:** PDF com texto extraível
- **Estrutura:** Cabeçalho (total, vencimento, limite) + Resumo da fatura + Seção "Movimentações na fatura" com sub-seção por cartão [****4042] + Tabela: Data, Movimentações, Valor
- **Parcela:** No texto da descrição: "Parcela 15 de 18", "Parcela 14 de 14"
- **Diferencial:** Seção "Lançamentos futuros" com total de compras parceladas a vencer (R$ 997,35). Informação de melhor dia de compra, fechamento, limite utilizado/disponível.

#### Itaú Samsung (PDF)

- **Formato:** PDF com texto extraível
- **Estrutura:** Resumo com boleto + Seções: Pagamentos efetuados, Lançamentos: compras e saques, Compras parceladas - próximas faturas, Limites, Encargos
- **Colunas de lançamentos:** Data, Estabelecimento, Valor
- **Parcela:** Na descrição: "SAMSUNG *I 19/24" (formato *LETRA N/M)
- **Diferencial:** Seção "Compras parceladas - próximas faturas" com breakdown: Próxima fatura R$ 534,33, Demais faturas R$ 2.137,32, Total R$ 2.671,65. Encargos detalhados com taxas atuais e do próximo período.

#### Porto Bank (PDF)

- **Formato:** PDF com layout visual moderno (cards coloridos)
- **Estrutura:** Capa com dados do cartão + Boleto/PIX + Resumo da fatura + Detalhamento (Lançamentos) + Opções de parcelamento
- **Colunas de lançamentos:** Data, Estabelecimento, Valor
- **Parcela:** Ambígua. "PORTO SEGURO AUTO PA/05 BZ" provavelmente significa parcela 5 de algo, mas formato não é padronizado.
- **Diferencial:** "Total de despesas parceladas: próximas faturas" com breakdown mensal (Abril R$ 494,32, Maio R$ 494,32, Demais R$ 1.482,96). CET detalhado por tipo de operação.

#### Bradescard Amazon (PDF)

- **Formato:** PDF com layout tabular clássico Bradesco
- **Estrutura:** Cabeçalho (total, vencimento, limite) + Opções de pagamento + Resumo + Boleto + Lançamentos + Total parcelado + Limites + Encargos + Opções de parcelamento
- **Colunas de lançamentos:** Data, Descrição, Valor
- **Parcela:** Na descrição com formato "(NN/NN)": "AMAZON MARKETPLACE SAO PAULO(13/13)", "AMAZON BR SAO PAULO(05/11)"
- **Diferencial:** "Total parcelado para as próximas faturas" com Próxima fatura, Demais faturas, Total. Cartão co-branded (Amazon + Bradesco), todas compras são da Amazon ou serviços Amazon.

### 4.3 Regex Unificado para Extração de Parcelas

Cobre os 6 formatos identificados:

```regex
# Formato 1: "Parcela N de M" (Mercado Pago)
(?:parcela\s+)(\d{1,2})\s+de\s+(\d{1,2})

# Formato 2: "(NN/NN)" (Bradescard, BTG)
\((\d{1,2})\/(\d{1,2})\)

# Formato 3: "N/M" sem parênteses (BTG, genérico)
\b(\d{1,2})\/(\d{1,2})\b

# Formato 4: "*LETRA NN/NN" (Itaú Samsung)
\*[A-Z]\s*(\d{1,2})\/(\d{1,2})

# Formato 5: "PA/NN" (Porto Bank, provável)
PA\/(\d{1,2})

# Formato 6: "N de M" (XP, coluna dedicada)
(\d{1,2})\s+de\s+(\d{1,2})
```

Ordem de aplicação: formato 1 → 2 → 4 → 5 → 3 → 6 (do mais específico ao mais genérico para evitar falsos positivos).

---

## 5. Formato Normalizado (output de todos os parsers)

### 5.1 FaturaImportada (metadados)

```typescript
interface FaturaImportada {
  id: string;                    // UUID gerado
  userId: string;
  banco: string;                 // slug (ex: "btg", "mercado_pago")
  cartaoFinal: string;           // últimos 4-5 dígitos
  portador?: string;             // nome do portador se disponível
  mesReferencia: string;         // "2026-02" (YYYY-MM)
  vencimento: Date;
  totalFatura: number;           // em centavos
  pagamentoMinimo?: number;      // em centavos
  limiteTotal?: number;
  limiteUtilizado?: number;
  limiteDisponivel?: number;
  totalParceladoFuturo?: number; // saldo devedor total de parcelas a vencer
  breakdownFuturo?: {            // parcelas a vencer por mês
    mes: string;                 // "2026-04"
    valor: number;               // em centavos
  }[];
  arquivoOriginal: string;       // path no Storage
  importadoVia: 'upload' | 'email';
  processadoEm: Date;
  lançamentos: LancamentoNormalizado[];
}
```

### 5.2 LancamentoNormalizado (cada linha da fatura)

```typescript
interface LancamentoNormalizado {
  id: string;
  dataCompra: Date;              // data original da compra
  dataFatura: Date;              // mês/ano da fatura
  descricaoOriginal: string;     // texto exato do extrato
  descricaoLimpa: string;        // sem indicador de parcela, normalizada
  valor: number;                 // em centavos (positivo = débito, negativo = crédito)
  tipoCompra: 'vista' | 'parcela_sem_juros' | 'parcela_com_juros' | 'saque' | 'pagamento' | 'credito' | 'encargo';
  parcelaAtual?: number;
  parcelaTotal?: number;
  codigoAutorizacao?: string;    // se disponível (BTG)
  finalCartao?: string;
  portador?: string;
  secao: 'compra' | 'credito' | 'pagamento' | 'encargo';
  confianca: 'alta' | 'media' | 'baixa'; // confiança na extração
  motivoBaixaConfianca?: string;         // ex: "parcela inferida", "formato desconhecido"
}
```

---

## 6. Motor de Parcelas (Aritmética do Centavo)

### 6.1 Cálculo de Distribuição

Regra universal do mercado brasileiro: quando a divisão gera centavos fracionários, a primeira parcela absorve a diferença.

```
valorTotal = 14317       // em centavos (R$ 143,17)
parcelas = 5
valorBase = floor(valorTotal / parcelas)        // 2863 (R$ 28,63)
restoCentavos = valorTotal - (valorBase * parcelas)  // 2 centavos
primeiraParcela = valorBase + restoCentavos     // 2865 (R$ 28,65)
demaisParcelas = valorBase                      // 2863 (R$ 28,63)
```

### 6.2 Reconstrução Reversa

Quando o parser importa uma parcela intermediária (ex: parcela 3/10 com valor R$ 28,63), o sistema reconstrui a compra original:

```
Se parcelaAtual > 1:
  valorEstimadoTotal = valor * parcelaTotal
  // Mas a primeira parcela pode ter sido 1 ou 2 centavos a mais
  // Faixa: valorEstimadoTotal até valorEstimadoTotal + (parcelaTotal - 1) centavos

Se parcelaAtual == 1:
  // Esta é a primeira parcela (possivelmente com centavos extras)
  // valorOriginal = (valor * parcelaTotal) ajustado pela dízima
  // Precisamos da segunda parcela para calcular com precisão
```

---

## 7. Reconciliação (Fatura vs. Lançamentos Manuais)

### 7.1 Cenários de Reconciliação

| Cenário | Detecção | Ação |
|---------|----------|------|
| Match exato (data + valor + descrição similar) | Automático | Marca como "reconciliado" |
| Lançamento manual sem correspondência na fatura | Automático | Alerta âmbar: "Compra não apareceu na fatura. Pode ter caído na próxima." |
| Item da fatura sem lançamento manual | Automático | Alerta âmbar: "Novo lançamento encontrado. Quer adicionar?" |
| Parcela esperada ausente na fatura | Automático | Alerta vermelho: "Parcela X/Y não apareceu. Operadora pode ter pulado." |
| Valor da parcela diverge por mais de 2 centavos | Automático | Alerta âmbar: "Valor esperado R$ X, veio R$ Y." |
| Duas cobranças idênticas (assinatura duplicada) | Semi-auto | Pergunta na primeira vez: "São assinaturas diferentes?" Usuário nomeia. |
| Cancelamento detectado | Automático | Lançamento com valor negativo + mesmo código de autorização = cancelamento vinculado |

### 7.2 Fingerprint de Recorrência

Para identificar assinaturas e cobranças recorrentes:

```
fingerprint = hash(descricaoNormalizada + valor + diaDoMes + roteloUsuario)
```

O fingerprint permite:
- Vincular automaticamente lançamentos recorrentes entre faturas
- Detectar cancelamentos (fingerprint desaparece)
- Detectar reajustes (mesmo fingerprint, valor diferente)
- Distinguir cobranças idênticas (duas assinaturas com mesmo valor e descrição, nomeadas pelo usuário)

---

## 8. Escopo Estendido: Cobranças de Concessionárias

O mesmo motor funciona para cobranças recorrentes que não são cartão de crédito:

### 8.1 Tipos de Cobrança Suportados

| Tipo | Exemplos | Formato esperado | Frequência |
|------|---------|-----------------|-----------|
| Energia elétrica | ENEL, CEMIG, Equatorial, CPFL | PDF (conta de luz) | Mensal |
| Água e esgoto | SANEAGO, SABESP, CEDAE | PDF | Mensal/Bimestral |
| Gás | Comgás, CEG, SCGÁS | PDF | Mensal |
| Telefone/Internet | Vivo, Claro, TIM, Oi | PDF, e-mail inline | Mensal |
| Condomínio | Administradoras diversas | PDF, boleto | Mensal |
| IPTU | Prefeituras | PDF | Anual/Parcelado |
| Seguro (veículo, residencial, vida) | Porto, Tokio Marine, Bradesco Seguros | PDF | Mensal/Anual |

### 8.2 Dados Extraídos de Cobranças

```typescript
interface CobrancaNormalizada {
  tipo: 'energia' | 'agua' | 'gas' | 'telefone' | 'internet' | 'condominio' | 'iptu' | 'seguro' | 'outro';
  concessionaria: string;
  mesReferencia: string;
  vencimento: Date;
  valor: number;
  consumo?: number;           // kWh, m³ (se disponível)
  unidadeConsumo?: string;    // "kWh", "m³"
  codigoBarras?: string;      // para pagamento
  linhaDigitavel?: string;
  endereco?: string;          // imóvel de referência (útil para vincular ao patrimônio)
}
```

### 8.3 Vínculo com Patrimônio

Cobranças de concessionárias podem ser automaticamente vinculadas a bens patrimoniais:

- Conta de luz com endereço X → vincula ao imóvel cadastrado com mesmo endereço
- IPTU → vincula ao imóvel
- Seguro auto → vincula ao veículo
- Condomínio → vincula ao imóvel

Isso alimenta diretamente o "custo de manutenção por bem" (killer feature da Zona 6 do mapa mental).

---

## 9. Detecção Automática de Banco/Emissor

### 9.1 Por Remetente de E-mail

| Remetente | Banco |
|-----------|-------|
| *@btgpactual.com | BTG Pactual |
| *@xpi.com.br, *@xpinvestimentos.com.br | XP |
| *@mercadopago.com | Mercado Pago |
| *@itau.com.br, *@itau-unibanco.com.br | Itaú |
| *@portoseguro.com.br | Porto Bank |
| *@bradescard.com.br, *@bradesco.com.br | Bradescard/Bradesco |
| *@nubank.com.br | Nubank |
| *@santander.com.br | Santander |
| *@enel.com | ENEL |
| *@saneago.com.br | SANEAGO |

### 9.2 Por Conteúdo do Arquivo

| Indicador | Banco |
|-----------|-------|
| Primeira célula XLSX contém "Fatura Cartão de Crédito" + multi-seção | BTG |
| CSV com header "Data;Estabelecimento;Portador;Valor;Parcela" | XP |
| PDF contém "mercado pago" no header | Mercado Pago |
| PDF contém logo Itaú + "Cartão 4101" | Itaú |
| PDF contém "PortoBank" | Porto Bank |
| PDF contém "bradescard" + "amazon" | Bradescard Amazon |
| CSV com header "date,category,title,amount" | Nubank |

### 9.3 Fallback

Se não reconhecer automaticamente, pergunta ao usuário: "De qual banco é esta fatura?" com lista de logos para seleção visual.

---

## 10. Dados de Faturas Disponíveis por Banco (Resumo Comparativo)

| Aspecto | BTG | XP | Mercado Pago | Itaú | Porto Bank | Bradescard |
|---------|-----|-----|-------------|------|-----------|------------|
| Formato | XLSX cript. | CSV | PDF | PDF | PDF | PDF |
| Senha | CPF 11 | Sem | CPF 5 | CPF 5 | CPF4+CEP5 | CPF 6 |
| Parcela explícita | Parcial | Coluna dedicada | No texto | Na descrição | Ambíguo | Na descrição |
| Formato parcela | Misto: "(N/M)" ou só Tipo | "14 de 18" | "Parcela 15 de 18" | "*I 19/24" | "PA/05" | "(13/13)" |
| Saldo devedor futuro | Não | Não visível | Sim | Sim | Sim (mensal) | Sim |
| Portador/Titular | Final cartão | Coluna Portador | Final cartão | Final cartão | Final cartão | Final cartão |
| Código autorização | Sim | Não | Não | Não | Não | Não |
| Limites | Não | Não visível | Sim | Sim | Sim | Sim |
| Data nos lançamentos | Data da compra original | Data da cobrança | Data da compra original | Data da compra | Data da compra | Data da compra |

---

## 11. Campos Necessários no Perfil do Usuário

Para o motor de importação funcionar completamente:

| Campo | Tabela | Status | Uso |
|-------|--------|--------|-----|
| `cpf_encrypted` | users_profile | Já existe | Derivação de senhas, módulo fiscal |
| `zip_code` | users_profile | **Novo (necessário)** | Derivação de senha Porto Bank, endereço para IRPF |
| `address_street` | users_profile | **Novo (desejável)** | IRPF, vínculo de cobranças com patrimônio |
| `address_number` | users_profile | **Novo (desejável)** | IRPF |
| `address_complement` | users_profile | **Novo (desejável)** | IRPF |
| `address_city` | users_profile | **Novo (desejável)** | IRPF |
| `address_state` | users_profile | **Novo (desejável)** | IRPF |

---

## 12. Prioridade de Implementação

| Fase | O que | Justificativa |
|------|-------|---------------|
| 1 | Parsers CSV (XP, Nubank, genérico) + XLSX (BTG) | Menor complexidade, maior cobertura |
| 2 | Motor de parcelas + reconciliação básica | Core da funcionalidade |
| 3 | Parsers PDF (Mercado Pago, Itaú, Porto Bank, Bradescard) | Requer extração de tabelas de PDF |
| 4 | Inbound email + workflows de erro | Infraestrutura de e-mail |
| 5 | Cobranças de concessionárias | Extensão do motor |
| 6 | Derivação automática de senhas | Conveniência |

---

## 13. Decisões Registradas

| # | Decisão | Data |
|---|---------|------|
| 1 | Cada usuário recebe endereço de e-mail dedicado para importação | 01/04/2026 |
| 2 | Lista de remetentes autorizados (allowlist) por usuário | 01/04/2026 |
| 3 | Workflows de erro para resolver falhas de forma guiada | 01/04/2026 |
| 4 | Senhas derivadas automaticamente do CPF e CEP | 01/04/2026 |
| 5 | CEP necessário no perfil do usuário (campo novo) | 01/04/2026 |
| 6 | Motor funciona para faturas de cartão E cobranças de concessionárias | 01/04/2026 |
| 7 | Cobranças vinculadas automaticamente a bens patrimoniais por endereço | 01/04/2026 |
| 8 | Dupla verificação: fatura importada é reconciliada com lançamentos manuais | 01/04/2026 |
| 9 | Parcelas que pulam misteriosamente geram alerta vermelho | 01/04/2026 |

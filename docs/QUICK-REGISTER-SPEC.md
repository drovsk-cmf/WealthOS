# ONIEFY - Registro Ultrarrápido de Despesas

## Documento de Especificação

**Data de criação:** 02 de Abril de 2026
**Status:** Em discussão (não implementar até fechar redesign conceitual)
**Prioridade:** H1 (resolve o problema diário do usuário)

---

## 1. O Problema

O usuário faz 5-15 transações por dia. A barreira de entrada para registrar uma despesa no app é alta demais. Mesmo com 3 campos, ninguém para no meio do dia para abrir o app e digitar. Em 5 dos 6 cenários de gasto, o banco do usuário já sabe da transação antes do Oniefy. A informação já existe digitalmente. O trabalho do usuário deveria ser apenas confirmar e categorizar, nunca digitar.

---

## 2. Cenários de Gasto e Informação Disponível

| Cenário | O que acontece | Informação disponível no momento |
|---------|---------------|--------------------------------|
| Cartão de crédito (maquininha) | Push do banco chega em 2-5 segundos | Valor, estabelecimento, bandeira, últimos dígitos |
| PIX (QR code ou chave) | Push do banco chega instantaneamente | Valor, nome do recebedor, chave PIX |
| Débito automático | Débito aparece no extrato | Valor, descrição |
| Boleto | Pagamento pelo app do banco | Valor, beneficiário, código de barras |
| Dinheiro vivo | Nada acontece digitalmente | Nada. Só a memória do usuário. |
| Compra online | E-mail de confirmação + push do banco | Valor, loja, detalhes do produto |

---

## 3. As 5 Formas de Captura

Todas coexistem. O usuário gravita para a que prefere. Não são excludentes.

### 3.1 Forma 1: Captura Automática de Notificações Push (zero toque)

**Android (NotificationListenerService):**
```
Push do Nubank: "Compra de R$ 45,00 no iFood aprovada"
→ Oniefy intercepta a notificação (com permissão do usuário)
→ Parser extrai: valor=4500, estabelecimento="iFood", tipo=despesa, cartão=Nubank
→ Motor categoriza: Alimentação (delivery)
→ Transação criada automaticamente em background
→ Notificação discreta do Oniefy: "Registrei R$ 45,00 no iFood" (botão "Corrigir")
```

O usuário não faz nada. Se a Onie errou a categoria, corrige com um toque.

**iOS (via Shortcuts/Automation):**
```
Usuário cria uma vez: Automation "Quando receber notificação do app Nubank contendo 'aprovada'"
→ Ação: compartilhar texto com Oniefy via URL scheme ou Share Extension
→ Oniefy processa igual ao Android
```

Requer configuração inicial (1 vez). A Onie guia o setup: "Quer que eu registre suas compras automaticamente? Vou te mostrar como configurar em 2 minutos."

**Parser de notificação por banco:** cada banco tem formato de push diferente. O parser precisa de templates por banco, similar ao parser de faturas.

**Esforço:** zero (após setup)
**Precisão:** alta (dados do banco)
**Factibilidade MVP:** média (Android sim, iOS limitado)

### 3.2 Forma 2: Share Extension ("Compartilhar com Oniefy")

```
Usuário recebe push do banco → abre → toca "Compartilhar" ou copia texto
→ Seleciona Oniefy na sheet de compartilhamento
→ Oniefy extrai valor, estabelecimento, data
→ Preview: "R$ 45,00 | iFood | Alimentação | Hoje"
→ Usuário confirma com 1 toque (ou edita categoria)
```

Funciona também para: comprovantes de PIX (screenshot ou texto), e-mails de confirmação de compra, recibos digitais.

**Esforço:** 2 toques (~5 segundos)
**Precisão:** alta (dados do banco)
**Factibilidade MVP:** alta (Capacitor Share Extension plugin)

### 3.3 Forma 3: Widget na Tela Inicial

**Mini widget (2x1):** saldo do dia + botão "+".

**Widget médio (2x2):** saldo + últimas 2-3 transações + botão "+".

Fluxo do "+":
```
Toque no "+"
→ Teclado numérico aparece (overlay, sem abrir o app inteiro)
→ Digita "45"
→ Sugestões automáticas: "iFood? Uber? Supermercado?"
  (baseadas no histórico, horário e localização)
→ Toque na sugestão ou digita
→ Confirma
→ Widget atualiza o saldo
```

**Esforço:** 3-4 toques (~8 segundos)
**Precisão:** média (usuário digita)
**Factibilidade MVP:** alta (Capacitor Widget plugin, iOS 17+)

### 3.4 Forma 4: Mensagem de Texto para a Onie

O usuário manda uma mensagem curta, como se fosse WhatsApp:

```
"45 ifood"        → Onie: "Registrei R$ 45,00 no iFood (Alimentação, Nubank). Certo?"
"uber 36"         → Onie: "Registrei R$ 36,00 no Uber (Transporte, BTG). Certo?"
"mercado 380 débito inter" → Onie: "Registrei R$ 380,00 Supermercado (Alimentação, débito Inter). Certo?"
```

A Onie interpreta texto curto e informal via pattern matching simples: `{valor} {estabelecimento}` cobre 80% dos casos. O cartão/conta é inferido pelo histórico (se o usuário sempre paga iFood no Nubank, assume Nubank).

Pode existir como:
- Barra de texto na parte inferior da tela Início do app
- Campo de texto no widget

**Esforço:** 2-3 toques + digitação curta (~10 segundos)
**Precisão:** média-alta
**Factibilidade MVP:** alta (parser simples, sem dependência externa)

### 3.5 Forma 5: Voz

```
"Onie, gastei 45 no iFood"
"Onie, paguei 380 no supermercado com débito"
"Onie, recebi 5 mil do cliente"
```

Speech-to-Text (Web Speech API ou nativo iOS/Android) seguido do mesmo parser de texto da Forma 4. A voz é convertida em texto e processada igualmente.

Ativada por: botão de microfone no widget, botão no app, ou integração com assistente do sistema.

**Esforço:** 1 toque + fala (~6 segundos)
**Precisão:** média (depende do STT)
**Factibilidade MVP:** média

---

## 4. Disponibilidade por Fase

**Configuração zero (funciona desde o primeiro dia):**
- Forma 4 (mensagem de texto) como barra na tela Início
- Formulário rápido de 3 campos como fallback

**Com 2 minutos de setup:**
- Forma 3 (widget) na home screen
- Forma 2 (Share Extension) disponível automaticamente após instalar

**Com 5 minutos de setup (Android):**
- Forma 1 (captura de notificação) configurada pela Onie

**Após Open Finance (zero setup, zero esforço):**
- Todas as transações de cartão e débito chegam automaticamente
- Usuário só registra manualmente gastos em dinheiro vivo

---

## 5. Sugestões Contextuais

Independente da forma escolhida, a Onie sugere com base em:

| Contexto | Lógica | Exemplo |
|----------|--------|---------|
| Horário | 12h-14h → almoço, 7h → café, 18h-20h → jantar/delivery | Ao abrir registro às 12:30, sugere "Almoço?" |
| Localização (se permitido) | GPS no shopping → sugere lojas frequentadas naquele shopping | "Você está no Flamboyant. Zara? Outback?" |
| Último registro similar | Toda terça registra "academia 150" | Na terça seguinte, pré-preenche |
| Faixa de valor | R$ 6-15 → café. R$ 20-50 → almoço/transporte. R$ 100-500 → supermercado. | Ao digitar "38", sugere "Almoço? Uber?" |
| Recorrência | Toda segunda-feira tem gasto com "estacionamento" | Na segunda, sugere "Estacionamento?" |

A Onie aprende as faixas de valor e padrões do usuário específico ao longo do tempo. Na maioria dos casos, o usuário abre o registro rápido, vê a sugestão correta, confirma com um toque. Sem digitar nada.

---

## 6. Decisões Registradas

| # | Decisão | Data |
|---|---------|------|
| 1 | 5 formas de captura coexistentes (push, share, widget, texto, voz) | 01/04/2026 |
| 2 | Forma 4 (mensagem de texto) disponível desde o dia 1 sem setup | 01/04/2026 |
| 3 | Sugestões contextuais por horário, localização, histórico e faixa de valor | 01/04/2026 |
| 4 | Parser de notificação por banco (templates, similar ao parser de faturas) | 01/04/2026 |
| 5 | Open Finance elimina necessidade de registro manual para cartão/débito | 01/04/2026 |

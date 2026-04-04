# Oniefy - Roteiro de Teste Manual

**Objetivo:** validar fluxos críticos antes do deploy.
**Tempo estimado:** 35-45 minutos (fluxo completo).
**Pré-requisito:** `.\scripts\preflight.ps1 -SkipBuild -StartDev` passou sem [FALHA].
**Atualizado:** sessão 40 (04/04/2026).

> Dica: abra o DevTools (F12) → Console antes de começar. Erros JS aparecem lá antes de qualquer tela branca.

---

## Como usar este roteiro

Cada item tem:
- **Ação:** o que fazer
- **Esperado:** o que deve acontecer
- **Se falhar:** diagnóstico rápido

Marque com `[x]` conforme avançar. Se travar, anote o passo exato e o erro do Console.

---

## Navegação atual

**Desktop:** sidebar com 5 seções (18 links) + settings na parte inferior.
**Mobile:** 5 tabs (Início, Movimentações, Patrimônio, Orçamento, Mais) + hub "Mais" com 13 itens.

| Seção | Links |
|-------|-------|
| (topo) | Início |
| Movimentações | Transações, Cartões, Fluxo de caixa, Contas a pagar |
| Patrimônio | Contas, Bens e imóveis |
| Orçamento | Orçamento, Metas |
| Mais | Impostos/IRPF, Diagnóstico, Calculadoras, Índices, Importar, Família, Categorias, Relatórios |
| (inferior) | Configurações → Perfil, Segurança, Notificações, Dados, Análise |

---

## Bloco 1 - Auth (5 min) ★ Crítico

### 1.1 Registro de novo usuário
- [ ] Acessar `http://localhost:3000/register`
- [ ] Preencher nome, email (use `teste-HHMMSS@seudominio.com`), senha (min 12 chars, 1 maiúscula, 1 número, 1 especial)
- [ ] Clicar "Criar conta"
- **Esperado:** toast de sucesso + redirect para `/onboarding`
- **Se falhar:**
  - "Erro ao criar conta" → Console mostra 400/422? Senha fraca ou email já existe
  - Tela branca → Console tem `validateEnv` error? Checar `.env.local`
  - 500 no Console → `ONIEFY_DB_SECRET` inválida

### 1.2 Onboarding
- [ ] Tela de boas-vindas aparece → clicar "Começar"
- [ ] Tela de escolha aparece (Importar / Manual / Explorar) → escolher "Explorar"
- [ ] Loading breve (~2s, seed de categorias/contas/centro)
- [ ] Redirect para `/dashboard`
- **Esperado:** dashboard com estado vazio (sem transações, mensagem motivacional)
- **Se falhar:**
  - Travou no loading → Console: erro no `completeOnboardingSeeds`?
  - Dashboard mostra erro 500 → RPC do dashboard não existe no projeto ativo

### 1.3 Logout e Login
- [ ] Clicar no ícone de logout (sidebar inferior, desktop) ou Mais → Configurações → sair (mobile)
- [ ] Redirect para `/login`
- [ ] Fazer login com o email/senha recém-criados
- **Esperado:** redirect para `/dashboard`
- **Se falhar:**
  - "Credenciais inválidas" → email não confirmado?
  - Loop infinito login→dashboard→login → middleware/cookie issue

---

## Bloco 2 - Dashboard + Navegação (5 min)

### 2.1 Dashboard vazio
- [ ] Dashboard carrega sem erros
- [ ] Cards de resumo visíveis (saldo, receitas, despesas, todos R$ 0,00)
- [ ] Nenhum texto em inglês ("No data", "Loading" etc.)
- **Se falhar:**
  - Spinner infinito → Console: qual RPC falhou?
  - Valores NaN ou undefined → problema de tipo no retorno

### 2.2 Navegação desktop (sidebar)
- [ ] Verificar 5 seções: (topo), Movimentações, Patrimônio, Orçamento, Mais
- [ ] Clicar em cada um dos 18 links:
  - Início (`/dashboard`)
  - Transações (`/transactions`)
  - Cartões (`/cards`)
  - Fluxo de caixa (`/cash-flow`)
  - Contas a pagar (`/bills`)
  - Contas (`/accounts`)
  - Bens e imóveis (`/assets`)
  - Orçamento (`/budgets`)
  - Metas (`/goals`)
  - Impostos / IRPF (`/tax`)
  - Diagnóstico (`/diagnostics`)
  - Calculadoras (`/calculators`)
  - Índices (`/indices`)
  - Importar (`/connections`)
  - Família (`/family`)
  - Categorias (`/categories`)
  - Relatórios (`/workflows`)
- [ ] Configurações (ícone engrenagem) → 5 subpáginas: Perfil, Segurança, Notificações, Dados, Análise
- **Esperado:** todas as páginas carregam sem tela branca

### 2.3 Navegação mobile (5 tabs)
- [ ] Redimensionar janela para < 1024px (ou DevTools responsive)
- [ ] Barra inferior com 5 tabs: Início, Movimentações, Patrimônio, Orçamento, Mais
- [ ] Tab "Mais" → hub com 13 itens (Impostos, Diagnóstico, Calculadoras, Fluxo de caixa, Contas a pagar, Índices, Importação, Metas, Família, Categorias, Relatórios, Garantias, Configurações)
- **Esperado:** todos os itens clicáveis e carregam a página correta

### 2.4 Sininho de notificações
- [ ] Ícone de sino visível na sidebar (desktop, ao lado dos ícones de olho/logout)
- [ ] Clicar → painel de pendências abre
- **Esperado:** lista de pendências (pode estar vazio em conta nova)

---

## Bloco 3 - Transações (5 min) ★ Crítico

### 3.1 Criar despesa
- [ ] Transações → botão "Nova transação"
- [ ] Tipo: Despesa (default)
- [ ] Valor: `150,50` (formato BR com vírgula)
- [ ] Descrição: "Teste supermercado"
- [ ] Categoria: selecionar qualquer uma (ex: Alimentação)
- [ ] Conta: selecionar conta padrão
- [ ] Clicar "Salvar"
- **Esperado:** toast de sucesso, transação na lista, saldo atualizado
- **Se falhar:**
  - Botão salvar inerte → Console: erro de validação Zod?
  - 500 → RPC `create_transaction_with_journal` falhou

### 3.2 Criar receita
- [ ] Nova transação → tipo: Receita
- [ ] Valor: `3000,00`, descrição: "Teste salário"
- [ ] Salvar
- **Esperado:** transação aparece, saldo positivo

### 3.3 Editar transação
- [ ] Clicar na transação "Teste supermercado"
- [ ] Alterar valor para `200,00`
- [ ] Salvar
- **Esperado:** valor atualizado na lista

### 3.4 Verificar dashboard
- [ ] Voltar para Dashboard
- [ ] Cards mostram: Receitas R$ 3.000,00 / Despesas R$ 200,00
- **Esperado:** valores coerentes

---

## Bloco 4 - Contas (3 min)

### 4.1 Listar contas
- [ ] Sidebar → Contas (`/accounts`)
- [ ] Contas-semente visíveis (Conta Corrente, Poupança, Cartão, etc.)
- **Se falhar:** onboarding não rodou o seed

### 4.2 Criar conta
- [ ] Clicar "Nova conta"
- [ ] Nome: "Nubank Teste", tipo: Corrente, saldo inicial: `1000,00`
- [ ] Salvar
- **Esperado:** conta aparece na lista

---

## Bloco 5 - Cartões (2 min)

### 5.1 Cartões de crédito
- [ ] Sidebar → Cartões (`/cards`)
- [ ] Contas tipo cartão separadas dos demais
- **Esperado:** página carrega, mostra cartões com fatura atual (vazia em conta nova)

---

## Bloco 6 - Orçamento + Metas (3 min)

### 6.1 Criar orçamento
- [ ] Sidebar → Orçamento (`/budgets`)
- [ ] Clicar "Novo orçamento"
- [ ] Categoria: Alimentação, valor: `800,00`, mês vigente
- [ ] Salvar
- **Esperado:** barra de progresso mostra gasto vs planejado

### 6.2 Metas
- [ ] Sidebar → Metas (`/goals`)
- [ ] Criar meta (ex: "Reserva emergência", R$ 10.000)
- **Esperado:** meta aparece com progresso 0%

---

## Bloco 7 - Bens e Imóveis (2 min)

### 7.1 Criar bem
- [ ] Sidebar → Bens e imóveis (`/assets`)
- [ ] Clicar "Novo bem"
- [ ] Nome: "MacBook Teste", valor: `15000,00`, tipo: Equipamento
- [ ] Salvar
- **Esperado:** bem aparece na lista com valor

---

## Bloco 8 - Importação (5 min)

### 8.1 Import CSV
- [ ] Sidebar → Importar (`/connections`)
- [ ] Upload de arquivo CSV simples (3-5 linhas: data, descrição, valor)
- [ ] Mapeamento de colunas aparece
- [ ] Confirmar importação
- **Esperado:** transações importadas em Transações
- **Se falhar:**
  - Parsing falhou → formato CSV incompatível. Testar separador `;` e `,`
  - Auto-categorização não funcionou → GEMINI_API_KEY ausente (degradação esperada)

### 8.2 Import OFX (se tiver arquivo)
- [ ] Upload de arquivo .ofx de banco
- [ ] Transações parseadas para revisão
- [ ] Confirmar

---

## Bloco 9 - Fluxo de Caixa + Contas a Pagar (3 min)

### 9.1 Fluxo de caixa
- [ ] Sidebar → Fluxo de caixa (`/cash-flow`)
- [ ] Gráfico de receitas vs despesas carrega
- **Esperado:** dados refletem as transações criadas

### 9.2 Contas a pagar / Recorrências
- [ ] Sidebar → Contas a pagar (`/bills`)
- [ ] Lista de assinaturas e recorrências
- **Esperado:** página carrega (pode estar vazia em conta nova)

---

## Bloco 10 - Impostos / IRPF (3 min)

### 10.1 Painel fiscal
- [ ] Sidebar → Impostos / IRPF (`/tax`)
- [ ] Tabela progressiva IRPF visível (valores 2025/2026)
- [ ] Calendário fiscal mostra prazos

### 10.2 Deduções IRPF
- [ ] Aba ou seção de deduções
- **Esperado:** categorias de dedução (saúde, educação) listadas

---

## Bloco 11 - Diagnóstico + Calculadoras (3 min)

### 11.1 Diagnóstico financeiro
- [ ] Sidebar → Diagnóstico (`/diagnostics`)
- [ ] 11 métricas carregam (savings rate, HHI, WACC, D/E, working capital, breakeven, income volatility, DuPont, category trends, warning signs, monthly history)
- **Esperado:** valores calculados (ou zeros em conta nova)

### 11.2 Calculadoras
- [ ] Sidebar → Calculadoras (`/calculators`)
- [ ] Hub com 8 calculadoras: Projeção, Independência, Posso Comprar, Comprar vs Alugar, CET, SAC vs Price, Quitar Dívidas, Capital Humano
- [ ] Abrir qualquer uma → preencher valores → resultado renderiza
- **Esperado:** cálculos corretos, sem NaN

---

## Bloco 12 - Índices Econômicos (2 min)

### 12.1 Índices
- [ ] Sidebar → Índices (`/indices`)
- [ ] Gráficos de IPCA, Selic, CDI, câmbio
- **Esperado:** dados recentes (últimas semanas)
- **Se falhar:** cron de fetch pode não ter rodado

---

## Bloco 13 - Família + Categorias (2 min)

### 13.1 Família
- [ ] Sidebar → Família (`/family`)
- [ ] Criar membro: "Cônjuge Teste", relação: Cônjuge
- **Esperado:** membro aparece

### 13.2 Categorias
- [ ] Sidebar → Categorias (`/categories`)
- [ ] Árvore de categorias visível, editável
- [ ] Editar cor de uma categoria → Salvar
- **Esperado:** cor atualizada

---

## Bloco 14 - Configurações (3 min)

### 14.1 Perfil
- [ ] Configurações → Perfil (`/settings/profile`)
- [ ] Alterar nome → Salvar
- **Esperado:** toast de sucesso

### 14.2 Segurança
- [ ] Configurações → Segurança (`/settings/security`)
- [ ] Opções de MFA, senha visíveis
- **Esperado:** página carrega

### 14.3 Notificações
- [ ] Configurações → Notificações (`/settings/notifications`)
- [ ] Toggles de preferência visíveis
- **Esperado:** Web Push mostra "Em breve" (E65 pendente)

### 14.4 Dados
- [ ] Configurações → Dados (`/settings/data`)
- [ ] Opções de export/delete visíveis
- **Esperado:** botão de exportar funcional

### 14.5 Análise
- [ ] Configurações → Análise (`/settings/analytics`)
- [ ] Motor financeiro / scanner carregam
- **Esperado:** resultados ou estado vazio

---

## Bloco 15 - Garantias (2 min)

### 15.1 Garantias
- [ ] Mais → Garantias (`/more/warranties`) via hub mobile ou acesso direto
- [ ] Criar garantia de produto
- **Esperado:** garantia aparece com data de expiração

---

## Bloco 16 - Cleanup

- [ ] Excluir transações de teste (se quiser conta limpa)
- [ ] Ou: excluir usuário de teste via Supabase Dashboard → Authentication → Users

---

## Template de Reporte de Bug

```
ROTA: /transactions
PASSO: 3.1 - Criar despesa
AÇÃO: Cliquei "Salvar" após preencher todos os campos
ESPERADO: toast de sucesso + transação na lista
ACONTECEU: botão ficou em loading infinito
CONSOLE (F12): POST /rest/v1/rpc/create_transaction_with_journal 400 - "account_id is required"
SCREENSHOT: [colar se possível]
```

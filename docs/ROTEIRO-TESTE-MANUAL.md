# Oniefy - Roteiro de Teste Manual

**Objetivo:** validar os fluxos críticos antes do deploy.
**Tempo estimado:** 25-35 minutos (fluxo completo).
**Pré-requisito:** `.\scripts\preflight.ps1 -SkipBuild -StartDev` passou sem [FALHA].

> Dica: abra o DevTools (F12) → Console antes de começar. Erros JS aparecem lá antes de qualquer tela branca.

---

## Como usar este roteiro

Cada item tem:
- **Ação:** o que fazer
- **Esperado:** o que deve acontecer
- **Se falhar:** diagnóstico rápido

Marque com `[x]` conforme avançar. Se travar, anote o passo exato e o erro do Console - isso é suficiente para eu diagnosticar.

---

## Bloco 1 - Auth (5 min) ★ Crítico

### 1.1 Registro de novo usuário
- [ ] Acessar `http://localhost:3000/register`
- [ ] Preencher nome, email (use um temporário, ex: `teste-HHMMSS@seudominio.com`), senha (min 12 chars, 1 maiúscula, 1 número, 1 especial)
- [ ] Clicar "Criar conta"
- **Esperado:** toast de sucesso + redirect para `/onboarding`
- **Se falhar:**
  - "Erro ao criar conta" → Console mostra 400/422? Senha fraca ou email já existe
  - Tela branca → Console tem `validateEnv` error? Checar `.env.local`
  - 500 no Console → `SUPABASE_SERVICE_ROLE_KEY` inválida

### 1.2 Onboarding
- [ ] Tela de boas-vindas aparece → clicar "Começar"
- [ ] Tela de escolha aparece (Importar / Manual / Explorar) → escolher "Explorar"
- [ ] Loading breve (~2s, seed de categorias/contas/centro)
- [ ] Redirect para `/dashboard`
- **Esperado:** dashboard com estado vazio (sem transações, mensagem motivacional)
- **Se falhar:**
  - Travou no loading → Console: erro no `completeOnboardingSeeds`? RPC falhou?
  - Dashboard mostra erro 500 → algum RPC do dashboard não existe no projeto ativo

### 1.3 Logout e Login
- [ ] Clicar no ícone de logout (sidebar, parte inferior)
- [ ] Redirect para `/login`
- [ ] Fazer login com o email/senha recém-criados
- **Esperado:** redirect para `/dashboard`
- **Se falhar:**
  - "Credenciais inválidas" → email não confirmado? Supabase pode exigir confirmação por email
  - Loop infinito login→dashboard→login → middleware/cookie issue. Abrir Console e checar cookies

---

## Bloco 2 - Dashboard + Navegação (3 min)

### 2.1 Dashboard vazio
- [ ] Dashboard carrega sem erros
- [ ] Cards de resumo visíveis (saldo, receitas, despesas - todos R$ 0,00)
- [ ] Nenhum texto em inglês ("No data", "Loading" etc.)
- **Se falhar:**
  - Spinner infinito → Console: qual RPC falhou? Anotar nome
  - Valores NaN ou undefined → problema de tipo no retorno do RPC

### 2.2 Navegação sidebar
- [ ] Clicar em cada item: Início, Transações, Importar, Contas, Orçamento, Patrimônio
- [ ] Cada página carrega sem tela branca
- [ ] Clicar em Configurações (ícone engrenagem) → subpáginas: Perfil, Segurança, Notificações, Dados, Análise
- **Se falhar:**
  - Tela branca em rota específica → anotar qual rota (ex: `/budgets`)

---

## Bloco 3 - Transação (5 min) ★ Crítico

### 3.1 Criar despesa
- [ ] Na página Transações, clicar botão "Nova transação"
- [ ] Formulário abre (modal ou inline)
- [ ] Tipo: Despesa (default)
- [ ] Valor: digitar `150,50` (formato BR com vírgula)
- [ ] Descrição: "Teste supermercado"
- [ ] Categoria: selecionar qualquer uma (ex: Alimentação)
- [ ] Conta: selecionar conta padrão
- [ ] Clicar "Salvar"
- **Esperado:** toast de sucesso, transação aparece na lista, saldo atualizado
- **Se falhar:**
  - Botão salvar não faz nada → Console: erro de validação Zod? Campo obrigatório faltando?
  - 500 → RPC `create_transaction_with_journal` falhou. Anotar mensagem do Console

### 3.2 Criar receita
- [ ] Nova transação → tipo: Receita
- [ ] Valor: `3000,00`, descrição: "Teste salário"
- [ ] Salvar
- **Esperado:** transação aparece, saldo fica positivo

### 3.3 Editar transação
- [ ] Clicar na transação "Teste supermercado"
- [ ] Alterar valor para `200,00`
- [ ] Salvar
- **Esperado:** valor atualizado na lista

### 3.4 Verificar dashboard
- [ ] Voltar para Dashboard
- [ ] Cards mostram: Receitas R$ 3.000,00 / Despesas R$ 200,00
- **Esperado:** valores coerentes com o que foi criado

---

## Bloco 4 - Contas (3 min)

### 4.1 Listar contas
- [ ] Ir para Contas
- [ ] Contas-semente visíveis (Conta Corrente, Poupança, Cartão, etc.)
- **Se falhar:** onboarding não rodou o seed corretamente

### 4.2 Criar conta
- [ ] Clicar "Nova conta"
- [ ] Nome: "Nubank Teste", tipo: Corrente, saldo inicial: `1000,00`
- [ ] Salvar
- **Esperado:** conta aparece na lista

---

## Bloco 5 - Orçamento (3 min)

### 5.1 Criar orçamento
- [ ] Ir para Orçamento
- [ ] Clicar "Novo orçamento" (ou equivalente)
- [ ] Categoria: Alimentação, valor: `800,00`, mês vigente
- [ ] Salvar
- **Esperado:** barra de progresso mostra gasto (R$ 200,00 da despesa) vs planejado (R$ 800,00)

---

## Bloco 6 - Patrimônio (3 min)

### 6.1 Criar bem
- [ ] Ir para Patrimônio
- [ ] Clicar "Novo bem"
- [ ] Nome: "MacBook Teste", valor: `15000,00`, tipo: Equipamento
- [ ] Salvar
- **Esperado:** bem aparece na lista com valor

---

## Bloco 7 - Importação (5 min)

### 7.1 Import CSV
- [ ] Ir para Importar
- [ ] Upload de um arquivo CSV simples (3-5 linhas: data, descrição, valor)
- [ ] Mapeamento de colunas aparece
- [ ] Confirmar importação
- **Esperado:** transações importadas aparecem em Transações
- **Se falhar:**
  - Parsing falhou → formato do CSV incompatível. Testar com separador `;` e `,`
  - Auto-categorização não funcionou → GEMINI_API_KEY ausente (degradação esperada)

### 7.2 Import OFX (se tiver arquivo)
- [ ] Upload de arquivo .ofx de banco
- [ ] Transações parseadas aparecem para revisão
- [ ] Confirmar

---

## Bloco 8 - Configurações (3 min)

### 8.1 Perfil
- [ ] Configurações → Perfil
- [ ] Alterar nome → Salvar
- **Esperado:** toast de sucesso

### 8.2 Categorias
- [ ] Configurações → Categorias
- [ ] Editar cor de uma categoria → Salvar
- **Esperado:** cor atualizada

### 8.3 Plano de Contas
- [ ] Configurações → Plano de Contas
- [ ] Árvore de 140 contas visível, navegável
- **Esperado:** expansão/colapso funciona

---

## Bloco 9 - Fiscal + Índices (3 min)

### 9.1 Painel Fiscal
- [ ] Configurações → Fiscal
- [ ] Dados IRPF visíveis (tabela progressiva, deduções)
- **Esperado:** valores da tabela 2025/2026

### 9.2 Índices Econômicos
- [ ] Configurações → Índices
- [ ] Gráficos de IPCA, Selic, câmbio
- **Esperado:** dados recentes (últimas semanas)
- **Se falhar:** cron de fetch pode não ter rodado. Dados podem estar vazios no projeto novo

---

## Bloco 10 - Cleanup

- [ ] Excluir as transações de teste (se quiser manter a conta limpa)
- [ ] Ou: excluir o usuário de teste via Supabase Dashboard → Authentication → Users

---

## Template de Reporte de Bug

Quando encontrar um problema, copie e preencha:

```
ROTA: /transactions
PASSO: 3.1 - Criar despesa
AÇÃO: Cliquei "Salvar" após preencher todos os campos
ESPERADO: toast de sucesso + transação na lista
ACONTECEU: botão ficou em loading infinito
CONSOLE (F12): POST /rest/v1/rpc/create_transaction_with_journal 400 - "account_id is required"
SCREENSHOT: [colar se possível]
```

Isso me dá informação suficiente para diagnosticar sem eu precisar reproduzir o cenário inteiro.

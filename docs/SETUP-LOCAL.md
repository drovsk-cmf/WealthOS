# WealthOS - Guia de Setup Local (Fase 0)

**Data:** 07 de março de 2026
**Objetivo:** Colocar o WealthOS rodando no seu computador pela primeira vez.

---

## Contexto: como o projeto funciona

O WealthOS é um aplicativo web. Para desenvolvê-lo, você precisa de três coisas:

1. **O código-fonte** - São os arquivos do projeto (HTML, TypeScript, CSS, etc.). Eles ficam no GitHub (repositório remoto) e você baixa uma cópia para o seu computador (repositório local). É nessa cópia local que você edita, testa e roda o app.

2. **O banco de dados** - Fica no Supabase (na nuvem). Já está configurado com as 13 tabelas, RLS, triggers, etc. O app no seu computador se conecta a ele pela internet usando chaves de acesso.

3. **Um servidor local de desenvolvimento** - Quando você roda `npm run dev`, o Next.js cria um servidor temporário no seu computador (em http://localhost:3000) que serve o app no navegador. Esse servidor só existe enquanto o comando estiver rodando no terminal.

O arquivo `.env.local` é o que conecta os pontos 1 e 2: ele fica dentro da pasta do código-fonte e contém as chaves para o app acessar o banco de dados.

---

## Etapa 0: Verificar pré-requisitos de software

Antes de tudo, seu computador precisa ter três programas instalados: Git, Node.js e npm (npm vem junto com o Node.js).

### 0.1 Verificar se o Git está instalado

Abra o Terminal (macOS: Cmd+Espaço > digite "Terminal" > Enter):

```bash
git --version
```

**Se aparecer algo como** `git version 2.39.0` → OK, pule para 0.2

**Se aparecer** `command not found` ou erro → instale o Git:
- **macOS:** Ao digitar `git` no terminal, o macOS oferece instalar automaticamente. Aceite e aguarde.
- **Windows:** Baixe em https://git-scm.com/download/win e instale com as opções padrão.

### 0.2 Verificar se o Node.js está instalado

No mesmo terminal:

```bash
node --version
```

**Se aparecer** `v18.x.x`, `v20.x.x` ou `v22.x.x` → OK, pule para a Etapa 1

**Se aparecer** versão menor que 18 ou `command not found` → instale o Node.js:
1. Acesse https://nodejs.org
2. Baixe a versão **LTS** (Long Term Support) - botão verde à esquerda
3. Execute o instalador com as opções padrão
4. **Feche e reabra o Terminal** para que o sistema reconheça o novo programa
5. Teste novamente: `node --version` (deve mostrar v20 ou superior)

O npm é instalado automaticamente junto com o Node.js. Confirme:

```bash
npm --version
```

Deve mostrar `9.x.x` ou superior.

---

## Etapa 1: Baixar o código-fonte para o seu computador

Você vai "clonar" o repositório do GitHub para uma pasta local. Essa pasta será o seu ambiente de trabalho.

### 1.1 Escolher onde guardar o projeto

Decida uma pasta no seu computador para projetos de desenvolvimento. Sugestões:

- macOS: `~/Projetos/` ou `~/Developer/`
- Windows: `C:\Projetos\`

**Não use o Google Drive, iCloud, OneDrive ou Dropbox.** Esses serviços de sincronização causam conflitos com os milhares de arquivos que o Node.js gera na pasta `node_modules`. O projeto precisa ficar numa pasta local comum.

### 1.2 Clonar o repositório

No terminal:

```bash
# Navegue até a pasta que você escolheu (exemplo para macOS):
mkdir -p ~/Projetos
cd ~/Projetos

# Clone o repositório (baixa todos os arquivos do GitHub):
git clone https://github.com/drovsk-cmf/WealthOS.git
```

Se pedir autenticação do GitHub, use:
- **Username:** seu usuário do GitHub
- **Password:** use o token `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`

### 1.3 Verificar que deu certo

```bash
cd WealthOS
ls
```

Deve listar arquivos como: `package.json`, `next.config.js`, `src/`, `supabase/`, `docs/`, etc.

A partir de agora, **todos os comandos devem ser executados dentro desta pasta** (`~/Projetos/WealthOS`).

---

## Etapa 2: Obter a service_role key do Supabase

O app precisa de duas chaves para se conectar ao Supabase:

- **anon key** (pública): já temos. É usada no navegador do usuário.
- **service_role key** (secreta): precisa buscar no dashboard. É usada apenas no servidor.

### 2.1 Acessar o dashboard

1. Abra o navegador e acesse:
   ```
   https://supabase.com/dashboard/project/hmwdfcsxtmbzlslxgqus/settings/api
   ```
2. Se pedir login, entre com a conta que você usou para criar o projeto Supabase

### 2.2 Copiar a chave

3. Na página que abriu ("API Settings"), procure a seção **"Project API keys"**
4. Você verá duas linhas:

   | Nome | Tipo | O que fazer |
   |---|---|---|
   | `anon` `public` | Chave pública | Já temos. Não precisa copiar. |
   | `service_role` `secret` | Chave secreta | **Esta é a que precisamos.** |

5. Na linha da `service_role`, clique no ícone de **olho** (👁) para revelar o valor
6. Clique no ícone de **copiar** (📋) para copiar a chave para a área de transferência
7. **Cole em algum lugar temporário** (bloco de notas, por exemplo). Você usará na Etapa 3.

---

## Etapa 3: Criar o arquivo .env.local

Este é o arquivo que contém as chaves de acesso. Ele **precisa ficar dentro da pasta do projeto**, na mesma pasta onde está o `package.json`. É assim que o Next.js sabe onde encontrá-lo. Se estiver em outro lugar (Google Drive, Desktop, outra pasta), o app simplesmente não o encontra.

A estrutura da pasta fica assim:

```
~/Projetos/WealthOS/       ← pasta raiz do projeto
├── .env.local              ← AQUI (mesmo nível que package.json)
├── package.json
├── next.config.js
├── src/
├── supabase/
└── ...
```

### 3.1 Confirmar que está na pasta certa

No terminal:

```bash
# Navegue até a pasta do projeto (se não estiver nela):
cd ~/Projetos/WealthOS

# Confirme que está na pasta certa:
pwd
# Deve mostrar algo como: /Users/claudio/Projetos/WealthOS

# Confirme que o package.json existe aqui:
ls package.json
# Deve mostrar: package.json
```

Se `ls package.json` mostrar "No such file", você não está na pasta certa.

### 3.2 Criar o arquivo

```bash
cp .env.example .env.local
```

Isso cria uma cópia do template `.env.example` com o nome `.env.local`.

### 3.3 Editar o arquivo com os valores reais

Abra o arquivo no editor de texto:

```bash
# Se usa VS Code (recomendado):
code .env.local

# Se não tem VS Code, use o editor nano (vem com macOS/Linux):
nano .env.local
# No nano: edite o texto, depois pressione Ctrl+O para salvar, Enter, Ctrl+X para sair
```

### 3.4 Substituir o conteúdo

Apague tudo que está no arquivo e cole o seguinte:

```bash
# ============================================
# WealthOS - Environment Variables
# ============================================

# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=https://hmwdfcsxtmbzlslxgqus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtd2RmY3N4dG1iemxzbHhncXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzUzMDUsImV4cCI6MjA4Nzk1MTMwNX0.iPnPfcKziaFzLjeNKkCo5px0NyuaeHToOoVyvWcicSE

# ATENCAO: cole aqui a service_role key obtida na Etapa 2
SUPABASE_SERVICE_ROLE_KEY=COLE_A_SERVICE_ROLE_KEY_AQUI

# --- Supabase Project ID ---
SUPABASE_PROJECT_ID=hmwdfcsxtmbzlslxgqus

# --- App ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.5 Colar a service_role key

Localize a linha:
```
SUPABASE_SERVICE_ROLE_KEY=COLE_A_SERVICE_ROLE_KEY_AQUI
```

Substitua `COLE_A_SERVICE_ROLE_KEY_AQUI` pela chave que você copiou na Etapa 2. O resultado fica algo como:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz...resto_da_chave...
```

**Regras:**
- Sem espaços antes ou depois do `=`
- Sem aspas ao redor do valor
- A chave inteira deve ficar numa única linha

### 3.6 Salvar

- **VS Code:** Ctrl+S (ou Cmd+S no Mac)
- **nano:** Ctrl+O > Enter > Ctrl+X

### 3.7 Verificar

```bash
# Confirme que o arquivo existe e tem conteúdo:
cat .env.local
# Deve mostrar as variáveis. Confirme que a service_role NÃO é mais "COLE_A_SERVICE_ROLE_KEY_AQUI"

# Confirme que o Git NÃO está rastreando este arquivo:
git status
# O .env.local NÃO deve aparecer na lista. Isso é correto (está no .gitignore).
```

---

## Etapa 4: Configurar Auth Providers (Google e Apple)

Os Auth Providers permitem login social ("Continuar com Google", "Continuar com Apple").

**Para o primeiro teste, esta etapa é opcional.** O app funciona com email/senha sem configurar Google ou Apple. Você pode pular para a Etapa 5 e voltar aqui depois.

Se quiser configurar agora:

### 4A. Configurar Google OAuth

**Parte 1: Criar credenciais no Google Cloud Console**

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Se não tiver um projeto Google Cloud:
   - Clique em **"Select a project"** (barra azul no topo) > **"New Project"**
   - Nome: `WealthOS`
   - Clique **"Create"**
   - Aguarde criar e selecione o projeto
3. Clique em **"+ CREATE CREDENTIALS"** (botão azul no topo) > **"OAuth client ID"**
4. Se aparecer uma mensagem pedindo para configurar a tela de consentimento:
   a. Clique no link **"Configure consent screen"**
   b. Selecione **"External"** > clique **"Create"**
   c. Preencha apenas os campos obrigatórios:
      - **App name:** `WealthOS`
      - **User support email:** selecione seu email
      - **Developer contact information:** digite seu email
   d. Clique **"Save and Continue"** (3 vezes, nas telas Scopes, Test Users, Summary)
   e. Clique **"Back to Dashboard"**
   f. Volte para: https://console.cloud.google.com/apis/credentials
   g. Clique novamente em **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
5. Em "Application type", selecione: **"Web application"**
6. Em "Name", digite: `WealthOS Supabase`
7. Role até **"Authorized redirect URIs"**
8. Clique **"+ ADD URI"**
9. Cole exatamente:
   ```
   https://hmwdfcsxtmbzlslxgqus.supabase.co/auth/v1/callback
   ```
10. Clique **"CREATE"**
11. Um modal aparece com **Client ID** e **Client Secret**. Copie ambos e guarde temporariamente.

**Parte 2: Configurar no Supabase**

12. Acesse: https://supabase.com/dashboard/project/hmwdfcsxtmbzlslxgqus/auth/providers
13. Na lista de providers, clique em **"Google"** para expandir
14. Ative o toggle **"Enable Sign in with Google"** (fica verde)
15. Cole o **Client ID** no campo "Client ID (for oauth)"
16. Cole o **Client Secret** no campo "Client Secret (for oauth)"
17. Clique **"Save"**

### 4B. Apple Sign-In (opcional, requer Apple Developer Program US$ 99/ano)

Pode ser configurado depois. O app funciona sem ele.

---

## Etapa 5: Instalar dependências e rodar o projeto

### 5.1 Instalar dependências

No terminal, dentro da pasta do projeto:

```bash
# Confirme que está na pasta certa:
pwd
# Deve mostrar algo como: /Users/claudio/Projetos/WealthOS

# Instale as dependências (baixa todas as bibliotecas que o projeto usa):
npm install
```

**O que esperar:**
- Leva entre 30 segundos e 2 minutos
- Mostra progresso com barras e números
- Pode mostrar "warnings" (avisos) em amarelo - são normais, ignore
- **Erros** aparecem em vermelho com a palavra "ERR!" - esses precisam ser resolvidos
- No final, aparece algo como: `added 347 packages in 45s`
- Uma nova pasta `node_modules/` aparece na raiz do projeto (é enorme, normal)

**Se der erro:**
- `EACCES: permission denied` → tente: `sudo npm install` (macOS/Linux)
- `node: command not found` → Node.js não está instalado (volte à Etapa 0)

### 5.2 Rodar o servidor de desenvolvimento

```bash
npm run dev
```

**O que esperar no terminal:**
```
▲ Next.js 14.2.14
- Local:        http://localhost:3000
- Environments: .env.local

 ✓ Ready in 3.2s
```

Pontos importantes:
- A linha `Environments: .env.local` confirma que o arquivo de chaves foi encontrado
- **Se essa linha NÃO aparecer:** o `.env.local` não está na pasta certa ou tem nome errado
- O terminal fica "preso" (não aceita novos comandos) - isso é normal, o servidor está rodando
- Para parar o servidor: pressione **Ctrl+C** no terminal
- Para rodar de novo: `npm run dev`

### 5.3 Abrir no navegador

1. Abra o navegador (Chrome, Safari, Firefox)
2. Na barra de endereço, digite: `http://localhost:3000`
3. Pressione Enter

**O que esperar:**
- O navegador redireciona para `http://localhost:3000/login`
- Aparece a tela de login do WealthOS com:
  - Título "WealthOS"
  - Subtítulo "Gestão financeira e patrimonial inteligente"
  - Botão "Continuar com Google"
  - Botão "Continuar com Apple"
  - Campos de Email e Senha
  - Botão "Entrar"
  - Link "Criar conta"

**Se aparecer tela branca ou erro:**
- Abra o console do navegador: pressione F12 (ou Cmd+Option+I no Mac) > clique na aba "Console"
- Copie a mensagem de erro vermelha e me envie

---

## Etapa 6: Teste de validação

### 6.1 Criar uma conta de teste

1. Na tela de login, clique em **"Criar conta"**
2. Preencha:
   - **Nome:** `Claudio Teste`
   - **Email:** use um email real que você acesse
   - **Senha:** pelo menos 12 caracteres (ex: `MinhaSenh@2026!`)
3. Clique **"Criar conta"**

**O que esperar:**
- Redirecionamento para a página `/onboarding`
- Mensagem "Bem-vindo ao WealthOS"

4. Clique **"Ir para o Dashboard (provisório)"**

**O que esperar:**
- Página do Dashboard com 4 cards:
  - Saldo Atual: R$ 0,00
  - Saldo Previsto: R$ 0,00
  - Contas Ativas: 0
  - Fase Atual: Fase 0

**Se chegou até aqui: a Fase 0 está concluída!**

---

## Checklist final

Marque cada item quando concluir:

- [ ] Git, Node.js e npm instalados e funcionando
- [ ] Repositório clonado em pasta local (NÃO no Google Drive/iCloud/Dropbox)
- [ ] service_role key copiada do dashboard Supabase
- [ ] `.env.local` criado na raiz do projeto (ao lado do package.json) com as chaves
- [ ] `npm install` executado sem erros
- [ ] `npm run dev` rodando e mostrando "Ready" + "Environments: .env.local"
- [ ] Tela de login visível em http://localhost:3000/login
- [ ] Conta de teste criada e dashboard acessível
- [ ] (Opcional) Google OAuth configurado e testado
- [ ] (Opcional) Apple Sign-In configurado

Quando os 8 primeiros itens estiverem marcados, me envie uma mensagem confirmando.
A partir daí, a Fase 0 está fechada e entramos na Fase 1 (Auth + Segurança).

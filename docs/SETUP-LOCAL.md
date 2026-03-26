# Oniefy (WealthOS) - Guia de Setup Local (Windows)

**Data:** 07 de março de 2026
**Objetivo:** Colocar o Oniefy rodando no seu computador pela primeira vez.

---

## Contexto: como o projeto funciona

O Oniefy é um aplicativo web. Para desenvolvê-lo, você precisa de três coisas
funcionando juntas:

1. **O código-fonte** - São os arquivos do projeto (TypeScript, CSS, etc.). Eles
   ficam no GitHub (repositório remoto) e você baixa uma cópia para o seu computador
   (repositório local). É nessa cópia local que você roda o app.

2. **O banco de dados** - Fica no Supabase (na nuvem). Já está configurado com as
   13 tabelas, RLS, triggers, etc. O app no seu computador se conecta a ele pela
   internet usando chaves de acesso.

3. **Um servidor local de desenvolvimento** - Quando você roda `npm run dev`, o
   Next.js cria um servidor temporário no seu computador (em http://localhost:3000)
   que serve o app no navegador. Esse servidor só existe enquanto o comando estiver
   rodando no terminal.

O arquivo `.env.local` é o que conecta os pontos 1 e 2: ele fica dentro da pasta
do código-fonte e contém as chaves para o app acessar o banco de dados.

---

## Etapa 0: Verificar pré-requisitos de software

Seu computador precisa ter três programas: Git, Node.js e npm.

### 0.1 Abrir o PowerShell

1. Pressione **Win + R** (tecla Windows + letra R ao mesmo tempo)
2. Digite `powershell` e pressione Enter
3. Uma janela azul/preta abre. Este é o terminal. Todos os comandos deste guia
   serão digitados aqui.

**Dica:** No Windows 11, você também pode clicar com o botão direito no menu
Iniciar e selecionar "Terminal".

### 0.2 Verificar se o Git está instalado

No PowerShell, digite e pressione Enter:

```powershell
git --version
```

**Se aparecer** `git version 2.xx.x` → OK, pule para 0.3

**Se aparecer** erro ou `não é reconhecido como comando` → instale o Git:
1. Acesse https://git-scm.com/download/win
2. O download começa automaticamente. Execute o instalador.
3. Na instalação, aceite todas as opções padrão (clique Next em cada tela)
4. **Feche o PowerShell e abra novamente** (Win + R > powershell > Enter)
5. Teste de novo: `git --version`

### 0.3 Verificar se o Node.js está instalado

```powershell
node --version
```

**Se aparecer** `v18.x.x`, `v20.x.x` ou `v22.x.x` → OK, pule para a Etapa 1

**Se aparecer** erro ou versão menor que 18 → instale o Node.js:
1. Acesse https://nodejs.org
2. Clique no botão verde **LTS** (Long Term Support) à esquerda para baixar
3. Execute o instalador `.msi` que foi baixado
4. Na instalação:
   - Aceite os termos de licença
   - Mantenha o caminho padrão de instalação
   - Na tela "Tools for Native Modules", **marque o checkbox** "Automatically
     install the necessary tools" se aparecer
   - Clique Install
5. **Feche o PowerShell e abra novamente**
6. Teste: `node --version` (deve mostrar v20 ou superior)

O npm vem junto com o Node.js. Confirme:

```powershell
npm --version
```

Deve mostrar `9.x.x` ou `10.x.x`.

---

## Etapa 1: Baixar o código-fonte para o seu computador

Você vai "clonar" (baixar) o repositório do GitHub para uma pasta local.

### 1.1 Escolher onde guardar o projeto

O projeto precisa ficar numa pasta local comum do Windows. Sugestão: `C:\Projetos\`.

**Não use o Google Drive, OneDrive, iCloud ou Dropbox.** Esses serviços de
sincronização causam conflitos com os milhares de arquivos que o Node.js gera
na pasta `node_modules`.

No PowerShell, crie a pasta e entre nela:

```powershell
mkdir C:\Projetos
cd C:\Projetos
```

Se a pasta já existir, o `mkdir` mostra um erro. Ignore e siga com o `cd`.

### 1.2 Clonar o repositório

```powershell
git clone https://github.com/drovsk-cmf/WealthOS.git
```

**O que esperar:** o Git baixa todos os arquivos. Demora alguns segundos.
No final aparece algo como:
```
Cloning into 'WealthOS'...
remote: Enumerating objects: ...
Receiving objects: 100% ...
```

Se pedir autenticação:
- **Username:** seu usuário do GitHub (drovsk-cmf)
- **Password:** cole seu Personal Access Token (PAT) do GitHub

### 1.3 Entrar na pasta do projeto

```powershell
cd WealthOS
```

### 1.4 Verificar que deu certo

```powershell
dir
```

Deve listar arquivos e pastas como: `package.json`, `next.config.js`, `src`,
`supabase`, `docs`, etc. Se aparecer isso, deu certo.

**A partir de agora, todos os comandos deste guia devem ser executados dentro
desta pasta** (`C:\Projetos\WealthOS`). Se fechar o PowerShell e abrir de novo,
rode `cd C:\Projetos\WealthOS` antes de qualquer coisa.

---

## Etapa 2: Obter a service_role key do Supabase

O app precisa de duas chaves para se conectar ao Supabase:

- **anon key** (pública): já temos. É usada no navegador do usuário.
- **service_role key** (secreta): precisa buscar no dashboard. É usada apenas
  no servidor.

### 2.1 Acessar o painel de API keys

1. Abra o navegador (Chrome, Edge, etc.)
2. Cole na barra de endereço e pressione Enter:
   ```
   https://supabase.com/dashboard/project/mngjbrbxapazdddzgoje/settings/api
   ```
3. Se pedir login, entre com a conta que você usou para criar o projeto Supabase

### 2.2 Copiar a chave

4. Na página "API Settings", localize a seção **"Project API keys"**
5. Você verá duas linhas:

   | Nome              | O que fazer                                |
   |-------------------|--------------------------------------------|
   | `anon` `public`   | Já temos. Não precisa copiar.              |
   | `service_role` `secret` | **Esta é a que precisamos.**         |

6. Na linha da `service_role`, clique no ícone de **olho** para revelar o valor
7. Clique no ícone de **copiar** para copiar a chave
8. Abra o **Bloco de Notas** (Win + R > `notepad` > Enter) e cole a chave lá
   temporariamente. Você vai usar na próxima etapa.

---

## Etapa 3: Criar o arquivo .env.local

Este arquivo contém as chaves de acesso ao banco de dados. Ele precisa ficar
**dentro da pasta do projeto**, no mesmo local onde está o `package.json`:

```
C:\Projetos\WealthOS\          ← pasta raiz do projeto
├── .env.local                  ← AQUI (mesmo nível que package.json)
├── package.json
├── next.config.js
├── src\
├── supabase\
└── ...
```

Se o arquivo estiver em qualquer outro lugar (Google Drive, Desktop, Downloads),
o Next.js não o encontra e o app não consegue se conectar ao banco.

### 3.1 Confirmar que está na pasta certa

No PowerShell:

```powershell
cd C:\Projetos\WealthOS
pwd
```

Deve mostrar: `C:\Projetos\WealthOS`

Confirme que o `package.json` existe aqui:

```powershell
dir package.json
```

Se mostrar o arquivo, você está no lugar certo. Se der erro, volte para a Etapa 1.

### 3.2 Criar o arquivo a partir do template

```powershell
Copy-Item .env.example .env.local
```

Isso cria uma cópia do template com o nome `.env.local`.

### 3.3 Abrir o arquivo para edição

```powershell
notepad .env.local
```

O Bloco de Notas abre com o conteúdo do arquivo.

### 3.4 Substituir o conteúdo

Selecione tudo (Ctrl+A) e apague. Depois cole o seguinte texto:

```
# ============================================
# Oniefy - Environment Variables
# ============================================

# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=https://mngjbrbxapazdddzgoje.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=COLE_A_ANON_KEY_DO_PROJETO_SP_AQUI

# ATENCAO: cole a service_role key na linha abaixo
SUPABASE_SERVICE_ROLE_KEY=COLE_A_SERVICE_ROLE_KEY_AQUI

# --- Supabase Project ID ---
SUPABASE_PROJECT_ID=mngjbrbxapazdddzgoje

# --- App ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.5 Colar a service_role key

Localize a linha:
```
SUPABASE_SERVICE_ROLE_KEY=COLE_A_SERVICE_ROLE_KEY_AQUI
```

Selecione apenas o texto `COLE_A_SERVICE_ROLE_KEY_AQUI` e substitua pela chave
que você copiou no Bloco de Notas na Etapa 2. O resultado deve ficar assim:
```
SUPABASE_SERVICE_ROLE_KEY=<cole a service_role key do Supabase Dashboard>
```

**Regras importantes:**
- Sem espaços antes ou depois do `=`
- Sem aspas ao redor do valor
- A chave inteira deve ficar numa única linha (não quebre em duas linhas)

### 3.6 Salvar e fechar

1. Ctrl+S para salvar
2. Feche o Bloco de Notas

### 3.7 Verificar que está tudo certo

De volta no PowerShell:

```powershell
# Confirme que o arquivo existe:
dir .env.local

# Veja o conteúdo (confira que a service_role NÃO é mais "COLE_A_SERVICE_ROLE_KEY_AQUI"):
Get-Content .env.local

# Confirme que o Git NÃO está rastreando este arquivo (segurança):
git status
```

No `git status`, o `.env.local` **NÃO deve aparecer** na lista de alterações.
Isso é correto e esperado (ele está no `.gitignore`).

---

## Etapa 4: Configurar Google OAuth (opcional para primeiro teste)

Os botões "Continuar com Google" e "Continuar com Apple" na tela de login
precisam de configuração adicional. **Para o primeiro teste, você pode pular
esta etapa.** O login por email/senha funciona sem isso.

Se quiser configurar o Google agora:

### 4.1 Criar credenciais no Google Cloud Console

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Se não tiver um projeto Google Cloud:
   - Clique em **"Select a project"** (barra azul no topo) > **"New Project"**
   - Nome: `Oniefy` > clique **"Create"** > aguarde > selecione o projeto
3. Clique **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
4. Se pedir para configurar a tela de consentimento:
   a. Clique **"Configure consent screen"**
   b. Selecione **"External"** > **"Create"**
   c. Preencha:
      - App name: `Oniefy`
      - User support email: seu email
      - Developer contact: seu email
   d. Clique **"Save and Continue"** (3 vezes seguidas)
   e. Clique **"Back to Dashboard"**
   f. Volte para https://console.cloud.google.com/apis/credentials
   g. Clique **"+ CREATE CREDENTIALS"** > **"OAuth client ID"** novamente
5. Application type: **"Web application"**
6. Name: `Oniefy Supabase`
7. Em **"Authorized redirect URIs"**, clique **"+ ADD URI"** e cole:
   ```
   https://mngjbrbxapazdddzgoje.supabase.co/auth/v1/callback
   ```
8. Clique **"CREATE"**
9. Copie o **Client ID** e o **Client Secret** que aparecem no modal

### 4.2 Configurar no Supabase

10. Acesse: https://supabase.com/dashboard/project/mngjbrbxapazdddzgoje/auth/providers
11. Clique em **"Google"** para expandir
12. Ative o toggle **"Enable Sign in with Google"**
13. Cole o **Client ID** no campo correspondente
14. Cole o **Client Secret** no campo correspondente
15. Clique **"Save"**

---

## Etapa 5: Instalar dependências e rodar o projeto

### 5.1 Instalar dependências

No PowerShell, dentro da pasta do projeto:

```powershell
# Confirme que está na pasta certa:
cd C:\Projetos\WealthOS

# Instale as dependências:
npm install
```

**O que esperar:**
- Leva 30 segundos a 2 minutos
- Mostra barras de progresso
- **Warnings em amarelo**: normais, ignore
- **Erros em vermelho com "ERR!"**: precisam ser resolvidos (me envie a mensagem)
- No final aparece: `added XXX packages in XXs`
- Uma pasta `node_modules` aparece dentro do projeto (é enorme, ~200MB, normal)

### 5.2 Rodar o servidor de desenvolvimento

```powershell
npm run dev
```

**O que deve aparecer no PowerShell:**
```
▲ Next.js 14.2.14
- Local:        http://localhost:3000
- Environments: .env.local

 ✓ Ready in 3.2s
```

**Verificações:**
- A linha `Environments: .env.local` **precisa aparecer**. Se não aparecer, o
  arquivo `.env.local` não foi encontrado (volte à Etapa 3 e confirme que ele
  está em `C:\Projetos\WealthOS\.env.local`)
- O PowerShell fica "travado" sem aceitar novos comandos. **Isso é normal.** O
  servidor está rodando. Não feche essa janela.
- Para parar o servidor depois: pressione **Ctrl+C**
- Para rodar de novo: `npm run dev`

**Se precisar usar o PowerShell para outra coisa** enquanto o servidor roda:
abra uma segunda janela do PowerShell (Win + R > powershell > Enter) e navegue
para a pasta do projeto (`cd C:\Projetos\WealthOS`).

### 5.3 Abrir no navegador

1. Abra o navegador (Chrome, Edge, Firefox)
2. Na barra de endereço, digite: `http://localhost:3000`
3. Pressione Enter

**O que esperar:**
- O navegador redireciona para `http://localhost:3000/login`
- Aparece a tela de login do Oniefy com:
  - Título "Oniefy"
  - Subtítulo "Gestão financeira e patrimonial inteligente"
  - Botão "Continuar com Google"
  - Botão "Continuar com Apple"
  - Campos de Email e Senha
  - Botão "Entrar"
  - Link "Criar conta"

**Se aparecer tela branca ou erro:**
- Pressione F12 no navegador para abrir as DevTools
- Clique na aba **"Console"**
- Copie a mensagem de erro em vermelho e me envie

**Se aparecer "This site can't be reached":**
- O servidor não está rodando. Volte ao PowerShell e rode `npm run dev`

---

## Etapa 6: Teste de validação

### 6.1 Criar uma conta de teste

1. Na tela de login (http://localhost:3000/login), clique em **"Criar conta"**
2. Preencha:
   - **Nome:** `Claudio Teste`
   - **Email:** use um email real que você acesse
   - **Senha:** pelo menos 12 caracteres (ex: `MinhaSenh@2026!`)
3. Clique **"Criar conta"**

**O que esperar:**
- Redirecionamento para `/onboarding`
- Mensagem "Bem-vindo ao Oniefy"

4. Clique **"Ir para o Dashboard (provisório)"**

**O que esperar no dashboard:**
- 4 cards:
  - Saldo Atual: R$ 0,00
  - Saldo Previsto: R$ 0,00
  - Contas Ativas: 0
  - Fase Atual: Fase 0

**Se chegou até aqui: a Fase 0 está concluída!**

---

## Resumo: como voltar a rodar o projeto no futuro

Sempre que quiser abrir o Oniefy de novo:

```powershell
# 1. Abra o PowerShell (Win + R > powershell > Enter)

# 2. Navegue até a pasta do projeto:
cd C:\Projetos\WealthOS

# 3. (Opcional) Puxe atualizações do GitHub:
git pull origin main

# 4. Rode o servidor:
npm run dev

# 5. Abra http://localhost:3000 no navegador
```

Para parar: Ctrl+C no PowerShell.

---

## Checklist final

Marque cada item quando concluir:

- [ ] Git, Node.js e npm instalados e funcionando
- [ ] Repositório clonado em `C:\Projetos\WealthOS` (NÃO no Google Drive/OneDrive)
- [ ] service_role key copiada do dashboard Supabase
- [ ] `.env.local` criado em `C:\Projetos\WealthOS\.env.local` com as chaves
- [ ] `npm install` executado sem erros
- [ ] `npm run dev` mostrando "Ready" + "Environments: .env.local"
- [ ] Tela de login visível em http://localhost:3000/login
- [ ] Conta de teste criada e dashboard acessível
- [ ] (Opcional) Google OAuth configurado e testado

Quando os 8 primeiros itens estiverem marcados, me envie uma mensagem confirmando.
A partir daí, a Fase 0 está fechada e entramos na Fase 1 (Auth + Segurança).

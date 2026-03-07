# WealthOS - Guia de Setup Local (Fase 0)

**Data:** 07 de março de 2026
**Pré-requisito:** repo clonado em https://github.com/drovsk-cmf/WealthOS

---

## Etapa 1: Obter a service_role key do Supabase

A `service_role` key é a chave administrativa que contorna o RLS (Row Level Security).
Ela é usada apenas no lado servidor (API routes do Next.js). **Nunca deve aparecer no frontend.**

**Passo a passo:**

1. Abra o navegador e acesse: https://supabase.com/dashboard/project/hmwdfcsxtmbzlslxgqus/settings/api
   - Se pedir login, entre com suas credenciais do Supabase
2. Na página "API Settings", localize a seção **"Project API keys"**
3. Você verá duas chaves:
   - **anon (public):** já temos essa (começa com `eyJhbG...`). É a chave pública.
   - **service_role (secret):** essa é a que precisamos. Clique no ícone de olho (👁) para revelar o valor.
4. Clique no ícone de copiar (📋) ao lado da service_role key
5. Guarde esse valor. Você usará na Etapa 3.

> **IMPORTANTE:** Esta chave tem acesso total ao banco, ignorando todas as políticas RLS. Nunca a commite no Git, nunca a exponha no frontend.

---

## Etapa 2: Configurar Auth Providers (Google e Apple)

Os Auth Providers permitem login social ("Continuar com Google", "Continuar com Apple").
São opcionais para o primeiro teste, mas obrigatórios para o app em produção.

### 2A. Configurar Google OAuth

**Primeiro, crie as credenciais no Google Cloud Console:**

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Se não tiver um projeto Google Cloud, crie um:
   - Clique em "Select a project" (topo da página) > "New Project"
   - Nome: `WealthOS` > clique "Create"
3. Com o projeto selecionado, clique em **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
4. Se aparecer "Configure consent screen first":
   a. Clique em "Configure consent screen"
   b. Selecione **"External"** > clique "Create"
   c. Preencha:
      - App name: `WealthOS`
      - User support email: seu email
      - Developer contact: seu email
   d. Clique "Save and Continue" nas telas seguintes (Scopes, Test Users)
   e. Clique "Back to Dashboard"
   f. Volte para: https://console.cloud.google.com/apis/credentials
   g. Clique novamente em **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
5. Selecione Application type: **"Web application"**
6. Nome: `WealthOS Supabase`
7. Em **"Authorized redirect URIs"**, clique em **"+ ADD URI"** e adicione:
   ```
   https://hmwdfcsxtmbzlslxgqus.supabase.co/auth/v1/callback
   ```
8. Clique **"CREATE"**
9. Copie o **Client ID** e o **Client Secret** que aparecem no modal

**Agora, configure no Supabase:**

10. Acesse: https://supabase.com/dashboard/project/hmwdfcsxtmbzlslxgqus/auth/providers
11. Localize **"Google"** na lista de providers e clique para expandir
12. Ative o toggle **"Enable Sign in with Google"**
13. Cole o **Client ID** no campo "Client ID (for oauth)"
14. Cole o **Client Secret** no campo "Client Secret (for oauth)"
15. Clique **"Save"**

### 2B. Configurar Apple Sign-In

**Primeiro, crie as credenciais na Apple Developer:**

> Requer Apple Developer Program (US$ 99/ano). Se não tiver, pule esta etapa e use apenas Google + email/senha por enquanto.

1. Acesse: https://developer.apple.com/account/resources/identifiers/list/serviceId
2. Clique no botão **"+"** para criar um novo identifier
3. Selecione **"Services IDs"** > clique "Continue"
4. Preencha:
   - Description: `WealthOS Login`
   - Identifier: `com.wealthos.app.signin` (precisa ser único)
5. Clique "Register"
6. Agora clique no Service ID que acabou de criar
7. Marque **"Sign In with Apple"** > clique "Configure"
8. Em **"Domains and Subdomains"**, adicione:
   ```
   hmwdfcsxtmbzlslxgqus.supabase.co
   ```
9. Em **"Return URLs"**, adicione:
   ```
   https://hmwdfcsxtmbzlslxgqus.supabase.co/auth/v1/callback
   ```
10. Clique "Done" > "Continue" > "Save"

**Gere a chave privada:**

11. Acesse: https://developer.apple.com/account/resources/authkeys/list
12. Clique **"+"** > marque **"Sign in with Apple"** > clique "Configure"
13. Selecione seu App ID principal > clique "Save" > "Continue" > "Register"
14. **Baixe a chave .p8** (só pode baixar uma vez!)
15. Anote o **Key ID** exibido na tela
16. Seu **Team ID** está em: https://developer.apple.com/account (canto superior direito, formato: "XXXXXXXXXX")

**Agora, configure no Supabase:**

17. Acesse: https://supabase.com/dashboard/project/hmwdfcsxtmbzlslxgqus/auth/providers
18. Localize **"Apple"** na lista e clique para expandir
19. Ative o toggle **"Enable Sign in with Apple"**
20. Preencha:
    - **Client ID:** `com.wealthos.app.signin` (o Service ID que criou)
    - **Secret Key:** abra o arquivo .p8 num editor de texto, copie TODO o conteúdo (incluindo as linhas BEGIN/END PRIVATE KEY) e cole aqui
    - **Key ID:** o Key ID anotado no passo 15
    - **Team ID:** o Team ID do passo 16
21. Clique **"Save"**

---

## Etapa 3: Criar o arquivo .env.local

O `.env.local` contém as variáveis de ambiente que o Next.js usa localmente. Este arquivo nunca deve ser commitado no Git (já está no `.gitignore`).

**Passo a passo:**

1. Abra o terminal e navegue até a raiz do projeto:
   ```bash
   cd /caminho/para/WealthOS
   ```

2. Crie o arquivo `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

3. Abra o `.env.local` no seu editor de texto preferido:
   ```bash
   # VS Code:
   code .env.local

   # Nano:
   nano .env.local

   # Vim:
   vim .env.local
   ```

4. Substitua o conteúdo pelo seguinte (valores reais do seu projeto):

   ```bash
   # ============================================
   # WealthOS - Environment Variables
   # ============================================

   # --- Supabase ---
   NEXT_PUBLIC_SUPABASE_URL=https://hmwdfcsxtmbzlslxgqus.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtd2RmY3N4dG1iemxzbHhncXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzUzMDUsImV4cCI6MjA4Nzk1MTMwNX0.iPnPfcKziaFzLjeNKkCo5px0NyuaeHToOoVyvWcicSE

   # ATENCAO: cole aqui a service_role key obtida na Etapa 1
   SUPABASE_SERVICE_ROLE_KEY=COLE_A_SERVICE_ROLE_KEY_AQUI

   # --- Supabase Project ID (para geracao de tipos) ---
   SUPABASE_PROJECT_ID=hmwdfcsxtmbzlslxgqus

   # --- App ---
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # --- Apple Push Notifications (APNs) ---
   # Preencha apenas quando for testar push notifications no iOS
   # APNS_KEY_ID=
   # APNS_TEAM_ID=
   # APNS_BUNDLE_ID=com.wealthos.app
   # APNS_PRIVATE_KEY=
   ```

5. Substitua `COLE_A_SERVICE_ROLE_KEY_AQUI` pela chave copiada na Etapa 1
6. Salve o arquivo

**Verificação:**
```bash
# Confirme que o arquivo existe e tem conteúdo:
cat .env.local | head -5

# Confirme que NÃO está sendo rastreado pelo Git:
git status
# Não deve aparecer .env.local na lista de alterações
```

---

## Etapa 4: Instalar dependências e rodar o projeto

**Pré-requisitos de software:**

Antes de continuar, verifique se tem as ferramentas necessárias instaladas.

```bash
# Verificar Node.js (necessário: v18 ou superior)
node --version
# Esperado: v18.x.x, v20.x.x ou v22.x.x

# Se não tiver Node.js, instale via:
# macOS: brew install node
# Ou baixe em: https://nodejs.org (versão LTS recomendada)

# Verificar npm
npm --version
# Esperado: 9.x.x ou superior

# Verificar Git
git --version
```

**Passo a passo:**

1. Atualize o repositório local (puxar os commits que fizemos hoje):
   ```bash
   cd /caminho/para/WealthOS
   git pull origin main
   ```

   Esperado: deve mostrar os arquivos novos (src/, supabase/, docs/, etc.)

2. Instale as dependências:
   ```bash
   npm install
   ```

   Esperado: processo leva 30-60 segundos. Deve terminar sem erros. Warnings são normais.

   Se der erro de permissão:
   ```bash
   sudo npm install    # macOS/Linux
   ```

3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

   Esperado:
   ```
   ▲ Next.js 14.2.14
   - Local:        http://localhost:3000
   - Environments: .env.local

   ✓ Ready in Xs
   ```

4. Abra o navegador e acesse: http://localhost:3000

   Esperado: você será redirecionado para http://localhost:3000/login e verá a tela de login do WealthOS com:
   - Botão "Continuar com Google"
   - Botão "Continuar com Apple"
   - Formulário de email/senha
   - Link "Criar conta"

---

## Etapa 5: Teste de validação

Faça um teste rápido para confirmar que tudo funciona:

1. Na tela de login (http://localhost:3000/login), clique em **"Criar conta"**
2. Preencha:
   - Nome: qualquer nome
   - Email: um email real que você acesse
   - Senha: pelo menos 12 caracteres (ex: `MinhaSenh@2026`)
3. Clique **"Criar conta"**
4. Se o email confirmation estiver desligado (padrão do dev), você será redirecionado para `/onboarding`
5. Clique "Ir para o Dashboard (provisório)"
6. Deve ver o dashboard com 4 cards (Saldo Atual, Saldo Previsto, Contas Ativas, Fase Atual)

**Se der erro:**
- "Invalid API key": verifique o `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env.local`
- "Fetch failed" ou "Network error": verifique o `NEXT_PUBLIC_SUPABASE_URL` no `.env.local`
- Tela branca: abra o console do navegador (F12 > Console) e me envie o erro

---

## Etapa 6 (opcional): Testar login com Google

Se você configurou o Google OAuth na Etapa 2A:

1. Acesse http://localhost:3000/login
2. Clique "Continuar com Google"
3. Selecione sua conta Google
4. Deve redirecionar para o dashboard

Se der erro "redirect_uri_mismatch":
- Volte ao Google Cloud Console > Credentials > seu OAuth Client
- Confirme que a redirect URI é exatamente:
  `https://hmwdfcsxtmbzlslxgqus.supabase.co/auth/v1/callback`
- Pode levar até 5 minutos para o Google propagar a mudança

---

## Checklist final

Marque cada item quando concluir:

- [ ] service_role key copiada do dashboard Supabase
- [ ] Google OAuth configurado (ou adiado para depois)
- [ ] Apple Sign-In configurado (ou adiado - requer Apple Developer Program)
- [ ] `.env.local` criado com todas as variáveis preenchidas
- [ ] `npm install` executado sem erros
- [ ] `npm run dev` rodando em localhost:3000
- [ ] Tela de login visível no navegador
- [ ] Conta de teste criada e dashboard acessível

Quando todos os itens estiverem marcados, a Fase 0 está concluída e podemos avançar para a Fase 1 (Auth + Segurança).

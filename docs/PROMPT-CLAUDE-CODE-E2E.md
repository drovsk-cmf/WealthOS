# Oniefy - Prompt para Claude Code: Testes E2E com Playwright

## Contexto

Você está trabalhando no Oniefy (repo `C:\Users\claud\Documents\PC_WealthOS`), um app de gestão patrimonial pessoal. Stack: Next.js 15 / React 19 / Supabase / TypeScript. O dev server roda em `http://localhost:3000` via `npm run dev`.

**O que já existe:**
- 208 testes unitários Jest (15 suítes, passando no CI)
- Suíte SQL de RLS isolation (50+ assertions, rodada via Supabase)
- Zero testes E2E

**Objetivo desta sessão:** Instalar Playwright, configurar, e implementar testes E2E focados em **segurança** e **UX**. Os testes devem ser executáveis localmente e integráveis ao CI futuramente.

## Passo 1: Setup

```bash
npm init playwright@latest
# Quando perguntar:
#   TypeScript? Yes
#   Test directory? e2e/
#   GitHub Actions? No (CI já existe, adicionaremos depois)
#   Install browsers? Yes (só Chromium é suficiente por enquanto)
```

Crie `playwright.config.ts` na raiz com:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // sequencial (compartilha estado de auth)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
```

Adicione ao `package.json`:
```json
"scripts": {
  "test:e2e": "npx playwright test",
  "test:e2e:ui": "npx playwright test --ui"
}
```

Adicione ao `.gitignore`:
```
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
```

## Passo 2: Credenciais de teste

O app usa Supabase Auth. Crie um arquivo `e2e/auth.setup.ts` que faz login via API route e salva o estado de autenticação:

```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  // Navega para login
  await page.goto("/login");
  
  // Preenche credenciais de teste
  // IMPORTANTE: Use as credenciais do .env.local ou crie um usuário de teste
  // O usuário de teste atual é Google OAuth (fab01037-...) sem senha.
  // Para E2E, é mais prático criar um usuário email/senha no Supabase Dashboard:
  //   Email: e2e-test@oniefy.com
  //   Senha: E2eTest!Secure2026
  //   Confirmar email manualmente no Dashboard
  //   Completar onboarding manualmente uma vez
  
  await page.fill("#email", "e2e-test@oniefy.com");
  await page.fill("#password", "E2eTest!Secure2026");
  await page.click('button[type="submit"]');
  
  // Aguarda redirect para dashboard ou MFA
  await page.waitForURL(/\/(dashboard|mfa-challenge|onboarding)/, { timeout: 15000 });
  
  // Se caiu no MFA, o teste precisa de TOTP. Por enquanto, skip MFA no user de teste.
  // Se caiu no onboarding, completar (ou usar usuário com onboarding já feito).
  
  // Salva estado de autenticação
  await page.context().storageState({ path: AUTH_FILE });
});
```

No `playwright.config.ts`, adicione o setup project:
```typescript
projects: [
  { name: "setup", testMatch: /.*\.setup\.ts/ },
  {
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      storageState: "e2e/.auth/user.json",
    },
    dependencies: ["setup"],
  },
],
```

## Passo 3: Testes prioritários

Implemente na ordem abaixo. Cada cenário tem o que testar e quais seletores usar.

### 3.1 Segurança: Proteção de rotas (e2e/security/route-protection.spec.ts)

```
Cenários:
- Acessar /dashboard sem login → redirect para /login?redirectTo=/dashboard
- Acessar /settings sem login → redirect para /login
- Acessar /transactions sem login → redirect para /login
- Acessar /api/auth/callback sem parâmetros → redirect para /login (não crash)
- Acessar /privacy sem login → renderiza (é pública)
- Após login, redirect automático para redirectTo original

Seletores:
- Login page: h1 ou heading com "Entrar" ou "Login"
- Dashboard: heading "Início" (não "Dashboard", foi renomeado)
```

### 3.2 Segurança: Login com erros (e2e/security/login-errors.spec.ts)

```
Cenários:
- Email vazio + submit → validação HTML5 ou mensagem de erro
- Senha vazia + submit → validação HTML5 ou mensagem de erro  
- Credenciais erradas → mensagem "Email ou senha incorretos." (PT-BR, genérica)
- Mensagem NÃO contém "Invalid login credentials" (Supabase leak)
- Após 5 tentativas erradas → mensagem de rate limit ("Muitas tentativas")
- Campo de senha é type="password" (não text)

Seletores:
- Email input: #email ou input[type="email"]
- Password input: #password ou input[type="password"]
- Submit: button[type="submit"]
- Mensagem de erro: role="alert" ou classe text-terracotta
```

### 3.3 UX: Navegação 5+1 (e2e/ux/navigation.spec.ts)

```
Cenários (autenticado):
- Sidebar tem exatamente 6 itens visíveis: Início, Transações, Orçamento, Patrimônio, Fiscal, Settings
- Clicar "Início" → /dashboard
- Clicar "Transações" → /transactions
- Clicar Settings (ícone engrenagem) → /settings
- Settings page tem 5 subcategorias: Pessoal, Estrutura e Cadastros, Dados e Importação, Avançado, Segurança
- Clicar "Segurança" dentro de Settings → /settings/security
- Mobile (viewport 390px): hamburger abre sidebar, click fora fecha
- Skip-to-content link existe e funciona (Tab → Enter → foco no main)

Seletores:
- Sidebar nav: aria-label="Menu de navegação" ou nav element
- Nav items: links dentro do nav
- Settings icon: href="/settings"
- Skip link: a[href="#main-content"]
- Main content: #main-content
```

### 3.4 UX: Transação rápida (e2e/ux/quick-transaction.spec.ts)

```
Cenários (autenticado, requer pelo menos 1 conta bancária):
- Botão "+ Nova transação" visível na página /transactions
- Click abre formulário (modal/slide)
- Campo valor (#tx-amount) tem autofocus e placeholder "0,00"
- Digitar "150,50" → valor aceito (formato BR com vírgula)
- Toggle tipo: padrão é "Despesa", click alterna para "Receita"
- "Mais opções" expande campos adicionais (descrição, categoria, data)
- Submit com valor + conta → transação criada, toast de sucesso
- ESC fecha o formulário sem salvar

Seletores:
- Novo tx button: texto "+ Nova transação"
- Amount: #tx-amount
- Type toggle: role="radiogroup" com aria-label="Tipo de transação"
- Account: #tx-account
- Description: #tx-desc
- Category: #tx-category
- More options: texto "Mais opções"
- Submit: texto "Lançar despesa" ou "Lançar receita"
```

### 3.5 UX: Estados vazios (e2e/ux/empty-states.spec.ts)

```
Cenários (autenticado, conta limpa ou novo usuário):
- /transactions sem dados → mensagem motivacional + CTA "Nova transação" + CTA "Importar extrato"
- /accounts sem dados → mensagem motivacional + CTA
- /budgets sem dados → mensagem motivacional + CTA
- /assets sem dados → mensagem motivacional + CTA
- Nenhum estado vazio mostra "Nenhum resultado" ou "No data" (em inglês)

Seletores:
- Empty state container: procurar por texto "Comece" ou "primeira" ou CTA buttons
- CTAs: buttons ou links com texto de ação
```

### 3.6 A11y: Focus trap nos modais (e2e/a11y/focus-trap.spec.ts)

```
Cenários (autenticado):
- Abrir formulário de transação → Tab circula dentro do modal (não escapa para trás)
- Abrir formulário de conta → Tab circula dentro do modal
- Abrir formulário de categoria → Tab circula dentro do modal
- Em cada modal: Shift+Tab volta para o último elemento focável
- Em cada modal: foco inicial está no primeiro input

Approach:
- Abrir modal
- Contar quantos elementos focáveis existem (Tab N vezes)
- Verificar que Tab N+1 volta ao primeiro
- Verificar que o foco nunca vai para um elemento fora do modal
```

### 3.7 UX: Privacy mode (e2e/ux/privacy-mode.spec.ts)

```
Cenários (autenticado):
- Toggle de privacidade (ícone olho) visível no header/layout
- Click no toggle → valores monetários ficam ocultos (substituídos por •••)
- Click novamente → valores visíveis
- Privacy mode persiste durante navegação entre páginas
- Em /dashboard: cards de resumo mostram ••• quando privacy ativo

Seletores:
- Toggle: button com aria-label contendo "privacidade" ou ícone Eye/EyeOff
- Valores mascarados: componente <Mv> renderiza •••••• quando ativo
```

### 3.8 UX: Onboarding (e2e/ux/onboarding.spec.ts)

```
Cenários (requer novo usuário ou reset de onboarding):
- Após primeiro login → redirect para /onboarding
- Progresso visual (barra) avança a cada step
- Step "Moeda": seleção de BRL/USD/EUR
- Step "Segurança": exibe status de criptografia
- Step 8 "Rota recomendada": card dominante + 2 alternativas
  - Desktop: "Importar extrato" é o card dominante
  - Mobile (viewport 390px): "Lançamento rápido" é o card dominante
- Step 10 "Celebração": resumo + CTA "Ir para o Início"
- Após celebração → redirect para /dashboard

NOTA: Este teste é complexo porque precisa de um usuário novo.
Opção prática: testar apenas os steps 8-10 manipulando sessionStorage.
```

## Passo 4: Executar

```bash
# Garantir que dev server está rodando (Playwright faz isso automaticamente via webServer config)
npm run test:e2e

# Para debug visual:
npm run test:e2e:ui

# Para um teste específico:
npx playwright test e2e/security/route-protection.spec.ts
```

## Regras de implementação

1. **Seletores resilientes:** Prefira `getByRole`, `getByText`, `getByLabel` sobre seletores CSS. Use `#id` apenas quando existir no HTML.

2. **Idioma PT-BR:** Todos os textos de asserção em português. O app é 100% PT-BR.

3. **Timeouts:** O Supabase pode ser lento no free tier. Use `timeout: 10000` para operações de rede.

4. **Isolamento:** Cada spec deve limpar o que criou. Se criou uma transação, delete-a no `afterEach`. Alternativa: usar um usuário de teste dedicado que pode ser resetado.

5. **Sem dados de teste no banco de produção:** Se precisar de dados, use as RPCs existentes via `page.evaluate` ou crie via API routes.

6. **Assertions negativas para segurança:** Sempre verificar o que NÃO deve aparecer (ex: error messages em inglês, stack traces, emails de outros usuários).

7. **Mobile viewport:** Para testes responsivos, use `page.setViewportSize({ width: 390, height: 844 })`.

8. **Screenshots on failure:** Já configurado no playwright.config.ts. Não adicionar screenshots manuais.

## Pré-requisitos no ambiente

1. `.env.local` configurado com Supabase URL + keys
2. Usuário de teste E2E criado no Supabase (email/senha, sem MFA, onboarding completo)
3. Node 20+, npm
4. Dev server funcional (`npm run dev` sem erros)

## Entrega esperada

- Diretório `e2e/` com os 8 arquivos de spec
- `playwright.config.ts` na raiz
- `e2e/auth.setup.ts` para autenticação persistente
- Todos os testes passando localmente
- Commit com mensagem: `test(e2e): Playwright setup + 8 spec files (security, UX, a11y)`

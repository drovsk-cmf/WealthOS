# Guia de Execução: Auditoria UX Completa (PowerShell no Windows)

## Pré-requisitos

Antes de começar, confirme que você tem instalado:

- **Node.js** (v18 ou superior): `node --version`
- **Git**: `git --version`
- **PowerShell**: já vem com Windows 10/11

---

## Passo 1: Abrir o PowerShell na pasta do projeto

Abra o PowerShell (não o CMD) e navegue até a pasta do WealthOS:

```powershell
cd C:\Users\SEU_USUARIO\caminho\para\WealthOS
```

Se você não sabe onde está, procure a pasta onde fez o `git clone`. Exemplo:

```powershell
cd C:\projetos\WealthOS
```

Confirme que está na pasta certa:

```powershell
ls package.json
```

Deve aparecer o arquivo `package.json`. Se não aparecer, você está na pasta errada.

---

## Passo 2: Puxar as últimas alterações do repositório

```powershell
git pull origin main
```

Isso vai baixar os 8 arquivos de teste de auditoria que eu criei (na pasta `e2e/audit/`).

Confirme que os arquivos chegaram:

```powershell
ls e2e\audit\
```

Deve listar 8 arquivos `.spec.ts`:

```
accessibility.spec.ts
ai-ux.spec.ts
all-pages-crawl.spec.ts
forms-and-interactions.spec.ts
mobile-responsive.spec.ts
observability.spec.ts
performance.spec.ts
security-trust.spec.ts
```

---

## Passo 3: Instalar dependências

### 3a. Instalar pacotes do Node.js

```powershell
npm install
```

Espere terminar (~1 minuto). Vai aparecer algo como "added X packages".

### 3b. Instalar o Chromium do Playwright

```powershell
npx playwright install chromium
```

Isso baixa o Chromium embutido (~150MB). Só precisa rodar uma vez.
Vai aparecer "Downloading Chromium" e depois "Chromium downloaded".

### 3c. Instalar a dependência de acessibilidade (axe-core)

```powershell
npm install @axe-core/playwright --save-dev
```

---

## Passo 4: Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto (se não existir):

```powershell
# Verificar se já existe
Test-Path .env.local

# Se retornar False, criar:
@"
NEXT_PUBLIC_ONIEFY_DB_URL=https://mngjbrbxapazdddzgoje.supabase.co
NEXT_PUBLIC_ONIEFY_DB_KEY=sb_publishable_b6d1j_F69fr4zzJiVdcJFQ_gA6zLTXN
ONIEFY_DB_SECRET=seu_service_role_key_aqui
"@ | Out-File -FilePath .env.local -Encoding utf8
```

**Nota:** O `ONIEFY_DB_SECRET` é necessário apenas para rodar o dev server local.
Se você for testar contra produção (próximo passo), pode pular este passo.

---

## Passo 5: Executar a auditoria

Você tem duas opções: testar contra **produção** (mais rápido, sem precisar do dev server) ou contra **localhost** (precisa subir o servidor).

### Opção A: Testar contra produção (recomendado para primeira vez)

```powershell
$env:PLAYWRIGHT_BASE_URL = "https://www.oniefy.com"
npx playwright test e2e/audit/
```

### Opção B: Testar contra localhost

Abra **dois terminais PowerShell**:

**Terminal 1** (dev server):

```powershell
cd C:\caminho\para\WealthOS
npm run dev
```

Espere aparecer "Ready on http://localhost:3000". Não feche este terminal.

**Terminal 2** (testes):

```powershell
cd C:\caminho\para\WealthOS
npx playwright test e2e/audit/
```

---

## Passo 6: Interpretar os resultados

### 6a. Ver o resultado no terminal

O Playwright mostra o resultado de cada teste diretamente no terminal:

```
  ✓ Dashboard (Início) (/dashboard) (2.3s)
  ✓ Transações (/transactions) (1.8s)
  ✗ Metas (/goals) - timeout
```

- `✓` = teste passou
- `✗` = teste falhou (o Playwright mostra o motivo logo abaixo)

### 6b. Ver o relatório HTML (com screenshots)

Após rodar os testes, execute:

```powershell
npx playwright show-report
```

Isso abre no browser um relatório interativo com:
- Lista de todos os testes (verde = ok, vermelho = falhou)
- Screenshots de cada página (desktop + mobile)
- Detalhes de cada falha
- Tempo de execução

### 6c. Ver os screenshots gerados

Os screenshots ficam em:

```powershell
ls e2e\audit\screenshots\desktop\
ls e2e\audit\screenshots\mobile\
```

Cada arquivo é nomeado pela rota: `_dashboard.png`, `_transactions.png`, etc.

---

## Passo 7: Executar testes individuais

Se quiser rodar apenas uma parte da auditoria:

```powershell
# Apenas varredura de todas as páginas (screenshots + erros)
npx playwright test e2e/audit/all-pages-crawl.spec.ts

# Apenas acessibilidade (WCAG AA)
npx playwright test e2e/audit/accessibility.spec.ts

# Apenas formulários e interações (CRUD)
npx playwright test e2e/audit/forms-and-interactions.spec.ts

# Apenas mobile e responsividade
npx playwright test e2e/audit/mobile-responsive.spec.ts

# Apenas performance e resiliência
npx playwright test e2e/audit/performance.spec.ts

# Apenas UX de IA
npx playwright test e2e/audit/ai-ux.spec.ts

# Apenas segurança percebida
npx playwright test e2e/audit/security-trust.spec.ts

# Apenas observabilidade e analytics
npx playwright test e2e/audit/observability.spec.ts
```

---

## Passo 8: Usar o Claude Code para análise e correção

Se quiser que o Claude Code analise os resultados e corrija automaticamente:

### 8a. Instalar o Claude Code (se ainda não tem)

```powershell
npm install -g @anthropic-ai/claude-code
```

### 8b. Abrir o Claude Code na pasta do projeto

```powershell
cd C:\caminho\para\WealthOS
claude
```

### 8c. Dar o prompt de auditoria completa

Copie e cole este prompt dentro do Claude Code:

```
Rode a suite de auditoria UX completa do Oniefy.

Passo 1: Execute npx playwright test e2e/audit/ e colete todos os resultados.

Passo 2: Para cada teste que falhou:
  - Investigue a causa raiz no código
  - Proponha e implemente a correção
  - Rode o teste novamente para confirmar

Passo 3: Gere um relatório final com:
  - Total de testes executados e resultado
  - Bugs encontrados com severidade
  - Correções implementadas
  - Achados de UX que precisam de decisão humana

Passo 4: Commit e push das correções.

Contexto: use PLAYWRIGHT_BASE_URL=https://www.oniefy.com para
testar contra produção. O usuário de teste é e2e-test@oniefy.com.
O HANDOVER e as instruções de projeto estão na raiz do repo.
```

O Claude Code vai executar os testes, ler os resultados, abrir os arquivos com problemas, corrigir, e rodar de novo até tudo passar.

---

## Solução de problemas comuns

### "npx: command not found"

O Node.js não está no PATH. Reinstale o Node.js de https://nodejs.org e marque a opção "Add to PATH" durante a instalação.

### "Chromium download failed"

Execute com flag de instalação forçada:

```powershell
npx playwright install --force chromium
```

Se persistir, pode ser firewall corporativo. Tente:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "0"
npx playwright install chromium
```

### "ERR_CONNECTION_REFUSED (localhost:3000)"

O dev server não está rodando. Abra outro terminal e execute `npm run dev`.

### "Timeout waiting for navigation"

A rede está lenta ou o Supabase está respondendo devagar. Aumente o timeout:

```powershell
npx playwright test e2e/audit/ --timeout=60000
```

### "Cannot find module @axe-core/playwright"

Execute novamente:

```powershell
npm install @axe-core/playwright --save-dev
```

### Os testes passam mas não geram screenshots

Verifique se a pasta existe:

```powershell
New-Item -ItemType Directory -Force -Path "e2e\audit\screenshots\desktop"
New-Item -ItemType Directory -Force -Path "e2e\audit\screenshots\mobile"
New-Item -ItemType Directory -Force -Path "e2e\audit\screenshots\mobile-detail"
```

---

## Resumo dos comandos (referência rápida)

```powershell
# Setup (uma vez)
git pull origin main
npm install
npx playwright install chromium
npm install @axe-core/playwright --save-dev

# Rodar auditoria completa contra produção
$env:PLAYWRIGHT_BASE_URL = "https://www.oniefy.com"
npx playwright test e2e/audit/

# Ver relatório
npx playwright show-report

# Usar Claude Code para análise + correção
claude
# (colar o prompt do Passo 8c)
```

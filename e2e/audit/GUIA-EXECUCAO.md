# Guia de Execução: Auditoria UX Completa (PowerShell no Windows)

Caminho do projeto: `C:\Users\claud\Documents\PC_WealthOS`

---

## Passo 1: Abrir o PowerShell na pasta do projeto

Aperte `Win + X` no teclado e clique em **"Terminal"** (ou **"Windows PowerShell"**).

No terminal que abrir, cole e aperte Enter:

```powershell
cd C:\Users\claud\Documents\PC_WealthOS
```

Confirme que está na pasta certa:

```powershell
Test-Path package.json
```

Deve retornar `True`.

---

## Passo 2: Puxar as últimas alterações

```powershell
git pull origin main
```

Espere terminar. Depois confirme que os 8 arquivos de auditoria chegaram:

```powershell
Get-ChildItem e2e\audit\*.spec.ts | Select-Object Name
```

Deve listar:

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

Se não listar 8 arquivos, rode `git pull origin main` novamente.

---

## Passo 3: Instalar dependências

São 3 comandos. Execute **um de cada vez**, esperando cada um terminar antes de rodar o próximo.

**Comando 1:**

```powershell
npm install
```

Espere até aparecer "added X packages" ou "up to date".

**Comando 2:**

```powershell
npx playwright install chromium
```

Vai baixar ~150MB. Espere até aparecer "Chromium downloaded".

Se der erro de download, rode este comando alternativo:

```powershell
npx playwright install --force chromium
```

**Comando 3:**

```powershell
npm install @axe-core/playwright --save-dev
```

Espere até aparecer "added X packages".

---

## Passo 4: Criar pastas de screenshots

Cole os 3 comandos abaixo (pode colar todos de uma vez):

```powershell
New-Item -ItemType Directory -Force -Path "e2e\audit\screenshots\desktop"
New-Item -ItemType Directory -Force -Path "e2e\audit\screenshots\mobile"
New-Item -ItemType Directory -Force -Path "e2e\audit\screenshots\mobile-detail"
```

---

## Passo 5: Rodar a auditoria completa

Cole os 2 comandos abaixo (pode colar os dois de uma vez):

```powershell
$env:PLAYWRIGHT_BASE_URL = "https://www.oniefy.com"
npx playwright test e2e/audit/
```

### O que vai acontecer

O Playwright abre um Chromium invisível (headless), faz login automático com o usuário de teste, e executa todos os 8 arquivos de auditoria (~85 testes). Ele visita as 35 páginas, tira screenshots, roda acessibilidade, testa formulários, mede performance, e verifica segurança.

**Tempo estimado: 5 a 10 minutos.**

No terminal você vai ver o progresso:

```
Running 85 tests using 1 worker

  ✓ Dashboard (Início) (/dashboard) (2341ms)
  ✓ Transações (/transactions) (1823ms)
  ✗ Metas (/goals) (5012ms)
    → Expected "Metas tem heading" to be true
  ...

  52 passed
  3 failed
  85 total
```

`✓` = passou. `✗` = falhou (com o motivo embaixo).

**Espere os testes terminarem antes de fazer qualquer coisa no terminal.**

---

## Passo 6: Ver o relatório HTML

Depois que os testes terminarem, rode:

```powershell
npx playwright show-report
```

Isso abre no seu navegador um relatório interativo com:

- Todos os testes organizados por arquivo (verde = ok, vermelho = falhou)
- Para cada falha: screenshot do momento exato do erro
- Tempo de execução de cada teste
- Logs de console capturados

Para fechar o servidor do relatório: volte ao PowerShell e aperte `Ctrl+C`.

---

## Passo 7: Ver os screenshots

Os screenshots de todas as 35 páginas ficam em pastas dentro do projeto. Para abrir no Windows Explorer:

```powershell
explorer C:\Users\claud\Documents\PC_WealthOS\e2e\audit\screenshots\desktop
```

```powershell
explorer C:\Users\claud\Documents\PC_WealthOS\e2e\audit\screenshots\mobile
```

Cada arquivo é nomeado pela rota: `_dashboard.png`, `_transactions.png`, etc.

---

## Passo 8: Rodar testes individuais (opcional)

Se quiser rodar apenas uma parte da auditoria, primeiro defina a URL:

```powershell
$env:PLAYWRIGHT_BASE_URL = "https://www.oniefy.com"
```

Depois rode o teste específico:

```powershell
npx playwright test e2e/audit/all-pages-crawl.spec.ts
```

```powershell
npx playwright test e2e/audit/accessibility.spec.ts
```

```powershell
npx playwright test e2e/audit/forms-and-interactions.spec.ts
```

```powershell
npx playwright test e2e/audit/mobile-responsive.spec.ts
```

```powershell
npx playwright test e2e/audit/performance.spec.ts
```

```powershell
npx playwright test e2e/audit/ai-ux.spec.ts
```

```powershell
npx playwright test e2e/audit/security-trust.spec.ts
```

```powershell
npx playwright test e2e/audit/observability.spec.ts
```

---

## Passo 9: Usar o Claude Code para análise e correção (opcional)

Se quiser que o Claude Code analise os resultados e corrija automaticamente:

### 9a. Instalar o Claude Code (se não tiver)

```powershell
npm install -g @anthropic-ai/claude-code
```

### 9b. Abrir o Claude Code na pasta do projeto

```powershell
cd C:\Users\claud\Documents\PC_WealthOS
claude
```

### 9c. Colar este prompt dentro do Claude Code

```
Rode a suite de auditoria UX completa do Oniefy.

Passo 1: Execute os testes:
  $env:PLAYWRIGHT_BASE_URL = "https://www.oniefy.com"
  npx playwright test e2e/audit/

Passo 2: Para cada teste que falhou:
  - Investigue a causa raiz no código
  - Proponha e implemente a correção
  - Rode o teste novamente para confirmar que passou

Passo 3: Gere um relatório final com:
  - Total de testes executados e resultado (passou/falhou)
  - Bugs encontrados com severidade (crítica/alta/média/baixa)
  - Correções implementadas com diff
  - Achados de UX que precisam de decisão humana
  - Screenshots de problemas visuais

Passo 4: Commit e push das correções.

Contexto: o HANDOVER-WealthOS.md na raiz do repo tem todo o contexto
do projeto. O usuário de teste é e2e-test@oniefy.com / E2eTest!Secure2026.
```

---

## Problemas comuns

| Sintoma | Causa | Solução |
|---------|-------|---------|
| `npx: command not found` ou `npm: command not found` | Node.js não está no PATH | Instale de https://nodejs.org. Na instalação, marque "Add to PATH". Depois feche e abra o PowerShell |
| `Chromium download failed` | Firewall ou antivírus bloqueando | `$env:PLAYWRIGHT_BROWSERS_PATH = "0"; npx playwright install --force chromium` |
| `Cannot find module @axe-core/playwright` | Dependência não instalada | `npm install @axe-core/playwright --save-dev` |
| Testes falham com "Timeout" | Rede lenta | `npx playwright test e2e/audit/ --timeout=120000` |
| `ERR_CONNECTION_REFUSED localhost:3000` | Faltou definir URL de produção | `$env:PLAYWRIGHT_BASE_URL = "https://www.oniefy.com"` (rodar antes dos testes) |
| Screenshots não gerados | Pastas não existem | Rodar Passo 4 (criar pastas) |
| `git pull` dá conflito | Alterações locais não commitadas | `git stash; git pull origin main; git stash pop` |
| Login falha no teste | Usuário de teste não existe | Criar `e2e-test@oniefy.com` com senha `E2eTest!Secure2026` no Supabase Auth |
| Tela do PowerShell fecha sozinha | Erro de script | Abra PowerShell como Admin: `Win+X` → "Terminal (Admin)" |

---

## Resumo rápido: copie e cole tudo de uma vez

Abra o PowerShell, cole este bloco inteiro e aperte Enter:

```powershell
cd C:\Users\claud\Documents\PC_WealthOS
git pull origin main
npm install
npx playwright install chromium
npm install @axe-core/playwright --save-dev
New-Item -ItemType Directory -Force -Path "e2e\audit\screenshots\desktop"
New-Item -ItemType Directory -Force -Path "e2e\audit\screenshots\mobile"
New-Item -ItemType Directory -Force -Path "e2e\audit\screenshots\mobile-detail"
$env:PLAYWRIGHT_BASE_URL = "https://www.oniefy.com"
npx playwright test e2e/audit/
```

Depois que terminar, rode:

```powershell
npx playwright show-report
```

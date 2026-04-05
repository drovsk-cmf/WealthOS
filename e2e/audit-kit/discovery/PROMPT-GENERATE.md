# Prompt para gerar specs específicos do projeto

Use este prompt no Claude Code após rodar o discovery:

```
Leia o arquivo reports/inventory.json gerado pelo discovery crawl.
Para cada rota que tenha formulários, ações destrutivas, ou toggles,
gere um spec Playwright em specs/generated/ seguindo estas regras:

## Regras de geração

1. **Formulários com submit**: gerar teste que preenche todos os campos,
   submete, e verifica feedback (sucesso ou erro). Testar também
   submissão com campos obrigatórios vazios.

2. **Ações destrutivas** (excluir, remover, desativar): gerar teste que
   verifica se há confirmação antes de executar (modal, dialog, ou
   botão de confirmação). Nunca executar a ação de fato.

3. **Toggles**: gerar teste que verifica que o toggle muda de estado
   visualmente e que a mudança persiste após recarregar.

4. **Selects**: usar `page.selectOption()` com valor string (não regex).

5. **Naming**: arquivo nomeado como `{rota-sem-barra}.spec.ts`
   (ex: rota /accounts vira `accounts.spec.ts`).

6. **Import**: importar auditConfig de '../../audit.config'.

7. **Cleanup**: se o teste cria dados, não assumir que pode limpar.
   Usar nomes com prefixo "E2E-" para facilitar limpeza manual.

## Exemplo de spec gerado

```typescript
import { test, expect } from "@playwright/test";
import { auditConfig } from "../../audit.config";

test.describe("Formulários: /accounts", () => {
  test("Criar conta: campos obrigatórios validados", async ({ page }) => {
    await page.goto("/accounts", { waitUntil: "networkidle" });
    // ... testar validação
  });

  test("Excluir conta: pede confirmação", async ({ page }) => {
    await page.goto("/accounts", { waitUntil: "networkidle" });
    // ... verificar modal de confirmação sem executar
  });
});
```

Gere os specs e salve em specs/generated/. Não modifique nenhum
arquivo existente em specs/universal/.
```

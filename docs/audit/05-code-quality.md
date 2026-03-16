# Domínio 5 — Qualidade de Código

**Referência normativa:** Boas práticas de engenharia de software
**Data da auditoria:** 2026-03-16
**Arquivos analisados:** 125

---

## Achados

### [MÉDIO] D5.01 — Lógica de detecção de plataforma Capacitor duplicada

**Arquivo:** `src/lib/auth/use-biometric.ts` L30-45, `src/lib/auth/use-app-lifecycle.ts` L48-58
**Descrição:** Duas funções independentes (`detectPlatform` e `isNativePlatform`) implementam a mesma lógica de introspecção do objeto `window.Capacitor` para determinar a plataforma nativa. Ambas fazem cast de `window` para `Record<string, unknown>`, verificam `Capacitor.getPlatform` e chamam a função. A única diferença é o tipo de retorno (`Platform` enum vs. `boolean`).
**Impacto:** Manutenção divergente — uma correção ou adaptação na detecção do Capacitor precisa ser replicada em dois locais. Risco de comportamento inconsistente se apenas um for atualizado.
**Correção:** Extrair uma função utilitária única (ex.: `getCapacitorPlatform(): "ios" | "android" | "web"`) em um módulo compartilhado e derivar `isNativePlatform` e `detectPlatform` a partir dela.

---

### [MÉDIO] D5.02 — Formatação de moeda BRL duplicada

**Arquivo:** `src/lib/utils/index.ts` L18-23, `src/lib/email/weekly-digest-template.ts` L29-34
**Descrição:** A função `formatBRL` no template de e-mail é uma cópia exata da lógica de `formatCurrency` em `src/lib/utils/index.ts`. Ambas usam `new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)`.
**Impacto:** Se a formatação precisar mudar (ex.: adicionar símbolo customizado, tratar `NaN`), a alteração precisa ser feita em dois lugares. O template de e-mail roda em ambiente server-side (API route), onde `formatCurrency` do utils seria igualmente acessível.
**Correção:** Importar `formatCurrency` de `@/lib/utils` no template de e-mail e remover a função local `formatBRL`.

---

### [BAIXO] D5.03 — Formatação de mês reimplementada em três locais

**Arquivo:** `src/components/dashboard/balance-evolution-chart.tsx` L40-43, `src/app/(app)/indices/page.tsx` L35-38, `src/lib/hooks/use-budgets.ts` L84-87
**Descrição:** Três funções `formatMonth`/`formatMonthLabel` implementam variações da mesma lógica `toLocaleDateString("pt-BR", ...)` para formatar meses. As diferenças são mínimas (inclusão ou não do ano, formato `short` vs. `2-digit`).
**Impacto:** Baixo impacto funcional, mas cria atrito de manutenção e inconsistência visual entre páginas. Risco menor de divergência futura.
**Correção:** Criar uma função `formatMonth(dateStr, options?)` centralizada em `src/lib/utils/index.ts` com parâmetros opcionais para incluir ano e formato.

---

### [MÉDIO] D5.04 — Dependências Capacitor não utilizadas no código-fonte

**Arquivo:** `package.json` L23-26
**Descrição:** Quatro pacotes Capacitor estão declarados como dependências de produção, mas não são importados em nenhum arquivo dentro de `src/`:
- `@capacitor/haptics`
- `@capacitor/keyboard`
- `@capacitor/push-notifications`
- `@capacitor/status-bar`
**Impacto:** Aumenta o tamanho do `node_modules` e potencialmente do bundle (se o tree-shaking não eliminar completamente). Gera confusão sobre quais funcionalidades Capacitor estão realmente integradas. Embora possam ser planejadas para a Fase 10, dependências não utilizadas devem ser registradas como reservadas ou removidas.
**Correção:** Remover os pacotes do `package.json` até que sejam efetivamente integrados, ou documentar explicitamente que são reservados para a Fase 10.

---

### [BAIXO] D5.05 — `console.log` em caminho de produção (Service Worker)

**Arquivo:** `src/lib/hooks/use-online-status.ts` L62
**Descrição:** Um `console.log("[Oniefy] Service Worker atualizado.")` é executado dentro do handler `statechange` do Service Worker, sem condição de ambiente de desenvolvimento. Este código roda em produção sempre que o SW é atualizado.
**Impacto:** Poluição do console do usuário em produção. Impacto funcional nulo, mas é ruído para debugging.
**Correção:** Condicionar a `process.env.NODE_ENV === "development"` ou remover.

---

### [BAIXO] D5.06 — `console.warn` em stubs biométricos sem condição de ambiente

**Arquivo:** `src/lib/auth/use-biometric.ts` L73, L79, L84; `src/lib/auth/use-app-lifecycle.ts` L104, L167
**Descrição:** Cinco chamadas `console.warn` nos stubs de biometria são executadas incondicionalmente. Em ambiente web (onde biometria não se aplica), a maioria não é atingida porque os guards retornam antes. Porém, `attemptBiometricUnlock` (L167 de `use-app-lifecycle.ts`) emite warn mesmo em plataforma nativa quando o stub é chamado.
**Impacto:** Mensagens de warning poluem o console em builds nativos de desenvolvimento e potencialmente em produção quando o stub for conectado ao lifecycle.
**Correção:** Condicionar os warns a `process.env.NODE_ENV === "development"` ou usar um logger estruturado com níveis configuráveis.

---

### [BAIXO] D5.07 — `console.warn` em fallback de criptografia sem condição de ambiente

**Arquivo:** `src/lib/auth/encryption-manager.ts` L106, L113
**Descrição:** Dois `console.warn` emitidos quando `kek_material` ou DEK estão ausentes no perfil do usuário (cenário de migração). Estas mensagens são emitidas incondicionalmente em produção.
**Impacto:** Em produção, se um usuário migrar de schema antigo, os warns aparecerão no console do navegador. Informação potencialmente sensível (indica re-inicialização de criptografia) visível no DevTools.
**Correção:** Condicionar a `process.env.NODE_ENV === "development"` ou substituir por logger estruturado.

---

### [BAIXO] D5.08 — `console.error` incondicional em `logSchemaError`

**Arquivo:** `src/lib/schemas/rpc.ts` L347
**Descrição:** A função `logSchemaError` emite `console.error` com detalhes de mismatch de schema RPC sem verificar o ambiente. Esta função é chamada em hooks de produção quando a resposta do Supabase não bate com o schema Zod esperado.
**Impacto:** Em produção, erros de schema (que podem ocorrer por mudanças no banco) geram mensagens detalhadas no console do usuário, potencialmente expondo nomes de campos internos.
**Correção:** Condicionar a `process.env.NODE_ENV === "development"` ou enviar para serviço de monitoramento (Sentry, etc.) em vez de console.

---

### [BAIXO] D5.09 — Comentário TODO pendente para Fase 10

**Arquivo:** `src/lib/auth/use-app-lifecycle.ts` L159
**Descrição:** Comentário `// TODO Fase 10: install @capacitor-community/biometric-auth` indica funcionalidade planejada mas não implementada. O stub correspondente retorna `true` (bypass), o que significa que a verificação biométrica no retorno de foreground é efetivamente desabilitada.
**Impacto:** Nenhum impacto funcional imediato (já documentado como stub). Serve como lembrete de dívida técnica.
**Correção:** Manter rastreado no backlog de produto. Ao implementar a Fase 10, remover o TODO e o stub.

---

## Resumo do domínio

| ID | Severidade | Achado | Esforço |
|---|---|---|---|
| D5.01 | MÉDIO | Detecção de plataforma Capacitor duplicada em `use-biometric.ts` e `use-app-lifecycle.ts` | Baixo |
| D5.02 | MÉDIO | `formatBRL` duplica `formatCurrency` no template de e-mail | Baixo |
| D5.03 | BAIXO | Formatação de mês reimplementada em 3 locais | Baixo |
| D5.04 | MÉDIO | 4 pacotes Capacitor no `package.json` sem importação em `src/` | Baixo |
| D5.05 | BAIXO | `console.log` incondicional no handler de Service Worker | Baixo |
| D5.06 | BAIXO | `console.warn` incondicional em stubs biométricos | Baixo |
| D5.07 | BAIXO | `console.warn` incondicional em fallback de criptografia | Baixo |
| D5.08 | BAIXO | `console.error` incondicional em `logSchemaError` | Baixo |
| D5.09 | BAIXO | TODO pendente para integração biométrica (Fase 10) | N/A |

**Total:** 9 achados (0 críticos, 0 altos, 3 médios, 6 baixos)

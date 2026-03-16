# Domínio 8 — Acessibilidade

**Referência normativa:** WCAG 2.2 Nível AA
**Data da auditoria:** 2026-03-16
**Arquivos analisados:** 59 (27 componentes + 32 pages/layouts)

---

## Achados

### [ALTO] D8.01 — Dialogs customizados sem `role="dialog"`, `aria-modal` e focus trap
**Arquivo:** `src/components/accounts/account-form.tsx` L91, `src/components/budgets/budget-form.tsx` L119, `src/components/assets/asset-form.tsx` L122, `src/components/recurrences/recurrence-form.tsx` L151, `src/components/transactions/transaction-form.tsx` L173, `src/components/categories/category-form.tsx` L85
**Critério WCAG:** 4.1.2 Name, Role, Value; 2.4.3 Focus Order
**Descrição:** Todos os 6 formulários modais usam overlays `<div>` customizados sem `role="dialog"`, `aria-modal="true"` ou implementação de focus trap. Leitores de tela não identificam estes elementos como diálogos, e o foco do teclado pode escapar para elementos atrás do modal.
**Impacto:** Usuários de leitores de tela e teclado não conseguem interagir corretamente com formulários — foco não é contido, e a semântica de diálogo é invisível.
**Correção:** Adicionar `role="dialog"`, `aria-modal="true"` e `aria-labelledby` apontando para o título. Implementar focus trap (ex: `useFocusTrap` hook ou lib como `focus-trap-react`).

---

### [ALTO] D8.02 — Botão de logout sem `aria-label` (icon-only)
**Arquivo:** `src/app/(app)/layout.tsx` L145-151
**Critério WCAG:** 4.1.2 Name, Role, Value; 1.1.1 Non-text Content
**Descrição:** O botão de logout usa apenas o ícone `<LogOut>` com `title` mas sem `aria-label`. O atributo `title` não é consistentemente anunciado por leitores de tela.
**Impacto:** Usuários de leitores de tela não sabem a função do botão.
**Correção:** Adicionar `aria-label="Sair"` ao botão.

---

### [ALTO] D8.03 — Botão de filtro sem `aria-label` (icon-only)
**Arquivo:** `src/app/(app)/transactions/page.tsx` L136-147
**Critério WCAG:** 4.1.2 Name, Role, Value; 1.1.1 Non-text Content
**Descrição:** O botão de toggle de filtros na página de transações contém apenas ícone SVG sem `aria-label` ou texto acessível.
**Impacto:** Função do botão invisível para leitores de tela.
**Correção:** Adicionar `aria-label="Filtrar transações"` ou equivalente.

---

### [ALTO] D8.07 — Tabelas sem `scope` nos `<th>`
**Arquivo:** `src/app/(app)/indices/page.tsx` L343-346, `src/app/(app)/settings/analytics/page.tsx` L178-179, `src/app/(app)/tax/page.tsx` L325-328, `src/components/connections/import-step-mapping.tsx` L63
**Critério WCAG:** 1.3.1 Info and Relationships
**Descrição:** Todas as tabelas de dados no codebase usam `<th>` sem atributo `scope="col"` ou `scope="row"`. Zero ocorrências de `scope` em qualquer `<th>` do projeto.
**Impacto:** Leitores de tela não conseguem associar corretamente células de dados aos seus cabeçalhos em tabelas com múltiplas colunas.
**Correção:** Adicionar `scope="col"` a todos os `<th>` de cabeçalho de coluna.

---

### [ALTO] D8.10 — Informação financeira transmitida apenas por cor
**Arquivo:** `src/components/dashboard/summary-cards.tsx` L77,L90, `src/app/(app)/accounts/page.tsx` L93,L108, `src/app/(app)/cost-centers/page.tsx` L107-112, `src/components/dashboard/solvency-panel.tsx` L173-187
**Critério WCAG:** 1.4.1 Use of Color
**Descrição:** Receitas (verde/verdant) e despesas (vermelho/terracotta) são diferenciadas exclusivamente por cor em cards de resumo, saldos de contas e centros de custo. Não há ícone, prefixo (+/-) ou label adicional para distinguir as categorias sem percepção de cor.
**Impacto:** Usuários com daltonismo (protanopia/deuteranopia) não conseguem distinguir receitas de despesas nos principais indicadores financeiros.
**Correção:** Adicionar prefixo (+/-), ícone (↑/↓) ou label textual ("Receita"/"Despesa") além da cor.

---

### [MÉDIO] D8.04 — Labels sem `htmlFor` em BudgetForm
**Arquivo:** `src/components/budgets/budget-form.tsx` L138, L157, L176, L194
**Critério WCAG:** 1.3.1 Info and Relationships; 4.1.2 Name, Role, Value
**Descrição:** 4 elementos `<label>` sem atributo `htmlFor`, e os inputs correspondentes não têm `id`. A associação programática entre label e campo é inexistente.
**Impacto:** Click no label não foca o campo; leitores de tela não associam label ao input.
**Correção:** Adicionar `id` único aos inputs e `htmlFor` correspondente aos labels.

---

### [MÉDIO] D8.05 — Labels sem `htmlFor` em AssetForm
**Arquivo:** `src/components/assets/asset-form.tsx` L132, L140, L152, L159, L170, L176, L189, L195
**Critério WCAG:** 1.3.1 Info and Relationships; 4.1.2 Name, Role, Value
**Descrição:** 8 elementos `<label>` sem `htmlFor` no formulário de ativos. Mesmo padrão de D8.04.
**Impacto:** Mesma questão de D8.04 aplicada a mais campos.
**Correção:** Adicionar `id`/`htmlFor` a todos os pares label+input.

---

### [MÉDIO] D8.06 — Labels sem `htmlFor` em RecurrenceForm
**Arquivo:** `src/components/recurrences/recurrence-form.tsx` L182, L194, L208, L214, L224, L233, L249, L255, L264, L275
**Critério WCAG:** 1.3.1 Info and Relationships; 4.1.2 Name, Role, Value
**Descrição:** 10+ elementos `<label>` sem `htmlFor` no formulário de recorrências. Padrão sistêmico.
**Impacto:** Mesma questão de D8.04, maior escala.
**Correção:** Corrigir em batch — padrão afeta múltiplos formulários.

---

### [MÉDIO] D8.08 — `aria-required` ausente em campos obrigatórios
**Arquivo:** Todos os formulários em `src/components/`
**Critério WCAG:** 3.3.2 Labels or Instructions
**Descrição:** Zero ocorrências de `aria-required` em todo o codebase. Campos obrigatórios (nome da conta, valor do orçamento, etc.) não são marcados programaticamente como obrigatórios. Alguns usam `required` HTML, muitos não.
**Impacto:** Leitores de tela não informam que o campo é obrigatório antes do preenchimento.
**Correção:** Adicionar `aria-required="true"` a todos os campos obrigatórios.

---

### [MÉDIO] D8.09 — `aria-describedby` ausente em mensagens de erro
**Arquivo:** `src/app/(auth)/register/page.tsx` L157, L164, L179, L186 (e todos os demais formulários)
**Critério WCAG:** 3.3.1 Error Identification; 1.3.1 Info and Relationships
**Descrição:** Zero ocorrências de `aria-describedby` em todo o codebase. Mensagens de erro de validação são renderizadas adjacentes aos campos mas sem associação programática.
**Impacto:** Leitores de tela não anunciam mensagens de erro ao focar campos inválidos.
**Correção:** Adicionar `id` às mensagens de erro e `aria-describedby` correspondente nos inputs.

---

### [MÉDIO] D8.11 — Overlay do sidebar mobile sem acessibilidade
**Arquivo:** `src/app/(app)/layout.tsx` L100-105
**Critério WCAG:** 2.1.1 Keyboard; 4.1.2 Name, Role, Value
**Descrição:** O overlay `<div>` do sidebar mobile fecha ao click mas não tem `role="button"`, `aria-label`, `tabIndex` ou handler de teclado (Enter/Space).
**Impacto:** Usuários de teclado não conseguem fechar o sidebar mobile.
**Correção:** Adicionar `role="button"`, `aria-label="Fechar menu"`, `tabIndex={0}` e `onKeyDown` handler.

---

### [MÉDIO] D8.13 — Botões de seleção de cor sem `aria-label`
**Arquivo:** `src/components/accounts/account-form.tsx` L218-229, `src/components/categories/category-form.tsx` L144-153
**Critério WCAG:** 1.1.1 Non-text Content; 4.1.2 Name, Role, Value
**Descrição:** Botões do color picker têm apenas cor de fundo como identificador — sem texto, sem `aria-label`. Tamanho de 28px (h-7 w-7).
**Impacto:** Leitores de tela anunciam "button" sem contexto. Usuários não sabem qual cor estão selecionando.
**Correção:** Adicionar `aria-label` com nome da cor (ex: `aria-label="Azul"`).

---

### [MÉDIO] D8.15 — Radio customizado sem `role`, `fieldset` ou `legend`
**Arquivo:** `src/app/(app)/cost-centers/page.tsx` L384-399
**Critério WCAG:** 1.3.1 Info and Relationships; 4.1.2 Name, Role, Value
**Descrição:** Botões de seleção de tipo de centro de custo implementados como `<button>` sem `role="radio"`, sem `<fieldset>` agrupador e sem `<legend>`. Zero ocorrências de `<fieldset>` ou `<legend>` em todo o codebase.
**Impacto:** Leitores de tela não identificam o grupo de opções como radio, nem anunciam seleção atual.
**Correção:** Usar `role="radiogroup"` no container, `role="radio"` e `aria-checked` nos botões, ou usar elementos `<input type="radio">` nativos.

---

### [MÉDIO] D8.16 — Indicador de força de senha apenas por cor
**Arquivo:** `src/app/(auth)/register/page.tsx` L173-174
**Critério WCAG:** 1.4.1 Use of Color
**Descrição:** A barra de força de senha usa apenas cor (`strengthConfig.color`) e largura (`strengthConfig.width`). Há texto descritivo abaixo, mas a barra em si é puramente visual/cor.
**Impacto:** Menor — o texto descritivo compensa parcialmente. Mas a barra de progresso não é acessível por si só.
**Correção:** Adicionar `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` e `aria-label` à barra.

---

### [BAIXO] D8.12 — Alguns botões sem focus ring visível
**Arquivo:** `src/components/dashboard/balance-evolution-chart.tsx` L118 (botões de período)
**Critério WCAG:** 2.4.7 Focus Visible
**Descrição:** Padrão geral de inputs usa `focus-visible:ring-2` consistentemente, mas alguns botões específicos (seletores de período no gráfico) usam `outline-none` sem ring substituto.
**Impacto:** Usuários de teclado perdem indicação visual de foco nestes elementos.
**Correção:** Garantir `focus-visible:ring-2 focus-visible:ring-ring` em todos os elementos interativos.

---

### [BAIXO] D8.14 — Auth layout sem landmark `<main>`
**Arquivo:** `src/app/(auth)/layout.tsx`
**Critério WCAG:** 1.3.1 Info and Relationships
**Descrição:** O layout de autenticação não envolve o conteúdo em `<main>`. O layout do app (`(app)/layout.tsx`) usa `<main>` corretamente.
**Impacto:** Leitores de tela não identificam a região principal de conteúdo nas páginas de auth.
**Correção:** Adicionar `<main>` ao layout de autenticação.

---

## Verificações positivas

- **Skip-to-content:** Link "Ir para conteúdo" presente como primeiro elemento focável em `src/app/(app)/layout.tsx` L92-98. Correto.
- **Landmarks semânticos:** `<aside>`, `<nav>`, `<main>` presentes no layout do app. Correto.
- **Idioma:** `html lang="pt-BR"` definido em `src/app/layout.tsx` L48. Correto.
- **Focus ring nos inputs:** Padrão `focus-visible:ring-2 focus-visible:ring-ring` aplicado consistentemente nos inputs de formulário. Correto.
- **Alguns botões com aria-label:** Toggle de valores mascarados, menu hambúrguer e FAB possuem `aria-label`. Correto.
- **Ícones decorativos:** Vários ícones usam `aria-hidden="true"` corretamente.

---

## Resumo do domínio

| ID | Severidade | Achado | Esforço |
|---|---|---|---|
| D8.01 | ALTO | Dialogs sem `role="dialog"`, `aria-modal` e focus trap | Alto |
| D8.02 | ALTO | Botão de logout sem `aria-label` | Baixo |
| D8.03 | ALTO | Botão de filtro sem `aria-label` | Baixo |
| D8.07 | ALTO | Tabelas sem `scope` nos `<th>` | Baixo |
| D8.10 | ALTO | Informação financeira diferenciada apenas por cor | Médio |
| D8.04 | MÉDIO | Labels sem `htmlFor` — BudgetForm (4 campos) | Baixo |
| D8.05 | MÉDIO | Labels sem `htmlFor` — AssetForm (8 campos) | Baixo |
| D8.06 | MÉDIO | Labels sem `htmlFor` — RecurrenceForm (10+ campos) | Baixo |
| D8.08 | MÉDIO | `aria-required` ausente em campos obrigatórios | Médio |
| D8.09 | MÉDIO | `aria-describedby` ausente em mensagens de erro | Médio |
| D8.11 | MÉDIO | Overlay do sidebar mobile sem acessibilidade de teclado | Baixo |
| D8.13 | MÉDIO | Botões de cor sem `aria-label` | Baixo |
| D8.15 | MÉDIO | Radio customizado sem `role`, `fieldset`, `legend` | Médio |
| D8.16 | MÉDIO | Indicador de força de senha apenas por cor | Baixo |
| D8.12 | BAIXO | Alguns botões sem focus ring visível | Baixo |
| D8.14 | BAIXO | Auth layout sem landmark `<main>` | Baixo |

**Total:** 16 achados (0 críticos, 5 altos, 9 médios, 2 baixos)

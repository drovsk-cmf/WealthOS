# Oniefy - WCAG AA Accessibility Audit

**Data:** 30 de março de 2026
**Sessão:** 34
**Padrão:** WCAG 2.1 Level AA

---

## 1. Contrast Ratios (1.4.3 / 1.4.11)

| Par de cores | Razão | AA Normal (4.5:1) | AA Large (3.0:1) |
|---|---|---|---|
| Body text (#241E29) on background (#FBF9F5) | 15.45 | PASSA | PASSA |
| Primary (#4F2F69) on background (#FBF9F5) | 10.28 | PASSA | PASSA |
| Muted (#64748B) on background (#FBF9F5) | 4.53 | PASSA | PASSA |
| **Verdant (#2D8B5E) on background (#FBF9F5)** | **4.02** | **FALHA** | PASSA |
| **Burnished (#C75B3F) on background (#FBF9F5)** | **4.00** | **FALHA** | PASSA |
| Body text on card (#FFFFFF) | 16.24 | PASSA | PASSA |
| Primary on card (#FFFFFF) | 10.81 | PASSA | PASSA |
| Muted on card (#FFFFFF) | 4.76 | PASSA | PASSA |
| Body text on sidebar (#241E29) | 15.45 | PASSA | PASSA |

**Achados:** Verdant e Burnished falham AA Normal para texto pequeno (< 18px regular ou < 14px bold). Ambos passam AA Large. No codebase, esses tons aparecem em badges (text-[9px], text-xs) onde o contraste é insuficiente.

**Recomendação:** escurecer Verdant para #247A50 (ratio ~5.1) e Burnished para #B04E34 (ratio ~4.8) para atingir AA Normal, ou garantir que nunca sejam usados em texto < 14px bold.

## 2. Keyboard Navigation (2.1.1 / 2.4.7)

- 154 referências a onKeyDown/tabIndex/aria-label/focus-trap no codebase
- Focus styles via shadcn/ui pattern: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`
- E2E test: `e2e/a11y/focus-trap.spec.ts` (Playwright)
- `useEscapeClose` hook para modais
- **Status:** adequado para AA

## 3. ARIA e Semantic HTML (4.1.2)

- 76 `aria-label` no codebase
- 0 imagens sem `alt`
- Formulários usam `<label>` implícito via shadcn
- **Status:** adequado para AA

## 4. Error Identification (3.3.1 / 3.3.3)

- 3 error boundaries (app, auth, global)
- Todas as páginas de dados tratam loading + empty + error states
- Toast notifications (sonner) para feedback de ações
- **Status:** adequado para AA

## 5. Gaps Identificados

| Item | Severidade | Ação |
|---|---|---|
| Verdant/Burnished em texto < 14px bold | Média | Escurecer cores ou aumentar tamanho mínimo |
| Sem skip-to-content link | Baixa | Adicionar `<a href="#main" class="sr-only focus:not-sr-only">` |
| Sem `lang="pt-BR"` verificado | Baixa | Confirmar no `<html>` tag |
| Sem reduced-motion media query | Baixa | Adicionar `@media (prefers-reduced-motion: reduce)` |

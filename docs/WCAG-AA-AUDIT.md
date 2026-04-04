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
| **Verdant (hsl 152 55% 31% ≈ #247B52) on background (#FBF9F5)** | **4.96** | PASSA | PASSA |
| **Burnished (hsl 35 66% 34% ≈ #906020) on background (#FBF9F5)** | **5.15** | PASSA | PASSA |
| Body text on card (#FFFFFF) | 16.24 | PASSA | PASSA |
| Primary on card (#FFFFFF) | 10.81 | PASSA | PASSA |
| Muted on card (#FFFFFF) | 4.76 | PASSA | PASSA |
| Body text on sidebar (#241E29) | 15.45 | PASSA | PASSA |

**Achados:** Verdant e Burnished passam AA Normal (4.96:1 e 5.15:1 respectivamente). Valores corrigidos nas sessões 38-42 via ajuste dos HSL no globals.css. Contraste verificado numericamente (sessão 42).

**Status:** Resolvido. Nenhuma ação pendente.

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
| Verdant/Burnished em texto < 14px bold | Média | Cores escurecidas na sessão 38 (HSL ajustado). Verificar com ferramenta de contraste. |
| ~~Sem skip-to-content link~~ | ~~Baixa~~ | ✅ Resolvido sessão 38: `layout.tsx` L51 |
| ~~Sem `lang="pt-BR"` verificado~~ | ~~Baixa~~ | ✅ Confirmado: `<html lang="pt-BR">` em layout.tsx |
| ~~Sem reduced-motion media query~~ | ~~Baixa~~ | ✅ Resolvido sessão 38: `globals.css` L188-189 |

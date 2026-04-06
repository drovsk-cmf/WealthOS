# Oniefy - WCAG AA Accessibility Audit

**Última atualização:** 05 de abril de 2026
**Sessões:** 34 (auditoria inicial), 42 (cores), 44 (automação + fixes)
**Padrão:** WCAG 2.1 Level AA

---

## 1. Contrast Ratios (1.4.3 / 1.4.11)

| Par de cores | Razão | AA Normal (4.5:1) | AA Large (3.0:1) |
|---|---|---|---|
| Body text (#241E29) on background (#FBF9F5) | 15.45 | PASSA | PASSA |
| Primary (#4F2F69) on background (#FBF9F5) | 10.28 | PASSA | PASSA |
| Muted (#64748B) on background (#FBF9F5) | 4.53 | PASSA | PASSA |
| Verdant (#247B52) on background (#FBF9F5) | 4.96 | PASSA | PASSA |
| Burnished (#906020) on background (#FBF9F5) | 5.15 | PASSA | PASSA |
| Body text on card (#FFFFFF) | 16.24 | PASSA | PASSA |
| Primary on card (#FFFFFF) | 10.81 | PASSA | PASSA |
| Muted on card (#FFFFFF) | 4.76 | PASSA | PASSA |
| Sidebar section labels (opacidade 0.65) | ~5.3 | PASSA | PASSA |

**Achado aberto (B20):** `text-muted-foreground` em ~8 páginas gera contraste 3.57-4.38:1 (abaixo do mínimo 4.5:1). Detectado como SERIOUS (não CRITICAL) pelo axe-core. Afeta labels secundários, timestamps, e texto descritivo em /dashboard, /transactions, /cash-flow, /bills, /assets, /tax, /diagnostics. Registrado em docs/PENDENCIAS.md.

## 2. Keyboard Navigation (2.1.1 / 2.4.7)

- Focus styles via shadcn/ui pattern: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`
- `useEscapeClose` hook para modais
- FocusTrap em todos os 16 modais overlay (incluindo notification-panel, sessão 40)
- Skip-to-content link em `layout.tsx`
- Teste automatizado: `e2e/audit-kit/specs/universal/keyboard-navigation.spec.ts` (tab order, focus visible, keyboard traps)
- Teste automatizado: `e2e/audit-kit/specs/universal/flow-variations.spec.ts` (modal escape/reopen)
- **Status:** adequado para AA

## 3. ARIA e Semantic HTML (4.1.2)

- 83+ `aria-label` no codebase (76 na sessão 34, +7 fixes na sessão 44)
- 0 imagens sem `alt`
- Formulários usam `<label>` com `htmlFor`/`id` pair (corrigido em human-capital-calculator, sessão 44)
- `<html lang="pt-BR">` confirmado

### Fixes de a11y aplicados na sessão 44

| Bug | Componente | Fix |
|-----|-----------|-----|
| B6 | `/cash-flow` select | `aria-label="Filtrar por conta"` |
| B10 | `/tax` select | `aria-label="Ano fiscal"` |
| B11 | `/settings/profile` select | `aria-label="Moeda padrão"` |
| B12 | Affordability select | `aria-label="Forma de pagamento"` |
| B13 | `/connections` select | `aria-label="Conta de destino"` |
| B15 | `/diagnostics` botão | `aria-label="Ver explicação"` (dinâmico) |
| B16 | Human capital input | `htmlFor`/`id` pair no InputField |

- **Status:** 33/35 rotas passam auditoria automatizada (axe-core). 2 pendentes de deploy (B15, B16).

## 4. Error Identification (3.3.1 / 3.3.3)

- 3 error boundaries (app, auth, global)
- Todas as páginas de dados tratam loading + empty + error states
- Toast notifications (sonner) para feedback de ações
- FormError padronizado em 9 form components (sessão 42)
- **Status:** adequado para AA

## 5. Reduced Motion (2.3.3)

- `prefers-reduced-motion` media query em `globals.css` (sessão 38)
- **Status:** adequado para AA

## 6. Testes automatizados de acessibilidade

| Spec | Cobertura | Ferramenta |
|------|-----------|-----------|
| `e2e/audit-kit/specs/universal/accessibility.spec.ts` | 35 rotas, WCAG AA via axe-core | Playwright + @axe-core/playwright |
| `e2e/audit-kit/specs/universal/keyboard-navigation.spec.ts` | Tab order, focus visible, keyboard traps | Playwright |
| `e2e/audit-kit/specs/universal/mobile-responsive.spec.ts` | Touch targets (mínimo 44px) | Playwright |

Resultado da última execução completa (sessão 44): 33/35 rotas passam (94%).

## 7. Gaps abertos

| Item | Severidade | Status |
|------|-----------|--------|
| B20: color-contrast SERIOUS em ~8 páginas (muted-foreground) | Média | Pendência registrada |
| B21: 6 botões com touch target < 30px no dashboard mobile | Baixa | Pendência registrada |
| B15/B16: 2 rotas falham axe-core (pendente deploy) | Crítica | Fix commitado, aguardando deploy |

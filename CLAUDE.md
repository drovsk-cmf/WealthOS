# CLAUDE.md — Instruções para Claude Code

## Projeto
Oniefy (ex-WealthOS) — plataforma de inteligência financeira pessoal para profissionais brasileiros.
Repo público: `drovsk-cmf/WealthOS`. Deploy: `www.oniefy.com`.

## Stack
Next.js 15 / React 19 / TypeScript / Supabase (PostgreSQL + Auth + RLS) / Capacitor 6 / shadcn/ui / Tailwind / Vercel / Playwright.

## Documentos-chave
- `docs/HANDOVER.md` — source of truth do projeto (contexto, histórico, ground truth)
- `docs/PENDENCIAS.md` — backlog com status (pendentes primeiro, concluídos no final)
- `docs/engineering/MATRIZ-VALIDACAO-v2_2.md` — 48 auditorias em 11 camadas (ISO 25010, OWASP ASVS)
- `docs/engineering/RASTREABILIDADE-STORY-TESTE.md` — mapa story→código→teste (108 stories)
- `docs/guides/ROTEIRO-TESTE-MANUAL.md` — 16 blocos de teste manual

## Comandos úteis
```bash
npx tsc --noEmit              # Type check
npx next lint                 # ESLint
npx jest --passWithNoTests    # Testes unitários (76 suítes, 1.172 assertions)
```

## Testes E2E (Playwright)
```bash
# Suite de auditoria original (18 specs, testes específicos do Oniefy)
$env:PLAYWRIGHT_BASE_URL = "https://www.oniefy.com"
npx playwright test e2e/audit/

# Audit Kit universal (13 specs universais + 6 gerados)
npx playwright test --config=e2e/audit-kit/playwright.config.ts

# Specs individuais
npx playwright test --config=e2e/audit-kit/playwright.config.ts specs/universal/monkey.spec.ts
npx playwright test --config=e2e/audit-kit/playwright.config.ts specs/universal/flow-variations.spec.ts

# Discovery: inventariar elementos interativos e gerar specs específicos
npx playwright test --config=e2e/audit-kit/playwright.config.ts discovery/crawl-inventory.spec.ts
```

Usuário E2E: `e2e-test@oniefy.com` / `E2eTest!Secure2026` (user_id: `e7a6554f-a75a-4080-9eb7-1c310a5f8bbf`).
Auth setup em `e2e/audit-kit/specs/auth.setup.ts`. Rate limiter: máximo 5 tentativas de login / 15 min.

## Convenções
- Código, commits e docs em pt-BR
- `execute_sql` para schema changes (não `apply_migration`)
- eslint-disable mínimo (atualmente 2, ambos no-console, legítimos)
- `as any` em hooks: 0 (proibido)
- Engines puros em `src/lib/services/` com testes em `src/__tests__/`
- Cada engine: zero deps externas, testável isoladamente
- Timezone: sempre `toLocalDateString()` (nunca `toISOString().split("T")[0]`)
- Novas functions PostgreSQL: obrigatório `SET search_path = public`

## Supabase
Projeto: `mngjbrbxapazdddzgoje` (sa-east-1 São Paulo). Acesso via MCP OAuth.

## E2E Audit Kit (`e2e/audit-kit/`)
Kit reutilizável em qualquer projeto web. Configuração em `audit.config.ts` (único arquivo para editar).

13 specs universais: accessibility, keyboard-navigation, mobile-responsive, all-pages-crawl, dead-links, loading-states, performance, security-headers, error-resilience, seo-meta, observability, monkey, flow-variations.

6 specs gerados para o Oniefy: accounts, calculators, connections, settings-profile, settings-security, tax.

Discovery: `crawl-inventory.spec.ts` gera `reports/inventory.json`. Prompt para gerar specs: `discovery/PROMPT-GENERATE.md`.

# CLAUDE.md — Instruções para Claude Code

## Projeto
Oniefy (ex-WealthOS) — plataforma de inteligência financeira pessoal para profissionais brasileiros.
Repo público: `drovsk-cmf/WealthOS`. Deploy: `www.oniefy.com`.

## Stack
Next.js 15 / React 19 / TypeScript / Supabase (PostgreSQL + Auth + RLS) / Capacitor 6 / shadcn/ui / Tailwind / Vercel.

## Documentos-chave
- `HANDOVER-WealthOS.md` — source of truth do projeto (contexto, histórico, ground truth)
- `PENDENCIAS-FUTURAS.md` — backlog com status (✅/⬜/🔒/📌)
- `docs/audit/PENDENCIAS-DECISAO.md` — pendências de decisão
- `docs/RASTREABILIDADE-STORY-TESTE.md` — mapa story→teste

## Comandos úteis
```bash
npx tsc --noEmit          # Type check
npx next lint             # ESLint
npx jest --passWithNoTests # Todos os testes
bash scripts/audit-coherence.sh  # Auditoria de coerência documental
```

## Convenções
- Código, commits e docs em pt-BR
- `execute_sql` para schema changes (não `apply_migration`)
- eslint-disable mínimo (atualmente 6, todos justificados)
- Engines puros em `src/lib/services/` com testes em `src/__tests__/`
- Cada engine: zero deps externas, testável isoladamente

## Supabase
Projeto: `mngjbrbxapazdddzgoje` (sa-east-1 São Paulo). Acesso via MCP OAuth.

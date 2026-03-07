# WealthOS

Sistema integrado de gestao financeira e patrimonial para uso pessoal.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + RLS + Storage) |
| Mobile | Capacitor (iOS) |
| Hospedagem | Vercel |
| CI/CD | GitHub Actions |

## Modulos

1. **Financeiro** - receitas, despesas, categorias, conciliacao
2. **Orcamento** - planejamento mensal por categoria
3. **Contas a Pagar** - vencimentos, recorrencias, alertas
4. **Patrimonio** - bens, depreciacao, seguros
5. **Fiscal** - dados para IRPF
6. **Dashboard** - visao consolidada

## Setup Local

### Pre-requisitos

- Node.js 20+
- npm 10+
- Conta no [Supabase](https://supabase.com)
- (Opcional) Supabase CLI: `npm install -g supabase`

### 1. Clonar e instalar

```bash
git clone https://github.com/drovsk-cmf/WealthOS.git
cd WealthOS
npm install
```

### 2. Configurar Supabase

1. Criar projeto em [supabase.com](https://supabase.com/dashboard)
2. Copiar `.env.example` para `.env.local` e preencher:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Executar a migration no SQL Editor do Supabase:
   - Copiar conteudo de `supabase/migrations/001_initial_schema.sql`
   - Colar e executar no SQL Editor
4. Executar a seed de categorias:
   - Copiar conteudo de `supabase/seed/001_default_categories.sql`
   - Colar e executar no SQL Editor
5. Configurar provedores de autenticacao (Google, Apple) no painel do Supabase

### 3. Rodar localmente

```bash
npm run dev
```

Acessar: http://localhost:3000

### 4. Gerar tipos do banco (apos configurar Supabase)

```bash
export SUPABASE_PROJECT_ID=seu-project-id
npm run db:types
```

## Setup iOS (Capacitor)

```bash
npx cap add ios
npx cap sync
npx cap open ios
```

Requer: Apple Developer Account (US$ 99/ano) e Xcode.

## Estrutura do Projeto

```
src/
  app/
    (auth)/          # Rotas publicas: login, registro, onboarding
    (app)/           # Rotas autenticadas: dashboard, transacoes, etc.
    api/             # API routes (server-side)
  components/
    ui/              # shadcn/ui components
    layout/          # Layout components (sidebar, header)
    shared/          # Shared components
  lib/
    supabase/        # Clients Supabase (server + browser)
    crypto/          # Criptografia E2E
    utils/           # Utilitarios (formatacao, cn, etc.)
  hooks/             # React hooks customizados
  types/             # TypeScript types (database, etc.)
  stores/            # Zustand stores
supabase/
  migrations/        # SQL migrations
  seed/              # Seed data
  functions/         # Edge Functions (Deno)
```

## Documentacao

- `wealthos-especificacao-v1.docx` - Especificacao tecnica e funcional
- `wealthos-funcional-v1.docx` - 62 user stories com criterios de aceite
- `wealthos-adendo-v1.1.docx` - Decisoes tecnicas, key management, Edge Functions, APNs

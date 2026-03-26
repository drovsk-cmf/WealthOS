# Oniefy

**Seu analista financeiro pessoal.** Sistema de gestão patrimonial e inteligência fiscal para profissionais brasileiros com múltiplas fontes de renda.

[![CI](https://github.com/drovsk-cmf/WealthOS/actions/workflows/ci.yml/badge.svg)](https://github.com/drovsk-cmf/WealthOS/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/deploy-www.oniefy.com-5C2D91)](https://www.oniefy.com)
[![Coverage](https://img.shields.io/badge/coverage-71.2%25-yellow)](https://github.com/drovsk-cmf/WealthOS)

> **Status:** Beta fechado. O Oniefy não é um app de controle de gastos. É um sistema patrimonial que trata seu dinheiro como um analista financeiro certificado faria: com clareza contábil, métricas de solvência e inteligência fiscal real.

## O que o Oniefy faz

| Módulo | O que resolve |
|--------|--------------|
| **Financeiro** | Receitas e despesas com contabilidade partidas dobradas (journal entries). Importação CSV/OFX/XLSX. Reconciliação bancária. |
| **Patrimônio** | Bens, veículos, investimentos com depreciação, seguros e valorização. Classificação por liquidez (N1-N4). |
| **Fiscal** | Consolidação automática por tratamento fiscal (tributável, isento, dedutível). Provisionamento de IR com projeção anual. Exportação IRPF formatada (XLSX 6 abas). |
| **Orçamento** | Planejamento mensal por categoria com workflows de aprovação. |
| **Contas a Pagar** | Vencimentos, recorrências com reajuste indexado (IPCA, IGP-M), alertas push. |
| **Metas** | Objetivos de economia com progresso, sugestão de quanto poupar/mês. |
| **Dashboard** | Solvência em linguagem direta ("Você sobrevive 14 meses sem renda"), patrimônio líquido temporal, gráfico evolutivo. |
| **Calculadoras** | 7 ferramentas de análise financeira: simulador "Posso comprar?", projeção indexada, independência financeira, comprar vs alugar, CET, SAC vs Price, capital humano (DCF da carreira). |
| **Motor JARVIS** | 10 regras automáticas de inteligência financeira (alertas de solvência, distribuição de custos, reconciliação). |

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript |
| UI | shadcn/ui + Tailwind CSS (Design System: Plum Ledger) |
| Backend | Supabase (PostgreSQL 15 + Auth + RLS + Storage + pg_cron) |
| Mobile | Capacitor 6 (iOS) |
| Deploy | Vercel (www.oniefy.com) |
| CI/CD | GitHub Actions (Lint + TypeCheck + Jest + Build + Security + Health Check) |
| IA | Gemini Flash-Lite (categorização) + Claude Sonnet (assistente) |

## Números

| Métrica | Valor |
|---------|-------|
| Tabelas | 35 |
| Políticas RLS | 107 |
| Functions PostgreSQL | 74 |
| pg_cron jobs | 13 |
| Testes (Jest + RTL) | 50 suítes, 775 assertions |
| Cobertura | 71.2% statements, 75.3% functions |
| Arquivos TypeScript | 213 |

## Setup local

### Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com)

### 1. Clonar e instalar

```bash
git clone https://github.com/drovsk-cmf/WealthOS.git
cd WealthOS
npm install
```

### 2. Configurar ambiente

```bash
cp .env.example .env.local
```

Preencher as variáveis no `.env.local` (ver comentários no arquivo).

### 3. Configurar banco

Executar as migrations no SQL Editor do Supabase (pasta `supabase/migrations/`, em ordem numérica).

### 4. Rodar

```bash
npm run dev
```

Acessar: http://localhost:3000

### 5. Testes

```bash
npm test              # Jest
npm run lint          # ESLint
npm run type-check    # TypeScript
```

## Estrutura

```
src/
  app/(auth)/          # Login, registro, onboarding
  app/(app)/           # Dashboard, transações, fiscal, patrimônio, metas...
  app/api/             # Route handlers (auth, IA, push, digest, índices)
  components/          # Componentes por domínio (dashboard, calculators, ...)
  lib/hooks/           # 31 hooks React Query por domínio
  lib/crypto/          # Criptografia AES-256 (DEK/KEK) para CPF
  lib/parsers/         # Parsers CSV, OFX, XLSX para importação bancária
  lib/schemas/         # 33 schemas Zod para contratos RPC
  lib/services/        # Transaction engine, fiscal export, onboarding seeds
supabase/
  migrations/          # 60 migration files (schema, RLS, RPCs, triggers)
```

Fonte de verdade para arquitetura e roadmap: `HANDOVER-WealthOS.md`.

## Segurança

- Row Level Security em 100% das tabelas (107 políticas, initplan pattern)
- Criptografia AES-256 para dados sensíveis (CPF)
- Sanitização PII obrigatória antes de toda chamada de IA
- Rate limiting em middleware
- Session timeout com purge de chaves criptográficas
- CSP, HSTS, X-Frame-Options, Permissions-Policy
- Sentry com beforeSend PII scrub
- Audit log (access_logs com IP, user_agent, ação)
- 5 cron jobs de cleanup (logs, analytics, cache, notificações, soft-deleted)

## Licença

Código fonte disponível para referência e estudo. Uso comercial requer autorização do autor.

© 2025-2026 Claudio Macêdo Filho

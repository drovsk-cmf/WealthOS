# Oniefy

**Seu analista financeiro pessoal.** Sistema de gestão patrimonial e inteligência fiscal para profissionais brasileiros com múltiplas fontes de renda.

[![CI](https://github.com/drovsk-cmf/WealthOS/actions/workflows/ci.yml/badge.svg)](https://github.com/drovsk-cmf/WealthOS/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/deploy-www.oniefy.com-5C2D91)](https://www.oniefy.com)
[![Coverage](https://img.shields.io/badge/coverage-78%25-brightgreen)](https://github.com/drovsk-cmf/WealthOS)

> **Status:** Beta fechado. O Oniefy não é um app de controle de gastos. É um sistema patrimonial que trata seu dinheiro como um analista financeiro certificado faria: com clareza contábil, métricas de solvência e inteligência fiscal real.

## O que o Oniefy faz

| Módulo | O que resolve |
|--------|--------------|
| **Finanças** | Receitas e despesas com contabilidade partidas dobradas (journal entries). Importação CSV/OFX/XLSX com OCR (PDF). Reconciliação bancária. |
| **Patrimônio** | Contas, cartões, bens e veículos com depreciação, seguros e valorização. Classificação por liquidez (N1-N4). |
| **Planejamento** | Orçamento mensal por categoria. Metas com progresso e sugestão de quanto poupar. Recorrências com reajuste indexado (IPCA, IGP-M). |
| **Fiscal** | Consolidação automática por tratamento fiscal (tributável, isento, dedutível). Provisionamento de IR com projeção anual. Exportação IRPF formatada (XLSX 6 abas). Compartilhamento read-only para contador. |
| **Inteligência** | Diagnóstico financeiro (DuPont adaptado). 8 calculadoras (simulador "Posso comprar?", projeção indexada, independência financeira, comprar vs alugar, CET, SAC vs Price, quitar dívida, capital humano). Indicadores econômicos em tempo real. |
| **Dashboard** | Solvência em linguagem direta ("Você sobrevive 14 meses sem renda"), patrimônio líquido temporal, gráfico evolutivo, scanner financeiro, narrativa contextual. |
| **Motor Financeiro** | 10 regras automáticas de inteligência financeira (alertas de solvência, distribuição de custos, reconciliação). |

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
| Testes E2E | Playwright (2 suites: audit + audit-kit) |

## Números

| Métrica | Valor |
|---------|-------|
| Tabelas | 38 |
| Políticas RLS | 116 |
| Functions PostgreSQL | 80 |
| pg_cron jobs | 13 |
| Testes unitários (Jest) | 76 suítes, 1.172 assertions |
| Testes E2E (Playwright) | 37 specs, ~360 testes |
| Cobertura story→teste | 78% (85/108 stories) |
| Arquivos TypeScript | 301 |
| Hooks React Query | 43 |
| Schemas Zod | 61 |
| Migrations | 73 |
| Calculadoras | 8 + diagnóstico financeiro |

## Testes

```bash
npm test                  # Jest (unitários)
npm run lint              # ESLint
npm run type-check        # TypeScript
```

Testes E2E contra produção:
```bash
$env:PLAYWRIGHT_BASE_URL = "https://www.oniefy.com"
npx playwright test e2e/audit/                                              # Suite original (18 specs)
npx playwright test --config=e2e/audit-kit/playwright.config.ts             # Audit Kit (19 specs universais + 6 gerados)
```

O Audit Kit (`e2e/audit-kit/`) é agnóstico de backend e reutilizável em qualquer projeto web. Inclui: acessibilidade (axe-core), responsividade multi-breakpoint, performance (Web Vitals), security headers, SEO, navegação por teclado, monkey testing e variações de fluxo.

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

## Estrutura

```
src/
  app/(auth)/          # Login, registro, onboarding
  app/(app)/           # Dashboard, transações, fiscal, patrimônio, metas...
  app/api/             # Route handlers (auth, IA, push, digest, índices)
  components/          # Componentes por domínio (dashboard, calculators, ...)
  lib/hooks/           # 43 hooks React Query por domínio
  lib/crypto/          # Criptografia AES-256 (DEK/KEK) para CPF
  lib/parsers/         # Parsers CSV, OFX, XLSX, PDF (OCR) para importação
  lib/schemas/         # 61 schemas Zod para contratos RPC
  lib/services/        # 21 engines puros (transaction, fiscal, dedup, onboarding...)
e2e/
  audit/               # Suite de auditoria UX original (18 specs)
  audit-kit/           # Playwright Audit Kit universal (19 specs + discovery)
supabase/
  migrations/          # 73 migration files (schema, RLS, RPCs, triggers)
docs/
  MATRIZ-VALIDACAO-v2_2.md  # 48 auditorias em 11 camadas
  LGPD-*.md                 # ROPA, RIPD, mapeamento de dados pessoais
```

Fonte de verdade para arquitetura e roadmap: `docs/HANDOVER.md`.

## Segurança e compliance

- Row Level Security em 100% das tabelas (116 políticas, initplan pattern)
- Criptografia AES-256-GCM para dados sensíveis (CPF) com DEK/KEK
- Sanitização PII obrigatória antes de toda chamada de IA
- Rate limiting em middleware
- Session timeout com purge de chaves criptográficas
- CSP nonce-based, HSTS, X-Frame-Options, Permissions-Policy
- LGPD: ROPA, RIPD fiscal, mapeamento de dados pessoais, DPO designado
- WCAG AA: 33/35 rotas passam auditoria automatizada (axe-core)
- Matriz de Validação com 48 auditorias em 11 camadas (ISO 25010, OWASP ASVS, IEEE 1012)

## Licença

Código fonte disponível para referência e estudo. Uso comercial requer autorização do autor.

© 2025-2026 Claudio Macêdo Filho

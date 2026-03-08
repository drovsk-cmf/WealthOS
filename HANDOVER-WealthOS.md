# WealthOS - Handover de Sessão (Atualizado)

**Data:** 08 de março de 2026
**Sessão anterior:** 07-08/03/2026
**Projeto:** WealthOS - Sistema Integrado de Gestão Financeira e Patrimonial
**Repositório GitHub:** https://github.com/drovsk-cmf/WealthOS (privado)
**Supabase Project:** hmwdfcsxtmbzlslxgqus (sa-east-1, PostgreSQL 17)
**Ambiente local:** C:\Users\claud\Documents\PC_WealthOS (Windows 10/11)

---

## 1. O que é o WealthOS

Sistema de gestão financeira e patrimonial para uso pessoal, posicionado como "Sistema Operativo de Riqueza" (não um expense tracker). Público-alvo: profissionais de alta renda com múltiplas fontes de receita e complexidade fiscal ("The Hybrid Earner"). Foco em blindagem patrimonial, eficiência tributária e privacidade.

**Modelo contábil:** partida dobrada como motor interno (invisível ao usuário), com plano de contas híbrido (estrutura CPC simplificada por baixo, linguagem natural na interface). Filosofia Apple: mecânica complexa invisível, resultado simples entregue ao usuário.

---

## 2. O que foi feito NESTA sessão (07-08/03/2026)

### 2.1 Infraestrutura
- Conector MCP do Supabase vinculado ao Claude (leitura/escrita, OAuth)
- Verificação de conexão: projeto ativo, PostgreSQL 17, sa-east-1

### 2.2 Banco de dados (Supabase)
- **Migration 001 aplicada** via MCP (6 partes):
  - 001_initial_schema_enums_and_tables (9 ENUMs + 13 tabelas)
  - 001_initial_schema_indexes (30 indexes)
  - 001_initial_schema_rls (52 políticas RLS, todas as tabelas)
  - 001_initial_schema_triggers (13 triggers + 5 functions)
  - 001_initial_schema_storage (bucket user-documents + 4 storage policies)
  - 001_seed_default_categories (função create_default_categories)
- **Trigger handle_new_user() confirmado funcionando** (criou perfil do Claudio no login via Google)
- Usuário no banco: Claudio Filho, id=04c41302-5429-4f97-9aeb-e21294d014ff, onboarding_completed=false

### 2.3 Repositório GitHub (8 commits)
```
37d2842 docs: rewrite setup guide for Windows (PowerShell)
6126f4c docs: rewrite setup guide from absolute zero
32cad77 docs: add comprehensive local setup guide (Fase 0 completion)
cdc2494 docs: add technical specs, data catalogs, and Fase 1.5 migrations
1f98df5 feat: add Fase 0 application code (19 files)
8550422 feat(db): add migration 001 initial schema + seed default categories
295c5df Add files via upload
c66b6d1 Initial commit
```

### 2.4 Código da aplicação (Fase 0 - 31 arquivos no repo)
- **Layouts:** root (QueryProvider), auth (centralizado), app (sidebar responsiva)
- **Páginas:** login (email/senha + Google + Apple OAuth), register, onboarding (placeholder), dashboard (4 cards)
- **API routes:** /api/auth/callback (troca code por sessão + detecção de onboarding)
- **Libs:** supabase/client.ts (browser), supabase/server.ts (SSR + admin), crypto/index.ts (E2E completo com DEK/KEK), utils/index.ts (cn, formatCurrency, formatDate), query-provider.tsx
- **Middleware:** proteção de rotas + refresh de sessão
- **Types:** database.ts placeholder (4 tabelas tipadas, restante genérico)
- **CI/CD:** GitHub Actions (lint, type-check, build, security checks: service_role leak + RLS coverage)
- **Config:** supabase/config.toml (Auth, MFA, Google, Apple), capacitor.config.ts, next.config.js (security headers), tailwind.config.ts (tema customizado com income/expense colors)

### 2.5 Documentação no repo (docs/)
- **docs/specs/**: 8 documentos técnicos (.docx) - especificação, funcional, 4 adendos, estudo contábil, estudo técnico
- **docs/data/**: 2 catálogos (.xlsx) - BCB SGS (6.922 séries) + IBGE SIDRA (9.029 tabelas)
- **docs/SETUP-LOCAL.md**: guia passo a passo para Windows (PowerShell)

### 2.6 Migrations da Fase 1.5 (no repo, NÃO aplicadas)
- `supabase/migrations/002_accounting_model.sql` (552 linhas)
- `supabase/seed/002_default_chart_of_accounts.sql` (386 linhas, 111 contas + economic_indices_sources)

### 2.7 Setup local concluído
- Ambiente Windows com PowerShell
- Git 2.52.0, Node.js v24.13.0, npm 11.8.0
- Repositório clonado em C:\Users\claud\Documents\PC_WealthOS
- .env.local configurado com anon key + service_role key
- npm install + npm run dev funcionando em localhost:3000
- Google OAuth configurado e testado (login com Google funcionando)
- Apple Sign-In: NÃO configurado (requer Apple Developer Program)

---

## 3. Estado atual do projeto

### Fase 0 (Setup): CONCLUÍDA ✅

| Componente | Status |
|---|---|
| Repo GitHub com 31 arquivos | ✅ |
| Supabase: 13 tabelas, RLS, triggers | ✅ Aplicado |
| Storage bucket user-documents | ✅ |
| Seed create_default_categories() | ✅ Aplicado |
| .env.local com keys | ✅ |
| Google OAuth | ✅ |
| Apple Sign-In | ⏳ (opcional, requer Apple Developer Program) |
| npm run dev funcionando | ✅ |
| Login testado e perfil criado no banco | ✅ |

### Próximo: Fase 1 (Auth + Segurança) - AUTH-01 a AUTH-08

| Story | Escopo | Status |
|---|---|---|
| AUTH-01 | Login social (Google + Apple) | ✅ Google funcional. Apple pendente. |
| AUTH-02 | Login email/senha com requisitos | Parcial. Falta validação de senha fraca. |
| AUTH-03 | MFA obrigatório (TOTP) | **Não iniciado. Prioridade alta.** |
| AUTH-04 | Biometria iOS (Face ID/Touch ID) | Não iniciado. Depende de device iOS. |
| AUTH-05 | Onboarding completo | Placeholder existe. Falta chamar create_default_categories(), gerar DEK, setup MFA. |
| AUTH-06 | Logout + invalidação de sessões | Parcial (logout básico existe na sidebar). Falta timeout 30min, logout remoto. |
| AUTH-07 | Exclusão de conta (7 dias carência) | Não iniciado. |
| AUTH-08 | Testes de segurança RLS | Não iniciado. Pode ser feito via MCP. |

---

## 4. Conexões e acessos

### GitHub
- Repositório: https://github.com/drovsk-cmf/WealthOS (privado)
- Fine-grained PAT: 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
- Classic PAT: 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

### Supabase
- Conexão via MCP remoto (mcp.supabase.com/mcp), autenticado por OAuth
- Project ref: hmwdfcsxtmbzlslxgqus
- URL: https://hmwdfcsxtmbzlslxgqus.supabase.co
- Região: sa-east-1 (São Paulo)
- PostgreSQL: 17.6.1
- Ferramentas MCP disponíveis: execute_sql, apply_migration, list_tables, list_migrations, list_extensions, get_project_url, get_publishable_keys, list_edge_functions, get_logs, etc.

### Google OAuth
- Google Cloud Project: WealthOS
- OAuth Client: WealthOS Supabase (Aplicativo da Web)
- Client ID: 458121785240-33oplmcej5g2q2mss18mj5f4ah3cbhh4.apps.googleusercontent.com
- Redirect URI: https://hmwdfcsxtmbzlslxgqus.supabase.co/auth/v1/callback
- Provider ativo no Supabase: ✅

---

## 5. Decisões técnicas tomadas (referência rápida)

| Decisão | Escolha | Documento |
|---|---|---|
| Mobile | PWA + Capacitor iOS | Especificação v1.0 |
| Backend | Supabase (free tier) | Especificação v1.0 |
| Saldo de contas | Dois saldos: atual (pagas) + previsto (pagas+pendentes) | Adendo v1.1 |
| Exclusão de conta | 7 dias de carência | Adendo v1.1 |
| Relatório fiscal | Gerado client-side (jsPDF) | Adendo v1.1 |
| Chave E2E | Aleatória, protegida por HKDF do JWT | Adendo v1.1 |
| Push notifications | APNs direto (sem Firebase) | Adendo v1.1 |
| OCR | Apple Vision Framework (iOS) + Tesseract.js (web) | Adendo v1.2 |
| Offline | React Query + IndexedDB + Service Worker | Adendo v1.2 |
| Integração bancária | Via agregador (Pluggy ou Belvo), Fase 2 | Adendo v1.3 |
| Modelo contábil | Partida dobrada como motor interno, invisível ao usuário | Estudo Contábil v1.5 |
| Plano de contas | Híbrido: CPC simplificado (interno) + linguagem natural (UI). 133 contas-semente | Estudo Contábil v1.5 |
| Imutabilidade journal entries | Append-only estrito (estorno obrigatório) | Estudo Contábil v1.5 |
| Índices econômicos | BCB SGS (primário) + IBGE SIDRA + IPEADATA (fallback) | Estudo Contábil v1.5 |
| Nomenclatura na UI | Agnóstica de marcas. Sem referência a empresas específicas | Estudo Contábil v1.5 |

---

## 6. Pontos de atenção para a próxima sessão

### 6.1 Bugs conhecidos na migration 002 (corrigir ANTES de aplicar)
A migration 002_accounting_model.sql (Fase 1.5) tem 3 inconsistências com a 001:
1. **Triggers referenciam `update_updated_at()`** mas a function na 001 se chama `handle_updated_at()`
2. **Storage bucket `WHERE id = 'documents'`** mas o bucket na 001 se chama `'user-documents'`
3. **Usa `uuid_generate_v4()`** onde a 001 usa `gen_random_uuid()` (cosmético, ambos funcionam)

### 6.2 Seed 002 tem 111 contas, handover citava 133
A diferença (22 contas) são subcontas de investimentos/bens (depth 3) que serão adicionadas quando o detalhamento estiver disponível. O mecanismo is_active = false garante que aparecem sob demanda.

### 6.3 Ambiente do Claudio
- Windows 10/11, PowerShell
- Familiaridade com terminal: básica (sabe abrir e digitar comandos, mas copia blocos inteiros sem filtrar)
- **Instruções devem ser uma linha por vez**, sem texto explicativo misturado com comandos
- Evitar Bloco de Notas para edições complexas; preferir comandos PowerShell que geram o arquivo inteiro

---

## 7. Plano de fases (atualizado)

| Fase | Escopo | Status |
|---|---|---|
| 0. Setup | Repo, Supabase, Next.js, Capacitor, CI/CD, schema v1.0 | ✅ CONCLUÍDA |
| 1. Auth + Segurança | Login, MFA, RLS, biometria. AUTH-01 a AUTH-08 | **PRÓXIMO** |
| 1.5 Schema Contábil | Migration v2.0: 10 novas tabelas, 12 ENUMs, indexes, triggers, seed 133 contas | Após Fase 1 |
| 2. Financeiro (Core) | CRUD transações + journal_entries. Plano de contas. Centros básico. | Após Fase 1.5 |
| 3. Dashboard + Orçamento | Balanço patrimonial, solvência, orçamento com chart_of_accounts. | Após Fase 2 |
| 4. Contas a Pagar + Patrimônio | Recorrências com reajuste. Bens no Grupo 1.2. | Após Fase 2 |
| 5. Centros Avançados | Rateio, P&L por centro, cisão e exportação. | Após Fase 2 |
| 6. Workflows | Workflows automáticos, tarefas, upload com OCR. | Após Fase 2 |
| 7. Fiscal Integrado | Relatório via tax_treatment, validações, IRRF tracking. | Após Fase 2 |
| 8. Índices Econômicos | Job coleta BCB/SIDRA, projeções indexadas, alertas de reajuste. | Após Fase 3 |
| 9. Integração Bancária | Open Finance via agregador. Pipeline categorização. | Após Fase 2 |
| 10. Polish + App Store | Testes finais, PWA, build Capacitor, submissão. | Todas |

---

## 8. Totais consolidados

| Métrica | Valor |
|---|---|
| Documentos técnicos | 8 (.docx no repo em docs/specs/) |
| Tabelas no banco (schema v1.0, aplicado) | 13 |
| Tabelas no banco (schema v2.0, especificado) | 23 (13 + 10 novas) |
| ENUMs aplicados | 9 |
| ENUMs especificados (v2.0) | 12 adicionais |
| Indexes aplicados | 30 |
| Políticas RLS aplicadas | 52 (public) + 4 (storage) |
| Triggers aplicados | 13 |
| Functions aplicadas | 5 (handle_updated_at, handle_new_user, recalculate_account_balance, create_default_categories + 1 internal) |
| Contas no plano-semente | 111 (implementado) / 133 (especificado) |
| User stories total | 90 |
| Edge Functions | 0 implantadas / 10 especificadas |
| Fases de desenvolvimento | 11 (0 a 10) |
| Arquivos no repo | 43 |
| Commits no main | 8 |

---

## 9. Estrutura do repositório

```
WealthOS/ (43 arquivos)
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .github/workflows/ci.yml
├── README.md
├── capacitor.config.ts
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── public/
│   └── manifest.json
├── docs/
│   ├── SETUP-LOCAL.md              (guia Windows/PowerShell)
│   ├── specs/                      (8 documentos .docx)
│   └── data/                       (2 catálogos .xlsx)
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 001_initial_schema.sql  ✅ Aplicada
│   │   └── 002_accounting_model.sql ⏳ Fase 1.5 (com bugs a corrigir)
│   └── seed/
│       ├── 001_default_categories.sql ✅ Aplicada
│       └── 002_default_chart_of_accounts.sql ⏳ Fase 1.5
└── src/
    ├── middleware.ts
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── (auth)/layout.tsx
    │   ├── (auth)/login/page.tsx
    │   ├── (auth)/register/page.tsx
    │   ├── (auth)/onboarding/page.tsx
    │   ├── (app)/layout.tsx
    │   ├── (app)/dashboard/page.tsx
    │   └── api/auth/callback/route.ts
    ├── lib/
    │   ├── supabase/client.ts
    │   ├── supabase/server.ts
    │   ├── crypto/index.ts
    │   ├── utils/index.ts
    │   └── query-provider.tsx
    └── types/
        └── database.ts
```

---

## 10. Preferências do usuário

- Respostas em português (pt-BR), tom profissional e objetivo
- Estrutura explícita (títulos, listas, tabelas)
- Metodologia e premissas sempre claras
- Postura cética: questionar premissas, apontar riscos
- Orientação a resultados: recomendações acionáveis
- Agnóstico de marcas na nomenclatura (sem "propaganda" gratuita)
- Nome do usuário: Claudio
- Windows 10/11, PowerShell
- **Instruções de terminal: um comando por vez, sem misturar texto explicativo com comandos copiáveis**
- Projeto pessoal, single-user escalável para família (2-4 usuários)

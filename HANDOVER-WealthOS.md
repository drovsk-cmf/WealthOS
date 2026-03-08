# WealthOS - Handover de Sessão

**Data:** 08 de março de 2026
**Projeto:** WealthOS - Sistema Integrado de Gestão Financeira e Patrimonial
**Repositório GitHub:** drovsk-cmf/WealthOS (privado)
**Supabase Project ID:** hmwdfcsxtmbzlslxgqus
**Google Drive:** Meu Drive > 00. Novos Projetos > WealthOS > Documentacao/

---

## 1. O que é o WealthOS

Sistema de gestão financeira e patrimonial para uso pessoal, posicionado como "Sistema Operativo de Riqueza" (não um expense tracker). Público-alvo: profissionais de alta renda com múltiplas fontes de receita e complexidade fiscal ("The Hybrid Earner"). Foco em blindagem patrimonial, eficiência tributária e privacidade.

**Modelo contábil:** partida dobrada como motor interno (invisível ao usuário), com plano de contas híbrido (CPC simplificado por baixo, linguagem natural na interface). Filosofia Apple: mecânica complexa invisível, resultado simples entregue ao usuário.

**Diferencial implementado:** Inteligência de Provisionamento de IR. Calcula projeção anual IRPF baseada em múltiplas fontes de renda, aplica tabela progressiva + redução Lei 15.270/2025, compara com IRRF retido, e recomenda valor mensal a provisionar. Resolve o cenário de pessoa com 2+ contratos CLT sem retenção individual.

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Backend/BaaS | Supabase (PostgreSQL + Auth + RLS + Storage + Edge Functions) |
| Mobile iOS | Capacitor 6 (empacotamento PWA para App Store) |
| Hospedagem | Vercel |
| State Management | React Query + Zustand |
| Gráficos | Recharts |
| Validação | Zod |
| CI/CD | GitHub Actions |
| APIs externas | BCB SGS (6.922 séries) + IBGE SIDRA (9.029 tabelas) + fallback IPEADATA |

---

## 3. Estado Atual do Projeto

### 3.1 Fases Concluídas

| Fase | Escopo | Status |
|---|---|---|
| 0. Setup | Repo, Supabase, Next.js, Capacitor, CI/CD, schema v1.0 | CONCLUÍDA |
| 1. Auth + Segurança | Login, MFA TOTP, RLS, biometria stub, session timeout | CONCLUÍDA |
| 1.5 Schema Contábil | 10 novas tabelas, 12 ENUMs, triggers, seed 140 contas | CONCLUÍDA |
| 2. Financeiro (Core) | CRUD contas/categorias/transações, motor contábil, plano de contas, centros | CONCLUÍDA |
| 3. Dashboard + Orçamento | Balanço patrimonial, solvência, gráficos, orçamento | CONCLUÍDA |
| 4. Contas a Pagar + Patrimônio | Recorrências, bens, depreciação, alertas | CONCLUÍDA |
| 5. Centros Avançados | Rateio, P&L por centro, exportação CSV/JSON | CONCLUÍDA |
| 6. Workflows | Tarefas periódicas, auto-criação, checklist | CONCLUÍDA |
| 7. Fiscal Integrado | Relatório fiscal, provisionamento IR, parâmetros vigentes | CONCLUÍDA |
| 8. Índices Econômicos | BCB SGS, IPCA, Selic, gráficos, coleta manual | CONCLUÍDA |

### 3.2 Banco de Dados (Supabase)

| Métrica | Valor |
|---|---|
| Tabelas | 23 (todas com RLS ativo) |
| Políticas RLS | 76 |
| Functions | 29 |
| Triggers | 16 |
| ENUMs | 21 |
| Migrations aplicadas | 18 partes em 9 versões (001 a 009) |
| Contas no plano-semente | 140 |
| Centros de custo | 2 |
| Categorias | 32 |
| Parâmetros fiscais | 7 (IRPF mensal/anual 2025+2026, INSS, salário mínimo, ganho capital) |
| Índices econômicos | 24 registros reais (IPCA + Selic, mar/2025 a mar/2026) |
| Fontes de índices | 15 (BCB SGS + IBGE SIDRA configuradas) |
| User stories total | 90 |
| Stories concluídas | 65 |

### 3.3 Functions (29 no banco)

| Grupo | Functions |
|---|---|
| Setup/Seed | create_default_categories, create_default_chart_of_accounts, create_default_cost_center, handle_new_user |
| Triggers | handle_updated_at, recalculate_account_balance, activate_account_on_use, rls_auto_enable |
| Transaction Engine | create_transaction_with_journal, reverse_transaction |
| Dashboard | get_dashboard_summary, get_balance_sheet, get_solvency_metrics, get_top_categories, get_balance_evolution, get_budget_vs_actual |
| Recurrence/Asset | generate_next_recurrence, depreciate_asset, get_assets_summary |
| Centers | allocate_to_centers, get_center_pnl, get_center_export |
| Workflows | auto_create_workflow_for_account, generate_tasks_for_period, complete_workflow_task |
| Fiscal | get_fiscal_report, get_fiscal_projection |
| Índices | get_economic_indices, get_index_latest |

### 3.4 Código Fonte (68 arquivos em src/)

```
src/
├── app/
│   ├── (app)/                    # Rotas autenticadas (13 páginas)
│   │   ├── accounts/page.tsx
│   │   ├── assets/page.tsx
│   │   ├── bills/page.tsx
│   │   ├── budgets/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── chart-of-accounts/page.tsx
│   │   ├── cost-centers/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── indices/page.tsx
│   │   ├── settings/page.tsx + security/page.tsx
│   │   ├── tax/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── workflows/page.tsx
│   │   └── layout.tsx            # Sidebar com 14 links
│   ├── (auth)/                   # Auth flow (6 páginas)
│   │   ├── login, register, onboarding, mfa-challenge,
│   │   ├── forgot-password, reset-password
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/callback/route.ts
│   │   └── indices/fetch/route.ts  # Coleta BCB SGS
│   └── layout.tsx, globals.css
├── components/                   # 11 componentes
│   ├── accounts/account-form.tsx
│   ├── assets/asset-form.tsx
│   ├── budgets/budget-form.tsx
│   ├── categories/category-form.tsx
│   ├── dashboard/ (8 componentes + index.ts)
│   ├── recurrences/recurrence-form.tsx
│   └── transactions/transaction-form.tsx
├── lib/
│   ├── auth/ (6 arquivos: encryption, mfa, biometric, session, blocklist)
│   ├── crypto/index.ts
│   ├── hooks/ (12 hooks: accounts, assets, budgets, categories,
│   │          chart-of-accounts, cost-centers, dashboard, economic-indices,
│   │          fiscal, recurrences, transactions, workflows)
│   ├── services/transaction-engine.ts
│   ├── supabase/ (client.ts, server.ts)
│   ├── utils/index.ts
│   ├── validations/auth.ts
│   └── query-provider.tsx
├── middleware.ts                  # Root redirect, auth check, session refresh
└── types/database.ts             # 23 tables, 29 functions, 21 enums typed
```

---

## 4. Dados do Usuário de Teste

- ID: 04c41302-5429-4f97-9aeb-e21294d014ff
- Nome: Claudio Filho
- Provider: Google OAuth
- MFA: TOTP ativo (fator 664baa78-1060-4b5b-ae78-e4bc2a6e8fe4)
- onboarding_completed: true
- Dados seed: 140 contas contábeis, 2 centros, 32 categorias
- Transações: 0 (nenhum dado financeiro de teste ainda)
- Contas bancárias: 0

---

## 5. Plano de Fases Detalhado

| Fase | Escopo | Status | Stories |
|---|---|---|---|
| 0. Setup | Repo, Supabase, Next.js, CI/CD | CONCLUÍDA | - |
| 1. Auth + Segurança | Login, MFA, RLS, biometria | CONCLUÍDA | AUTH-01 a AUTH-08 |
| 1.5 Schema Contábil | Migration v2.0, seed 140 contas | CONCLUÍDA | - |
| 2. Financeiro (Core) | CRUD transações + journal_entries | CONCLUÍDA | FIN-01-15, CTB-01-04, CEN-01-02 |
| 3. Dashboard + Orçamento | Balanço patrimonial, solvência, orçamento | CONCLUÍDA | DASH-01-12, CTB-05, ORC-01-06 |
| 4. Contas a Pagar + Patrimônio | Recorrências, bens, depreciação | CONCLUÍDA | CAP-01-06, PAT-01-07 |
| 5. Centros Avançados | Rateio, P&L por centro, export | CONCLUÍDA | CEN-03-05 |
| 6. Workflows | Automações, tarefas, checklist | CONCLUÍDA | WKF-01-04 |
| 7. Fiscal Integrado | tax_treatment, provisionamento IR | CONCLUÍDA | FIS-01-06 |
| 8. Índices Econômicos | BCB/SIDRA, gráficos, coleta | CONCLUÍDA | Extra-stories |
| **9. Integração Bancária** | **Open Finance via agregador** | **PRÓXIMO** | **BANK-01-06** |
| 10. Polish + App Store | PWA, Capacitor, submissão | Pendente | - |

---

## 6. Próximo: Fase 9 (Integração Bancária)

### 6.1 Stories a implementar

| Story | Título | Critérios resumidos |
|---|---|---|
| BANK-01 | Conectar conta bancária via agregador | Widget do agregador abre, usuário autoriza, conexão salva em bank_connections |
| BANK-02 | Importar transações automaticamente | Fetch de transações do agregador, mapeamento para transactions + journal_entries |
| BANK-03 | Categorizar transações importadas | Pipeline de categorização: regras por descrição, sugestão ML futura |
| BANK-04 | Reconciliar saldos | Saldo contábil vs saldo bancário, sinalização de divergências |
| BANK-05 | Atualizar conexão | Re-autorizar quando token expira, status de saúde da conexão |
| BANK-06 | Desconectar conta | Remove conexão, mantém transações já importadas |

### 6.2 Arquitetura definida (adendo v1.3)

- Acesso via agregador certificado (Pluggy ou Belvo), NÃO direto aos bancos
- Interface TypeScript agnóstica: `BankingProvider` com adapters
- Tabela `bank_connections` (definida mas NÃO criada no banco ainda)
- Widget Connect do agregador (iframe/modal) para autorização
- Pipeline: fetch → deduplicate → categorize → create transactions

### 6.3 O que falta definir antes de implementar

| Item | Status | Ação |
|---|---|---|
| Escolha do agregador (Pluggy vs Belvo) | PENDENTE | Claudio deve decidir ou aceitar recomendação |
| Conta sandbox no agregador | PENDENTE | Criar conta de desenvolvimento |
| API keys do agregador | PENDENTE | Obter após criar conta |
| Cobertura BTG Banking / Banco XP | PENDENTE | Confirmar com agregador se cobre conta corrente (não só corretora) |
| Custo do agregador | Referência: R$ 1.000-3.000/mês | Confirmar pricing atual |
| Certificação para produção | PENDENTE | Processo com o agregador (sandbox → produção) |

### 6.4 Recomendação técnica

Tendência: Pluggy (developer-first, foco PFM, ITP autorizada pelo BC). Mas a arquitetura é agnóstica: se mudar para Belvo depois, basta trocar o adapter.

### 6.5 Opção alternativa sem agregador

Se o agregador não estiver pronto, a Fase 9 pode ser implementada como:
1) Tabela bank_connections + UI de gerenciamento
2) Import manual aprimorado (CSV/OFX parsing)
3) Pipeline de categorização automática
4) Reconciliação manual de saldos
5) Stub do adapter para conexão futura com agregador

Isso entrega valor imediato (import + categorização) sem depender de terceiro.

---

## 7. Items de Polish (Fase 10 backlog)

| Item | Detalhe |
|---|---|
| PWA icon 404 | Criar `/public/icons/icon-192.png` e `icon-512.png` |
| Euro sem símbolo | Tela de Settings, moeda Euro falta "(€)" |
| Next.js upgrade | 14.2.14 → 15+ (security fix, breaking change) |
| OCR real | WKF-03 é stub; implementar Apple Vision / Tesseract.js |
| Capacitor build | Build iOS, teste em dispositivo, submissão App Store |
| Testes | Jest + React Testing Library, cobertura mínima |
| Edge Functions | pg_cron para generate-recurring-transactions, fetch-economic-indices, etc. |
| Redirect raiz | CORRIGIDO na sessão (middleware + callback normalizam `/` → `/dashboard`) |

---

## 8. Documentação de Referência (8 documentos no projeto)

| Doc | Conteúdo chave |
|---|---|
| wealthos-especificacao-v1.docx | Stack, segurança, modelo de dados original, módulos, fases |
| wealthos-funcional-v1.docx | 62 user stories MVP com critérios de aceite |
| wealthos-adendo-v1.1.docx | Decisões (2 saldos, carência 7d, E2E, APNs) |
| wealthos-adendo-v1.2.docx | Apple App Store, importação, OCR, offline, a11y |
| wealthos-adendo-v1.3.docx | **Integração bancária Open Finance** (Pluggy/Belvo, BANK-01-06, pendências) |
| wealthos-adendo-v1.4.docx | Solvência (LCR, runway), evoluções futuras (9 items) |
| wealthos-estudo-contabil-v1.5-final.docx | Modelo contábil partida dobrada, 133 contas, centros, workflows |
| wealthos-estudo-tecnico-v2.0.docx | Estudo técnico completo, 10 tabelas, triggers, RPCs, fases revisadas |

---

## 9. Catálogos de Dados Externos

Disponíveis como arquivos do projeto:
- `catalogo_ibge_sidra_filter.xlsx` - 9.029 tabelas IBGE
- `catalogo_bcb_sgs_filter.xlsx` - 6.922 séries BCB SGS

---

## 10. Preferências do Usuário

- Respostas em português (pt-BR), tom profissional e objetivo
- Estrutura explícita (títulos, listas, tabelas)
- Metodologia e premissas sempre claras
- Postura cética: questionar premissas, apontar riscos
- Orientação a resultados: recomendações acionáveis
- Agnóstico de marcas na nomenclatura
- Nome do usuário: Claudio
- Projeto pessoal, single-user escalável para família (2-4 usuários)
- Windows 10/11 com PowerShell (terminal: um comando por vez)
- Nunca rodar `npm audit fix --force` (quebra versões)

---

## 11. Conexões

- **GitHub:** Fine-grained PAT e Classic PAT disponíveis (Claudio fornece no início da sessão)
- **Supabase:** via conector MCP remoto (mcp.supabase.com/mcp), autenticado por OAuth. Project ID: hmwdfcsxtmbzlslxgqus
- **Local dev:** `C:\Users\claud\Documents\PC_WealthOS`, `.env.local` já configurado

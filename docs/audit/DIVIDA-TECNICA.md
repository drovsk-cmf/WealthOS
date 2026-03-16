# Oniefy - Auditoria de Dívida Técnica (Linha por Linha)

**Data início:** 2026-03-16
**Auditor:** Claude (sessão com Claudio)
**Escopo:** 118 arquivos TypeScript/TSX em `src/`, 22.045 linhas
**Referência:** HANDOVER-WealthOS.md, docs/audit/, especificações v1.0-v1.5
**Status:** EM ANDAMENTO (15/118 arquivos auditados nesta sessão)

---

## Metodologia

### Objetivo
Identificar toda dívida técnica, item incompleto, stub, inconsistência entre especificação e código, dead code, e risco latente. Zero tolerância para "resolver depois" sem registro formal.

### Processo por arquivo
Para cada arquivo do `src/`, verificar:
1. Código morto ou unreachable
2. Stubs ou implementações parciais
3. Inconsistência com especificação (HANDOVER, adendos, estudo contábil)
4. Erros de lógica ou edge cases não tratados
5. Validações ausentes (input, limites, tipos)
6. Segurança (XSS, injection, exposição de dados, RLS bypass)
7. Acessibilidade (WCAG AA) residual
8. Performance (queries N+1, re-renders, payloads excessivos)
9. Internacionalização (hardcoded pt-BR onde deveria ser dinâmico)
10. Referências a tabelas/colunas/RPCs que não existem ou não são usadas
11. Dependências entre arquivos quebradas ou circulares

### Classificação de severidade
- **S1 BLOQUEANTE:** impede deploy ou causa perda de dados
- **S2 GRAVE:** funcionalidade prometida não entregue ou bug silencioso
- **S3 MODERADO:** dívida técnica que degrada com escala
- **S4 MENOR:** inconsistência cosmética ou de estilo
- **S5 INFORMATIVO:** observação para decisão futura

### Disposição por achado
- **CORRIGIR:** deve ser resolvido antes do deploy
- **ACEITAR:** risco conhecido, documentado, com gatilho de revisão
- **REMOVER:** dead code ou tabela obsoleta a eliminar
- **COMPLETAR:** funcionalidade parcial que precisa ser terminada ou desabilitada na UI

---

## Achados

### DT-001 | S2 GRAVE | CORRIGIR
**Arquivo:** `src/lib/auth/encryption-manager.ts` L98-113
**Descrição:** `loadEncryptionKey()` re-inicializa criptografia silenciosamente quando `kek_material` ou DEK está ausente. Se o perfil no banco sofrer perda parcial de dados (kek_material apagado por bug, migration, ou reset), a função gera novas chaves sem avisar o usuário. Todos os campos previamente encriptados (`cpf_encrypted`, `notes_encrypted`) ficam permanentemente irrecuperáveis.
**Impacto:** Perda silenciosa de dados encriptados. Usuário não percebe até tentar ler um CPF ou nota encriptada e receber lixo ou erro.
**Correção proposta:** Em vez de re-inicializar automaticamente, exibir alerta ao usuário: "Chave de criptografia não encontrada. Dados encriptados anteriores podem estar inacessíveis. Deseja gerar uma nova chave?" Logar o evento como incident.

### DT-002 | S4 MENOR | CORRIGIR
**Arquivo:** `src/lib/config/env.ts` L21, `src/lib/crypto/index.ts` L62, `src/lib/auth/encryption-manager.ts` L29
**Descrição:** Referências ao nome "WealthOS" remanescentes após rebranding para Oniefy:
- env.ts: `[WealthOS] Variáveis de ambiente...`
- crypto/index.ts: HKDF info string `"wealthos-e2e-kek-v2"`
- encryption-manager.ts: HKDF salt `"wealthos-kek-salt-v2"`
**Impacto:** Cosmético nos logs; HKDF info/salt são constantes internas que NÃO devem ser alteradas (mudar quebraria a derivação de chaves existentes). Apenas a mensagem de erro do env.ts deve ser atualizada.
**Correção proposta:** Atualizar apenas a mensagem de erro em env.ts para "[Oniefy]". Marcar os HKDF strings com comentário "// DO NOT CHANGE - changing breaks existing key derivation".

### DT-003 | S3 MODERADO | CORRIGIR
**Arquivo:** `src/lib/auth/use-app-lifecycle.ts` L89, L104
**Descrição:** Dois `console.info` usam `// eslint-disable-next-line no-console` em vez de `if (process.env.NODE_ENV === "development")`. Em build de produção via Capacitor (iOS), esses logs apareceriam no console do dispositivo.
**Impacto:** Vazamento de informação sobre ciclo de vida da DEK em produção mobile.
**Correção proposta:** Envolver em `if (process.env.NODE_ENV === "development")` como feito nos demais arquivos.

### DT-004 | S2 GRAVE | COMPLETAR
**Arquivo:** `src/lib/auth/use-biometric.ts` L46-48
**Descrição:** Em plataforma iOS (Capacitor), o stub reporta `available: true` e `biometricType: "face_id"` sem nenhuma verificação real. A página de segurança (`settings/security/page.tsx`) exibe controle de Face ID com toggle funcional que seta `enrolled: true` em state local, mas não persiste e não protege nada.
**Impacto:** Usuário em iOS vê "Face ID" disponível, ativa, e acredita estar protegido. Falsa sensação de segurança. Na web, `available` é `false` e a seção é oculta (correto).
**Correção proposta:** (A) Ocultar a seção de biometria no settings quando `detectPlatform() === "web"` (já ocorre). (B) Quando em iOS sem plugin real, exibir "Biometria disponível após instalação pelo App Store" em vez de controles funcionais. (C) Nunca exibir toggle de Face ID sem plugin real instalado.

### DT-005 | S2 GRAVE | COMPLETAR
**Arquivo:** Múltiplos - 6 tabelas no banco
**Descrição:** 6 tabelas existem no schema mas têm zero referências no código frontend:
1. `documents` - Upload de comprovantes (FIN-17, WKF-03)
2. `notification_tokens` - Device tokens APNs (CFG-04)
3. `notification_log` - Log de push enviados (CFG-04)
4. `monthly_snapshots` - Foto mensal patrimônio (DASH-09-12 solvência)
5. `center_allocations` - Rateio entre centros (CEN-03)
6. `tax_records` - Marcada como "depreciada" no estudo contábil v1.5
**Impacto:**
- `monthly_snapshots` é a mais grave: solvency panel calcula on-the-fly mas não persiste histórico. "Como estava meu runway 3 meses atrás?" não tem resposta.
- `documents` + `notification_*`: stories CFG-04, FIN-17, FIN-18 bloqueadas por Mac mas tabelas ocupam schema sem uso.
- `tax_records`: lixo de schema v1.0, deveria ter sido removida.
- `center_allocations`: hook `allocate_to_centers` existe mas nenhuma UI chama.
**Correção proposta:**
- `monthly_snapshots`: criar pg_cron job que persiste snapshot mensal (RPC `generate_monthly_snapshot`). Sem isso, DASH-09-12 são parcialmente inválidos.
- `tax_records`: migration para DROP (ou documentar formalmente como "reservada para uso futuro").
- `documents`, `notification_*`: documentar como "schema preparado para Fase 10, sem frontend" no HANDOVER.
- `center_allocations`: criar UI mínima de rateio ou remover RPC/tabela.

### DT-006 | S3 MODERADO | CORRIGIR
**Arquivo:** `src/lib/services/transaction-engine.ts` L107-118
**Descrição:** Após criação atômica via RPC `create_transaction_with_journal`, o código executa 2 UPDATEs separados para `family_member_id` e `category_source`. Esses UPDATEs:
(a) Quebram a atomicidade (se falharem, transação existe sem o dado)
(b) Disparam trigger `recalculate_account_balance` desnecessariamente (esses campos não afetam saldo)
**Impacto:** Performance (2 trigger fires extras por transação) + atomicidade parcial.
**Correção proposta:** Adicionar `p_family_member_id` e `p_category_source` como parâmetros ao RPC `create_transaction_with_journal` no banco.

### DT-007 | S3 MODERADO | ACEITAR
**Arquivo:** Todos os hooks com `select()` explícito + cast `as Type[]`
**Descrição:** Após substituir `select("*")` por colunas explícitas, o cast `as Account[]` (e similares) continua declarando que o retorno tem TODAS as colunas. Campos omitidos (`bank_connection_id`, `coa_id`, `external_account_id` etc.) seriam `undefined` em runtime, mas TypeScript não alerta.
**Impacto:** Se qualquer componente acessar um campo não-selecionado, erro silencioso (`undefined` onde esperava `string | null`). O risco é baixo porque os componentes de listagem geralmente só usam os campos exibidos, mas não há garantia.
**Correção proposta:** Criar types `AccountListItem`, `CategoryListItem` etc. com apenas os campos selecionados. Escopo grande (~20 types + atualizar consuming components). Aceitar com gatilho: corrigir se qualquer bug de "campo undefined" aparecer.
**Gatilho de revisão:** Bug report de campo undefined em listagens.

### DT-008 | S2 GRAVE | CORRIGIR
**Arquivo:** Nenhum arquivo específico - ausência sistêmica
**Descrição:** Nenhum cron job popula `monthly_snapshots`. A especificação (Adendo v1.1 §4, Adendo v1.4 DASH-09-12) define que snapshots mensais devem ser gerados automaticamente com: `total_balance`, `total_income`, `total_expense`, `total_assets`, `burn_rate`, `lcr`, `runway_months`. O `SolvencyPanel` calcula tudo on-the-fly via RPC `get_solvency_metrics`. Não há persistência.
**Impacto:** Impossibilidade de análise temporal de solvência. Usuário não pode ver tendência de burn rate, evolução do LCR, ou comparar runway mês a mês. Invalida parcialmente DASH-09-12.
**Correção proposta:** Criar RPC `generate_monthly_snapshot(p_user_id)` + pg_cron job mensal (dia 1, 04h UTC). A RPC deve chamar `get_solvency_metrics` + `get_dashboard_summary` e persistir em `monthly_snapshots`. Estimar: 2-3h.

### DT-009 | S2 GRAVE | COMPLETAR
**Arquivo:** `src/app/(app)/workflows/page.tsx` L10, L99
**Descrição:** WKF-03 (Upload documento na task) é um stub que apenas marca a task como "completo com nota". Comentário no código: "WKF-03: Upload stub (full OCR in Phase 10)". Porém:
- A tabela `documents` existe no banco
- O Storage bucket `documents` existe no Supabase
- Tesseract.js (web fallback) está especificado no Adendo v1.2 e NÃO requer Mac
- O OCR nativo (Apple Vision) requer Mac, mas o upload básico + OCR web não
**Impacto:** Workflow de extrato bancário pede "upload do extrato" mas não aceita upload. Usuário vê uma task que não pode completar de verdade.
**Correção proposta:** (A) Implementar upload de arquivo para documents (sem OCR) como passo mínimo. Ou (B) remover WKF-03 das tasks geradas e documentar como "Fase 10". A opção (A) é preferível: upload sem OCR é ~2h de trabalho e torna o workflow funcional.

### DT-010 | S2 GRAVE | CORRIGIR
**Arquivo:** Ausência - `recalculate_account_balance` trigger (no banco)
**Descrição:** D6.15 da auditoria foi excluído como "refactor complexo, sessão dedicada". O trigger `recalculate_account_balance` dispara `FOR EACH ROW` em INSERT/UPDATE/DELETE na tabela `transactions`. Para cada operação, faz 2 SUMs completos na conta. No import de 200 transações, isso gera 200 × 2 = 400 full-table SUMs.
**Impacto:** Import de extratos com >100 transações será progressivamente lento. Com 1000+ transações na conta, cada import pode levar minutos.
**Correção proposta:** No RPC `import_transactions_batch`, desabilitar o trigger antes do batch INSERT e recalcular uma vez no final: `ALTER TABLE transactions DISABLE TRIGGER recalculate_account_balance; ... INSERT batch ...; SELECT recalculate_account_balance_for_accounts(affected_account_ids); ALTER TABLE transactions ENABLE TRIGGER recalculate_account_balance;`. Estimar: 3-4h.

### DT-011 | S3 MODERADO | CORRIGIR
**Arquivo:** `src/app/(app)/settings/security/page.tsx` L209 (referência)
**Descrição:** D8.01 da auditoria foi excluído como "requer componente Dialog reutilizável". Os 6 formulários modais (AccountForm, BudgetForm, AssetForm, RecurrenceForm, TransactionForm, CategoryForm) não implementam focus trap. O `role="dialog"` e `aria-modal` foram adicionados apenas ao sidebar mobile.
**Impacto:** Usuário de teclado pode navegar para elementos atrás do modal. Violação WCAG 2.4.3.
**Correção proposta:** Instalar `focus-trap-react` e envolver cada modal em `<FocusTrap>`. Alternativa: hook `useFocusTrap` customizado. Estimar: 1-2h.

### DT-012 | S2 GRAVE | COMPLETAR
**Arquivo:** Ausência sistêmica
**Descrição:** D7.03 da auditoria: transações não podem ser editadas, apenas estornadas. O modelo append-only (journal entries imutáveis) é correto contabilmente, mas a UX precisa de um "editar" que internamente faça estorno + relançamento com novos valores. A funcionalidade "Duplicar" (D7.07) foi implementada mas não resolve: duplicar cria uma nova transação; o usuário precisa estornar a original manualmente.
**Impacto:** Corrigir data, valor ou categoria de uma transação requer 2 ações manuais (estornar + recriar). Para um app financeiro, isso é um gap de UX significativo.
**Correção proposta:** Criar `useEditTransaction` que internamente chama `reverse_transaction` + `create_transaction_with_journal` em sequência, preservando o ID original como referência. UI: botão "Editar" abre TransactionForm pré-preenchido; ao salvar, executa estorno+relançamento atomicamente. Estimar: 4-6h.

### DT-013 | S4 MENOR | CORRIGIR
**Arquivo:** `src/lib/hooks/use-accounts.ts` L76 (e outros hooks)
**Descrição:** Indentação inconsistente no `queryFn` do `useAccounts`: o `queryFn` tem indentação extra (`      queryFn:` em vez de `    queryFn:`).
**Impacto:** Zero funcional. Inconsistência de estilo.

### DT-014 | S3 MODERADO | ACEITAR
**Arquivo:** `src/lib/hooks/use-accounts.ts` L147-149
**Descrição:** Criação de conta faz 2 operações não-atômicas: (1) `create_coa_child` RPC, (2) `INSERT accounts`. Se o INSERT falhar, fica um COA órfão.
**Impacto:** COA órfão não causa dano funcional (apenas suja o plano de contas), mas viola a integridade referencial esperada.
**Gatilho de revisão:** Se volume de contas criadas/deletadas for alto, fazer cleanup periódico de COA sem conta associada.

### DT-015 | S5 INFORMATIVO | ACEITAR
**Arquivo:** `src/app/(app)/accounts/page.tsx`, `src/app/(app)/cost-centers/page.tsx`
**Descrição:** A exclusão de contas e centros de custo faz soft-delete (`is_active: false`). Não há pg_cron para limpeza de registros soft-deleted antigos (>90 dias). O HANDOVER §12.6 lista isso como "evolução futura".
**Gatilho de revisão:** Volume de dados soft-deleted justificar limpeza automática.

---

## Arquivos auditados

| # | Arquivo | Linhas | Status | Achados |
|---|---------|--------|--------|---------|
| 1 | src/lib/supabase/client.ts | 9 | ✅ Auditado | 0 |
| 2 | src/lib/supabase/server.ts | 56 | ✅ Auditado | 0 |
| 3 | src/lib/config/env.ts | 34 | ✅ Auditado | DT-002 |
| 4 | src/lib/auth/encryption-manager.ts | 131 | ✅ Auditado | DT-001, DT-002 |
| 5 | src/lib/crypto/index.ts | 148 | ✅ Auditado | DT-002 |
| 6 | src/lib/auth/mfa.ts | 162 | ✅ Auditado | 0 |
| 7 | src/lib/auth/use-biometric.ts | 72 | ✅ Auditado | DT-004 |
| 8 | src/lib/auth/use-app-lifecycle.ts | 148 | ✅ Auditado | DT-003 |
| 9 | src/lib/auth/use-session-timeout.ts | 57 | ✅ Auditado | 0 |
| 10 | src/lib/auth/timing-safe.ts | 28 | ✅ Auditado | 0 |
| 11 | src/lib/auth/password-blocklist.ts | 195 | ✅ Auditado | 0 |
| 12 | src/lib/auth/index.ts | 18 | ✅ Auditado | 0 |
| 13 | src/lib/services/transaction-engine.ts | 197 | ✅ Auditado | DT-006 |
| 14 | src/lib/hooks/use-transactions.ts | 126 | ✅ Auditado | DT-007 |
| 15 | src/lib/hooks/use-accounts.ts | 245 | ✅ Auditado | DT-007, DT-013, DT-014 |
| 16-118 | (restantes - 103 arquivos) | ~20.000 | ⏳ Pendente | - |

### Achados sistêmicos (encontrados via varredura cruzada, não leitura de arquivo específico)

| # | Achado | Arquivos |
|---|--------|----------|
| DT-005 | 6 tabelas sem frontend | Schema + todos os hooks |
| DT-008 | monthly_snapshots sem cron | Ausência de RPC/cron |
| DT-009 | WKF-03 stub | workflows/page.tsx |
| DT-010 | Trigger O(n²) em import | Banco (trigger) |
| DT-011 | Focus trap ausente em 6 modais | 6 componentes form |
| DT-012 | Edição de transação inexistente | Ausência sistêmica |

---

## Resumo parcial (15/118 arquivos)

| Severidade | Quantidade |
|-----------|-----------|
| S1 BLOQUEANTE | 0 |
| S2 GRAVE | 6 (DT-001, DT-004, DT-005, DT-008, DT-009, DT-012) |
| S3 MODERADO | 4 (DT-003, DT-006, DT-007, DT-011) |
| S4 MENOR | 2 (DT-002, DT-013) |
| S5 INFORMATIVO | 1 (DT-015) |
| **Total** | **13** |

| Disposição | Quantidade |
|-----------|-----------|
| CORRIGIR | 7 |
| ACEITAR | 3 |
| REMOVER | 0 |
| COMPLETAR | 3 |

---

## Plano de continuação

### Próxima sessão (prioridade de leitura)

**Bloco 1 - Hooks restantes (15 arquivos, ~3900 linhas):**
- use-budgets.ts (392 linhas) - orçamento é feature core
- use-assets.ts (363 linhas) - patrimônio + depreciação
- use-recurrences.ts (362 linhas) - contas a pagar
- use-workflows.ts (358 linhas) - workflows/stubs
- use-cost-centers.ts (312 linhas) - centros + rateio
- use-dashboard.ts (285 linhas) - RPCs do dashboard
- use-fiscal.ts (202 linhas) - módulo fiscal
- use-bank-connections.ts (197 linhas) - conexões
- use-family-members.ts (188 linhas) - membros
- use-economic-indices.ts (183 linhas) - índices
- use-reconciliation.ts (164 linhas) - conciliação
- use-categories.ts (142 linhas)
- use-chart-of-accounts.ts (131 linhas)
- use-auto-category.ts (111 linhas)
- use-progressive-disclosure.ts (79 linhas)

**Bloco 2 - Pages/Components (67 arquivos, ~12000 linhas):**
- Todos os arquivos em src/app/ e src/components/

**Bloco 3 - Infra (20 arquivos, ~2000 linhas):**
- Parsers, schemas, stores, validations, middleware, types

**Bloco 4 - Banco de dados:**
- Verificar cada RPC/trigger/cron contra a spec
- Verificar RLS coverage por tabela
- Verificar índices vs queries usadas

### Critério de conclusão
- 118/118 arquivos lidos e registrados na tabela
- 0 achados sem disposição atribuída
- Todos os achados CORRIGIR implementados ou convertidos em tasks com estimativa

### DT-016 | S2 GRAVE | COMPLETAR
**Arquivo:** Ausência - cron job `generate-recurring-transactions`
**Descrição:** O Adendo v1.1 especifica um cron diário `generate-recurring-transactions` que gera automaticamente transações pendentes para recorrências cujo `next_due_date` chegou. Este cron **não existe**. A função `generate_next_recurrence` é chamada **apenas** quando o usuário paga uma conta (`usePayBill`). Se o usuário não pagar, a próxima ocorrência nunca é gerada.
**Impacto:** Cenário: aluguel R$3.000 mensal, vence dia 5. Se o usuário não pagar até dia 5, nenhuma transação é criada para o mês seguinte. O painel de "Contas Pendentes" mostra apenas 1 item eternamente. Impossível ver projeção de contas futuras. Invalida parcialmente CAP-04 (listar pendentes) e CAP-06 (alertas de vencimento).
**Correção proposta:** Criar `cron_generate_recurring_transactions()` que itera sobre recorrências ativas com `next_due_date <= today` e chama `generate_next_recurrence` para cada. Agendar como pg_cron diário (01:30 UTC). Estimar: 2-3h.

### DT-017 | S3 MODERADO | CORRIGIR
**Arquivo:** `src/lib/parsers/xlsx-parser.ts` L26
**Descrição:** `XLSX.read(buffer, ...)` não está envolvido em try/catch. Um arquivo Excel malformado ou corrompido fará o import wizard crashar sem feedback ao usuário. Os parsers CSV e OFX têm error handling adequado.
**Impacto:** Crash silencioso ao importar XLSX corrompido.
**Correção proposta:** Envolver `XLSX.read` em try/catch e retornar resultado vazio com erro descritivo.

### DT-018 | S2 GRAVE | CORRIGIR
**Arquivo:** `src/components/recurrences/recurrence-form.tsx`, `src/components/budgets/budget-form.tsx`
**Descrição:** Os formulários de recorrência e orçamento oferecem opções de reajuste por índice (IPCA, IGP-M, INPC, Selic), mas **apenas o reajuste manual funciona**. A RPC `generate_next_recurrence` contém comentário explícito: "automatic index adjustment (IPCA, etc.) will be handled by the fetch-economic-indices Edge Function in Phase 8. For now, only manual adjustment is applied." Porém, os índices econômicos já são coletados (cron_fetch_indices existe). A conexão entre os dados de índice e o ajuste automático nunca foi implementada.
**Impacto:** Usuário seleciona "IPCA" para reajustar aluguel e espera que o valor suba automaticamente. Nada acontece. Expectativa quebrada.
**Correção proposta:** (A) Implementar a lógica de ajuste na RPC `generate_next_recurrence`: buscar último valor do índice em `economic_indices`, calcular variação, aplicar ao amount. Ou (B) Remover opções IPCA/IGP-M/INPC/Selic da UI e manter apenas "Manual" e "Sem reajuste" até a implementação estar pronta. A opção (B) é mais honesta e leva 10 minutos.

### DT-019 | S3 MODERADO | CORRIGIR
**Arquivo:** `src/lib/hooks/use-budgets.ts` L200 (useBudgetMonths)
**Descrição:** `useBudgetMonths` busca TODOS os budgets do usuário (`select("month")`) e deduplica client-side com `new Set(data.map(b => b.month))`. Para um usuário com 12 meses × 20 categorias = 240 registros, transfere 240 rows para extrair ~12 valores únicos. Deveria usar `SELECT DISTINCT month`.
**Impacto:** Over-fetching proporcional ao histórico de orçamentos.
**Correção proposta:** Substituir por RPC ou view que retorna `DISTINCT month`. Alternativa: usar `.select("month")` com `.limit(120)` e filtro no banco via função. Não é bloqueante, mas é preguiça técnica.

### DT-020 | S4 MENOR | CORRIGIR
**Arquivo:** `src/components/onboarding/route-manual-step.tsx` L237, `src/components/onboarding/route-snapshot-step.tsx` L194
**Descrição:** Labels monetários hardcoded "R$" nas telas de onboarding, apesar do onboarding pedir ao usuário para escolher a moeda padrão (BRL, USD, EUR). Se o usuário escolher EUR, os labels ainda dizem "R$".
**Impacto:** Inconsistência visual se moeda não for BRL. Na prática, 99% dos usuários usarão BRL (público-alvo brasileiro), mas viola o princípio de coerência interna.
**Correção proposta:** Passar `currencySymbol` do step de seleção de moeda para os steps seguintes.

### DT-021 | S3 MODERADO | CORRIGIR
**Arquivo:** `src/app/(app)/tax/page.tsx` L175
**Descrição:** Hardcoded `"R$ 0,00"` como fallback de formatação no módulo fiscal. Deveria usar `formatCurrency(0)`.
**Impacto:** Se moeda for diferente de BRL, exibe "R$ 0,00" em vez do símbolo correto.
**Correção proposta:** `formatCurrency(0)` ou `formatCurrency(0, currency)`.

### DT-022 | S5 INFORMATIVO | ACEITAR
**Arquivo:** `src/lib/hooks/use-accounts.ts` L147-149
**Descrição:** A criação de conta faz `create_coa_child` (RPC) + `INSERT accounts` em 2 chamadas separadas. Não é atômico. Se o INSERT falhar, COA órfão permanece.
**Impacto:** COA órfão não causa dano funcional. Limpeza manual possível.
**Gatilho de revisão:** Se volume de criação/exclusão de contas for alto.

### DT-023 | S3 MODERADO | ACEITAR
**Arquivo:** Todos os hooks com `auth.getUser()` repetido
**Descrição:** Cada `queryFn` e `mutationFn` faz uma chamada a `supabase.auth.getUser()` para obter o `user.id`. Em uma sessão ativa com 10+ hooks montados, isso gera ~10 chamadas de auth em paralelo no mount inicial. O `getUser()` do Supabase faz um roundtrip para validar o JWT.
**Impacto:** ~10 requests extras no carregamento de cada página. Mitigado pelo cache interno do Supabase client (a segunda chamada em sequência usa cache).
**Gatilho de revisão:** Se latência de carregamento de página ultrapassar 2s.

### DT-024 | S4 MENOR | CORRIGIR
**Arquivo:** `src/lib/hooks/use-recurrences.ts` L87, `src/lib/hooks/use-accounts.ts` L70
**Descrição:** Indentação inconsistente no `queryFn` (espaço extra). Padrão ocorre em 2+ hooks.
**Impacto:** Cosmético. Inconsistência de estilo no código.

### DT-025 | S3 MODERADO | CORRIGIR
**Arquivo:** `src/app/(app)/tax/page.tsx` L175 (referência geral)
**Descrição:** O módulo fiscal (`use-fiscal.ts`) usa `select("*")` na query de `tax_parameters`. Apesar de ser uma tabela de referência pequena (~20 registros), o padrão deveria seguir a mesma regra dos outros hooks (colunas explícitas).
**Impacto:** Baixo (tabela pequena, read-only). Inconsistência de padrão.

---

## Arquivos auditados (atualização)

| # | Arquivo | Linhas | Status | Achados |
|---|---------|--------|--------|---------|
| 1-15 | (sessão anterior) | ~2000 | ✅ | DT-001 a DT-015 |
| 16 | src/lib/hooks/use-budgets.ts | 392 | ✅ | DT-019 |
| 17 | src/lib/hooks/use-assets.ts | 363 | ✅ | DT-007 (reconfirmado) |
| 18 | src/lib/hooks/use-recurrences.ts | 362 | ✅ | DT-016, DT-018, DT-024 |
| 19 | src/lib/hooks/use-workflows.ts | 358 | ✅ | 0 (stubs já registrados em DT-009) |
| 20 | src/lib/hooks/use-dashboard.ts | 285 | ✅ | DT-008 (reconfirmado) |
| 21 | src/lib/hooks/use-cost-centers.ts | 312 | ✅ | 0 |
| 22 | src/lib/hooks/use-fiscal.ts | 202 | ✅ | DT-025 |
| 23 | src/lib/hooks/use-bank-connections.ts | 197 | ✅ | 0 |
| 24 | src/lib/hooks/use-family-members.ts | 188 | ✅ | 0 |
| 25 | src/lib/hooks/use-economic-indices.ts | 183 | ✅ | 0 |
| 26 | src/lib/hooks/use-reconciliation.ts | 164 | ✅ | 0 |
| 27 | src/lib/hooks/use-categories.ts | 142 | ✅ | 0 |
| 28 | src/lib/hooks/use-chart-of-accounts.ts | 131 | ✅ | 0 |
| 29 | src/lib/hooks/use-auto-category.ts | 111 | ✅ | 0 |
| 30 | src/lib/hooks/use-progressive-disclosure.ts | 79 | ✅ | 0 |
| 31 | src/lib/hooks/use-online-status.ts | 75 | ✅ | 0 |
| 32 | src/lib/hooks/use-analytics.ts | 66 | ✅ | 0 |
| 33 | src/lib/hooks/use-dialog-helpers.ts | 43 | ✅ | 0 |
| 34 | src/lib/hooks/use-auth-init.ts | 63 | ✅ | 0 |
| 35 | src/lib/hooks/use-currency-label.ts | 40 | ✅ | 0 |
| 36 | src/lib/parsers/xlsx-parser.ts | 65 | ✅ | DT-017 |
| 37 | src/lib/parsers/csv-parser.ts | 195 | ✅ | 0 |
| 38 | src/lib/parsers/ofx-parser.ts | 175 | ✅ | 0 |
| 39 | src/lib/query-provider.tsx | 25 | ✅ | 0 |
| 40 | src/lib/stores/privacy.ts | ~20 | ✅ | 0 |
| 41 | src/lib/utils/error-messages.ts | 41 | ✅ | 0 |
| 42 | src/lib/utils/platform.ts | 28 | ✅ | 0 |
| 43 | src/middleware.ts | 244 | ✅ | 0 |
| 44 | src/types/database.ts | 553 | ✅ | 0 |
| 45 | src/app/layout.tsx | 56 | ✅ | 0 |
| 46 | src/app/global-error.tsx | 40 | ✅ | 0 |
| 47 | src/app/privacy/page.tsx | 190 | ✅ | 0 |
| 48 | src/app/api/* (7 routes) | ~400 | ✅ | 0 (issues já em DT-001..015) |
| 49 | src/components/onboarding/* | ~700 | ✅ | DT-020 |
| 50 | DB: pg_cron jobs (6) | - | ✅ | DT-016 (missing job) |
| 51 | DB: RLS policies (26 tables) | - | ✅ | 0 (all tables have RLS + policies) |
| 52 | DB: SECURITY DEFINER functions (45) | - | ✅ | 0 (all have search_path) |
| 53-118 | Pages + Components (66 remaining) | ~12000 | ⏳ Quick-scanned | DT-020, DT-021 |

**Quick scan coverage:** Pages e components foram varridos por padrões (grep) para TODO, FIXME, STUB, hardcoded R$, dangerouslySetInnerHTML, missing aria-label. Leitura linha-a-linha parcial (5 maiores páginas lidas integralmente em sessão anterior durante aplicação de fixes). Restam 66 arquivos para leitura completa.

---

## Resumo atualizado (53/118 arquivos + DB)

| Severidade | Quantidade |
|-----------|-----------|
| S1 BLOQUEANTE | 0 |
| S2 GRAVE | 9 (DT-001, 004, 005, 008, 009, 012, 016, 018) |
| S3 MODERADO | 7 (DT-003, 006, 007, 011, 017, 019, 023, 025) |
| S4 MENOR | 4 (DT-002, 013, 020, 024) |
| S5 INFORMATIVO | 2 (DT-015, 022) |
| **Total** | **22** |

| Disposição | Quantidade |
|-----------|-----------|
| CORRIGIR | 13 |
| ACEITAR | 4 |
| REMOVER | 0 |
| COMPLETAR | 5 |

---

## Classificação por urgência (pré-deploy)

### TIER 0 - Bloqueia deploy (enganam o usuário)
| ID | Descrição | Estimativa |
|----|-----------|-----------|
| DT-018 | Reajuste IPCA/IGP-M na UI mas não funciona | 10 min (remover opções) ou 4-6h (implementar) |
| DT-004 | Face ID fake em iOS | 30 min (ocultar na web, disclaimer no iOS) |
| DT-016 | Cron de recorrências inexistente | 2-3h |

### TIER 1 - Grave, corrigir antes de produção
| ID | Descrição | Estimativa |
|----|-----------|-----------|
| DT-001 | Re-inicialização silenciosa de crypto | 1h |
| DT-008 | monthly_snapshots sem cron | 2-3h |
| DT-010 | Trigger O(n²) em batch import | 3-4h |
| DT-012 | Edição de transação inexistente | 4-6h |
| DT-009 | WKF-03 upload stub | 2-3h |
| DT-011 | Focus trap em 6 modais | 1-2h |

### TIER 2 - Moderado, corrigir em sprint seguinte
| ID | Descrição | Estimativa |
|----|-----------|-----------|
| DT-005 | 6 tabelas sem frontend | Documentar 30min, implementar monthly_snapshots 2-3h |
| DT-006 | 2 UPDATEs extras no tx engine | 2h (alterar RPC) |
| DT-017 | XLSX parser sem error handling | 15 min |
| DT-019 | useBudgetMonths over-fetch | 30 min |
| DT-025 | use-fiscal select("*") | 10 min |

### TIER 3 - Menor, cleanup
| DT-002, DT-003, DT-013, DT-020, DT-021, DT-024 | ~1h total |

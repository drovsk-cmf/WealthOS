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

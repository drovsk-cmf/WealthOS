# Oniefy - Pendências para Decisão

> **ARQUIVO HISTÓRICO.** 15 itens FAZER (grupos 2-5) migrados para `PENDENCIAS-FUTURAS.md` como E52-E65 em 03/04/2026 (sessão 39).
> Este documento permanece como referência das decisões tomadas pelo Claudio. Grupo 1 (17/17) concluído na sessão 19.

**Data:** 2026-03-16 (atualizado 2026-03-17)
**Contexto:** Pós-auditoria completa (118 arquivos + 8 specs cruzados). 32 itens pendentes em 10 grupos.
**Status:** ✅ **17/17 itens FAZER concluídos na sessão 19 (17/03/2026).**

**Disposições:** FAZER / DESCARTAR / ADIAR (com gatilho) / DELEGAR

| Grupo | Itens FAZER | Status |
|-------|-------------|--------|
| 1 | 1.2, 1.3, 1.4, 1.5 | ✅ Todos feitos |
| 2 | 2.1, 2.2 | ✅ Todos feitos |
| 3 | 3.1, 3.2, 3.3, 3.4, 3.5 | ✅ Todos feitos |
| 4 | 4.1, 4.2, 4.3 | ✅ Todos feitos |
| 5 | 5.1, 5.2 | ✅ Todos feitos |
| 6 | DROP tax_records | ✅ Feito |
| 1.1 | Instrument Serif | ADIAR (landing page) |
| 7-10 | Longo prazo / Mac / Investimento | Pendentes (dependências externas) |

**Ordenação:** Grupos que dependem apenas de sessões Claude estão em ordem crescente de esforço. Grupos com dependência externa ficam no final.

---

## GRUPO 1: Decisões puras (0 min de código)

Itens que só precisam de uma decisão sua. Nenhum código a escrever.

### 1.1 Instrument Serif (fonte display)
**Estado:** Zero referências no código. DM Sans cobre tudo. HANDOVER diz "adiado".
**Opções:** DESCARTAR da spec | ADIAR para landing page

### 1.2 Orçamento delegado com aprovação
**Spec:** Adendo v1.2
**Estado:** Atribuição direta (`family_member_id`) funciona. Fluxo "propõe → aprova" nunca implementado.
**Opções:** DESCARTAR aprovação (atribuição direta basta) | ADIAR para quando membros tiverem login próprio

### 1.3 CAP-05: Visão calendário de vencimentos
**Spec:** Funcional v1
**Estado:** Bills page tem lista com tabs. Sem calendário visual.
**Opções:** DESCARTAR (lista ordenada é suficiente) | FAZER (3-4h) | ADIAR

### 1.4 Export criptografado com senha
**Spec:** Especificação v1 §3.6
**Estado:** Export gera JSON/CSV plain text.
**Opções:** DESCARTAR (security theater no dispositivo do próprio usuário) | FAZER ZIP AES-256 (2-3h)

### 1.5 Logs de acesso (90 dias)
**Spec:** Especificação v1 §3.7
**Estado:** Supabase Auth logs cobrem logins. Nenhuma tabela `access_logs` no app.
**Opções:** ACEITAR (Supabase cobre, redundante para single-user) | FAZER tabela + triggers (2-3h) | ADIAR para multi-user

---

## GRUPO 2: Fixes rápidos (até 1h total)

### 2.1 liquidity_tier editável (30 min)
**Estado:** Auto-atribuído por tipo de conta. Sem dropdown para reclassificar.
**Opções:** FAZER dropdown no AccountForm (30 min) | DESCARTAR (documentar como automático)

### 2.2 Focus trap nos 6 dialogs inline (1h)
**Estado:** 6 form modals OK. 6 dialogs de confirmação/criação sem focus trap.
**Opções:** FAZER (1h) | ADIAR (WCAG AA não exige para dialogs simples)

---

## GRUPO 3: Fixes médios (1-3h cada)

### 3.1 DT-007: Type cast `as Account[]` (1-2h)
**Estado:** 6 hooks com cast para tipo completo mas select de subset. Campos omitidos são `undefined`.
**Opções:** FAZER types refinados (1-2h) | ADIAR (corrigir quando bug aparecer)

### 3.2 Testes SQL para RPCs novas (2-3h)
**Estado:** Zero testes para `edit_transaction`, `cron_generate_recurring_transactions`, `cron_generate_monthly_snapshots`, `recalculate_account_balance_for`.
**Opções:** FAZER (2-3h) | ADIAR (testar manualmente antes do deploy)

### 3.3 monthly_snapshots → sparklines de solvência (2-3h)
**Estado:** Cron popula. RPC `get_balance_evolution` usa. SolvencyPanel não mostra tendência.
**Opções:** FAZER sparklines (2-3h) | ADIAR (dados sendo gravados, sem perda)

### 3.4 Edição de transferências (2-3h)
**Pré-requisito:** DT-012 (já feito para income/expense).
**Estado:** Botão Editar não aparece para `type=transfer`.
**Opções:** FAZER (estender RPC, 2-3h) | ADIAR (estorno manual aceitável) | DESCARTAR (documentar limitação)

### 3.5 Rateio automático de overhead CEN-03 (2-3h)
**Estado:** Tabela `center_allocations` + RPC `allocate_to_centers` existem. Zero UI.
**Opções:** FAZER UI mínima (2-3h) | ADIAR (gatilho: >50 tx/mês com centros) | DESCARTAR (remover tabela + RPC)

---

## GRUPO 4: Features médias (3-4h cada)

### 4.1 Reajuste automático por índice IPCA/IGP-M/INPC/Selic (3-4h)
**Estado:** Opções removidas da UI. Índices JÁ coletados por cron. Conexão dados → ajuste nunca feita.
**Opções:** FAZER (lógica na RPC + reabilitar opções na UI, 3-4h) | ADIAR (gatilho: primeiro usuário solicitar) | DESCARTAR (remover ENUMs)

### 4.2 Upload de documentos WKF-03 - sem OCR (2-3h)
**Estado:** Stub. Tabela `documents` + Storage bucket existem.
**Opções:** FAZER upload para Storage + vínculo (2-3h) | DESCARTAR WKF-03 | Manter stub

### 4.3 PAT-06: Anexar documentos a bens (acoplado a 4.2)
**Pré-requisito:** 4.2 (upload genérico).
**Estado:** Zero UI.
**Opções:** FAZER junto com 4.2 (+1h) | ADIAR junto com 4.2 | DESCARTAR

---

## GRUPO 5: Features grandes (4-6h cada)

### 5.1 OCR web - Tesseract.js + PDF.js (4-6h)
**Pré-requisito:** 4.2 (upload de documentos).
**Estado:** Zero código. Viável sem Mac.
**Opções:** FAZER (4-6h) | ADIAR (gatilho: upload implementado) | DESCARTAR do escopo v1

### 5.2 Push notifications versão web (4-6h)
**Estado:** Tabelas existem. Zero código. Settings mostra "Em breve".
**Escopo:** Web Push API via service worker. Não requer Apple.
**Opções:** FAZER (4-6h) | ADIAR (gatilho: retenção D7 < 50%) | DESCARTAR (remover tabelas + "Em breve")

---

## GRUPO 6: Tabelas ociosas (5 min cada, depende dos grupos acima)

| Tabela | Vinculada a | Ação |
|--------|------------|------|
| `tax_records` | Nada (depreciada) | **DROP TABLE** (incondicional) |
| `documents` | 4.2 (upload) | Se DESCARTAR 4.2 → DROP. Se FAZER → MANTER |
| `notification_tokens` | 5.2 (push) | Se DESCARTAR 5.2 → DROP. Se FAZER → MANTER |
| `notification_log` | 5.2 (push) | Idem |
| `center_allocations` | 3.5 (rateio) | Se DESCARTAR 3.5 → DROP. Se FAZER → MANTER |

---

## GRUPO 7: Evoluções de longo prazo (sem prazo, com gatilho)

| Item | Gatilho |
|------|---------|
| RLS multi-user (login independente para membros) | Cônjuge solicitar login próprio |
| Open Finance (Pluggy/Belvo) | Agregador viável + certificação |
| Local-first / Zero-knowledge (reescrita) | Validação de retenção + modelo de negócio |
| Web Workers para parsers | Travamento reportado na importação |
| SSR prefetch no Dashboard | 10+ usuários ou TTI > 2s |
| pg_cron limpeza soft-deleted (90 dias) | Volume justificar |

---

## GRUPO 8: Ações do Claudio (paralelas, não-técnicas)

| # | Item | Dependência |
|---|------|------------|
| 8.1 | Deploy Vercel + domínio oniefy.com | Decisão de ir a produção |
| 8.2 | Teste de corredor com 3 pessoas (UX-H3-05) | Deploy em produção |
| 8.3 | Validação fiscal periódica (IRPF, INSS, sal. mínimo) | Recorrente |

---

## GRUPO 9: Requer Mac (penúltimo)

Sprint único quando Mac disponível. ~25-35h.

| # | Item | Estimativa | Requer investimento? |
|---|------|-----------|---------------------|
| 9.1 | Capacitor iOS build + teste | 2h | Sim (Apple Dev Account) |
| 9.2 | Biometria real (substituir stubs) | 4-6h | Não |
| 9.3 | FIN-17 OCR nativo (Apple Vision) | 4-6h | Não |
| 9.4 | FIN-18 Câmera (Capacitor Camera) | 2h | Não |
| 9.5 | CFG-04 Push via APNs | 4-6h | Sim (Apple Dev Account) |
| 9.6 | Screenshot prevention (opcional na spec) | 1h | Não |
| 9.7 | Jailbreak detection | 2h | Não |
| 9.8 | Certificate pinning | 2h | Não |
| 9.9 | Submissão App Store | 2h | Sim (Apple Dev Account) |

**Stubs a substituir:** `use-biometric.ts`, `use-app-lifecycle.ts` (attemptBiometricUnlock), `settings/security` (Biometric Status)

---

## GRUPO 10: Aguardando investimento (último)

| # | Assinatura | Custo | Desbloqueia |
|---|-----------|-------|-------------|
| 10.1 | Supabase Pro | ~US$ 25/mês | Leaked Password Protection, backups diários, PITR |
| 10.2 | Apple Developer Account | US$ 99/ano | Grupo 9 itens 9.1, 9.5, 9.9 |

**Sem Supabase Pro:** app funciona. Senhas vazadas não detectadas. Backups via export manual.
**Sem Apple Dev Account:** app funciona 100% na web. iOS e push APNs bloqueados.

---

## Resumo

| # | Grupo | Itens | Esforço | Depende de |
|---|-------|-------|---------|-----------|
| 1 | Decisões puras | 5 | 0 min | Sua decisão |
| 2 | Fixes rápidos | 2 | ~1.5h | Nada |
| 3 | Fixes médios | 5 | ~12h | Nada |
| 4 | Features médias | 3 | ~8h | Nada (4.3 depende de 4.2) |
| 5 | Features grandes | 2 | ~10h | 5.1 depende de 4.2 |
| 6 | Tabelas ociosas | 5 | ~25 min | Decisões dos G1-5 |
| 7 | Longo prazo | 6 | - | Gatilhos |
| 8 | Ações Claudio | 3 | - | Paralelo |
| 9 | **Requer Mac** | 9 | ~25-35h | Mac + parcialmente G10 |
| 10 | **Aguardando investimento** | 2 | - | ~US$ 400/ano |

---

## Decisões registradas (2026-03-16)

| Item | Decisão | Esforço |
|------|---------|---------|
| 1.1 Instrument Serif | ADIAR (landing page) | 0 |
| 1.2 Orçamento aprovação | ~~ADIAR~~ → **FEITO** (commit c58128c, migrations 042-043) | 0 |
| 1.3 CAP-05 Calendário | **FAZER** | 3-4h |
| 1.4 Export criptografado | **FAZER** | 2-3h |
| 1.5 Logs de acesso | **FAZER** | 2-3h |
| 2.1 liquidity_tier editável | **FAZER** | 30 min |
| 2.2 Focus trap dialogs inline | **FAZER** | 1h |
| 3.1 Type cast refinado | **FAZER** | 1-2h |
| 3.2 Testes RPCs novas | **FAZER** | 2-3h |
| 3.3 Sparklines solvência | **FAZER** | 2-3h |
| 3.4 Edição transferências | **FAZER** | 2-3h |
| 3.5 Rateio overhead UI | **FAZER** | 2-3h |
| 4.1 Reajuste IPCA/IGP-M | **FAZER** | 3-4h |
| 4.2 Upload WKF-03 | **FAZER** | 2-3h |
| 4.3 PAT-06 docs em bens | **FAZER** (com 4.2) | +1h |
| 5.1 OCR web Tesseract.js | **FAZER** | 4-6h |
| 5.2 Web Push notifications | **FAZER** | 4-6h |

**Totais:** 15 FAZER (~33-44h), 1 ADIAR, 0 DESCARTAR, 1 FEITO

**Cadeia de pré-requisitos:**
- 4.2 (upload) → 4.3 (docs em bens)
- 4.2 (upload) → 5.1 (OCR web)

**Tabelas ociosas (Grupo 6) derivadas:**
- `tax_records`: DROP (incondicional)
- `documents`: MANTER (4.2 aprovado)
- `notification_tokens`: MANTER (5.2 aprovado)
- `notification_log`: MANTER (5.2 aprovado)
- `center_allocations`: MANTER (3.5 aprovado)

# Oniefy - Pendências para Decisão

**Data:** 2026-03-16 (atualizado 2026-03-16)
**Contexto:** Pós-auditoria de dívida técnica (28 achados, 22 corrigidos) + varredura cruzada spec vs código (10 gaps, 2 corrigidos). Este documento consolida TUDO que não está 100% entregue.

**Regra:** Cada item requer uma de 4 disposições:
- **FAZER** (antes do deploy ou em sprint específico)
- **DESCARTAR** (remover da spec/código/backlog, aceitar que não será feito)
- **ADIAR** (com gatilho concreto e mensurável para revisitar)
- **DELEGAR** (ação do Claudio, não depende de sessão Claude)

**Grupos ordenados por prioridade (do mais urgente ao mais postergável):**

---

## GRUPO 1: Features web não entregues (sem dependência externa)

Implementáveis agora, sem Mac e sem assinatura.

### 1.1 Upload de documentos (WKF-03) - parte web
**Spec:** Adendo v1.2 §2.1, Funcional v1 (WKF-03)
**Estado:** Stub ("Conferido" manual). Tabela `documents` e Storage bucket existem. Zero código de upload.
**Escopo web:** (A) Upload de arquivo para Supabase Storage + vínculo com `documents`. (B) OCR via Tesseract.js. Ambos sem Mac.
**Opções:**
1. FAZER (A) upload sem OCR (2-3h) + ADIAR (B) OCR web
2. FAZER (A)+(B) upload + OCR web (4-6h)
3. DESCARTAR WKF-03: remover task type "upload_document" do cron
4. Manter stub como está

### 1.2 Reajuste automático por índice (IPCA, IGP-M, INPC, Selic)
**Spec:** Adendo v1.1
**Estado:** Opções removidas da UI (DT-018). RPC só aplica "manual". Índices JÁ são coletados. Conexão dados → ajuste nunca feita.
**Opções:**
1. FAZER: lógica na RPC (buscar índice, calcular variação, aplicar). 3-4h
2. ADIAR: gatilho "quando primeiro usuário solicitar"
3. DESCARTAR: remover ENUMs ipca/igpm/inpc/selic do banco

### 1.3 Push notifications - versão web
**Spec:** Funcional v1 (CFG-04), Estratégia UX (UX-H2-02)
**Estado:** Tabelas existem. Zero código. Settings mostra "Em breve".
**Escopo web:** Web Push API via service worker (vencimentos, inatividade). Não requer Apple Developer Account.
**Opções:**
1. FAZER web push (4-6h). APNs fica no Grupo 9 (Mac) e 10 (Investimento)
2. DESCARTAR: remover tabelas e "Em breve" do settings
3. ADIAR: gatilho "pós-deploy, se retenção D7 < 50%"

### 1.4 OCR de recibos - versão web (FIN-17 parcial)
**Spec:** Funcional v1 (FIN-17)
**Estado:** Zero código. Web fallback Tesseract.js + PDF.js é viável sem Mac.
**Opções:**
1. FAZER OCR web (Tesseract.js + PDF.js). 4-6h
2. ADIAR: gatilho "quando upload (1.1) estiver implementado"
3. DESCARTAR do escopo v1

### 1.5 Orçamento delegado com aprovação
**Spec:** Adendo v1.2
**Estado:** `budgets.family_member_id` funciona (atribuição direta). Fluxo "membro propõe, titular aprova" nunca implementado.
**Opções:**
1. DESCARTAR aprovação. Atribuição direta é suficiente para v1
2. ADIAR: gatilho "quando membros tiverem login próprio"

### 1.6 Rateio automático de overhead (CEN-03)
**Spec:** Estudo Técnico v2.0
**Estado:** Tabela `center_allocations` + RPC existem. Zero UI.
**Opções:**
1. FAZER UI mínima (2-3h)
2. ADIAR: gatilho "volume > 50 tx/mês com centros"
3. DESCARTAR: remover tabela + RPC

### 1.7 Edição de transferências (FIN-11 parcial)
**Estado:** DT-012 cobre income/expense. Transferências excluídas.
**Opções:**
1. FAZER: estender RPC (2-3h)
2. ADIAR: estorno manual é aceitável (~5-10% dos lançamentos)
3. DESCARTAR: documentar como limitação

---

## GRUPO 2: Schema sem frontend (tabelas ociosas)

Decisão segue o Grupo 1. Se a feature vinculada for descartada, a tabela deve ser removida (DROP TABLE).

| Tabela | Vinculada a | Recomendação |
|--------|------------|-------------|
| `documents` | 1.1 (WKF-03 upload) | Se descartar 1.1 → DROP. Se fazer → MANTER |
| `notification_tokens` | 1.3 (push) | Se descartar 1.3 → DROP. Se fazer → MANTER |
| `notification_log` | 1.3 (push) | Idem |
| `center_allocations` | 1.6 (rateio) | Se descartar 1.6 → DROP. Se fazer → MANTER |
| `tax_records` | Nada. Depreciada | **DROP TABLE** (recomendação incondicional) |

---

## GRUPO 3: Dados existentes mas não consumidos pela UI

### 3.1 monthly_snapshots → tendência de solvência
**Estado:** Cron popula mensalmente. `get_balance_evolution` usa. SolvencyPanel calcula on-the-fly sem tendência histórica.
**Opções:**
1. FAZER sparklines no SolvencyPanel (2-3h)
2. ADIAR: snapshots estão sendo gravados, sem perda de dados

### 3.2 liquidity_tier não editável pelo usuário
**Estado:** Auto-atribuído por tipo de conta. Sem UI para reclassificar.
**Opções:**
1. FAZER dropdown no AccountForm (30 min)
2. ADIAR: edge case raro
3. DESCARTAR: documentar como automático

---

## GRUPO 4: Qualidade e acessibilidade residual

### 4.1 Focus trap nos 6 dialogs inline em pages
**Estado:** 6 form modals OK. 6 dialogs inline sem focus trap.
**Opções:**
1. FAZER (1h)
2. ADIAR: WCAG AA não exige para dialogs simples

### 4.2 DT-007: Type cast `as Account[]` após select explícito
**Estado:** 6 hooks com cast. Campos não-selecionados são `undefined`.
**Opções:**
1. FAZER types refinados (1-2h)
2. ADIAR: corrigir quando bug aparecer

### 4.3 Testes para RPCs novas
**Estado:** Zero testes para `edit_transaction`, `cron_generate_recurring_transactions`, `cron_generate_monthly_snapshots`, `recalculate_account_balance_for`.
**Opções:**
1. FAZER testes SQL (2-3h)
2. ADIAR: testar manualmente antes do deploy

---

## GRUPO 5: Gaps spec vs código (web, sem dependência externa)

### 5.1 CAP-05: Visão calendário de vencimentos
**Spec:** Funcional v1
**Estado:** Lista com tabs, sem calendário visual.
**Opções:**
1. FAZER (3-4h)
2. DESCARTAR: lista ordenada é suficiente
3. ADIAR: implementar se usuários pedirem

### 5.2 PAT-06: Anexar documentos a bens
**Spec:** Funcional v1
**Sobreposição:** Vinculado a 1.1 (upload genérico).
**Opções:**
1. FAZER junto com 1.1
2. ADIAR junto com 1.1
3. DESCARTAR

### 5.3 Export criptografado com senha
**Spec:** Especificação v1 §3.6
**Estado:** Export gera JSON/CSV plain text.
**Opções:**
1. FAZER ZIP com senha AES-256 (2-3h)
2. DESCARTAR: security theater no dispositivo do próprio usuário
3. ADIAR: se exigido por compliance

### 5.4 Logs de acesso (90 dias)
**Spec:** Especificação v1 §3.7
**Estado:** Nenhuma tabela `access_logs`. Supabase Auth logs cobrem logins.
**Opções:**
1. FAZER tabela + triggers (2-3h)
2. ACEITAR: Supabase cobre. Redundante para single-user
3. ADIAR: quando tiver multi-user

---

## GRUPO 6: Stubs e código morto (sem impacto funcional)

### 6.1 Instrument Serif (fonte display)
**Estado:** Zero referências no código. DM Sans cobre tudo.
**Opções:**
1. DESCARTAR: remover da spec
2. ADIAR: landing page ou marketing

---

## GRUPO 7: Evoluções de longo prazo (não são pendências)

| Item | Gatilho |
|------|---------|
| RLS multi-user (login independente para membros) | Cônjuge solicitar login próprio |
| Open Finance (Pluggy/Belvo) | Agregador viável + certificação |
| Local-first / Zero-knowledge (reescrita) | Validação de retenção + modelo de negócio |
| Web Workers para parsers | Travamento reportado na importação |
| SSR prefetch no Dashboard | 10+ usuários ou TTI > 2s |
| pg_cron limpeza soft-deleted (90 dias) | Volume justificar |

---

## GRUPO 8: Ações do Claudio (não-técnicas, paralelas)

| # | Item | Ação | Dependência |
|---|------|------|------------|
| 8.1 | Deploy Vercel + domínio oniefy.com | Claudio executa | Decisão de ir a produção |
| 8.2 | Teste de corredor com 3 pessoas (UX-H3-05) | Claudio recruta | Deploy em produção |
| 8.3 | Validação fiscal periódica (IRPF, INSS, salário mínimo) | Claudio verifica DOU | Recorrente |

---

## GRUPO 9: Requer Mac (penúltimo em prioridade)

Todos estes itens dependem de computador Mac com Xcode. Agrupados para execução em sprint único.

| # | Item | Spec | Estimativa | Depende de investimento? |
|---|------|------|-----------|------------------------|
| 9.1 | Capacitor iOS build + teste em dispositivo | Spec v1 §2.1 | 2h | Sim (Apple Dev Account) |
| 9.2 | Biometria real (substituir stubs) | Spec v1 §3.5, AUTH-06 | 4-6h | Não |
| 9.3 | FIN-17 OCR nativo (Apple Vision Framework) | Funcional v1 | 4-6h | Não |
| 9.4 | FIN-18 Câmera comprovante (Capacitor Camera) | Funcional v1 | 2h | Não |
| 9.5 | CFG-04 Push via APNs | Funcional v1 | 4-6h | Sim (Apple Dev Account) |
| 9.6 | Screenshot prevention (App Switcher) | Spec v1 §3.5 (opcional) | 1h | Não |
| 9.7 | Jailbreak detection | Spec v1 §3.5 | 2h | Não |
| 9.8 | Certificate pinning | Spec v1 §3.5 | 2h | Não |
| 9.9 | Submissão App Store | Spec v1 §2.3 | 2h | Sim (Apple Dev Account) |

**Código stub que será substituído:**
- `src/lib/auth/use-biometric.ts` (~75 linhas)
- `src/lib/auth/use-app-lifecycle.ts` (seção `attemptBiometricUnlock`)
- `src/app/(app)/settings/security/page.tsx` (seção "Biometric Status")

**Estimativa total sprint iOS:** ~25-35h

---

## GRUPO 10: Aguardando investimento (último em prioridade)

Bloqueados por assinaturas pagas. Nenhum bloqueia deploy web nem uso do produto.

| # | Assinatura | Custo | O que desbloqueia |
|---|-----------|-------|-------------------|
| 10.1 | Supabase Pro | ~US$ 25/mês | Leaked Password Protection (HaveIBeenPwned), backups diários automáticos, Point-in-Time Recovery, limites Auth ampliados |
| 10.2 | Apple Developer Account | US$ 99/ano | Pré-requisito para Grupo 9 itens 9.1, 9.5, 9.9 (build, APNs, submissão App Store) |

**Impacto de postergar:**
- Sem Supabase Pro: app funciona, senhas vazadas não detectadas, backups dependem de export manual (CFG-05)
- Sem Apple Developer Account: app funciona 100% na web. iOS e push APNs bloqueados. Web Push (1.3) funciona independente

---

## Resumo

**32 itens em 10 grupos.**

| # | Grupo | Itens | Prioridade |
|---|-------|-------|-----------|
| 1 | Features web | 7 | Alta - decidir FAZER/DESCARTAR |
| 2 | Tabelas ociosas | 5 | Alta - segue decisão do G1 |
| 3 | Dados sem UI | 2 | Média |
| 4 | Qualidade | 3 | Média |
| 5 | Gaps spec web | 4 | Média |
| 6 | Código morto | 1 | Baixa |
| 7 | Longo prazo | 6 | Com gatilho |
| 8 | Ações Claudio | 3 | Paralela |
| **9** | **Requer Mac** | **9** | **Penúltima** |
| **10** | **Aguardando investimento** | **2** | **Última** |

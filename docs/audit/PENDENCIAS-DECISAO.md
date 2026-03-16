# Oniefy - Pendências para Decisão

**Data:** 2026-03-16
**Contexto:** Pós-auditoria de dívida técnica (28 achados, 22 corrigidos). Este documento consolida TUDO que não está 100% entregue, organizado por natureza, para decisão do Claudio.

**Regra:** Cada item requer uma de 4 disposições:
- **FAZER** (antes do deploy ou em sprint específico)
- **DESCARTAR** (remover da spec/código/backlog, aceitar que não será feito)
- **ADIAR** (com gatilho concreto e mensurável para revisitar)
- **DELEGAR** (ação do Claudio, não depende de sessão Claude)

---

## GRUPO 1: Features especificadas e não entregues

Itens que existem nos documentos de especificação (Adendos v1.1-v1.4, Estudo Técnico, Funcional) mas não foram implementados ou estão parcialmente implementados.

### 1.1 Upload de documentos (WKF-03)
**Spec:** Adendo v1.2 §2.1 (OCR), Funcional v1 (WKF-03)
**Estado:** Stub. Botão "Conferido" (manual). Tabela `documents` e Storage bucket existem no banco. Zero código de upload.
**O que falta:** (A) Upload de arquivo para Supabase Storage + vínculo com `documents` table. (B) OCR via Tesseract.js (web, sem Mac). (C) OCR nativo via Apple Vision (requer Mac).
**Opções:**
1. FAZER (A) agora (upload sem OCR, 2-3h) + ADIAR (B)+(C) para sprint iOS
2. FAZER (A)+(B) agora (upload + OCR web, 4-6h). Tesseract.js não requer Mac
3. DESCARTAR WKF-03 completamente: remover task type "upload_document" do cron de workflow tasks
4. Manter como está (manual), ADIAR tudo para sprint iOS

### 1.2 Reajuste automático por índice (IPCA, IGP-M, INPC, Selic)
**Spec:** Adendo v1.1 (recorrências com reajuste)
**Estado:** Opções removidas da UI (DT-018). RPC `generate_next_recurrence` só aplica "manual". Índices econômicos são coletados diariamente pelo cron. A conexão entre dados e ajuste nunca foi feita.
**Opções:**
1. FAZER: implementar lógica na RPC (buscar último valor do índice em `economic_indices`, calcular variação, aplicar). Estimar: 3-4h
2. ADIAR: com gatilho "quando primeiro usuário solicitar reajuste automático". Opções permanecem removidas da UI
3. DESCARTAR: remover ENUMs ipca/igpm/inpc/selic do banco, simplificar para none/manual

### 1.3 Push notifications (CFG-04 + UX-H2-02)
**Spec:** Funcional v1 (CFG-04), Estratégia UX/Retenção (UX-H2-02)
**Estado:** Tabelas `notification_tokens` e `notification_log` existem. Zero código. Settings mostra "Notificações: Em breve". Depende de Apple Developer Account para APNs.
**Opções:**
1. FAZER web push (PWA Web Push API, sem Apple): vencimentos e inatividade via service worker. Não requer Apple Developer Account. Estimar: 4-6h
2. ADIAR tudo para sprint iOS (após Apple Developer Account)
3. DESCARTAR: remover tabelas, remover "Em breve" do settings, aceitar que notificações não farão parte do produto

### 1.4 OCR de recibos (FIN-17) + Câmera (FIN-18)
**Spec:** Funcional v1 (FIN-17, FIN-18)
**Estado:** Zero código. Bloqueado por Xcode para Apple Vision nativo. Web fallback (Tesseract.js) é viável.
**Opções:**
1. FAZER OCR web (Tesseract.js + PDF.js) agora, câmera como ADIAR (iOS). Estimar: 4-6h
2. ADIAR ambos para sprint iOS
3. DESCARTAR FIN-17 e FIN-18 do escopo v1

### 1.5 Orçamento delegado com aprovação
**Spec:** Adendo v1.2
**Estado:** `budgets.family_member_id` existe e funciona. Mas "aprovação" (membro propõe, titular aprova) nunca foi implementada. O que existe é atribuição direta pelo titular.
**Opções:**
1. DESCARTAR fluxo de aprovação. O que existe (atribuição direta) é suficiente para v1
2. ADIAR: gatilho "quando membros tiverem login próprio" (depende de RLS multi-user)

### 1.6 Rateio automático de overhead (CEN-03)
**Spec:** Estudo Técnico v2.0
**Estado:** Tabela `center_allocations` existe. RPC `allocate_to_centers` existe no hook. Zero UI para invocar. O conceito de "overhead" (`is_overhead` flag) existe nos centros de custo.
**Opções:**
1. FAZER UI mínima: botão "Ratear overhead" na página de centros de custo. Estimar: 2-3h
2. ADIAR: gatilho "volume > 50 tx/mês com centros"
3. DESCARTAR: remover `center_allocations` table + RPC. Rateio não é core para pessoa física

### 1.7 Edição de transferências
**Estado:** DT-012 implementou edição para income/expense. Transferências excluídas (botão Editar não aparece para type=transfer).
**Opções:**
1. FAZER: estender RPC `edit_transaction` para lidar com transfers (reversar par + recriar). Estimar: 2-3h
2. ADIAR: transferências são ~5-10% dos lançamentos, estorno manual é aceitável
3. DESCARTAR: documentar como limitação

---

## GRUPO 2: Schema sem frontend (tabelas ociosas)

Tabelas criadas durante o desenvolvimento que nunca receberam código frontend.

| Tabela | Dados? | Cron? | Opções |
|--------|--------|-------|--------|
| `documents` | Vazia | Não | Vinculada a 1.1 (WKF-03). Se descartar WKF-03, DROP TABLE |
| `notification_tokens` | Vazia | Não | Vinculada a 1.3 (push). Se descartar push, DROP TABLE |
| `notification_log` | Vazia | Não | Idem |
| `center_allocations` | Vazia | Não | Vinculada a 1.6 (rateio). Se descartar rateio, DROP TABLE |
| `tax_records` | Vazia | Não | **Depreciada pelo estudo contábil v1.5.** Nenhuma feature depende dela. Recomendo DROP TABLE |

**Decisão necessária:** para cada tabela, MANTER (feature será implementada) ou REMOVER (DROP TABLE em migration).

---

## GRUPO 3: Stubs e código morto

Código que existe no repo mas não faz nada funcional.

### 3.1 Biometria (use-biometric.ts + use-app-lifecycle.ts)
**Estado:** ~200 linhas de código. `available: false` (não engana o usuário). `authenticate()` retorna `true` após o guard. 6 referências a "Fase 10". Settings mostra "Em breve" no iOS.
**Opções:**
1. MANTER como está: código é inerte na web, será ativado no sprint iOS
2. REMOVER completamente: deletar `use-biometric.ts`, simplificar `use-app-lifecycle.ts`, remover seção do settings. Recriar quando build iOS for iniciado

### 3.2 Instrument Serif (fonte display)
**Spec:** HANDOVER "DM Sans (corpo) + Instrument Serif (display/hero, adiado)"
**Estado:** Zero referências no código. Nunca carregada. Nunca usada. DM Sans cobre tudo.
**Opções:**
1. DESCARTAR: remover da spec. DM Sans é suficiente
2. ADIAR: integrar quando houver landing page ou material de marketing

---

## GRUPO 4: Dados existentes mas não consumidos pela UI

### 4.1 monthly_snapshots → tendência de solvência
**Estado:** Cron popula mensalmente (migration 038). `get_balance_evolution` usa snapshots quando tem 2+ registros. Mas o SolvencyPanel (LCR, runway, burn rate, tiers) calcula tudo on-the-fly e não mostra tendência histórica.
**O que falta:** Gráfico de tendência ou sparklines no SolvencyPanel mostrando evolução de LCR/runway/burn_rate ao longo dos meses.
**Opções:**
1. FAZER: adicionar sparklines ao SolvencyPanel usando dados de `monthly_snapshots`. Estimar: 2-3h
2. ADIAR: snapshots estão sendo gravados, tendência pode ser adicionada depois sem perda de dados

### 4.2 liquidity_tier não editável pelo usuário
**Estado:** Tier é auto-atribuído pelo tipo de conta (checking=T1, investment=T2, etc.). Não há UI para reclassificar. Uma poupança com rendimento bloqueado fica como T1 quando deveria ser T2.
**Opções:**
1. FAZER: adicionar dropdown "Tier de liquidez" no AccountForm. Estimar: 30 min
2. ADIAR: edge case raro para pessoa física com poucas contas
3. DESCARTAR: documentar que tier é automático e não editável

---

## GRUPO 5: Qualidade e acessibilidade residual

### 5.1 Focus trap nos 6 dialogs inline em pages
**Estado:** 6 form modals têm focus trap (focus-trap-react). 6 dialogs inline em pages (confirmação, criação rápida) não têm.
**Impacto:** Baixo. São dialogs simples com 1-2 botões, não formulários complexos.
**Opções:**
1. FAZER: envolver cada dialog inline em FocusTrap. Estimar: 1h
2. ADIAR: WCAG AA não exige focus trap em dialogs de confirmação com poucos elementos

### 5.2 console.warn sem dev guard (1 ocorrência)
**Arquivo:** `src/app/(auth)/mfa-challenge/page.tsx` L53
**Conteúdo:** `console.warn("[Oniefy] Failed to load DEK after MFA")`
**Opções:**
1. FAZER: adicionar `if (process.env.NODE_ENV === "development")`. 1 minuto
2. ADIAR: mensagem não vaza dados sensíveis, apenas diagnóstico

### 5.3 DT-007: Type cast `as Account[]` após select explícito
**Estado:** 6 hooks fazem cast para tipo completo mas selecionam subset de colunas. Campos não-selecionados são `undefined` em runtime.
**Opções:**
1. FAZER: criar types `AccountListItem`, `AssetListItem` etc. Estimar: 1-2h
2. ADIAR: nenhum bug conhecido. Corrigir quando aparecer

### 5.4 Testes para RPCs novas
**Estado:** 196 testes em 13 suítes. Mas zero testes para: `edit_transaction`, `cron_generate_recurring_transactions`, `cron_generate_monthly_snapshots`, `recalculate_account_balance_for`.
**Opções:**
1. FAZER: escrever testes SQL para as 4 RPCs. Estimar: 2-3h
2. ADIAR: testar manualmente antes do deploy, automatizar depois

---

## GRUPO 6: Infraestrutura e decisões do Claudio

| # | Item | Ação | Depende de |
|---|------|------|-----------|
| 6.1 | Deploy Vercel + domínio oniefy.com | Claudio executa | Decisão de ir a produção |
| 6.2 | Supabase Pro (leaked password protection) | Claudio assina | Decisão de custo |
| 6.3 | Apple Developer Account (US$ 99/ano) | Claudio compra | Decisão de custo + Mac |
| 6.4 | Teste de corredor com 3 pessoas (UX-H3-05) | Claudio recruta | Deploy em produção |
| 6.5 | Validação fiscal periódica (IRPF, INSS, salário mínimo) | Claudio verifica DOU | Recorrente |

---

## GRUPO 7: Evoluções de longo prazo (não são pendências)

Listados para completude. Não bloqueiam nada, não são dívida técnica.

| Item | Gatilho |
|------|---------|
| RLS multi-user (login independente para membros) | Cônjuge ou membro solicitar login próprio |
| Open Finance (Pluggy/Belvo) | Agregador viável + certificação |
| Local-first / Zero-knowledge (reescrita) | Validação de retenção + modelo de negócio definido |
| Web Workers para parsers | Usuário reportar travamento na importação |
| SSR prefetch no Dashboard | Escala para 10+ usuários ou TTI > 2s |
| pg_cron limpeza soft-deleted (90 dias) | Volume de dados justificar |

---

---

## GRUPO 8: Gaps entre especificação e código (varredura cruzada)

Itens descobertos ao cruzar os 8 documentos de especificação (funcional v1, adendos v1.1-v1.4, estudo técnico, estudo contábil) contra o código real. Nenhuma varredura anterior (grep, leitura de código, HANDOVER) capturou estes.

### 8.1 CAP-05: Visão calendário de vencimentos
**Spec:** Funcional v1, story CAP-05
**Estado:** Bills page tem lista com 2 tabs (Pendentes + Recorrências). Nenhuma visualização de calendário.
**Opções:**
1. FAZER: calendário mensal com dots nos dias de vencimento. Estimar: 3-4h
2. DESCARTAR: lista com ordenação por data é suficiente. Remover CAP-05 da contagem de stories entregues
3. ADIAR: implementar se usuários pedirem

### 8.2 FIS-03: Bens e direitos para IRPF
**Spec:** Funcional v1, story FIS-03
**Estado:** Dados existem (tabela `assets` + `accounts`). Mas a tax page NÃO renderiza seção "Bens e Direitos". Mostra apenas: Rendimentos + Deduções + Provisionamento + Parâmetros.
**Impacto:** Seção obrigatória da DIRPF. Quem usa o Oniefy para organizar dados fiscais não encontra a consolidação de bens.
**Opções:**
1. FAZER: adicionar seção "Bens e Direitos" na tax page (query assets + accounts tipo investment). Estimar: 2-3h
2. ADIAR: bens já são acessíveis via /assets. Consolidação fiscal pode esperar

### 8.3 FIS-04: Dívidas e ônus reais para IRPF
**Spec:** Funcional v1, story FIS-04
**Estado:** Contas tipo loan/financing existem no banco. Tax page não as lista em seção de dívidas.
**Impacto:** Mesma situação de FIS-03. Seção obrigatória da DIRPF.
**Opções:**
1. FAZER junto com 8.2 (mesma implementação, seção adicional). +1h sobre 8.2
2. ADIAR: dívidas acessíveis via /accounts

### 8.4 PAT-06: Anexar documentos a bens patrimoniais
**Spec:** Funcional v1, story PAT-06
**Estado:** Tabela `documents` existe. Storage bucket existe. Zero código de upload ou vínculo com assets.
**Sobreposição:** Vinculado a 1.1 (WKF-03 upload). Mesma infraestrutura necessária.
**Opções:**
1. FAZER junto com 1.1 (upload genérico serve WKF-03 e PAT-06). Adiciona campo `asset_id` na tabela documents
2. ADIAR junto com 1.1
3. DESCARTAR: remover PAT-06 da contagem de stories

### 8.5 Export criptografado com senha
**Spec:** Especificação v1 §3.6: "download dos dados em JSON/CSV (criptografado com senha)"
**Estado:** Export gera JSON/CSV em plain text. Sem nenhuma criptografia aplicada ao arquivo exportado.
**Opções:**
1. FAZER: gerar ZIP com senha (AES-256) usando library como `fflate` ou `archiver`. Estimar: 2-3h
2. DESCARTAR: export plain text é mais prático. Criptografia de arquivo é security theater se o dispositivo já é do usuário
3. ADIAR: implementar apenas se exigido por compliance

### 8.6 Logs de acesso (auditoria, 90 dias)
**Spec:** Especificação v1 §3.7: "Logs de acesso mantidos para auditoria (últimos 90 dias)"
**Estado:** `analytics_events` existe (UX tracking), mas não é log de acesso. Nenhuma tabela `access_logs`. Supabase tem logs próprios (auth logs), mas sem controle do app.
**Opções:**
1. FAZER: tabela `access_logs` (user_id, action, ip, timestamp) + trigger em login/logout/export/delete. Estimar: 2-3h
2. ACEITAR: Supabase Auth logs cobrem logins. Para single-user, logs de acesso do app são redundantes
3. ADIAR: implementar quando tiver multi-user

### 8.7 Screenshot prevention (iOS)
**Spec:** Especificação v1 §3.5: "tela em branco ao entrar no App Switcher (opcional, configurável)"
**Estado:** Zero código. Requer Capacitor plugin.
**Nota:** Spec marca como "opcional, configurável".
**Opções:**
1. ADIAR para sprint iOS (I2). Trivial com `@capacitor-community/privacy-screen`
2. DESCARTAR: spec diz "opcional"

### 8.8 Jailbreak detection (iOS)
**Spec:** Especificação v1 §3.5: "alerta ao usuário se dispositivo comprometido"
**Estado:** Zero código. Requer Capacitor plugin ou lib nativa.
**Opções:**
1. ADIAR para sprint iOS
2. DESCARTAR: jailbreak detection é facilmente contornável e controverso (Apple não exige)

### 8.9 Certificate pinning (iOS)
**Spec:** Especificação v1 §3.5: "Certificate pinning para comunicação com Supabase"
**Estado:** Zero código. Requer configuração nativa no Capacitor/iOS.
**Opções:**
1. ADIAR para sprint iOS. Implementar via `capacitor-ssl-pinning` ou config nativa
2. DESCARTAR: TLS 1.3 + HSTS já protegem contra MITM na maioria dos cenários

### 8.10 FIN-11: Edição de transferências
**Spec:** Funcional v1 story FIN-11 ("Editar transação" sem distinção de tipo)
**Estado:** DT-012 implementou edição para income/expense. Botão Editar não aparece para transferências (`tx.type !== "transfer"`).
**Sobreposição:** Já listado em PENDENCIAS-DECISAO.md item 1.7.
**Opções:** Mesmas de 1.7

---

## Resumo para decisão rápida (ATUALIZADO)

**Total: 32 itens pendentes de decisão.**

| Grupo | Itens | Decisão mais rápida |
|-------|-------|-------------------|
| 1. Features não entregues | 7 | ADIAR todos para pós-deploy, exceto 1.2 (já removido da UI) |
| 2. Tabelas ociosas | 5 | DROP `tax_records`. Restantes dependem do Grupo 1 |
| 3. Stubs/código morto | 2 | MANTER biometria (sprint iOS). DESCARTAR Instrument Serif |
| 4. Dados sem UI | 2 | ADIAR ambos (snapshots sendo gravados, tier é edge case) |
| 5. Qualidade residual | 4 | FAZER 5.1 e 5.2 agora (1h). ADIAR 5.3 e 5.4 |
| 6. Infra/Claudio | 5 | Decisão do Claudio |
| 7. Longo prazo | 6 | Todos com gatilho, não são pendências |
| **8. Gaps spec vs código** | **10** | **8.2+8.3 são os mais graves (IRPF). 8.7-8.9 são iOS. 8.5+8.6 requerem decisão de escopo** |

### Priorização recomendada dos novos achados

**Urgente (afeta integridade do módulo fiscal):**
- 8.2 FIS-03 + 8.3 FIS-04: Bens/Dívidas na tax page. Sem isso, o módulo fiscal está incompleto. 3-4h total.

**Decisão de escopo (honestidade vs spec):**
- 8.1 CAP-05: Calendário. Recomendo DESCARTAR (lista funciona)
- 8.4 PAT-06: Documentos em bens. Recomendo ADIAR (vinculado a WKF-03)
- 8.5 Export cripto: Recomendo DESCARTAR (security theater)
- 8.6 Access logs: Recomendo ACEITAR (Supabase cobre logins)

**iOS (agrupar no sprint iOS):**
- 8.7, 8.8, 8.9: Todos ADIAR para sprint iOS

**Duplicado:**
- 8.10: Já coberto em 1.7

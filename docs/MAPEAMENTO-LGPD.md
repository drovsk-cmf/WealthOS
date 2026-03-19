# Mapeamento de Dados Pessoais - LGPD

**Projeto:** Oniefy (WealthOS)
**Data:** 19 de março de 2026
**Ref:** Item 10.1 da Matriz de Validação v2.1
**Base legal primária:** Lei 13.709/2018 (LGPD)
**Escopo:** 28 tabelas no schema `public` do Supabase (projeto SP `mngjbrbxapazdddzgoje`)

---

## 1. Classificação de dados

| Categoria | Definição LGPD | Exemplos no Oniefy |
|---|---|---|
| **Dado pessoal** | Informação que identifica ou torna identificável uma pessoa natural (art. 5o, I) | Nome, CPF, e-mail, IP, user agent, device token |
| **Dado pessoal sensível** | Dado sobre origem racial, saúde, biometria, etc. (art. 5o, II) | Nenhum coletado pelo Oniefy |
| **Dado financeiro** | Não é categoria LGPD autônoma, mas envolve dado pessoal quando vinculado a titular identificável | Saldos, transações, patrimônio, renda, orçamentos |
| **Dado anonimizado** | Não permite identificação do titular (art. 5o, III). Fora do escopo LGPD | Índices econômicos, parâmetros fiscais |

---

## 2. Mapeamento tabela por tabela

### 2.1 Tabelas com dados pessoais diretos

| Tabela | Dados pessoais | Tipo | Base legal (art. 7o) | Finalidade | Retenção |
|---|---|---|---|---|---|
| `users_profile` | `full_name`, `cpf_encrypted`, `id` (auth.uid), `kek_material`, `encryption_key_*`, `cutoff_date`, `deletion_requested_at` | Identificação + credenciais | Execução de contrato (II) + consentimento para CPF (I) | Operação da conta, criptografia E2E, fiscal (CPF para IRPF) | Até exclusão da conta + 7 dias de carência |
| `family_members` | `name`, `cpf_encrypted`, `birth_date`, `relationship`, `avatar_emoji` | Identificação de terceiros (dependentes) | Consentimento (I) | Gestão familiar, centros de custo por membro, dependentes fiscais | Até exclusão pelo titular |
| `access_logs` | `user_id`, `ip_address`, `user_agent`, `action`, `metadata` | Dados de acesso e navegação | Legítimo interesse (IX) | Segurança, auditoria, detecção de anomalias | 90 dias (pg_cron cleanup) |
| `analytics_events` | `user_id`, `event_name`, `metadata`, `session_id` | Dados comportamentais | Legítimo interesse (IX) | Retenção, métricas de produto, melhoria de UX | Sem política definida (definir: 12 meses) |
| `notification_tokens` | `user_id`, `device_token`, `device_name`, `platform`, `subscription_data` | Identificadores de dispositivo | Consentimento (I) | Push notifications | Até desativação pelo titular |
| `notification_log` | `user_id`, `title`, `body`, `type` | Comunicações enviadas | Execução de contrato (II) | Registro de notificações, auditoria | 90 dias (sugerido) |

### 2.2 Tabelas com dados financeiros vinculados a titular

Dados financeiros isolados não são pessoais. Vinculados a `user_id` (que identifica o titular via `auth.users`), tornam-se pessoais indiretamente.

| Tabela | Dados financeiros | Base legal | Finalidade | Retenção |
|---|---|---|---|---|
| `accounts` | `name`, `balance`, `projected_balance`, `currency` | Execução de contrato (II) | Gestão de contas bancárias e patrimoniais | Até exclusão da conta |
| `transactions` | `amount`, `description`, `notes`, `date`, `tags`, `external_id` | Execução de contrato (II) | Registro de movimentações financeiras | Até exclusão da conta. Obrigação legal: 5 anos para documentos fiscais (CTN art. 173) |
| `journal_entries` | `description`, `notes_encrypted`, `entry_date` | Execução de contrato (II) | Motor contábil (partida dobrada) | Até exclusão da conta |
| `journal_lines` | `amount_debit`, `amount_credit`, `memo` | Execução de contrato (II) | Motor contábil | Até exclusão da conta |
| `assets` | `name`, `purchase_value`, `current_value`, `currency` | Execução de contrato (II) | Gestão patrimonial | Até exclusão da conta |
| `asset_value_history` | `value`, `appraisal_date` | Execução de contrato (II) | Histórico de valorização | Até exclusão da conta |
| `budgets` | `planned_amount`, `month`, `family_member_id` | Execução de contrato (II) | Orçamento pessoal/familiar | Até exclusão da conta |
| `recurrences` | `template_transaction` (JSON com valor e descrição) | Execução de contrato (II) | Automação de lançamentos recorrentes | Até exclusão da conta |
| `bank_connections` | `institution_name`, `last_four_digits`, `sync_status` | Execução de contrato (II) | Vinculação com bancos para importação | Até exclusão da conta |
| `monthly_snapshots` | Agregados mensais (saldos, receitas, despesas, patrimônio) | Execução de contrato (II) | Evolução patrimonial, dashboard | Até exclusão da conta |
| `documents` | `file_name`, `file_path`, `mime_type` | Execução de contrato (II) | Comprovantes e anexos | Até exclusão da conta |

### 2.3 Tabelas com dados operacionais (sem dados pessoais diretos)

| Tabela | Conteúdo | Dado pessoal? | Justificativa |
|---|---|---|---|
| `categories` | Nomes de categorias (sistema + custom) | Não | Dados do sistema, não identificam titular |
| `chart_of_accounts` | Plano de contas contábil | Não | Estrutura contábil parametrizável |
| `cost_centers` | Centros de custo/lucro | Não (exceto `name` se = nome de pessoa) | Dados organizacionais |
| `center_allocations` | Rateios entre centros | Não | Dados operacionais |
| `workflows` | Tarefas periódicas configuradas | Não | Dados operacionais |
| `workflow_tasks` | Instâncias de tarefas | Não | Dados operacionais |
| `setup_journey` | Progresso do onboarding coach | Não | Dados de configuração |
| `description_aliases` | Mapeamento de descrições de cartão | Indiretamente (textos de fatura) | Vinculado a user_id, mas conteúdo é operacional |
| `economic_indices` | IPCA, Selic, cotações | Não | Dados públicos |
| `economic_indices_sources` | Config de fontes de dados | Não | Dados de sistema |
| `tax_parameters` | Faixas IRPF, INSS, salário mínimo | Não | Dados públicos regulatórios |

---

## 3. Mecanismos de proteção implementados

| Mecanismo | Status | Evidência |
|---|---|---|
| Isolamento por titular (RLS) | Implementado | 91 políticas com `(select auth.uid())`, todas as 28 tabelas |
| Criptografia em trânsito (TLS) | Implementado | Supabase + Vercel (HTTPS obrigatório, HSTS preload) |
| Criptografia em repouso | Implementado | AES-256 no Supabase (disco), campos sensíveis cifrados (CPF, notas, DEK) |
| Minimização de dados | Parcial | CPF é opcional, coletado apenas para finalidade fiscal. `notes_encrypted` cifrado client-side |
| Direito ao esquecimento | Implementado | `cron_process_account_deletions` purga 20 tabelas, PII removida do perfil, prazo de 7 dias |
| Portabilidade (art. 18, V) | Implementado | Export completo em JSON/CSV via `/settings/data` (5 colunas sensíveis excluídas do export) |
| Política de privacidade | Implementada | `/privacy` (11 seções, LGPD + Apple) |
| Consentimento para CPF | Parcial | CPF é campo opcional. Falta: checkbox explícito de consentimento antes de salvar |
| Registro de operações de tratamento (ROPA) | **Não implementado** | Este documento é o primeiro passo |
| RIPD (Relatório de Impacto) | **Não implementado** | Requerido pelo art. 38 quando solicitado pela ANPD |

---

## 4. Lacunas e ações recomendadas

| # | Lacuna | Risco | Ação | Esforço | Prioridade |
|---|---|---|---|---|---|
| L1 | `analytics_events` sem política de retenção | Acúmulo indefinido de dados comportamentais | Definir TTL de 12 meses + pg_cron para cleanup | 30 min (migration + cron) | Média |
| L2 | `notification_log` sem política de retenção | Acúmulo de comunicações | Definir TTL de 90 dias + pg_cron | 30 min | Média |
| L3 | Consentimento explícito para CPF ausente | LGPD art. 7o, I: consentimento deve ser livre, informado e inequívoco | Checkbox na UI de perfil antes de salvar CPF | 1h | Alta (pré-lançamento) |
| L4 | ROPA (Registro de Operações) não formalizado | Art. 37: controlador deve manter registro | Este documento + formalizar em template ANPD | 2h | Média |
| L5 | RIPD não produzido | Art. 38: ANPD pode solicitar para tratamento de dados financeiros | Produzir RIPD básico (titular, finalidade, riscos, salvaguardas) | 4-8h | Baixa (produzir quando escalar) |
| L6 | DPO não designado | Art. 41: controlador deve indicar encarregado | Para uso pessoal/beta, o próprio titular é o controlador. Formalizar quando abrir para terceiros | 0 (por enquanto) | Baixa |
| L7 | Termos de uso inexistentes | Falta contrato formal com o titular | Produzir Termos de Uso (complementar a Privacy Policy) | 2-4h | Alta (pré-lançamento) |

---

## 5. Fluxos de dados externos

| Fluxo | Dados transmitidos | Destinatário | Base legal | Salvaguarda |
|---|---|---|---|---|
| Supabase Auth (GoTrue) | E-mail, senha hash, MFA seed | Supabase Inc. (AWS sa-east-1) | Execução de contrato (II) | TLS, dados em região BR, DPA Supabase |
| Supabase Database | Todos os dados das 28 tabelas | Supabase Inc. (AWS sa-east-1) | Execução de contrato (II) | TLS, AES-256 em repouso, RLS |
| Resend (e-mail) | E-mail do titular, conteúdo do digest | Resend Inc. | Execução de contrato (II) | TLS, dados agregados (sem textos descritivos) |
| BCB SGS / PTAX | Nenhum dado pessoal (consulta pública) | Banco Central do Brasil | N/A | API pública |
| Frankfurter / CoinGecko | Nenhum dado pessoal | Terceiros | N/A | API pública |
| Vercel (hospedagem) | Headers HTTP, IP (logs de edge) | Vercel Inc. | Legítimo interesse (IX) | DPA Vercel, logs de 30 dias |
| Sentry (se ativado) | Stack traces, browser info, IP (anonimizável) | Sentry Inc. | Legítimo interesse (IX) | DSN opt-in, tracesSampleRate 10% |

---

## 6. Direitos do titular (art. 18) e implementação

| Direito | Artigo | Implementação | Status |
|---|---|---|---|
| Confirmação de tratamento | 18, I | Política de privacidade em `/privacy` | Implementado |
| Acesso aos dados | 18, II | Export completo em `/settings/data` | Implementado |
| Correção | 18, III | Edição de perfil, contas, transações | Implementado |
| Anonimização/bloqueio/eliminação | 18, IV | Exclusão de conta (7 dias, purga de 20 tabelas) | Implementado |
| Portabilidade | 18, V | Export JSON/CSV | Implementado |
| Eliminação com consentimento | 18, VI | Exclusão de conta | Implementado |
| Informação sobre compartilhamento | 18, VII | Seção 5 deste documento + `/privacy` | Implementado |
| Revogação de consentimento | 18, IX | Exclusão de CPF (campo opcional), exclusão de conta | Parcial (falta checkbox de consentimento) |

---

## Registro de versões

| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 19/03/2026 | Mapeamento inicial de 28 tabelas. 7 lacunas identificadas. Fluxos externos documentados. |

# Oniefy — Mapeamento de Conformidade LGPD

**Versão:** 1.0
**Data:** 26 de março de 2026
**Atualizar quando:** base atingir 100 usuários, ou antes de qualquer parceria B2B

---

## 1. Resumo Executivo

O Oniefy coleta dados financeiros pessoais sensíveis. A conformidade com a LGPD (Lei 13.709/2018) é obrigatória. Este documento mapeia as lacunas atuais e define o roadmap de conformidade.

**Status atual:** Produto em beta fechado (< 10 usuários). A maioria das práticas de privacidade está implementada no código, mas falta formalização documental.

---

## 2. Dados Pessoais Tratados

### 2.1 Identificação

| Dado | Base legal | Armazenamento | Criptografia |
|------|-----------|---------------|-------------|
| Nome completo | Execução contratual (Art. 7º, V) | users_profile.full_name | Texto plano |
| Email | Execução contratual | auth.users.email (Supabase Auth) | Gerenciado pelo Supabase |
| CPF | Consentimento explícito (Art. 7º, I) | users_profile.cpf_encrypted | AES-256 (DEK + KEK) |

### 2.2 Dados Financeiros

| Dado | Base legal | Sensibilidade |
|------|-----------|---------------|
| Saldos bancários | Execução contratual | Alta |
| Transações | Execução contratual | Alta |
| Patrimônio (bens, veículos) | Execução contratual | Alta |
| Dados fiscais (IRPF) | Execução contratual | Alta |
| Dívidas, financiamentos | Execução contratual | Alta |
| Garantias de bens (warranties) | Execução contratual | Média |
| Metas de economia (savings_goals) | Execução contratual | Média |

### 2.3 Dados Técnicos

| Dado | Base legal | Retenção |
|------|-----------|----------|
| IP de acesso | Legítimo interesse (Art. 7º, IX) | 90 dias (access_logs, cron cleanup) |
| User agent | Legítimo interesse | 90 dias |
| Analytics events | Legítimo interesse | 90 dias (cron cleanup) |

---

## 3. Direitos do Titular — Status de Implementação

| Direito (Art. 18) | Status | Implementação |
|--------------------|--------|---------------|
| I. Confirmação de tratamento | ✅ | Política de Privacidade pública (/privacy) |
| II. Acesso aos dados | ✅ | Exportação completa em /settings/data (14 tabelas + perfil, JSON/CSV) |
| III. Correção | ✅ | Edição de perfil, contas, transações via UI |
| IV. Anonimização/bloqueio | 🟡 | Exclusão de conta implementada (7 dias carência + purge de 20 tabelas). Anonimização parcial (nome → "[excluído]", CPF → NULL). Falta: bloqueio sem exclusão |
| V. Portabilidade | ✅ | Export JSON/CSV cobre portabilidade básica. Falta: formato interoperável (OFX export?) |
| VI. Eliminação | ✅ | CFG-06: cron_process_account_deletions (diário 03:30 UTC). Purge cascata de 20 tabelas |
| VII. Info sobre compartilhamento | ✅ | Política de Privacidade lista: Supabase (infraestrutura), Gemini (IA, com PII sanitizada), Resend (email) |
| VIII. Info sobre consentimento | 🟡 | Consentimento implícito no cadastro. Falta: consentimento granular para CPF e IA |
| IX. Revogação | 🟡 | Exclusão de conta revoga tudo. Falta: revogação granular (ex: revogar apenas compartilhamento com IA) |

---

## 4. Lacunas Identificadas

### L1. Política de Privacidade ✅
Página /privacy implementada. Cobre: dados coletados, finalidade, base legal, direitos do titular, contato DPO.

### L2. Exportação de dados ✅
/settings/data exporta 14 tabelas em JSON ou CSV. Campos criptografados permanecem cifrados (DEK não incluída por design).

### L3. Consentimento CPF ⬜
**Lacuna:** CPF é coletado sem checkbox de consentimento explícito separado. É armazenado criptografado (AES-256), mas a coleta deveria ter consentimento granular (Art. 8º).

**Recomendação:** Adicionar checkbox no formulário de CPF (family members) com texto: "Autorizo o armazenamento criptografado do CPF para fins de declaração fiscal. Posso revogar a qualquer momento em Configurações."

**Esforço:** Baixo (1 campo boolean + UI).

### L4. ROPA (Registro de Operações de Tratamento) ⬜
**Lacuna:** Não existe documento formal de ROPA (Art. 37). Para < 100 usuários, a ANPD aceita registro simplificado.

**Recomendação:** Criar planilha com: finalidade, base legal, categoria de dados, compartilhamento, retenção, medidas de segurança. Este documento é a base.

**Esforço:** Documento, sem código. 2h de trabalho.

### L5. RIPD (Relatório de Impacto) para módulo fiscal ⬜
**Lacuna:** Tratamento de dados sensíveis (CPF, rendimentos tributáveis) deveria ter RIPD (Art. 38). Não é obrigatório até solicitação da ANPD, mas é boa prática.

**Recomendação:** Elaborar RIPD simplificado cobrindo: módulo fiscal, cálculo de IR, projeção de provisionamento. Mitigações já implementadas: criptografia CPF, sanitização PII antes de IA, export sem DEK.

**Esforço:** Documento, sem código. 4h de trabalho.

### L6. DPO (Encarregado de Dados) ⬜
**Lacuna:** Não há DPO nomeado formalmente. Para empresas de pequeno porte (Resolução CD/ANPD nº 2/2022), o DPO pode ser dispensado se houver canal de comunicação. O email de contato já está na /privacy.

**Recomendação:** Enquanto for operação solo, documentar Claudio como DPO interino. Quando tiver CNPJ, nomear formalmente.

**Esforço:** 1 linha no /privacy + documentação interna.

---

## 5. Medidas Técnicas de Segurança Implementadas

| Medida | Status | Detalhes |
|--------|--------|---------|
| Criptografia em trânsito (TLS) | ✅ | HSTS preload, Vercel edge |
| Criptografia em repouso (CPF) | ✅ | AES-256, DEK + KEK, material estável |
| Row Level Security | ✅ | 107 policies, todas com initplan pattern |
| Rate limiting | ✅ | In-memory (middleware) + GoTrue (Supabase) |
| Sanitização PII | ✅ | Regex obrigatório antes de toda chamada IA (6 padrões) |
| Session timeout | ✅ | Auto-logout, DEK purge em background |
| Audit log | ✅ | access_logs com IP, user_agent, ação |
| Retenção limitada | ✅ | 5 cron jobs de cleanup (access_logs, analytics, notifications, ai_cache, soft_deleted) |
| Exclusão de conta | ✅ | 7 dias carência + purge cascata de 20 tabelas + anonimização PII |
| Exportação de dados | ✅ | JSON/CSV de 14 tabelas via /settings/data |
| Security headers | ✅ | CSP, HSTS, X-Frame-Options, Permissions-Policy, Referrer-Policy |
| Sentry PII scrub | ✅ | beforeSend sanitiza exception messages e breadcrumbs |

---

## 6. Compartilhamento com Terceiros

| Terceiro | Dados compartilhados | Base legal | Medidas |
|----------|---------------------|-----------|---------|
| Supabase (infra) | Todos os dados armazenados | Execução contratual | RLS, sa-east-1 (SP), ToS Supabase |
| Google (Gemini Flash-Lite) | Descrições de transações (sanitizadas) | Consentimento implícito | PII removida antes do envio, cache 30 dias |
| Resend (email) | Email do usuário | Execução contratual | Apenas para digest semanal e auth |
| Vercel (hosting) | Logs de acesso (IP, user_agent) | Legítimo interesse | Edge network, dados transitórios |

**Nenhum dado é vendido, compartilhado para marketing ou usado para publicidade.**

---

## 7. Roadmap de Conformidade

| Fase | Gatilho | Itens |
|------|---------|-------|
| Atual (< 10 users) | Já implementado | /privacy, export, exclusão, criptografia, PII sanitization |
| Antes de 100 users | L3 (consentimento CPF), L4 (ROPA simplificado), L6 (DPO interino) |
| Antes de B2B/parceria | L5 (RIPD), DPA com Supabase, revisão jurídica completa |
| Antes de certificação | ASVS L2, ISO 27001 gap analysis, SOC 2 Type I |

---

*Este documento não constitui assessoria jurídica. Consultar advogado especializado em proteção de dados antes do lançamento público.*

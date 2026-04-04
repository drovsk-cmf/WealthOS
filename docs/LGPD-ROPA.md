# ROPA - Registro de Operações de Tratamento de Dados Pessoais

**Controlador:** Oniefy (responsável: Claudio Macêdo Filho)
**Encarregado (DPO):** privacidade@oniefy.com
**Data:** 04/04/2026
**Base legal primária:** Consentimento (Art. 7º, I) e Execução de contrato (Art. 7º, V)

---

## 1. Operações de tratamento

| # | Operação | Dados tratados | Finalidade | Base legal | Compartilhamento | Retenção | Medidas de segurança |
|---|----------|---------------|-----------|-----------|-----------------|---------|---------------------|
| 1 | Cadastro e autenticação | E-mail, senha (hash bcrypt), nome | Criação e acesso à conta | Execução de contrato (Art. 7º, V) | Supabase Auth (processador) | Enquanto conta ativa + 30 dias após exclusão | MFA TOTP, rate limiting, RLS |
| 2 | Perfil do usuário | Nome, moeda padrão, fuso horário | Personalização do app | Execução de contrato | Supabase (processador) | Enquanto conta ativa | RLS por user_id, criptografia em trânsito (TLS 1.3) |
| 3 | Contas bancárias | Nome da conta, tipo, saldo, banco, agência, conta, dígito | Gestão financeira pessoal | Execução de contrato | Supabase (processador) | Enquanto conta ativa | RLS, dados bancários opcionais |
| 4 | Transações financeiras | Valor, data, descrição, categoria, conta | Registro e análise de movimentações | Execução de contrato | Supabase (processador) | Enquanto conta ativa | RLS, logs de auditoria |
| 5 | CPF (criptografado) | CPF dos membros da família | Declaração fiscal (IRPF) | Consentimento explícito (Art. 7º, I) | Supabase (processador), nunca compartilhado com terceiros | Enquanto conta ativa, revogável a qualquer momento | AES-256-GCM client-side, DEK por usuário, KEK no Keychain |
| 6 | Rendimentos e deduções | Valores tributáveis, deduções, fontes | Consolidação fiscal | Execução de contrato | Supabase (processador) | Enquanto conta ativa | RLS, criptografia em trânsito |
| 7 | Patrimônio | Bens, valores, depreciação, seguros | Gestão patrimonial | Execução de contrato | Supabase (processador) | Enquanto conta ativa | RLS |
| 8 | Membros da família | Nome, parentesco, data de nascimento, dependência fiscal | Estrutura familiar para orçamento e IRPF | Execução de contrato + consentimento para CPF | Supabase (processador) | Enquanto conta ativa | RLS, CPF criptografado separadamente |
| 9 | Diagnóstico financeiro | Métricas calculadas (LCR, runway, burn rate) | Análise de saúde financeira | Execução de contrato | Nenhum (processamento local + DB) | Snapshots mensais enquanto conta ativa | RLS, dados derivados sem PII |
| 10 | Categorização por IA | Descrição da transação (sanitizada) | Auto-categorização | Interesse legítimo (Art. 7º, IX) | Gemini API (Google) com PII sanitizada | Sem retenção pelo processador (zero-data-retention) | PII removida antes do envio, SHA-256 cache |
| 11 | Importação de extratos | Arquivos CSV/OFX carregados | Ingestão de dados bancários | Execução de contrato | Supabase Storage (processador) | Processados e descartados em 24h | Upload criptografado, bucket privado por usuário |
| 12 | Analytics de uso | Eventos de navegação anônimos | Melhoria do produto | Interesse legítimo (Art. 7º, IX) | Nenhum (processamento interno) | 90 dias | Dados anônimos, sem PII |

## 2. Processadores (sub-operadores)

| Processador | Serviço | Localização | DPA | Medidas |
|-------------|---------|-------------|-----|---------|
| Supabase Inc. | PostgreSQL, Auth, Storage | AWS sa-east-1 (São Paulo) | Termos de serviço Supabase | Criptografia at-rest, backups diários, SOC 2 Type II |
| Vercel Inc. | Hospedagem web (Next.js) | Edge global | DPA Vercel | Sem acesso a dados do DB, apenas serving estático |
| Google (Gemini API) | Categorização IA | EUA | Google Cloud DPA | Zero-data-retention, PII sanitizada antes do envio |

## 3. Transferência internacional

Dados armazenados primariamente em sa-east-1 (São Paulo). Transferência internacional ocorre apenas para:
- Categorização IA via Gemini API (dados sanitizados, sem PII, zero-retention)
- Vercel Edge (apenas assets estáticos, sem dados pessoais)

Base legal para transferência: Art. 33, II (cláusulas-padrão) via DPAs dos processadores.

## 4. Direitos dos titulares

Canal: privacidade@oniefy.com
Funcionalidades self-service implementadas:
- Exportação completa (JSON/CSV) via Configurações > Dados
- Exclusão de conta via Configurações > Segurança
- Revogação de CPF: exclusão do campo a qualquer momento

Prazo de resposta: 15 dias úteis.

---

*Documento simplificado conforme Resolução CD/ANPD nº 2/2022 (agentes de tratamento de pequeno porte).*
*Próxima revisão: quando atingir 100 usuários ativos ou introduzir novo processador.*

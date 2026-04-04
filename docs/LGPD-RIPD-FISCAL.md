# RIPD - Relatório de Impacto à Proteção de Dados Pessoais

**Módulo:** Fiscal (Impostos / IRPF)
**Controlador:** Oniefy (responsável: Claudio Macêdo Filho)
**Encarregado (DPO):** privacidade@oniefy.com
**Data:** 04/04/2026
**Revisão:** 1.0

---

## 1. Descrição do tratamento

O módulo fiscal do Oniefy consolida dados financeiros do usuário para facilitar a declaração anual de Imposto de Renda (IRPF). Inclui:

- Consolidação automática de rendimentos tributáveis a partir de transações categorizadas
- Cálculo de deduções elegíveis
- Listagem de bens e direitos (patrimônio)
- Listagem de dívidas e ônus
- Provisionamento mensal de IR estimado
- Exibição de tabelas fiscais atualizadas (alíquotas IRPF, INSS, deduções)

O módulo **não** transmite dados à Receita Federal. O usuário usa as informações consolidadas como referência para preencher sua própria declaração.

## 2. Dados pessoais tratados

| Categoria | Dados | Sensibilidade | Origem |
|-----------|-------|--------------|--------|
| Identificação | CPF (criptografado AES-256-GCM) | Alta | Informado pelo usuário |
| Financeiro | Rendimentos tributáveis e isentos | Alta | Derivado de transações |
| Financeiro | Deduções (saúde, educação, previdência) | Média | Derivado de transações categorizadas |
| Patrimonial | Bens, valores de aquisição e atuais | Média | Módulo de patrimônio |
| Patrimonial | Dívidas e saldos devedores | Média | Módulo de contas |
| Familiar | Dependentes fiscais (nome, parentesco, CPF) | Alta | Módulo de família |

## 3. Necessidade e proporcionalidade

**Necessidade:** O tratamento é necessário para a finalidade contratada (gestão financeira pessoal). Sem a consolidação fiscal, o usuário precisaria fazer manualmente a soma de centenas de transações.

**Proporcionalidade:** Apenas dados estritamente necessários para a declaração IRPF são processados. O módulo não coleta dados além do que o usuário já inseriu para gestão financeira. CPF é o único dado coletado especificamente para fins fiscais, com consentimento explícito.

**Minimização:** 
- CPF é criptografado client-side (AES-256-GCM) antes de chegar ao servidor
- Chave de criptografia (DEK) nunca sai do dispositivo
- Tabelas fiscais são públicas (RFB), não contêm dados pessoais

## 4. Riscos identificados e mitigações

| # | Risco | Probabilidade | Impacto | Mitigação | Risco residual |
|---|-------|--------------|---------|-----------|---------------|
| R1 | Vazamento de CPF | Baixa | Alto | Criptografia AES-256-GCM client-side, DEK no Keychain/localStorage criptografado, CPF nunca trafega em texto claro | Baixo |
| R2 | Acesso não autorizado a dados fiscais | Baixa | Alto | RLS por user_id em todas as tabelas, MFA obrigatório, session timeout 30min | Baixo |
| R3 | Inferência de renda via snapshots | Muito baixa | Médio | Snapshots contêm valores agregados, não transações individuais. RLS impede acesso cruzado | Muito baixo |
| R4 | Exposição em export de dados | Baixa | Médio | CPF permanece criptografado no export (sem DEK no arquivo). Usuário controla o download | Baixo |
| R5 | Categorização IA expõe dados fiscais | Muito baixa | Médio | PII sanitizada antes de envio à API. Valores monetários, CPFs e nomes removidos pelo sanitizer. Zero-data-retention no processador | Muito baixo |
| R6 | Cálculo fiscal incorreto gera prejuízo | Média | Médio | Disclaimers claros ("ferramenta auxiliar, não substitui contador"). Tabelas verificadas em 2+ fontes oficiais. Curadoria humana | Baixo (risco operacional, não de privacidade) |
| R7 | Retenção excessiva de dados fiscais | Baixa | Baixo | Dados retidos enquanto conta ativa. Exclusão de conta remove tudo em 30 dias. Snapshots históricos excluídos junto | Muito baixo |

## 5. Medidas de segurança implementadas

**Criptografia:**
- CPF: AES-256-GCM com DEK por usuário, KEK derivada de senha
- Trânsito: TLS 1.3 (Supabase + Vercel)
- Repouso: Criptografia at-rest (Supabase/AWS)

**Controle de acesso:**
- RLS (Row Level Security) em todas as 38 tabelas
- 123 políticas RLS ativas
- MFA TOTP disponível
- Session timeout configurável

**Auditoria:**
- Campos created_at/updated_at em todas as tabelas
- Logs de acesso retidos por 90 dias

**Sanitização IA:**
- PII removida antes de chamadas à API de categorização
- Cache SHA-256 evita reprocessamento
- Zero-data-retention no processador (Gemini API)

## 6. Conclusão

O tratamento de dados no módulo fiscal é necessário, proporcional e adequadamente protegido. Os riscos residuais são baixos, com mitigações técnicas e organizacionais em vigor. A principal recomendação é manter a curadoria humana das tabelas fiscais e os disclaimers de que o módulo é auxiliar.

**Próxima revisão:** Quando introduzir transmissão direta à RFB ou integração com contadores.

---

*Elaborado conforme Art. 38 da LGPD (Lei 13.709/2018) e orientações da ANPD.*

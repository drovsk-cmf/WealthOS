# Auditoria Oniefy — Resumo Consolidado

**Data:** 2026-03-16
**Versão do código:** cffe851
**Referências:** OWASP ASVS v4.0 L2, OWASP MASVS v2, Nielsen Heuristics, ISO 9241-110, WCAG 2.2 AA

---

## Matriz de prioridade

| # | Domínio | ID | Severidade | Achado (uma linha) | Esforço |
|---|---|---|---|---|---|
| 1 | Auth & Sessão | D1.01 ⏭️ | ALTO | Rate limiter in-memory não compartilha estado entre instâncias serverless | Médio |
| 2 | Auth & Sessão | D1.02 ✅ | ALTO | Registro e forgot-password contornam rate limiter do servidor | Baixo |
| 3 | Input/Output | D3.01 ✅ | ALTO | Parsers CSV e XLSX sem limite de tamanho de arquivo | Baixo |
| 4 | Mobile | D4.01 ✅ | ALTO | `authenticate()` retorna `false` — bug dormente que impede biometria | Baixo |
| 5 | Mobile | D4.03 ⏭️ | ALTO | Certificate pinning não implementado | Alto |
| 6 | Performance | D6.09 ✅ | ALTO | Funções SECURITY DEFINER sem SET search_path (migrations 001, 003) | Médio |
| 7 | Performance | D6.15 ⏭️ | ALTO | Trigger `recalculate_account_balance` faz full-table scan (O(n²) em imports) | Alto |
| 8 | UX | D7.01 ✅ | ALTO | Campo de valor monetário não aceita formato brasileiro (vírgula) | Baixo |
| 9 | UX | D7.02 ✅ | ALTO | Ausência de feedback de sucesso após operações CRUD | Médio |
| 10 | UX | D7.03 ⏭️ | ALTO | Transações não podem ser editadas, apenas estornadas | Alto |
| 11 | Acessibilidade | D8.01 ⏭️ | ALTO | Dialogs customizados sem `role="dialog"`, `aria-modal` e focus trap | Alto |
| 12 | Acessibilidade | D8.02 ✅ | ALTO | Botão de logout sem `aria-label` | Baixo |
| 13 | Acessibilidade | D8.03 ✅ | ALTO | Botão de filtro sem `aria-label` | Baixo |
| 14 | Acessibilidade | D8.07 ✅ | ALTO | Tabelas sem `scope` nos `<th>` | Baixo |
| 15 | Acessibilidade | D8.10 ✅ | ALTO | Informação financeira diferenciada apenas por cor | Médio |
| 16 | Auth & Sessão | D1.03 ✅ | MÉDIO | Comparação de segredo do cron vulnerável a timing attack | Baixo |
| 17 | Auth & Sessão | D1.04 ✅ | MÉDIO | Timeout de sessão não limpa cache do Service Worker | Baixo |
| 18 | Auth & Sessão | D1.05 ⏭️ | MÉDIO | Verificação AAL2 (MFA) apenas client-side | Médio |
| 19 | Acesso & Dados | D2.01 ✅ | MÉDIO | Exportação vaza `cpf_encrypted` de `family_members` | Baixo |
| 20 | Acesso & Dados | D2.02 ✅ | MÉDIO | `useUpdateAsset` sem filtro `user_id` (defesa em profundidade) | Baixo |
| 21 | Acesso & Dados | D2.03 ✅ | MÉDIO | `usePayBill` sem filtro `user_id` (defesa em profundidade) | Baixo |
| 22 | Acesso & Dados | D2.04 ✅ | MÉDIO | SSRF potencial em `cron_fetch_economic_indices` sem hostname allowlist | Médio |
| 23 | Input/Output | D3.02 ✅ | MÉDIO | Comparação de segredo do cron timing-unsafe (ref. cruzada D1.03) | Baixo |
| 24 | Input/Output | D3.03 ✅ | MÉDIO | Endpoint digest/preview expõe erros internos do Supabase | Baixo |
| 25 | Input/Output | D3.04 ✅ | MÉDIO | Endpoint digest/send vaza erros internos | Baixo |
| 26 | Input/Output | D3.05 ✅ | MÉDIO | Endpoint indices/fetch vaza erros internos | Baixo |
| 27 | Mobile | D4.02 ⏭️ | MÉDIO | `attemptBiometricUnlock()` bypass sem biometria real | Médio |
| 28 | Código | D5.01 ✅ | MÉDIO | Detecção de plataforma Capacitor duplicada | Baixo |
| 29 | Código | D5.02 ✅ | MÉDIO | Formatação de moeda BRL duplicada | Baixo |
| 30 | Código | D5.04 ✅ | MÉDIO | 4 dependências Capacitor não utilizadas no código-fonte | Baixo |
| 31 | Performance | D6.01 ✅ | MÉDIO | select("*") em 9 hooks de listagem | Médio |
| 32 | Performance | D6.02 ✅ | MÉDIO | Triple query em useTransactions (select * + re-fetch relações) | Baixo |
| 33 | Performance | D6.03 ✅ | MÉDIO | Ausência de staleTime em hooks CRUD | Baixo |
| 34 | Performance | D6.04 ✅ | MÉDIO | Índice trigram ausente para ILIKE em transactions.description | Baixo |
| 35 | Performance | D6.05 ✅ | MÉDIO | FK matched_transaction_id sem índice | Baixo |
| 36 | Performance | D6.10 ✅ | MÉDIO | cron_depreciate_assets sem guarda de duplicata mensal | Baixo |
| 37 | Performance | D6.11 ✅ | MÉDIO | cron_process_account_deletions sem timeout/dead-letter | Baixo |
| 38 | UX | D7.04 ✅ | MÉDIO | Rótulos de moeda fixos em "R$" apesar de suporte multi-moeda | Baixo |
| 39 | UX | D7.05 ✅ | MÉDIO | Sem busca/filtro em páginas de contas, patrimônio, categorias, bills | Médio |
| 40 | UX | D7.06 ✅ | MÉDIO | Diálogo de cópia de orçamento sem ESC close e focus trap | Baixo |
| 41 | UX | D7.07 ✅ | MÉDIO | Sem duplicação de transação ou recorrência a partir de existente | Médio |
| 42 | UX | D7.08 ✅ | MÉDIO | Mensagens de erro do Supabase em inglês | Baixo |
| 43 | UX | D7.09 ✅ | MÉDIO | Página de política de privacidade referenciada mas inexistente | Baixo |
| 44 | UX | D7.10 ✅ | MÉDIO | Sem tooltip/ajuda contextual para funcionalidades complexas | Médio |
| 45 | UX | D7.11 ✅ | MÉDIO | Indicador de última sincronização ausente | Baixo |
| 46 | Acessibilidade | D8.04 ✅ | MÉDIO | Labels sem htmlFor — BudgetForm (4 campos) | Baixo |
| 47 | Acessibilidade | D8.05 ✅ | MÉDIO | Labels sem htmlFor — AssetForm (8 campos) | Baixo |
| 48 | Acessibilidade | D8.06 ✅ | MÉDIO | Labels sem htmlFor — RecurrenceForm (10+ campos) | Baixo |
| 49 | Acessibilidade | D8.08 ✅ | MÉDIO | `aria-required` ausente em campos obrigatórios | Médio |
| 50 | Acessibilidade | D8.09 ✅ | MÉDIO | `aria-describedby` ausente em mensagens de erro | Médio |
| 51 | Acessibilidade | D8.11 ✅ | MÉDIO | Overlay do sidebar mobile sem acessibilidade de teclado | Baixo |
| 52 | Acessibilidade | D8.13 ✅ | MÉDIO | Botões de cor sem aria-label | Baixo |
| 53 | Acessibilidade | D8.15 ✅ | MÉDIO | Radio customizado sem role, fieldset, legend | Médio |
| 54 | Acessibilidade | D8.16 ✅ | MÉDIO | Indicador de força de senha apenas por cor | Baixo |
| 55 | Auth & Sessão | D1.06 ⏭️ | BAIXO | Login schema não aplica blocklist de senhas | Baixo |
| 56 | Auth & Sessão | D1.07 ✅ | BAIXO | Erros do Supabase vazam info no login proxy | Baixo |
| 57 | Auth & Sessão | D1.08 ✅ | BAIXO | Erros do Supabase expostos em registro e forgot-password | Baixo |
| 58 | Acesso & Dados | D2.05 ✅ | BAIXO | Cost center sync sem filtro user_id em family_members | Baixo |
| 59 | Input/Output | D3.06 ✅ | BAIXO | Sanitização de CSV injection remove caracteres legítimos | Baixo |
| 60 | Mobile | D4.04 ⏭️ | BAIXO | Plugin biometric-auth ausente do package.json | Baixo |
| 61 | Código | D5.03 ✅ | BAIXO | Formatação de mês reimplementada em 3 locais | Baixo |
| 62 | Código | D5.05 ✅ | BAIXO | console.log em path de produção (Service Worker handler) | Baixo |
| 63 | Código | D5.06 ✅ | BAIXO | console.warn em stubs biométricos sem condição de ambiente | Baixo |
| 64 | Código | D5.07 ✅ | BAIXO | console.warn em fallback de criptografia | Baixo |
| 65 | Código | D5.08 ✅ | BAIXO | console.error incondicional em logSchemaError | Baixo |
| 66 | Código | D5.09 ⏭️ | BAIXO | TODO pendente para Fase 10 (biometria) | Baixo |
| 67 | Performance | D6.06 ⏭️ | BAIXO | useBudgetMonths sem DISTINCT no banco | Baixo |
| 68 | Performance | D6.07 ⏭️ | BAIXO | useMultiIndexHistory N RPCs paralelas vs query única | Baixo |
| 69 | Performance | D6.08 ⏭️ | BAIXO | useProgressiveDisclosure 7 queries COUNT simultâneas | Baixo |
| 70 | Performance | D6.12 ⏭️ | BAIXO | cron_fetch_economic_indices sem timeout HTTP | Baixo |
| 71 | Performance | D6.13 ⏭️ | BAIXO | useDeleteAsset exclusão manual de FK com CASCADE existente | Baixo |
| 72 | Performance | D6.14 ⏭️ | BAIXO | createTransaction 2 UPDATEs sequenciais após RPC | Baixo |
| 73 | Performance | D6.16 ⏭️ | BAIXO | Invalidação sequencial de query caches com await | Baixo |
| 74 | UX | D7.12 ✅ | BAIXO | Botões de ação primária inconsistentes entre formulários | Baixo |
| 75 | UX | D7.13 ✅ | BAIXO | Placeholder sugere vírgula mas input aceita ponto | Baixo |
| 76 | UX | D7.14 ✅ | BAIXO | setTimeout para abrir diálogo de cópia — race condition | Baixo |
| 77 | UX | D7.15 ✅ | BAIXO | Exclusão de categoria sem alerta de impacto em transações | Baixo |
| 78 | UX | D7.16 ✅ | BAIXO | Import sem indicador de progresso durante parsing | Baixo |
| 79 | Acessibilidade | D8.12 ✅ | BAIXO | Alguns botões sem focus ring visível | Baixo |
| 80 | Acessibilidade | D8.14 ✅ | BAIXO | Auth layout sem landmark `<main>` | Baixo |

## Resumo quantitativo

- **Total:** 80 achados
- **Críticos:** 0 | **Altos:** 15 | **Médios:** 39 | **Baixos:** 26
- **Resolvidos:** 63 | **Excluídos:** 17 (aceitos/adiados)
- **Nota geral do codebase: 7/10** — Arquitetura sólida com segurança bem pensada (RLS, encryption, CSP, rate limiting), mas lacunas significativas em acessibilidade, UX polish e algumas inconsistências de defesa em profundidade. A base é boa; os achados são majoritariamente de refinamento, não de fundação.

## Top 10 correções de maior alavancagem

1. **D8.04/05/06 + D8.08/09 — Labels `htmlFor` + `aria-required` + `aria-describedby` em todos os formulários** (MÉDIO / Médio) — Batch único: adicionar `id` aos inputs, `htmlFor` aos labels, `aria-required` aos obrigatórios, `aria-describedby` aos erros. Cobre 5 achados de uma vez.

2. **D7.01 — Campo de valor monetário aceitar formato brasileiro** (ALTO / Baixo) — Input mask que converte vírgula para ponto. Impacto direto no fluxo mais usado do app (criar transação).

3. **D3.03/04/05 — Erros internos não expostos em respostas de API** (MÉDIO / Baixo) — Batch: substituir `error.message` por mensagem genérica nos 3 endpoints. 15 minutos de trabalho.

4. **D1.02 — Register e forgot-password passarem pelo rate limiter** (ALTO / Baixo) — Rotear calls via API routes existentes em vez de chamar Supabase diretamente do cliente.

5. **D8.02/03 + D8.07 — `aria-label` nos botões icon-only + `scope` nas tabelas** (ALTO / Baixo) — Batch: adicionar atributos pontuais. 3 achados altos resolvidos em 20 minutos.

6. **D3.01 — Limite de tamanho nos parsers CSV e XLSX** (ALTO / Baixo) — Adicionar check de `file.size > MAX_SIZE` antes do parsing, como já existe no OFX parser.

7. **D8.10 — Indicadores financeiros não dependerem apenas de cor** (ALTO / Médio) — Adicionar prefixo (+/-) ou ícone (↑/↓) nos summary cards, saldos e centros de custo.

8. **D2.01 — Exportação excluir `cpf_encrypted`** (MÉDIO / Baixo) — Lista explícita de colunas para `family_members` na exportação, como já feito para `users_profile`.

9. **D2.02/03/05 — Filtro `user_id` nas mutações inconsistentes** (MÉDIO / Baixo) — Batch: adicionar `.eq("user_id", user.id)` em 4 mutações. Alinha defesa em profundidade.

10. **D6.01 — Substituir select("*") por colunas explícitas nos hooks de listagem** (MÉDIO / Médio) — 9 hooks afetados. Reduz payload e melhora performance em listas com muitos registros.

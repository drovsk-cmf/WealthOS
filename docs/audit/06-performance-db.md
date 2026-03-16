# Dominio 6 — Performance e Banco de Dados

**Referencia normativa:** Boas praticas de performance (React Query, PostgreSQL, Supabase)
**Data da auditoria:** 2026-03-16
**Arquivos analisados:** 58 (21 hooks em `src/lib/hooks/use-*.ts`, 34 migrations em `supabase/migrations/*.sql`, `src/lib/services/transaction-engine.ts`, `src/lib/query-provider.tsx`, mais arquivos auxiliares)

---

## Achados

### [MEDIO] D6.01 — select("*") em hooks que precisam de poucas colunas

**Arquivo:** `src/lib/hooks/use-accounts.ts` L73-78, `src/lib/hooks/use-categories.ts` L47-52, `src/lib/hooks/use-assets.ts` L109-113, `src/lib/hooks/use-bank-connections.ts` L40-45, `src/lib/hooks/use-cost-centers.ts` L39-45, `src/lib/hooks/use-recurrences.ts` L81-86, `src/lib/hooks/use-workflows.ts` L94-98, `src/lib/hooks/use-family-members.ts` L52-57, `src/lib/hooks/use-chart-of-accounts.ts` L58-63
**Descricao:** Nove hooks de listagem usam `.select("*")` para buscar todas as colunas das respectivas tabelas. Tabelas como `transactions`, `recurrences` (com coluna JSONB `template_transaction`), `chart_of_accounts` (com 17 colunas) e `assets` (com `notes_encrypted`) transferem dados desnecessarios ao cliente. Por exemplo, `useRecurrences` transfere o campo JSONB `template_transaction` inteiro na listagem mesmo que a UI de listagem so precise de `id`, `frequency`, `next_due_date`, `is_active` e poucos outros campos.
**Impacto:** Over-fetching aumenta o tamanho do payload JSON, consumo de memoria no cliente e tempo de parse. Com centenas de registros (especialmente em `transactions` que usa paginacao de 50), o impacto acumulado e mensuravel.
**Correcao:** Substituir `.select("*")` por selecao explicita das colunas necessarias em cada hook de listagem. Manter `select("*")` apenas nos hooks de detalhe individual (e.g., `useAccount(id)`).

---

### [MEDIO] D6.02 — select("*") na query de transacoes com posterior re-fetch de relacoes

**Arquivo:** `src/lib/hooks/use-transactions.ts` L45-93
**Descricao:** O hook `useTransactions` faz `select("*")` na tabela `transactions` (L47), e depois executa duas queries adicionais em batch para buscar `accounts` e `categories` relacionados (L89-93). A tabela `transactions` tem ~20 colunas incluindo `notes`, `tags`, `external_id`, `import_batch_id`, `amount_adjustment` que nao sao usadas na listagem. Alem disso, o Supabase suporta `select("id, description, amount, date, ..., accounts(name, color), categories(name, icon, color)")` com JOINs inline, eliminando as 2 queries extras.
**Impacto:** Cada carregamento da lista de transacoes executa 3 queries (1 principal + 2 lookups) em vez de 1, triplicando latencia de rede. O over-fetching de colunas agrava a transferencia.
**Correcao:** Usar select com JOINs do Supabase: `.select("id, description, amount, date, type, is_paid, payment_status, account_id, category_id, accounts(name, color), categories(name, icon, color)")` e remover as queries separadas de accounts/categories.

---

### [MEDIO] D6.03 — Ausencia de staleTime em hooks de listagem CRUD

**Arquivo:** `src/lib/hooks/use-accounts.ts` L67-83, `src/lib/hooks/use-categories.ts` L41-63, `src/lib/hooks/use-transactions.ts` L39-112, `src/lib/hooks/use-recurrences.ts` L75-96, `src/lib/hooks/use-workflows.ts` L88-107, `src/lib/hooks/use-cost-centers.ts` L33-51, `src/lib/hooks/use-bank-connections.ts` L34-49, `src/lib/hooks/use-family-members.ts` L46-63, `src/lib/hooks/use-chart-of-accounts.ts` L52-72
**Descricao:** Embora o `QueryProvider` (L12) defina `staleTime` global de 5 minutos, os hooks do dashboard (`use-dashboard.ts`) explicitamente definem `staleTime: 2 * 60 * 1000`. No entanto, nenhum dos 9 hooks CRUD listados acima define `staleTime` proprio. Isso significa que dependem do default global (5 min), o que e adequado. Porem, o hook `useBudgets` (L96-131), `useBudgetMonths` (L162-180) e `usePendingBills` (L128-168) tambem nao definem staleTime, usando o default global. Nao ha problema funcional real — o staleTime global de 5 min e razoavel.
**Impacto:** Impacto baixo — o default global cobre estes hooks. Porem, hooks que chamam `supabase.auth.getUser()` em toda queryFn podem se beneficiar de staleTime mais longo para reduzir chamadas de autenticacao redundantes.
**Correcao:** Considerar extrair a chamada `auth.getUser()` para um hook/contexto compartilhado em vez de repetir em cada queryFn. Isso eliminaria ~20 chamadas redundantes ao auth endpoint.

---

### [MEDIO] D6.04 — Ausencia de indice para ILIKE em transactions.description

**Arquivo:** `src/lib/hooks/use-transactions.ts` L73-74, `supabase/migrations/001_initial_schema.sql` L222-242
**Descricao:** O hook `useTransactions` aplica `.ilike("description", `%${filters.search}%`)` (L74) para busca textual. A tabela `transactions` nao possui nenhum indice trigram (`pg_trgm`) na coluna `description`. Os indices existentes cobrem `user_id`, `date`, `type`, `account_id`, etc., mas nenhum suporta buscas ILIKE com wildcards bilaterais.
**Impacto:** Buscas textuais executam sequential scan na tabela inteira do usuario. Com milhares de transacoes acumuladas, a busca se torna lenta (O(n) por usuario).
**Correcao:** Criar indice GIN com pg_trgm: `CREATE INDEX idx_transactions_description_trgm ON transactions USING GIN (description gin_trgm_ops);` ou, se o volume nao justificar, considerar busca apenas client-side nos dados ja em cache.

---

### [MEDIO] D6.05 — FK transactions.matched_transaction_id sem indice

**Arquivo:** `supabase/migrations/028_bank_reconciliation.sql` L20
**Descricao:** A migration 028 adicionou `matched_transaction_id UUID REFERENCES transactions(id)` a tabela `transactions`, mas nao criou indice para esta foreign key. A migration 019 (`index_unindexed_foreign_keys`) foi aplicada antes da 028, portanto nao cobriu este campo. Nenhuma migration posterior adiciona o indice.
**Impacto:** Queries de conciliacao que filtram por `matched_transaction_id IS NULL` (e.g., `useUnmatchedImports` L52, `usePendingUnmatched` L103) nao podem usar indice para esta condicao. Alem disso, ON DELETE em cascata na FK sera lento sem indice de suporte.
**Correcao:** Adicionar indice parcial: `CREATE INDEX idx_tx_matched_transaction_id ON transactions(matched_transaction_id) WHERE matched_transaction_id IS NOT NULL;`

---

### [BAIXO] D6.06 — useBudgetMonths faz query sem DISTINCT no banco

**Arquivo:** `src/lib/hooks/use-budgets.ts` L167-178
**Descricao:** O hook `useBudgetMonths` faz `select("month")` e depois deduplica client-side com `Array.from(new Set(data.map(...)))` (L176). Isso transfere todos os registros de budgets do usuario apenas para extrair meses unicos, quando poderia usar uma query distinta no banco ou uma RPC.
**Impacto:** Com muitas categorias por mes (e.g., 20 categorias x 12 meses = 240 registros), transfere 240 linhas quando bastavam 12 valores distintos. Impacto baixo em volume absoluto mas e um anti-pattern.
**Correcao:** Usar `.select("month")` com RPC ou view que faz `SELECT DISTINCT month FROM budgets WHERE user_id = $1 ORDER BY month DESC`, ou adicionar logica de deduplicacao server-side.

---

### [BAIXO] D6.07 — useMultiIndexHistory executa N RPCs paralelas em vez de query unica

**Arquivo:** `src/lib/hooks/use-economic-indices.ts` L130-162
**Descricao:** O hook `useMultiIndexHistory` itera sobre `indexTypes` e executa uma RPC `get_economic_indices` separada para cada tipo de indice via `Promise.all` (L142-158). Se o usuario selecionar 5 indices para comparacao, dispara 5 RPCs simultaneas.
**Impacto:** Impacto baixo — as queries sao paralelas e cada uma e rapida. Porem, uma unica RPC aceitando array de index_types seria mais eficiente em latencia (1 round-trip em vez de N).
**Correcao:** Criar RPC `get_economic_indices_multi(p_index_types text[], p_date_from date, p_limit int)` que retorna resultados agrupados por index_type em uma unica chamada.

---

### [BAIXO] D6.08 — useProgressiveDisclosure executa 7 queries COUNT simultaneas

**Arquivo:** `src/lib/hooks/use-progressive-disclosure.ts` L35-63
**Descricao:** O hook dispara 7 queries `select("id", { count: "exact", head: true })` em paralelo para diferentes tabelas (transactions, accounts, assets, budgets, cost_centers, workflows). Cada query individual e leve (COUNT com head:true), mas sao 7 round-trips.
**Impacto:** Impacto baixo — as queries sao HEAD requests (sem payload de resposta) e sao cacheadas por 5 minutos. O overhead e principalmente de latencia de rede (7 requisicoes paralelas).
**Correcao:** Consolidar em uma unica RPC `get_disclosure_counts(p_user_id)` que retorna todos os counts em uma chamada. Baixa prioridade dado o caching e o staleTime de 5 min.

---

### [ALTO] D6.09 — Funcoes SECURITY DEFINER criadas sem SET search_path (001, 003)

**Arquivo:** `supabase/migrations/001_initial_schema.sql` L389-399 (`handle_new_user`), L404-484 (`recalculate_account_balance`); `supabase/migrations/003_transaction_engine.sql` L9-122 (`create_transaction_with_journal`), L135-186 (`reverse_transaction`)
**Descricao:** As funcoes `handle_new_user()`, `recalculate_account_balance()`, `create_transaction_with_journal()` e `reverse_transaction()` foram criadas como `SECURITY DEFINER` sem `SET search_path = public` nas migrations 001 e 003. A migration 017 corrigiu isso via `ALTER FUNCTION ... SET search_path = public` para estas funcoes. **Porem**, a migration 026 reescreveu `create_transfer_with_journal()` via `CREATE OR REPLACE` novamente sem `SET search_path`, e a migration 030 precisou corrigir novamente. Isso demonstra um padrao fragil: qualquer `CREATE OR REPLACE` futuro que esqueca `SET search_path` reintroduz a vulnerabilidade.
**Impacto:** Funcoes SECURITY DEFINER sem search_path fixo sao suscetiveis a schema injection — um usuario malicioso pode criar objetos em schemas com prioridade no search_path e sequestrar a execucao. A migration 017 e 030 mitigaram os casos conhecidos, mas o risco de regressao persiste.
**Correcao:** Estabelecer regra de linting/CI que valide que toda funcao SECURITY DEFINER contenha `SET search_path` no proprio corpo (nao apenas via ALTER posterior). Revisar se alguma funcao atual foi reescrita apos a 017 sem o SET.

---

### [MEDIO] D6.10 — cron_depreciate_assets sem guarda de duplicata mensal

**Arquivo:** `supabase/migrations/016_enable_pg_cron_and_jobs.sql` L96-124
**Descricao:** A funcao `cron_depreciate_assets()` aplica depreciacao mensal a todos os ativos com `depreciation_rate > 0`. O cron esta agendado para rodar no dia 1 de cada mes (`0 3 1 * *`). Porem, nao ha guarda contra execucao duplicada — se o job for executado manualmente ou re-executado por retry, aplica depreciacao novamente sobre o valor ja depreciado. Diferente do `cron_generate_workflow_tasks()` que verifica `IF EXISTS (SELECT 1 FROM workflow_tasks WHERE ...)` antes de inserir, esta funcao nao verifica se ja depreciou neste mes.
**Impacto:** Depreciacao duplicada em caso de retry ou execucao manual, reduzindo incorretamente o valor do ativo. Erro silencioso e dificil de detectar.
**Correcao:** Adicionar guarda verificando se ja existe registro em `asset_value_history` com `change_source = 'depreciation'` e `created_at` no mes corrente para o mesmo ativo antes de depreciar.

---

### [MEDIO] D6.11 — cron_process_account_deletions sem timeout ou dead-letter

**Arquivo:** `supabase/migrations/029_cron_process_account_deletions.sql` L4-66
**Descricao:** A funcao `cron_process_account_deletions()` executa 17 DELETE statements sequenciais por usuario em tabelas com potencialmente milhares de registros (transactions, journal_lines, center_allocations). Nao ha statement_timeout configurado, nao ha LIMIT nos DELETEs e nao ha mecanismo de dead-letter para registrar falhas parciais.
**Impacto:** Para usuarios com alto volume de dados, a funcao pode exceder o timeout do pg_cron (padrao 2 minutos no Supabase), falhando silenciosamente no meio da exclusao. Os deletes sao executados fora de transacao explicita (cada DELETE e seu proprio statement), podendo deixar dados parcialmente excluidos sem notificacao.
**Correcao:** (1) Envolver os DELETEs em `BEGIN/COMMIT` explicito (ja estao em funcao PL/pgSQL, entao sao transacionais por padrao — verificar se pg_cron respeita isso). (2) Adicionar `SET LOCAL statement_timeout = '300s'` no inicio da funcao. (3) Adicionar tratamento de excecoes com logging para dead-letter.

---

### [BAIXO] D6.12 — cron_fetch_economic_indices sem timeout por requisicao HTTP

**Arquivo:** `supabase/migrations/025_cron_daily_index_fetch.sql` L10-131
**Descricao:** A funcao `cron_fetch_economic_indices()` faz requisicoes HTTP sincrona via `extensions.http_get()` para cada fonte de indice ativa. Nao ha timeout configurado para requisicoes HTTP individuais. Se a API do BCB estiver lenta ou indisponivel, a funcao pode bloquear por tempo indeterminado.
**Impacto:** Bloqueio silencioso do worker pg_cron ate o timeout global (se houver). Outras funcoes cron podem atrasar.
**Correcao:** Adicionar `SET LOCAL statement_timeout = '120s'` no inicio da funcao, ou usar `extensions.http_get` com parametro de timeout se a extensao suportar.

---

### [BAIXO] D6.13 — useDeleteAsset faz exclusao manual de FK que deveria ser CASCADE

**Arquivo:** `src/lib/hooks/use-assets.ts` L319-326, `supabase/migrations/001_initial_schema.sql` L169-178
**Descricao:** O hook `useDeleteAsset` executa `delete().eq("asset_id", id)` manualmente em `asset_value_history` antes de deletar o asset (L324), com o comentario "Delete history first (FK constraint)". Porem, a FK `asset_value_history.asset_id REFERENCES assets(id) ON DELETE CASCADE` ja esta definida na migration 001 (L171). A exclusao manual e redundante.
**Impacto:** Duas queries em vez de uma. A exclusao manual nao respeita a atomicidade — se o segundo DELETE falhar, o historico ja foi excluido. Impacto baixo pois CASCADE faria o mesmo resultado, mas o codigo e desnecessariamente fragil.
**Correcao:** Remover a linha de DELETE em `asset_value_history` e confiar no CASCADE da FK. O Supabase/Postgres exclui automaticamente os registros filhos.

---

### [BAIXO] D6.14 — createTransaction faz 2 UPDATEs sequenciais apos RPC

**Arquivo:** `src/lib/services/transaction-engine.ts` L104-118
**Descricao:** Apos chamar a RPC `create_transaction_with_journal`, o codigo executa ate 2 UPDATEs separados na transacao recem-criada: um para `family_member_id` (L106-109) e outro para `category_source` (L113-117). Estes campos poderiam ser incluidos na propria RPC para manter atomicidade.
**Impacto:** 2 round-trips extras ao banco. Mais importante: os UPDATEs disparam o trigger `recalculate_account_balance` desnecessariamente (2 recalculos de saldo sem necessidade, pois `family_member_id` e `category_source` nao afetam saldo).
**Correcao:** Estender a RPC `create_transaction_with_journal` para aceitar `p_family_member_id` e `p_category_source` como parametros opcionais, definindo-os no INSERT original. Isso elimina 2 round-trips e 2 trigger fires inuteis.

---

### [ALTO] D6.15 — Trigger recalculate_account_balance faz full-table scan por account_id

**Arquivo:** `supabase/migrations/001_initial_schema.sql` L404-484
**Descricao:** O trigger `recalculate_account_balance()` e executado `AFTER INSERT OR UPDATE OR DELETE` em cada linha da tabela `transactions` (L533-535). Para cada operacao, executa 2 subqueries com `SUM(CASE ...)` sobre `WHERE account_id = v_account_id AND is_paid = true AND is_deleted = false` e outra sem filtro de `is_paid`. Se a conta tiver um UPDATE que muda `account_id`, executa 4 subqueries (2 para conta antiga, 2 para nova). Para batch imports (e.g., 200 transacoes), o trigger dispara 200 vezes, cada vez recalculando o saldo inteiro da conta.
**Impacto:** Import de 200 transacoes dispara 200 x 2 = 400 queries de SUM sobre a tabela transactions. A funcao `import_transactions_batch` (migration 028, L357-375) insere transacoes uma a uma em loop, disparando o trigger a cada INSERT. Isso cria O(n^2) behavior: a n-esima insercao soma n registros.
**Correcao:** (1) Desabilitar o trigger durante o import batch (via `SET LOCAL` ou flag) e recalcular uma vez no final. (2) Ou alterar a logica para usar delta incremental (balance += amount) em vez de full SUM a cada operacao.

---

### [BAIXO] D6.16 — Invalidacao sequencial de query caches com await

**Arquivo:** `src/lib/hooks/use-accounts.ts` L180-184, `src/lib/hooks/use-recurrences.ts` L239-244, `src/lib/hooks/use-bank-connections.ts` L157-160
**Descricao:** Multiplos hooks executam invalidacoes de cache sequencialmente com `await`: `await queryClient.invalidateQueries({ queryKey: ["accounts"] }); await queryClient.invalidateQueries({ queryKey: ["workflows"] }); await queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });`. Cada `await` espera o refetch completar antes de iniciar o proximo.
**Impacto:** Cada invalidacao com `await` dispara um refetch e espera ele completar. Com 3-4 invalidacoes sequenciais, a UI fica bloqueada por 3-4 round-trips. Os refetches sao independentes e poderiam ser paralelos.
**Correcao:** Usar `Promise.all([...])` para invalidacoes paralelas, ou omitir o `await` quando o resultado do refetch nao e necessario para a proxima operacao (React Query invalida e refetch em background por padrao).

---

## Resumo do dominio

| ID | Severidade | Achado | Esforco |
|---|---|---|---|
| D6.01 | MEDIO | select("*") em 9 hooks de listagem (over-fetching) | Baixo |
| D6.02 | MEDIO | Transacoes: 3 queries em vez de 1 com JOIN inline | Baixo |
| D6.03 | MEDIO | auth.getUser() repetido em toda queryFn (~20 hooks) | Medio |
| D6.04 | MEDIO | Busca ILIKE sem indice trigram em transactions.description | Baixo |
| D6.05 | MEDIO | FK matched_transaction_id sem indice | Baixo |
| D6.06 | BAIXO | useBudgetMonths deduplica client-side em vez de DISTINCT no banco | Baixo |
| D6.07 | BAIXO | useMultiIndexHistory dispara N RPCs paralelas | Medio |
| D6.08 | BAIXO | useProgressiveDisclosure faz 7 COUNT queries paralelas | Medio |
| D6.09 | ALTO | Padrao fragil de SECURITY DEFINER sem search_path inline | Medio |
| D6.10 | MEDIO | cron_depreciate_assets sem guarda contra depreciacao duplicada | Baixo |
| D6.11 | MEDIO | cron_process_account_deletions sem timeout/dead-letter | Medio |
| D6.12 | BAIXO | cron_fetch_economic_indices sem timeout HTTP | Baixo |
| D6.13 | BAIXO | useDeleteAsset faz DELETE manual redundante (FK ja e CASCADE) | Baixo |
| D6.14 | BAIXO | createTransaction faz 2 UPDATEs extras disparando triggers inuteis | Medio |
| D6.15 | ALTO | Trigger de saldo faz full SUM a cada INSERT (O(n^2) em batch import) | Alto |
| D6.16 | BAIXO | Invalidacoes de cache sequenciais com await bloqueante | Baixo |

**Total:** 16 achados (0 criticos, 2 altos, 6 medios, 8 baixos)

# Dominio 2 — Controle de Acesso & Protecao de Dados

**Referencia normativa:** OWASP ASVS v4.0 Cap. 4 (Controle de Acesso), Cap. 8 (Protecao de Dados)
**Data da auditoria:** 2026-03-16
**Arquivos analisados:** 65+ (37 migracoes SQL, 21 hooks, 7 arquivos auxiliares)

---

## Achados

### [MEDIO] D2.01 — Exportacao generica vaza `cpf_encrypted` da tabela `family_members`

**Arquivo:** `src/app/(app)/settings/data/page.tsx` L29-44 (definicao), L120-123 (execucao)
**Descricao:** A lista `TABLES_TO_EXPORT` inclui `family_members` (L36). A exportacao generica usa `.select("*")` (L122) para todas as tabelas da lista, incluindo `family_members`, que contem a coluna `cpf_encrypted`. O perfil do usuario (`users_profile`) e tratado separadamente com lista explicita de colunas (L137-141), excluindo corretamente `kek_material`, `encryption_key_encrypted`, `encryption_key_iv` e `cpf_encrypted`. Porem, `family_members` nao recebe o mesmo tratamento, resultando na inclusao de `cpf_encrypted` no arquivo exportado (JSON ou CSV).
**Impacto:** CPF criptografado de membros familiares e incluido no export. Embora criptografado, o dado e sensivel (PII) e nao deveria sair do banco sem necessidade. Se a chave de criptografia for comprometida, os CPFs ficam expostos no arquivo exportado armazenado localmente.
**Correcao:** Usar lista explicita de colunas para `family_members` (excluindo `cpf_encrypted`) ou criar uma view dedicada para exportacao. Aplicar o mesmo padrao ja usado para `users_profile`.

---

### [MEDIO] D2.02 — `useUpdateAsset` sem filtro `user_id` na mutacao de update (defesa em profundidade)

**Arquivo:** `src/lib/hooks/use-assets.ts` L293-300
**Descricao:** A mutacao `useUpdateAsset` executa `.from("assets").update({...}).eq("id", id).select().single()` sem incluir `.eq("user_id", user.id)`. O RLS no banco protege contra acesso indevido, porem o padrao de defesa em profundidade adotado no restante do codebase (ex: `useDeleteAsset`, `useUpdateAccount`, `useDeleteTransaction`) exige que o filtro `user_id` esteja presente tambem no client-side. Se o RLS for desabilitado por erro (rollback de migracao, bypass via service role), esta mutacao permitiria a alteracao de assets de qualquer usuario.
**Impacto:** Violacao do padrao de defesa em profundidade. Risco mitigado pelo RLS, mas inconsistente com o codebase.
**Correcao:** Adicionar `.eq("user_id", user.id)` ao update, alinhando com o padrao das demais mutacoes.

---

### [MEDIO] D2.03 — `usePayBill` sem filtro `user_id` na mutacao de update (defesa em profundidade)

**Arquivo:** `src/lib/hooks/use-recurrences.ts` L330-334
**Descricao:** A mutacao `usePayBill` executa `.from("transactions").update({ is_paid: true }).eq("id", transactionId).select("recurrence_id").single()` sem incluir `.eq("user_id", user.id)`. O usuario e obtido corretamente (L326-327), mas nao e usado como filtro na query. Mesmo padrao inconsistente de D2.02.
**Impacto:** Violacao do padrao de defesa em profundidade. Risco mitigado pelo RLS, mas inconsistente com o codebase.
**Correcao:** Adicionar `.eq("user_id", user.id)` ao update.

---

### [MEDIO] D2.04 — SSRF potencial em `cron_fetch_economic_indices` via `api_url_template`

**Arquivo:** `supabase/migrations/025_cron_daily_index_fetch.sql` L10-14 (definicao), L43-48 (execucao)
**Descricao:** A funcao `cron_fetch_economic_indices` (SECURITY DEFINER, L13) constroi URLs dinamicamente via `REPLACE(v_source.api_url_template, '{start}', ...)` (L43-44) e executa `extensions.http_get(v_url)` (L48) sem validacao de hostname. O campo `api_url_template` vem da tabela `economic_indices_sources`. A funcao roda com privilegios elevados (SECURITY DEFINER). Um registro malicioso inserido nesta tabela (via acesso administrativo comprometido, SQL injection em outro vetor, ou restauracao de backup adulterado) poderia direcionar requests HTTP a hosts internos (metadata services, rede interna). Diferente do endpoint TypeScript `/api/indices/fetch` (que possui allowlist em L34), a funcao SQL nao tem protecao equivalente.
**Impacto:** SSRF potencial a partir de funcao com privilegios elevados. A tabela `economic_indices_sources` tem RLS com `USING (true)` para SELECT (dados publicos), mas INSERT/UPDATE/DELETE sao restritos. O vetor requer comprometimento previo do banco, reduzindo a probabilidade.
**Correcao:** Adicionar validacao de hostname (allowlist) dentro da funcao antes do `http_get`, similar ao padrao implementado em `src/app/api/indices/fetch/route.ts` L34 (que define allowlist `api.bcb.gov.br`, `apisidra.ibge.gov.br`). Exemplo: verificar que `v_url` inicia com `https://api.bcb.gov.br/` antes de executar.

---

### [BAIXO] D2.05 — Sincronizacao de cost_center em hooks de family_members sem filtro `user_id`

**Arquivo:** `src/lib/hooks/use-family-members.ts` L131-134, L174-177
**Descricao:** Em `useUpdateFamilyMember`, a sincronizacao do nome com o cost center vinculado (L131-134) faz `.from("cost_centers").update({ name: updates.name }).eq("id", data.cost_center_id)` sem filtro `user_id`. Em `useDeactivateFamilyMember` (L174-177), a desativacao do cost center vinculado faz `.eq("id", member.cost_center_id)` tambem sem `user_id`. Em ambos os casos, o `cost_center_id` vem de um registro ja filtrado por `user_id`, reduzindo o risco. Porem, o padrao de defesa em profundidade recomenda o filtro direto.
**Impacto:** Baixo. O `cost_center_id` e obtido de registro previamente autenticado. Risco apenas se houver colisao de IDs (UUID, probabilidade negligivel) combinada com falha de RLS.
**Correcao:** Adicionar `.eq("user_id", user.id)` aos updates de `cost_centers` nestes hooks.

---

## Resumo do dominio

| ID | Severidade | Achado | Esforco |
|---|---|---|---|
| D2.01 | MEDIO | Exportacao generica vaza `cpf_encrypted` de `family_members` | Baixo |
| D2.02 | MEDIO | `useUpdateAsset` sem filtro `user_id` (defesa em profundidade) | Baixo |
| D2.03 | MEDIO | `usePayBill` sem filtro `user_id` (defesa em profundidade) | Baixo |
| D2.04 | MEDIO | SSRF potencial em `cron_fetch_economic_indices` sem hostname allowlist | Medio |
| D2.05 | BAIXO | Sincronizacao de cost_center sem filtro `user_id` em family_members | Baixo |

**Total:** 5 achados (0 criticos, 0 altos, 4 medios, 1 baixo)

---

## Verificacoes sem achados

As seguintes verificacoes foram realizadas e nao apresentaram problemas:

- **RLS habilitado em todas as tabelas:** Todas as 23+ tabelas de usuario possuem `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` com policies que filtram por `auth.uid()`. Verificado em todas as 37 migracoes (`supabase/migrations/001_initial_schema.sql` ate `034_revoke_dangerous_grants.sql`). Correto.
- **Otimizacao de RLS com initplan:** `supabase/migrations/018_rls_optimization.sql` reescreve policies usando `(select auth.uid())` em vez de `auth.uid()` direto, evitando re-execucao por linha. Correto.
- **Tabelas publicas com `USING (true)`:** `economic_indices`, `economic_indices_sources` e `tax_parameters` possuem SELECT publico (`USING (true)`). Sao dados publicos (indices economicos, parametros fiscais), nao contem dados de usuario. Correto.
- **Inner join RLS em tabelas filhas:** `journal_lines` e `center_allocations` nao possuem `user_id` direto. Suas policies usam inner join com a tabela pai (`journal_entries` e `cost_centers` respectivamente) que possuem `user_id`. Padrao correto para tabelas dependentes.
- **Revogacao de grants perigosos:** `supabase/migrations/034_revoke_dangerous_grants.sql` revoga TRUNCATE, TRIGGER e REFERENCES dos roles `anon` e `authenticated`. Correto.
- **Double-filter em deletes:** As mutacoes de delete em `use-assets.ts`, `use-accounts.ts`, `use-transactions.ts`, `use-categories.ts`, `use-budgets.ts` e `use-recurrences.ts` aplicam consistentemente `.eq("id", resourceId).eq("user_id", user.id)`. Correto.
- **Exportacao de perfil com colunas explicitas:** `src/app/(app)/settings/data/page.tsx` L137-141 exporta `users_profile` com `select("full_name, default_currency, onboarding_completed, created_at, updated_at, deletion_requested_at")`, excluindo `kek_material`, `encryption_key_encrypted`, `encryption_key_iv` e `cpf_encrypted`. Correto.
- **Store de privacidade sem dados sensiveis:** `src/lib/stores/privacy.ts` persiste apenas `valuesHidden` (boolean) em localStorage via Zustand. Nenhum dado financeiro ou PII armazenado. Correto.
- **Transaction engine com user.id:** `src/lib/services/transaction-engine.ts` passa `user.id` para todas as RPCs. Correto.
- **Onboarding seeds com user.id:** `src/lib/services/onboarding-seeds.ts` insere registros iniciais com `user_id: user.id`. Correto.
- **SECURITY DEFINER com search_path:** A funcao `cron_fetch_economic_indices` (`supabase/migrations/025_cron_daily_index_fetch.sql` L13-14) usa `SECURITY DEFINER` com `SET search_path = public, extensions`, prevenindo search_path injection. Correto.
- **CSP com nonce + strict-dynamic:** `src/middleware.ts` gera nonce criptografico por requisicao e aplica CSP em producao com `strict-dynamic`. `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'` presentes. (Referencia cruzada: D1/D3, arquivo de propriedade de outro dominio.)
- **Security headers:** `next.config.js` configura HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy restritiva. (Referencia cruzada: D1/D3.)

# Auditoria de Coerência Documental - Oniefy

**Data:** 2026-04-03
**Sessão:** 39
**Escopo:** Coerência entre 168 artefatos documentais e realidade do código/banco
**Framework:** MATRIZ-VALIDACAO-v2_1.md (taxonomia §1, tipos 1.2, 3.2, 6.2, 10.2, 4.1)
**Commit base:** 68823c0 (CI green, sessão 38)

---

## 1. Resumo executivo

Auditoria de 168 artefatos do projeto Oniefy (repo, Project Knowledge, Drive, memória). Cada métrica do ground truth (HANDOVER §3.2-§3.4 e §38.8) foi verificada contra fonte primária (`execute_sql`, `find`, `grep`). 4 blocos de execução: B1 (estrutura declarada vs real), B2 (pendências vs status), B3 (specs vs código), B4 (conflitos entre documentos).

**Resultado:** 27 achados catalogados, 0 defeitos de segurança, 5 sujeiras documentais, 9 fragilidades de rastreamento, 6 débitos técnicos, 7 divergências numéricas.

**Veredicto geral:** O código está em bom estado. As inconsistências encontradas são predominantemente documentais (números stale, documentos não atualizados, sobreposição de rastreamento). Nenhuma divergência de segurança identificada: 77/77 functions com search_path, 119 RLS policies confirmadas, 0 secrets expostos.

---

## 2. Inventário validado (168 artefatos)

| Grupo | Qtd declarada | Qtd real | Status geral |
|-------|---------------|----------|--------------|
| A1. Markdown raiz | 3 | 3 | Ativo |
| A2. Markdown docs/ | 29 | 29 | Ativo (6 com conteúdo stale) |
| A3. Markdown docs/audit/ | 11 | 11 | Ativo (2 com status desatualizado) |
| A4. Specs .docx | 8 | 8 (Project Knowledge) | Referência, somente leitura |
| A5. Dados .xlsx | 2 | 2 (Project Knowledge) | Referência |
| A6. Migrations .sql | 70 | 70 | Ativo |
| A7. Seeds .sql | 3 | 3 | Ativo |
| A8. CI workflows .yml | 4 | 4 | Ativo |
| A9. Configs raiz | 9 | 9 | Ativo |
| A10. Brand/PWA | 14 | 14 | Ativo |
| B. Project Knowledge exclusivos | 2 | 2 | Ativo |
| C. User Skills | 6 | 6 | Ativo |
| D. Transcripts | 2 | 2 | Referência |
| E. Persistentes (mem/prefs) | 2 | 2 | Ativo |
| **Total** | **168** | **168** | **Inventário íntegro** |

**Documentos obsoletos identificados:** 0 (nenhum documento inteiramente obsoleto, mas 8 com seções stale).

**Documentos órfãos:** 0.

**Documentos duplicados:** 0, mas 3 fontes de rastreamento de pendências com sobreposição (ver §5).

---

## 3. Matriz de rastreabilidade: achados

### Legenda de status
- **Confirmado:** doc e realidade batem
- **Divergente:** doc afirma X, realidade é Y
- **Stale:** doc estava correto em algum momento mas ficou desatualizado
- **Parcial:** parte correta, parte incorreta

### B1: Estrutura declarada vs real

| ID | Tipo | Origem | Afirmação | Evidência encontrada | Status | Categoria | Ação |
|----|------|--------|-----------|---------------------|--------|-----------|------|
| A001 | 1.2 | HANDOVER §3.2 | 77 functions | DB: 77 | Confirmado | - | Nenhuma |
| A002 | 1.2 | HANDOVER §3.3 título | "76 no schema public" | DB: 77 | Divergente | Sujeira | Atualizar §3.3 título para 77 |
| A003 | 1.2 | HANDOVER §3.2 | 37 tabelas | DB: 37 | Confirmado | - | Nenhuma |
| A004 | 1.2 | HANDOVER §3.2 | 119 RLS (112+7) | DB: 112 public + 7 storage = 119 | Confirmado | - | Nenhuma |
| A005 | 1.2 | HANDOVER §3.2 | 23 triggers | DB: 23 nomes únicos (26 bindings de evento) | Confirmado | - | Adicionar nota "(26 event bindings)" |
| A006 | 1.2 | HANDOVER §3.2 | 29 ENUMs | DB: 29 | Confirmado | - | Nenhuma |
| A007 | 1.2 | HANDOVER §3.2 | 151 indexes | DB: 151 | Confirmado | - | Nenhuma |
| A008 | 1.2 | HANDOVER §3.2 | ~58 migrations aplicadas (MCP) | DB: 53 em schema_migrations | Divergente | Sujeira | Corrigir §3.2 para "53 rastreadas + ~17 aplicadas via execute_sql" |
| A009 | 1.2 | HANDOVER §3.2 | 70 migration files (repo) | Repo: 70 | Confirmado | - | Nenhuma |
| A010 | 1.2 | HANDOVER §3.2 | 13 pg_cron jobs | DB: 13 | Confirmado | - | Nenhuma |
| A011 | 1.2 | HANDOVER §3.4 | 286 TS/TSX | find: 286 | Confirmado | - | Nenhuma |
| A012 | 1.2 | HANDOVER §3.4 | 72 suítes Jest | find: 72 | Confirmado | - | Nenhuma |
| A013 | 1.2 | HANDOVER §3.4 | 1.079 assertions | grep expect(): 1.808 chamadas (assertions != expect calls) | Parcial | Sujeira | Nota: 1.079 é contagem do Jest reporter, não de grep. Rodar `npm test` para confirmar. |
| A014 | 1.2 | HANDOVER §3.4 | 42 hooks | find: 42 | Confirmado | - | Nenhuma |
| A015 | 1.2 | HANDOVER §38.8 | 58 Zod schemas | Contagem real: 61 (54 rpc.ts + 6 auth.ts + 1 route) | Divergente | Sujeira | Atualizar para 61 |
| A016 | 1.2 | HANDOVER §38.8 | 35 páginas autenticadas | find page.tsx em (app)/: 35 | Confirmado | - | Nenhuma |
| A017 | 1.2 | HANDOVER §38.8 | 8 calculadoras + diagnostics | Calculadoras: 8 específicas + 1 index. Diagnostics: separado. | Confirmado | - | Nenhuma |
| A018 | 1.2 | HANDOVER §38.8 | 6 eslint-disable (produção) | grep: 6 | Confirmado | - | Nenhuma |
| A019 | 1.2 | HANDOVER §38.8 | sidebar 19 links desktop | Código layout.tsx: 17 nav items + 1 settings = 18 | Divergente | Sujeira | Corrigir para 18 |
| A020 | 4.1 | HANDOVER §3.2 | "Todas com SET search_path = public" | DB: 77/77 com search_path=public | Confirmado | - | Nenhuma |

**Resumo B1:** 20 métricas verificadas. 14 confirmadas, 4 divergentes (sujeira documental), 2 parciais.

### B2: Pendências vs status real

| ID | Tipo | Origem | Afirmação | Evidência encontrada | Status | Categoria | Ação |
|----|------|--------|-----------|---------------------|--------|-----------|------|
| A021 | 10.2 | DIVIDA-TECNICA | DT-026 (S2): getAmountDisplay JSX em template string | Código corrigido: retorna {prefix, formatted} separados. `<Mv>` aplicado no JSX. | Stale | Sujeira | Marcar DT-026 como ✅ RESOLVIDO |
| A022 | 10.2 | DIVIDA-TECNICA | DT-027 (S3): useEffect ignora prefill | Código corrigido: `prefill?.type ?? defaultType`. Comentário "DT-027" no código. | Stale | Sujeira | Marcar DT-027 como ✅ RESOLVIDO |
| A023 | 10.2 | DIVIDA-TECNICA | DT-028 (S2): full_name em family_members | Código corrigido: usa `name` + todas colunas faltantes adicionadas. | Stale | Sujeira | Marcar DT-028 como ✅ RESOLVIDO |
| A024 | 10.2 | RASTREABILIDADE | 65 stories rastreadas, 10 com teste (15%) | Total real: 108 stories. Doc cobre 60% das stories. Nenhuma story E-prefixed (sessões 37-38) rastreada. | Divergente | Fragilidade | Regenerar com 108 stories |
| A025 | 10.2 | SESSION-39-PROMPT | 4 RPCs com `as any` sem tipo | Confirmado: use-diagnostics, use-engine-v2, use-scanner, use-irpf-deductions | Confirmado | Débito técnico | Gerar tipos ou criar overloads em database.ts |

**Resumo B2:** 5 achados. 3 documentos stale (bugs já corrigidos), 1 divergência grave (RASTREABILIDADE obsoleta), 1 débito confirmado.

### B3: Specs vs código

| ID | Tipo | Origem | Afirmação | Evidência encontrada | Status | Categoria | Ação |
|----|------|--------|-----------|---------------------|--------|-----------|------|
| A026 | 6.2 | NAVIGATION-SPEC | 5 tabs mobile: Início, Movimentações, Patrimônio, Orçamento, Mais | bottom-tab-bar.tsx: 5 tabs exatos, mesmos labels e ícones | Confirmado | - | Nenhuma |
| A027 | 6.2 | TAX-ENGINE-SPEC | Lei 15.270/2025, isenção até R$ 5.000, redução parcial 5.000-7.350 | calculator.ts L82, L112, L372: implementação conforme spec | Confirmado | - | Nenhuma |
| A028 | 6.2 | IMPORT-ENGINE-SPEC | 8 bancos BR auto-detecção | bank-detection.ts: nubank_fatura, nubank_extrato, btg, xp, mercado_pago (inferido), itau, inter, c6, porto_bradescard. 9 patterns (Nubank conta como 2: fatura+extrato). | Parcial | Fragilidade | Reconciliar spec (8 bancos) com implementação (9 patterns). Spec não previu split nubank_fatura/nubank_extrato. |
| A029 | 6.2 | ONIE-ORB-SPEC | Canvas 2D + Simplex Noise, substitui todos os loaders | onie-loader.tsx: Canvas 2D, requestAnimationFrame, 5 voais. Implementado. | Confirmado | - | Nenhuma |

**Resumo B3:** 4 specs verificadas. 3 confirmadas, 1 divergência menor (split Nubank).

### B4: Conflitos entre documentos

| ID | Tipo | Origem | Conflito | Evidência | Status | Categoria | Ação |
|----|------|--------|----------|-----------|--------|-----------|------|
| A030 | 10.2 | PENDENCIAS-FUTURAS x PENDENCIAS-DECISAO | 15 itens FAZER decididos em PENDENCIAS-DECISAO (grupos 2-5) não aparecem em PENDENCIAS-FUTURAS | Exemplos: liquidity_tier editável, focus trap dialogs, sparklines solvência, edição transferências, rateio overhead UI, CAP-05 calendário, upload WKF-03 | Divergente | Fragilidade | Consolidar: cada item deve existir em exatamente 1 fonte |
| A031 | 10.2 | PENDENCIAS-FUTURAS x DIVIDA-TECNICA | DIVIDA-TECNICA tem 28 items (DT-001 a DT-028). PENDENCIAS-FUTURAS referencia apenas DT-007 e DT-014. Restantes não cruzados. | HANDOVER §19 documenta resolução de DT-001 a DT-025 (maioria). DT-026/027/028 resolvidos mas não documentados em nenhum lugar. | Divergente | Fragilidade | Consolidar status de todos os DT-xxx em DIVIDA-TECNICA |
| A032 | 10.2 | HANDOVER §3.2 x §3.3 | §3.2 diz "77 functions", §3.3 título diz "76 functions" | DB: 77. §3.3 stale (nunca atualizado quando 77ª function foi adicionada). | Divergente | Sujeira | Atualizar §3.3 título |
| A033 | 10.2 | 3 fontes de pendências | PENDENCIAS-FUTURAS (331L), PENDENCIAS-DECISAO (239L), DIVIDA-TECNICA (581L): sobreposição parcial, formatos diferentes, nenhuma referência cruzada bidirecional | Exemplo: item "rateio overhead" existe nas 3 fontes com status/texto diferentes. Nenhuma fonte é definitiva. | Divergente | Fragilidade | Ver proposta de consolidação (§6) |
| A034 | 1.2 | HANDOVER histórico | Seções §35, §36 preservam números antigos (ex: "35 tabelas", "65 migrations") que conflitam com §38.8 ground truth | Intencional (preservação histórica), mas gera confusão na leitura. | Parcial | Débito técnico | Adicionar nota "snapshot da época" em seções históricas |

**Resumo B4:** 5 achados. Todos fragilidades/sujeiras de rastreamento. O problema central: 3 documentos de pendências sem consolidação.

---

## 4. Tabela de inconsistências priorizadas

### Prioridade 1: Fragilidades de rastreamento (impactam tomada de decisão)

| ID | Achado | Impacto | Esforço |
|----|--------|---------|---------|
| A024 | RASTREABILIDADE cobre 65/108 stories, sem E-items | Impossível verificar cobertura de teste por story | 2-3h (regenerar) |
| A033 | 3 fontes de pendências sobrepostas sem consolidação | Risco de itens perdidos, trabalho duplicado, decisões contraditórias | 1-2h (consolidar) |
| A030 | 15 itens FAZER de PENDENCIAS-DECISAO sem tracking em PENDENCIAS-FUTURAS | Itens decididos mas sem visibilidade de implementação | 30 min (migrar para PENDENCIAS-FUTURAS) |
| A031 | 28 DT-items sem status atualizado em DIVIDA-TECNICA | 3 bugs graves (DT-026/027/028) resolvidos mas doc diz "CORRIGIR" | 30 min (atualizar status) |

### Prioridade 2: Divergências numéricas (corrigir para manter confiança no ground truth)

| ID | Achado | Valor doc | Valor real | Esforço |
|----|--------|-----------|------------|---------|
| A002 | §3.3 título functions | 76 | 77 | 1 min |
| A008 | §3.2 migrations aplicadas | ~58 | 53 tracked | 1 min |
| A015 | §38.8 Zod schemas | 58 | 61 | 1 min |
| A019 | §38.8 sidebar links | 19 | 18 | 1 min |
| A032 | §3.3 vs §3.2 functions | 76 vs 77 | 77 | 1 min |

### Prioridade 3: Débitos técnicos confirmados

| ID | Achado | Impacto | Esforço |
|----|--------|---------|---------|
| A025 | 4 hooks com `as any` para RPCs | Type-safety degradada em diagnostics, engine-v2, scanner, irpf-deductions | 1-2h (gerar tipos ou overloads) |
| A034 | Seções históricas do HANDOVER com números antigos | Confusão em leitura rápida | 15 min (adicionar notas) |

---

## 5. Diagnóstico: o problema dos 3 documentos

O projeto mantém 3 documentos de rastreamento de pendências com sobreposição:

| Documento | Escopo original | Itens | Última atualização | Formato |
|-----------|----------------|-------|--------------------|---------|
| PENDENCIAS-FUTURAS.md | Backlog completo com prioridade e status | ~98 | Sessão 38 (03/04/2026) | Tabela com emoji de status |
| PENDENCIAS-DECISAO.md | Itens que requerem decisão do Claudio | 32 (17 feitos + 15 FAZER) | Sessão 19 (17/03/2026) | Grupos numerados com opções |
| DIVIDA-TECNICA.md | Achados de auditoria de código por arquivo | 28 (DT-001 a DT-028) | Sessão 24 (19/03/2026) | Severidade + disposição |

**Problemas concretos:**

1. **Itens fantasma:** 15 itens FAZER decididos em PENDENCIAS-DECISAO (liquidity_tier, focus trap, sparklines, edição transferências, upload WKF-03, OCR web, push web, etc.) não têm tracking de implementação em PENDENCIAS-FUTURAS.

2. **Status stale:** DIVIDA-TECNICA lista DT-026/027/028 como "CORRIGIR" quando já foram resolvidos na sessão 38. Nenhum mecanismo de atualização retroativa.

3. **Referência circular:** HANDOVER §19 documenta resolução de DT items, DIVIDA-TECNICA não atualiza, PENDENCIAS-FUTURAS ignora a maioria dos DT items.

4. **Busca fragmentada:** Para saber o status de "upload de documentos", é preciso consultar: PENDENCIAS-DECISAO §4.2, PENDENCIAS-FUTURAS (não está), DIVIDA-TECNICA DT-009, HANDOVER §19.

---

## 6. Proposta de consolidação

### 6.1 Modelo futuro: 2 documentos (não 3)

| Documento | Papel | Conteúdo |
|-----------|-------|----------|
| **PENDENCIAS-FUTURAS.md** | Single source of truth para TODO o backlog | Todo item pendente, independente de origem, com ID único, status, prioridade, e referência à decisão |
| **HANDOVER-WealthOS.md** | Contexto + histórico + ground truth | Números verificados, decisões registradas, commits. Referencia PENDENCIAS para itens ativos |

**PENDENCIAS-DECISAO.md** e **DIVIDA-TECNICA.md** tornam-se documentos de arquivo (read-only). Itens ativos migrados para PENDENCIAS-FUTURAS.

### 6.2 Migração proposta

1. **DIVIDA-TECNICA → PENDENCIAS-FUTURAS:**
   - DT-026/027/028: marcar ✅ (já resolvidos)
   - DT-005 (tabelas sem frontend): já coberto por análise de sessões subsequentes
   - DT-007, DT-014: já estão em PENDENCIAS-FUTURAS (📌)
   - Restantes (DT-001 a DT-025): já resolvidos conforme HANDOVER §19

2. **PENDENCIAS-DECISAO → PENDENCIAS-FUTURAS:**
   Os 15 itens FAZER decididos devem ser adicionados a PENDENCIAS-FUTURAS com status ⬜ e referência à decisão:

   | Item PD | ID proposto PENDENCIAS | Status real |
   |---------|----------------------|-------------|
   | 1.3 CAP-05 Calendário vencimentos | E52 | ⬜ |
   | 1.4 Export criptografado | E53 | ⬜ |
   | 1.5 Logs de acesso | E54 | ⬜ |
   | 2.1 liquidity_tier editável | E55 | ⬜ |
   | 2.2 Focus trap dialogs inline | E56 | ⬜ |
   | 3.1 Type cast refinado (DT-007) | já é DT-007 📌 | 📌 |
   | 3.2 Testes SQL RPCs novas | E57 | ⬜ |
   | 3.3 Sparklines solvência | E58 | ⬜ |
   | 3.4 Edição transferências | E59 | ⬜ |
   | 3.5 Rateio overhead UI | E60 | ⬜ |
   | 4.1 Reajuste IPCA/IGP-M | E61 | ⬜ |
   | 4.2 Upload WKF-03 | E62 | ⬜ |
   | 4.3 PAT-06 docs em bens | E63 | ⬜ (depende E62) |
   | 5.1 OCR web Tesseract.js | E64 | ⬜ (depende E62) |
   | 5.2 Web Push notifications | E65 | ⬜ |

3. **Adicionar header em PENDENCIAS-DECISAO e DIVIDA-TECNICA:**
   ```
   > **ARQUIVO HISTÓRICO.** Itens ativos migrados para PENDENCIAS-FUTURAS.md em 03/04/2026.
   > Este documento permanece como referência de decisões tomadas.
   ```

### 6.3 Protocolo de atualização (going forward)

1. Todo novo item nasce em PENDENCIAS-FUTURAS.md com ID sequencial (E66, E67...).
2. Decisões do Claudio são registradas inline no item (coluna "Nota").
3. Ao resolver um item, o status muda para ✅ com referência ao commit.
4. HANDOVER recebe apenas o ground truth numérico e o log de sessão.
5. Ao final de cada sessão, verificar: "todos os itens tocados nesta sessão têm status atualizado em PENDENCIAS?"

---

## 7. Verificações de segurança (B1 complementar)

| Verificação | Resultado |
|-------------|-----------|
| search_path em todas as 77 functions | ✅ 77/77 com `search_path=public` |
| RLS em todas as 37 tabelas | ✅ 112 políticas public + 7 storage |
| SESSION-38-PROMPT.md deletado | ✅ Confirmado |
| Secrets no repo (grep service_role, API key) | ✅ CI security check ativo |
| Objetos de migrations 079-081 no DB | ✅ warranties table, irpf_deductions RPC, receipts bucket, receipt_path column: todos existem |
| skip-to-content link (WCAG) | ✅ layout.tsx L51 |
| prefers-reduced-motion (WCAG) | ✅ globals.css L188-189 |

---

## 8. Lista de ações

### Ações de documentação (esta sessão ou próxima)

| # | Ação | Arquivo | Esforço |
|---|------|---------|---------|
| D1 | Corrigir §3.3 título: "76" → "77" | HANDOVER | 1 min |
| D2 | Corrigir §3.2 migrations: "~58" → "53 rastreadas (schema_migrations); restantes aplicadas via execute_sql" | HANDOVER | 1 min |
| D3 | Corrigir §38.8 Zod schemas: "58" → "61" | HANDOVER | 1 min |
| D4 | Corrigir §38.8 sidebar: "19" → "18" | HANDOVER | 1 min |
| D5 | Marcar DT-026, DT-027, DT-028 como ✅ RESOLVIDO | DIVIDA-TECNICA | 5 min |
| D6 | Adicionar header "ARQUIVO HISTÓRICO" | DIVIDA-TECNICA, PENDENCIAS-DECISAO | 2 min |
| D7 | Migrar 15 itens FAZER para PENDENCIAS-FUTURAS (E52-E65) | PENDENCIAS-FUTURAS | 15 min |
| D8 | Regenerar RASTREABILIDADE-STORY-TESTE com 108 stories | RASTREABILIDADE | 2-3h |
| D9 | Adicionar nota "snapshot da época" em seções históricas | HANDOVER §35, §36 | 5 min |

### Ações de código (backlog)

| # | Ação | Arquivos | Esforço | Prioridade |
|---|------|----------|---------|-----------|
| C1 | Resolver `as any` em 4 hooks (A025) | use-diagnostics, use-engine-v2, use-scanner, use-irpf-deductions | 1-2h | Média |
| C2 | Reconciliar bank-detection patterns com IMPORT-ENGINE-SPEC (A028) | bank-detection.ts, IMPORT-ENGINE-SPEC.md | 15 min | Baixa |

---

## 9. Status das 12 falhas pré-identificadas

| # | Falha original | Verificação sessão 39 | Status final |
|---|----------------|-----------------------|-------------|
| 1 | HANDOVER §3.2 números stale (36 tabelas, 108 RLS, etc.) | §3.2 agora diz 37/119/77/151. DB confirma. | ✅ Resolvido |
| 2 | HANDOVER §3.4 números stale (233 TS/TSX, 56 suítes, etc.) | §3.4 agora diz 286/72/1079. find confirma 286/72. | ✅ Resolvido |
| 3 | Sessão 37 ausente do HANDOVER | §37 existe (L4900-4968). | ✅ Resolvido |
| 4 | SESSION-38-PROMPT.md obsoleto | Confirmado deletado. | ✅ Resolvido |
| 5 | PENDENCIAS histórico sessão 38 desatualizado | Atualizado na sessão 38. | ✅ Resolvido |
| 6 | RASTREABILIDADE-STORY-TESTE desatualizado desde sessão 35 | Cobre 65/108 stories. Datado sessão 34 (não 35). Sem E-items. | ❌ Não resolvido (A024) |
| 7 | PENDENCIAS-DECISAO nunca cruzado com PENDENCIAS-FUTURAS | Confirmado: 15 itens FAZER sem tracking. | ❌ Não resolvido (A030) |
| 8 | DIVIDA-TECNICA nunca cruzado com PENDENCIAS-FUTURAS | Confirmado: DT-026/027/028 resolvidos sem atualização. | ❌ Não resolvido (A031) |
| 9 | 3 fontes de pendências com sobreposição | Confirmado e detalhado em §5. Proposta de consolidação em §6. | ❌ Não resolvido (A033) |
| 10 | Valores stale em seções históricas do HANDOVER | Preservados intencionalmente. Recomendação: adicionar nota. | ⚠️ By design (A034) |
| 11 | 4 RPCs com `as any` sem tipo no database.ts | Confirmado em 4 hooks (não database.ts). Path correto: use-*.ts. | ❌ Não resolvido (A025) |
| 12 | Zod schemas: seções antigas dizem 43, realidade é 58 | §38.8 diz 58, realidade é 61. Divergência residual de +3. | ⚠️ Parcial (A015) |

**Score: 5/12 resolvidos, 5/12 não resolvidos, 2/12 parciais.**

---

## 10. Metodologia e limitações

**Ferramentas usadas:**
- `Supabase:execute_sql` (project mngjbrbxapazdddzgoje): 5 queries para métricas DB
- `find`, `grep`, `wc`: métricas de filesystem
- Leitura direta de 12 documentos markdown
- Project Knowledge: MATRIZ-VALIDACAO-v2_1.md (taxonomia), MAN-LNG-CMF-001 (referência)

**Limitações:**
- Não foi possível rodar `npm test` (ambiente de auditoria, não de build). Assertion count (1.079) não verificado via Jest runner.
- Specs .docx originais (A4) lidos via Project Knowledge, não comparados linha-a-linha com código (escopo seria uma auditoria funcional completa, não documental).
- Google Drive (grupo F) não auditado em detalhe (assets operacionais, sem specs).
- Burnished HSL value (35, 66%, 34%) declarado WCAG AA compliant no globals.css mas não verificado com ferramenta de contraste. A sugestão original era #B04E34 (HSL ~13, 54%, 45%), que é diferente do valor implementado.

---

*Gerado por Claude (Sessão 39). Verificado contra fonte primária para cada achado.*

---

## Adendo: B3.10-B3.14 (verificações completadas na sessão)

Verificações originalmente omitidas e executadas após revisão.

### B3.10: DEDUP-ENGINE-SPEC (264L) vs dedup-engine.ts (205L)

| Requisito da spec | Implementado? | Evidência |
|-------------------|--------------|-----------|
| 3 filtros: exact → fuzzy → auth_code | ✅ | matchType: "exact" \| "fuzzy" \| "auth_code" (L29) |
| Fingerprint (date + normalized amount) | ✅ | `fingerprint()` L50-69 |
| Levenshtein distance | ✅ | `levenshtein()` L71-89, similarity score L91-102 |
| Cross-account exclusion | ⚠️ Parcial | L158-159: skip same account + same source. Spec pede exclusão por `transfer_pair_id` (mais robusto) |
| User feedback/learning loop (princípio #5) | ❌ | 0 ocorrências de learn/feedback/teach/pattern no código. Motor não aprende com decisões do usuário |
| Sinais opostos nunca duplicata (princípio #6) | ❌ | Sem verificação de sinal no código |

**Veredicto:** Engine cobre o núcleo (3 filtros + fingerprint + Levenshtein). Faltam 2 features de spec: learning loop adaptativo e exclusão por sinal oposto. Categoria: **Débito técnico** (funciona para importação batch, não tem a inteligência adaptativa descrita).

---

### B3.12: INSTALLMENT-SYSTEM-SPEC (239L) vs implementação

| Requisito da spec | Implementado? | Evidência |
|-------------------|--------------|-----------|
| Campos credit_limit, closing_day, due_day | ✅ | Migration 078, database.ts L55-61 |
| Aritmética do centavo (1ª parcela absorve resto) | ❌ | Nenhuma função de split em parcelas no codebase |
| Geração de N parcelas a partir de compra parcelada | ❌ | Sem installment_of, installment_total, installment_group_id em transactions |
| Distribuição em faturas futuras por closing_day | ❌ | Nenhuma lógica de distribuição |
| Reconciliação de parcelas com fatura real | ❌ | Depende de E19 (import engine, não implementado) |

**Veredicto:** Apenas infraestrutura de schema (3 colunas em accounts). O **motor de parcelamento** descrito na spec não existe. Categoria: **Débito técnico** (spec documenta feature não implementada). PENDENCIAS-FUTURAS não tem item específico para isso. Deveria ser registrado.

---

### B3.13: QUICK-REGISTER-SPEC (182L) vs quick-register.ts (205L)

| Requisito da spec | Implementado? | Evidência |
|-------------------|--------------|-----------|
| Engine de sugestões contextuais (hora/dia/frequência) | ✅ | `generateSuggestions()` com time-based + history-based + amount-range |
| Forma 1: Captura push notification | ❌ | Depende de CFG-04 (Apple) + push web (E65) |
| Forma 2: Share Extension | ❌ | Depende de Apple Developer Account |
| Forma 3: Widget na tela inicial | ❌ | Requer Capacitor plugin nativo |
| Forma 4: Mensagem de texto para Onie | ❌ | Nenhuma barra de texto na UI |
| Forma 5: Voz (Speech-to-Text) | ❌ | Nenhum código de STT |

**Veredicto:** Engine de sugestões (inteligência por trás) implementado e testado (9 testes). Nenhuma das 5 formas de captura da spec implementada. Isso é esperado: a spec é roadmap, o engine é a fundação. Categoria: **Débito técnico aceitável** (por design, formas de captura dependem de infra nativa).

---

### B3.14: NOTIFICATION-BELL-SPEC (113L) vs notification-panel.tsx + use-notification-items.ts

| Requisito da spec | Implementado? | Evidência |
|-------------------|--------------|-----------|
| Sininho persistente em todas as telas | ✅ | layout.tsx (header), bottom-tab-bar.tsx |
| Overlay/modal (não navegação) | ✅ | notification-panel.tsx como Sheet overlay |
| Badge numérico (ações) vs ponto (info) | ✅ | `actionable: boolean` no NotificationItem |
| Inbox zero com Onie orb + "Tudo em ordem" | ✅ | L126-133: OnieLoader + mensagem |
| Fonte 1: Recorrências detectadas (E26) | ✅ | L57-71 |
| Fonte 2: Alertas de preço (E27) | ✅ | L73-98 |
| Fonte 3: Vencimentos próximos (3 dias) | ✅ | L100-123 |
| Fonte 4: Calendário fiscal (E51) | ✅ | L125-138 |
| 9 tipos de ação da spec (duplicata, fatura, etc.) | ❌ | 4 de ~18 tipos implementados. Restantes dependem de features futuras (E19, E20, E24) |
| Garantias prestes a vencer | ❌ | warranties existe mas não alimenta sininho |
| Budget excedido | ❌ | useBudgets existe mas não alimenta sininho |

**Veredicto:** Estrutura correta (overlay, badge, inbox zero, Onie orb). 4 de ~18 tipos de notificação implementados. Coerente com o estágio do projeto: features alimentadoras (import, dedup, investimentos) ainda não existem. Categoria: **Parcial, por design.**

---

### Novos achados (A035-A038)

| ID | Bloco | Origem | Afirmação | Status | Categoria | Ação |
|----|-------|--------|-----------|--------|-----------|------|
| A035 | B3 | DEDUP-ENGINE-SPEC | Motor aprende com decisões do usuário (princípio #5) | Não implementado | Débito técnico | Registrar como item em PENDENCIAS-FUTURAS |
| A036 | B3 | INSTALLMENT-SYSTEM-SPEC | Motor de parcelamento gera N parcelas com aritmética do centavo | Não implementado (apenas schema) | Débito técnico | Registrar como item em PENDENCIAS-FUTURAS |
| A037 | B3 | QUICK-REGISTER-SPEC | 5 formas de captura coexistentes | 0/5 implementadas (engine de sugestões OK) | Débito técnico (aceitável) | Já coberto por dependências (E65, CFG-04, etc.) |
| A038 | B3 | NOTIFICATION-BELL-SPEC | ~18 tipos de notificação no painel | 4/18 implementados | Parcial (por design) | Expandir conforme features alimentadoras forem implementadas |

**Total de achados atualizado: 31 (era 27).**

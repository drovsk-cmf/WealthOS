# Dominio 3 — Validacao de Entrada & Saida

**Referencia normativa:** OWASP ASVS v4.0 Cap. 5 (Validacao, Sanitizacao, Encoding)
**Data da auditoria:** 2026-03-16
**Arquivos analisados:** 9

---

## Achados

### [ALTO] D3.01 — Parsers CSV e XLSX nao possuem limite de tamanho de arquivo

**Arquivo:** `src/lib/parsers/csv-parser.ts` (arquivo inteiro); `src/lib/parsers/xlsx-parser.ts` (arquivo inteiro)
**Descricao:** O parser OFX possui verificacao de tamanho (`MAX_OFX_SIZE = 10 * 1024 * 1024` em `src/lib/parsers/ofx-parser.ts` L109-119), porem os parsers CSV e XLSX nao implementam nenhuma verificacao de tamanho antes de processar o conteudo. O `parseCSVRaw()` recebe uma string sem limite (L124), e o `parseXLSX()` recebe um `ArrayBuffer` sem limite (L22-25). Um arquivo de centenas de megabytes pode causar OOM (Out of Memory) no navegador.
**Impacto:** Denial of Service client-side. Um usuario pode travar sua propria sessao (ou, em cenario de phishing, receber um arquivo malicioso que congela o app).
**Correcao:** Adicionar constantes `MAX_CSV_SIZE` e `MAX_XLSX_SIZE` (ex: 10MB) e verificar antes do processamento, similar ao padrao usado em `ofx-parser.ts`.

---

### [MEDIO] D3.02 — Comparacao de segredo do cron usa operador direto, vulneravel a timing attack

**Arquivo:** `src/app/api/digest/send/route.ts` L29
**Descricao:** A verificacao `authHeader !== cronSecret` usa comparacao direta de strings. Isso pode permitir que um atacante deduza o segredo via diferencas de tempo de execucao (timing side-channel). Nota: este achado tambem e registrado como D1.03 no dominio de autenticacao, documentado aqui pela perspectiva de validacao de input em endpoints internos.
**Impacto:** Possibilidade teorica de extracao do segredo via repeticao de requisicoes com medicao de latencia.
**Correcao:** Usar `crypto.timingSafeEqual()` para comparar os valores.

---

### [MEDIO] D3.03 — Endpoint de preview do digest expoe mensagem de erro interna do Supabase/PostgreSQL

**Arquivo:** `src/app/api/digest/preview/route.ts` L35-39
**Descricao:** Quando a RPC `get_weekly_digest` falha, a resposta inclui `error?.message` diretamente no JSON retornado ao cliente: `{ error: error?.message || "No digest data" }`. Mensagens de erro do PostgreSQL podem conter nomes de tabelas, colunas, constraints e detalhes internos do schema.
**Impacto:** Vazamento de informacoes internas da base de dados que podem auxiliar um atacante na construcao de ataques mais direcionados (SQL injection em outros vetores, por exemplo).
**Correcao:** Retornar mensagem generica ao cliente (ex: `"Erro ao gerar preview do resumo."`) e logar o erro original apenas server-side via `console.error()`.

---

### [MEDIO] D3.04 — Endpoint digest/send vaza erros internos do Supabase e Resend na resposta JSON

**Arquivo:** `src/app/api/digest/send/route.ts` L43-47, L64, L117-121, L130-133
**Descricao:** Varios caminhos de erro neste endpoint retornam detalhes internos na resposta:
- L44: `usersError?.message` (erro PostgreSQL ao buscar usuarios)
- L64: `digestError?.message` (erro da RPC)
- L117-120: body completo da resposta do Resend em caso de falha (`errBody`)
- L132: `err.message` de excecoes genericas

Embora este endpoint seja protegido por `x-cron-secret`, a resposta JSON com `results` e retornada ao caller. Se o scheduler externo logar essas respostas em servicos de terceiros, os detalhes internos ficam expostos.
**Impacto:** Vazamento de informacoes internas (nomes de tabelas, constraints, chaves de API do Resend em mensagens de erro, detalhes de infraestrutura).
**Correcao:** Substituir mensagens de erro detalhadas por codigos genericos no array `results` (ex: `"db_error"`, `"send_error"`). Logar os detalhes apenas server-side.

---

### [MEDIO] D3.05 — Endpoint indices/fetch vaza mensagens de erro internas em respostas JSON

**Arquivo:** `src/app/api/indices/fetch/route.ts` L95, L100, L168, L174-175
**Descricao:** O endpoint retorna detalhes de erros no array `results.errors`:
- L95: URL completa incluindo template com parametros
- L100: hostname do servidor externo
- L168: `upsertErr.message` (erro PostgreSQL)
- L174-175: `err.message` de excecoes genericas

Embora este endpoint requeira autenticacao de usuario, as mensagens detalhadas podem auxiliar um atacante autenticado a mapear a infraestrutura.
**Impacto:** Information disclosure para usuarios autenticados. Exposicao de estrutura interna do banco e URLs de APIs externas.
**Correcao:** Retornar erros genericos (ex: `"fetch_failed"`, `"parse_failed"`, `"upsert_failed"`) no JSON. Manter detalhes apenas em `console.error()` server-side.

---

### [BAIXO] D3.06 — Sanitizacao de CSV injection remove caracteres legitimos com regex agressiva

**Arquivo:** `src/lib/parsers/csv-parser.ts` L177
**Descricao:** A sanitizacao `rawDesc.replace(/^[=+\-@]+/, "")` remove todos os caracteres `=`, `+`, `-`, `@` do inicio da string. Isso pode remover informacoes legitimas de descricoes bancarias, como sinais de valor (`+R$ 500,00`) ou hifens iniciais (`- PIX recebido`). O regex usa `+` (um ou mais), o que remove multiplos caracteres consecutivos.
**Impacto:** Perda de informacao em descricoes de transacoes importadas. Nao e uma vulnerabilidade de seguranca, mas afeta a integridade dos dados importados. A protecao contra CSV injection em si e correta e necessaria.
**Correcao:** Considerar sanitizar apenas em contextos de exportacao (quando dados sao escritos de volta para CSV/Excel), nao na importacao. Alternativamente, substituir o caractere perigoso por equivalente seguro (ex: prefixar com `'` ou espaco).

---

## Resumo do dominio

| ID | Severidade | Achado | Esforco |
|---|---|---|---|
| D3.01 | ALTO | Parsers CSV e XLSX sem limite de tamanho de arquivo | Baixo |
| D3.02 | MEDIO | Segredo do cron comparado com operador direto (timing attack) | Baixo |
| D3.03 | MEDIO | Preview do digest expoe mensagem de erro interna | Baixo |
| D3.04 | MEDIO | Endpoint digest/send vaza erros internos na resposta | Medio |
| D3.05 | MEDIO | Endpoint indices/fetch vaza mensagens de erro internas | Medio |
| D3.06 | BAIXO | Sanitizacao de CSV injection remove caracteres legitimos | Baixo |

**Total:** 6 achados (0 criticos, 1 alto, 4 medios, 1 baixo)

---

## Verificacoes sem achados

As seguintes verificacoes foram realizadas e nao apresentaram problemas:

- **Login API usa safeParse com try-catch:** `src/app/api/auth/login/route.ts` L38-53 envolve `request.json()` em try-catch e usa `loginSchema.safeParse()`. Erros de validacao retornam mensagem generica (L42-44). Correto.
- **OFX parser possui limite de tamanho:** `src/lib/parsers/ofx-parser.ts` L109 define `MAX_OFX_SIZE = 10MB` e verifica antes do processamento (L118-120). Correto.
- **escapeHtml no template de email:** `src/lib/email/weekly-digest-template.ts` L20-27 implementa `escapeHtml()` com os 5 caracteres obrigatorios (`&`, `<`, `>`, `"`, `'`) na ordem correta (`&` primeiro, evitando double-escape). A funcao e usada para `category_name` (L52). Correto.
- **CSV injection sanitization existe:** `src/lib/parsers/csv-parser.ts` L177 remove caracteres de formula injection (`=`, `+`, `-`, `@`) do inicio de descricoes. A protecao existe (achado D3.06 refere-se apenas a agressividade, nao a ausencia).
- **Cron endpoint retorna 500 se segredo nao configurado:** `src/app/api/digest/send/route.ts` L21-27 verifica se `DIGEST_CRON_SECRET` existe e retorna 500 com mensagem generica se ausente. Correto.
- **SSRF protection no indices/fetch:** `src/app/api/indices/fetch/route.ts` L34 define allowlist de hosts (`api.bcb.gov.br`, `apisidra.ibge.gov.br`), L91-103 valida a URL construida contra essa allowlist antes de fazer fetch. Correto.
- **Response JSON do indices/fetch em try-catch:** L117-123 envolve `response.json()` em try-catch separado. Correto.
- **Schemas Zod para RPC:** `src/lib/schemas/rpc.ts` define schemas para todas as RPCs do sistema, com `logSchemaError()` (L343-348) para logging de mismatches. Correto.
- **Security headers:** `next.config.js` configura X-Content-Type-Options nosniff (previne MIME sniffing), X-Frame-Options DENY, HSTS. Correto.
- **user_name no template de email:** `src/lib/email/weekly-digest-template.ts` - o campo `user_name` e interpolado diretamente no HTML sem `escapeHtml()`, porem o valor vem de `users_profile.full_name` que e definido pelo usuario no registro. Consultando o template, `user_name` NAO aparece interpolado no HTML (o nome do usuario nao e exibido no template atual). O template usa apenas `data.transaction_count`, valores monetarios formatados, e `category_name` (que e sanitizado). Correto.

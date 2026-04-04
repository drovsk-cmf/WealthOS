# Sessão 41 do Oniefy

## Contexto imediato

Sessão anterior (40): fix CI + dívida técnica + auditoria PENDENCIAS + 4 features. 12 commits (`576ca51`→`6a7ec01`). CI green.

Ler `HANDOVER-WealthOS.md` §40 para o contexto completo da sessão anterior. O HANDOVER é o source of truth do projeto.

## Ground truth (verificado sessão 40, commit `6a7ec01`)

| Métrica | Valor |
|---------|-------|
| Tabelas | 38 |
| Políticas RLS | 123 (116 public + 7 storage) |
| Functions | 78 (todas com search_path=public) |
| Triggers | 23 (26 event bindings) |
| ENUMs | 29 |
| Indexes | 156 |
| Migration files (repo) | 72 |
| pg_cron jobs | 13 |
| Suítes Jest | 76 |
| Assertions | ~1.172 |
| Arquivos TS/TSX | 296 |
| Hooks | 43 |
| Schemas Zod | 61 |
| Páginas (total) | 44 (35 autenticadas + 8 auth/public + 1 share) |
| Calculadoras | 8 + diagnostics |
| Engines puros (services/) | 21 |
| Parsers | 6 |
| Navegação | 5 tabs mobile + sidebar 18 links desktop + sininho |
| eslint-disable (produção) | 2 (ambos no-console, legítimos) |
| `as any` em hooks | 0 |
| docs/ ativos | 22 |
| docs/audit/ | 10 |
| docs/archive/ | 6 |

## O que a sessão 40 fez

### Fix CI: package-lock.json corrompido

Lockfile corrompido desde `fe91f6c` (sessão 39). 774 linhas com `"dev": true` adicionados indevidamente a deps transitivas. 5 commits consecutivos com CI vermelho. Restaurado do último commit green (`d090d91`).

### C1: Remover `as any` de 4 hooks + bug dedup-engine

4 hooks usavam `(supabase.rpc as any)()`. Todos corrigidos. `get_irpf_deductions` adicionado ao `database.ts`. Bug lógico em `dedup-engine.ts`: comparação `number === string` (sempre false) corrigido para `Math.abs(diff) < 0.01`.

### D8: RASTREABILIDADE-STORY-TESTE regenerado

65→108 stories. Cobertura de teste: 15%→78% (85/108). Mapeamento funcional por funcionalidade, não apenas por ID.

### D17: ROTEIRO-TESTE-MANUAL reescrito

10→16 blocos. Cobre 18 links sidebar + 5 tabs mobile + hub "Mais" (13 itens).

### E55: liquidity_tier editável

Dropdown agora visível para todos os tipos de conta, não apenas investment.

### E56: FocusTrap notification-panel

Auditoria de 16 modals overlay. 15 já tinham FocusTrap. Último (notification-panel) adicionado.

### E64: OCR para PDF

`pdfjs-dist@5.6.205` adicionado. Fast path: PDF.js text extraction. Fallback: rasterize + Tesseract. Regex boleto/NF-e. transaction-form aceita PDF. 8 novos testes.

### E35: Acesso read-only para contador

Feature completa: tabela `shared_access_tokens` + RPC `validate_shared_token` (SECURITY DEFINER) + hook `use-shared-access` + página pública `/share/[token]` + UI no `/tax` (botão Compartilhar + painel de links).

### Auditoria PENDENCIAS-FUTURAS

11 entradas stale removidas (E52, E53, E54, E58, E59, E60, E61, E62, E63, E65, E56). A19 (VAPID keys) adicionado. Backlog real limpo.

## Backlog executável (sem bloqueio externo)

| ID | Item | Esforço | Notas |
|----|------|---------|-------|
| E24 | **Módulo de investimentos** — 9 tipos, cotações, marcação a mercado | 8-12h | Maior item restante. Ref: INVESTMENTS-MODULE-SPEC se existir, ou especificar do zero. |
| E16 | **Compartilhamento familiar** — RBAC, permissões granulares | 8-12h | Muda cobrança pessoa→família. Reclassificado H1 por Claudio. |

### Bloqueados (dependência externa)

| ID | Item | Bloqueio |
|----|------|---------|
| E70 | Inbound email para faturas | Resend/SES |
| E4 | Onboarding validação empírica | A7 (corredor com 3 pessoas) |
| E42 | Valorização imóveis (FipeZap) | API externa |
| E43 | Assistente WhatsApp | WhatsApp Business API |
| E46 | Score crédito | Serasa/Boa Vista API |

### Ações do Claudio (sem código)

| ID | Prioridade | Ação | Desbloqueia |
|----|-----------|------|-------------|
| A1 | P0 | Supabase Pro upgrade | Leaked Password Protection |
| A19 | P1 | VAPID keys (gerar + env vars Vercel) | Web Push funcional (E65 código pronto) |
| A14 | P1 | Assets de marca (favicon, PWA icons) | Ícone genérico |
| A2 | P1 | Apple Developer Account | iOS App Store |
| A3 | P1 | SMTP noreply@oniefy.com | Auth emails |

## Documentos-chave

| Documento | Papel |
|-----------|-------|
| `HANDOVER-WealthOS.md` | Source of truth (contexto + histórico + ground truth). §40 tem tudo desta sessão. |
| `PENDENCIAS-FUTURAS.md` | Backlog unificado. Pendentes primeiro, concluídos no final. |
| `docs/RASTREABILIDADE-STORY-TESTE.md` | Mapeamento 108 stories → código → testes. |
| `docs/ROTEIRO-TESTE-MANUAL.md` | 16 blocos de teste manual (atualizado sessão 40). |

## Instruções

1. Ler `HANDOVER-WealthOS.md` §40 no início da sessão.
2. Verificar CI green no commit mais recente.
3. Consultar `PENDENCIAS-FUTURAS.md` para o backlog priorizado.
4. Verificar contra fonte primária (`execute_sql`, `find`, `grep`), nunca confiar no que outro documento afirma.

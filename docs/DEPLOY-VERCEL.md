# Oniefy - Deploy na Vercel

## Pré-requisitos

- Conta no [Vercel](https://vercel.com) (login com GitHub)
- Repositório `drovsk-cmf/WealthOS` acessível
- Valores do `.env.local` em mãos

## Passo 1: Criar projeto

1. Acesse https://vercel.com/new
2. Importe `drovsk-cmf/WealthOS`
3. Framework Preset: **Next.js** (detectado automaticamente)
4. Root Directory: `.` (padrão)
5. **NÃO clique Deploy ainda** - configure as variáveis primeiro

## Passo 2: Variáveis de ambiente

Adicione todas as variáveis abaixo em Settings > Environment Variables.

### Obrigatórias (app não funciona sem elas)

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API > anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API > service_role (NUNCA exponha no frontend) |

### Cron jobs (necessárias para push e digest funcionar)

| Variável | Valor |
|---|---|
| `CRON_SECRET` | Gere um valor aleatório: `openssl rand -hex 32` |
| `DIGEST_CRON_SECRET` | Gere outro valor aleatório: `openssl rand -hex 32` |

### Push notifications (opcional, ativar quando quiser push)

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BKkwuc0_QqHEgiJis-u5v1bw0xA9HHUqTyzAiiaHKF60PgcW_ClnlRiMfzB76cG-24OR_bQ5lL0sPzB6qRsn53c` |
| `VAPID_PRIVATE_KEY` | `_4WeEDusx7Jyz5bBCC_bQe2ECTVCAD49dhMB8t_sAvY` |
| `VAPID_EMAIL` | `mailto:admin@oniefy.com` |

### Email semanal (opcional, ativar quando quiser digest)

| Variável | Onde encontrar |
|---|---|
| `RESEND_API_KEY` | Criar conta em https://resend.com > API Keys > Create |

## Passo 3: Deploy

1. Clique **Deploy**
2. Aguarde o build (~2-3 minutos)
3. Vercel vai mostrar a URL: `https://wealthos-XXXX.vercel.app`

## Passo 4: Domínio customizado

1. Vá em Settings > Domains
2. Adicione `oniefy.com`
3. Siga as instruções de DNS:
   - Tipo: `A` Record
   - Nome: `@`
   - Valor: `76.76.21.21` (Vercel)
4. Adicione também `www.oniefy.com`:
   - Tipo: `CNAME`
   - Nome: `www`
   - Valor: `cname.vercel-dns.com`
5. Aguarde propagação DNS (5 min a 48h)

## Passo 5: Configurar Supabase para produção

No Supabase Dashboard > Authentication > URL Configuration:

1. **Site URL:** `https://oniefy.com`
2. **Redirect URLs:** adicione:
   - `https://oniefy.com/api/auth/callback`
   - `https://oniefy.com/reset-password`

No Supabase Dashboard > Authentication > Providers:
- Google: atualize Authorized redirect URI para `https://hmwdfcsxtmbzlslxgqus.supabase.co/auth/v1/callback`
  (provavelmente já está correto)

## Passo 6: Verificar

1. Acesse `https://oniefy.com` (ou a URL Vercel)
2. Faça login
3. Verifique se o Dashboard carrega
4. Teste criar uma transação

## Cron jobs

O `vercel.json` configura 2 crons automáticos:

| Job | Schedule | O que faz |
|---|---|---|
| `/api/push/send` | Diário 11:00 UTC (8h Brasília) | Envia push para contas vencidas |
| `/api/digest/send` | Segunda 12:00 UTC (9h Brasília) | Envia email resumo semanal |

Os crons só funcionam no plano Pro da Vercel ($20/mês). No plano Hobby (gratuito), use um scheduler externo (ex: cron-job.org) para chamar os endpoints com o header de autenticação.

Exemplo com curl:
```bash
curl -X POST https://oniefy.com/api/push/send \
  -H "Authorization: Bearer SEU_CRON_SECRET"

curl -X POST https://oniefy.com/api/digest/send \
  -H "x-cron-secret: SEU_DIGEST_CRON_SECRET"
```

## Troubleshooting

| Problema | Solução |
|---|---|
| Build falha com "Missing env" | Verifique que todas as 3 variáveis obrigatórias foram adicionadas |
| Login não funciona | Verifique Site URL e Redirect URLs no Supabase Auth |
| Google OAuth falha | Verifique Authorized redirect URI no Google Cloud Console |
| Push não envia | Verifique VAPID keys + CRON_SECRET nas env vars |
| Páginas lentas | Primeiro carregamento após deploy é mais lento (cold start). Depois normaliza |

# Oniefy - Migrar Supabase para São Paulo (sa-east-1)

## Por que migrar

O projeto atual está em us-east-1 (Virgínia, EUA). Latência Goiânia → Virgínia: ~150ms por chamada.
Após migrar para sa-east-1 (São Paulo): ~20-30ms por chamada.

Ganho estimado: Dashboard carrega ~2 segundos mais rápido.

## Passo a passo

### 1. Criar novo projeto

1. Acesse https://supabase.com/dashboard
2. "New Project"
3. **Organization:** mesma org
4. **Name:** `oniefy-prod` (ou qualquer nome)
5. **Database Password:** gere uma senha forte e guarde
6. **Region:** `South America (São Paulo)`
7. **Plan:** Free (migrar para Pro depois)
8. Clique "Create new project"
9. Aguarde o setup (~2 minutos)
10. Anote o **Project ID** (aparece na URL: `supabase.com/dashboard/project/XXXXXXX`)

### 2. Informar o novo Project ID

Passe o novo Project ID para o Claude na próxima sessão. Ele vai:
- Aplicar todas as 53+ migrations
- Reconfigurar os 9 pg_cron jobs
- Verificar RLS policies
- Recriar SECURITY DEFINER functions com auth guards
- Configurar Storage bucket

### 3. Atualizar variáveis de ambiente

No `.env.local` (desenvolvimento):
```
NEXT_PUBLIC_SUPABASE_URL=https://NOVO_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=NOVA_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=NOVA_SERVICE_ROLE_KEY
```

Na Vercel (produção, se já fez deploy):
- Settings > Environment Variables > atualizar as 3 keys

### 4. Configurar Auth no novo projeto

No Supabase Dashboard do NOVO projeto:

1. Authentication > URL Configuration:
   - Site URL: `https://oniefy.com` (ou localhost para dev)
   - Redirect URLs: `https://oniefy.com/api/auth/callback`

2. Authentication > Providers:
   - Google: habilitar com as mesmas Client ID / Secret do Google Cloud Console
   - Atualizar Authorized redirect URI no Google Cloud Console para:
     `https://NOVO_PROJECT_ID.supabase.co/auth/v1/callback`

3. Authentication > Email Templates:
   - Copiar os 3 templates customizados (confirmation, recovery, email_change)

### 5. Recriar usuários

Usuários não migram entre projetos. Opções:
- **Beta fechado:** Pedir aos testers para criar nova conta
- **Seu usuário:** Cadastrar novamente com Google OAuth

### 6. Dados

O projeto atual tem 0 transações e 0 contas bancárias (só seeds). Não há dados para migrar.
Os seeds (140 COA, 16 categorias, 1 centro de custo) são criados automaticamente no onboarding.

### 7. Desativar projeto antigo

Após confirmar que tudo funciona no novo:
1. Supabase Dashboard > Settings > General > Pause Project (projeto antigo)
2. Ou Delete Project (irreversível)

## Quando fazer

- **Antes do beta público:** ideal, menor disrupção
- **Depois do deploy Vercel:** pode fazer em sequência
- **Não é bloqueante:** o app funciona no us-east-1, só é mais lento

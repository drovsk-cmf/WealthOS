# Dominio 1 — Autenticacao & Gerenciamento de Sessao

**Referencia normativa:** OWASP ASVS v4.0 Cap. 2 (Autenticacao), Cap. 3 (Gerenciamento de Sessao)
**Data da auditoria:** 2026-03-16
**Arquivos analisados:** 20

---

## Achados

### [ALTO] D1.01 — Rate limiter in-memory nao compartilha estado entre instancias serverless

**Arquivo:** `src/lib/auth/rate-limiter.ts` L40-41
**Descricao:** O rate limiter utiliza um `Map` em memoria (`const store = new Map<string, RateLimitEntry>()`). Em ambientes serverless como Vercel, cada instancia (cold start) possui seu proprio store isolado. Um atacante pode contornar o rate limit simplesmente fazendo requisicoes que atingem instancias diferentes. O proprio codigo reconhece essa limitacao nos comentarios (L8-10), mas nao ha mitigacao implementada.
**Impacto:** Brute-force em login, registro e reset de senha pode ultrapassar os limites configurados (5 tentativas/15min para login) em deploy multi-instancia. A protecao efetiva depende apenas do GoTrue built-in do Supabase.
**Correcao:** Migrar o store para Upstash Redis, Vercel KV ou outro backend distribuido. Alternativamente, implementar rate limiting no edge via Vercel WAF ou Cloudflare.

---

### [ALTO] D1.02 — Registro e forgot-password chamam Supabase diretamente do cliente, contornando rate limiter do servidor

**Arquivo:** `src/app/(auth)/register/page.tsx` L68-75; `src/app/(auth)/forgot-password/page.tsx` L20-21
**Descricao:** As paginas de registro e forgot-password invocam `supabase.auth.signUp()` e `supabase.auth.resetPasswordForEmail()` diretamente no navegador (client-side). Diferente do login, que possui um proxy server-side (`/api/auth/login`) com rate limiting, essas rotas dependem exclusivamente do rate limit do middleware (que intercepta o acesso a pagina, nao a chamada de API ao GoTrue). O usuario pode abrir o DevTools e chamar `supabase.auth.signUp()` repetidamente sem que o rate limiter do middleware seja consultado.
**Impacto:** Enumeracao de emails via registro (Supabase retorna respostas diferentes para emails ja cadastrados em algumas configuracoes). Abuso do endpoint de reset-password para enviar emails em massa (email bombing).
**Correcao:** Criar rotas server-side (`/api/auth/register`, `/api/auth/forgot-password`) analogas a `/api/auth/login`, com rate limiting efetivo antes de chamar o Supabase. Remover chamadas diretas ao Supabase SDK do client para esses fluxos.

---

### [MEDIO] D1.03 — Comparacao de segredo do cron (digest/send) usa operador `!==` vulneravel a timing attack

**Arquivo:** `src/app/api/digest/send/route.ts` L29
**Descricao:** A verificacao do segredo do cron utiliza comparacao direta de strings (`authHeader !== cronSecret`). Essa operacao pode vazar informacoes sobre o comprimento e conteudo do segredo via diferenca de tempo de execucao (timing side-channel). Embora o vetor de ataque seja mais teorico em contexto HTTP com latencia de rede, e uma violacao do principio ASVS 2.6.
**Impacto:** Um atacante com acesso de rede ao endpoint poderia, em teoria, descobrir o segredo do cron via medicoes de tempo repetidas.
**Correcao:** Usar `crypto.timingSafeEqual()` (disponivel no Node.js runtime) ou equivalente para comparacao de segredos. Exemplo: `crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(cronSecret))`.

---

### [MEDIO] D1.04 — Timeout de sessao nao limpa cache do Service Worker

**Arquivo:** `src/lib/auth/use-session-timeout.ts` L28-33
**Descricao:** O hook `useSessionTimeout` chama `clearEncryptionKey()` e `supabase.auth.signOut()` quando a sessao expira por inatividade, mas nao envia a mensagem `CLEAR_CACHE` ao Service Worker. Em contraste, o logout manual em `src/app/(app)/layout.tsx` L74-75 e o logout de seguranca em `src/app/(app)/settings/security/page.tsx` L60-61 enviam corretamente `navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" })`.
**Impacto:** Apos timeout de sessao, ativos estaticos cacheados pelo SW permanecem disponiveis. Embora o SW atual nao cache dados autenticados (apenas assets imutaveis), a inconsistencia entre os caminhos de logout cria um risco de regressao futura caso a politica de cache evolua.
**Correcao:** Adicionar o envio de `postMessage({ type: "CLEAR_CACHE" })` ao `handleTimeout` do hook, alinhando com os demais fluxos de logout.

---

### [MEDIO] D1.05 — Verificacao AAL2 ocorre apenas client-side, sem enforcement no middleware ou API routes

**Arquivo:** `src/middleware.ts` L26-28; `src/app/(auth)/login/page.tsx` L38-55
**Descricao:** Conforme comentario no middleware (L27-28): "MFA AAL check happens client-side (app layout) because middleware should stay fast". A verificacao de AAL2 e feita no `handlePostLogin()` do login page, que verifica `currentLevel` e redireciona para `/mfa-challenge`. Porem, nao ha enforcement server-side: um usuario com AAL1 que acesse diretamente `/dashboard` (ou qualquer rota protegida) via URL nao e bloqueado pelo middleware. As API routes (ex: `/api/indices/fetch`, `/api/digest/preview`) tambem nao verificam o nivel AAL.
**Impacto:** Um atacante que obtenha credenciais de primeiro fator (senha) pode acessar dados sensiveis sem completar o desafio MFA, derrotando o proposito do segundo fator.
**Correcao:** Implementar verificacao de AAL no middleware (ao menos para rotas que exibem dados financeiros) ou em um wrapper comum para API routes. A latencia adicional da chamada `mfa.getAuthenticatorAssuranceLevel()` pode ser mitigada com cache no cookie ou verificacao seletiva por rota.

---

### [BAIXO] D1.06 — Login schema nao aplica regras fortes de senha (blocklist e complexidade)

**Arquivo:** `src/lib/validations/auth.ts` L49-52
**Descricao:** O `loginSchema` valida apenas `email` (formato) e `password` com `min(1)`. Isso e intencional — nao faz sentido bloquear login com senhas fracas ja cadastradas. Porem, nao ha validacao de blocklist no fluxo de login, o que significa que usuarios com senhas fracas (criadas antes da blocklist) nao sao forcados a trocar.
**Impacto:** Baixo. Usuarios legados com senhas fracas continuam podendo fazer login. O risco e mitigado pelo MFA obrigatorio.
**Correcao:** Considerar implementar "forced password rotation" para usuarios com senhas que agora estariam na blocklist, exibindo uma tela pos-login solicitando troca.

---

### [BAIXO] D1.07 — Erro de Supabase nao tratados de forma generica no login proxy podem vazar informacoes

**Arquivo:** `src/app/api/auth/login/route.ts` L64-73
**Descricao:** O login proxy trata apenas o caso `"Invalid login credentials"` para retornar mensagem generica. Qualquer outro `error.message` do Supabase (ex: `"Email not confirmed"`, `"User banned"`) e repassado diretamente ao cliente como `message` no JSON de erro (L68). Isso pode revelar informacoes sobre o estado da conta ao atacante.
**Impacto:** Enumeracao de estado de contas (confirmar se email existe mas nao esta verificado, se usuario foi banido, etc.).
**Correcao:** Retornar mensagem generica para qualquer erro de autenticacao (ex: `"Email ou senha incorretos."`) independente da mensagem original do Supabase. Logar a mensagem original server-side para debug.

---

### [BAIXO] D1.08 — Erro de Supabase exposto diretamente no registro e forgot-password

**Arquivo:** `src/app/(auth)/register/page.tsx` L79-81; `src/app/(auth)/forgot-password/page.tsx` L26-28
**Descricao:** Em ambas as paginas, o `error.message` retornado pelo Supabase SDK e exibido diretamente ao usuario (`setServerError(error.message)`, `setError(resetError.message)`). Mensagens como `"User already registered"` permitem enumeracao de emails.
**Impacto:** Enumeracao de contas: atacante pode determinar se um email esta cadastrado no sistema.
**Correcao:** Substituir por mensagens genericas. No registro: "Se este email estiver disponivel, enviaremos um link de confirmacao." No forgot-password: a pagina ja exibe mensagem generica apos sucesso (L45-46), mas o caminho de erro expoe detalhes.

---

## Resumo do dominio

| ID | Severidade | Achado | Esforco |
|---|---|---|---|
| D1.01 | ALTO | Rate limiter in-memory nao compartilha estado entre instancias | Medio |
| D1.02 | ALTO | Registro e forgot-password contornam rate limiter (chamadas client-side) | Medio |
| D1.03 | MEDIO | Comparacao de segredo do cron vulneravel a timing attack | Baixo |
| D1.04 | MEDIO | Timeout de sessao nao limpa cache do Service Worker | Baixo |
| D1.05 | MEDIO | AAL2 verificado apenas client-side, sem enforcement server-side | Alto |
| D1.06 | BAIXO | Login schema nao forca troca de senhas fracas legadas | Baixo |
| D1.07 | BAIXO | Erros do Supabase vazam informacoes no login proxy | Baixo |
| D1.08 | BAIXO | Erros do Supabase expostos diretamente em registro e forgot-password | Baixo |

**Total:** 8 achados (0 criticos, 2 altos, 3 medios, 3 baixos)

---

## Verificacoes sem achados

As seguintes verificacoes foram realizadas e nao apresentaram problemas:

- **Zod validation no login proxy:** `src/app/api/auth/login/route.ts` usa `safeParse` (L40) com `try-catch` envolvendo `request.json()` (L38-53). Correto.
- **Password schema (registro e reset):** `src/lib/validations/auth.ts` aplica min 12 chars, max 128, lowercase, uppercase, digito e blocklist via `passwordSchema` (L13-28). O `resetPasswordSchema` (L74-82) reutiliza o mesmo `passwordSchema`. Correto.
- **Blocklist de senhas:** `src/lib/auth/password-blocklist.ts` contem ~200 entradas relevantes (BR-specific, app-specific, keyboard walks). Comparacao case-insensitive (L214). Correto.
- **Callback OTP allowlist:** `src/app/api/auth/callback/route.ts` L31 define `VALID_OTP_TYPES = ["signup", "email", "recovery", "invite"]` e valida contra allowlist (L35). Correto.
- **Token hash validation:** O callback valida `tokenHash` e `type` via `supabase.auth.verifyOtp()` (L39-42). Correto.
- **KEK derivada de material estavel:** `src/lib/auth/encryption-manager.ts` usa `kek_material` (random 256 bits, gerado uma vez no onboarding, L36-38) como input para HKDF. Nao depende de JWT efemero. Correto.
- **Algoritmos criptograficos:** `src/lib/crypto/index.ts` usa AES-256-GCM (L16-17), HKDF com SHA-256 (L59), IV de 96 bits (L18). Correto conforme boas praticas.
- **KEK/DEK nao expostos ao cliente:** `src/app/(app)/settings/data/page.tsx` L137-140 exclui explicitamente `kek_material`, `encryption_key_encrypted`, `encryption_key_iv` do export de dados. Correto.
- **Session refresh:** `src/middleware.ts` L160-162 chama `supabase.auth.getUser()` em toda requisicao, renovando o token. Correto.
- **Cookies HttpOnly/Secure/SameSite:** Gerenciados pelo `@supabase/ssr` com configuracao padrao segura (HttpOnly, Secure em producao, SameSite=Lax). O codigo nao sobrescreve essas configuracoes. Correto.
- **CSP nonce-based:** `src/middleware.ts` L39-70 gera nonce criptografico (16 bytes) e aplica CSP com `strict-dynamic` em producao. `frame-ancestors 'none'` bloqueia clickjacking. Correto.
- **Security headers:** `next.config.js` configura HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy. Correto.
- **MFA TOTP:** `src/lib/auth/mfa.ts` implementa enroll, challenge+verify e unenroll usando a API nativa do Supabase. Correto.
- **Logout limpa DEK e SW cache:** `src/app/(app)/layout.tsx` L71-78 chama `clearEncryptionKey()`, envia `CLEAR_CACHE` ao SW e faz `signOut()`. Correto.
- **Redirect sanitization:** `src/lib/utils/index.ts` L63-96 implementa `sanitizeRedirectTo` com protecao contra open redirect (rejeita `//`, `\`, `:`, `@`, `javascript:`, `data:`). Correto.

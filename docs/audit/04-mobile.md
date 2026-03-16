# Dominio 4 — Seguranca Mobile (iOS / Capacitor)

**Referencia normativa:** OWASP MASVS v2 (Storage, Crypto, Auth, Network, Platform, Resilience)
**Data da auditoria:** 2026-03-16
**Arquivos analisados:** 6 (capacitor.config.ts, use-app-lifecycle.ts, use-biometric.ts, sw.js, package.json, layout.tsx)

---

## Achados

### [ALTO] D4.01 — `authenticate()` retorna `false` — bug dormente que impede biometria

**Arquivo:** `src/lib/auth/use-biometric.ts` L70-74
**Descricao:** Quando `state.available` e `true` (plataforma iOS), `authenticate()` retorna `false` incondicionalmente. O hook marca biometria como disponivel em iOS (L65: `available: platform === "ios"`), porem a funcao de autenticacao sempre falha. Isso silenciosamente bloqueia qualquer tentativa de autenticacao biometrica. O hook e importado em `settings/security/page.tsx`, entao um usuario que tente ativar biometria nas configuracoes tera a operacao falhando silenciosamente. Este e um bug dormente: nao adiciona seguranca (a biometria nunca funciona), mas tambem nao cria bypass — apenas impede a funcionalidade de operar quando o plugin real for integrado na Fase 10, se o stub nao for atualizado.
**Impacto:** Funcionalidade de biometria completamente inoperante no iOS. Quando o plugin real for integrado (Fase 10), se o fallback nao for atualizado, a biometria nunca funcionara. Usuarios terao impressao de que biometria esta disponivel (UI habilitada) mas autenticacao sempre falhara.
**Correcao:** Alterar stub para `return true` (bypass seguro ate implementacao real) com log de aviso, ou desabilitar o botao de biometria na UI enquanto o stub estiver ativo (verificando se o plugin real esta instalado).

---

### [MEDIO] D4.02 — `attemptBiometricUnlock()` retorna `true` (bypass) sem biometria real

**Arquivo:** `src/lib/auth/use-app-lifecycle.ts` L156-168
**Descricao:** Stub documentado que retorna `true` em plataforma nativa (L168), permitindo restauracao da DEK sem verificacao biometrica. O comentario extenso (L148-154) explica a decisao: um stub que retorna `false` sem biometria real nao adiciona seguranca — apenas impede restauracao da DEK apos background, travando o app silenciosamente. O hook esta conectado no layout principal (`src/app/(app)/layout.tsx` L61). Em producao iOS sem implementacao real, qualquer pessoa com acesso ao dispositivo desbloqueado pode restaurar a DEK do app sem verificacao adicional.
**Impacto:** Em iOS, a DEK e restaurada automaticamente ao voltar do background sem nenhuma verificacao biometrica. Seguranca depende apenas do lock screen do dispositivo. Para app financeiro, uma camada adicional de verificacao (biometria) e esperada ao retomar sessao.
**Correcao:** Documentar explicitamente como risco aceito ate Fase 10, ou implementar prompt de PIN/senha como alternativa intermediaria enquanto o plugin de biometria nao estiver disponivel.

---

### [ALTO] D4.03 — Certificate pinning nao implementado

**Arquivo:** `capacitor.config.ts` L22-23
**Descricao:** A configuracao iOS contem apenas um comentario indicando "Certificate pinning configured in native project" (L23), mas nao ha configuracao real de pinning no projeto. Nenhum plugin de SSL pinning (`@nickytonline/capacitor-ssl-pinning`, `capacitor-ssl-pinning`, ou equivalente) esta presente em `package.json`. Nao ha configuracao nativa de pinning no diretorio do projeto iOS. Sem pinning, o trafego HTTPS entre o app e o Supabase pode ser interceptado em dispositivos com CA customizado instalado (perfis MDM, proxies corporativos, ferramentas de debug como Charles/mitmproxy).
**Impacto:** Man-in-the-middle possivel em redes controladas (Wi-Fi corporativo com CA custom, dispositivos com perfis MDM, jailbroken devices). Para app financeiro que transmite dados sensiveis (transacoes, saldos, CPF criptografado), e um risco significativo. O CSP e headers de seguranca protegem apenas o contexto web, nao o trafego nativo.
**Correcao:** Implementar SSL pinning via plugin Capacitor ou configuracao nativa no projeto iOS (`Info.plist` com `NSAppTransportSecurity` e public key pins). Considerar pinning para os hosts `*.supabase.co` e `api.bcb.gov.br`.

---

### [BAIXO] D4.04 — Dependencia `@capacitor-community/biometric-auth` ausente

**Arquivo:** `package.json`
**Descricao:** O plugin de biometria referenciado nos TODOs (`use-app-lifecycle.ts` L159: `// TODO Fase 10: install @capacitor-community/biometric-auth`) nao esta instalado como dependencia. Coerente com o status de stub (Fase 10), mas reforca que D4.01 e D4.02 sao bugs reais em producao iOS, nao apenas codigo incompleto.
**Impacto:** Confirma que biometria nao esta funcional. Achado informativo que contextualiza D4.01 e D4.02.
**Correcao:** Instalar `@capacitor-community/biometric-auth` e implementar integracao real quando iniciar Fase 10.

---

## Resumo do dominio

| ID | Severidade | Achado | Esforco |
|---|---|---|---|
| D4.01 | ALTO | `authenticate()` retorna `false` — biometria inoperante | Baixo |
| D4.02 | MEDIO | `attemptBiometricUnlock()` bypass sem biometria real | Medio |
| D4.03 | ALTO | Certificate pinning nao implementado | Alto |
| D4.04 | BAIXO | Plugin de biometria ausente do `package.json` | Baixo |

**Total:** 4 achados (0 criticos, 2 altos, 1 medio, 1 baixo)

---

## Verificacoes sem achados

As seguintes verificacoes foram realizadas e nao apresentaram problemas:

- **Service Worker exclui endpoints de auth do cache:** `public/sw.js` L57-59 exclui `/auth/`, `/api/` e hostnames contendo `supabase` do cache. Apenas assets estaticos imutaveis (JS/CSS com hash do Next.js, fontes, imagens) sao cacheados. Correto.
- **Service Worker com estrategia network-only para navegacao:** `public/sw.js` nao intercepta requests de navegacao (nao ha `respondWith` para requests do tipo `navigate`). Correto para app financeiro que nao deve servir HTML stale.
- **Handler CLEAR_CACHE no Service Worker:** `public/sw.js` L37-43 implementa listener para mensagem `CLEAR_CACHE` que limpa todos os caches. E invocado no logout manual (`src/app/(app)/layout.tsx` L74-75) e no logout de seguranca. Correto.
- **DEK lifecycle conectado no layout:** `src/app/(app)/layout.tsx` L61 invoca `useAppLifecycle()`, que implementa purge da DEK ao ir para background e restore ao voltar para foreground (`src/lib/auth/use-app-lifecycle.ts`). Correto.
- **Logout limpa DEK e cache do SW:** `src/app/(app)/layout.tsx` L71-78 chama `clearEncryptionKey()`, envia `CLEAR_CACHE` ao Service Worker e executa `signOut()`. Correto.
- **Capacitor deps na versao major atual:** `package.json` tem `@capacitor/core`, `@capacitor/app`, `@capacitor/keyboard`, `@capacitor/status-bar` em `^6.0.0` (major atual). Sem versoes desatualizadas com CVEs conhecidos. Correto.
- **Keychain habilitado para iOS:** `capacitor.config.ts` L22 contem comentario indicando uso de Keychain para token storage. O `@capacitor/preferences` (padrao do Capacitor 6) utiliza Keychain no iOS por padrao. Correto.
- **localStorage sem dados sensiveis:** `src/lib/stores/privacy.ts` persiste apenas `valuesHidden` (boolean) via Zustand. Nenhum dado financeiro, token, DEK ou PII armazenado em localStorage. Correto.
- **sessionStorage sem dados sensiveis:** Apenas step de onboarding armazenado temporariamente. Correto.
- **connect-src restrito no CSP:** `src/middleware.ts` define `connect-src 'self' https://*.supabase.co https://api.bcb.gov.br wss://*.supabase.co`. APIs adicionais (`apisidra.ibge.gov.br`, `ipeadata.gov.br`) nao estao no connect-src porque sao buscadas server-side via pg_cron, nao pelo browser. Correto. (Referencia cruzada: D1/D3.)

# Playwright Audit Kit

Suite de auditoria UX/performance/acessibilidade universal para aplicações web com autenticação.

Pensado para ser copiado para qualquer projeto. Você edita **um único arquivo** (`audit.config.ts`) e roda.

## Pré-requisitos

```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install chromium
```

## Setup

1. Copie a pasta `playwright-audit-kit/` para a raiz do seu projeto (ou onde preferir)
2. Edite `audit.config.ts`:
   - `baseUrl`: URL do ambiente a testar
   - `auth`: credenciais e seletores da página de login
   - `routes`: lista de rotas autenticadas do projeto
   - `thresholds`: limites de qualidade (LCP, CLS, etc.)
3. Crie o diretório de auth: `mkdir -p e2e/.auth`

## Execução

```bash
# Rodar tudo
npx playwright test --config=playwright-audit-kit/playwright.config.ts

# Rodar apenas um spec
npx playwright test --config=playwright-audit-kit/playwright.config.ts specs/universal/accessibility.spec.ts

# Ver relatório HTML
npx playwright show-report
```

Se o app roda em URL diferente de localhost:
```bash
PLAYWRIGHT_BASE_URL="https://staging.meuapp.com" npx playwright test --config=playwright-audit-kit/playwright.config.ts
```

## Estrutura

```
playwright-audit-kit/
├── audit.config.ts              ← ÚNICO arquivo que você edita
├── playwright.config.ts         ← Config do Playwright (não editar)
├── specs/
│   ├── auth.setup.ts            ← Login automático
│   ├── universal/               ← 11 specs universais
│   │   ├── accessibility.spec.ts      7.3  WCAG AA (axe-core)
│   │   ├── keyboard-navigation.spec.ts 7.5  Tab order, focus, traps
│   │   ├── mobile-responsive.spec.ts  7.7  4 breakpoints, overflow
│   │   ├── all-pages-crawl.spec.ts    7.2  Heading, conteúdo, erros
│   │   ├── dead-links.spec.ts         6.4  Links 404, href="#"
│   │   ├── loading-states.spec.ts     7.2  Flash vazio, skeleton
│   │   ├── performance.spec.ts        5.x  LCP, CLS, load time
│   │   ├── security-headers.spec.ts   4.6  CSP, HSTS, X-Frame
│   │   ├── error-resilience.spec.ts   9.3  404, rede, form data
│   │   ├── seo-meta.spec.ts           2.6  Title, OG, canonical
│   │   └── observability.spec.ts      9.2  Analytics, 5xx, erros
│   └── generated/               ← Specs gerados pelo discovery
├── discovery/
│   ├── crawl-inventory.spec.ts  ← Inventaria elementos interativos
│   └── PROMPT-GENERATE.md       ← Prompt para gerar specs específicos
├── reports/
│   └── inventory.json           ← Gerado pelo discovery
└── README.md
```

## Specs universais

Os 11 specs universais cobrem verificações que se aplicam a qualquer aplicação web. Nenhum deles contém lógica de negócio.

| Spec | Matriz | O que verifica |
|---|---|---|
| accessibility | 7.3 | Violações WCAG AA via axe-core. Falha em CRITICAL, reporta SERIOUS |
| keyboard-navigation | 7.5 | Tab order, focus visible, ausência de keyboard traps |
| mobile-responsive | 7.7 | 4 viewports (mobile/tablet/desktop), overflow, touch targets |
| all-pages-crawl | 7.2, 6.4 | Heading h1/h2, conteúdo renderizado, console.error |
| dead-links | 6.4 | Links internos sem 404, href="#" ou vazio |
| loading-states | 7.2, 3.4 | Flash de conteúdo vazio sem skeleton/spinner |
| performance | 5.x | LCP, CLS, tempo de carga por rota, resiliência de rede |
| security-headers | 4.6, 9.1 | X-Frame-Options, CSP, HSTS, Referrer-Policy |
| error-resilience | 9.3, 7.6 | Página 404 customizada, preservação de form em erro de rede |
| seo-meta | 2.6 | Title, meta description, Open Graph, canonical, lang |
| observability | 9.2 | Analytics carregado, sem 5xx, sem console.error |

## Discovery: gerar specs específicos

Para gerar specs de auditoria específicos ao projeto (formulários, fluxos, confirmações):

```bash
# 1. Rodar discovery
npx playwright test --config=playwright-audit-kit/playwright.config.ts discovery/crawl-inventory.spec.ts

# 2. Abrir Claude Code e usar o prompt
cat discovery/PROMPT-GENERATE.md
# Copiar o prompt e executar no Claude Code apontando para reports/inventory.json
```

Os specs gerados ficam em `specs/generated/` e são executados junto com os universais.

## Mapeamento para a Matriz de Validação

Cada spec referencia o ID da auditoria correspondente na Matriz de Validação (Anexo C). O mapeamento completo está documentado na Matriz v2.2.

## Interpretação dos resultados

- **Falha (❌)**: violação que precisa de correção. Specs universais falham apenas em issues críticos.
- **Warning (⚠️)**: issue reportado no console mas que não falha o teste. Merece atenção.
- **Info (ℹ️)**: informação contextual. Pode ser esperado (ex: analytics não configurado em dev).
- **Pass (✅)**: verificação passou.

## Personalização

Para alterar thresholds, adicionar rotas, ou mudar comportamento, edite apenas `audit.config.ts`. Os specs leem tudo de lá.

Para adicionar um spec universal novo, crie em `specs/universal/` seguindo o padrão: importar `auditConfig`, iterar sobre `routes`, usar `test.describe` com nome descritivo.

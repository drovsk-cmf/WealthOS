/**
 * Playwright Audit Kit - Configuração do projeto
 *
 * Este é o ÚNICO arquivo que você precisa editar para adaptar o kit ao seu projeto.
 * Todos os specs universais leem daqui.
 */

export interface AuditRoute {
  /** Caminho da rota (ex: "/dashboard") */
  path: string;
  /** Nome legível para os relatórios (ex: "Dashboard") */
  name: string;
  /** Se a rota contém formulários interativos */
  hasForms?: boolean;
  /** Se é uma rota crítica para performance (medida de Web Vitals) */
  critical?: boolean;
  /** Se a rota requer dados para renderizar conteúdo significativo */
  requiresData?: boolean;
}

export interface AuditConfig {
  /** URL base do ambiente a ser testado */
  baseUrl: string;

  /** Configuração de autenticação */
  auth: {
    /** URL da página de login */
    loginUrl: string;
    /** Credenciais do usuário de teste */
    credentials: {
      email: string;
      password: string;
    };
    /** Seletor CSS do campo de e-mail */
    emailSelector: string;
    /** Seletor CSS do campo de senha */
    passwordSelector: string;
    /** Seletor CSS do botão de submit */
    submitSelector: string;
    /** URL para onde o login redireciona em caso de sucesso */
    successUrl: string;
    /** Caminho do arquivo de estado de auth (cookies salvos) */
    storageStatePath?: string;
  };

  /** Lista de rotas autenticadas do projeto */
  routes: AuditRoute[];

  /** Thresholds de qualidade */
  thresholds: {
    /** Largest Contentful Paint máximo em ms (padrão: 2500) */
    lcpMs: number;
    /** Cumulative Layout Shift máximo (padrão: 0.25) */
    cls: number;
    /** Tempo de carregamento máximo por página em ms (padrão: 3000) */
    loadMs: number;
    /** Tamanho mínimo de touch target em px (padrão: 44) */
    minTouchTarget: number;
    /** Viewports para teste de responsividade */
    viewports: { width: number; height: number; label: string }[];
  };

  /** Configuração opcional */
  options?: {
    /** Rota de 404 customizada (padrão: "/pagina-que-nao-existe-xyz") */
    notFoundTestPath?: string;
    /** Se o app suporta dark mode */
    hasDarkMode?: boolean;
    /** Security headers esperados (padrão: todos) */
    expectedSecurityHeaders?: string[];
    /** Serviços de analytics/observabilidade esperados */
    expectedAnalytics?: ("ga4" | "gtm" | "sentry" | "posthog" | "hotjar" | "vercel" | "datadog" | "newrelic")[];
    /** Seletores de formulário para teste de resiliência (rota + seletor de um campo) */
    resilience?: {
      formRoute: string;
      fieldSelector: string;
      testValue: string;
    };
  };
}

// ============================================================================
// EDITE ABAIXO - Configuração do seu projeto
// ============================================================================

export const auditConfig: AuditConfig = {
  baseUrl: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",

  auth: {
    loginUrl: "/login",
    credentials: {
      email: "e2e-test@oniefy.com",
      password: "E2eTest!Secure2026",
    },
    emailSelector: "#email",
    passwordSelector: "#password",
    submitSelector: 'button[type="submit"]',
    successUrl: "/dashboard",
    storageStatePath: "e2e/.auth/user.json",
  },

  routes: [
    // ── Navegação principal ──
    { path: "/dashboard", name: "Dashboard", critical: true },
    { path: "/transactions", name: "Transações", critical: true, hasForms: true },
    { path: "/cards", name: "Cartões de Crédito" },
    { path: "/cash-flow", name: "Fluxo de Caixa", critical: true },
    { path: "/bills", name: "Contas a Pagar", hasForms: true },
    { path: "/accounts", name: "Contas", critical: true, hasForms: true },
    { path: "/assets", name: "Patrimônio (Bens)", hasForms: true },
    { path: "/budgets", name: "Orçamento", hasForms: true },
    { path: "/goals", name: "Metas", hasForms: true },
    { path: "/tax", name: "Imposto de Renda" },
    { path: "/diagnostics", name: "Diagnóstico Financeiro", requiresData: true },
    { path: "/calculators", name: "Calculadoras" },
    { path: "/indices", name: "Índices Econômicos" },
    // ── Configurações ──
    { path: "/settings", name: "Configurações (hub)", hasForms: true },
    { path: "/settings/profile", name: "Perfil", hasForms: true },
    { path: "/settings/notifications", name: "Notificações", hasForms: true },
    { path: "/settings/security", name: "Segurança", hasForms: true },
    { path: "/settings/data", name: "Dados e Privacidade" },
    { path: "/settings/analytics", name: "Métricas" },
    // ── Auxiliares ──
    { path: "/categories", name: "Categorias", hasForms: true },
    { path: "/cost-centers", name: "Divisões", hasForms: true },
    { path: "/family", name: "Estrutura Familiar", hasForms: true },
    { path: "/connections", name: "Importação" },
    { path: "/workflows", name: "Tarefas" },
    { path: "/chart-of-accounts", name: "Estrutura Contábil" },
    { path: "/more/warranties", name: "Garantias", hasForms: true },
    // ── Calculadoras (sub-rotas) ──
    { path: "/calculators/affordability", name: "Calc: Posso Comprar?", hasForms: true },
    { path: "/calculators/projection", name: "Calc: Projeção", hasForms: true },
    { path: "/calculators/independence", name: "Calc: Independência", hasForms: true },
    { path: "/calculators/buy-vs-rent", name: "Calc: Comprar vs Alugar", hasForms: true },
    { path: "/calculators/cet", name: "Calc: CET", hasForms: true },
    { path: "/calculators/sac-vs-price", name: "Calc: SAC vs Price", hasForms: true },
    { path: "/calculators/debt-payoff", name: "Calc: Quitar Dívida", hasForms: true },
    { path: "/calculators/human-capital", name: "Calc: Capital Humano", hasForms: true },
  ],

  thresholds: {
    lcpMs: 2500,
    cls: 0.25,
    loadMs: 3000,
    minTouchTarget: 44,
    viewports: [
      { width: 390, height: 844, label: "mobile" },
      { width: 768, height: 1024, label: "tablet-portrait" },
      { width: 1024, height: 768, label: "tablet-landscape" },
      { width: 1280, height: 800, label: "desktop" },
    ],
  },

  options: {
    notFoundTestPath: "/pagina-que-nao-existe-xyz-404",
    hasDarkMode: true,
    expectedSecurityHeaders: [
      "x-frame-options",
      "x-content-type-options",
      "referrer-policy",
      "x-xss-protection",
      "content-security-policy",
    ],
    expectedAnalytics: ["vercel"],
    resilience: {
      formRoute: "/calculators/independence",
      fieldSelector: 'input[name="calc-fi-expense"]',
      testValue: "5000",
    },
  },
};

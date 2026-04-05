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
      email: "e2e-test@example.com",
      password: "SenhaSegura123!",
    },
    emailSelector: 'input[name="email"], input[type="email"]',
    passwordSelector: 'input[name="password"], input[type="password"]',
    submitSelector: 'button[type="submit"]',
    successUrl: "/dashboard",
    storageStatePath: "e2e/.auth/user.json",
  },

  routes: [
    { path: "/dashboard", name: "Dashboard", critical: true },
    { path: "/settings", name: "Configurações", hasForms: true },
    // Adicione suas rotas aqui
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
    hasDarkMode: false,
    expectedSecurityHeaders: [
      "x-frame-options",
      "x-content-type-options",
      "referrer-policy",
    ],
    expectedAnalytics: [],
    resilience: undefined,
  },
};

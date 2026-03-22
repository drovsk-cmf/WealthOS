#!/usr/bin/env node

/**
 * Oniefy - Health Check
 *
 * Testa endpoints e páginas do dev server sem precisar de browser.
 * Roda DEPOIS do `npm run dev` estar ativo.
 *
 * Uso:
 *   node scripts/healthcheck.mjs
 *   node scripts/healthcheck.mjs --base http://localhost:3000
 *   node scripts/healthcheck.mjs --verbose
 */

const BASE = process.argv.find((a) => a.startsWith("--base"))?.split("=")[1]
  || process.argv[process.argv.indexOf("--base") + 1]
  || "http://localhost:3000";
const VERBOSE = process.argv.includes("--verbose");
const TIMEOUT = 15000;

let passed = 0;
let failed = 0;
let warned = 0;

function icon(status) {
  return { pass: "✓", fail: "✗", warn: "⚠", skip: "○" }[status] || "?";
}

function color(status) {
  return { pass: "\x1b[32m", fail: "\x1b[31m", warn: "\x1b[33m", skip: "\x1b[90m" }[status] || "";
}

function log(status, msg, detail = "") {
  if (status === "pass") passed++;
  else if (status === "fail") failed++;
  else if (status === "warn") warned++;
  const c = color(status);
  const reset = "\x1b[0m";
  console.log(`  ${c}${icon(status)}${reset} ${msg}${detail ? ` — ${detail}` : ""}`);
}

async function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal, redirect: "manual" });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/** Follow redirects manually up to maxHops, so we can inspect each hop */
async function fetchFollowRedirects(url, maxHops = 5) {
  let current = url;
  for (let i = 0; i < maxHops; i++) {
    const res = await fetchWithTimeout(current);
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location") || "";
      // Resolve relative redirects
      current = location.startsWith("http") ? location : new URL(location, current).toString();
      continue;
    }
    return { res, finalUrl: current, hops: i };
  }
  return { res: await fetchWithTimeout(current), finalUrl: current, hops: maxHops };
}

// ── Page checks (GET, expect HTML without error) ──────────

async function checkPage(path, expectText = null) {
  const url = `${BASE}${path}`;
  try {
    const { res, finalUrl, hops } = await fetchFollowRedirects(url);

    // After following redirects, check if we ended up at /login (auth protected)
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location") || "";
      if (location.includes("/login")) {
        log("pass", `GET ${path}`, `redirect → login (protegido)`);
      } else {
        log("warn", `GET ${path}`, `redirect → ${location} (após ${hops} hops)`);
      }
      return;
    }

    // Final destination was /login (middleware redirect)
    if (finalUrl.includes("/login") && !path.includes("/login")) {
      log("pass", `GET ${path}`, `redirect → login (protegido)`);
      return;
    }

    if (res.status !== 200) {
      log("fail", `GET ${path}`, `status ${res.status}`);
      return;
    }

    const html = await res.text();

    // Check for error indicators
    if (html.includes("Something went wrong") || html.includes("Application error")) {
      log("fail", `GET ${path}`, "página renderizou com erro");
      return;
    }

    // Check for real 404 page (not just "404" mentioned anywhere in HTML)
    if (html.includes("NEXT_NOT_FOUND") || html.includes("This page could not be found")) {
      log("fail", `GET ${path}`, "página não encontrada (404)");
      return;
    }

    if (expectText && !html.toLowerCase().includes(expectText.toLowerCase())) {
      log("warn", `GET ${path}`, `texto esperado "${expectText}" não encontrado`);
      return;
    }

    const sizeKb = (html.length / 1024).toFixed(1);
    const hopNote = hops > 0 ? ` (${hops} redirect${hops > 1 ? "s" : ""})` : "";
    log("pass", `GET ${path}`, `${res.status} OK (${sizeKb} KB)${hopNote}`);

    if (VERBOSE) {
      // Check for common issues in HTML
      if (html.includes("No data")) {
        console.log(`       ↳ contém "No data" (possível texto em inglês)`);
      }
      if (html.includes("undefined") && html.includes("NaN")) {
        console.log(`       ↳ contém "undefined" ou "NaN" (possível erro de tipo)`);
      }
    }
  } catch (err) {
    if (err.name === "AbortError") {
      log("fail", `GET ${path}`, `timeout (${TIMEOUT}ms)`);
    } else {
      log("fail", `GET ${path}`, err.message);
    }
  }
}

// ── API checks ────────────────────────────────────────────

async function checkApi(path, method = "GET", body = null) {
  const url = `${BASE}${path}`;
  try {
    const opts = { method, headers: {} };
    if (body) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }

    // Follow redirects (apex→www) then check final response
    let current = url;
    let res;
    for (let i = 0; i < 5; i++) {
      res = await fetchWithTimeout(current, i === 0 ? opts : { method, headers: opts.headers });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location") || "";
        current = location.startsWith("http") ? location : new URL(location, current).toString();
        continue;
      }
      break;
    }

    const status = res.status;

    // 401/403 = auth required, which is correct behavior
    if (status === 401 || status === 403) {
      log("pass", `${method} ${path}`, `${status} (auth exigida, correto)`);
      return;
    }

    if (status >= 200 && status < 300) {
      log("pass", `${method} ${path}`, `${status} OK`);
      return;
    }

    if (status >= 500) {
      log("fail", `${method} ${path}`, `${status} SERVER ERROR`);
      return;
    }

    log("warn", `${method} ${path}`, `status ${status}`);
  } catch (err) {
    if (err.name === "AbortError") {
      log("fail", `${method} ${path}`, `timeout`);
    } else {
      log("fail", `${method} ${path}`, err.message);
    }
  }
}

// ── Security headers check ────────────────────────────────

async function checkHeaders() {
  try {
    const { res } = await fetchFollowRedirects(BASE);
    const headers = Object.fromEntries(res.headers.entries());

    const expected = {
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "strict-transport-security": null, // just check existence
    };

    for (const [header, expectedValue] of Object.entries(expected)) {
      const actual = headers[header];
      if (!actual) {
        log("warn", `Header ${header}`, "ausente");
      } else if (expectedValue && actual !== expectedValue) {
        log("warn", `Header ${header}`, `esperado "${expectedValue}", recebeu "${actual}"`);
      } else {
        log("pass", `Header ${header}`, actual);
      }
    }

    // CSP check
    const csp = headers["content-security-policy"];
    if (csp) {
      log("pass", "Content-Security-Policy", `presente (${csp.substring(0, 60)}...)`);
    } else {
      log("warn", "Content-Security-Policy", "ausente");
    }
  } catch (err) {
    log("fail", "Security headers", err.message);
  }
}

// ── Main ──────────────────────────────────────────────────

async function main() {
  console.log("");
  console.log("══════════════════════════════════════");
  console.log("  Oniefy — Health Check");
  console.log(`  Base: ${BASE}`);
  console.log("══════════════════════════════════════");

  // 1. Server alive?
  console.log("\n─── Servidor ───");
  try {
    await fetchFollowRedirects(BASE);
    log("pass", "Servidor respondendo", BASE);
  } catch (err) {
    log("fail", "Servidor", `não responde em ${BASE}. Está rodando?`);
    console.log(`\n  Total: 0 pass, 1 fail\n`);
    process.exit(1);
  }

  // 2. Security headers
  console.log("\n─── Headers de Segurança ───");
  await checkHeaders();

  // 3. Public pages
  console.log("\n─── Páginas Públicas ───");
  await checkPage("/login", "Entrar");
  await checkPage("/register", "Criar conta");
  await checkPage("/privacy", "privacidade");
  await checkPage("/terms", "termos");

  // 4. Protected pages (expect redirect to login)
  console.log("\n─── Páginas Protegidas (sem auth → redirect) ───");
  const protectedRoutes = [
    "/dashboard", "/transactions", "/accounts", "/budgets",
    "/assets", "/connections", "/settings", "/categories",
    "/bills", "/tax", "/indices", "/family",
    "/chart-of-accounts", "/cost-centers", "/workflows",
    "/settings/profile", "/settings/security",
    "/settings/notifications", "/settings/data",
    "/settings/analytics",
  ];
  for (const route of protectedRoutes) {
    await checkPage(route);
  }

  // 5. API routes
  console.log("\n─── API Routes ───");
  await checkApi("/api/auth/callback");
  await checkApi("/api/digest/preview");
  await checkApi("/api/indices/fetch", "POST");
  await checkApi("/api/push/send", "POST", { title: "test" });
  await checkApi("/api/ai/categorize", "POST", { descriptions: ["teste"] });

  // 6. Summary
  console.log("\n══════════════════════════════════════");
  console.log(`  Passou:  ${passed}`);
  console.log(`  Falhou:  ${failed}`);
  console.log(`  Avisos:  ${warned}`);
  console.log("══════════════════════════════════════");

  if (failed > 0) {
    console.log("\n  Itens [✗] precisam de atenção antes de testar no browser.\n");
    process.exit(1);
  } else if (warned > 0) {
    console.log("\n  Itens [⚠] são não-críticos mas vale verificar.\n");
  } else {
    console.log("\n  Tudo OK! Pode abrir o browser.\n");
  }
}

main().catch((err) => {
  console.error("Health check falhou:", err);
  process.exit(1);
});

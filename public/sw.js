/**
 * Oniefy - Service Worker (CFG-07)
 *
 * Strategy:
 * - Static assets (JS, CSS, fonts, images): Cache-first, network fallback
 * - API calls (/api/, supabase): Network-first, cache fallback for reads
 * - Navigation: Network-first, offline fallback page
 *
 * Cache versioning: bump CACHE_VERSION to invalidate old caches.
 */

const CACHE_VERSION = "oniefy-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Static assets to precache on install
const PRECACHE_URLS = [
  "/dashboard",
  "/manifest.json",
];

// ─── Install ─────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // Don't fail install if precache fails (dev mode, missing assets)
        console.warn("[SW] Precache partial failure:", err);
      });
    })
  );
  // Activate immediately (skip waiting)
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
});

// ─── Fetch ───────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (mutations should always go to network)
  if (request.method !== "GET") return;

  // Skip chrome-extension, ws, etc.
  if (!url.protocol.startsWith("http")) return;

  // Skip Supabase auth endpoints (always network)
  if (url.pathname.includes("/auth/")) return;

  // Strategy selection
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else {
    // Navigation and other: network-first with offline fallback
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// ─── Helpers ─────────────────────────────────────────────────

function isStaticAsset(url) {
  const staticExtensions = [
    ".js", ".css", ".woff", ".woff2", ".ttf", ".otf",
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ];
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/brand/") ||
    staticExtensions.some((ext) => url.pathname.endsWith(ext))
  );
}

function isApiRequest(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase")
  );
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return a basic offline response for missing static assets
    return new Response("", { status: 503, statusText: "Offline" });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok && request.method === "GET") {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // For navigation requests, return the cached dashboard as fallback
    if (request.mode === "navigate") {
      const fallback = await caches.match("/dashboard");
      if (fallback) return fallback;
    }

    return new Response(
      JSON.stringify({ error: "offline", message: "Sem conexão. Dados em cache indisponíveis." }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Oniefy - Service Worker (CFG-07)
 *
 * Strategy (revised after ChatGPT audit):
 * - Static assets (JS, CSS, fonts, images): Cache-first, network fallback
 * - API calls, Supabase, authenticated HTML: NEVER cached
 * - Navigation: Network-only (no offline HTML fallback for financial app)
 *
 * Key principle: a financial app must never serve stale authenticated data.
 * Cache is limited to immutable static assets only.
 */

const CACHE_VERSION = "oniefy-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// ─── Install ─────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE));
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ─── Message: cache cleanup on logout ────────────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
});

// ─── Fetch ───────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Only handle http(s)
  if (!url.protocol.startsWith("http")) return;

  // NEVER cache: auth endpoints, API routes, Supabase
  if (url.pathname.includes("/auth/")) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.hostname.includes("supabase")) return;

  // NEVER cache: HTML pages (navigation requests carry auth state)
  if (request.mode === "navigate") return;
  if (request.headers.get("accept")?.includes("text/html")) return;

  // Only cache truly static, immutable assets
  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
  // Everything else: let browser handle normally (no interception)
});

// ─── Helpers ─────────────────────────────────────────────────

function isImmutableAsset(url) {
  // Next.js hashed static assets
  if (url.pathname.startsWith("/_next/static/")) return true;

  // Font files
  if (/\.(woff2?|ttf|otf)$/.test(url.pathname)) return true;

  // Images in known static directories
  if (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/")) {
    return /\.(png|jpg|jpeg|gif|svg|ico|webp)$/.test(url.pathname);
  }

  return false;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 503, statusText: "Offline" });
  }
}

// ─── Push Notifications (5.2 / CFG-04 web) ──────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Oniefy", body: event.data.text() };
  }

  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: payload.tag || "oniefy-notification",
    data: { url: payload.url || "/" },
    vibrate: [200, 100, 200],
    actions: payload.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "Oniefy", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new tab
      return clients.openWindow(url);
    })
  );
});

const CACHE = "deepboard-v1";

// App shell — pages and assets cached on install
const SHELL = [
  "/",
  "/dashboard",
  "/whiteboard",
  "/lessons",
  "/quizzes",
  "/recordings",
  "/settings",
  "/manifest.json",
];

// ── Install: cache the shell ──────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// ── Activate: clear old caches ────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for shell ───────
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Always go to network for API calls and auth — never serve stale data
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/login")) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache-first for everything else (shell, static assets)
  e.respondWith(
    caches.match(e.request).then(
      (cached) => cached || fetch(e.request).then((res) => {
        // Cache successful GET responses
        if (res.ok && e.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
    )
  );
});

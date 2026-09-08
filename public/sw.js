/* global self, caches */
// RuralEdu service worker.
//
// Strategy, by request type:
//   navigations   network-first, falling back to the cached page, then /offline
//   static assets stale-while-revalidate (JS, CSS, fonts, images)
//   API GETs      network-first, falling back to the last good response
//   API writes    passed straight through — queueing is the app's job, in
//                 IndexedDB, so a queued change survives the worker restarting

const VERSION = "v3";
const SHELL_CACHE = `ruraledu-shell-${VERSION}`;
const PAGE_CACHE = `ruraledu-pages-${VERSION}`;
const ASSET_CACHE = `ruraledu-assets-${VERSION}`;
const API_CACHE = `ruraledu-api-${VERSION}`;

const OFFLINE_URL = "/offline.html";

// Kept deliberately small: only what is needed to render something useful on a
// cold start with no connection. Everything else is cached as it is visited.
const SHELL_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icons/icon.svg",
];

const CURRENT_CACHES = [SHELL_CACHE, PAGE_CACHE, ASSET_CACHE, API_CACHE];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // `addAll` rejects the whole install if any single request fails, which
      // would leave the app with no worker at all.
      Promise.allSettled(
        SHELL_ASSETS.map((url) =>
          fetch(url, { cache: "reload" }).then((response) =>
            response.ok ? cache.put(url, response) : null
          )
        )
      )
    )
  );
  // Do NOT skipWaiting here: the page asks the user first, then messages us.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => !CURRENT_CACHES.includes(name))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/** Only ever store a response that is actually usable later. */
function isCacheable(response) {
  return (
    response &&
    response.ok &&
    response.status === 200 &&
    // An opaque cross-origin response cannot be inspected, and caching one
    // would silently serve an error page as if it were content.
    response.type !== "opaque" &&
    !response.headers.get("cache-control")?.includes("no-store")
  );
}

async function putInCache(cacheName, request, response) {
  if (!isCacheable(response)) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
}

/** Network first, cached copy second, offline page last. */
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      void putInCache(PAGE_CACHE, request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;

    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;

    return new Response(
      "<h1>Offline</h1><p>This page has not been saved on this device.</p>",
      { status: 503, headers: { "Content-Type": "text/html" } }
    );
  }
}

/** Serve immediately from cache, refresh in the background. */
async function handleAsset(request) {
  const cached = await caches.match(request);

  const network = fetch(request)
    .then((response) => {
      if (isCacheable(response)) {
        void putInCache(ASSET_CACHE, request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const response = await network;
  if (response) return response;

  return new Response("", { status: 504, statusText: "Offline" });
}

/**
 * API reads: prefer the network, fall back to the last successful response.
 *
 * The fallback is marked with `X-From-SW-Cache` so the client can tell the user
 * they are looking at saved data rather than presenting it as current.
 */
async function handleApiRead(request) {
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      void putInCache(API_CACHE, request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set("X-From-SW-Cache", "1");
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: "You are offline and this data has not been saved yet.",
        data: null,
        error: { code: "OFFLINE" },
        timestamp: new Date().toISOString(),
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never touch cross-origin traffic (Google fonts, the GSI script): letting it
  // fall through keeps their own caching rules intact.
  if (url.origin !== self.location.origin) return;

  // The health probe must always report the real state of the network.
  if (url.pathname === "/api/health") return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRead(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  ) {
    event.respondWith(handleAsset(request));
    return;
  }

  // Anything else (RSC payloads, manifest) — network first, cache as a backup.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (isCacheable(response)) {
          void putInCache(PAGE_CACHE, request, response.clone());
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached ?? new Response("", { status: 504 });
      })
  );
});

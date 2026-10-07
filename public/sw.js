/**
 * Offline support. The app has no server data, so once its files are cached
 * it works fully offline:
 *  - Pages: network first (to pick up updates), cached copy when offline.
 *  - Everything else (scripts, styles, fonts, images): cached copy first,
 *    refreshed in the background.
 * The page also sends the list of files it already loaded, so the very first
 * visit is enough to make the app work offline.
 */

const CACHE = "razzak-pos-v1"
const SCOPE = self.registration.scope // e.g. https://example.com/ (ends with /)

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          SCOPE,
          `${SCOPE}manifest.webmanifest`,
          `${SCOPE}logo.png`,
          `${SCOPE}logo-mark.png`,
          `${SCOPE}icons/icon-192.png`,
          `${SCOPE}icons/icon-512.png`,
        ])
      )
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

// The page posts { type: "CACHE_URLS", urls } with every file it has loaded.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_URLS") return
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        event.data.urls.map((url) =>
          cache.match(url).then((hit) => hit || cache.add(url).catch(() => {}))
        )
      )
    )
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Single-page app: every page navigation is served by the one cached page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(SCOPE, copy))
          }
          return response
        })
        .catch(() =>
          caches.match(SCOPE).then((hit) => hit || caches.match(request))
        )
    )
    return
  }

  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone())
            return response
          })
          .catch(() => cached)
        return cached || network
      })
    )
  )
})

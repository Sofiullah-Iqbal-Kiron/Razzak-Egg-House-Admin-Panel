import { BASE_PATH } from "@/lib/base-path"

/**
 * Registers the offline service worker (production builds only; it would
 * interfere with the dev server's hot reload).
 */
export async function registerServiceWorker() {
  if (process.env.NODE_ENV !== "production") return
  if (!("serviceWorker" in navigator)) return
  try {
    await navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, {
      scope: `${BASE_PATH}/`,
      updateViaCache: "none",
    })
    await cacheLoadedFiles()
  } catch {
    // Offline support is a bonus; the app works without it.
  }
}

/**
 * Asks the service worker to cache every file this page has already loaded
 * (scripts, styles, fonts, images), so the first visit is enough to work
 * offline from then on.
 */
export async function cacheLoadedFiles() {
  if (process.env.NODE_ENV !== "production") return
  if (!("serviceWorker" in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const urls = performance
    .getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((url) => url.startsWith(location.origin))
  registration.active?.postMessage({
    type: "CACHE_URLS",
    urls: [location.href, ...new Set(urls)],
  })
}

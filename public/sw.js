const CACHE_NAME = "app-cache-v-0.0.2"

// Cache essential resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/icons/icon.png", "/icons/badge.svg"])
    })
  )
})

// Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Notify clients about new version
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Push notification handling
self.addEventListener("push", (event) => {
  try {
    if (!event.data) return

    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || "/icons/icon.png",
      badge: "/icons/badge.svg",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: crypto.randomUUID(),
        url: data.url || "https://tiffin.witheb.in",
      },
      actions: [
        {
          action: "open",
          title: "Open App",
        },
        {
          action: "close",
          title: "Dismiss",
        },
      ],
      tag: "tiffin-notification", // Prevents multiple notifications, updates existing one
      renotify: true, // Vibrate/sound even if tag is same
    }

    event.waitUntil(self.registration.showNotification(data.title || "New Notification", options))
  } catch (error) {
    console.error("Push event handling failed:", error)
  }
})

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "close") return

  const urlToOpen = event.notification.data?.url || "https://tiffin.witheb.in"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      const hadWindowToFocus = windowClients.some((windowClient) => {
        if (windowClient.url === urlToOpen) {
          // Focus if already open
          windowClient.focus()
          return true
        }
        return false
      })

      // If no window/tab to focus, open new one
      if (!hadWindowToFocus) {
        clients.openWindow(urlToOpen)
      }
    })
  )
})

// Check for updates and notify clients
self.addEventListener("install", (event) => {
  self.skipWaiting() // Activate the new service worker immediately
})

// Notify clients about the new version
self.addEventListener("activate", (event) => {
  event.waitUntil(
    clients.claim().then(() => {
      clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "NEW_VERSION_AVAILABLE",
          })
        })
      })
    })
  )
})

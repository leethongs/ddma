self.addEventListener("install", (e) => { e.waitUntil(self.skipWaiting()); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener("push", (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || "DDMA Alert";
  const options = {
    body: data.message || "New disaster alert received.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [500, 250, 500, 250, 500],
    requireInteraction: true,
    silent: false,
    data: { url: "/alerts" }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});
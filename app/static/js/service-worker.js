const CACHE_NAME = "edupath-ai-v5-5-144-push";
const ASSETS = [
    "/",
    "/static/css/style.css",
    "/static/js/app.js",
    "/static/manifest.json"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    );
});

self.addEventListener("install", event => {
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});


self.addEventListener("push", function(event) {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = {
            title: "تذكير من EduPath AI",
            body: "لديك مهمة تعليمية تنتظرك."
        };
    }

    const title = data.title || "تذكير من EduPath AI";
    const options = {
        body: data.body || "لديك مهمة تعليمية تنتظرك.",
        icon: data.icon || "/static/icons/icon-192.png",
        badge: data.badge || "/static/icons/icon-192.png",
        data: {
            url: data.url || "/tasks"
        },
        tag: data.tag || "edupath-task-reminder",
        renotify: true
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function(event) {
    event.notification.close();
    const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/tasks";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
            for (const client of clientList) {
                if ("focus" in client) {
                    client.focus();
                    if ("navigate" in client) client.navigate(url);
                    return;
                }
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});

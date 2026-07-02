// Минимальный SW для установки PWA. БЕЗ кэша (чтобы не отдавать устаревшие сборки при частых деплоях).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => { /* network passthrough, без offline-кэша */ });

const C = 'absensi-v2';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => c.add('/offline.html'))); self.skipWaiting(); });
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') e.respondWith(fetch(e.request).catch(() => caches.match('/offline.html')));
});
self.addEventListener('push', (e) => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(d.title || 'Absensi Desa', { body: d.body || '', icon: '/icon/192', badge: '/icon/192', data: { url: d.url || '/' } }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const u = e.notification.data.url;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => { for (const c of cs) if ('focus' in c) { c.navigate(u); return c.focus(); } return clients.openWindow(u); }));
});

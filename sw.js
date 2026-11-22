const C = 'animal-raid';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png']))); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  // réseau d'abord, mais si le réseau traîne plus de 4 s (voiture, partage de connexion) on sert la copie gardée
  const cached = () => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('./'));
  const net = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); e.waitUntil(caches.open(C).then(c => c.put(r, cp))); } return res; });
  e.respondWith(Promise.race([net, new Promise(ok => setTimeout(ok, 4000))]).then(res => res || cached().then(m => m || net)).catch(() => cached()));
});

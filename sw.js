const C = 'animal-raid-2';
const put = async v => {
  const page = await fetch(new Request('./', { cache: 'reload' }));
  if (!page.ok) throw new Error('http ' + page.status);
  if (v && !(await page.clone().text()).includes('name="build" content="' + v + '"')) throw new Error('page pas encore à jour');
  await (await caches.open(C)).put('./', page);
};
self.addEventListener('install', e => e.waitUntil((async () => {
  await put();
  await (await caches.open(C)).addAll(['manifest.webmanifest', 'icon-180.png', 'icon-512.png'].map(u => new Request(u, { cache: 'reload' })));
  await self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('animal-raid') && k !== C) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('message', e => {
  const v = e.data && e.data.refresh;
  if (typeof v !== 'string' || !/^[a-f0-9]{12}$/.test(v)) return;
  e.waitUntil(put(v).then(() => e.source.postMessage({ fresh: v }), () => e.source.postMessage({ fresh: null })));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || r.headers.has('range')) return;
  // Le jeu de piste (cadeau/) n'est pas géré ici, ni le numéro de version (toujours demandé au serveur).
  if (u.pathname.includes('/cadeau/') || u.pathname.endsWith('/cadeau') || u.pathname.endsWith('/version.txt')) return;
  // La page (14 Mo) est gardée sous une seule clé, quelle que soit l'adresse (?tout…) ; seule la page du jeu va sous cette clé.
  const base = new URL(self.registration.scope).pathname;
  const key = r.mode === 'navigate' && (u.pathname === base || u.pathname === base + 'index.html') ? './' : r;
  e.respondWith((async () => {
    try { const hit = await (await caches.open(C)).match(key); if (hit) return hit; } catch (err) { }
    return fetch(r);
  })());
});

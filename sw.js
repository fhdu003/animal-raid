const C = 'animal-raid';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png']))); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  // Le jeu de piste (cadeau/) n'est pas géré ici : sinon sa page prendrait la place du jeu dans le cache.
  if (new URL(r.url).pathname.includes('/cadeau/')) return;
  // La page (13 Mo) est gardée sous une seule clé, quelle que soit l'adresse (?tout…).
  // Réseau d'abord pour recevoir les mises à jour ; si le téléchargement complet dépasse 4 s (voiture, partage
  // de connexion) on sert la copie gardée, et la nouvelle version, qui finit de se charger derrière, servira au prochain lancement.
  const key = r.mode === 'navigate' ? './' : r;
  const net = fetch(r).then(async res => {
    if (!res.ok) throw new Error('http ' + res.status);
    const full = new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
    const c = await caches.open(C); await c.put(key, full.clone());
    return full;
  });
  e.waitUntil(net.catch(() => {}));
  e.respondWith(caches.match(key).then(hit => hit
    ? Promise.race([net, new Promise(ok => setTimeout(ok, 4000))]).then(x => x || hit).catch(() => hit)
    : net.catch(() => Response.error())));
});

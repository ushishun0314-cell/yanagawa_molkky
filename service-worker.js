// service-worker.js
const VERSION = 'v1.0.0';
const CACHE = `yanamol-${VERSION}`;

// ここに「オフラインで必要な最低限」を列挙
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
  // 画像やフォント、分割ファイルがあればここに追加
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

// 基本は「キャッシュ優先、なければネット」
self.addEventListener('fetch', (e) => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        // 同一オリジン・GETのみキャッシュに入れる
        const url = new URL(req.url);
        if (req.method === 'GET' && url.origin === self.location.origin) {
          const resClone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => {
        // 完全オフライン時のフォールバック（必要ならカスタムHTMLを返す）
        return caches.match('./index.html');
      });
    })
  );
});

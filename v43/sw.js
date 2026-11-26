/* Cache-version sættes automatisk ved hver levering (20261126184320). HTML/JS/CSS hentes netværk-først, så opdateringer når brugerne uden manuel handling. */
const VERSION='dv-v43-20261126184320';const SHELL=['./','index.html','css/v4.css','js/app.js','js/config.js','dv-data.js','icons/icon.svg','manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VERSION).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 if(/\.(jpg|jpeg|png|webp|svg)(\?|$)/.test(r.url)){e.respondWith(caches.match(r).then(h=>h||fetch(r).then(n=>{const c=n.clone();caches.open(VERSION).then(x=>x.put(r,c));return n})));return}
 e.respondWith(fetch(r).then(n=>{const c=n.clone();caches.open(VERSION).then(x=>x.put(r,c));return n}).catch(()=>caches.match(r).then(h=>h||caches.match('index.html'))))});

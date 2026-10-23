/* Generated per deployment from vetted dist files. Scope limited to /certification-study/. */
const CACHE_NAME='cert-overdrive-__VERSION__';
const PRECACHE=__PRECACHE__;
const BASE='/certification-study/';
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(PRECACHE)));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('cert-overdrive-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 const url=new URL(request.url);
 if(!url.pathname.startsWith(BASE))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>response.ok?response:caches.match(BASE+'index.html').then(cached=>cached||response))
   .catch(()=>caches.match(BASE+'index.html').then(cached=>cached||Response.error())));
  return;
 }
 // Vite content-hashed assets are immutable; all app assets are precached.
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});

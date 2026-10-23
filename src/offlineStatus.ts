/** Read-only inspection of SW/cache. Browser storage eviction means this is a point-in-time observation. */
export type OfflineSnapshot={status:'ready'|'partial'|'unavailable';cacheRevision:string|null;assetCount:number;online:boolean;swControlled:boolean};
export async function inspectOffline():Promise<OfflineSnapshot>{
 const online=typeof navigator!=='undefined'?navigator.onLine!==false:true;
 const swControlled=typeof navigator!=='undefined'&&'serviceWorker' in navigator&&!!navigator.serviceWorker.controller;
 const fallback:OfflineSnapshot={status:'unavailable',cacheRevision:null,assetCount:0,online,swControlled};
 if(typeof caches==='undefined')return fallback;
 try{
  const keys=(await caches.keys()).filter(k=>/^cert-overdrive-[0-9a-f]{16}$/.test(k)).sort();
  if(!keys.length)return fallback;
  const last=keys[keys.length-1],cache=await caches.open(last),requests=await cache.keys();
  const hasShell=requests.some(x=>new URL(x.url).pathname==='/certification-study/index.html');
  const hasBundle=requests.some(x=>new URL(x.url).pathname.startsWith('/certification-study/assets/')&&x.url.endsWith('.js'));
  return {status:hasShell&&hasBundle?'ready':'partial',cacheRevision:last.slice('cert-overdrive-'.length),assetCount:requests.length,online,swControlled};
 }catch{return fallback}
}

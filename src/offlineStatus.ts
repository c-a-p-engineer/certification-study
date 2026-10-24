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

export type StorageEstimate={usageBytes:number;quotaBytes:number;percent:number|null;persistent:boolean|null};
/** Browser quota values are estimates, not guaranteed available bytes. */
export async function inspectStorageQuota():Promise<StorageEstimate|null>{
 if(typeof navigator==='undefined'||!navigator.storage?.estimate)return null;
 try{
  const value=await navigator.storage.estimate();
  const usageBytes=Number.isFinite(value.usage)&&value.usage!>=0?value.usage!:0;
  const quotaBytes=Number.isFinite(value.quota)&&value.quota!>0?value.quota!:0;
  const persistent=typeof navigator.storage.persisted==='function'?await navigator.storage.persisted().catch(()=>null):null;
  return {usageBytes,quotaBytes,percent:quotaBytes>0?Math.min(100,Math.round(100*usageBytes/quotaBytes)):null,persistent};
 }catch{return null}
}

/** PWA is optional: never block quiz startup when installation or caching is unsupported. */
export function registerOffline():void{
 if(typeof window==='undefined'||!('serviceWorker' in navigator))return;
 window.addEventListener('load',()=>{void navigator.serviceWorker.register('/certification-study/sw.js',{scope:'/certification-study/'}).catch(()=>{/* private mode / browser restriction */})},{once:true});
}

/** Observe a downloaded update, but only activate after a deliberate learner action. */
export function watchOfflineUpdates(onReady:()=>void):()=>void{
 if(typeof navigator==='undefined'||!('serviceWorker' in navigator))return ()=>{};
 let disposed=false;let stop:()=>void=()=>{};
 const onRegistered=(registration:ServiceWorkerRegistration)=>{
  if(disposed)return;
  const installed=()=>{
   if(navigator.serviceWorker.controller&&registration.waiting)onReady();
  };
  const track=()=>{
   const installing=registration.installing;
   if(!installing)return;
   installing.addEventListener('statechange',installed);
  };
  if(registration.waiting)installed();
  registration.addEventListener('updatefound',track);
  stop=()=>{registration.removeEventListener('updatefound',track);registration.installing?.removeEventListener('statechange',installed)};
 };
 void navigator.serviceWorker.ready.then(onRegistered).catch(()=>{});
 return ()=>{disposed=true;stop()};
}
export function applyOfflineUpdate():boolean{
 if(typeof navigator==='undefined'||!('serviceWorker' in navigator))return false;
 void navigator.serviceWorker.getRegistration('/certification-study/').then(reg=>{
  if(!reg?.waiting)return;
  const onChange=()=>{navigator.serviceWorker.removeEventListener('controllerchange',onChange);window.location.reload()};
  navigator.serviceWorker.addEventListener('controllerchange',onChange,{once:true});
  reg.waiting.postMessage({type:'ACTIVATE_UPDATE'});
 }).catch(()=>{});
 return true;
}

/** PWA is optional: never block quiz startup when installation or caching is unsupported. */
export function registerOffline():void{
 if(typeof window==='undefined'||!('serviceWorker' in navigator))return;
 window.addEventListener('load',()=>{void navigator.serviceWorker.register('/certification-study/sw.js',{scope:'/certification-study/'}).catch(()=>{/* private mode / browser restriction */})},{once:true});
}

/** 7.4: browser-local optimistic progress writes.
 * Web Locks serializes cooperative same-origin tabs when available.
 * Without Web Locks, read/compare/write is advisory and NOT atomic across processes.
 * Never modify a pending backup restoration journal.
 */
export const PROGRESS_SAVE_KEY='certification-overdrive-progress-v1';
export const RESTORE_PENDING_KEY='cert-overdrive-restore-journal-v1';
export const PROGRESS_LOCK_NAME='cert-overdrive-progress-write-v1';
export type StorageReaderWriter={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void};
export type ProgressSyncMeta={revision:number;writerId:string;updatedAt:number};
export type SaveResult={status:'saved';serialized:string;meta:ProgressSyncMeta;atomic:boolean}|
 {status:'conflict'|'restore-pending'|'unavailable';message:string;atomic:boolean};
const object=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export function parseProgressMeta(raw:string|null):ProgressSyncMeta|null{
 if(raw===null)return null;
 try{
  const record=JSON.parse(raw);
  if(!object(record)||!object(record._sync))return null;
  const x=record._sync;
  if(!Number.isSafeInteger(x.revision)||Number(x.revision)<1||Number(x.revision)>Number.MAX_SAFE_INTEGER-1||
   typeof x.writerId!=='string'||x.writerId.length<6||x.writerId.length>120||
   !Number.isSafeInteger(x.updatedAt)||Number(x.updatedAt)<0)return null;
  return {revision:x.revision as number,writerId:x.writerId as string,updatedAt:x.updatedAt as number};
 }catch{return null}
}
export function generateTabWriterId():string{
 try{if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')return crypto.randomUUID()}catch{}
 return 'tab-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
}
function writeIfUnchanged(store:StorageReaderWriter,expectedRaw:string|null,next:unknown,writerId:string,now:number,atomic:boolean):SaveResult{
 try{
  if(store.getItem(RESTORE_PENDING_KEY)!==null)return {status:'restore-pending',message:'復元記録が残っています。保存データを上書きしません。',atomic};
  const actual=store.getItem(PROGRESS_SAVE_KEY);
  if(actual!==expectedRaw)return {status:'conflict',message:'別のタブ、復元処理、または前回の保存が学習記録を変更しました。現在の古い記録で上書きしません。',atomic};
  if(!object(next)||typeof writerId!=='string'||writerId.length<6||writerId.length>120)
   return {status:'unavailable',message:'保存する進捗情報が不正です。',atomic};
  const prev=parseProgressMeta(actual);
  const revision=(prev?.revision??0)+1;
  const meta={revision,writerId,updatedAt:now};
  const serialized=JSON.stringify({...next,_sync:meta});
  store.setItem(PROGRESS_SAVE_KEY,serialized);
  return {status:'saved',serialized,meta,atomic};
 }catch{
  return {status:'unavailable',message:'ローカル保存に失敗しました。容量制限・プライベートモード・ブラウザ設定を確認し、先に進捗の緊急退避を行ってください。',atomic};
 }
}
export async function guardedProgressSave(store:StorageReaderWriter,expectedRaw:string|null,next:unknown,writerId:string,
 now=Date.now(),locks?:{request:<T>(name:string,options:{mode:'exclusive'},callback:()=>T|Promise<T>)=>Promise<T>}):Promise<SaveResult>{
 const lock=locks??(typeof navigator!=='undefined'&&'locks' in navigator?navigator.locks:undefined);
 try{
  if(lock?.request)return await lock.request(PROGRESS_LOCK_NAME,{mode:'exclusive'},()=>writeIfUnchanged(store,expectedRaw,next,writerId,now,true));
 }catch{
  return {status:'unavailable',message:'タブ間の保存ロックを取得できませんでした。別タブの操作を止め、必要ならバックアップを保存してください。',atomic:true};
 }
 return writeIfUnchanged(store,expectedRaw,next,writerId,now,false);
}
export function progressStorageChanged(expectedRaw:string|null,event:{key:string|null;newValue:string|null;storageArea?:unknown}):boolean{
 return (event.key===null||event.key===PROGRESS_SAVE_KEY||event.key===RESTORE_PENDING_KEY)&&
  (event.key!==PROGRESS_SAVE_KEY||event.newValue!==expectedRaw);
}
export function progressConflictSnapshot(progress:unknown,expectedRaw:string|null,latestRaw:string|null,now=new Date()){
 return {format:'CERT-OVERDRIVE-CONFLICT-SNAPSHOT',version:1,createdAt:now.toISOString(),localUnsavedProgress:progress,
  expectedSavedRaw:expectedRaw,currentSavedRaw:latestRaw,
  note:'This is a private diagnostic snapshot, not an importable backup. Do not upload publicly. Reload only after saving this snapshot if your tab has unsaved work.'};
}

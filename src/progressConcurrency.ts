/** OVERDRIVE 7.4 — best-effort local progress conflict detection.
 * localStorage has no compare-and-swap: two truly simultaneous writers can still race.
 * The guard detects observed stale snapshots and stops writing. It never merges XP.
 */
export const PROGRESS_SYNC_VERSION=1;
export type ProgressSync={revision:number;writerId:string;version:1};
export type ProgressSession={writerId:string;expectedRaw:string|null;revision:number;blocked:boolean;reason:ConflictReason|null};
export type ConflictReason='external-change'|'invalid-saved-state'|'storage-error';
export type GuardResult={status:'saved';savedRaw:string;revision:number}|{status:'blocked';reason:ConflictReason};
export type ReadWritePort=Pick<Storage,'getItem'|'setItem'>;
const plainObject=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const validRevision=(value:unknown):value is number=>Number.isSafeInteger(value)&&typeof value==='number'&&value>=0;
export function validProgressSync(value:unknown):value is ProgressSync{
 if(!plainObject(value))return false;
 return value.version===1&&validRevision(value.revision)&&value.revision<Number.MAX_SAFE_INTEGER&&
  typeof value.writerId==='string'&&value.writerId.length>=6&&value.writerId.length<=128;
}
function readSync(raw:string|null):{revision:number;valid:boolean}{
 if(raw===null)return {revision:0,valid:true};
 let value:unknown;try{value=JSON.parse(raw)}catch{return {revision:0,valid:false}}
 if(!plainObject(value))return {revision:0,valid:false};
 if(!Object.prototype.hasOwnProperty.call(value,'progressSync'))return {revision:0,valid:true};
 return validProgressSync(value.progressSync)?{revision:value.progressSync.revision,valid:true}:{revision:0,valid:false};
}
export function openProgressSession(store:Pick<ReadWritePort,'getItem'>,key:string,writerId:string):ProgressSession{
 if(typeof writerId!=='string'||writerId.length<6||writerId.length>128)throw new Error('Invalid writer ID');
 try{
  const raw=store.getItem(key),details=readSync(raw);
  return {writerId,expectedRaw:raw,revision:details.revision,blocked:!details.valid,reason:details.valid?null:'invalid-saved-state'};
 }catch{
  return {writerId,expectedRaw:null,revision:0,blocked:true,reason:'storage-error'};
 }
}
export function newProgressWriterId():string{
 const id=globalThis.crypto?.randomUUID?.();
 return id??('tab-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,17));
}
export function observeExternalWrite(session:ProgressSession,currentRaw:string|null):boolean{
 if(session.blocked)return true;
 if(session.expectedRaw===currentRaw)return false;
 session.blocked=true;session.reason='external-change';return true;
}
export function saveProgressIfCurrent<P extends object>(store:ReadWritePort,key:string,progress:P,session:ProgressSession):GuardResult{
 if(session.blocked)return {status:'blocked',reason:session.reason??'external-change'};
 let current:string|null;
 try{current=store.getItem(key)}catch{
  session.blocked=true;session.reason='storage-error';return {status:'blocked',reason:'storage-error'};
 }
 if(observeExternalWrite(session,current))return {status:'blocked',reason:'external-change'};
 const revision=session.revision+1;
 if(!Number.isSafeInteger(revision)){
  session.blocked=true;session.reason='invalid-saved-state';return {status:'blocked',reason:'invalid-saved-state'};
 }
 const savedRaw=JSON.stringify({...progress,progressSync:{version:1,revision,writerId:session.writerId}});
 try{
  store.setItem(key,savedRaw);
  // A subsequent read catches many scheduling overlaps but is not an atomicity guarantee.
  if(store.getItem(key)!==savedRaw){
   session.blocked=true;session.reason='external-change';return {status:'blocked',reason:'external-change'};
  }
 }catch{
  session.blocked=true;session.reason='storage-error';return {status:'blocked',reason:'storage-error'};
 }
 session.expectedRaw=savedRaw;session.revision=revision;
 return {status:'saved',savedRaw,revision};
}
export function snapshotConflictData(
 session:ProgressSession,liveProgress:unknown,storageValues:Record<string,string|null>,timestamp=new Date()
){
 return {format:'CERT-OVERDRIVE-MULTITAB-EMERGENCY',version:1,createdAt:timestamp.toISOString(),
  writerId:session.writerId,expectedRevision:session.revision,reason:session.reason,
  warning:'緊急調査用の退避ファイルです。v1/v2学習バックアップとして直接読み込めません。端末の学習履歴・個人設定を含みます。公開しないでください。',
  inMemoryProgress:liveProgress,storedValues:storageValues,
  caveat:'localStorage is not a transactional database. This snapshot does not merge tabs or certify which copy is newest.'};
}

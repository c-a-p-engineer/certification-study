/** 7.4 — advisory cross-tab localStorage conflict guard.
 * Compare-before-write is not atomic; without server transactions/Web Locks
 * overlapping writes can still race. We never claim a guaranteed lock.
 */
export const STUDY_PROGRESS_KEY='certification-overdrive-progress-v1';
export const STUDY_MISSION_KEY='cert-overdrive-mission-save-v1';
export const STUDY_EXAM_KEY='cert-overdrive-exam-save-v1';
export const STUDY_JOURNAL_KEY='cert-overdrive-restore-journal-v1';
export const TRACKED_SAVE_KEYS=[STUDY_PROGRESS_KEY,STUDY_MISSION_KEY,STUDY_EXAM_KEY] as const;
export type TrackedSaveKey=typeof TRACKED_SAVE_KEYS[number];
export type StorageGuardPort=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export type SaveMarker={version:1;revision:number;writerId:string;updatedAt:number};
export type SaveBlockReason='external-write'|'restore-journal'|'storage-unavailable';
export type SaveWriteResult={status:'saved';raw:string|null;revision:number|null}|{status:'blocked';reason:SaveBlockReason};
export type SaveGuardSession={writerId:string;expected:Record<TrackedSaveKey,string|null>;blocked:SaveBlockReason|null;storageReadable:boolean};
const asObject=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
export function readSaveMarker(raw:string|null):SaveMarker|null{
 if(!raw)return null;
 try{
  const value:unknown=JSON.parse(raw);
  if(!asObject(value)||!asObject(value._localSave))return null;
  const m=value._localSave;
  if(m.version!==1||!Number.isSafeInteger(m.revision)||Number(m.revision)<1||
     Number(m.revision)>Number.MAX_SAFE_INTEGER-2||typeof m.writerId!=='string'||m.writerId.length<4||
     m.writerId.length>150||!Number.isFinite(m.updatedAt)||Number(m.updatedAt)<0)return null;
  return {version:1,revision:m.revision as number,writerId:m.writerId as string,updatedAt:m.updatedAt as number};
 }catch{return null}
}
export function newWriterId():string{
 if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')return crypto.randomUUID();
 return 'local-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
}
export function beginSaveSession(store:StorageGuardPort,writerId:string):SaveGuardSession{
 const expected=Object.fromEntries(TRACKED_SAVE_KEYS.map(k=>[k,null])) as Record<TrackedSaveKey,string|null>;
 if(!writerId||writerId.length<4)return {writerId,expected,blocked:'storage-unavailable',storageReadable:false};
 try{
  for(const key of TRACKED_SAVE_KEYS)expected[key]=store.getItem(key);
  return {writerId,expected,blocked:store.getItem(STUDY_JOURNAL_KEY)!==null?'restore-journal':null,storageReadable:true};
 }catch{return {writerId,expected,blocked:'storage-unavailable',storageReadable:false}}
}
/** Preflight all three keys, not merely the current saving area. Prevent progress
 * clobbering if an earlier mission or exam snapshot was changed elsewhere.
 */
export function checkCurrentStorage(store:StorageGuardPort,session:SaveGuardSession):SaveBlockReason|null{
 if(session.blocked)return session.blocked;
 try{
  if(store.getItem(STUDY_JOURNAL_KEY)!==null){session.blocked='restore-journal';return session.blocked}
  for(const key of TRACKED_SAVE_KEYS)if(store.getItem(key)!==session.expected[key]){
   session.blocked='external-write';return session.blocked;
  }
  return null;
 }catch{session.blocked='storage-unavailable';return session.blocked}
}
export function guardedSave(store:StorageGuardPort,session:SaveGuardSession,key:TrackedSaveKey,raw:string|null,now=Date.now()):SaveWriteResult{
 const blocked=checkCurrentStorage(store,session);
 if(blocked)return {status:'blocked',reason:blocked};
 if(!TRACKED_SAVE_KEYS.includes(key)){session.blocked='storage-unavailable';return {status:'blocked',reason:session.blocked}}
 let revision:number|null=null;
 let output=raw;
 if(key===STUDY_PROGRESS_KEY&&raw!==null){
  let progress:unknown;
  try{progress=JSON.parse(raw)}catch{session.blocked='storage-unavailable';return {status:'blocked',reason:session.blocked}}
  if(!asObject(progress)){session.blocked='storage-unavailable';return {status:'blocked',reason:session.blocked}}
  const previous=readSaveMarker(session.expected[STUDY_PROGRESS_KEY]);
  revision=(previous?.revision??0)+1;
  output=JSON.stringify({...progress,_localSave:{version:1,revision,writerId:session.writerId,updatedAt:now}});
 }
 try{
  if(output===null)store.removeItem(key);else store.setItem(key,output);
  session.expected[key]=output;
  return {status:'saved',raw:output,revision};
 }catch{session.blocked='storage-unavailable';return {status:'blocked',reason:session.blocked}}
}
/** A storage event does not fire within its writer tab. Mark external changes
 * against our known baseline, even if the remote version is malformed.
 */
export function observeForeignStorage(session:SaveGuardSession,key:string|null,newValue:string|null):SaveBlockReason|null{
 if(session.blocked)return session.blocked;
 if(key===STUDY_JOURNAL_KEY&&newValue!==null){session.blocked='restore-journal';return session.blocked}
 if(key===null){session.blocked='external-write';return session.blocked}
 if(TRACKED_SAVE_KEYS.includes(key as TrackedSaveKey)&&session.expected[key as TrackedSaveKey]!==newValue){
  session.blocked='external-write';
  return session.blocked;
 }
 return null;
}
export type UnsafeTabExport={format:'CERT-OVERDRIVE-TAB-CONFLICT';version:1;createdAt:string;writerId:string;reason:SaveBlockReason|null;memoryProgress:unknown;storedProgress:string|null;storedMission:string|null;storedExam:string|null;restoreJournal:string|null;warning:string};
export function snapshotTabConflict(store:Pick<Storage,'getItem'>,session:SaveGuardSession,memoryProgress:unknown,now=new Date()):UnsafeTabExport{
 const get=(key:string)=>{try{return store.getItem(key)}catch{return null}};
 return {
  format:'CERT-OVERDRIVE-TAB-CONFLICT',version:1,createdAt:now.toISOString(),writerId:session.writerId,reason:session.blocked,
  memoryProgress,storedProgress:get(STUDY_PROGRESS_KEY),storedMission:get(STUDY_MISSION_KEY),storedExam:get(STUDY_EXAM_KEY),
  restoreJournal:get(STUDY_JOURNAL_KEY),
  warning:'Local-only emergency diagnostic snapshot. Contains both tab memory and stored values. NOT a normal restore file. Keep private; do not upload or share. LocalStorage read-then-write is not an atomic lock.'
 };
}

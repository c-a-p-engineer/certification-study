/** Portable, schema-checked local backup. Never upload data to a server. */
import {isMissionSave} from './missionSave.ts';
import {normalizeEnemyCampaign} from './enemyCampaign.ts';
export const BACKUP_SCHEMA=1;
export const MAX_BACKUP_BYTES=8*1024*1024;
/** Keep this allowlist explicit: importing a file must not replace unrelated origin data. */
export const BACKUP_KEYS=[
 'certification-overdrive-progress-v1',
 'cert-overdrive-mission-save-v1',
 'cert-overdrive-exam-save-v1',
 'certification-overdrive-equipped-title-v1',
 'certification-overdrive-unlocked-titles-v1',
 'cert-overdrive-recent-questions-v1',
 'cert-overdrive-audio-v1',
 'cert-overdrive-haptics-v1',
 'cert-overdrive-text-scale-v1',
 'cert-overdrive-visual-power-v1',
 'cert-overdrive-quiz-layout-v1'
] as const;
type StoragePort=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export type BackupData={format:'CERT-OVERDRIVE-BACKUP';version:1;createdAt:string;items:Record<string,string>};
const isObj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const isInt=(x:unknown)=>Number.isSafeInteger(x)&&Number(x)>=0;
const integerCount=(record:unknown):boolean=>isObj(record)&&isInt(record.answered)&&isInt(record.correct)&&Number(record.correct)<=Number(record.answered);
export function validProgress(raw:unknown):boolean{
 if(!isObj(raw))return false;
 if(!['xp','answered','correct','best'].every(k=>isInt(raw[k])))return false;
 if(Number(raw.correct)>Number(raw.answered)||!Array.isArray(raw.mistakes)||raw.mistakes.some(x=>typeof x!=='string'))return false;
 if(!isObj(raw.reviews)||!isObj(raw.domains))return false;
 if(Object.values(raw.reviews).some(r=>!isObj(r)||!isInt(r.streak)||!isInt(r.lapses)||typeof r.dueAt!=='number'||!Number.isFinite(r.dueAt)))return false;
 if(Object.values(raw.domains).some(d=>!integerCount(d)))return false;
 if(raw.activity!==undefined&&(!isObj(raw.activity)||Object.values(raw.activity).some(d=>!integerCount(d))))return false;
 if(raw.enemyCampaign!==undefined){
  const normalized=normalizeEnemyCampaign(raw.enemyCampaign);
  if(!isObj(raw.enemyCampaign)||normalized.stageIndex!==raw.enemyCampaign.stageIndex||normalized.hp!==raw.enemyCampaign.hp)return false;
 }
 return true;
}
export function createBackup(store:StoragePort,now=new Date()):BackupData{
 const items:Record<string,string>={};
 for(const key of BACKUP_KEYS){const value=store.getItem(key);if(value!==null)items[key]=value}
 return {format:'CERT-OVERDRIVE-BACKUP',version:BACKUP_SCHEMA,createdAt:now.toISOString(),items};
}
const jsonKeys=new Set([
 'certification-overdrive-progress-v1','cert-overdrive-mission-save-v1','cert-overdrive-exam-save-v1',
 'certification-overdrive-unlocked-titles-v1','cert-overdrive-recent-questions-v1','cert-overdrive-audio-v1'
]);
export function parseBackup(input:string):BackupData{
 if(new TextEncoder().encode(input).length>MAX_BACKUP_BYTES)throw new Error('ファイルが大きすぎます（最大8MB）');
 let x:unknown;try{x=JSON.parse(input)}catch{throw new Error('JSONを読み取れません')}
 if(!isObj(x)||x.format!=='CERT-OVERDRIVE-BACKUP'||x.version!==BACKUP_SCHEMA||typeof x.createdAt!=='string'||!Number.isFinite(Date.parse(x.createdAt))||!isObj(x.items))throw new Error('対応していないバックアップ形式です');
 const names=Object.keys(x.items);
 if(!names.includes(BACKUP_KEYS[0])||names.length>BACKUP_KEYS.length||names.some(k=>!BACKUP_KEYS.includes(k as typeof BACKUP_KEYS[number])))throw new Error('バックアップ項目が不足または不正です');
 for(const [key,value] of Object.entries(x.items)){
  if(typeof value!=='string'||value.length>MAX_BACKUP_BYTES)throw new Error('不正な項目があります');
  if(jsonKeys.has(key)){let parsed:unknown;try{parsed=JSON.parse(value)}catch{throw new Error('保存値がJSONではありません')};
   if(key===BACKUP_KEYS[0]&&!validProgress(parsed))throw new Error('学習記録の形式が正しくありません');
   if(key==='cert-overdrive-mission-save-v1'&&!isMissionSave(parsed))throw new Error('途中のミッションデータが不正です');
   if(key==='cert-overdrive-exam-save-v1'&&(!isObj(parsed)||!Array.isArray(parsed.ids)||!parsed.ids.every(id=>typeof id==='string')||!isInt(parsed.index)||!Number.isFinite(parsed.deadline)||!integerCount(parsed.session)))throw new Error('試験データが不正です');
   if((key==='certification-overdrive-unlocked-titles-v1'||key==='cert-overdrive-recent-questions-v1')&&(!Array.isArray(parsed)||parsed.some(x=>typeof x!=='string')))throw new Error('履歴データが不正です');
   if(key==='cert-overdrive-audio-v1'&&!isObj(parsed))throw new Error('音声設定が不正です');
  }
 }
 return x as BackupData;
}
/** Transaction-like overwrite: restore previous values after any storage write failure. */
export function restoreBackup(value:BackupData,store:StoragePort):void{
 const checked=parseBackup(JSON.stringify(value));
 const previous=new Map<string,string|null>();
 for(const key of BACKUP_KEYS)previous.set(key,store.getItem(key));
 try{
  for(const key of BACKUP_KEYS){if(Object.prototype.hasOwnProperty.call(checked.items,key))store.setItem(key,checked.items[key]);else store.removeItem(key)}
 }catch(err){
  for(const key of BACKUP_KEYS){try{const prev=previous.get(key);if(prev===null||prev===undefined)store.removeItem(key);else store.setItem(key,prev)}catch{/* restricted storage: best effort rollback */}}
  throw err;
 }
}
export function backupPreview(x:BackupData){
 const p=JSON.parse(x.items[BACKUP_KEYS[0]]) as {xp:number;answered:number;correct:number;enemyCampaign?:unknown};
 const monster=normalizeEnemyCampaign(p.enemyCampaign);
 return {date:x.createdAt,xp:p.xp,answered:p.answered,correct:p.correct,stage:monster.stageIndex+1,savedKeys:Object.keys(x.items).length};
}

/** Portable, schema-checked local backup. Never upload data to a server. */
import {isMissionSave} from './missionSave.ts';
import {normalizeEnemyCampaign} from './enemyCampaign.ts';
import {normalizeExpeditions,EXPEDITIONS} from './expeditions.ts';
import {normalizeDesignProgress,DESIGN_CASES} from './designSimulator.ts';
import {normalizeReports} from './questionReports.ts';
import {normalizeAnswerHistory,MAX_EVENTS} from './growthAnalytics.ts';
export const BACKUP_SCHEMA=1;
export const MAX_BACKUP_BYTES=8*1024*1024;
export const RESTORE_JOURNAL_KEY='cert-overdrive-restore-journal-v1';
export const MAX_NESTING_DEPTH=32;
export const MAX_JSON_NODES=65000;
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
 'cert-overdrive-quiz-layout-v1',
 'cert-overdrive-smart-profile-v1',
 'cert-overdrive-question-reports-v1'
] as const;
type StoragePort=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export type BackupData={format:'CERT-OVERDRIVE-BACKUP';version:1;createdAt:string;items:Record<string,string>};
const isObj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const isInt=(x:unknown)=>Number.isSafeInteger(x)&&Number(x)>=0;
const integerCount=(record:unknown):boolean=>isObj(record)&&isInt(record.answered)&&isInt(record.correct)&&Number(record.correct)<=Number(record.answered);
/** Cap depth and total nested nodes before writing any browser storage. Prevent prototype-like fields. */
export function validateJsonShape(value:unknown):boolean{
 const stack:[unknown,number][]=[[value,0]];let nodes=0;
 while(stack.length){
  const [x,depth]=stack.pop()!;
  if(++nodes>MAX_JSON_NODES||depth>MAX_NESTING_DEPTH)return false;
  if(typeof x==='string'&&x.length>150000)return false;
  if(Array.isArray(x)){if(x.length>12000)return false;for(const v of x)stack.push([v,depth+1]);}
  else if(isObj(x)){const pairs=Object.entries(x);if(pairs.length>12000)return false;for(const [key,v] of pairs){
   if(key==='__proto__'||key==='constructor'||key==='prototype'||key.length>200)return false;
   stack.push([v,depth+1]);
  }}
  else if(x!==null&&typeof x!=='string'&&typeof x!=='boolean'&&!(typeof x==='number'&&Number.isFinite(x)))return false;
 }
 return true;
}
export function validProgress(raw:unknown):boolean{
 if(!isObj(raw)||!validateJsonShape(raw))return false;
 if(!['xp','answered','correct','best'].every(k=>isInt(raw[k])))return false;
 if(Number(raw.correct)>Number(raw.answered)||!Array.isArray(raw.mistakes)||raw.mistakes.some(x=>typeof x!=='string'))return false;
 if(!isObj(raw.reviews)||!isObj(raw.domains))return false;
 if(Object.values(raw.reviews).some(r=>!isObj(r)||!isInt(r.streak)||!isInt(r.lapses)||typeof r.dueAt!=='number'||!Number.isFinite(r.dueAt)))return false;
 if(Object.values(raw.domains).some(d=>!integerCount(d)))return false;
 if(raw.activity!==undefined&&(!isObj(raw.activity)||Object.values(raw.activity).some(d=>!integerCount(d))))return false;
 if(raw.answerHistory!==undefined&&(!Array.isArray(raw.answerHistory)||raw.answerHistory.length>MAX_EVENTS||normalizeAnswerHistory(raw.answerHistory).length!==raw.answerHistory.length))return false;
 if(raw.mistakes.length>10000||Object.keys(raw.reviews).length>10000)return false;
 if(raw.retrievalRewards!==undefined){
  const reward=raw.retrievalRewards;
  if(!isObj(reward)||typeof reward.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(reward.day)||
   !Array.isArray(reward.questionIds)||reward.questionIds.length>5||new Set(reward.questionIds).size!==reward.questionIds.length||
   reward.questionIds.some((id:unknown)=>typeof id!=='string'||id.length===0||id.length>=170))return false;
 }
 if(raw.expeditions!==undefined){
  const input=raw.expeditions as Record<string,unknown>;
  if(!isObj(input)||!isObj(input.records)||!Array.isArray(input.rare)||input.rare.length>EXPEDITIONS.length||
     Object.keys(input.records).some(id=>!EXPEDITIONS.some(e=>e.id===id))||
     normalizeExpeditions(input).rare.length!==input.rare.length||
     Object.keys(normalizeExpeditions(input).records).length!==Object.keys(input.records).length)return false;
 }
 if(raw.designLab!==undefined){
  const input=raw.designLab as Record<string,unknown>;
  if(!isObj(input)||!isObj(input.records)||!Array.isArray(input.emblems)||input.emblems.length>DESIGN_CASES.length||
     Object.keys(input.records).some(id=>!DESIGN_CASES.some(e=>e.id===id))||
     normalizeDesignProgress(input).emblems.length!==input.emblems.length||
     Object.keys(normalizeDesignProgress(input).records).length!==Object.keys(input.records).length)return false;
 }
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
 'certification-overdrive-unlocked-titles-v1','cert-overdrive-recent-questions-v1','cert-overdrive-audio-v1',
 'cert-overdrive-question-reports-v1'
]);
export function parseBackup(input:string):BackupData{
 if(new TextEncoder().encode(input).length>MAX_BACKUP_BYTES)throw new Error('ファイルが大きすぎます（最大8MB）');
 let x:unknown;try{x=JSON.parse(input)}catch{throw new Error('JSONを読み取れません')}
 if(!isObj(x)||!validateJsonShape(x)||x.format!=='CERT-OVERDRIVE-BACKUP'||x.version!==BACKUP_SCHEMA||typeof x.createdAt!=='string'||!Number.isFinite(Date.parse(x.createdAt))||!isObj(x.items))throw new Error('対応していないバックアップ形式です');
 const names=Object.keys(x.items);
 if(!names.includes(BACKUP_KEYS[0])||names.length>BACKUP_KEYS.length||names.some(k=>!BACKUP_KEYS.includes(k as typeof BACKUP_KEYS[number])))throw new Error('バックアップ項目が不足または不正です');
 for(const [key,value] of Object.entries(x.items)){
  if(typeof value!=='string'||value.length>MAX_BACKUP_BYTES)throw new Error('不正な項目があります');
  if(key==='cert-overdrive-smart-profile-v1'&&!['balanced','review','explore'].includes(value))throw new Error('SMART QUEST設定が不正です');
  if(jsonKeys.has(key)){let parsed:unknown;try{parsed=JSON.parse(value)}catch{throw new Error('保存値がJSONではありません')};
   if(key===BACKUP_KEYS[0]&&!validProgress(parsed))throw new Error('学習記録の形式が正しくありません');
   if(key==='cert-overdrive-mission-save-v1'&&!isMissionSave(parsed))throw new Error('途中のミッションデータが不正です');
   if(key==='cert-overdrive-exam-save-v1'&&(!isObj(parsed)||!Array.isArray(parsed.ids)||!parsed.ids.every(id=>typeof id==='string')||!isInt(parsed.index)||!Number.isFinite(parsed.deadline)||!integerCount(parsed.session)))throw new Error('試験データが不正です');
   if((key==='certification-overdrive-unlocked-titles-v1'||key==='cert-overdrive-recent-questions-v1')&&(!Array.isArray(parsed)||parsed.some(x=>typeof x!=='string')))throw new Error('履歴データが不正です');
   if(key==='cert-overdrive-question-reports-v1'&&(!Array.isArray(parsed)||normalizeReports(parsed).length!==parsed.length))throw new Error('問題報告が不正です');
   if(key==='cert-overdrive-audio-v1'&&!isObj(parsed))throw new Error('音声設定が不正です');
  }
 }
 return x as BackupData;
}
export type RestoreJournalStatus={state:'none'|'recoverable'|'invalid'|'unavailable';message:string};
export function inspectRestoreJournal(store:StoragePort):RestoreJournalStatus{
 let raw:string|null;
 try{raw=store.getItem(RESTORE_JOURNAL_KEY)}catch{return {state:'unavailable',message:'ローカルストレージへアクセスできません。ブラウザの設定をご確認ください。'}}
 if(raw===null)return {state:'none',message:'未完了の復元は検出されていません。'};
 let data:unknown;try{data=JSON.parse(raw)}catch{return {state:'invalid',message:'復旧ジャーナルが破損しています。学習データの自動削除・上書きを行わないでください。'}}
 if(!isObj(data)||data.version!==1||!isObj(data.previous)||!validateJsonShape(data))return {state:'invalid',message:'復旧ジャーナル形式が不正です。自動上書きは禁止されています。'};
 const previous=data.previous;
 if(Object.keys(previous).length!==BACKUP_KEYS.length||BACKUP_KEYS.some(key=>!Object.prototype.hasOwnProperty.call(previous,key))||
  Object.values(previous).some(v=>v!==null&&typeof v!=='string'))return {state:'invalid',message:'復旧ジャーナルの項目が不正です。自動上書きは禁止されています。'};
 return {state:'recoverable',message:'中断された復元の復旧用記録があります。データを消さずに復旧を試みられます。'};
}
/** Recovery journal survives page reload if a previous import stopped mid-write.
 * It is intentionally not included in exported backups.
 */
export function recoverInterruptedRestore(store:StoragePort):boolean{
 const raw=store.getItem(RESTORE_JOURNAL_KEY);
 if(raw===null)return false;
 let data:unknown;try{data=JSON.parse(raw)}catch{throw new Error('復旧ジャーナルが壊れています。ローカルデータを変更せずに停止しました。')}
 if(!isObj(data)||data.version!==1||!isObj(data.previous)||!validateJsonShape(data))throw new Error('復旧ジャーナルが不正です');
 const previous=data.previous;
 if(Object.keys(previous).length!==BACKUP_KEYS.length||BACKUP_KEYS.some(key=>!(key in previous)))throw new Error('復旧ジャーナルに不足があります');
 if(Object.values(previous).some(v=>v!==null&&typeof v!=='string'))throw new Error('復旧ジャーナルの保存値が不正です');
 for(const key of BACKUP_KEYS){const old=previous[key];if(old===null)store.removeItem(key);else store.setItem(key,old as string)}
 store.removeItem(RESTORE_JOURNAL_KEY);
 return true;
}
/** Two-phase import: require a durable rollback journal before replacing any user progress. */
export function restoreBackup(value:BackupData,store:StoragePort):void{
 const checked=parseBackup(JSON.stringify(value));
 recoverInterruptedRestore(store);
 const previous:Record<string,string|null>=Object.create(null);
 for(const key of BACKUP_KEYS)previous[key]=store.getItem(key);
 // If storage quota cannot hold an undo journal, reject before changing data.
 store.setItem(RESTORE_JOURNAL_KEY,JSON.stringify({version:1,previous}));
 try{
  for(const key of BACKUP_KEYS){
   if(Object.prototype.hasOwnProperty.call(checked.items,key))store.setItem(key,checked.items[key]);
   else store.removeItem(key);
  }
  store.removeItem(RESTORE_JOURNAL_KEY);
 }catch(err){
  try{recoverInterruptedRestore(store)}catch{/* keep journal for next page load */}
  throw err;
 }
}
export function backupPreview(x:BackupData){
 const p=JSON.parse(x.items[BACKUP_KEYS[0]]) as {xp:number;answered:number;correct:number;enemyCampaign?:unknown};
 const monster=normalizeEnemyCampaign(p.enemyCampaign);
 return {date:x.createdAt,xp:p.xp,answered:p.answered,correct:p.correct,stage:monster.stageIndex+1,savedKeys:Object.keys(x.items).length};
}

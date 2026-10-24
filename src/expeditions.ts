/** 6.4 — optional domain adventures that grant cosmetics for demonstrated delayed recall.
 * Ordinary quiz XP belongs to the quiz engine; this module grants NO additional XP.
 */
import type {EnemyId} from './enemyCampaign.ts';
import type {ReviewMap} from './studyScheduler.ts';
import {eligibleForDelayedRecall} from './retentionQuest.ts';
export const EXPEDITIONS=[
 {id:'iam-guardian',title:'IAM GUARDIAN',domain:'セキュリティ',enemy:'cerberus',keyword:/\bIAM\b|Identity Center|SCP|権限|ロール/i,subtitle:'最小権限と信頼境界',tier:'SHIELD'},
 {id:'vpc-watcher',title:'VPC WATCHER',domain:'セキュリティ',enemy:'armor',keyword:/\bVPC\b|NAT|サブネット|エンドポイント|セキュリティグループ/i,subtitle:'プライベート接続と経路制御',tier:'NETWORK'},
 {id:'s3-keeper',title:'S3 KEEPER',domain:'コスト最適化',enemy:'leviathan',keyword:/\bS3\b|Lifecycle|Intelligent-Tiering|Glacier|ストレージクラス/i,subtitle:'保持期間とストレージ費用',tier:'STORAGE'},
 {id:'rds-beast',title:'RDS BEAST',domain:'耐障害性',enemy:'phoenix',keyword:/\bRDS\b|Aurora|Multi-AZ|レプリカ|フェイルオーバー/i,subtitle:'HAと読み取り拡張',tier:'DATABASE'},
 {id:'design-chimera',title:'DESIGN CHIMERA',domain:'パフォーマンス',enemy:'chimera',keyword:/\bDynamoDB\b|CloudFront|ElastiCache|Lambda|パフォーマンス/i,subtitle:'レイテンシーと設計判断',tier:'ARCHITECT'}
] as const;
export type ExpeditionId=typeof EXPEDITIONS[number]['id'];
export type ExpeditionRecord={best:number;attempts:number;lastAt:number;clearedAt?:number};
export type ExpeditionProgress={records:Partial<Record<ExpeditionId,ExpeditionRecord>>;rare:ExpeditionId[]};
export type ExpeditionResult={state:ExpeditionProgress;success:boolean;firstClear:boolean;rareUnlocked:boolean;alreadyRare:boolean;bonusXp:0};
export const initialExpeditions=():ExpeditionProgress=>({records:{},rare:[]});
const validId=(v:unknown):v is ExpeditionId=>EXPEDITIONS.some(x=>x.id===v);
export function normalizeExpeditions(raw:unknown):ExpeditionProgress{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return initialExpeditions();
 const value=raw as Partial<ExpeditionProgress>;
 const records:ExpeditionProgress['records']={};
 if(value.records&&typeof value.records==='object'&&!Array.isArray(value.records)){
  for(const e of EXPEDITIONS){
   const r=value.records[e.id];
   if(r&&Number.isSafeInteger(r.best)&&r.best>=0&&r.best<=5&&Number.isSafeInteger(r.attempts)&&r.attempts>=0&&r.attempts<=100000&&Number.isFinite(r.lastAt)&&r.lastAt>=0&&
   (r.clearedAt===undefined||Number.isFinite(r.clearedAt)&&r.clearedAt>=0)){
    records[e.id]={best:r.best,attempts:r.attempts,lastAt:r.lastAt,...(r.clearedAt!==undefined?{clearedAt:r.clearedAt}:{})};
   }
  }
 }
 const rare=Array.isArray(value.rare)?[...new Set(value.rare.filter(validId))].filter(id=>records[id]?.clearedAt!==undefined):[];
 return {records,rare};
}
export type ExpeditionQuestion={id:string;domain:string;question:string;tags?:string[];reference?:string;difficulty?:number};
export function planExpedition<T extends ExpeditionQuestion>(bank:readonly T[],id:ExpeditionId,reviews:ReviewMap={},now=Date.now()):T[]{
 const expedition=EXPEDITIONS.find(x=>x.id===id);
 if(!expedition)return [];
 const byId=new Map<string,T>();
 for(const q of bank)if(q&&q.domain===expedition.domain&&typeof q.id==='string'&&!byId.has(q.id))byId.set(q.id,q);
 // Never silently fill a themed expedition with unrelated domain questions.
 const candidates=[...byId.values()].filter(q=>expedition.keyword.test(q.question+' '+(q.tags??[]).join(' ')+' '+(q.reference??'')));
 const score=(q:T)=>{
  return (eligibleForDelayedRecall(reviews[q.id],now)?200:0)+(!reviews[q.id]?50:0)+(q.difficulty===3?10:0);
 };
 return candidates.sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id)).slice(0,5);
}
/** Rare reward requires two distinct successfully recalled items whose prior attempt was on an earlier day. */
export function finishExpedition(raw:unknown,id:ExpeditionId,correct:number,total:number,retainedIds:readonly string[],now=Date.now()):ExpeditionResult{
 const state=normalizeExpeditions(raw),entry=EXPEDITIONS.find(x=>x.id===id);
 if(!entry||total!==5||!Number.isInteger(correct)||correct<0||correct>total)return {state,success:false,firstClear:false,rareUnlocked:false,alreadyRare:false,bonusXp:0};
 const old=state.records[id],success=correct>=4;
 const firstClear=success&&!old?.clearedAt;
 const evidence=[...new Set(retainedIds.filter(x=>typeof x==='string'&&x.length>0&&x.length<=160))];
 const rareUnlocked=success&&evidence.length>=2&&!state.rare.includes(id);
 const records={...state.records,[id]:{best:Math.max(correct,old?.best??0),attempts:Math.min(100000,(old?.attempts??0)+1),lastAt:now,...(old?.clearedAt!==undefined?{clearedAt:old.clearedAt}:success?{clearedAt:now}:{})}};
 return {state:{records,rare:rareUnlocked?[...state.rare,id]:[...state.rare]},success,firstClear,rareUnlocked,alreadyRare:state.rare.includes(id),bonusXp:0};
}

/** Derived cosmetics: unlocking depends on distinct cleared themes and prior-day rare proof, never replay count. */
export function expeditionCollectionMilestones(raw:unknown){
 const state=normalizeExpeditions(raw);
 const cleared=EXPEDITIONS.filter(item=>state.records[item.id]?.clearedAt!==undefined).length;
 const rare=state.rare.length;
 return [
  {id:'scout',title:'探索者',requirement:'異なる探索先を1つ討伐',unlocked:cleared>=1,current:Math.min(cleared,1),target:1},
  {id:'pathfinder',title:'踏破者',requirement:'異なる探索先を3つ討伐',unlocked:cleared>=3,current:Math.min(cleared,3),target:3},
  {id:'guardian',title:'知識の守護者',requirement:'全5探索先の討伐＋翌日以降の復習エンブレム2種',unlocked:cleared>=5&&rare>=2,current:Math.min(cleared,5),target:5}
 ] as const;
}

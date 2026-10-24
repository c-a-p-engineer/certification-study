/** 6.2 — bounded, explainable retrieval from *real* overdue items, never from unseen questions. */
import {localDateKey} from './studyHistory.ts';
import type {ReviewMap,ReviewState} from './studyScheduler.ts';

export const RECALL_BONUS_XP=25;
export const RECALL_DAILY_LIMIT=5;
export type RecallRewardState={day:string;questionIds:string[]};
export type RecallCandidate={id:string;domain:string;difficulty?:number;question:string};
export type RetentionPlan<T>={questions:T[];reasons:Record<string,string>;dueTotal:number;oldestDays:number;ignoredSameDay:number;capacity:number};
const validReview=(r:ReviewState|undefined,now:number)=>!!r&&Number.isFinite(r.dueAt)&&r.dueAt<=now
 &&Number.isFinite(r.lastReviewedAt)&&r.lastReviewedAt>0&&r.lastReviewedAt<=now
 &&Number.isFinite(r.streak)&&Number.isFinite(r.lapses);
export function eligibleForDelayedRecall(review:ReviewState|undefined,now=Date.now()):boolean{
 if(!validReview(review,now))return false;
 return localDateKey(new Date(review!.lastReviewedAt))<localDateKey(new Date(now));
}
const validCount=(v:number)=>Number.isFinite(v)?Math.max(0,Math.min(9999,Math.floor(v))):0;
function rank<T extends RecallCandidate>(q:T,review:ReviewState,now:number):number{
 const age=Math.min(30,Math.max(0,Math.floor((now-review.dueAt)/86400000)));
 return age*10+Math.min(12,validCount(review.lapses))*6+(review.streak<=1?12:0)+
  Math.max(0,Math.min(3,validCount(q.difficulty??1)))*2;
}
export function planRetentionQuest<T extends RecallCandidate>(bank:readonly T[],reviews:ReviewMap,count:5|10=5,now=Date.now()):RetentionPlan<T>{
 const unique=new Map<string,T>();
 for(const q of bank){if(q&&typeof q.id==='string'&&q.id&&typeof q.domain==='string'&&q.question&&!unique.has(q.id))unique.set(q.id,q)}
 const candidates=[...unique.values()].filter(q=>eligibleForDelayedRecall(reviews?.[q.id],now));
 candidates.sort((a,b)=>rank(b,reviews[b.id],now)-rank(a,reviews[a.id],now)||a.id.localeCompare(b.id));
 const selected:T[]=[],reasons:Record<string,string>={},domainUse=new Map<string,number>();
 const remaining=[...candidates];
 // Round-robin by domain, preferring overdue and lapsed items within each domain.
 while(remaining.length&&selected.length<count){
  const min=Math.min(...remaining.map(x=>domainUse.get(x.domain)??0));
  const idx=remaining.findIndex(x=>(domainUse.get(x.domain)??0)===min);
  const q=remaining.splice(idx,1)[0],review=reviews[q.id];
  const overdue=Math.max(0,Math.floor((now-review.dueAt)/86400000));
  reasons[q.id]=overdue>0?`期限から${overdue}日超過 · 忘却${validCount(review.lapses)}回`:`復習期限到来 · 忘却${validCount(review.lapses)}回`;
  selected.push(q);domainUse.set(q.domain,(domainUse.get(q.domain)??0)+1);
 }
 const dueAll=[...unique.values()].filter(q=>validReview(reviews?.[q.id],now));
 const oldestDays=candidates.reduce((v,q)=>Math.max(v,Math.max(0,Math.floor((now-reviews[q.id].dueAt)/86400000))),0);
 return {questions:selected,reasons,dueTotal:candidates.length,ignoredSameDay:dueAll.length-candidates.length,oldestDays,capacity:count};
}
export function normalizeRecallRewards(value:unknown,day:string):RecallRewardState{
 if(!value||typeof value!=='object'||Array.isArray(value))return {day,questionIds:[]};
 const raw=value as Partial<RecallRewardState>;
 if(raw.day!==day||!Array.isArray(raw.questionIds))return {day,questionIds:[]};
 return {day,questionIds:[...new Set(raw.questionIds.filter((id):id is string=>typeof id==='string'&&id.length>0&&id.length<170))].slice(0,RECALL_DAILY_LIMIT)};
}
/** Pure and idempotent; invoke inside the same functional progress update as answer XP. */
export function recordDelayedRecallReward(current:unknown,id:string,review:ReviewState|undefined,correct:boolean,
 retentionMode:boolean,now=Date.now()):{state:RecallRewardState;award:number}{
 const day=localDateKey(new Date(now)),state=normalizeRecallRewards(current,day);
 if(!retentionMode||!correct||!eligibleForDelayedRecall(review,now)||state.questionIds.includes(id)||
 state.questionIds.length>=RECALL_DAILY_LIMIT||typeof id!=='string'||id.length===0)return {state,award:0};
 return {state:{day,questionIds:[...state.questionIds,id]},award:RECALL_BONUS_XP};
}

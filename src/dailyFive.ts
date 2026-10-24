/** 7.1 — transparent, finite daily learning block. Scheduling is advice, not a pass prediction.
 * Never fabricate due review: offer fresh items when there is no prior-day eligible review.
 */
import {eligibleForDelayedRecall} from './retentionQuest.ts';
import {localDateKey,parseLocalDate,shiftLocalDate} from './studyHistory.ts';
import {normalizeAnswerHistory} from './growthAnalytics.ts';
import type {ReviewMap} from './studyScheduler.ts';
export const DAILY_FIVE_SIZE=5;
export type DailyFocusType='due'|'weak'|'fresh'|'returning';
export type DailyFocusItem<T>={question:T;type:DailyFocusType;reason:string};
export type DailyFivePlan<T>={questions:T[];items:DailyFocusItem<T>[];reasons:Record<string,string>;counts:Record<DailyFocusType,number>;eligibleDue:number;eligibleWeak:number;unseen:number;available:number;full:boolean;advice:string};
export type DailyQuestion={id:string;domain:string;question:string;difficulty?:number;choices:readonly string[];answer?:number;answers?:readonly number[]};
const categories:DailyFocusType[]=['due','weak','fresh','returning'];
const blankCounts=():Record<DailyFocusType,number>=>({due:0,weak:0,fresh:0,returning:0});
function daysBetween(before:string,after:string):number{
 const a=parseLocalDate(before),b=parseLocalDate(after);
 return a&&b?Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/86400000):0;
}
export function planDailyFive<T extends DailyQuestion>(bank:readonly T[],reviews:ReviewMap={},mistakes:readonly string[]=[],history:unknown=[],now=Date.now()):DailyFivePlan<T>{
 const today=localDateKey(new Date(now)),answeredToday=new Set(normalizeAnswerHistory(history).filter(e=>e.day===today).map(e=>e.id));
 const unique=new Map<string,T>();
 for(const q of bank)if(q&&typeof q.id==='string'&&q.id.length>0&&typeof q.domain==='string'&&q.question&&!unique.has(q.id))unique.set(q.id,q);
 const mistakeSet=new Set(mistakes.filter(x=>typeof x==='string'));
 const pools:Record<DailyFocusType,{question:T;priority:number;reason:string}[]>={due:[],weak:[],fresh:[],returning:[]};
 for(const q of unique.values()){
  if(answeredToday.has(q.id))continue;
  const r=reviews?.[q.id],hasReview=!!r&&Number.isFinite(r.lastReviewedAt)&&r.lastReviewedAt>0&&r.lastReviewedAt<=now;
  const previousDay=hasReview?localDateKey(new Date(r.lastReviewedAt)):null;
  if(previousDay===today)continue;
  if(eligibleForDelayedRecall(r,now)){
   const age=Math.max(0,Math.floor((now-r.dueAt)/86400000));
   pools.due.push({question:q,priority:age*10+Math.min(10,Math.max(0,r.lapses))*4,reason:age>0?'復習期限を'+age+'日超過 · 忘却'+r.lapses+'回':'前回学習から日をまたいだ期限到来復習'});
  }else if(hasReview&&mistakeSet.has(q.id)){
   const gap=daysBetween(previousDay!,today);
   pools.weak.push({question:q,priority:gap*5+Math.min(10,Math.max(0,r.lapses))*3,reason:'以前の誤答を振り返る · 次の正式な復習期限とは別枠'});
  }else if(!hasReview){
   pools.fresh.push({question:q,priority:q.difficulty===3?3:0,reason:'初めて学習するテーマ · 翌日以降に思い出せるか確認'});
  }else if(hasReview){
   const gap=daysBetween(previousDay!,today);
   pools.returning.push({question:q,priority:gap,reason:'前日以前に扱ったテーマの再確認 · 期限前の追加練習'});
  }
 }
 for(const type of categories)pools[type].sort((a,b)=>b.priority-a.priority||a.question.id.localeCompare(b.question.id));
 const items:DailyFocusItem<T>[]=[],used=new Set<string>(),domains=new Map<string,number>();
 const pick=(type:DailyFocusType,limit:number)=>{
  while(items.length<DAILY_FIVE_SIZE&&items.filter(x=>x.type===type).length<limit){
   const choices=pools[type].filter(x=>!used.has(x.question.id));if(!choices.length)break;
   const min=Math.min(...choices.map(x=>domains.get(x.question.domain)??0));
   const chosen=choices.find(x=>(domains.get(x.question.domain)??0)===min)!;
   items.push({question:chosen.question,type,reason:chosen.reason});
   used.add(chosen.question.id);domains.set(chosen.question.domain,(domains.get(chosen.question.domain)??0)+1);
  }
 };
 // Preferred distribution: 2 prior-day reviews, 1 earlier mistake, 2 new concepts.
 pick('due',2);pick('weak',1);pick('fresh',5);pick('due',5);pick('weak',5);pick('returning',5);
 const counts=blankCounts();for(const x of items)counts[x.type]++;
 const eligibleDue=pools.due.length,eligibleWeak=pools.weak.length,unseen=pools.fresh.length;
 return {items,questions:items.map(x=>x.question),reasons:Object.fromEntries(items.map(x=>[x.question.id,x.reason])),
  counts,eligibleDue,eligibleWeak,unseen,available:items.length,full:items.length===DAILY_FIVE_SIZE,
  advice:eligibleDue>0?'期限到来の復習から始め、残りは苦手・新しい問題で補います。':'期限到来の復習はありません。今日は新規学習を優先し、実際の翌日復習は次回に確認します。'};
}
export type DailyFiveSummary={answered:number;correct:number;missed:string[];uniqueDomains:number;observedDue:number;newConcepts:number;suggestedDay:string;canStop:true};
export function summarizeDailyFive<T extends DailyQuestion>(pool:readonly T[],responses:Record<string,readonly number[]>,reviewsAtStart:ReviewMap,now=Date.now()):DailyFiveSummary{
 const seen=new Set<string>(),missed:string[];let answered=0,correct=0,observedDue=0,newConcepts=0;
 const domains=new Set<string>();
 for(const q of pool){
  if(seen.has(q.id))continue;seen.add(q.id);domains.add(q.domain);
  if(!Object.prototype.hasOwnProperty.call(responses,q.id))continue;
  const selected=responses[q.id],expected=q.answers??(Number.isInteger(q.answer)?[q.answer!]:[]);
  if(!Array.isArray(selected)||!expected.length)continue;
  answered++;
  if(selected.length===expected.length&&new Set(selected).size===selected.length&&selected.every(x=>expected.includes(x)))correct++;
  else missed.push(q.id);
  if(eligibleForDelayedRecall(reviewsAtStart?.[q.id],now))observedDue++;
  if(!reviewsAtStart?.[q.id])newConcepts++;
 }
 return {answered,correct,missed,uniqueDomains:domains.size,observedDue,newConcepts,suggestedDay:shiftLocalDate(localDateKey(new Date(now)),1),canStop:true};
}

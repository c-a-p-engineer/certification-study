/** Descriptive 1/3/7/14-day observed delayed recall. Not a causal learning effect or retention forecast. */
import {normalizeAnswerHistory,type AnswerEvent} from './growthAnalytics.ts';
import {localDateKey,parseLocalDate,shiftLocalDate} from './studyHistory.ts';
export type DelayBucket=1|3|7|14;
export const DELAY_BUCKETS=[1,3,7,14] as const;
export type DelayedMetric={days:DelayBucket;uniqueQuestions:number;correct:number;rate:number|null};
function dayGap(a:string,b:string):number{
 const x=parseLocalDate(a),y=parseLocalDate(b);if(!x||!y)return 0;
 return Math.round((Date.UTC(y.getFullYear(),y.getMonth(),y.getDate())-Date.UTC(x.getFullYear(),x.getMonth(),x.getDate()))/86400000);
}
export function measuredDelayedRecall(raw:unknown,today=localDateKey(new Date())):DelayedMetric[]{
 const events=normalizeAnswerHistory(raw).filter(x=>!x.exam&&x.day<=today)
  .sort((a,b)=>a.day.localeCompare(b.day)||(a.at??0)-(b.at??0));
 const prior=new Map<string,AnswerEvent>(),qualifying=new Map<DelayBucket,Map<string,boolean>>();
 for(const days of DELAY_BUCKETS)qualifying.set(days,new Map());
 const start=shiftLocalDate(today,-89);
 for(const e of events){
  const earlier=prior.get(e.id);
  if(earlier&&e.day>earlier.day&&e.day>=start){
   const gap=dayGap(earlier.day,e.day);
   for(const days of DELAY_BUCKETS)if(gap>=days)qualifying.get(days)!.set(e.id,e.correct);
  }
  prior.set(e.id,e);
 }
 return DELAY_BUCKETS.map(days=>{
  const sample=qualifying.get(days)!,correct=[...sample.values()].filter(Boolean).length;
  return {days,uniqueQuestions:sample.size,correct,rate:sample.size?Math.round(correct/sample.size*100):null};
 });
}

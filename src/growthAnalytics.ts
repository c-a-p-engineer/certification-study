/** Analytics from explicit events only: never invent per-question history from aggregate XP. */
import {localDateKey,parseLocalDate,shiftLocalDate,type ActivityHistory} from './studyHistory.ts';
export type AnswerEvent={id:string;domain:string;day:string;correct:boolean;firstAttempt:boolean;due:boolean;recovery:boolean;exam:boolean;mode?:'smart'|'normal'|'retention'|'daily'|'exam';at?:number};
export type AnswerHistory=AnswerEvent[];
export type AnalyticsWindow=7|30|90;
export const MAX_EVENTS=3000;
export function normalizeAnswerHistory(value:unknown):AnswerHistory{
 if(!Array.isArray(value))return [];
 return value.filter((x):x is AnswerEvent=>!!x&&typeof x==='object'&&typeof x.id==='string'&&x.id.length<=160
  &&typeof x.domain==='string'&&x.domain.length<60&&typeof x.day==='string'&&!!parseLocalDate(x.day)
  &&typeof x.correct==='boolean'&&typeof x.firstAttempt==='boolean'&&typeof x.due==='boolean'
  &&typeof x.recovery==='boolean'&&typeof x.exam==='boolean'
  &&(x.mode===undefined||x.mode==='smart'||x.mode==='normal'||x.mode==='retention'||x.mode==='daily'||x.mode==='exam')
  &&(x.at===undefined||(typeof x.at==='number'&&Number.isFinite(x.at)&&x.at>=0))).slice(-MAX_EVENTS);
}
export function appendAnswerEvent(value:unknown,event:AnswerEvent):AnswerHistory{
 return [...normalizeAnswerHistory(value),event].slice(-MAX_EVENTS);
}
const rate=(items:readonly AnswerEvent[])=>items.length?Math.round(items.filter(x=>x.correct).length/items.length*100):null;
export function growthSummary(history:unknown,activity:ActivityHistory,domains:Record<string,{answered:number;correct:number}>,window:AnalyticsWindow=30,today=localDateKey(new Date())){
 const start=shiftLocalDate(today,1-window);
 const events=normalizeAnswerHistory(history).filter(x=>x.day>=start&&x.day<=today);
 const first=events.filter(e=>e.firstAttempt),repeat=events.filter(e=>!e.firstAttempt),due=events.filter(e=>e.due),recovery=events.filter(e=>e.recovery);
 const days=Object.entries(activity||{}).filter(([day])=>day>=start&&day<=today&&!!parseLocalDate(day))
  .sort(([a],[b])=>a.localeCompare(b))
  .map(([day,v])=>({day,answered:v.answered,correct:v.correct,rate:v.answered?Math.round(v.correct/v.answered*100):0}));
 const perDomain=Object.entries(domains||{}).map(([domain,d])=>({domain,answered:d.answered,correct:d.correct,rate:d.answered?Math.round(d.correct/d.answered*100):null}))
  .sort((a,b)=>(a.rate??101)-(b.rate??101));
 return {days,events:events.length,first:{count:first.length,rate:rate(first)},repeat:{count:repeat.length,rate:rate(repeat)},
  due:{count:due.length,rate:rate(due)},recovery:{count:recovery.length,rate:rate(recovery)},
  perDomain,missingOldHistory:events.length===0,window};
}

/** Learning signals computed only from observed local answer events, not from inferred historical XP.
 * SMART versus other practice is observational; it must never be described as a causal effect.
 */
import {normalizeAnswerHistory,type AnswerEvent} from './growthAnalytics.ts';
import {shiftLocalDate,localDateKey,parseLocalDate} from './studyHistory.ts';
export type LearningSnapshot={windowDays:number;attempts:number;correct:number;smartDue:{n:number;correct:number;rate:number|null};otherDue:{n:number;correct:number;rate:number|null};delayedReturn:{n:number;successful:number;rate:number|null};repeatWithinDay:number;weakDomains:{domain:string;attempts:number;rate:number}[];nextTopic:string|null;changeClaimAllowed:false;hasEnoughDueData:boolean};
const rate=(n:number,c:number)=>n?Math.round(100*c/n):null;
export function learningSnapshot(raw:unknown,windowDays=7,today=localDateKey(new Date())):LearningSnapshot{
 const safe=Number.isInteger(windowDays)&&windowDays>0&&windowDays<=90?windowDays:7;
 const from=shiftLocalDate(today,1-safe),history=normalizeAnswerHistory(raw).filter(x=>x.day>=from&&x.day<=today);
 const now=history.length,correct=history.filter(x=>x.correct).length;
 const smart=history.filter(x=>x.mode==='smart'&&x.due);
 const other=history.filter(x=>x.mode==='normal'&&x.due);
 const sorted=[...history].sort((a,b)=>a.day.localeCompare(b.day)||(a.at??0)-(b.at??0));
 const lastSeen=new Map<string,AnswerEvent>(),returning:AnswerEvent[]=[];
 let sameDay=0;
 for(const e of sorted){
  const prior=lastSeen.get(e.id);
  if(prior){
   if(e.day>prior.day)returning.push(e);else sameDay++;
  }
  lastSeen.set(e.id,e);
 }
 const domains=new Map<string,{correct:number;total:number}>();
 for(const e of history){const d=domains.get(e.domain)||{correct:0,total:0};d.total++;if(e.correct)d.correct++;domains.set(e.domain,d)}
 const weakDomains=[...domains].filter(([,v])=>v.total>=3).map(([domain,v])=>({domain,attempts:v.total,rate:Math.round(v.correct/v.total*100)})).sort((a,b)=>a.rate-b.rate||b.attempts-a.attempts);
 return {windowDays:safe,attempts:now,correct,
  smartDue:{n:smart.length,correct:smart.filter(e=>e.correct).length,rate:rate(smart.length,smart.filter(e=>e.correct).length)},
  otherDue:{n:other.length,correct:other.filter(e=>e.correct).length,rate:rate(other.length,other.filter(e=>e.correct).length)},
  delayedReturn:{n:returning.length,successful:returning.filter(e=>e.correct).length,rate:rate(returning.length,returning.filter(e=>e.correct).length)},
  repeatWithinDay:sameDay,weakDomains,nextTopic:weakDomains[0]?.domain??null,changeClaimAllowed:false,
  hasEnoughDueData:smart.length>=5&&other.length>=5};
}
export function learningRetrospective(stats:LearningSnapshot):string{
 const accuracy=rate(stats.attempts,stats.correct);
 if(!stats.attempts)return '直近'+stats.windowDays+'日間の回答イベントはまだありません。まずSMART QUESTで問題を解いてみましょう。';
 const due=stats.smartDue.n?('SMARTの期限到来復習 '+stats.smartDue.n+'回・正答率 '+stats.smartDue.rate+'%。'):'期限到来のSMART復習データはまだありません。';
 const returnRate=stats.delayedReturn.n?('日をまたいだ再挑戦 '+stats.delayedReturn.n+'回・正答率 '+stats.delayedReturn.rate+'%。'):'日をまたいだ再挑戦の観測はまだありません。';
 const focus=stats.nextTopic?'次は「'+stats.nextTopic+'」を重点的に復習しましょう。':'引き続き複数分野の新規問題と復習を組み合わせましょう。';
 return '直近'+stats.windowDays+'日で'+stats.attempts+'回答・正答率'+accuracy+'%。'+due+returnRate+focus;
}

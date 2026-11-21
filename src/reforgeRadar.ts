/** Domain intel derived only from persisted, explicit local study evidence. */
import {normalizeAnswerHistory} from './growthAnalytics.ts';
import {dueQuestionIds,type ReviewMap} from './studyScheduler.ts';
import {localDateKey} from './studyHistory.ts';
export type RadarQuestion={id:string;domain:string};
export type DomainIntel={
 domain:string;available:number;observed:number;weak:number;due:number;delayedRecall:number;hasHistory:boolean;
};
const domainOrder=['セキュリティ','耐障害性','パフォーマンス','コスト最適化'];
/** No XP, prediction or inferred mastery; incomplete historical logs remain incomplete. */
export function buildDomainIntel(
 questions:readonly RadarQuestion[],history:unknown,reviews:ReviewMap,
 mistakes:readonly string[],now=Date.now()
):DomainIntel[]{
 const byId=new Map<string,RadarQuestion>();
 for(const q of questions)if(q&&q.id&&q.domain&&!byId.has(q.id))byId.set(q.id,q);
 const today=localDateKey(new Date(now));
 const events=normalizeAnswerHistory(history).filter(event=>!event.exam&&event.day<=today&&byId.has(event.id)
  &&(event.at===undefined||event.at<=now&&localDateKey(new Date(event.at))===event.day));
 const grouped=new Map<string,{ids:Set<string>;observed:Set<string>;recalled:Set<string>}>();
 for(const q of byId.values()){
  const group=grouped.get(q.domain)??{ids:new Set(),observed:new Set(),recalled:new Set()};
  group.ids.add(q.id);grouped.set(q.domain,group);
 }
 const byQuestion=new Map<string,typeof events>();
 for(const event of events){
  const list=byQuestion.get(event.id)??[];list.push(event);byQuestion.set(event.id,list);
  grouped.get(byId.get(event.id)!.domain)!.observed.add(event.id);
 }
 for(const [id,items] of byQuestion){
  if(items.some(event=>event.due&&event.correct&&items.some(prior=>prior.day<event.day)))
   grouped.get(byId.get(id)!.domain)!.recalled.add(id);
 }
 const missed=new Set(mistakes);
 return [...grouped.entries()].sort(([a],[b])=>{
  const ai=domainOrder.indexOf(a),bi=domainOrder.indexOf(b);
  return (ai<0?99:ai)-(bi<0?99:bi)||a.localeCompare(b);
 }).map(([domain,g])=>({
  domain,available:g.ids.size,observed:g.observed.size,
  weak:[...g.ids].filter(id=>missed.has(id)).length,
  due:dueQuestionIds(reviews??{},[...g.ids],now).length,
  delayedRecall:g.recalled.size,hasHistory:g.observed.size>0
 }));
}

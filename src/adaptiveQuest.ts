/** Transparent personalized practice selection. Exam and boss pools never use this selector. */
import {serviceTopics,isScenarioQuestion,type SelectableQuestion} from './questionSelection.ts';
import type {ReviewMap} from './studyScheduler.ts';
export type AdaptiveContext={
 reviews:ReviewMap;mistakes:readonly string[];recent:ReadonlySet<string>;
 domains:Record<string,{answered:number;correct:number}>;now?:number
};
export type AdaptiveReasons={unseen:number;due:number;mistakes:number;weakDomain:number};
export function adaptiveReasons<T extends SelectableQuestion>(items:readonly T[],context:AdaptiveContext):AdaptiveReasons{
 const seen=context.reviews||{},bad=new Set(context.mistakes),now=context.now??Date.now();
 return {unseen:items.filter(q=>!seen[q.id]).length,due:items.filter(q=>(seen[q.id]?.dueAt??Infinity)<=now).length,
 mistakes:items.filter(q=>bad.has(q.id)).length,
 weakDomain:items.filter(q=>{const d=context.domains[q.domain];return !!d&&d.answered>=4&&d.correct/d.answered<.7}).length};
}
export function selectAdaptive<T extends SelectableQuestion>(items:readonly T[],count:number,context:AdaptiveContext,random:()=>number=Math.random):T[]{
 if(count<=0)return [];
 const seen=context.reviews||{},bad=new Set(context.mistakes||[]),now=context.now??Date.now();
 const pool=items.map(q=>({q,rand:random(),topics:serviceTopics(q)}));
 const chosen:T[]=[],themes=new Map<string,number>(),domains=new Map<string,number>();
 while(pool.length&&chosen.length<count){
  let best=-Infinity,bestIndex=0;
  for(let i=0;i<pool.length;i++){
   const {q,rand,topics}=pool[i],review=seen[q.id],domain=context.domains?.[q.domain];
   const due=review&&review.dueAt<=now;
   const weakDomain=domain&&domain.answered>=4?Math.max(0,.8-domain.correct/domain.answered)*360:0;
   const score=(due?560:0)+(bad.has(q.id)?360:0)+(!review?330:0)
     +(review&&review.streak<2?85:0)+(isScenarioQuestion(q)?130:0)
     +(q.distractorReasons?50:0)+(q.question.length>=85?25:0)+weakDomain
     -(context.recent.has(q.id)?720:0)-(domains.get(q.domain)??0)*32
     -topics.reduce((sum,t)=>sum+(themes.get(t)??0)*115,0)+rand*34;
   if(score>best){best=score;bestIndex=i}
  }
  const [{q,topics}]=pool.splice(bestIndex,1);
  chosen.push(q);domains.set(q.domain,(domains.get(q.domain)??0)+1);
  for(const topic of topics)themes.set(topic,(themes.get(topic)??0)+1);
 }
 return chosen;
}

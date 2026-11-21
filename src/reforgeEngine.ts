/** Deterministic, limited five-question stage. Learning rewards remain in applyStudyAttempt. */
import {gradeAnswer} from './studyAttempt.ts';
export type ArenaQuestion={id:string;domain:string;choices:readonly string[];answer?:number;answers?:readonly number[]};
export type Confidence='sure'|'maybe'|'guess';
export type ArenaOutcome={questionId:string;domain:string;correct:boolean;confidence:Confidence;reconstructed?:boolean};
export const ARENA_LENGTH=5;
export function answerKeys(question:ArenaQuestion):number[]{
 return question.answers?[...question.answers]:(Number.isSafeInteger(question.answer)?[question.answer!]:[]);
}
export function isExactAnswer(question:ArenaQuestion,selected:readonly number[]):boolean{
 return gradeAnswer(selected,answerKeys(question));
}
const random=(seed:number)=>{
 let state=(seed>>>0)||1;
 return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296};
};
/** The same seed and question produce the same order; actual answer indices are never rewritten. */
export function arenaChoiceOrder(question:ArenaQuestion,seed:number):number[]{
 const salt=[...question.id].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261);
 const next=random(seed^salt);
 const result=question.choices.map((_,i)=>i);
 for(let i=result.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[result[i],result[j]]=[result[j],result[i]]}
 return result;
}
export function arenaDeck<T extends ArenaQuestion>(bank:readonly T[],seed:number):T[]{
 const next=random(seed);
 const known=new Set<string>();
 const eligible=bank.filter(q=>{
  if(!q||!q.id||!q.domain||!Array.isArray(q.choices)||q.choices.length<2||known.has(q.id))return false;
  const answers=answerKeys(q);
  if(!answers.length||new Set(answers).size!==answers.length||answers.some(i=>!Number.isSafeInteger(i)||i<0||i>=q.choices.length))return false;
  known.add(q.id);return true;
 });
 const byDomain=new Map<string,T[]>();
 for(const item of eligible){const items=byDomain.get(item.domain)||[];items.push(item);byDomain.set(item.domain,items)}
 for(const items of byDomain.values())for(let i=items.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[items[i],items[j]]=[items[j],items[i]]}
 const domains=[...byDomain.keys()];
 for(let i=domains.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[domains[i],domains[j]]=[domains[j],domains[i]]}
 const deck:T[]=[];let cursor=0;
 while(deck.length<ARENA_LENGTH&&domains.some(domain=>(byDomain.get(domain)?.length||0)>0)){
  const domain=domains[cursor%domains.length],item=byDomain.get(domain)?.shift();
  if(item)deck.push(item);cursor++;
 }
 return deck;
}
export function arenaReport(outcomes:readonly ArenaOutcome[]){
 const correct=outcomes.filter(x=>x.correct).length;
 const sureWrong=outcomes.filter(x=>x.confidence==='sure'&&!x.correct);
 const unexpected=outcomes.filter(x=>x.correct&&x.confidence==='guess');
 const reconstructed=outcomes.filter(x=>x.reconstructed===true).length;
 return {correct,total:outcomes.length,sureWrong,unexpected,reconstructed,review:outcomes.filter(x=>!x.correct).map(x=>x.questionId)};
}

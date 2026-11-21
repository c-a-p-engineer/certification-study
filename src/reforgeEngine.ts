/** Independent five-question learning round. No writes to XP or the legacy progress schema. */
export type ArenaQuestion={id:string;domain:string;choices:string[];answer?:number;answers?:number[]};
export type Confidence='sure'|'maybe'|'guess';
export type ArenaOutcome={questionId:string;domain:string;correct:boolean;confidence:Confidence};
export const ARENA_LENGTH=5;
export function answerKeys(question:ArenaQuestion):number[]{
 return question.answers??(question.answer===undefined?[]:[question.answer]);
}
export function isExactAnswer(question:ArenaQuestion,selected:readonly number[]):boolean{
 const keys=answerKeys(question);
 return keys.length>0&&keys.length===selected.length&&keys.every(i=>selected.includes(i));
}
export function arenaDeck<T extends ArenaQuestion>(bank:readonly T[],seed:number):T[]{
 const state={value:(seed>>>0)||1};
 const next=()=>{state.value^=state.value<<13;state.value^=state.value>>>17;state.value^=state.value<<5;return(state.value>>>0)/4294967296};
 const eligible=bank.filter(q=>q.choices.length>=2&&answerKeys(q).length>0&&answerKeys(q).every(i=>i>=0&&i<q.choices.length));
 const byDomain=new Map<string,T[]>();for(const item of eligible){const items=byDomain.get(item.domain)||[];items.push(item);byDomain.set(item.domain,items)}
 for(const items of byDomain.values())for(let i=items.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[items[i],items[j]]=[items[j],items[i]]}
 const domains=[...byDomain.keys()];
 for(let i=domains.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[domains[i],domains[j]]=[domains[j],domains[i]]}
 const deck:T[]=[];let cursor=0;while(deck.length<ARENA_LENGTH&&domains.some(domain=>(byDomain.get(domain)?.length||0)>0)){
  const domain=domains[cursor%domains.length];const item=byDomain.get(domain)?.shift();if(item)deck.push(item);cursor++;
 }
 return deck;
}
export function arenaReport(outcomes:readonly ArenaOutcome[]){
 const correct=outcomes.filter(x=>x.correct).length;
 const sure=outcomes.filter(x=>x.confidence==='sure');
 const sureWrong=sure.filter(x=>!x.correct);
 const unexpected=outcomes.filter(x=>x.correct&&x.confidence==='guess');
 return {correct,total:outcomes.length,sureWrong,unexpected,review:outcomes.filter(x=>!x.correct).map(x=>x.questionId)};
}

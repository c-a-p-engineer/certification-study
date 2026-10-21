// Local-first review scheduler; intervals are configurable heuristics, not clinical or exam-success predictions.
export type ReviewState={dueAt:number;intervalDays:number;streak:number;lapses:number;lastReviewedAt:number};
export type ReviewMap=Record<string,ReviewState>;
export const DAY_MS=86400000;
export function reviewDue(item:ReviewState|undefined,now=Date.now()):boolean{return !!item&&item.dueAt<=now}
export function reviewCounts(items:ReviewMap,now=Date.now()){return Object.values(items).filter(item=>reviewDue(item,now)).length}
export function scheduleReview(previous:ReviewState|undefined,correct:boolean,now=Date.now()):ReviewState{
 const streak=correct?(previous?.streak??0)+1:0;
 const intervalDays=correct?[1,3,7,14,30,60][Math.min(streak-1,5)]:1;
 return {dueAt:now+intervalDays*DAY_MS,intervalDays,streak,lapses:(previous?.lapses??0)+(correct?0:1),lastReviewedAt:now};
}
export function dueQuestionIds(items:ReviewMap,availableIds:string[],now=Date.now()):string[]{
 return availableIds.filter(id=>reviewDue(items[id],now)).sort((a,b)=>items[a].dueAt-items[b].dueAt);
}

import type {StudyQuestion} from '../StudyQuestionIntro.tsx';
import {gradeAnswer} from '../studyAttempt.ts';
import {planDailyFive} from '../dailyFive.ts';
import type {ReviewMap} from '../studyScheduler.ts';
import type {AnswerHistory} from '../growthAnalytics.ts';

export type LearningMode='daily'|'weak'|'domain'|'mix';
export type ExamMode='exam';
export type SessionMode=LearningMode|ExamMode;
export const DOMAINS=['セキュリティ','耐障害性','パフォーマンス','コスト最適化'] as const;
export type LearnerSnapshot={reviews:ReviewMap;mistakes:readonly string[];answerHistory?:AnswerHistory};
export type LearningRound={questions:StudyQuestion[];reasons:Record<string,string>;mode:SessionMode};
export const correctIndices=(q:StudyQuestion):number[]=>q.answers??(q.answer===undefined?[]:[q.answer]);
export const isCorrect=(q:StudyQuestion,answers:readonly number[])=>gradeAnswer(answers,correctIndices(q));
export const validQuestion=(q:StudyQuestion)=>{const right=correctIndices(q);return q.choices.length>=2&&right.length>0&&right.every(i=>Number.isInteger(i)&&i>=0&&i<q.choices.length)&&new Set(right).size===right.length};
export function shuffled<T>(items:readonly T[],seed:number):T[]{
 const result=[...items];let state=seed>>>0||1;
 const next=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296};
 for(let i=result.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[result[i],result[j]]=[result[j],result[i]]}
 return result;
}
export function planRound(bank:readonly StudyQuestion[],snapshot:LearnerSnapshot,mode:SessionMode,seed:number,domain?:string):LearningRound{
 const seen=new Set<string>();
 const valid=bank.filter(q=>{if(!q||!validQuestion(q)||seen.has(q.id))return false;seen.add(q.id);return true});
 if(mode==='daily'){
  const plan=planDailyFive(valid,snapshot.reviews,snapshot.mistakes,snapshot.answerHistory);
  return {questions:plan.questions,reasons:plan.reasons,mode};
 }
 const source=domain&&DOMAINS.some(d=>d===domain)?valid.filter(q=>q.domain===domain):valid;
 if(mode==='weak'){
  return {questions:shuffled(source.filter(q=>snapshot.mistakes.includes(q.id)),seed).slice(0,5),reasons:{},mode};
 }
 if(mode==='exam'){
  const quota:Record<string,number>={'セキュリティ':20,'耐障害性':17,'パフォーマンス':15,'コスト最適化':13};
  const result=DOMAINS.flatMap((d,i)=>{
   const group=shuffled(valid.filter(q=>q.domain===d),seed+i+1);
   const multi=group.filter(q=>q.answers&&q.choices.length>=5).slice(0,2);
   const singles=group.filter(q=>!multi.includes(q)).slice(0,quota[d]-multi.length);
   return [...multi,...singles];
  });
  return {questions:shuffled(result,seed+99),reasons:{},mode};
 }
 const chosen=shuffled(source,seed).slice(0,mode==='domain'?10:5);
 return {questions:chosen,reasons:{},mode};
}
export function sessionPercent(correct:number,total:number):number{return total?Math.round(correct/total*100):0}

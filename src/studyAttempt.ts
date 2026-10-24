/** OVERDRIVE 7.0 — deterministic, side-effect-free answer transaction.
 * Legacy XP is never rewritten. Only future practice answers use the published policy.
 */
import {applyCampaignAnswer,type CampaignAnswer,type CampaignHit,type EnemyCampaign} from './enemyCampaign.ts';
import {recordDelayedRecallReward,type RecallRewardState} from './retentionQuest.ts';
import {scheduleReview,type ReviewMap} from './studyScheduler.ts';
import {recordContractAnswer,type DailyContracts} from './dailyContracts.ts';
import {recordDailyAnswer,migrateActivity,localDateKey,type ActivityHistory} from './studyHistory.ts';
import {appendAnswerEvent,type AnswerHistory} from './growthAnalytics.ts';

export const MAX_ATTEMPT_RECEIPTS=1024;
export const MAX_ATTEMPT_ID_LENGTH=170;
export type AttemptMode='normal'|'smart'|'retention'|'exam';
export type AttemptReceiptState=string[];
export type AttemptProgress={
 xp:number;best:number;answered:number;correct:number;mistakes:string[];
 domains:Record<string,{answered:number;correct:number}>;reviews:ReviewMap;
 daily?:{date:string;answered:number;correct:number;claimed?:boolean};
 activity?:ActivityHistory;dailyContracts?:DailyContracts;enemyCampaign?:EnemyCampaign;
 answerHistory?:AnswerHistory;retrievalRewards?:RecallRewardState;
 attemptReceipts?:AttemptReceiptState;
};
export type StudyAttempt={
 attemptId:string;questionId:string;domain:string;correct:boolean;combo:number;
 difficulty?:number;mode:AttemptMode;boss:boolean;at:number;
};
export type AttemptReward={baseXp:number;campaignXp:number;retentionXp:number;totalXp:number;credited:boolean;
 exam:boolean;sameDayRepeat:boolean;campaign:CampaignHit|null;};
export type AttemptTransition<P>={progress:P;reward:AttemptReward};

export function normalizeAttemptReceipts(value:unknown):AttemptReceiptState{
 if(!Array.isArray(value))return [];
 return [...new Set(value.filter((id):id is string=>typeof id==='string'&&id.length>=6&&id.length<=MAX_ATTEMPT_ID_LENGTH))]
  .slice(-MAX_ATTEMPT_RECEIPTS);
}
export function makeAttemptRunId():string{
 const secure=globalThis.crypto?.randomUUID?.();
 return secure??(Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,14));
}
export function gradeAnswer(selected:readonly number[],answers:readonly number[]):boolean{
 if(!Array.isArray(selected)||!Array.isArray(answers)||answers.length===0)return false;
 if(new Set(selected).size!==selected.length||new Set(answers).size!==answers.length)return false;
 return selected.length===answers.length&&selected.every(x=>Number.isSafeInteger(x)&&x>=0&&answers.includes(x));
}
export function isSameLocalDayReview(lastReviewedAt:number|undefined,at:number):boolean{
 return typeof lastReviewedAt==='number'&&Number.isFinite(lastReviewedAt)&&lastReviewedAt>0&&lastReviewedAt<=at&&
  localDateKey(new Date(lastReviewedAt))===localDateKey(new Date(at));
}
const emptyReward=(event:StudyAttempt,credited=false):AttemptReward=>({
 baseXp:0,campaignXp:0,retentionXp:0,totalXp:0,credited,exam:event.mode==='exam',sameDayRepeat:false,campaign:null
});
/** An attempt is identified by runId + question index + original question ID.
 * Receipts guard against duplicate state application, even during save/resume/reload.
 * Never issue side effects or call the clock inside this function.
 */
export function applyStudyAttempt<P extends AttemptProgress>(source:P,event:StudyAttempt):AttemptTransition<P>{
 if(!event.attemptId||event.attemptId.length>MAX_ATTEMPT_ID_LENGTH||!Number.isFinite(event.at)||event.at<0||
  !event.questionId||event.questionId.length>160||!event.domain)return {progress:source,reward:emptyReward(event)};
 const receipts=normalizeAttemptReceipts(source.attemptReceipts);
 if(receipts.includes(event.attemptId))return {progress:source,reward:emptyReward(event)};
 const date=localDateKey(new Date(event.at));
 const prior=source.reviews?.[event.questionId];
 const sameDayRepeat=isSameLocalDayReview(prior?.lastReviewedAt,event.at);
 const isExam=event.mode==='exam';
 const eligibleForXp=!isExam&&!sameDayRepeat;
 const nextCombo=event.correct?Math.max(0,Math.floor(event.combo)):0;
 const baseXp=eligibleForXp?(event.correct?100+Math.min(nextCombo,10)*20:15):0;
 const due=!!prior&&Number.isFinite(prior.dueAt)&&prior.dueAt<=event.at;
 const previouslyIncorrect=source.mistakes.includes(event.questionId);
 const campaignEvent:CampaignAnswer={
  questionId:event.questionId,domain:event.domain,correct:event.correct&&eligibleForXp,
  exam:isExam,boss:event.boss,combo:nextCombo,difficulty:event.difficulty,
  reviewDue:due,previouslyIncorrect,at:event.at
 };
 const campaign=eligibleForXp?applyCampaignAnswer(source.enemyCampaign,campaignEvent):null;
 const recall=isExam?{state:source.retrievalRewards,award:0}:recordDelayedRecallReward(
  source.retrievalRewards,event.questionId,prior,event.correct,event.mode==='retention'&&!event.boss,event.at);
 const campaignXp=campaign?.bonusXp??0;
 const totalXp=baseXp+recall.award+campaignXp;
 const reward:AttemptReward={baseXp,campaignXp,retentionXp:recall.award,totalXp,credited:true,exam:isExam,sameDayRepeat,campaign};
 const accepted=[...receipts,event.attemptId].slice(-MAX_ATTEMPT_RECEIPTS);
 const answerHistory=appendAnswerEvent(source.answerHistory,{
  id:event.questionId,domain:event.domain,day:date,correct:event.correct,firstAttempt:!prior,
  due,recovery:previouslyIncorrect,exam:isExam,mode:event.mode,at:event.at
 });
 // Mock exams measure performance but never modify training mastery, XP, campaign, or daily contracts.
 if(isExam)return {progress:{...source,attemptReceipts:accepted,answerHistory},reward};
 const domain=source.domains?.[event.domain]??{answered:0,correct:0};
 const nextReview=!sameDayRepeat||!event.correct?scheduleReview(prior,event.correct,event.at):prior;
 const daily=source.daily?.date===date?source.daily:{date,answered:0,correct:0,claimed:false};
 const next:P={...source,attemptReceipts:accepted,answerHistory,
  enemyCampaign:campaign?.state??source.enemyCampaign,
  retrievalRewards:recall.state,
  dailyContracts:recordContractAnswer(source.dailyContracts,{
   date,questionId:event.questionId,correct:event.correct,exam:false,firstAttempt:!prior,
   previouslyIncorrect:previouslyIncorrect&&!sameDayRepeat,reviewDue:due&&!sameDayRepeat
  }),
  activity:recordDailyAnswer(source.activity??migrateActivity(source),date,event.correct),
  xp:source.xp+totalXp,
  best:Math.max(source.best,nextCombo),
  answered:source.answered+1,
  correct:source.correct+(event.correct?1:0),
  mistakes:event.correct?source.mistakes.filter(id=>id!==event.questionId):
   [...new Set([...source.mistakes,event.questionId])],
  domains:{...source.domains,[event.domain]:{
   answered:domain.answered+1,correct:domain.correct+(event.correct?1:0)
  }},
  reviews:nextReview?{...source.reviews,[event.questionId]:nextReview}:source.reviews,
  daily:{date,answered:daily.answered+1,correct:daily.correct+(event.correct?1:0),claimed:daily.claimed}
 };
 return {progress:next,reward};
}

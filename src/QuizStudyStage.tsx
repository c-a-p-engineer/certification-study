import React from 'react';
import {ArrowRight} from 'lucide-react';
import QuizStageHeader from './QuizStageHeader';
import QuizCombatStatus from './QuizCombatStatus';
import ExpeditionJourneyHUD from './ExpeditionJourneyHUD';
import StudyQuestionIntro from './StudyQuestionIntro';
import QuizAnswerControls from './QuizAnswerControls';
import StudyAnswerFeedback from './StudyAnswerFeedback';

/** Pure quiz screen composition: answers, grading, rewards, next-step and persistence
 * are supplied by the parent. The same question DOM ref preserves focus and scroll.
 */
export type QuizStudyStageProps={
 header:React.ComponentProps<typeof QuizStageHeader>;
 combat:React.ComponentProps<typeof QuizCombatStatus>;
 expedition:React.ComponentProps<typeof ExpeditionJourneyHUD>|null;
 intro:React.ComponentProps<typeof StudyQuestionIntro>;
 options:React.ComponentProps<typeof QuizAnswerControls>;
 feedback:React.ComponentProps<typeof StudyAnswerFeedback>|null;
 examMode:boolean;selected:number|null;index:number;total:number;
 questionRef:React.RefObject<HTMLDivElement|null>;
 onNext:()=>void;
};
export default function QuizStudyStage({
 header,combat,expedition,intro,options,feedback,examMode,selected,index,total,questionRef,onNext
}:QuizStudyStageProps){
 return <section className="quiz"><QuizStageHeader {...header}/><div className="progress-track" role="progressbar" aria-label="ミッション進行度" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index+(selected!==null?1:0)}><div style={{width:`${(index+(selected!==null?1:0))/total*100}%`}}/></div><QuizCombatStatus {...combat}/>{expedition&&!examMode&&<ExpeditionJourneyHUD {...expedition}/>}<div className="question-card" ref={questionRef} tabIndex={-1} aria-label={"現在の問題 "+(index+1)+"／"+total}><StudyQuestionIntro {...intro}/><QuizAnswerControls {...options}/>{selected!==null&&examMode&&<div className="exam-pending"><span>ANSWER LOCKED · 解説は全問終了後に表示</span><button className="primary-btn next-btn" onClick={onNext}>{index+1===total?'FINISH EXAM':'NEXT QUESTION'} <ArrowRight size={18}/></button></div>}{selected!==null&&!examMode&&feedback&&<StudyAnswerFeedback {...feedback}/>}</div></section>;
}

import React from 'react';
import {ArrowRight} from 'lucide-react';
import type {StudyQuestion} from './StudyQuestionIntro';

export type QuizAnswerControlsProps={
 question:StudyQuestion;
 choiceOrder:readonly number[];
 selected:number|null;
 multiChoices:readonly number[];
 examMode:boolean;
 showChoices:boolean;
 onReveal:()=>void;
 onToggle:(index:number)=>void;
 onAnswer:(choices:number[])=>void;
};
/** Presentation-only selection controls. All grading, idempotency, XP and persistence stay in App/reducer. */
export default React.memo(function QuizAnswerControls({question,choiceOrder,selected,multiChoices,examMode,showChoices,onReveal,onToggle,onAnswer}:QuizAnswerControlsProps){
 const expected=question.answers??[question.answer!];
 return <>
{question.answers&&<div className="answer-instructions" aria-live="polite"><span>複数選択 · {question.answers.length}つ選ぶ</span><strong>{multiChoices.length} / {question.answers.length}</strong></div>}{!showChoices&&<div className="recall-gate"><strong>答えを思い出せた？</strong><button className="primary-btn" onClick={()=>onReveal()}>選択肢を表示する <ArrowRight size={17}/></button></div>}{showChoices&&<div className="answers">{choiceOrder.map((originalIndex,i)=><button key={originalIndex} aria-pressed={question.answers?multiChoices.includes(originalIndex):undefined} disabled={selected!==null} className={`answer ${selected!==null&&!examMode&&expected.includes(originalIndex)?'correct':''} ${selected!==null&&!examMode&&!expected.includes(originalIndex)&&(question.answers?multiChoices.includes(originalIndex):selected===originalIndex)?'wrong':''} ${selected===null&&multiChoices.includes(originalIndex)?'marked':''}`} onClick={()=>question.answers?onToggle(originalIndex):onAnswer([originalIndex])}><span className="letter">{'ABCDEFGH'[i]}</span><span className="answer-body">{question.choices[originalIndex]}</span><span className="answer-state">{selected===null&&question.answers&&multiChoices.includes(originalIndex)?"選択中":selected!==null&&examMode&&(question.answers?multiChoices.includes(originalIndex):selected===originalIndex)?"回答済":selected!==null&&!examMode&&expected.includes(originalIndex)?"正解":selected!==null&&!examMode&&(question.answers?multiChoices.includes(originalIndex):selected===originalIndex)?"不正解":""}</span><span className="answer-mark">{selected!==null&&!examMode&&expected.includes(originalIndex)?'✓':selected!==null&&!examMode&&(question.answers?multiChoices.includes(originalIndex):selected===originalIndex)?'✕':question.answers?(multiChoices.includes(originalIndex)?'☑':'☐'):'↗'}</span></button>)}</div>}{question.answers&&showChoices&&selected===null&&<button className="primary-btn multi-submit" disabled={multiChoices.length!==question.answers.length} onClick={()=>onAnswer(multiChoices)}>回答を確定 ({multiChoices.length}/{question.answers.length}) <ArrowRight size={17}/></button>}
 </>;
});

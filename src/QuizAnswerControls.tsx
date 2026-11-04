import React from 'react';
import {ArrowRight} from 'lucide-react';
import type {StudyQuestion} from './StudyQuestionIntro';
import {splitReadingSentences} from './readingGuide';
import './answerTargetingFx.css';

export type QuizAnswerControlsProps={
 question:StudyQuestion;
 choiceOrder:readonly number[];
 selected:number|null;
 multiChoices:readonly number[];
 examMode:boolean;
 showChoices:boolean;
 readingGuide?:boolean;
 showTargetConsole?:boolean;
 cinematic?:boolean;
 combo?:number;
 onReveal:()=>void;
 onToggle:(index:number)=>void;
 onAnswer:(choices:number[])=>void;
};
/** Presentation-only selection controls. All grading, idempotency, XP and persistence stay in App/reducer. */
export default React.memo(function QuizAnswerControls({question,choiceOrder,selected,multiChoices,examMode,showChoices,readingGuide,showTargetConsole=true,cinematic=false,combo=0,onReveal,onToggle,onAnswer}:QuizAnswerControlsProps){
 const expected=question.answers??[question.answer!];
 const [aim,setAim]=React.useState<{questionId:string;choice:number}|null>(null);
 const aiming=aim?.questionId===question.id&&selected===null?aim.choice:null;
 const fx=cinematic&&!examMode&&showChoices;
 const required=question.answers?.length??1;
 const charged=question.answers?multiChoices.length:aiming===null?0:1;
 const charge=Math.min(100,selected!==null?100:Math.round(charged/required*100));
 const hit=selected!==null&&(question.answers?selected===-2:expected.includes(selected));
 const aimIndex=aiming===null?-1:choiceOrder.indexOf(aiming);
 const aimLetter=aimIndex<0?'':('ABCDEFGH'[aimIndex]||'');
 const fxStatus=selected!==null?(hit?'DIRECT HIT':'SIGNAL BLOCKED'):
  question.answers?(charged>=required?'FIRE READY':charged?'TARGETS LOCKED':'AWAITING TARGETS'):
  aimLetter?'LOCK '+aimLetter:'SYSTEM READY';
 return <>
{question.answers&&<div className="answer-instructions" aria-live="polite"><span>複数選択 · {question.answers.length}つ選ぶ</span><strong>{multiChoices.length} / {question.answers.length}</strong></div>}{fx&&showTargetConsole&&<div className={'od-target-console '+(selected!==null?'od-shot-fired ':'')+(hit?'od-hit ':'')+(aiming!==null?'od-aiming ':'')} aria-hidden="true">
 <div className="od-target-head"><span>◈ TARGETING / {question.answers?'MULTI':'SINGLE'} LOCK</span><strong>{fxStatus}</strong></div>
 <div className="od-target-gauge"><span>CHARGE</span><div className="od-target-track"><i style={{width:charge+'%'}}/></div><strong>{charge}%</strong></div>
 <div className="od-target-pips">{Array.from({length:required},(_,i)=><i key={i} className={i<charged||selected!==null?'charged':''}/>)}</div>
 {combo>=3&&<span className="od-target-chain">CHAIN x{combo}</span>}
 </div>}{!showChoices&&<div className="recall-gate"><strong>答えを思い出せた？</strong><button className="primary-btn" onClick={()=>onReveal()}>選択肢を表示する <ArrowRight size={17}/></button></div>}{showChoices&&<div className="answers">{choiceOrder.map((originalIndex,i)=><button key={originalIndex} aria-pressed={question.answers?multiChoices.includes(originalIndex):undefined} disabled={selected!==null} className={`answer ${selected!==null&&!examMode&&expected.includes(originalIndex)?'correct':''} ${selected!==null&&!examMode&&!expected.includes(originalIndex)&&(question.answers?multiChoices.includes(originalIndex):selected===originalIndex)?'wrong':''} ${selected===null&&multiChoices.includes(originalIndex)?'marked':''}`} onPointerEnter={()=>{if(fx)setAim({questionId:question.id,choice:originalIndex})}}
 onPointerLeave={()=>setAim(null)}
 onFocus={()=>{if(fx)setAim({questionId:question.id,choice:originalIndex})}}
 onBlur={()=>setAim(null)}
 onClick={()=>question.answers?onToggle(originalIndex):onAnswer([originalIndex])}><span className="letter">{'ABCDEFGH'[i]}</span><span className="answer-body">{readingGuide?<span className="answer-reading-flow">{splitReadingSentences(question.choices[originalIndex]).map((part,j)=><span key={j} className="answer-reading-sentence">{part}</span>)}</span>:question.choices[originalIndex]}</span><span className="answer-state">{selected===null&&question.answers&&multiChoices.includes(originalIndex)?"選択中":selected!==null&&examMode&&(question.answers?multiChoices.includes(originalIndex):selected===originalIndex)?"回答済":selected!==null&&!examMode&&expected.includes(originalIndex)?"正解":selected!==null&&!examMode&&(question.answers?multiChoices.includes(originalIndex):selected===originalIndex)?"不正解":""}</span><span className="answer-mark">{selected!==null&&!examMode&&expected.includes(originalIndex)?'✓':selected!==null&&!examMode&&(question.answers?multiChoices.includes(originalIndex):selected===originalIndex)?'✕':question.answers?(multiChoices.includes(originalIndex)?'☑':'☐'):'↗'}</span></button>)}</div>}{question.answers&&showChoices&&selected===null&&<button className="primary-btn multi-submit" disabled={multiChoices.length!==question.answers.length} onClick={()=>onAnswer([...multiChoices])}>{fx&&charged>=required&&<span className="od-fire-label" aria-hidden="true">FIRE // </span>}回答を確定 ({multiChoices.length}/{question.answers.length}) <ArrowRight size={17}/></button>}
 </>;
});

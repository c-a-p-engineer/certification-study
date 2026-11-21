import React from 'react';
import {CheckCircle2, CircleHelp, ShieldX} from 'lucide-react';
import type {StudyQuestion} from './StudyQuestionIntro';
import {expandTerms} from './glossary';
import './decisionBreakdown.css';

/** A read-only, post-grading contrast view. No answer/reward/persistence side effects. */
export default function DecisionBreakdown({question}:{question:StudyQuestion}){
 const correct = new Set(question.answers ?? (question.answer === undefined ? [] : [question.answer]));
 const [showContrast,setShowContrast] = React.useState(false);
 return <section className="decision-break" aria-label="設計判断の答え合わせ">
  <div className="decision-break-heading">
   <span className="decision-break-kicker">DECISION BREAK</span>
   <h3>この設計が勝つ理由をつかむ</h3>
   <p>正解の選択肢と根拠を先に確認。似ている案との違いを押さえると、次の問題でも判断しやすくなります。</p>
  </div>
  <div className="decision-break-winners">
   <strong><CheckCircle2 size={18} aria-hidden="true"/> 採用すべき選択肢 {correct.size > 1 ? '（複数選択）' : ''}</strong>
   {question.choices.map((choice,i)=>correct.has(i)?<p key={i}><b>{'ABCDEFGH'[i] ?? String(i+1)}.</b> {choice}</p>:null)}
  </div>
  <div className="decision-break-reason"><strong>判断の根拠</strong><p>{expandTerms(question.explanation)}</p></div>
  {question.distractorReasons?.length === question.choices.length && <div className="decision-break-contrast">
   <button type="button" aria-expanded={showContrast} aria-controls="decision-break-options" onClick={()=>setShowContrast(value=>!value)}>
    <CircleHelp size={18} aria-hidden="true"/> {showContrast?'比較を閉じる':'ほかの選択肢が違う理由を比較する'}
   </button>
   {showContrast&&<div id="decision-break-options" className="decision-break-option-list">
    {question.choices.map((choice,i)=><div className={correct.has(i)?'decision-break-option is-correct':'decision-break-option'} key={i}>
     <strong>{correct.has(i)?<CheckCircle2 size={17} aria-hidden="true"/>:<ShieldX size={17} aria-hidden="true"/>}{'ABCDEFGH'[i] ?? String(i+1)}. {choice}</strong>
     <p>{expandTerms(question.distractorReasons![i])}</p>
    </div>)}
   </div>}
  </div>}
 </section>;
}

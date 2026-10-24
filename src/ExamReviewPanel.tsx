import React from 'react';
import {BookOpen} from 'lucide-react';
import QuestionFeedback from './QuestionFeedback';
import {expandTerms} from './glossary';
import {gradeAnswer} from './studyAttempt.ts';

/** Read-only 65-question mock exam review; intentionally separate from practice XP and review scheduling. */
export type ExamReviewQuestion={
 id:string;domain:string;question:string;choices:string[];answer?:number;answers?:number[];
 explanation:string;distractorReasons?:string[];reference:string;reviewedAt?:string;
};
export type ExamReviewPanelProps<Q extends ExamReviewQuestion>={
 questions:readonly Q[];
 answers:Readonly<Record<string,readonly number[]>>;
 createPrompt:(question:Q,selectedAnswers?:number[])=>string;
 renderTerms:(question:Q)=>React.ReactNode;
};

export default function ExamReviewPanel<Q extends ExamReviewQuestion>({
 questions,answers,createPrompt,renderTerms
}:ExamReviewPanelProps<Q>){
 return <div className="exam-review" aria-label="模擬試験の設問別振り返り">
  <h2>ANSWER REVIEW</h2>
  {questions.map((question,index)=>{
   const given=answers[question.id];
   const expected=question.answers??(question.answer===undefined?[]:[question.answer]);
   const correct=given!==undefined&&gradeAnswer(given,expected);
   const prompt=createPrompt(question,given?[...given]:undefined);
   return <details key={question.id} className="exam-review-item">
    <summary><span>{String(index+1).padStart(2,'0')} · {question.domain}</span>
     <strong>{given?(correct?'✓ CORRECT':'✕ INCORRECT'):'– UNANSWERED'}</strong>
    </summary>
    <h3>{question.question}</h3>
    <p><b>あなたの回答：</b>{given?given.map(option=>question.choices[option]).join(' ／ '):'未回答'}</p>
    <p><b>正解：</b>{expected.map(option=>question.choices[option]).join(' ／ ')}</p>
    <p className="expanded-explanation">{expandTerms(question.explanation)}</p>
    {question.distractorReasons&&<details className="choice-reasons">
     <summary>選択肢ごとの解説を表示</summary>
     {question.choices.map((choice,i)=><div key={i}>
      <strong>{'ABCDEFGH'[i]}. {choice}</strong>
      <p>{expandTerms(question.distractorReasons![i])}</p>
     </div>)}
    </details>}
    <a href={question.reference} target="_blank" rel="noopener noreferrer"><BookOpen size={15}/> AWS公式資料 ↗</a>
    <div className="ask-gpt">
     <a href={`https://chatgpt.com/?prompt=${encodeURIComponent(prompt)}`} target="_blank" rel="noopener noreferrer">ChatGPTに聞く ↗</a>
     <button type="button" onClick={()=>{void navigator.clipboard?.writeText(prompt)}}>質問文をコピー</button>
    </div>
    {renderTerms(question)}
    <QuestionFeedback id={question.id} reviewedAt={question.reviewedAt}/>
   </details>;
  })}
 </div>;
}

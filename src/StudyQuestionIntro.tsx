import React from 'react';
import {BookOpen,ChevronDown,Zap} from 'lucide-react';
import {findStudyTerms} from './termGuide';

export type StudyQuestion = { id: string; domain: string; question: string; choices: string[]; answer?: number; answers?: number[]; difficulty?:number; tags?:string[]; distractorReasons?:string[]; explanation: string; reference: string;reviewedAt?:string };

export function TermsPanel({question}:{question:StudyQuestion}){
 const terms=findStudyTerms(question);
 if(terms.length===0)return null;
 return <details className="term-panel study-terms-panel" aria-label="この問題に出てきた用語とサービスの一覧">
  <summary className="term-panel-heading"><BookOpen size={19}/><strong>用語・サービス図鑑</strong><span>{terms.length}語</span></summary>
  <div className="term-picker">{terms.map(term=><details className="term-card" key={term.id}>
   <summary className="term-card-title"><span className="term-card-name"><strong>{term.title}</strong><small>読み：{term.reading}</small></span><span className="term-kind">{term.category}</span><ChevronDown size={18} className="term-card-chevron" aria-hidden="true"/></summary>
   <div className="term-card-detail">
    {term.english&&<p className="term-full-name" aria-label="正式名称"><strong>{term.english}</strong></p>}
    <p className="term-meaning"><strong>{term.meaning}</strong></p>
    <p className="term-note">{term.note}</p>
    {(term.title==='RTO'||term.title==='RPO')&&<p className="term-memory-tip"><b>覚え分け</b>　RTO＝復旧するまでの時間 ／ RPO＝失ってよいデータの時間幅</p>}
   </div>
  </details>)}</div>
 </details>;
}

export default function StudyQuestionIntro({question,topic,reason,showTerms}:{question:StudyQuestion;topic:string;reason?:string;showTerms:boolean}){
 return <>
  <div className="question-meta"><span>{question.domain.toUpperCase()} · {topic}</span></div>
  {reason&&<span className="smart-reason"><Zap size={14}/> 選出理由：{reason}</span>}
  <h2>{question.question}</h2>
  {showTerms&&<div className="question-terms" aria-label="この問題の用語とサービスの説明"><TermsPanel key={question.id} question={question}/></div>}
 </>;
}

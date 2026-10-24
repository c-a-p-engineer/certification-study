import React from 'react';
import {BookOpen,ChevronDown,Zap,ClipboardCopy,Flag} from 'lucide-react';
import {findStudyTerms} from './termGuide';
import {splitReadingSentences} from './readingGuide';
import {questionInquiryUrl} from './questionReports';

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

export default function StudyQuestionIntro({question,topic,reason,showTerms,readingGuide,onReadingGuide}:{question:StudyQuestion;topic:string;reason?:string;showTerms:boolean;readingGuide?:boolean;onReadingGuide?:()=>void}){
 const [copyResult,setCopyResult]=React.useState<{id:string;message:string}|null>(null);
 async function copyId(){
  try{
   if(!navigator.clipboard?.writeText)throw new Error('Clipboard API unavailable');
   await navigator.clipboard.writeText(question.id);
   setCopyResult({id:question.id,message:'問題IDをコピーしました'});
  }catch{setCopyResult({id:question.id,message:'コピーできません。IDを長押ししてコピーしてください'})}
 }
 return <>
  <div className="question-meta"><span>{question.domain.toUpperCase()} · {topic}</span>{onReadingGuide&&<button type="button" className="study-reading-toggle" aria-pressed={!!readingGuide} aria-label={readingGuide?"文ごとの区切り表示を解除":"文ごとに区切り、行間を広げて読む"} onClick={onReadingGuide}><BookOpen size={15} aria-hidden="true"/>{readingGuide?"通常表示へ":"文ごとに読む"}</button>}</div>
  <div className="question-id-row" aria-label="問題IDと問い合わせ">
   <span className="question-id-value">問題ID <code>{question.id}</code></span>
   <button type="button" onClick={copyId} aria-label={"問題ID "+question.id+" をコピー"}><ClipboardCopy size={15} aria-hidden="true"/> IDコピー</button>
   <a href={questionInquiryUrl(question.id)} target="_blank" rel="noopener noreferrer" title="GitHubの問い合わせ作成画面を開く。送信はご自身で行います"><Flag size={15} aria-hidden="true"/> 問い合わせ</a>
   {copyResult?.id===question.id&&<span className="question-id-copy-status" role="status" aria-live="polite">{copyResult.message}</span>}
  </div>
  {reason&&<span className="smart-reason"><Zap size={14}/> 選出理由：{reason}</span>}
  <h2 className={readingGuide?"question-readable":undefined}>{readingGuide?<span className="reading-sentences">{splitReadingSentences(question.question).map((part,i)=><span key={i} className="reading-sentence">{part}</span>)}</span>:question.question}</h2>
  {showTerms&&<div className="question-terms" aria-label="この問題の用語とサービスの説明"><TermsPanel key={question.id} question={question}/></div>}
 </>;
}

import React,{useState} from 'react';
import {ClipboardCopy,Flag,ExternalLink} from 'lucide-react';
import {REPORT_REASONS,submitLocalReport,issueDraft,type ReportReason,type QuestionReport} from './questionReports.ts';
import './qualityGrowth.css';
export default function QuestionFeedback({id,reviewedAt}:{id:string;reviewedAt?:string}){
 const [reason,setReason]=useState<ReportReason>('正答が曖昧');
 const [comment,setComment]=useState('');
 const [status,setStatus]=useState('');
 const [prepared,setPrepared]=useState<QuestionReport|null>(null);
 function save(){
  try{
   const item={id,reason,comment:comment.trim(),createdAt:new Date().toISOString()};
   submitLocalReport(item);setPrepared(item);
   setStatus('この端末に報告を保存しました。外部送信はしていません。');
  }catch(e){setStatus('報告を保存できませんでした。ストレージの容量をご確認ください。')}
 }
 return <details className="q-feedback"><summary><Flag size={15}/> この問題を報告・品質確認</summary>
  <p className="q-review-state">{reviewedAt?'レビュー日付あり：'+reviewedAt+'（第三者による検証保証ではありません）':'未レビュー：AWS公式資料との確認が必要です'}</p>
  <label>報告理由<select value={reason} onChange={e=>setReason(e.target.value as ReportReason)}>{REPORT_REASONS.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
  <label>詳細（任意、600字以内）<textarea rows={3} maxLength={600} value={comment} onChange={e=>setComment(e.target.value)} placeholder="設計要件、正答候補、公式資料との食い違いなど"/></label>
  <div className="q-feedback-actions"><button type="button" onClick={save}><Flag size={15}/> この端末に記録</button>
   {prepared&&<><button type="button" onClick={()=>{void navigator.clipboard?.writeText(issueDraft(prepared)).then(()=>setStatus('報告文をコピーしました')).catch(()=>setStatus('コピーできませんでした'))}}><ClipboardCopy size={15}/> 報告文をコピー</button>
   <a target="_blank" rel="noopener noreferrer" href={'https://github.com/c-a-p-engineer/certification-study/issues/new?title='+encodeURIComponent('Question feedback: '+id)+'&body='+encodeURIComponent(issueDraft(prepared))}><ExternalLink size={15}/> GitHubで報告</a></>}
  </div>
  <small role="status" aria-live="polite">{status}</small>
  <p>外部への報告はGitHubページを開いた後、ご自身で送信するまで公開されません。回答履歴は含めません。</p>
 </details>;
}

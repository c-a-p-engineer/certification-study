/** Private, exportable learner feedback queue; never posts a report without a click. */
export const QUESTION_REPORTS_KEY='cert-overdrive-question-reports-v1';
export const REPORT_REASONS=['正答が曖昧','解説が不正確','AWS仕様が古い','誤字・表示問題','その他'] as const;
export type ReportReason=typeof REPORT_REASONS[number];
export type QuestionReport={id:string;reason:ReportReason;comment:string;createdAt:string};
export function validReport(value:unknown):value is QuestionReport{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const x=value as Partial<QuestionReport>;
 return typeof x.id==='string'&&/^[\w-]{2,64}$/.test(x.id)&&REPORT_REASONS.includes(x.reason as ReportReason)
  &&typeof x.comment==='string'&&x.comment.length<=600&&typeof x.createdAt==='string'&&Number.isFinite(Date.parse(x.createdAt));
}
export function normalizeReports(value:unknown):QuestionReport[]{
 return Array.isArray(value)?value.filter(validReport).slice(-100):[];
}
export function readReports():QuestionReport[]{
 try{return typeof localStorage==='undefined'?[]:normalizeReports(JSON.parse(localStorage.getItem(QUESTION_REPORTS_KEY)||'[]'))}catch{return []}
}
export function submitLocalReport(item:QuestionReport):QuestionReport[]{
 if(!validReport(item))throw Error('報告内容が不正です');
 const next=[...readReports(),item].slice(-100);
 localStorage.setItem(QUESTION_REPORTS_KEY,JSON.stringify(next));
 return next;
}
export function issueDraft(report:QuestionReport){
 return ['問題ID: '+report.id,'報告理由: '+report.reason,'詳細: '+(report.comment||'未記入'),'','※正誤やAWS仕様は公式資料による追加確認が必要です。'].join('\n');
}

/** Create a user-initiated issue draft with only the stable public question ID.
 * Never embed the learner's chosen answer, XP, answer key or private progress.
 * Opening this URL does not publish anything; the user must submit on GitHub.
 */
export function questionInquiryUrl(id:string):string{
 if(!/^[\w-]{2,64}$/.test(id))throw new Error('Invalid question ID');
 const title='Question inquiry: '+id;
 const body=['問題ID: '+id,'相談内容: この問題について説明や根拠を確認したいです。','補足（任意）: ','','※学習者の回答・XP・履歴は含まれません。公開前に内容を確認してください。'].join('\n');
 return 'https://github.com/c-a-p-engineer/certification-study/issues/new?title='+encodeURIComponent(title)+'&body='+encodeURIComponent(body);
}

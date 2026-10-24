import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {REPORT_REASONS,validReport,normalizeReports,issueDraft,submitLocalReport,QUESTION_REPORTS_KEY} from '../src/questionReports.ts';
const report={id:'saa-339',reason:'AWS仕様が古い',comment:'公式資料の適用範囲を確認したい',createdAt:'2026-10-24T01:00:00Z'};
test('learner feedback is bounded, valid, offline and does not expose answers',()=>{
 assert.equal(REPORT_REASONS.length,5);
 assert.equal(validReport(report),true);
 assert.equal(validReport({...report,comment:'X'.repeat(601)}),false);
 assert.equal(validReport({...report,id:'<img>'}),false);
 assert.equal(normalizeReports([report,{bad:true}]).length,1);
 const draft=issueDraft(report);assert.ok(draft.includes('saa-339'));assert.ok(!draft.includes('正答: 2'));
});
test('local report saving is explicit; unchanged study progress',()=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');const data=new Map();
 try{Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
  assert.equal(submitLocalReport(report).length,1);
  assert.equal(JSON.parse(data.get(QUESTION_REPORTS_KEY))[0].id,'saa-339');
  assert.equal(data.has('certification-overdrive-progress-v1'),false);
 }finally{if(old)Object.defineProperty(globalThis,'localStorage',old);else delete globalThis.localStorage}
});
test('no automatic public post; exam only shows feedback after completion',()=>{
 const main=readFileSync('src/main.tsx','utf8'),practice=readFileSync('src/StudyAnswerFeedback.tsx','utf8'),exam=readFileSync('src/ExamReviewPanel.tsx','utf8'),ui=readFileSync('src/QuestionFeedback.tsx','utf8');
 assert.ok(main.includes('<StudyAnswerFeedback question={q}'));
 assert.ok(practice.includes('<QuestionFeedback id={question.id}'));
 assert.ok(exam.includes('<QuestionFeedback id={question.id}'));
 assert.ok(ui.includes('GitHubで報告'));
 assert.ok(ui.includes('submitLocalReport(item)'));
 assert.ok(ui.includes('window')===false||!ui.includes('fetch('));
 assert.ok(ui.includes('第三者による検証保証ではありません'));
});

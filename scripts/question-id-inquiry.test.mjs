import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadQuestions} from './question-source.mjs';
import {questionInquiryUrl} from '../src/questionReports.ts';

const intro=readFileSync('src/StudyQuestionIntro.tsx','utf8');
const feedback=readFileSync('src/QuestionFeedback.tsx','utf8');
const style=readFileSync('src/readingGuide.css','utf8');
const main=readFileSync('src/main.tsx','utf8');
const spec=readFileSync('docs/SPECIFICATION.md','utf8');

test('stable question ID is shown before answering in practice and exam, with explicit copy and support',()=>{
 assert.ok(intro.includes('問題ID <code>{question.id}</code>'));
 assert.ok(intro.includes('className="question-id-row"'));
 assert.ok(intro.includes('onClick={copyId}'));
 assert.ok(intro.includes('navigator.clipboard?.writeText(question.id)'));
 assert.ok(intro.includes('aria-live="polite"'));
 assert.ok(intro.includes('questionInquiryUrl(question.id)'));
 assert.ok(intro.includes('target="_blank" rel="noopener noreferrer"'));
 assert.ok(intro.indexOf('question-id-row')<intro.indexOf('<h2 className='));
 assert.ok(main.includes('<StudyQuestionIntro question={q}'));
 assert.ok(main.includes('showTerms={!examMode}'));
 assert.ok(feedback.includes('issueDraft(prepared)'));
 for(const forbidden of ['setProgress(','applyStudyAttempt(','setMode(','localStorage'])assert.ok(!intro.includes(forbidden),forbidden);
});
test('support URL contains only stable ID plus a blank report draft; no answer or state leakage',()=>{
 const id='saa-276',url=new URL(questionInquiryUrl(id));
 assert.equal(url.origin,'https://github.com');
 assert.equal(url.pathname,'/c-a-p-engineer/certification-study/issues/new');
 assert.ok(url.searchParams.get('title')?.includes(id));
 const body=url.searchParams.get('body')||'';
 assert.ok(body.includes('問題ID: '+id));
 assert.ok(body.includes('相談内容:'));
 for(const secret of ['正答:', '私の回答:', 'XP:', '進捗:', 'sessionAnswers', 'selectedAnswer']) assert.ok(!body.includes(secret),secret);
 for(const invalid of ['<script>','', 'a'.repeat(65)]) assert.throws(()=>questionInquiryUrl(invalid));
});
test('question id and report action are mobile-friendly, keyboard accessible, and show copy failures',()=>{
 assert.ok(style.includes('.app .question-id-value code'));
 assert.ok(style.includes('user-select:text'));
 assert.ok(style.includes('min-height:44px'));
 assert.ok(style.includes('.app .question-id-row a:focus-visible'));
 assert.ok(style.includes('@media(max-width:370px)'));
 assert.ok(intro.includes('コピーできません。IDを長押ししてコピーしてください'));
 assert.ok(spec.includes('既存の安定ID'));
 assert.ok(spec.includes('学習者の回答・XP・復習履歴'));
});
test('saa-276 explains rerunnable Kinesis records and every distractor, without changing the answer key',()=>{
 const authored=loadQuestions();
 assert.equal(authored.length,348);
 const q=authored.find(x=>x.id==='saa-276');
 assert.ok(q,'saa-276 should be available under its old stable ID');
 assert.equal(q.domain,'耐障害性');
 assert.equal(q.answer,0);
 assert.equal(q.choices[0],'Amazon Kinesis Data Streamsの保持期間とコンシューマー');
 assert.ok(q.question.includes('集計プログラムに不具合'));
 assert.ok(q.question.includes('一定期間内に再び読み込み'));
 assert.ok(q.explanation.includes('デフォルト24時間'));
 assert.ok(q.explanation.includes('最長365日'));
 assert.ok(q.explanation.includes('保持期間を過ぎた'));
 assert.equal(q.distractorReasons?.length,4);
 for(const explanation of q.distractorReasons)assert.ok(explanation.length>35);
 assert.ok(q.reference.includes('/kinesis-extended-retention.html'));
 assert.equal(q.reviewedAt,undefined,'engineering content edit is not independent sign-off');
 const generated=JSON.parse(readFileSync('src/generated/questions.json','utf8'));
 assert.deepEqual(generated.find(x=>x.id==='saa-276'),q);
});

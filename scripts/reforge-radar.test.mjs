import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildDomainIntel} from '../src/reforgeRadar.ts';
import {localDateKey} from '../src/studyHistory.ts';

const now=new Date(2026,10,21,12,0,0).getTime();
const prior=now-86400000,earlier=now-2*86400000;
const date=at=>localDateKey(new Date(at));
const questions=[
 {id:'q1',domain:'セキュリティ'},
 {id:'q2',domain:'セキュリティ'},
 {id:'q3',domain:'耐障害性'},
 {id:'q4',domain:'パフォーマンス'},
 {id:'q5',domain:'コスト最適化'}
];
const event=(id,at,options={})=>({
 id,domain:'セキュリティ',day:date(at),at,
 correct:true,firstAttempt:false,due:false,recovery:false,exam:false,mode:'daily',...options
});
test('read-only intel counts verified cross-day recall once per question, not repeats or exam',()=>{
 const history=[
  event('q1',earlier,{firstAttempt:true}),
  event('q1',prior,{due:true}),
  event('q1',now,{due:true}),
  event('q1',now+10000,{due:true}),
  event('q2',now,{due:true}),
  event('q3',prior,{exam:true}),
  event('q4',now+86400000,{due:true}),
  event('unknown',prior,{due:true})
 ];
 const reviews={q1:{dueAt:now-1000,intervalDays:1,streak:1,lapses:0,lastReviewedAt:prior}};
 const result=buildDomainIntel(questions,history,reviews,['q2','unknown'],now);
 const sec=result.find(x=>x.domain==='セキュリティ');
 assert.equal(sec.available,2);
 assert.equal(sec.observed,2);
 assert.equal(sec.delayedRecall,1);
 assert.equal(sec.weak,1);
 assert.equal(sec.due,1);
 assert.equal(result.find(x=>x.domain==='耐障害性').hasHistory,false);
 assert.equal(result.find(x=>x.domain==='パフォーマンス').hasHistory,false);
 assert.equal(result.length,4);
});
test('same-day due flag alone cannot manufacture delayed retention',()=>{
 const history=[event('q1',now,{due:true}),event('q1',now+1000,{due:true})];
 const result=buildDomainIntel(questions,history,{},[],now+2000);
 assert.equal(result[0].delayedRecall,0);
});
test('inconsistent dated or future events do not count as observed evidence',()=>{
 const history=[event('q1',now,{day:date(prior)}),event('q2',now+86400000)];
 const result=buildDomainIntel(questions,history,{},[],now);
 assert.equal(result[0].hasHistory,false);
 assert.equal(result[0].observed,0);
});
test('radar has no second reward ledger and UI distinguishes missing observation',()=>{
 const module=readFileSync('src/reforgeRadar.ts','utf8');
 const ui=readFileSync('src/ReforgeArena.tsx','utf8');
 const main=readFileSync('src/main.tsx','utf8');
 const spec=readFileSync('docs/SPECIFICATION.md','utf8');
 assert.ok(!module.includes('localStorage'));
 assert.ok(!module.includes('setProgress'));
 assert.ok(!module.includes('applyStudyAttempt'));
 assert.ok(ui.includes('item.hasHistory?'));
 assert.ok(ui.includes('回答ログ未観測'));
 assert.ok(main.includes('buildDomainIntel(questions,progress.answerHistory'));
 assert.ok(spec.includes('DOMAIN INTEL'));
});

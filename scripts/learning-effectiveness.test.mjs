import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {learningSnapshot,learningRetrospective} from '../src/learningInsights.ts';
import {planSmartQuest} from '../src/smartQuest.ts';
const event=(id,day,correct,mode='smart',due=true)=>({id,day,domain:'セキュリティ',correct,firstAttempt:false,due,recovery:false,exam:false,mode});
test('7-day retrospective distinguishes SMART due reviews and other due reviews without causal claims',()=>{
 const history=[event('a','2026-10-22',false),event('a','2026-10-24',true),event('b','2026-10-23',true,'normal'),event('c','2026-10-24',false,'normal')];
 const r=learningSnapshot(history,7,'2026-10-24');
 assert.deepEqual(r.smartDue,{n:2,correct:1,rate:50});
 assert.deepEqual(r.otherDue,{n:2,correct:1,rate:50});
 assert.equal(r.delayedReturn.n,1);
 assert.equal(r.delayedReturn.rate,100);
 assert.equal(r.changeClaimAllowed,false);
 assert.equal(r.hasEnoughDueData,false);
 assert.ok(learningRetrospective(r).includes('セキュリティ'));
});
test('historical/unknown-mode data never falsely becomes SMART or standard sample',()=>{
 const old=event('a','2026-10-23',true);delete old.mode;
 const r=learningSnapshot([old],7,'2026-10-24');
 assert.equal(r.attempts,1);assert.equal(r.smartDue.n,0);assert.equal(r.otherDue.n,0);
 assert.equal(r.delayedReturn.n,0);
 assert.equal(learningSnapshot([],7,'2026-10-24').nextTopic,null);
});
test('local dates correctly exclude older events and do not count same-day repeats as delayed retention',()=>{
 const history=[event('a','2026-10-16',false),event('a','2026-10-24',true),event('b','2026-10-24',true),event('b','2026-10-24',true)];
 const r=learningSnapshot(history,7,'2026-10-24');
 assert.equal(r.attempts,3);assert.equal(r.delayedReturn.n,0);assert.equal(r.repeatWithinDay,1);
});
test('SMART selection is robust to corrupt due dates, repeated IDs and very small pools',()=>{
 const questions=[{id:'A',domain:'セキュリティ',question:'IAMパターンとS3の認可比較を設計します。'},{id:'A',domain:'セキュリティ',question:'重複問題'},{id:'B',domain:'耐障害性',question:'Multi-AZとDRの違いを設計する。'}];
 const result=planSmartQuest(questions,10,{reviews:{A:{dueAt:NaN,streak:0,lapses:0,intervalDays:1,lastReviewedAt:0}},mistakes:[],recent:new Set(),domains:{},now:100},'review');
 assert.equal(result.questions.length,2);
 assert.equal(new Set(result.questions.map(x=>x.id)).size,2);
 assert.ok(result.reasons.A);
});
test('UI reports sample sizes and forbids claiming observational causality',()=>{
 const ui=readFileSync('src/LearningInsights.tsx','utf8');
 const main=readFileSync('src/main.tsx','utf8');
 assert.ok(ui.includes('因果的に証明する比較ではありません'));
 assert.ok(ui.includes('5回答未満'));
 assert.ok(main.includes("mode:examMode?'exam':dailyFocus?'daily':retentionMode?'retention':adaptiveMode?'smart':'normal'"));
 assert.ok(main.includes('<LearningInsights history={progress.answerHistory}/>'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planRound,isCorrect,shuffled,DOMAINS} from '../src/reborn/planner.ts';
import {applyStudyAttempt} from '../src/studyAttempt.ts';
const q=(id,domain,answer=0)=>({id,domain,choices:['A','B','C','D','E'],question:'Question '+id,answer,explanation:'Because',reference:'https://docs.aws.amazon.com/'});
const bank=Array.from({length:200},(_,i)=>q('q'+i,DOMAINS[i%4]));
const snapshot={reviews:{},mistakes:['q5','q7','q9'],answerHistory:[]};
test('single main route is rebuilt by default and old mode is explicit',()=>{
 const html=readFileSync('index.html','utf8');
 const entry=readFileSync('src/entry.ts','utf8');
 const ui=readFileSync('src/reborn/RebornApp.tsx','utf8');
 const css=readFileSync('src/reborn/reborn.css','utf8');
 assert.match(html,/src\/entry\.ts/);
 assert.match(entry,/get\('legacy'\)==='1'/);
 assert.match(entry,/import\('\.\/main\.tsx'\)/);
 assert.match(entry,/import\('\.\/reborn\/index\.tsx'\)/);
 for(const label of ['今日のクエスト','学習を始める','苦手を攻略する','ランダム演習','成長の記録','バックアップ']){
  assert.ok(ui.includes(label),label);
 }
 assert.ok(css.includes('@media(max-width:500px)'));
 assert.ok(css.includes('min-width:320px'));
});
test('rebuilt planner offers finite predictable study options and weighted exam shape',()=>{
 const daily=planRound(bank,snapshot,'daily',42);
 assert.ok(daily.questions.length<=5);
 const weak=planRound(bank,snapshot,'weak',42);
 assert.deepEqual(new Set(weak.questions.map(q=>q.id)),new Set(snapshot.mistakes));
 const focus=planRound(bank,snapshot,'domain',42,'セキュリティ');
 assert.equal(focus.questions.length,10);
 assert.ok(focus.questions.every(q=>q.domain==='セキュリティ'));
 const exam=planRound(bank,snapshot,'exam',42);
 assert.equal(exam.questions.length,65);
 assert.deepEqual(DOMAINS.map(domain=>exam.questions.filter(q=>q.domain===domain).length),[20,17,15,13]);
 assert.deepEqual(shuffled([1,2,3,4],37),shuffled([1,2,3,4],37));
 assert.equal(new Set(exam.questions.map(q=>q.id)).size,65);
});
test('multiple choice is exact, no duplicate and no answer migration',()=>{
 const multi={...q('multi','セキュリティ'),answer:undefined,answers:[1,3]};
 assert.equal(isCorrect(multi,[3,1]),true);
 assert.equal(isCorrect(multi,[1]),false);
 assert.equal(isCorrect(multi,[1,1]),false);
 assert.equal(isCorrect(q('s','セキュリティ',2),[2]),true);
});
test('all standard modes use canonical receipts and exam never awards XP',()=>{
 const p={xp:0,best:0,answered:0,correct:0,mistakes:[],domains:{},reviews:{}};
 const at=Date.parse('2026-11-21T12:00:00+09:00');
 const a={attemptId:'reborn-test-run:0:q1',questionId:'q1',domain:'セキュリティ',correct:true,combo:1,mode:'daily',boss:false,at};
 const first=applyStudyAttempt(p,a);
 assert.ok(first.reward.totalXp>0);
 assert.equal(applyStudyAttempt(first.progress,a).reward.credited,false);
 const repeat=applyStudyAttempt(first.progress,{...a,attemptId:'reborn-test-run2:0:q1'});
 assert.equal(repeat.reward.baseXp,0);
 const exam=applyStudyAttempt(p,{...a,attemptId:'reborn-test-exam:0:q1',mode:'exam'});
 assert.equal(exam.reward.totalXp,0);
 assert.equal(exam.progress.xp,0);
});
test('new app does not introduce alternate persistence, preserves recoverability and study mode integrity',()=>{
 const ui=readFileSync('src/reborn/RebornApp.tsx','utf8');
 const spec=readFileSync('docs/SPECIFICATION.md','utf8');
 assert.ok(ui.includes('useProgressConflict(progress,initialBlocked)'));
 assert.ok(ui.includes('applyStudyAttempt(progress,event)'));
 assert.ok(ui.includes('setProgress(p=>applyStudyAttempt(p,event).progress)'));
 assert.ok(ui.includes('createBackup(localStorage)'));
 assert.ok(ui.includes('validProgress'));
 assert.ok(ui.includes("mode:activeExam?'exam':'daily'"));
 assert.ok(ui.includes('readonlyRef.current'));
 assert.ok(spec.includes('新しい標準画面 — REBORN'));
 for(const forbidden of ['localStorage.clear(','localStorage.removeItem(PROGRESS_SAVE_KEY)','xp:p.xp+','document.cookie']){
  assert.ok(!ui.includes(forbidden),forbidden);
 }
});

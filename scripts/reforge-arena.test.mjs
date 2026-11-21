import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {answerKeys,arenaChoiceOrder,arenaDeck,isExactAnswer,arenaReport,ARENA_LENGTH} from '../src/reforgeEngine.ts';
import {applyStudyAttempt} from '../src/studyAttempt.ts';
const q=(id,domain,answer=0)=>({id,domain,choices:['A','B','C'],answer});
test('finite and repeatable deck respects distinct question IDs and balanced domains',()=>{
 const bank=Array.from({length:20},(_,i)=>q('q'+i,['セキュリティ','耐障害性','パフォーマンス','コスト最適化'][i%4]));
 const first=arenaDeck(bank,42),second=arenaDeck(bank,42);
 assert.equal(first.length,ARENA_LENGTH);
 assert.deepEqual(first.map(x=>x.id),second.map(x=>x.id));
 assert.equal(new Set(first.map(x=>x.id)).size,ARENA_LENGTH);
 assert.equal(new Set(first.map(x=>x.domain)).size,4);
});
test('underfilled banks return their actual size and malformed answer keys are rejected',()=>{
 assert.equal(arenaDeck([q('a','x'),q('b','y')],11).length,2);
 assert.equal(arenaDeck([{id:'bad',domain:'x',choices:['A','B'],answer:7}],11).length,0);
 assert.equal(arenaDeck([],11).length,0);
});
test('multi-select exact set grading is order-insensitive, never accepts partial matches',()=>{
 const multi={id:'multi',domain:'security',choices:['a','b','c','d'],answers:[1,3]};
 assert.deepEqual(answerKeys(multi),[1,3]);
 assert.equal(isExactAnswer(multi,[3,1]),true);
 assert.equal(isExactAnswer(multi,[1]),false);
 assert.equal(isExactAnswer(multi,[1,2]),false);
 assert.equal(isExactAnswer(multi,[1,1]),false);
 assert.equal(isExactAnswer(q('single','x',2),[2]),true);
 assert.equal(isExactAnswer(q('single','x',2),[1]),false);
});
test('calibration report counts confidence mistakes separately from correct guesses',()=>{
 const r=arenaReport([
  {questionId:'a',domain:'x',correct:false,confidence:'sure'},
  {questionId:'b',domain:'x',correct:true,confidence:'guess'},
  {questionId:'c',domain:'y',correct:true,confidence:'maybe'}]);
 assert.equal(r.correct,2);assert.equal(r.total,3);
 assert.deepEqual(r.sureWrong.map(x=>x.questionId),['a']);
 assert.deepEqual(r.unexpected.map(x=>x.questionId),['b']);
 assert.deepEqual(r.review,['a']);
});
test('arena has voluntary exit, post-answer reveal and no alternate persistent reward writer',()=>{
 const component=readFileSync('src/ReforgeArena.tsx','utf8');
 const main=readFileSync('src/main.tsx','utf8');
 const launcher=readFileSync('src/HomeMissionLauncher.tsx','utf8');
 const css=readFileSync('src/reforgeArena.css','utf8');
 const spec=readFileSync('docs/SPECIFICATION.md','utf8');
 assert.ok(main.includes('<ReforgeArena questions={questions}'));
 assert.ok(launcher.includes('onReforge'));
 assert.ok(launcher.indexOf('reforge-entry')<launcher.indexOf('<DailyFiveBoard'));
 assert.ok(component.includes("setPhase('reveal')"));
 assert.ok(component.includes("phase==='reveal'&&"));
 assert.ok(component.includes('onExit'));
 assert.ok(component.includes('aria-pressed={selected.includes(i)}'));
 for(const forbidden of ['localStorage','applyStudyAttempt','setProgress(','scheduleReview(','navigator.clipboard']){
  assert.ok(!component.includes(forbidden),forbidden);
 }
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(css.includes('min-height:44px'));
 assert.ok(spec.includes('OVERDRIVE REFORGED'));
});

test('shuffled answer positions preserve original keys and are deterministic',()=>{
 const item={id:'saa-23',domain:'security',choices:['A','B','C','D','E'],answers:[0,4]};
 const a=arenaChoiceOrder(item,762),b=arenaChoiceOrder(item,762);
 assert.deepEqual(a,b);
 assert.deepEqual([...a].sort((x,y)=>x-y),[0,1,2,3,4]);
 assert.equal(isExactAnswer(item,[4,0]),true);
});
test('duplicate and malformed keys cannot multiply stage opportunities',()=>{
 const bank=[q('same','x'),q('same','x'),q('another','x'),{id:'invalid',domain:'x',choices:['a','b'],answers:[1,1]}];
 const deck=arenaDeck(bank,123);
 assert.deepEqual(new Set(deck.map(x=>x.id)).size,2);
 assert.equal(deck.some(x=>x.id==='invalid'),false);
});
test('immediate reconstruction is a separate observation, not delayed retention',()=>{
 const result=arenaReport([{questionId:'a',domain:'x',correct:false,confidence:'sure',reconstructed:true},
 {questionId:'b',domain:'y',correct:true,confidence:'maybe',reconstructed:false}]);
 assert.equal(result.reconstructed,1);
 assert.equal(result.correct,1);
 assert.equal(result.sureWrong.length,1);
});
test('arena answer events share canonical idempotent XP, review and battle rules',()=>{
 const progress={xp:0,best:0,answered:0,correct:0,mistakes:[],domains:{},reviews:{}};
 const base={attemptId:'reforge-session-1:0:q1',questionId:'q1',domain:'セキュリティ',
 correct:true,combo:1,mode:'daily',boss:false,at:Date.parse('2026-11-21T12:00:00+09:00')};
 const first=applyStudyAttempt(progress,base);
 assert.equal(first.reward.credited,true);
 assert.ok(first.reward.totalXp>0);
 assert.equal(first.progress.answered,1);
 assert.equal(first.progress.reviews.q1.streak,1);
 const replay=applyStudyAttempt(first.progress,base);
 assert.equal(replay.reward.credited,false);
 assert.equal(replay.progress,first.progress);
 const sameDay=applyStudyAttempt(first.progress,{...base,attemptId:'reforge-session-2:0:q1',at:base.at+30000});
 assert.equal(sameDay.reward.baseXp,0);
 assert.equal(sameDay.reward.campaign?.damage??0,0);
 const newDay=applyStudyAttempt(sameDay.progress,{...base,attemptId:'reforge-session-3:0:q1',at:base.at+86400000});
 assert.equal(newDay.reward.credited,true);
 assert.ok(newDay.progress.answerHistory.length>sameDay.progress.answerHistory.length);
 const exam=applyStudyAttempt(first.progress,{...base,attemptId:'exam-session-1:0:q1',mode:'exam'});
 assert.equal(exam.progress.xp,first.progress.xp);
 assert.equal(exam.progress.enemyCampaign,first.progress.enemyCampaign);
});
test('only first committed choice is graded and recall cannot mint extra rewards',()=>{
 const component=readFileSync('src/ReforgeArena.tsx','utf8');
 const main=readFileSync('src/main.tsx','utf8');
 const source=readFileSync('src/reforgeEngine.ts','utf8');
 assert.match(component,/committingRef\.current=true/);
 assert.match(component,/const credited=onAttempt\(event\)/);
 assert.match(component,/attemptId:runId\+'\:'\+index\+'\:'\+q\.id/);
 assert.match(component,/setPhase\('recall'\)/);
 assert.match(component,/setRecallResult\(ok\)/);
 assert.match(component,/setSelectionReasons\(\{\.\.\.reasons\}\)/);
 assert.match(component,/phase==='recall'&&/);
 assert.ok(!component.slice(component.indexOf('function checkRecall'),component.indexOf('function advance')).includes('onAttempt('));
 assert.match(main,/setProgress\(p=>applyStudyAttempt\(p,event\)\.progress\)/);
 assert.match(main,/if\(syncBlocked\.current\|\|restoreBlocked\)return null/);
 assert.match(source,/import \{gradeAnswer\} from '\.\/studyAttempt\.ts'/);
 assert.match(main,/recommended=\{dailyFivePlan\.questions\}/);
});

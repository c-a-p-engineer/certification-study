import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {answerKeys,arenaDeck,isExactAnswer,arenaReport,ARENA_LENGTH} from '../src/reforgeEngine.ts';
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

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {splitReadingSentences} from '../src/readingGuide.ts';
import {shiftTextScale,TEXT_SCALES} from '../src/readability.ts';
import {applyStudyAttempt,gradeAnswer} from '../src/studyAttempt.ts';

const ui=readFileSync('src/reborn/RebornApp.tsx','utf8');
const css=readFileSync('src/reborn/reborn.css','utf8');
const spec=readFileSync('docs/SPECIFICATION.md','utf8');
test('one tap on a single choice uses the selected index, not stale React state',()=>{
 const handler=ui.slice(ui.indexOf('function selectAnswer('),ui.indexOf('function advance()'));
 assert.match(handler,/if\(current\.answers\)/);
 assert.match(handler,/commit\(\[id\]\)/);
 assert.match(handler,/function commit\(answered:readonly number\[\]=chosen\)/);
 assert.match(handler,/isCorrect\(current,answered\)/);
 assert.match(handler,/locked\.current=true/);
 assert.match(handler,/applyStudyAttempt\(progress,event\)/);
 assert.match(handler,/setProgress\(p=>applyStudyAttempt\(p,event\)\.progress\)/);
 assert.match(handler,/if\(activeExam\)\{advance\(\);return\}/);
 assert.equal(ui.includes('どのくらい自信がある'),false);
 assert.equal(ui.includes('rb-confidence'),false);
 assert.equal(ui.includes('setConfidence'),false);
 assert.equal(ui.includes('自信があった誤答'),false);
});
test('multiple choice still requires confirmation and exact-set grading',()=>{
 assert.ok(ui.includes('{current.answers&&<button className="rb-start rb-submit"'));
 assert.ok(ui.includes('onClick={()=>commit()}'));
 assert.ok(ui.includes('setChosen(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])'));
 assert.equal(gradeAnswer([1,3],[3,1]),true);
 assert.equal(gradeAnswer([1],[3,1]),false);
 assert.equal(gradeAnswer([1,1],[1,3]),false);
});
test('sentence grouping preserves author source exactly including Japanese punctuation',()=>{
 const samples=['AWSの構成を決めます。次の条件です！最後はどれ？','RTOは短い。RPOも短い。','VPC, S3, IAM'];
 for(const input of samples)assert.equal(splitReadingSentences(input).join(''),input);
 assert.ok(ui.includes("readReadingGuide"));
 assert.ok(ui.includes("saveReadingGuide"));
 assert.ok(ui.includes("splitReadingSentences(current.question)"));
 assert.ok(ui.includes("splitReadingSentences(current.choices[original])"));
 assert.ok(ui.includes("splitReadingSentences(expandTerms(current.explanation))"));
});
test('existing readability preferences and controls are preserved without altering grading',()=>{
 assert.deepEqual(TEXT_SCALES,['compact','small','standard','large','extra']);
 assert.equal(shiftTextScale('extra',1),'extra');
 assert.equal(shiftTextScale('compact',-1),'compact');
 assert.ok(ui.includes('readTextScale'));
 assert.ok(ui.includes('saveTextScale'));
 assert.ok(ui.includes('文ごとに読む'));
 assert.ok(ui.includes('文字を大きくする'));
 assert.ok(ui.includes('文字を小さくする'));
 assert.ok(css.includes('.rb-reading-extra .rb-question h1'));
 assert.ok(css.includes('.rb-reading-sentence'));
 assert.ok(css.includes('min-height:44px'));
 assert.ok(spec.includes('高速解答フロー'));
});
test('canonical reward receipts remain idempotent, including immediate same-day replay',()=>{
 const progress={xp:0,best:0,answered:0,correct:0,mistakes:[],domains:{},reviews:{}};
 const event={attemptId:'rapid-run-1:0:saa-001',questionId:'saa-001',domain:'セキュリティ',correct:true,combo:1,mode:'daily',boss:false,at:Date.parse('2026-11-21T12:00:00+09:00')};
 const first=applyStudyAttempt(progress,event);
 assert.equal(first.reward.credited,true);
 assert.equal(applyStudyAttempt(first.progress,event).reward.credited,false);
 const replay=applyStudyAttempt(first.progress,{...event,attemptId:'rapid-run-2:0:saa-001'});
 assert.equal(replay.reward.baseXp,0);
 assert.equal(replay.reward.campaign?.damage??0,0);
 const exam=applyStudyAttempt(progress,{...event,attemptId:'rapid-exam:0:saa-001',mode:'exam'});
 assert.equal(exam.reward.totalXp,0);
});

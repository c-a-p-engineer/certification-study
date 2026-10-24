const secondary=readFileSync('src/HomeSecondaryPanels.tsx','utf8');
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {normalizeAnswerHistory,appendAnswerEvent,growthSummary,MAX_EVENTS} from '../src/growthAnalytics.ts';
const date='2026-10-24';
const make=(id,correct,firstAttempt,due=false,recovery=false)=>({id,domain:'セキュリティ',day:date,correct,firstAttempt,due,recovery,exam:false});
test('old saves have unknown granular metrics rather than manufactured performance',()=>{
 const summary=growthSummary(undefined,{'2026-10-23':{answered:5,correct:3}},{'セキュリティ':{answered:50,correct:30}},7,date);
 assert.equal(summary.events,0);
 assert.equal(summary.first.rate,null);assert.equal(summary.repeat.rate,null);
 assert.equal(summary.missingOldHistory,true);
 assert.equal(summary.perDomain[0].rate,60);
});
test('first-time, review, due and recovery accuracy are measured only from events',()=>{
 const events=[make('a',true,true),make('b',false,true),make('c',true,false,true,true),make('d',false,false,true,true)];
 const summary=growthSummary(events,{[date]:{answered:4,correct:2}},{'セキュリティ':{answered:4,correct:2}},30,date);
 assert.equal(summary.first.rate,50);assert.equal(summary.repeat.rate,50);
 assert.equal(summary.due.rate,50);assert.equal(summary.recovery.rate,50);
 assert.equal(summary.days[0].rate,50);
});
test('malformed entries discarded; history capped without changing aggregate XP',()=>{
 assert.equal(normalizeAnswerHistory([{id:'?',day:'broken'}]).length,0);
 const events=appendAnswerEvent(Array.from({length:MAX_EVENTS+2},(_,i)=>make('q'+i,true,true)),make('q'+(MAX_EVENTS+2),true,true));
 assert.equal(events.length,MAX_EVENTS);assert.equal(events[0].id,'q3');
});
test('analytics are visible on home dashboard, not an exam pass prediction',()=>{
 const main=readFileSync('src/main.tsx','utf8');
const reducer=readFileSync('src/studyAttempt.ts','utf8');
 const panel=readFileSync('src/GrowthDashboard.tsx','utf8');
 assert.ok(reducer.includes('appendAnswerEvent(source.answerHistory'));
 assert.ok(secondary.includes('<GrowthDashboard {...growth}/>'));
 assert.ok(panel.includes('導入前の回答を復元・推定した値ではありません'));
 assert.ok(panel.includes('合格確率ではありません'));
});

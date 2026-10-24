import test from 'node:test';import assert from 'node:assert/strict';
import {measuredDelayedRecall,DELAY_BUCKETS} from '../src/delayedRecallMetrics.ts';
const e=(id,day,correct,exam=false)=>({id,domain:'セキュリティ',day,correct,firstAttempt:false,due:true,recovery:false,exam,mode:exam?'exam':'normal'});
test('one/two/three/seven/fourteen-day observed return samples use unique question keys',()=>{
 const data=[
 e('a','2026-10-01',false),e('a','2026-10-02',true),
 e('b','2026-10-01',false),e('b','2026-10-08',false),
 e('c','2026-10-01',false),e('c','2026-10-16',true)];
 const results=measuredDelayedRecall(data,'2026-10-24');
 assert.deepEqual(results.map(x=>x.days),[1,3,7,14]);
 assert.deepEqual(results.map(x=>x.uniqueQuestions),[3,2,2,1]);
 assert.deepEqual(results.map(x=>x.correct),[2,1,1,1]);
 assert.deepEqual(results.map(x=>x.rate),[67,50,50,100]);
});
test('same-day repeats and exam events cannot fabricate retained learning',()=>{
 const data=[e('a','2026-10-21',false),e('a','2026-10-21',true),e('a','2026-10-22',true,true)];
 const summary=measuredDelayedRecall(data,'2026-10-24');
 assert.ok(summary.every(x=>x.uniqueQuestions===0&&x.rate===null));
});
test('latest eligible return per question drives observed rate; no inference from missing old dates',()=>{
 const data=[e('a','2026-10-01',true),e('a','2026-10-08',false),e('a','2026-10-16',true),e('b','2026-10-24',true)];
 const results=measuredDelayedRecall(data,'2026-10-24');
 assert.deepEqual(results.map(x=>x.uniqueQuestions),[1,1,1,0]);
 assert.deepEqual(results.map(x=>x.correct),[1,1,1,0]);
 assert.equal(measuredDelayedRecall([], '2026-10-24')[0].rate,null);
});
test('calendar-day gaps are stable across DST without fabricating extra days',()=>{
 const events=[e('a','2026-03-07',false),e('a','2026-03-08',true)];
 assert.deepEqual(measuredDelayedRecall(events,'2026-03-09').map(x=>x.uniqueQuestions),[1,0,0,0]);
});

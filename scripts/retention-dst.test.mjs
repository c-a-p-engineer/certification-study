import test from 'node:test';import assert from 'node:assert/strict';
import {eligibleForDelayedRecall,recordDelayedRecallReward,planRetentionQuest} from '../src/retentionQuest.ts';
/** Node's local time follows TZ, so test actual DST boundary calendar days independently of UTC 24h offsets. */
test('spring-forward day uses local calendar boundary for due retrieval and once-per-day reward',()=>{
 const original=process.env.TZ;process.env.TZ='America/New_York';
 try{
  const previous=new Date(2026,2,7,23,30).getTime(); // March 7 EST
  const now=new Date(2026,2,8,12,0).getTime(); // March 8 EDT, 23-hour transition
  assert.equal(new Date(previous).getDate(),7);assert.equal(new Date(now).getDate(),8);
  const review={dueAt:now-1000,lastReviewedAt:previous,streak:1,lapses:2,intervalDays:1};
  assert.equal(eligibleForDelayedRecall(review,now),true);
  const a=recordDelayedRecallReward(undefined,'saa-001',review,true,true,now);
  assert.equal(a.award,25);
  assert.equal(recordDelayedRecallReward(a.state,'saa-001',review,true,true,now).award,0);
  const current={...review,lastReviewedAt:new Date(2026,2,8,0,1).getTime()};
  assert.equal(eligibleForDelayedRecall(current,now),false);
  assert.equal(planRetentionQuest([{id:'saa-001',domain:'耐障害性',question:'RTO と RPOの実務判断'}],{'saa-001':review},5,now).questions.length,1);
 }finally{if(original===undefined)delete process.env.TZ;else process.env.TZ=original}
});
test('fall-back repeated clock hour is same calendar day and cannot create bonus twice',()=>{
 const original=process.env.TZ;process.env.TZ='America/New_York';
 try{
  const early=new Date('2026-11-01T01:30:00-04:00').getTime();
  const later=new Date('2026-11-01T01:30:00-05:00').getTime();
  assert.ok(later>early);
  const review={dueAt:early-10,lastReviewedAt:early,streak:2,lapses:0,intervalDays:1};
  assert.equal(eligibleForDelayedRecall(review,later),false);
  assert.equal(recordDelayedRecallReward(undefined,'saa-001',review,true,true,later).award,0);
  const before=new Date(2026,9,31,22,30).getTime();
  assert.equal(eligibleForDelayedRecall({...review,lastReviewedAt:before},later),true);
 }finally{if(original===undefined)delete process.env.TZ;else process.env.TZ=original}
});

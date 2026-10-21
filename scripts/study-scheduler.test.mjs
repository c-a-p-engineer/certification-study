import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY_MS, scheduleReview, reviewDue, dueQuestionIds } from '../src/studyScheduler.ts';

const now=Date.UTC(2026,9,21,0);
test('first successful retrieval is due after one day',()=>{
 const item=scheduleReview(undefined,true,now);
 assert.equal(item.streak,1);assert.equal(item.intervalDays,1);
 assert.equal(item.dueAt,now+DAY_MS);
 assert.equal(reviewDue(item,now),false);
 assert.equal(reviewDue(item,now+DAY_MS),true);
});
test('spaced intervals expand and cap for consecutive successful retrievals',()=>{
 let current;
 for(const expected of [1,3,7,14,30,60,60]){
  current=scheduleReview(current,true,now);
  assert.equal(current.intervalDays,expected);
 }
});
test('incorrect retrieval resets interval and records lapse',()=>{
 const trained=scheduleReview(scheduleReview(undefined,true,now),true,now);
 const failed=scheduleReview(trained,false,now);
 assert.equal(failed.streak,0);assert.equal(failed.intervalDays,1);assert.equal(failed.lapses,1);
});
test('due selection filters and orders questions without assigning unseen items a due date',()=>{
 const a=scheduleReview(undefined,true,now);
 const b=scheduleReview(undefined,false,now+1000);
 const found=dueQuestionIds({a,b},['a','b','c'],now+2*DAY_MS);
 assert.deepEqual(found,['a','b']);
});

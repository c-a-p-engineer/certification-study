import test from 'node:test';
import assert from 'node:assert/strict';
import {TOPICS,topicFor,masteryByTopic} from '../src/mastery.ts';
import {DAY_MS,scheduleReview,rateReview} from '../src/studyScheduler.ts';

test('topic rules classify a network question',()=>{
 assert.equal(topicFor({question:'VPC と NAT Gateway の通信経路は？',choices:[],explanation:'VPCを考える'}),'VPC / ネットワーク');
});
test('mastery is based on distinct questions, due dates and retained streaks',()=>{
 const questions=[{id:'a',question:'RDS database',choices:[],explanation:'Aurora'},{id:'b',question:'RDS database',choices:[],explanation:'Aurora'}];
 const stats=masteryByTopic(questions,{a:{streak:3,lapses:1,dueAt:1},b:{streak:0,lapses:2,dueAt:1000}},10);
 assert.equal(stats['データベース'].seen,2);
 assert.equal(stats['データベース'].due,1);
 assert.equal(stats['データベース'].retained,1);
 assert.equal(stats['データベース'].lapses,3);
});
test('topic list has stable unique labels',()=>{assert.equal(new Set(TOPICS.map(t=>t.name)).size,TOPICS.length)});
test('confidence controls future review without changing quiz grade',()=>{
 const before=scheduleReview(undefined,true,1000);
 const again=rateReview(before,'again',5000);
 const unsure=rateReview(before,'unsure',5000);
 assert.equal(again.dueAt,5000+DAY_MS);
 assert.equal(again.streak,0);
 assert.equal(unsure.dueAt,5000+DAY_MS);
 assert.equal(rateReview(before,'good',5000),before);
});

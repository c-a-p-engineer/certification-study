import test from 'node:test';
import assert from 'node:assert/strict';
import {TOPICS} from '../src/mastery.ts';
import {SKILL_STAGES,skillTier,buildSkillTree} from '../src/skillTree.ts';
const questions=Array.from({length:9},(_,i)=>({id:'q'+i,question:'VPC と NAT Gateway の設計 '+i,choices:[],explanation:'CIDR'}));
const review=(streak)=>({streak,lapses:0,dueAt:9999999999999});
test('unseen topics start at zero without fictional past study',()=>{
 const nodes=buildSkillTree(questions,{},100);
 assert.equal(nodes.length,TOPICS.length);
 assert.equal(nodes.find(n=>n.name==='VPC / ネットワーク').tier,0);
 assert.equal(nodes.find(n=>n.name==='VPC / ネットワーク').poolSize,9);
 assert.equal(SKILL_STAGES.length,4);
});
test('skill evolution requires distinct exploration AND repeated recall',()=>{
 const stats={seen:8,retained:0};
 assert.equal(skillTier({seen:0,retained:0}),0);
 assert.equal(skillTier({seen:1,retained:0}),1);
 assert.equal(skillTier({seen:4,retained:0}),1);
 assert.equal(skillTier({seen:4,retained:1}),2);
 assert.equal(skillTier(stats),1);
 assert.equal(skillTier({seen:8,retained:4}),3);
});
test('tree progress updates from existing review records without storage migrations',()=>{
 const first=Object.fromEntries(questions.slice(0,4).map((q,i)=>[q.id,review(i===0?3:1)]));
 const mid=buildSkillTree(questions,first,100).find(x=>x.name==='VPC / ネットワーク');
 assert.equal(mid.seen,4);
 assert.equal(mid.retained,1);
 assert.equal(mid.tier,2);
 assert.equal(mid.nextSeen,8);
 assert.equal(mid.nextRetained,4);
 const full=Object.fromEntries(questions.slice(0,8).map((q,i)=>[q.id,review(i<4?3:1)]));
 const end=buildSkillTree(questions,full,100).find(x=>x.name==='VPC / ネットワーク');
 assert.equal(end.tier,3);
 assert.equal(end.progress,100);
});

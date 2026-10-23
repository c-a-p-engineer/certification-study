import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {smartTargets,planSmartQuest,SMART_PROFILE_KEY,readSmartProfile,writeSmartProfile,SMART_LABELS} from '../src/smartQuest.ts';
const make=(id,domain='セキュリティ',scenario=false)=>({id,domain,question:'A'.repeat(scenario?100:55)+id,distractorReasons:scenario?['x','x','x','x']:undefined,tags:scenario?['複合設計判断']:[]});
const base={reviews:{},mistakes:[],domains:{},recent:new Set(),now:1000};
test('profiles allocate ten question targets while preserving exactly ten total',()=>{
 assert.deepEqual(smartTargets(10,'balanced'),{due:3,recovery:2,unseen:3,challenge:2});
 assert.deepEqual(smartTargets(10,'review'),{due:5,recovery:3,unseen:1,challenge:1}); // fractional allocation
 for(const profile of ['balanced','review','explore']){
  const v=smartTargets(17,profile);assert.equal(Object.values(v).reduce((a,b)=>a+b,0),17);
 }
});
test('planned questions reveal reasons and remain distinct despite overlapping buckets',()=>{
 const questions=[...Array.from({length:5},(_,i)=>make('due'+i)),...Array.from({length:5},(_,i)=>make('bad'+i)),...Array.from({length:10},(_,i)=>make('new'+i)),...Array.from({length:4},(_,i)=>make('case'+i,'パフォーマンス',true))];
 const reviews=Object.fromEntries(questions.slice(0,10).map((q,i)=>[q.id,{dueAt:i<5?0:90000,streak:1,lapses:1}]));
 const result=planSmartQuest(questions,10,{...base,reviews,mistakes:questions.slice(5,10).map(q=>q.id)},'balanced');
 assert.equal(result.questions.length,10);
 assert.equal(new Set(result.questions.map(x=>x.id)).size,10);
 assert.equal(result.counts.due,3);assert.equal(result.counts.recovery,2);
 assert.ok(Object.values(result.reasons).every(x=>Object.values(SMART_LABELS).includes(x)));
});
test('scarcity falls back to other questions instead of displaying a fake allocation',()=>{
 const questions=Array.from({length:10},(_,i)=>make('only'+i));
 const result=planSmartQuest(questions,10,base,'review');
 assert.equal(result.questions.length,10);
 assert.equal(result.counts.unseen,10);
 assert.equal(result.counts.recovery,0);
});
test('profile selection persists separately and old mission data remains legal',()=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');const values=new Map();
 try{Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}});
  assert.equal(readSmartProfile(),'balanced');writeSmartProfile('explore');assert.equal(readSmartProfile(),'explore');assert.equal(values.get(SMART_PROFILE_KEY),'explore');
 }finally{if(old)Object.defineProperty(globalThis,'localStorage',old);else delete globalThis.localStorage}
 const main=readFileSync('src/main.tsx','utf8');
 assert.ok(main.includes('planSmartQuest(subset'));
 assert.ok(main.includes('setSmartWhy(saved.smartWhy??{})'));
 assert.ok(main.includes('出題理由'));
 const mission=readFileSync('src/missionSave.ts','utf8');assert.ok(mission.includes('smartWhy?:Record<string,string>'));
});

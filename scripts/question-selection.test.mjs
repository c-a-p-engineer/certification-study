import test from 'node:test';
import assert from 'node:assert/strict';
import {selectVaried,isScenarioQuestion,serviceTopics,rememberQuestionSelection,readRecentQuestions,RECENT_QUESTIONS_KEY} from '../src/questionSelection.ts';
import {loadQuestions} from './question-source.mjs';

const bank=loadQuestions();
const scenarios=bank.filter(isScenarioQuestion);
const seen=new Set();

test('scenario expansion contains at least 40 original long-form questions, across all domains',()=>{
 assert.ok(bank.length>=348);
 assert.equal(scenarios.length,48);
 for(const domain of ['セキュリティ','耐障害性','パフォーマンス','コスト最適化']){
  const matches=scenarios.filter(x=>x.domain===domain);
  assert.equal(matches.length,({'セキュリティ':16,'耐障害性':11,'パフォーマンス':11,'コスト最適化':10})[domain],domain);
  assert.ok(matches.every(q=>q.question.length>=90),domain);
  assert.equal(matches.filter(q=>q.answers).length,2,domain);
 }
});
test('each scenario has exact official docs source and persuasive per-option analysis',()=>{
 for(const q of scenarios){
  assert.ok(q.reference.startsWith('https://docs.aws.amazon.com/'),q.id);
  assert.ok(q.distractorReasons.length===q.choices.length,q.id);
  assert.ok(q.distractorReasons.every(r=>r.length>=15),q.id);
  assert.equal(q.answers?q.choices.length>=5:q.choices.length===4,true,q.id);
  assert.equal(new Set(q.choices).size,q.choices.length,q.id);
  assert.ok(q.explanation.length>=60,q.id);
  assert.ok(q.tags.includes('複合設計判断'),q.id);
 }
});
test('scenario questions receive priority against otherwise unseen one-line flashcards',()=>{
 const examples=[{id:'basic1',domain:'セキュリティ',question:'S3はどれ？',tags:[]},{id:'basic2',domain:'セキュリティ',question:'EC2はどれ？',tags:[]},...scenarios.slice(0,2)];
 const selected=selectVaried(examples,2,seen,seen,()=>.5);
 assert.ok(selected.every(isScenarioQuestion));
});
test('do not immediately repeat recently shown scenarios when unseen alternatives exist',()=>{
 const recent=new Set(scenarios.slice(0,4).map(q=>q.id));
 const available=scenarios.slice(0,8);
 const chosen=selectVaried(available,4,seen,recent,()=>.1);
 assert.ok(chosen.every(q=>!recent.has(q.id)),chosen.map(x=>x.id).join(','));
});
test('themes are extracted to discourage closely related services',()=>{
 assert.ok(serviceTopics(scenarios.find(x=>x.id==='saa-317')).some(s=>s.includes('cloudfront')));
 const candidates=scenarios.filter(x=>x.domain==='セキュリティ');
 assert.equal(selectVaried(candidates,100,seen,seen,()=>0).length,candidates.length);
 assert.equal(new Set(selectVaried(candidates,100,seen,seen,()=>0).map(x=>x.id)).size,candidates.length);
 assert.deepEqual(selectVaried(candidates,0,seen,seen,()=>0),[]);
});
test('recent set remembers 120 most recent selections, updating reselected IDs',()=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const records=new Map();
 try{
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>records.get(key)??null,setItem:(key,v)=>records.set(key,v)}});
  rememberQuestionSelection(['a','b','c']);
  assert.deepEqual(readRecentQuestions(),['a','b','c']);
  rememberQuestionSelection(['a','d']);
  assert.deepEqual(readRecentQuestions(),['b','c','a','d']);
  rememberQuestionSelection(Array.from({length:130},(_,i)=>'id-'+i));
  assert.equal(readRecentQuestions().length,120);
  assert.equal(JSON.parse(records.get(RECENT_QUESTIONS_KEY)).at(-1),'id-129');
 }finally{if(old)Object.defineProperty(globalThis,'localStorage',old);else delete globalThis.localStorage}
});

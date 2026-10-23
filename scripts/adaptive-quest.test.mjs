import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectAdaptive,adaptiveReasons} from '../src/adaptiveQuest.ts';
import {loadQuestions} from './question-source.mjs';
const bank=loadQuestions();
const make=(id,domain='セキュリティ')=>({id,domain,question:'AWSの安全なシステム構築 '+id,tags:[id],difficulty:3});
const ctx=(patch={})=>({reviews:{},mistakes:[],recent:new Set(),domains:{},now:1_000,...patch});
test('adaptive prefers due review, past mistake and new learning opportunities',()=>{
 const items=[make('ignored'),make('due'),make('mistake'),make('unseen')];
 const reviews={ignored:{dueAt:99999,streak:5,lapses:0},due:{dueAt:100,streak:1,lapses:1},mistake:{dueAt:99999,streak:1,lapses:2}};
 const selected=selectAdaptive(items,3,ctx({reviews,mistakes:['mistake'],recent:new Set(['ignored'])}),()=>0);
 assert.equal(selected[0].id,'due');
 assert.ok(selected.some(q=>q.id==='mistake'));
 assert.ok(selected.some(q=>q.id==='unseen'));
});
test('recent questions are penalized and all selections are unique',()=>{
 const items=Array.from({length:12},(_,i)=>make('s-'+i,i%2===0?'セキュリティ':'耐障害性'));
 const selected=selectAdaptive(items,8,ctx({recent:new Set(items.slice(0,4).map(x=>x.id))}),()=>.5);
 assert.ok(selected.every(q=>!['s-0','s-1','s-2','s-3'].includes(q.id)));
 assert.equal(new Set(selected.map(q=>q.id)).size,8);
});
test('weak domains apply only when at least four answers provide a signal',()=>{
 const items=[make('strong','セキュリティ'),make('weak','耐障害性')];
 const domains={'セキュリティ':{answered:20,correct:19},'耐障害性':{answered:20,correct:5}};
 assert.equal(selectAdaptive(items,1,ctx({domains}),()=>0)[0].id,'weak');
 assert.equal(adaptiveReasons(items,ctx({domains})).weakDomain,1);
 assert.equal(adaptiveReasons(items,ctx({domains:{'耐障害性':{answered:1,correct:0}}})).weakDomain,0);
});
test('real AWS question bank supports 10 diverse selections and zero-count edge cases',()=>{
 assert.equal(selectAdaptive(bank,0,ctx()).length,0);
 const result=selectAdaptive(bank,10,ctx({recent:new Set(bank.slice(0,25).map(q=>q.id))}),()=>.42);
 assert.equal(result.length,10);
 assert.equal(new Set(result.map(q=>q.id)).size,10);
 assert.ok(result.some(q=>q.question.length>85));
});
test('SMART QUEST is isolated from 65-question exam and persisted on normal mission saves',()=>{
 const src=readFileSync('src/main.tsx','utf8');const mission=readFileSync('src/missionSave.ts','utf8');
 assert.ok(src.includes('adaptive?selectAdaptive('));
 assert.ok(src.includes('adaptiveMode'));assert.ok(src.includes('SMART QUEST'));
 assert.ok(src.includes('exam?examPool('));
 assert.ok(src.includes('adaptive:adaptiveMode'));
 assert.ok(mission.includes('adaptive?:boolean'));
 assert.ok(src.includes("window.requestAnimationFrame(()=>questionRef.current?.scrollIntoView"));
});

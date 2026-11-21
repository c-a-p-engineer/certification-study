import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {arcadeEligible,blitzDeck,blitzPoints,blitzAllowed,questDeck,applyQuestAnswer,startQuest,grantQuestSkill,finishQuest,QUEST_ROUTES,QUEST_STAGE_SIZE,QUEST_STAGES} from '../src/reborn/soloArcadeEngine.ts';
import {applyStudyAttempt} from '../src/studyAttempt.ts';

const domains=['セキュリティ','耐障害性','パフォーマンス','コスト最適化'];
const bank=Array.from({length:120},(_,i)=>({id:'q'+i,domain:domains[i%4],question:'Q'+i+'? ',choices:['A','B','C','D'],answer:i%4,explanation:'reason',reference:'https://docs.aws.amazon.com/'}));
test('quest routes have five unique valid questions for each phase, including boss',()=>{
 const first=questDeck(bank,QUEST_ROUTES[0][0],50,[]);
 assert.equal(first.length,QUEST_STAGE_SIZE);
 assert.ok(first.every(q=>q.domain==='セキュリティ'));
 const second=questDeck(bank,QUEST_ROUTES[1][1],60,first.map(q=>q.id));
 assert.equal(second.length,QUEST_STAGE_SIZE);
 assert.ok(second.every(q=>q.domain==='コスト最適化'));
 const boss=questDeck(bank,{id:'boss',title:'boss',description:'mixed'},77,[...first,...second].map(q=>q.id));
 assert.equal(boss.length,QUEST_STAGE_SIZE);
 assert.equal(new Set([...first,...second,...boss].map(q=>q.id)).size,QUEST_STAGE_SIZE*QUEST_STAGES);
 assert.deepEqual(questDeck(bank,QUEST_ROUTES[0][0],50,[]),first);
});
test('quest builds affect only run hp and score, not answer keys or learning state',()=>{
 let a=startQuest();
 assert.equal(a.hp,100);
 a=applyQuestAnswer(a,false);assert.equal(a.hp,85);
 let b=grantQuestSkill(a,'shield');assert.equal(b.stage,1);
 b=applyQuestAnswer(b,false);assert.equal(b.hp,77);
 const boost=grantQuestSkill(b,'amplifier');assert.equal(boost.stage,2);
 assert.equal(applyQuestAnswer(boost,true).score,150);
 assert.equal(applyQuestAnswer(a,true).score,100);
 assert.equal(finishQuest(boost).cleared,true);
 let dead=startQuest();for(let i=0;i<7;i++)dead=applyQuestAnswer(dead,false);
 assert.equal(dead.hp,0);assert.equal(dead.failed,true);
 assert.equal(applyQuestAnswer(dead,true),dead);
});
test('blitz only selects short single-choice complete questions; favors previously learned',()=>{
 const candidates=[...bank,{...bank[0],id:'long',question:'a'.repeat(150)},{...bank[0],id:'multi',answers:[0,1],answer:undefined}];
 assert.equal(arcadeEligible(candidates[120]),false);
 assert.equal(arcadeEligible(candidates[121]),false);
 const set=blitzDeck(candidates,['q21','q19'],22,10);
 assert.deepEqual(new Set(set.slice(0,2).map(x=>x.id)),new Set(['q21','q19']));
 assert.equal(set.length,10);assert.equal(new Set(set.map(x=>x.id)).size,10);
 assert.deepEqual(set,blitzDeck(candidates,['q21','q19'],22,10));
});
test('timer prevents late scoring and scoring never mutates canonical XP',()=>{
 assert.equal(blitzAllowed(90000,89999,false),true);
 assert.equal(blitzAllowed(90000,90000,false),false);
 assert.equal(blitzAllowed(90000,89999,true),false);
 assert.equal(blitzPoints(false,9,0),0);
 assert.ok(blitzPoints(true,3,1)>blitzPoints(true,3,30));
 const progress={xp:0,best:0,answered:0,correct:0,mistakes:[],domains:{},reviews:{}};
 const event={attemptId:'arcade:0:q1',questionId:'q1',domain:'セキュリティ',correct:true,combo:1,mode:'daily',boss:false,at:Date.parse('2026-11-21T13:00:00+09:00')};
 const one=applyStudyAttempt(progress,event);
 assert.ok(one.reward.totalXp>0);
 assert.equal(applyStudyAttempt(one.progress,event).reward.credited,false);
 assert.equal(applyStudyAttempt(one.progress,{...event,attemptId:'arcade2:0:q1'}).reward.baseXp,0);
});
test('solo arcade UI smoke-renders both entry states and preserves source answer semantics',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const {default:SoloArcade}=await vite.ssrLoadModule('/src/reborn/SoloArcade.tsx');
  for(const kind of ['quest','blitz']){
   const markup=renderToStaticMarkup(React.createElement(SoloArcade,{kind,bank,learnedIds:[],onRecord:()=>true,onSound:()=>{},onExit:()=>{}}));
   assert.match(markup,/ホームへ/);
   assert.ok(markup.includes(kind==='quest'?'ルートを選ぼう':'BLITZ 90 SEC'));
  }
  const app=readFileSync('src/reborn/RebornApp.tsx','utf8');
  assert.ok(app.includes('startArcade(\'quest\')'));
  assert.ok(app.includes('startArcade(\'blitz\')'));
  assert.ok(app.includes('applyStudyAttempt(progress,event)'));
 }finally{await vite.close()}
});

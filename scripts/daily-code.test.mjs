import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {CONCEPTS} from '../src/termGuide.ts';
import {DAILY_CODE_SETS,dailyCodePuzzle,dailyMatchResult,dailyCodeScore,readDailyBest,writeDailyBest,DAILY_CODE_KEY} from '../src/reborn/dailyCodeEngine.ts';

test('every preset has four distinct, already-curated AWS services and distinct meanings',()=>{
 const catalog=new Map(CONCEPTS.map(c=>[c.id,c]));
 assert.ok(DAILY_CODE_SETS.length>=7);
 for(const ids of DAILY_CODE_SETS){
  assert.equal(ids.length,4);
  assert.equal(new Set(ids).size,4);
  const terms=ids.map(id=>catalog.get(id));
  assert.ok(terms.every(x=>x?.category==='AWSサービス'));
  assert.equal(new Set(terms.map(x=>x.meaning)).size,4);
  assert.ok(terms.every(x=>x?.note&&x.reading));
 }
});
test('local-date daily puzzle has deterministic selection and answer mapping',()=>{
 const a=dailyCodePuzzle('2026-11-21');
 assert.deepEqual(a,dailyCodePuzzle('2026-11-21'));
 assert.equal(a.answers.length,4);assert.equal(a.clues.length,4);
 assert.deepEqual(new Set(a.answers.map(t=>t.id)),new Set(a.clues.map(t=>t.id)));
 assert.equal(new Set(a.answers.map(t=>t.id)).size,4);
 assert.throws(()=>dailyCodePuzzle('tomorrow'));
});
test('matching is explicit and answered clues cannot be reused or farmed',()=>{
 assert.equal(dailyMatchResult('ec2','s3',[]),'wrong');
 assert.equal(dailyMatchResult('ec2','ec2',[]),'correct');
 assert.equal(dailyMatchResult('ec2','ec2',['ec2']),'already');
 assert.equal(dailyMatchResult('s3','ec2',['ec2']),'already');
 assert.equal(dailyCodeScore(0),400);
 assert.equal(dailyCodeScore(4),300);
 assert.equal(dailyCodeScore(50),0);
});
test('only best score per day persists to a bounded local-only game record',()=>{
 const data=new Map();
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const day='2026-11-21';
 assert.equal(readDailyBest(day,storage),0);
 writeDailyBest(day,325,storage);
 writeDailyBest(day,275,storage);
 assert.equal(readDailyBest(day,storage),325);
 writeDailyBest(day,400,storage);
 assert.equal(readDailyBest(day,storage),400);
 assert.ok(data.get(DAILY_CODE_KEY).includes(day));
 assert.equal(data.has('certification-overdrive-progress-v1'),false);
});
test('React renders mobile daily code without any extra AWS answer writer',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const {default:DailyCode}=await vite.ssrLoadModule('/src/reborn/DailyCode.tsx');
  const markup=renderToStaticMarkup(React.createElement(DailyCode,{onExit:()=>{},onSound:()=>{},onHaptic:()=>{}}));
  for(const label of ['DAILY CODE','サービスを結び付けろ','説明を選ぶ','サービスを選ぶ','0 / 4 MATCH'])assert.ok(markup.includes(label),label);
  const app=readFileSync('src/reborn/RebornApp.tsx','utf8');
  const daily=readFileSync('src/reborn/DailyCode.tsx','utf8');
  assert.ok(app.includes('startDailyCode'));
  assert.ok(app.includes("screen==='daily-code'"));
  assert.ok(daily.includes('writeDailyBest'));
  assert.ok(!daily.includes('applyStudyAttempt'));
  assert.ok(!daily.includes('setProgress('));
 }finally{await vite.close()}
});

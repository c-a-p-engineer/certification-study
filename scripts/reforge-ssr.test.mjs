import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

/** Rendered component contract only. Real browser, audio output and Android still need separate verification. */
test('REFORGED ARENA renders first encounter and never leaks correct answer before commit',async()=>{
 const bank=JSON.parse(readFileSync('src/generated/questions.json','utf8'));
 assert.ok(bank.length>=5,'question bank must be generated');
 const app=createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 const server=await app;
 try{
  const {default:Arena}=await server.ssrLoadModule('/src/ReforgeArena.tsx');
  let attempted=0,sounded=0;
  const props={
   questions:bank,recommended:bank.slice(0,5),reasons:{[bank[0].id]:'初回学習'},
   radar:[],enemy:{id:'slime',name:'TRAINING SLIME',hp:40,maxHp:40},
   onExit:()=>{},onSound:()=>{sounded++},onAttempt:()=>{attempted++;throw Error('render must not grade')},
   muted:true,effectsEnabled:false,reduced:true,onToggleSound:()=>{},onToggleEffects:()=>{}
  };
  const html=renderToStaticMarkup(React.createElement(Arena,props));
  for(const marker of ['REFORGED / LEARNING ARENA','ENCOUNTER 1 / 5','PREDICT','SE OFF','FX OFF','TRAINING SLIME','ホームへ戻る']){
   assert.ok(html.includes(marker),marker);
  }
  assert.ok(!html.includes('WHY IT WORKS'),'explanation must remain hidden before grading');
  assert.ok(!html.includes('正解の構成'),'answer key must remain hidden before grading');
  assert.ok(!html.includes('DECISION BREAK'),'no alternate answer leak');
  assert.equal(attempted,0);
  assert.equal(sounded,0);
  assert.ok(html.includes('aria-pressed="false"'),'settings are accessible without action');
  assert.ok(html.includes('disabled=""'),'reduced-motion FX control remains disabled');
 }finally{await server.close()}
});

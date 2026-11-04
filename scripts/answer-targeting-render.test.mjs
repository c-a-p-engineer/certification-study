import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

test('SSR renders correct targeting states, preserves defaults, never exposes feedback in exams',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
 try{
  const {default:QuizAnswerControls}=await vite.ssrLoadModule('/src/QuizAnswerControls.tsx');
  const question={
   id:'saa-test',domain:'耐障害性',question:'冗長化の条件は？',
   choices:['Multi-AZ','単一AZ','キャッシュ'],answer:0,
   explanation:'テスト',reference:'https://docs.aws.amazon.com/'
  };
  const props={question,choiceOrder:[0,1,2],selected:null,multiChoices:[],
   examMode:false,showChoices:true,readingGuide:false,cinematic:true,combo:0,
   onReveal:()=>{},onToggle:()=>{},onAnswer:()=>{}};
  const render=(patch={})=>renderToStaticMarkup(React.createElement(QuizAnswerControls,{...props,...patch}));
  const ready=render();
  assert.match(ready,/od-target-console/);
  assert.match(ready,/SYSTEM READY/);
  assert.match(ready,/CHARGE/);
  assert.doesNotMatch(ready,/DIRECT HIT/);
  assert.doesNotMatch(ready,/FIRE READY/);
  assert.match(render({selected:0}),/DIRECT HIT/);
  assert.match(render({selected:1}),/SIGNAL BLOCKED/);
  assert.doesNotMatch(render({examMode:true}),/od-target-console/);
  assert.doesNotMatch(render({cinematic:false}),/od-target-console/);
  assert.doesNotMatch(render({showChoices:false}),/od-target-console/);
  const multiple={...question,answer:undefined,answers:[0,2]};
  const partial=render({question:multiple,multiChoices:[0]});
  assert.match(partial,/TARGETS LOCKED/);
  assert.match(partial,/50%/);
  assert.doesNotMatch(partial,/FIRE READY/);
  const charged=render({question:multiple,multiChoices:[0,2]});
  assert.match(charged,/FIRE READY/);
  assert.match(charged,/FIRE/);
  assert.match(charged,/100%/);
  assert.match(charged,/aria-pressed="true"/);
 }finally{await vite.close();}
});

/** Reproducible isolated SSR view timing. This is NOT browser paint or Android frame profiling. */
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

const samples=48,warmups=8;
const bank=JSON.parse(readFileSync('src/generated/questions.json','utf8'));
const source=bank[0];
if(!source||!Array.isArray(source.choices))throw Error('Generated question bank is not ready');
const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{
 const [a,b,c]=await Promise.all([
  server.ssrLoadModule('/src/QuizAnswerControls.tsx'),
  server.ssrLoadModule('/src/HomeProgressSummary.tsx'),
  server.ssrLoadModule('/src/ResultOverview.tsx')
 ]);
 const noop=()=>{};
 const tasks=[
  ['QuizAnswerControls',a.default,{question:source,choiceOrder:source.choices.map((_,i)=>i),selected:null,multiChoices:[],examMode:false,showChoices:true,onReveal:noop,onToggle:noop,onAnswer:noop}],
  ['HomeProgressSummary',b.default,{xp:15000,answered:130,correct:109,reviewDue:18,bestCombo:8}],
  ['ResultOverview',c.default,{correct:8,total:10,exam:false,grade:{letter:'A',percent:80,name:'学習完了'},onNextRank:noop}]
 ];
 for(const [name,Component,props] of tasks){
  for(let i=0;i<warmups;i++)renderToStaticMarkup(React.createElement(Component,props));
  const elapsed=[];
  let htmlBytes=0;
  for(let i=0;i<samples;i++){
   const begin=performance.now();
   const html=renderToStaticMarkup(React.createElement(Component,props));
   elapsed.push(performance.now()-begin);
   htmlBytes=Buffer.byteLength(html,'utf8');
  }
  elapsed.sort((x,y)=>x-y);
  const median=(elapsed[23]+elapsed[24])/2;
  const p95=elapsed[Math.ceil(samples*.95)-1];
  console.log(JSON.stringify({kind:'isolated-node-ssr',component:name,samples,medianMs:Number(median.toFixed(3)),p95Ms:Number(p95.toFixed(3)),htmlBytes,note:'Synthetic server rendering only. No browser layout, hydration or Android frame timing.'}));
 }
}finally{await server.close()}

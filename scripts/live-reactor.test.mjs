import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {reactorCharge} from '../src/reborn/reactorMath.ts';

const read=path=>readFileSync(path,'utf8');
const css=read('src/reborn/reborn.css');
const study=read('src/reborn/RebornApp.tsx');
const solo=read('src/reborn/SoloArcade.tsx');
const code=read('src/reborn/DailyCode.tsx');

test('reactor progress visual is bounded; it never derives or writes XP',()=>{
 for(const [raw,expected] of [[-1,0],[0,0],[2.8,2],[5,5],[500,5],[NaN,0],[Infinity,0]]){
  assert.equal(reactorCharge(raw),expected);
 }
 const source=read('src/reborn/LiveReactor.tsx');
 assert.doesNotMatch(source,/applyStudyAttempt|setProgress|localStorage|setInterval|requestAnimationFrame|AudioContext|navigator\.vibrate/);
 assert.match(source,/aria-hidden="true"/);
 assert.match(source,/Array.from\(\{length:6\}/);
});
test('SSR renders ambient reactor with real progress and input pulse for all game modes',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const {default:LiveReactor}=await vite.ssrLoadModule('/src/reborn/LiveReactor.tsx');
  for(const mode of ['study','exam','quest','blitz','code']){
   const html=renderToStaticMarkup(React.createElement(LiveReactor,{mode,charge:3,pulse:8,reaction:'correct'}));
   assert.match(html,new RegExp('data-reactor-mode="'+mode+'"'));
   assert.match(html,/lrv-orbit-first/);
   assert.match(html,/lrv-sweep-a/);
   assert.match(html,/lrv-impact-correct/);
   assert.match(html,/3\/5/);
   assert.equal((html.match(/lrv-spark lrv-spark-/g)??[]).length,6);
   assert.equal((html.match(/class="is-lit"/g)??[]).length,3);
  }
  const idle=renderToStaticMarkup(React.createElement(LiveReactor,{mode:'exam',charge:0,pulse:0}));
  assert.doesNotMatch(idle,/lrv-impact lrv-impact-/);
  assert.match(idle,/EXAM FOCUS/);
 }finally{await vite.close()}
});
test('reactor appears while actively reading in study, quest, blitz and daily code',()=>{
 assert.match(study,/<LiveReactor mode=\{activeExam\?'exam':'study'\}/);
 assert.match(solo,/<LiveReactor mode=\{isBlitz\?'blitz':'quest'\}/);
 assert.match(solo,/<LiveReactor mode="quest"/);
 assert.match(code,/<LiveReactor mode="code" charge=\{matched.length\} pulse=\{impact\}/);
 assert.match(code,/setFxReaction\('wrong'\)/);
 assert.match(code,/setFxReaction\('correct'\)/);
 assert.match(code,/setFxReaction\('select'\)/);
 assert.match(study,/setLiveReaction\(activeExam\?'select':correct\?'correct':'wrong'\)/);
 assert.match(study,/reaction=\{activeExam\?'idle':liveReaction\}/,'exam should not disclose correctness');
});
test('OFF, HIGH, OS and app reduced-motion settings stop or thin effects',()=>{
 assert.match(css,/\.reborn\.rb-fx-off \.lrv-reactor\{display:none\}/);
 assert.match(css,/\.rb-fx-high \.lrv-spark:nth-child\(n\+4\)\{display:none\}/);
 assert.match(css,/\.rb-fx-high \.lrv-sweep-b,.rb-fx-high \.lrv-orbit-second\{display:none\}/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.reborn\.is-reduced \.lrv-impact/);
 for(const animation of ['lrv-spin','lrv-breathe','lrv-drift','lrv-scan','lrv-impact'])assert.ok(css.includes('@keyframes '+animation));
 assert.match(css,/\.lrv-reactor\{[\s\S]*?height:86px;[\s\S]*?overflow:hidden;/);
 assert.match(css,/@media\(max-width:420px\)/);
 assert.match(css,/\.dc-tile:focus-visible/);
});
test('reactive visuals never alter canonical answer handlers or create timer loops',()=>{
 assert.match(study,/applyStudyAttempt\(progress,event\)/);
 assert.match(solo,/if\(locked.current===receipt\)return/);
 assert.match(code,/dailyMatchResult\(selected,id,matched\)/);
 assert.match(code,/recentlySolved\.current\.add\(id\)/);
 const reactor=read('src/reborn/LiveReactor.tsx');
 assert.doesNotMatch(reactor,/useEffect|useState|setInterval|setTimeout/);
});

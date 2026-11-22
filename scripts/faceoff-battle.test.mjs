import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {createServer} from 'vite';
import {renderToStaticMarkup} from 'react-dom/server';

const read=path=>readFileSync(path,'utf8');

function viewDirection(source){
 const camera=/camera\.position\.set\((-?[\d.]+),([\d.]+),([\d.]+)\)/.exec(source);
 const actor=/root\.rotation\.y=(-?[\d.]+)\+Math\.sin/.exec(source);
 assert.ok(camera,'requires an explicit 3/4 camera');
 assert.ok(actor,'requires an explicit inward-facing yaw');
 const cameraX=Number(camera[1]),cameraZ=Number(camera[3]),yaw=Number(actor[1]);
 return {cameraX,cameraZ,yaw,screenFacing:Math.sin(yaw-Math.atan2(cameraX,cameraZ))};
}
test('hero faces screen-right and enemy faces screen-left in camera projection',()=>{
 const hero=viewDirection(read('src/reborn/questHero3DScene.ts'));
 const enemy=viewDirection(read('src/reborn/questEnemy3DScene.ts'));
 assert.ok(hero.cameraX<0,'hero camera stands on left side');
 assert.ok(enemy.cameraX>0,'enemy camera stands on right side');
 assert.ok(hero.screenFacing>.55,JSON.stringify(hero));
 assert.ok(enemy.screenFacing<-.55,JSON.stringify(enemy));
 assert.ok(hero.yaw>0);
 assert.ok(enemy.yaw<0);
});
test('battle effects are derived from accepted events only, and never award progress',()=>{
 const source=read('src/reborn/BattleEnergyFX.tsx');
 const stage=read('src/reborn/BattleStage.tsx');
 const solo=read('src/reborn/SoloArcade.tsx');
 assert.match(source,/event\.seq>0&&event\.kind!=='idle'/);
 assert.match(source,/key=\{event\.seq\}/);
 assert.match(source,/data-battle-event=\{event\.kind\}/);
 assert.match(source,/combo>=3/);
 assert.match(source,/combo>=5/);
 assert.match(source,/enemyDown&&/);
 assert.match(stage,/<BattleEnergyFX event=\{event\} combo=\{combo\} enemyDown=\{enemyDown\} boss=\{boss\}/);
 assert.equal((solo.match(/<BattleStage appearance=\{appearance\}/g)||[]).length,1,'avoid reset/replay on question→review');
 assert.match(solo,/if\(!onRecord\(current,correct,combo,receipt\)\)/);
 for(const code of ['applyStudyAttempt','setProgress','setInterval','requestAnimationFrame','localStorage','onSound','onHaptic'])assert.doesNotMatch(source,new RegExp(code));
});
test('SSR: neutral idle has zero attack effects, true hit and hurt travel in opposite directions',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const {default:FX}=await vite.ssrLoadModule('/src/reborn/BattleEnergyFX.tsx');
  const idle=renderToStaticMarkup(React.createElement(FX,{event:{seq:0,kind:'idle',damage:0},combo:0,enemyDown:false,boss:false}));
  assert.match(idle,/bfx-atmosphere-player/);
  assert.match(idle,/bfx-atmosphere-enemy/);
  assert.match(idle,/bfx-floor-player/);
  assert.match(idle,/bfx-floor-enemy/);
  assert.doesNotMatch(idle,/bfx-strike/);
  assert.doesNotMatch(idle,/bfx-charged/);
  assert.doesNotMatch(idle,/bfx-defeat-mark/);
  const hit=renderToStaticMarkup(React.createElement(FX,{event:{seq:7,kind:'hit',damage:29},combo:3,enemyDown:false,boss:false}));
  assert.match(hit,/bfx-strike-hit/);
  assert.match(hit,/bfx-charged/);
  assert.match(hit,/data-event-seq="7"/);
  assert.doesNotMatch(hit,/bfx-finisher/);
  const miss=renderToStaticMarkup(React.createElement(FX,{event:{seq:8,kind:'hurt',damage:0},combo:0,enemyDown:false,boss:false}));
  assert.match(miss,/bfx-strike-hurt/);
  assert.doesNotMatch(miss,/bfx-charged/);
  const win=renderToStaticMarkup(React.createElement(FX,{event:{seq:9,kind:'hit',damage:18},combo:5,enemyDown:true,boss:true}));
  assert.match(win,/bfx-overdrive/);
  assert.match(win,/bfx-boss/);
  assert.match(win,/bfx-finisher/);
  assert.match(win,/bfx-defeat-mark/);
  const defeatedIdle=renderToStaticMarkup(React.createElement(FX,{event:{seq:10,kind:'idle',damage:0},combo:5,enemyDown:true,boss:true}));
  assert.doesNotMatch(defeatedIdle,/bfx-strike/,'no phantom hits after monster defeat');
  const {default:BattleStage}=await vite.ssrLoadModule('/src/reborn/BattleStage.tsx');
  const stage=renderToStaticMarkup(React.createElement(BattleStage,{enemyId:'armor',enemyName:'CACHE ARMOR',enemyHp:72,enemyMaxHp:95,playerHp:100,combo:3,boss:false,event:{seq:2,kind:'hit',damage:23},allow3d:true,threeD:true,onToggle3d:()=>{}}));
  assert.match(stage,/data-battle-event="hit"/);
  assert.match(stage,/72\/95/);
  assert.match(stage,/100\/100/);
  assert.match(stage,/3D表示中/);
  assert.match(stage,/bfx-strike-hit/);
 }finally{await vite.close()}
});
test('motion is contained, touch-safe, tiered and fully suppressed by user safety settings',()=>{
 const css=read('src/reborn/battleEnergy.css');
 for(const selector of ['.cs-arena{position:relative;isolation:isolate}', '.bfx-field', '.bfx-floor-player','.bfx-floor-enemy','.bfx-charged .bfx-hero-aura','.bfx-overdrive .bfx-hero-aura','.bfx-strike-hit','.bfx-strike-hurt','.bfx-finisher','.bfx-defeat-mark','.reborn.rb-fx-high','.reborn.rb-fx-off .bfx-field','@media(prefers-reduced-motion:reduce)','.reborn.is-reduced','.bfx-field *{animation:none!important','@media(max-width:420px)']){
  assert.ok(css.includes(selector),selector);
 }
 assert.match(css,/\.bfx-field\{[^}]*pointer-events:none/);
 assert.match(css,/\.bfx-field\{[^}]*overflow:hidden/);
 const source=read('src/reborn/BattleEnergyFX.tsx');
 assert.match(source,/aria-hidden="true"/);
 assert.doesNotMatch(css,/position:fixed|100vw|100vh|background:\s*white/);
 assert.match(css,/@keyframes bfx-shot/);
 assert.match(css,/@keyframes bfx-impact/);
 assert.match(css,/@keyframes bfx-shock/);
});

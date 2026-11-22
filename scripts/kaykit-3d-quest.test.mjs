import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {KAYKIT_MAGE,verifyMageGlb,MAGE_URL} from './vendor-kaykit-model.mjs';

const read=(path)=>readFileSync(path,'utf8');

test('build vendors the licensed author model, not a generated geometry substitute',()=>{
 assert.ok(existsSync(KAYKIT_MAGE.output),'verified GLB must be in public build input');
 const bytes=readFileSync(KAYKIT_MAGE.output);
 const result=verifyMageGlb(bytes);
 assert.equal(result.bytes,3589240);
 assert.equal(result.gitHash,'c89f19f6e707f6e07e4632a08876bd6d0172b082');
 assert.ok(result.meshes>0);
 assert.ok(MAGE_URL.includes('/672074b73ba276876a19e8816ecdc5241817ab47/'));
 assert.throws(()=>verifyMageGlb(Buffer.from('not a 3D model')));
 const tampered=Buffer.from(bytes);tampered[tampered.length-1]^=1;
 assert.throws(()=>verifyMageGlb(tampered),/hash mismatch/);
 const manifest=read('docs/THIRD_PARTY_ASSETS.md');
 assert.match(manifest,/Creative Commons Zero/);
 assert.match(manifest,/Kay Lousberg/);
 assert.match(manifest,/3,589,240/);
});
test('3D is lazy, disposable, answer-event-linked and never writes score or XP',()=>{
 const driver=read('src/reborn/questHero3DScene.ts');
 const view=read('src/reborn/QuestHero3D.tsx');
 const main=read('src/reborn/RebornApp.tsx');
 assert.match(view,/import\('\.\/questHero3DScene\.ts'\)/);
 assert.match(driver,/new GLTFLoader\(\)\.loadAsync/);
 assert.match(driver,/model\.animations/);
 assert.match(driver,/event\.seq!==reactedSeq/);
 assert.match(driver,/renderer\.setAnimationLoop/);
 assert.match(driver,/dispose\(\)/);
 assert.match(driver,/webglcontextlost/);
 assert.match(driver,/IntersectionObserver/);
 assert.match(driver,/ResizeObserver/);
 assert.match(driver,/document\.hidden/);
 assert.match(driver,/import\.meta\.env\.BASE_URL/);
 for(const phrase of ['applyStudyAttempt(', 'setProgress(', 'localStorage', 'recordBossVictory(', 'questHitDamage(']){
  assert.ok(!driver.includes(phrase),'presentation code must not modify '+phrase);
 }
 assert.doesNotMatch(main,/from 'three'/);
 assert.match(main,/allow3d=\{!actualReduced&&fxLevel!=='off'\}/);
 assert.match(view,/if\(!enabled\)/);
 assert.match(view,/WebGLRenderingContext/);
 assert.match(view,/prefers-reduced-motion/);
 assert.match(view,/setStatus\('fallback'\)/);
 const pkg=JSON.parse(read('package.json'));
 assert.match(pkg.scripts.build,/npm run vendor:3d/);
 assert.match(pkg.scripts.build,/npm run test:kaykit3d/);
});
test('QUEST RUN manual 3D/2D toggle preserves the existing 2D equipment fallback',()=>{
 const solo=read('src/reborn/SoloArcade.tsx');
 const battle=read('src/reborn/BattleStage.tsx');
 assert.match(solo,/const \[threeD,setThreeD\]=useState\(true\)/);
 assert.equal((solo.match(/onToggle3d=\{\(\)=>setThreeD\(v=>!v\)\}/g)||[]).length,1,'one stable toggle across question and review');
 assert.match(battle,/aria-pressed=\{threeD\}/);
 assert.match(battle,/3D表示中 · 2Dへ/);
 assert.match(battle,/2D表示中 · 3Dへ/);
 assert.match(battle,/QuestHero3D enabled=\{allow3d&&threeD\}/);
 assert.match(battle,/appearance=\{appearance\}/);
 assert.match(battle,/enemyHp\}/);
 assert.match(battle,/playerHp\}/);
 assert.match(battle,/装備未反映/);
 assert.match(solo,/questHitDamage\(correct,quest.stage,combo,quest.skills\)/);
 assert.match(solo,/if\(!onRecord\(current,correct,combo,receipt\)\)/);
});
test('SSR always supplies useful SVG fallback, no WebGL or asset fetch required',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const {default:QuestHero3D}=await vite.ssrLoadModule('/src/reborn/QuestHero3D.tsx');
  const {default:BattleStage}=await vite.ssrLoadModule('/src/reborn/BattleStage.tsx');
  const standby=renderToStaticMarkup(React.createElement(QuestHero3D,{
   enabled:true,pose:'idle',event:{seq:0,kind:'idle',damage:0}
  }));
  assert.match(standby,/cs-hero-2d/);
  assert.match(standby,/味方3D準備中/);
  assert.doesNotMatch(standby,/cs-avatar-idle|class="cs-hero-2d"/,'no flashing legacy SVG during 3D startup');
  assert.match(standby,/cs-hero-3d-host/);
  assert.doesNotMatch(standby,/canvas/);
  const stage=renderToStaticMarkup(React.createElement(BattleStage,{
   enemyId:'dragon',enemyName:'ARCHITECT DRAGON',enemyHp:100,enemyMaxHp:190,
   playerHp:75,combo:4,boss:true,event:{seq:2,kind:'hit',damage:39},
   threeD:true,allow3d:true,onToggle3d:()=>{}
  }));
  assert.match(stage,/cs-3d-switch/);
  assert.match(stage,/cs-stage-3d-capable/);
  assert.match(stage,/プレイヤーのランHP/);
  assert.match(stage,/ボスHP/);
  assert.match(stage,/100\/190/);
  assert.match(stage,/味方3D準備中/);
  assert.match(stage,/敵3D準備中/);
  const reduced=renderToStaticMarkup(React.createElement(BattleStage,{
   enemyId:'armor',enemyName:'CACHE ARMOR',enemyHp:95,enemyMaxHp:95,
   playerHp:100,combo:0,boss:false,event:{seq:0,kind:'idle',damage:0},
   threeD:true,allow3d:false,onToggle3d:()=>{}
  }));
  assert.doesNotMatch(reduced,/cs-3d-switch/);
  assert.match(reduced,/cs-avatar-idle/);
 }finally{await vite.close()}
});
test('mobile and reduced-motion rules preserve buttons and readable non-canvas fallback',()=>{
 const css=read('src/reborn/characterStage.css');
 for(const tag of ['.cs-stage-3d-capable','.cs-hero-viewport','.cs-3d-switch','.cs-hero-2d','.cs-hero-3d-host','pointer-events:none','@media(max-width:420px)','@media(prefers-reduced-motion:reduce)','.reborn.rb-fx-off','.reborn.is-reduced','min-height:44px']){
  assert.ok(css.includes(tag),tag);
 }
 const sw=read('scripts/build-offline.mjs');
 assert.ok(!sw.includes('characters/kaykit/mage.glb'),'large optional model must not block app-shell precache');
});

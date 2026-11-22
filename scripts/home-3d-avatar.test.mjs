import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

const read=path=>readFileSync(path,'utf8');

test('home avatar mode defaults to 3D and persists 2D separately from study progress',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const {readHomeAvatarMode,saveHomeAvatarMode,HOME_AVATAR_MODE_KEY}=await vite.ssrLoadModule('/src/reborn/HomeAvatarPortrait.tsx');
  assert.equal(readHomeAvatarMode({getItem:()=>null}),'3d');
  assert.equal(readHomeAvatarMode({getItem:()=> '3d'}),'3d');
  assert.equal(readHomeAvatarMode({getItem:()=> '2d'}),'2d');
  assert.equal(readHomeAvatarMode({getItem:()=> 'invalid'}),'3d');
  assert.equal(readHomeAvatarMode({getItem:()=>{throw Error('blocked')}}),'3d');
  let stored=null;
  saveHomeAvatarMode('2d',{setItem:(key,val)=>{assert.equal(key,HOME_AVATAR_MODE_KEY);stored=val}});
  assert.equal(stored,'2d');
  saveHomeAvatarMode('3d',{setItem:(key,val)=>{stored=val}});
  assert.equal(stored,'3d');
  assert.doesNotThrow(()=>saveHomeAvatarMode('3d',{setItem:()=>{throw Error('quota')}}));
  assert.notEqual(HOME_AVATAR_MODE_KEY,'certification-overdrive-progress-v1');
 }finally{await vite.close()}
});
test('SSR home shows actual 3D preview slot by default, 2D equipment only when selected or restricted',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const {default:HomeAvatarPortrait}=await vite.ssrLoadModule('/src/reborn/HomeAvatarPortrait.tsx');
  const {STARTER_AVATAR}=await vite.ssrLoadModule('/src/reborn/avatarCollection.ts');
  const html=renderToStaticMarkup(React.createElement(HomeAvatarPortrait,{appearance:STARTER_AVATAR,allow3d:true}));
  for(const marker of ['ac-home-portrait-3d','MY AVATAR · 3D','味方3D準備中','2Dに切替','view'])assert.ok(html.includes(marker),marker);
  assert.match(html,/aria-label="ホームのキャラを2Dに切り替える"/);
  assert.match(html,/cs-hero-3d-host/);
  assert.doesNotMatch(html,/class="cs-hero-2d"|class="cs-avatar/,'do not flash legacy SVG while 3D loading');
  assert.doesNotMatch(html,/<canvas/,'WebGL should initialize only on client');
  const lowfx=renderToStaticMarkup(React.createElement(HomeAvatarPortrait,{appearance:STARTER_AVATAR,allow3d:false}));
  assert.match(lowfx,/MY AVATAR · 2D/);
  assert.match(lowfx,/cs-avatar-idle/);
  assert.match(lowfx,/軽量2D表示/);
  assert.doesNotMatch(lowfx,/ac-home-avatar-switch/);
  assert.doesNotMatch(lowfx,/味方3D準備中/);
  const {default:RebornApp}=await vite.ssrLoadModule('/src/reborn/RebornApp.tsx');
  const app=renderToStaticMarkup(React.createElement(RebornApp));
  assert.match(app,/ac-home-portrait-3d/);
  assert.match(app,/MY AVATAR · 3D/);
  assert.ok(app.indexOf('ac-home-portrait-3d')<app.indexOf('攻略を始める'));
  assert.ok(app.includes('QUEST RUN'));
  assert.ok(app.includes('マイキャラ・装備アイテム'));
  assert.ok(app.includes('装備プレビュー（2D）'));
 }finally{await vite.close()}
});
test('one GLB and one lazy Three.js renderer are shared by HOME and QUEST, with different camera poses',()=>{
 const portrait=read('src/reborn/HomeAvatarPortrait.tsx');
 const view=read('src/reborn/QuestHero3D.tsx');
 const scene=read('src/reborn/questHero3DScene.ts');
 const app=read('src/reborn/RebornApp.tsx');
 const closet=read('src/reborn/AvatarCloset.tsx');
 assert.match(portrait,/view="portrait"/);
 assert.match(view,/view\?:'battle'\|'portrait'/);
 assert.match(view,/mountQuestHero3D\(mount,\(\)=>\{/);
 assert.match(view, /\},view\)\)/);
 assert.match(scene,/view:'battle'\|'portrait'='battle'/);
 assert.match(scene,/if\(view==='portrait'\)camera\.position\.set\(1\.15,1\.22,4\.5\)/);
 assert.match(scene,/camera\.position\.set\(-3\.35,1\.25,4\.0\)/);
 assert.match(scene,/if\(view==='portrait'\)root\.rotation\.y=\.12/);
 assert.match(scene,/else root\.rotation\.y=\.22/);
 assert.match(scene,/let cached:Promise<Model>\|null=null/);
 assert.match(scene,/new GLTFLoader\(\)\.loadAsync/);
 assert.match(view,/import\('\.\/questHero3DScene\.ts'\)/);
 assert.match(view,/driver\.current\?\.dispose\(\)/);
 assert.match(scene,/renderer\.dispose\(\)/);
 assert.match(scene,/document\.hidden/);
 assert.match(scene,/IntersectionObserver/);
 assert.match(app,/<HomeAvatarPortrait appearance=\{avatarAppearance\} allow3d=\{!actualReduced&&fxLevel!=='off'\}/);
 assert.doesNotMatch(app,/import .* from 'three'/);
 assert.doesNotMatch(closet,/QuestHero3D|Three\.js|WebGLRenderer/,'the wardrobe keeps an accurate 2D gear preview');
 assert.match(closet,/ホーム／戦闘の3D試作モデルには装備をまだ反映していません/);
 for(const code of ['applyStudyAttempt','setProgress','questHitDamage','localStorage.setItem(PROGRESS_SAVE_KEY)']){
  assert.ok(!portrait.includes(code),'visual display should not mutate '+code);
 }
});
test('home model remains compact and accessible at 320px with FX OFF/reduced motion fallback',()=>{
 const css=read('src/reborn/characterStage.css');
 const source=read('src/reborn/HomeAvatarPortrait.tsx');
 for(const marker of ['.ac-home-heading{grid-template-columns','.ac-home-portrait{','.ac-home-avatar-switch','min-height:44px','.ac-home-avatar-switch:focus-visible','@media(max-width:380px)','max-width:100%','.cs-hero-viewport'])assert.ok(css.includes(marker),marker);
 assert.match(source,/allow3d&&preferred==='3d'/);
 assert.match(source,/readHomeAvatarMode/);
 assert.match(source,/saveHomeAvatarMode/);
 assert.match(read('src/reborn/RebornApp.tsx'),/allow3d=\{!actualReduced&&fxLevel!=='off'\}/);
 assert.match(read('src/reborn/QuestHero3D.tsx'),/prefers-reduced-motion: reduce/);
});

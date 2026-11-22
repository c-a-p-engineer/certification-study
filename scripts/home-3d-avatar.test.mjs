import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
const read=path=>readFileSync(path,'utf8');

test('HOME ignores legacy stored 2D and always shows a real 3D character when capable',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const {default:Portrait}=await vite.ssrLoadModule('/src/reborn/HomeAvatarPortrait.tsx');
  const {STARTER_AVATAR}=await vite.ssrLoadModule('/src/reborn/avatarCollection.ts');
  const home=renderToStaticMarkup(React.createElement(Portrait,{appearance:STARTER_AVATAR,allow3d:true}));
  assert.match(home,/MY AVATAR · 3D/);
  assert.match(home,/味方3D準備中/);
  assert.match(home,/cs-hero-3d-host/);
  assert.doesNotMatch(home,/2Dに切替|ac-home-avatar-switch|cs-avatar-idle/);
  const reduced=renderToStaticMarkup(React.createElement(Portrait,{appearance:STARTER_AVATAR,allow3d:false}));
  assert.match(reduced,/軽量表示/);
  assert.match(reduced,/cs-avatar-idle/);
  const {default:App}=await vite.ssrLoadModule('/src/reborn/RebornApp.tsx');
  const markup=renderToStaticMarkup(React.createElement(App));
  assert.match(markup,/MY AVATAR · 3D/);
  assert.match(markup,/rb-enemy-picture-3d/);
  assert.match(markup,/敵3D準備中/);
  assert.doesNotMatch(markup,/マイキャラ・装備アイテム|装備プレビュー（2D）/);
 }finally{await vite.close()}
});

test('HOME/QUEST/BLITZ/DAILY CODE share the existing lazy 3D Mage with no 2D switch',()=>{
 const portrait=read('src/reborn/HomeAvatarPortrait.tsx');
 const view=read('src/reborn/QuestHero3D.tsx');
 const scene=read('src/reborn/questHero3DScene.ts');
 const app=read('src/reborn/RebornApp.tsx');
 const solo=read('src/reborn/SoloArcade.tsx');
 const daily=read('src/reborn/DailyCode.tsx');
 assert.match(portrait,/view="portrait"/);
 assert.match(view,/view\?:'battle'\|'portrait'/);
 assert.match(scene,/new GLTFLoader\(\)\.loadAsync/);
 assert.match(scene,/let cached:Promise<Model>\|null=null/);
 assert.match(scene,/renderer\.dispose\(\)/);
 assert.match(scene,/IntersectionObserver/);
 assert.match(app,/allow3d=\{!actualReduced\}/);
 assert.match(solo,/<QuestHero3D enabled=\{allow3d\}/);
 assert.match(daily,/<QuestHero3D enabled=\{allow3d\}/);
 assert.doesNotMatch(solo,/onToggle3d|setThreeD|<PlayerAvatar/);
 assert.doesNotMatch(daily,/<PlayerAvatar/);
});
test('3D mode retains technical fallback, but FX OFF does not hide canvas',()=>{
 const css=read('src/reborn/characterStage.css');
 for(const tag of ['.ac-home-heading{grid-template-columns','.cs-hero-viewport','.cs-mini-avatar-3d','.rb-enemy-picture-3d','.reborn.rb-fx-off .cs-hero-3d-host','pointer-events:none','@media(max-width:420px)'])assert.ok(css.includes(tag),tag);
 assert.match(read('src/reborn/QuestHero3D.tsx'),/WebGLRenderingContext/);
 assert.match(read('src/reborn/QuestEnemy3D.tsx'),/WebGLRenderingContext/);
 assert.doesNotMatch(read('src/reborn/HomeAvatarPortrait.tsx'),/localStorage|HOME_AVATAR_MODE_KEY|setPreferred/);
});

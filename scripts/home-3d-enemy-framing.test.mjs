import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {enemyCardFrustumHalfHeight} from '../src/reborn/enemyCardFraming.ts';

const read=(file)=>readFileSync(file,'utf8');
test('card camera contains both tall skeletons and long/wide animals on 320–400px screens',()=>{
 const meshes=[
  {name:'tall skeleton',extentX:1.15,extentY:1.55},
  {name:'long animal',extentX:4.8,extentY:1.2},
  {name:'large wide animal',extentX:8.4,extentY:2.4},
 ];
 for(const {name,extentX,extentY} of meshes){
  for(const [w,h] of [[258,164],[200,160],[96,110],[118,126],[164,164]]){
   const half=enemyCardFrustumHalfHeight(w,h,extentX,extentY);
   assert.ok(half*(w/h)*0.78>=extentX+0.18-1e-9,name+' horizontal '+w);
   assert.ok(half*.78>=extentY+0.18-1e-9,name+' vertical '+w);
   assert.ok(half>=1.52,name+' does not zoom into model');
  }
 }
});
test('HOME and practice answer use card camera without changing QUEST RUN battle camera',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const {default:Enemy}=await vite.ssrLoadModule('/src/reborn/QuestEnemy3D.tsx');
  const props={enabled:true,id:'leviathan',boss:false,hp:50,maxHp:100,event:{seq:0,kind:'idle',damage:0}};
  const compact=renderToStaticMarkup(React.createElement(Enemy,{...props,view:'card'}));
  const battle=renderToStaticMarkup(React.createElement(Enemy,props));
  assert.match(compact,/data-enemy-view="card"/);
  assert.match(battle,/data-enemy-view="battle"/);
  assert.match(compact,/敵3D準備中/);
  assert.doesNotMatch(compact,/cs-3d-label/);
 }finally{await vite.close()}
 const scene=read('src/reborn/questEnemy3DScene.ts');
 const view=read('src/reborn/QuestEnemy3D.tsx');
 const app=read('src/reborn/RebornApp.tsx');
 const css=read('src/reborn/characterStage.css');
 assert.match(scene,/new THREE.Box3\(\)\.setFromObject\(root\)/);
 assert.match(scene,/applyMatrix4\(camera\.matrixWorldInverse\)/);
 assert.match(scene,/enemyCardFrustumHalfHeight\(w,h,horizontalExtent,verticalExtent\)/);
 assert.match(scene,/if\(\(view==='card'\|\|variant==='phoenix'\)&&cardCorners.length\)/);
 assert.match(view,/\[enabled,variant,view\]/);
 assert.equal((app.match(/<QuestEnemy3D view="card"/g)||[]).length,2);
 assert.match(css,/\.rb-enemy-card-3d \.rb-enemy-picture-3d/);
 assert.match(css,/@media\(max-width:500px\)/);
 assert.match(css,/width:min\(100%,258px\);height:164px/);
});

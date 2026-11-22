import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {questEnemyVariant,enemy3DAsset,GOBKIT_VISUALS} from '../src/reborn/questEnemyVariant.ts';
import {createPhoenixAccent} from '../src/reborn/phoenix3DAccent.ts';
const read=p=>readFileSync(p,'utf8');
test('Phoenix never randomly becomes Red, Bat or Jellyfish in any game mode',()=>{
 for(const seed of [-1,0,1,2,3,4,29,500,99999]){
  for(const boss of [true,false]){
   const variant=questEnemyVariant('phoenix',boss,seed);
   assert.equal(variant,'phoenix');
   assert.equal(enemy3DAsset(variant).path,GOBKIT_VISUALS['gobkit-animal-duck'].path);
   assert.equal(enemy3DAsset(variant).isGobkit,true);
  }
 }
 assert.equal(enemy3DAsset('phoenix').label,'Phoenix · Flamebird');
 assert.equal(questEnemyVariant('dragon',true,1),'mage');
});
test('firebird feathers and emissive color are added to an independent actor clone and freed',()=>{
 const originalMaterial=new THREE.MeshStandardMaterial({color:0x4a9cc9});
 const originalColor=originalMaterial.color.getHex();
 const actor=new THREE.Group();
 const body=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),originalMaterial);
 actor.add(body);
 const root=new THREE.Group();root.add(actor);
 const before=root.children.length;
 const skin=createPhoenixAccent(actor,root);
 assert.equal(root.children.length,before+1);
 assert.notEqual(body.material,originalMaterial);
 assert.equal(originalMaterial.color.getHex(),originalColor,'author source material not mutated');
 const feathers=root.getObjectByName('phoenix-flame-feathers');
 assert.ok(feathers instanceof THREE.Group);
 const meshCount=feathers.children.reduce((n,x)=>n+(x instanceof THREE.Mesh?1:x.children.length),0);
 assert.ok(meshCount>=18,'head crest, tail, wings and embers rendered');
 assert.doesNotThrow(()=>skin.update(3.5,false));
 assert.doesNotThrow(()=>skin.update(4.5,true));
 const tinted=body.material;
 assert.ok(tinted instanceof THREE.MeshStandardMaterial);
 assert.ok(tinted.color.r>tinted.color.b,'flame body tint visible');
 skin.dispose();
 assert.equal(feathers.parent,null);
 assert.equal(root.children.length,before);
 assert.equal(originalMaterial.color.getHex(),originalColor);
 originalMaterial.dispose();
 body.geometry.dispose();
});
test('animated firebird uses the animal baked track and camera includes its wings',()=>{
 const scene=read('src/reborn/questEnemy3DScene.ts');
 assert.match(scene,/variant==='phoenix'\?createPhoenixAccent\(actor,root\)/);
 assert.match(scene,/root\.add\(actor\);[\s\S]*phoenixAccent[\s\S]*cardBounds/);
 assert.match(scene,/view==='card'\|\|variant==='phoenix'/);
 assert.match(scene,/variant==='phoenix'\|\|variant\.startsWith\('gobkit-animal-'\)/);
 assert.match(scene,/phoenixAccent\?\.update/);
 assert.match(scene,/phoenixAccent\?\.dispose/);
 assert.doesNotMatch(scene,/applyStudyAttempt\(|setProgress\(|localStorage/);
 const docs=read('docs/THIRD_PARTY_ASSETS.md');
 assert.match(docs,/Gobkit.*Duck GLB/);
 assert.match(read('src/reborn/RebornApp.tsx'),/使用素材・ライセンス/);
});

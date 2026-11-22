import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {GOBKIT_MODELS,GOBKIT_COMMIT,verifyGobkitGlb} from './vendor-gobkit-models.mjs';
import {GOBKIT_VISUALS,questEnemyVariant,enemy3DAsset} from '../src/reborn/questEnemyVariant.ts';
const read=path=>readFileSync(path,'utf8');

test('18 original creator CC0 GLBs are pinned, valid and animated',()=>{
 assert.equal(GOBKIT_MODELS.length,18);
 assert.equal(new Set(GOBKIT_MODELS.map(m=>m.blob)).size,18);
 assert.equal(GOBKIT_COMMIT,'4e73c68fa6e8ca9d948fcc0ce7215c830a022c3b');
 assert.equal(Object.keys(GOBKIT_VISUALS).length,18);
 for(const asset of GOBKIT_MODELS){
  assert.ok(existsSync(asset.output),asset.output);
  const verified=verifyGobkitGlb(readFileSync(asset.output),asset);
  assert.equal(verified.bytes,asset.size);
  assert.equal(verified.gitHash,asset.blob);
  assert.ok(verified.animations.length>0,asset.upstreamPath);
  const key='gobkit-'+asset.upstreamPath.replace('.glb','').replace('/','-').toLowerCase();
  assert.equal(enemy3DAsset(key).path,'characters/gobkit/'+asset.upstreamPath);
 }
 const first=GOBKIT_MODELS[0],broken=Buffer.from(readFileSync(first.output));broken[broken.length-1]^=1;
 assert.throws(()=>verifyGobkitGlb(broken,first),/hash mismatch/);
});
test('every Gobkit model can appear in QUEST route variations without touching grading',()=>{
 const reachable=new Set();
 for(const id of ['armor','phoenix','titan','leviathan'])for(let seed=1;seed<100;seed++)reachable.add(questEnemyVariant(id,false,seed));
 assert.deepEqual(reachable,new Set(Object.keys(GOBKIT_VISUALS)));
 assert.equal(questEnemyVariant('dragon',true,999),'mage');
 assert.equal(questEnemyVariant('armor',false),'minion');
 const solo=read('src/reborn/SoloArcade.tsx'),scene=read('src/reborn/questEnemy3DScene.ts');
 assert.match(solo,/<BattleStage appearance=\{appearance\} variantSeed=\{seed\+quest.stage/);
 assert.match(scene,/mixer\.setTime/);
 assert.match(scene,/segment==='dead'/);
 for(const forbidden of ['applyStudyAttempt(', 'setProgress(', 'localStorage','questHitDamage('])assert.ok(!scene.includes(forbidden));
});
test('settings and provenance disclose the external authors and licenses',()=>{
 const ui=read('src/reborn/RebornApp.tsx'),doc=read('docs/THIRD_PARTY_ASSETS.md');
 assert.match(ui,/使用素材・ライセンス/);
 assert.match(ui,/gobkit-free-assets/);
 assert.match(doc,/Gobkit/);
 assert.match(doc,/4e73c68fa6e8ca9d948fcc0ce7215c830a022c3b/);
 assert.match(JSON.parse(read('package.json')).scripts['vendor:3d'],/vendor-gobkit-models\.mjs/);
});

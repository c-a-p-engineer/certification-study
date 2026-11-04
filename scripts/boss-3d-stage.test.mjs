import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync('src/main.tsx','utf8');
const view=readFileSync('src/QuizCombatStatus.tsx','utf8');
const hud=readFileSync('src/BossBattleHUD.tsx','utf8');
const arena=readFileSync('src/BossArena3D.tsx','utf8');
const scene=readFileSync('src/boss3dScene.ts','utf8');
const css=readFileSync('src/bossArena3d.css','utf8');
test('3D effect is opt-in and only detailed boss mode loads WebGL',()=>{
 assert.match(main,/cinematic=\{visualPower==='overdrive'&&!reduced\}/);
 assert.match(view,/quizLayout==='compact'/);
 assert.match(view,/quizLayout==='focus'/);
 assert.match(hud,/cinematic\?<BossArena3D/);
 assert.match(arena,/import\('\.\/boss3dScene\.ts'\)/);
 assert.match(arena,/setStatus\('fallback'\)/);
 assert.match(arena,/BossArmorBreak/);
});
test('3D armor is derived only from read-only boss values, with no reward/storage side effects',()=>{
 assert.match(scene,/bossArmorPhase\(current.remaining,current.target\)/);
 assert.match(scene,/correct>previousCorrect/);
 assert.match(scene,/renderer.setAnimationLoop/);
 assert.match(scene,/dispose\(\)/);
 assert.match(scene,/IntersectionObserver/);
 assert.match(scene,/ResizeObserver/);
 assert.match(scene,/webglcontextlost/);
 assert.match(scene,/devicePixelRatio\|\|1,1\.4/);
 for(const text of [arena,scene]){
  for(const prohibited of ['setProgress(', 'applyStudyAttempt(', 'recordBossVictory(', 'localStorage', 'fetch(']){
   assert.ok(!text.includes(prohibited),prohibited+' is not permitted in a visual layer');
  }
 }
 assert.match(css,/pointer-events:none/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test('Three.js is a game-only lazy dependency; not a startup import',()=>{
 assert.doesNotMatch(main,/from 'three'/);
 assert.doesNotMatch(view,/from 'three'/);
 assert.doesNotMatch(hud,/from 'three'/);
 const pkg=JSON.parse(readFileSync('package.json','utf8'));
 assert.ok(pkg.dependencies.three);
 assert.ok(pkg.devDependencies['@types/three']);
 assert.ok(pkg.scripts.build.includes('npm run test:3d-boss'));
});

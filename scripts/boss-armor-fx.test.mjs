import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bossArmorPhase} from '../src/bossArmorPhase.ts';

test('the armor graphic only reflects existing shield progress',()=>{
 assert.equal(bossArmorPhase(7,7),'sealed');
 assert.equal(bossArmorPhase(5,7),'sealed');
 assert.equal(bossArmorPhase(4,7),'strained');
 assert.equal(bossArmorPhase(3,7),'strained');
 assert.equal(bossArmorPhase(2,7),'exposed');
 assert.equal(bossArmorPhase(1,7),'exposed');
 assert.equal(bossArmorPhase(0,7),'broken');
 assert.equal(bossArmorPhase(-1,7),'sealed');
 assert.equal(bossArmorPhase(2,0),'sealed');
});
test('decorative layer is wired to boss HUD, not grading or storage',()=>{
 const hud=readFileSync('src/BossBattleHUD.tsx','utf8');
 const scene=readFileSync('src/BossArmorBreak.tsx','utf8');
 const css=readFileSync('src/bossArmorBreak.css','utf8');
 const view=readFileSync('src/QuizCombatStatus.tsx','utf8');
 assert.match(hud,/BossArmorBreak domain={domain} remaining={battle.remaining} target={battle.target} correct={correct}/);
 assert.match(scene,/aria-hidden="true"/);
 assert.match(scene,/key={correct}/);
 assert.match(css,/\.app\.visual-overdrive \.od4-armor-break/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.app\.reduced \.od4-armor-break\{display:none!important\}/);
 for(const code of [scene,readFileSync('src/bossArmorPhase.ts','utf8')]){
  for(const forbidden of ['localStorage','sessionStorage','fetch(', 'setProgress(', 'applyStudyAttempt(', 'recordBossVictory(']){
   assert.ok(!code.includes(forbidden),'cosmetic effect must not touch '+forbidden);
  }
 }
 assert.match(view,/quizLayout==='focus'/);
 assert.match(view,/quizLayout==='compact'/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {answerCelebration,burstGeometry} from '../src/reborn/celebration.ts';
import {hapticPattern} from '../src/haptics.ts';

const ui=readFileSync('src/reborn/RebornApp.tsx','utf8');
const css=readFileSync('src/reborn/reborn.css','utf8');
const entry=readFileSync('src/entry.ts','utf8');
const spec=readFileSync('docs/SPECIFICATION.md','utf8');

test('correct/wrong/combo/boss win choreography follows real outcomes only',()=>{
 const wrong=answerCelebration({correct:false,combo:0,damage:0,defeated:false,rewardedXp:0});
 assert.equal(wrong.kind,'wrong');
 const plain=answerCelebration({correct:true,combo:1,damage:0,defeated:false,rewardedXp:0});
 assert.equal(plain.kind,'correct');
 assert.equal(plain.subtitle,'GOOD RECALL!');
 const hit=answerCelebration({correct:true,combo:2,damage:5,defeated:false,rewardedXp:13});
 assert.equal(hit.kind,'boss-hit');
 const combo=answerCelebration({correct:true,combo:3,damage:5,defeated:false,rewardedXp:13});
 assert.equal(combo.kind,'combo');
 const boss=answerCelebration({correct:true,combo:5,damage:5,defeated:true,rewardedXp:20});
 assert.equal(boss.kind,'boss-win');
 assert.equal(boss.haptic,'boss-win');
 assert.equal(boss.sound,'boss-win');
 assert.ok(boss.particles>wrong.particles);
});
test('particles are capped and deterministic; animations are finite and reduced-motion disabled',()=>{
 const x=burstGeometry(100,23);
 assert.equal(x.length,36);
 assert.deepEqual(x,burstGeometry(100,23));
 assert.equal(burstGeometry(0,1).length,0);
 for(const p of x){assert.ok(p.size>=5);assert.ok(p.delay<150);assert.ok(Math.abs(p.x)<200)}
 assert.match(css,/@keyframes rb-shrapnel/);
 assert.match(css,/@keyframes rb-ring/);
 assert.match(css,/@keyframes rb-flash/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.reborn\.is-reduced \.rb-fx-stage/);
 assert.match(css,/\.rb-fx-off \.rb-fx-stage/);
});
test('actual graded event is the only source of celebration and no independent reward writer',()=>{
 assert.ok(ui.includes('setProgress(p=>applyStudyAttempt(p,event).progress)'));
 assert.ok(ui.includes('if(!preview.reward.credited)'));
 assert.ok(ui.includes('answerCelebration({correct,combo:nextCombo,damage:preview.reward.campaign?.damage??0,defeated:Boolean(preview.reward.campaign?.defeated),rewardedXp:preview.reward.totalXp})'));
 assert.ok(ui.includes("if(activeExam){sound('select');signal('select');advance();return}"));
 assert.ok(ui.includes('triggerHaptic(event,haptics,actualReduced,activeExam)'));
 assert.ok(ui.includes('testHapticDevice(haptics,actualReduced'));
 assert.deepEqual(hapticPattern('boss-win','off'),[]);
 assert.ok(hapticPattern('boss-win','overdrive').length>=5);
 assert.doesNotMatch(ui,/localStorage\.clear\(/);
});
test('public entry is unified; recovery and audio/haptic settings are first class',()=>{
 assert.match(entry,/import '\.\/reborn\/index\.tsx'/);
 assert.doesNotMatch(entry,/main\.tsx|legacy/);
 assert.doesNotMatch(ui,/\?legacy=1|旧版を開く|旧版で/);
 for(const name of ['parseBackup','restoreBackup','backupPreview','recoverInterruptedRestore','confirmImport','saveEmergency','BGM','効果音','振動強度','画面エフェクト']){
  assert.ok(ui.includes(name),name);
 }
 assert.ok(ui.includes("bgmEnabled:enabled"));
 assert.ok(ui.includes('engine.configure({...audioSettings,bgmEnabled:true})'));
 assert.match(spec,/高密度演出 — OVERDRIVE FX/);
});

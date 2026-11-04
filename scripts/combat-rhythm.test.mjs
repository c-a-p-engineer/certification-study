import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

const main=readFileSync('src/main.tsx','utf8');
const rail=readFileSync('src/CombatRhythmHUD.tsx','utf8');
const css=readFileSync('src/combatRhythm.css','utf8');
const header=readFileSync('src/QuizStageHeader.tsx','utf8');
const answers=readFileSync('src/QuizAnswerControls.tsx','utf8');

test('rail only activates in non-exam OVERDRIVE outside focus mode',()=>{
 assert.ok(main.includes("const battleRhythmActive=mode==='quiz'&&!examMode&&!reduced&&visualPower==='overdrive'&&quizLayout!=='focus'"));
 assert.ok(main.includes("battleRhythmActive?'combat-rhythm-active':''"));
 assert.ok(main.includes("!(battleRhythmActive&&quizLayout==='compact')"));
 assert.ok(main.includes("accessible={quizLayout==='compact'}"));
 assert.ok(rail.includes('<CompactQuizHUD'));
 assert.ok(rail.includes('HIT CONFIRMED'));
 assert.ok(rail.includes('GUARD / REVIEW'));
 assert.ok(rail.includes('aria-hidden={!accessible}'));
 assert.ok(main.includes('showTargetConsole={!battleRhythmActive}'));
 assert.ok(answers.includes('showTargetConsole'));
 for(const banned of ['applyStudyAttempt(', 'recordBossVictory(', 'setProgress(', 'localStorage', 'fetch(', 'setTimeout(']){
  assert.ok(!rail.includes(banned),banned+' prohibited in visual rail');
 }
});
test('sticky rail respects device motion, scroll reading, pointer events',()=>{
 assert.ok(css.includes('position:sticky'));
 assert.ok(css.includes('overflow:clip'));
 assert.ok(css.includes('scroll-margin-top'));
 assert.ok(css.includes('pointer-events:none'));
 assert.ok(css.includes('@media(max-width:360px)'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('@keyframes od-rhythm-hit'));
 assert.ok(css.includes('.app.combat-rhythm-active .od-target-console{display:none!important}'));
 assert.ok(!header.includes('localStorage'));
});
test('FX toggle is available in quiz but disabled for exam or reduced motion',()=>{
 assert.ok(header.includes('!examMode&&onVisualPower'));
 assert.ok(header.includes("aria-pressed={visualPower==='overdrive'}"));
 assert.ok(header.includes('disabled={reduced}'));
 assert.ok(main.includes('onVisualPower={changeVisualPower}'));
 assert.ok(header.includes("FX {visualPower==='overdrive'?'ON':'OFF'}"));
});
test('SSR shows correct live combat phases without changes to grading or saves',async()=>{
 const vite=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
 try{
  const {default:HUD}=await vite.ssrLoadModule('/src/CombatRhythmHUD.tsx');
  const base={campaign:undefined,attack:null,combo:3,bossDomain:null,correct:2,total:10,
   selected:null,answerCorrect:false,multiChosen:0,multiRequired:2,
   questionId:'saa-test',questionNumber:3,accessible:true};
  const render=(p={})=>renderToStaticMarkup(React.createElement(HUD,{...base,...p}));
  assert.match(render(),/LIVE \/\/ TACTICAL HUD/);
  assert.match(render(),/READY TO LOCK/);
  assert.match(render(),/戦闘のライブ表示/);
  assert.match(render({multiChosen:1}),/LOCKING TARGETS/);
  assert.match(render({multiChosen:1}),/width:50%/);
  assert.match(render({multiChosen:2}),/FIRE READY/);
  assert.match(render({selected:0,answerCorrect:true}),/HIT CONFIRMED/);
  assert.match(render({selected:0,answerCorrect:true}),/HIT!/);
  assert.match(render({selected:1,answerCorrect:false}),/GUARD \/ REVIEW/);
  assert.match(render({selected:1,answerCorrect:false}),/BLOCK!/);
  assert.match(render({accessible:false}),/aria-hidden="true"/);
 }finally{await vite.close();}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync('src/main.tsx','utf8');
const controls=readFileSync('src/QuizAnswerControls.tsx','utf8');
const css=readFileSync('src/answerTargetingFx.css','utf8');
test('effect is opt-in only outside exams and focus layout',()=>{
 assert.ok(main.includes("cinematic={!examMode&&visualPower==='overdrive'&&!reduced&&quizLayout!=='focus'}"));
 assert.ok(controls.includes('const fx=cinematic&&!examMode&&showChoices'));
 assert.ok(controls.includes('aim?.questionId===question.id'));
});
test('single-tap grading and multi-select conditions are unchanged',()=>{
 assert.ok(controls.includes('onAnswer([originalIndex])'));
 assert.ok(controls.includes('onToggle(originalIndex)'));
 assert.ok(controls.includes('onAnswer([...multiChoices])'));
 assert.ok(controls.includes('disabled={multiChoices.length!==question.answers.length}'));
 assert.ok(controls.includes('disabled={selected!==null}'));
 assert.ok(controls.includes('aria-pressed={question.answers?multiChoices.includes(originalIndex):undefined}'));
});
test('visual states reflect current answer only and never write to learning data',()=>{
 assert.ok(controls.includes('selected!==null&&(question.answers?selected===-2:expected.includes(selected))'));
 assert.ok(controls.includes('DIRECT HIT'));
 assert.ok(controls.includes('SIGNAL BLOCKED'));
 assert.ok(controls.includes('aria-hidden="true"'));
 for(const bad of ['localStorage','sessionStorage','fetch(', 'applyStudyAttempt(', 'setProgress(', 'recordBossVictory(', 'setTimeout('])assert.ok(!controls.includes(bad),bad);
});
test('bounded transitions, motion accessibility, responsive and pointer isolation',()=>{
 assert.ok(controls.includes('onPointerEnter'));
 assert.ok(controls.includes('onFocus'));
 assert.ok(css.includes('@media(max-width:360px)'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(css.includes('.app.reduced .od-target-console{display:none!important}'));
 assert.ok(css.includes('pointer-events:none'));
 assert.ok(!css.includes('infinite'));
});

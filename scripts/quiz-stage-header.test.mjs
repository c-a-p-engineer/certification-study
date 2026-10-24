import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync('src/main.tsx','utf8');
const header=readFileSync('src/QuizStageHeader.tsx','utf8');
const spec=readFileSync('docs/SPECIFICATION.md','utf8');

test('quiz header is isolated and retains all launch modes and time constraints',()=>{
 assert.ok(main.includes('<QuizStageHeader examMode={examMode}'));
 assert.ok(main.includes('onTextScale={changeTextScale}'));
 assert.ok(main.includes('onQuizLayout={changeQuizLayout}'));
 assert.ok(header.includes('role="timer"'));
 assert.ok(header.includes('timeLeft<=600'));
 for(const mode of ['EXAM TRIAL','BOSS RUSH','EXPEDITION','CASE FILES','DAILY FIVE','SMART QUEST','MISSION']){
  assert.ok(header.includes(mode),mode);
 }
 assert.ok(header.includes('aria-label="文字とクイズ画面の調整"'));
 assert.ok(header.includes('aria-pressed={quizLayout==='));
 assert.ok(spec.includes('src/QuizStageHeader.tsx'));
});

test('header sends events to App but never saves sessions, grades answers or resets progress',()=>{
 for(const forbidden of ['localStorage','applyStudyAttempt','setProgress','writeMissionSave','saveQuizLayout','saveTextScale']){
  assert.ok(!header.includes(forbidden),forbidden);
 }
 assert.ok(header.includes('onHome'));
 assert.ok(header.includes('onTextScale(shiftTextScale('));
 assert.ok(header.includes('onQuizLayout('));
});

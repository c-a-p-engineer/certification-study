import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defaultQuizLayout,isQuizLayout,QUIZ_LAYOUT_KEY,readQuizLayout,saveQuizLayout} from '../src/quizLayout.ts';
const combat=readFileSync('src/QuizCombatStatus.tsx','utf8');
const header=readFileSync('src/QuizStageHeader.tsx','utf8');
const main=readFileSync('src/main.tsx','utf8'),menu=readFileSync('src/GameMenu.tsx','utf8'),css=readFileSync('src/quizDensity.css','utf8'),hud=readFileSync('src/CompactQuizHUD.tsx','utf8');
test('responsive initial layout prefers compact on narrow devices, not fixed globally',()=>{
 assert.equal(defaultQuizLayout(true),'compact');
 assert.equal(defaultQuizLayout(false),'detailed');
 assert.equal(isQuizLayout('detailed'),true);
 assert.equal(isQuizLayout('compact'),true);
 assert.equal(isQuizLayout('focus'),true);
 assert.equal(isQuizLayout('wide'),false);
});
test('previous preferences remain absent and new setting persists safely',()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const windowDesc=Object.getOwnPropertyDescriptor(globalThis,'window');
 const values=new Map();
 try{
  Object.defineProperty(globalThis,'window',{configurable:true,value:{matchMedia:()=>({matches:true})}});
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}});
  assert.equal(readQuizLayout(),'compact');
  saveQuizLayout('detailed');
  assert.equal(values.get(QUIZ_LAYOUT_KEY),'detailed');
  assert.equal(readQuizLayout(),'detailed');
  values.set(QUIZ_LAYOUT_KEY,'malformed');
  assert.equal(readQuizLayout(),'compact');
 }finally{
  if(original)Object.defineProperty(globalThis,'localStorage',original);else delete globalThis.localStorage;
  if(windowDesc)Object.defineProperty(globalThis,'window',windowDesc);else delete globalThis.window;
 }
});
test('quiz controls are immediately accessible, saved and can switch density',()=>{
 for(const token of ["aria-label=\"文字を一段階小さくする\"","aria-label=\"文字を一段階大きくする\"","onTextScale(shiftTextScale(textScale,-1))","onTextScale(shiftTextScale(textScale,1))","onQuizLayout(quizLayout==='compact'?'detailed':'compact')"])
  assert.ok(header.includes(token),token);
 for(const token of ["saveQuizLayout(value)","quizLayout={quizLayout} onQuizLayout={changeQuizLayout}","onTextScale={changeTextScale}"]){
  assert.ok(main.includes(token),token);
 }
 assert.ok(menu.includes('QUIZ LAYOUT'));
 assert.ok(menu.includes('READING SIZE'));
});
test('mobile compact view combines HUD instead of stacking two gameplay cards',()=>{
 assert.ok(combat.includes("quizLayout==='compact'&&!examMode?<CompactQuizHUD"));
 assert.ok(combat.includes("!examMode&&quizLayout==='detailed'&&<div className={'fever-meter '"));
 assert.ok(main.includes("mode==='quiz'&&quizLayout!=='detailed'?'quiz-compact':''"));
 assert.ok(hud.includes('<MonsterArt'));
 assert.ok(hud.includes('comboMultiplier(combo)'));
 assert.ok(hud.includes('aria-valuenow={hp}'));
 assert.ok(hud.includes("boss?bossOutcome(correct,total)"));
 assert.ok(css.includes('grid-template-columns:62px minmax(0,1fr)'));
 assert.ok(css.includes('min-height:45px'));
 assert.ok(css.includes('min-height:44px'));
 assert.ok(css.includes('.app.quiz-compact .answers'));
});
test('exam excludes enemy and combo hints and layouts never overlay answers',()=>{
 assert.ok(combat.includes("quizLayout==='compact'&&!examMode?"));
 assert.ok(header.includes("quizLayout==='detailed'&&!examMode&&<div className=\"combo\""));
 assert.ok(hud.includes('role="progressbar"'));
 assert.equal(css.includes('position:fixed'),false);
 assert.equal(css.includes('position:sticky'),false);
});

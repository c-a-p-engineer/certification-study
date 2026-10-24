import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {isQuizLayout,readQuizLayout,saveQuizLayout,QUIZ_LAYOUT_KEY} from '../src/quizLayout.ts';
const main=readFileSync('src/main.tsx','utf8');
const combat=readFileSync('src/QuizCombatStatus.tsx','utf8');
const header=readFileSync('src/QuizStageHeader.tsx','utf8');
const css=readFileSync('src/nextPhase.css','utf8');
const menu=readFileSync('src/GameMenu.tsx','utf8');
test('focus preference persists using the existing key with no new migration',()=>{
 assert.equal(isQuizLayout('focus'),true);
 assert.equal(isQuizLayout('compact'),true);
 assert.equal(isQuizLayout('detailed'),true);
 const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');const map=new Map();
 try{Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}});
  saveQuizLayout('focus');assert.equal(map.get(QUIZ_LAYOUT_KEY),'focus');assert.equal(readQuizLayout(),'focus');
 }finally{if(original)Object.defineProperty(globalThis,'localStorage',original);else delete globalThis.localStorage}
});
test('focus mode hides monster portrait but leaves readable compact combat progress and restores a status control',()=>{
 assert.ok(combat.includes('quizLayout===\'focus\'&&!examMode?<div className="focus-battle-line"'));
 assert.ok(header.includes('className="cq-focus-toggle"'));
 assert.ok(header.includes("quizLayout==='focus'?'compact':'focus'"));
 assert.ok(main.includes("mode==='quiz'&&quizLayout==='focus'?'quiz-focus':''"));
 assert.ok(menu.includes("['focus','集中表示']"));
 assert.ok(css.includes('.app.quiz-focus .question-card'));
});
test('320, 360 and 400px styles avoid answer overflow, preserve accessible 44px controls and reduced motion',()=>{
 for(const size of [320,360,400])assert.ok(css.includes('@media(max-width:'+size+'px)'));
 assert.ok(css.includes('overflow-wrap:anywhere'));
 assert.ok(css.includes('min-height:44px'));
 assert.ok(css.includes('min-width:0'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(main.includes('questionRef.current?.focus({preventScroll:true})'));
 assert.ok(main.includes("questionRef.current?.scrollIntoView({block:'start',behavior:'auto'})"));
 assert.ok(main.includes('tabIndex={-1}'));
});
test('offline and restore help are explicit and do not delete old progress',()=>{
 const backup=readFileSync('src/BackupPanel.tsx','utf8'),offline=readFileSync('src/OfflineStatus.tsx','utf8');
 assert.ok(backup.includes('復元トラブル時の手順'));
 assert.ok(backup.includes('緊急退避'));
 assert.ok(backup.includes('ブラウザのサイトデータを削除しない'));
 assert.ok(offline.includes('Android・Braveでオフライン学習する手順'));
 assert.ok(offline.includes('ホーム画面に追加'));
 assert.ok(!backup.includes('localStorage.clear('));
});

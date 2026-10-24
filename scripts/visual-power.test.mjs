import test from 'node:test';
import assert from 'node:assert/strict';
import {readVisualPower,saveVisualPower,isVisualPower,VISUAL_POWER_KEY} from '../src/visualPower.ts';
import {readFileSync} from 'node:fs';
const main=readFileSync('src/main.tsx','utf8');
const menu=readFileSync('src/GameMenu.tsx','utf8');
const effects=readFileSync('src/feedbackEffects.css','utf8');

test('visual intensity is opt-in, persisted and fails safely on unsupported storage',()=>{
 assert.equal(readVisualPower(),'balanced');
 assert.equal(isVisualPower('overdrive'),true);
 assert.equal(isVisualPower('dangerously-fast'),false);
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const map=new Map();
 try{
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}});
  saveVisualPower('overdrive');
  assert.equal(map.get(VISUAL_POWER_KEY),'overdrive');
  assert.equal(readVisualPower(),'overdrive');
  map.set(VISUAL_POWER_KEY,'unknown');
  assert.equal(readVisualPower(),'balanced');
 }finally{if(old)Object.defineProperty(globalThis,'localStorage',old);else delete globalThis.localStorage}
});
test('game menu has an explicit safe effect selector and question-sized rewards',()=>{
 assert.ok(menu.includes('VISUAL POWER'));
 assert.ok(menu.includes('disabled={p.reduced}'));
 assert.ok(menu.includes('aria-pressed={p.visualPower===value}'));
 assert.ok(main.includes("visualPower==='overdrive'?'visual-overdrive':''"));
 assert.ok(main.includes('className="title-drop"'));
 assert.ok(main.includes('role="status" aria-live="polite"'));
 assert.ok(readFileSync('src/ResultOverview.tsx','utf8').includes('MISSION RATING'));
 assert.ok(main.includes('comboMilestone(nextCombo)'));
 assert.ok(effects.includes('.app.visual-overdrive .fever-meter.charged'));
 assert.ok(effects.includes('.app.reduced .impact-layer{display:none!important}'));
 assert.ok(effects.includes('@media(prefers-reduced-motion:reduce)'));
});

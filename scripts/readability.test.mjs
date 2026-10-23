import test from 'node:test';
import assert from 'node:assert/strict';
import {readTextScale,saveTextScale,textScaleClass,isTextScale,TEXT_SCALE_KEY} from '../src/readability.ts';
import {readFileSync} from 'node:fs';
const css=readFileSync('src/readability.css','utf8');
const ui=readFileSync('src/GameMenu.tsx','utf8');
const source=readFileSync('src/main.tsx','utf8');
test('text sizes are explicit, persistent and safe when browser storage is absent',()=>{
 assert.equal(readTextScale(),'standard');
 assert.equal(isTextScale('normal'),false);
 assert.equal(isTextScale('extra'),true);
 assert.equal(textScaleClass('standard'),'');
 assert.equal(textScaleClass('extra'),'reading-extra');
 const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const values=new Map();
 try{
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}});
  saveTextScale('large');
  assert.equal(readTextScale(),'large');
  values.set(TEXT_SCALE_KEY,'invalid');
  assert.equal(readTextScale(),'standard');
 }finally{if(original)Object.defineProperty(globalThis,'localStorage',original);else delete globalThis.localStorage}
});
test('quiz answer and explanation typography is readable, adjustable and wraps',()=>{
 for(const token of ['--study-question:24px','--study-answer:17px','--study-explanation:17px','.app.reading-large','.app.reading-extra','overflow-wrap:anywhere','min-height:86px','.answer-body']){
  assert.ok(css.includes(token),token);
 }
 assert.ok(ui.includes('READING SIZE'));
 assert.ok(ui.includes('aria-pressed={p.textScale===value}'));
 assert.ok(source.includes('className="answer-body"'));
 assert.ok(source.includes('textScale={textScale}'));
 assert.ok(source.includes('textScaleClass(textScale)'));
});
test('reward FX cannot block pointer actions or ignore reduced motion',()=>{
 const fx=readFileSync('src/feedbackEffects.css','utf8');
 assert.ok(fx.includes('pointer-events:none'));
 assert.ok(fx.includes('.app.reduced .impact-layer{display:none!important}'));
 assert.ok(fx.includes('.app .title-drop'));
 assert.ok(fx.includes('.app .clear-judgement'));
});

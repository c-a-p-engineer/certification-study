import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {DESIGN_CASES,evaluateDesignChoice,recordDesignCompletion,normalizeDesignProgress} from '../src/designSimulator.ts';
test('at least 3 distinct architect workflows have 3 steps and original AWS references',()=>{
 assert.ok(DESIGN_CASES.length>=3);assert.ok(DESIGN_CASES.length<=5);
 const id=new Set();
 for(const c of DESIGN_CASES){
  assert.equal(c.steps.length,3,c.id);assert.ok(!id.has(c.id));id.add(c.id);
  assert.ok(c.nodes.length>=4&&c.nodes.length<=5);
  const steps=new Set();
  for(const s of c.steps){
   assert.ok(!steps.has(s.id));steps.add(s.id);
   assert.equal(s.options.length,3);
   assert.equal(new Set(s.options.map(x=>x.id)).size,3);
   assert.equal(s.options.filter(x=>x.id===s.correct).length,1);
   assert.ok(s.context.length>=40&&s.why.length>=20);
   assert.equal(new URL(s.reference).hostname,'docs.aws.amazon.com');
   for(const o of s.options)assert.ok(o.feedback.length>=24,c.id+' '+s.id);
  }
 }
});
test('each decision grades exactly one option and provides feedback before progressing',()=>{
 for(const c of DESIGN_CASES)for(const s of c.steps){
  for(const option of s.options){
   const outcome=evaluateDesignChoice(c.id,s.id,option.id);
   assert.equal(outcome.correct,option.id===s.correct);
   assert.ok(outcome.feedback===option.feedback);
   assert.equal(outcome.reference,s.reference);
  }
  assert.throws(()=>evaluateDesignChoice(c.id,s.id,'nope'),/Unknown/);
 }
});
test('cosmetic completion cannot be repeatedly farmed for XP or duplicates',()=>{
 const id=DESIGN_CASES[0].id;
 const first=recordDesignCompletion(undefined,id,3,100);
 assert.equal(first.emblemUnlocked,true);assert.equal(first.bonusXp,0);
 const again=recordDesignCompletion(first.state,id,3,200);
 assert.equal(again.emblemUnlocked,false);assert.equal(again.state.emblems.length,1);
 assert.equal(again.bonusXp,0);
 const fail=recordDesignCompletion(undefined,id,1,100);
 assert.equal(fail.emblemUnlocked,false);
 assert.equal(recordDesignCompletion(undefined,id,4,100).firstClear,false);
});
test('invalid local save cannot create unearned perfect score medals',()=>{
 const normalized=normalizeDesignProgress({records:{'ha-web':{best:999,attempts:2,completedAt:1}},emblems:['ha-web']});
 assert.deepEqual(normalized.emblems,[]);
 assert.deepEqual(normalized.records,{});
});
test('interactive HTML contains keyboard buttons, accessible SVG description and correct score isolation',()=>{
 const ui=readFileSync('src/DesignSimulator.tsx','utf8');
 const main=readFileSync('src/main.tsx','utf8');
 assert.ok(ui.includes('<svg viewBox='));
 assert.ok(ui.includes('<figcaption>'));
 assert.ok(ui.includes('接続順や障害時の経路は表示していません'));
 assert.ok(!ui.includes("nodes.join(' → ')"));
 assert.ok(ui.includes('role="group" aria-label="設計案を選択"'));
 assert.ok(ui.includes('aria-pressed={picked===option.id}'));
 assert.ok(ui.includes('evaluateDesignChoice('));
 assert.ok(ui.includes('追加XPなし'));
 assert.ok(main.includes('recordDesignCompletion(p.designLab'));
 assert.ok(ui.includes('AWS公式資料を確認'));
});

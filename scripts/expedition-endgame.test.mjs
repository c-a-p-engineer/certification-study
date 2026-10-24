import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EXPEDITIONS,expeditionCollectionMilestones,finishExpedition} from '../src/expeditions.ts';
import {planExpeditionJourney} from '../src/expeditionJourney.ts';

test('every themed expedition has a deterministic five-stage, resume-safe telegraph',()=>{
 assert.equal(EXPEDITIONS.length,5);
 for(const e of EXPEDITIONS)for(let i=0;i<5;i++){
  const p=planExpeditionJourney(e.id,i);
  assert.equal(p.total,5);assert.equal(p.current,i+1);
  assert.equal(p.enemy,e.enemy);assert.equal(p.steps.length,5);
  assert.equal(p.steps.filter(s=>s.active).length,1);
  assert.equal(p.steps.filter(s=>s.done).length,i);
 }
 assert.equal(planExpeditionJourney(EXPEDITIONS[0].id,5),null);
 assert.equal(planExpeditionJourney(EXPEDITIONS[0].id,0,10),null);
});
test('cosmetic milestones require distinct cleared themes and actual prior-day proof for rare emblems',()=>{
 const today=Date.parse('2026-10-24T09:00:00Z');
 let current=undefined;
 for(const e of EXPEDITIONS){
  current=finishExpedition(current,e.id,5,5,[],today).state;
 }
 const tiers=expeditionCollectionMilestones(current);
 assert.deepEqual(tiers.map(x=>x.unlocked),[true,true,false]);
 const one=finishExpedition(current,EXPEDITIONS[0].id,5,5,['saa-011','saa-022'],today+1);
 current=one.state;
 const two=finishExpedition(current,EXPEDITIONS[1].id,5,5,['saa-033','saa-044'],today+2);
 current=two.state;
 assert.deepEqual(expeditionCollectionMilestones(current).map(x=>x.unlocked),[true,true,true]);
 const replay=finishExpedition(current,EXPEDITIONS[0].id,5,5,['saa-011','saa-022'],today+3);
 assert.equal(replay.rareUnlocked,false);assert.equal(replay.bonusXp,0);
 assert.equal(replay.state.rare.length,2);
});
test('telegraph is optional and does not obstruct reduced-motion, focus mode or existing quest rewards',()=>{
 const main=readFileSync('src/main.tsx','utf8');
 const view=readFileSync('src/ExpeditionJourneyHUD.tsx','utf8');
 const board=readFileSync('src/ExpeditionBoard.tsx','utf8');
 const css=readFileSync('src/expeditionEndgame.css','utf8');
 assert.ok(main.includes('<ExpeditionJourneyHUD id={expeditionMode} index={index}/>'));
 assert.ok(main.includes('finishExpedition(p.expeditions'));
 assert.ok(view.includes('role')||view.includes('aria-label="探索の進行状況"'));
 assert.ok(view.includes('MonsterArt'));
 assert.ok(board.includes('expeditionCollectionMilestones'));
 assert.ok(css.includes('.app.quiz-focus .expedition-journey{display:none}'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('max-width:420px'));
});

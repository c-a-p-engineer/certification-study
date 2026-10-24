const secondary=readFileSync('src/HomeSecondaryPanels.tsx','utf8');
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {EXPEDITIONS,planExpedition,finishExpedition,normalizeExpeditions} from '../src/expeditions.ts';
import {ENEMIES,initialEnemyCampaign,applyCampaignAnswer,restartCampaign,campaignMaxHp} from '../src/enemyCampaign.ts';
import {eligibleForDelayedRecall} from '../src/retentionQuest.ts';
import {isMissionSave} from '../src/missionSave.ts';
const bank=JSON.parse(readFileSync('src/generated/questions.json','utf8'));
const day=new Date('2026-10-24T12:00:00Z').getTime();
const yesterday=day-86400000;
const review={dueAt:day-2000,lastReviewedAt:yesterday,streak:2,lapses:1,intervalDays:1};
test('five domain expeditions use only unique questions and earnable 5-question pools',()=>{
 assert.equal(EXPEDITIONS.length,5);
 for(const e of EXPEDITIONS){
  const plan=planExpedition(bank,e.id,{},day);
  assert.equal(plan.length,5,e.id);
  assert.equal(new Set(plan.map(x=>x.id)).size,5,e.id);
  assert.ok(plan.every(x=>x.domain===e.domain));
  assert.ok(plan.every(q=>e.keyword.test(q.question+' '+(q.tags??[]).join(' ')+' '+(q.reference??''))),e.id+' includes unrelated topic');
 }
});
test('optional rares require clear >=4 and two distinct qualified delayed correct answers, never extra XP',()=>{
 const id=EXPEDITIONS[0].id;
 const missing=finishExpedition(undefined,id,5,5,[],day);
 assert.equal(missing.success,true);assert.equal(missing.firstClear,true);assert.equal(missing.rareUnlocked,false);
 const earned=finishExpedition(missing.state,id,4,5,['saa-002','saa-012'],day+1000);
 assert.equal(earned.rareUnlocked,true);assert.equal(earned.bonusXp,0);
 assert.deepEqual(earned.state.rare,[id]);
 const repeat=finishExpedition(earned.state,id,5,5,['saa-002','saa-012'],day+2000);
 assert.equal(repeat.rareUnlocked,false);assert.equal(repeat.alreadyRare,true);
 assert.equal(repeat.bonusXp,0);
 assert.equal(repeat.state.records[id].best,5);
 assert.equal(finishExpedition(undefined,id,3,5,['a','b'],day).success,false);
 assert.equal(finishExpedition(undefined,id,5,5,['a','a'],day).rareUnlocked,false);
});
test('invalid expedition records cannot manufacture rare awards',()=>{
 const forged={records:{'iam-guardian':{best:9,attempts:1,lastAt:day,clearedAt:day}},rare:['iam-guardian','fake']};
 assert.deepEqual(normalizeExpeditions(forged).rare,[]);
 assert.deepEqual(normalizeExpeditions({}).rare,[]);
});
test('mission-save extensions do not invalidate older saves',()=>{
 const old={version:1,ids:['a','b','c','d','e'],index:0,selected:null,multiChoices:[],choiceOrder:[0,1,2,3],answers:{},session:{correct:0,total:0},combo:0,weak:false,boss:false,due:false,showChoices:true,reflection:'',savedAt:day};
 assert.equal(isMissionSave(old),true);
 assert.equal(isMissionSave({...old,expeditionId:'iam-guardian',expeditionProof:['a']}),true);
 assert.equal(isMissionSave({...old,expeditionId:'iam-guardian',expeditionProof:['a','a']}),false);
 assert.equal(isMissionSave({...old,expeditionId:'unknown'}),false);
 assert.equal(isMissionSave({...old,expeditionId:'iam-guardian',boss:true}),false);
});
test('NG+ subsequent enemy HP is cycle-scaled after defeat, never resets to base',()=>{
 let state=initialEnemyCampaign();
 for(let n=0;n<1000&&!state.completed;n++)state=applyCampaignAnswer(state,{questionId:'q'+n,correct:true,exam:false,boss:false,combo:8,domain:'セキュリティ'}).state;
 assert.equal(state.completed,true);
 const next=restartCampaign(state);
 assert.equal(next.cycle,1);
 for(let n=0;n<100&&!next.completed;n++){
  const evt=applyCampaignAnswer(next,{questionId:'replay'+n,correct:true,exam:false,boss:false,combo:8});
  Object.assign(next,evt.state);
  if(evt.defeated){assert.equal(evt.bonusXp,0);break;}
 }
 assert.equal(next.stageIndex,1);
 assert.equal(next.hp,campaignMaxHp(ENEMIES[1],1));
});
test('expedition question evidence is computed from prior-day spaced reviews, not spam',()=>{
 assert.equal(eligibleForDelayedRecall(review,day),true);
 assert.equal(eligibleForDelayedRecall({...review,lastReviewedAt:day-500},day),false);
 const main=readFileSync('src/main.tsx','utf8');
 assert.ok(main.includes('setExpeditionProof(ids=>ids.includes(q.id)?ids:[...ids,q.id])'));
 assert.ok(main.includes('expeditionProof:expeditionMode?expeditionProof'));
 assert.ok(main.includes('finishExpedition(p.expeditions'));
 assert.ok(secondary.includes('<ExpeditionBoard {...expedition}/>'));
});

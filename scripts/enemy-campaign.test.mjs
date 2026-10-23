import test from 'node:test';
import assert from 'node:assert/strict';
import {ENEMIES,initialEnemyCampaign,normalizeEnemyCampaign,currentEnemy,comboMultiplier,damageForAnswer,applyCampaignAnswer,campaignCollection} from '../src/enemyCampaign.ts';
const normal=(id,other={})=>({questionId:id,correct:true,exam:false,boss:false,combo:1,difficulty:1,reviewDue:false,previouslyIncorrect:false,...other});
test('nine stable enemy stages with progressive health and unique names',()=>{
 assert.deepEqual(ENEMIES.map(e=>e.id),['slime','zombie','armor','chimera','dragon','cerberus','phoenix','titan','leviathan']);
 assert.ok(ENEMIES.every((e,i)=>i===0||e.hp>ENEMIES[i-1].hp));
 assert.equal(currentEnemy(undefined).id,'slime');
 assert.equal(initialEnemyCampaign().hp,40);
 assert.equal(campaignCollection(undefined).filter(e=>e.discovered).length,1);
});
test('combo scales exact damage; due review, recovery and difficult questions count',()=>{
 assert.deepEqual([0,1,2,3,4,5,6,7,10].map(comboMultiplier),[1,1,1,1.2,1.2,1.5,1.5,2,2]);
 assert.equal(damageForAnswer(normal('a')),10);
 assert.equal(damageForAnswer(normal('b',{combo:3})),12);
 assert.equal(damageForAnswer(normal('c',{combo:5})),15);
 assert.equal(damageForAnswer(normal('d',{combo:7})),20);
 assert.equal(damageForAnswer(normal('e',{combo:7,difficulty:3,reviewDue:true,previouslyIncorrect:true})),34);
 assert.equal(damageForAnswer(normal('f',{correct:false,combo:8})),0);
 assert.equal(damageForAnswer(normal('g',{exam:true})),0);
 assert.equal(damageForAnswer(normal('h',{boss:true})),0);
});
test('enemy HP persists between missions, attacks need distinct correct question IDs',()=>{
 let state=undefined;
 let hit=applyCampaignAnswer(state,normal('q1'));
 assert.equal(hit.state.hp,30);assert.equal(hit.damage,10);assert.equal(hit.credited,true);
 let repeat=applyCampaignAnswer(hit.state,normal('q1',{combo:7}));
 assert.equal(repeat.state.hp,30);assert.equal(repeat.damage,0);assert.equal(repeat.bonusXp,0);
 hit=applyCampaignAnswer(repeat.state,normal('q2'));
 assert.equal(hit.state.hp,20);
 const restored=normalizeEnemyCampaign(JSON.parse(JSON.stringify(hit.state)));
 assert.equal(restored.hp,20);assert.deepEqual(restored.hitIds,['q1','q2']);
 assert.equal(applyCampaignAnswer(restored,normal('wrong',{correct:false})).state.hp,20);
});
test('defeat unlocks next enemy exactly once without attack overflow or duplicated XP',()=>{
 let s=initialEnemyCampaign(),sum=0;
 for(let i=0;i<4;i++){const hit=applyCampaignAnswer(s,normal('q'+i));s=hit.state;sum+=hit.bonusXp;}
 assert.equal(sum,ENEMIES[0].rewardXp);
 assert.equal(s.stageIndex,1);assert.equal(s.hp,ENEMIES[1].hp);
 assert.deepEqual(s.cleared,['slime']);assert.deepEqual(s.hitIds,[]);
 const second=applyCampaignAnswer(s,normal('q0',{combo:3}));
 assert.equal(second.damage,12);assert.equal(second.bonusXp,0);
 assert.equal(second.state.stageIndex,1);
 const tried=applyCampaignAnswer(second.state,normal('q0'));
 assert.equal(tried.bonusXp,0);assert.equal(tried.damage,0);
});
test('long fights need multiple sessions; early win cannot instantly kill a later enemy',()=>{
 let s=undefined;
 for(let i=0;i<4;i++)s=applyCampaignAnswer(s,normal('s'+i)).state;
 let sum=0;
 for(let i=0;i<7;i++){const hit=applyCampaignAnswer(s,normal('z'+i));s=hit.state;sum+=hit.damage;}
 assert.equal(s.stageIndex,1);assert.equal(s.hp,5);assert.equal(sum,70);
 const finish=applyCampaignAnswer(s,normal('z-last',{combo:7}));
 assert.equal(finish.damage,5);
 assert.equal(finish.state.stageIndex,2);
 assert.equal(finish.state.hp,ENEMIES[2].hp);
});
test('last monster completes permanently, extra answers never mint more rewards',()=>{
 let s=initialEnemyCampaign();
 for(let stage=0;stage<ENEMIES.length;stage++){
  let guard=0;
  while(s.stageIndex===stage&&!s.completed){const hit=applyCampaignAnswer(s,normal('stage'+stage+'-q'+guard));s=hit.state;guard++;assert.ok(guard<100);}
 }
 assert.equal(s.completed,true);
 assert.equal(s.hp,0);
 assert.equal(s.cleared.length,ENEMIES.length);
 const extra=applyCampaignAnswer(s,normal('anything',{combo:99}));
 assert.equal(extra.bonusXp,0);assert.equal(extra.damage,0);
 assert.deepEqual(extra.state,s);
});
test('legacy, corrupt and inconsistent progress is safely normalized',()=>{
 assert.deepEqual(normalizeEnemyCampaign(undefined),initialEnemyCampaign());
 assert.deepEqual(normalizeEnemyCampaign({stageIndex:800,hp:-9,cleared:['leviathan']}),initialEnemyCampaign());
 assert.deepEqual(normalizeEnemyCampaign({stageIndex:2,hp:88,cleared:[]}),initialEnemyCampaign());
 assert.deepEqual(normalizeEnemyCampaign({stageIndex:0,hp:-9,cleared:['slime']}),initialEnemyCampaign());
 const first={stageIndex:1,hp:70,cleared:['slime'],hitIds:['q','q',0,null],completed:false};
 const restored=normalizeEnemyCampaign(first);
 assert.deepEqual(restored.hitIds,['q']);
 assert.equal(restored.hp,70);
 assert.equal(applyCampaignAnswer(first,normal('q')).damage,0);
 assert.equal(normalizeEnemyCampaign({stageIndex:ENEMIES.length-1,cleared:ENEMIES.map(e=>e.id),completed:true,hp:0}).completed,true);
});

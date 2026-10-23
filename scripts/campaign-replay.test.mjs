import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {ENEMIES,initialEnemyCampaign,applyCampaignAnswer,normalizeEnemyCampaign,restartCampaign,campaignMaxHp} from '../src/enemyCampaign.ts';
const event=id=>({questionId:id,correct:true,exam:false,boss:false,combo:7,domain:'セキュリティ'});
function clear(){let state=initialEnemyCampaign();let n=0;while(!state.completed&&n<1000){state=applyCampaignAnswer(state,event('unique-'+n)).state;n++}assert.ok(state.completed);return state}
test('replay cannot start until first campaign completion',()=>{
 assert.deepEqual(restartCampaign(initialEnemyCampaign()),initialEnemyCampaign());
});
test('NG+ increases every monster HP without re-granting first-clear XP',()=>{
 const cleared=clear();
 const next=restartCampaign(cleared);
 assert.equal(next.completed,false);assert.equal(next.cycle,1);assert.equal(next.stageIndex,0);
 assert.equal(next.hp,50);assert.equal(next.cleared.length,ENEMIES.length);
 let current=next,total=0;
 for(let n=0;n<300&&!current.completed;n++){const x=applyCampaignAnswer(current,event('replay-'+n));total+=x.bonusXp;current=x.state}
 assert.equal(current.completed,true);assert.equal(total,0);
 assert.equal(normalizeEnemyCampaign(current).cycle,1);
 assert.equal(restartCampaign(current).hp,campaignMaxHp(ENEMIES[0],2));
});
test('corrupt first-run award flags cannot retroactively mark a cleared monster',()=>{
 assert.deepEqual(normalizeEnemyCampaign({stageIndex:0,hp:20,cleared:['slime'],completed:false}),normalizeEnemyCampaign({stageIndex:0,hp:20,cleared:[],completed:false}));
});
test('HUD and archive display cycle number and an opt-in replay button',()=>{
 const board=readFileSync('src/EnemyCampaignPanel.tsx','utf8');
 const main=readFileSync('src/main.tsx','utf8');
 assert.ok(board.includes('NEW GAME+'));assert.ok(board.includes('ROUND'));
 assert.ok(main.includes('restartCampaign(p.enemyCampaign)'));
 assert.ok(main.includes('onReplay='));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {createServer} from 'vite';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {opponentForStage,questHitDamage,enemyHpAfterHit,questBossWon} from '../src/reborn/questBattleEngine.ts';

test('all player-selected routes have a visible opponent, with a fixed final boss',()=>{
 const routes={security:'armor',resilience:'phoenix',performance:'titan',cost:'leviathan'};
 for(const [route,id] of Object.entries(routes)){
  const stage=route==='security'||route==='resilience'?0:1;
  const enemy=opponentForStage(stage,route);
  assert.equal(enemy.id,id);
  assert.equal(enemy.maxHp,[95,135][stage]);
  assert.ok(enemy.name.length>0);
 }
 const boss=opponentForStage(2,'boss');
 assert.deepEqual(boss,{id:'dragon',name:'ARCHITECT DRAGON',maxHp:190});
 assert.throws(()=>opponentForStage(3,'boss'));
 assert.throws(()=>opponentForStage(1,'unknown'));
});
test('only correct real quiz answers deal damage; game skills affect damage predictably',()=>{
 assert.equal(questHitDamage(false,2,9,['amplifier','combo']),0);
 assert.equal(questHitDamage(true,0,1,[]),23);
 assert.equal(questHitDamage(true,0,3,[]),29);
 assert.equal(questHitDamage(true,1,1,['amplifier']),44);
 assert.equal(questHitDamage(true,2,3,['combo']),56);
 assert.equal(questHitDamage(true,2,3,['amplifier','combo']),84);
 assert.throws(()=>questHitDamage(true,-1,1,[]));
});
test('boss victory needs actual zero enemy HP, positive player HP and final stage',()=>{
 assert.equal(questBossWon(2,0,1),true);
 assert.equal(questBossWon(2,1,100),false);
 assert.equal(questBossWon(2,0,0),false);
 assert.equal(questBossWon(1,0,100),false);
 let hp=190;
 for(const combo of [1,2,3,4,5])hp=enemyHpAfterHit(hp,questHitDamage(true,2,combo,[]));
 assert.equal(hp,0,'five consecutive correct answers defeat the boss');
 assert.equal(questBossWon(2,hp,80),true);
 let missHp=190;
 for(const combo of [1,2,0,1,2])missHp=enemyHpAfterHit(missHp,questHitDamage(combo!==0,2,combo,[]));
 assert.ok(missHp>0,'misses can leave boss alive; do not falsely clear');
 assert.throws(()=>enemyHpAfterHit(-1,10));
 assert.equal(enemyHpAfterHit(2,39),0);
});
test('all visual game damage remains isolated from the canonical XP and enemy campaign',()=>{
 const code=readFileSync('src/reborn/questBattleEngine.ts','utf8');
 assert.doesNotMatch(code,/applyStudyAttempt|setProgress|localStorage|CampaignHit|recordBossVictory|updateEnemy/);
 const solo=readFileSync('src/reborn/SoloArcade.tsx','utf8');
 assert.ok(solo.includes('if(!onRecord(current,correct,combo,receipt))'));
 assert.ok(solo.includes("const damage=Math.min(foe.hp,questHitDamage("));
 assert.ok(solo.includes('questBossWon(quest.stage,foe.hp,quest.hp)'));
 assert.ok(solo.includes("quest.cleared?'BOSS DEFEATED!'"));
 assert.ok(solo.includes("quest.stage===2?'BOSS SURVIVED!'"));
 assert.ok(solo.includes('enemyHpAfterHit(value.hp,damage)'));
 assert.doesNotMatch(code,/setInterval|setTimeout/);
});
test('SSR can render actual character and boss with HP and hit text',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const {default:BattleStage}=await vite.ssrLoadModule('/src/reborn/BattleStage.tsx');
  const {default:PlayerAvatar}=await vite.ssrLoadModule('/src/reborn/PlayerAvatar.tsx');
  for(const pose of ['idle','charge','attack','hurt','victory']){
   const html=renderToStaticMarkup(React.createElement(PlayerAvatar,{pose,pulse:3,compact:false}));
   assert.ok(html.includes('cs-avatar-'+pose));
   assert.ok(html.includes('プレイヤーキャラクター'));
  }
  const stage=renderToStaticMarkup(React.createElement(BattleStage,{
   enemyId:'dragon',enemyName:'ARCHITECT DRAGON',enemyHp:107,enemyMaxHp:190,
   playerHp:85,combo:4,boss:true,event:{seq:4,kind:'hit',damage:45}
  }));
  for(const label of ['QUEST RUNのラン内戦闘','プレイヤーのランHP','ARCHITECT DRAGON','ボスHP','107/190','85/100','cs-action-hit','cs-avatar-attack'])assert.ok(stage.includes(label),label);
  assert.ok(stage.includes('mv-dragon'));
  const idle=renderToStaticMarkup(React.createElement(BattleStage,{
   enemyId:'armor',enemyName:'CACHE ARMOR',enemyHp:95,enemyMaxHp:95,
   playerHp:100,combo:0,boss:false,event:{seq:0,kind:'idle',damage:0}
  }));
  assert.ok(idle.includes('cs-avatar-idle'));
  assert.ok(idle.includes('mv-armor'));
  assert.ok(!idle.includes('cs-action-hit'));
  const defeated=renderToStaticMarkup(React.createElement(BattleStage,{
   enemyId:'dragon',enemyName:'ARCHITECT DRAGON',enemyHp:0,enemyMaxHp:190,
   playerHp:40,combo:5,boss:true,event:{seq:5,kind:'hit',damage:10}
  }));
  assert.ok(defeated.includes('ENEMY DOWN'));
  assert.ok(defeated.includes('mv-defeated'));
 }finally{await vite.close()}
});
test('characters appear in quest question, review, blitz and daily screens, without blocking reading',()=>{
 const solo=readFileSync('src/reborn/SoloArcade.tsx','utf8');
 const daily=readFileSync('src/reborn/DailyCode.tsx','utf8');
 assert.ok(solo.includes('<BattleStage enemyId={foe.id}'));
 assert.equal((solo.match(/<BattleStage enemyId=/g)||[]).length,2);
 assert.ok(solo.includes('<PlayerAvatar pose={impact?.correct?'));
 assert.ok(daily.includes('<PlayerAvatar pose={fxReaction==='));
 const css=readFileSync('src/reborn/characterStage.css','utf8');
 for(const marker of ['@media(max-width:420px)','@media(prefers-reduced-motion:reduce)','.reborn.is-reduced','.reborn.rb-fx-off','.cs-hp-label','.cs-mini-row','.cs-avatar-victory'])assert.ok(css.includes(marker),marker);
 assert.ok(css.includes('pointer-events:none'));
});

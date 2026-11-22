import React from 'react';
import MonsterArt from '../MonsterArt.tsx';
import type {EnemyId} from '../enemyCampaign.ts';
import PlayerAvatar,{type AvatarPose} from './PlayerAvatar.tsx';

export type BattleEvent={seq:number;kind:'idle'|'hit'|'hurt';damage:number};
export type BattleStageProps={
 enemyId:EnemyId;
 enemyName:string;
 enemyHp:number;
 enemyMaxHp:number;
 playerHp:number;
 combo:number;
 boss:boolean;
 event:BattleEvent;
};
/** The two characters and their *session-only* HP are always visible during QUEST RUN. */
export default function BattleStage({
 enemyId,enemyName,enemyHp,enemyMaxHp,playerHp,combo,boss,event
}:BattleStageProps){
 const enemyDown=enemyHp===0;
 const pose:AvatarPose=event.kind==='hit'?(enemyDown?'victory':'attack'):event.kind==='hurt'?'hurt':'idle';
 const enemyPercent=Math.max(0,Math.min(100,enemyMaxHp>0?enemyHp/enemyMaxHp*100:0));
 const playerPercent=Math.max(0,Math.min(100,playerHp));
 return <section className={'cs-stage'+(boss?' cs-boss':'')} aria-label="QUEST RUNのラン内戦闘">
  <div className="cs-topline"><span>{boss?'BOSS ENCOUNTER':'ENEMY ENCOUNTER'}</span><strong>{combo>=3?combo+' COMBO · POWER UP':'READY TO ATTACK'}</strong></div>
  <div className="cs-arena">
   <div className="cs-combatant cs-player">
    <div className="cs-actor"><PlayerAvatar pose={pose} pulse={event.seq}/></div>
    <strong>PLAYER</strong>
    <div className="cs-hp-label"><span>ランHP</span><b>{playerHp}/100</b></div>
    <div className="cs-hp" role="progressbar" aria-label="プレイヤーのランHP" aria-valuemin={0} aria-valuemax={100} aria-valuenow={playerHp}><i style={{width:playerPercent+'%'}}/></div>
   </div>
   <div className="cs-middle" aria-hidden="true"><span>VS</span>{event.seq>0&&event.kind!=='idle'&&<div key={event.seq} className={'cs-action cs-action-'+event.kind}><b>{event.kind==='hit'?'−'+event.damage: 'HURT'}</b><i/></div>}</div>
   <div className="cs-combatant cs-enemy">
    <div className={'cs-actor cs-enemy-actor'+(event.kind==='hit'?' cs-enemy-hit':'')} key={event.kind==='hit'?event.seq:'rest'}><MonsterArt id={enemyId} small hpRatio={enemyPercent/100} hit={event.kind==='hit'} defeated={enemyDown}/></div>
    <strong>{enemyName}</strong>
    <div className="cs-hp-label"><span>{boss?'BOSS HP':'敵HP'}</span><b>{enemyHp}/{enemyMaxHp}</b></div>
    <div className="cs-hp cs-enemy-hp" role="progressbar" aria-label={boss?'ボスHP':'敵のラン内HP'} aria-valuemin={0} aria-valuemax={enemyMaxHp} aria-valuenow={enemyHp}><i style={{width:enemyPercent+'%'}}/></div>
   </div>
  </div>
  {enemyDown&&<div className="cs-victory-note">ENEMY DOWN · このステージの残りの問題にも挑戦できます</div>}
 </section>;
}

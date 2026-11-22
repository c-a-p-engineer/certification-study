import React from 'react';
import QuestEnemy3D from './QuestEnemy3D.tsx';
import BattleEnergyFX from './BattleEnergyFX.tsx';
import './battleEnergy.css';
import type {EnemyId} from '../enemyCampaign.ts';
import type {AvatarPose} from './PlayerAvatar.tsx';
import QuestHero3D from './QuestHero3D.tsx';
import type {AvatarAppearance} from './avatarCollection.ts';

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
 appearance?:AvatarAppearance;
 allow3d?:boolean;
 threeD?:boolean;
 onToggle3d?:()=>void;
 variantSeed?:number;
};
/** The two characters and their *session-only* HP are always visible during QUEST RUN. */
export default function BattleStage({
 enemyId,enemyName,enemyHp,enemyMaxHp,playerHp,combo,boss,event,appearance,allow3d=false,threeD=false,onToggle3d,variantSeed=0
}:BattleStageProps){
 const enemyDown=enemyHp===0;
 const pose:AvatarPose=event.kind==='hit'?(enemyDown?'victory':'attack'):event.kind==='hurt'?'hurt':'idle';
 const enemyPercent=Math.max(0,Math.min(100,enemyMaxHp>0?enemyHp/enemyMaxHp*100:0));
 const playerPercent=Math.max(0,Math.min(100,playerHp));
 return <section className={'cs-stage'+(boss?' cs-boss':'')+(allow3d?' cs-stage-3d-capable':'')} aria-label="QUEST RUNのラン内戦闘">
  <div className="cs-topline"><span>{boss?'BOSS ENCOUNTER':'ENEMY ENCOUNTER'}</span><strong>{combo>=3?combo+' COMBO · POWER UP':'READY TO ATTACK'}</strong>{allow3d&&onToggle3d&&<button type="button" className="cs-3d-switch" onClick={onToggle3d} aria-pressed={threeD}>{threeD?'3D表示中 · 2Dへ':'2D表示中 · 3Dへ'}</button>}</div>
  <div className="cs-arena">
   <BattleEnergyFX event={event} combo={combo} enemyDown={enemyDown} boss={boss}/>
   <div className="cs-combatant cs-player">
    <div className="cs-actor"><QuestHero3D enabled={allow3d&&threeD} pose={pose} event={event} appearance={appearance}/></div>
    <strong>PLAYER</strong>
    {allow3d&&threeD&&<small className="cs-3d-disclaimer">3D試作：装備未反映 · 2Dは着せ替え対応</small>}
    <div className="cs-hp-label"><span>ランHP</span><b>{playerHp}/100</b></div>
    <div className="cs-hp" role="progressbar" aria-label="プレイヤーのランHP" aria-valuemin={0} aria-valuemax={100} aria-valuenow={playerHp}><i style={{width:playerPercent+'%'}}/></div>
   </div>
   <div className="cs-middle" aria-hidden="true"><span>VS</span>{event.seq>0&&event.kind!=='idle'&&<div key={event.seq} className={'cs-action cs-action-'+event.kind}><b>{event.kind==='hit'?'−'+event.damage: 'HURT'}</b><i/></div>}</div>
   <div className="cs-combatant cs-enemy">
    <div className={'cs-actor cs-enemy-actor'+(event.kind==='hit'?' cs-enemy-hit':'')}><QuestEnemy3D enabled={allow3d&&threeD} id={enemyId} boss={boss} variantSeed={variantSeed} hp={enemyHp} maxHp={enemyMaxHp} event={event}/></div>
    <strong>{enemyName}</strong>
    {allow3d&&threeD&&<small className="cs-3d-disclaimer">3D敵：CC0モデル · 敵名と外見は試作上異なる場合があります</small>}
    <div className="cs-hp-label"><span>{boss?'BOSS HP':'敵HP'}</span><b>{enemyHp}/{enemyMaxHp}</b></div>
    <div className="cs-hp cs-enemy-hp" role="progressbar" aria-label={boss?'ボスHP':'敵のラン内HP'} aria-valuemin={0} aria-valuemax={enemyMaxHp} aria-valuenow={enemyHp}><i style={{width:enemyPercent+'%'}}/></div>
   </div>
  </div>
  {enemyDown&&<div className="cs-victory-note">ENEMY DOWN · このステージの残りの問題にも挑戦できます</div>}
 </section>;
}

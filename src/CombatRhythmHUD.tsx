import React from 'react';
import CompactQuizHUD from './CompactQuizHUD';
import type {EnemyCampaign,CampaignHit} from './enemyCampaign.ts';
import type {BossDomain} from './bossCampaign.ts';
import './combatRhythm.css';

export type CombatRhythmHUDProps={
 campaign:EnemyCampaign;attack:CampaignHit|null;combo:number;
 bossDomain:BossDomain|null;correct:number;total:number;
 selected:number|null;answerCorrect:boolean;multiChosen:number;multiRequired:number;
 questionId:string;questionNumber:number;accessible:boolean;
};
/** Read-only combat picture-in-picture. No grading, persistence, or damage logic. */
export default function CombatRhythmHUD({
 campaign,attack,combo,bossDomain,correct,total,selected,answerCorrect,
 multiChosen,multiRequired,questionId,questionNumber,accessible
}:CombatRhythmHUDProps){
 const answered=selected!==null;
 const charged=answered?multiRequired:multiChosen;
 const fraction=Math.max(0,Math.min(1,charged/Math.max(1,multiRequired)));
 const state=answered?(answerCorrect?'HIT CONFIRMED':'GUARD / REVIEW'):
  multiRequired>1?(charged>=multiRequired?'FIRE READY':charged?'LOCKING TARGETS':'READY TO LOCK'):'TARGET IN SIGHT';
 const stateClass=answered?(answerCorrect?'od-rhythm-hit':'od-rhythm-guard'):charged?'od-rhythm-aim':'od-rhythm-idle';
 return <aside className={'od-rhythm-rail '+stateClass} aria-hidden={!accessible} aria-label={accessible?'戦闘のライブ表示':undefined}>
  <div className="od-rhythm-label"><span><i className="od-rhythm-online"/> LIVE // TACTICAL HUD</span><span>Q {questionNumber} · {combo} COMBO</span></div>
  <div className="od-rhythm-screen">
   <CompactQuizHUD campaign={campaign} attack={attack} combo={combo} bossDomain={bossDomain} correct={correct} total={total}/>
   <div className="od-rhythm-reticle" aria-hidden="true"><span>+</span></div>
   {answered&&<div key={questionId+':'+questionNumber+':'+selected} className="od-rhythm-impact" aria-hidden="true">{answerCorrect?'HIT!':'BLOCK!'}</div>}
  </div>
  <div className="od-rhythm-channel" aria-hidden="true">
   <span className="od-rhythm-signal">{state}</span>
   <div className="od-rhythm-charge"><i style={{width:fraction*100+'%'}}/></div>
   <span className="od-rhythm-pct">{Math.round(fraction*100)}%</span>
  </div>
 </aside>;
}

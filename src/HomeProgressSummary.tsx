import React from 'react';

/** Display-only dashboard numbers; all learning state stays in the controller. */
export default function HomeProgressSummary({xp,answered,correct,reviewDue,bestCombo}:{xp:number;answered:number;correct:number;reviewDue:number;bestCombo:number}){
 return <section className="stats" aria-label="学習状況の概要">
  <div className="stat"><span>XP</span><strong>{xp.toLocaleString()}</strong></div>
  <div className="stat"><span>ACCURACY</span><strong>{answered?Math.round(correct/answered*100):0}<em>%</em></strong><small>{answered}回答</small></div>
  <div className="stat"><span>REVIEW DUE</span><strong>{reviewDue}</strong></div>
  <div className="stat"><span>BEST COMBO</span><strong>{bestCombo}<em> HIT</em></strong></div>
 </section>;
}

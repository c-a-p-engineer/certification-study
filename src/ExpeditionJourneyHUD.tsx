import React from 'react';
import {planExpeditionJourney,type ExpeditionJourneyId} from './expeditionJourney.ts';
import MonsterArt from './MonsterArt';
import './expeditionEndgame.css';

/** Read-only encounter path. Question grading, campaign HP and XP remain in their own reducer. */
export default function ExpeditionJourneyHUD({id,index}:{id:ExpeditionJourneyId;index:number}){
 const path=planExpeditionJourney(id,index);
 if(!path)return null;
 return <section className="expedition-journey" aria-label="探索の進行状況">
  <div className="expedition-journey-portrait"><MonsterArt id={path.enemy} small/></div>
  <div className="expedition-journey-body">
   <div className="expedition-journey-heading"><strong>{path.title}</strong><span>{path.current} / {path.total}</span></div>
   <p className="expedition-telegraph">{path.telegraph}</p>
   <ol aria-label="5段階の探索進行">{path.steps.map(step=><li key={step.order} className={step.active?'current':step.done?'done':''}
      aria-current={step.active?'step':undefined}><span>{step.order}</span>{step.label}</li>)}</ol>
  </div>
 </section>;
}

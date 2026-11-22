import React from 'react';
import type {BattleEvent} from './BattleStage.tsx';

const MOTES=Array.from({length:9},(_,index)=>index);

/**
 * A display-only battle layer. Motion responds to already committed quiz
 * events, never performs scoring or schedules new game actions.
 */
export default function BattleEnergyFX({event,combo,enemyDown,boss}:{
 event:BattleEvent;combo:number;enemyDown:boolean;boss:boolean;
}){
 const active=event.seq>0&&event.kind!=='idle';
 return <div className={'bfx-field'+(combo>=3?' bfx-charged':'')+(combo>=5?' bfx-overdrive':'')+(enemyDown?' bfx-defeated':'')+(boss?' bfx-boss':'')} aria-hidden="true">
  <div className="bfx-atmosphere bfx-atmosphere-player"/>
  <div className="bfx-atmosphere bfx-atmosphere-enemy"/>
  <div className="bfx-floor bfx-floor-player"><i/><b/></div>
  <div className="bfx-floor bfx-floor-enemy"><i/><b/></div>
  <div className="bfx-crossfire"><i/><b/></div>
  <div className="bfx-motes">{MOTES.map(index=><i key={index}/>)}</div>
  <div className="bfx-hero-aura"><i/><b/></div>
  {active&&<div className={'bfx-strike bfx-strike-'+event.kind+(enemyDown&&event.kind==='hit'?' bfx-finisher':'')} key={event.seq} data-battle-event={event.kind} data-event-seq={event.seq}>
   <i className="bfx-tracer"/>
   <i className="bfx-core"/>
   <i className="bfx-impact"/>
   <i className="bfx-shock"/>
   <span className="bfx-shards">{[0,1,2,3,4,5].map(i=><b key={i}/>)}</span>
  </div>}
  {enemyDown&&<div className="bfx-defeat-mark"><i/><b/></div>}
 </div>;
}

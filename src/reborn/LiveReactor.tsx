import React from 'react';
import {Flame,Radio,Zap} from 'lucide-react';
import {reactorCharge} from './reactorMath.ts';

export type ReactorMode='study'|'exam'|'quest'|'blitz'|'code';
export type ReactorReaction='idle'|'select'|'correct'|'wrong';
export type LiveReactorProps={
 mode:ReactorMode;
 charge?:number;
 pulse?:number;
 reaction?:ReactorReaction;
};
const TITLES:Record<ReactorMode,string>={
 study:'STUDY ENGINE',
 exam:'EXAM FOCUS',
 quest:'QUEST REACTOR',
 blitz:'SPEED CORE',
 code:'CODE CIRCUIT'
};
/**
 * Entirely decorative, self-contained animation. No interval, score mutation
 * or audio playback: those come from the canonical answer handlers.
 */
export default function LiveReactor({mode,charge=0,pulse=0,reaction='idle'}:LiveReactorProps){
 const maximum=mode==='code'?4:5;
 const level=Math.min(maximum,reactorCharge(charge));
 return <div className={'lrv-reactor lrv-'+mode+' lrv-react-'+reaction} data-reactor-mode={mode} aria-hidden="true">
  <div className="lrv-grid"/>
  <div className="lrv-sweep lrv-sweep-a"/>
  <div className="lrv-sweep lrv-sweep-b"/>
  <div className="lrv-core">
   <i className="lrv-orbit lrv-orbit-first"/>
   <i className="lrv-orbit lrv-orbit-second"/>
   <i className="lrv-heart"/>
  </div>
  <div className="lrv-sparks">{Array.from({length:6},(_,i)=><i key={i} className={'lrv-spark lrv-spark-'+i}/>)}</div>
  {pulse>0&&reaction!=='idle'&&<div className={'lrv-impact lrv-impact-'+reaction} key={pulse}><i/><i/><i/></div>}
  <div className="lrv-readout">
   <div className="lrv-title"><Radio size={13}/><span>{TITLES[mode]}</span></div>
   <div className="lrv-charge"><span>{mode==='code'?'MATCH POWER':mode==='blitz'?'COMBO FLOW':mode==='quest'?'BATTLE FLOW':mode==='exam'?'CONCENTRATE':'STUDY FLOW'}</span><strong>{mode==='exam'?'ON':level+'/'+maximum}</strong></div>
   {mode!=='exam'&&<div className="lrv-cells">{Array.from({length:maximum},(_,i)=><i key={i} className={i<level?'is-lit':''}/>)}</div>}
  </div>
  <div className="lrv-mark">{mode==='blitz'?<Zap size={17}/>:mode==='quest'?<Flame size={17}/>:<Radio size={17}/>}</div>
 </div>;
}

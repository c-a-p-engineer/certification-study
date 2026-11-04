import React,{useEffect,useRef,useState} from 'react';
import type {BossDomain} from './bossCampaign.ts';
import type {Boss3DDriver} from './boss3dScene.ts';
import BossArmorBreak from './BossArmorBreak';
import {bossArmorPhase} from './bossArmorPhase.ts';
import './bossArena3d.css';

/** Actual 3D is lazy-loaded only in optional boss + detailed + OVERDRIVE mode. */
export default function BossArena3D({domain,remaining,target,correct}:{
 domain:BossDomain;remaining:number;target:number;correct:number;
}){
 const host=useRef<HTMLDivElement|null>(null);
 const driver=useRef<Boss3DDriver|null>(null);
 const latest=useRef({remaining,target,correct});
 latest.current={remaining,target,correct};
 const [status,setStatus]=useState<'loading'|'ready'|'fallback'>('loading');
 useEffect(()=>{
  let cancelled=false;
  setStatus('loading');
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setStatus('fallback');return;}
  const element=host.current;
  if(!element)return;
  // Bundle split point; main quiz bundle never contains Three.js.
  void import('./boss3dScene.ts').then(({mountBoss3D})=>{
   if(cancelled)return;
   const context=mountBoss3D(element,domain,()=>{if(!cancelled)setStatus('fallback')});
   if(cancelled){context.dispose();return;}
   driver.current=context;
   context.update(latest.current.remaining,latest.current.target,latest.current.correct);
   setStatus('ready');
  }).catch(()=>{if(!cancelled)setStatus('fallback')});
  return ()=>{cancelled=true;driver.current?.dispose();driver.current=null};
 },[domain]);
 useEffect(()=>{driver.current?.update(remaining,target,correct)},[remaining,target,correct]);
 const phase=bossArmorPhase(remaining,target);
 return <div className={'od4-boss-3d od4-boss-3d-'+phase}>
  {status!=='ready'&&<BossArmorBreak domain={domain} remaining={remaining} target={target} correct={correct}/>}
  <div className="od4-boss-3d-stage" ref={host} aria-hidden="true" style={{opacity:status==='ready'?1:0}}/>
  {status==='ready'&&<div className="od4-boss-3d-overlay" aria-hidden="true">
   <span className="od4-boss-3d-tag">3D / TACTICAL ARENA</span>
   <strong>{phase==='broken'?'TARGET DISASSEMBLED':phase==='exposed'?'CORE EXPOSED':phase==='strained'?'ARMOR FRACTURED':'ARMORED TARGET LOCKED'}</strong>
   <span className="od4-boss-3d-hint">{phase==='broken'?'SHIELD 0 // DEFEATED':'EACH CORRECT ANSWER BREACHES ARMOR'}</span>
  </div>}
 </div>;
}

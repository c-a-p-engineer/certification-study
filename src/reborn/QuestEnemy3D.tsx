import React,{useEffect,useRef,useState} from 'react';
import MonsterArt from '../MonsterArt.tsx';
import type {EnemyId} from '../enemyCampaign.ts';
import type {BattleEvent} from './BattleStage.tsx';
import {SKELETON_LABELS,questEnemyVariant} from './questEnemyVariant.ts';
import type {Enemy3DDriver} from './questEnemy3DScene.ts';

type LoadState={key:string;phase:'loading'|'ready'|'fallback'};
export default function QuestEnemy3D({enabled,id,boss,hp,maxHp,event}:{
 enabled:boolean;id:EnemyId;boss:boolean;hp:number;maxHp:number;event:BattleEvent;
}){
 const variant=questEnemyVariant(id,boss);
 const host=useRef<HTMLDivElement|null>(null);
 const driver=useRef<Enemy3DDriver|null>(null);
 const latest=useRef({hp,event});latest.current={hp,event};
 const [load,setLoad]=useState<LoadState>({key:variant,phase:'loading'});
 // A stale 'fallback' from a previous stage must not reveal the old SVG for one render.
 const phase=!enabled?'fallback':load.key===variant?load.phase:'loading';
 useEffect(()=>{
  let cancelled=false;
  driver.current?.dispose();driver.current=null;
  if(!enabled){setLoad({key:variant,phase:'fallback'});return}
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||typeof window.WebGLRenderingContext==='undefined'){
   setLoad({key:variant,phase:'fallback'});return;
  }
  const element=host.current;
  if(!element)return;
  setLoad({key:variant,phase:'loading'});
  void import('./questEnemy3DScene.ts').then(({mountQuestEnemy3D})=>mountQuestEnemy3D(element,variant,()=>{
   if(cancelled)return;
   driver.current?.dispose();driver.current=null;
   setLoad({key:variant,phase:'fallback'});
  })).then(instance=>{
   if(cancelled){instance.dispose();return}
   driver.current=instance;
   instance.update(latest.current.event,latest.current.hp);
   setLoad({key:variant,phase:'ready'});
  }).catch(()=>{if(!cancelled)setLoad({key:variant,phase:'fallback'})});
  return()=>{cancelled=true;driver.current?.dispose();driver.current=null};
 },[enabled,variant]);
 useEffect(()=>{driver.current?.update(event,hp)},[event.seq,event.kind,event.damage,hp]);
 return <div className="cs-hero-viewport cs-enemy-viewport" data-enemy-variant={variant}>
  {phase==='fallback'&&<div className="cs-hero-2d cs-enemy-2d"><MonsterArt id={id} small hpRatio={maxHp>0?hp/maxHp:0} hit={event.kind==='hit'} defeated={hp===0}/></div>}
  {phase==='loading'&&<span className="cs-model-loading" role="status">敵3D準備中</span>}
  <div className="cs-hero-3d-host" ref={host} aria-hidden="true" style={{opacity:phase==='ready'?1:0}}/>
  {phase==='ready'&&<span className="cs-3d-label" aria-hidden="true">{SKELETON_LABELS[variant].toUpperCase()} / 3D</span>}
 </div>;
}

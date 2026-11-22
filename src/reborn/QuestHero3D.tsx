import React,{useEffect,useRef,useState} from 'react';
import PlayerAvatar,{type AvatarPose} from './PlayerAvatar.tsx';
import type {AvatarAppearance} from './avatarCollection.ts';
import type {BattleEvent} from './BattleStage.tsx';
import type {Hero3DDriver,Hero3DReaction} from './questHero3DScene.ts';

export default function QuestHero3D({enabled,appearance,pose,event}:{
 enabled:boolean;appearance?:AvatarAppearance;pose:AvatarPose;event:BattleEvent
}){
 const host=useRef<HTMLDivElement|null>(null);
 const driver=useRef<Hero3DDriver|null>(null);
 const heroEvent:Hero3DReaction={...event,kind:pose==='victory'?'victory':event.kind};
 const latest=useRef(heroEvent);
 latest.current=heroEvent;
 const [load,setLoad]=useState<{forEnabled:boolean;phase:'loading'|'ready'|'fallback'}>({forEnabled:true,phase:'loading'});
 // Do not show the old SVG during 3D startup or a 2D→3D switch.
 const status=!enabled?'fallback':load.forEnabled?load.phase:'loading';
 useEffect(()=>{
  let cancelled=false;
  driver.current?.dispose();driver.current=null;
  if(!enabled){setLoad({forEnabled:enabled,phase:'fallback'});return}
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced||typeof window.WebGLRenderingContext==='undefined'){setLoad({forEnabled:true,phase:'fallback'});return}
  const mount=host.current;
  if(!mount)return;
  setLoad({forEnabled:true,phase:'loading'});
  // This imports a dedicated Three.js chunk *only when QUEST RUN 3D is enabled*.
  void import('./questHero3DScene.ts').then(({mountQuestHero3D})=>mountQuestHero3D(mount,()=>{
   if(cancelled)return;
   driver.current?.dispose();driver.current=null;setLoad({forEnabled:true,phase:'fallback'});
  })).then(instance=>{
   if(cancelled){instance.dispose();return}
   driver.current=instance;
   instance.update(latest.current);
   setLoad({forEnabled:true,phase:'ready'});
  }).catch(()=>{if(!cancelled)setLoad({forEnabled:true,phase:'fallback'})});
  return()=>{cancelled=true;driver.current?.dispose();driver.current=null};
 },[enabled]);
 useEffect(()=>{driver.current?.update(heroEvent)},[event.seq,event.kind,event.damage,pose]);
 const shown=enabled&&status==='ready';
 return <div className="cs-hero-viewport">
  {status==='fallback'&&<div className="cs-hero-2d"><PlayerAvatar pose={pose} pulse={event.seq} appearance={appearance}/></div>}
  {status==='loading'&&<span className="cs-model-loading" role="status">味方3D準備中</span>}
  <div className="cs-hero-3d-host" ref={host} aria-hidden="true" style={{opacity:shown?1:0}}/>
  {shown&&<span className="cs-3d-label" aria-hidden="true">KAYKIT MAGE / 3D</span>}
 </div>
}

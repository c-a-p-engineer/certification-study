import React from 'react';
import {ChevronDown,Compass,Medal,ShieldCheck,Swords} from 'lucide-react';
import {EXPEDITIONS,normalizeExpeditions,type ExpeditionId,type ExpeditionProgress} from './expeditions.ts';
import MonsterArt from './MonsterArt';
import './nextPhase.css';
export default function ExpeditionBoard({progress,onLaunch,available}:{progress?:ExpeditionProgress;onLaunch:(id:ExpeditionId)=>void;available:Partial<Record<ExpeditionId,number>>}){
 const state=normalizeExpeditions(progress),cleared=Object.values(state.records).filter(x=>x?.clearedAt!==undefined).length;
 return <section className="expedition-board" aria-labelledby="expedition-title">
  <div className="expedition-head"><span><Compass size={17}/> MONSTER MASTERY EXPEDITIONS</span><h2 id="expedition-title">KNOWLEDGE EXPEDITIONS</h2>
   <p>実際のAWS設計問題で5体の守護者に挑む。4問以上の正解で討伐、前日以前の期限到来復習を2問成功すると限定エンブレム。</p>
   <div className="expedition-totals"><strong>{cleared}/5 CLEAR</strong><strong><Medal size={16}/> {state.rare.length}/5 RARE EMBLEMS</strong></div>
  </div>
  <details className="expedition-collection">
   <summary><Swords size={17}/> 探索先を選ぶ <ChevronDown size={17}/></summary>
   <div className="expedition-grid">{EXPEDITIONS.map(e=>{const rec=state.records[e.id],rare=state.rare.includes(e.id),count=available[e.id]??0;return <article key={e.id} className="expedition-item">
    <div className="expedition-monster"><MonsterArt id={e.enemy} small/></div><div className="expedition-copy"><strong>{e.title}</strong><small>{e.subtitle} · {e.domain}</small><span>{rare?'✦ RARE EMBLEM':rec?.clearedAt?'CLEAR · 通常討伐':'未踏破'} · {rec?.best??0}/5 BEST</span></div>
    <button type="button" onClick={()=>onLaunch(e.id)} disabled={count<5} aria-label={e.title+'に挑戦 · '+count+'問'}>{count<5?'問題不足':'5問で挑戦'}</button>
   </article>})}</div>
  </details>
  <p className="expedition-caveat"><ShieldCheck size={15}/> レア報酬は1探索先につき初回だけ。追加XPはありません。正しい復習を評価し、周回回数だけでは獲得できません。探索は任意です。</p>
 </section>;
}

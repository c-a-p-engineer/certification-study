import React from 'react';
import {CheckCircle2,Crown,Diamond,Gem,LockKeyhole,Sparkles} from 'lucide-react';
import type {Relic} from './relicSystem.ts';
import './overdrive4.css';
export default function RelicVault({relics,equipped,onEquip}:{relics:readonly Relic[];equipped:string|null;onEquip:(id:string)=>void}){
 const unlocked=relics.filter(r=>r.unlocked).length;
 return <section className="od4-vault" aria-labelledby="od4-vault-title">
  <header className="od4-heading"><div><span className="od4-kicker"><Gem size={18}/> KNOWLEDGE RELICS</span><h2 id="od4-vault-title">RELIC VAULT</h2></div><div className="od4-count"><Diamond size={17}/>{unlocked} / {relics.length} 獲得</div></header>
  <div className="od4-relic-grid">{relics.map(relic=>{
   const owned=relic.unlocked,isEquipped=equipped===relic.id;
   return <article key={relic.id} className={'od4-relic od4-'+relic.rarity.toLowerCase()+(owned?' od4-owned':' od4-locked')}>
    <div className="od4-relic-art" aria-hidden="true">{owned?<Crown size={29}/>:<LockKeyhole size={27}/>}</div>
    <span className="od4-rarity">{relic.rarity}</span><h3>{relic.name}</h3>
    <p>{owned?relic.description:relic.condition}</p>
    <button type="button" disabled={!owned||isEquipped} onClick={()=>onEquip(relic.id)}>{isEquipped?<><CheckCircle2 size={16}/> 装備中</>:owned?<><Sparkles size={16}/> 装備する</>:<><LockKeyhole size={15}/> 未獲得</>}</button>
   </article>;
  })}</div>
  <p className="od4-note">レリックは学習実績で必ず解放される装飾品です。ランダム課金、能力補正、合格予測には使いません。</p>
 </section>;
}
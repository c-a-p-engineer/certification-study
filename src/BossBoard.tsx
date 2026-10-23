import React from 'react';
import {ArrowRight,Flame,Shield,Skull,Trophy} from 'lucide-react';
import {BOSSES,normalizeBossRecords,bossOutcome,type BossDomain,type BossRecords} from './bossCampaign.ts';
import MonsterArt from './MonsterArt';
import './overdrive4.css';
export default function BossBoard({records,onChallenge}:{records?:BossRecords;onChallenge:(domain:BossDomain)=>void}){
 const saved=normalizeBossRecords(records);
 const cleared=BOSSES.filter(b=>saved[b.domain]).length;
 return <section className="od4-boss-board" aria-labelledby="od4-boss-title">
  <header className="od4-heading"><div><span className="od4-kicker"><Flame size={18}/> ARCHITECT'S TRIAL</span><h2 id="od4-boss-title">FOUR DOMAIN BOSSES</h2></div><div className="od4-count"><Trophy size={18}/>{cleared} / 4 討伐</div></header>
  <div className="od4-boss-grid">{BOSSES.map((boss,i)=>{
   const record=saved[boss.domain],medal=record?bossOutcome(record.bestCorrect,10).grade:null;
   return <article key={boss.code} className={'od4-boss-card od4-boss-'+i+(record?' od4-cleared':'')}>
    <div className="od4-boss-crest" aria-hidden="true"><MonsterArt id={(['cerberus','phoenix','titan','leviathan'] as const)[i]} hpRatio={record?0.4:1}/></div>
    <div className="od4-boss-meta"><span>DOMAIN {String(i+1).padStart(2,'0')}</span><span>{boss.domain}</span></div>
    <h3>{boss.name}</h3><p>{boss.subtitle}</p>
    <div className="od4-boss-intel"><Shield size={15}/>{boss.weakness}</div>
    <div className="od4-boss-medal">{medal?<><Trophy size={17}/> BEST {medal} · {record!.bestCorrect}/10</>:<><Skull size={16}/> UNDEFEATED · 7/10 TO WIN</>}</div>
    <button type="button" className="od4-launch" onClick={()=>onChallenge(boss.domain)} aria-label={boss.domain+'のボス戦を始める'}>{medal?'再挑戦':'討伐に挑戦'} <ArrowRight size={18}/></button>
   </article>;
  })}</div>
  <p className="od4-note">各ボスはその分野の難問10問。7問正解で討伐、9問でA、10問でS。初討伐と勲章昇格時のみ追加XPを獲得できます。</p>
 </section>;
}
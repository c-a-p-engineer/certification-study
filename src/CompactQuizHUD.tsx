import React from 'react';
import {Flame,Shield,Skull,Trophy,Zap} from 'lucide-react';
import {ENEMIES,normalizeEnemyCampaign,comboMultiplier,campaignMaxHp,type EnemyCampaign,type CampaignHit} from './enemyCampaign.ts';
import {bossFor,bossOutcome,type BossDomain} from './bossCampaign.ts';
import MonsterArt from './MonsterArt';

/** One-row battle HUD keeps the question and answer choices within a narrow viewport.
 * Detailed monster art, explanations and telemetry remain one tap away via view preference.
 */
export default function CompactQuizHUD({campaign,attack,combo,bossDomain,correct,total}:{
 campaign?:EnemyCampaign;attack?:CampaignHit|null;combo:number;bossDomain:BossDomain|null;correct:number;total:number
}){
 const state=normalizeEnemyCampaign(campaign);
 const boss=bossDomain?bossFor(bossDomain):null;
 const battle=boss?bossOutcome(correct,total):null;
 const current=ENEMIES[state.stageIndex];
 const monster=attack?.defeated??current;
 const id=boss?({'セキュリティ':'cerberus','耐障害性':'phoenix','パフォーマンス':'titan','コスト最適化':'leviathan'} as const)[boss.domain]:monster.id;
 const name=boss?.name??(state.completed&&!attack?.defeated?'ALL CLEAR':monster.name);
 const maxHp=battle?.target??campaignMaxHp(monster,state.cycle??0);
 const hp=battle?.remaining??(attack?.defeated?0:state.hp);
 const ratio=maxHp?Math.max(0,Math.min(1,hp/maxHp)):0;
 const damage=attack?.credited?attack.damage:0;
 return <section className={'cq-hud '+(ratio<=.25?'cq-hud-critical':'')} aria-label="戦闘ステータス">
  <div className="cq-hud-portrait"><MonsterArt id={id} hpRatio={ratio} hit={damage>0} defeated={!!attack?.defeated||!!battle?.victory}/></div>
  <div className="cq-hud-content">
   <div className="cq-hud-top"><strong title={name}>{name}</strong><span>{hp} / {maxHp} HP</span></div>
   <div className="cq-hud-meter" role="progressbar" aria-label="敵の残りHP" aria-valuemin={0} aria-valuemax={maxHp} aria-valuenow={hp}><div style={{width:ratio*100+'%'}}/></div>
   <div className="cq-hud-bottom">
    <span className="cq-hud-combo"><Flame size={14}/> {combo} COMBO <b>×{comboMultiplier(combo).toFixed(1)}</b></span>
    {boss?<span className="cq-hud-note">{battle?.victory?<><Trophy size={14}/> 討伐達成</>:<><Shield size={14}/> {battle?.remaining} HIT</>}</span>:
     attack?.defeated?<span className="cq-hud-note"><Trophy size={14}/> 撃破 +{attack.bonusXp} XP</span>:
     damage>0?<span className="cq-hud-note"><Zap size={14}/> -{damage} DMG</span>:
     state.completed?<span className="cq-hud-note"><Trophy size={14}/> ALL CLEAR</span>:
     <span className="cq-hud-note"><Skull size={13}/> {state.stageIndex+1} / {ENEMIES.length}</span>}
   </div>
  </div>
 </section>;
}

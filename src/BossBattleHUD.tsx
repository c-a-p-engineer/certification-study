import React from 'react';
import {Flame,ShieldAlert,Swords} from 'lucide-react';
import {bossFor,bossOutcome,type BossDomain} from './bossCampaign.ts';
import MonsterArt from './MonsterArt';
import './overdrive4.css';
export default function BossBattleHUD({domain,correct,total,combo}:{domain:BossDomain;correct:number;total:number;combo:number}){
 const boss=bossFor(domain)!,battle=bossOutcome(correct,total);
 return <div className={'od4-battle-hud '+(battle.victory?'od4-battle-broken':'')} aria-label="ボス戦の状態">
  <div className="od4-battle-identity"><div className="od4-battle-avatar"><MonsterArt id={({'セキュリティ':'cerberus','耐障害性':'phoenix','パフォーマンス':'titan','コスト最適化':'leviathan'} as const)[domain]} hpRatio={battle.hpPercent/100} hit={correct>0}/></div><div><span>DOMAIN BOSS · {domain}</span><strong>{boss.name}</strong></div><div className="od4-battle-phase">{battle.victory?'SHIELD BROKEN':battle.remaining<=2?'FINAL PHASE':'BATTLE LIVE'}</div></div>
  <div className="od4-battle-health"><div className="od4-battle-health-title"><span><ShieldAlert size={15}/> ENEMY SHIELD</span><strong>{battle.remaining} HIT LEFT</strong></div><div className="od4-battle-health-track" role="progressbar" aria-label="ボスの残りシールド" aria-valuemin={0} aria-valuemax={battle.target} aria-valuenow={battle.remaining}><div style={{width:battle.hpPercent+'%'}}/></div></div>
  <div className="od4-battle-help"><span>{battle.victory?'討伐達成！残りの問題で勲章を磨け': '正解で1ダメージ · 7正解で討伐'}</span><span><Flame size={14}/> {combo} COMBO</span></div>
 </div>;
}
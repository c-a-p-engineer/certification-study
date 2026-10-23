import React from 'react';
import {ArrowRight,BookOpen,Flame,Shield,Skull,Sparkles,Swords,Trophy,Zap} from 'lucide-react';
import {ENEMIES,campaignCollection,normalizeEnemyCampaign,campaignMaxHp,type CampaignHit,type EnemyCampaign} from './enemyCampaign.ts';
import MonsterArt from './MonsterArt';
import './enemyVisual.css';

export default function EnemyCampaignPanel({campaign,compact=false,attack,onStart,onReplay}:{
 campaign?:EnemyCampaign;compact?:boolean;attack?:CampaignHit|null;onStart?:()=>void;onReplay?:()=>void
}){
 const state=normalizeEnemyCampaign(campaign);
 const enemy=attack?.defeated??ENEMIES[state.stageIndex];
 const hp=attack?.defeated?0:state.hp;
 const done=state.completed&&!attack?.defeated;
 const maxHp=campaignMaxHp(enemy,state.cycle??0);
 const pct=maxHp?Math.round(hp/maxHp*100):0;
 const collection=campaignCollection(state);
 const cleared=collection.filter(item=>item.cleared).length;
 return <section className={'ec-panel '+(compact?'ec-compact ':'')+(pct<=25?'ec-danger':'')} aria-label="ENEMY CAMPAIGN">
  <div className="ec-panel-header"><span className="ec-kicker"><Swords size={16}/> ENEMY CAMPAIGN</span><span className="ec-stage-number">{done?'ALL CLEAR':`STAGE ${state.stageIndex+1} / ${ENEMIES.length}`} · ROUND {(state.cycle??0)+1} · {cleared} 討伐</span></div>
  <div className="ec-panel-layout">
   <div className="ec-portrait"><MonsterArt key={attack?.defeated?attack.defeated.id+'-down':enemy.id+'-'+(attack?.credited?String(attack.damage):'idle')} id={enemy.id} hpRatio={pct/100} hit={!!attack?.credited} defeated={!!attack?.defeated}/></div>
   <div className="ec-info">
    <h2>{done?'CAMPAIGN COMPLETE':enemy.name}</h2>
    <p className="ec-description">{done?'9体を討伐！新たな周回では敵のHPが増加。初討伐XPは再付与されません':enemy.description}</p>
    <div className="ec-health-head"><span><Shield size={16}/> {done?'VICTORY':'ENEMY HP'}</span><strong>{hp} / {maxHp}</strong></div>
    <div className="ec-health-track" role="progressbar" aria-label={enemy.short+'の残りHP'} aria-valuemin={0} aria-valuemax={maxHp} aria-valuenow={hp}><div style={{width:pct+'%'}}/></div>
    {attack?.defeated?<div className="ec-damage ec-clear" role="status"><Trophy size={18}/> {attack.defeated.short} 撃破！ +{attack.bonusXp} XP · NEXT ENEMY UNLOCKED</div>:
     attack?.credited?<div className="ec-damage" role="status"><Zap size={17}/> -{attack.damage} DMG · COMBO x{attack.multiplier.toFixed(1)}{attack.critical?' · BONUS HIT':''}</div>:
     attack&&!attack.credited?<div className="ec-damage ec-no-damage" role="status">この問題は現在の敵への攻撃に使用済み</div>:null}
    <p className="ec-help">{done?'すべての勲章を集め、AWSの設計力を鍛えよう':compact?'通常練習の正解で攻撃。HPは次のミッションにも引き継がれます':'異なる問題に正解して攻撃。3コンボで1.2倍、5で1.5倍、7で2倍。難問・復習・苦手克服は追加ダメージ。'}</p>
    {onStart&&!done&&<button className="ec-panel-cta" type="button" onClick={onStart}>モンスターに挑む <ArrowRight size={17}/></button>}
    {done&&onReplay&&<button className="ec-panel-cta ec-replay" type="button" onClick={onReplay}>NEW GAME+ · ROUND {(state.cycle??0)+2}へ <ArrowRight size={17}/></button>}
    {(state.cycle??0)>0&&<div className="ec-ng-plus"><Flame size={15}/> HARD MODE · HP +{Math.min(100,(state.cycle??0)*25)}% · 追加討伐XPなし</div>}
   </div>
  </div>
  {!compact&&<details className="ec-collection ec-combat-log">
   <summary><Flame size={17}/> BATTLE LOG · ダメージ／撃破履歴</summary>
   <div className="ec-combat-history">
    {(state.hitHistory??[]).length===0?<p className="ec-help">まだ攻撃記録がありません。通常練習で正解すると追加されます。</p>:
     <ol>{[...(state.hitHistory??[])].reverse().slice(0,12).map((hit,i)=><li key={hit.at+'-'+hit.questionId+'-'+i}><span>{hit.attribute} · {hit.enemyId}</span><strong>-{hit.damage} DMG</strong><small>{hit.combo} COMBO</small></li>)}</ol>}
    {(state.defeatHistory??[]).length>0&&<p className="ec-help">討伐：{(state.defeatHistory??[]).map(hit=>ENEMIES.find(e=>e.id===hit.enemyId)?.short+' ('+new Date(hit.at).toLocaleDateString('ja-JP')+')').join(' → ')}</p>}
   </div>
  </details>}
  {!compact&&<details className="ec-collection">
   <summary><BookOpen size={17}/> MONSTER ARCHIVE · 討伐図鑑 ({cleared} / {ENEMIES.length})</summary>
   <div className="ec-collection-grid">{collection.map(monster=><div key={monster.id} className={'ec-collect-item '+(monster.cleared?'ec-collected':monster.discovered?'ec-discovered':'ec-hidden')}>
    <MonsterArt id={monster.id} small hpRatio={monster.cleared?0:1}/>
    <strong>{monster.discovered?monster.short:'???'}</strong>
    <small>{monster.cleared?<><Trophy size={12}/> CLEAR</>:monster.discovered?<><Flame size={12}/> CURRENT</>:<><Skull size={12}/> LOCKED</>}</small>
   </div>)}</div>
   <p className="ec-help"><Sparkles size={14}/> モンスターは倒すたびに図鑑へ登録されます。実際のAWS習熟度はスキルツリーと復習記録で確認してください。</p>
  </details>}
 </section>;
}

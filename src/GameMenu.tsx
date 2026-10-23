import React from 'react';
import {Award,BarChart3,Crown,Flame,Home,Settings2,Shield,Trophy,Vibrate,Volume2,X,Zap} from 'lucide-react';
import type {AudioSettings} from './audioDirector';
import {getHapticEnvironment,type HapticMode,type HapticTestResult,type HapticTestKind} from './haptics';
import type {gameProfile} from './gameProfile';
import type {Title} from './titleSystem';
import type {TextScale} from './readability';
import type {VisualPower} from './visualPower';
import './gameMenu.css';

type Profile=ReturnType<typeof gameProfile>;
type Tab='status'|'titles'|'achievements'|'settings';
type DomainStats=Record<string,{correct:number;answered:number}>;
export type GameMenuProps={
 tab:Tab;onTab:(tab:Tab)=>void;onClose:()=>void;onHome:()=>void;
 titles:Title[];equippedTitle:string;onEquipTitle:(id:string)=>void;
 closeRef:React.RefObject<HTMLButtonElement>;
 profile:Profile;domains:DomainStats;totalQuestions:number;
 session:{mode:'home'|'quiz'|'result';exam:boolean;boss:boolean;scenario:boolean;index:number;total:number;correct:number};
 audio:AudioSettings;onAudio:(patch:Partial<AudioSettings>)=>void;
 haptics:HapticMode;onHaptics:(mode:HapticMode)=>void;
 onVibrationTest:(kind:HapticTestKind)=>HapticTestResult;canVibrate:boolean;
 reduced:boolean;onReduced:(value:boolean)=>void;onSoundTest:()=>void;
 textScale:TextScale;onTextScale:(value:TextScale)=>void;
 visualPower:VisualPower;onVisualPower:(value:VisualPower)=>void;
};
const domainNames=['セキュリティ','耐障害性','パフォーマンス','コスト最適化'];
export default function GameMenu(p:GameMenuProps){
 const [testResult,setTestResult]=React.useState<HapticTestResult|null>(null);
 const [felt,setFelt]=React.useState<'yes'|'no'|null>(null);
 const environment=getHapticEnvironment();
 function runHapticTest(kind:HapticTestKind){setFelt(null);setTestResult(p.onVibrationTest(kind))}
 const labels:{id:Tab;label:string;icon:typeof BarChart3}[]=[
  {id:'status',label:'STATUS',icon:BarChart3},
  {id:'titles',label:'TITLES',icon:Crown},
  {id:'achievements',label:'BADGES',icon:Award},
  {id:'settings',label:'OPTIONS',icon:Settings2}
 ];
 return <div className="game-menu-root">
  <button className="game-menu-scrim" onClick={p.onClose} aria-label="メニューを閉じる"/>
  <aside className="game-menu-drawer" role="dialog" aria-modal="true" aria-label="OVERDRIVE ゲームメニュー">
   <header className="game-menu-header"><button className="game-menu-close" ref={p.closeRef} onClick={p.onClose} aria-label="メニューを閉じる"><X size={24}/></button><h2><Zap size={27}/> COMMAND <span>CENTER</span></h2></header>
   <nav className="game-menu-tabs" role="tablist" aria-label="ゲームメニューの項目">{labels.map(({id,label,icon:Icon})=><button key={id} id={'menu-tab-'+id} type="button" role="tab" aria-controls="menu-active-panel" aria-selected={p.tab===id} className={p.tab===id?'active':''} onClick={()=>p.onTab(id)}><Icon size={18}/><span>{label}</span></button>)}</nav>
   <section id="menu-active-panel" className="game-menu-content" role="tabpanel" aria-labelledby={'menu-tab-'+p.tab} key={p.tab}>
    {p.tab==='status'&&<>
     <div className="gm-character"><div className="gm-avatar"><Crown size={42}/></div><div className="gm-character-info"><h3>{p.profile.rank}</h3><span className="gm-rank-subtitle">{p.profile.rankSubtitle}</span><span className="gm-equipped-title">{p.titles.find(t=>t.id===p.equippedTitle)?.name}</span><strong>LEVEL {p.profile.level} <span>／ {p.profile.xp.toLocaleString()} XP</span></strong></div></div>
     <div className="gm-level"><div><strong>NEXT LEVEL</strong><span>{Math.max(0,p.profile.nextLevelXP-p.profile.xp).toLocaleString()} XP TO GO</span></div><div className="gm-level-track" role="progressbar" aria-label="次のレベルまでの経験値" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.profile.levelPct}><div style={{width:p.profile.levelPct+'%'}}/></div></div>
     {p.profile.rankGoal?<div className="gm-next-rank"><strong>NEXT RANK · {p.profile.nextRank}</strong><div className="gm-rank-gates"><span className={p.profile.xpToNextRank===0?'complete':''}>XP <b>{p.profile.xp.toLocaleString()}/{p.profile.rankGoal.xp.toLocaleString()}</b></span><span className={p.profile.answersToNextRank===0?'complete':''}>回答 <b>{p.profile.answered}/{p.profile.rankGoal.answers}問</b></span><span className={p.profile.daysToNextRank===0?'complete':''}>活動 <b>{p.profile.activeDays}/{p.profile.rankGoal.days}日</b></span></div></div>:<div className="gm-next-rank maxed"><Crown size={17}/> LEGEND · 全条件達成</div>}
     {p.session.mode==='quiz'&&<div className="gm-live"><Flame size={20}/><div><strong>{p.session.exam?'EXAM TRIAL':p.session.boss?'BOSS RUSH':p.session.scenario?'CASE FILES':'MISSION IN PROGRESS'}</strong><span>{p.session.index+1} / {p.session.total} 問 · 正解 {p.session.correct} 問</span></div></div>}
     <div className="gm-stat-grid">
      <div><strong>{p.profile.answered.toLocaleString()}</strong><span><BarChart3 size={15}/> ANSWERS</span></div>
      <div><strong>{p.profile.activeDays}</strong><span>ACTIVE DAYS</span></div>
      <div><strong>{p.profile.currentStreak}</strong><span><Flame size={15}/> STREAK DAYS</span></div>
      <div><strong>{p.profile.accuracy}%</strong><span><Shield size={15}/> ACCURACY</span></div>
      <div><strong>{p.profile.seen}<small>/{p.totalQuestions}</small></strong><span><BarChart3 size={15}/> EXPLORED</span></div>
      <div><strong>{p.profile.learned}</strong><span><Crown size={15}/> RETAINED</span></div>
      <div><strong>{p.profile.due}</strong><span><Zap size={15}/> REVIEW DUE</span></div>
      <div><strong>{p.profile.unlockedAchievements}<small>/{p.profile.allAchievements}</small></strong><span><Award size={15}/> BADGES</span></div>
      <div><strong>{p.profile.questionCoverage}%</strong><span><BarChart3 size={15}/> COVERAGE</span></div>
     </div>
     <h4 className="gm-section-title">DOMAIN CLEAR RATE <small>累計正答率</small></h4>
     <div className="gm-domains">{domainNames.map(name=>{const item=p.domains?.[name];const accuracy=item?.answered?Math.round(item.correct/item.answered*100):0;return <div key={name}><div><span>{name}</span><strong>{accuracy}% <small>({item?.answered||0}回)</small></strong></div><div className="gm-domain-track"><div style={{width:accuracy+'%'}}/></div></div>})}</div>
     <p className="gm-caveat">活動日数は日付が記録されている分のみです。LEGENDはXP・回答数・活動日のすべてが必要。AWS試験の予測スコアではありません。</p>
    </>}
    {p.tab==='titles'&&<>
     <div className="gm-titles-heading"><strong>{p.titles.filter(item=>item.unlocked).length} / {p.titles.length} 解放済み</strong><span>獲得した称号を選んで装備できます。</span></div>
     <div className="gm-title-list">{p.titles.map(item=><button key={item.id} type="button" className={'gm-title-item '+(item.unlocked?'unlocked':'locked')+(p.equippedTitle===item.id?' equipped':'')} aria-pressed={p.equippedTitle===item.id} disabled={!item.unlocked} onClick={()=>p.onEquipTitle(item.id)}>
      <Crown size={20}/><span><strong>{item.name}</strong><small>{item.description}</small></span><b>{p.equippedTitle===item.id?'装備中':item.unlocked?'装備':'未解放'}</b>
     </button>)}</div>
    </>}
    {p.tab==='achievements'&&<>
     <div className="gm-badge-heading"><Trophy size={35}/><div><strong>{p.profile.unlockedAchievements} / {p.profile.allAchievements} UNLOCKED</strong></div></div>
     <div className="gm-badge-list">{p.profile.achievements.map(item=><div key={item.id} className={'gm-badge '+(item.unlocked?'unlocked':'locked')}><span className="gm-badge-icon">{item.icon}</span><div><strong>{item.label}</strong><small>{item.description}</small></div><span className="gm-badge-state">{item.unlocked?'UNLOCKED':'LOCKED'}</span></div>)}</div>
    </>}
    {p.tab==='settings'&&<>
     <h4 className="gm-section-title">READING SIZE</h4>
     <div className="gm-reading-size" role="group" aria-label="文字の大きさ">{([['standard','標準'],['large','大きく'],['extra','特大']] as const).map(([value,label])=><button type="button" key={value} className={p.textScale===value?'active':''} aria-pressed={p.textScale===value} onClick={()=>p.onTextScale(value)}>{label}</button>)}</div>
     <h4 className="gm-section-title"><Zap size={18}/> VISUAL POWER</h4>
     <div className="gm-visual-options" role="group" aria-label="演出の強さ">{([['balanced','BALANCED'],['overdrive','OVERDRIVE']] as const).map(([value,label])=><button type="button" key={value} className={p.visualPower===value?'active':''} aria-pressed={p.visualPower===value} onClick={()=>p.onVisualPower(value)} disabled={p.reduced}>{label}</button>)}</div>
     <h4 className="gm-section-title"><Vibrate size={18}/> HAPTIC POWER</h4>
     
     <div className="gm-haptic-options" role="group" aria-label="振動の強さ">{(['off','normal','overdrive'] as const).map(value=><button key={value} type="button" aria-pressed={p.haptics===value} className={p.haptics===value?'active':''} onClick={()=>{p.onHaptics(value);setTestResult(null);setFelt(null)}}>{value==='off'?'OFF':value==='normal'?'NORMAL':'OVERDRIVE'}</button>)}</div>
     <details className="gm-haptic-diagnostics">
      <summary>振動テスト・診断 <Vibrate size={17}/></summary>
      <div className="gm-haptic-facts"><span>Web振動API</span><b>{p.canVibrate?'検出':'未対応'}</b><span>OSの動き軽減</span><b>{environment.systemReducedMotion?'有効（振動OFF）':'無効'}</b><span>ゲーム内の動き軽減</span><b>{p.reduced?'有効（振動OFF）':'無効'}</b><span>ページのタップ履歴</span><b>{environment.hasGesture===null?'判定不可':environment.hasGesture?'あり':'なし'}</b></div>
      <div className="gm-vibration-tests"><button type="button" className="gm-vibration-test" onClick={()=>runHapticTest('single')}>単発テスト · 250ms <Vibrate size={17}/></button><button type="button" className="gm-vibration-test" onClick={()=>runHapticTest('pattern')}>連続テスト · 2パルス <Vibrate size={17}/></button></div>
      {testResult&&<div className={'gm-haptic-result '+(testResult.status==='accepted'?'maybe':'blocked')} role="status"><strong>{testResult.status==='accepted'?'ブラウザが要求を受理':testResult.status==='rejected'?'ブラウザが要求を拒否':'振動できない状態'}</strong><p>{testResult.message}</p>{testResult.status==='accepted'&&<><span>実際にスマホは振動しましたか？</span><div className="gm-felt-buttons"><button type="button" aria-pressed={felt==='yes'} onClick={()=>setFelt('yes')}>振動した</button><button type="button" aria-pressed={felt==='no'} onClick={()=>setFelt('no')}>振動しない</button></div></>}</div>}
      {felt==='no'&&<p className="gm-haptic-advice"><strong>要求は受理されたが振動しない場合</strong>：Androidの「設定 → 音とバイブレーション → バイブレーションと触覚」などで振動を確認してください。サイレント・おやすみモードも確認し、同じページをChromeでも開いて比較してください。Braveや端末側が振動を止める場合、Webサイトから強制的に有効にはできません。</p>}
      <p className="gm-haptic-note">APIの「受理」は実際の振動を保証しません。OVERDRIVEは振動時間・回数の変化で、強度調整ではありません。</p>
     </details>
     <h4 className="gm-section-title"><Volume2 size={18}/> GAME AUDIO</h4>
     <label className="gm-toggle"><input type="checkbox" checked={p.audio.bgmEnabled} onChange={e=>p.onAudio({bgmEnabled:e.target.checked})}/> BGMを再生</label>
     <label className="gm-range">BGM <span>{Math.round(p.audio.bgmVolume*100)}%</span><input type="range" min="0" max="100" step="5" value={Math.round(p.audio.bgmVolume*100)} onChange={e=>p.onAudio({bgmVolume:Number(e.target.value)/100})}/></label>
     <label className="gm-toggle"><input type="checkbox" checked={p.audio.sfxEnabled} onChange={e=>p.onAudio({sfxEnabled:e.target.checked})}/> 効果音を再生</label>
     <label className="gm-range">SFX <span>{Math.round(p.audio.sfxVolume*100)}%</span><input type="range" min="0" max="100" step="5" value={Math.round(p.audio.sfxVolume*100)} onChange={e=>p.onAudio({sfxVolume:Number(e.target.value)/100})}/></label>
     <button type="button" className="gm-test-sfx" disabled={!p.audio.sfxEnabled} onClick={p.onSoundTest}>報酬SEを試聴</button>
     <h4 className="gm-section-title">ACCESSIBILITY</h4>
     <label className="gm-toggle"><input type="checkbox" checked={p.reduced} onChange={e=>p.onReduced(e.target.checked)}/> エフェクトとバイブを抑制する</label>
     <p className="gm-caveat">振動は対応端末のみ。動きの軽減設定を優先します。</p>
    </>}
   </section>
   <footer className="game-menu-footer"><button className="gm-go-home" onClick={p.onHome}><Home size={17}/> DASHBOARD</button><button className="gm-continue" onClick={p.onClose}>CONTINUE <Zap size={17}/></button></footer>
  </aside>
 </div>;
}

import React,{useState} from 'react';
import {Activity,Brain,TrendingUp} from 'lucide-react';
import {growthSummary,normalizeAnswerHistory,type AnswerHistory,type AnalyticsWindow} from './growthAnalytics.ts';
import type {ActivityHistory} from './studyHistory.ts';
import './qualityGrowth.css';
export default function GrowthDashboard({history,activity,domains}:{history?:AnswerHistory;activity:ActivityHistory;domains:Record<string,{answered:number;correct:number}>}){
 const [window,setWindow]=useState<AnalyticsWindow>(30);
 const stats=growthSummary(history,activity,domains,window);
 const max=Math.max(1,...stats.days.map(d=>d.answered));
 const points=stats.days.length?stats.days.map((d,i)=>`${(i/Math.max(1,stats.days.length-1))*100},${100-d.rate}`).join(' '):'';
 return <section className="growth-board" aria-labelledby="growth-title">
  <header className="growth-heading"><div><span><Activity size={16}/> GROWTH ANALYTICS</span><h2 id="growth-title">知識の伸びを記録する</h2></div>
   <div className="growth-windows" role="group" aria-label="表示期間">{([7,30,90] as const).map(n=><button key={n} type="button" aria-pressed={window===n} className={window===n?'active':''} onClick={()=>setWindow(n)}>{n}日</button>)}</div></header>
  <div className="growth-metrics">
   {([['初見正答率',stats.first],['復習・再挑戦',stats.repeat],['期限到来の復習',stats.due],['苦手の克服',stats.recovery]] as const).map(([label,item])=><div key={label}><small>{label}</small><strong>{item.rate===null?'—':item.rate+'%'}</strong><span>{item.count} 回分の記録</span></div>)}
  </div>
  <div className="growth-chart"><div className="growth-chart-heading"><strong><TrendingUp size={16}/> 日別の回答数と正答率</strong><span>{stats.days.length} 記録日</span></div>
   {stats.days.length?<><div className="growth-graph" role="img" aria-label={window+'日間の回答数と正答率の推移。日別数値は下の一覧でも確認可能'}>
    {stats.days.map(d=><div key={d.day} className="growth-bar-cell" title={d.day+' '+d.answered+'問 正答率'+d.rate+'%'}><div className="growth-bar" style={{height:Math.max(2,Math.round(d.answered/max*100))+'%'}}/></div>)}
    {stats.days.length>1&&<svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.4" vectorEffect="non-scaling-stroke"/></svg>}
   </div><details className="growth-day-detail"><summary>日別の詳細を開く</summary><div>{stats.days.map(d=><p key={d.day}>{d.day}：{d.answered}問／{d.correct}正解／{d.rate}%</p>)}</div></details></>:<p className="growth-empty">期間内に日付つきの回答記録はありません。</p>}
  </div>
  <div className="growth-domains"><strong><Brain size={16}/> 分野別の累計正答率</strong><div>{stats.perDomain.map(d=><div key={d.domain}><span>{d.domain}</span><div className="growth-domain-track"><i style={{width:(d.rate??0)+'%'}}/></div><b>{d.rate===null?'—':d.rate+'%'} <small>({d.answered}回答)</small></b></div>)}</div></div>
  <p className="growth-note">初見・復習・苦手克服の内訳は5.3導入後の回答イベントだけから計算。導入前の回答を復元・推定した値ではありません。分野別は従来の全期間累計です。合格確率ではありません。</p>
 </section>;
}

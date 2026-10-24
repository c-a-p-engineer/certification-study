import React from 'react';
import {BrainCircuit,CalendarDays} from 'lucide-react';
import {learningRetrospective,learningSnapshot} from './learningInsights.ts';
import type {AnswerHistory} from './growthAnalytics.ts';
import {measuredDelayedRecall} from './delayedRecallMetrics.ts';
import './qualityGrowth.css';
export default function LearningInsights({history}:{history?:AnswerHistory}){
 const weekly=learningSnapshot(history,7);
 const delayed=measuredDelayedRecall(history);
 const stat=(v:number|null)=>v===null?'—':v+'%';
 return <section className="learning-insights" aria-labelledby="learning-insights-title">
  <div className="learning-insights-heading"><strong id="learning-insights-title"><BrainCircuit size={17}/> RETENTION LAB</strong><span>直近7日・この端末のみ</span></div>
  <div className="learning-insights-grid">
   <div><small>SMART期限到来復習</small><strong>{stat(weekly.smartDue.rate)}</strong><span>{weekly.smartDue.n} 回</span></div>
   <div><small>短時間復習 RAID</small><strong>{stat(weekly.retentionDue.rate)}</strong><span>{weekly.retentionDue.n} 回</span></div>
   <div><small>その他の期限到来復習</small><strong>{stat(weekly.otherDue.rate)}</strong><span>{weekly.otherDue.n} 回</span></div>
   <div><small>日をまたいだ再挑戦</small><strong>{stat(weekly.delayedReturn.rate)}</strong><span>{weekly.delayedReturn.n} 回</span></div>
  </div>
  <div className="delayed-recall-metrics" role="group" aria-label="日付をまたいだ観測復習">
   {delayed.map(x=><div key={x.days}><small>{x.days}日以上の間隔</small><strong>{x.rate===null?'—':x.rate+'%'}</strong><span>正解 {x.correct} / 対象 {x.uniqueQuestions}問</span></div>)}
  </div>
  <p className="learning-recap"><CalendarDays size={16}/>{learningRetrospective(weekly)}</p>
  <p className="learning-warning">SMARTと通常の正答率は学習条件が異なる観察値です。優劣や学習効果を因果的に証明する比較ではありません。前回回答のイベントが端末に残らない場合は継続復習を測れず、導入前の記録は復元しません。各群5回答未満では比較判断を推奨しません。1/3/7/14日指標は過去90日内の再回答で、同一問題の最新の該当結果を集計します。閾値は重複し、問題ごとの前回学習記録が残っている場合のみ計測できます。</p>
 </section>;
}

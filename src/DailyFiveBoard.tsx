import React from 'react';
import {ArrowRight,CalendarDays,Clock3,ShieldCheck} from 'lucide-react';
import type {DailyFivePlan,DailyQuestion} from './dailyFive.ts';
import './dailyFive.css';
export default function DailyFiveBoard({plan,onStart,disabled=false}:{plan:DailyFivePlan<DailyQuestion>;onStart:()=>void;disabled?:boolean}){
 return <section className="daily-five" aria-labelledby="daily-five-title">
  <div className="daily-five-head"><span><Clock3 size={17}/> DAILY LEARNING LOOP · 自分のペースで</span><h2 id="daily-five-title">今日の5分クエスト</h2>
   <p>{plan.advice}</p></div>
  <div className="daily-five-categories">
   <span>前日以前の期限到来 <strong>{plan.counts.due}問</strong></span>
   <span>以前の苦手 <strong>{plan.counts.weak}問</strong></span>
   <span>新規学習 <strong>{plan.counts.fresh}問</strong></span>
  </div>
  <button type="button" className="daily-five-start" onClick={onStart} disabled={!plan.available||disabled}>
   <Clock3 size={22}/><span><strong>{plan.available?plan.available+'問の学習を始める':'今日は対象問題がありません'}</strong>
   <small>{plan.full?'5問で終了できます':'対象は'+plan.available+'問。5問未満でも終了できます'} · 途中で中断可能</small></span><ArrowRight size={20}/>
  </button>
  {plan.available>0&&<details className="daily-five-reasons"><summary>今日の出題理由を見る</summary><ul>{plan.items.map(x=><li key={x.question.id}><strong>{x.question.id} · {x.question.domain}</strong> — {x.reason}</li>)}</ul></details>}
  <p className="daily-five-caveat"><ShieldCheck size={15}/> 強制的な連続プレイ・通知・欠席ペナルティはありません。期限到来が0問のとき、新規問題を「復習済み」とは数えません。</p>
 </section>;
}
export function DailyFiveFinish({correct,total,missed,domains,due,newConcepts,nextDay,onExit,onMore}:{correct:number;total:number;missed:number;domains:number;due:number;newConcepts:number;nextDay:string;onExit:()=>void;onMore:()=>void}){
 return <section className="daily-five-end" aria-labelledby="daily-five-end-title">
  <div className="daily-five-finished"><CalendarDays size={21}/><strong id="daily-five-end-title">今日の5分クエスト完了</strong></div>
  <p>{total}問のうち<strong>{correct}問正解</strong>。{domains}分野に取り組みました。期限到来の再挑戦 {due}問・新規学習 {newConcepts}問。</p>
  {missed>0?<p>確認が必要な問題は{missed}問。解説とAWS公式資料を振り返り、次回の復習につなげてください。</p>:<p>今日はここで終了できます。次回は、知識を思い出せるか改めて試しましょう。</p>}
  <p className="daily-five-next"><CalendarDays size={16}/> 次の確認の目安：{nextDay}以降（復習期限は問題ごとに異なります）</p>
  <div className="daily-five-end-actions"><button type="button" className="daily-five-stop" onClick={onExit}>今日はここで終了 <ArrowRight size={17}/></button><button type="button" className="daily-five-optional" onClick={onMore}>任意：追加で学習</button></div>
  <small>学習の成績は模擬試験の合格率ではありません。追加学習を選ばなくてもペナルティはありません。</small>
 </section>;
}

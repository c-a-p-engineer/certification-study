import React from 'react';
import {BrainCircuit,CalendarCheck2,ArrowRight,ShieldCheck} from 'lucide-react';
import {RECALL_BONUS_XP,RECALL_DAILY_LIMIT,normalizeRecallRewards,type RetentionPlan} from './retentionQuest.ts';
import {localDateKey} from './studyHistory.ts';
import './qualityGrowth.css';
export default function RetentionQuestBoard({plan5,plan10,rewards,onStart}:{
 plan5:RetentionPlan<{id:string}>;plan10:RetentionPlan<{id:string}>;
 rewards?:unknown;onStart:(count:5|10)=>void;
}){
 const today=localDateKey(new Date()),used=normalizeRecallRewards(rewards,today).questionIds.length;
 return <section className="retention-board" aria-labelledby="retention-title">
  <div className="retention-board-head"><span><BrainCircuit size={17}/> RETENTION ENGINE 3.0</span><h2 id="retention-title">RECALL MICRO RAID</h2><p>期限を迎えた問題だけを、短時間で繰り返し思い出す。</p></div>
  <div className="retention-stats"><div><span>翌日以降の復習待ち</span><strong>{plan5.dueTotal}問</strong></div><div><span>最大の期限超過</span><strong>{plan5.oldestDays}日</strong></div><div><span>今日の復習ボーナス</span><strong>{used}/{RECALL_DAILY_LIMIT}</strong></div></div>
  <div className="retention-options">
   {([5,10] as const).map(count=>{const plan=count===5?plan5:plan10;return <button key={count} type="button" disabled={!plan.questions.length} onClick={()=>onStart(count)} aria-label={count+'問コースを開始。出題可能 '+plan.questions.length+'問'}>
    <CalendarCheck2 size={19}/><span><strong>{count} Q · {count===5?'QUICK RECALL':'DEEP RECALL'}</strong><small>{plan.questions.length?plan.questions.length+'問を編成済み':'期限到来の問題がありません'}</small></span><ArrowRight size={18}/>
   </button>})}
  </div>
  {plan5.ignoredSameDay>0&&<p className="retention-excluded">本日学習した{plan5.ignoredSameDay}問は翌日以降の復習として扱い、連続攻略による水増しを防ぎます。</p>}
  <p className="retention-guidance"><ShieldCheck size={15}/> 日をまたいだ期限到来の問題に正解すると1問につき+{RECALL_BONUS_XP} XP、1日最大{RECALL_DAILY_LIMIT}回。模擬試験・ボス戦には付与されません。期限と忘却回数を優先し、分野の偏りを抑えます。</p>
 </section>;
}

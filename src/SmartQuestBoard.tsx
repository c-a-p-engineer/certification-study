import React from 'react';
import {BrainCircuit,ArrowRight,Target} from 'lucide-react';
import {SMART_LABELS,type SmartCategory,type SmartProfile,type SmartPlan} from './smartQuest.ts';
import './qualityGrowth.css';
export default function SmartQuestBoard({profile,onProfile,plan,onStart,stats}:{profile:SmartProfile;onProfile:(v:SmartProfile)=>void;plan:SmartPlan<{id:string}>;onStart:()=>void;stats:{due:number;mistakes:number;unseen:number}}){
 return <section className="smart-board" aria-labelledby="smart-title">
 <div className="smart-heading"><div><span><BrainCircuit size={17}/> ADAPTIVE ENGINE 2.0</span><h2 id="smart-title">SMART QUEST</h2><p>復習期限 {stats.due}問 · 苦手 {stats.mistakes}問 · 未学習 {stats.unseen}問から編成</p></div>
 <div className="smart-profiles" role="group" aria-label="出題バランス">{([['balanced','バランス'],['review','復習重視'],['explore','初見重視']] as const).map(([id,label])=><button type="button" key={id} aria-pressed={profile===id} className={profile===id?'active':''} onClick={()=>onProfile(id)}>{label}</button>)}</div></div>
 <div className="smart-mix">{(Object.entries(SMART_LABELS) as [SmartCategory,string][]).map(([key,label])=><div key={key}><span>{label}</span><strong>{plan.counts[key]} / {plan.targets[key]}問</strong><div><i style={{width:plan.questions.length?plan.counts[key]/plan.questions.length*100+'%':'0%'}}/></div></div>)}</div>
 <p className="smart-explanation">選択した出題比率を目安に編成。対象問題が足りないときは他カテゴリから補充します。出題理由はクイズ画面で確認できます。</p>
 <button type="button" className="smart-start" onClick={onStart} disabled={plan.questions.length===0}><Target size={17}/> おすすめの{plan.questions.length}問を攻略 <ArrowRight size={17}/></button>
 </section>;
}

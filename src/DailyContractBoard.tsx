import React from 'react';
import {ArrowRight,BookOpen,CheckCircle2,Compass,RotateCcw,Sparkles,Trophy,Zap} from 'lucide-react';
import {CONTRACTS,todayContracts,type ContractId,type DailyContracts} from './dailyContracts';
import './dailyContracts.css';

const icons={warmup:Zap,explore:Compass,recover:RotateCcw,recall:BookOpen};
export default function DailyContractBoard({contracts,date,available,onStart,onClaim}:{
 contracts:DailyContracts|undefined;date:string;available:Record<ContractId,boolean>;
 onStart:(id:ContractId)=>void;onClaim:(id:ContractId)=>void
}){
 const state=todayContracts(contracts,date);
 const complete=CONTRACTS.filter(item=>state.claimed.includes(item.id)).length;
 return <section className="contracts-board" aria-labelledby="contracts-title">
  <div className="contracts-heading"><div><span className="contracts-eyebrow"><Sparkles size={15}/> DAILY CONTRACTS</span><h2 id="contracts-title">今日の攻略ミッション</h2></div><div className="contracts-score"><Trophy size={19}/><strong>{complete} / {CONTRACTS.length}</strong><span>報酬受取</span></div></div>
  <div className="contracts-grid">{CONTRACTS.map(task=>{
   const Icon=icons[task.id];const count=Math.min(task.target,state[task.id].length);
   const claimed=state.claimed.includes(task.id);const ready=count===task.target&&!claimed;
   return <article key={task.id} className={'contract-card '+(claimed?'claimed':ready?'ready':'')}>
    <div className="contract-top"><span className="contract-icon"><Icon size={19}/></span><span className="contract-reward">+{task.reward} XP</span></div>
    <h3>{task.name}</h3><p>{task.subtitle}</p>
    <div className="contract-progress"><div role="progressbar" aria-label={task.subtitle} aria-valuemin={0} aria-valuemax={task.target} aria-valuenow={count}><div style={{width:count/task.target*100+'%'}}/></div><strong>{count} / {task.target}</strong></div>
    {claimed?<div className="contract-collected"><CheckCircle2 size={17}/> CLEAR · 受取済み</div>:
     ready?<button type="button" className="contract-claim" onClick={()=>onClaim(task.id)}>報酬を受け取る <Trophy size={17}/></button>:
     available[task.id]?<button type="button" className="contract-start" onClick={()=>onStart(task.id)}>挑戦する <ArrowRight size={17}/></button>:
     <span className="contract-locked">対象問題ができると挑戦可能</span>}
   </article>;
  })}</div>
  <p className="contracts-note">正解した異なる問題だけをカウント。模擬試験の回答は対象外。毎日リセットされ、記録とXPはこのブラウザに保存されます。</p>
 </section>;
}

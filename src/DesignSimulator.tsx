import React,{useState} from 'react';
import {ArrowRight,BookOpen,BrainCircuit,Medal,RotateCcw} from 'lucide-react';
import {DESIGN_CASES,evaluateDesignChoice,normalizeDesignProgress,type DesignCaseId,type DesignProgress} from './designSimulator.ts';
import './nextPhase.css';
function ArchitectureSketch({nodes}:{nodes:readonly string[]}){
 const xs=nodes.map((_,i)=>50+i*(430/Math.max(1,nodes.length-1)));
 return <figure className="ds-sketch"><svg viewBox="0 0 530 105" role="img" aria-label={'構成要素：'+nodes.join('、')} preserveAspectRatio="xMidYMid meet">
  <title>アーキテクチャの構成要素を左から順に表示</title>
  {nodes.map((node,i)=><g key={node}>
   {i>0&&<path d={'M'+(xs[i-1]+43)+' 49 H'+(xs[i]-43)} stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="6 4"/>}
   <rect x={xs[i]-48} y="22" width="96" height="55" rx="9" fill="#274d62" stroke="#9de7dd" strokeWidth="1.5"/>
   <text x={xs[i]} y="48" textAnchor="middle" fill="#f5fcff" fontSize="12" fontWeight="700">{node.length>14?node.slice(0,13)+'…':node}</text>
  </g>)}
 </svg><figcaption>{nodes.join(' → ')}</figcaption></figure>;
}
export default function DesignSimulator({progress,onFinish}:{progress?:DesignProgress;onFinish:(id:DesignCaseId,correct:number)=>void}){
 const saved=normalizeDesignProgress(progress);
 const [active,setActive]=useState<DesignCaseId|null>(null),[step,setStep]=useState(0),[picked,setPicked]=useState<string|null>(null),[score,setScore]=useState(0),[completed,setCompleted]=useState(false);
 const c=DESIGN_CASES.find(x=>x.id===active);
 const advanceGuard=React.useRef(false);
 React.useEffect(()=>{advanceGuard.current=false},[step]);
 function start(id:DesignCaseId){advanceGuard.current=false;setActive(id);setStep(0);setPicked(null);setScore(0);setCompleted(false)}
 function next(){if(!c||!picked||advanceGuard.current)return;advanceGuard.current=true;const newScore=score+(evaluateDesignChoice(c.id,c.steps[step].id,picked).correct?1:0);
  if(step+1<c.steps.length){setScore(newScore);setStep(x=>x+1);setPicked(null);return}
  setScore(newScore);setCompleted(true);onFinish(c.id,newScore);
 }
 return <section className="ds-board" aria-labelledby="ds-title">
  <div className="ds-heading"><span><BrainCircuit size={17}/> AWS ARCHITECT LAB</span><h2 id="ds-title">DESIGN DECISION SIMULATOR</h2><p>一問一答から、要件を読み、設計を選び、リスクを説明する練習へ。独自制作の4シナリオ、各3ステップ。</p></div>
  {!c?<details className="ds-launcher"><summary><BookOpen size={17}/> 4つの設計シナリオを選ぶ</summary><div className="ds-cases">{DESIGN_CASES.map(item=>{const r=saved.records[item.id];return <article className="ds-case" key={item.id}>
    <strong>{item.title}</strong><span>{item.objective}</span><small>{item.domain} · {r?'BEST '+r.best+'/3':'未挑戦'} · {saved.emblems.includes(item.id)?'◆ 判断勲章獲得':'3段階の設計判断'}</small>
    <button type="button" onClick={()=>start(item.id)}>設計する <ArrowRight size={17}/></button>
   </article>})}</div></details>:
   <div className="ds-play">
    <div className="ds-session"><strong>{c.title}</strong><button type="button" onClick={()=>setActive(null)} aria-label="設計シミュレーターの一覧に戻る">一覧へ戻る</button></div>
    <ArchitectureSketch nodes={c.nodes}/>
    {!completed?<div className="ds-step">
     <small>DECISION {step+1} / {c.steps.length} · {c.domain}</small>
     <h3>{c.steps[step].heading}</h3><p>{c.steps[step].context}</p>
     <div className="ds-options" role="group" aria-label="設計案を選択">{c.steps[step].options.map((option,i)=><button key={option.id} type="button" disabled={picked!==null} onClick={()=>setPicked(option.id)}
      className={picked===option.id?'ds-selected':''} aria-pressed={picked===option.id}>
      <span>{'ABC'[i]}</span>{option.label}
     </button>)}</div>
     {picked&&<div className="ds-feedback" role="status">
      <strong>{evaluateDesignChoice(c.id,c.steps[step].id,picked).correct?'適切な設計判断':'改善が必要な設計判断'}</strong>
      <p>{evaluateDesignChoice(c.id,c.steps[step].id,picked).feedback}</p><p>{c.steps[step].why}</p>
      <a href={c.steps[step].reference} target="_blank" rel="noopener noreferrer"><BookOpen size={15}/> AWS公式資料を確認</a>
      <button className="ds-next" type="button" onClick={next}>{step+1===c.steps.length?'結果を表示':'次の設計判断'} <ArrowRight size={17}/></button>
     </div>}
    </div>:<div className="ds-result" role="status"><Medal size={27}/><h3>DESIGN REVIEW COMPLETE</h3><strong>{score} / {c.steps.length}</strong>
      <p>{score===c.steps.length?'設計判断をすべて満たしました。初回達成で勲章を獲得できます。':'誤った判断のリスクも把握して再設計しましょう。'}</p>
      <small>模擬試験の得点とは無関係。追加XPなし・勲章は一度のみ。</small>
      <div><button type="button" onClick={()=>start(c.id)}><RotateCcw size={17}/> もう一度</button><button type="button" onClick={()=>setActive(null)}>シナリオ一覧</button></div>
     </div>}
   </div>}
  <p className="ds-caveat">学習用の独自シナリオです。公式試験問題や合格判定ではありません。正解・不正解の説明はAWS公式ドキュメントへ接続します。オフライン時は外部リンクを閲覧できません。</p>
 </section>;
}

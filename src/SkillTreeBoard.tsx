import React from 'react';
import {ArrowRight,BrainCircuit,CheckCircle2,GitBranch,LockKeyhole,Sparkles} from 'lucide-react';
import {SKILL_STAGES,type SkillNode} from './skillTree.ts';
import './overdrive4.css';
export default function SkillTreeBoard({nodes,onTrain}:{nodes:readonly SkillNode[];onTrain:(topic:string)=>void}){
 const evolved=nodes.filter(n=>n.tier>=2).length;
 return <section className="od4-tree" aria-labelledby="od4-tree-title">
  <header className="od4-heading"><div><span className="od4-kicker"><GitBranch size={18}/> KNOWLEDGE EVOLUTION</span><h2 id="od4-tree-title">AWS SKILL TREE</h2></div><div className="od4-count"><Sparkles size={17}/>{evolved} / {nodes.length} 訓練中以上</div></header>
  <div className="od4-tree-grid">{nodes.map((node,i)=>{
   const stage=SKILL_STAGES[node.tier],atMax=node.tier===3;
   return <article key={node.name} className={'od4-skill-node od4-tier-'+node.tier}>
    <div className="od4-node-top"><div className="od4-node-orb" aria-hidden="true">{node.tier===0?<LockKeyhole size={25}/>:node.tier===3?<CheckCircle2 size={27}/>:<BrainCircuit size={27}/>}</div><span>NODE {String(i+1).padStart(2,'0')} <b>LV.{node.tier}</b></span></div>
    <h3>{node.name}</h3><div className="od4-stage-name">{stage.label} <span>{stage.name}</span></div>
    <div className="od4-node-track" role="progressbar" aria-label={node.name+'の次段階への進捗'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={node.progress}><div style={{width:node.progress+'%'}}/></div>
    <div className="od4-node-numbers"><span>探索 {node.seen} / {node.poolSize} 問</span><span>定着候補 {node.retained} 問</span></div>
    <p className="od4-node-next">{atMax?'最高段階に到達': '次の段階：探索'+node.nextSeen+'問・定着候補'+node.nextRetained+'問'}</p>
    <button type="button" disabled={node.poolSize===0} onClick={()=>onTrain(node.name)}>この分野を特訓 <ArrowRight size={17}/></button>
   </article>;
  })}</div>
  <p className="od4-note">スキル段階は異なる問題の探索数と、間隔を空けた復習での連続正解から算出する目安です。公式試験の合格率や客観的な能力評価ではありません。</p>
 </section>;
}
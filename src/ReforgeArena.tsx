import React from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,Shield,Target,Volume2,VolumeX,Zap} from 'lucide-react';
import type {StudyQuestion} from './StudyQuestionIntro';
import {answerKeys,arenaDeck,arenaReport,isExactAnswer,type Confidence,type ArenaOutcome} from './reforgeEngine.ts';
import {expandTerms} from './glossary';
import './reforgeArena.css';

type Phase='predict'|'attack'|'reveal'|'complete';
type Props={questions:readonly StudyQuestion[];onExit:()=>void;onSound:(effect:'select'|'correct'|'wrong'|'finish')=>void;muted:boolean};
const confidenceLabels:{value:Confidence;label:string;description:string}[]=[
 {value:'sure',label:'確信あり',description:'根拠まで説明できる'},
 {value:'maybe',label:'たぶん',description:'候補は絞れる'},
 {value:'guess',label:'まだ分からない',description:'ここで学ぶ'}
];
const glyph=(i:number)=>'ABCDEFGH'[i]??String(i+1);
/** A finite, voluntary calibration adventure. Isolated from legacy scoring/storage. */
export default function ReforgeArena({questions,onExit,onSound,muted}:Props){
 const [seed,setSeed]=React.useState(()=>Date.now());
 const deck=React.useMemo(()=>arenaDeck(questions,seed),[questions,seed]);
 const [index,setIndex]=React.useState(0);
 const [phase,setPhase]=React.useState<Phase>('predict');
 const [confidence,setConfidence]=React.useState<Confidence|null>(null);
 const [selected,setSelected]=React.useState<number[]>([]);
 const [outcomes,setOutcomes]=React.useState<ArenaOutcome[]>([]);
 const [showAlternatives,setShowAlternatives]=React.useState(false);
 const [impact,setImpact]=React.useState<'win'|'learn'|null>(null);
 const q=deck[index];
 const multiple=!!q?.answers;
 const complete=phase==='complete'||!q;
 const report=arenaReport(outcomes);
 const clearFx=()=>setImpact(null);
 function beginAttack(value:Confidence){setConfidence(value);setPhase('attack');onSound('select')}
 function toggleAnswer(value:number){setSelected(current=>multiple?(current.includes(value)?current.filter(x=>x!==value):[...current,value]):[value]);onSound('select')}
 function commit(){
  if(!q||!confidence||selected.length===0||(!multiple&&selected.length!==1))return;
  const correct=isExactAnswer(q,selected);
  setOutcomes(before=>[...before,{questionId:q.id,domain:q.domain,correct,confidence}]);
  setPhase('reveal');setShowAlternatives(false);setImpact(correct?'win':'learn');onSound(correct?'correct':'wrong');
 }
 function advance(){
  clearFx();
  if(index+1>=deck.length){setPhase('complete');onSound('finish');return}
  setIndex(current=>current+1);setSelected([]);setConfidence(null);setShowAlternatives(false);setPhase('predict');
 }
 function restart(){setSeed(Date.now()+1);setIndex(0);setPhase('predict');setSelected([]);setConfidence(null);setOutcomes([]);setShowAlternatives(false);clearFx()}
 if(deck.length===0)return <section className="reforge-arena"><h1>出題できる問題がありません</h1><button onClick={onExit}>ホームへ戻る</button></section>;
 return <section className="reforge-arena" aria-label="OVERDRIVE REFORGED 学習アリーナ">
  <div className="reforge-top">
   <button type="button" onClick={onExit} className="reforge-exit"><ArrowLeft size={18}/> ホームへ戻る</button>
   <span><Zap size={15}/> REFORGED / LEARNING ARENA</span>
  </div>
  {!complete&&<div className="reforge-stage">
   <div className="reforge-stage-meta"><span>ENCOUNTER {index+1} / {deck.length}</span><span>{q.domain}</span></div>
   <div className="reforge-progress" role="progressbar" aria-label="アリーナの進行" aria-valuemin={0} aria-valuemax={deck.length} aria-valuenow={index+(phase==='reveal'?1:0)}><span style={{width:(index+(phase==='reveal'?1:0))/deck.length*100+'%'}}/></div>
   <div className="reforge-enemy" aria-hidden="true"><div className={'reforge-core '+(impact?'reforge-core-'+impact:'')}><Target size={42}/></div><span>ARCHITECTURE SENTINEL</span><strong>{phase==='reveal'?(impact==='win'?'BREACHED':'WEAK POINT FOUND'):'ANALYZE THE CONSTRAINTS'}</strong></div>
   <div className="reforge-question"><div className="reforge-question-label"><Shield size={17}/> MISSION BRIEF <span>#{q.id}</span></div><h2>{q.question}</h2></div>
   {phase==='predict'&&<div className="reforge-panel"><span className="reforge-step">01 / PREDICT</span><h3>解答前に、自分の確信度を決める</h3><p>間違えても減点なし。確信していた誤解を見つけるほど、次の学習が明確になります。</p><div className="reforge-confidence">{confidenceLabels.map(item=><button type="button" key={item.value} onClick={()=>beginAttack(item.value)}><strong>{item.label}</strong><small>{item.description}</small><ArrowRight size={18}/></button>)}</div></div>}
   {phase==='attack'&&<div className="reforge-panel"><span className="reforge-step">02 / COMMIT</span><h3>{multiple?'該当する選択肢をすべて選ぶ':'最適な構成を1つ選ぶ'}</h3><p>{confidenceLabels.find(c=>c.value===confidence)?.label} · 正解の根拠は確定後に開示します。</p><div className="reforge-options">{q.choices.map((choice,i)=><button type="button" key={i} className={selected.includes(i)?'is-selected':''} aria-pressed={selected.includes(i)} onClick={()=>toggleAnswer(i)}><b>{glyph(i)}</b><span>{choice}</span><span aria-hidden="true">{selected.includes(i)?'●':'○'}</span></button>)}</div><button className="reforge-commit" type="button" disabled={!selected.length} onClick={commit}><Zap size={19}/> 回答を確定する</button></div>}
   {phase==='reveal'&&<div className="reforge-panel reforge-reveal"><span className="reforge-step">03 / REVEAL</span><h3>{outcomes.at(-1)?.correct?'BREAK THROUGH!':'KNOWLEDGE UNLOCKED'}</h3><p className="reforge-reveal-caption">{outcomes.at(-1)?.correct?'判断が一致した。今度は理由を確認。':'間違えた箇所が次の攻略対象。根拠を回収しよう。'}</p><div className="reforge-right"><strong><CheckCircle2 size={18}/> 正解の構成</strong>{answerKeys(q).map(i=><p key={i}><b>{glyph(i)}.</b> {q.choices[i]}</p>)}</div><div className="reforge-rationale"><strong>WHY IT WORKS</strong><p>{expandTerms(q.explanation)}</p></div>{q.distractorReasons?.length===q.choices.length&&<div className="reforge-why"><button type="button" aria-expanded={showAlternatives} onClick={()=>setShowAlternatives(v=>!v)}>{showAlternatives?'比較を閉じる':'ほかの選択肢の落とし穴を確認'} <ArrowRight size={17}/></button>{showAlternatives&&<div className="reforge-options-review">{q.choices.map((choice,i)=><div key={i}><b>{glyph(i)}. {choice}</b><p>{expandTerms(q.distractorReasons![i])}</p></div>)}</div>}</div>}<a className="reforge-reference" href={q.reference} rel="noopener noreferrer" target="_blank">AWS公式資料で確認する</a><button type="button" className="reforge-commit" onClick={advance}>{index+1===deck.length?'結果を確認':'次の敵へ'} <ArrowRight size={19}/></button></div>}
  </div>}
  {complete&&<div className="reforge-finish"><span className="reforge-step">MISSION COMPLETE</span><h2>学んだ5問を、次の武器に。</h2><strong className="reforge-bigscore">{report.correct}<small> / {report.total} 正解</small></strong><p>確信していた誤答: {report.sureWrong.length}問 ／ 自信がなくても正解: {report.unexpected.length}問</p><p>この数字は今回の練習結果です。AWS試験の予測スコアや定着率ではありません。</p>{report.review.length>0&&<div className="reforge-review"><strong>次に見直す問題ID</strong><p>{report.review.join(' · ')}</p></div>}<div className="reforge-finish-actions"><button className="reforge-commit" type="button" onClick={onExit}>今日はここで終了 <CheckCircle2 size={18}/></button><button className="reforge-exit" type="button" onClick={restart}>別の5問に挑戦する</button></div></div>}
  <footer className="reforge-footer"><span>{muted?<VolumeX size={15}/>:<Volume2 size={15}/>} サウンドはアプリの設定に従います</span><span>練習用 · XP・学習履歴の自動加算なし · いつでも終了可</span></footer>
 </section>;
}

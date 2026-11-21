import React from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,Shield,Target,Volume2,VolumeX,Zap} from 'lucide-react';
import type {StudyQuestion} from './StudyQuestionIntro';
import {answerKeys,arenaChoiceOrder,arenaDeck,arenaReport,isExactAnswer,type Confidence,type ArenaOutcome} from './reforgeEngine.ts';
import {makeAttemptRunId,type AttemptReward,type StudyAttempt} from './studyAttempt.ts';
import {expandTerms} from './glossary';
import './reforgeArena.css';

type Phase='predict'|'attack'|'reveal'|'recall'|'complete';
type Props={
 questions:readonly StudyQuestion[];
 recommended:readonly StudyQuestion[];
 reasons:Readonly<Record<string,string>>;
 enemy:{name:string;hp:number;maxHp:number};
 onExit:()=>void;
 onSound:(effect:'select'|'correct'|'wrong'|'finish'|'boss-hit'|'boss-win')=>void;
 onAttempt:(event:StudyAttempt)=>AttemptReward|null;
 muted:boolean;
 effectsEnabled:boolean;
 reduced:boolean;
 onToggleSound:()=>void;
 onToggleEffects:()=>void;
};
const confidenceLabels:{value:Confidence;label:string;description:string}[]=[
 {value:'sure',label:'確信あり',description:'根拠まで説明できる'},
 {value:'maybe',label:'たぶん',description:'候補は絞れる'},
 {value:'guess',label:'まだ分からない',description:'ここで学ぶ'}
];
const glyph=(i:number)=>'ABCDEFGH'[i]??String(i+1);
/** UI owns only transient actions. Every graded practice response travels through the parent's canonical reducer. */
export default function ReforgeArena({questions,recommended,reasons,enemy,onExit,onSound,onAttempt,muted,effectsEnabled,reduced,onToggleSound,onToggleEffects}:Props){
 const [runId,setRunId]=React.useState(makeAttemptRunId);
 const [seed,setSeed]=React.useState(()=>Date.now());
 const [deck,setDeck]=React.useState(()=>arenaDeck(recommended.length?recommended:questions,Date.now()));
 const [selectionReasons,setSelectionReasons]=React.useState(()=>({...reasons}));
 const [index,setIndex]=React.useState(0);
 const [phase,setPhase]=React.useState<Phase>('predict');
 const [confidence,setConfidence]=React.useState<Confidence|null>(null);
 const [selected,setSelected]=React.useState<number[]>([]);
 const [recallSelected,setRecallSelected]=React.useState<number[]>([]);
 const [recallResult,setRecallResult]=React.useState<boolean|null>(null);
 const [outcomes,setOutcomes]=React.useState<ArenaOutcome[]>([]);
 const [showAlternatives,setShowAlternatives]=React.useState(false);
 const [impact,setImpact]=React.useState<'win'|'learn'|null>(null);
 const [reward,setReward]=React.useState<AttemptReward|null>(null);
 const [error,setError]=React.useState('');
 const committingRef=React.useRef(false);
 const q=deck[index];
 const multiple=!!q?.answers;
 const complete=phase==='complete'||!q;
 const report=arenaReport(outcomes);
 const choiceOrder=React.useMemo(()=>q?arenaChoiceOrder(q,seed+index):[],[q,seed,index]);
 const recallOrder=React.useMemo(()=>q?arenaChoiceOrder(q,(seed+index)^0x7f4a7c15):[],[q,seed,index]);
 const clearFx=()=>setImpact(null);
 function beginAttack(value:Confidence){if(phase!=='predict')return;setConfidence(value);setPhase('attack');onSound('select')}
 function toggleAnswer(value:number){if(phase!=='attack')return;setSelected(current=>multiple?(current.includes(value)?current.filter(x=>x!==value):[...current,value]):[value]);onSound('select')}
 function commit(){
  if(phase!=='attack'||committingRef.current||!q||!confidence||selected.length===0||(!multiple&&selected.length!==1))return;
  committingRef.current=true;
  const correct=isExactAnswer(q,selected);
  const streak=correct?1+[...outcomes].reverse().findIndex(x=>!x.correct):0;
  const combo=correct?(outcomes.every(x=>x.correct)?outcomes.length+1:Math.max(1,streak)):0;
  const event:StudyAttempt={attemptId:runId+':'+index+':'+q.id,questionId:q.id,domain:q.domain,correct,combo,difficulty:q.difficulty,mode:'daily',boss:false,at:Date.now()};
  const credited=onAttempt(event);
  if(!credited?.credited){committingRef.current=false;setError('学習履歴を安全に保存できません。別のタブや保存状態を確認してください。');return}
  setReward(credited);setError('');
  setOutcomes(before=>[...before,{questionId:q.id,domain:q.domain,correct,confidence}]);
  setPhase('reveal');setShowAlternatives(false);
  const damage=credited.campaign?.damage??0;
  setImpact(damage>0?'win':'learn');
  onSound(credited.campaign?.defeated?'boss-win':damage>0?'boss-hit':correct?'correct':'wrong');
 }
 function startRecall(){if(phase!=='reveal')return;setRecallSelected([]);setRecallResult(null);setPhase('recall');setShowAlternatives(false)}
 function toggleRecall(value:number){if(phase!=='recall'||recallResult!==null)return;setRecallSelected(current=>multiple?(current.includes(value)?current.filter(x=>x!==value):[...current,value]):[value]);onSound('select')}
 function checkRecall(){
  if(phase!=='recall'||recallResult!==null||!q||recallSelected.length===0)return;
  const ok=isExactAnswer(q,recallSelected);
  setRecallResult(ok);
  setOutcomes(before=>before.map((item,i)=>i===index?{...item,reconstructed:ok}:item));
  onSound(ok?'correct':'wrong');
 }
 function advance(){
  if(phase!=='reveal'&&phase!=='recall')return;
  clearFx();committingRef.current=false;setReward(null);setError('');
  if(index+1>=deck.length){setPhase('complete');onSound('finish');return}
  setIndex(current=>current+1);setSelected([]);setConfidence(null);setRecallSelected([]);setRecallResult(null);setShowAlternatives(false);setPhase('predict');
 }
 function restart(){
  const next=Date.now()+1;setSeed(next);setRunId(makeAttemptRunId());
  setDeck(arenaDeck(recommended.length?recommended:questions,next));setSelectionReasons({...reasons});
  setIndex(0);setPhase('predict');setSelected([]);setConfidence(null);setOutcomes([]);
  setShowAlternatives(false);setRecallSelected([]);setRecallResult(null);setReward(null);setError('');clearFx();committingRef.current=false;
 }
 if(deck.length===0)return <section className="reforge-arena"><h1>出題できる問題がありません</h1><button onClick={onExit}>ホームへ戻る</button></section>;
 return <section className={'reforge-arena'+(effectsEnabled?'':' reforge-calm')} aria-label="OVERDRIVE REFORGED 学習アリーナ">
  <div className="reforge-top">
   <button type="button" onClick={onExit} className="reforge-exit"><ArrowLeft size={18}/> ホームへ戻る</button>
   <span><Zap size={15}/> REFORGED / LEARNING ARENA</span>
   <div className="reforge-controls" role="group" aria-label="学習アリーナの音と演出"><button type="button" aria-pressed={!muted} onClick={onToggleSound}>{muted?<VolumeX size={17}/>:<Volume2 size={17}/>} SE {muted?'OFF':'ON'}</button><button type="button" aria-pressed={effectsEnabled} disabled={reduced} onClick={onToggleEffects}>FX {effectsEnabled?'ON':'OFF'}</button></div>
  </div>
  {!complete&&<div className="reforge-stage">
   <div className="reforge-stage-meta"><span>ENCOUNTER {index+1} / {deck.length}</span><span>{q.domain}</span></div>
   <div className="reforge-progress" role="progressbar" aria-label="アリーナの進行" aria-valuemin={0} aria-valuemax={deck.length} aria-valuenow={index+(phase==='reveal'||phase==='recall'?1:0)}><span style={{width:(index+(phase==='reveal'||phase==='recall'?1:0))/deck.length*100+'%'}}/></div>
   <div className="reforge-enemy">
    <div className={'reforge-core '+(impact?'reforge-core-'+impact:'')} aria-hidden="true"><Target size={42}/></div>
    <span>LIVE CAMPAIGN · {enemy.name}</span>
    <strong>{enemy.hp} / {enemy.maxHp} HP</strong>
    <div className="reforge-enemy-hp" role="progressbar" aria-label={enemy.name+' の残りHP'} aria-valuemin={0} aria-valuemax={enemy.maxHp} aria-valuenow={enemy.hp}><span style={{width:(enemy.maxHp>0?enemy.hp/enemy.maxHp*100:0)+'%'}}/></div>
   </div>
   <div className="reforge-question"><div className="reforge-question-label"><Shield size={17}/> MISSION BRIEF <span>#{q.id}</span></div>{selectionReasons[q.id]&&<p className="reforge-selection-reason">出題理由：{selectionReasons[q.id]}</p>}<h2>{q.question}</h2></div>
   {phase==='predict'&&<div className="reforge-panel"><span className="reforge-step">01 / PREDICT</span><h3>解答前に、自分の確信度を決める</h3><p>間違えても演習の失敗ではありません。自信のあった誤解は、次の攻略ポイントになります。</p><div className="reforge-confidence">{confidenceLabels.map(item=><button type="button" key={item.value} onClick={()=>beginAttack(item.value)}><strong>{item.label}</strong><small>{item.description}</small><ArrowRight size={18}/></button>)}</div></div>}
   {phase==='attack'&&<div className="reforge-panel"><span className="reforge-step">02 / COMMIT</span><h3>{multiple?'該当する選択肢をすべて選ぶ':'最適な構成を1つ選ぶ'}</h3><p>{confidenceLabels.find(c=>c.value===confidence)?.label} · 正解の根拠は確定後に開示します。</p><div className="reforge-options">{choiceOrder.map((i,pos)=><button type="button" key={i} className={selected.includes(i)?'is-selected':''} aria-pressed={selected.includes(i)} onClick={()=>toggleAnswer(i)}><b>{glyph(pos)}</b><span>{q.choices[i]}</span><span aria-hidden="true">{selected.includes(i)?'●':'○'}</span></button>)}</div>{error&&<p role="alert">{error}</p>}<button className="reforge-commit" type="button" disabled={!selected.length} onClick={commit}><Zap size={19}/> 回答を確定する</button></div>}
   {phase==='reveal'&&<div className="reforge-panel reforge-reveal"><span className="reforge-step">03 / REVEAL</span><h3>{outcomes[outcomes.length-1]?.correct?'BREAK THROUGH!':'KNOWLEDGE UNLOCKED'}</h3><p className="reforge-reveal-caption">{outcomes[outcomes.length-1]?.correct?'判断が一致した。今度は理由を確認。':'間違えた箇所が次の攻略対象。根拠を回収しよう。'}</p>
    {reward&&<div className="reforge-earned" role="status"><strong>+{reward.totalXp} XP</strong><span>実ダメージ {reward.campaign?.damage??0}</span>{reward.campaign?.defeated&&<b>{reward.campaign.defeated.name} 討伐！</b>}{reward.sameDayRepeat&&<small>同日再回答：追加XP・ダメージなし</small>}</div>}
    <div className="reforge-right"><strong><CheckCircle2 size={18}/> 正解の構成</strong>{answerKeys(q).map(i=><p key={i}><b>{glyph(choiceOrder.indexOf(i))}.</b> {q.choices[i]}</p>)}</div><div className="reforge-rationale"><strong>WHY IT WORKS</strong><p>{expandTerms(q.explanation)}</p></div>{q.distractorReasons?.length===q.choices.length&&<div className="reforge-why"><button type="button" aria-expanded={showAlternatives} onClick={()=>setShowAlternatives(v=>!v)}>{showAlternatives?'比較を閉じる':'ほかの選択肢の落とし穴を確認'} <ArrowRight size={17}/></button>{showAlternatives&&<div className="reforge-options-review">{choiceOrder.map((i,pos)=><div key={i}><b>{glyph(pos)}. {q.choices[i]}</b><p>{expandTerms(q.distractorReasons![i])}</p></div>)}</div>}</div>}<a className="reforge-reference" href={q.reference} rel="noopener noreferrer" target="_blank">AWS公式資料で確認する</a>
    <button type="button" className="reforge-recall-cta" onClick={startRecall}>RECALL STRIKE · 答えを隠してもう一度選ぶ</button>
    <button type="button" className="reforge-commit" onClick={advance}>{index+1===deck.length?'結果を確認':'次の敵へ'} <ArrowRight size={19}/></button>
   </div>}
   {phase==='recall'&&<div className="reforge-panel reforge-recall"><span className="reforge-step">04 / RECALL STRIKE</span><h3>今の理解を、自分で再構成する</h3><p>解説を隠しました。選択肢を違う順序で表示します。直後の確認なので、長期定着の証拠にはしません。</p><div className="reforge-options">{recallOrder.map((i,pos)=><button type="button" key={i} aria-pressed={recallSelected.includes(i)} className={recallSelected.includes(i)?'is-selected':''} disabled={recallResult!==null} onClick={()=>toggleRecall(i)}><b>{glyph(pos)}</b><span>{q.choices[i]}</span><span aria-hidden="true">{recallSelected.includes(i)?'●':'○'}</span></button>)}</div>{recallResult===null?<button type="button" className="reforge-commit" disabled={!recallSelected.length} onClick={checkRecall}>再構成を確認する <Zap size={18}/></button>:<div className="reforge-recall-result" role="status"><strong>{recallResult?'RECONSTRUCTED!':'次回の復習候補'}</strong><p>{recallResult?'直後に再構成できました。翌日以降も思い出せるか確認しましょう。':'正解：'+answerKeys(q).map(i=>glyph(recallOrder.indexOf(i))).join('・')+'。次回、根拠も思い出してみましょう。'}</p></div>}<button type="button" className="reforge-exit reforge-skip" onClick={advance}>{index+1===deck.length?'結果へ進む':'次の敵へ進む'} <ArrowRight size={18}/></button></div>}
  </div>}
  {complete&&<div className="reforge-finish"><span className="reforge-step">MISSION COMPLETE</span><h2>学んだ5問を、次の武器に。</h2><strong className="reforge-bigscore">{report.correct}<small> / {report.total} 正解</small></strong><p>確信していた誤答: {report.sureWrong.length}問 ／ 自信がなくても正解: {report.unexpected.length}問</p><p>直後の再構成成功: {report.reconstructed}問（長期定着の証明ではありません）</p><p>XP・敵HP・復習予定は通常の学習履歴に反映済みです。今回の正答率はAWS試験の予測スコアではありません。</p>{report.review.length>0&&<div className="reforge-review"><strong>次に見直す問題ID</strong><p>{report.review.join(' · ')}</p></div>}<div className="reforge-finish-actions"><button className="reforge-commit" type="button" onClick={onExit}>今日はここで終了 <CheckCircle2 size={18}/></button><button className="reforge-exit" type="button" onClick={restart}>別の5問に挑戦する</button></div></div>}
  <footer className="reforge-footer"><span>{muted?<VolumeX size={15}/>:<Volume2 size={15}/>} サウンドはアプリの設定に従います</span><span>5問完結 · 何度でも中断可 · 同日XP連打なし</span></footer>
 </section>;
}

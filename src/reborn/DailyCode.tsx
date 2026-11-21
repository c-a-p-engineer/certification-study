import React,{useRef,useState} from 'react';
import {ArrowLeft,BookOpen,Check,ChevronRight,Copy,Grid2X2,Link2,RefreshCw,Sparkles,Trophy,Zap} from 'lucide-react';
import {localDateKey} from '../studyHistory.ts';
import LiveReactor,{type ReactorReaction} from './LiveReactor.tsx';
import {dailyCodePuzzle,randomCodePuzzle,dailyMatchResult,dailyCodeScore,readDailyBest,writeDailyBest,readRecentCodeSets,rememberRandomCodeSet,DAILY_CODE_SETS,type CodePuzzle,type CodeTerm} from './dailyCodeEngine.ts';

export type DailyCodeProps={onExit:()=>void;onSound:(effect:'correct'|'wrong'|'finish'|'select')=>void;onHaptic:(effect:'correct'|'wrong'|'reward'|'select')=>void};
type Mode='daily'|'random';
type CompletedRound={setId:number;termIds:string[];score:number;mistakes:number};
function newSeed():number{
 try{if(typeof crypto!=='undefined'&&crypto.getRandomValues){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);return bytes[0]}}catch{}
 return (Date.now()^(Math.random()*0xffffffff))>>>0;
}
export default function DailyCode({onExit,onSound,onHaptic}:DailyCodeProps){
 const [day]=useState(()=>localDateKey(new Date()));
 const [mode,setMode]=useState<Mode|null>(null);
 const [puzzle,setPuzzle]=useState<CodePuzzle|null>(null);
 const [selected,setSelected]=useState<string|null>(null);
 const [matched,setMatched]=useState<string[]>([]);
 const [mistakes,setMistakes]=useState(0);
 const [lastSolved,setLastSolved]=useState<CodeTerm|null>(null);
 const [message,setMessage]=useState('');
 const [impact,setImpact]=useState(0);
 const [fxReaction,setFxReaction]=useState<ReactorReaction>('idle');
 const [copyStatus,setCopyStatus]=useState('');
 const [rounds,setRounds]=useState<CompletedRound[]>([]);
 const recentlySolved=useRef(new Set<string>());
 const done=!!puzzle&&matched.length===puzzle.clues.length;
 const score=dailyCodeScore(mistakes);
 const best=readDailyBest(day,typeof localStorage==='undefined'?null:localStorage);
 const totalPoints=rounds.reduce((sum,round)=>sum+round.score,0);
 const totalMistakes=rounds.reduce((sum,round)=>sum+round.mistakes,0);
 function setNewPuzzle(next:CodePuzzle){
  setPuzzle(next);setSelected(null);setMatched([]);setMistakes(0);setLastSolved(null);
  setMessage('用語の意味を思い出してみよう。');setImpact(0);setFxReaction('idle');setCopyStatus('');
  recentlySolved.current.clear();
 }
 function selectRandom(recent:readonly CompletedRound[]):CodePuzzle{
  const stored=typeof localStorage==='undefined'?[]:readRecentCodeSets(localStorage);
  const excluded=[...stored,...recent.map(round=>round.setId)];
  const recentTerms=recent.slice(-5).flatMap(round=>round.termIds);
  const next=randomCodePuzzle(day,newSeed(),excluded,recentTerms);
  try{if(typeof localStorage!=='undefined')rememberRandomCodeSet(next.setId,localStorage)}catch{}
  return next;
 }
 function start(nextMode:Mode){
  setMode(nextMode);setRounds([]);
  setNewPuzzle(nextMode==='daily'?dailyCodePuzzle(day):selectRandom([]));
  onSound('select');
 }
 function nextRound(){
  if(!done||mode!=='random')return;
  setNewPuzzle(selectRandom(rounds));
  onSound('select');
 }
 function pickClue(id:string){
  if(done||!puzzle||matched.includes(id))return;
  setSelected(id);setMessage('対応するAWSサービスを選ぼう');setImpact(v=>v+1);setFxReaction('select');onSound('select');onHaptic('select');
 }
 function pickAnswer(id:string){
  if(done||!puzzle||matched.includes(id))return;
  if(!selected){setMessage('まず左側の説明を一つ選んでください');return}
  if(recentlySolved.current.has(selected))return;
  const result=dailyMatchResult(selected,id,matched);
  if(result==='already')return;
  setImpact(v=>v+1);
  if(result==='wrong'){
   setFxReaction('wrong');
   setMistakes(v=>v+1);setMessage('違う組み合わせ。説明を読み直して再挑戦！');
   onSound('wrong');onHaptic('wrong');return;
  }
  setFxReaction('correct');
  recentlySolved.current.add(id);
  const term=puzzle.clues.find(x=>x.id===id)!;
  const next=[...matched,id];
  setMatched(next);setLastSolved(term);setSelected(null);
  setMessage(term.title+' を発見！');onSound('correct');onHaptic('correct');
  if(next.length===puzzle.clues.length){
   const finalScore=dailyCodeScore(mistakes);
   setRounds(prev=>[...prev,{setId:puzzle.setId,termIds:puzzle.clues.map(x=>x.id),score:finalScore,mistakes}]);
   if(mode==='daily')try{writeDailyBest(day,finalScore,localStorage)}catch{}
   onSound('finish');onHaptic('reward');
  }
 }
 async function shareResult(){
  const title=mode==='random'?'AWS RANDOM CODE':'AWS DAILY CODE';
  const caption=mode==='random'?rounds.length+' ROUNDS · '+(rounds.length*4)+' MATCH · '+totalPoints+' PTS · ミス'+totalMistakes+'回':'4/4 MATCH · '+score+' PTS · ミス'+mistakes+'回';
  const content=title+' '+day+'\n'+caption+'\n#OVERDRIVE';
  try{await navigator.clipboard.writeText(content);setCopyStatus('結果をコピーしました')}catch{setCopyStatus('このブラウザではコピーできません')}
 }
 return <div className="dc-root">
  <div className="sa-top"><button className="rb-back" onClick={onExit}><ArrowLeft size={18}/> ホームへ</button><strong>{mode==='random'?'RANDOM CODE': 'DAILY CODE'} · {day}</strong></div>
  {!mode&&<section className="dc-scene dc-launch">
   <div className="dc-heading"><Grid2X2 size={31}/><div><span>SOLO KNOWLEDGE PUZZLE</span><h1>サービスを結び付けろ</h1></div></div>
   <p>AWSサービスと役割を対応させるパズル。問題の組み合わせを変えて、何度でも挑戦できます。</p>
   <div className="dc-launch-stats"><span><strong>{DAILY_CODE_SETS.length}</strong>種類の問題セット</span><span><strong>4</strong>組 / 1ラウンド</span></div>
   <button className="rb-start dc-play-primary" onClick={()=>start('random')}><RefreshCw size={19}/> ランダムに遊ぶ <ChevronRight size={20}/></button>
   <button className="rb-secondary dc-play-secondary" onClick={()=>start('daily')}><Grid2X2 size={19}/> 今日の4問（固定）</button>
   <p className="rb-disclaimer">ランダムは1ラウンドごとに新しい4組へ。目標はまず5ラウンド＝20組。途中でいつでも終了できます。</p>
  </section>}
  {mode&&puzzle&&!done&&<section className="dc-scene">
    <div className="dc-heading"><Grid2X2 size={31}/><div><span>{mode==='random'?'RANDOM CHALLENGE · ROUND '+(rounds.length+1):'DAILY PUZZLE'}</span><h1>サービスを結び付けろ</h1></div></div>
    <p>左の説明を読み、意味が合うAWSサービスを右から選ぼう。位置ではなく知識で見つけよう。</p>
    <div className="dc-progress"><strong>{matched.length} / 4 MATCH</strong><span>{score} PTS</span></div>
    {mode==='random'&&<div className="dc-round-stats">通算 {rounds.length*4+matched.length} 組正解 · {rounds.length} ラウンド突破</div>}
    <div className="dc-gauge"><span style={{width:matched.length*25+'%'}}/></div>
    <LiveReactor mode="code" charge={matched.length} pulse={impact} reaction={fxReaction}/>
    <div className="dc-board">
     <div className="dc-column"><h2><BookOpen size={18}/> ① 説明を選ぶ</h2>{puzzle.clues.map((term,i)=><button key={term.id} type="button" className={'dc-tile '+(selected===term.id?'dc-selected ':'')+(matched.includes(term.id)?'dc-matched':'')} disabled={matched.includes(term.id)} aria-pressed={selected===term.id} onClick={()=>pickClue(term.id)}><span className="dc-index">{i+1}</span><span>{term.meaning}</span>{matched.includes(term.id)&&<Check size={20}/>}</button>)}</div>
     <div className="dc-column"><h2><Link2 size={18}/> ② サービスを選ぶ</h2>{puzzle.answers.map((term,i)=><button key={term.id} type="button" className={'dc-tile dc-service '+(matched.includes(term.id)?'dc-matched':'')} disabled={matched.includes(term.id)} onClick={()=>pickAnswer(term.id)}><span className="dc-index">{String.fromCharCode(65+i)}</span><span>{term.title}</span>{matched.includes(term.id)&&<Check size={20}/>}</button>)}</div>
    </div>
    <p key={impact} className="dc-notice" role="status">{message}</p>
    {lastSolved&&<div className="dc-learn" key={lastSolved.id}><span><Sparkles size={18}/> KNOWLEDGE UNLOCK</span><strong>{lastSolved.title} — {lastSolved.meaning}</strong><p>{lastSolved.note}</p></div>}
  </section>}
  {mode&&puzzle&&done&&<section className="dc-scene dc-complete"><Trophy size={45}/><span className="rb-eyebrow">{mode==='random'?'ROUND CLEAR':'DAILY CODE COMPLETE'}</span><h1>{mode==='random'?'ラウンド '+rounds.length+' クリア！':'コード解読成功！'}</h1><div className="sa-results"><div><small>一致</small><strong>4 / 4</strong></div><div><small>ミス</small><strong>{mistakes}回</strong></div><div><small>スコア</small><strong>{score}</strong></div></div>
   {mode==='daily'?<p>今日のベスト：{Math.max(best,score)} PTS</p>:<div className="dc-milestone"><strong>{rounds.length} ROUNDS / {rounds.length*4} MATCHES</strong><span>累計 {totalPoints.toLocaleString('ja-JP')} PTS · ミス {totalMistakes}回</span>{rounds.length>=5&&<strong><Zap size={17}/> 20組突破！ さらに挑戦できる</strong>}</div>}
   <div className="dc-summary"><h2>今回の4つのサービス</h2>{puzzle.clues.map(term=><div key={term.id}><strong>{term.title}</strong><span>{term.meaning}</span><small>{term.note}</small></div>)}</div>
   <p className="rb-disclaimer">このパズルは知識を整理する練習です。ゲームスコアはAWS認定試験の合格予測ではありません。</p>
   {mode==='random'?<button className="rb-start" onClick={nextRound}><RefreshCw size={19}/> 次の4問に挑戦 <ChevronRight size={20}/></button>:<button className="rb-start" onClick={()=>start('random')}><RefreshCw size={19}/> ランダム問題を遊ぶ <ChevronRight size={20}/></button>}
   <button className="rb-secondary" onClick={()=>{void shareResult()}}><Copy size={17}/> 結果テキストをコピー</button>{copyStatus&&<p role="status">{copyStatus}</p>}
   <button className="rb-secondary" onClick={onExit}>今日はここで終了 <ChevronRight size={19}/></button>
  </section>}
 </div>
}

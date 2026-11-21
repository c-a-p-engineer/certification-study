import React,{useMemo,useRef,useState} from 'react';
import {ArrowLeft,BookOpen,Check,ChevronRight,Copy,Grid2X2,Link2,RefreshCw,Sparkles,Trophy,Zap} from 'lucide-react';
import {localDateKey} from '../studyHistory.ts';
import {dailyCodePuzzle,dailyMatchResult,dailyCodeScore,readDailyBest,writeDailyBest,type CodeTerm} from './dailyCodeEngine.ts';

export type DailyCodeProps={onExit:()=>void;onSound:(effect:'correct'|'wrong'|'finish'|'select')=>void;onHaptic:(effect:'correct'|'wrong'|'reward'|'select')=>void};
export default function DailyCode({onExit,onSound,onHaptic}:DailyCodeProps){
 const [day]=useState(()=>localDateKey(new Date()));
 const puzzle=useMemo(()=>dailyCodePuzzle(day),[day]);
 const [selected,setSelected]=useState<string|null>(null);
 const [matched,setMatched]=useState<string[]>([]);
 const [mistakes,setMistakes]=useState(0);
 const [lastSolved,setLastSolved]=useState<CodeTerm|null>(null);
 const [message,setMessage]=useState('');
 const [impact,setImpact]=useState(0);
 const [copyStatus,setCopyStatus]=useState('');
 const recentlySolved=useRef(new Set<string>());
 const done=matched.length===puzzle.clues.length;
 const score=dailyCodeScore(mistakes);
 const best=readDailyBest(day,typeof localStorage==='undefined'?null:localStorage);
 function pickClue(id:string){
  if(done||matched.includes(id))return;
  setSelected(id);setMessage('対応するAWSサービスを選ぼう');onSound('select');
 }
 function pickAnswer(id:string){
  if(done||matched.includes(id))return;
  if(!selected){setMessage('まず左側の「説明」を一つ選んでください');return}
  if(recentlySolved.current.has(selected))return;
  const result=dailyMatchResult(selected,id,matched);
  if(result==='already')return;
  setImpact(v=>v+1);
  if(result==='wrong'){setMistakes(v=>v+1);setMessage('違う組み合わせ。説明を読み直して再挑戦！');onSound('wrong');onHaptic('wrong');return}
  recentlySolved.current.add(id);
  const term=puzzle.clues.find(x=>x.id===id)!;
  const next=[...matched,id];
  setMatched(next);setLastSolved(term);setSelected(null);setMessage(term.title+' を発見！');onSound('correct');onHaptic('correct');
  if(next.length===puzzle.clues.length){
   try{writeDailyBest(day,dailyCodeScore(mistakes),localStorage)}catch{}
   onSound('finish');onHaptic('reward');
  }
 }
 async function shareResult(){
  const message='AWS DAILY CODE '+day+'\n'+matched.length+'/4 MATCH · '+score+' PTS · ミス'+mistakes+'回\n#OVERDRIVE';
  try{await navigator.clipboard.writeText(message);setCopyStatus('結果をコピーしました')}catch{setCopyStatus('このブラウザではコピーできません')}
 }
 return <div className="dc-root">
  <div className="sa-top"><button className="rb-back" onClick={onExit}><ArrowLeft size={18}/> ホームへ</button><strong>DAILY CODE · {day}</strong></div>
  {!done?<section className="dc-scene">
    <div className="dc-heading"><Grid2X2 size={31}/><div><span>DAILY PUZZLE</span><h1>サービスを結び付けろ</h1></div></div>
    <p>左の説明を選んで、対応するAWSサービスを右から選ぼう。</p>
    <div className="dc-progress"><strong>{matched.length} / 4 MATCH</strong><span>{score} PTS</span></div>
    <div className="dc-gauge"><span style={{width:matched.length*25+'%'}}/></div>
    <div className="dc-board">
     <div className="dc-column"><h2><BookOpen size={18}/> ① 説明を選ぶ</h2>{puzzle.clues.map((term,i)=><button key={term.id} type="button" className={'dc-tile '+(selected===term.id?'dc-selected ':'')+(matched.includes(term.id)?'dc-matched':'')} disabled={matched.includes(term.id)} aria-pressed={selected===term.id} onClick={()=>pickClue(term.id)}><span className="dc-index">{i+1}</span><span>{term.meaning}</span>{matched.includes(term.id)&&<Check size={20}/>}</button>)}</div>
     <div className="dc-column"><h2><Link2 size={18}/> ② サービスを選ぶ</h2>{puzzle.answers.map((term,i)=><button key={term.id} type="button" className={'dc-tile dc-service '+(matched.includes(term.id)?'dc-matched':'')} disabled={matched.includes(term.id)} onClick={()=>pickAnswer(term.id)}><span className="dc-index">{String.fromCharCode(65+i)}</span><span>{term.title}</span>{matched.includes(term.id)&&<Check size={20}/>}</button>)}</div>
    </div>
    <p key={impact} className="dc-notice" role="status">{message||'用語の意味を思い出してみよう。'}</p>
    {lastSolved&&<div className="dc-learn" key={lastSolved.id}><span><Sparkles size={18}/> KNOWLEDGE UNLOCK</span><strong>{lastSolved.title} — {lastSolved.meaning}</strong><p>{lastSolved.note}</p></div>}
  </section>:<section className="dc-scene dc-complete"><Trophy size={45}/><span className="rb-eyebrow">DAILY CODE COMPLETE</span><h1>コード解読成功！</h1><div className="sa-results"><div><small>一致</small><strong>4 / 4</strong></div><div><small>ミス</small><strong>{mistakes}回</strong></div><div><small>スコア</small><strong>{score}</strong></div></div><p>今日のベスト：{Math.max(best,score)} PTS</p><div className="dc-summary"><h2>今日の4つのサービス</h2>{puzzle.clues.map(term=><div key={term.id}><strong>{term.title}</strong><span>{term.meaning}</span><small>{term.note}</small></div>)}</div><p className="rb-disclaimer">このパズルは理解を深める練習です。AWS認定試験の模擬得点や知識定着率ではありません。</p><button className="rb-secondary" onClick={()=>{void shareResult()}}><Copy size={17}/> 結果テキストをコピー</button>{copyStatus&&<p role="status">{copyStatus}</p>}<button className="rb-start" onClick={onExit}>今日はここで終了 <ChevronRight size={19}/></button></section>}
 </div>
}

import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Flame,Heart,Shield,Sparkles,Swords,Timer,Trophy,Zap} from 'lucide-react';
import type {StudyQuestion} from '../StudyQuestionIntro.tsx';
import {TermsPanel} from '../StudyQuestionIntro.tsx';
import LiveReactor,{type ReactorReaction} from './LiveReactor.tsx';
import QuestHero3D from './QuestHero3D.tsx';
import type {AvatarAppearance} from './avatarCollection.ts';
import BattleStage,{type BattleEvent} from './BattleStage.tsx';
import {enemyHpAfterHit,opponentForStage,questBossWon,questHitDamage} from './questBattleEngine.ts';
import {readReadingGuide,saveReadingGuide,splitReadingSentences} from '../readingGuide.ts';
import {expandTerms} from '../glossary.ts';
import {makeAttemptRunId} from '../studyAttempt.ts';
import {isCorrect,shuffled} from './planner.ts';
import {applyQuestAnswer,blitzAllowed,blitzDeck,blitzPoints,finishQuest,grantQuestSkill,questDeck,QUEST_ROUTES,QUEST_SKILLS,startQuest,BLITZ_SECONDS,QUEST_STAGE_SIZE,type ArcadeKind,type QuestRoute,type QuestSkill} from './soloArcadeEngine.ts';

export type SoloArcadeProps={kind:ArcadeKind;bank:readonly StudyQuestion[];learnedIds:readonly string[];onRecord:(q:StudyQuestion,correct:boolean,combo:number,id:string)=>boolean;onSound:(e:'correct'|'wrong'|'select'|'combo'|'boss-win'|'finish'|'start')=>void;onHaptic:(e:'select'|'correct'|'wrong'|'combo'|'boss-win'|'start')=>void;onExit:()=>void;appearance?:AvatarAppearance;allow3d?:boolean};
type Step='route'|'question'|'review'|'skill'|'done';
type Response={question:StudyQuestion;correct:boolean};
const BOSS:QuestRoute={id:'boss',title:'ARCHITECT BOSS',description:'4分野の総合決戦'};
const BEST_KEY='cert-overdrive-blitz-personal-best-v1';
const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function savedBest(){try{return Number(localStorage.getItem(BEST_KEY))||0}catch{return 0}}
export default function SoloArcade({kind,bank,learnedIds,onRecord,onSound,onHaptic,onExit,appearance,allow3d=false}:SoloArcadeProps){
 const [runId]=useState(makeAttemptRunId);
 const [seed]=useState(()=>Date.now());
 const [quest,setQuest]=useState(startQuest);
 const [foe,setFoe]=useState(()=>({...opponentForStage(0,'security'),hp:95}));
 const [battleEvent,setBattleEvent]=useState<BattleEvent>({seq:0,kind:'idle',damage:0});
 const [step,setStep]=useState<Step>(kind==='quest'?'route':'question');
 const [deck,setDeck]=useState<StudyQuestion[]>(()=>kind==='blitz'?blitzDeck(bank,learnedIds,Date.now()):[]);
 const [index,setIndex]=useState(0);
 const [chosen,setChosen]=useState<number[]>([]);
 const [responses,setResponses]=useState<Response[]>([]);
 const [answer,setAnswer]=useState<Response|null>(null);
 const [score,setScore]=useState(0);
 const [streak,setStreak]=useState(0);
 const [bestCombo,setBestCombo]=useState(0);
 const [left,setLeft]=useState(BLITZ_SECONDS*1000);
 const [error,setError]=useState('');
 const [impact,setImpact]=useState<{count:number;correct:boolean;points:number}|null>(null);
 const [fxPulse,setFxPulse]=useState(0);
 const [fxReaction,setFxReaction]=useState<ReactorReaction>('idle');
 const [reading,setReading]=useState(readReadingGuide);
 const deadline=useRef(kind==='blitz'?Date.now()+BLITZ_SECONDS*1000:0);
 const questionStart=useRef(Date.now());
 const locked=useRef<string|null>(null);
 const current=deck[index],isBlitz=kind==='blitz';
 useEffect(()=>{if(isBlitz&&step==='question')locked.current=null},[index,isBlitz,step]);
 const correctCount=responses.filter(r=>r.correct).length,missed=responses.filter(r=>!r.correct);
 const order=useMemo(()=>current?shuffled(current.choices.map((_,i)=>i),seed+index*97+quest.stage*1001):[],[current,index,seed,quest.stage]);
 useEffect(()=>{if(!isBlitz||step==='done')return;const timer=window.setInterval(()=>{const value=Math.max(0,deadline.current-Date.now());setLeft(value);if(value===0)setStep('done')},100);return()=>window.clearInterval(timer)},[isBlitz,step]);
 useEffect(()=>{if(step==='done'&&isBlitz&&score>savedBest())try{localStorage.setItem(BEST_KEY,String(score))}catch{}},[step,isBlitz,score]);
 function selectRoute(route:QuestRoute){
  const used=responses.map(r=>r.question.id),next=questDeck(bank,route,seed+quest.stage*47,used);
  if(next.length!==QUEST_STAGE_SIZE){setError('このルートの問題が不足しています');return}
  const opponent=opponentForStage(quest.stage,route.id);
  setFoe({...opponent,hp:opponent.maxHp});setBattleEvent({seq:0,kind:'idle',damage:0});
  setDeck(next);setIndex(0);setChosen([]);setAnswer(null);locked.current=null;questionStart.current=Date.now();setError('');setStep('question');setFxReaction('idle');onSound('start');onHaptic('start');
 }
 function grade(selection:readonly number[]){
  if(!current||step!=='question'||!selection.length)return;
  const receipt=runId+':'+responses.length+':'+current.id;
  if(locked.current===receipt)return;
  const now=Date.now();
  if(isBlitz&&!blitzAllowed(deadline.current,now,false)){setStep('done');return}
  locked.current=receipt;
  const correct=isCorrect(current,selection),combo=correct?(isBlitz?streak+1:quest.streak+1):0;
  if(!onRecord(current,correct,combo,receipt)){locked.current=null;setError('保存できません。学習記録の競合を確認してください。');return}
  const item={question:current,correct};setResponses(prev=>[...prev,item]);setError('');
  setFxPulse(v=>v+1);setFxReaction(correct?'correct':'wrong');
  onSound(correct?(combo>=3?'combo':'correct'):'wrong');onHaptic(correct?(combo>=3?'combo':'correct'):'wrong');
  if(isBlitz){
   const earned=blitzPoints(correct,combo,(now-questionStart.current)/1000);
   setImpact(value=>({count:(value?.count??0)+1,correct,points:earned}));
   setScore(value=>value+earned);
   setStreak(combo);setBestCombo(value=>Math.max(value,combo));
   if(index+1>=deck.length||Date.now()>=deadline.current){setStep('done');onSound('finish')}
   else{setIndex(value=>value+1);setChosen([]);questionStart.current=Date.now()}
  }else{
   const damage=Math.min(foe.hp,questHitDamage(correct,quest.stage,combo,quest.skills));
   setFoe(value=>({...value,hp:enemyHpAfterHit(value.hp,damage)}));
   setBattleEvent(value=>({seq:value.seq+1,kind:correct?(damage>0?'hit':'idle'):'hurt',damage}));
   setQuest(value=>applyQuestAnswer(value,correct));setAnswer(item);setStep('review');
  }
 }
 function next(){
  if(quest.failed){setStep('done');onSound('finish');return}
  if(index+1<deck.length){setIndex(v=>v+1);setChosen([]);setAnswer(null);locked.current=null;questionStart.current=Date.now();setBattleEvent(v=>({...v,kind:'idle'}));setStep('question');setFxReaction('idle');return}
  if(quest.stage===2){if(questBossWon(quest.stage,foe.hp,quest.hp)){setQuest(v=>finishQuest(v));onSound('boss-win');onHaptic('boss-win')}else onSound('finish');setStep('done');return}
  setStep('skill');onSound('finish');
 }
 function upgrade(skill:QuestSkill){
  if(quest.skills.includes(skill))return;
  const next=grantQuestSkill(quest,skill);setQuest(next);
  if(next.stage===2){const used=responses.map(r=>r.question.id),boss=questDeck(bank,BOSS,seed+900,used);if(boss.length!==5){setError('ボス問題が不足しています');return}const enemy=opponentForStage(2,'boss');setFoe({...enemy,hp:enemy.maxHp});setBattleEvent({seq:0,kind:'idle',damage:0});setDeck(boss);setIndex(0);setAnswer(null);setChosen([]);locked.current=null;setStep('question');setFxReaction('idle');onSound('start')}
  else setStep('route');
 }
 const currentScore=isBlitz?score:quest.score;
 return <div className="sa-root">
  <div className="sa-top"><button className="rb-back" onClick={onExit}><ArrowLeft size={18}/> ホームへ</button><strong>{isBlitz?'BLITZ 90 SEC':'QUEST RUN'}</strong></div>
  {error&&<p className="rb-error" role="alert">{error}</p>}
  {step==='route'&&<section className="sa-scene"><Swords size={37}/><h1>ルートを選ぼう</h1><p>STAGE {quest.stage+1} / 3 · HP {quest.hp}</p><div className="sa-grid">{QUEST_ROUTES[quest.stage].map(route=><button key={route.id} className="sa-card" onClick={()=>selectRoute(route)}><Shield size={26}/><strong>{route.title}</strong><span>{route.description}</span><ArrowRight size={18}/></button>)}</div></section>}
  {step==='skill'&&<section className="sa-scene"><Sparkles size={36}/><h1>スキルを選ぼう</h1><p>このランのHP・ゲームスコアだけに作用する強化です。</p><div className="sa-grid">{QUEST_SKILLS.filter(skill=>!quest.skills.includes(skill.id)).map(skill=><button key={skill.id} className="sa-card" onClick={()=>upgrade(skill.id)}><Zap size={26}/><strong>{skill.title}</strong><span>{skill.description}</span><ArrowRight size={18}/></button>)}</div></section>}
  {!isBlitz&&(step==='question'||step==='review')&&<div className="sa-play sa-quest-persistent">
   <div className="sa-hud"><strong>{quest.stage===2?'BOSS STAGE':'STAGE '+(quest.stage+1)+'/3'}</strong><span>HP {quest.hp}/100</span></div>
   <div className="sa-gauge"><span style={{width:quest.hp+'%'}}/></div>
   <div className="sa-stats"><span><Flame size={16}/> {quest.streak} COMBO</span><span>{index+1} / {deck.length}</span></div>
   <BattleStage appearance={appearance} enemyId={foe.id} enemyName={foe.name} enemyHp={foe.hp} enemyMaxHp={foe.maxHp} playerHp={quest.hp} combo={quest.streak} boss={quest.stage===2} event={battleEvent} allow3d={allow3d} variantSeed={seed+quest.stage*1001}/>
  </div>}
  {step==='question'&&current&&<section className="sa-play">{isBlitz&&impact&&<div key={impact.count} className={'sa-quick-impact '+(impact.correct?'sa-quick-correct':'sa-quick-wrong')} role="status">{impact.correct?'+'+impact.points+' PTS!':'NEXT!'} {streak>=3&&impact.correct&&<span>{streak} COMBO!</span>}</div>}{isBlitz&&<><div className="sa-hud"><strong>{isBlitz?Math.ceil(left/1000)+'秒':quest.stage===2?'BOSS STAGE':'STAGE '+(quest.stage+1)+'/3'}</strong><span>{isBlitz?score+' PTS':'HP '+quest.hp+'/100'}</span></div><div className="sa-gauge"><span style={{width:(isBlitz?left/(BLITZ_SECONDS*1000)*100:quest.hp)+'%'}}/></div><div className="sa-stats"><span><Flame size={16}/> {isBlitz?streak:quest.streak} COMBO</span><span>{index+1} / {deck.length}</span></div><div className="cs-mini-row"><div className={'cs-mini-avatar cs-mini-avatar-3d '+(impact?.correct?'cs-mini-attack':impact?'cs-mini-hurt':'')}><QuestHero3D enabled={allow3d} appearance={appearance} pose={impact?.correct?'attack':impact?'hurt':'idle'} event={{seq:fxPulse,kind:impact?.correct?'hit':impact?'hurt':'idle',damage:impact?.points??0}} view="portrait"/></div><LiveReactor mode={isBlitz?'blitz':'quest'} charge={isBlitz?streak:quest.streak} pulse={fxPulse} reaction={fxReaction}/></div></>}<article className="rb-question"><div className="rb-question-meta"><span>{current.domain}</span><span>問題ID {current.id}</span></div><div className="rb-reading-toolbar"><button className="rb-reading-toggle" type="button" onClick={()=>setReading(v=>{saveReadingGuide(!v);return !v})}><BookOpen size={16}/> {reading?'通常表示':'文ごとに読む'}</button></div><h1>{reading?splitReadingSentences(current.question).map((part,i)=><span className="rb-reading-sentence" key={i}>{part}</span>):current.question}</h1><div className="rb-question-extra"><TermsPanel question={current} compact/></div><p className="rb-answer-note">{current.answers?'複数選択：選択してから確定':'選択肢を押したら即回答'}</p><div className="rb-options">{order.map((j,i)=><button key={j} type="button" className={chosen.includes(j)?'selected':''} onClick={()=>{if(current.answers){setChosen(v=>v.includes(j)?v.filter(x=>x!==j):[...v,j]);setFxPulse(v=>v+1);setFxReaction('select');onSound('select');onHaptic('select')}else grade([j])}}><span className="rb-letter">{letters[i]}</span><span className="rb-choice-text">{current.choices[j]}</span></button>)}</div>{current.answers&&<button className="rb-start rb-submit" disabled={!chosen.length} onClick={()=>grade(chosen)}>回答を確定 <ArrowRight size={18}/></button>}</article></section>}
  {step==='review'&&answer&&<section className="sa-scene sa-feedback"><h1>{answer.correct?'NICE HIT!':'NEXT CHANCE!'}</h1><p>ランHP {quest.hp} · SCORE {quest.score} · {quest.streak} COMBO</p><div className="sa-detail"><h2>正解</h2>{(answer.question.answers??[answer.question.answer!]).map(i=><p className="sa-correct" key={i}>{answer.question.choices[i]}</p>)}<h2>なぜ？</h2><p>{expandTerms(answer.question.explanation)}</p><a href={answer.question.reference} target="_blank" rel="noopener noreferrer">AWS公式資料</a></div><button className="rb-start" onClick={next}>{quest.failed?'結果を見る':index+1===deck.length?(quest.stage===2?'攻略結果を見る':'スキル獲得へ'):'次の問題へ'} <ArrowRight size={20}/></button></section>}
  {step==='done'&&<section className="sa-scene sa-finish"><Trophy size={44}/><h1>{isBlitz?'TIME UP!':quest.cleared?'BOSS DEFEATED!':quest.failed?'PLAYER DOWN!':quest.stage===2?'BOSS SURVIVED!':'QUEST FINISHED'}</h1><div className="sa-results"><div><small>スコア</small><strong>{currentScore.toLocaleString('ja-JP')}</strong></div><div><small>正答</small><strong>{correctCount}/{responses.length}</strong></div><div><small>最高コンボ</small><strong>{isBlitz?bestCombo:quest.maxStreak}</strong></div></div>{isBlitz&&<p>自己ベスト：{Math.max(savedBest(),score).toLocaleString('ja-JP')}</p>}{!isBlitz&&<p>ラン内の敵残りHP：{foe.hp} / {foe.maxHp}　・　プレイヤー残りHP：{quest.hp} / 100</p>}<div className="sa-detail"><h2>復習する問題</h2>{missed.length===0?<p>全問正解。日を改めて復習しよう。</p>:missed.map((r,i)=><details key={i}><summary>{r.question.domain}・{r.question.id}</summary><p>{r.question.question}</p><p><strong>正解：</strong>{(r.question.answers??[r.question.answer!]).map(j=>r.question.choices[j]).join(' ／ ')}</p><p>{expandTerms(r.question.explanation)}</p></details>)}</div><p className="rb-disclaimer">ゲームスコアはAWS試験の合格予測ではありません。</p><button className="rb-start" onClick={onExit}>ホームへ戻る <ArrowRight size={20}/></button></section>}
 </div>
}

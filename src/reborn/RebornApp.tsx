import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Check,ChevronRight,Clock3,Download,Flame,Headphones,HelpCircle,Home,Menu,RotateCcw,ShieldCheck,Target,Trophy,Volume2,VolumeX,X,Zap} from 'lucide-react';
import bank from '../generated/questions.json';
import type {StudyQuestion} from '../StudyQuestionIntro.tsx';
import {TermsPanel} from '../StudyQuestionIntro.tsx';
import {readReadingGuide,saveReadingGuide,splitReadingSentences} from '../readingGuide.ts';
import {readTextScale,saveTextScale,shiftTextScale,type TextScale} from '../readability.ts';
import {expandTerms} from '../glossary.ts';
import {applyStudyAttempt,makeAttemptRunId,normalizeAttemptReceipts,type AttemptProgress,type AttemptReward,type StudyAttempt} from '../studyAttempt.ts';
import {useProgressConflict} from '../useProgressConflict.ts';
import {PROGRESS_SAVE_KEY} from '../progressSync.ts';
import {RESTORE_JOURNAL_KEY,createBackup,parseBackup,restoreBackup,backupPreview,inspectRestoreJournal,recoverInterruptedRestore,validProgress} from '../backup.ts';
import {normalizeEnemyCampaign,currentEnemy,enemyMaxHp,type EnemyCampaign} from '../enemyCampaign.ts';
import {planDailyFive} from '../dailyFive.ts';
import {dueQuestionIds} from '../studyScheduler.ts';
import {gameProfile} from '../gameProfile.ts';
import {buildDomainIntel} from '../reforgeRadar.ts';
import {AudioDirector,readAudioSettings,saveAudioSettings,type AudioSettings,type SoundEffect,type MusicScene} from '../audioDirector.ts';
import {readHapticMode,writeHapticMode,triggerHaptic,testHapticDevice,type HapticMode,type HapticEvent} from '../haptics.ts';
import {answerCelebration,burstGeometry,type Celebration} from './celebration.ts';
import MonsterArt from '../MonsterArt.tsx';
import {correctIndices,isCorrect,planRound,sessionPercent,shuffled,DOMAINS,type SessionMode,type LearningRound} from './planner.ts';

type Progress=AttemptProgress&{equippedRelic?:string;bossRecords?:unknown;expeditions?:unknown;designLab?:unknown};
type Screen='home'|'quiz'|'finish'|'insights'|'settings';
type Grade={id:string;chosen:number[];correct:boolean;reward:AttemptReward|null};
const QUESTIONS=bank as StudyQuestion[];
const EMPTY:Progress={xp:0,best:0,answered:0,correct:0,mistakes:[],domains:{},reviews:{}};
function readProgress():{value:Progress;blocked:boolean}{
 try{
  if(localStorage.getItem(RESTORE_JOURNAL_KEY)!==null)return {value:EMPTY,blocked:true};
  const raw=localStorage.getItem(PROGRESS_SAVE_KEY);
  if(raw===null)return {value:EMPTY,blocked:false};
  const parsed=JSON.parse(raw) as Partial<Progress>;
  const merged={...EMPTY,...parsed,reviews:parsed.reviews??{},domains:parsed.domains??{},mistakes:parsed.mistakes??[],attemptReceipts:normalizeAttemptReceipts(parsed.attemptReceipts)};
  if(!validProgress({...parsed,...merged}))return {value:EMPTY,blocked:true};
  return {value:merged as Progress,blocked:false};
 }catch{return {value:EMPTY,blocked:true}}
}
const fmt=(n:number)=>new Intl.NumberFormat('ja-JP').format(n);
const alpha=(n:number)=>String.fromCharCode(65+n);
const FX_KEY='cert-overdrive-reborn-fx-v1';
type FxLevel='off'|'high'|'maximum';
function readRebornAudioSettings():AudioSettings{const value=readAudioSettings();try{return localStorage.getItem('cert-overdrive-audio-v1')===null?{...value,sfxEnabled:true}:value}catch{return value}}
function readRebornHaptics():HapticMode{const value=readHapticMode();try{return localStorage.getItem('cert-overdrive-haptics-v1')===null?'overdrive':value}catch{return value}}
function readFxLevel():FxLevel{try{const value=localStorage.getItem(FX_KEY);return value==='off'||value==='high'||value==='maximum'?value:'maximum'}catch{return 'maximum'}}
function saveFxLevel(value:FxLevel){try{localStorage.setItem(FX_KEY,value)}catch{}}
function downloadBackup(){
 const json=JSON.stringify(createBackup(localStorage),null,2);
 const file=new Blob([json],{type:'application/json'});
 const url=URL.createObjectURL(file);
 const a=document.createElement('a');a.href=url;a.download='overdrive-backup-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.append(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function RebornApp(){
 const [{value:initial,blocked:initialBlocked}]=useState(readProgress);
 const [progress,setProgress]=useState<Progress>(initial);
 const {issue,readonlyRef,saveEmergency}=useProgressConflict(progress,initialBlocked);
 const [screen,setScreen]=useState<Screen>('home');
 const [round,setRound]=useState<LearningRound|null>(null);
 const [index,setIndex]=useState(0);
 const [chosen,setChosen]=useState<number[]>([]);
 const [readingGuide,setReadingGuide]=useState(readReadingGuide);
 const [textScale,setTextScale]=useState<TextScale>(readTextScale);
 const [phase,setPhase]=useState<'question'|'answer'>('question');
 const [grades,setGrades]=useState<Grade[]>([]);
 const [lastReward,setLastReward]=useState<AttemptReward|null>(null);
 const [sessionSeed,setSessionSeed]=useState(0);
 const [runId,setRunId]=useState(makeAttemptRunId);
 const [domain,setDomain]=useState<string>(DOMAINS[0]);
 const [error,setError]=useState('');
 const [showWhy,setShowWhy]=useState(false);
 const [audioSettings,setAudioSettings]=useState<AudioSettings>(readRebornAudioSettings);
 const [haptics,setHaptics]=useState<HapticMode>(readRebornHaptics);
 const [fxLevel,setFxLevel]=useState<FxLevel>(readFxLevel);
 const [celebration,setCelebration]=useState<Celebration|null>(null);
 const [fxSequence,setFxSequence]=useState(0);
 const [hapticMessage,setHapticMessage]=useState('');
 const [restorePreview,setRestorePreview]=useState<ReturnType<typeof backupPreview>|null>(null);
 const [restoreError,setRestoreError]=useState('');
 const [restoreRaw,setRestoreRaw]=useState<string|null>(null);
 const [restoreJournal,setRestoreJournal]=useState(()=>{try{return inspectRestoreJournal(localStorage)}catch{return {state:'unavailable' as const,message:'保存領域を開けません'}}});
 const [timeLeft,setTimeLeft]=useState(130*60);
 const [menuOpen,setMenuOpen]=useState(false);
 const [reduced,setReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion:reduce)').matches);
 const audioRef=useRef<AudioDirector|null>(null);
 const locked=useRef(false);
 const combo=useMemo(()=>{let n=0;for(let i=grades.length-1;i>=0&&grades[i].correct;i--)n++;return n},[grades]);
 const actualReduced=reduced||(typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const feedbackRef=useRef<HTMLDivElement|null>(null);
 const due=dueQuestionIds(progress.reviews??{},QUESTIONS.map(q=>q.id)).length;
 const daily=useMemo(()=>planDailyFive(QUESTIONS,progress.reviews,progress.mistakes,progress.answerHistory),[progress.reviews,progress.mistakes,progress.answerHistory]);
 const profile=gameProfile(progress,QUESTIONS.length);
 const enemy=normalizeEnemyCampaign(progress.enemyCampaign);
 const enemyData=currentEnemy(enemy);
 const enemyCap=enemyMaxHp(enemy);
 const intel=useMemo(()=>buildDomainIntel(QUESTIONS,progress.answerHistory,progress.reviews,progress.mistakes),[progress.answerHistory,progress.reviews,progress.mistakes]);
 const current=round?.questions[index];
 const activeExam=round?.mode==='exam';
 const answerOrder=useMemo(()=>current?shuffled(current.choices.map((_,i)=>i),sessionSeed+index*97+5):[],[current,sessionSeed,index]);
 const correctTotal=grades.filter(x=>x.correct).length;
 const canWrite=!initialBlocked&&!readonlyRef.current&&!issue;
 useEffect(()=>()=>{audioRef.current?.dispose()},[]);
 useEffect(()=>{saveAudioSettings(audioSettings);audioRef.current?.configure(audioSettings)},[audioSettings]);
 useEffect(()=>{writeHapticMode(haptics)},[haptics]);
 useEffect(()=>{saveFxLevel(fxLevel)},[fxLevel]);
 useEffect(()=>{const scene:MusicScene=screen==='quiz'?(activeExam?'exam':'mission'):screen==='finish'?'result':'home';audioRef.current?.setScene(scene)},[screen,activeExam]);
 useEffect(()=>{if(screen!=='quiz'||phase!=='answer'||activeExam)return;feedbackRef.current?.scrollIntoView({block:'start',behavior:'auto'});},[screen,phase,index,activeExam]);
 useEffect(()=>{
  if(screen!=='quiz'||!activeExam)return;
  if(timeLeft<=0){setScreen('finish');return}
  const timer=window.setInterval(()=>setTimeLeft(Math.max(0,Math.ceil((examDeadline.current-Date.now())/1000))),1000);
  return()=>window.clearInterval(timer);
 },[screen,activeExam,timeLeft<=0]);
 const examDeadline=useRef(0);
 function sound(effect:SoundEffect){
  if(!audioSettings.sfxEnabled)return;
  if(!audioRef.current)audioRef.current=new AudioDirector();
  const engine=audioRef.current;engine.configure(audioSettings);
  const scene:MusicScene=screen==='quiz'?(activeExam?'exam':'mission'):screen==='finish'?'result':'home';
  engine.setScene(scene);
  void engine.unlock().then(()=>engine.play(effect));
 }
 function changeSound(){setAudioSettings(a=>({...a,sfxEnabled:!a.sfxEnabled}))}
 function changeMusic(){
  const enabled=!audioSettings.bgmEnabled;
  if(enabled){if(!audioRef.current)audioRef.current=new AudioDirector();const engine=audioRef.current;engine.configure({...audioSettings,bgmEnabled:true});engine.setScene(screen==='quiz'?(activeExam?'exam':'mission'):screen==='finish'?'result':'home');void engine.unlock()}
  setAudioSettings(a=>({...a,bgmEnabled:enabled}));
 }
 function signal(event:HapticEvent){triggerHaptic(event,haptics,actualReduced,activeExam)}
 async function previewImport(file:File|undefined){
  setRestorePreview(null);setRestoreRaw(null);setRestoreError('');if(!file)return;
  try{if(file.size>8*1024*1024)throw new Error('ファイルが大きすぎます');const raw=await file.text();const data=parseBackup(raw);setRestorePreview(backupPreview(data));setRestoreRaw(raw)}catch(err){setRestoreError(err instanceof Error?err.message:'バックアップが不正です')}
 }
 function confirmImport(){
  if(!restoreRaw)return;
  if(!window.confirm('この端末の学習記録を、選択したバックアップの内容に置き換えます。現在のデータを先にエクスポートしましたか？'))return;
  try{restoreBackup(parseBackup(restoreRaw),localStorage);window.location.reload()}catch(err){setRestoreError(err instanceof Error?err.message:'復元に失敗しました')}
 }
 function recoverRestore(){
  try{const recovered=recoverInterruptedRestore(localStorage);if(!recovered)throw new Error('復元ジャーナルが見つかりません');window.location.reload()}catch(err){setRestoreError(err instanceof Error?err.message:'復旧に失敗しました')}
 }
 function celebrate(effect:Celebration){
  setCelebration(effect);setFxSequence(v=>v+1);
  if(!actualReduced&&fxLevel!=='off')signal(effect.haptic);
  sound(effect.sound);
 }
 function start(mode:SessionMode,selectedDomain?:string){
  if(!canWrite){setError('安全のため学習を開始できません。保存状態を確認してください。');return}
  const seed=Date.now(),plan=planRound(QUESTIONS,{reviews:progress.reviews,mistakes:progress.mistakes,answerHistory:progress.answerHistory},mode,seed,selectedDomain);
  if(!plan.questions.length){setError('この条件で出題できる問題がありません。別のモードを選んでください。');return}
  setError('');setRound(plan);setSessionSeed(seed);setRunId(makeAttemptRunId());setIndex(0);setChosen([]);setGrades([]);
  setPhase('question');setShowWhy(false);setLastReward(null);setCelebration(null);locked.current=false;setTimeLeft(130*60);
  if(mode==='exam')examDeadline.current=Date.now()+130*60*1000;
  setScreen('quiz');setMenuOpen(false);sound('start');signal('start');
 }
 function selectAnswer(id:number){
  if(phase!=='question'||locked.current||!current||!canWrite)return;
  if(current.answers){
   setChosen(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
   sound('select');signal('select');
  }else{
   // One tap = one answer. Do not read the still-stale React chosen state.
   commit([id]);
  }
 }
 function commit(answered:readonly number[]=chosen){
  if(!current||!round||!answered.length||phase!=='question'||locked.current||!canWrite)return;
  locked.current=true;
  const correct=isCorrect(current,answered);
  const streak=correct?([...grades].reverse().findIndex(x=>!x.correct)===-1?grades.length+1:Math.max(1,[...grades].reverse().findIndex(x=>!x.correct))):0;
  const event:StudyAttempt={attemptId:runId+':'+index+':'+current.id,questionId:current.id,domain:current.domain,correct,combo:streak,difficulty:current.difficulty,mode:activeExam?'exam':'daily',boss:false,at:Date.now()};
  const preview=applyStudyAttempt(progress,event);
  if(!preview.reward.credited){locked.current=false;setError('回答を保存できませんでした。他のタブとの競合を確認してください。');return}
  setProgress(p=>applyStudyAttempt(p,event).progress);
  setGrades(prev=>[...prev,{id:current.id,chosen:[...answered],correct,reward:preview.reward}]);
  setLastReward(preview.reward);setError('');
  if(activeExam){sound('select');signal('select');advance();return}
  const nextCombo=correct?combo+1:0;
  celebrate(answerCelebration({correct,combo:nextCombo,damage:preview.reward.campaign?.damage??0,defeated:Boolean(preview.reward.campaign?.defeated),rewardedXp:preview.reward.totalXp}));
  setPhase('answer');setShowWhy(false);
 }
 function advance(){
  if(!round)return;
  if(index+1>=round.questions.length){setScreen('finish');sound('finish');return}
  setIndex(v=>v+1);setChosen([]);setPhase('question');setShowWhy(false);setLastReward(null);setCelebration(null);locked.current=false;
 }
 function quit(){setScreen('home');setRound(null);setError('');setCelebration(null);locked.current=false}
 function nav(next:Screen){setScreen(next);setMenuOpen(false);setError('')}
 function toggleReading(){setReadingGuide(value=>{saveReadingGuide(!value);return !value})}
 function resizeText(direction:-1|1){setTextScale(value=>{const next=shiftTextScale(value,direction);saveTextScale(next);return next})}
 const recallDueText=daily.eligibleDue>0?'復習する問題あり':'新しい問題からスタート';
 return <div className={'reborn rb-reading-'+textScale+' '+(actualReduced?'is-reduced':'')+' rb-fx-'+(actualReduced?'off':fxLevel)}>
  <header className="rb-header">
   <button className="rb-logo" type="button" onClick={quit} aria-label="ホームへ"><span className="rb-mark"><Zap size={20} fill="currentColor"/></span><span><strong>OVERDRIVE</strong><small>AWS SAA 学習ゲーム</small></span></button>
   <div className="rb-header-right"><span className="rb-level">LV {profile.level}</span><button className="rb-icon" type="button" onClick={changeSound} aria-label={audioSettings.sfxEnabled?'効果音をオフ':'効果音をオン'}>{audioSettings.sfxEnabled?<Volume2 size={21}/>:<VolumeX size={21}/>}</button><button className="rb-icon" type="button" onClick={changeMusic} aria-label={audioSettings.bgmEnabled?'BGMをオフ':'BGMをオン'} aria-pressed={audioSettings.bgmEnabled}><Headphones size={20}/></button><button className="rb-icon rb-hamburger" type="button" onClick={()=>setMenuOpen(v=>!v)} aria-label="メニュー" aria-expanded={menuOpen}>{menuOpen?<X size={22}/>:<Menu size={22}/>}</button></div>
  </header>
  {menuOpen&&<nav className="rb-menu" aria-label="追加メニュー"><button onClick={()=>nav('home')}>ホーム</button><button onClick={()=>nav('insights')}>成長の記録</button><button onClick={()=>nav('settings')}>設定・バックアップ</button></nav>}
  <main className="rb-main">
   {(initialBlocked||issue)&&<section className="rb-alert" role="alert"><h2>学習記録の保存を保護しています</h2><p>{issue?.message??'復旧中のデータ、または読み込めない保存データが検出されました。既存記録を上書きしません。'}</p><button onClick={saveEmergency}>確認用の緊急退避JSONを保存</button><button onClick={()=>nav('settings')}>復旧とバックアップを開く</button></section>}
   {error&&<p className="rb-error" role="alert">{error}</p>}
   {screen==='home'&&<div className="rb-page">
    <section className="rb-welcome"><div className="rb-eyebrow"><span className="rb-dot"/> YOUR NEXT MISSION</div><h1>今日も、<br/><em>ひとつ強くなる。</em></h1><p>問題を解いて、理由を理解する。続きはまた明日でも大丈夫。</p><div className="rb-primary-card"><div className="rb-primary-label"><Clock3 size={17}/> まずは5問 · 約5分</div><h2>今日のクエスト</h2><p>{recallDueText}。{daily.questions.length}問を順に攻略します。</p><div className="rb-quest-metrics"><span><strong>{daily.eligibleDue}</strong> 復習期限</span><span><strong>{progress.mistakes.length}</strong> 苦手</span><span><strong>{QUESTIONS.length}</strong> 総問題</span></div><button className="rb-start" onClick={()=>start('daily')} disabled={!canWrite||daily.questions.length===0}>学習を始める <ArrowRight size={20}/></button></div></section>
    <section className="rb-summary" aria-label="現在の進捗"><div><span>累計XP</span><strong>{fmt(progress.xp)}</strong></div><div><span>解答した回数</span><strong>{fmt(progress.answered)}</strong></div><div><span>正答率（履歴）</span><strong>{sessionPercent(progress.correct,progress.answered)}<small>%</small></strong></div></section>
    <section className="rb-modes"><div className="rb-section-heading"><span>CHOOSE YOUR PATH</span><h2>次にやること</h2></div><button className="rb-mode" disabled={!canWrite||progress.mistakes.length===0} onClick={()=>start('weak')}><span className="rb-mode-icon coral"><Target size={25}/></span><span><strong>苦手を攻略する</strong><small>間違えた問題から最大5問</small></span><ChevronRight size={20}/></button><button className="rb-mode" disabled={!canWrite} onClick={()=>start('mix')}><span className="rb-mode-icon blue"><BookOpen size={25}/></span><span><strong>ランダム演習</strong><small>4分野から5問に挑戦</small></span><ChevronRight size={20}/></button><button className="rb-mode" disabled={!canWrite} onClick={()=>start('exam')}><span className="rb-mode-icon amber"><Clock3 size={25}/></span><span><strong>65問の模擬試験</strong><small>130分 · 試験中は正解を表示しない</small></span><ChevronRight size={20}/></button><div className="rb-domain-block"><div className="rb-domain-label">分野を選んで10問</div><div className="rb-domains">{DOMAINS.map(d=><button key={d} className={domain===d?'is-active':''} aria-pressed={domain===d} onClick={()=>setDomain(d)}>{d}</button>)}</div><button className="rb-secondary" onClick={()=>start('domain',domain)} disabled={!canWrite}>この分野を学習する <ArrowRight size={17}/></button></div></section>
    <section className="rb-enemy-card"><div><small>LIVE CAMPAIGN</small><strong>{enemyData.name}</strong><p>現在の敵 · 残りHP {enemy.hp} / {enemyCap}</p></div><div className="rb-enemy-picture"><MonsterArt id={enemyData.id} hpRatio={enemyCap?enemy.hp/enemyCap:0} small/></div></section>
    <section className="rb-bottom-actions"><button onClick={()=>nav('insights')}><Trophy size={20}/> 成長の記録を見る <ChevronRight size={18}/></button><button onClick={()=>nav('settings')}><ShieldCheck size={20}/> バックアップ・詳細 <ChevronRight size={18}/></button></section>
   </div>}
   {screen==='quiz'&&round&&current&&<div className="rb-quiz">
    <div className="rb-quiz-top"><button className="rb-back" type="button" onClick={quit}><ArrowLeft size={18}/> 終了してホームへ</button>{activeExam&&<span className="rb-clock"><Clock3 size={16}/> {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</span>}</div>
    <div className="rb-progress-head"><span>{activeExam?'模擬試験':round.mode==='daily'?'今日のクエスト':round.mode==='weak'?'苦手攻略':round.mode==='domain'?'分野別演習':'ランダム演習'}</span><div className="rb-combo-hud"><span className={combo>=2?'is-hot':''}><Flame size={16}/> {activeExam?'EXAM':combo>=2?combo+' COMBO':'READY'}</span><strong>{index+1} / {round.questions.length}</strong></div></div>
    <div className="rb-track" role="progressbar" aria-label="進行度" aria-valuemin={0} aria-valuemax={round.questions.length} aria-valuenow={index+(phase==='answer'?1:0)}><span style={{width:(index+(phase==='answer'?1:0))/round.questions.length*100+'%'}}/></div>
    <article className="rb-question" key={current.id}>
     <div className="rb-question-meta"><span>{current.domain}</span><span>問題ID {current.id}</span></div>
     <div className="rb-reading-toolbar" role="group" aria-label="問題文を読みやすくする"><button type="button" className="rb-reading-toggle" aria-pressed={readingGuide} onClick={toggleReading}><BookOpen size={16}/> {readingGuide?'通常表示':'文ごとに読む'}</button><span className="rb-font-controls"><button type="button" aria-label="文字を小さくする" disabled={textScale==='compact'} onClick={()=>resizeText(-1)}>A−</button><button type="button" aria-label="文字を大きくする" disabled={textScale==='extra'} onClick={()=>resizeText(1)}>A＋</button></span></div>
     <h1 className={readingGuide?'rb-sentence-mode':undefined}>{readingGuide?<span className="rb-reading-sentences">{splitReadingSentences(current.question).map((part,i)=><span key={i} className="rb-reading-sentence">{part}</span>)}</span>:current.question}</h1>
     <div className="rb-question-extra"><TermsPanel question={current}/></div>
     {phase==='question'&&<><p className="rb-answer-note">{current.answers?'複数選択：答えを選んでから確定してください。':activeExam?'答えをタップすると次の問題に進みます。':'答えをタップすると、すぐに正解と解説が出ます。'}</p><div className="rb-options" role="group" aria-label="解答の選択肢">{answerOrder.map((original,pos)=><button key={original} type="button" className={chosen.includes(original)?'selected':''} aria-pressed={chosen.includes(original)} onClick={()=>selectAnswer(original)} disabled={!canWrite}><span className="rb-letter">{alpha(pos)}</span><span className="rb-choice-text">{readingGuide?<span className="rb-choice-sentences">{splitReadingSentences(current.choices[original]).map((part,i)=><span key={i}>{part}</span>)}</span>:current.choices[original]}</span><span className="rb-select-sign">{chosen.includes(original)?<Check size={20}/>:<span/>}</span></button>)}</div>{current.answers&&<button className="rb-start rb-submit" disabled={!chosen.length||!canWrite} onClick={()=>commit()}>{activeExam?'選択した答えを確定して次へ':'選択した答えを確定する'} <ArrowRight size={18}/></button>}</>}
     {phase==='answer'&&!activeExam&&<div className={'rb-feedback '+(celebration?'rb-impact-'+celebration.kind:'')} ref={feedbackRef} role="status" tabIndex={-1}>{celebration&&<div key={fxSequence} className={'rb-fx-stage rb-fx-stage-'+celebration.kind} aria-hidden="true"><div className="rb-fx-flash"/><div className="rb-fx-ring"/><div className="rb-fx-ring rb-fx-ring-second"/>{burstGeometry(fxLevel==='maximum'?celebration.particles:Math.ceil(celebration.particles/2),fxSequence).map((part,i)=><span className="rb-fx-particle" key={i} style={{'--dx':part.x+'px','--dy':part.y+'px','--delay':part.delay+'ms','--rot':part.rotation+'deg','--size':part.size+'px'} as React.CSSProperties}/>)}</div>}{celebration&&<div key={'title-'+fxSequence} className="rb-impact-title"><Zap size={20}/><strong>{celebration.title}</strong><span>{celebration.subtitle}</span></div>}<div className={'rb-verdict '+(grades[grades.length-1]?.correct?'correct':'wrong')}><span>{grades[grades.length-1]?.correct?'正解！':'ここを覚えよう'}</span><strong>{grades[grades.length-1]?.correct?'GOOD!':'REVIEW'}</strong></div><div className="rb-reward"><span>+{lastReward?.totalXp??0} XP</span><span>敵へのダメージ {lastReward?.campaign?.damage??0}</span></div>{lastReward?.campaign?.defeated&&<p className="rb-defeat"><Flame size={18}/> {lastReward.campaign.defeated.name} を討伐！</p>}<section className="rb-answer-detail"><h2>正解はこちら</h2>{correctIndices(current).map(i=><div className="rb-correct-choice" key={i}><span>{alpha(answerOrder.indexOf(i))}</span><p>{current.choices[i]}</p></div>)}<h2>なぜこれが正解？</h2><p className={readingGuide?'rb-explanation-sentences':undefined}>{readingGuide?splitReadingSentences(expandTerms(current.explanation)).map((part,i)=><span key={i}>{part}</span>):expandTerms(current.explanation)}</p>{current.distractorReasons?.length===current.choices.length&&<div className="rb-comparison"><button className="rb-secondary" aria-expanded={showWhy} onClick={()=>setShowWhy(v=>!v)}>{showWhy?'比較を閉じる':'他の選択肢が違う理由を確認する'}</button>{showWhy&&answerOrder.map(i=><div key={i}><strong>{alpha(answerOrder.indexOf(i))}. {current.choices[i]}</strong><p>{expandTerms(current.distractorReasons![i])}</p></div>)}</div>}<a href={current.reference} target="_blank" rel="noopener noreferrer">AWS公式資料で確認する</a></section><button className="rb-start rb-submit" onClick={advance}>{index+1===round.questions.length?'結果を見る':'次の問題へ'} <ArrowRight size={20}/></button></div>}
    </article>
   </div>}
   {screen==='finish'&&round&&<div className="rb-finish"><div className="rb-finish-fireworks" aria-hidden="true">{burstGeometry(fxLevel==='maximum'?32:16,7).map((part,i)=><span className="rb-fx-particle" key={i} style={{'--dx':part.x+'px','--dy':part.y+'px','--delay':part.delay+'ms','--rot':part.rotation+'deg','--size':part.size+'px'} as React.CSSProperties}/>)}</div><div className="rb-finish-symbol"><Trophy size={40}/></div><span className="rb-eyebrow">MISSION COMPLETE</span><h1>{activeExam?'模擬試験終了':'今日も一歩、前進。'}</h1><p>正解できた問題と、これから覚える問題が分かりました。</p><div className="rb-result-score"><strong>{correctTotal}<small> / {round.questions.length}</small></strong><span>正解 · {sessionPercent(correctTotal,round.questions.length)}%</span></div>{!activeExam&&<div className="rb-finish-stats"><span>獲得XP <strong>+{fmt(grades.reduce((sum,x)=>sum+(x.reward?.totalXp??0),0))}</strong></span><span>復習したい問題 <strong>{grades.filter(g=>!g.correct).length}</strong></span></div>}<div className="rb-finish-review"><h2>復習のポイント</h2>{grades.filter(g=>!g.correct).length===0?<p>全問正解。翌日以降に思い出せるか確かめましょう。</p>:grades.filter(g=>!g.correct).map(g=>{const q=round.questions.find(x=>x.id===g.id)!;return <details key={g.id}><summary>{q.domain} · {q.id} <ChevronRight size={16}/></summary><p>{q.question}</p><p><strong>正解：</strong>{correctIndices(q).map(i=>q.choices[i]).join(' ／ ')}</p><p>{expandTerms(q.explanation)}</p><a href={q.reference} target="_blank" rel="noopener noreferrer">公式資料を見る</a></details>})}</div>{activeExam&&<p className="rb-disclaimer">非公式の練習試験です。正答率はAWS本試験の換算スコア・合格予測ではありません。新画面の模試途中経過は保存されません。</p>}<button className="rb-start" onClick={quit}>今日はここで終了 <Check size={20}/></button><button className="rb-secondary" onClick={()=>start(round.mode,round.mode==='domain'?domain:undefined)}>別の問題にも挑戦</button></div>}
   {screen==='insights'&&<div className="rb-simple-page"><button className="rb-back" onClick={()=>nav('home')}><ArrowLeft size={18}/> ホームへ</button><div className="rb-section-heading"><span>YOUR GROWTH</span><h1>成長の記録</h1><p>保存済みの学習結果から計算しています。XPは習得率を意味しません。</p></div><div className="rb-summary rb-insights-total"><div><span>累計XP</span><strong>{fmt(progress.xp)}</strong></div><div><span>正解した回数</span><strong>{fmt(progress.correct)}</strong></div><div><span>次の復習</span><strong>{fmt(due)}<small>問</small></strong></div></div><h2 className="rb-subtitle">4分野の状況</h2><div className="rb-intel">{intel.map(item=><div key={item.domain} className="rb-intel-item"><div><strong>{item.domain}</strong><small>{item.hasHistory?'履歴内で観測 '+item.observed+' / '+item.available+' 問':'回答ログ未観測'}</small></div><div className="rb-meter"><span style={{width:(item.available?item.observed/item.available*100:0)+'%'}}/></div><p>期限到来 {item.due}問 · 苦手 {item.weak}問 · 別日復習成功 {item.hasHistory?item.delayedRecall+'問':'未観測'}</p></div>)}</div><p className="rb-disclaimer">ログのない過去の学習を推測していません。定着や合格確率を示すものではありません。</p></div>}
   {screen==='settings'&&<div className="rb-simple-page"><button className="rb-back" onClick={()=>nav('home')}><ArrowLeft size={18}/> ホームへ</button><div className="rb-section-heading"><span>SAFE & SIMPLE</span><h1>設定とデータ</h1></div><section className="rb-setting-card"><h2>ドパガキ演出設定</h2><label className="rb-switch"><span><Headphones size={19}/> 効果音（正解・連続正解・討伐）</span><input type="checkbox" checked={audioSettings.sfxEnabled} onChange={changeSound}/></label><label className="rb-switch"><span><Headphones size={19}/> BGM（ホーム・学習・結果）</span><input type="checkbox" checked={audioSettings.bgmEnabled} onChange={changeMusic}/></label><label className="rb-switch"><span><Zap size={19}/> 動きを少なくする</span><input type="checkbox" checked={reduced} onChange={e=>setReduced(e.target.checked)}/></label><p className="rb-setting-label">画面エフェクト</p><div className="rb-option-group" role="group" aria-label="画面エフェクトの強さ">{([['off','OFF'],['high','HIGH'],['maximum','MAXIMUM']] as const).map(([value,label])=><button type="button" key={value} className={fxLevel===value?'active':''} aria-pressed={fxLevel===value} onClick={()=>setFxLevel(value)}>{label}</button>)}</div><p className="rb-setting-label">振動強度</p><div className="rb-option-group" role="group" aria-label="振動の強さ">{([['off','OFF'],['normal','NORMAL'],['overdrive','OVERDRIVE']] as const).map(([value,label])=><button type="button" key={value} className={haptics===value?'active':''} aria-pressed={haptics===value} onClick={()=>setHaptics(value)}>{label}</button>)}</div><button className="rb-secondary rb-test-haptic" onClick={()=>{const result=testHapticDevice(haptics,actualReduced,'pattern');setHapticMessage(result.message)}}>振動を試す</button>{hapticMessage&&<p role="status">{hapticMessage}</p>}<p className="rb-disclaimer">端末やブラウザにより音・振動が再生できない場合があります。動き軽減中は光と振動を抑えます。</p></section><section className="rb-setting-card"><h2>バックアップ</h2><p>学習記録はこの端末内にあります。定期的なJSON保存を推奨します。</p><button className="rb-secondary" onClick={downloadBackup}><Download size={19}/> データを保存する</button><div className="rb-restore"><label htmlFor="rb-backup-import">バックアップJSONを読み込む</label><input id="rb-backup-import" type="file" accept="application/json,.json" onChange={e=>{void previewImport(e.target.files?.[0])}}/>{restorePreview&&<div className="rb-restore-preview"><strong>復元内容を確認</strong><p>保存日：{restorePreview.date}<br/>XP：{restorePreview.xp} ／ 解答：{restorePreview.answered}問 ／ 正解：{restorePreview.correct}問</p><button className="rb-secondary" type="button" onClick={confirmImport}>内容を確認して復元する</button></div>}{restoreJournal.state==='recoverable'&&<button className="rb-secondary" type="button" onClick={recoverRestore}>中断された復元を元に戻す</button>}{restoreJournal.state==='invalid'&&<p role="alert">復元記録が破損しています。上書きせずに記録の退避をしてください。</p>}{restoreError&&<p role="alert">{restoreError}</p>}</div></section><section className="rb-setting-card"><h2>AWS試験情報</h2><p>模擬試験はホームから開始できます。既存の保存済み学習記録は削除されません。</p><a href="https://docs.aws.amazon.com/ja_jp/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html" target="_blank" rel="noopener noreferrer">AWS公式SAA試験ガイド <ArrowRight size={16}/></a></section></div>}
  </main>
  {screen!=='quiz'&&<nav className="rb-bottom-nav" aria-label="メインナビ"><button className={screen==='home'?'active':''} aria-current={screen==='home'?'page':undefined} onClick={()=>nav('home')}><Home size={21}/><span>ホーム</span></button><button className={screen==='insights'?'active':''} aria-current={screen==='insights'?'page':undefined} onClick={()=>nav('insights')}><Trophy size={21}/><span>成長</span></button><button className={screen==='settings'?'active':''} aria-current={screen==='settings'?'page':undefined} onClick={()=>nav('settings')}><ShieldCheck size={21}/><span>設定</span></button></nav>}
 </div>;
}

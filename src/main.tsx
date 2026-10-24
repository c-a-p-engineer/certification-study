import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Zap, Trophy, RotateCcw, Volume2, VolumeX, BookOpen, ArrowRight, Flame, Menu, ChevronDown } from 'lucide-react';
import StudyQuestionIntro,{TermsPanel,type StudyQuestion} from './StudyQuestionIntro';
import {readReadingGuide,saveReadingGuide} from './readingGuide';
import QuizAnswerControls from './QuizAnswerControls';
import StudyAnswerFeedback from './StudyAnswerFeedback';
import {useQuizSessionState} from './useQuizSessionState';
import HomeMasteryCoverage from './HomeMasteryCoverage';
import HomeProgressSummary from './HomeProgressSummary';
import ResultOverview from './ResultOverview';
import QuizCombatStatus from './QuizCombatStatus';
import './style.css';
import './readability.css';
import './quizDensity.css';
import './feedbackEffects.css';
import questionBank from './generated/questions.json';
import {rateReview,dueQuestionIds,reviewCounts,type ReviewMap} from './studyScheduler';
import {expandTerms} from './glossary';
import {readMissionSave,writeMissionSave,clearMissionSave,restoredMissionIsValid,type MissionSave} from './missionSave';
import {TOPICS,topicFor,masteryByTopic} from './mastery';
import {AudioDirector,readAudioSettings,saveAudioSettings,type AudioSettings,type MusicScene,type SoundEffect} from './audioDirector';
import {gameProfile,RANKS} from './gameProfile';
import {selectVaried,isScenarioQuestion,readRecentQuestions,rememberQuestionSelection} from './questionSelection';
import {adaptiveReasons} from './adaptiveQuest.ts';
import {planSmartQuest,readSmartProfile,writeSmartProfile,type SmartProfile} from './smartQuest.ts';
import SmartQuestBoard from './SmartQuestBoard';
import QuestionFeedback from './QuestionFeedback';
import ExamReviewPanel from './ExamReviewPanel';
import GrowthDashboard from './GrowthDashboard';
import LearningInsights from './LearningInsights';
import OfflineStatus from './OfflineStatus';
import RetentionQuestBoard from './RetentionQuestBoard';
import DailyFiveBoard,{DailyFiveFinish} from './DailyFiveBoard';
import {planDailyFive,summarizeDailyFive,type DailyFocusType} from './dailyFive.ts';
import ExpeditionBoard from './ExpeditionBoard';
import ExpeditionJourneyHUD from './ExpeditionJourneyHUD';
import DesignSimulator from './DesignSimulator';
import {EXPEDITIONS,planExpedition,normalizeExpeditions,finishExpedition,type ExpeditionId,type ExpeditionProgress,type ExpeditionResult} from './expeditions.ts';
import {eligibleForDelayedRecall} from './retentionQuest.ts';
import {recordDesignCompletion,recordDesignRecall,type DesignProgress} from './designSimulator.ts';
import './nextPhase.css';
import './homeHub.css';
import './readingGuide.css';
import {planRetentionQuest,recordDelayedRecallReward,normalizeRecallRewards,type RecallRewardState} from './retentionQuest.ts';
import {recoverInterruptedRestore,RESTORE_JOURNAL_KEY} from './backup.ts';
import {useProgressConflict} from './useProgressConflict.ts';
import {type AnswerHistory} from './growthAnalytics.ts';
import {applyStudyAttempt,gradeAnswer,makeAttemptRunId,normalizeAttemptReceipts,dailyQuestUniqueCount,type AttemptProgress,type StudyAttempt} from './studyAttempt.ts';
import {registerOffline,watchOfflineUpdates,applyOfflineUpdate} from './offline.ts';
import {earnedTitles,titleStats,validEquippedTitle,readEquippedTitle,saveEquippedTitle} from './titleSystem';
import ActivityTimeline from './ActivityTimeline';
import DailyContractBoard from './DailyContractBoard';
import BossBoard from './BossBoard';
import MonsterArt from './MonsterArt';
import EnemyCampaignPanel from './EnemyCampaignPanel';
import {ENEMIES,normalizeEnemyCampaign,restartCampaign,type EnemyCampaign,type CampaignHit} from './enemyCampaign.ts';
import BossBattleHUD from './BossBattleHUD';
import CompactQuizHUD from './CompactQuizHUD';
import SkillTreeBoard from './SkillTreeBoard';
import RelicVault from './RelicVault';
import {BOSSES,isBossDomain,bossOutcome,recordBossVictory,type BossDomain,type BossRecords,type BossGrade} from './bossCampaign.ts';
import {buildSkillTree} from './skillTree.ts';
import {relicCollection,validEquippedRelic} from './relicSystem.ts';
import {todayContracts,claimContract,type ContractId,type DailyContracts} from './dailyContracts';
import {localDateKey,migrateActivity,type ActivityHistory} from './studyHistory';
import GameMenu from './GameMenu';
import {readHapticMode,writeHapticMode,triggerHaptic,testHapticDevice,type HapticEvent,type HapticMode} from './haptics';
import {readTextScale,saveTextScale,textScaleClass,shiftTextScale,TEXT_SCALES,type TextScale} from './readability';
import {readQuizLayout,saveQuizLayout,type QuizLayout} from './quizLayout';
import {missionGrade,comboMilestone} from './missionGrade';
import {readVisualPower,saveVisualPower,type VisualPower} from './visualPower';

type Question = StudyQuestion;
const questions: Question[] = questionBank;
const questionById=new Map(questions.map(q=>[q.id,q]));
const correctAnswers=(question:Question):number[]=>question.answers??[question.answer!];
const makeChatGPTPrompt=(question:Question,selectedAnswers?:number[]):string=>{
 const options=question.choices.map((choice,i)=>`${'ABCDEFGH'[i]}. ${choice}`).join('\n');
 const right=correctAnswers(question).map(i=>`${'ABCDEFGH'[i]}. ${question.choices[i]}`).join(' / ');
 const mine=selectedAnswers?.length?selectedAnswers.map(i=>`${'ABCDEFGH'[i]}. ${question.choices[i]}`).join(' / '):'未回答・指定なし';
 return ['AWS Certified Solutions Architect - Associate（SAA-C03）の学習を手伝ってください。以下は非公式の練習問題です。','まずAWS公式ドキュメントを優先して正確性を検証し、古い情報や曖昧な前提があれば明示してください。正解の根拠に加え、各不正解選択肢がなぜ要件を満たさないか、比較して説明してください。最後に類題を1問作り、私が答えるまで正解を伏せてください。','','分野: '+question.domain,'問題ID: '+question.id,'問題: '+question.question,'選択肢:\n'+options,'私の回答: '+mine,'教材の正答: '+right,'教材の解説: '+question.explanation,'参照: '+question.reference].join('\n');
};

function examPool(seen:ReadonlySet<string>,recent:ReadonlySet<string>):Question[]{const quotas:Record<string,number>={'セキュリティ':20,'耐障害性':17,'パフォーマンス':15,'コスト最適化':13};return shuffle(Object.entries(quotas).flatMap(([d,n])=>{const domainPool=questions.filter(q=>q.domain===d);const multi=selectVaried(domainPool.filter(q=>q.answers&&q.choices.length>=5),2,seen,recent);const single=selectVaried(domainPool.filter(q=>!q.answers),n-multi.length,seen,recent);return [...multi,...single]}))}
function shuffle<T>(items:T[]):T[]{const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}const key='certification-overdrive-progress-v1';
type Progress=AttemptProgress&{daily?:{date:string;answered:number;correct:number;claimed?:boolean};activity?:ActivityHistory;dailyContracts?:DailyContracts;bossRecords?:BossRecords;equippedRelic?:string;enemyCampaign?:EnemyCampaign;answerHistory?:AnswerHistory;expeditions?:ExpeditionProgress;designLab?:DesignProgress};
const examSaveKey='cert-overdrive-exam-save-v1';
type ExamSave={runId?:string;ids:string[];index:number;selected:number|null;multiChoices:number[];choiceOrder:number[];answers:Record<string,number[]>;session:{correct:number;total:number};deadline:number};
function getExamSave():ExamSave|null{try{const x=JSON.parse(localStorage.getItem(examSaveKey)||'null');return x&&Array.isArray(x.ids)&&Number.isFinite(x.deadline)?x:null}catch{return null}}
const localDay=()=>localDateKey(new Date());
const initial:Progress={xp:0,best:0,answered:0,correct:0,mistakes:[],domains:{},reviews:{}};
function load():Progress{try{recoverInterruptedRestore(localStorage)}catch{/* keep existing data and preserve the journal for manual recovery */}try{const old={...initial,...JSON.parse(localStorage.getItem(key)||'{}')};return {...old,activity:migrateActivity(old),attemptReceipts:normalizeAttemptReceipts(old.attemptReceipts),enemyCampaign:normalizeEnemyCampaign(old.enemyCampaign)}}catch{return {...initial,activity:{}}}}
function App(){
 const [progress,setProgress]=useState<Progress>(load);
 const [restoreBlocked]=useState(()=>{try{return localStorage.getItem(RESTORE_JOURNAL_KEY)!==null}catch{return true}});
 const {issue:syncIssue,readonlyRef:syncBlocked,saveEmergency:saveConflictSnapshot,snapshotMessage}=useProgressConflict(progress,restoreBlocked);
 const [equippedTitle,setEquippedTitle]=useState(readEquippedTitle);
 const profile=gameProfile(progress,questions.length);
 const skillNodes=useMemo(()=>buildSkillTree(questions,progress.reviews||{}),[progress.reviews]);
 const masteryMap=useMemo(()=>masteryByTopic(questions,progress.reviews||{}),[progress.reviews]);
 const enemyCampaign=normalizeEnemyCampaign(progress.enemyCampaign);
 const relics=relicCollection(progress.bossRecords,skillNodes);
 const equippedRelic=validEquippedRelic(progress.equippedRelic,relics);
 const titleCollection=earnedTitles(titleStats(progress,profile.activeDays,profile.currentStreak));
 const validTitleId=validEquippedTitle(equippedTitle,titleCollection);
 const displayTitle=titleCollection.find(t=>t.id===validTitleId)?.name??'雲を見上げる者';
 const {index,setIndex,selected,setSelected,multiChoices,setMultiChoices,choiceOrder,setChoiceOrder,combo,setCombo,mode,setMode,session,setSession,sessionAnswers,setSessionAnswers,review,setReview,domain,setDomain,missionLength,setMissionLength,studyMode,setStudyMode,recallFirst,setRecallFirst,showChoices,setShowChoices,reflection,setReflection,examMode,setExamMode,bossMode,setBossMode,bossDomain,setBossDomain,skillFocus,setSkillFocus,bossReport,setBossReport,finishing,caseMode,setCaseMode,adaptiveMode,setAdaptiveMode,retentionMode,setRetentionMode,dailyFocus,setDailyFocus,dailyTypes,setDailyTypes,retentionBonus,setRetentionBonus,expeditionMode,setExpeditionMode,expeditionProof,setExpeditionProof,expeditionResult,setExpeditionResult}=useQuizSessionState(()=>shuffle(Array.from({length:questions[0].choices.length},(_,i)=>i)));
 const practiceGrade=missionGrade(session.correct,session.total);
 const [smartProfile,setSmartProfile]=useState<SmartProfile>(readSmartProfile);
 const [smartWhy,setSmartWhy]=useState<Record<string,string>>({});
 const [updateAvailable,setUpdateAvailable]=useState(false);
 const questionRef=useRef<HTMLDivElement|null>(null);
 const answerLockRef=useRef(false);
 const [attemptRunId,setAttemptRunId]=useState(makeAttemptRunId);
 const [timeLeft,setTimeLeft]=useState(130*60);
 const [examDeadline,setExamDeadline]=useState(0);
 const [examSave,setExamSave]=useState<ExamSave|null>(getExamSave);
 const [missionSave,setMissionSave]=useState<MissionSave|null>(readMissionSave);
 const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [audioSettings,setAudioSettings]=useState<AudioSettings>(readAudioSettings);
 const [menuOpen,setMenuOpen]=useState(false);
 const [menuTab,setMenuTab]=useState<'status'|'titles'|'achievements'|'settings'>('status');
 const menuCloseRef=useRef<HTMLButtonElement|null>(null);
 const [hapticMode,setHapticMode]=useState<HapticMode>(readHapticMode);
 const [textScale,setTextScale]=useState<TextScale>(readTextScale);
 const [quizLayout,setQuizLayout]=useState<QuizLayout>(readQuizLayout);
 const [readingGuide,setReadingGuide]=useState(readReadingGuide);
 const [visualPower,setVisualPower]=useState<VisualPower>(readVisualPower);
 const [earnedXP,setEarnedXP]=useState(0);
 const [campaignHit,setCampaignHit]=useState<CampaignHit|null>(null);
 const [newTitleIds,setNewTitleIds]=useState<string[]>([]);
 const [newRelicIds,setNewRelicIds]=useState<string[]>([]);
 const observedRelics=useRef<Set<string>|null>(null);
 const observedTitles=useRef<Set<string>|null>(null);
 const audioRef=useRef<AudioDirector|null>(null);
 const [sceneEffect,setSceneEffect]=useState<{type:string;id:number}|null>(null);
 const effectCounter=useRef(0);
 const [burst,setBurst]=useState(0);
 const [rankNotice,setRankNotice]=useState('');
 const [deferredRankNotice,setDeferredRankNotice]=useState('');
 const previousRank=useRef(profile.rank);
 const [pool,setPool]=useState<Question[]>(questions);
 const q=pool[index];
 const musicScene=():MusicScene=>mode==='result'?'result':mode==='home'?'home':bossMode?'boss':examMode?'exam':studyMode==='due'?'recall':'mission';
 function getAudio():AudioDirector{if(!audioRef.current)audioRef.current=new AudioDirector();return audioRef.current}
 function playCue(effect:SoundEffect,scene?:MusicScene){if(!audioSettings.sfxEnabled&&!audioSettings.bgmEnabled)return;const engine=getAudio();engine.configure(audioSettings);void engine.unlock().then(()=>{engine.setScene(scene??musicScene());engine.play(effect)})}
 function setAudio(patch:Partial<AudioSettings>){const updated={...audioSettings,...patch};setAudioSettings(updated);const engine=getAudio();engine.configure(updated);if(updated.bgmEnabled||updated.sfxEnabled){void engine.unlock().then(()=>engine.setScene(musicScene()))}}
 function toggleAudio(){const enabled=!audioSettings.bgmEnabled&&!audioSettings.sfxEnabled;setAudio({bgmEnabled:enabled,sfxEnabled:enabled})}
 function haptic(event:HapticEvent,exam=examMode){triggerHaptic(event,hapticMode,reduced,exam)}
 function changeHaptics(value:HapticMode){setHapticMode(value);writeHapticMode(value);if(value!=='off')triggerHaptic('select',value,reduced)}
 function changeTextScale(value:TextScale){setTextScale(value);saveTextScale(value)}
 function changeQuizLayout(value:QuizLayout){setQuizLayout(value);saveQuizLayout(value)}
 function toggleReadingGuide(){setReadingGuide(previous=>{const next=!previous;saveReadingGuide(next);return next})}
 function changeVisualPower(value:VisualPower){setVisualPower(value);saveVisualPower(value)}
 function changeSmartProfile(value:SmartProfile){setSmartProfile(value);writeSmartProfile(value)}
 function equipTitle(id:string){if(!titleCollection.some(t=>t.id===id&&t.unlocked))return;saveEquippedTitle(id);setEquippedTitle(id);haptic('reward',false);playCue('reward')}
 function equipRelic(id:string){if(!relics.some(x=>x.id===id&&x.unlocked))return;setProgress(p=>({...p,equippedRelic:id}));haptic('reward',false);playCue('reward')}
 function showMenu(tab:'status'|'titles'|'achievements'|'settings'='status'){setMenuTab(tab);setMenuOpen(true)}
 useEffect(()=>{if(!menuOpen)return;const previouslyFocused=document.activeElement as HTMLElement|null;menuCloseRef.current?.focus();const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setMenuOpen(false);if(event.key==='Tab'){
  const focusable=Array.from(document.querySelectorAll<HTMLElement>('.game-menu-drawer button:not([disabled]),.game-menu-drawer input:not([disabled])'));
  const first=focusable[0],last=focusable[focusable.length-1];if(!first||!last)return;
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 }};document.addEventListener('keydown',onKey);return()=>{document.removeEventListener('keydown',onKey);previouslyFocused?.focus()}},[menuOpen]);

 function pulse(type:string){if(reduced)return;effectCounter.current++;setSceneEffect({type,id:effectCounter.current})}
 useEffect(()=>{saveAudioSettings(audioSettings);audioRef.current?.configure(audioSettings)},[audioSettings]);
 useEffect(()=>{audioRef.current?.setScene(musicScene())},[mode,bossMode,examMode,studyMode]);
 useEffect(()=>()=>{audioRef.current?.dispose();audioRef.current=null},[]);
 useEffect(()=>{if(!sceneEffect)return;const id=window.setTimeout(()=>setSceneEffect(null),1450);return()=>window.clearTimeout(id)},[sceneEffect]);
 /* Progress persistence and other-tab conflict detection live in useProgressConflict. */
 useEffect(()=>watchOfflineUpdates(()=>setUpdateAvailable(true)),[]);
 useEffect(()=>{const current=profile.rank;if(previousRank.current!==current){const previousIndex=RANKS.findIndex(item=>item.name===previousRank.current);previousRank.current=current;if(profile.rankIndex>previousIndex){if(examMode&&mode==='quiz'){setDeferredRankNotice(current)}else{setRankNotice(current);audioRef.current?.play('rank');triggerHaptic('rank',hapticMode,reduced,false);pulse('rank')}}}},[profile.rank,examMode,mode]);
 useEffect(()=>{if(examMode&&mode==='result'&&deferredRankNotice){setRankNotice(deferredRankNotice);setDeferredRankNotice('')}},[examMode,mode,deferredRankNotice]);
 useEffect(()=>{if(!examMode||mode!=='quiz')return;const tick=()=>setTimeLeft(Math.max(0,Math.ceil((examDeadline-Date.now())/1000)));tick();const id=window.setInterval(tick,1000);return()=>window.clearInterval(id)},[examMode,mode,examDeadline]);
 useEffect(()=>{if(!examMode||mode!=='quiz'||syncBlocked.current||restoreBlocked)return;const save:ExamSave={runId:attemptRunId,ids:pool.map(q=>q.id),index,selected,multiChoices,choiceOrder,answers:sessionAnswers,session,deadline:examDeadline};localStorage.setItem(examSaveKey,JSON.stringify(save));setExamSave(save)},[examMode,mode,pool,index,selected,multiChoices,choiceOrder,sessionAnswers,session,examDeadline,attemptRunId]);
 useEffect(()=>{if(mode==='result'&&examMode&&!syncBlocked.current&&!restoreBlocked){localStorage.removeItem(examSaveKey);setExamSave(null)}},[mode,examMode]);
 useEffect(()=>{if(mode!=='quiz'||examMode||syncBlocked.current||restoreBlocked)return;const snapshot:MissionSave={version:1,runId:attemptRunId,ids:pool.map(item=>item.id),index,selected,multiChoices,choiceOrder,answers:sessionAnswers,session,combo,weak:review,boss:bossMode,bossDomain:bossDomain??undefined,focusTopic:skillFocus??undefined,scenario:caseMode,adaptive:adaptiveMode,retention:retentionMode,dailyFocus,dailyTypes:dailyFocus?dailyTypes:undefined,expeditionId:expeditionMode??undefined,expeditionProof:expeditionMode?expeditionProof:undefined,smartWhy:(adaptiveMode||retentionMode||dailyFocus)?smartWhy:undefined,due:studyMode==='due',showChoices,reflection,savedAt:Date.now()};writeMissionSave(snapshot);setMissionSave(snapshot)},[mode,examMode,pool,index,selected,multiChoices,choiceOrder,sessionAnswers,session,combo,review,bossMode,bossDomain,skillFocus,caseMode,adaptiveMode,retentionMode,dailyFocus,dailyTypes,expeditionMode,expeditionProof,smartWhy,studyMode,showChoices,reflection,attemptRunId]);
 useEffect(()=>{if(mode==='result'&&!examMode&&!syncBlocked.current&&!restoreBlocked){clearMissionSave();setMissionSave(null)}},[mode,examMode]);
 useEffect(()=>{
  const unlocked=titleCollection.filter(t=>t.unlocked);
  const current=new Set(unlocked.map(t=>t.id));
  if(observedTitles.current===null){observedTitles.current=current;return}
  const fresh=unlocked.filter(t=>!observedTitles.current!.has(t.id));
  observedTitles.current=current;
  if(fresh.length)setNewTitleIds(ids=>[...new Set([...ids,...fresh.map(t=>t.id)])]);
 },[progress]);
 useEffect(()=>{const current=new Set(relics.filter(x=>x.unlocked).map(x=>x.id));if(observedRelics.current===null){observedRelics.current=current;return}const newIds=[...current].filter(id=>!observedRelics.current!.has(id));observedRelics.current=current;if(newIds.length)setNewRelicIds(ids=>[...new Set([...ids,...newIds])])},[progress.reviews,progress.bossRecords]);


 useEffect(()=>{if(examMode&&mode==='quiz'&&timeLeft===0)setMode('result')},[examMode,mode,timeLeft]);
 useEffect(()=>{if(mode!=='quiz')return;const frame=window.requestAnimationFrame(()=>{questionRef.current?.focus({preventScroll:true});questionRef.current?.scrollIntoView({block:'start',behavior:'auto'})});return()=>window.cancelAnimationFrame(frame)},[mode,index]);
 function start(weak=false,exam=false,due=false,boss=false,scenario=false,bossTarget?:BossDomain,focusedTopic?:string,adaptive=false,retentionLimit?:5|10,expeditionId?:ExpeditionId,dailyFive=false){if(syncBlocked.current||restoreBlocked)return;setDeferredRankNotice('');setAttemptRunId(makeAttemptRunId());if(!exam){clearMissionSave();setMissionSave(null)}const dailySelection=dailyFive?planDailyFive(questions,progress.reviews||{},progress.mistakes,progress.answerHistory):null;const target=boss?(bossTarget??(isBossDomain(domain)?domain:BOSSES[0].domain)):null;const expeditionPool=expeditionId?planExpedition(questions,expeditionId,progress.reviews||{}):null;const eligible=dailySelection?.questions??expeditionPool??(boss?questions.filter(x=>x.difficulty===3&&x.domain===target):scenario?questions.filter(x=>isScenarioQuestion(x)&&(domain==='ALL'||x.domain===domain)):exam?questions:focusedTopic&&TOPICS.some(t=>t.name===focusedTopic)?questions.filter(x=>topicFor(x)===focusedTopic):domain==='ALL'?questions:questions.filter(x=>x.domain===domain));const dueIds=dueQuestionIds(progress.reviews||{},eligible.map(x=>x.id));const subset=due?eligible.filter(x=>dueIds.includes(x.id)):weak?eligible.filter(x=>progress.mistakes.includes(x.id)):eligible;if(subset.length===0)return;const known=new Set(Object.keys(progress.reviews||{}));const recent=new Set(readRecentQuestions());const limit=dailySelection?5:expeditionId?5:retentionLimit??(boss||scenario?10:missionLength===0?subset.length:missionLength);const retentionSelection=retentionLimit&&!exam&&!boss?planRetentionQuest(subset,progress.reviews||{},retentionLimit):null;const smartSelection=adaptive?planSmartQuest(subset,limit,{reviews:progress.reviews||{},mistakes:progress.mistakes,recent,domains:progress.domains||{}},smartProfile):null;const chosenPool=dailySelection?dailySelection.questions:expeditionId?subset.slice(0,5):exam?examPool(known,recent):retentionSelection?retentionSelection.questions:weak||due?shuffle(subset).slice(0,limit):smartSelection?smartSelection.questions:selectVaried(subset,limit,known,recent);if(!chosenPool.length||(expeditionId&&chosenPool.length!==5))return;setSmartWhy(dailySelection?.reasons??retentionSelection?.reasons??smartSelection?.reasons??{});if(!weak&&!due)rememberQuestionSelection(chosenPool.map(item=>item.id));setPool(chosenPool);setStudyMode(due?'due':'normal');setBossMode(boss);setBossDomain(target);setSkillFocus(!boss&&!exam&&!scenario?focusedTopic??null:null);setBossReport(null);setCampaignHit(null);finishing.current=false;answerLockRef.current=false;setCaseMode(scenario);setAdaptiveMode(adaptive&&!exam&&!boss&&!scenario);setRetentionMode(!!retentionSelection);setDailyFocus(!!dailySelection);setDailyTypes(Object.fromEntries((dailySelection?.items??[]).map(x=>[x.question.id,x.type])));setRetentionBonus(0);setExpeditionMode(expeditionId??null);setExpeditionProof([]);setExpeditionResult(null);setShowChoices(exam||!recallFirst);setExamMode(exam);setExamDeadline(exam?Date.now()+130*60*1000:0);setTimeLeft(130*60);setReview(weak);setIndex(0);setSelected(null);setMultiChoices([]);setReflection('');setChoiceOrder(shuffle(Array.from({length:chosenPool[0].choices.length},(_,i)=>i)));setCombo(0);setSession({correct:0,total:0});setSessionAnswers({});setEarnedXP(0);setNewTitleIds([]);setNewRelicIds([]);haptic('start',exam);playCue('start',boss?'boss':exam?'exam':due?'recall':'mission');pulse(boss?'boss-start':'start');setMode('quiz')}
 function resumeMission(){const saved=readMissionSave();if(!saved)return;setAttemptRunId(saved.runId??('legacy-'+saved.savedAt+'-'+saved.ids[0]));const restored=saved.ids.map(id=>questionById.get(id));if(restored.some(item=>!item)||!restoredMissionIsValid(saved,restored[saved.index]!.choices)){clearMissionSave();setMissionSave(null);return}setPool(restored as Question[]);setIndex(saved.index);setSelected(saved.selected);setMultiChoices(saved.multiChoices);setChoiceOrder(saved.choiceOrder);setSession(saved.session);setSessionAnswers(saved.answers);setCombo(saved.combo);setReview(saved.weak);setBossMode(saved.boss);const legacyDomain=saved.boss&&restored.every(x=>x?.domain===restored[0]?.domain)?restored[0]?.domain:null;setBossDomain(saved.boss&&isBossDomain(saved.bossDomain)?saved.bossDomain:saved.boss&&isBossDomain(legacyDomain)?legacyDomain:null);setSkillFocus(saved.focusTopic&&TOPICS.some(t=>t.name===saved.focusTopic)?saved.focusTopic:null);setBossReport(null);setCampaignHit(null);finishing.current=false;answerLockRef.current=false;setCaseMode(!!saved.scenario);setAdaptiveMode(!!saved.adaptive);setRetentionMode(!!saved.retention);setDailyFocus(!!saved.dailyFocus);setDailyTypes(saved.dailyTypes??{});setRetentionBonus(0);setExpeditionMode(EXPEDITIONS.some(e=>e.id===saved.expeditionId)?saved.expeditionId as ExpeditionId:null);setExpeditionProof(saved.expeditionProof??[]);setExpeditionResult(null);setSmartWhy(saved.smartWhy??{});setStudyMode(saved.due?'due':'normal');setShowChoices(saved.showChoices);setReflection(saved.reflection);setEarnedXP(0);setNewTitleIds([]);setNewRelicIds([]);setExamMode(false);haptic('start',false);playCue('start',saved.boss?'boss':saved.due?'recall':'mission');setMode('quiz')}
 function resumeExam(){const saved=getExamSave();if(!saved)return;setAttemptRunId(saved.runId??('legacy-exam-'+saved.deadline));const restored=saved.ids.map(id=>questionById.get(id)).filter((q):q is Question=>!!q);if(!restored.length||saved.index<0||saved.index>=restored.length){localStorage.removeItem(examSaveKey);setExamSave(null);return}setPool(restored);setIndex(saved.index);setSelected(saved.selected);setMultiChoices(saved.multiChoices);setChoiceOrder(saved.choiceOrder);setSession(saved.session);setSessionAnswers(saved.answers);setExamMode(true);setBossMode(false);setBossDomain(null);setSkillFocus(null);setBossReport(null);setCampaignHit(null);finishing.current=false;answerLockRef.current=false;setCaseMode(false);setAdaptiveMode(false);setRetentionMode(false);setDailyFocus(false);setDailyTypes({});setRetentionBonus(0);setExpeditionMode(null);setExpeditionProof([]);setExpeditionResult(null);setSmartWhy({});setExamDeadline(saved.deadline);setTimeLeft(Math.max(0,Math.ceil((saved.deadline-Date.now())/1000)));setShowChoices(true);setEarnedXP(0);setNewTitleIds([]);setNewRelicIds([]);haptic('start',true);playCue('start','exam');setMode('quiz')}
 function answer(choices:number[]){
  if(syncBlocked.current||restoreBlocked||selected!==null||answerLockRef.current)return;
  const answers=correctAnswers(q),ok=gradeAnswer(choices,answers),answerNow=Date.now();
  const event:StudyAttempt={attemptId:attemptRunId+':'+index+':'+q.id,questionId:q.id,
   domain:q.domain,correct:ok,combo:ok?combo+1:0,difficulty:q.difficulty,
   boss:bossMode,mode:examMode?'exam':dailyFocus?'daily':retentionMode?'retention':adaptiveMode?'smart':'normal',at:answerNow};
  if(progress.attemptReceipts?.includes(event.attemptId))return;
  answerLockRef.current=true;
  const preview=applyStudyAttempt(progress,event);
  if(!preview.reward.credited){answerLockRef.current=false;return}
  if(expeditionMode&&ok&&eligibleForDelayedRecall(progress.reviews?.[q.id],answerNow))
   setExpeditionProof(ids=>ids.includes(q.id)?ids:[...ids,q.id]);
  setCampaignHit(preview.reward.campaign?.credited&&!examMode&&!bossMode&&ok?preview.reward.campaign:null);
  setRetentionBonus(preview.reward.retentionXp);
  setEarnedXP(preview.reward.totalXp);
  setSessionAnswers(a=>({...a,[q.id]:[...choices]}));
  setSelected(q.answers?(ok?-2:-1):choices[0]);
  const nextCombo=ok?combo+1:0;
  setCombo(nextCombo);
  setSession(v=>({correct:v.correct+(ok?1:0),total:v.total+1}));
  setProgress(p=>applyStudyAttempt(p,event).progress);
  if(examMode){haptic('select',true);playCue('select','exam')}
  else {
   const milestone=ok&&comboMilestone(nextCombo);
   haptic(ok?(milestone?'combo':bossMode?'boss-hit':'correct'):'wrong',false);
   playCue(bossMode&&ok?'boss-hit':ok?(milestone?'combo':'correct'):'wrong',bossMode?'boss':musicScene());
   pulse(ok?(bossMode?'boss-hit':milestone?'combo':'correct'):'wrong');
   if(ok&&!reduced)setBurst(b=>b+1);
  }
 }
 function reflect(confidence:'again'|'unsure'|'good'){setReflection(confidence);if(confidence==='good')return;setProgress(p=>({...p,reviews:{...p.reviews,[q.id]:rateReview(p.reviews[q.id],confidence)}}))}
 function toggleChoice(choice:number){if(selected!==null)return;haptic('select');playCue('select');setMultiChoices(items=>items.includes(choice)?items.filter(x=>x!==choice):[...items,choice])}
 function next(){if(syncBlocked.current||restoreBlocked)return;if(index+1>=pool.length){if(finishing.current)return;finishing.current=true;
  let defeated=false;
  if(expeditionMode&&!examMode){const outcome=finishExpedition(progress.expeditions,expeditionMode,session.correct,pool.length,expeditionProof);setExpeditionResult(outcome);setProgress(p=>({...p,expeditions:finishExpedition(p.expeditions,expeditionMode,session.correct,pool.length,expeditionProof).state}));}
  if(bossMode&&bossDomain&&!examMode){
   const reward=recordBossVictory(progress.bossRecords,bossDomain,session.correct,pool.length);
   defeated=reward.outcome.victory;
   setBossReport({domain:bossDomain,victory:defeated,grade:reward.outcome.grade,award:reward.award,firstClear:reward.firstClear,upgraded:reward.upgraded});
   if(defeated)setProgress(p=>{const earned=recordBossVictory(p.bossRecords,bossDomain,session.correct,pool.length);return {...p,bossRecords:earned.records,xp:p.xp+earned.award}});
  }
  haptic(defeated?'boss-win':'correct');playCue(defeated?'boss-win':'finish','result');pulse(defeated?'boss-win':'finish');setMode('result')
 }else{playCue('click');setEarnedXP(0);setRetentionBonus(0);setCampaignHit(null);if(!examMode){setNewTitleIds([]);setNewRelicIds([])}answerLockRef.current=false;setIndex(i=>i+1);setSelected(null);setMultiChoices([]);setReflection('');setChoiceOrder(shuffle(Array.from({length:pool[index+1].choices.length},(_,i)=>i)));setShowChoices(examMode||!recallFirst)}}
 function claimDaily(){const date=localDay();if(dailyQuestUniqueCount(progress.answerHistory,date,progress.daily)<5||daily.claimed)return;setProgress(p=>{const d=p.daily;if(!d||d.date!==date||dailyQuestUniqueCount(p.answerHistory,date,d)<5||d.claimed)return p;return {...p,xp:p.xp+150,daily:{...d,claimed:true}}});haptic('reward',false);playCue('reward');pulse('reward')}
 const today=localDay();
 const daily=progress.daily?.date===today?progress.daily:{date:today,answered:0,correct:0};
 const dailyUniqueCount=useMemo(()=>dailyQuestUniqueCount(progress.answerHistory,today,progress.daily),[progress.answerHistory,progress.daily,today]);
 const rank=profile.rank;
 const equippedRelicName=relics.find(x=>x.id===equippedRelic)?.name;
 const dailyContracts=todayContracts(progress.dailyContracts,today);
 const scopedQuestions=useMemo(()=>questions.filter(item=>domain==='ALL'||item.domain===domain),[domain]);
 const recentForDashboard=useMemo(()=>new Set(readRecentQuestions()),[mode,domain,progress.reviews,progress.mistakes]);
 const smartReasons=useMemo(()=>adaptiveReasons(scopedQuestions,{reviews:progress.reviews||{},mistakes:progress.mistakes,recent:recentForDashboard,domains:progress.domains||{}}),[scopedQuestions,progress.reviews,progress.mistakes,progress.domains,recentForDashboard]);
 const expeditionCounts=useMemo(()=>Object.fromEntries(EXPEDITIONS.map(e=>[e.id,planExpedition(questions,e.id,progress.reviews||{}).length])) as Partial<Record<ExpeditionId,number>>,[progress.reviews]);
 const dailyFivePlan=useMemo(()=>planDailyFive(questions,progress.reviews||{},progress.mistakes,progress.answerHistory),[progress.reviews,progress.mistakes,progress.answerHistory]);
 const dailyFiveSummary=dailyFocus?summarizeDailyFive(pool,sessionAnswers,dailyTypes):null;
 const retention5=useMemo(()=>planRetentionQuest(scopedQuestions,progress.reviews||{},5),[scopedQuestions,progress.reviews]);
 const retention10=useMemo(()=>planRetentionQuest(scopedQuestions,progress.reviews||{},10),[scopedQuestions,progress.reviews]);
 const smartPlan=useMemo(()=>planSmartQuest(scopedQuestions,10,{reviews:progress.reviews||{},mistakes:progress.mistakes,recent:recentForDashboard,domains:progress.domains||{}},smartProfile),[scopedQuestions,progress.reviews,progress.mistakes,progress.domains,recentForDashboard,smartProfile]);
 const contractAvailable:Record<ContractId,boolean>={
  warmup:scopedQuestions.length>0,
  explore:scopedQuestions.some(item=>!progress.reviews?.[item.id]),
  recover:scopedQuestions.some(item=>progress.mistakes.includes(item.id)),
  recall:dueQuestionIds(progress.reviews||{},scopedQuestions.map(item=>item.id)).length>0
 };
 function startContract(id:ContractId){if(id==='recover')start(true);else if(id==='recall')start(false,false,true);else start(false)}
 function claimContractReward(id:ContractId){
  if(!claimContract(progress.dailyContracts,localDay(),id).award)return;
  setProgress(p=>{const result=claimContract(p.dailyContracts,localDay(),id);return result.award?{...p,xp:p.xp+result.award,dailyContracts:result.contracts}:p});
  haptic('reward',false);playCue('reward');pulse('reward');
 }
 if(syncIssue)return <main className="app"><section className="progress-conflict-banner" role="alert" aria-live="assertive" aria-labelledby="progress-conflict-title">
  <strong id="progress-conflict-title">他のタブとの保存競合を検出しました</strong>
  <p>{syncIssue.message} このタブの操作と自動保存は停止しています。XP・回答履歴の自動統合や上書きは行いません。</p>
  <div><button type="button" onClick={saveConflictSnapshot}>このタブの記録をJSONで退避</button><button type="button" onClick={()=>window.location.reload()}>保存済みの最新データを読み直す</button></div>
  {snapshotMessage&&<p role="status">{snapshotMessage}</p>}
  <small>退避JSONには学習記録が含まれます。第三者と共有しないでください。Web Locks非対応ブラウザでは同時書き込みの完全な排他は保証されません。</small>
 </section></main>;
 return <div className={`app ${reduced?'reduced':''} ${textScaleClass(textScale)} ${mode==='quiz'&&quizLayout!=='detailed'?'quiz-compact':''} ${mode==='quiz'&&quizLayout==='focus'?'quiz-focus':''} ${visualPower==='overdrive'?'visual-overdrive':''}`}>
  {sceneEffect&&!reduced&&<div key={sceneEffect.id} className={`impact-layer impact-${sceneEffect.type}`} aria-hidden="true"><div className="impact-ring"/><div className="impact-word">{sceneEffect.type==='boss-win'?'BOSS DOWN!':sceneEffect.type==='combo'?'HYPER COMBO!':sceneEffect.type==='wrong'?'RETRY!':sceneEffect.type==='reward'?'DAILY CLEAR!':sceneEffect.type==='rank'?'RANK UP!':sceneEffect.type==='correct'?'NICE! +XP':sceneEffect.type==='boss-hit'?'CRITICAL HIT!':sceneEffect.type==='boss-start'?'BOSS APPROACHING!':sceneEffect.type==='finish'?'STAGE CLEAR!':'MISSION START!'}</div>{Array.from({length:20},(_,i)=><i key={i} style={{'--fx-a':`${i*18}deg`,'--fx-d':`${80+i%5*35}px`} as React.CSSProperties}/>)}</div>}{rankNotice&&<div className="rank-overlay" role="status" aria-live="polite"><div><Trophy size={38}/><strong>RANK UP!</strong><span>{rankNotice}</span><button onClick={()=>setRankNotice('')}>CONTINUE <ArrowRight size={18}/></button></div></div>}<div className="grid-bg"/><div className="orb orb-a"/><div className="orb orb-b"/>
  {restoreBlocked&&<div className="update-banner" role="alert"><strong>保存データの復旧が未完了です。既存のデータ保護のため自動保存を停止しました。ブラウザの保存領域を消さず、バックアップから復旧してください。</strong></div>}
  {updateAvailable&&mode==='home'&&<div className="update-banner" role="status"><div><strong>新しいOVERDRIVEをダウンロード済み</strong><p>プレイ中のデータを守るため、更新は手動で適用します。</p></div><button type="button" onClick={()=>applyOfflineUpdate()}>更新して再起動</button></div>}
   <header className="topbar"><button className="brand" onClick={()=>setMode('home')}><Zap size={22} fill="currentColor"/> CERT<span>//</span>OVERDRIVE</button><div className="top-actions"><span className="top-rank" title={profile.rankSubtitle+" · "+displayTitle}><Trophy size={15}/> {rank}</span><button type="button" className="game-menu-trigger" aria-label="ゲームメニューを開く" aria-expanded={menuOpen} onClick={()=>showMenu()}><Menu size={22}/><span>MENU</span></button><button className="icon-btn" aria-label={audioSettings.bgmEnabled||audioSettings.sfxEnabled?"音をすべてオフ":"音をオン"} aria-pressed={audioSettings.bgmEnabled||audioSettings.sfxEnabled} onClick={toggleAudio}>{audioSettings.bgmEnabled||audioSettings.sfxEnabled?<Volume2 size={19}/>:<VolumeX size={19}/>}</button></div></header>{menuOpen&&<GameMenu titles={titleCollection} equippedTitle={validTitleId} onEquipTitle={equipTitle} tab={menuTab} onTab={setMenuTab} closeRef={menuCloseRef} onClose={()=>setMenuOpen(false)} onHome={()=>{setMenuOpen(false);setMode('home')}} profile={profile} domains={progress.domains||{}} totalQuestions={questions.length} session={{mode,exam:examMode,boss:bossMode,scenario:caseMode,index,total:pool.length,correct:session.correct}} audio={audioSettings} onAudio={setAudio} haptics={hapticMode} onHaptics={changeHaptics} canVibrate={typeof navigator!=='undefined'&&typeof navigator.vibrate==='function'} textScale={textScale} onTextScale={changeTextScale} quizLayout={quizLayout} onQuizLayout={changeQuizLayout} visualPower={visualPower} onVisualPower={changeVisualPower} onVibrationTest={(kind)=>testHapticDevice(hapticMode,reduced,kind)} reduced={reduced} onReduced={setReduced} onSoundTest={()=>playCue('reward')}/>}
  <main>{mode==='home'?<><section className="hero"><div className="eyebrow"><span className="live-dot"/> AWS SAA-C03 · PRACTICE</div><button type="button" className="player-title-chip" onClick={()=>showMenu('titles')} aria-label={"称号を変更する。現在 "+displayTitle}><Trophy size={16}/><strong>{displayTitle}</strong><span>{profile.rankSubtitle}</span><ChevronDown size={14} className="player-title-arrow"/></button>{equippedRelicName&&<div className="od4-equipped-relic"><Trophy size={15}/> EQUIPPED · {equippedRelicName}</div>}<div className="hero-level-hud"><span>LV.{profile.level}</span><div className="hero-level-bar" role="progressbar" aria-label="次のレベルまでの進行度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={profile.levelPct}><div style={{width:profile.levelPct+'%'}}/></div><span>{profile.levelPct}%</span></div><div className="quick-start">{missionSave&&<div className="resume-row"><button className="resume-session" onClick={resumeMission}><RotateCcw size={21}/><span><strong>前回のミッションを再開</strong><small>{missionSave.boss?'BOSS RUSH':missionSave.scenario?'CASE FILES':missionSave.due?'RECALL RAID':missionSave.weak?'WEAKNESS RAID':'MISSION'} · {missionSave.index+1}/{missionSave.ids.length}問</small></span><ArrowRight size={19}/></button><button className="resume-discard" aria-label="保存済みミッションを破棄" onClick={()=>{clearMissionSave();setMissionSave(null)}}>破棄</button></div>}{examSave&&<button className="resume-session resume-session-exam" onClick={resumeExam}><RotateCcw size={20}/><span><strong>65問模擬試験を再開</strong><small>{Object.keys(examSave.answers).length}/{examSave.ids.length}問回答済み · 制限時間は継続</small></span><ArrowRight size={19}/></button>}<DailyFiveBoard plan={dailyFivePlan} onStart={()=>start(false,false,false,false,false,undefined,undefined,false,undefined,undefined,true)} disabled={!!missionSave||!!examSave}/><div className="hero-actions"><button className="primary-btn" onClick={()=>start(false)}><Zap size={19} fill="currentColor"/> START MISSION <ArrowRight size={19}/></button><button className="secondary-btn" disabled={!questions.some(x=>(domain==="ALL"||x.domain===domain)&&progress.mistakes.includes(x.id))} onClick={()=>start(true)}><RotateCcw size={17}/> WEAKNESS RAID ({questions.filter(x=>(domain==="ALL"||x.domain===domain)&&progress.mistakes.includes(x.id)).length})</button></div></div><h1 className="home-tagline">STUDY <span className="gradient-text">SMART.</span></h1><details className="home-advanced"><summary><span>問題数・分野・模擬試験などを選ぶ</span><ChevronDown size={18}/></summary><div className="home-advanced-content"><div className="mission-setup"><div className="domain-controls" role="group" aria-label="出題分野">{["ALL","セキュリティ","耐障害性","パフォーマンス","コスト最適化"].map(d=><button key={d} aria-pressed={domain===d} className={domain===d?"active":""} onClick={()=>setDomain(d)}>{d}</button>)}</div><div className="mission-length" role="group" aria-label="出題数">{[10,20,0].map(n=><button key={n} aria-pressed={missionLength===n} className={missionLength===n?"active":""} onClick={()=>setMissionLength(n)}>{n===0?"MARATHON ∞":`${n} Q`}</button>)}</div></div><details className="xp-policy"><summary>XPルール：同日再解答・模擬試験ではXPを加算しません</summary><p>初めての解答や、日をまたいだ復習は従来の基本XPを獲得できます。同日に同じ問題へ再回答した場合は基本XP・敵へのダメージを加算せず、連続正解だけで復習間隔を延長しません。模擬試験は採点と回答履歴のみです。既に獲得済みのXPや称号は変更しません。毎日の報酬は異なる5問の学習で獲得できます。</p></details><div className="exam-cta"><div><strong><Trophy size={19}/> EXAM TRIAL · 65 Q · 130 MIN</strong></div><button onClick={()=>start(false,true)}>ENTER EXAM TRIAL <ArrowRight size={17}/></button></div><div className="scenario-cta"><div><strong><BookOpen size={19}/> CASE FILES · {questions.filter(isScenarioQuestion).length} SCENARIOS</strong></div><button onClick={()=>start(false,false,false,false,true)}>CHALLENGE CASES <ArrowRight size={17}/></button></div><label className="recall-toggle"><input type="checkbox" checked={recallFirst} onChange={e=>setRecallFirst(e.target.checked)}/> ACTIVE RECALL FIRST · 選択肢を出す前に思い出す</label><div className="study-due"><div><strong>SPACED RETRIEVAL</strong></div><button disabled={dueQuestionIds(progress.reviews||{},questions.filter(x=>domain==='ALL'||x.domain===domain).map(x=>x.id)).length===0} onClick={()=>start(false,false,true)}>RECALL RAID ({dueQuestionIds(progress.reviews||{},questions.filter(x=>domain==='ALL'||x.domain===domain).map(x=>x.id)).length})</button></div><div className="boss-cta"><div><strong><Flame size={22}/> BOSS RUSH · 10 HARD Q</strong></div><button onClick={()=>document.getElementById('od4-boss-title')?.scrollIntoView({behavior:reduced?'auto':'smooth'})}>CHOOSE BOSS <ArrowRight size={17}/></button></div></div></details></section>
  <section className="daily-quest"><div className="daily-quest-header"><span>DAILY QUEST · 毎日コツコツ</span><strong>{Math.min(dailyUniqueCount,5)} / 5 CLEAR</strong></div>{dailyUniqueCount>=5&&<h2>DAILY QUEST COMPLETE!</h2>}<div className="daily-quest-track"><div style={{width:`${Math.min(dailyUniqueCount,5)*20}%`}}/></div>{dailyUniqueCount>=5&&!daily.claimed?<button className="daily-claim" onClick={claimDaily}>DAILY CLEAR REWARD · +150 XP <Trophy size={18}/></button>:daily.claimed?<strong className="daily-claimed">報酬受取済み · +150 XP</strong>:<button className="secondary-btn" onClick={()=>start(false)}>TODAY’S MISSION <ArrowRight size={17}/></button>}</section><DailyContractBoard contracts={dailyContracts} date={today} available={contractAvailable} onStart={startContract} onClaim={claimContractReward}/><HomeProgressSummary xp={progress.xp} answered={progress.answered} correct={progress.correct} reviewDue={reviewCounts(progress.reviews||{})} bestCombo={progress.best}/>
  <OfflineStatus activeMission={!!missionSave||!!examSave}/>
  <details className="home-hub-drawer" data-section="adventure"><summary><span className="home-drawer-title">冒険・設計チャレンジ</span><span className="home-drawer-description">モンスター討伐・遠征・AWS設計演習</span><ChevronDown size={20}/></summary><div className="home-drawer-content"><EnemyCampaignPanel campaign={enemyCampaign} onStart={()=>start(false)} onReplay={()=>setProgress(p=>({...p,enemyCampaign:restartCampaign(p.enemyCampaign)}))}/>
  <ExpeditionBoard progress={progress.expeditions} available={expeditionCounts} onLaunch={id=>start(false,false,false,false,false,undefined,undefined,false,undefined,id)}/>
  <DesignSimulator progress={progress.designLab} onFinish={(id,correct,outcomes)=>setProgress(p=>({...p,designLab:recordDesignCompletion(p.designLab,id,correct,Date.now(),outcomes).state}))} onReview={(id,stepId,correct)=>setProgress(p=>({...p,designLab:recordDesignRecall(p.designLab,id,stepId,correct)}))}/>
  </div></details><details className="home-hub-drawer" data-section="review"><summary><span className="home-drawer-title">もっと学習する</span><span className="home-drawer-description">期限が来た復習・おすすめ問題・ボス戦</span><ChevronDown size={20}/></summary><div className="home-drawer-content"><RetentionQuestBoard plan5={retention5} plan10={retention10} rewards={progress.retrievalRewards} onStart={count=>start(false,false,true,false,false,undefined,undefined,false,count)}/>
   <SmartQuestBoard profile={smartProfile} onProfile={changeSmartProfile} plan={smartPlan} stats={smartReasons} onStart={()=>start(false,false,false,false,false,undefined,undefined,true)}/>
  <BossBoard records={progress.bossRecords} onChallenge={target=>start(false,false,false,true,false,target)}/>
  </div></details>
  <details className="home-hub-drawer" data-section="insights"><summary><span className="home-drawer-title">学習記録・成長分析</span><span className="home-drawer-description">学習日数・回答推移・復習の成果</span><ChevronDown size={20}/></summary><div className="home-drawer-content"><ActivityTimeline history={progress.activity??{}} totalAnswered={progress.answered} totalCorrect={progress.correct}/>
   <GrowthDashboard history={progress.answerHistory} activity={progress.activity??{}} domains={progress.domains||{}}/>
  <LearningInsights history={progress.answerHistory}/>
  </div></details><details className="home-hub-drawer" data-section="collection"><summary><span className="home-drawer-title">スキル・コレクション</span><span className="home-drawer-description">習熟度・レリック・問題の進捗</span><ChevronDown size={20}/></summary><div className="home-drawer-content"><SkillTreeBoard nodes={skillNodes} onTrain={topic=>start(false,false,false,false,false,undefined,topic)}/>
  <RelicVault relics={relics} equipped={equippedRelic} onEquip={equipRelic}/>
  <HomeMasteryCoverage questions={questions} masteryMap={masteryMap} reviews={progress.reviews||{}}/></div></details><div className="footnote"><BookOpen size={15}/> Original practice content · Unofficial learning project · Not affiliated with AWS</div></>:mode==='quiz'?<section className="quiz"><div className="quiz-top"><button className="back" onClick={()=>setMode('home')}>← DASHBOARD</button>{examMode&&<span className={`exam-clock ${timeLeft<=600?"urgent":""}`} role="timer" aria-label="模擬演習の残り時間">{String(Math.floor(timeLeft/3600)).padStart(2,"0")}:{String(Math.floor(timeLeft%3600/60)).padStart(2,"0")}:{String(timeLeft%60).padStart(2,"0")}</span>}<div className="quiz-stage">{examMode?"EXAM TRIAL":bossMode?"BOSS RUSH":expeditionMode?"EXPEDITION":caseMode?"CASE FILES":dailyFocus?"DAILY FIVE":retentionMode?"RECALL MICRO RAID":adaptiveMode?"SMART QUEST":"MISSION"} {String(index+1).padStart(2,'0')} / {String(pool.length).padStart(2,'0')}</div>{quizLayout==='detailed'&&!examMode&&<div className="combo"><Flame size={17}/> {combo} COMBO</div>}
 <div className="cq-controls" role="group" aria-label="文字とクイズ画面の調整">
  <button type="button" title="文字を小さくする" aria-label="文字を一段階小さくする" onClick={()=>changeTextScale(shiftTextScale(textScale,-1))} disabled={textScale===TEXT_SCALES[0]}>A−</button>
  <span className="cq-scale-indicator" aria-live="polite">{({'compact':'最小','small':'小さめ','standard':'標準','large':'大きく','extra':'特大'} as const)[textScale]}</span>
  <button type="button" title="文字を大きくする" aria-label="文字を一段階大きくする" onClick={()=>changeTextScale(shiftTextScale(textScale,1))} disabled={textScale===TEXT_SCALES[TEXT_SCALES.length-1]}>A＋</button>
  <button type="button" className="cq-layout-toggle" aria-pressed={quizLayout==='compact'} aria-label={quizLayout==='compact'?'詳細レイアウトに切り替える':'省スペース表示に切り替える'} onClick={()=>changeQuizLayout(quizLayout==='compact'?'detailed':'compact')}>{quizLayout==='compact'?'詳細':'省スペース'}</button>
  <button type="button" className="cq-focus-toggle" aria-pressed={quizLayout==='focus'} aria-label={quizLayout==='focus'?'モンスター表示に戻す':'問題と回答を優先する集中表示'} onClick={()=>changeQuizLayout(quizLayout==='focus'?'compact':'focus')}>{quizLayout==='focus'?'戦闘表示':'集中'}</button>
 </div></div><div className="progress-track" role="progressbar" aria-label="ミッション進行度" aria-valuemin={0} aria-valuemax={pool.length} aria-valuenow={index+(selected!==null?1:0)}><div style={{width:`${(index+(selected!==null?1:0))/pool.length*100}%`}}/></div><QuizCombatStatus quizLayout={quizLayout} examMode={examMode} bossMode={bossMode} bossDomain={bossDomain} combo={combo} session={session} enemyCampaign={enemyCampaign} campaignHit={campaignHit} poolLength={pool.length}/>{expeditionMode&&!examMode&&<ExpeditionJourneyHUD id={expeditionMode} index={index}/>}<div className="question-card" ref={questionRef} tabIndex={-1} aria-label={"現在の問題 "+(index+1)+"／"+pool.length}><StudyQuestionIntro question={q} topic={topicFor(q)} reason={(adaptiveMode||retentionMode||dailyFocus)&&!examMode?smartWhy[q.id]:undefined} showTerms={!examMode} readingGuide={readingGuide} onReadingGuide={toggleReadingGuide}/><QuizAnswerControls question={q} choiceOrder={choiceOrder} selected={selected} multiChoices={multiChoices} examMode={examMode} showChoices={showChoices} onReveal={()=>setShowChoices(true)} onToggle={toggleChoice} onAnswer={answer}/>{selected!==null&&examMode&&<div className="exam-pending"><span>ANSWER LOCKED · 解説は全問終了後に表示</span><button className="primary-btn next-btn" onClick={next}>{index+1===pool.length?'FINISH EXAM':'NEXT QUESTION'} <ArrowRight size={18}/></button></div>}{selected!==null&&!examMode&&<StudyAnswerFeedback question={q} correct={selected===-2||selected!==null&&selected>=0&&correctAnswers(q).includes(selected)} earnedXP={earnedXP} retentionBonus={retentionBonus} combo={combo} newTitleIds={newTitleIds} newRelicIds={newRelicIds} titles={titleCollection} relics={relics} reflection={reflection} prompt={makeChatGPTPrompt(q,sessionAnswers[q.id])} isLast={index+1===pool.length} onEquipTitle={id=>{equipTitle(id);setNewTitleIds([])}} onReflect={reflect} onCopyPrompt={()=>{void navigator.clipboard?.writeText(makeChatGPTPrompt(q,sessionAnswers[q.id]))}} onNext={next}/>}</div></section>:<section className="result"><ResultOverview correct={session.correct} total={session.total} exam={examMode} grade={practiceGrade} onNextRank={()=>showMenu("status")}/>{!examMode&&!bossMode&&<EnemyCampaignPanel campaign={enemyCampaign} compact attack={campaignHit}/>}{bossMode&&bossReport&&<div className={'od4-result-report '+(bossReport.victory?'':'od4-defeat')} role="status">
 <MonsterArt id={({'セキュリティ':'cerberus','耐障害性':'phoenix','パフォーマンス':'titan','コスト最適化':'leviathan'} as const)[bossReport.domain]} small defeated={bossReport.victory} hpRatio={bossReport.victory?0:1}/><Trophy size={37}/><div><strong>{bossReport.victory?'DOMAIN BOSS DOWN! · '+bossReport.grade:'BOSS SURVIVED · TRY AGAIN'}</strong>
 <span>{bossReport.domain} · {session.correct}/{session.total} 正解 {bossReport.victory?'· '+(bossReport.firstClear?'初討伐':bossReport.upgraded?'勲章更新':'討伐記録更新')+' · BONUS +'+bossReport.award+' XP':'· 7問以上の正解で討伐'}</span></div>
 </div>}
 {expeditionMode&&expeditionResult&&<div className="expedition-result" role="status"><Trophy size={21}/><strong>{expeditionResult.success?'EXPEDITION CLEAR':'EXPEDITION INCOMPLETE'} · {expeditionResult.rareUnlocked?'✦ RARE EMBLEM UNLOCKED':expeditionResult.firstClear?'初討伐達成':session.correct+'/5 正解'}</strong><span>2問以上の翌日以降の復習成功でレアエンブレム。追加XPはありません。</span></div>}
 {bossMode&&bossReport?.firstClear&&<div className="od4-relic-drop" role="status"><Trophy size={21}/> NEW RELIC UNLOCKED · {BOSSES.find(x=>x.domain===bossReport.domain)?.code} CORE</div>}
 <p>{examMode?`PRACTICE ACCURACY ${session.total?Math.round(session.correct/session.total*100):0}% · NOT AN AWS SCALED SCORE`:bossMode&&bossReport?.victory?'BOSS DEFEATED!':session.correct===session.total?'FLAWLESS VICTORY!':'REVIEW. RETRY. OVERDRIVE.'}</p>{examMode&&(newTitleIds.length>0||newRelicIds.length>0)&&<div className="exam-earned-titles" role="status"><Trophy size={20}/><span>称号 {newTitleIds.length}個 · レリック {newRelicIds.length}個を解放</span><button type="button" onClick={()=>showMenu('titles')}>獲得称号を見る <ArrowRight size={16}/></button></div>}{dailyFocus&&dailyFiveSummary&&<DailyFiveFinish correct={dailyFiveSummary.correct} total={dailyFiveSummary.answered} missed={dailyFiveSummary.missed.length} domains={dailyFiveSummary.uniqueDomains} due={dailyFiveSummary.observedDue} newConcepts={dailyFiveSummary.newConcepts} nextDay={dailyFiveSummary.suggestedDay} onExit={()=>setMode("home")} onMore={()=>start(false)}/>}{examMode&&<ExamReviewPanel questions={pool} answers={sessionAnswers} createPrompt={makeChatGPTPrompt} renderTerms={item=><TermsPanel question={item}/>}/>} {!dailyFocus&&<div className="hero-actions"><button className="primary-btn" onClick={()=>start(review,examMode,studyMode==='due',bossMode,caseMode,bossDomain??undefined,skillFocus??undefined,adaptiveMode,retentionMode?(pool.length<=5?5:10):undefined,expeditionMode??undefined)}>RETRY MISSION <RotateCcw size={18}/></button><button className="secondary-btn" onClick={()=>setMode('home')}>BACK TO BASE</button></div>}</section>}</main>
  <footer>© 2026 CERT//OVERDRIVE <span>BUILT FOR THE GRIND · POWERED BY KNOWLEDGE</span></footer>
  {burst>0&&!reduced&&<div className="burst" key={burst} aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{'--angle':`${i*15}deg`,'--distance':`${70+i%5*22}px`,'--hue':`${i*17+180}`} as React.CSSProperties}/>)}</div>}
 </div>
}
registerOffline();
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);

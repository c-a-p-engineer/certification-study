import {useRef,useState} from 'react';
import type {BossDomain,BossGrade} from './bossCampaign.ts';
import type {DailyFocusType} from './dailyFive.ts';
import type {ExpeditionId,ExpeditionResult} from './expeditions.ts';

/** Session-state boundary: no grading, persistent writes, rewards or browser effects. */
export function useQuizSessionState(createChoiceOrder:()=>number[]){
 const [index,setIndex]=useState(0);
 const [selected,setSelected]=useState<number|null>(null);
 const [multiChoices,setMultiChoices]=useState<number[]>([]);
 const [choiceOrder,setChoiceOrder]=useState<number[]>(createChoiceOrder);
 const [combo,setCombo]=useState(0);
 const [mode,setMode]=useState<'home'|'quiz'|'result'>('home');
 const [session,setSession]=useState({correct:0,total:0});
 const [sessionAnswers,setSessionAnswers]=useState<Record<string,number[]>>({});
 const [review,setReview]=useState(false);
 const [domain,setDomain]=useState('ALL');
 const [missionLength,setMissionLength]=useState(10);
 const [studyMode,setStudyMode]=useState<'normal'|'due'>('normal');
 const [recallFirst,setRecallFirst]=useState(false);
 const [showChoices,setShowChoices]=useState(true);
 const [reflection,setReflection]=useState<string>('');
 const [examMode,setExamMode]=useState(false);
 const [bossMode,setBossMode]=useState(false);
 const [bossDomain,setBossDomain]=useState<BossDomain|null>(null);
 const [skillFocus,setSkillFocus]=useState<string|null>(null);
 const [bossReport,setBossReport]=useState<null|{domain:BossDomain;victory:boolean;grade:BossGrade|null;award:number;firstClear:boolean;upgraded:boolean}>(null);
 const finishing=useRef(false);
 const [caseMode,setCaseMode]=useState(false);
 const [adaptiveMode,setAdaptiveMode]=useState(false);
 const [retentionMode,setRetentionMode]=useState(false);
 const [dailyFocus,setDailyFocus]=useState(false);
 const [dailyTypes,setDailyTypes]=useState<Record<string,DailyFocusType>>({});
 const [retentionBonus,setRetentionBonus]=useState(0);
 const [expeditionMode,setExpeditionMode]=useState<ExpeditionId|null>(null);
 const [expeditionProof,setExpeditionProof]=useState<string[]>([]);
 const [expeditionResult,setExpeditionResult]=useState<ExpeditionResult|null>(null);
 return {index,setIndex,selected,setSelected,multiChoices,setMultiChoices,choiceOrder,setChoiceOrder,combo,setCombo,mode,setMode,session,setSession,sessionAnswers,setSessionAnswers,review,setReview,domain,setDomain,missionLength,setMissionLength,studyMode,setStudyMode,recallFirst,setRecallFirst,showChoices,setShowChoices,reflection,setReflection,examMode,setExamMode,bossMode,setBossMode,bossDomain,setBossDomain,skillFocus,setSkillFocus,bossReport,setBossReport,finishing,caseMode,setCaseMode,adaptiveMode,setAdaptiveMode,retentionMode,setRetentionMode,dailyFocus,setDailyFocus,dailyTypes,setDailyTypes,retentionBonus,setRetentionBonus,expeditionMode,setExpeditionMode,expeditionProof,setExpeditionProof,expeditionResult,setExpeditionResult};
}

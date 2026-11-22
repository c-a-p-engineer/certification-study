import type {StudyQuestion} from '../StudyQuestionIntro.tsx';
import {shuffled,validQuestion,DOMAINS} from './planner.ts';

export type ArcadeKind='quest'|'blitz';
export type QuestSkill='amplifier'|'shield'|'combo';
export type QuestRoute={id:string;title:string;description:string;domain?:string};
export type QuestProgress={hp:number;score:number;streak:number;maxStreak:number;stage:number;skills:QuestSkill[];cleared:boolean;failed:boolean};
export type ArcadeResult={score:number;correct:number;answered:number;streak:number;maxStreak:number;missed:string[]};
export const QUEST_STAGE_SIZE=5;
export const QUEST_STAGES=3;
export const BLITZ_SECONDS=90;
export const QUEST_SKILLS:{id:QuestSkill;title:string;description:string}[]=[
 {id:'amplifier',title:'オーバードライブ',description:'正解時のランスコアとゲーム内攻撃ダメージが1.5倍'},
 {id:'shield',title:'リカバリープロトコル',description:'ランHPの誤答ダメージが15→8に軽減'},
 {id:'combo',title:'連鎖増幅器',description:'3連続正解以上のランスコアを追加強化'}
];
export const QUEST_ROUTES:readonly [QuestRoute,QuestRoute][]=[
 [{id:'security',title:'シールドゲート',description:'セキュリティの知識に挑戦',domain:'セキュリティ'},
  {id:'resilience',title:'リカバリー回廊',description:'耐障害性の知識に挑戦',domain:'耐障害性'}],
 [{id:'performance',title:'スピードトンネル',description:'パフォーマンスを攻略',domain:'パフォーマンス'},
  {id:'cost',title:'コストの迷宮',description:'最適化の判断に挑戦',domain:'コスト最適化'}]
];
export function arcadeEligible(q:StudyQuestion):boolean{
 return !!q&&validQuestion(q)&&q.question.length<=130&&!q.answers&&q.choices.length===4&&
  q.choices.every(choice=>choice.trim().length>0&&choice.length<=110);
}
export function blitzDeck(bank:readonly StudyQuestion[],seenIds:readonly string[],seed:number,cap=25):StudyQuestion[]{
 const seen=new Set(seenIds),ids=new Set<string>();
 const candidates=bank.filter(q=>{if(!arcadeEligible(q)||ids.has(q.id))return false;ids.add(q.id);return true});
 return [...shuffled(candidates.filter(q=>seen.has(q.id)),seed),...shuffled(candidates.filter(q=>!seen.has(q.id)),seed+1)].slice(0,cap);
}
export function questDeck(bank:readonly StudyQuestion[],route:QuestRoute,seed:number,used:readonly string[]):StudyQuestion[]{
 const ids=new Set(used),uniq=new Set<string>();
 const candidates=bank.filter(q=>{if(!q||!validQuestion(q)||ids.has(q.id)||uniq.has(q.id))return false;uniq.add(q.id);return true});
 const preferred=route.domain?candidates.filter(q=>q.domain===route.domain):candidates.filter(q=>DOMAINS.includes(q.domain as typeof DOMAINS[number]));
 const first=shuffled(preferred,seed);
 return [...first,...shuffled(candidates.filter(q=>!preferred.includes(q)),seed+100)].slice(0,QUEST_STAGE_SIZE);
}
export function startQuest():QuestProgress{return {hp:100,score:0,streak:0,maxStreak:0,stage:0,skills:[],cleared:false,failed:false}}
export function applyQuestAnswer(state:QuestProgress,correct:boolean):QuestProgress{
 if(state.cleared||state.failed)return state;
 const streak=correct?state.streak+1:0;
 const damage=state.skills.includes('shield')?8:15;
 const base=correct?100:0;
 const bonus=correct&&streak>=3?40:0;
 const factor=state.skills.includes('amplifier')?1.5:1;
 const chainFactor=state.skills.includes('combo')&&streak>=3?1.5:1;
 const increment=Math.round((base+bonus)*factor*chainFactor);
 const hp=correct?state.hp:Math.max(0,state.hp-damage);
 return {...state,hp,score:state.score+increment,streak,maxStreak:Math.max(state.maxStreak,streak),failed:hp===0};
}
export function grantQuestSkill(state:QuestProgress,skill:QuestSkill):QuestProgress{
 if(state.failed||state.cleared||state.stage>=QUEST_STAGES-1||state.skills.includes(skill))return state;
 return {...state,skills:[...state.skills,skill],stage:state.stage+1};
}
export function reachQuestBoss(state:QuestProgress):QuestProgress{
 if(state.failed||state.cleared||state.stage!==1)return state;
 return {...state,stage:2};
}
export function finishQuest(state:QuestProgress):QuestProgress{
 return state.failed||state.stage!==2?state:{...state,cleared:true};
}
export function blitzPoints(correct:boolean,streak:number,elapsedSeconds:number):number{
 if(!correct)return 0;
 const speed=Math.max(0,30-Math.floor(Math.max(0,elapsedSeconds)));
 return 100+Math.min(10,Math.max(0,streak))*20+speed;
}
export function blitzAllowed(deadline:number,at:number,previouslyAnswered:boolean):boolean{
 return !previouslyAnswered&&Number.isFinite(deadline)&&at<deadline;
}

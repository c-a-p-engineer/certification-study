/** Local-only RPG progression; rank reflects sustained answers AND active study days. */
import {activitySummary,migrateActivity,localDateKey,type ActivityHistory} from './studyHistory.ts';
export type ProfileInput={
 xp:number;answered:number;correct:number;best:number;
 reviews:Record<string,{streak:number;dueAt:number;lapses:number}>;
 mistakes:string[];
 daily?:{date:string;answered:number;correct:number;claimed?:boolean};
 activity?:ActivityHistory;
};
export const RANKS=[
 {name:'ROOKIE',subtitle:'駆け出しの探究者',minXP:0,minAnswers:0,minDays:0},
 {name:'SPARK',subtitle:'覚醒の火花',minXP:300,minAnswers:3,minDays:1},
 {name:'SCOUT',subtitle:'クラウド斥候',minXP:700,minAnswers:6,minDays:1},
 {name:'BRONZE',subtitle:'青銅の挑戦者',minXP:1000,minAnswers:8,minDays:1},
 {name:'SEEKER',subtitle:'知識の探索者',minXP:1700,minAnswers:12,minDays:2},
 {name:'NAVIGATOR',subtitle:'雲路の航海士',minXP:2600,minAnswers:18,minDays:2},
 {name:'SILVER',subtitle:'白銀の設計士',minXP:4500,minAnswers:30,minDays:3},
 {name:'VANGUARD',subtitle:'先陣のエンジニア',minXP:6500,minAnswers:45,minDays:4},
 {name:'STRATEGIST',subtitle:'戦略の立案者',minXP:9000,minAnswers:65,minDays:5},
 {name:'GOLD',subtitle:'黄金の構築者',minXP:12000,minAnswers:90,minDays:7},
 {name:'ARCHITECT',subtitle:'クラウド建築家',minXP:17000,minAnswers:125,minDays:10},
 {name:'SENTINEL',subtitle:'障害を防ぐ番人',minXP:22000,minAnswers:155,minDays:12},
 {name:'PLATINUM',subtitle:'白金の守護者',minXP:26000,minAnswers:180,minDays:14},
 {name:'PHANTOM',subtitle:'冗長化の幻影',minXP:36000,minAnswers:230,minDays:20},
 {name:'ASCENDANT',subtitle:'極限を越える者',minXP:45000,minAnswers:290,minDays:24},
 {name:'DIAMOND',subtitle:'金剛の達人',minXP:55000,minAnswers:350,minDays:28},
 {name:'PARAGON',subtitle:'理想設計の体現者',minXP:70000,minAnswers:450,minDays:35},
 {name:'MYTHIC',subtitle:'伝説へ挑む者',minXP:90000,minAnswers:575,minDays:42},
 {name:'LEGEND',subtitle:'雲界の伝説',minXP:120000,minAnswers:700,minDays:50},
] as const;

export function gameProfile(progress:ProfileInput,totalQuestions:number,now=Date.now()){
 const xp=Math.max(0,Math.floor(progress.xp||0));
 const answered=Math.max(0,Math.floor(progress.answered||0));
 const level=Math.floor(Math.sqrt(xp/120))+1;
 const levelStart=120*(level-1)**2,nextLevelXP=120*level**2;
 const levelPct=Math.min(100,Math.round((xp-levelStart)/(nextLevelXP-levelStart)*100));
 const activity=activitySummary(progress.activity??migrateActivity(progress),answered,progress.correct,localDateKey(new Date(now)));
 const ranked=[...RANKS].reverse().find(t=>xp>=t.minXP&&answered>=t.minAnswers&&activity.activeDays>=t.minDays)??RANKS[0];
 const currentIndex=RANKS.findIndex(t=>t.name===ranked.name);
 const nextRank=RANKS[currentIndex+1]??null;
 const seen=Object.keys(progress.reviews||{}).length;
 const learned=Object.values(progress.reviews||{}).filter(r=>r.streak>=3).length;
 const due=Object.values(progress.reviews||{}).filter(r=>r.dueAt<=now).length;
 const accuracy=answered?Math.round(progress.correct/answered*100):0;
 const achievements=[
  {id:'first',label:'FIRST BLOOD',description:'1問解答',unlocked:answered>=1,icon:'✦'},
  {id:'combo',label:'COMBO BREAKER',description:'5連続正解',unlocked:progress.best>=5,icon:'⚡'},
  {id:'grind',label:'GRIND MACHINE',description:'累計50問',unlocked:answered>=50,icon:'◆'},
  {id:'explorer',label:'KNOWLEDGE HUNTER',description:'初見50問',unlocked:seen>=50,icon:'◈'},
  {id:'scholar',label:'MEMORY MASTER',description:'定着30問',unlocked:learned>=30,icon:'✺'},
  {id:'legend',label:'OVERDRIVE LEGEND',description:'LEGENDランク',unlocked:ranked.name==='LEGEND',icon:'★'}
 ];
 return {xp,answered,level,levelStart,nextLevelXP,levelPct,rank:ranked.name,rankSubtitle:ranked.subtitle,rankIndex:currentIndex,nextRank:nextRank?.name??null,nextRankSubtitle:nextRank?.subtitle??null,
  rankGoal:nextRank?{xp:nextRank.minXP,answers:nextRank.minAnswers,days:nextRank.minDays}:null,
  xpToNextRank:nextRank?Math.max(0,nextRank.minXP-xp):0,
  answersToNextRank:nextRank?Math.max(0,nextRank.minAnswers-answered):0,
  daysToNextRank:nextRank?Math.max(0,nextRank.minDays-activity.activeDays):0,
  activity,activeDays:activity.activeDays,currentStreak:activity.streak,
  seen,learned,due,accuracy,questionCoverage:totalQuestions?Math.min(100,Math.round(seen/totalQuestions*100)):0,
  achievements,unlockedAchievements:achievements.filter(x=>x.unlocked).length,allAchievements:achievements.length
 };
}

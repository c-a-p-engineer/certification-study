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
 {name:'ROOKIE',minXP:0,minAnswers:0,minDays:0},
 {name:'BRONZE',minXP:1000,minAnswers:8,minDays:1},
 {name:'SILVER',minXP:4500,minAnswers:30,minDays:3},
 {name:'GOLD',minXP:12000,minAnswers:90,minDays:7},
 {name:'PLATINUM',minXP:26000,minAnswers:180,minDays:14},
 {name:'DIAMOND',minXP:55000,minAnswers:350,minDays:28},
 {name:'LEGEND',minXP:120000,minAnswers:700,minDays:50}
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
 return {xp,answered,level,levelStart,nextLevelXP,levelPct,rank:ranked.name,nextRank:nextRank?.name??null,
  rankGoal:nextRank?{xp:nextRank.minXP,answers:nextRank.minAnswers,days:nextRank.minDays}:null,
  xpToNextRank:nextRank?Math.max(0,nextRank.minXP-xp):0,
  answersToNextRank:nextRank?Math.max(0,nextRank.minAnswers-answered):0,
  daysToNextRank:nextRank?Math.max(0,nextRank.minDays-activity.activeDays):0,
  activity,activeDays:activity.activeDays,currentStreak:activity.streak,
  seen,learned,due,accuracy,questionCoverage:totalQuestions?Math.min(100,Math.round(seen/totalQuestions*100)):0,
  achievements,unlockedAchievements:achievements.filter(x=>x.unlocked).length,allAchievements:achievements.length
 };
}

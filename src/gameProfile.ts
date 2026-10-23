/** Arcade stats computed from saved progress, not estimated AWS pass probabilities. */
export type ProfileInput={xp:number;answered:number;correct:number;best:number;reviews:Record<string,{streak:number;dueAt:number;lapses:number}>;mistakes:string[];daily?:{answered:number;correct:number;claimed?:boolean}};
export const RANKS=[{name:'ROOKIE',min:0},{name:'GOLD',min:400},{name:'PLATINUM',min:1000},{name:'DIAMOND',min:2500},{name:'LEGEND',min:5000}] as const;
export function gameProfile(progress:ProfileInput,totalQuestions:number,now=Date.now()){
 const xp=Math.max(0,Math.floor(progress.xp||0));
 const level=Math.floor(Math.sqrt(xp/120))+1;
 const levelStart=120*(level-1)**2,nextLevelXP=120*level**2;
 const levelPct=Math.min(100,Math.round((xp-levelStart)/(nextLevelXP-levelStart)*100));
 const ranked=[...RANKS].reverse().find(rank=>xp>=rank.min)??RANKS[0];
 const nextRank=RANKS.find(rank=>rank.min>xp);
 const seen=Object.keys(progress.reviews||{}).filter(id=>typeof id==='string').length;
 const learned=Object.values(progress.reviews||{}).filter(r=>r.streak>=3).length;
 const due=Object.values(progress.reviews||{}).filter(r=>r.dueAt<=now).length;
 const accuracy=progress.answered?Math.round(progress.correct/progress.answered*100):0;
 const achievements=[
  {id:'first',label:'FIRST BLOOD',description:'1問解答',unlocked:progress.answered>=1,icon:'✦'},
  {id:'combo',label:'COMBO BREAKER',description:'5連続正解',unlocked:progress.best>=5,icon:'⚡'},
  {id:'grind',label:'GRIND MACHINE',description:'累計50問',unlocked:progress.answered>=50,icon:'◆'},
  {id:'explorer',label:'KNOWLEDGE HUNTER',description:'初見50問',unlocked:seen>=50,icon:'◈'},
  {id:'scholar',label:'MEMORY MASTER',description:'定着30問',unlocked:learned>=30,icon:'✺'},
  {id:'legend',label:'OVERDRIVE LEGEND',description:'5000 XP',unlocked:xp>=5000,icon:'★'}
 ];
 return {xp,level,levelStart,nextLevelXP,levelPct,rank:ranked.name,nextRank:nextRank?.name??null,xpToNextRank:nextRank?nextRank.min-xp:0,seen,learned,due,accuracy,questionCoverage:totalQuestions?Math.min(100,Math.round(seen/totalQuestions*100)):0,achievements,unlockedAchievements:achievements.filter(x=>x.unlocked).length,allAchievements:achievements.length};
}

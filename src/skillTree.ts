/** Derived skill tree: no new XP-based proficiency claims or migration needed. */
import {TOPICS,masteryByTopic,topicFor,type TopicName,type MasteryEntry} from './mastery.ts';
export type SkillTier=0|1|2|3;
export const SKILL_STAGES=[
 {name:'未探索',label:'HIDDEN',seen:0,retained:0},
 {name:'発見',label:'DISCOVERED',seen:1,retained:0},
 {name:'訓練中',label:'TRAINING',seen:4,retained:1},
 {name:'定着候補',label:'ASCENDED',seen:8,retained:4}
] as const;
export type SkillNode=MasteryEntry&{
 name:TopicName;poolSize:number;tier:SkillTier;progress:number;nextSeen:number;nextRetained:number
};
export type SkillQuestion={id:string;question:string;choices:string[];explanation:string;tags?:string[]};
export function skillTier(entry:Pick<MasteryEntry,'seen'|'retained'>):SkillTier{
 const seen=Math.max(0,entry.seen||0),retained=Math.max(0,Math.min(seen,entry.retained||0));
 if(seen>=8&&retained>=4)return 3;
 if(seen>=4&&retained>=1)return 2;
 if(seen>=1)return 1;
 return 0;
}
export function buildSkillTree(questions:readonly SkillQuestion[],reviews:Record<string,{streak:number;lapses:number;dueAt:number}>,now=Date.now()):SkillNode[]{
 const stats=masteryByTopic(questions,reviews,now);
 const counts=Object.fromEntries(TOPICS.map(t=>[t.name,0])) as Record<TopicName,number>;
 for(const question of questions)counts[topicFor(question)]++;
 return TOPICS.map(topic=>{
  const item=stats[topic.name],tier=skillTier(item),next=SKILL_STAGES[Math.min(tier+1,3)];
  const seenProgress=next.seen?Math.min(1,item.seen/next.seen):1;
  const retainedProgress=next.retained?Math.min(1,item.retained/next.retained):1;
  return {...item,name:topic.name,poolSize:counts[topic.name],tier,
   progress:tier===3?100:Math.round(Math.min(seenProgress,retainedProgress)*100),
   nextSeen:next.seen,nextRetained:next.retained};
 });
}

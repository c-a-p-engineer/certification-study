/** A balanced mix of distinct knowledge tasks; explanation is preserved per question. */
import {selectAdaptive,type AdaptiveContext} from './adaptiveQuest.ts';
import {isScenarioQuestion,type SelectableQuestion} from './questionSelection.ts';
export type SmartProfile='balanced'|'review'|'explore';
export type SmartCategory='due'|'recovery'|'unseen'|'challenge';
export type SmartPlan<T>={questions:T[];reasons:Record<string,string>;counts:Record<SmartCategory,number>;targets:Record<SmartCategory,number>};
export const SMART_PROFILE_KEY='cert-overdrive-smart-profile-v1';
const configs:Record<SmartProfile,[number,number,number,number]>={
 balanced:[.3,.2,.3,.2],review:[.45,.3,.15,.1],explore:[.15,.1,.5,.25]
};
export const SMART_LABELS:Record<SmartCategory,string>={due:'復習期限',recovery:'苦手克服',unseen:'初見攻略',challenge:'設計判断・弱点補強'};
export function readSmartProfile():SmartProfile{
 try{const x=localStorage.getItem(SMART_PROFILE_KEY);return x==='review'||x==='explore'?x:'balanced'}catch{return 'balanced'}
}
export function writeSmartProfile(value:SmartProfile){try{localStorage.setItem(SMART_PROFILE_KEY,value)}catch{}}
export function smartTargets(count:number,profile:SmartProfile):Record<SmartCategory,number>{
 const n=Math.max(0,Math.floor(count)),weights=configs[profile],raw=weights.map(w=>w*n),floor=raw.map(Math.floor);
 const remainder=n-floor.reduce((a,b)=>a+b,0);
 const order=raw.map((v,i)=>({i,f:v-floor[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);
 for(let i=0;i<remainder;i++)floor[order[i%order.length].i]++;
 return {due:floor[0],recovery:floor[1],unseen:floor[2],challenge:floor[3]};
}
export function planSmartQuest<T extends SelectableQuestion>(items:readonly T[],count:number,context:AdaptiveContext,profile:SmartProfile='balanced'):SmartPlan<T>{
 const targets=smartTargets(count,profile),now=context.now??Date.now(),reviews=context.reviews??{},mistakes=new Set(context.mistakes);
 const buckets:Record<SmartCategory,T[]>={due:[],recovery:[],unseen:[],challenge:[]};
 const weak=(d:string)=>{const entry=context.domains[d];return !!entry&&entry.answered>=4&&entry.correct/entry.answered<.7};
 for(const item of items){
  if(reviews[item.id]?.dueAt<=now)buckets.due.push(item);
  else if(mistakes.has(item.id))buckets.recovery.push(item);
  else if(!reviews[item.id])buckets.unseen.push(item);
  if(isScenarioQuestion(item)||weak(item.domain))buckets.challenge.push(item);
 }
 const picked:T[]=[],reasons:Record<string,string>={},used=new Set<string>();
 const select=(kind:SmartCategory,limit:number)=>{
  const options=buckets[kind].filter(x=>!used.has(x.id));
  const next=selectAdaptive(options,limit,{...context,recent:new Set([...context.recent,...used])});
  for(const item of next){picked.push(item);used.add(item.id);reasons[item.id]=SMART_LABELS[kind]}
 };
 const kinds:SmartCategory[]=['due','recovery','unseen','challenge'];
 for(const kind of kinds)select(kind,Math.max(0,targets[kind]));
 const lacking=Math.max(0,Math.min(count,items.length)-picked.length);
 if(lacking){
  const extra=selectAdaptive(items.filter(x=>!used.has(x.id)),lacking,{...context,recent:new Set([...context.recent,...used])});
  for(const item of extra){
   picked.push(item);used.add(item.id);
   reasons[item.id]=reviews[item.id]?.dueAt<=now?SMART_LABELS.due:mistakes.has(item.id)?SMART_LABELS.recovery:!reviews[item.id]?SMART_LABELS.unseen:SMART_LABELS.challenge;
  }
 }
 const counts={due:0,recovery:0,unseen:0,challenge:0};
 for(const item of picked){const category=kinds.find(k=>SMART_LABELS[k]===reasons[item.id])??'challenge';counts[category]++}
 return {questions:picked,reasons,counts,targets};
}

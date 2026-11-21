import {CONCEPTS} from '../termGuide.ts';
import {shuffled} from './planner.ts';
export type CodeTerm={id:string;title:string;meaning:string;note:string;reading:string};
export type CodePuzzle={day:string;clues:CodeTerm[];answers:CodeTerm[]};
export const DAILY_CODE_KEY='cert-overdrive-daily-code-bests-v1';
/** Hand-curated contrasting concepts, not a random mix of near-synonymous terms. */
export const DAILY_CODE_SETS:readonly (readonly string[])[]=[
 ['ec2','s3','cloudwatch','route53'],
 ['lambda','sqs','sns','eventbridge'],
 ['rds','dynamodb','efs','ebs'],
 ['cloudtrail','config','guardduty','waf'],
 ['secrets','budgets','costexplorer','backup'],
 ['ecs','fargate','api-gateway','athena'],
 ['nat','privatelink','cloudfront','stepfunctions']
];
export function dateHash(day:string):number{
 let value=2166136261;
 for(let i=0;i<day.length;i++){value=Math.imul(value^day.charCodeAt(i),16777619)}
 return value>>>0;
}
export function dailyCodePuzzle(day:string):CodePuzzle{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('Invalid local date');
 const seed=dateHash(day),ids=DAILY_CODE_SETS[seed%DAILY_CODE_SETS.length];
 const selected=ids.map(id=>{
  const term=CONCEPTS.find(c=>c.id===id);
  if(!term||!term.meaning||!term.note)throw new Error('Missing curated term: '+id);
  return {id:term.id,title:term.title,meaning:term.meaning,note:term.note,reading:term.reading};
 });
 return {day,clues:shuffled(selected,seed+1),answers:shuffled(selected,seed+7)};
}
export function dailyMatchResult(clueId:string,answerId:string,completed:readonly string[]):'already'|'correct'|'wrong'{
 if(completed.includes(clueId)||completed.includes(answerId))return 'already';
 return clueId===answerId?'correct':'wrong';
}
export function dailyCodeScore(mistakes:number):number{
 return Math.max(0,400-Math.max(0,Math.floor(mistakes))*25);
}
export function readDailyBest(day:string,storage:Pick<Storage,'getItem'>|null):number{
 try{const saved=JSON.parse(storage?.getItem(DAILY_CODE_KEY)??'{}') as Record<string,unknown>;const value=saved[day];return typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?value:0}catch{return 0}
}
export function writeDailyBest(day:string,score:number,storage:Pick<Storage,'getItem'|'setItem'>):void{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isSafeInteger(score)||score<0)return;
 const existing=storage.getItem(DAILY_CODE_KEY);
 let saved:Record<string,number>={};try{const parsed=JSON.parse(existing??'{}');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))saved=parsed}catch{}
 saved[day]=Math.max(readDailyBest(day,storage),score);
 const keys=Object.keys(saved).filter(key=>/^\d{4}-\d{2}-\d{2}$/.test(key)).sort().slice(-60);
 storage.setItem(DAILY_CODE_KEY,JSON.stringify(Object.fromEntries(keys.map(key=>[key,saved[key]]))));
}

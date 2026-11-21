import {CONCEPTS} from '../termGuide.ts';
import {shuffled} from './planner.ts';
export type CodeTerm={id:string;title:string;meaning:string;note:string;reading:string};
export type CodePuzzle={day:string;setId:number;clues:CodeTerm[];answers:CodeTerm[]};
export const DAILY_CODE_KEY='cert-overdrive-daily-code-bests-v1';
/** Hand-curated contrasting concepts, not a random mix of near-synonymous terms. */
export const DAILY_CODE_SETS:readonly (readonly string[])[]=[
 ['ec2','s3','cloudwatch','route53'],
 ['lambda','sqs','sns','eventbridge'],
 ['rds','dynamodb','efs','ebs'],
 ['cloudtrail','config','guardduty','waf'],
 ['secrets','budgets','costexplorer','backup'],
 ['ecs','fargate','api-gateway','athena'],
 ['nat','privatelink','cloudfront','stepfunctions'],
 ['ec2','lambda','ecs','eks'],
 ['s3','efs','ebs','datasync'],
 ['rds','aurora','dynamodb','dax'],
 ['cloudwatch','cloudtrail','config','inspector'],
 ['guardduty','macie','waf','secrets'],
 ['organizations','identitycenter','budgets','costexplorer'],
 ['nat','privatelink','route53','cloudfront'],
 ['sqs','sns','eventbridge','stepfunctions'],
 ['api-gateway','lambda','fargate','ecs'],
 ['backup','datasync','s3','efs'],
 ['savingsplans','costexplorer','budgets','dynamodb'],
 ['athena','s3','dax','aurora'],
 ['eks','ecs','fargate','ec2'],
 ['rds','backup','secrets','waf'],
 ['macie','guardduty','inspector','cloudtrail'],
 ['sqs','eventbridge','stepfunctions','api-gateway'],
 ['route53','cloudfront','waf','api-gateway'],
 ['rds','efs','athena','s3'],
 ['ec2','ebs','lambda','dynamodb'],
 ['organizations','identitycenter','config','guardduty'],
 ['sns','sqs','lambda','cloudwatch'],
 ['costexplorer','savingsplans','budgets','backup'],
 ['stepfunctions','eventbridge','cloudtrail','config'],
 ['datasync','backup','macie','athena'],
 ['efs','ebs','dax','cloudfront'],
 ['route53','api-gateway','s3','fargate'],
 ['privatelink','nat','organizations','identitycenter'],
 ['eks','dax','secrets','inspector'],
 ['rds','dax','secrets','cloudtrail'],
 ['ec2','s3','route53','lambda'],
 ['waf','cloudfront','api-gateway','eventbridge'],
 ['s3','dynamodb','athena','cloudwatch'],
 ['savingsplans','fargate','backup','macie'],
 ['guardduty','cloudtrail','organizations','nat']
];
export function dateHash(day:string):number{
 let value=2166136261;
 for(let i=0;i<day.length;i++){value=Math.imul(value^day.charCodeAt(i),16777619)}
 return value>>>0;
}
/**
 * Sattolo's shuffle produces one cycle of length N: no item remains
 * at its original index. This prevents the positional shortcut where
 * tapping row 1→1, 2→2, etc. solves the matching puzzle without recall.
 * The seed is date-derived so today's puzzle stays the same on reload.
 */
export function derangedDailyAnswers<T>(clues:readonly T[],seed:number):T[]{
 const result=[...clues];
 if(result.length<2)throw new Error('Matching game requires at least two cards');
 let state=((seed>>>0)^0x9e3779b9)>>>0||1;
 const next=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296};
 for(let i=result.length-1;i>0;i--){
  const j=Math.floor(next()*i);
  [result[i],result[j]]=[result[j],result[i]];
 }
 return result;
}
export function codePuzzleFromSet(day:string,setId:number,seed:number):CodePuzzle{
 const ids=DAILY_CODE_SETS[setId];
 if(!ids||ids.length!==4||new Set(ids).size!==4)throw new Error('Invalid curated set '+setId);
 const selected=ids.map(id=>{
  const term=CONCEPTS.find(c=>c.id===id&&c.category==='AWSサービス');
  if(!term||!term.meaning||!term.note)throw new Error('Missing curated term: '+id);
  return {id:term.id,title:term.title,meaning:term.meaning,note:term.note,reading:term.reading};
 });
 const clues=shuffled(selected,seed+1);
 return {day,setId,clues,answers:derangedDailyAnswers(clues,seed+7)};
}
/** Daily challenge stays stable; the random arcade uses another entry point. */
export function dailyCodePuzzle(day:string):CodePuzzle{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('Invalid local date');
 const seed=dateHash(day);
 return codePuzzleFromSet(day,seed%DAILY_CODE_SETS.length,seed);
}
/**
 * Choose among the least-repeated candidate sets. Prefer unseen sets and
 * previously unused terms, so the next four answers are genuinely new.
 */
export function randomCodePuzzle(
 day:string,
 seed:number,
 recentSetIds:readonly number[]=[],
 recentTermIds:readonly string[]=[]
):CodePuzzle{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(seed))throw new Error('Invalid random puzzle input');
 const unseen=DAILY_CODE_SETS.map((_,i)=>i).filter(i=>!recentSetIds.includes(i));
 const candidates=unseen.length?unseen:DAILY_CODE_SETS.map((_,i)=>i);
 const seenTerms=new Set(recentTermIds);
 let bestOverlap=Infinity;
 const scored:number[]=[];
 for(const i of candidates){
  const overlap=DAILY_CODE_SETS[i].filter(id=>seenTerms.has(id)).length;
  if(overlap<bestOverlap){bestOverlap=overlap;scored.length=0}
  if(overlap===bestOverlap)scored.push(i);
 }
 const chosen=shuffled(scored,seed>>>0)[0];
 if(chosen===undefined)throw new Error('No curated puzzle candidates');
 return codePuzzleFromSet(day,chosen,seed);
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

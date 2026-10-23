/** Quiz pool curator. Prefer unseen, scenario-rich questions and avoid service/topic repetition.
 * Pure selector and safe local session history; never changes or deletes answers.
 */
export type SelectableQuestion={
 id:string;domain:string;question:string;tags?:string[];answers?:number[];
 distractorReasons?:string[];difficulty?:number
};
export const RECENT_QUESTIONS_KEY='cert-overdrive-recent-questions-v1';
const SERVICE_RE=/\b(?:Amazon\s+)?(?:S3|EC2|RDS|EBS|EFS|SQS|SNS|DAX|IAM|VPC|KMS|ALB|NLB|NAT|CloudFront|CloudTrail|CloudWatch|Lambda|Aurora|DynamoDB|Route\s*53|Fargate|Redshift|Athena|Step\s*Functions|WAF|AWS\s+Backup|ECS|EKS|Secrets\s*Manager)\b/ig;
const genericTags=new Set(['シナリオ','複合設計判断','設計判断','サービス比較','本試験形式','サービス選定','応用','要件理解','実務判断','アーキテクチャ判断','複数選択']);
export function serviceTopics(question:SelectableQuestion):string[]{
 const names=new Set([...question.question.matchAll(SERVICE_RE)].map(x=>x[0].toLowerCase().replace(/\s+/g,'')));
 for(const tag of question.tags??[])if(!genericTags.has(tag))names.add(tag);
 return [...names];
}
export function isScenarioQuestion(question:SelectableQuestion):boolean{
 return (question.tags?.includes('複合設計判断')??false)&&question.question.length>=90&&question.distractorReasons!==undefined;
}
export function selectVaried<T extends SelectableQuestion>(questions:readonly T[],count:number,seen:ReadonlySet<string>=new Set(),recent:ReadonlySet<string>=new Set(),random:()=>number=Math.random):T[]{
 if(count<=0)return [];
 const pool=questions.map(question=>({question,random:random(),themes:serviceTopics(question)}));
 const picked:T[]=[],themeFrequency=new Map<string,number>(),domainFrequency=new Map<string,number>();
 while(pool.length&&picked.length<count){
  let bestIndex=0,bestScore=-Infinity;
  for(let i=0;i<pool.length;i++){
   const {question,random:rand,themes}=pool[i];
   const counts=themes.reduce((total,x)=>total+(themeFrequency.get(x)??0),0);
   const domainCount=domainFrequency.get(question.domain)??0;
   const score=(!seen.has(question.id)?500:0)+(isScenarioQuestion(question)?190:0)
    +(question.question.length>=85?35:0)+(question.distractorReasons?30:0)
    -(recent.has(question.id)?650:0)-(counts*110)-(domainCount*10)+rand*40;
   if(score>bestScore){bestScore=score;bestIndex=i}
  }
  const [{question,themes}]=pool.splice(bestIndex,1);
  picked.push(question);
  for(const theme of themes)themeFrequency.set(theme,(themeFrequency.get(theme)??0)+1);
  domainFrequency.set(question.domain,(domainFrequency.get(question.domain)??0)+1);
 }
 return picked;
}
export function readRecentQuestions():string[]{
 try{
  if(typeof localStorage==='undefined')return [];
  const value=JSON.parse(localStorage.getItem(RECENT_QUESTIONS_KEY)||'[]');
  return Array.isArray(value)?value.filter((id:unknown):id is string=>typeof id==='string').slice(-120):[];
 }catch{return []}
}
export function rememberQuestionSelection(ids:readonly string[]):void{
 try{
  if(typeof localStorage==='undefined')return;
  const list=readRecentQuestions();
  const unique=[...new Set([...list,...ids])];
  localStorage.setItem(RECENT_QUESTIONS_KEY,JSON.stringify(unique.slice(-120)));
 }catch{/* private mode */}
}

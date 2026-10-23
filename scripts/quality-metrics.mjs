/** Structural QA only: fuzzy matches are editorial candidates, never automatic deletions. */
export const EXAM_WEIGHTS={'セキュリティ':30,'耐障害性':26,'パフォーマンス':24,'コスト最適化':20};
export const SIMILARITY_CANDIDATE_THRESHOLD=.22;
export const SIMILARITY_STRONG_THRESHOLD=.36;
export const norm=x=>String(x).normalize('NFKC').toLowerCase().replace(/[\s、。？！?!「」『』\-]/g,'');
export const grams=s=>new Set(Array.from({length:Math.max(0,s.length-2)},(_,i)=>s.slice(i,i+3)));
export function similarity(a,b){
 const A=grams(norm(a)),B=grams(norm(b));let intersection=0;
 for(const x of A)if(B.has(x))intersection++;
 return intersection/Math.max(1,A.size+B.size-intersection);
}
export function nearDuplicateCandidates(bank,threshold=SIMILARITY_CANDIDATE_THRESHOLD){
 const candidates=[];
 for(let i=0;i<bank.length;i++)for(let j=i+1;j<bank.length;j++){
  const a=bank[i],b=bank[j];
  if(a.domain!==b.domain)continue;
  const score=similarity(a.question,b.question);
  if(score>=threshold)candidates.push({a:a.id,b:b.id,similarity:Number(score.toFixed(3)),strong:score>=SIMILARITY_STRONG_THRESHOLD,
    note:'Textual similarity only; verify learning objective and correct answer before consolidating'});
 }
 return candidates.sort((a,b)=>b.similarity-a.similarity||a.a.localeCompare(b.a)||a.b.localeCompare(b.b));
}
export function coverageVsGuide(bank,guide=EXAM_WEIGHTS){
 const total=bank.length;
 return Object.fromEntries(Object.entries(guide).map(([domain,weight])=>{
  const count=bank.filter(q=>q.domain===domain).length;
  const percent=total?Number((count/total*100).toFixed(2)):0;
  return [domain,{total:count,bankPercent:percent,examGuidePercent:weight,deltaPoints:Number((percent-weight).toFixed(2)),
   note:'Bank representation is not identical to scored exam weight; adjust only with vetted content'}];
 }));
}
const timeSensitive=/(?:S3|Multi-AZ|Route\s*53|Aurora|CloudFront|Spot|SCP|Snowball|DataSync|Fargate|Savings|DynamoDB|Lambda)/i;
export function qualitySignals(question,{duplicateCount=0,spotChecked=false}={}){
 const reasons=[];
 if(!question.reviewedAt)reasons.push('not independently reviewed');
 if(!Array.isArray(question.distractorReasons))reasons.push('missing per-option rationale');
 if((question.explanation||'').length<65)reasons.push('short explanation');
 if(!Array.isArray(question.tags)||!question.tags.length)reasons.push('missing topic tags');
 if(/(?:必ず|絶対に|すべての場合|常に)/.test(question.explanation||''))reasons.push('absolute claim requires exception check');
 if(timeSensitive.test(question.question))reasons.push('service behavior may be time-sensitive');
 if(duplicateCount)reasons.push('potentially overlapping learning objective');
 const score=(question.reviewedAt?0:18)+(question.distractorReasons?0:16)+(question.explanation?.length>=65?0:9)+
  (question.tags?.length?0:4)+(duplicateCount?Math.min(15,duplicateCount*7):0)+
  (timeSensitive.test(question.question)?8:0)+
  (/(?:必ず|絶対に|すべての場合|常に)/.test(question.explanation||'')?10:0)+
  (question.answers?4:0)-(spotChecked?8:0);
 const priority=score>=50?'P1':score>=27?'P2':'P3';
 return {score,priority,reasons,spotChecked,
  nextAction:!question.distractorReasons?'Check the key and each distractor with official docs; add option rationales':
   !question.reviewedAt?'Independently verify correct/incorrect choices and cited AWS behavior':'Check neighboring questions for overlap and outdated assumptions'};
}

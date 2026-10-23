import {writeFileSync,mkdirSync} from 'node:fs';
import {loadQuestions} from './question-source.mjs';
const bank=loadQuestions();
const norm=x=>String(x).normalize('NFKC').toLowerCase().replace(/[\s、。？！?!「」『』\-]/g,'');
const grams=s=>new Set([...Array(Math.max(0,s.length-2))].map((_,i)=>s.slice(i,i+3)));
const sim=(a,b)=>{const A=grams(norm(a)),B=grams(norm(b));let shared=0;for(const x of A)if(B.has(x))shared++;return shared/Math.max(1,A.size+B.size-shared)};
const suspects=[];
for(let i=0;i<bank.length;i++)for(let j=i+1;j<bank.length;j++){
 if(bank[i].domain!==bank[j].domain)continue;
 const score=sim(bank[i].question,bank[j].question);
 if(score>=.36)suspects.push({a:bank[i].id,b:bank[j].id,similarity:Number(score.toFixed(3))});
}
suspects.sort((a,b)=>b.similarity-a.similarity);
const issues=bank.map(q=>{
 const reasons=[];
 if((q.explanation||'').length<65)reasons.push('short explanation');
 if(!Array.isArray(q.distractorReasons))reasons.push('missing per-option rationale');
 if(!q.reviewedAt)reasons.push('not independently reviewed');
 if(!Array.isArray(q.tags)||!q.tags.length)reasons.push('missing topic tags');
 return reasons.length?{id:q.id,domain:q.domain,reasons}:null;
}).filter(Boolean);
const domains=[...new Set(bank.map(q=>q.domain))];
const domainCoverage=Object.fromEntries(domains.map(domain=>{
 const set=bank.filter(q=>q.domain===domain);
 return [domain,{total:set.length,scenarioRich:set.filter(q=>q.tags?.includes('複合設計判断')&&q.distractorReasons&&q.question.length>=90).length,
  multiResponse:set.filter(q=>Array.isArray(q.answers)).length,independentReviewMissing:set.filter(q=>!q.reviewedAt).length,
  shortExplanation:set.filter(q=>(q.explanation||'').length<65).length,missingOptionRationales:set.filter(q=>!Array.isArray(q.distractorReasons)).length}];
}));
const editorialPriority=issues.map(issue=>({...issue,
 priority:issue.reasons.includes('not independently reviewed')?'P1':issue.reasons.includes('missing per-option rationale')?'P2':'P3',
 nextAction:issue.reasons.includes('not independently reviewed')?'Verify reasoning and each distractor against the linked official AWS document':'Improve option-level rationales before claiming exam fidelity'
}));
const referenceProblems=bank.filter(q=>{try{const u=new URL(q.reference);return u.protocol!=='https:'||u.hostname!=='docs.aws.amazon.com'}catch{return true}})
 .map(q=>({id:q.id,reference:q.reference,reason:'not an AWS official HTTPS documentation URL'}));
const suspiciousExplanations=bank.filter(q=>/(?:必ず|絶対に|すべての場合|常に)/.test(q.explanation||'')&&!q.reviewedAt).map(q=>({id:q.id,reason:'absolute wording; verify exceptions in linked AWS docs'}));
const unresolvedReviews=bank.filter(q=>!q.reviewedAt).map(q=>({id:q.id,reference:q.reference,domain:q.domain,status:'awaiting independent factual review'}));
const report={generatedAt:new Date().toISOString(),total:bank.length,reviewed:bank.filter(q=>!!q.reviewedAt).length,nearDuplicateThreshold:.36,nearDuplicateCandidates:suspects,domainCoverage,editorialQueue:editorialPriority,
 referenceProblems,suspiciousExplanations,unresolvedReviews,
 caveat:'Structural/reference presence checks do not independently verify AWS factual accuracy. New questions without reviewedAt require human editorial review.'};
mkdirSync('reports',{recursive:true});
writeFileSync('reports/question-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({total:bank.length,reviewed:report.reviewed,nearDuplicateCandidates:suspects.length,editorialQueue:issues.length}));

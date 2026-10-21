import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const bank=readFileSync('certifications/aws-saa/questions/bank.jsonl','utf8').trim().split(/\r?\n/).map(JSON.parse);
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
const report={generatedAt:new Date().toISOString(),total:bank.length,reviewed:bank.filter(q=>!!q.reviewedAt).length,nearDuplicateThreshold:.36,nearDuplicateCandidates:suspects,editorialQueue:issues};
mkdirSync('reports',{recursive:true});
writeFileSync('reports/question-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({total:bank.length,reviewed:report.reviewed,nearDuplicateCandidates:suspects.length,editorialQueue:issues.length}));

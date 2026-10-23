import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {loadQuestions} from './question-source.mjs';
import {coverageVsGuide,qualitySignals,nearDuplicateCandidates,SIMILARITY_CANDIDATE_THRESHOLD,SIMILARITY_STRONG_THRESHOLD,EXAM_WEIGHTS} from './quality-metrics.mjs';
const bank=loadQuestions();
const ledger=JSON.parse(readFileSync('reports/editorial-evidence-2026-10-24.json','utf8'));
const indexed=new Map(bank.map(q=>[q.id,q]));
if(!Array.isArray(ledger.entries)||ledger.entries.length!==new Set(ledger.entries.map(x=>x.id)).size)throw new Error('Invalid or duplicate evidence records');
for(const x of ledger.entries){
 if(!indexed.has(x.id)||x.evidenceLevel!=='targeted_official_document_cross_check'||x.independentReview!=='not_complete')throw new Error('Invalid audit evidence '+x.id);
 if(!Array.isArray(x.sources)||!x.sources.length||x.sources.some(url=>{try{const u=new URL(url);return u.protocol!=='https:'||u.hostname!=='docs.aws.amazon.com'}catch{return true}}))throw new Error('Missing official AWS source '+x.id);
 const question=indexed.get(x.id);
 if(!question.distractorReasons||question.distractorReasons.length!==question.choices.length)throw new Error('Evidence without complete rationales '+x.id);
 // Cross-checked is evidence of targeted investigation, NOT a completed independent review.
}
const spotChecked=new Set(ledger.entries.map(x=>x.id));
const suspects=nearDuplicateCandidates(bank,SIMILARITY_STRONG_THRESHOLD);
const candidates=nearDuplicateCandidates(bank);
const dupeCount=new Map();
for(const pair of candidates){dupeCount.set(pair.a,(dupeCount.get(pair.a)||0)+1);dupeCount.set(pair.b,(dupeCount.get(pair.b)||0)+1)}
const editorialPriority=bank.map(q=>({id:q.id,domain:q.domain,...qualitySignals(q,{duplicateCount:dupeCount.get(q.id)||0,spotChecked:spotChecked.has(q.id)})}))
 .filter(item=>item.reasons.length).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
const issues=editorialPriority.filter(item=>item.reasons.some(x=>x!=='service behavior may be time-sensitive'));
const domains=Object.keys(EXAM_WEIGHTS);
const domainCoverage=Object.fromEntries(domains.map(domain=>{
 const set=bank.filter(q=>q.domain===domain);
 return [domain,{total:set.length,scenarioRich:set.filter(q=>q.tags?.includes('複合設計判断')&&q.distractorReasons&&q.question.length>=90).length,
  multiResponse:set.filter(q=>Array.isArray(q.answers)).length,independentReviewMissing:set.filter(q=>!q.reviewedAt).length,
  shortExplanation:set.filter(q=>(q.explanation||'').length<65).length,missingOptionRationales:set.filter(q=>!Array.isArray(q.distractorReasons)).length}];
}));
const referenceProblems=bank.filter(q=>{try{const u=new URL(q.reference);return u.protocol!=='https:'||u.hostname!=='docs.aws.amazon.com'}catch{return true}})
 .map(q=>({id:q.id,reference:q.reference,reason:'not an AWS official HTTPS documentation URL'}));
const suspiciousExplanations=bank.filter(q=>/(?:必ず|絶対に|すべての場合|常に)/.test(q.explanation||'')&&!q.reviewedAt).map(q=>({id:q.id,reason:'absolute wording; verify exceptions in linked AWS docs'}));
const unresolvedReviews=bank.filter(q=>!q.reviewedAt).map(q=>({id:q.id,reference:q.reference,domain:q.domain,status:'awaiting independent factual review'}));
const report={
 generatedAt:new Date().toISOString(),total:bank.length,reviewed:bank.filter(q=>!!q.reviewedAt).length,
 reviewDateOnlyCaveat:'reviewedAt is a recorded editorial date, not proof of an independent claim-by-claim review.',
 nearDuplicateThreshold:SIMILARITY_STRONG_THRESHOLD,nearDuplicateCandidates:suspects,
 similarityCandidateThreshold:SIMILARITY_CANDIDATE_THRESHOLD,similarityCandidates:candidates,
 domainCoverage,coverageVsExamGuide:coverageVsGuide(bank),editorialQueue:issues,editorialPriority,
 referenceProblems,suspiciousExplanations,unresolvedReviews,
 targetedCrossChecks:{checkedOn:ledger.checkedOn,count:ledger.entries.length,ids:[...spotChecked].sort(),
  limitation:'Targeted cross-check of selected AWS behavior, not independent approval of the entire question.'},
 caveat:'Structural/reference presence checks do not independently verify AWS factual accuracy. Every one of 340 questions needs claim-level review before promising exam fidelity. Candidates may be false positives. Never automatically delete or relabel question IDs.'
};
mkdirSync('reports',{recursive:true});
writeFileSync('reports/question-audit.json',JSON.stringify(report,null,2)+'\n');
const rows=[
 '# Question Bank Audit — SAA-C03',
 '',
 'Generated: '+report.generatedAt,
 '',
 '> **Warning:** Automated checking and targeted cross-checks are NOT independent full editorial verification. No question has been automatically stamped reviewed.',
 '',
 '## Overview',
 '',
 '| Metric | Count |',
 '| --- | ---: |',
 '| Question bank | '+bank.length+' |',
 '| Editorial date present (not independently verified) | '+report.reviewed+' |',
 '| Missing editorial date | '+unresolvedReviews.length+' |',
 '| Targeted AWS-document cross-checks | '+ledger.entries.length+' |',
 '| Structural/editorial action queue | '+issues.length+' |',
 '| Fuzzy similarity candidates ≥ '+SIMILARITY_CANDIDATE_THRESHOLD+' | '+candidates.length+' |',
 '| High-similarity pairs ≥ '+SIMILARITY_STRONG_THRESHOLD+' | '+suspects.length+' |',
 '',
 '## Bank balance vs official SAA-C03 exam weighting',
 '',
 '| Domain | Bank questions | Bank share | AWS guide share | Gap (pp) |',
 '| --- | ---: | ---: | ---: | ---: |',
 ...Object.entries(report.coverageVsExamGuide).map(([domain,c])=>`| ${domain} | ${c.total} | ${c.bankPercent}% | ${c.examGuidePercent}% | ${c.deltaPoints>0?'+':''}${c.deltaPoints} |`),
 '',
 'Official exam guide: https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html',
 '',
 '## Highest-priority editorial actions',
 '',
 '| ID | Domain | Score | Priority | Reason |',
 '| --- | --- | ---: | --- | --- |',
 ...issues.slice(0,45).map(x=>`| ${x.id} | ${x.domain} | ${x.score} | ${x.priority} | ${x.reasons.join('; ')} |`),
 '',
 '## Potentially overlapping questions (MANUAL REVIEW ONLY)',
 '',
 '| Pair | Similarity | Strong? |',
 '| --- | ---: | --- |',
 ...candidates.slice(0,50).map(x=>`| ${x.a} / ${x.b} | ${x.similarity} | ${x.strong?'yes':'no'} |`),
 '',
 '## Targeted AWS documentation checks',
 '',
 ...ledger.entries.map(x=>`- **${x.id}** — ${x.finding} Sources: ${x.sources.join(', ')}. Independent approval: **pending**.`),
 '',
 '## Next steps',
 '',
 '- Manually investigate all unresolved questions, priority order shown above. Keep existing IDs.',
 '- Verify each answer key, the full stem, and every distractor against the linked official documentation.',
 '- Treat a high textual similarity score as an editorial lead, not an automatic duplicate.',
 '- Capture evidence and a second reviewer decision before writing new reviewedAt values.',
 '- E2E/browser automation remains deferred per project request.'
];
writeFileSync('reports/question-audit.md',rows.join('\n')+'\n');
console.log(JSON.stringify({total:bank.length,reviewed:report.reviewed,missingReview:unresolvedReviews.length,nearDuplicateCandidates:suspects.length,similarityCandidates:candidates.length,editorialQueue:issues.length,crossChecked:ledger.entries.length}));

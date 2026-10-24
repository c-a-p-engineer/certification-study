import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {loadQuestions} from './question-source.mjs';
import {reviewerStatus,prioritizeForIndependentReview,validateReviewLedger,DOMAIN_ORDER} from './review-provenance.mjs';
const bank=loadQuestions();
const legacy=JSON.parse(readFileSync('reports/editorial-evidence-2026-10-24.json','utf8'));
const supplemental=JSON.parse(readFileSync('reports/overdrive-5-7-review-batch.json','utf8'));
const ledger=JSON.parse(readFileSync('reports/human-review-decisions.json','utf8'));
const approved=validateReviewLedger(ledger,bank);
const status=reviewerStatus(ledger,bank);
const spotChecked=new Set(legacy.entries.map(x=>x.id));
const queue=prioritizeForIndependentReview(bank.filter(q=>!approved.some(d=>d.questionId===q.id&&d.decision==='approved')),spotChecked,40);
const report={generatedOn:new Date().toISOString(),status,
 notes:[
 'AI-assisted edits (40) and targeted checks (19) are NOT human sign-offs.',
 'An existing reviewedAt date (33 items) does NOT qualify as verified independent review.',
 'A signed ledger decision must be independently verified on its linked GitHub review PR; schema alone cannot authenticate a person.',
 'If any reviewed question changes, its content fingerprint invalidates the previous sign-off and CI will fail.',
 'The queue scores editorial risk; it does not prove a question is incorrect.'
 ],batchTarget:40,balancedQueue:queue,aiDraftCount:supplemental.items.length,targetedDocChecks:legacy.entries.length,
 signoffRecords:approved.map(x=>({questionId:x.questionId,decision:x.decision,reviewerGithub:x.reviewerGithub,reviewedOn:x.reviewedOn,reviewPullRequest:x.reviewPullRequest}))};
mkdirSync('reports',{recursive:true});
writeFileSync('reports/independent-review-queue.json',JSON.stringify(report,null,2)+'\n');
const lines=[
 '# OVERDRIVE 6.1 — Human editorial sign-off queue',
 '',
 '> Human sign-off completed: **'+status.approved+' / '+status.total+'**. AI-assisted draft evidence is not a human review.',
 '',
 '## Record status',
 '',
 '| Category | Count |','| --- | ---: |',
 '| Independent human approved | '+status.approved+' |',
 '| Human-requested changes | '+status.needsChanges+' |',
 '| Human rejected | '+status.rejected+' |',
 '| No independently signed decision | '+status.independentReviewPending+' |',
 '| AI-assisted draft option rationales | '+report.aiDraftCount+' |',
 '| Targeted official-document spot checks | '+report.targetedDocChecks+' |',
 '',
 '## 40 question candidates for independent review (balanced domains)',
 '',
 '| ID | Domain | QA priority | Content fingerprint | Documentation |',
 '| --- | --- | ---: | --- | --- |',
 ...queue.map(x=>`| ${x.id} | ${x.domain} | ${x.priorityScore} | \`${x.questionFingerprint.slice(0,16)}…\` | [AWS docs](${x.reference}) |`),
 '',
 '## Required human review protocol',
 '',
 '1. A qualified independent reviewer reviews the complete current question stem, answer key and **every** incorrect option against up-to-date AWS official documentation, including meaningful exceptions, Region availability, pricing and exam objectives.',
 '2. Record each specific claim and citation and access date, reviewer GitHub identity, review date and a linked review pull request. Code review must verify the person independently; a JSON field cannot prove identity.',
 '3. Run `node scripts/audit-review-signoff.mjs` or the full `npm run build`. Every record must match the question SHA256 fingerprint. A later answer/content edit makes the previous approval stale and fails CI.',
 '4. Do not add an `approved` record solely from AI output, documentation link existence, reviewedAt or static scanning. Keep status pending instead.',
 '5. Existing user history is keyed by question ID. Preserve IDs; if an answer key must change, document the impact on old XP/reviews explicitly.',
 '',
 '## Caveats',
 '',
 ...report.notes.map(x=>'- '+x)
];
writeFileSync('reports/independent-review-queue.md',lines.join('\n')+'\n');
console.log(JSON.stringify({queue:queue.length,domains:Object.fromEntries(DOMAIN_ORDER.map(d=>[d,queue.filter(x=>x.domain===d).length])),...status}));

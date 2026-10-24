import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadQuestions} from './question-source.mjs';
import {questionFingerprint,validateReviewLedger,reviewerStatus,prioritizeForIndependentReview,DOMAIN_ORDER} from './review-provenance.mjs';
const bank=loadQuestions(),empty=JSON.parse(readFileSync('reports/human-review-decisions.json','utf8'));
const q=bank.find(x=>x.id==='saa-002');
function record(question=q){
 return {questionId:question.id,decision:'approved',reviewerType:'human',reviewerGithub:'qualified-reviewer',
  reviewedOn:'2026-10-24',reviewPullRequest:'https://github.com/c-a-p-engineer/certification-study/pull/99',
  questionFingerprint:questionFingerprint(question),
  evidence:[{url:question.reference,accessedOn:'2026-10-24',claim:'AWS公式ドキュメントに照らし設問の全選択肢について妥当性をそれぞれ確認した。'}],
  checks:{stem:true,correctAnswer:true,everyDistractor:true,serviceCaveats:true,examScope:true},
  summary:'AWS SAA試験のシラバスを踏まえ、各選択肢の正誤、サービス要件、制限事項を原典と照合した。根拠の詳細とレビュー記録はリンク先PRの審査で別途検証する。'
 };
}
test('no claims of human approvals from previous AI-only cross-checks or reviewedAt timestamps',()=>{
 assert.deepEqual(empty.decisions,[]);
 const s=reviewerStatus(empty,bank);
 assert.equal(s.total,348);assert.equal(s.approved,0);
 assert.equal(s.independentReviewPending,348);
 assert.ok(s.limitation.includes('cannot establish reviewer identity'));
});
test('review queue picks 40 unique high-risk questions, balanced evenly across the four exam domains',()=>{
 const checks=new Set(JSON.parse(readFileSync('reports/editorial-evidence-2026-10-24.json','utf8')).entries.map(x=>x.id));
 const rows=prioritizeForIndependentReview(bank,checks,40);
 assert.equal(rows.length,40);
 assert.equal(new Set(rows.map(x=>x.id)).size,40);
 for(const d of DOMAIN_ORDER)assert.equal(rows.filter(x=>x.domain===d).length,10);
 assert.ok(rows.every(x=>x.questionFingerprint.length===64));
 assert.deepEqual(prioritizeForIndependentReview(bank,checks,40),rows);
 assert.equal(prioritizeForIndependentReview(bank,checks,0).length,0);
});
test('a human decision requires PR trace, all option checks and dated official AWS citations',()=>{
 const signed=record();
 assert.equal(validateReviewLedger({schemaVersion:1,decisions:[signed]},bank).length,1);
 const status=reviewerStatus({schemaVersion:1,decisions:[signed]},bank);
 assert.equal(status.approved,1);
 assert.equal(status.independentReviewPending,347);
 assert.throws(()=>validateReviewLedger({schemaVersion:1,decisions:[signed,signed]},bank),/repeated/);
 assert.throws(()=>validateReviewLedger({schemaVersion:1,decisions:[{...signed,reviewerType:'ai'}]},bank),/Human reviewer/);
 assert.throws(()=>validateReviewLedger({schemaVersion:1,decisions:[{...signed,reviewerGithub:'ChatGPT'}]},bank),/Human reviewer/);
 assert.throws(()=>validateReviewLedger({schemaVersion:1,decisions:[{...signed,reviewPullRequest:'https://evil.test/pr/99'}]},bank),/Date and review PR/);
 assert.throws(()=>validateReviewLedger({schemaVersion:1,decisions:[{...signed,reviewedOn:'2026-02-30'}]},bank),/Date and review PR/);
 assert.throws(()=>validateReviewLedger({schemaVersion:1,decisions:[{...signed,evidence:[{url:'https://example.com',accessedOn:'2026-10-24',claim:'AWS document checked by a reviewer'}]}]},bank),/AWS official evidence/);
 assert.throws(()=>validateReviewLedger({schemaVersion:1,decisions:[{...signed,checks:{...signed.checks,everyDistractor:false}}]},bank),/Complete independent claim checks/);
});
test('signed approval becomes stale when a question, reference, key or explanation changes',()=>{
 const x=record();
 for(const patch of [{question:q.question+'updated'},{answer:1},{choices:q.choices.map(s=>s+'modified')},{explanation:q.explanation+'modified'},{reference:'https://docs.aws.amazon.com/example'}]){
  const modified=bank.map(item=>item.id===q.id?{...item,...patch}:item);
  assert.throws(()=>validateReviewLedger({schemaVersion:1,decisions:[x]},modified),/stale or answer changed/);
 }
});
test('partial checks never silently turn into independent approval and old IDs remain unmodified',()=>{
 const x=record();
 for(const decision of ['needs_changes','rejected']){
  const status=reviewerStatus({schemaVersion:1,decisions:[{...x,decision}]},bank);
  assert.equal(status.approved,0);
  assert.equal(status[decision==='needs_changes'?'needsChanges':'rejected'],1);
 }
 assert.equal(bank.find(item=>item.id===q.id).id,'saa-002');
 assert.equal(bank.length,348);
});
test('6.1 gate is included in main build and PR artifacts',()=>{
 const pkg=JSON.parse(readFileSync('package.json','utf8'));
 const workflow=readFileSync('.github/workflows/verify.yml','utf8');
 const script=readFileSync('scripts/audit-review-signoff.mjs','utf8');
 assert.ok(pkg.scripts.build.includes('test:provenance'));
 assert.ok(pkg.scripts.build.includes('audit:signoff'));
 assert.ok(workflow.includes('independent-review-queue.md'));
 assert.ok(script.includes('prioritizeForIndependentReview'));
});

import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {loadQuestions} from './question-source.mjs';
import {nearDuplicateCandidates,coverageVsGuide} from './quality-metrics.mjs';
const bank=loadQuestions(),byId=new Map(bank.map(q=>[q.id,q]));
const ledger=JSON.parse(readFileSync('reports/overdrive-5-7-review-batch.json','utf8'));
const overlap=JSON.parse(readFileSync('reports/overdrive-5-8-overlap-triage.json','utf8'));
test('5.7: 40 explicit source-linked rationales across four domains without fictional approval',()=>{
 assert.equal(bank.length,348);assert.equal(ledger.items.length,40);
 for(const d of ['セキュリティ','耐障害性','パフォーマンス','コスト最適化'])assert.equal(ledger.items.filter(x=>x.domain===d).length,10);
 for(const row of ledger.items){const q=byId.get(row.id);
  assert.ok(q,row.id);assert.ok(q.distractorReasons?.length===q.choices.length,row.id);
  assert.ok(q.distractorReasons.every(v=>v.length>=15),row.id);
  assert.ok(q.explanation.length>=60,row.id);
  assert.ok(row.source.startsWith('https://docs.aws.amazon.com/'),row.id);
  assert.ok(row.reviewStatus.includes('signoff_pending'),row.id);
  assert.equal(q.reviewedAt,undefined,'An AI audit is not an independent reviewer stamp');
  assert.deepEqual(q.answer??q.answers,row.previousChoiceIndex,row.id);
 }
});
test('5.8: eight original scenario problems, six in Security, retain prior IDs and answer keys',()=>{
 const added=bank.filter(q=>/^saa-34[1-8]$/.test(q.id));
 assert.equal(added.length,8);
 assert.equal(added.filter(q=>q.domain==='セキュリティ').length,6);
 assert.equal(bank.filter(q=>q.tags?.includes('複合設計判断')).length,48);
 for(const q of added){
  assert.ok(q.question.length>=100,q.id);assert.ok(q.explanation.length>=80,q.id);
  assert.equal(q.difficulty,3);assert.ok(q.reference.startsWith('https://docs.aws.amazon.com/'));
  assert.equal(q.distractorReasons.length,q.choices.length);
  assert.equal(q.reviewedAt,undefined);
 }
 const shares=coverageVsGuide(bank);
 assert.ok(shares['セキュリティ'].bankPercent>27);
 assert.ok(shares['セキュリティ'].bankPercent<30);
 assert.equal(shares['コスト最適化'].total,81);
});
test('5.8: near-duplicate high priority pairs were classified, never removed automatically',()=>{
 assert.ok(overlap.decisions.length>=12);
 for(const item of overlap.decisions){assert.ok(item.pair.every(id=>byId.has(id)));assert.ok(item.why.length>30)}
 for(const id of ['saa-226','saa-229','saa-260','saa-230']){
  const q=byId.get(id);assert.ok(q.question.length>=100,id);
  assert.equal(q.distractorReasons.length,q.choices.length);
 }
 const candidates=nearDuplicateCandidates(bank);
 assert.ok(candidates.length>0);
 assert.equal(new Set(bank.map(q=>q.id)).size,348);
});
test('5.7 audit evidence is included in PR quality artifact and preserves old 5.6 checks',()=>{
 const script=readFileSync('scripts/audit-question-bank.mjs','utf8');
 const ci=readFileSync('.github/workflows/verify.yml','utf8');
 assert.ok(script.includes('overdrive-5-7-review-batch.json'));
 assert.ok(script.includes('overdrive-5-8-overlap-triage.json'));
 assert.ok(ci.includes('overdrive-5-7-review-batch.json'));
});

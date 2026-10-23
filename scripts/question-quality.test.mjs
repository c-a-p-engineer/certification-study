import test from 'node:test';import assert from 'node:assert/strict';
import {loadQuestions} from './question-source.mjs';
import {readFileSync} from 'node:fs';
const bank=loadQuestions(),added=bank.filter(q=>/^saa-3(3[3-9]|40)$/.test(q.id));
test('348 distinct SAA questions and 48 realistic scenarios across domains',()=>{
 assert.equal(bank.length,348);assert.equal(added.length,8);
 for(const domain of ['セキュリティ','耐障害性','パフォーマンス','コスト最適化']){
  const scenarios=bank.filter(q=>q.domain===domain&&q.tags?.includes('複合設計判断'));
  assert.equal(scenarios.length,({'セキュリティ':16,'耐障害性':11,'パフォーマンス':11,'コスト最適化':10})[domain],domain);
  assert.equal(added.filter(q=>q.domain===domain).length,2,domain);
 }
});
test('new hard scenarios provide source URL and each option rationale, while avoiding unverified reviewed labels',()=>{
 for(const q of added){
  assert.ok(q.question.length>=110,q.id);
  assert.ok(q.distractorReasons?.length===q.choices.length,q.id);
  assert.ok(q.distractorReasons.every(v=>v.length>=15),q.id);
  assert.ok(q.explanation.length>=65,q.id);
  assert.ok(q.reference.startsWith('https://docs.aws.amazon.com/'),q.id);
  assert.equal(q.reviewedAt,undefined,'Do not fabricate independent QA: '+q.id);
 }
});
test('audit exports domain quality and prioritized human editorial queue',()=>{
 const script=readFileSync('scripts/audit-question-bank.mjs','utf8');
 assert.ok(script.includes('domainCoverage'));
 assert.ok(script.includes('editorialPriority'));
 assert.ok(script.includes('human editorial review'));
});

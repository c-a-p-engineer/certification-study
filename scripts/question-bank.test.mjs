import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const questions=readFileSync('certifications/aws-saa/questions/bank.jsonl','utf8').trim().split(/\r?\n/).map(JSON.parse);
const quotas={'セキュリティ':20,'耐障害性':17,'パフォーマンス':15,'コスト最適化':13};
test('SAA question bank contains at least 65 original questions',()=>{assert.ok(questions.length>=65)});
test('question IDs and normalized question text are unique',()=>{
 assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
 assert.equal(new Set(questions.map(q=>q.question.normalize('NFKC').replace(/\s+/g,''))).size,questions.length);
});
test('all questions have defensible answer index sets and official reference URLs',()=>{
 for(const q of questions){
  assert.ok(q.choices.length>=4&&q.choices.length<=8,q.id);
  assert.equal(new Set(q.choices).size,q.choices.length,q.id);
  const answerSet=q.answers??[q.answer];
  assert.ok(answerSet.every(n=>Number.isInteger(n)&&n>=0&&n<q.choices.length),q.id);
  assert.equal(new Set(answerSet).size,answerSet.length,q.id);
  assert.ok(q.answers?answerSet.length>=2&&answerSet.length<=3:answerSet.length===1,q.id);
  assert.ok(q.reference.startsWith('https://docs.aws.amazon.com/'),q.id);
 }
});
test('exam domain quotas can be fulfilled',()=>{
 for(const [domain,min] of Object.entries(quotas))assert.ok(questions.filter(q=>q.domain===domain).length>=min,domain);
});
test('multiple-response questions cover every exam domain',()=>{
 for(const domain of Object.keys(quotas))assert.ok(questions.filter(q=>q.domain===domain&&Array.isArray(q.answers)&&q.choices.length>=5).length>=2,domain);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadQuestions} from './question-source.mjs';
import {EXAM_WEIGHTS,coverageVsGuide,qualitySignals,similarity,nearDuplicateCandidates,SIMILARITY_CANDIDATE_THRESHOLD} from './quality-metrics.mjs';
const bank=loadQuestions(),byId=new Map(bank.map(q=>[q.id,q]));
const ledger=JSON.parse(readFileSync('reports/editorial-evidence-2026-10-24.json','utf8'));
test('348 AWS original questions remain stable; 19 targeted corrections have complete rationale',()=>{
 assert.equal(bank.length,348);
 assert.equal(new Set(bank.map(q=>q.id)).size,348);
 assert.equal(ledger.entries.length,19);
 const ids=new Set(ledger.entries.map(x=>x.id));assert.equal(ids.size,19);
 for(const e of ledger.entries){
  const q=byId.get(e.id);assert.ok(q,e.id);
  assert.equal(q.reviewedAt,undefined,'Targeted check is not a full review stamp: '+e.id);
  assert.equal(e.independentReview,'not_complete');
  assert.ok(q.question.length>45,e.id);
  assert.ok(q.explanation.length>=85,e.id);
  assert.equal(q.distractorReasons.length,q.choices.length,e.id);
  assert.ok(q.distractorReasons.every(s=>s.length>=15),e.id);
  assert.ok(e.sources.every(s=>new URL(s).hostname==='docs.aws.amazon.com'));
  assert.ok(e.finding.length>=30);
 }
});
test('5.6 fixes previously ambiguous S3 lifecycle, versioning and RDS/Aurora assumptions without key changes',()=>{
 const expected={'saa-005':1,'saa-007':1,'saa-019':0,'saa-028':0,'saa-031':0,'saa-057':0,'saa-068':3,'saa-087':2,'saa-100':2,'saa-236':1,'saa-244':0,'saa-254':0,'saa-284':0,'saa-101':2,'saa-107':2};
 for(const [id,key] of Object.entries(expected))assert.equal(byId.get(id).answer,key,id);
 assert.deepEqual(byId.get('saa-267').answers,[0,1,2]);
 assert.deepEqual(byId.get('saa-263').answers,[0,1,2]);
 assert.ok(byId.get('saa-005').explanation.includes('Multi-AZ DBクラスター'));
 assert.ok(byId.get('saa-028').question.includes('日数ベース'));
 assert.ok(byId.get('saa-028').explanation.includes('128KB'));
 assert.ok(byId.get('saa-031').explanation.includes('128KB'));
 assert.ok(byId.get('saa-057').explanation.includes('接続単位'));
 assert.ok(byId.get('saa-068').explanation.includes('削除マーカー'));
 assert.ok(byId.get('saa-284').explanation.includes('NoncurrentVersionExpiration'));
 assert.ok(byId.get('saa-087').explanation.includes('管理アカウント'));
});
test('lower fuzzy threshold produces review candidates, but no automatic deletion',()=>{
 const short=[
 {id:'a',domain:'セキュリティ',question:'DynamoDBの高負荷テーブルで一部パーティションにアクセスが偏る。適切な改善案をすべて選んでください。'},
 {id:'b',domain:'セキュリティ',question:'DynamoDBテーブルの一部のキーにリクエストが集中しスロットリングが起きている。適切な改善策をすべて選んでください。'},
 {id:'c',domain:'パフォーマンス',question:'DynamoDBテーブルの一部のキーにリクエストが集中しスロットリングが起きている。適切な改善策をすべて選んでください。'}
 ];
 assert.ok(similarity(short[0].question,short[1].question)>.2);
 const found=nearDuplicateCandidates(short,.2);
 assert.equal(found.length,1);assert.deepEqual([found[0].a,found[0].b],['a','b']);
 assert.ok(SIMILARITY_CANDIDATE_THRESHOLD<.36);
 const all=nearDuplicateCandidates(bank);
 assert.ok(all.length>0);assert.ok(all.some(x=>x.a==='saa-141'&&x.b==='saa-225'));
 assert.equal(bank.length,348);
});
test('exam guide target weights correctly expose bank imbalance',()=>{
 assert.deepEqual(EXAM_WEIGHTS,{'セキュリティ':30,'耐障害性':26,'パフォーマンス':24,'コスト最適化':20});
 const gap=coverageVsGuide(bank);
 assert.equal(gap['セキュリティ'].total,95);
 assert.equal(gap['コスト最適化'].total,81);
 assert.ok(gap['セキュリティ'].deltaPoints<0);
 assert.ok(gap['コスト最適化'].deltaPoints>0);
});
test('priority ranking rewards real gaps and does not interpret a cross-check as independent approval',()=>{
 const q=byId.get('saa-005');
 const spot=qualitySignals(q,{spotChecked:true});
 const unspot=qualitySignals(q,{spotChecked:false});
 assert.ok(spot.score<unspot.score);
 assert.ok(spot.reasons.includes('not independently reviewed'));
 assert.equal(spot.spotChecked,true);
 const bad={...q,explanation:'短文',distractorReasons:undefined,tags:undefined,reviewedAt:undefined};
 assert.ok(qualitySignals(bad).score>qualitySignals(q,{spotChecked:true}).score);
});
test('audit script produces two artifacts and retains original reporting contracts',()=>{
 const script=readFileSync('scripts/audit-question-bank.mjs','utf8');
 const verify=readFileSync('.github/workflows/verify.yml','utf8');
 assert.ok(script.includes('human editorial review'));
 assert.ok(script.includes('nearDuplicateCandidates'));
 assert.ok(script.includes('coverageVsGuide(bank)'));
 assert.ok(script.includes("writeFileSync('reports/question-audit.md'"));
 assert.ok(script.includes("writeFileSync('reports/question-audit.json'"));
 assert.ok(verify.includes('question-quality-audit'));
});

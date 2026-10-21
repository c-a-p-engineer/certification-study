import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CONCEPTS,findStudyTerms} from '../src/termGuide.ts';

test('technical terms are contextual and include ordinary AWS concepts, not only acronyms',()=>{
 const q={question:'Amazon S3でキャッシュしたファイルをCloudFrontから配信する。',choices:['S3','Amazon EC2','EBS','Lambda'],explanation:'キャッシュとTTLを設定する。'};
 const items=findStudyTerms(q);
 const names=items.map(x=>x.title);
 assert.ok(names.includes('Amazon S3'));
 assert.ok(names.includes('Amazon CloudFront'));
 assert.ok(names.includes('キャッシュ'));
 assert.ok(items.some(t=>t.category==='AWSサービス'));
 assert.ok(items.some(t=>t.category==='技術用語'));
});
test('RTO and RPO retain their full English names and explanatory distinction',()=>{
 const terms=findStudyTerms({question:'RTOとRPOの違いを説明してください。',choices:['MTBF','SLO','TTL','IAM'],explanation:'RTOは復旧までの時間、RPOは許容できるデータ損失。'});
 assert.equal(terms.find(t=>t.title==='RTO')?.english,'Recovery Time Objective');
 assert.equal(terms.find(t=>t.title==='RPO')?.english,'Recovery Point Objective');
 assert.ok(terms.find(t=>t.title==='RTO')?.note.includes('復旧'));
 assert.ok(terms.find(t=>t.title==='RPO')?.note.includes('データ損失'));
});
test('avoid substrings, duplicate entries, and overly long glossary blocks',()=>{
 const q={question:'SLOPE と PROCESS のみ',choices:['キューイング','ダミー','無関係','これだけ'],explanation:'架空の問題です。'};
 assert.equal(findStudyTerms(q).some(x=>x.title==='SLO'),false);
 const terms=findStudyTerms({question:'SQS と Amazon SQS と SNS',choices:['SQS','SNS','S3','DAX'],explanation:'SQS'});
 assert.equal(terms.filter(x=>x.id==='sqs').length,1);
 assert.ok(terms.length<=8);
 assert.ok(findStudyTerms({question:'RTO',choices:[],explanation:''},2).length<=2);
});
test('terms prioritize question and explanation before irrelevant distractors',()=>{
 const q={question:'DynamoDBでパーティションキーの偏りを改善するには？',explanation:'ホットパーティションを避ける。',choices:['EC2','CloudTrail','Macie','Lambda']};
 const terms=findStudyTerms(q,2);
 assert.ok(terms.some(t=>t.title==='Amazon DynamoDB'));
 assert.ok(terms.some(t=>t.title==='パーティションキー'));
});
test('large curated glossary has distinct IDs and definitions',()=>{
 assert.ok(CONCEPTS.length>=45);
 assert.equal(new Set(CONCEPTS.map(t=>t.id)).size,CONCEPTS.length);
 assert.ok(CONCEPTS.every(t=>t.meaning&&t.note&&t.aliases.length>0));
});
test('real 300-question bank gets contextual explanations for most items',()=>{
 const bank=readFileSync('certifications/aws-saa/questions/bank.jsonl','utf8').trim().split(/\r?\n/).map(JSON.parse);
 const covered=bank.filter(q=>findStudyTerms(q).length>0).length;
 console.log('contextual glossary coverage:',covered,'/',bank.length);
 assert.ok(covered>=Math.floor(bank.length*.95));
});

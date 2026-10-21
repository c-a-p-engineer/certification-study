import test from 'node:test';
import assert from 'node:assert/strict';
import {findTerms,expandTerms,GLOSSARY} from '../src/glossary.ts';

test('RTO, RPO, MTBF and SLO expand to distinct full names',()=>{
 const found=findTerms('災害復旧で業務再開までの許容時間は？','RTO','MTBF','SLO','RPO');
 assert.deepEqual(found.map(term=>term.abbr).sort(),['MTBF','RPO','RTO','SLO']);
 assert.equal(found.find(term=>term.abbr==='RTO')?.full,'Recovery Time Objective');
 assert.equal(found.find(term=>term.abbr==='RPO')?.full,'Recovery Point Objective');
});
test('does not match abbreviations inside longer English tokens',()=>{
 assert.deepEqual(findTerms('ERRORTOOTHER'),[]);
 assert.deepEqual(findTerms('SLOPE'),[]);
});
test('every glossary entry has a unique abbreviation and translation',()=>{
 assert.equal(new Set(GLOSSARY.map(t=>t.abbr)).size,GLOSSARY.length);
 for(const term of GLOSSARY)assert.ok(term.full&&term.meaning&&term.note,term.abbr);
});

test('inline explanations give full name and meaning once',()=>{
 const result=expandTerms('RTOは復旧時間の目標です。RTOを短縮します。RPOはデータ損失の目標です。');
 assert.match(result,/RTO（Recovery Time Objective／目標復旧時間）/);
 assert.match(result,/RPO（Recovery Point Objective／目標復旧時点）/);
 assert.equal(result.match(/Recovery Time Objective/g)?.length,1);
});
test('does not expand substrings or disturb unrelated explanations',()=>{
 assert.equal(expandTerms('SLOPE はグラフの傾きです。'),'SLOPE はグラフの傾きです。');
 assert.equal(expandTerms('サービスを復旧します。'),'サービスを復旧します。');
});

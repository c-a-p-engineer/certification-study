import test from 'node:test';
import assert from 'node:assert/strict';
import {findTerms,GLOSSARY} from '../src/glossary.ts';

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

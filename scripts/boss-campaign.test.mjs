import test from 'node:test';
import assert from 'node:assert/strict';
import {BOSSES,bossOutcome,bossFor,isBossDomain,normalizeBossRecords,recordBossVictory} from '../src/bossCampaign.ts';
const D=BOSSES[0].domain;
test('four unique domain bosses and clear conditions',()=>{
 assert.equal(BOSSES.length,4);
 assert.equal(new Set(BOSSES.map(b=>b.domain)).size,4);
 assert.ok(bossFor(D));
 assert.ok(isBossDomain(D));
 assert.equal(isBossDomain('ALL'),false);
 assert.equal(bossOutcome(6,10).victory,false);
 assert.equal(bossOutcome(6,10).remaining,1);
 assert.equal(bossOutcome(7,10).grade,'B');
 assert.equal(bossOutcome(9,10).grade,'A');
 assert.equal(bossOutcome(10,10).grade,'S');
 assert.equal(bossOutcome(0,0).victory,false);
 assert.equal(bossOutcome(11,10).victory,false);
});
test('first clear pays only once, upgrading medal pays once per grade',()=>{
 const first=recordBossVictory(undefined,D,7,10,1000);
 assert.equal(first.award,400);
 assert.equal(first.firstClear,true);
 assert.equal(first.records[D].bestCorrect,7);
 const replay=recordBossVictory(first.records,D,7,10,2000);
 assert.equal(replay.award,0);
 assert.equal(replay.firstClear,false);
 assert.equal(replay.records[D].firstClearedAt,1000);
 const eight=recordBossVictory(replay.records,D,8,10,3000);
 assert.equal(eight.award,0);
 assert.equal(eight.records[D].bestCorrect,8);
 const a=recordBossVictory(eight.records,D,9,10,4000);
 assert.equal(a.award,120);
 assert.equal(a.upgraded,true);
 assert.equal(recordBossVictory(a.records,D,9,10,4500).award,0);
 const s=recordBossVictory(a.records,D,10,10,5000);
 assert.equal(s.award,120);
 assert.equal(recordBossVictory(s.records,D,7,10,6000).records[D].bestCorrect,10);
});
test('failed, fake or incomplete boss runs never add a trophy or bonus',()=>{
 assert.equal(recordBossVictory(undefined,D,6,10).award,0);
 assert.equal(recordBossVictory(undefined,D,7,9).award,0);
 assert.equal(recordBossVictory(undefined,'ALL',10,10).award,0);
 assert.deepEqual(normalizeBossRecords({bogus:{bestCorrect:10,firstClearedAt:0}}),{});
 assert.deepEqual(normalizeBossRecords({[D]:{bestCorrect:100,firstClearedAt:0}}),{});
});
test('all domains retain independent medals, legacy progress need not contain records',()=>{
 let records;
 for(const boss of BOSSES){const result=recordBossVictory(records,boss.domain,9,10,123);records=result.records;assert.equal(result.award,400)}
 assert.equal(Object.keys(records).length,4);
 assert.equal(recordBossVictory(records,D,9,10).award,0);
});

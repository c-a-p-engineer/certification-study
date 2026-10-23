import test from 'node:test';
import assert from 'node:assert/strict';
import {BOSSES,recordBossVictory} from '../src/bossCampaign.ts';
import {relicCollection,validEquippedRelic} from '../src/relicSystem.ts';
const nodes=(level)=>Array.from({length:9},(_,i)=>({name:'topic-'+i,seen:8,retained:4,due:0,lapses:0,poolSize:10,tier:level,progress:100,nextSeen:8,nextRetained:4}));
test('all rare relics start locked and cannot be equipped without knowledge achievements',()=>{
 const list=relicCollection(undefined,nodes(0));
 assert.equal(list.length,7);
 assert.ok(list.every(r=>!r.unlocked));
 assert.equal(validEquippedRelic('boss-cerberus',list),null);
 assert.equal(validEquippedRelic(undefined,list),null);
});
test('first real domain boss clear grants only its relic',()=>{
 const records=recordBossVictory(undefined,BOSSES[0].domain,7,10,1000).records;
 const list=relicCollection(records,nodes(0));
 assert.equal(list.filter(r=>r.unlocked).length,1);
 assert.equal(list[0].name,'CERBERUS CORE');
 assert.equal(validEquippedRelic(list[0].id,list),list[0].id);
 assert.equal(validEquippedRelic(list[1].id,list),null);
});
test('cumulative retention and clearing all domains grant deterministic high-tier cosmetics',()=>{
 let records={};
 for(const boss of BOSSES)records=recordBossVictory(records,boss.domain,7,10,1000).records;
 const list=relicCollection(records,nodes(2));
 assert.equal(list.find(r=>r.id==='memory-prism').unlocked,true);
 assert.equal(list.find(r=>r.id==='architect-halo').unlocked,true);
 assert.equal(list.find(r=>r.id==='ascendant-crown').unlocked,false);
 assert.equal(relicCollection(records,nodes(3)).find(r=>r.id==='ascendant-crown').unlocked,true);
});

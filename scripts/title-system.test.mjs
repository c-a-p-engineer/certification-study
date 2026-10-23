import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_TITLE_ID,earnedTitles,titleStats,validEquippedTitle} from '../src/titleSystem.ts';
const basic={xp:0,answered:0,correct:0,best:0,reviews:{},activity:{},domains:{}};
test('title vault has many distinct, human-readable names and a usable starting title',()=>{
 const all=earnedTitles(titleStats(basic,0,0));
 assert.ok(all.length>=30);
 assert.equal(new Set(all.map(x=>x.name)).size,all.length);
 assert.equal(new Set(all.map(x=>x.id)).size,all.length);
 assert.equal(all.find(x=>x.id===DEFAULT_TITLE_ID)?.unlocked,true);
 assert.equal(all.filter(x=>x.unlocked).length,1);
});
test('titles unlock for achievements and stay locked when conditions are unmet',()=>{
 const data={...basic,xp:30000,answered:120,correct:110,best:12,domains:{'セキュリティ':{answered:51,correct:44}},reviews:Object.fromEntries(Array.from({length:60},(_,i)=>['q'+i,{streak:i<35?3:0,dueAt:0,lapses:0}]))};
 const titles=earnedTitles(titleStats(data,15,7));
 for(const id of ['first-answer','centurion','combo-10','security-40','streak-7','day-7','accuracy-90','master-30','xp-20k'])
  assert.equal(titles.find(t=>t.id===id)?.unlocked,true,id);
 for(const id of ['xp-100k','day-50','cost-40'])assert.equal(titles.find(t=>t.id===id)?.unlocked,false,id);
});
test('locked or invented titles are never equipable',()=>{
 const data=earnedTitles(titleStats(basic,0,0));
 assert.equal(validEquippedTitle('security-40',data),DEFAULT_TITLE_ID);
 assert.equal(validEquippedTitle('not-a-title',data),DEFAULT_TITLE_ID);
 assert.equal(validEquippedTitle({},data),DEFAULT_TITLE_ID);
 assert.equal(validEquippedTitle(DEFAULT_TITLE_ID,data),DEFAULT_TITLE_ID);
});

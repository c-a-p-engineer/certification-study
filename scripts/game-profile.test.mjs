import test from 'node:test';
import assert from 'node:assert/strict';
import {gameProfile,RANKS} from '../src/gameProfile.ts';
const p=(xp=0)=>({xp,answered:12,correct:9,best:5,mistakes:[],daily:undefined,reviews:{a:{streak:4,dueAt:1,lapses:0},b:{streak:0,dueAt:999999,lapses:2}}});
test('new player starts at level one rookie and has no fictitious pass chance',()=>{
 const profile=gameProfile({...p(0),answered:0,correct:0,best:0,reviews:{}},300,100);
 assert.equal(profile.level,1);
 assert.equal(profile.rank,'ROOKIE');
 assert.equal(profile.accuracy,0);
 assert.equal(profile.seen,0);
 assert.ok(profile.nextLevelXP>profile.xp);
 assert.equal(Object.hasOwn(profile,'passProbability'),false);
});
test('XP levels and rank thresholds are monotonic',()=>{
 let previousLevel=0;
 for(const xp of [0,119,120,399,400,479,480,999,1000,2500,5000,9999]){
  const profile=gameProfile(p(xp),300,100);
  assert.ok(profile.level>=previousLevel);
  assert.ok(profile.levelPct>=0&&profile.levelPct<=100);
  assert.ok(profile.xpToNextRank>=0);
  previousLevel=profile.level;
 }
 assert.equal(gameProfile(p(400),300).rank,'GOLD');
 assert.equal(gameProfile(p(5000),300).rank,'LEGEND');
 assert.equal(RANKS.length,5);
});
test('profile retains distinct learning and achievement indicators',()=>{
 const stats=gameProfile(p(650),300,100);
 assert.equal(stats.accuracy,75);
 assert.equal(stats.seen,2);
 assert.equal(stats.learned,1);
 assert.equal(stats.due,1);
 assert.ok(stats.achievements.some(x=>x.id==='combo'&&x.unlocked));
 assert.equal(stats.unlockedAchievements,stats.achievements.filter(x=>x.unlocked).length);
});

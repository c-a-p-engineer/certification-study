import test from 'node:test';
import assert from 'node:assert/strict';
import {gameProfile,RANKS} from '../src/gameProfile.ts';
import {shiftLocalDate} from '../src/studyHistory.ts';

const today='2026-10-23',NOW=new Date(2026,9,23,12,0,0).getTime();
const activityFor=(days)=>Object.fromEntries(Array.from({length:days},(_,i)=>[shiftLocalDate(today,-i),{answered:1,correct:1}]));
const progress=(xp=0,answered=12,days=0)=>({xp,answered,correct:Math.min(answered,9),best:5,mistakes:[],reviews:{a:{streak:4,dueAt:1,lapses:0},b:{streak:0,dueAt:9999999999999,lapses:2}},activity:activityFor(days)});

test('new player starts as ROOKIE and no made-up pass probability',()=>{
 const profile=gameProfile({...progress(0,0),best:0,reviews:{}},300,NOW);
 assert.equal(profile.level,1);
 assert.equal(profile.rank,'ROOKIE');
 assert.equal(profile.accuracy,0);
 assert.equal(profile.seen,0);
 assert.ok(profile.nextLevelXP>profile.xp);
 assert.equal(Object.hasOwn(profile,'passProbability'),false);
});

test('a few thousand XP is no longer LEGEND; rank requires practice and separate days',()=>{
 const p=gameProfile(progress(5000,28,1),300,NOW);
 assert.equal(p.rank,'BRONZE');
 assert.equal(p.nextRank,'SEEKER');
 assert.equal(p.xpToNextRank,0);
 assert.equal(p.answersToNextRank,0);
 assert.equal(p.daysToNextRank,1);
 assert.equal(p.activeDays,1);
 assert.equal(p.currentStreak,1);
});

test('rank milestones are ordered, none can be skipped by XP alone',()=>{
 assert.deepEqual(RANKS.filter(x=>['ROOKIE','BRONZE','SILVER','GOLD','PLATINUM','DIAMOND','LEGEND'].includes(x.name)).map(x=>x.name),['ROOKIE','BRONZE','SILVER','GOLD','PLATINUM','DIAMOND','LEGEND']);
 assert.ok(RANKS.length>=18);
 assert.ok(RANKS.every(x=>x.subtitle.length>=4));
 assert.deepEqual(RANKS.filter(x=>['ROOKIE','BRONZE','SILVER','GOLD','PLATINUM','DIAMOND','LEGEND'].includes(x.name)).map(x=>x.minXP),[0,1000,4500,12000,26000,55000,120000]);
 let before=0;
 for(const xp of [0,119,120,399,400,1000,4800,12000,26000,55000,120000]){
  const p=gameProfile(progress(xp,5,1),300,NOW);
  assert.equal(p.rank,xp>=300?'SPARK':'ROOKIE');
  assert.ok(p.level>=before);
  assert.ok(p.levelPct>=0&&p.levelPct<=100);
  before=p.level;
 }
});

test('LEGEND requires XP, >=700 answers and >=50 active days',()=>{
 const full=gameProfile(progress(120000,700,50),300,NOW);
 assert.equal(full.rank,'LEGEND');
 assert.equal(full.nextRank,null);
 assert.equal(full.rankGoal,null);
 assert.ok(full.achievements.some(x=>x.id==='legend'&&x.unlocked));
 assert.equal(gameProfile(progress(119999,700,50),300,NOW).rank,'MYTHIC');
 assert.equal(gameProfile(progress(120000,699,50),300,NOW).rank,'MYTHIC');
 assert.equal(gameProfile(progress(120000,700,49),300,NOW).rank,'MYTHIC');
});

test('rank status keeps learning coverage, accuracy and milestones',()=>{
 const p=gameProfile(progress(1500,12,1),300,NOW);
 assert.equal(p.accuracy,75);
 assert.equal(p.seen,2);
 assert.equal(p.learned,1);
 assert.equal(p.due,1);
 assert.equal(p.activeDays,1);
 assert.equal(p.rankGoal?.days,2);
 assert.equal(p.rankGoal?.answers,12);
 assert.equal(p.unlockedAchievements,p.achievements.filter(x=>x.unlocked).length);
});

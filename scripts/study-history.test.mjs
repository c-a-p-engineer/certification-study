import test from 'node:test';
import assert from 'node:assert/strict';
import {activitySummary,activitySeries,migrateActivity,recordDailyAnswer,shiftLocalDate,localDateKey,parseLocalDate,normalizeActivity} from '../src/studyHistory.ts';

const today='2026-10-23';
test('local dates roundtrip and invalid dates are refused',()=>{
 assert.equal(localDateKey(parseLocalDate(today)),today);
 assert.equal(shiftLocalDate('2026-10-01',-1),'2026-09-30');
 assert.equal(shiftLocalDate('2026-12-31',1),'2027-01-01');
 assert.equal(parseLocalDate('2026-02-30'),null);
 assert.equal(parseLocalDate('2026-2-3'),null);
 assert.equal(parseLocalDate('garbage'),null);
});
test('migrate only one known legacy quest day; never invent earlier dated answers',()=>{
 const legacy={answered:250,correct:190,daily:{date:'2026-10-22',answered:8,correct:5}};
 assert.deepEqual(migrateActivity(legacy),{'2026-10-22':{answered:8,correct:5}});
 const stats=activitySummary(migrateActivity(legacy),250,190,today);
 assert.equal(stats.activeDays,1);
 assert.equal(stats.loggedAnswered,8);
 assert.equal(stats.unattributedAnswered,242);
 assert.equal(stats.unattributedCorrect,185);
 assert.deepEqual(migrateActivity({...legacy,activity:{}}),{});
 assert.deepEqual(migrateActivity({answered:250,correct:190}),{});
});
test('answers are recorded once with the correct local-day bucket',()=>{
 let history={};
 history=recordDailyAnswer(history,'2026-10-22',true);
 history=recordDailyAnswer(history,'2026-10-22',false);
 history=recordDailyAnswer(history,'2026-10-23',true);
 assert.deepEqual(history,{'2026-10-22':{answered:2,correct:1},'2026-10-23':{answered:1,correct:1}});
 assert.equal(activitySummary(history,3,2,today).todayAnswered,1);
 assert.equal(activitySummary(history,3,2,today).streak,2);
 assert.equal(activitySummary(history,3,2,today).activeDays,2);
});
test('streak holds overnight and resets after an empty day',()=>{
 const previous={'2026-10-20':{answered:1,correct:1},'2026-10-21':{answered:1,correct:1},'2026-10-22':{answered:1,correct:1}};
 const yesterday=activitySummary(previous,3,3,today);
 assert.equal(yesterday.streak,3);
 assert.equal(yesterday.longestStreak,3);
 const gap=activitySummary(previous,3,3,'2026-10-25');
 assert.equal(gap.streak,0);
 assert.equal(gap.longestStreak,3);
});
test('chart does not falsely backfill days prior to logging; missing later days are zero',()=>{
 const history={'2026-10-21':{answered:2,correct:1},'2026-10-23':{answered:3,correct:2}};
 const points=activitySeries(history,35,25,7,today);
 assert.equal(points.length,3);
 assert.deepEqual(points.map(d=>[d.date,d.answered,d.correct]),[['2026-10-21',2,1],['2026-10-22',0,0],['2026-10-23',3,2]]);
 assert.deepEqual(points.map(d=>d.cumulativeAnswered),[32,32,35]);
 assert.deepEqual(points.map(d=>d.cumulativeCorrect),[23,23,25]);
 assert.equal(activitySeries({},35,25,7,today).length,0);
});
test('7/30/90 and full-period windows preserve cumulative total',()=>{
 const history={'2026-08-01':{answered:4,correct:3},'2026-10-23':{answered:1,correct:1}};
 for(const period of [7,30,90,'all']){
  const points=activitySeries(history,105,74,period,today);
  assert.equal(points[points.length-1].cumulativeAnswered,105);
  assert.equal(points[points.length-1].cumulativeCorrect,74);
  assert.equal(points[points.length-1].date,today);
  assert.ok(points.length<=90);
 }
 assert.equal(activitySeries(history,105,74,'all',today)[0].date,'2026-08-01');
});
test('malformed saved activity is ignored safely',()=>{
 assert.deepEqual(normalizeActivity({'2026-10-23':{answered:3,correct:4},'invalid':{answered:10,correct:3},'2026-02-30':{answered:2,correct:1}}),{'2026-10-23':{answered:3,correct:3}});
});

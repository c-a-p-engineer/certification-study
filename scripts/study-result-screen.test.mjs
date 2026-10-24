import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const main=readFileSync('src/main.tsx','utf8');
const result=readFileSync('src/StudyResultScreen.tsx','utf8');
const spec=readFileSync('docs/SPECIFICATION.md','utf8');

test('App delegates complete result composition while retaining repeat, navigation and persistence logic',()=>{
 assert.ok(main.includes('<StudyResultScreen correct={session.correct} total={session.total}'));
 for(const label of ["onShowStatus={()=>showMenu", "onShowTitles={()=>showMenu", "onHome={()=>setMode", "onMore={()=>start(false)", "onRetry={()=>start(review,examMode"]){
  assert.ok(main.includes(label),label);
 }
 assert.ok(main.includes('applyStudyAttempt('));
 assert.ok(main.includes('writeMissionSave('));
 assert.ok(main.includes('sessionAnswers'));
 assert.ok(!main.includes('className="od4-result-report"'));
 assert.ok(!main.includes('className="expedition-result"'));
});

test('result presentation includes all five distinct result modes but never grades or persists itself',()=>{
 for(const label of ["<ResultOverview correct={correct}", "<EnemyCampaignPanel campaign={campaign}", "bossMode&&bossReport",
   "expeditionActive&&expeditionResult", "<DailyFiveFinish correct={dailySummary.correct}", "<ExamReviewPanel questions={questions}",
   "role=\"status\"", "NOT AN AWS SCALED SCORE", "onRetry", "onHome", "onShowTitles"]){
  assert.ok(result.includes(label),label);
 }
 for(const forbidden of ["localStorage", "setProgress(", "applyStudyAttempt(", "recordBossVictory(", "start(", "setMode(", "clearMissionSave("]){
  assert.ok(!result.includes(forbidden),forbidden);
 }
 assert.ok(spec.includes('src/StudyResultScreen.tsx'));
});

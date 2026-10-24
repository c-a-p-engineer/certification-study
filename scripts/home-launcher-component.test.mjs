import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('src/main.tsx','utf8');
const launcher=readFileSync('src/HomeMissionLauncher.tsx','utf8');
const spec=readFileSync('docs/SPECIFICATION.md','utf8');

test('daily learning remains the first prominent home action; resume is not hidden',()=>{
 const daily=launcher.indexOf('<DailyFiveBoard '), mission=launcher.indexOf('START MISSION');
 const advanced=launcher.indexOf('<details className="home-advanced">');
 assert.ok(daily>=0&&mission>daily&&advanced>mission);
 assert.ok(launcher.includes('missionSave&&<div className="resume-row">'));
 assert.ok(launcher.includes('examSave&&<button className="resume-session resume-session-exam"'));
 assert.ok(launcher.includes('disabled={!!missionSave||!!examSave}'));
 assert.ok(source.includes('<HomeMissionLauncher displayTitle={displayTitle}'));
});
test('home mission settings preserve every launch destination and player options',()=>{
 for(const text of ['onResumeMission','onResumeExam','onDiscardMission','onDailyFive','onMission','onWeak',
  'onDomainChange','onMissionLengthChange','onRecallChange','onExam','onCases','onDue','onChooseBoss','onTitles']){
  assert.ok(launcher.includes(text),text);
 }
 assert.ok(launcher.includes('disabled={!weakCount>0}')===false);
 assert.ok(launcher.includes('weakCount>0'));
 assert.ok(launcher.includes('disabled={dueCount===0}'));
 assert.ok(launcher.includes('aria-label="出題分野"'));
 assert.ok(launcher.includes('aria-label="出題数"'));
 assert.ok(launcher.includes('recallFirst'));
 assert.ok(launcher.includes('role="progressbar"'));
 assert.ok(launcher.includes('EXAM TRIAL · 65 Q · 130 MIN'));
});
test('side-effectful operations stay in App; no new grant or save path is introduced',()=>{
 for(const forbidden of ['localStorage','setProgress(','setMode(','clearMissionSave(','saveExam','applyStudyAttempt(','document.']){
  assert.ok(!launcher.includes(forbidden),forbidden);
 }
 assert.ok(source.includes('onDiscardMission={()=>{clearMissionSave();setMissionSave(null)}}'));
 assert.ok(source.includes("onExam={()=>start(false,true)}"));
 assert.ok(source.includes("onDue={()=>start(false,false,true)}"));
 assert.ok(source.includes('scenarioCount={questions.filter(isScenarioQuestion).length}'));
 assert.ok(spec.includes('src/HomeMissionLauncher.tsx'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const main=readFileSync('src/main.tsx','utf8');
const daily=readFileSync('src/HomeDailyOverview.tsx','utf8');
const secondary=readFileSync('src/HomeSecondaryPanels.tsx','utf8');
const spec=readFileSync('docs/SPECIFICATION.md','utf8');

test('homepage is three independently typed display boundaries, in learning-first order',()=>{
 const launch=main.indexOf('<HomeMissionLauncher '),overview=main.indexOf('<HomeDailyOverview '),extra=main.indexOf('<HomeSecondaryPanels');
 assert.ok(launch>0&&overview>launch&&extra>overview);
 assert.ok(daily.includes('className="daily-quest"'));
 assert.ok(daily.includes('<DailyContractBoard {...contracts}/>'));
 assert.ok(daily.includes('<HomeProgressSummary {...stats}/>'));
 assert.ok(daily.includes('<OfflineStatus activeMission={activeMission}/>'));
 assert.ok(secondary.includes('export type HomeSecondaryPanelsProps='));
 assert.ok(secondary.includes('React.ComponentProps<typeof EnemyCampaignPanel>'));
 assert.ok(secondary.includes('React.ComponentProps<typeof HomeMasteryCoverage>'));
});
test('all native disclosure panels survive, start closed, and retain their contents',()=>{
 const ordered=['adventure','review','insights','collection'];
 const positions=ordered.map(key=>secondary.indexOf('data-section="'+key+'"'));
 assert.ok(positions.every(x=>x>=0));assert.deepEqual([...positions].sort((a,b)=>a-b),positions);
 assert.equal((secondary.match(/<details className="home-hub-drawer"/g)||[]).length,4);
 assert.equal((secondary.match(/<\/details>/g)||[]).length,4);
 assert.ok(!secondary.includes('defaultOpen'));
 for(const name of ['DesignSimulator','RetentionQuestBoard','SmartQuestBoard','BossBoard','ActivityTimeline','GrowthDashboard','LearningInsights','SkillTreeBoard','RelicVault']){
  assert.ok(secondary.includes('<'+name+' {...'),name);
 }
});
test('no persistent writes or grading in extracted display compositions',()=>{
 for(const file of [daily,secondary]){
  for(const token of ['localStorage','setProgress(','setMode(','applyStudyAttempt(','clearMissionSave(','recordDesignCompletion(','recordDesignRecall(','setMissionSave(']){
   assert.ok(!file.includes(token),token);
  }
 }
 assert.ok(main.includes('onClaimDaily={claimDaily}'));
 assert.ok(main.includes('onStart:count=>start(false,false,true'));
 assert.ok(main.includes('onFinish:(id,correct,outcomes)=>setProgress('));
 assert.ok(main.includes('onReplay:()=>setProgress('));
 assert.ok(spec.includes('src/HomeDailyOverview.tsx'));
 assert.ok(spec.includes('src/HomeSecondaryPanels.tsx'));
});

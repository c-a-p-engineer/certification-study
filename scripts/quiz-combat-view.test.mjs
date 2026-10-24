import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync('src/main.tsx','utf8');
const view=readFileSync('src/QuizCombatStatus.tsx','utf8');

test('combat display is a pure view without grading, storage or reward writes',()=>{
 assert.ok(main.includes('<QuizCombatStatus quizLayout={quizLayout}'));
 for(const prohibited of ['setProgress(', 'localStorage', 'applyStudyAttempt(', 'recordContractAnswer(', 'scheduleReview(', 'onClick='])
  assert.ok(!view.includes(prohibited),'combat view must not mutate: '+prohibited);
 assert.ok(view.includes('EnemyCampaignPanel'));
 assert.ok(view.includes('CompactQuizHUD'));
 assert.ok(view.includes('BossBattleHUD'));
 assert.ok(view.includes('focus-battle-line'));
 assert.ok(view.includes('fever-milestones'));
});

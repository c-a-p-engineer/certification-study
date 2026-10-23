import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('src/main.tsx','utf8');
const menu=readFileSync('src/GameMenu.tsx','utf8');

test('one prominent launch and one menu for advanced options',()=>{
 assert.equal((source.match(/START MISSION/g)||[]).length,1);
 assert.ok(source.includes('className="quick-start"'));
 assert.ok(source.includes('className="game-menu-trigger"'));
 assert.ok(source.includes('onClick={toggleAudio}'));
 assert.ok(source.includes('<GameMenu tab={menuTab}'));
 assert.equal(source.includes('audioOpen'),false);
 assert.equal(source.includes('sound-settings'),false);
 assert.equal(source.includes('className="mission-go"'),false);
});

test('quiz shows one progress meter, and hints only for non-obvious multi-answer steps',()=>{
 assert.ok(source.includes('className="quiz-stage"'));
 assert.ok(source.includes('aria-label="ミッション進行度"'));
 assert.equal(source.includes('className="game-hud"'),false);
 assert.equal(source.includes('className="overdrive-banner"'),false);
 assert.equal(source.includes('className="instruction-icon"'),false);
 assert.ok(source.includes('{q.answers&&<div className="answer-instructions"'));
 assert.ok(source.includes("className={'fever-meter '"));
 assert.ok(source.includes('className="xp-award"'));
 assert.ok(!source.includes('PERFECT! +XP'));
});

test('glossary remains directly under the question, with pronunciation and detailed entries',()=>{
 const q=source.indexOf('<h2>{q.question}</h2>');
 const guide=source.indexOf('<TermsPanel key={q.id} question={q}/>');
 const options=source.indexOf('className="answers">',q);
 assert.ok(q>=0&&guide>q&&options>guide);
 assert.ok(source.includes('className="term-picker"'));
 assert.ok(source.includes('className="term-card-title"'));
 assert.ok(source.includes('{term.reading}'));
 assert.ok(source.includes('aria-label="正式名称"'));
 assert.equal(source.includes('タップして一覧を開く'),false);
});

test('unique learning information and safeguards are still visible or available on demand',()=>{
 for(const word of ['EXAM TRIAL','RECALL RAID','BOSS RUSH','3回以上の連続正解','合格確率ではありません','NOT AN AWS SCALED SCORE']){
  assert.ok(source.includes(word),word);
 }
 assert.ok(source.includes('className="metric-method"'));
 assert.ok(source.includes('aria-label="出題分野"'));
 assert.ok(source.includes('aria-label="出題数"'));
 assert.ok(source.includes('className="exam-review"'));
 assert.ok(menu.includes('role="dialog"'));
 assert.ok(menu.includes('<details className="gm-haptic-diagnostics">'));
 assert.ok(menu.includes('aria-modal="true"'));
});

test('learning timeline sits on dashboard and records answers in the existing progress store',()=>{
 const timeline=source.indexOf('<ActivityTimeline ');
 const stat=source.indexOf('className="stats"');
 const mastery=source.indexOf('className="mastery-section"');
 assert.ok(stat>=0&&timeline>stat&&mastery>timeline);
 assert.ok(source.includes('recordDailyAnswer(p.activity??migrateActivity(p),answerDay,ok)'));
 assert.ok(source.includes('activity:migrateActivity(old)'));
 assert.ok(source.includes('const rank=profile.rank'));
 assert.equal(source.includes('rankFor('),false);
});

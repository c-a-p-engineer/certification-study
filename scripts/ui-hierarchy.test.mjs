import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('src/main.tsx','utf8');
const reducer=readFileSync('src/studyAttempt.ts','utf8');
const menu=readFileSync('src/GameMenu.tsx','utf8');
const examReview=readFileSync('src/ExamReviewPanel.tsx','utf8');
const quizIntro=readFileSync('src/StudyQuestionIntro.tsx','utf8');
const homeSummary=readFileSync('src/HomeProgressSummary.tsx','utf8');
const resultOverview=readFileSync('src/ResultOverview.tsx','utf8');
const combatView=readFileSync('src/QuizCombatStatus.tsx','utf8');
const optionsView=readFileSync('src/QuizAnswerControls.tsx','utf8');
const feedbackView=readFileSync('src/StudyAnswerFeedback.tsx','utf8');
const masteryView=readFileSync('src/HomeMasteryCoverage.tsx','utf8');

test('one prominent launch and one menu for advanced options',()=>{
 assert.equal((source.match(/START MISSION/g)||[]).length,1);
 assert.ok(source.includes('className="quick-start"'));
 assert.ok(source.includes('className="game-menu-trigger"'));
 assert.ok(source.includes('onClick={toggleAudio}'));
 assert.ok(source.includes('<GameMenu titles={titleCollection}'));
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
 assert.ok(optionsView.includes('{question.answers&&<div className="answer-instructions"'));
 assert.ok(combatView.includes("className={'fever-meter '"));
 assert.ok(feedbackView.includes('className="xp-award"'));
 assert.ok(!source.includes('PERFECT! +XP'));
});

test('glossary remains directly under the question, with pronunciation and detailed entries',()=>{
 const q=quizIntro.indexOf('<h2>{question.question}</h2>');
 const guide=quizIntro.indexOf('<TermsPanel key={question.id} question={question}/>');
 const options=optionsView.indexOf('className="answers">');
 assert.ok(q>=0&&guide>q&&options>=0);
 assert.ok(source.includes('<StudyQuestionIntro question={q}'));
 assert.ok(quizIntro.includes('className="term-picker"'));
 assert.ok(quizIntro.includes('className="term-card-title"'));
 assert.ok(quizIntro.includes('{term.reading}'));
 assert.ok(quizIntro.includes('aria-label="正式名称"'));
 assert.equal(source.includes('タップして一覧を開く'),false);
});

test('unique learning information and safeguards are still visible or available on demand',()=>{
 for(const word of ['EXAM TRIAL','RECALL RAID','BOSS RUSH','NOT AN AWS SCALED SCORE']){
  assert.ok(source.includes(word),word);
 }
 assert.ok(masteryView.includes('className="metric-method"'));
 assert.ok(masteryView.includes('3回以上の連続正解'));
 assert.ok(masteryView.includes('合格確率ではありません'));
 assert.ok(source.includes('<QuizAnswerControls question={q}'));
 assert.ok(source.includes('<StudyAnswerFeedback question={q}'));
 assert.ok(source.includes('<HomeMasteryCoverage questions={questions}'));
 assert.ok(optionsView.includes('className="answer-instructions"'));
 assert.ok(source.includes('aria-label="出題分野"'));
 assert.ok(source.includes('aria-label="出題数"'));
 assert.ok(source.includes('<ExamReviewPanel questions={pool}'));assert.ok(examReview.includes('className="exam-review"'));
 assert.ok(menu.includes('role="dialog"'));
 assert.ok(menu.includes('<details className="gm-haptic-diagnostics">'));
 assert.ok(menu.includes('aria-modal="true"'));
});

test('learning timeline sits on dashboard and records answers in the existing progress store',()=>{
 const timeline=source.indexOf('<ActivityTimeline ');
 const stat=source.indexOf('<HomeProgressSummary ');
 const mastery=source.indexOf('<HomeMasteryCoverage ');
 assert.ok(stat>=0&&timeline>stat&&mastery>timeline);
 assert.ok(homeSummary.includes('className="stats"'));
 assert.ok(reducer.includes('recordDailyAnswer(source.activity??migrateActivity(source),date,event.correct)'));
 assert.ok(source.includes('activity:migrateActivity(old)'));
 assert.ok(source.includes('const rank=profile.rank'));
 assert.equal(source.includes('rankFor('),false);
});

test('scenario-only challenge is discoverable and survives practice resume',()=>{
 assert.ok(source.includes('CASE FILES · {questions.filter(isScenarioQuestion).length} SCENARIOS'));
 assert.ok(source.includes('start(false,false,false,false,true)'));
 assert.ok(source.includes('setCaseMode(!!saved.scenario)'));
 assert.ok(source.includes('scenario:caseMode'));
 assert.ok(source.includes('start(review,examMode,studyMode===\'due\',bossMode,caseMode,bossDomain??undefined,skillFocus??undefined,adaptiveMode,retentionMode?(pool.length<=5?5:10):undefined,expeditionMode??undefined)'));
});

test('gamified progress and title unlocks are discoverable without extra overlays',()=>{
 assert.ok(source.includes('className="hero-level-hud"'));
 assert.ok(source.includes('aria-label="次のレベルまでの進行度"'));
 assert.ok(source.includes("onClick={()=>showMenu('titles')}"));
 assert.ok(combatView.includes('className="fever-milestones"'));
 assert.ok(resultOverview.includes('className="clear-judgement"'));
 assert.ok(source.includes('<ResultOverview correct={session.correct}'));
 assert.ok(resultOverview.includes('grade.letter'));
 assert.ok(feedbackView.includes('className="title-drop"'));
});
test('timed exam holds new badges and rank promotions until the result screen',()=>{
 assert.ok(source.includes("if(examMode&&mode==='quiz'){setDeferredRankNotice(current)}"));
 assert.ok(source.includes("if(examMode&&mode==='result'&&deferredRankNotice)"));
 assert.ok(source.includes("if(!examMode){setNewTitleIds([]);setNewRelicIds([])}"));
 assert.ok(source.includes("examMode&&(newTitleIds.length>0||newRelicIds.length>0)&&"));
 assert.ok(!source.includes('selected!==null&&examMode&&<div className="explanation"'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync('src/main.tsx','utf8');
const options=readFileSync('src/QuizAnswerControls.tsx','utf8');
const coverage=readFileSync('src/HomeMasteryCoverage.tsx','utf8');
const secondary=readFileSync('src/HomeSecondaryPanels.tsx','utf8');
const spec=readFileSync('docs/SPECIFICATION.md','utf8');

test('quiz selection controls send answers through one controller callback',()=>{
 assert.match(main,/<QuizAnswerControls question={q}/);
 assert.match(main,/onReveal=\{\(\)=>setShowChoices\(true\)\}/);
 assert.match(main,/onToggle=\{toggleChoice\}/);
 assert.match(main,/onAnswer=\{answer\}/);
 assert.match(options,/question\.answers&&<div className="answer-instructions"/);
 assert.match(options,/onAnswer\(\[originalIndex\]\)/);
 assert.match(options,/onAnswer\(\[\.\.\.multiChoices\]\)/);
 assert.match(options,/multiChoices\.length!==question\.answers\.length/);
 assert.match(options,/disabled=\{selected!==null\}/);
 for(const term of ['localStorage','setProgress','applyStudyAttempt','scheduleReview'])assert.ok(!options.includes(term));
});
test('home mastery and domain coverage stay visible on demand with unchanged meaning',()=>{
 assert.ok(main.includes('mastery={{questions,masteryMap,reviews:progress.reviews||{}}}'));
 assert.ok(secondary.includes('<HomeMasteryCoverage {...mastery}/>'));
 assert.match(coverage,/3回以上の連続正解/);
 assert.match(coverage,/合格確率ではありません/);
 assert.match(coverage,/className="mastery-section"/);
 assert.match(coverage,/className="coverage-panel"/);
 for(const term of ['localStorage','setProgress','applyStudyAttempt'])assert.ok(!coverage.includes(term));
});
test('spec maps the screen boundaries to behavior and no new data store',()=>{
 assert.ok(spec.includes('src/QuizAnswerControls.tsx'));
 assert.ok(spec.includes('src/HomeMasteryCoverage.tsx'));
 assert.ok(spec.includes('348問'));
 assert.ok(spec.includes('既存ローカル履歴'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gradeAnswer} from '../src/studyAttempt.ts';
const component=readFileSync('src/ExamReviewPanel.tsx','utf8');
const main=readFileSync('src/main.tsx','utf8');
test('mock exam review is a separate pure display component; graded answer transaction remains the sole writer',()=>{
 assert.ok(main.includes('import ExamReviewPanel from'));
 assert.ok(main.includes('<ExamReviewPanel questions={pool} answers={sessionAnswers}'));
 assert.ok(!main.includes('<div className="exam-review">'));
 assert.ok(component.includes('className="exam-review"'));
 assert.ok(component.includes('gradeAnswer(given,expected)'));
 assert.ok(!component.includes('setProgress('));
 assert.ok(!component.includes('localStorage'));
 assert.ok(!component.includes('xp:'));
});
test('exact-set grading matches practice reducer for multi-select including duplicates',()=>{
 assert.equal(gradeAnswer([0,2],[0,2]),true);
 assert.equal(gradeAnswer([2,0],[0,2]),true);
 assert.equal(gradeAnswer([0,0],[0,2]),false);
 assert.equal(gradeAnswer([0],[0,2]),false);
 assert.equal(gradeAnswer([0,1],[0,2]),false);
});
test('exam review retains unanswered, source, glossary, per-option feedback and safe links',()=>{
 for(const snippet of ['UNANSWERED','INCORRECT','CORRECT','{renderTerms(question)}','<QuestionFeedback','choice-reasons','https://chatgpt.com/','rel="noopener noreferrer"','AWS公式資料']){
  assert.ok(component.includes(snippet),snippet);
 }
 assert.ok(component.includes('question.distractorReasons'));
 assert.ok(component.includes('questions.map('));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync('src/main.tsx','utf8');
const ui=readFileSync('src/StudyAnswerFeedback.tsx','utf8');
const spec=readFileSync('docs/SPECIFICATION.md','utf8');

test('feedback view preserves explanations, correctness, learning resources and self-review',()=>{
 for(const token of ['className="explanation"','className="xp-award"','retentionBonus',
  "onReflect('again')","onReflect('unsure')","onReflect('good')",
  '<DecisionBreakdown key={question.id} question={question}/>','question.reference',
  '<QuestionFeedback id={question.id}','ChatGPTに聞く']){
  assert.ok(ui.includes(token),token);
 }
 assert.ok(main.includes('<StudyAnswerFeedback question={q}'));
 assert.ok(main.includes('onReflect={reflect}'));
 assert.ok(main.includes('onNext={next}'));
});
test('feedback view calls controller actions instead of writing learner state',()=>{
 for(const forbidden of ['setProgress(','saveEquippedTitle(','setNewTitleIds(','navigator.clipboard','localStorage','applyStudyAttempt(']){
  assert.ok(!ui.includes(forbidden),forbidden);
 }
 assert.ok(main.includes('equipTitle(id);setNewTitleIds([])'));
 assert.ok(main.includes('navigator.clipboard?.writeText(makeChatGPTPrompt(q,sessionAnswers[q.id]))'));
 assert.ok(ui.includes('onEquipTitle(newTitleIds[0])'));
 assert.ok(ui.includes('onCopyPrompt()'));
 assert.ok(spec.includes('src/StudyAnswerFeedback.tsx'));
});

test('decision contrast stays after grading, supports multi-select and is display-only',()=>{
 const decision=readFileSync('src/DecisionBreakdown.tsx','utf8');
 const css=readFileSync('src/decisionBreakdown.css','utf8');
 assert.ok(ui.includes('<DecisionBreakdown key={question.id} question={question}/>'));
 assert.ok(decision.includes('question.answers ?? (question.answer === undefined ? [] : [question.answer])'));
 assert.ok(decision.includes('correct.has(i)'));
 assert.ok(decision.includes('expandTerms(question.explanation)'));
 assert.ok(decision.includes('question.distractorReasons?.length === question.choices.length'));
 assert.ok(decision.includes('aria-expanded={showContrast}'));
 assert.ok(decision.includes('React.useState(false)'));
 for(const forbidden of ['localStorage','applyStudyAttempt','setProgress','scheduleReview','fetch('])assert.ok(!decision.includes(forbidden));
 assert.ok(css.includes('min-height:44px'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(spec.includes('DECISION BREAK'));
});

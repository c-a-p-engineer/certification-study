import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync('src/main.tsx','utf8');
const ui=readFileSync('src/StudyAnswerFeedback.tsx','utf8');
const spec=readFileSync('docs/SPECIFICATION.md','utf8');

test('feedback view preserves explanations, correctness, learning resources and self-review',()=>{
 for(const token of ['className="explanation"','className="xp-award"','retentionBonus',
  "onReflect('again')","onReflect('unsure')","onReflect('good')",
  'expandTerms(question.explanation)','question.distractorReasons','question.reference',
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

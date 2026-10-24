import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync('src/main.tsx','utf8');
const hook=readFileSync('src/useQuizSessionState.ts','utf8');
const spec=readFileSync('docs/SPECIFICATION.md','utf8');

test('App delegates local session state as one hook and keeps reducer ownership',()=>{
 assert.ok(main.includes('useQuizSessionState(()=>shuffle('));
 assert.ok(hook.includes('export function useQuizSessionState'));
 for(const token of ['index,setIndex','multiChoices,setMultiChoices','sessionAnswers,setSessionAnswers',
  'examMode,setExamMode','dailyFocus,setDailyFocus','bossReport,setBossReport',
  'expeditionResult,setExpeditionResult','attemptRunId']){
  if(token==='attemptRunId')assert.ok(main.includes('setAttemptRunId')); // persistent receipts remain outside the hook
  else assert.ok(hook.includes(token),token);
 }
 assert.ok(main.includes('applyStudyAttempt('));
 assert.ok(main.includes('writeMissionSave('));
 assert.ok(main.includes('const practiceGrade=missionGrade(session.correct,session.total)'));
 assert.ok(main.includes('React.StrictMode'));
});
test('session hook owns state only, preserving clean transactional boundaries',()=>{
 for(const forbidden of ['localStorage','writeMissionSave(','applyStudyAttempt(','recordDesignCompletion(','setProgress(','window.']){
  assert.ok(!hook.includes(forbidden),forbidden);
 }
 assert.ok(hook.includes('useRef(false)'));
 assert.ok(hook.includes('useState<number[]>(createChoiceOrder)'));
 const names=[...hook.matchAll(/const \[(\w+),\w+\]=useState/g)].map(x=>x[1]);
 assert.equal(names.length,29); // 29 local state slots are deliberately extracted
 assert.equal(new Set(names).size,names.length);
});
test('spec explicitly defines state ownership, unchanged progress and mode semantics',()=>{
 assert.ok(spec.includes('src/useQuizSessionState.ts'));
 assert.ok(spec.includes('applyStudyAttempt'));
 assert.ok(spec.includes('保存'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyStudyAttempt,gradeAnswer,dailyQuestUniqueCount,normalizeAttemptReceipts,MAX_ATTEMPT_RECEIPTS} from '../src/studyAttempt.ts';
import {localDateKey} from '../src/studyHistory.ts';
import {ENEMIES} from '../src/enemyCampaign.ts';
import {isMissionSave} from '../src/missionSave.ts';
import {createBackup,parseBackup,BACKUP_KEYS} from '../src/backup.ts';
import {readPortableBackup,createVerifiedBackup} from '../src/backupIntegrity.ts';
const at=(date)=>new Date(date).getTime();
const first=at('2026-10-23T10:00:00Z'),same=at('2026-10-23T12:00:00Z'),next=at('2026-10-24T12:00:00Z');
const progress=()=>({xp:320,best:2,answered:6,correct:4,mistakes:[],reviews:{},domains:{},activity:{},dailyContracts:undefined});
const event=(id='run-abc123:0:saa-002',atTime=first,overrides={})=>({
 attemptId:id,questionId:'saa-002',domain:'セキュリティ',correct:true,combo:1,
 difficulty:2,mode:'normal',boss:false,at:atTime,...overrides
});
const store=(seed={})=>{const values=new Map(Object.entries(seed));return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
test('order-independent multi-choice grading rejects malformed or repeated choices',()=>{
 assert.equal(gradeAnswer([2,0,1],[0,1,2]),true);
 assert.equal(gradeAnswer([0,0,1],[0,1]),false);
 assert.equal(gradeAnswer([],[]),false);
 assert.equal(gradeAnswer([0,3],[0,1]),false);
 assert.equal(gradeAnswer([0,-1],[0,1]),false);
});
test('the answer reducer is deterministic, leaves input untouched, and credits one event exactly once',()=>{
 const start=progress(),before=JSON.stringify(start),item=event();
 const a=applyStudyAttempt(start,item),b=applyStudyAttempt(start,item);
 assert.deepEqual(a,b);
 assert.equal(JSON.stringify(start),before);
 assert.equal(a.reward.credited,true);
 assert.equal(a.reward.baseXp,120);
 assert.equal(a.progress.xp,320+a.reward.totalXp);
 assert.equal(a.progress.answered,7);
 assert.equal(a.progress.reviews['saa-002'].streak,1);
 assert.equal(a.progress.answerHistory.length,1);
 assert.equal(a.progress.attemptReceipts.length,1);
 const repeated=applyStudyAttempt(a.progress,item);
 assert.strictEqual(repeated.progress,a.progress);
 assert.equal(repeated.reward.credited,false);
 assert.equal(repeated.reward.totalXp,0);
 assert.equal(repeated.reward.campaign,null);
});
test('same local-day replay gets no XP or campaign damage and does not extend correct streak',()=>{
 const firstAnswer=applyStudyAttempt(progress(),event()).progress;
 const repeated=applyStudyAttempt(firstAnswer,event('run-def456:0:saa-002',same));
 assert.equal(repeated.reward.sameDayRepeat,true);
 assert.equal(repeated.reward.baseXp,0);
 assert.equal(repeated.reward.campaignXp,0);
 assert.equal(repeated.reward.retentionXp,0);
 assert.equal(repeated.progress.xp,firstAnswer.xp);
 assert.deepEqual(repeated.progress.enemyCampaign,firstAnswer.enemyCampaign);
 assert.equal(repeated.progress.reviews['saa-002'].streak,1);
 assert.equal(repeated.progress.answered,firstAnswer.answered+1,'Practice history still honestly logs activity');
 assert.equal(repeated.progress.answerHistory.length,2);
});
test('prior-day overdue recall preserves next-day XP and only gives the extra 25 XP in retention mode',()=>{
 let p=applyStudyAttempt(progress(),event()).progress;
 const retry=applyStudyAttempt(p,event('run-ret123:0:saa-002',next,{mode:'retention'}));
 assert.equal(retry.reward.sameDayRepeat,false);
 assert.equal(retry.reward.baseXp,120);
 assert.equal(retry.reward.retentionXp,25);
 assert.equal(retry.progress.retrievalRewards.questionIds.length,1);
 assert.equal(retry.progress.reviews['saa-002'].streak,2);
 const duplicate=applyStudyAttempt(retry.progress,event('run-ret999:0:saa-002',next+1,{mode:'retention'}));
 assert.equal(duplicate.reward.totalXp,0);
});
test('mock-exam progress is isolated from rank XP, mastery scheduling, daily quests and campaign',()=>{
 const start=progress();
 const result=applyStudyAttempt(start,event('run-exam01:9:saa-002',first,{mode:'exam',boss:false}));
 assert.equal(result.reward.totalXp,0);
 assert.equal(result.reward.campaign,null);
 for(const key of ['xp','answered','correct','domains','reviews','daily','dailyContracts','enemyCampaign','activity'])assert.deepEqual(result.progress[key],start[key],key);
 assert.equal(result.progress.answerHistory.length,1);
 assert.equal(result.progress.answerHistory[0].exam,true);
 assert.equal(result.progress.attemptReceipts.length,1);
 assert.strictEqual(applyStudyAttempt(result.progress,event('run-exam01:9:saa-002',first,{mode:'exam'})).progress,result.progress);
});
test('legacy XP is unchanged and daily quest requires 5 different practice IDs',()=>{
 const date='2026-10-23',p=progress();
 assert.equal(applyStudyAttempt(p,event()).progress.xp>=p.xp,true);
 assert.equal(dailyQuestUniqueCount(undefined,date,{date,answered:5}),5,'Grandfather pre-event-history daily quest');
 const history=['a','a','b','c','d','e'].map((id,i)=>({id,domain:'セキュリティ',day:date,correct:true,firstAttempt:true,due:false,recovery:false,exam:i===5,mode:i===5?'exam':'normal'}));
 assert.equal(dailyQuestUniqueCount(history,date,{date,answered:99}),4);
 history[5].exam=false;
 assert.equal(dailyQuestUniqueCount(history,date,{date,answered:99}),5);
 assert.equal(dailyQuestUniqueCount(history,'2026-10-24',{date,answered:99}),0);
});
test('bounded receipt arrays and optional legacy mission runId survive validation',()=>{
 const ids=Array.from({length:MAX_ATTEMPT_RECEIPTS+12},(_,i)=>'run-'+i+':0:saa-001');
 assert.equal(normalizeAttemptReceipts(ids).length,MAX_ATTEMPT_RECEIPTS);
 assert.equal(normalizeAttemptReceipts(['short','unique1','unique1',null]).length,1);
 const saved={version:1,ids:['saa-001'],index:0,selected:null,multiChoices:[],choiceOrder:[0,1,2,3],answers:{},session:{correct:0,total:0},combo:0,weak:false,boss:false,due:false,showChoices:true,reflection:'',savedAt:first};
 assert.equal(isMissionSave(saved),true);
 assert.equal(isMissionSave({...saved,runId:'a62defc0-c8fe-4315-873b-3f8084f58a7c'}),true);
 assert.equal(isMissionSave({...saved,runId:'x'}),false);
});
test('old v1 and SHA256 v2 backups retain receipts and reject invalid receipt duplication',async()=>{
 const p=applyStudyAttempt(progress(),event()).progress;
 const original=store({[BACKUP_KEYS[0]]:JSON.stringify(p)});
 const v1=createBackup(original);
 assert.equal(parseBackup(JSON.stringify(v1)).items[BACKUP_KEYS[0]],JSON.stringify(p));
 const v2=await createVerifiedBackup(original);
 const parsed=await readPortableBackup(JSON.stringify(v2));
 assert.equal(parsed.integrity,'verified');
 assert.equal(JSON.parse(parsed.data.items[BACKUP_KEYS[0]]).attemptReceipts.length,1);
 const corrupt=JSON.stringify({...p,attemptReceipts:[...p.attemptReceipts,...p.attemptReceipts]});
 assert.throws(()=>parseBackup(JSON.stringify({...v1,items:{...v1.items,[BACKUP_KEYS[0]]:corrupt}})),/学習記録/);
});
test('published UI declares fair XP semantics and the answer path calls the pure reducer once',()=>{
 const main=readFileSync('src/main.tsx','utf8');
 assert.ok(main.includes('applyStudyAttempt(p,event).progress'));
 assert.ok(main.includes('setAttemptRunId(saved.runId'));
 assert.ok(main.includes('attemptId:attemptRunId'));
 assert.ok(main.includes('同日再解答・模擬試験ではXPを加算しません'));
 assert.ok(main.includes('dailyQuestUniqueCount(p.answerHistory'));
 assert.ok(main.includes('const smartPlan=useMemo('));
 assert.ok(main.includes('questionById.get(id)'));
});

import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {planRetentionQuest,eligibleForDelayedRecall,normalizeRecallRewards,recordDelayedRecallReward,RECALL_DAILY_LIMIT,RECALL_BONUS_XP} from '../src/retentionQuest.ts';
import {isMissionSave} from '../src/missionSave.ts';
const at=(day,hour=12)=>new Date(day+'T'+String(hour).padStart(2,'0')+':00:00Z').getTime();
const now=at('2026-10-24'),yesterday=at('2026-10-23'),todayMorning=at('2026-10-24',8);
const q=(id,domain='セキュリティ',difficulty=2)=>({id,domain,question:'実務要件の違いを比較して最も適切なAWS構成を選びます。',difficulty});
const review=(dueAt=now-86400000,lastReviewedAt=yesterday,lapses=1,streak=1)=>({dueAt,lastReviewedAt,lapses,streak,intervalDays:1});
test('micro-raid selects truly delayed overdue reviews, not unseen or same-day replay',()=>{
 const questions=[q('a'),q('b'),q('c'),q('d')],reviews={a:review(),b:review(now-1,todayMorning),c:review(now+86400000,yesterday)};
 const planned=planRetentionQuest(questions,reviews,5,now);
 assert.deepEqual(planned.questions.map(x=>x.id),['a']);
 assert.equal(planned.dueTotal,1);assert.equal(planned.ignoredSameDay,1);
 assert.equal(eligibleForDelayedRecall(reviews.b,now),false);
 assert.equal(eligibleForDelayedRecall(reviews.c,now),false);
 assert.equal(eligibleForDelayedRecall(undefined,now),false);
});
test('five and ten question modes are deterministic, domain-balanced and ignore repeated IDs',()=>{
 const questions=['セキュリティ','耐障害性','パフォーマンス','コスト最適化'].flatMap((d,j)=>Array.from({length:5},(_,i)=>q('q'+(j*5+i),d,3)));
 questions.push({...questions[0]});const reviews=Object.fromEntries(questions.map(x=>[x.id,review(now-3*86400000)]));
 const five=planRetentionQuest(questions,reviews,5,now),ten=planRetentionQuest(questions,reviews,10,now);
 assert.equal(five.questions.length,5);assert.equal(ten.questions.length,10);
 assert.equal(new Set(ten.questions.map(x=>x.id)).size,10);
 const doms=Object.values(Object.fromEntries([...new Set(ten.questions.map(x=>x.domain))].map(d=>[d,ten.questions.filter(x=>x.domain===d).length])));
 assert.ok(Math.max(...doms)-Math.min(...doms)<=1);
 assert.deepEqual(planRetentionQuest(questions,reviews,10,now).questions,ten.questions);
 assert.ok(ten.questions.every(x=>ten.reasons[x.id].includes('期限から')));
});
test('reward is idempotent, correct-only, only after an earlier-day exposure and 125 XP daily cap',()=>{
 let state=undefined,total=0;
 for(let i=0;i<12;i++){
  const x=recordDelayedRecallReward(state,'a'+i,review(),true,true,now);
  state=x.state;total+=x.award;
 }
 assert.equal(total,RECALL_DAILY_LIMIT*RECALL_BONUS_XP);
 assert.equal(state.questionIds.length,RECALL_DAILY_LIMIT);
 assert.equal(recordDelayedRecallReward(state,'a0',review(),true,true,now).award,0);
 assert.equal(recordDelayedRecallReward(state,'new',review(),true,true,now).award,0);
 assert.equal(recordDelayedRecallReward(undefined,'wrong',review(),false,true,now).award,0);
 assert.equal(recordDelayedRecallReward(undefined,'regular',review(),true,false,now).award,0);
 assert.equal(recordDelayedRecallReward(undefined,'same-day',review(now-1,todayMorning),true,true,now).award,0);
 assert.equal(recordDelayedRecallReward(state,'tomorrow',review(),true,true,at('2026-10-25')).award,25);
});
test('NaN dates and corrupt daily reward metadata cannot fabricate credit',()=>{
 const corrupt={...review(),dueAt:NaN};
 assert.equal(eligibleForDelayedRecall(corrupt,now),false);
 assert.equal(planRetentionQuest([q('a')],{a:corrupt},5,now).questions.length,0);
 assert.deepEqual(normalizeRecallRewards({day:'2026-10-24',questionIds:[1,'ok','ok','x']},'2026-10-24').questionIds,['ok','x']);
 assert.deepEqual(normalizeRecallRewards({day:'2026-10-23',questionIds:['ok']},'2026-10-24').questionIds,[]);
});
test('optional retention flag saves without breaking old v1 missions and appears in in-quiz reasons',()=>{
 const old={version:1,ids:['abc'],index:0,selected:null,multiChoices:[],choiceOrder:[0,1,2,3],answers:{},session:{correct:0,total:0},combo:0,weak:false,boss:false,due:true,showChoices:true,reflection:'',savedAt:now};
 assert.equal(isMissionSave(old),true);
 assert.equal(isMissionSave({...old,retention:true}),true);
 assert.equal(isMissionSave({...old,retention:'true'}),false);
 const main=readFileSync('src/main.tsx','utf8');
 const reducer=readFileSync('src/studyAttempt.ts','utf8');
 assert.ok(main.includes('planRetentionQuest(subset'));
 assert.ok(reducer.includes('recordDelayedRecallReward('));
 assert.ok(main.includes('setRetentionMode(!!saved.retention)'));
 assert.ok(main.includes('setSmartWhy(dailySelection?.reasons??retentionSelection?.reasons'));
 assert.ok(main.includes('mode:examMode?\'exam\':retentionMode?\'retention\''));
 assert.ok(reducer.includes("event.mode==='retention'&&!event.boss"));
});

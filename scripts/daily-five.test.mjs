import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {planDailyFive,summarizeDailyFive} from '../src/dailyFive.ts';
import {isMissionSave} from '../src/missionSave.ts';
const now=new Date(2026,9,24,12).getTime(),yesterday=new Date(2026,9,23,12).getTime(),earlier=new Date(2026,9,21,12).getTime();
const q=(id,domain='セキュリティ')=>({id,domain,question:'長期保持する監査ログとIAMの認可設計',choices:['A','B','C','D'],answer:1});
const r=(dueAt=now-1000,lastReviewedAt=yesterday,lapses=0)=>({dueAt,lastReviewedAt,lapses,streak:1,intervalDays:1});
test('five-question daily plan prioritizes two due, one old mistake and two never-seen',()=>{
 const bank=[q('due1'),q('due2','耐障害性'),q('due3'),q('weak','パフォーマンス'),q('unseen1','セキュリティ'),q('unseen2','コスト最適化'),q('unseen3')];
 const reviews={due1:r(),due2:r(now-86400000,earlier,2),due3:r(),weak:r(now+86400000,earlier,1)};
 const plan=planDailyFive(bank,reviews,['weak'],[],now);
 assert.equal(plan.questions.length,5);assert.equal(new Set(plan.questions.map(x=>x.id)).size,5);
 assert.deepEqual(plan.counts,{due:2,weak:1,fresh:2,returning:0});
 assert.equal(plan.eligibleDue,3);
 assert.ok(plan.items.every(x=>x.reason.length>12));
 assert.deepEqual(planDailyFive(bank,reviews,['weak'],[],now).questions,plan.questions);
});
test('no due questions must be described as fresh; no fake recall count or XP',()=>{
 const bank=[q('a'),q('b'),q('c')];
 const plan=planDailyFive(bank,{},[],[],now);
 assert.equal(plan.eligibleDue,0);assert.equal(plan.counts.fresh,3);
 assert.equal(plan.available,3);assert.equal(plan.full,false);
 assert.match(plan.advice,/期限到来の復習はありません/);
 assert.equal(planDailyFive([],{},[],[],now).available,0);
});
test('same-day answered events and same-day review state exclude duplicate grinding',()=>{
 const bank=[q('a'),q('b'),q('c'),q('d')];
 const reviews={a:r(now-1000,now-3600000),b:r(now-1000,yesterday)};
 const history=[{id:'c',domain:'セキュリティ',day:'2026-10-24',correct:true,firstAttempt:true,due:false,recovery:false,exam:false,mode:'normal'}];
 const plan=planDailyFive(bank,reviews,[],history,now);
 assert.deepEqual(plan.questions.map(x=>x.id),['b','d']);
 assert.equal(plan.counts.due,1);
 assert.equal(plan.counts.fresh,1);
});
test('daily result counts exact-set grading, types and unique domains without inventing learning',()=>{
 const bank=[q('a'),q('b','耐障害性'),{...q('c','パフォーマンス'),answers:[0,2],answer:undefined}];
 const summary=summarizeDailyFive(bank,{a:[1],b:[0],c:[0,2]},{a:'due',b:'weak',c:'fresh'},now);
 assert.equal(summary.correct,2);assert.equal(summary.answered,3);
 assert.deepEqual(summary.missed,['b']);assert.equal(summary.uniqueDomains,3);
 assert.equal(summary.observedDue,1);assert.equal(summary.newConcepts,1);
 assert.equal(summary.canStop,true);assert.equal(summary.suggestedDay,'2026-10-25');
});
test('legacy mission stays valid and optional daily five cannot forge six or invalid categories',()=>{
 const old={version:1,ids:['a','b','c','d','e'],index:0,selected:null,multiChoices:[],choiceOrder:[0,1,2,3],answers:{},session:{correct:0,total:0},combo:0,weak:false,boss:false,due:false,showChoices:true,reflection:'',savedAt:now};
 assert.equal(isMissionSave(old),true);
 const fields={dailyFocus:true,dailyTypes:{a:'due',b:'fresh',c:'weak',d:'fresh',e:'returning'}};
 assert.equal(isMissionSave({...old,...fields}),true);
 assert.equal(isMissionSave({...old,...fields,ids:[...old.ids,'f']}),false);
 assert.equal(isMissionSave({...old,...fields,dailyTypes:{...fields.dailyTypes,e:'false'}}),false);
});
test('daily UI is first study action and has explicit non-coercive session stop and saved selection reasons',()=>{
 const main=readFileSync('src/main.tsx','utf8'),header=readFileSync('src/QuizStageHeader.tsx','utf8'),ui=readFileSync('src/DailyFiveBoard.tsx','utf8');
 assert.ok(main.includes('<DailyFiveBoard plan={dailyFivePlan}'));
 assert.ok(main.indexOf('<DailyFiveBoard')<main.indexOf('START MISSION'));
 assert.ok(header.includes('dailyFocus?"DAILY FIVE"'));
 assert.ok(main.includes('<QuizStageHeader examMode={examMode}'));
 assert.ok(main.includes('dailyTypes:dailyFocus?dailyTypes:undefined'));
 assert.ok(main.includes('setDailyFocus(!!saved.dailyFocus)'));
 assert.ok(main.includes('mode:examMode?\'exam\':dailyFocus?\'daily\''));
 assert.ok(main.includes('!dailyFocus&&<div className="hero-actions"'));
 assert.ok(ui.includes('今日はここで終了'));
 assert.ok(ui.includes('追加で学習'));
 assert.ok(ui.includes('期限到来が0問'));
});

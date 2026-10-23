import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTRACTS,todayContracts,recordContractAnswer,claimContract,contractsCompleted} from '../src/dailyContracts.ts';
const date='2026-10-23';
const event=(id,other={})=>({date,questionId:id,correct:true,exam:false,firstAttempt:true,previouslyIncorrect:false,reviewDue:false,...other});
test('brand new learner starts with four empty contracts',()=>{
 const state=todayContracts(undefined,date);
 assert.deepEqual(CONTRACTS.map(item=>state[item.id].length),[0,0,0,0]);
 assert.equal(contractsCompleted(undefined,date),0);
});
test('distinct first-time correct answers satisfy practice and exploration goals',()=>{
 let state=todayContracts(undefined,date);
 state=recordContractAnswer(state,event('q1'));
 state=recordContractAnswer(state,event('q1'));
 state=recordContractAnswer(state,event('q2'));
 state=recordContractAnswer(state,event('q3'));
 assert.equal(state.warmup.length,3);
 assert.equal(state.explore.length,3);
 assert.equal(state.recover.length,0);
 assert.equal(claimContract(state,date,'warmup').award,80);
 const claim=claimContract(state,date,'explore');
 assert.equal(claim.award,120);
 assert.equal(claimContract(claim.contracts,date,'explore').award,0);
});
test('error, timed exam or repeated correct answers do not farm contracts',()=>{
 let state=todayContracts(undefined,date);
 state=recordContractAnswer(state,event('q1',{correct:false}));
 state=recordContractAnswer(state,event('q2',{exam:true}));
 state=recordContractAnswer(state,event('q3',{firstAttempt:false}));
 assert.deepEqual(state.explore,[]);
 assert.deepEqual(state.warmup,['q3']);
 assert.equal(claimContract(state,date,'warmup').award,0);
});
test('recovery and due review credit only qualify before answering',()=>{
 let state=todayContracts(undefined,date);
 state=recordContractAnswer(state,event('a',{firstAttempt:false,previouslyIncorrect:true,reviewDue:true}));
 state=recordContractAnswer(state,event('b',{firstAttempt:false,previouslyIncorrect:true,reviewDue:true}));
 state=recordContractAnswer(state,event('b',{firstAttempt:false,previouslyIncorrect:true,reviewDue:true}));
 assert.equal(state.recover.length,2);assert.equal(state.recall.length,2);
 const claimed=claimContract(state,date,'recover');
 assert.equal(claimed.award,160);
 assert.equal(claimContract(claimed.contracts,date,'recover').award,0);
 assert.equal(claimContract(claimed.contracts,date,'recall').award,180);
});
test('new local day resets goals but not the profile XP history',()=>{
 const yesterday=claimContract(recordContractAnswer(recordContractAnswer(recordContractAnswer(null,event('x')),event('y')),event('z')),date,'explore').contracts;
 assert.equal(yesterday.claimed[0],'explore');
 const tomorrow=todayContracts(yesterday,'2026-10-24');
 assert.deepEqual(tomorrow.claimed,[]);assert.equal(tomorrow.explore.length,0);
 assert.equal(claimContract(yesterday,'2026-10-24','explore').award,0);
});
test('malformed state cannot manufacture a reward',()=>{
 const s=todayContracts({date,warmup:['x','x',12],claimed:['bogus']},date);
 assert.deepEqual(s.warmup,['x']);assert.deepEqual(s.claimed,[]);
 assert.equal(claimContract(s,date,'warmup').award,0);
});

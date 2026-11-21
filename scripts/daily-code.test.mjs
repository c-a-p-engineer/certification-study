import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {CONCEPTS} from '../src/termGuide.ts';
import {DAILY_CODE_SETS,dailyCodePuzzle,randomCodePuzzle,readRecentCodeSets,rememberRandomCodeSet,RANDOM_CODE_RECENT_KEY,derangedDailyAnswers,dailyMatchResult,dailyCodeScore,readDailyBest,writeDailyBest,DAILY_CODE_KEY} from '../src/reborn/dailyCodeEngine.ts';

test('every preset has four distinct, already-curated AWS services and distinct meanings',()=>{
 const catalog=new Map(CONCEPTS.map(c=>[c.id,c]));
 assert.ok(DAILY_CODE_SETS.length>=40,'at least forty reviewed combinations');
 assert.equal(new Set(DAILY_CODE_SETS.map(ids=>[...ids].sort().join(','))).size,DAILY_CODE_SETS.length,'every combination is distinct');
 for(const ids of DAILY_CODE_SETS){
  assert.equal(ids.length,4);
  assert.equal(new Set(ids).size,4);
  const terms=ids.map(id=>catalog.get(id));
  assert.ok(terms.every(x=>x?.category==='AWSサービス'));
  assert.equal(new Set(terms.map(x=>x.meaning)).size,4);
  assert.ok(terms.every(x=>x?.note&&x.reading));
  assert.ok(terms.every(x=>x?.title&&x.meaning));
 }
});
test('local-date daily puzzle has deterministic selection and answer mapping',()=>{
 const a=dailyCodePuzzle('2026-11-21');
 assert.deepEqual(a,dailyCodePuzzle('2026-11-21'));
 assert.equal(a.answers.length,4);assert.equal(a.clues.length,4);
 assert.deepEqual(new Set(a.answers.map(t=>t.id)),new Set(a.clues.map(t=>t.id)));
 assert.equal(new Set(a.answers.map(t=>t.id)).size,4);
 assert.throws(()=>dailyCodePuzzle('tomorrow'));
});
test('regression: same-row tapping never solves the 2026-11-21 daily code puzzle',()=>{
 const puzzle=dailyCodePuzzle('2026-11-21');
 const positionalMatches=puzzle.clues.filter((clue,i)=>clue.id===puzzle.answers[i].id);
 assert.equal(positionalMatches.length,0,'no clue may match the answer in the same row');
 for(let i=0;i<4;i++){
  assert.equal(dailyMatchResult(puzzle.clues[i].id,puzzle.answers[i].id,[]),'wrong');
 }
});
test('the same-row shortcut is impossible for every calendar day across ten years',()=>{
 for(let year=2024;year<=2033;year++){
  for(let month=0;month<12;month++){
   const days=new Date(Date.UTC(year,month+1,0)).getUTCDate();
   for(let date=1;date<=days;date++){
    const day=year+'-'+String(month+1).padStart(2,'0')+'-'+String(date).padStart(2,'0');
    const puzzle=dailyCodePuzzle(day);
    assert.equal(new Set(puzzle.answers.map(x=>x.id)).size,4,day);
    assert.deepEqual(new Set(puzzle.answers.map(x=>x.id)),new Set(puzzle.clues.map(x=>x.id)),day);
    for(let i=0;i<4;i++)assert.notEqual(puzzle.clues[i].id,puzzle.answers[i].id,day+' row '+i);
   }
  }
 }
});
test('derangement preserves every item once, has no fixed point and is seeded',()=>{
 for(let seed=0;seed<500;seed++){
  const source=['a','b','c','d'];
  const result=derangedDailyAnswers(source,seed);
  assert.deepEqual(new Set(result),new Set(source));
  assert.equal(result.length,4);
  for(let i=0;i<4;i++)assert.notEqual(result[i],source[i]);
  assert.deepEqual(derangedDailyAnswers(source,seed),result);
  assert.deepEqual(source,['a','b','c','d'],'original list must remain unchanged');
 }
 assert.throws(()=>derangedDailyAnswers(['solo'],1));
});
test('random challenge draws many different sets and never reuses a set while unseen sets remain',()=>{
 const day='2026-11-21';
 const seen=[];
 const allTerms=[];
 for(let n=0;n<DAILY_CODE_SETS.length;n++){
  const puzzle=randomCodePuzzle(day,(n*1009+83)>>>0,seen,allTerms.slice(-20));
  assert.ok(!seen.includes(puzzle.setId),'duplicate before pool exhaustion at round '+n);
  seen.push(puzzle.setId);
  allTerms.push(...puzzle.clues.map(item=>item.id));
  assert.equal(puzzle.clues.length,4);
  assert.deepEqual(new Set(puzzle.clues.map(x=>x.id)),new Set(puzzle.answers.map(x=>x.id)));
  for(let i=0;i<4;i++)assert.notEqual(puzzle.clues[i].id,puzzle.answers[i].id);
 }
 assert.equal(new Set(seen).size,DAILY_CODE_SETS.length);
 const afterExhaustion=randomCodePuzzle(day,999,seen,allTerms.slice(-20));
 assert.ok(afterExhaustion.clues.length===4,'play can continue after 41 sets');
});
test('random selection differs by seed, is deterministic for same inputs, and avoids recent terms when possible',()=>{
 const day='2026-11-21';
 const choices=new Set();
 for(let seed=0;seed<200;seed++)choices.add(randomCodePuzzle(day,seed,[],[]).setId);
 assert.ok(choices.size>=20,'fresh seeds produce broad coverage');
 const one=randomCodePuzzle(day,753,[],[]);
 assert.deepEqual(randomCodePuzzle(day,753,[],[]),one);
 const next=randomCodePuzzle(day,1024,[one.setId],one.clues.map(x=>x.id));
 assert.notEqual(next.setId,one.setId);
 assert.ok(!next.clues.some(x=>one.clues.some(y=>y.id===x.id)),'avoid repeats of recent four terms where another set is available');
});
test('recent set records persist locally without touching practice XP and tolerate invalid data',()=>{
 const data=new Map();
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 for(let id=0;id<17;id++)rememberRandomCodeSet(id,storage);
 assert.equal(readRecentCodeSets(storage).length,12);
 assert.deepEqual(readRecentCodeSets(storage).slice(-2),[15,16]);
 rememberRandomCodeSet(15,storage);
 assert.equal(readRecentCodeSets(storage).at(-1),15);
 assert.equal(new Set(readRecentCodeSets(storage)).size,12);
 assert.equal(data.has('certification-overdrive-progress-v1'),false);
 assert.ok(data.has(RANDOM_CODE_RECENT_KEY));
 data.set(RANDOM_CODE_RECENT_KEY,'{corrupted');
 assert.deepEqual(readRecentCodeSets(storage),[]);
});
test('matching is explicit and answered clues cannot be reused or farmed',()=>{
 assert.equal(dailyMatchResult('ec2','s3',[]),'wrong');
 assert.equal(dailyMatchResult('ec2','ec2',[]),'correct');
 assert.equal(dailyMatchResult('ec2','ec2',['ec2']),'already');
 assert.equal(dailyMatchResult('s3','ec2',['ec2']),'already');
 assert.equal(dailyCodeScore(0),400);
 assert.equal(dailyCodeScore(4),300);
 assert.equal(dailyCodeScore(50),0);
});
test('only best score per day persists to a bounded local-only game record',()=>{
 const data=new Map();
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const day='2026-11-21';
 assert.equal(readDailyBest(day,storage),0);
 writeDailyBest(day,325,storage);
 writeDailyBest(day,275,storage);
 assert.equal(readDailyBest(day,storage),325);
 writeDailyBest(day,400,storage);
 assert.equal(readDailyBest(day,storage),400);
 assert.ok(data.get(DAILY_CODE_KEY).includes(day));
 assert.equal(data.has('certification-overdrive-progress-v1'),false);
});
test('React renders mobile daily code without any extra AWS answer writer',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const {default:DailyCode}=await vite.ssrLoadModule('/src/reborn/DailyCode.tsx');
  const markup=renderToStaticMarkup(React.createElement(DailyCode,{onExit:()=>{},onSound:()=>{},onHaptic:()=>{}}));
  for(const label of ['DAILY CODE','サービスを結び付けろ','ランダムに遊ぶ','今日の4問（固定）','種類の問題セット'])assert.ok(markup.includes(label),label);
  const app=readFileSync('src/reborn/RebornApp.tsx','utf8');
  const daily=readFileSync('src/reborn/DailyCode.tsx','utf8');
  assert.ok(app.includes('startDailyCode'));
  assert.ok(app.includes("screen==='daily-code'"));
  assert.ok(daily.includes('writeDailyBest'));
  assert.ok(daily.includes('randomCodePuzzle'));
  assert.ok(daily.includes('次の4問に挑戦'));
  assert.ok(daily.includes('20組突破'));
  assert.ok(!daily.includes('applyStudyAttempt'));
  assert.ok(!daily.includes('setProgress('));
 }finally{await vite.close()}
});

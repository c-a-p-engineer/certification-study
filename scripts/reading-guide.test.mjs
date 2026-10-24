import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {READING_GUIDE_KEY,readReadingGuide,saveReadingGuide,splitReadingSentences} from '../src/readingGuide.ts';

const source=readFileSync('src/main.tsx','utf8');
const intro=readFileSync('src/StudyQuestionIntro.tsx','utf8');
const css=readFileSync('src/readingGuide.css','utf8');
const spec=readFileSync('docs/SPECIFICATION.md','utf8');

test('sentence grouping keeps every original codepoint and preserves authored answer',()=>{
 const samples=[
 '全社のIAMロールが長期間未使用の権限を保持している可能性がある。既に外部公開されたS3バケットを検出するAccess Analyzerは稼働しているが、過去90日間使われていないロールや権限を組織全体で洗い出したい。監査対象を追加する適切な方法は？',
 'A？B！C。D? E!', 'CloudWatchとIAM・S3を使う。\n  次に検証する？', '1. VPC Endpoint に接続', '最後の問いだけ？', 'A。。 B！',
 ];
 for(const input of samples){
  const parts=splitReadingSentences(input);
  assert.equal(parts.join(''),input);
  assert.ok(parts.every(x=>x.length>0));
 }
 assert.deepEqual(splitReadingSentences(''),[]);
 assert.equal(splitReadingSentences(samples[0]).length,3);
});

test('preference is explicitly opt-in, local-only and robust to corrupt/unavailable storage',()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const records=new Map();
 try {
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>records.get(k)??null,setItem:(k,v)=>records.set(k,v)}});
  assert.equal(readReadingGuide(),false);
  saveReadingGuide(true);assert.equal(readReadingGuide(),true);
  assert.equal(records.get(READING_GUIDE_KEY),'on');
  saveReadingGuide(false);assert.equal(readReadingGuide(),false);
  records.set(READING_GUIDE_KEY,'broken');assert.equal(readReadingGuide(),false);
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem(){throw Error('denied')},setItem(){throw Error('denied')}}});
  assert.equal(readReadingGuide(),false);
  assert.doesNotThrow(()=>saveReadingGuide(true));
 }finally{
  if(previous)Object.defineProperty(globalThis,'localStorage',previous);
  else delete globalThis.localStorage;
 }
});

test('question toggles paragraph view without changing grading, quiz focus or answer text',()=>{
 assert.ok(source.includes('onReadingGuide={toggleReadingGuide}'));
 assert.ok(source.includes('readReadingGuide'));
 assert.ok(source.includes('saveReadingGuide(next)'));
 assert.ok(intro.includes('className="study-reading-toggle"'));
 assert.ok(intro.includes('aria-pressed={!!readingGuide}'));
 assert.ok(intro.includes('splitReadingSentences(question.question)'));
 assert.ok(intro.includes(':question.question'));
 assert.ok(css.includes('.question-card h2.question-readable'));
 assert.ok(css.includes('line-height:1.94'));
 assert.ok(css.includes('max-inline-size:27em'));
 assert.ok(css.includes('.reading-sentence:nth-child(even)'));
 assert.ok(css.includes('min-height:44px'));
 assert.ok(spec.includes('文ごとに読む'));
});

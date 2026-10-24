import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const view=readFileSync('src/ExamOfficialGuide.tsx','utf8');
const launcher=readFileSync('src/HomeMissionLauncher.tsx','utf8');
const css=readFileSync('src/homeHub.css','utf8');
const spec=readFileSync('docs/SPECIFICATION.md','utf8');

test('official exam summary is folded by default after Daily Five and before advanced setup',()=>{
 assert.match(view,/<details className="exam-official-guide">/);
 assert.ok(!view.includes('defaultOpen'));
 assert.ok(!view.includes('<details open'));
 const daily=launcher.indexOf('<DailyFiveBoard '),mission=launcher.indexOf('START MISSION');
 const examInfo=launcher.indexOf('<ExamOfficialGuide/>'),advanced=launcher.indexOf('<details className="home-advanced">');
 assert.ok(daily>=0&&mission>daily&&examInfo>mission&&advanced>examInfo);
 assert.ok(launcher.includes("import ExamOfficialGuide from './ExamOfficialGuide'"));
});

test('actual AWS exam figures and non-official practice guidance are clearly separated',()=>{
 for(const token of ['65問','130分','720点','50問','15問','20,000円','30%','26%','24%','20%','52問','80%']){
  assert.ok(view.includes(token),token);
 }
 assert.ok(view.includes('必要正解数を公開していません'));
 assert.ok(view.includes('720点＝72%正解ではなく'));
 assert.ok(view.includes('非公式の学習目安'));
 assert.ok(view.includes('実際の合格を保証するものではありません'));
 assert.ok(view.includes('この学習アプリはAWSの公式模擬試験ではありません'));
 assert.ok(spec.includes('実際の正解数は非公表'));
 assert.ok(spec.includes('公式基準でも合格保証でもない'));
});

test('links point to source-owned AWS exam and pricing/scoring pages, not fabricated booking URLs',()=>{
 for(const token of [
 'https://aws.amazon.com/jp/certification/certified-solutions-architect-associate/',
 'https://docs.aws.amazon.com/ja_jp/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html',
 'https://aws.amazon.com/certification/policies/before-testing/',
 'https://aws.amazon.com/certification/faqs/',
 'target="_blank" rel="noopener noreferrer"'
 ])assert.ok(view.includes(token),token);
 assert.ok(view.includes('2026年10月25日'));
});

test('exam guide is readable at mobile widths and has visible keyboard focus without side effects',()=>{
 assert.match(css,/\.app \.exam-official-guide>summary:focus-visible/);
 assert.match(css,/\.app \.exam-official-links a:focus-visible/);
 assert.match(css,/min-height:44px/);
 assert.match(css,/@media\(max-width:400px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 for(const forbidden of ['localStorage','setProgress(','applyStudyAttempt(','onStart(','setMode(','scoreForExam(','fetch(']){
  assert.ok(!view.includes(forbidden),forbidden);
 }
});

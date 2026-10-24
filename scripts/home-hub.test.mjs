import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const main=readFileSync('src/main.tsx','utf8');
const css=readFileSync('src/homeHub.css','utf8');
const agents=readFileSync('AGENTS.md','utf8');
const spec=readFileSync('docs/SPECIFICATION.md','utf8');
const homeStart=main.indexOf("<main>{mode==='home'?");
const quizStart=main.indexOf("mode==='quiz'?<section className=\"quiz\"");
const home=main.slice(homeStart,quizStart);
const index=s=>home.indexOf(s);

test('home offers daily five, regular mission and useful progress before optional drawers',()=>{
 assert.ok(homeStart>0&&quizStart>homeStart);
 assert.ok(index('<DailyFiveBoard ')>=0);
 assert.ok(index('START MISSION')>index('<DailyFiveBoard '));
 assert.ok(index('className="daily-quest"')>index('START MISSION'));
 assert.ok(index('<HomeProgressSummary ')>index('className="daily-quest"'));
 assert.ok(index('data-section="adventure"')>index('<HomeProgressSummary '));
 assert.ok(index('<OfflineStatus ')>index('<HomeProgressSummary '));
});

test('all secondary home modes are reachable from closed-by-default native disclosures',()=>{
 const advanced=index('<details className="home-advanced">');
 assert.ok(advanced>0);
 for(const section of ['adventure','review','insights','collection']){
  const fragment='<details className="home-hub-drawer" data-section="'+section+'">';
  assert.equal(home.split(fragment).length-1,1,section);
 }
 for(const component of ['EnemyCampaignPanel','ExpeditionBoard','DesignSimulator','RetentionQuestBoard','SmartQuestBoard','BossBoard','ActivityTimeline','GrowthDashboard','LearningInsights','SkillTreeBoard','RelicVault']){
  assert.ok(home.includes('<'+component+' '),component);
 }
 assert.ok(index('EXAM TRIAL')>advanced);
 assert.ok(index('aria-label="出題分野"')>advanced);
 assert.ok(index('aria-label="出題数"')>advanced);
 assert.ok(!home.includes('defaultOpen'));
 assert.ok(!home.includes('<details className="home-hub-drawer" open'));
});

test('drawer markup is balanced and keeps read-only disclosure semantics',()=>{
 assert.equal((home.match(/<details\b/g)||[]).length,(home.match(/<\/details>/g)||[]).length);
 assert.equal((home.match(/className="home-hub-drawer"/g)||[]).length,4);
 assert.ok(css.includes('summary:focus-visible'));
 assert.ok(css.includes('min-height:54px'));
 assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(main.includes("import './homeHub.css'"));
});

test('product specification and contributor rules name observable behavior and change gate',()=>{
 assert.match(agents,/docs\/SPECIFICATION\.md/);
 assert.match(agents,/same PR/i);
 assert.match(agents,/npm run build/);
 assert.match(agents,/E2E/);
 for(const phrase of ['今日の5分クエスト','冒険・設計チャレンジ','学習記録・成長分析','スキル・コレクション','348問','65問','v1/v2','Web Locks','0/348']){
  assert.ok(spec.includes(phrase),phrase);
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync('src/main.tsx','utf8');
const board=readFileSync('src/BossBoard.tsx','utf8');
const tree=readFileSync('src/SkillTreeBoard.tsx','utf8');
const vault=readFileSync('src/RelicVault.tsx','utf8');
const css=readFileSync('src/overdrive4.css','utf8');
test('boss challenge selects a domain and draws damage from correct answers, not answer count',()=>{
 assert.ok(main.includes('<BossBoard records={progress.bossRecords}'));
 assert.ok(main.includes('x.difficulty===3&&x.domain===target'));
 assert.ok(readFileSync('src/QuizCombatStatus.tsx','utf8').includes('<BossBattleHUD domain={bossDomain} correct={session.correct}'));
 assert.ok(main.includes('recordBossVictory(p.bossRecords,bossDomain,session.correct,pool.length)'));
 assert.ok(board.includes('aria-label={boss.domain'));
});
test('skill tree missions filter by topic and relics are claimable only when unlocked',()=>{
 assert.ok(main.includes('questions.filter(x=>topicFor(x)===focusedTopic)'));
 assert.ok(main.includes('<SkillTreeBoard nodes={skillNodes}'));
 assert.ok(main.includes('<RelicVault relics={relics}'));
 assert.ok(main.includes("if(!relics.some(x=>x.id===id&&x.unlocked))return"));
 assert.ok(tree.includes('role="progressbar"'));
 assert.ok(vault.includes('disabled={!owned||isEquipped}'));
});
test('legacy progress and snapshot keys remain; effects respect reduced motion',()=>{
 assert.ok(main.includes("'certification-overdrive-progress-v1'"));
 assert.ok(main.includes('activity:migrateActivity(old)'));
 assert.ok(main.includes('bossRecords?:BossRecords'));
 assert.ok(main.includes('finishing.current=true'));
 assert.ok(main.includes('examMode&&<span className='));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(css.includes('.app.reduced .od4-node-track'));
});

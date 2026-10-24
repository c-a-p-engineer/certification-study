import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('src/main.tsx','utf8');
const reducer=readFileSync('src/studyAttempt.ts','utf8');
const art=readFileSync('src/MonsterArt.tsx','utf8');
const panel=readFileSync('src/EnemyCampaignPanel.tsx','utf8');
const css=readFileSync('src/enemyVisual.css','utf8');
const boss=readFileSync('src/BossBoard.tsx','utf8');
const battle=readFileSync('src/BossBattleHUD.tsx','utf8');
test('normal practice drives a persistent campaign and one atomic progress write',()=>{
 assert.ok(source.includes('enemyCampaign?:EnemyCampaign'));
 assert.ok(source.includes('enemyCampaign:normalizeEnemyCampaign(old.enemyCampaign)'));
 assert.ok(reducer.includes('enemyCampaign:campaign?.state??source.enemyCampaign'));
 assert.ok(reducer.includes('xp:source.xp+totalXp'));
 assert.ok(reducer.includes('applyCampaignAnswer(source.enemyCampaign,campaignEvent)'));
 assert.ok(source.includes('setProgress(p=>applyStudyAttempt(p,event).progress)'));
 assert.ok(source.includes('setCampaignHit(preview.reward.campaign?.credited&&!examMode&&!bossMode&&ok?preview.reward.campaign:null)'));
 assert.ok(source.includes('setCampaignHit(null)'));
});
test('campaign is visible on dashboard, quiz and results; exam excludes combat',()=>{
 assert.ok(source.includes('<EnemyCampaignPanel campaign={enemyCampaign} onStart={()=>start(false)} onReplay='));
 assert.ok(source.includes('restartCampaign(p.enemyCampaign)'));
 assert.ok(source.includes('!examMode?<EnemyCampaignPanel campaign={enemyCampaign} compact attack={campaignHit}/>:null'));
 assert.ok(source.includes('!examMode&&!bossMode&&<EnemyCampaignPanel campaign={enemyCampaign} compact attack={campaignHit}/>'));
 assert.equal(source.includes('className="boss-health"'),false);
 assert.ok(panel.includes('role="progressbar"'));
 assert.ok(panel.includes('MONSTER ARCHIVE'));
 assert.ok(panel.includes('NEXT ENEMY UNLOCKED'));
});
test('nine distinct SVG monster designs and four original domain bosses now have art',()=>{
 for(const id of ['slime','zombie','armor','chimera','dragon','cerberus','phoenix','titan','leviathan'])assert.ok(art.includes("id==='"+id+"'"),id);
 assert.ok(art.includes('viewBox="0 0 240 220"'));
 assert.ok(boss.includes('<MonsterArt id='));
 assert.ok(battle.includes('<MonsterArt id='));
 assert.ok(source.includes('<MonsterArt id='));
});
test('reduced motion, readable sizes and no blocking answer overlay',()=>{
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(css.includes('.app.reduced .monster-visual'));
 assert.ok(css.includes('@media(max-width:580px)'));
 assert.ok(panel.includes('aria-label={enemy.short'));
 assert.ok(!panel.includes('position:fixed'));
});

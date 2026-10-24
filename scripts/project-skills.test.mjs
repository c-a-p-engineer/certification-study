import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const agent=readFileSync('AGENTS.md','utf8');
const editorialPath='.agents/skills/aws-saa-content-quality/SKILL.md';
const gamePath='.agents/skills/learning-rpg-integrity/SKILL.md';
const editorial=readFileSync(editorialPath,'utf8');
const game=readFileSync(gamePath,'utf8');

function skillHeader(source){
 const match=source.match(/^---\n([\s\S]+?)\n---\n/);
 assert.ok(match,'Skill must have YAML frontmatter');
 const name=match[1].match(/^name: ([a-z0-9-]+)$/m);
 const description=match[1].match(/^description: (.+)$/m);
 assert.ok(name,'stable Skill name required');
 assert.ok(description&&description[1].length>25,'nonempty activation description required');
 return name[1];
}

test('two opt-in, task-specific skills with distinct triggers can be discovered from AGENTS',()=>{
 assert.equal(skillHeader(editorial),'aws-saa-content-quality');
 assert.equal(skillHeader(game),'learning-rpg-integrity');
 assert.ok(agent.includes(editorialPath));
 assert.ok(agent.includes(gamePath));
 assert.ok(agent.includes('docs/SPECIFICATION.md'));
 assert.ok(agent.includes('when one task changes both')||agent.includes('apply **both**'));
});

test('editorial Skill references exact canonical quality and provenance authorities',()=>{
 for(const file of ['docs/QUALITY_GATE.md','docs/SPECIFICATION.md','docs/PHASE8_IMPLEMENTATION_PLAN.md','scripts/audit-question-bank.mjs','reports/human-review-decisions.json']){
  assert.ok(existsSync(file),'missing source '+file);
 }
 assert.ok(editorial.includes('certifications/aws-saa/'));
 assert.ok(editorial.includes('npm run audit:questions'));
 assert.ok(editorial.includes('npm run audit:signoff'));
 assert.ok(editorial.includes('0/348'));
 assert.ok(editorial.includes('independent'));
 assert.ok(editorial.includes('question ID'));
});

test('learning RPG Skill keeps one-writer and no-fabricated-evidence guardrails',()=>{
 for(const file of ['src/studyAttempt.ts','src/bossCampaign.ts','src/retentionQuest.ts','src/growthAnalytics.ts','docs/SPECIFICATION.md']){
  assert.ok(existsSync(file),'missing source '+file);
 }
 for(const term of ['applyStudyAttempt','bossOutcome','recordBossVictory','7/9/10','BOSS INTEL','Daily Five','v1/v2','docs/PHASE8_IMPLEMENTATION_PLAN.md','reduced-motion']){
  assert.ok(game.includes(term),term);
 }
 assert.ok(game.includes('not zero')||game.includes('not zero achievement'));
 assert.ok(game.includes('deferred'));
});

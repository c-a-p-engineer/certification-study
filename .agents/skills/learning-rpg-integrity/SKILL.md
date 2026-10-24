---
name: learning-rpg-integrity
description: Design, change or audit XP, reward transactions, BOSS INTEL, knowledge evidence, Daily Five, spaced recall, boss battles, expeditions or progression rules in certification-study. Use for learning/RPG integration and anti-farming work, not for question-copy-only edits.
---

# Learning RPG Integrity — project adapter

Scope: **c-a-p-engineer/certification-study**. This is the local procedure for connecting learning outcomes to game presentation while preventing false mastery signals and duplicate rewards. The canonical product contract is `docs/SPECIFICATION.md`; this adapter must not redefine it.

## Trigger and prerequisites

Use when a request touches answer events, XP/HP, daily tasks, replay rewards, boss medals, knowledge evidence, `CONCEPT MAP` or BOSS INTEL. Skip simple styling/wording unless it can alter answer readability or game decision semantics.

Read: `AGENTS.md`; `docs/SPECIFICATION.md` (§4, §5, §6, §9); `docs/PHASE8_IMPLEMENTATION_PLAN.md`; `src/studyAttempt.ts`, `src/bossCampaign.ts`, `src/enemyCampaign.ts`, `src/growthAnalytics.ts`, `src/studyScheduler.ts` and relevant UI/backup/tests. For AWS assertions, apply **aws-saa-content-quality** as an additional distinct skill.

## Method

1. Write down the user-observable **learning action → existing answer event → reward transaction → persisted state → game display** flow. Classify which values are *observed*, *derived*, *hypothesized* or *unknown*. Do not call XP, a streak or a predicted score proof of knowledge.
2. Keep `applyStudyAttempt` the sole ordinary practice XP/monster transaction and preserve attempt receipts. Replay of an already accepted event is inert; identical question on the same local day cannot farm XP or enemy damage.
3. Preserve 10-question domain bosses, thresholds **7/9/10 for B/A/S** and existing first-clear/medal-upgrade rewards. `bossOutcome` and `recordBossVictory` are authoritative. **BOSS INTEL is read-only**: no auto-correct, extra damage, XP multiplier, gating, medal unlock, new payout ledger or forced play.
4. Derive knowledge evidence only from **confirmed** static concept mapping and verifiable non-exam local answer history. Deduplicate per concept/question/evidence type. Do not infer a delayed recall from a `due` flag alone: require earlier non-exam event on an earlier local day and a later due-correct event. Unknown prior history must appear as **unobserved**, not zero achievement.
5. Retain Daily Five's maximum of five questions with a voluntary stop. Do not auto-start another run or create shame-driven missed-day prompts. Boss preparation must work even when the player has never viewed BOSS INTEL.
6. Mock-exam responses never alter training XP, review scheduling, daily contracts or enemy HP. Keep legacy rank/XP, question IDs, 1/3/7/14-day observations, mission/exam saves, v1/v2 backups and stale-tab guards. Any proposed schema migration is its own scoped, reviewed contract.
7. Avoid placing long game dashboards above the first reading/answer interaction. Respect `文ごとに読む`, text scale, focus/compact layouts, keyboard navigation, minimum intended 44px tap targets and reduced-motion. Real Android/Brave and browser E2E remain deferred, so static assertions do not prove physical performance.

## Verification sequence

- Unit/invariant: `scripts/study-attempt.test.mjs`, `scripts/boss-campaign.test.mjs`, `scripts/enemy-campaign.test.mjs`, `scripts/retention-quest.test.mjs`, `scripts/daily-five.test.mjs`, plus new concept/evidence tests when introduced.
- Compatibility: `scripts/mission-save.test.mjs`, `scripts/backup.test.mjs`, `scripts/progress-conflict.test.mjs`; check same-day duplicate/reload/multi-tab/old-save and no record reset.
- End-to-end **source-to-deployment**: match `docs/SPECIFICATION.md` with actual code/tests, run `npm run build`, inspect PR CI, and confirm matching Pages deploy. Do not report browser/device E2E or independently reviewed question quality.
- Prefer pure selectors, frozen timestamps in tests, and a display-only UI component over a second state writer.

## Stop, review, handoff

**Stop** on XP duplication, a new hidden reward writer, ambiguous event provenance, inflated learning claims, reinterpreted old answer keys, incompatible saves, or a regressions in exam/boss grading. Preserve the old behavior and open a focused issue/PR rather than silently "fixing" user progress.

Return a concise result: behavior changed / unchanged; source of truth; reward and learning-evidence delta; compatibility; verification run and published SHA; deferred checks. Reusable cross-project methods belong in the core's existing engineering skills; AWS-specific rules stay in this project.

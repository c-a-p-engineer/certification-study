# Repository working rules — CERTIFICATION//OVERDRIVE

This public repository is an independent, original certification learning game, starting with AWS SAA-C03. These rules apply to **every code, UX, content, and documentation change**, including automated agents.

## Source of truth and orientation

1. Read this file first. Then read [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md) for observable product behavior, [`README.md`](README.md) for entry points, and relevant source files/tests before editing.
2. **This AGENTS.md owns the change process; `docs/SPECIFICATION.md` owns product behavior and acceptance conditions.** Do not maintain a second conflicting specification in README, PR notes, or code comments.
3. Confirm the target branch and current HEAD before modifying files. Use feature branches and PRs; check competing work and merge status. Do not resurrect stale superseded branches.
4. Distinguish shipped functionality, unresolved Issues, proposals and user-deferred tasks. GitHub Actions results and source code are evidence; an Issue checklist alone is not proof.

## Specification-first, implementation-synchronized changes

- **Before implementation:** identify the affected specification section, expected behavior, edge cases, backward compatibility and a verifying test. For new features, add a specification section or update acceptance criteria before shipping.
- **In the same PR:** when behavior, navigation, rewards, state, import/export, exam rules or visible copy materially changes, update `docs/SPECIFICATION.md` together with code and tests. The change is incomplete if the specification and implementation disagree.
- **Bug fixes:** if implementation violates the existing specification, fix code and regression tests. If the documented behavior was mistaken or intentionally changes, correct the specification in that same PR. Explain which is authoritative.
- **Internal refactors:** preserve externally observable behavior and update technical mapping/test references only when they actually change; do not create busywork spec edits.
- **Before merging:** review spec ↔ implementation ↔ tests, and describe affected clauses and verification in the PR. Do not call an unverified assumption a tested fact.
- README is a concise introduction and links to the specification. Domain-specific editorial reports and Issues are evidence/backlog, not competing product contracts.

## Task-specific project skills (on-demand, not a new policy owner)

- AWS SAA question writing, editorial review, answer-key changes, distractor QA, official references, conceptual duplicates or Phase 8 concept mapping: read `/.agents/skills/aws-saa-content-quality/SKILL.md` before modifying the question source.
- XP, game rewards, boss/expedition progression, Daily Five, due recall, knowledge-evidence calculations or BOSS INTEL: read `/.agents/skills/learning-rpg-integrity/SKILL.md`. When one task changes both answer content and learning rewards, apply **both**.
- These files are scoped execution procedures. This `AGENTS.md` owns project change policy, `docs/SPECIFICATION.md` owns behavior, and `docs/QUALITY_GATE.md` owns editorial audit distinctions. The skills may point to them but must not silently supersede them.
- Ordinary CI triage, isolated UI/CSS work, read-only project status, and deployment do not trigger both skills automatically. Select only what the current task needs.

## Non-negotiable behavior and compatibility

- Only original, independently authored questions. Never commit exam dumps, copyrighted third-party practice banks, passwords, tokens or learner's private diagnostic snapshots. Check AWS claims against official exam guides and vendor docs; keep meaningful per-question references. Editorial date/AI analysis is **not** independent human sign-off.
- Keep study data local. No new backend, cloud sync, paid infrastructure or per-use fees without explicit approval. Respect user privacy and distinguish empirical study evidence from gamification hypotheses.
- Preserve all stable question IDs and existing XP, badges, rank, scheduled reviews, monster state, v1 mission/exam saves, and v1/v2 backup import unless a separately approved migration specifies otherwise.
- Use the existing pure `applyStudyAttempt` grading/reward path and idempotent attempt receipt rules; mock exam must not grant ordinary practice XP, HP damage or review scheduling. Do not re-enable same-day answer farming.
- Recovery is non-destructive: never silently reset browser progress on corrupt backup, restore journal, quota failure or known stale-tab writes; never advertise non-atomic localStorage checks as transactional.
- UI is Android-first: one obvious short-session entry, legible 320/360/400px layouts, keyboard-accessible controls, visible focus, at least 44px intended touch targets, reduced-motion support, and a clear voluntary stop. Optional exploration should not force excessive initial scrolling.
- E2E browser testing, physical Android testing and qualified independent AWS human review remain deferred unless the user explicitly re-enables them. Never imply their completion.

## Delivery and verification

1. Make the smallest coherent implementation change, including required specification and regression tests. Avoid rewriting large local-storage schemas or the entire UI as a convenience.
2. Run the appropriate tests and **`npm run build`**, which includes question checks, domain audits, TypeScript, Vite build and offline artifacts. PR `.github/workflows/verify.yml` and Pages `.github/workflows/deploy.yml` must succeed before claiming a release.
3. Verify the final PR head and current `master` have not unexpectedly moved; do not force a stale merge. Reconcile failures rather than reporting red CI as delivered.
4. Report the actual scope, changed specification sections, test/CI status, deferred work, and directly navigable links to the PR/commit/spec and live site when deployed.

## Key paths

- Behavior contract: `docs/SPECIFICATION.md`
- Entrypoint / current React state orchestration: `src/main.tsx`
- Home navigation styling: `src/homeHub.css`
- Answer/XP transaction: `src/studyAttempt.ts`
- Local persistence and recovery: `src/missionSave.ts`, `src/progressSync.ts`, `src/backup.ts`
- Authored question source: `certifications/aws-saa/`; generated bank: `src/generated/questions.json`
- Quality gates: `package.json`, `scripts/*.test.mjs`, `.github/workflows/`

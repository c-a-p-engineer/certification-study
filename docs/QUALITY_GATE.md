# SAA-C03 Editorial Quality Gate

**Snapshot:** 2026-10-24 `npm run audit:questions` / `npm run audit:signoff` outputs for the current 348-question bank. This report is an **automated structural audit**, not confirmation of AWS technical correctness or qualified independent editorial approval.

## Current verified counts

| Audit measurement | Count | What it means |
| --- | ---: | --- |
| Authored questions | 348 | Current bank IDs; 48 longer scenario items |
| Editorial timestamp recorded | 33 | Metadata only: not independent approval |
| No editorial timestamp | 315 | Candidate for editorial review |
| Structural editorial queue | 318 | Flagged by rules, not 318 proven errors |
| Targeted AWS document cross-check records | 19 | AI/engineering-supported checks, not separate human sign-off |
| Option-rationale editorial drafts | 40 | Draft explanations; individual approval pending |
| Additional lexical similarity candidates | 12 | Candidate pairs requiring conceptual review, not proof of duplicate |
| Qualified independent approvals | **0** | No human approvals in `reports/human-review-decisions.json` |

Current source: `src/generated/questions.json`, question builder and audit scripts, `reports/independent-review-queue.json`, and the human-review ledger. Generated per-build reports may be uploaded as GitHub Actions artifacts instead of committed to the repository.

## Correctness and release requirements

1. **Each item:** independently check the stem, all answer options, every correct choice, every plausible wrong choice, explanation, scope/version caveats, and official AWS source.
2. **Do not fabricate review:** an AWS URL, AI-generated rationale, editorial timestamp or GitHub CI PASS must never be presented as qualified independent sign-off.
3. **Stable IDs:** changing an answer key or meaning requires evidence and compatibility analysis for saved mistake and spaced-review history. Do not remove/reorder old IDs casually.
4. **Version-sensitive claims:** review S3 Intelligent-Tiering/Lifecycle small-object conditions, RDS Multi-AZ instance vs DB cluster, Aurora reader topology, Route 53 failover, object lock and Snowball Edge availability using current AWS documentation.
5. **Diversity:** triage similarity candidates by learning objective and distractor semantics. Retain complementary questions, replace genuinely redundant ones with original trade-off scenarios.
6. **Exam coverage:** aim for Security 30%, Resilience 26%, Performance 24%, Cost 20% scored SAA-C03 domain outline as a diagnostic, not a reason to invent thin questions or claim calibrated pass probabilities.

## Implementation checks

- `npm run validate:questions` — original source → generated bank.
- `npm run audit:questions` — structure, duplicates and editorial queue.
- `npm run audit:signoff` — human decision schema, signatures/fingerprints and queue. It cannot authenticate human reviewers or guarantee AWS correctness.
- `npm run build` — all unit/regression tests, question audits, TypeScript, offline PWA build.
- `Verify pull request` Actions plus `Deploy to GitHub Pages` must pass before claiming release.
- Actual Android hardware, browser E2E and independent AWS human review remain deliberately deferred by the user; do not misrepresent static tests as device/qualified review.

## Tracking

- [Issue #14 — Qualified independent approval](https://github.com/c-a-p-engineer/certification-study/issues/14)
- [Issue #10 — Conceptual overlap and domain distribution](https://github.com/c-a-p-engineer/certification-study/issues/10)
- [Product specification](SPECIFICATION.md)

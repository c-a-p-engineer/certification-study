---
name: aws-saa-content-quality
description: Review or modify authored AWS SAA-C03 practice questions, distractors, explanations, official references, semantic duplicates, or Phase 8 concept mapping in certification-study. Use for item-quality and editorial PRs, not for ordinary CSS or RPG refactors.
---

# AWS SAA Content Quality — project adapter

This skill is scoped to **c-a-p-engineer/certification-study**. It is an execution aid, **not** a second specification or a claim of human certification.

## Trigger and canonical sources

Use when authoring, triaging, mapping, reviewing or changing SAA-C03 questions, explanations, answer keys or `CONCEPT MAP` entries. Skip for UI-only layout, deployment, CI and gameplay work unless a question's technical meaning changes.

Read in order: repository `AGENTS.md`, `docs/SPECIFICATION.md` (§3, §4, §9), `docs/QUALITY_GATE.md`, `docs/PHASE8_IMPLEMENTATION_PLAN.md` (if Phase 8), then the *authored* content under `certifications/aws-saa/`, relevant question builder, and current audit/test files. `src/generated/questions.json` is derived output, **not** the editing authority.

## Procedure

1. Record stable **question ID**, domain, learning objective, architecture constraints, accepted answers and all distractor explanations before changing copy. Compare question meaning and current local review/XP history impact.
2. Check decisive AWS claims with the **current official AWS documentation and exam guide**. Examine regional/feature/cost/lifecycle caveats where relevant; cite the exact service documentation URL. A working URL alone does not prove technical correctness.
3. Check every option including plausible wrong answers. Explain **why** each wrong option fails the stated requirement. Do not inflate difficulty by hiding essential constraints or inventing ambiguous answer keys.
4. Triage near-duplicate candidates by *actual decision objective and trade-off*, not shared nouns or a numeric similarity score alone. Record retain / revise / replace rationale. Keep test-bank domain coverage and scenario diversity.
5. For Phase 8, map **confirmed** question IDs to stable concept IDs in the designated static source; store mapping rationale and link to official evidence. A keyword/LLM suggestion remains a **candidate** until the project verification gate accepts it. Avoid cross-domain leakage (e.g. S3 encryption ≠ S3 storage cost).
6. Before changing a correct answer or the meaning of an existing ID, analyze historical `mistakes`, `reviews`, `answerHistory`, boss records and backups. Stop for a separately approved migration if compatibility cannot be preserved. Do not silently reassign stable IDs.
7. Update the one canonical behavior specification (`docs/SPECIFICATION.md`) only if behavior changes. Keep editorial evidence in its existing report/queue owner, not an invented parallel sign-off registry. Run `npm run validate:questions`, `npm run audit:questions`, `npm run audit:signoff`, relevant tests, and the complete `npm run build`. Review the resulting artifacts and PR CI.

## Required status distinctions

- **Structurally validated**: static checks pass; this is not an AWS claim verification.
- **AWS documentation checked**: specific claims checked against official source, with caveats recorded; still **not** independent review.
- **Review draft**: proposed editorial explanations awaiting approval.
- **Independently signed off**: only an actual qualified independent human review with provenance and current content fingerprint recorded under the existing sign-off workflow.

The current source quality report says **0/348 independently signed-off**; do not change that number by inference, AI analysis, timestamps or passing CI. Independently qualified human sign-off remains explicitly deferred.

## Output and stop conditions

For each affected ID: before/after intent, AWS evidence and date, option-by-option rationale, mapping status, duplicate decision, saved-history impact, tests, residual uncertainty. Link the PR and exact verification run.

**Stop** if official documentation does not resolve a material ambiguity, the answer key conflicts with the requirement, provenance is absent, an unpublished exam dump would be incorporated, or the proposed change would corrupt existing user history. Escalate for review rather than labelling it approved.

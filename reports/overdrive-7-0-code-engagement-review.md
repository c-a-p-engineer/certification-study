# OVERDRIVE 7.0 — Code/engagement review and next-phase decision

_Date: 2026-10-24. Static inspection, reproducible source and CI checks only. No Android hardware session, E2E, real learner analytics, medical evaluation or qualified external AWS sign-off._

## Code baseline and work performed

| Aspect | Observed source condition | 7.0 response | Remaining work |
| --- | --- | --- | --- |
| Answer path | `src/main.tsx` couples grading, campaign HP, XP, review scheduling, history, contracts and React animation. Approx. 58 KB and 331 extremely dense source lines before/after patch. | `src/studyAttempt.ts` exports a deterministic answer transaction, pure `gradeAnswer`, credit breakdown, 1,024 bounded attempt receipts and separate mock-exam grading. | Break the three top-level home/quiz/result screens into independently testable components. Keep answer state events explicit and avoid duplicated UI state. |
| Data integrity | Earlier UI only used a ref to prevent rapid double-taps. Browser reload/save restoration and concurrent updater re-evaluation were not the same as persistent idempotency. | Stable optional `runId` in mission/exam snapshots + per-question attempt receipts; same event is a no-op after first reducer transition. v1/v2 backup validation is extended. | Add a multi-tab ownership policy, recovery UI for repeated/stale run IDs and journal/cross-tab consistency checks. |
| Reward correctness | Same-day repeated questions and 65-question mock exams received ordinary practice XP; exam grades could change review timing. | Future mock exams affect explicit answer history but do **not** award training XP, change campaign HP, reviews, daily contracts or domain practice aggregates. Same-day correct replay gives 0 base XP/HP and does not extend the correct review streak. Previously earned XP is not modified. | Track repeated concepts rather than superficial ID changes if the content bank evolves; independently test badge/contract policies under future design extensions. |
| Daily quest | Total answer count allowed five replays of the same question to satisfy the generic daily +150 XP threshold. | Eligibility now needs 5 distinct non-exam question IDs when dated answer events exist. Old no-event-history progress preserves legacy daily eligibility. | Deduplicate all contract and boss award pathways under explicit globally versioned rules. |
| Expensive selectors | Dashboard re-created question domain arrays, SMART plans, due/retention plans and five expedition lists on every React render; resumptions used repeated linear `questions.find`. | `useMemo` stabilizes domain pools, SMART/campaign plans and overview metrics. A static ID map makes mission/exam question restoration O(number of saved IDs), not O(number of saved IDs × 348). | React Profiler before/after on real Android or instrumented browser, after E2E deferment is lifted. Avoid claiming measured runtime speedups from asymptotic improvements. |
| Content reliability | 348 unofficial questions, 48 long cases and four simulator flows. Official-document references and AI-assisted explanations are not independent human review. | Not changed. No question ID, answer key or user history is rewritten. | #14 remains on hold by user request; no manufactured quality certification. |

## Engagement/motivation heuristic — NOT a measured “addiction score”

Assessment is a qualitative design inspection. No medical or psychological finding, participant study, or randomized test was conducted.

| Dimension (heuristic 1–5) | Estimate | Evidence and trade-off |
| --- | ---: | --- |
| Fast start/feedback | 4 | Quick-start and 5/10 short recall missions; instant right/wrong feedback. Many dashboard panels still add friction to the first action. |
| Variety & discovery | 5 | Nine-monster campaign, boss battles, five expeditions and four three-step architecture cases; cosmetics opt-in and once-only. |
| Sense of progress | 4 | XP, titles, topic radar, due recall and domain progress. Raw score may be misunderstood as real certification readiness; the UI disclaims such a claim. |
| Reward integrity | 4 (after 7.0) | Same-day practice rewards and exam XP are constrained, one-time emblems stay cosmetic. Existing historical XP is not normalized, so inter-user leaderboard-like comparisons would be misleading. |
| Learner autonomy | 4 | Offline/local-first, no push nags, optional combat, audio/reduced-motion controls. Explicit 5-minute **end-session** cue is still missing. |
| Proven learning benefit | **Unknown** | Current 7-day metrics are descriptive only. Without comparisons of prior-day recall with sample sizes and opt-in observation, improvements cannot be causally attributed. |

### Risk assessment and product guardrails

- **P0 — Data and grade integrity:** No credited response twice, no XP from exam attempts, preserve old saves and rollback journals. Do not optimize these by sacrificing correctness.
- **P0 — Product clarity:** The dashboard has a large number of features and visual sections, especially on narrow screens. Keep one prominent 5-minute path at the top; game modes should be optional and collapsed.
- **P1 — Legitimate retention:** Encourage finishing a compact practice block and returning only when due; do not engineer indefinite tap loops, unpredictable reward schedules, shaming streak resets or sleep-disrupting alerts.
- **P1 — Fair progress:** Reward unique concepts and delayed recall; communicate the limits of XP/retention metrics, especially before comparisons across past releases.
- **P2 — Engineering discipline:** Add React component boundaries, automated regression coverage, sensible bundle/network/cache budgets and input sanitization; measure real performance later when Android/E2E is allowed.

## Next product phase recommendation

**Choose Phase 7.1: Daily Learning Loop**, not more collectibles first. A one-tap, transparent, voluntarily completed five-question review with explicit end/exit is more likely to improve useful habit formation than adding stochastic loot or endless autoplay. Suggested order:

1. **7.0b (P0)** finish home/quiz/result component extraction, integrate bounded receipts and validate persistence & exam isolation against CI; measure script bundle changes without claiming unsupported user benefits.
2. **7.1 (P1)** visible `今日の5分クエスト` as the first optional action, fair mix of due/unseen/problem concepts, clear completion screen and next suggested review date. No forced continuation.
3. **7.4 (P1)** local-only, opt-in, privacy-preserving measurement of 1/3/7/14-day delayed retrieval with sample size and transparent missing-data statements; separate unique learning from raw answer count.
4. **7.3 (P2)** expand four architect cases to eight–ten if factually grounded; prioritize realistic failure and cost trade-offs over service-name quizzes.
5. **7.2 (P3)** optional cosmetics/bestiary only after core session design is faster and reward integrity is protected.

**Deferred explicitly:** human AWS-review sign-off (#14), Android physical testing, browser E2E. No backend, subscriptions, notifications or data uploads are required for the next phase.

## Evaluation criteria for the next release

- All existing CI checks and GitHub Pages deploy succeed; v1/v2 JSON backup imports and v1 mission resume remain compatible.
- Five-question session is finishable and stoppable without punishment; no repeated XP for duplicate event receipts, exam scores or same-day grinding.
- Retention numbers reflect actual observed dated events and their sample size, not inferred history or pass probabilities.
- Compact layout, touch size and reduced motion remain supported; Android-specific outcomes are unverified until explicitly tested.

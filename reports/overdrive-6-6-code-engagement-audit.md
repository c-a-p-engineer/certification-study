# OVERDRIVE 6.6 — Code and Engagement Design Audit

**Audit scope:** static examination of the connected `c-a-p-engineer/certification-study` code at the 6.4–6.6 PR head and repository unit/CI contracts. **Not** Android hardware E2E, empirical retention study, user analytics, expert AWS review, a penetration test, or clinical assessment of compulsive behavior. This report separates verified implementation facts from design hypotheses.

## 1. Functionality delivered

| Area | Source of truth | Implementation evidence |
| --- | --- | --- |
| Offline quiz bank | `src/generated/questions.json` | 348 original questions, 48 longer scenario-rich items, 65-item SAA-style mock exam |
| PvE campaign | `src/enemyCampaign.ts`, `src/MonsterArt.tsx` | Nine SVG monsters, combo damage, NG+, persisted HP, unique question IDs per monster |
| Spaced recall | `src/retentionQuest.ts` | Five/ten-question delayed retrieval, up to five distinct 25-XP bonuses per local day |
| New expeditions | `src/expeditions.ts`, `src/ExpeditionBoard.tsx` | Five offline topic missions; 4/5 clears, rare cosmetics only after two distinct prior-day delayed recalls; no expedition XP |
| Mobile controls | `src/quizLayout.ts`, `src/nextPhase.css` | Focus/compact/detailed reading, 320/360/400px selectors, text wrap, 44px buttons, reduced-motion support |
| Design practice | `src/designSimulator.ts`, `src/DesignSimulator.tsx` | Four original 3-stage design workflows, per-choice feedback and official AWS references, accessible SVG descriptions |
| Recovery | `src/backup.ts`, `src/backupIntegrity.ts` | SHA-256 v2 backup corruption detection, v1 restore support, rollback journal, emergency export |
| Growth analytics | `src/growthAnalytics.ts`, `src/learningInsights.ts` | Browser-local bounded answer history, learning-day and due-review observations, no calibrated pass probability |

## 2. Concrete code review findings

| Priority | Finding | Status / next action |
| --- | --- | --- |
| P0 fixed | NG+ moved to the next enemy with its base HP instead of the cycle-scaled maximum, making higher rounds weaker than stated. | **Fixed**: apply `campaignMaxHp` on all next-stage transitions; new regression. |
| P0 fixed | Two clicks on an answer before React committed `selected` could theoretically process a single question more than once, granting repeated XP. | **Mitigated**: synchronous `answerLockRef`, reset only when starting or moving to another question. |
| P1 fixed | Simulator double-clicking final next could record multiple attempts. | **Mitigated**: synchronous per-step advance guard. |
| P1 fixed | `masteryByTopic` previously recomputed during every `TOPICS.map` iteration. | **Improved**: memoized domain mastery and skill tree based on `progress.reviews`. |
| P1 open | `src/main.tsx` is ~58 KB across ~295 extremely dense lines, with ~29 typed `useState` sites and ~18 effects; quiz grading, storage, animation, exam rules, page routes and gameplay are tightly coupled. | Split deterministic answer reducer, mission controller, data selectors and view screens in Phase 7.0. Avoid broad rewrite of save schemas. |
| P1 open | Ordinary XP is awarded for every graded attempt, including timed mock-exam answers. High-frequency retries can increase XP/rank independent of learning or source quality. Limited non-farmable rewards already exist in contracts, recall and rare cosmetics. | Product policy decision in Phase 7.0: separate exam statistics from reward XP; consider diminishing or daily-capped XP from identical same-day answers, with a transparent grandfathering policy. Do **not** rewrite historical XP without consent. |
| P1 open | The home view still contains many content panels, and rendering recomputes some domain and pool summaries. This is a maintainability and potential mobile-CPU issue, not an observed performance failure. | Use route/components, lightweight memoized selectors and an optional home `Today's 5-min Quest` first view. Measure on real devices when permitted. |
| P2 open | In-app backups are local and v2 SHA-256 is not a signature; browser storage can be evicted, quota errors may occur, and external AWS pages cannot be loaded offline. | Keep recovery guidance and future optional user-controlled export/restore drill. |
| P2 blocked | Android 320/360/400px layout is covered by static CSS/markup assertions, but no real Pixel/Brave browser or E2E navigation was executed. | Keep user-requested device/E2E deferral visible; avoid unsupported "hardware tested" claims. |
| P0 external | Independent human signoff remains **0/348 questions**. The 6.1 technical gate is installed but editorial approval is deferred. | Leave Issue #14 open and do not label AWS content as independently certified. |

## 3. Engagement / habit design review (hypotheses, not observed usage)

| Mechanism | Evidence | Design judgment |
| --- | --- | --- |
| Instant feedback | Correct/incorrect, rationale, combo, hit animations, XP and HP reduction | **Strong** short-term feedback loop; gives immediate confirmation |
| Clear next step | 5/10 micro recall, mission length, rank progress, next enemy, daily contracts | **Strong** attainable micro-goals; clear 1–5 minute entry points |
| Variety / exploration | 9 monsters, 5 themed expeditions, 4 architectural simulations, 48 scenarios, bosses, titles | **Strong** variety relative to quiz-only study; content quality remains the bottleneck |
| Mastery-aligned rewards | Delayed-recall-only bonus, distinct question campaign hits, one-time rare expedition and design emblems | **Positive** where verified retention drives rewards rather than repetition |
| Fairness / anti-farming | Daily capped recall, first-clear XP limits and one-time cosmetics; normal answer XP still repeats | **Mixed**; fixed duplicate submit and NG+ HP but raw XP remains a loophole |
| Habit sustainability | No push notifications, no purchase loops, optional audio/haptics/motion, finite micro-missions | **Generally controlled**, but the prominent repeat-mission CTA and streak-based title language may favor endless grinding |
| Readability / autonomy | Mobile focus mode, scalable text, reduced motion, optional collapsed features | **Improved**; must be tested with actual mobile hardware before strong claims |
| Long-term learning proof | Due review and delayed-return observations, but no longitudinal outcome analysis/real user data | **Not established**. Engagement design cannot be called empirically "addictive" or educationally effective from code alone |

**Conclusion:** The loop offers numerous reasons to return, and the new 6.4/6.6 activities deepen novelty, but intensity or habit-forming success cannot be verified without voluntary real-user observation. The next phase should increase *meaningful return visits* (correct recall after 1, 3, 7, and 14 days) rather than inflate total taps or create fear-of-missing-out.

## 4. Responsible success metrics for a future opt-in local dashboard

1. **Learning:** unique concepts correctly recalled after at least one day, 7-day delayed recall rate with sample size, number of official-source links studied, weekly weak-domain recovery. Keep exam practice scores separate from official pass probabilities.
2. **Voluntary return:** unique study days in the last 7/30 days and completed five-question sessions, measured locally; never upload automatically.
3. **Healthy stopping:** whether a player can finish after five questions without forced next activity or disruptive celebrations. No pop-up reminders, no shame for missed days.
4. **Balance / anti-farm:** percentage of XP from new/due concepts vs same-day repeats, duplicate ID protections, rarity awarded at most once, recovery preserving XP/history.
5. **Usability:** option visibility at 320px, visual clutter above the first answer, keyboard focus after progression, motion reduction. Present as proposed checks until physical/browser E2E is re-enabled.

## 5. Phase 7 recommendation

**Prefer Phase 7 = `RETENTION OVERDRIVE` (learning-effective gamification) before another pure monster expansion.**

- **7.0 (P0/P1, engineering foundation):** break apart the monolithic main view and test a pure reducer of answer/XP/review updates; establish an explicit mock-exam XP policy, transparent same-question XP reduction, and simple mobile render profiling. No existing progress reset.
- **7.1 (P1, product learning loop):** optional one-tap “今日の5問” orchestrator with evidence-based next-day recall, accurate streak semantics, short session summary and a clear end-session action. Compare meaningful retention *locally* against simply answering more.
- **7.2 (P2, RPG expansion):** four-step expedition chains with original challenge decisions and improved enemy telegraphs; rare cosmetic unlocks only on spaced recall or distinct first-time concepts, not grind volume.
- **7.3 (P2, architecture learning):** extend 4 design workflows to 8–10 source-checked cases, revisit missed design decisions after a day, more explicit trade-offs and annotated diagrams. Independent AWS human review still remains a separate deferred track.
- Keep Android hardware E2E, 6.1 external human signoff and cloud sync as **explicitly separately approved future work**, not prerequisites quietly enabled.

**Acceptance criterion for any Phase 7 choice:** CI/CD green; v1/v2 backup compatibility and no lost progress; one-time reward invariants; accessible focus layout; a measurable *learning* rationale in addition to visual spectacle.

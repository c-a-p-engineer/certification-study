# CERTIFICATION//OVERDRIVE

A flashy, arcade-inspired open-source certification learning game. Starting with AWS Solutions Architect Associate.

## Play online

**[▶ Play CERTIFICATION // OVERDRIVE on GitHub Pages](https://c-a-p-engineer.github.io/certification-study/)**

> Deployment status: GitHub Actions must complete successfully before the game is available.

## Features
- Neon arcade quiz interface with combo, XP, rank and particle effects
- 348 original AWS SAA practice questions, including 48 longer scenario items, with explanations and official reference links
- Local progress persistence, weak-topic review, evidence-informed spaced retrieval (RECALL RAID), optional active recall before options, reduced-motion support
- Extensible certification content format

## Current scope

The current prototype contains 348 original AWS SAA practice questions across four domains, a learning timeline, combo/XP progression, and local mistake review. The skill-tree nodes now track per-domain practice accuracy (not a calibrated exam readiness score). Sessions offer 10 questions, 20 questions, marathon mode, and a 65-question exam trial approximately weighted to the SAA-C03 domain outline (20 security / 17 resilient / 15 performance / 13 cost). Answer positions are shuffled separately for every item. Multi-select questions support multiple marked answers and exact-set grading. The exam trial includes a 130-minute countdown, deferred feedback and at least two five-choice multi-select questions per domain. Combo milestones trigger OVERDRIVE banners. Learning progress is stored in browser localStorage; cloud sync is not available.

## Code quality, engagement design and next-phase review

The [6.6 code and engagement audit](reports/overdrive-6-6-code-engagement-audit.md) documents verified bug fixes, known source-level risks, a qualitative evaluation of immediate feedback/rewards/learning retention, the limits of static evaluation (no opt-in longitudinal engagement measurements, no hardware E2E), and ranked alternative Phase 7 directions. “Habit-forming” is a design hypothesis, not a demonstrated claim about users or actual learning outcomes. The recommended direction is **learning-effective gamification**: observable next-day recall, bounded short sessions, independent reward correctness, and optional RPG variety without pressure to play longer.

## OVERDRIVE 6.4–6.6 — Expeditions, mobile focus and architecture design practice

### 6.4 — Monster Mastery Expeditions
- Optional **five themed 5-question expeditions** (IAM, VPC, S3, RDS and architecture trade-offs). Each selects distinct topic-related AWS questions from the existing locally bundled bank; the question-ID mapping and conventional review history are retained.
- Finish with at least **4/5 correct** to clear the encounter. A **rare cosmetic emblem** requires at least **two distinct correct overdue recalls** whose prior attempt occurred on an earlier local calendar day. Rare emblems can be obtained **once per expedition**, with **no additional XP** from finishing or replaying an expedition.
- Best scores, attempt counts and rare cosmetic IDs are recorded in optional `progress.expeditions`, and interrupted expeditions resume with optional fields in the existing mission-save v1 format. There are no timed attempts, purchases, push reminders, hidden rewards or penalty for not logging in.
- Existing SVG monster artwork is used offline. The collection is collapsed on the dashboard until requested so mobile answer choices and core navigation remain the priority.

### 6.5 — Android-first mobile reading and recovery
- A third **集中表示 (Focus)** option in the existing quiz-density preference hides the large combat HUD and replaces it with a short HP/combo status line. The setting is available in quick quiz controls and `MENU → OPTIONS`. Previously saved `compact` and `detailed` preferences remain valid; no new storage key is introduced.
- The question container becomes a programmatically focusable landmark. After the next question mounts, focus and scrolling move to the question, avoiding pre-render scroll timing. CSS provides 320px, 360px and 400px breakpoints, wraps long answer text, keeps at least 44px controls, and respects reduced-motion settings.
- The backup screen adds stepwise emergency recovery instructions; OFFLINE STATUS gives Android/Brave setup guidance and spells out that remote AWS documentation is not stored offline.
- Static regression/unit tests cover focus mode persistence, tap targets, long text and required markup. These **are not Android device tests**. Physical Brave PWA behavior and browser E2E remain deferred.

### 6.6 — AWS Architect Decision Simulator
- **Four original, 3-stage architecture scenarios**: multi-AZ web tier, private S3 access, RDS read scaling vs failover, and DynamoDB PITR recovery. Each step asks for one design decision with a concrete requirement, three alternatives, trade-off feedback, and a link to the relevant current official AWS documentation.
- An SVG architecture sketch has a plain-text equivalent for screen readers; choice buttons support keyboard activation. The launcher is opt-in/collapsed by default. The answer and rationale are presented at each step; all explanation text is bundled for offline learning, but external source links need internet.
- Best decision scores and first-time perfect **cosmetic emblems** are retained in optional `progress.designLab`. Retrying cannot earn additional XP or duplicate emblems; simulator progress is explicitly **not** an AWS exam score or validated certificate.
- Original problem bank remains **348 questions and 48 longer scenarios**; the simulator is a distinct learning mode, **not** extra exam questions. Existing local progress, v1/v2 JSON imports and offline workflows remain compatible.

### 6.6 integration + quality gates
- New `test:expeditions`, `test:mobile6` and `test:simulator` are required by the full `npm run build` pipeline. A code/engagement audit is tracked separately from observed user outcomes.
- No independent human AWS factual signoff is claimed: the original 6.1 reviewer work stays on hold. No device-level or browser E2E testing is claimed.

## OVERDRIVE 6.2–6.3 — Recall Micro Raid & Offline Data Safety

### 6.2 — RETENTION ENGINE 3.0
- **RECALL MICRO RAID** is a new home-screen practice panel with **5-question** and **10-question** sessions. It only draws on distinct questions whose spaced review is actually overdue **and whose preceding attempt was on a prior local calendar day**. Sessions with fewer eligible items truthfully say how many will be supplied. Unlike generic SMART QUEST, micro-raids prioritize review age, previous lapses and question difficulty while distributing attempts across domains.
- In-quiz labels explain why a question was selected (overdue days and prior lapse count), and optional `retention` plus `smartWhy` fields persist the session inside the **existing v1 mission-save schema**. A legacy saved mission has no retention mode and continues normally.
- Only a **correct, prior-day, overdue answer inside a micro-raid** earns a special `+25 XP` delayed-retrieval bonus; maximum **five distinct question IDs or +125 XP per local day**, enforced atomically in the progress updater with the ordinary XP award. Correct answers in boss battles, timed exams, normal practice, and repeated answers on the same day do **not** earn these additional bonuses. The persistent optional `retrievalRewards` field is validated for portable backups; no new storage key was required.
- Answer-history `mode:'retention'` is optional and backward compatible. RETENTION LAB separates short recall raids from SMART and regular modes, reporting sample size rather than making causal learning-effectiveness claims.
- Unit tests cover stale due dates, same-day attempts, repeated IDs, no available questions, 5/10 balance, daily caps, time boundaries, and mission-save compatibility. This is a **heuristic recall scheduler**, not a scientifically calibrated retention predictor.

### 6.3 — Portable v2 backups, safe recovery and storage inspection
- New downloads use **backup v2** with a SHA-256 digest of a deterministic, key-sorted payload (format, version, timestamp and all local save items). Import verifies the digest **before** the existing v1 data validator is used to restore any XP, title, creature HP or review history. Legacy **v1 files remain importable** and explicitly appear as *unverified legacy format*. SHA-256 detects accidental corruption but **does not authenticate the author or prevent a malicious actor from recomputing a checksum**. No server is contacted.
- If a restore journal cannot be used, the backup screen now shows whether it is absent, recoverable, damaged or inaccessible. The user can download a **raw emergency recovery snapshot containing current allowlisted values and the untouched journal** without deleting progress. Such a file is **not directly restorable as an ordinary v1/v2 backup**; keep it private and use it for diagnosis/manual recovery only. A recoverable journal can be explicitly retried after a confirmation.
- The OFFLINE STATUS panel also reports estimated browser quota/usage and whether persistent storage is enabled. Quota figures are only estimates; data may still be evicted by OS/browser, and official AWS docs and external websites **do not work offline**.
- `test:retention` and `test:integrity` are part of `npm run build`, alongside existing question bank, analytics, mobile static tests and the previous backup-journal regression tests.
- Browser E2E and physical Android/Brave disconnect tests remain **deferred**, as requested. Those tests are still needed to claim verified offline behavior on a particular device.

## OVERDRIVE 6.1 — Independent reviewer provenance (first infrastructure tranche)

Version 6.1 introduces **sign-off tooling**, not a claim that the 348 AWS questions are fully human-reviewed.

- `reports/human-review-decisions.json` is an intentionally empty human approval ledger. The **current independent sign-off count is zero**. Historical `reviewedAt` fields (33), targeted AWS official-doc checks (19) and AI-assisted option-rationale drafting (40) remain separate evidence categories and **must never** be counted as human approval.
- Every future human reviewer record must contain a reviewer GitHub handle, dated source links with exact checked claims, all five claim-level checks (stem, correct key, every distractor, caveats, SAA scope), a substantial written finding and a linked GitHub review PR. Human PR reviewers must corroborate the attribution: this JSON schema is not an identity-verification mechanism.
- A SHA-256 content fingerprint includes the exact stem, answer choices, correct keys, explanation, option reasons, domain and official reference. Editing a question invalidates its previous recorded human approval and fails CI until reviewed again.
- A prioritized **40-question review batch**, selected across all four domains (10 per domain), is generated in `reports/independent-review-queue.json` and `reports/independent-review-queue.md`. Scores flag editorial risks, not proven incorrect answers.
- Run `npm run audit:signoff` to generate the evidence and priority queue; `npm run test:provenance` tests false approvals, dated citations, corrupt/duplicate entries, changed answers and domain balance. These gates are included in `npm run build`; GitHub Actions uploads the new reports alongside prior question-quality checks.
- **Remaining #14 milestone:** qualified independent editors must sign off actual claims in reviewed GitHub PRs. AI cannot automatically complete that human requirement; the project should display no independently-approved badge until approvals are independently verified. E2E remains deferred.

## OVERDRIVE 5.7–6.0 — Verified implementation scope

### 5.7 — Editorial review tranche (40 issues)
- Reviewed an additional **40 original questions**, **10 per SAA domain**, to improve complete answer-option rationales and service-specific caveats. Questions keep their identifiers and existing answer indexes. [Detailed evidence ledger](reports/overdrive-5-7-review-batch.json).
- **Important:** This is an AI-assisted external-source consistency pass, **not signoff by a second independent human reviewer**. The source URLs, explanations and draft rationales still need manual review against current AWS service behavior and regional/pricing caveats. We do **not** falsely populate `reviewedAt` timestamps.
- 5.6's original 19-question case-by-case evidence ledger remains available. The question-audit artifact includes both ledgers so reviewers can prioritize the remaining human-signoff work.

### 5.8 — Diverse architectural scenarios
- Added **8 new, original, multi-constraint questions**, IDs `saa-341`–`saa-348`: six in Security, one in Resilience, one in Performance. The app now has **348 questions and 48 rich architectural scenarios**, of which 50 existing items use multiple-response scoring. New cases include IAM Access Analyzer unused permissions, Security Hub CSPM delegated administration, SSE-KMS cross-account policy, S3 VPCE restriction with console-lockout considerations, CloudTrail org trails, CloudFront OAC + KMS, DynamoDB PITR restore, and hot-partition mitigation.
- Rewrote four lexically similar questions into distinct real-world design decisions without deleting IDs or changing answer indices. [Manual overlap triage](reports/overdrive-5-8-overlap-triage.json) distinguishes true learning-objective overlap from complementary concepts. The bank is **not** claimed to exactly reproduce the SAA-C03 item distribution; focus is on authentic design trade-offs. Security bank coverage increased from 89/340 to **95/348**, compared with the official exam domain weighting of 30%.

### 5.9 — Retention Lab
- Added a local-only **7-day retrospective** and descriptive side-by-side review accuracy for SMART and non-SMART practice, plus the observed success rate on repeats on **different local calendar days**.
- Optional per-attempt `mode` and `at` fields are appended to existing answer history. **Old records remain valid**; unknown-mode history is not assigned to a category retroactively. No pass likelihood or causal improvement claim is made. Review groups with fewer than five samples should not be compared.
- SMART QUEST now avoids repeated IDs even in malformed candidate pools, ignores nonfinite due dates and falls back sensibly when a bucket is exhausted. It operates without paid APIs or automatic collection.

### 6.0 — Offline resilience and safe restore
- A durable browser-local **rollback journal** is written before importing a JSON study backup. If the browser shuts down midway, the app first attempts recovery from the journal before loading progress. If recovery cannot be completed, ordinary automatic progress saving is blocked and a warning is shown rather than overwriting original records with empty state. The journal is not exported in backup files.
- Input JSON is checked for schema, nesting depth (max 32), total nodes, unsafe field names, bound-length entries and valid dated answer events. Old version-1 backups still import. A storage quota failure before the journal is written rejects the restore without touching user progress; rollback is best-effort when browser storage itself is impaired.
- A compact **OFFLINE STATUS** dashboard shows current local cache revision, cached shell/asset counts and network/service-worker state, with manual refresh and update-check controls. It never forces a quiz interruption and disables manual checking when a saved mission remains. Cache readiness is an observation, not a successful offline device test.
- Mobile UI keeps 44px-or-greater interactive controls, responsive density presets, keyboard focus outlines and reduced-motion handling; the new status panels do not overlay answer choices.
- GitHub Actions runs the additional `test:release6`, `test:effectiveness` and `test:resilience` suites plus every prior gate, TypeScript, Vite build and generated PWA. The actionable audit artifacts are uploaded from the PR workflow. **Browser E2E and Android physical-device checks are still deferred**.

## OVERDRIVE 5.6 — Editorial Evidence and Quality Triage

**5.6 is the first documented review tranche, not a claim that all 340 answers have been independently approved.**

- **19 questions clarified** after targeted comparison with specific current AWS documentation. Fixes cover RDS Multi-AZ DB instances versus readable DB clusters, Aurora reader endpoint corner cases, S3 Lifecycle versus Intelligent-Tiering and its 128KB behavior, S3 versioning, Object Lock, Route 53 DNS failover, SCP permission boundaries, and S3 replication prerequisites. Three repetitive knowledge questions were rewritten into more concrete architecture cases. All IDs and correct-choice indices were retained to preserve local progress.
- Source-by-source findings are maintained in [editorial evidence ledger](reports/editorial-evidence-2026-10-24.json). Evidence level is `targeted_official_document_cross_check`, not independent review; none of these questions received an invented `reviewedAt` timestamp.
- The quality audit now uses two similarity thresholds: **0.22 for textual review candidates**, and **0.36 for strong lexical overlap**. This is triage, not semantic-duplicate proof. The audit does not automatically delete questions or rewrite answers.
- The audit also compares the 340-question bank with the [AWS official SAA-C03 exam guide](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html): Security **30%**, Resilience **26%**, Performance **24%**, Cost **20%**. Bank representation does not imply matching difficulty or exam format.
- Each PR's GitHub Actions run now uploads **`question-quality-audit`**, containing `reports/question-audit.json`, a readable `reports/question-audit.md`, and the targeted evidence ledger. `npm run test:editorial` verifies stable answer keys, source evidence, fuzz-candidate detection, coverage calculations and the lack of false editorial stamps; `npm run build` runs the full existing battery.
- **Outstanding:** independently verify stems, all answer options and alternatives across the remaining bank; reference link validity alone is not factual QA. Browser E2E remains explicitly deferred.

### Editorial backlog

Continue from [Issue #7](https://github.com/c-a-p-engineer/certification-study/issues/7), and use the 5.7+ issues opened after this release for content quality, non-repetitive scenario authoring and learning-effectiveness evaluation. No automated changes to existing user data are necessary.

## OVERDRIVE 5.1–5.5

All enhancements are designed around **existing browser-local progress and optional v1 fields**, preserving XP, earned medals, historical quest data, daily contracts and saved practice runs.

### 5.1 — Question Quality
Every normal question explanation and post-exam review now includes an expandable local **「この問題を報告」** panel. Reasons include ambiguous correct answer, incorrect explanation, outdated AWS information and display bugs. Reports are stored locally (up to 100) and included in JSON backups. Users may explicitly copy a suggested report or open a prefilled GitHub Issue to submit it themselves; no report is automatically published or transmitted. The interface distinguishes a source-provided `reviewedAt` editorial date from independent AWS factual verification. The automated audit exports `reports/question-audit.json` with domain coverage, possible duplicates, missing option analysis, unsupported absolutist wording and an explicit queue of unreviewed sources. Pull-request CI uploads the report as an artifact. **Reference URL presence and syntactic validity do not prove all 340 answers are current or correct.** Independent subject-matter review is still needed.

### 5.2 — Adaptive Engine 2.0
SMART QUEST now offers **Balanced**, **Review emphasis**, or **Exploration emphasis** presets with a transparent 10-question recipe. Due reviews, mistake recovery, unseen questions and design/weakness scenarios are targeted in weighted buckets; when a bucket is empty, remaining candidates fill the gap without repeating a question. Each selected question displays why it appeared, and that label survives a resumed mission. Existing timed 65-question exams and fixed 10-question domain bosses do not use the SMART selector. Smart profile preferences are saved separately and included in backup.

### 5.3 — Growth Analytics
The new dashboard distinguishes first-attempt accuracy, later attempts, due-review correctness, and successful attempts on previously missed questions. It shows 7/30/90-day activity and answer-rate trends, and cumulative domain accuracy with explicit sample counts. **These granular metrics begin only after the 5.3 release**; earlier aggregate history is not retroactively fabricated. Only the last 3,000 granular attempt events are retained, and they are included in progress backups. The analytics are descriptive, not pass probability predictions.

### 5.4 — Monster Evolution / NEW GAME+
After all nine monsters are defeated, the campaign offers an **opt-in NEW GAME+**. A completed cycle raises subsequent monster HP by 25% per round up to +100%. The bestiary retains earlier unlocks, dates, combat records and unique question-hit anti-farming rules. First-clear monster XP is never granted again on NG+ defeats; all regular correct-answer XP rules remain unchanged. The current round and its health are displayed on desktop and on the compact mobile enemy HUD. The optional `cycle` and `runCleared` fields load safely from older progress.

### 5.5 — Mobile and offline polish
PWA releases now wait for an explicit **Update & restart** action on the dashboard instead of automatically interrupting a quiz or exam. A banner appears only when a new service worker is ready and the player is back on the home screen. Updating does not intentionally clear local progress. Backup import previews the **current vs. incoming** answer/XP counts and warns if the incoming state is older. Issue reports and smart preferences are backed up as new optional keys, without increasing the backup schema version. Smaller text, compact HUD, motion reduction and next-question scroll behavior are preserved.

### Verification / constraints
`npm run build` runs all existing unit/regression checks and new `test:quality-feedback`, `test:smart`, `test:growth`, `test:replay`, and `test:mobile5` suites, generates the offline service worker, performs TypeScript checking and emits the QA report. CI uploads the question audit; GitHub Pages deployment must pass independently. Browser E2E and device-level Android/Brave validation are intentionally **deferred** by request.

## OVERDRIVE 4.2 / 5.0 — Mobile Quest + Smart Study

### Backup and safe restore
From `MENU → OPTIONS → STUDY BACKUP`, export an offline JSON snapshot containing progress (XP, reviewed questions, monster HP and history, boss records and relics), regular mission and exam resume state, equipped titles, recent-question history and local preferences. No user data is uploaded. Import validates a versioned allowlist, previews answer and XP totals, asks for explicit confirmation, and attempts rollback if any storage write fails. Restoring deliberately replaces local study state; export a fresh backup first. It does not automatically sync between devices.

### Installable, offline-ready PWA
On supported Android browsers, use **Install app** or **Add to Home screen** from the browser menu. The manifest scopes the app to `/certification-study/` and uses a stand-alone display, app icons, and a content-addressed service worker cache generated from production assets. After the first successful online load, the cached app code, styles and all bundled questions are available offline. Exam timing still uses the device clock; localStorage remains origin- and browser-profile-specific. External AWS documentation and ChatGPT links still require a connection. Browsers may choose to evict caches, so keep JSON backups.

### SMART QUEST — optional adaptive practice
The home screen offers a dedicated **SMART QUEST** button. It assembles a practice session by prioritizing overdue retrieval, mistakes to recover from, unattempted content, weak domains with sufficient answer history, and detailed architectural scenarios, while penalizing recently selected questions and repetitious services. The result is a reproducible local heuristic, not ML, an official score prediction, or a substitute for reviewing AWS docs. Ordinary sessions and the timed 65-question exam remain independent; mission resume saves carry an optional backward-compatible adaptive flag.

### Combat and mobile usability
The monster archive now has a bounded damage history (last 24 hits), dated enemy clear history and an attack attribute derived from the current question's exam domain. Existing nine-monster HP, anti-farming protections, rewards and the separate boss medals remain unchanged. After **NEXT QUESTION**, the question card is scrolled into view, without interrupting review/explanation reading.

### Content and safeguards
Eight original, architecture-based difficulty-3 practice scenarios were added (two per AWS SAA domain), taking the total to **340 questions / 40 longer scenarios**. Each includes a source link to AWS documentation and option-by-option reasoning. New questions have **no fabricated independent-review stamp**; expert editorial review against current official documentation remains necessary. The audit output includes by-domain gaps, near-duplicate candidates and an explicit editorial queue.

Full GitHub Actions CI runs the existing suites plus `test:backup`, `test:offline`, `test:adaptive` and `test:quality`. The production build generates a versioned offline worker and verifies that core HTML, JavaScript, CSS and manifest files exist. Browser E2E testing is **intentionally deferred**.

## Mobile reading & compact combat layout

On narrow screens (up to 700px CSS width), the quiz defaults to **省スペース (compact)**, unless the browser already has a saved preference. Enemy HP, its SVG portrait, and the combo multiplier share a single battle strip instead of two large stacked panels, creating more room for the question and answer choices. This is a visual-layout setting, not a change in combat XP, combo calculations, review scheduling, or exam timing.

Quiz headers now contain **A− / A＋** controls for changing reading size without entering the menu, plus **詳細 / 省スペース** to toggle the HUD layout. `MENU → OPTIONS → READING SIZE` offers **最小 / 小さめ / 標準 / 大きく / 特大**. The two smaller sizes use approximately 18–20px Japanese question text and 14–15px answer text on phones, with normal-size tap targets and no screen-obscuring overlay. Existing `standard`, `large`, and `extra` preferences are retained unchanged. The layout preference is saved separately under `cert-overdrive-quiz-layout-v1`; the text-size key remains `cert-overdrive-text-scale-v1`.

The timed exam retains the timer and progress controls but hides combat feedback, even when compact mode is selected. The change leaves existing browser-local study history, progress and mission saves untouched.

Checks: `npm run test:quiz-layout` and `npm run test:readability`, also run by the full `npm run build` CI gate. Device browser chrome and system display zoom vary: a short answer should not require a scroll for every option, but long multi-line AWS exam scenarios naturally still scroll.

## OVERDRIVE 4.1 — Enemy Campaign (SVG)

Every ordinary practice run (missions, scenario study, weakness review and spaced-retrieval study) now contributes to a persistent **nine-monster RPG campaign**. The four existing 10-question domain bosses remain separate challenges with their own medal and relic rewards.

### Continuous progression

| Order | Monster | HP | First clear bonus XP |
| --- | --- | ---: | ---: |
| 1 | TRAINING SLIME | 40 | 60 |
| 2 | MEMORY ZOMBIE | 75 | 100 |
| 3 | CACHE ARMOR | 120 | 140 |
| 4 | MULTI-SERVICE CHIMERA | 180 | 220 |
| 5 | ARCH DRAGON | 260 | 320 |
| 6 | ZERO TRUST CERBERUS | 320 | 400 |
| 7 | FAILOVER PHOENIX | 400 | 450 |
| 8 | LATENCY TITAN | 480 | 500 |
| 9 | COST LEVIATHAN | 600 | 600 |

Monster HP carries over from one practice session to the next, even across browser reloads. The monster archive records each clear and reveals the next enemy. After defeating the ninth monster, the campaign remains complete and cannot award repeated clear bonuses.

A unique correctly answered question deals **10 base damage**; difficulty 3 adds 3 damage, a review that was due before the answer adds 2, and correcting a prior mistake adds 2. The total is multiplied by **1.2x at 3 combos**, **1.5x at 5**, or **2x at 7+**, then rounded to an integer. A given question ID can only damage a particular monster **once**, regardless of repeated attempts or combo changes. Damage does not spill over into the next enemy. This limits repeated-question XP farming while rewarding knowledge retrieval.

The campaign uses nine original lightweight inline SVG monsters with state-dependent cracks, glow, hit effects, and defeat animation. Four domain-boss selector cards and the in-battle HUD also display distinct monster illustrations. Animations respect `prefers-reduced-motion` and the in-app reduced-motion preference.

The campaign is **disabled in timed exam trials** and **does not stack extra monster hits onto 4.0 domain-boss encounters**. The existing progress localStorage key (`certification-overdrive-progress-v1`), XP history, daily contracts, 4.0 medals and separate mission saves are retained. The new optional `enemyCampaign` value is normalized on load; no wipe or version migration is required.

Run `npm run test:campaign` for combat, escalating HP, combo math, duplicate-answer defense, save/restore, exam isolation, end-of-campaign, visuals and mobile/reduced-motion guard tests. The CI `npm run build` runs these alongside all existing tests.

## OVERDRIVE 4.0 — The Architect's Trial

The 4.0 dashboard has **four domain-specific bosses**, **nine growing AWS topic nodes** and **seven collectible cosmetic relics**.

### Four domain encounters

| Domain | Boss | Clear | Medal |
| --- | --- | --- | --- |
| Security | ZERO TRUST CERBERUS | 7 of 10 correct | B: 7–8 / A: 9 / S: 10 |
| Resilience | FAILOVER PHOENIX | 7 of 10 correct | B / A / S |
| Performance | LATENCY TITAN | 7 of 10 correct | B / A / S |
| Cost optimization | COST LEVIATHAN | 7 of 10 correct | B / A / S |

Each encounter draws **10 different difficulty-3 questions from its own exam domain**. A correct answer removes one shield point from the 7-hit boss shield, and remaining questions can raise the grade. The first clear of each boss awards 400 XP, while improving the best medal to a higher grade awards 120 XP; repeated clears at the same grade do not grant extra boss XP. Ordinary answer XP is unchanged. Rewards are recorded only at mission completion; the boss state is stored under the existing browser-local progress key.

### Nine topic-based learning branches

Topic nodes are derived from the **existing** per-question review records, not added proficiency scores or fabricated historical activity. Their heuristic stages are 0: unseen, 1: 1 distinct question seen, 2: 4 distinct questions seen plus 1 question with at least three consecutive correct retrievals, 3: 8 distinct questions seen plus 4 repeated-correct questions. A node launches a 10-question (or shorter where necessary) focused topic practice run. This is **not** a calibrated readiness rating or an AWS exam pass prediction.

### Seven earned relics

Four EPIC boss cores are earned through domain clears. MEMORY PRISM requires three branches at tier 2, ARCHITECT HALO requires all four bosses, and MYTHIC ASCENDANT CROWN requires all nine branches at tier 3 and all four bosses. Relics are deterministic cosmetics, not randomized gambling drops or paid power-ups. Players can equip any unlocked relic, stored alongside the existing study progress.

Existing progress and mission save keys remain unchanged. New optional fields are backward compatible; older practice snapshots still load. The timed 65-question exam retains deferred feedback and does not show combat or reward interruptions.

Verification: `npm run test:overdrive4` runs boss award/idempotence tests, derived skill stage tests, relic unlock tests and UI integration safeguards. `npm run build` runs the complete suite and TypeScript validation.

## DAILY CONTRACTS — mastery-driven missions

The dashboard now features four independent **daily learning contracts**, awarded for distinct correct answers in ordinary practice:

| Contract | Requirement | One-time daily XP |
| --- | --- | ---: |
| POWER UP | Correctly answer 3 different questions | 80 |
| NEW FRONTIER | Correctly answer 3 previously unseen questions | 120 |
| COMEBACK | Correctly revisit 2 questions that had been answered incorrectly | 160 |
| MEMORY RAID | Correctly answer 2 questions whose scheduled review was already due | 180 |

Each contract requires an explicit reward claim; reward claims are idempotent. A question ID can only count once per contract per local calendar day, so repeatedly answering the same problem cannot fill a contract. Practice exam answers do not advance contracts, and no progress information is shown during the timed trial. A new local day resets the contract board without deleting accumulated XP or the learning timeline. All data stays in the browser's existing local progress store.

Run `npm run test:contracts` for regression coverage of new-day resets, duplicate answers, reward claims, review/recovery classification, and exam exclusion. Contract goals are motivational, not exam score or readiness measures.

## Development
```sh
npm install
npm run dev
npm run build
```

## Deploy
GitHub Pages is deployed by GitHub Actions from `master` via `.github/workflows/deploy.yml`.

## Content policy
Questions are original practice material, not real exam dumps. AWS and its service names are trademarks of Amazon.com, Inc. This project is not affiliated with AWS.

## License
MIT.

## Question bank maintenance

Questions live in `certifications/aws-saa/questions/bank.jsonl` (the original 300) and `certifications/aws-saa/questions/scenarios-2026.jsonl` (32 exam-like original scenarios), one JSON object per line. Run `npm run validate:questions` to validate unique IDs, domains, 4–8 distinct options, answer indexes, explanations and official AWS references, and regenerate `src/generated/questions.json`. The build merges both JSONL sources; do not edit `src/generated/questions.json` directly. Do not edit generated JSON manually. New questions should be original and reviewed for factual accuracy before release.

## SAA-C03 readiness plan

Official reference: https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html

- Official exam: 65 questions, 130 minutes, 50 scored and 15 unscored. Question types: single and multiple response. The pass mark is a *scaled score* of 720, **not** a raw percentage.
- Official scored-domain weights: secure 30%, resilient 26%, high-performing 24%, cost-optimized 20%.
- **Editorial goal: 300+ original, reviewed practice questions** spanning scenario decisions, architecture trade-offs and multi-response problems. This is a project target, not an AWS requirement or passing guarantee.
- Current 65-question exam trial is a *practice approximation*: it includes single and multiple-response questions, uses a 130-minute timer and defers feedback until the end of the attempt. It is still not an official exam simulation, and its percent-correct figure cannot be converted into an AWS scaled score.
- Self-assessment heuristic (not a pass prediction): aim for at least 80% on several fresh mixed trials and independently explain why each distractor is inferior; continue reviewing weak domains.
- Unreviewed questions must not be presented as certified accurate. A separate technical review against AWS official documentation and the SAA-C03 task statements is still required.

## Quality gates

`npm run test:questions` checks IDs, exact duplicate stems, valid single/multiple answer sets, AWS reference fields and 65-question domain coverage. `npm run build` runs the JSONL generator, this test suite, TypeScript and Vite. These checks verify structure, not the factual accuracy of the questions. AWS documentation links and answer rationales still require editorial review.

## Remember more with structured practice

Research rationale and limitations: [Learning Science](docs/LEARNING_SCIENCE.md). RECALL RAID stores per-question spaced-review dates in browser localStorage. Optional ACTIVE RECALL FIRST hides the answer options until you first try to retrieve the solution and explain why. Review intervals are configurable heuristics, not guaranteed optimal for every learner. No learner responses are uploaded.

## Coverage and exam-format caveats

The question bank currently contains 332 original items, including 50 multiple-response items; five-choice and four-choice practice variants coexist. The game now supports different numbers of options per question. The dashboard tracks **unique attempted questions by domain**, separately from repeated-attempt accuracy, to make unpractised knowledge visible. A 65-question trial is a study simulation; it is not an AWS passing-score prediction.

The official SAA-C03 exam guide specifies that multiple-response questions offer **five or more options**. Earlier four-choice practice multi-select items remain for general drills and should be converted or separated from strictly format-faithful trials. Questions, explanations and official reference links still require human editorial accuracy review before being called exam-ready.

## Ask ChatGPT from explanations

After answering an ordinary practice question, or opening any post-exam review item, choose **ChatGPTに聞く**. It opens ChatGPT with a prompt prefilled with the question, answer choices, your answer, correct response, explanation and AWS documentation link, asking for option-by-option reasoning and a new follow-up scenario. The adjacent copy control works when the browser supports clipboard access. The learner must review and submit the prompt; prompt URL behavior depends on ChatGPT/browser context. This does not require any OpenAI API key. No study history is uploaded automatically; opening the link shares only the selected question context in the URL.

## Arcade UI accessibility update

Question options use larger Japanese text, high-contrast borders, distinct selected/correct/incorrect labels, improved tap targets and a numeric mission-progress HUD. Multiple-response options show an explicit selected counter and the confirm action requires the requested number of choices. Color is accompanied by text and icons; reduced-motion and keyboard focus indicators remain available.

## Daily dopamine loop

A **DAILY QUEST** card tracks today's 5-question goal and correct answers, using browser-local calendar dates. The golden progress meter fills as questions are answered. This is a motivation tool; progress is not an official prediction of examination success. The app retains the optional reduced-motion setting and separate review scheduling.

## Boss Rush

**BOSS RUSH** is a 10-question hard-mode session that draws from `difficulty: 3` items in the selected domain (or all domains). It uses the normal immediate-feedback learning flow. Difficulty values are editorial labels, not calibrated item-response difficulty estimates. There are 332 original practice items including 50 multi-response items. Game progress cannot guarantee passing the SAA-C03 exam; the question bank still requires a rigorous factual, conceptual-duplication and distractor-quality review.

## AWS abbreviation explanations

After answering a practice question, the explanation now includes an automatic **略語を覚えよう** panel when the question, choices or explanation contain known technical acronyms. Each entry shows the original English full name, Japanese translation and a practical definition. The same glossary appears in the post-exam review, never during a timed exam. The glossary is **collapsed by default**, while acronym expansions remain visible in the explanation text. Examples: RTO (Recovery Time Objective / 目標復旧時間) versus RPO (Recovery Point Objective / 目標復旧時点), MTBF, SLO, IAM, VPC and other common AWS abbreviations. Canonical glossary: `src/glossary.ts`; verified matching rules: `npm run test:glossary`.

## October 2026 roadmap implementation status

- **P0 deployed-site inspection:** The public Pages landing page was accessible via a rendered page fetch; the final post-change CI workflow must still be checked separately.
- **P0 editorial QA tooling:** `npm run audit:questions` writes a near-duplicate and missing-review report. It is advisory, not independent AWS validation. See [QUALITY_GATE](docs/QUALITY_GATE.md).
- **P1 explanations:** per-choice rationale fields are now supported, validated and displayed when authored; completing per-choice reasons for the 300 legacy items remains editorial work. The acronym glossary is collapsed by default.
- **P1 topic mastery:** heuristic service-topic categories display review-due, repeated-correct and lapse counts. These metrics are not pass probabilities.
- **P1 recall:** after practice, a learner can mark recall confidence to bring uncertain or forgotten material back for review.
- **P1 exam resilience:** 65-question practice session saves question order, answers, score and expiration timestamp locally and provides a resume action. Study data is browser-local and can be lost if cleared.
- **P2 game loop:** boss HP decreases with correct answers; level, XP, combo, achievements and the daily quest remain.

## OVERDRIVE 3.0 — music and screen effects

The game uses an **original, procedural Web Audio soundtrack**, with no external tracks, copyrighted sound samples, additional dependencies, or external audio fetches. A single reusable `AudioDirector` lives in `src/audioDirector.ts`; the game does not create a new `AudioContext` for each answer.

- BGM themes switch between home, ordinary mission, spaced-recall, Boss Rush, quiet exam trial and results.
- SFX cues cover click, option selection, correct/incorrect feedback, five-hit combo, mission start/finish, boss hit/defeat, rank promotion and daily XP reward.
- Animated rings, sparks and text overlays respond to mission starts, graded answers, combos, boss hits/defeat and XP milestones.
- Open the **gear icon** at the top right for independent BGM and SE switches and 0–100% volume sliders. The adjacent speaker icon toggles both channels at once.
- **All sound starts OFF** for new users. Browser audio only starts after a user click because of autoplay policies, and settings persist in localStorage. Audio pauses its scheduling while the page is hidden.
- **Exam Trial** does not reveal right/wrong animations while answering. Its theme is designed to be quieter than Boss Rush.
- Accessibility: reduced-motion preference and the explicit motion-reduction checkbox suppress animated overlays; gameplay remains available even without Web Audio.
- `npm run test:audio` checks default mute, gain bounds and soundtrack scene characteristics; `npm run build` includes this check.

The BGM is a synthesized looping melody rather than a streamed studio recording; if users need richer music later, integrate explicitly licensed audio assets and retain the same accessible controls.

## Contextual study terms at the end of each explanation

A collapsed **用語・サービス解説** disclosure appears **directly below the question text and before the answer choices** in regular practice, and at the **bottom** of each expanded post-exam question review. Unlike the older abbreviation-only glossary, this covers curated AWS services, networking and architecture concepts (e.g. Amazon S3, Amazon RDS, SQS, failover, idempotency, cache and partition keys), along with expanded acronyms such as RTO and RPO. Terms are ranked by relevance to the question and explanation before weaker mentions in distractors, limited to eight per item to reduce scrolling. Explanations remain hidden during the timed exam. The guide is curated and offline, so it makes no per-question AI calls; definitions need ongoing editorial accuracy reviews. Run `npm run test:terms` for coverage and matching regression tests.

## Resume a study mission

Regular practice, weakness raids, recall raids and boss rushes now save question order, answer selections, progress and combo in browser `localStorage`. On the home screen under QUICK PLAY, **前回のミッションを再開** restores the saved position without scoring the previous answer a second time. A separate **65問模擬試験を再開** entry resumes the existing timed trial, whose deadline keeps running while away. Starting a new regular session replaces the previous regular save; finishing the session clears it. Progress remains local to the current browser/device. Clear site data to remove local saves.

## In-question terminology guide

Each ordinary question screen shows an inline **用語・サービス図鑑** disclosure immediately **below the question heading and before the answer options**. It is collapsed by default and can be opened before or after answering to inspect abbreviations, Japanese translations, AWS services and architecture terminology from the *current question*. The disclosure never uses sticky or fixed positioning and is hidden during timed exam attempts and remains available within post-exam answer reviews. The current question gets a fresh collapsed drawer when advancing, so it does not obscure the next question. This guide explains vocabulary rather than giving a hidden answer key.

## OVERDRIVE Codex & Command Center (October 2026)

**Two-stage terminology UI:** In normal practice, the collapsed **用語・サービス図鑑** appears directly below each question, before answer controls. Open the index to see a compact list of context-matched terms and their Japanese kana readings; tap an individual term to expand its definition, full English name (if known), and architectural comparison. Each new question resets the index to a collapsed state. The exam attempt still hides all hints; its completed review includes the nested guide. All 58 curated AWS/concept entries and 32 acronym entries have hand-authored readings in `src/termReadings.ts`. These are displayed pronunciation guides, not automatic speech synthesis.

**MENU / COMMAND CENTER:** A persistent header button opens four tabs: STATUS (XP, level, rank requirements, answers, active days, streak, recall and domain performance), TITLES (35 unlockable and equipable Japanese nicknames), BADGES (unlocked/locked achievements), and OPTIONS (BGM, SFX, optional haptic strength, reduced effects). Profiles are derived from existing browser-local data and do not predict official AWS exam results. The modal supports Escape and keyboard tab wrap-around; use CONTINUE to return to gameplay.

**Haptic & fever gameplay:** Browser-supported vibration patterns differ for answer selection, correct and incorrect choices, 5-combo milestones, boss hits, victories, level-related events and daily rewards. Choose OFF / NORMAL / OVERDRIVE in MENU → OPTIONS. No vibration is attempted when motion reduction is enabled, and a timed exam only uses optional light selection feedback (no right/wrong hints). The Vibration API is unavailable in some browsers including many iOS environments; unsupported devices fail silently. Audio remains **OFF by default** and does not affect vibration settings. The quiz HUD also has a FEVER charge meter and immediate XP-gain feedback. See `src/haptics.ts` and `src/gameProfile.ts`.

Regression scripts: `npm run test:terms`, `npm run test:haptics`, and `npm run test:profile` (all included in `npm run build`).

## Study timeline and sustainable rank progression

The dashboard **LEARNING TIMELINE** shows total answered questions, tracked active study days, current streak and today's answers. Users can switch a two-series line graph between daily answer/correct counts and cumulative answer/correct counts; 7-, 30-, 90-day and full-history windows have keyboard- and touch-accessible date navigation.

Each submitted answer — including repeat practice and exam attempts — updates `progress.activity[YYYY-MM-DD]` **atomically** with the existing XP, correct/answered totals, due-review scheduling and daily quest state. Dates use the browser's local calendar. An active day means at least one answered question, not merely opening the app.

**Legacy migration is intentionally conservative.** Older versions kept lifetime XP/answer totals and the most recent daily quest, but not dated daily history. The app retains lifetime totals, carries over the one known daily quest date when available, and explicitly marks all other lifetime answers as having **unknown dates**. It never invents historical daily counts or zero-activity days before the earliest recorded date. Future chart updates begin with each new answer. History and progress are stored in the same browser-local storage; Brave and Chrome do not share them automatically.

**Ranks are no longer XP-only:** 19 tiers from `ROOKIE → SPARK → SCOUT → BRONZE` through `MYTHIC → LEGEND`. A tier requires all three milestone gates: XP, lifetime submitted answers, and *known active days*. LEGEND requires **120,000 XP, 700 answers and 50 recorded active days**. Rank is derived from saved totals and updated daily history; older XP and answer records are not reset, although the recalibrated rank can be lower. In MENU → STATUS, the three requirements for the next tier are visible separately. RPG levels continue to use the original square-root XP formula, independent from ranks.

Regression coverage: `npm run test:history` and `npm run test:profile` are included in `npm run build`.

## 2026 scenario expansion and RPG honorifics

- **19 calibrated-in-game ranks** with Japanese subtitles. These are game progression tiers rather than AWS exam scores. Every tier still requires minimum XP, a number of submitted answers, and a number of recorded active learning days. The 120,000 XP / 700 answers / 50 days LEGEND requirement remains unchanged.
- **35 independent unlockable titles** are earned for milestones in answers, correct-answer streaks, distinct attempted questions, topic/domain correctness, study-day streaks, learning days and XP. Choose MENU → TITLES to equip one; the home screen and STATUS show the chosen Japanese nickname. Equipped title ID is saved in the same browser's localStorage and does not reset XP.
- **32 longer original architectural scenario questions** were added across the four SAA-C03 domains, 8 in each domain, including two five-choice multiple-response problems per domain. Each has original scenario constraints, 4–5 plausible choices, a rationale for each option, difficulty tagging and an AWS documentation reference. All 332 are non-official practice content; editorial labels and sourced references do **not** imply they are verbatim or verified AWS exam questions.
- **Adaptive but deterministic-in-purpose question selection:** normal sessions and the 65-question trial prefer unattempted scenario-rich questions, penalize recently served questions, and spread major AWS services/concepts across each session. Deliberate weakness/due-review raids continue to repeat the learning material selected for repetition. Question history is locally saved and kept separate from the lifetime progress record; resumed practice/exams retain their previously selected question IDs.
- The 65-question practice exam preserves the existing domain mix (20/17/15/13, approximating the official 30/26/24/20 scored-domain weights), four-choice single-response format, and five-or-more-choice multiple-response format. The official exam has 50 scored and 15 unscored items; this app's 65-question simulation is **not a scaled-score predictor**.
- Quality gates: `npm run test:selection` verifies scenario structure and selection behavior; `npm run test:titles` verifies unlocked/equippable titles. All existing study, grading, glossary, mastery and saved-session tests remain enabled.

Reference: [AWS SAA-C03 official exam guide](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html).

## Reading modes and rewarding feedback (October 2026)

- **Android-first readability:** The quiz now uses larger, high-contrast question and answer text, a Japanese-capable system font fallback, generous line height, wrapping for long service names, and minimum-size choice buttons. Detailed option rationales, glossary disclosures, activity counts and the exam review also scale. In **MENU → OPTIONS → READING SIZE**, select 標準, 大きく or 特大. The value persists in that browser's localStorage and does not change answers or learning progress. Larger settings reflow status cards and rank-goal layouts.
- **Optional visual celebration:** In **MENU → OPTIONS → VISUAL POWER**, BALANCED is the default; OVERDRIVE enhances the color/glow of combo, correct answers, XP, newly unlocked titles and high mission grades. The display does not use rapid strobing. Browser/OS reduced-motion preferences and the game's effect-reduction setting always win. Web audio and haptics remain independently controllable.
- **Meaningful checkpoints instead of random attention traps:** 3, 5, 10, then every 10 consecutive correct answers trigger special combo feedback. Earned titles appear inline below an answered practice question; the learner may equip them with one tap. The home title badge opens the titles collection and its small level bar displays progress toward the next level. No controls or answer content are obstructed by a full-screen correct-answer overlay.
- **Mission rating:** Completed normal practice displays a letter grade S/A/B/C/D with percentage. This is solely a game performance cue; it is **not** an AWS passing-score estimate. An exam trial remains ungraded except for raw accuracy and answer review. New title rewards and rank promotions during timed exam attempts are deferred to the result view to avoid interruptions or hints.
- Quality gates in CI: `npm run test:readability`, `npm run test:grade`, and `npm run test:visual`, plus updated UI hierarchy tests.

Progress and all settings remain browser-local. The design never depends on TinyFish or an external browser agent.

# CERTIFICATION//OVERDRIVE

A flashy, arcade-inspired open-source certification learning game. Starting with AWS Solutions Architect Associate.

## Play online

**[▶ Play CERTIFICATION // OVERDRIVE on GitHub Pages](https://c-a-p-engineer.github.io/certification-study/)**

> Deployment status: GitHub Actions must complete successfully before the game is available.

## Features
- Neon arcade quiz interface with combo, XP, rank and particle effects
- 300 original AWS SAA practice questions with explanations and official reference links
- Local progress persistence, weak-topic review, evidence-informed spaced retrieval (RECALL RAID), optional active recall before options, reduced-motion support
- Extensible certification content format

## Current scope

The current prototype includes 300 original AWS SAA practice questions across four domains, a neon skill-tree overview, combo/XP progression, and local mistake review. The skill-tree nodes now track per-domain practice accuracy (not a calibrated exam readiness score). Sessions offer 10 questions, 20 questions, marathon mode, and a 65-question exam trial approximately weighted to the SAA-C03 domain outline (20 security / 17 resilient / 15 performance / 13 cost). Answer positions are shuffled separately for every item. Multi-select questions support multiple marked answers and exact-set grading. The exam trial includes a 130-minute countdown, deferred feedback and at least two five-choice multi-select questions per domain. Combo milestones trigger OVERDRIVE banners. Learning progress is stored in browser localStorage; cloud sync is not available.

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

Canonical new questions live in `certifications/aws-saa/questions/bank.jsonl` (one JSON object per line). Run `npm run validate:questions` to validate unique IDs, domains, 4–8 distinct options, answer indexes, explanations and official AWS references, and regenerate `src/generated/questions.json`. All 300 questions now use the JSONL source, including the eight original prototype questions. Do not edit generated JSON manually. New questions should be original and reviewed for factual accuracy before release.

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

The question bank currently contains 300 original items, including 42 multiple-response items; five-choice and four-choice practice variants coexist. The game now supports different numbers of options per question. The dashboard tracks **unique attempted questions by domain**, separately from repeated-attempt accuracy, to make unpractised knowledge visible. A 65-question trial is a study simulation; it is not an AWS passing-score prediction.

The official SAA-C03 exam guide specifies that multiple-response questions offer **five or more options**. Earlier four-choice practice multi-select items remain for general drills and should be converted or separated from strictly format-faithful trials. Questions, explanations and official reference links still require human editorial accuracy review before being called exam-ready.

## Ask ChatGPT from explanations

After answering an ordinary practice question, or opening any post-exam review item, choose **ChatGPTに聞く**. It opens ChatGPT with a prompt prefilled with the question, answer choices, your answer, correct response, explanation and AWS documentation link, asking for option-by-option reasoning and a new follow-up scenario. The adjacent copy control works when the browser supports clipboard access. The learner must review and submit the prompt; prompt URL behavior depends on ChatGPT/browser context. This does not require any OpenAI API key. No study history is uploaded automatically; opening the link shares only the selected question context in the URL.

## Arcade UI accessibility update

Question options use larger Japanese text, high-contrast borders, distinct selected/correct/incorrect labels, improved tap targets and a numeric mission-progress HUD. Multiple-response options show an explicit selected counter and the confirm action requires the requested number of choices. Color is accompanied by text and icons; reduced-motion and keyboard focus indicators remain available.

## Daily dopamine loop

A **DAILY QUEST** card tracks today's 5-question goal and correct answers, using browser-local calendar dates. The golden progress meter fills as questions are answered. This is a motivation tool; progress is not an official prediction of examination success. The app retains the optional reduced-motion setting and separate review scheduling.

## Boss Rush

**BOSS RUSH** is a 10-question hard-mode session that draws from `difficulty: 3` items in the selected domain (or all domains). It uses the normal immediate-feedback learning flow. Difficulty values are editorial labels, not calibrated item-response difficulty estimates. There are 300 original practice items including 42 multi-response items. Game progress cannot guarantee passing the SAA-C03 exam; the question bank still requires a rigorous factual, conceptual-duplication and distractor-quality review.

## AWS abbreviation explanations

After answering a practice question, the explanation now includes an automatic **略語を覚えよう** panel when the question, choices or explanation contain known technical acronyms. Each entry shows the original English full name, Japanese translation and a practical definition. The same glossary appears in the post-exam review, never during a timed exam. The glossary is **collapsed by default**, while acronym expansions remain visible in the explanation text. Examples: RTO (Recovery Time Objective / 目標復旧時間) versus RPO (Recovery Point Objective / 目標復旧時点), MTBF, SLO, IAM, VPC and other common AWS abbreviations. Canonical glossary: `src/glossary.ts`; verified matching rules: `npm run test:glossary`.

## October 2026 roadmap implementation status

- **P0 deployed-site inspection:** The public Pages landing page was accessible via a rendered page fetch; the final post-change CI workflow must still be checked separately.
- **P0 editorial QA tooling:** `npm run audit:questions` writes a near-duplicate and missing-review report. It is advisory, not independent AWS validation. See [QUALITY_GATE](docs/QUALITY_GATE.md).
- **P1 explanations:** per-choice rationale fields are now supported, validated and displayed when authored; completing all 300 remains editorial work. The acronym glossary is collapsed by default.
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

Each ordinary question screen shows an inline **用語・サービス解説** disclosure immediately **below the question heading and before the answer options**. It is collapsed by default and can be opened before or after answering to inspect abbreviations, Japanese translations, AWS services and architecture terminology from the *current question*. The disclosure never uses sticky or fixed positioning and is hidden during timed exam attempts and remains available within post-exam answer reviews. The current question gets a fresh collapsed drawer when advancing, so it does not obscure the next question. This guide explains vocabulary rather than giving a hidden answer key.

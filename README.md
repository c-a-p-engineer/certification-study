# CERTIFICATION//OVERDRIVE

A flashy, arcade-inspired open-source certification learning game. Starting with AWS Solutions Architect Associate.

## Play online

**[▶ Play CERTIFICATION // OVERDRIVE on GitHub Pages](https://c-a-p-engineer.github.io/certification-study/)**

> Deployment status: GitHub Actions must complete successfully before the game is available.

## Features
- Neon arcade quiz interface with combo, XP, rank and particle effects
- 200 original AWS SAA practice questions with explanations and official reference links
- Local progress persistence, weak-topic review, evidence-informed spaced retrieval (RECALL RAID), optional active recall before options, reduced-motion support
- Extensible certification content format

## Current scope

The current prototype includes 200 original AWS SAA practice questions across four domains, a neon skill-tree overview, combo/XP progression, and local mistake review. The skill-tree nodes now track per-domain practice accuracy (not a calibrated exam readiness score). Sessions offer 10 questions, 20 questions, marathon mode, and a 65-question exam trial approximately weighted to the SAA-C03 domain outline (20 security / 17 resilient / 15 performance / 13 cost). Answer positions are shuffled separately for every item. Multi-select questions support multiple marked answers and exact-set grading. The exam trial includes a 130-minute countdown and at least one multi-select question per domain. Combo milestones trigger OVERDRIVE banners. Learning progress is stored in browser localStorage; cloud sync is not available.

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

Canonical new questions live in `certifications/aws-saa/questions/bank.jsonl` (one JSON object per line). Run `npm run validate:questions` to validate unique IDs, domains, four distinct options, answer indexes, explanations and official AWS references, and regenerate `src/generated/questions.json`. All 200 questions now use the JSONL source, including the eight original prototype questions. Do not edit generated JSON manually. New questions should be original and reviewed for factual accuracy before release.

## SAA-C03 readiness plan

Official reference: https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html

- Official exam: 65 questions, 130 minutes, 50 scored and 15 unscored. Question types: single and multiple response. The pass mark is a *scaled score* of 720, **not** a raw percentage.
- Official scored-domain weights: secure 30%, resilient 26%, high-performing 24%, cost-optimized 20%.
- **Editorial goal: 300+ original, reviewed practice questions** spanning scenario decisions, architecture trade-offs and multi-response problems. This is a project target, not an AWS requirement or passing guarantee.
- Current 65-question exam trial is a *practice approximation*: it includes single and multiple-response questions, uses a 130-minute timer and gives immediate feedback. It is not a faithful official exam simulation (answers are revealed during play), and its percent-correct figure cannot be converted into an AWS scaled score.
- Self-assessment heuristic (not a pass prediction): aim for at least 80% on several fresh mixed trials and independently explain why each distractor is inferior; continue reviewing weak domains.
- Unreviewed questions must not be presented as certified accurate. A separate technical review against AWS official documentation and the SAA-C03 task statements is still required.

## Quality gates

`npm run test:questions` checks IDs, exact duplicate stems, valid single/multiple answer sets, AWS reference fields and 65-question domain coverage. `npm run build` runs the JSONL generator, this test suite, TypeScript and Vite. These checks verify structure, not the factual accuracy of the questions. AWS documentation links and answer rationales still require editorial review.

## Remember more with structured practice

Research rationale and limitations: [Learning Science](docs/LEARNING_SCIENCE.md). RECALL RAID stores per-question spaced-review dates in browser localStorage. Optional ACTIVE RECALL FIRST hides the answer options until you first try to retrieve the solution and explain why. Review intervals are configurable heuristics, not guaranteed optimal for every learner. No learner responses are uploaded.

## Coverage and exam-format caveats

The question bank currently contains 200 original items, including 22 multiple-response items; eight of those have five answer choices. The game now supports different numbers of options per question. The dashboard tracks **unique attempted questions by domain**, separately from repeated-attempt accuracy, to make unpractised knowledge visible. A 65-question trial is a study simulation; it is not an AWS passing-score prediction.

The official SAA-C03 exam guide specifies that multiple-response questions offer **five or more options**. Earlier four-choice practice multi-select items remain for general drills and should be converted or separated from strictly format-faithful trials. Questions, explanations and official reference links still require human editorial accuracy review before being called exam-ready.

# Learning design: retrieval, spacing, and interleaving

This app uses evidence-informed study techniques. **These are not a guarantee of passing AWS SAA**.

## Evidence base

- Dunlosky et al. (2013), [Improving Students' Learning With Effective Learning Techniques](https://pubmed.ncbi.nlm.nih.gov/26173288/): practice testing and distributed practice received high utility ratings; self-explanation and interleaving received moderate utility ratings.
- Carpenter, Pan & Butler (2022), [The science of effective learning with spacing and retrieval practice](https://doi.org/10.1038/s44159-022-00089-1): review of spacing and retrieval evidence in applied learning.
- Latimier, Peyre & Ramus (2021), [A Meta-Analytic Review of the Benefit of Spacing out Retrieval Practice Episodes on Retention](https://eric.ed.gov/?id=EJ1310148): review of distributed retrieval episodes.

## Implemented features

| Learning method | Game interaction | Caveat |
|---|---|---|
| Retrieval practice | Questions require an answer before showing explanations | Multiple choice allows recognition as well as recall |
| Retrieval before cues | Optional ACTIVE RECALL FIRST hides answer options until the learner attempts to recall | Self-reported effort, not independently verified |
| Spaced retrieval | RECALL RAID filters due questions from local browser storage | Intervals are heuristics, not empirically optimized per learner |
| Feedback and correction | Immediate explanation in practice; delayed, complete answer review in exam trial | Many existing rationales lack individual distractor analysis |
| Interleaving | ALL/marathon/exam mode mix domains with randomized items | Needs future question-tag and similarity constraints |
| Self-explanation | Active recall prompt asks the learner to articulate a reason before revealing choices | No automatic evaluation of the explanation |

## Scheduling algorithm (v1)

Record per-question streak, lapse count, last-reviewed time, and next-due timestamp.
- Incorrect: reset streak, review after 1 day.
- Consecutive correct answers: delays of 1, 3, 7, 14, 30, then 60 days.
- These exact intervals are **product defaults**, not established optimal intervals; optimal spacing depends on retention horizon, item and individual performance.
- Due questions are selectable independently of the existing immediate "mistakes" list.
- Data is stored only in localStorage; clearing site data loses progress, and there is no cross-device sync.

## Editorial and measurement roadmap

1. Require concept tags and distractor-level explanations on newly authored items; flag near duplicates semantically.
2. Add short text self-explanation and optional confidence ratings; do not claim automated correctness without reliable scoring.
3. Evaluate actual delayed recall at 7/30 days, completion and repeat-use outcomes, not just XP or instant accuracy.
4. Prefer motivating animations on session completion over excessive effects that interrupt retrieval.
5. A/B-test alternative spacing schedules only with appropriate consent and without uploading private learner answers.

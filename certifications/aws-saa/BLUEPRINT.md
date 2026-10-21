# AWS SAA-C03 Content Blueprint

Official exam guide: https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html

## Editorial targets

| Domain | Official exam weight | 300-question bank target | Current entries |
|---|---:|---:|---:|
| Design Secure Architectures | 30% | 90 | 79 |
| Design Resilient Architectures | 26% | 78 | 78 |
| Design High-Performing Architectures | 24% | 72 | 72 |
| Design Cost-Optimized Architectures | 20% | 60 | 71 |
| **Total** | **100%** | **300** | **300** |

Current items are original practice questions rather than actual exam questions.
No count of questions can guarantee passing. The current bank over-represents some introductory identification items. Increase scenario difficulty and plausible distractors before claiming exam equivalence.

## Item QA requirements

- Each single-response question has exactly one defensible answer; multi-response questions have a validated set of 2–3 responses.
- Scenarios identify workload, constraints, and trade-offs, not only AWS service names.
- Incorrect options should be plausible **same-domain** alternatives, never obvious unrelated services.
- Explain the right answer and the relevant limitation/trade-off in the rationale.
- Reference AWS official docs and verify target URLs and current service behavior.
- Reject repeated concepts disguised only by different wording; exact-string dedupe is necessary but insufficient.
- Add reviewer and review date fields once editorial tooling supports them.
- Keep five-or-more-option multi-response items in the exam trial; four-option multi-response practice items remain outside it.

## Game roadmap

1. **P0:** Confirm GitHub Actions build and GitHub Pages navigation on desktop/mobile; repair any failures.
2. **P0:** Add a CI check for the exam blueprint, regenerate question JSON, and validate schemas.
3. **P1:** Maintain multi-response scoring, a 130-minute timer and deferred answer review; add reliable exam-session resumption and timeout tests.
4. **P1:** Review all 300 questions for technical accuracy, conceptual duplication, domain weight and distractor quality; the source distribution currently differs from the official weights.
5. **P1:** Track mastery by topic and spaced repetition, not only overall accuracy.
6. **P2:** Add boss rush modes, level-up overlays, celebratory particles, mastery medals and accessible low-motion alternatives.

A practice-session accuracy of 80% is an independent study target; AWS's passing score of 720 is scaled, not 72% raw correctness.

## October 2026 status

300 authored items, 42 multi-response, 162 editorial hard labels (`difficulty: 3`). **Authored does not mean independently reviewed.** Distribution is 79/78/72/71 compared to the original 90/78/72/60 targets. No guarantee of exam readiness, pass probability or current AWS-document accuracy can be inferred from the volume or game XP. Browser/CI deployment still needs verification.

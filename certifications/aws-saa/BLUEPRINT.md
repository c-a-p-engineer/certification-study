# AWS SAA-C03 Content Blueprint

Official exam guide: https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html

## Editorial targets

| Domain | Official exam weight | 300-question bank target | Current entries |
|---|---:|---:|---:|
| Design Secure Architectures | 30% | 90 | 33 |
| Design Resilient Architectures | 26% | 78 | 33 |
| Design High-Performing Architectures | 24% | 72 | 27 |
| Design Cost-Optimized Architectures | 20% | 60 | 27 |
| **Total** | **100%** | **300** | **120** |

Current items are original practice questions rather than actual exam questions.
No count of questions can guarantee passing. The current bank over-represents some introductory identification items. Increase scenario difficulty and plausible distractors before claiming exam equivalence.

## Item QA requirements

- Each question has exactly one defensible answer (until multi-response engine support is implemented).
- Scenarios identify workload, constraints, and trade-offs, not only AWS service names.
- Incorrect options should be plausible **same-domain** alternatives, never obvious unrelated services.
- Explain the right answer and the relevant limitation/trade-off in the rationale.
- Reference AWS official docs and verify target URLs and current service behavior.
- Reject repeated concepts disguised only by different wording; exact-string dedupe is necessary but insufficient.
- Add reviewer and review date fields once editorial tooling supports them.
- Design and ship genuine multi-response (5+ options, 2+ correct) items before presenting the exam trial as format-faithful.

## Game roadmap

1. **P0:** Confirm GitHub Actions build and GitHub Pages navigation on desktop/mobile; repair any failures.
2. **P0:** Add a CI check for the exam blueprint, regenerate question JSON, and validate schemas.
3. **P1:** Build multi-response scoring and explanations; implement 130-minute timed exam mode with deferred answer review.
4. **P1:** Grow to 300 original reviewed questions in the 30/26/24/20 domain distribution.
5. **P1:** Track mastery by topic and spaced repetition, not only overall accuracy.
6. **P2:** Add boss rush modes, level-up overlays, celebratory particles, mastery medals and accessible low-motion alternatives.

A practice-session accuracy of 80% is an independent study target; AWS's passing score of 720 is scaled, not 72% raw correctness.

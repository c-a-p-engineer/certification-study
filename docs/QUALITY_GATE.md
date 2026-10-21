# SAA-C03 Editorial Quality Gate

Generated from current canonical `bank.jsonl` on 2026-10-21. This is a **structural audit**, not certification of AWS accuracy.

## Current status

- Authored questions: **300**. Domain counts: セキュリティ 79 / 耐障害性 78 / パフォーマンス 72 / コスト最適化 71.
- Independent review markers: **1/300**.
- Per-option rationales: **3/300**.
- Explanations shorter than 65 characters: **275/300** (length is only an editorial heuristic).
- Initial lexical n-gram audit flagged duplicate candidates `saa-225` and `saa-259`; `saa-259` was revised to a distinct SSE-KMS scenario. This does not prove conceptual uniqueness elsewhere.

## Confirmed service-specific corrections

- `saa-217`: Snowball Edge is **no longer available to new customers**. Reworded to target an existing customer and added the availability caveat. Source: https://docs.aws.amazon.com/snowball/latest/developer-guide/snowball-edge-availability-change.html
- `saa-100`: Explicitly distinguish single-standby Multi-AZ DB **instance** deployments from Multi-AZ DB **cluster** deployments that have readable replicas. Sources: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html and https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/multi-az-db-clusters-concepts.html

## Remaining manual QA

1. Independently compare each answer and its explanation to up-to-date AWS docs and exam task statement.
2. Add per-option rationale for every plausible distractor.
3. Review apparent conceptual overlaps and replace trivial unrelated options with plausible alternatives.
4. Record `reviewedAt` **only after actual review**, never on ingestion.
5. Keep experimental gameplay mastery separate from SAA scaled score and avoid promises of passing.

The build runs `npm run audit:questions`, which outputs `reports/question-audit.json` with heuristic near-duplicate candidates and missing editorial annotations. It does **not** mark items approved.

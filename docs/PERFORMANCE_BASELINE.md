# OVERDRIVE: UI render baseline methodology

**Purpose:** support Issue #23 with a repeatable, *low-risk* profiling aid after splitting pure quiz and home UI components. This is technical measurement infrastructure, not an assertion of real-user speed.

Run after installing dependencies and generating the bank:

```sh
npm run validate:questions
npm run profile:ssr
```

`scripts/profile-view-render.mjs` loads the real TypeScript/TSX view modules through Vite SSR, renders three small read-only components under Node's React server renderer, uses 8 warm-ups then 48 samples per view, and logs median/p95 elapsed milliseconds and generated markup bytes.

**Interpretation:**
- This measures SSR markup construction only. It does **not** measure Chrome/Brave interaction, client reconciliation/commit timings, JavaScript parse/load cost, page scrolling, user-perceived latency, memory pressure, network, PWA update behavior, focus movement or layout/paint.
- CI runner speeds and caching vary. Do not impose absolute performance thresholds or assert a performance improvement without repeated paired measurements on comparable environments.
- Do not record learner activity, export local progress, or introduce remote telemetry just to profile UI.
- If browser/Android testing is explicitly re-enabled, assess initial viewport composition, 320/360/400px scrolling and layout, focus handling, `React.Profiler` client timings and browser Performance trace, keeping any study records private.
- The product behavior, question IDs, XP policy and local save schemas are unchanged by this harness.

**2026-10-24 status:** script and CI execution allow future comparisons. Physical Android and browser E2E were deferred by user direction and remain unverified.

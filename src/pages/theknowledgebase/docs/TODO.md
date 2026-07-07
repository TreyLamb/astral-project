# TKB — To Do (come back to these)

Found during a spec re-audit against the 4 planning docs in this folder, plus items surfaced while testing. Open items only below — anything resolved gets removed, not just marked done, to keep this list current.

## 1. No mobile quick-capture / add-a-fact UI at all (biggest gap)

`addQuestion` exists in the data layer (`TkbApp.jsx`) but is never called from any screen. The only way to add content right now is pasting pre-formatted JSON into the Settings → Data import textarea. The spec calls mobile capture out explicitly as a first-class requirement, not an afterthought: "near-zero-friction mobile add path matters as much as the review UI." Right now there's no simple "type a fact, hit save" form anywhere — the Quick Facts pipeline's stated core use case (capture on the go) has no real UI path yet.

Needs: a lightweight add-a-fact form (question, answer, subject/subtopic picker, defaults to `pipeline: 'quick_fact'`, `status: 'draft'` or `'active'`) reachable in as few taps as possible from a phone — likely its own small page/modal, not buried in Settings.

## 2. Per-question weight table in Settings

The spec calls for three manual dial editors: subject weight, style-tag weight, per-question weight. Only the first two exist as browsable tables in `TkbSettings.jsx`. Per-question (and per-style-tag) weight is only adjustable one-at-a-time from inside the review flow (the two sliders at the top of the review screen, for whichever question you're currently looking at) — there's no way to search/browse all questions in Settings and see or adjust weights for ones you're not currently reviewing.

Needs: a filterable/searchable table (by subject, subtopic, or text search — question count is large, ~957) with a weight slider per row.

## 3. "Study Guide" mode — go through every question once before normal review

Requested while testing the ASVAB deck: since a freshly-imported set has zero rating/history data (everything is maximally "stale"), the goal is a mode that walks every question in the current subject scope exactly once, in order, with time to rate each one — as opposed to Review mode's weighted random sampling with repeats. Wanted generically ("possible for any of the module styles"), not just ASVAB.

Stopgap already shipped: scoped profiles (Focused Review / Auto-Adjust Scoped) now pull the ENTIRE matching pool per session instead of capping at `defaultN` (see `TkbReview.jsx`'s `effectiveN`). That's a bigger single-session sample, but it's still Review mode underneath — weighted sampling, retry-reinsertion on wrong/unsure, no guaranteed single-pass-no-repeats ordering.

Needs (real version): a distinct mode/profile that pulls the full scoped pool in a fixed order (e.g. grouped by subtopic, "bite-sized pieces" per the user's own framing), advances linearly with no retry-reinsertion and no repeats, and tracks which questions have been "seen once" so the pass can be resumed across sessions rather than restarting.

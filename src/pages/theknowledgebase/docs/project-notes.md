# Rapid Review System — Project Notes (Master Spec)

## Purpose
Daily rapid-fire review tool: 60–500+ short questions per session, pulled at random across many unrelated subjects (interleaved practice), to keep broad knowledge fresh. Not a test — self-graded, low-stakes, speed-optimized. Secondary use: slower, deliberate study for genuinely new material via a separate pipeline.

---

## Core Modes (Profiles)
A "profile" is a saved combination of three independent settings. Everything below is one engine; modes are just presets.

| Setting | Options |
|---|---|
| `subject_scope` | all subjects / a chosen subset (e.g. "Geology only") |
| `adjustment_mode` | manual (toggle-driven) / auto (performance-driven, ~99% hands-off) |
| `pace_class` | fast (Main Recall) / slow (Quick Facts) |

Named presets to ship first:
- **Main Recall** — all subjects, manual toggles, fast pace. The core daily driver.
- **Quick Facts** — all subjects, manual, slow pace, new/unfamiliar material only.
- **Auto-Adjust (All)** — all subjects, performance-driven weighting, finds weak points automatically, no manual tuning expected.
- **Auto-Adjust (Scoped)** — user picks a subject subset, same auto behavior, for cram-focused study (e.g. "Auto-Adjust: Geology Only").

---

## Weighting & Selection Engine

Three independent, persistent dials, multiplied together:

```
effective_weight = subject_weight × style_tag_weight × question_weight
```

- **Subject weight**: how often a whole subject should surface (independent of how many questions it has).
- **Style/tag weight**: cuts across subjects — "capitals," "dates," "vocab-recall," etc. Turning this down reduces a *question pattern*, not a subject.
- **Question weight**: per-question 1–100 toggle, most granular control.

### Session fill algorithm
1. Allocate session size N across subjects proportional to subject-weight share (use largest-remainder rounding so totals land exactly on N).
2. Within each subject's slice, weighted-random-sample using style_tag × question weight.

### Cooldown / Recall-Support Cycle (adjustable — new)
Default cooldown is not a flat suppression window. Instead, each question can enter a **cycle state**:
- `active_days`: once triggered, the question is boosted to reliably reappear daily for a randomized 3–4 day run (range configurable).
- `rest_days`: after the active run ends, suppressed for a randomized 1–2 days (range configurable).
- After one or two full cycles, question returns to normal pool behavior (falls back to standard weight-based selection) rather than cycling forever — prevents every question from permanently cycling and crowding out variety.
- This is **not applied to the entire library at once** — only to a working set: newly added questions, anything just answered wrong, or anything manually flagged "help me lock this in." Everything else follows normal weighted selection with a simple short-term repeat guard (don't reshow within the same session).
- Both ranges (active_days, rest_days) are global adjustable settings, plus a cap on how many questions can be "in cycle" simultaneously so this subsystem can't dominate a session.

---

## Scale Problem: Broad Sweep vs. Deep Dive

Once the library grows large (many subjects × full curriculum coverage per subject), a flat 500/day pull under-serves individual subjects. Two structural answers:

1. **Broad Sweep** (= Main Recall): wide random sample, optimized for variety/exposure, not full-coverage cycling. This is the "keep everything warm" mode.
2. **Deep Dive** (= Auto-Adjust Scoped, or a manual scoped session): pulls heavily/exclusively from one or a few subjects, meant to actually push a subject toward 100% coverage.
3. **Rotation layer** (new, on top of both): since daily volume is fixed but subject count isn't, auto-schedule which subjects get a temporary focus injection each day/week — prioritize subjects that are both low-coverage and high-staleness (see below). This ensures every subject gets deep attention periodically without you manually managing it.

---

## Subject Bubble Page — Three Axes

- **Bubble size** = raw question count (library depth).
- **Toggleable fill/color** = switch between two views:
  - **Coverage view**: % of subtopic checklist met at each difficulty tier (a subject can be 100% covered at basic, 10% at advanced — track per tier, not one flat number).
  - **Staleness view**: days since last shown. Most actionable of the three — a subject can have great coverage and still be neglected if its weight keeps it rare.
- Editable UI: rename, merge, delete subjects; adjust which profiles a subject is visible to (ties into `subject_scope`).
- Subtopic checklists need to be defined per subject before coverage % means anything — seed these with Claude-drafted standard curriculum outlines, refine over time.

---

## Color System

- **Canvas**: soft, muted neutral base — warm light gray, cream, or pale sage. Not stark white (flagged in screen-ergonomics research as high-strain over long sessions at this session length), not saturated.
- **Accent/wake-up colors**: reserved for buttons, progress bar, and question-transition flashes — not the resting background. Weighted pool, reshuffled per session (not a strict repeating pattern):
  - Sky blue + coral/red: dominant, combined ~70–80%
  - Green + yellow: present, minor, ~15–20%
  - Other/misc shades: rare, ~5%
  - Shade/luminance jitter within blue and red so consecutive hits don't look identical.
- **Correct/incorrect feedback color stays fixed and separate** from the decorative accent pool — never let the two systems collide, or state becomes unreadable at speed.
- **Avoid placing highly saturated opposite-spectrum colors directly adjacent** (e.g. bright blue against red) — causes refocus strain crossing the boundary.
- **Experiment to run**: fixed color per subject (not random) as a spatial recognition cue — "blue tag, that's algebra" recognized before reading the question. This is a different color usage than the session accent pool above (subject tag/border color = persistent identity; accent pool = session mood/wake-up, rotates). Both can coexist; A/B against pure session-random to see which you actually prefer.

---

## Sourcing & Ingestion

**Architecture**: one small adapter per source, all normalized to the same output shape (`question, choices, answer, subject, tags, source, status`). New sources plug in later without touching the rest of the system. Every question enters as `draft` regardless of source — nothing gets served live until approved.

**Active sources**:
- **Open Trivia DB** — free, no key, CC BY-SA, session tokens prevent in-session repeats. Good general-knowledge filler.
- **The Trivia API** — free for non-commercial use (CC BY-NC), runs semantic-similarity checks at submission to catch reworded duplicates.
- **MMLU dataset** — research dataset, 57 subjects spanning hard sciences/social science/humanities, ~150 questions per subject typically (largest subject 1,500+), free bulk download, no API needed. Strong lead source given the ~58-subject target — closest thing to a ready-made seed inventory.
- **Claude-generated (notes-to-questions prompt)** — most flexible ongoing source; also doubles as Quick Facts intake when you paste your own material.
- **Skip**: jService (Jeopardy clue API) — offline since 2023, don't build against it despite appearing in older tutorials.

**Ingestion pipeline requirements**:
- Dedup on import (lightweight semantic similarity check) — OpenTDB/MMLU will overlap with each other and with hand-entered questions over time.
- Live "flag" button during review — bad questions get queued for edit the moment you hit them, instead of relying on a separate proofreading pass.
- Tag taxonomy (Subject → Subtopic → Style) should be nailed down *before* bulk-importing thousands of untagged questions — "similar style" toggle is only as useful as tagging discipline.

---

## Quick Facts Pipeline

- Slower pace by design — always shows the answer/explanation after grading (it's new material).
- **Promotion rule (refined)**: a fact promotes into the Main Recall pool only after being recalled correctly across *multiple separate days* — not repeated correct answers within one cram session. Prevents false promotion from short-term memory.
- **Mobile capture is a first-class requirement, not an afterthought** — most quick facts get learned away from the keyboard. Near-zero-friction mobile add path matters as much as the review UI.
- Same edit-before-serving rule applies to fast-captured facts — quick capture produces typos.

---

## UX / Interaction

- **Keyboard-first**: at 500 questions in 20–30 minutes, the mouse is the bottleneck. Every core action (reveal, self-grade, flag, add-back-to-stack) needs a keyboard shortcut. Mouse still works, just not the primary path.
- **Retry mechanic**: on wrong/unsure, re-insert the question into the *current session's* remaining queue at a randomized offset (10–40 questions later) — not immediately next, which would just test short-term memory.
- **Optional single-keypress self-rating** ("knew it" / "blanked") — off by default to protect the "not a test" feel, but this is the input signal that would eventually feed staleness/auto-boost and any future auto-adjust logic.
- **Focus weeks**: a temporary override layered *on top of* the permanent baseline weights (e.g. bump a subject before a trip), which auto-reverts after a set period — kept structurally separate from your permanent dials so it doesn't quietly recalibrate your defaults.
- Animations: fast, interruptible, never block the next question — flair happens at the edges (transitions, accent flashes), not in the critical path.

---

## Data & Portability

- **Export to JSON from day one** — this is meant to become a personal knowledge base over years; don't let it become locked into one implementation.
- **Sync decision**: mobile use (especially Quick Facts capture) is a stated priority → needs a small hosted DB, not local-only storage. Already decided: build as a PWA on existing hosting, revisit native wrapper (Capacitor) only if performance demands it.

---

## Future Roadmap (not phase 1)

- Auto-adjust mode's underlying logic is a hand-built cousin of spaced-repetition schedulers (Leitner boxes → SM-2 → FSRS). FSRS is worth knowing as the reference model if the auto-adjust profile ever needs real predictive weighting instead of simple performance-count heuristics — it predicts recall probability directly rather than using fixed intervals, and outperforms SM-2 with fewer reviews for the same retention.
- Study guide generation from auto-adjust's weak-point data.
- Full native app wrapper, if PWA performance is ever insufficient.

---

## Open Decisions (not yet locked)

1. Who authors subtopic checklists per subject initially — you, or Claude drafts a standard curriculum outline as a starting point per subject?
2. Are user-created custom profiles available in the UI at launch, or hardcoded to the four presets above for phase 1?
3. Retry-queue offset: fixed range, or itself a user setting?
4. Hosting/stack specifics (needed before implementation) — see handoff prompt.

---

## Phase Plan
- **Phase 1**: UI + functionality (review flow, bubble page, toggles, profiles, color system, animations) using stub/mock data. Data ingestion adapters and bulk sourcing come after.
- **Phase 2**: Real data — ingestion adapters, MMLU/OpenTDB/Trivia API import, dedup, tag taxonomy applied at scale.

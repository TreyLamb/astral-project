# DLAB Trainer — project doc

Route: `/DLAB/*` · CSS prefix `dlab-` · lives in `src/pages/dlab/`

This is the canonical doc for the DLAB sub-app. Same role as
`FitnessTrackerPlan.md` / `EftShoppingPlan.md`. Keep it current as the app
changes — the "Decisions worth keeping" section is the part that saves a future
session from redoing analysis.

---

## Status — shipped and verified

Everything below is built. Three gates, all green:

```
node src/pages/dlab/engine/engine.selftest.mjs   # 10/10, 500 languages, 15,000 items
npx eslint src/pages/dlab --ext .js,.jsx         # clean
npx vite build                                    # clean, Piper/Kokoro in lazy chunks
```

`DLAB_SEEDS=60` for a fast engine loop while iterating.

Driven end to end in a real browser: setup → brief → written half → handoff →
listening half → score → per-item working → history → settings, plus `/dlab`
redirecting to `/DLAB`, the site navbar suppressed, and the Home card present.
Zero page errors. (The Firebase `invalid-api-key` console noise is pre-existing
local env, not this app — it correctly falls back to local mode.)

### File map

| Path | Role |
|---|---|
| `engine/` (16 modules) | The generator. Pure, no React, seed-deterministic |
| `dlabStorage.js` / `dlabFirestore.js` | Mirrored persistence, chosen per-call |
| `dlabContext.js` | `useDlabState()` + `makeBackend(user)` |
| `DlabApp.jsx` | Shell: HubLink, own topbar, nested routes |
| `views/SetupView` `BriefView` `TestView` `ResultsView` `HistoryView` `SettingsView` | The six screens |
| `components/RulesBrief.jsx` | Rule sheet, shared by brief + results |
| `useVoice.js` | React hook over `engine/voice.js` |
| `SceneSvg.jsx` · `TimerBar.jsx` | Pictorial renderer · depleting bar |
| `Dlab.css` | Every class `dlab-` prefixed, vars on `.dlab-app` |

**One route, two halves.** `/DLAB/test` runs the written pool then hands over to
the listening pool. It does **not** submit between them — a sitting is scored as a
whole, and submitting at the end of the written half would score every listening
item blank. Exam Sim is not a separate screen either: it is a sitting with
`mc: true`, so multiple choice is a rendering mode of an item, not another app.

---

## What this is

The DLAB measures aptitude for *learning* a language: it teaches you an invented
language's rules on the spot and tests whether you can apply them. **A practice
tool that ships a fixed test is worthless after one sitting**, so the deliverable
here is a generator, not a test. Every start rolls a new phonology, new
vocabulary roots and a new grammar parameter vector.

The real exam: 126 multiple-choice items, **five audio sections + one visual
section**, ~2 hours, scored 95–164 against Category I–IV cutoffs
(95 / 100 / 105 / 110).

> **Known vs. inferred.** The item count, the 5-audio/1-visual section split and
> the scoring scale are public. **Per-section item counts are not** — the DLAB is
> protected under DoDI 5160.71. "Visual is ~1/6 of the test" is an inference from
> section structure, not a published fact, which is why the written:audio ratio
> is a user-set parameter here rather than a hardcoded guess.

Sources: [Wikipedia](https://en.wikipedia.org/wiki/Defense_Language_Aptitude_Battery) ·
[Operation Military Kids](https://www.operationmilitarykids.org/defense-language-aptitude-battery-dlab-test-guide/) ·
[OpenExamPrep](https://open-exam-prep.com/study-guides/dlab)

---

## Written and audio: shared language, independent item pools

- **Shared** — one rolled language per sitting: same phonology, lexicon, grammar,
  rules brief. You cannot learn a new grammar halfway through a sitting.
- **Independent** — the two pools contain *different items*. Re-asking a written
  item by ear would measure whether you remember your own earlier answer, not
  whether you can apply the rule.

Modality is a property of an item, not a separate test. Five types are audio-only
(`stress`, `dictation`, `rootRecall`, `verbRootRecall`, `vocabReverse`), one is
written-only (`pictorial`), the rest generate either way.

---

## Locked decisions

| Decision | Choice |
|---|---|
| Theme | MFT dark structure, amber accent (`--dlab-accent: #fbbf24`) |
| Voice | Three providers behind one adapter; Web Speech default, Piper/Kokoro lazy |
| Multiple choice | Exam Sim only, **plus** an opt-in assist toggle from the hard tier onward |
| Timer | Depleting **bar only** — no digits, no clock |
| Vars | `--dlab-*` on `.dlab-app`, never `:root` (TKB's `:root` approach leaks globally) |

### Hard-tier assist toggle
Available from hard tier onward. **Sticky for the session** once enabled — a
commitment, not a peek. Does not change the timer. Options come from the same
wrong-rule distractor generator as Exam Sim. Assisted items are tagged
`assisted: true` and reported on a **separate results line**, so an assisted
score never silently inflates an unassisted one. Easy/medium never offer it.

### Length presets

| Preset | Written | Audio | Total | Format | Est. |
|---|---|---|---|---|---|
| Quick Drill | 6 | 24 | 30 | fill-in | ~25 min |
| Written Focus | 30 | 0 | 30 | fill-in | ~35 min |
| Balanced | 30 | 30 | 60 | fill-in | ~75 min |
| **DLAB-Weighted** *(default)* | 12 | 48 | 60 | fill-in | ~70 min |
| Exam Sim | 26 | 100 | 126 | **MC**, timed, scaled | ~2 hr |
| Custom | 0–60 | 0–120 | — | fill-in | — |

MC is scoped to Exam Sim because of **time, not pedagogy**: the real exam affords
126 items *because* recognition is fast (~57 s/item). Open-response extreme items
take 2–4 min, so an all-open 126 would be a 4-hour sitting. Production is
otherwise the stronger signal and stays the default everywhere else.

Difficulty applies **per pool** at 33/33/17/17, so each pool climbs easy→extreme
on its own. At 30 that is exactly 10/10/5/5.

---

## Engine architecture

Everything is a pure function of a **seed**. A test *is* a seed — shareable,
retakeable, fuzz-testable.

| Module | Role |
|---|---|
| `rng.js` | `mulberry32`, `pick`, `shuffle`, `sample`, `seedFromString`, `makeSeedCode`. Local copy of TKB's — see note below |
| `phonology.js` | Rolls consonant/vowel inventories, syllable template, stress rule. Builds structured syllables |
| `grammar.js` | The 12-axis parameter space; `resolveAffix` runs the one morphophonological rule |
| `lexicon.js` | Semantic slots → generated roots; all grammatical morphemes |
| `language.js` | `rollLanguage(seed)`, `paramVector`, `rollDistinctLanguage` (anti-staleness) |
| `compose.js` | **The heart.** `compose(spec, lang) → { surface, words, trace }` |
| `gloss.js` | Spec → English, for the prompt side |
| `questions.js` | 12 item builders, tier measured from trace depth |
| `rulesBrief.js` | Params → the rule sheet. **Coverage source of truth** |
| `validate.js` | coverage · determinism · homophony · leak |
| `buildTest.js` | Assembles a sitting, presets, regenerates rejects |
| `grade.js` | Normalising comparison, scoring, scaled estimate |
| `examSim.js` | Wrong-rule distractors, `distractorKey` |
| `audioScript.js` | TTS respelling, stress prosody, read-aloud script |
| `engine.selftest.mjs` | The gate |

### Why the answer key can be trusted
`compose()` returns the surface string **and** an ordered trace of every rule
that fired. The answer key is that function's output — never a hand-written
string — and the step-by-step explanation is that same trace, rendered. An answer
cannot disagree with its question and an explanation cannot drift from its
answer, because there is one source for both.

### The 12 grammar axes
Word order (6) · adjective placement (2) · possession (4) + possessor order (2) ·
plural (5) · case/role (5) · tense (4) · negation (5) · question formation (4) ·
agreement (3) · definiteness (4) · stress (5) · morphophonology (6).

`rollGrammar` applies deterministic fixups where two axes would collide — e.g.
verb-initial languages never get `inversion` question formation, because fronting
an already-fronted verb makes the question string-identical to the statement.

Anti-staleness: `dlabStorage` remembers the last 20 parameter vectors;
`rollDistinctLanguage` rejects a candidate differing on fewer than 5 of 13 axes,
then falls back to the most-distinct candidate rather than spinning.

### The four validators
- **Coverage** — every rule ID in an item's trace has a section in the rules
  brief. Makes it *structurally impossible* to ask a question needing an unstated
  rule. Adding a rule to `compose.js` without a brief section fails the gate.
- **Determinism** — recomposing the spec reproduces `composedSurface` byte for
  byte.
- **Homophony** — the answer is not reachable from a different meaning in the
  confusable neighbourhood (one lexeme swapped, one feature flipped, subject and
  object exchanged).
- **Leak** — a fill-in-the-blank prompt does not already contain its own answer.

Failures cost a regeneration, never a wrong answer.

---

## Decisions worth keeping

Read these before changing the engine — each one cost real debugging.

**Generated languages are agglutinative.** Whole-syllable affixes, clean morpheme
boundaries, no fusion. Affixation is therefore list concatenation and there is no
resyllabification step that could produce two defensible surface forms. Ambiguity
is designed out at the phonology layer rather than checked for downstream. Real
agglutinative languages (Turkish, Finnish, Japanese) work exactly this way.

**Items carry `spokenWords` (syllable structure), never just a flat string.** An
earlier version re-parsed syllable boundaries out of the spelling. It disagreed
with the generator on **51% of words** — `ongoso` is both `on-go-so` and
`o-ngo-so` and nothing in the spelling picks between them — which would have put
audible stress on the wrong syllable in half of all stress items, *silently*,
since the text answer still looked right. The selftest caught it. The re-parser
was deleted, not patched. Do not reintroduce one.

**Stress is derived, never stored.** `stressIndex()` recomputes from the rule and
the current syllable count, so stress moves correctly when affixation lengthens a
word. That is both real linguistics and the basis of the harder audio items and
of stress-conditioned allomorphy.

**Tier is measured from the trace, not declared by the template.** Bands are
absolute and were calibrated against the observed depth distribution across 300
languages at ten complexity levels: easy ≤2, medium 3–5, hard 6–7, extreme ≥8.
Measured means: **0.49 / 3.71 / 6.56 / 9.96**. Extreme layers ~10 simultaneous
rules against the 4–5 originally specified. The selftest asserts monotonicity, so
the bands cannot silently rot.

**`checkDeterminism` compares `composedSurface`, not `answer`.** Several item
types ask for something *derived* from the sentence (blank, stress notation, root
recall). An earlier version accepted a chain of loose substring fallbacks, which
would let genuinely broken items through. Pin the composed form exactly; the
answer's relationship to it is the builder's business.

**Distractors are wrong-rule re-compositions, not perturbed strings.** A randomly
mutated string is noise, and noise is eliminable by feel without knowing any
grammar — which would make the assist toggle a free pass. Only mutations whose
morphemes already exist in the language are safe (`SAFE_MUTATIONS`); switching
`caseMarking` to `particle` in a language with no particle would crash. A wrong
pick is therefore diagnostic and names the axis missed.

**`distractorKey(item)` exists because stress items are case-sensitive.**
`normalizeAnswer` folds case and strips hyphens, so all stress variants collapse
to one string and the option list dedupes itself to a single entry. Any code
comparing two options of the same item must use `distractorKey`, not
`normalizeAnswer`.

**Two-syllable words admit exactly two stress placements**, so a two-option list
there is exhaustive, not short-changed. `buildStress` picks the *longest*
available word to widen it where it can.

**An item type listed under an unreachable tier silently never generates.**
`rootRecall` was listed only under `hard`, but a single noun phrase tops out in
the medium band, so it never appeared once. The selftest now asserts every
expected type actually appears — this class of bug otherwise surfaces months
later as "the tests feel samey."

**`rng.js` is a deliberate local copy** of `src/pages/theknowledgebase/engine/rng.js`,
not an import. Importing across sub-app boundaries couples TKB's release cadence
to DLAB's; the repo convention is to duplicate tiny pure helpers (`uid()` lives
independently in every storage module).

**Assist options are built for hard/extreme items in EVERY mode, not just Exam
Sim.** `buildTest` originally attached `choices` only under `mc: true`, which
left the opt-in assist toggle with nothing to show — silently dead in exactly
the modes it exists for.

**Definiteness is never marked on a pictorial item, and mass nouns never take an
article in a prompt.** Both are prompt-side ambiguities, and no validator looks
at the prompt side. `checkHomophony` compares *surfaces*; if the picture cannot
distinguish "a tree" from "the tree", the two surfaces genuinely differ and the
check passes while the item is unanswerable. Same class of bug as a prompt
reading "A big water" — see `NO_ARTICLE` in `gloss.js`.

**`speechSynthesis` existing is not the same as a voice existing.** A browser
with the API and an empty voice list accepts `speak()` and never fires `onend`,
so the UI sits on "Playing…" until the watchdog gives up — on every question.
`useVoice` exposes `usable` (API present *and* a voice resolved) and the test
offers the written fallback immediately when it is false.

**Piper and Kokoro call signatures were verified against the packages' own docs,
not guessed.** `tts.predict({ text, voiceId })` → Blob;
`KokoroTTS.from_pretrained(MODEL_ID, { dtype, device })` then
`tts.generate(text, { voice })`. Both need an explicit default voice or they
throw, which would degrade every request to the browser voice and make the
provider picker a lie. Neither exposes prosody on synthesis, so rate is applied
at playback via `playbackRate` — which moves pitch with it, so for those two
loudness carries the stress. Web Speech is the only provider that can give all
three cues independently, which is why it is the default.

**Synthesize every segment before scheduling any of them.** Scheduling as each
buffer arrives lets segment 2's start time fall into the past while it was still
synthesizing, so Web Audio plays it immediately and it overlaps segment 1 —
worst on exactly the syllable-length segments a stress item is made of.

---

## Storage

`dlabStorage.js` (localStorage, always on) and `dlabFirestore.js` (signed in)
mirror one API. Selected per-call by `dlabContext.js` using MFT's
`makeBackend(user)` pattern.

Keys: `dlab_results_v1`, `dlab_settings_v1`, `dlab_recent_params_v1`.
Firestore: `users/{uid}/dlab_results/{id}`, `users/{uid}/dlab_meta/settings`,
`users/{uid}/dlab_meta/recentParams`.

`withSettingsDefaults` / `MAX_RESULTS` / `MAX_RECENT_PARAMS` live in
`dlabStorage.js` and are imported by the Firestore module — one source of truth.

⚠️ Known wart: `DlabFirestore.saveResult` does a full-collection read after every
write to enforce the 100-record cap. Bounded and free-tier fine; left as-is
deliberately. Revisit only if it feels slow.

---

## Voice — three providers, one adapter

`engine/voice.js` exposes `speak` / `speakSegments` / `stop` / `listVoices`.
Piper and Kokoro are **lazy `import()`** so they cost zero bytes unless selected.

| Provider | Package | Notes |
|---|---|---|
| **Web Speech** *(default)* | none | Built into Chrome/Edge; on Windows exposes Microsoft Natural neural voices. Zero deps, offline. Precedent: `src/pages/TimerTool/timerToolAudio.js`, `src/pages/lang/LangQuiz.jsx` |
| **Piper** | `@mintplex-labs/piper-tts-web` | VITS via ONNX/WASM, ~75 MB cached once, no WebGPU |
| **Kokoro-82M** | `kokoro-js` | Apache-2.0, transformers.js, WASM/WebGPU, best quality, heaviest |

Fallback chain: selected → Web Speech → on-screen text. Audio never hard-fails.

**Stress items need per-syllable prosody.** Web Speech ignores SSML emphasis
almost everywhere, so `stressedSegments()` emits one segment per syllable with
its own rate/pitch/volume and the voice layer plays them back to back. More
mechanical than one utterance, and the only way the item measures what it claims.

Audio is the majority of a default sitting, so the player needs capped per-item
replay (logged), rate control, inter-item pacing, and full keyboard operation so
you never have to look at the screen.

---

## Wiring — all five steps required

1. `src/App.jsx` — `<Route path="/DLAB/*" caseSensitive element={<DlabApp />} />`
2. `src/routeAliases.js` — add `'DLAB'` to `CANONICAL_SEGMENTS` (else `/dlab` 404s)
3. `src/siteLinks.js` — `{ to: '/DLAB', name: 'DLAB Trainer', desc: 'artificial-language aptitude drills', icon: '🗣️', bg: '#161003', accent: '#fbbf24', rgb: '251,191,36' }`
4. `src/components/Navbar.jsx` — add `'/DLAB'` to `OWN_TOPBAR_ROUTES`; the shell
   supplies `.dlab-site-home` as the only way back. **Both or neither.**
5. `package.json` — `kokoro-js`, `@mintplex-labs/piper-tts-web`

---

## Verification

1. `node src/pages/dlab/engine/engine.selftest.mjs` — primary gate.
2. `npm run build` clean; Piper/Kokoro in **separate lazy chunks**, not the main bundle.
3. `npm run dev` → `/DLAB`: generate DLAB-Weighted, read the brief, complete both
   pools, confirm each trace explanation matches its answer.
4. No audio item duplicates a written item's spec in the same sitting.
5. Five sittings back to back — parameter vectors visibly differ (word order,
   negation, stress rule).
6. A wrong answer, and a case/spacing variant of a right one — grading and the
   self-override behave.
7. Each voice provider; kill the network and confirm Web Speech still works and
   the chain degrades to on-screen text.
8. Exam Sim: distractors are wrong-rule forms, timer runs, scaled score maps
   sanely onto 95–164 / Cat I–IV.
9. `/dlab` redirects to `/DLAB`; card on Home and in the navbar dropdown; site
   navbar suppressed; `.dlab-site-home` returns to `/`.
10. Signed out → localStorage; signed in → Firestore; sync pill reflects mode.

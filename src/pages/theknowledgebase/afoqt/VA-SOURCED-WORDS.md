# Verbal Analogies — word/pair sources of truth

Built 2026-09-20 at Trey's request, right after the VA bank was rewritten (see
`engine/analogy.js`'s "VA IS NOT A VOCABULARY TEST" note for the full doctrine that rewrite is
built on). This file answers one question: **for every pair in the current VA bank, where did it
actually come from?** Three tiers, in order of authority:

| Tier | What it means | Can it ship verbatim? |
|---|---|---|
| **OFFICIAL** | A real OATTS item, `provenance.kind: 'real'` in `data/realQuestions.json`, AFRL 2025-4499, cleared for public release | Yes |
| **PRACTICE-SOURCED** | Appears in `ResearchPics/quizlet3.md` ("AFOQT Official Practice") or `quizlet8.md` ("AFOQT Practice") — real commercial/community practice items, not government-cleared | No — ruler, not corpus (see `QUESTION-DOCTRINE.md`'s copyright section) |
| **ENGINE-AUTHORED** | Written by an agent to instantiate a relation type that IS validated by the tiers above, using new, simple, uncopyrighted words | Yes (it's ours) |

Almost every individual PAIR in the bank is ENGINE-AUTHORED — the relation TYPES and the overall
shape of a question are what trace back to real sources, not the specific words, because Rule 1
(`QUESTION-DOCTRINE.md`) requires generating new instances, not copying real ones. Where a pair
is close enough to a real item to call out directly, it's flagged below.

---

## A. The 10 OFFICIAL OATTS items (`data/realQuestions.json`, full text)

These are the highest-authority source in the project — real test content, cleared for public
release. Every VA relation type in the current bank maps to at least one of these.

| id | Item | Relation it validates |
|---|---|---|
| `oatts-VA-070` | Venus is to Saturn as: **Plane is to Bus** (not Biology:Science / Sand:Beach / Violin:Instrument / Whisper:Shout) | **part-part** (two co-equal planets ↔ two co-equal vehicles) — `va-pp-mercury` (Mercury:Venus) is modeled directly on this |
| `oatts-VA-071` | Burn is to Blister as Bite is to: **Mark** (not Tooth / Chew / Growl / Food) | **cause-effect**, format 1. Note the wrong answers are ALL bite-domain words — this is the item that proves format 1 needs topic-clustered distractors, which is why format 1 is currently disabled bank-wide (see `engine/analogy.js`) |
| `oatts-VA-072` | Prototype is to Product as: **Blueprint is to Building** (not Text:Call / Blade:Windmill / Mechanic:Car / Branch:Root) | **sequence** (creation-sequence). `va-cs-blueprint` (Blueprint:Building) is this exact pair, word for word |
| `oatts-VA-073` | Shred is to Document as: **Fold is to Laundry** (not Eat:Plate / Sleep:Bed / Flavor:Seasoning / Protect:Helmet) | A verb-applied-to-its-typical-object relation — **not yet represented** in the bank as its own relation type (closest is action-object, which is verb-defines-a-ROLE, a different shape). Flagged as a possible future addition, not built |
| `oatts-VA-074` | Lemon is to Sour as: **Velvet is to Soft** (not Sky:Clear / Floor:Clean / Vegetable:Nutritious / Banana:Ripe) | **trait-defines** (an object characterized by an inherent quality) — same shape as `va-oa-fierce` (Fierce:Tiger) |
| `oatts-VA-075` | Zipper is to Backpack as: **Button is to Remote** (not Tape:Glue / Pencil:Paper / Tick:Mite / Geometry:Algebra) | **part-whole** — same shape as `va-pw-finger` (Finger:Hand) |
| `oatts-VA-076` | Natural is to Artificial as Obscure is to: **Obvious** | **antonym**, format 1 — see the flag below |
| `oatts-VA-077` | Flaw is to Imperfection as: **Rich is to Wealthy** (not Bruise:Injury / Input:Output / Trip:Fall / Length:Width) | **synonym**, format 2 — see the flag below |
| `oatts-VA-078` | Loud is to Deafening as Damp is to: **Soaking** (not Moist / Chilling / Dry / Dirty) | **degree** — same shape as `va-deg-warm` (Warm:Boiling). This is the item that keeps DEGREE in the bank |
| `oatts-VA-079` | Flute is to Instrument as: **Crow is to Bird** (not Vegetable:Celery / Pop:Rock / Oak:Spruce / Engine:Plane) | **member-category** — same shape as `va-mc-robin` (Robin:Bird) |

🔴 **Open finding, not yet acted on — flagging rather than deciding unilaterally.** Two of these
ten OFFICIAL items (`076`, `077`) are exactly the SYNONYM and ANTONYM relation types that were
just retired from the bank on the reasoning that they test vocabulary, not relationship logic.
Both real items use only dead-simple, everyday words (`natural/artificial/obscure/obvious`,
`flaw/imperfection/rich/wealthy`) — nothing like the SAT-tier vocabulary (`recalcitrant`,
`parsimonious`) that caused the original complaint. This suggests the real test doesn't ban these
relation types outright — it just never pairs them with hard vocabulary either. Whether that means
SYNONYM/ANTONYM should come back to the bank (with the same dead-simple-word ceiling as everything
else) is Trey's call, not something to reverse without asking after he was this explicit about
cutting them.

---

## B. PRACTICE-SOURCED items (`ResearchPics/quizlet3.md`, `quizlet8.md` — 75 items, not verbatim-shippable)

These are real AFOQT-practice items (one file labeled "Official Practice") that established the
relation-type catalogue and calibrated word difficulty, per `docs/afoqt/RESEARCH.md`'s "VA
SOURCING" section. Full analysis of all 75 (relation type + what makes each wrong answer wrong)
was done as part of this rewrite. A few pairs in the current bank are close enough to a specific
sourced item to call out (still rewritten in our own words per the copyright rule, never copied):

| Our pair | Sourced item it's modeled on |
|---|---|
| `va-oa-sycophant` (Sycophant:Flattery) | quizlet3.md #4: TYRANT:CRUELTY :: SYCOPHANT:FLATTERY — Trey's own approved calibration example |
| `va-oa-anarchist` (Anarchist:Disorder) | quizlet3.md #8: ANARCHIST:DISORDER :: PACIFIST:PEACE |
| `va-oa-cardiologist` (Cardiologist:Heart) | quizlet8.md #23: "Cardiologist is to heart as... neurologist is to brain" |
| `va-oa-surgeon` (Surgeon:Hospital) | quizlet8.md #39: "Mechanic is to garage as... surgeon is to hospital" |
| `va-oa-beautician` (Beautician:Salon) | quizlet8.md #9: "Beautician is to salon as... musician is to concert hall" |

Everything else in ch02/ch03/ch04/ch05 is ENGINE-AUTHORED: written to instantiate a relation type
the two tiers above validate (part-whole, member-category, part-part, sequence, cause-effect,
action-object, trait-defines, role-domain, degree), using new, simple, everyday words chosen to
meet the "sycophant rule" (`engine/analogy.js`) rather than reused from any source text.

---

## C. Full current bank, by chapter, with provenance

**O** = official-modeled (row directly above), **P** = practice-sourced pattern, **E** =
engine-authored (new words, real relation type). Only bands 2-3 exist; VA has no real difficulty
ladder (see doctrine note).

### ch02 — Part to whole, member to category, part to part, sequence
| Relation | Pairs | Provenance |
|---|---|---|
| part-whole | finger:hand, wheel:car, petal:flower, rung:ladder, yolk:egg, branch:tree, sleeve:shirt, heel:shoe, piston:engine, fuselage:aircraft, platoon:army, keel:ship, cartilage:joint, filament:lightbulb, blade:fan, strap:watch | E (relation type = **O**, `oatts-VA-075`) |
| member-category | trout:fish, oak:tree, robin:bird, ant:insect, sparrow:bird, pine:tree, shark:fish, beetle:insect, sonnet:poem, maple:hardwood, peninsula:landform, trapezoid:quadrilateral, dirge:song, daisy:flower, novel:book, chess:game | E (relation type = **O**, `oatts-VA-079`) |
| part-part | arm:leg, mercury:venus, trumpet:drum, liver:kidney, infantry:cavalry, starboard:port | E (relation type = **O**, `oatts-VA-070`; mercury:venus modeled directly on it) |
| sequence | caterpillar:butterfly, egg:chick, clay:pot, dough:bread, recruit:veteran, novice:expert, blueprint:building, sketch:painting | E, except **blueprint:building = O**, exact match to `oatts-VA-072` |

### ch03 — Cause to effect, and doer to action
| Relation | Pairs | Provenance |
|---|---|---|
| cause-effect | fire:smoke, rain:puddle, sun:sunburn, collision:dent, lightning:thunder, friction:heat, infection:fever, eruption:ash, oxidation:corrosion, erosion:sediment, negligence:liability, provocation:retaliation | E (relation type = **O**, `oatts-VA-071`) |
| action-object | bark:dog, meow:cat, teach:teacher, cook:chef, excavate:archaeologist, forecast:meteorologist, interrogate:detective, diagnose:physician, legislate:senator, officiate:referee, prosecute:attorney, adjudicate:magistrate, embalm:mortician, counterfeit:forger, filibuster:legislator, proselytize:missionary | E. No official item has this exact shape; closest is `oatts-VA-073` (verb:its typical object), a related but distinct pattern — see the flag in section A |

### ch04 — Degree
| Relation | Pairs | Provenance |
|---|---|---|
| degree | warm:boiling, annoyed:angry, drizzle:downpour, trickle:flood, concerned:alarmed, cold:freezing, tired:exhausted, hungry:starving, irritated:furious, peeved:fuming, tepid:scalding, argument:brawl, worried:terrified, sad:devastated, miffed:irate, nervous:panicked | E (relation type = **O**, `oatts-VA-078`) |

### ch05 — What defines it
| Relation | Pairs | Provenance |
|---|---|---|
| trait-defines | fierce:tiger, swift:falcon, brave:soldier, sly:fox, venomous:cobra, resilient:bamboo, tenacious:bulldog, vigilant:sentry, intrepid:explorer, sycophant:flattery, anarchist:disorder, zealot:fanaticism | E, except **sycophant:flattery** and **anarchist:disorder = P** (quizlet3.md #4, #8). Relation type also = **O**, `oatts-VA-074` |
| role-domain | pilot:cockpit, lifeguard:beach, farmer:field, librarian:library, surgeon:hospital, beautician:salon, journalist:newsroom, diplomat:embassy, curator:museum, cardiologist:heart, anesthesiologist:surgery, arbitrator:dispute, herpetologist:reptiles, lexicographer:dictionaries | E, except **surgeon:hospital, beautician:salon, cardiologist:heart = P** (quizlet8.md #39, #9, #23) |

---

## What this doc is NOT

It's a provenance audit, not a live inventory — for current row/template COUNTS, use
`subtestInventory('VA')` in `engine/inventory.js` per the "never state a content count from
memory" rule in this folder's `CLAUDE.md`. This file will go stale the next time the bank changes;
re-derive it rather than trusting an old copy if a lot of VA content shifts again.

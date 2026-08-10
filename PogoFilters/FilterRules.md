# Pokémon GO filter syntax — confirmed rules

**This file is the source of truth.** `src/pages/pogofilters/filterSyntax.js` implements it, not
the other way round. Successive agents kept re-deriving (and re-breaking) these rules and making
Trey re-test them in game; that stops here.

**If you are an agent working on this project: read this before writing any filter string, and do
not "correct" a filter based on an assumption that contradicts a confirmed rule below.**

When something new is confirmed in game, append it with the date. When something is only suspected,
put it under "Unverified" — never promote it without a real in-game test.

---

## Confirmed — tested in game

### 1. Spaces inside an operator break it
`!cp 2750-` matches nothing. `!cp2750-` works.

Applies to every numeric operator: `cp`, `hp`, `age`, `year`, `distance`, `attack`, `defense`,
`stamina`. Confirmed 2026-07-16. Three saved filters were corrected in `Existingfilters.md` at the
time; they still need re-saving in the game itself, since the doc and the live saved search are
different things.

Linted as **error** — rule `operator-spacing`.

### 2. Matching is case-sensitive
Caps matter. `!Evolveme`, `!evolveme` and `!EvolveMe` are not interchangeable.

Consequence for the app: it compares *loosely* (case- and space-insensitively) in order to **detect**
a mismatch and flag it, but it always **writes** the exact canonical casing from the label registry.

Linted as **warning** — rule `label-near-miss`.

### 3. `xxl` and `xxs` are built-in game keywords, and `xxl` only ever means XXL
Any casing of `xxl` (`XXL`, `xXl`, …) captures **only** XXL Pokémon. It does not include XXS.

Trey's label covers both XXL and XXS, so it was renamed to **`xxlandxxs`** to stop it colliding
with the built-in keyword. **This rename is the reference example for rule 4.**

Any filter still using bare `!xxl` where the *label* was meant is not doing what it looks like.

### 4. A label must never be named after a built-in game keyword
Where a label name collides with a search keyword, the game's meaning always wins and the label
becomes unreachable by that name. The fix is to rename the label — see `xxlandxxs` above.

The app **blocks** saving a label whose name equals a game keyword, and lints existing collisions.

Reserved (non-exhaustive): `shiny`, `legendary`, `mythical`, `ultra beast(s)`, `shadow`,
`purified`, `lucky`, `mega`, `costume`, `baby`, `evolve`, `favorite`, `item`, `traded`, `defender`,
`hatched`, `raid`, `research`, `remote`, `dynamax`, `gigantamax`, `xxs`, `xxl`, plus all 18 type
names.

### 5. Long strings are fine — length is never a constraint
A 236-species / 913-character dex-number list (`band1_test_string.txt`) was pasted into the game and
worked. **Nothing in this project should ever be optimised for brevity**, and no agent should
propose shortening a filter "so it fits".

The app shows a character count as information only.

### 6. Reversed year ranges are intentional
`year2020-2015` in the Luckies filter is deliberate, not a typo. Filters meant for mass deletion use
that reversed convention on purpose. Do not "fix" it.

---

### 7. The vocabulary lives in `searchTerms.json`, not in code

`src/pages/pogofilters/data/searchTerms.json` is the machine-readable term list the linter
validates against. It carries a `confidence` on every entry (`confirmed` = two or more independent
sources agree, `single-source`, `disputed`, `in-use`) plus the URLs it came from.

**Add newly-discovered terms there, never as a hardcoded list in code.** The original hardcoded set
was derived from `pokemon_go_search_filters.md`, whose own header admits it came from a chatbot and
was never verified — it was missing `mega0`–`mega3`, `buddy0`–`buddy5`, `evolvenew`, `tradeevolve`,
`fusion`, `xs`/`xl`, every region name and the entire tag syntax, so the linter confidently flagged
real working terms as unknown.

**`in-use` beats a cheat sheet.** `ultra beasts` appears in no published list, but it is in live
filters that have been working for a long time. Real usage outranks third-party documentation, so
it is accepted rather than flagged.

### 8. Things the 2026-08-10 research settled

- **Mega levels are real:** `mega0` (can mega, never has), `mega1` (Base), `mega2` (High),
  `mega3` (Max), and the range form `mega1-3`. Also `megaevolve`.
- **Tags are searched with `#`** — `#battle`, `!#Mega`, bare `#` for any tagged, `!#` for untagged.
- **IV stats are number-first**: `15attack`, `0defense`, `12-15hp`. **There is no `stamina` term** —
  stamina IV is searched as `hp`. The old config had these backwards, as prefix operators.
- **Four size terms**, not two: `xxs`, `xs`, `xl`, `xxl`.
- **Regions are searchable**: kanto, johto, hoenn, sinnoh, unova, kalos, alola, galar, hisui, paldea.
- **Buddy levels**: `buddy0`–`buddy5`.
- More evolution terms than known: `evolvenew`, `tradeevolve`, `item`, `evolvequest`.
- **`+name`** searches a whole evolution family.

### 9. The open question that matters most

**Does a bare tag name match a tag, or does it need the `#` prefix?**

No source documents this either way. It matters enormously: nearly every filter in
`Existingfilters.md` refers to labels by bare name (`!Pvp`, `!Evolveme`, `!TTA`), while the
`Megas unlabled` filter uses the prefixed form `!#Mega`. If the prefix is required, those bare
terms have been matching nothing — though filters that have been in service this long would
probably have shown it.

Most likely a bare word matches species names *and* tag names, with `#` forcing tag-only. **Not
confirmed. Test in game before acting on it.**

---

## Operators

| Form | Meaning |
|---|---|
| `&` | AND |
| `,` | OR |
| `!` | NOT (prefix on the term) |
| `( )` | grouping — real filters use it, e.g. `(063,064,066)&3*&!4*` |
| `0*`–`4*` | appraisal rating |
| `cp#` / `cp-#` / `cp#-#` / `cp#-` | exact / up to / range / at-least |
| `hp`, `attack`, `defense`, `stamina` | same numeric forms |
| `age#` / `age-#` / `age#-#` / `age#-` | days since caught |
| `year####` | caught in that year |
| `distance#` and forms | km from catch location |
| `@move`, `@1move`, `@2move`, `@3move`, `@special` | moves |
| `#123` or bare `063` | dex number |

`!3*&!4*` and `0*,1*,2*` are **logically identical**. Trey's preferred form is the exclusive one —
"filter the good ones out". Linted as **info** with a one-click rewrite.

---

## Unverified — do not rely on these

- Whether a space inside a *label* name (`!Evolve me` against the label `EvolveMe`) fails the same
  way a space inside an operator does. Highly likely given rule 2, but not yet tested in game.
  `Existingfilters.md` lines 38 and 61 both still contain the spaced form.
- Whether there is any upper bound on filter length at all. Nothing was hit at 913 characters.
- Whether `!mega` reliably means "not mega-capable" in every game version. Trey has rejected an
  earlier agent's reading of his own filters here, so **do not re-raise this without a real test.**

---

## For agents: things that have gone wrong before

1. **Assuming a rule instead of reading this file**, then "correcting" a working filter into a
   broken one.
2. **Proposing shorter strings.** Length has never been a problem. See rule 5.
3. **Reasoning about intent from filter contents** and telling Trey his filters mean something he
   didn't intend. If a filter looks inconsistent, report it as an observation and let him decide;
   do not rewrite it.
4. **Editing the doc and assuming the game changed too.** `Existingfilters.md` and the live saved
   searches in the app are different things. A correction here is not live until Trey re-saves it
   in game.

---

*Last updated 2026-08-10. Append new confirmations with a date; never delete a confirmed rule.*

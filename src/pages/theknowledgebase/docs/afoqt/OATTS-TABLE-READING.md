# OATTS Table Reading — the real grid

Transcribed 2026-09-01 from a screenshot of the official OATTS Table Reading block that Trey
supplied. **The image itself was pasted into a chat and never landed on disk**, so this file is
the only record — if the layout is ever questioned again, ask him to re-drop the screenshot into
`G:\My Drive\ResearchPics\OATTS_Screenshots\` rather than assuming these notes are complete.

This is a **current OATTS** artifact, which outranks the Form S-era AFPC pamphlet for anything
the two disagree on.

---

## Layout — axis labels on ALL FOUR SIDES

This is the single most important difference from what we render, and it is the fix for "the
x / y is not clearly labeled":

```
                              X
       -17 -16 -15 ...  0  ... +15 +16 +17
   +17 [ 76  35  67  ...              ... ]  +17
   +16 [ 23  66  91  ...              ... ]  +16
 Y  ...                                       ...  Y
   -16 [ ...                          ... ]  -16
   -17 [ ...                          ... ]  -17
       -17 -16 -15 ...  0  ... +15 +16 +17
                              X
```

- **X values run along the TOP and are repeated along the BOTTOM.** A bold `X` is centred above
  the table and again below it.
- **Y values run down the LEFT and are repeated down the RIGHT.** A bold `Y` sits centred to the
  left and again to the right.
- That four-sided repetition is what makes a row trackable without a straight edge, which the
  directions forbid. Labelling only the top-left corner (what we do) is strictly harder than the
  real subtest, and harder in a way that trains nothing.

## Range and values

| Property | Real OATTS | What we render (`engine/table.js`) |
|---|---|---|
| X range | **−17 … +17** (35 columns) | −16 … +16 (33) |
| Y range | **+17 … −17** (35 rows, descending) | +15 … −17 (33, descending) |
| Cell values | **two digits, `00`–`99`** | three digits, zero-padded |
| Gridlines | none — plain aligned numbers, generous tracking | every cell boxed with a border |
| Colour | none. Black on white | tinted header row/column, `--tkb-ink-soft` |

Y descending is confirmed — that much we already had right.

## ✅ RESOLVED — the field stays gradual. Do not re-open this.

**Decided by Trey, 2026-09-01, after seeing the conflict below.** His reasoning, and it is right:

> "The table uniform or random doesn't really matter. Those don't genuinely affect the answer you
> would be getting anyway. What's important is putting in the distractors to offer answers near
> the x,y in case you misread a column/row and think that the distractor is correct."

That is exactly how `errorCells()` in `engine/table.js` already works — every wrong option is the
value at a specific misread cell (`row-slip` y±1, `column-slip` x±1, `y-ascending` mirrored Y,
`axes-swapped` (y,x), `sign-blind` −x/−y), each carrying the sentence naming the mistake. The
skill being trained is scan accuracy, and a misread lands you on a named wrong option either way.
The distribution of the underlying numbers does not change that.

**One technical reason to prefer gradual, beyond "it is what we already have":** the band-4
template (`templates/tr/`, the hardest item in the subtest) uses `tightChoices`, which is the four
slip-by-one neighbours ONLY. On a gradual field those five options land within a point or two of
each other — `088 089 090 091 092` — and a slipped row is genuinely unfeelable, which is the whole
point of that item. On a random field the same five options would be arbitrary numbers and the
item would collapse into an easy one. So going random would cost a real template its difficulty
and buy nothing.

Everything below is kept as the evidence trail, not as an open question.

## The field in the OATTS block looks RANDOM, not gradual

`CLAUDE.md` currently states, with the AFPC pamphlet as its citation:

> **The Table Reading field is GRADUAL: every step right and DOWN adds exactly 1 or 2.**

The OATTS screenshot does not behave that way. Row `+17` reads:

```
76 35 67 09 83 60 38 17 90 41 22 44 26 70 03 14 57 18 48 92 86 11 39 20 34 73 62 80 49 66 58 75 04 28 76
```

Consecutive steps of −41, +32, −58, +74 … that is a uniform-random field, not a ±1/±2 ramp.

Two official sources genuinely disagree:

- the AFPC pamphlet sample (Form S era) — gradual, transcribed in `engine/table.js`
- this OATTS block (current) — random

Settled above: we keep gradual. Recording the disagreement so that the next person to see this
screenshot does not "discover" it a third time and rebuild the generator — which has already
happened once in this project, in the other direction.

## Structural quirk worth noting

The grid **repeats with a period of 30 rows**: row `+17` and row `−13` are identical, as are `+16`
and `−14`. The first and last column of a row also match (`76 … 76`, `23 … 23`). Whether that is
an artifact of how OATTS built its sample block or a property of the real form is unknown, and it
is not something to reproduce without knowing which.

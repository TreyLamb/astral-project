# Ultimate Planning Sheet -> Web Tool

Status: tabled 2026-08-03, not started. This file is context for whichever
agent/session picks it up next.

## Source file

`C:\Users\Trey\Dropbox\db_Projects\Ultimate Planning Sheet\Ultimate Planning Sheet2.xlsx`

19 sheets total, but only some are "active" (see Scope below). Load it with
`openpyxl` (`pip install openpyxl`) to inspect formulas — `data_only=False` to
see formula text, not cached values. Expect UserWarnings about an unsupported
data-validation extension and a dropped WMF image; both are harmless.

## What was decided last session

- **Fidelity target: functional parity with a redesigned UI**, not a visual
  spreadsheet-grid replica. Rebuild each active sheet as normal web
  forms/tables/cards, not literal cells.
- **Scope: active tools only**, not all 19 sheets. Skip junk-drawer sheets
  (Movies-books, Bucket List, Emails, School, "lists", Sheet1, Homework, Yard,
  List, Baxic Plan) unless the user asks for them later.

### Sheets in scope

| Sheet(s) | Becomes | Notes |
|---|---|---|
| `Meals.bmr` + `#Calcs` | BMR/macro calculator | The hard part — see Known Issues below. Harris-Benedict + Sterling-Pasmore BMR, then protein/fat/carb split across several overlapping "diet type" variants (Normal / High Protein base / High Protein adjusted). |
| `Number Tables` | Exercise-calorie lookup + weight-loss timeline | Easy. ~130 activities x 4 body-weight columns (130/155/180/205 lbs) -> becomes a static JSON table with interpolation by weight. Separate small table converts weekly lbs lost <-> daily calorie deficit (`deficit = lbs/week * 3500 / 7`). |
| `True Meal Plans` | Meal-splitting calculator | Medium. Nested IF chains split daily calories across N meals by fixed percentages depending on meal count (2-10 meals). |
| `Workout` | Weekly workout log | Easy, mostly a data-entry table with a few SUMs. |
| `Budget` | Budget tracker | Easy, just SUM/derived columns. |

### Not in scope (for now)

MAIN, Homework, Yard, List, Bucket List, Movies-books, Sheet1, School,
"lists", Emails, Study, Baxic Plan.

## Known issues in the source spreadsheet (found by reading it directly)

These are pre-existing problems in the workbook, not something to blindly
replicate. Whoever builds this needs to ask the user what the *intended*
behavior is rather than porting the formula as-is:

- `#Calcs!R25` = `=SUM(#REF!,I19,E22,I25)` — references a deleted cell,
  currently broken in Excel too.
- Several cells contain the user's own TODO notes as literal cell values
  (not comments), e.g.:
  - `#Calcs!I12`: "Fix circular formulas between MACROS and High Protein Diet"
  - `#Calcs!F10`: "REWRITE HIGH PROTEIN DIET TABLE AND THEN HAVE A DROP DOWN
    BAR TO LINK IT TO HERE"
  - `#Calcs!U12`: "Set Fiber g/day to be a ratio of protein intake..."
  - `#Calcs!O15`: "write formula for Goal weight in X weeks so #'s will calc
    themselves"
- The macro engine has three near-duplicate parallel calculators (columns
  M-P, Q-V, Y-AD, AG-AL in `#Calcs`) for "Normal Diet", "High Protein Diet
  (base)", and "High Protein Diet (adjusted for exercise)" that overlap
  confusingly — worth asking the user which one(s) are still wanted before
  porting all three.
- Heavy use of `INDEX/MATCH` against named ranges (`Carbsbyfat`, `HIIT`,
  `Swim`, `Cycle`, `cardiostuff`, `Weighttime`, etc.) defined in `#Calcs` /
  `Meals.bmr` / `Number Tables` — these are the actual lookup tables and
  should become plain JS/JSON data + functions, not literal formula ports.

## Formula complexity (for scoping effort)

623 formulas total across the whole workbook, all plain functions — `SUM`,
`IF`, `VLOOKUP`, `HLOOKUP`, `INDEX/MATCH`, `MEDIAN`, `ROUND`. No array
formulas, no VBA/macros (file is `.xlsx` not `.xlsm`), no charts, one data
validation dropdown, essentially no conditional formatting. The conversion
difficulty is in untangling *intent* (see Known Issues), not in translating
formula syntax.

## Suggested approach

This repo (`astral-project`, real path `C:\Projects\astral-project`) is a
React + Vite SPA where every mini-tool lives in its own folder under
`src/pages/<tool-name>/` (see `fitnesstracker`, `pgotracker`, `qa-tracker`,
`timer-tool`, etc.) and gets wired into `src/App.jsx` as a route, e.g.:

```jsx
import FitnessTrackerApp from './pages/fitnesstracker/FitnessTrackerApp';
...
<Route path="/fitness-tracker/*" element={<FitnessTrackerApp />} />
```

This planning-tool folder (`src/pages/planning-tool/`) should follow that
same convention once built — own component(s), own route (e.g.
`/planning-tool` or `/*` if it needs sub-routes), added to `App.jsx` per the
comment at the top of that file. `localStorage` for persistence, no backend
needed. The real work is nailing down the BMR/macro logic with the user, not
the framework — consider prototyping that piece in isolation before wiring
it into a route.

Note: there is also a stale/out-of-sync clone of this same repo (same
GitHub remote, `TreyLamb/astral-project`) at
`C:\Users\Trey\TempCode\astral-project` — don't confuse the two. This file
belongs only in `C:\Projects\astral-project`.

Recommended build order (from prior conversation): easy wins first (exercise
lookup, meal split, workout log, budget), save the BMR/macro engine for last
since it requires the most back-and-forth with the user about which of the
overlapping calculators/TODOs to keep, fix, or drop.

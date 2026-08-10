# Design decision — chosen 2026-08-10

Trey reviewed the five mockups and picked a hybrid. This is the binding spec for
the species matrix; the mockups are now reference only.

## Chosen

**Design A's CSS and dense table as the base**, with:

1. **Design C's top bar / search bar** — the filter row: text search, type
   dropdown, status dropdown, L25 CP min/max, "Select all matching", "Clear".
2. **Design C's editing side panel.** Clicking a species row opens the side
   panel *for that species*. **Up/down arrow moves the selection to the row
   above/below and the panel follows**, across the whole screen.
3. **Multi-select in the spreadsheet** — shift+click for ranges, ctrl/cmd+click
   to toggle. Selections are made within columns.

## Corrections to the mockups

| # | Change | Detail |
|---|---|---|
| 1 | **Checkbox meaning is inverted from the mockups** | The far-left checkbox means *"do I ever want this Pokémon saved at all?"* — **checked ON by default for every species**. Unchecking removes it from the list entirely. |
| 2 | **"Show unchecked" toggle** in the top bar | The only way to see unchecked species again. The list therefore only ever shows species worth keeping. |
| 3 | **Unchecked species never appear in any filter** | They are never saved, so the apply engine must never write `!name` protection for them — and must remove it if it previously did. |
| 4 | **Sprites ~10% bigger** than Design A | 22px → 24px. |
| 5 | **CP tier header does not list the CP values** | Just "CP tier". The buttons carry the numbers. |
| 6 | **Stars and Labels columns move left, more central** | Labels get very full for some species and needs a lot of room. |

## Queue workflow (Design D) — separate one-time tool

Trey's note: *"It's not at ALL like what was supposed to be designed. but it's a
tool i would use one time until everything is assigned."*

So the queues are **not** part of the matrix page. Build them as a **separate,
one-time assignment wizard** whose only job is to get every species assigned
once. After that it stops being useful and the matrix is the daily surface.

## What this changes in the data model

`species.tracked` now defaults to **true**, not false — every species starts
"yes I might want this", and unchecking is the deliberate act. See
`withSpeciesDefaults` in `pogofiltersConfig.js`.

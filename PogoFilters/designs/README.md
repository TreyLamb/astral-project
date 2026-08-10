# Species CP Matrix — five page designs

Five Haiku agents each designed the species-matrix page independently, given the same brief and a
different assigned angle. **Open the `.html` files in a browser — they are live, clickable mockups,
not pictures.** Click tier buttons, scroll to watch the frozen headers, resize the window.

> ✂️ **Deviation from the plan:** the plan listed five separate `.md` spec files alongside the
> mockups. I folded those into this one README instead — the CSS, palettes and row components the
> agents produced are already *real working code* inside each `.html`, so separate markdown copies
> would have been duplicated, drift-prone noise. Everything decision-relevant is below.

## The files

| File | Angle | Open it to judge |
|---|---|---|
| `A-dense-spreadsheet.html` | Maximum density | How much you can see at once, keyboard speed |
| `B-sprite-forward.html` | Recognition | Whether big artwork helps you decide faster |
| `C-two-pane-bulk.html` | Bulk editing | Assigning 40 species in one action |
| `D-queue-workflow.html` | Finishability | Whether queues make 900 feel achievable |
| `E-pokedex-console.html` | Theme | Pure look — the console/glass treatment |
| `_sample-data.js` | — | Shared data. Real CP values from `cp_table.csv`. |

Sample data is **35 real species with real CP numbers** (Magikarp 88/147/192, Tyranitar
1538/2564/3334, and so on), repeated to a few hundred rows so scrolling and header-freezing can be
judged honestly. Sprites load from the same PokeAPI mirror MedalDex already uses, so an offline
machine will show blanks — that's the mockup, not the design.

---

## What every design does the same

These came from your brief and are not up for selection — whichever design wins, it has these:

- **Frozen headers.** Column headers stay pinned as you scroll, like Excel or Google Sheets.
- **Two visually distinct sections on one row.** The CP-by-level numbers (L15 / L25 / L35) are
  *passive reference* — shaded band, muted text, bordered off. The five tier buttons are the
  *active control* — bright, tactile, strongly lit when engaged. Same row, obviously different
  jobs, exactly as you asked.
- **Manual tier selection.** The tool never guesses or rounds. The CP numbers inform your call;
  they never make it.
- **"Needs custom" auto-flag.** Any species whose L35 CP is below the lowest preset (Magikarp at
  192, Shuckle at 268, Caterpie at 328) is flagged automatically, because every preset is
  meaningless for it. You can find them all at once instead of one at a time.
- **Free numeric entry alongside the presets**, never instead of them.

---

## The five, and what each is actually trading

### A — Dense spreadsheet
28px rows, roughly **35 visible** on a 1080p screen. Two-row frozen header. Alternating row bands,
tight grid lines, gold accent. Full keyboard drive: arrows move the cursor, `1`–`5` set a tier, `0`
clears, space toggles tracked.

**Buys:** the most decisions per minute once you have rhythm, and the least scrolling.
**Costs:** small sprites, so you're reading names rather than recognising creatures.
**This is closest to what you described.**

### B — Sprite-forward
88px rows, 68px official artwork, a type-coloured stripe down each row's left edge. About **9 rows
visible**.

**Buys:** you recognise the Pokémon instantly instead of parsing a name — real when you don't know
900 by sight, and it lowers misclick rate.
**Costs:** a quarter of A's density. Grinding 900 rows means a lot of scrolling.

### C — Two-pane bulk editor
Left: filterable, multi-selectable species list. Right: one panel that edits tier, stars and labels
for the **entire selection at once**, showing `Mixed` where the selection disagrees. Shift-click for
ranges, ctrl-click to toggle, "Select all matching" for the current filter.

**Buys:** by far the fastest path through the long tail — filter to "L25 CP under 800, unassigned",
select all 200, assign one tier, done.
**Costs:** it isn't the single long page you pictured, and bulk edits need care.
**Try it:** click Bulbasaur, then shift-click Machamp.

### D — Queue workflow
Same data as finishable queues with live counters — *Needs custom CP*, *Unassigned · high ceiling*,
*Unassigned · the rest*, *Assigned* — plus an overall progress bar and a one-species-at-a-time
"Quick decide" mode with big keyboard-driven tier buttons.

**Buys:** it's built around actually reaching 100%. High-leverage species are ordered first, so
early effort pays off most.
**Costs:** more clicks to reach any given species; you're navigating structure rather than scanning.

### E — Pokédex console
"Cardinal Glass" — crimson device shell, amethyst screen, amber readout, CRT scanlines, tier
buttons as illuminated console keys. Deliberately distinct from MedalDex (gold/emerald) and POGO
Accs (cyan/violet/pink) while using the same glass-panel construction, so it reads as a sibling
rather than a reskin.

**Buys:** by far the most characterful, and it makes this feel like part of the family.
**Costs:** ~36px rows, so somewhat less dense than A.
**Note:** E is really a *theme*. It can be applied to any of A–D.

---

## Recommendation

**A as the structure, plus C's bulk select, plus D's filter chips, plus E's theme.**

They aren't mutually exclusive, and each solves something the others don't:

- **A** is what you described and is the right default surface — one long page, frozen headers,
  dense rows, keyboard-driven.
- **C's shift-click multi-select** is the single biggest time saver. Without it, 900 species is 900
  individual decisions. With it, "every species under 800 L25 CP" is one action. This is worth more
  than any other feature on the page.
- **D's queue chips** collapse into a filter bar across the top of A — *All / Unassigned / Assigned
  / Needs custom / Tracked* — which gets D's "grind a finishable pile to zero" benefit without
  giving up the single-page layout.
- **E's theme** is orthogonal, and it makes the app look like it belongs next to MedalDex.
- **B** becomes a row-density toggle (compact / comfortable) rather than a separate design, so you
  get the big sprites on the passes where recognition matters.

Design A's mockup already shows the filter chips and the section split; C's shows the multi-select
interaction. Between those two files you can see essentially all of the recommendation.

---

## To choose

Say **"go with A"** (or B/C/D/E, or the hybrid above, or any mix — "A's layout with E's theme but
no keyboard shortcuts" is a perfectly good answer). The **data model doesn't change** either way,
so this choice only affects the matrix view. Nothing else in the build depends on it, and Phases
1–3 (scaffold, filters view, linter) are identical under every option — which is why I'm continuing
into those now rather than waiting.

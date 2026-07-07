# "Sweep For This Bug Class" Prompt Template

Use this immediately after fixing a bug, when you want proof it doesn't exist
anywhere else — not just a quick look around.

---

## FILL IN BEFORE SENDING
- `{{BUG_SUMMARY}}` = one sentence describing the bug you just fixed
- `{{FIX_LOCATION}}` = file(s)/data you just changed

---

# TASK

We just fixed: **{{BUG_SUMMARY}}**
Fix applied in: **{{FIX_LOCATION}}**

Before doing anything else, treat this as ONE INSTANCE of a bug CLASS. Find
every other instance of that class in the entire project — not just nearby
maps, not just places that "seem similar." Follow the phases below in order.

## PHASE 1 — Classify the bug (required before searching)

State explicitly which category this bug is, because the search method is
different for each:

- **(A) Data-classification bug** — some data value is mis-tagged relative to
  how the consuming code treats it (e.g. a tile ID absent from a passable
  list when it should count as walkable; an item mapped to the wrong map;
  an NPC assigned the wrong sprite/facing).
- **(B) Stale-convention code bug** — code left over from a prior
  architecture/refactor that's now wrong in this context (e.g. a leftover
  `× 2` from the old raw-tile coordinate system after the metatile-unit
  refactor; an offset that assumed 2-step movement).
- **(C) Missing-wiring bug** — real OG data exists and is even extracted, but
  nothing in the JS actually consumes it for some subset of maps/entities
  (e.g. clerk NPCs falling through to placeholder text because no mart logic
  existed at all).
- **(D) Logic/edge-case bug** — the code path is fundamentally right but
  mishandles a specific input shape (e.g. multi-clerk maps, a direction the
  general case didn't anticipate).

If it's more than one category at once, say so and handle each separately —
they need different sweeps.

## PHASE 2 — Write the exact, mechanical signature

Do not proceed on vibes. Write down the precise, checkable rule that makes
something "an instance of this bug," in the form of: "a location/entity/tile
is affected if and only if X." Prefer something you could hand to a script.

**Worked example (the tile-80 Viridian Forest gate bug we just fixed):**
> Signature: a tile ID is a false-positive obstacle if (1) it is absent from
> its tileset's `collision[tileset]` passable list, AND (2) across every
> `.blk` file using that tileset, it appears in a total of ≤2 distinct block
> definitions, AND (3) within each of those blocks it occupies a minority of
> the 16 sub-tile positions (i.e. it's a decorative speck, not the dominant
> terrain), AND (4) the majority tile in that same block IS in the passable
> list. This is checkable purely from `.bst`/`.blk`/`game_data.json` — no
> gameplay judgment needed for the first pass; OG-source cross-check
> (Phase 3) resolves ambiguous hits.

For a stale-convention code bug (category B), the signature is usually a
literal grep target: e.g. "any arithmetic on a coordinate that multiplies or
divides by 2, outside the two call sites already confirmed correct
(`isValidLedge`/`isHalfStepBlocked`'s intentional raw-tile conversion)."

For a missing-wiring bug (category C), the signature is usually: "an entity
type (sprite name / event type / map category) that has real extracted OG
data in `extracted_og_data/*.json` but zero references to that data anywhere
in the `.jsx` files."

## PHASE 3 — Run the sweep exhaustively, not spot-check

- For a data-classification bug: write and run an actual script (Python/JS)
  over ALL relevant files (every tileset, every `.blk`, every map in
  `game_data.json`) that outputs every match. Do not manually eyeball a
  handful of maps and extrapolate.
- For a stale-convention code bug: `grep -rn` the exact pattern across the
  whole codebase (not just the file you already fixed), and list every hit
  with surrounding context.
- For a missing-wiring bug: grep every `.jsx` file for references to the
  relevant sprite name / event type / JSON key, and cross-reference against
  every entry that exists in the extracted OG data for that category. Report
  the count on both sides (e.g. "14 sprites of type X exist in game_data.json
  across N maps; only 3 have a corresponding NPC_TEXT/handler entry").
- Show the raw output of whatever you ran. A prose claim ("I checked and it's
  fine elsewhere") without the actual scan output is not acceptable here.

## PHASE 4 — Triage every hit

For each hit from Phase 3, classify it:
- **True positive** — genuinely the same bug, needs the same fix.
- **False positive, safe** — matches the mechanical signature but is
  confirmed correct behavior (explain why, ideally cross-checked against the
  matching OG source file).
- **Unclear** — flag explicitly rather than guessing; state what additional
  info would resolve it (and ask me if it requires a judgment call you can't
  make from source alone, e.g. something only visible by playtesting).

Produce a table:

| Location | Match signature? | Triage | OG source checked? | Fix needed? |
|---|---|---|---|---|

## PHASE 5 — Apply the fix consistently

- Apply the SAME fix pattern to every true positive — don't hand-tune each
  one differently unless the underlying cause genuinely differs (if it does,
  that's actually a sign you mis-scoped the bug class in Phase 1-2; consider
  whether to split it into two classes).
- If the fix touches a function/table used elsewhere (see the shared-function
  rule from the "fully wire" prompt), grep and list every call site affected
  by widening the fix, and confirm none of them regress.

## PHASE 6 — Prove the fix is complete AND safe

- Re-run the exact same Phase 3 scan after the fix. Show that the true-positive
  count is now zero (or explain any remaining ones and why they're
  intentionally excluded).
- Run a basic sanity check that the fix didn't newly break anything it
  shouldn't have touched — e.g. if you loosened a passable-tile list, confirm
  the tile still isn't used anywhere as a genuine obstacle (same audit style
  as the tile-3/tile-80 precedent: total usage count, walkable-neighbor
  check).

## PHASE 7 — Document the precedent

This project's CLAUDE.md exists specifically to stop the same bug class from
being "discovered" fresh in every session. Add (or extend) an entry there:
- What the bug class looked like
- The exact mechanical signature you used to find it
- Where it was found (list of locations, not just "several places")
- The fix applied and why it's safe
- What to check first if a similar report comes in again

Then update `POKERED_CHECKLIST.md` per the normal checklist-sync workflow.

## PHASE 8 — Final report to me

- Total instances found (including the original).
- Table from Phase 4/6.
- The new/updated CLAUDE.md entry, so I can see it's actually written down.
- Anything marked "Unclear" that needs my judgment call.

---

## How to use this

- Send this right after any bug fix where you suspect (or I say) "this is
  probably elsewhere too" — don't wait until the end of a session to batch
  these up, the signature is freshest right after the fix.
- If Phase 1-2 comes back vague ("I'll just check similar-looking spots"),
  push back before letting it proceed to Phase 3 — a fuzzy signature means an
  incomplete sweep no matter how many files get opened.
- Keep the CLAUDE.md entries from Phase 7 — they compound. Each one closes
  off a whole bug class from ever being "rediscovered" from scratch, which is
  the entire point of the file existing.

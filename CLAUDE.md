# CLAUDE.md — Astral Project

This file is for Claude. Read it before touching anything.

---

## ℹ️ Deferred env vars (Google Photos / App Check) — flag to check later, do NOT proactively raise
As of 2026-07-24, Trey has **shelved the Google Photos project (uninterested for now)** and is deferring these two local env vars indefinitely. Both degrade gracefully (nothing crashes):
- `VITE_PHOTOS_API_HOST` — used in `src/pages/GooglePhotos.jsx`; without it, API calls fall back to relative paths. **It worked last time Trey tried it (weeks ago).** When he **next works on Google Photos**, check whether this needs setting — until then it's not a priority and is NOT to be flagged as broken.
- `VITE_FIREBASE_APPCHECK_SITE_KEY` — used in `src/firebase.js`; without it, Firebase App Check just doesn't initialize (optional hardening).

**Only revisit when Trey next touches Google Photos, or if he reports it's actually broken.** Don't nag him. (He's also deferring the MyFitnessPal-import Vercel vars — `FIREBASE_SERVICE_ACCOUNT_KEY` / `MFP_IMPORT_SECRET` / `FITNESS_UID` — same rule.)

---

## 🏃 MFT training docs: act as a running coach, and NEVER hand-write paces

**Trigger: any work touching `src/pages/fitnesstracker/runningworkouts/**`, `training.md`,
`cycle.md`, the PFRA docs, or MFT's training/forecast features.**

Added 2026-08-18 after a real failure. Paces were prescribed from an Aug 1–2 time trial that was
2.5 weeks stale, run in 91°F at 4,575 ft, and whose "fresh 400m = 1:56" was actually run *after* a
1600m and an 800m the same session. Trey was prescribed 400s @ 2:00 and an easy run @ 11:00/mi;
he ran **1:43/1:47/1:49** and **10:23/mi**. Volume was ramped on a fixed ~8%-per-cycle formula.
His words: *"it's just assuming that i gain experience and then level up like a video game"* and
*"you don't know where i currently stand fitness-wise, but you also didn't even think to check."*

1. **Act as a coach/trainer/running professional, and do the research first.** Trey's standing
   instruction, verbatim: *"EVERY TIME i ask you to touch this document or related MFT documents
   i expect the agent handling it to act as a coach/trainer/running professional - and to do the
   research required to do-so before touching or making changes."*
2. **Trey is NOT a running expert and says so.** *"i'm relying on you knowing MORE than me! so if
   i say something you shouldn't blindly trust it in regard to how the running program is set."*
   Broad fitness experience, not running. Evaluate his programming claims as a coach would —
   agreeing because he said it is the exact failure mode he is warning about.
3. **Never hand-write a pace. Derive it.** The app already does this and none of it was wired up:
   `calc/goals.js` → `estimateRunBaseline(workouts)` (logged runs → VDOT) and `calc/vdot.js` →
   `trainingPaces(vdot)` (VDOT → Daniels E/M/T/I/R). Both tested. **Check his actual logged
   workouts before writing anything.**
4. **Every session states a purpose** and is either faster than the last comparable session or
   deliberately easier **with the reason named** (recovery / deload / niggle).
5. **Volume moves on ACWR** (`calc/load.js`, sweet spot 0.8–1.3), never on a fixed % per cycle.
6. Governing methodology is `guidelinesForecast.md` (*"the only manual input is ever a real
   result"*), bound to the running plan by `runningworkouts/methodology.md`.

**Known facts — do not ask him again:** Apple Watch → Apple Fitness is the data source. Event is
the **USAF PFRA**; targets 2-mile **13:56**, push-ups **56**, sit-ups **52**; male, 35–39. He owns
push-up/sit-up programming himself. Ankle history (no sustained hills before Phase 2) and a calf
issue flagged 2026-08-17.

---

## ℹ️ Tool output may be minimally filtered (AI Compression Assist)
If the `AiCompressionAssist/` PostToolUse hook is enabled in `.claude/settings.json`, the **tool output you read** (bash/command results) has been **minimally filtered** before it reached you — long redundant test `PASS` runs, npm/pip download bars, and repeated `node_modules`/cache path lines are collapsed into `… [N … collapsed] …` markers. App files, line numbers, and error/stack-trace lines are preserved. It is conservative and fail-open (only filters when there's clear noise), so this rarely matters — but if you're deep-diagnosing a bug and need the *exact* unedited output:

- Read `AiCompressionAssist/logs/history_1.md` first (most recent), then `history_2.md`, then `history_3.md` for older context. Only outputs that were actually filtered are logged; each entry has a stats line (raw vs cleaned size) so you can locate one by size.
- Files rotate FIFO at 600 lines each. `logs/` is git-ignored. This is a local, free, deterministic script — no model, nothing leaves the machine. It does **not** wire into the React site — see `AiCompressionAssist/README.md`.

**Do not read the whole `AiCompressionAssist/` folder during a full-repo scan/review.** It's a standalone dev tool, not app code — pulling its full source + logs into a general codebase review burns exactly the tokens this tool exists to save. Only open files inside it when the task is specifically about the compression tool itself (debugging it, extending its filters) or when deep-diagnosing a bug per the bullet above.

---

## ⚠️ Deferred: the EFT map's Vector basemap is broken — do NOT spend time on it
As of 2026-08-13, `/EFTsh/map` has two basemaps. **Tiles (mapgenie's own raster
pyramid) is correct and is the default.** The **Vector** option (tarkov.dev's open
SVG maps + the two-landmark calibration solver) renders badly and Trey has
explicitly deprioritised it: *"The vector maps are super messed up. put it on a
note to fix later. idc about it right now."*

Do not fix, tune, or refactor it unasked. The picker labels it as broken and the
map menu shows a warning when it's selected. Its only long-term value is Terminal
(which mapgenie lacks) and multi-floor maps. Revisit only when Trey asks.

---

## ℹ️ EFT craft recipes come from the game files, NOT tarkov.dev
As of 2026-08-14, `hideout/production.json` in the SPT mirror is the source for
every hideout recipe — 204 of them, with tool requirements (not consumed),
quest locks, `continuous` flags and game-edition gates. It is a static file
mirror, so the craft tree works while tarkov.dev is down (it was, the day this
was built). `crafts` is no longer in the snapshot's `gaps` list.

- Recipes whose area has no build stages (the seasonal Christmas Tree, 17 of
  them) have no station to attach to and live in the snapshot's top-level
  `extraCrafts`. Don't "clean that up" — dropping it loses real recipes.
- tarkov.dev is still the only source for **prices**, and it only fills crafts
  for a station the game files had nothing for.
- The graph itself is `src/pages/eftShopping/eftCraftGraph.js` (pure, tested);
  the view is `views/CraftTreeView.jsx`.
- ⚠️ **The SPT mirror can be individually wrong even while broadly current.**
  Found 2026-08-28: Trey reported the craft tree charting RDG-2B smoke grenade
  → Zarya stun grenade. Fetching SPT's live `production.json` at the time
  showed that recipe *unchanged from our committed snapshot* — same wrong
  level (2), same phantom RDG-2B input — so it wasn't our fetch/transform
  logic, it's SPT's own data lagging a live patch on this one recipe. Cross-
  checked against the wiki's per-item pages (Zarya's own "Crafting" section,
  and RDG-2B's own page, which shows zero relationship to Zarya): the real
  recipe is Workbench **level 1**, just 5x UZRGM grenade fuze + 1x Gunpowder
  "Kite" — no RDG-2B at all. (The next link in that reported chain, Zarya →
  23x75mm Zvezda flashbang round, checked out exactly against Zvezda's own
  page and was left alone — not everything flagged as "old" turns out wrong.)
  Fixed via `KNOWN_ERRATA` in `scripts/fetchEftHideout.mjs`, applied to the
  raw SPT data on every fetch so a plain `npm run eft:snapshot` re-run can't
  silently reintroduce it. **Also surfaced a second, separate gap**: SPT's
  `production.json` has no recipe at all for RDG-2B smoke grenade itself
  (the wiki has one — Lavatory level 1, chlorine + matches + duct tape +
  toilet paper), so with the phantom Zarya link removed, RDG-2B currently has
  zero craft ties anywhere in the snapshot. Not fixed — Trey hasn't said
  whether he wants it added; ask before synthesizing a recipe SPT doesn't
  have at all rather than just correcting one SPT already has wrong.
  **Lesson for next time a recipe looks off**: check SPT's live file first
  (rules out a stale local snapshot / bad transform), then cross-check the
  ITEM'S OWN wiki page specifically — the Workbench station page itself is a
  giant transcluded template (skill-unlock sidebars, Cultist Circle tables,
  per-station build-cost tabs all interleaved) and grepping it directly is
  much more likely to mislead than checking `/wiki/<Item name>`'s own
  "Crafting" section.

---

## ℹ️ EFT quest + ammo data: the wiki and eft-ammo.com, NOT tarkov.dev or SPT
As of 2026-08-15 the EFT sub-app has two more committed snapshots, each with its
own fetch script. **Both exist because the two "obvious" sources are unusable**,
and that reasoning is worth keeping:

- **tarkov.dev has been down for days** — `GraphQL server unavailable`, and
  `status.tarkov.dev` itself 523s. Still the only source for flea prices.
- **The SPT mirror is stale for anything BSG reshuffles per wipe.**
  `templates/quests.json` was last touched **2025-03-17 for EFT 0.16.0**. It is
  fine for hideout structure (which barely moves) and wrong for quests.
  `templates/items.json` is additionally a **Git-LFS pointer** on the raw
  endpoint — you get 133 bytes unless you go via `media.githubusercontent.com`.

| Data | Script | Source | Why |
|---|---|---|---|
| Quests | `npm run eft:quests` | Fandom wiki API (wikitext, 50 pages/batch) | Community-edited within minutes of a patch — verified live edits during the pull. 857 quests. |
| Ammo | `npm run eft:ammo` | `eft-ammo.com` `__NEXT_DATA__` | Trey named it the source of truth. The page embeds its whole dataset, incl. the hand-tuned class1–6 armour ratings that are the entire point of that layout. 186 rounds. |

- Quests ship as **two files on purpose**: `questIndex.json` (~330 KB, eager —
  the hideout search needs it on the first keystroke) and `questDetail.json`
  (~1.3 MB, dynamically imported on first quest-detail open). Prose is 4/5 of
  the bytes; do not merge them back into one blob.
- The wiki is **prose, not a schema**, so `scripts/fetchEftQuests.mjs` parses it
  and every quest keeps its raw objective/requirement lines alongside the parsed
  fields — a parse miss degrades to "shown verbatim", never to "silently gone".
- **"Find 3 X in raid" + "Hand over the 3 X" is ONE requirement**, not two. Counts
  are taken as a max per item per quest, never summed. That phrasing covers
  roughly a third of all fetch quests.
- **JavaScript has no `\Z`.** A `(?=^==[^=]|\Z)` section lookahead silently means
  "or a literal Z" and truncated every section at its first capital Z — it cut
  "[[Ground Zero]]" in half and halved the guide count. `section()` walks by
  index instead. There is a regression test for this.
- **Quest-only items stay out of the hideout item search.** A Secure Folder 0048
  has one use and no sale value, so it is noise in a "can I sell this?" lookup.
  Trey called this explicitly. They still appear inside a quest's own breakdown.

---

## ℹ️ EFT `/EFTsh/uses` (Item Uses tab): barters + gear catalog, new sources needing wipe upkeep

As of 2026-08-27 "what is this item used for" (hideout / crafting / quests /
barter / armor) lives in one place — `/EFTsh/uses` — instead of scattered
across three tabs plus a duplicate reverse-craft index FrugalView had rolled
by hand (`views/FrugalView.jsx`'s `reverseIndex`, left as-is; a noted, deferred
cleanup, not touched by this feature). `eftItemUses.js` is the aggregation
module; it is pure and tested like `eftQuestLogic.js`/`eftCraftGraph.js`.

Two data sources didn't exist before this and both need the same "re-check
every wipe" treatment quests already get, for the same reason:

- **Barters** (`data/barterSnapshot.json`, `npm run eft:barters`) — scraped
  from `escapefromtarkov.fandom.com/wiki/Barter_trades`, NOT tarkov.dev. Its
  schema has a real `barters` query, but the API is down the same way it's
  been down for other EFT data in this repo, and barters are wipe-shuffled
  trader data exactly like quests — so this needs periodic re-scraping
  regardless of whether the API ever comes back. `give` (what you pay) is an
  array since ~191 of 443 current barters need more than one distinct item;
  `get` (the reward) is always a single item. A barter's "used for" tag is the
  give side ONLY — the reward item doesn't get a Barter tag from that trade.
- **Gear catalog** (`data/gearCatalog.json`, `npm run eft:gear`) — the only
  source that lets a piece of gear (glasses, a helmet, a rig) show an Armor
  tag even with zero quest/craft/barter ties. tarkov.dev's `items(types:
  [...])` query is the real source and is tried first; while it's down this
  falls back to Fandom wiki categories resolved through the same SPT locale
  name table quests use. Ten categories as of 2026-09-09: `Armor_vests`,
  `Armor_plates`, `Backpacks`, `Eyewear`, `Earpieces`, `Headwear`,
  `Chest_rigs`, `Face_cover`, `Armbands`, `Secure_containers`.
  ⚠ **SPT's `templates/items.json` was tried FIRST and abandoned** — it's an
  18 MB Git-LFS object and this repo's LFS bandwidth quota is exhausted
  (confirmed: `raw.githubusercontent.com` gives the expected 133-byte
  pointer, but `media.githubusercontent.com` — the documented pointer-bypass
  used elsewhere in this file — 404s instead of serving it). Don't retry that
  path without checking whether the quota has reset.
  ⚠ **The wiki-category-to-gear-type mapping is provisional**, found by
  probing search results, not from a real index of the wiki's category tree.
  `npm run eft:gear` prints a per-type count — a type at or near 0 means the
  wiki renamed the category, not that the gear vanished.
  🔴 **This file used to say "no category was found for the catch-all
  `wearable` ItemType; it's left out rather than guessed at." That was wrong**
  and it cost real trust — Trey searched `/EFTsh/uses` for the Aybolit mask
  and got nothing at all. `Category:Face cover` exists and holds 132 pages;
  `Category:Armbands` 38; `Category:Secure containers` 11. **181 pieces of
  gear had never been fetched.** One search returning empty is not evidence a
  wiki category does not exist — the same standard the external-data rule
  above sets for APIs applies to a wiki taxonomy.
  ⚠ `CATEGORY_BY_TYPE` (wiki) and `GEAR_TYPES` (`eftNormalize.js`) are
  **deliberately different lists and must not be merged**: `GEAR_TYPES` is
  injected raw into a tarkov.dev GraphQL enum, so a value tarkov.dev doesn't
  define breaks the whole query. Face covers and secure containers have no
  tarkov.dev ItemType of their own, which is why they were easy to miss.
  `armorClass` is null on every wiki-sourced row (getting it means opening
  every item's own infobox); wire it up once tarkov.dev is reachable.
### EFT PRICES: read `src/pages/eftShopping/PRICES.md` before touching prices

🔴 **There IS a public, unauthenticated, live flea-price API covering PVP, PVE and season, and it
is the upstream tarkov.dev itself consumes** —
`publicfleaapi.asoloproject.xyz/api/v2/flea-advanced/{eft|pve|season}/items-overview`. No key.
Verified 2026-09-10: three distinct payloads, samples ~24 minutes old.

This exists in writing because the wrong answer was given first. Asked whether PVE prices were
impossible "because there's no data for it publicly", the honest-looking answer was "tarkov.dev is
down and the only alternative wants money". Trey pushed back — *"the sources are 99% likely PUBLIC
somewhere or else those sites using them are using bots to scan prices constantly, which seems
excessive and unlikely"* — and he was right. The answer was in `the-hideout/tarkov-data-manager`,
which is open source: read `jobs/update-flea-prices.mjs` and `modules/tarkov-data-sp.mjs`.
**When a dozen sites all have data nobody appears to publish, find their shared upstream instead
of ranking the resellers.**

`PRICES.md` carries the full contract, the payload shape (11–14 MB raw, mostly per-offer noise
that must be stripped), the freshness evidence, the politeness limits, and a graveyard of the
nine other routes already probed and ruled out — including three tarkov.dev endpoints that return
200 while **silently ignoring the game-mode parameter** (byte-identical MD5s). Don't re-probe
them; don't trust a 200 to mean the mode took.

`npm run eft:prices` builds `data/prices/pve.json` AND `data/prices/regular.json` from it
(flea + trader sell-back + the **live trader assortment**, ~500 KB each). **The whole app runs
on it** as of 2026-09-11: `eftPrices.js` translates the snapshot into the tarkov.dev field
names every view was already written against, `loadEftData` merges it, and the PVP/PVE toggle
picks the file. Traps, all written up in `PRICES.md`: FX must be *derived* from
`requirementsCost` and is a different rate from the one in `traderPrices`; a weapon's flea
average is for modded builds, not the bare gun; an offer in a currency with no derived rate is
skipped, never priced at 1; `fleaBuy` is the robust average, not `minPrice`, because
`unitCost()` reads it first; and 🔴 **`fleaAvailable` is only ever raised to true, never lowered
to false** — 1,151 items have no flea sample and "no sample" is not "flea-banned", but three
views truthy-check that field to print a chip saying exactly that.

The live tarkov.dev refresh moved from the top bar to **Settings → Data source**. It is usually
down, its REST fallback is PVP-only, and a prominent "Get prices" button next to a page already
full of prices invited you to replace good numbers with worse ones.

### ℹ️ EFT craft loops (`/EFTsh/loops`) — a generic engine, not a hand-written list

Added 2026-09-10. Trey described a loop he runs — buy Scav Vests and PACA armour cheaply,
craft them into Ripstop and Aramid fabric, which feed a BNTI Module-3M — and asked for **an
engine that finds loops like it**, so it keeps working every wipe. `eftCraftLoops.js` is that
engine (pure, tested); `npm run eft:loops` prints its results; the tab draws them as cards.
It finds his exact loop without being told about it, and there is a test asserting that.

- **One fixed point, not a recursion.** `unit[item] = min(cheapest BUY, cheapest CRAFT)`,
  relaxed to convergence. The two definitions are mutually recursive (a barter can want a
  crafted item and vice versa), and a DFS with memoisation is wrong here — a result computed
  under one cycle-guard stack is not valid for a different caller.
- **Barter ladders are followed to the bottom, and that changes answers.** Scav Vest is a
  Jaeger barter for Slickers, which is a barter for Pack of Vita juice: 15,833 ₽ against
  26,500 ₽ to buy the vest outright. 🔴 It also means **a route that looks trader-fed may not
  be** — that ladder ends at the *flea*, and the card claimed "trader-fed" until `touchesFlea`
  walked it. Same for throughput: the tightest link governs, not the offer at the top.
- **A plan is a MATERIAL BALANCE** — buy what the steps consume and don't produce, sell what
  they produce and don't consume. The first version listed each feeder's gross output as
  revenue, so a chain that made 9 Piles of meds and then ate 7 booked all nine as profit and
  "sell the parts" won every time.
- **`multiplying` is not `infinite`.** Three real cycles multiply the item they cycle (Pile of
  meds ↔ AI-2 medkit is 9× a lap) but every one also consumes something from outside the loop,
  so none is free money. Only `ratio > 1 && sideInputs.length === 0` would be, and a test
  asserts the game currently has none.
- Farms are **collapsed by their winning plan's steps**, not by the craft they were found
  from: four armour recipes all reduce to "make the two fabrics and sell them raw", and the
  losing terminals are kept on the card as `alsoFeeds` with what that branch would cost.
  A farm is **named by what it sells** — naming it after the craft it was discovered from
  billed the Broken LCD farm as "Working LCD", which is its *input*.
- **Not modelled, on purpose:** the flea sales fee (its coefficients have changed between
  patches; guessing would put invented numbers on the page, and the sell-raw-vs-craft
  comparison is between two flea sales anyway).

- **Complete item table** (`data/itemNames.json`, `npm run eft:items`) —
  every item in the game, id → name + short name, from SPT's
  `locales/global/en.json` (the one SPT path the LFS problem doesn't block).
  🔴 **The Item Uses index contains EVERY item, including ones with no uses
  at all.** Trey's ruling, 2026-09-09: *"even if an item doesn't have a usage
  it needs to be in there or i'll just assume our data isn't complete."*
  `buildItemUsesIndex` used to end with `.filter(rec => rec.tags.length)`, so
  its universe was only what other snapshots happened to mention — ~700 of
  ~4,100 items — and searching any of the other 3,400 returned silence, which
  is indistinguishable from a broken snapshot. "No known uses" is an answer;
  an empty result set is not. `rec.hasUses` separates the two and
  `searchItemUses` ranks used items first so real answers stay on top.
  ⚠ **"Is it an item" is decided by whether it has a `ShortName`.** A bare
  `<id> Name` scan returns 4,760 entries including factions (BEAR), maps
  (Customs) and orgs (TERRAGROUP); none of those have a short name and every
  real inventory item does. That cut is exact, not a threshold, and leaves
  4,137. The printed count is the canary.

---

## ℹ️ EFT maps: 12 of 13 are wired; 5 of those are rebuilt, not scraped
As of 2026-08-16 every mapgenie map is committed under
`src/pages/eftShopping/map/data/markers/`. `npm run eft:markers` takes two
different paths and the difference matters:

- **Free maps** (Customs, Factory, Interchange, Shoreline, The Lab, The
  Labyrinth, Woods) read everything off `/tarkov/maps/<slug>`.
- **Pro maps** (Ground Zero, Icebreaker, Lighthouse, Reserve, Streets) 302 that
  page to `/tarkov/upgrade`. Their record is reassembled from the endpoints
  mapgenie serves openly to an anonymous client — `/api/v1/maps/{id}/data` for
  locations, `/api/v1/maps/{id}` for the initial view, and the tile CDN. **No
  session or cookie is forged; nothing logs in.** Each file records which path
  produced it as `taxonomySource: 'page' | 'derived'`.

Consequences worth knowing before touching this:
- **Category ids are game-wide**, which is the only reason the Pro path works —
  the names come from the free maps' taxonomies. `main()` seeds that table from
  the already-committed files and fetches free maps first. Two categories
  (`4736` Rogue, `4738` Lightkeeper) appear on Pro maps *only* and are the one
  hand-written thing in the script.
- **The tile version suffix is per map and unguessable** (`default-v1` …
  `default-v7`, `.jpg` or `.png`), so it is probed against the CDN. A missing
  tile answers **403, not 404**.
- **A throttled mapgenie answers 200 with the generic landing page**, not 429.
  Treating that as "this map has no data" is what made the first run look like
  five maps were broken.
- **The tile version counts DOWN, not up.** mapgenie redraws a map most wipes
  and bumps `default-vN`, but every superseded pyramid stays on the CDN — Woods
  is on v11 and v5 still answers 200. The first probe walked upward and took the
  first hit, so it found the *oldest* surviving basemap on every map: Streets
  shipped on v1 when v10 was current. Measured against the free maps, where
  mapgenie publishes the right answer: **ascending 4/7 patterns correct,
  descending 7/7.** Also probe every zoom level rather than stopping at the first
  miss — the pyramid is not a square and Lighthouse has a hole at z10 in its
  centre column. Note the probe finds what the CDN *serves*, which is sometimes
  wider than what mapgenie *declares*: Factory declares z9-14 but serves real
  256x256 tiles at z8 and z15. Wider, not wrong — a Pro map just gets one more
  zoom step in each direction than mapgenie's own site allows.
- **Terminal ships as a basemap-only record** (`basemapOnlyRecord()`, `tiles:
  null`, zero markers) so the map opens and takes zones and routes instead of
  showing a scaffold notice. The picker flags it "no pins". It draws on the
  tarkov.dev SVG — the deferred Vector path above — so a rough render there is
  the known issue, not a new bug. ✂️ No marker source exists: mapgenie's entry
  (id 73) is `enabled: false` with zero locations and no tiles at any zoom, and
  tarkov.dev is down (`422 GraphQL server unavailable`; `status.tarkov.dev`
  523s). Per Trey, that is fine — if none of the sources have it, the player
  base doesn't either. Build with what's there.

### Map reference sites (Trey's, 2026-08-16 — also in `EftShoppingPlan.md`)
Use these in order when mapgenie doesn't have something. **mapgenie treats
public information as Pro; that does not make it secret** — but the gate is
server-side and a crawler UA does not move it (Googlebot, Googlebot-Smartphone,
Bingbot and an empty UA all 302 to `/tarkov/upgrade`; bare `curl` gets 403).
Don't re-test that.

| Site | Good for | Not good for |
|---|---|---|
| `mapgenie.io/tarkov/maps` | Everything currently used: tiles, markers, taxonomy, sprites | The 5 Pro pages |
| `escapefromtarkov.fandom.com/wiki/Map_of_Tarkov` | Confirming the map roster (13 incl. Terminal), features, mine/sniper zones | Coordinates — it is prose and an imagemap |
| `tarkov-market.com/maps/<slug>` | All 12 mapgenie maps incl. every Pro one; live (redeployed daily) | Terminal (500). Markers are community "packs" in its own image pixel space, not lat/lng — a cross-check, not a drop-in |

---

## ℹ️ `/TT` transcript data — the source file is NOT JSON, and UVU's scale isn't standard
As of 2026-08-16 the GPA what-if tool at `/TT` is built. Four things about the
data will bite anyone who assumes the obvious:

- **`src/pages/TranscriptTool/Transcript.json` is raw registrar text**, despite
  the extension. Vite parses `.json` at import, so `import x from
  './Transcript.json'` **fails the build**. It is the source of record —
  never rename, reformat, or hand-edit courses into it. `npm run tt:parse`
  reads it and emits the real `transcript.data.json` that the page imports.
- **Rows collide in the source.** Where a row ends in an R (repeat) flag, the
  next course's subject code is fused to it with no separator — one line in the
  2012 FALL block holds *three* courses (`…0.00 EMICR 2065 …0.00 EPES 1097 …`).
  `parseTranscript.js` therefore scans by regex offset, not by line. Splitting
  on `\n` silently loses courses and still prints a plausible GPA. There is a
  regression test for each fused line. Related trap: matching the flag with
  `\s*` lets a flagless row swallow the first letter of the next line's subject
  (`…11.10\nEXSC 4550` → flag `E` + subject `XSC`), so it uses `[ \t]*`.
- **UVU's plus/minus steps are ±0.4/0.7, not ±0.3/0.7**, and it **truncates**
  the displayed GPA rather than rounding (2012 SPRING is 50.80/13 = 3.9077 and
  prints 3.90). Both are needed to reproduce the printed 3.05. The "standard"
  US scale is available as a toggle but is not the default — defaulting to it
  would show a GPA that disagrees with the transcript.
- **An `R` column value of `E` removes an attempt from the GPA entirely** — zero
  hours *and* zero points, not merely zero points. Ignoring the flags takes GPA
  hours from 171 to 189. `ZOOL 2320` appears three times.

The transcript prints its own per-term footers and grand total, so the parser is
validated against the registrar rather than against anyone's reading of the
file: `npm run tt:parse` exits non-zero if any of the 15 terms or the total
disagrees, and the same reconciliation runs in vitest.

---

## ℹ️ EFT map: BTR stops are drawn as NAMES, not pins — a deliberate override

Added 2026-09-11. mapgenie ships BTR stops as `displayType: 'marker'` with a dark purple pin
(#453A49) and no label, which on Woods and Streets means six to eight identical anonymous
teardrops — you can see that a taxi stops somewhere and not which stop it is, which is the
only thing you need from them. Trey: *"the BTR STOPS icon text is super messed up. fix it and
just name the stops the names - instead of an icon make the icons be replaced with bold red
text - so it stands out from all the other text."*

Everything else on these maps still follows the source's own display type. This is the one
place we override it, so **do not "fix" it back** to match mapgenie.

- **Matched on the category's ICON (`btr_stop`), not its id.** 4743 happens to be the id on
  both maps that have them today, but ids are mapgenie's and have been reshuffled before.
- `drawsPin(category)` is the override point, kept separate from `hasPin(displayType)` —
  that one answers "what does the source say", which is still a real question and is tested
  as such. Red is `#ff2d3a` and nothing else on these maps uses it.
- 🔴 **`persist: true` means the label holds full size at EVERY zoom**, bypassing the
  shrink-then-drop ramp in `textSizeForZoom`. That ramp exists because a place name written
  across a building is in the way once you are close — but a BTR label has no pin behind it,
  so shrinking it shrinks the marker and dropping it deletes the stop from the map at exactly
  the zoom you went looking for its door.
- **Labels that persist also dodge.** The first version collided with the white place names
  underneath ("BTR SAW~ILL Lumber", "BTR U~EC CHE~KPOINT") — which is the same complaint in a
  new colour. `SpriteMarkerLayer._draw` now measures every ordinary label first, then settles
  the persisting ones against that finished picture, nudging vertically. A BTR label is never
  dropped on collision, only moved; if every candidate collides it draws anyway, on top.
- **`BTR Stop` is in `DEFAULT_ON`** alongside Extraction and Location. `visibleCats` is NOT
  persisted — it resets to that set on every map load — so leaving it off meant re-ticking it
  every single time. It costs six to eight compact red labels now rather than pin art.

---

## 🔴 `_leaflet_pos` on the EFT map: `map._loaded` is NOT a sufficient guard

This exact TypeError — `Cannot read properties of undefined (reading '_leaflet_pos')` — has now
been chased **twice**, and the first fix was documented as sufficient when it covered only half
the problem. A Leaflet map has THREE lifecycle states and two of them are unsafe to project
through (`containerPointToLatLng`, `latLngToContainerPoint`, `panTo`, `getCenter`, `getBounds`):

| state | `_loaded` | `_mapPane` | safe? |
|---|---|---|---|
| constructed, before the first `setView()` | `false` | exists | **no** |
| ready | `true` | positioned | yes |
| **after `map.remove()`** | **`true`** | **deleted** | **no — and `_loaded` lies** |

Read `leaflet-src.js`'s `remove()`: it ends with `delete this._mapPane` and **never touches
`this._loaded`**. `_getMapPanePos()` is `getPosition(this._mapPane)`, which is
`el._leaflet_pos`. So a torn-down map passes an `if (map._loaded)` check and throws anyway.

- **2026-08-19** was the first state. `mapRef` is assigned the instant `L.map()` returns, but
  the pane has no position until `setView()`, and `useMapDrawing`'s `mergeTolerance` projects
  on every render while the async marker chunk is still loading. `_loaded` was added and fixes
  that window. Local-only testing never hit it — the chunk resolves off disk before the map is
  even built; it needs a real network to open.
- **2026-09-11** was the third state, reported from production by Trey: *"I get this randomly
  on eftsh/map and then when i refresh it all just works normal."* `MapCanvas` is keyed
  `` `${mapKey}-${base}` ``, so **switching maps remounts it** and its cleanup calls
  `map.remove()`. But the instance had been handed to `MapView` through `onReady`, and nothing
  ever invalidated *that* ref — so between the old cleanup and the new mount's effect, MapView
  held a dead map that still reported `_loaded === true`. Reproduced in Playwright: the error
  boundary fires within **four map switches** before the fix and survives **39** after it.

The fix is two parts, and the first is the real one:
1. **`MapCanvas` calls `onReady?.(null)` in its cleanup.** A component that hands an object out
   must hand out its death too — otherwise every consumer is holding a corpse.
2. **`map/mapSafety.js`** — `isLiveMap(map)` checks `_loaded` AND `_mapPane`; `withMap(map, fn)`
   for the one-liners. Use these, never a bare `map?.` or `map._loaded`, at any call site that
   reaches into Leaflet. `mapSafety.test.js` asserts each of the three states by name, including
   that a removed map still reports `_loaded === true` — if that assertion ever flips, the crash
   is back.

**Both crashes were caught by the route boundary and neither blanked the site**, which is the
error-boundary work below doing its job — but a map that dies on a map switch is still broken.

---

## 🛡️ Error boundaries — every page has one, don't remove them
Added 2026-08-20 after the **second** outage in three days where one broken
component blanked the whole site (`/EFTsh/map` `_leaflet_pos` on 08-17,
`/TT` `band2 is not a function` on 08-20). React unmounts the **entire tree**
when anything throws during render — `#root` empties and you see `index.css`'s
body gradient with nothing on it. That is the "blank blue page".

Everything lives in `src/components/errors/`. Three layers, all the same class
component with different props:

| Layer | Where | Catches |
|---|---|---|
| `RootBoundary` | `main.jsx`, **outside** `<Router>` | a crash in Router / AuthProvider / Firebase init |
| `RouteBoundary` | `App.jsx`, around `<Routes>` | any page or sub-app; keeps the Navbar alive |
| `<Boundary>` | opt-in, per panel | one widget, so the page survives |

- **`<Boundary title="…">` is the one you'll use.** Wrap a panel that does
  something risky (a map, a canvas, a big table, anything parsing a file). It
  renders an inline strip instead of the panel. Currently on `MapView`,
  `CourseTable` and `<Navbar />` — everything else is covered by the route layer.
- **Boundaries do NOT catch** event handlers, `setTimeout`, or promise
  rejections — React isn't on the stack for those. `errorNotifier.js` covers
  them with `window.onerror` / `unhandledrejection`.
- **`errorNotifier.js` is deliberately not React** and must stay that way: it
  reports crashes *after React is gone*, so it is plain DOM with inline styles,
  no imports that could themselves be broken, installed before React renders.
  A React toast cannot report that React died.
- **The banner** (bottom-right, persists until dismissed) has Open / Copy /
  Console. `window.astralErrorReport()` does the same from devtools.
  `localStorage.setItem('astral_error_alert','1')` upgrades crashes to a
  blocking `alert()`, capped at 3 per session.
- **A real pop-up window needs a click** — browsers block `window.open()`
  outside a user gesture. That's why the banner appears automatically and its
  Open button does the window. Not a limitation worth fighting.
- **`/crash-test` is dev-only** (`import.meta.env.DEV` in App.jsx) and throws
  five different ways so you can see which layer catches which.
- **`toolStorage.js` maps a route to its localStorage prefixes** for the
  fallback's reset button. It is a convenience — the "show all keys" path needs
  no registry. Adding a new tool there is optional; forgetting costs a shortcut,
  not a capability.
- **`__BUILD_ID__`** (git sha + time, from `vite.config.js`) is stamped into
  every report, so "works locally, broken live" is answerable in one glance.

**Tests:** `src/components/errors/*.test.jsx` are the repo's only rendering
tests. They opt into jsdom per file with `// @vitest-environment jsdom`; the
vitest default stays `node` so every other suite is unaffected. Use that same
docblock for any future component test.

---

## 📲 The web app manifest exists to keep the login — do NOT remove it

Added 2026-09-12 after Trey reported the site had stopped saving his login on mobile.

**Diagnosis, in order.** `getAuth()` in `src/firebase.js` uses the SDK default persistence chain
— `[indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence]` (verified in
the installed firebase 12.14.0, not from memory). Every one of those is **script-writable
storage**, and iOS Safari's ITP deletes all of it after **7 consecutive days without a
first-party visit**. Firebase keeps its refresh token there, so a week away = signed out. Nothing
in our code regressed; the last auth commit only added logging.

⚠️ **The `authDomain` theory was checked and RULED OUT — don't re-chase it.** `vercel.json`
reverse-proxies `/__/auth/*` to `astral-project-10a35.firebaseapp.com` so the sign-in handoff
stays same-origin, which only works if `VITE_FIREBASE_AUTH_DOMAIN` is the app's own domain. Those
vars live only in Vercel's dashboard and aren't readable from the repo — but the value is **baked
into the shipped bundle**, so `curl` the live site's `/assets/index-*.js` and grep it. It reads
`authDomain:"astral-project.vercel.app"`. Correct. That trick settles any build-time env question
in about a minute; use it instead of guessing or asking him to open the dashboard.

**The fix is `public/manifest.webmanifest` plus the `apple-*` meta tags in `index.html`.** A
home-screen web app is exempt from the 7-day sweep and gets its own storage partition. Deleting
the manifest, or dropping `apple-mobile-web-app-capable` (iOS reads the meta tags, **not** the
manifest, for standalone mode / label / icon), brings the weekly sign-out straight back.

- **Static files beat the SPA rewrite on Vercel** — the filesystem is checked before `rewrites`,
  so the `/(.*)  -> /index.html` catch-all does not swallow `/manifest.webmanifest` or
  `/icons/*`. Confirmed live (`/vite.svg` returns `image/svg+xml`, not the SPA HTML).
- **Status bar is `black`, not `black-translucent`** — translucent draws content up under the
  status bar and `body` already carries `padding-top: 80px` for the fixed navbar.
- ✂️ **Not done: the heavier, browser-independent fix.** Firebase Admin's `createSessionCookie()`
  / `verifySessionCookie()` with an `api/` endpoint would put the session in an **HttpOnly
  server-set cookie**, which ITP's 7-day cap does not touch — so it would survive in plain Safari
  with no install required. We already have `api/_lib/firebaseAdmin.js`. It was skipped because it
  rebuilds site-wide auth to solve a problem the manifest solves for free; revisit only if the
  installed-app route doesn't stick.
- **`probeAuthStorage()` in `AuthContext.jsx` decides this next time instead of inferring it.**
  It logs into the existing diagnostic trace that `WelcomeGate` already renders. `idb=absent
  localStorage=absent` means the storage was **wiped** (ITP; sign in again). `idb=present` means
  the token is still on disk and **our** load path failed to use it — e.g. the 6s hang fallback
  forcing signed-out — which is our bug and a refresh would likely fix it.

## 🎨 webdesign.md is required reading before any layout work
`webdesign.md` (same directory) is the binding contract for page layout, the
counterpart to `gamedesign.md` and `featuredesign.md`. Written 2026-08-13 after
the **third** time the same complaint came up. Core rules:
- **No huge side padding.** Tool/app pages use the full window. `max-width` on a
  centred column is only for long-form prose, never for a dashboard, table, map
  or tracker.
- **Canvas pages take ~99% of the viewport**; chrome floats over the surface and
  collapses, it does not take a slice out of it.
- **One top bar per tool.** A tool with its own bar hides the global navbar and
  carries `<HubLink />` as that bar's first child (far-left, styled by the tool).
  Rolled out site-wide 2026-08-14 — see step 6 of the new-page checklist below.
  `Navbar.jsx` → `OWN_TOPBAR_ROUTES` is the single list controlling this.

---

## What this project is
A React single-page app about astral projection, deployed on Vercel. The owner (Trey) also uses it as a personal hub — it hosts unrelated personal tools (MyMDB, RS Market, QA Tracker, etc.) alongside the main astral content. The site is live.

---

## Other CLAUDE.md files exist in this repo — check for them
This root file only auto-loads when your working directory is at or above repo root. Subfolders (e.g. `pokemonOg/bugtracking/lastmapMarkdowns/CLAUDE.md`) can have their own CLAUDE.md with folder-specific rules that will NOT auto-load otherwise. Before assuming you know all the project rules, check whether the folder(s) you're working in — or their parents — have their own CLAUDE.md, and read it. If you find one not listed here, note its path in this section so it's easier to spot next time.

Known nested CLAUDE.md files:
- `src/pages/pokeredPage/CLAUDE.md` — pokered (Pokemon Red port) project rules, architecture facts, checklist-sync workflow. Auto-loads when the cwd is the game folder. (Moved here 2026-07-21 from `pokemonOg/bugtracking/lastmapMarkdowns/`.) It also registers two pokered skills — `pokered-fully-wire` and `pokered-bug-sweep` — in `src/pages/pokeredPage/.claude/skills/`.
- `src/pages/pogofilters/CLAUDE.md` — PogoFilters (Pokémon GO search-filter manager) rules. Read it before touching `src/pages/pogofilters/` **or** the `PogoFilters/` docs folder at repo root, since the two are one project. Covers the non-obvious constraints (filter length is never a concern; the tool never guesses a CP tier), which doc is authoritative for what, the Node-vs-Vite JSON import trap that makes the build pass while the safety tests silently fail to load, and the open questions only an in-game test can settle.
- `src/pages/theknowledgebase/CLAUDE.md` — TKB + **AFOQT** rules. Read before touching `src/pages/theknowledgebase/`. Carries the two binding question-generation rules (iterate at the SAME difficulty band; no orphan concepts), why the old ASVAB deck was polluted and must not be repeated, the copyright line on the calibration books (ruler, not corpus — because they are third-party commercial test-prep products, **not** because the site is public; the repo and the Vercel deployment are both **private**, and that rule explicitly does NOT extend to `courses/`, where quoting exact definitions and real quiz questions is required), and the AFOQT facts that are easy to get wrong (Form S vs T, disputed composite count, inverted instrument bank, shifting Block Counting answer ranges). Full docs in that folder's `docs/afoqt/`, where `PLAN.md` is the live session-handoff state.

---

## Stack
- React 18 + Vite
- React Router v6 (BrowserRouter, Link, useNavigate, useParams)
- SPA data layer stays client-side: localStorage or static JSON files by default; Firestore (`src/firebase.js`, per-sub-app `*Firestore.js` files) for signed-in cloud sync — this already existed before any serverless functions did.
- As of 2026-07-22: narrow serverless webhook endpoints are allowed, living in `api/` (see "Backend / serverless functions" below). Still no traditional always-on server for the main site — `server/` is a separate, local-only, manually-run Flask dev tool for the Google Photos page, not part of the deployed site.
- Deployed to Vercel. `vercel.json` handles SPA routing rewrites (Vercel resolves `api/*` functions before applying those rewrites, so the two don't conflict).

---

## Backend / serverless functions (`api/`)
Added 2026-07-22 for the first one (MyFitnessPal-via-Apple-Health import). The site is still fundamentally a static SPA — this is a deliberate, narrow exception for cases that need a trusted server context (e.g. writing to Firestore from outside the browser, hiding a real secret), not a general invitation to build server-side features.

- Each endpoint is a Vercel serverless function: `api/<name>.js`, default-exporting `(req, res) => {...}`. ESM (`package.json` has `"type": "module"`).
- Shared helpers live in `api/_lib/` (Vercel does not route anything under a `_`-prefixed folder as an endpoint):
  - `api/_lib/auth.js` — `requireSecret(req, res, envVarName)`. This is a single-owner personal site, not a multi-user product, so auth is one long-lived bearer secret per endpoint (set in Vercel's env vars), not a full auth system. **Every new endpoint must call this before doing anything else** — reuse it, don't reinvent a header check per function.
  - `api/_lib/firebaseAdmin.js` — `adminDb()`, a Firebase Admin SDK Firestore handle for server-side writes. Uses `FIREBASE_SERVICE_ACCOUNT_KEY` (full JSON service-account key). This bypasses client Firestore security rules entirely (trusted server context) — that's exactly why `requireSecret()` must always run first.
- Env vars for these functions are **plain Vercel env vars read via `process.env`**, NOT `VITE_*`/`import.meta.env` — those are build-time/client-only and don't exist in a serverless function's runtime. Set them in the Vercel dashboard (Project Settings → Environment Variables), never commit them. Current vars: `FIREBASE_SERVICE_ACCOUNT_KEY`, `MFP_IMPORT_SECRET`, `FITNESS_UID`.
- Local testing: `npm run dev` (Vite) does NOT run `api/` functions — you need `vercel dev` (Vercel CLI) for that, with the same env vars in a gitignored `.env.local`. Not required just to ship; only if you want to iterate on a function locally before deploying.
- Cost/ops: Vercel Hobby (free) + Firestore Spark (free) both comfortably cover low-volume personal-use traffic like this. No server to patch or reboot — Vercel/Firebase own uptime.

---

## Critical folder rules

| Folder | Purpose | Rule |
|---|---|---|
| `src/pages/` | React pages | One `.jsx` + one `.css` per page |
| `src/components/` | Shared UI | Currently only Navbar |
| `src/data/` | Static data imported by React | JSON, txt |
| `public/` | Standalone HTML tools, NOT React | Served byte-for-byte, never compiled |
| `dist/` | Build output | Never edit. Auto-generated by `npm run build` |
| `node_modules/` | Installed packages | Never edit |
| `AiCompressionAssist/` | Dev tool (PostToolUse hook), not app code | Skip in full-repo scans — see note above |
| `api/` | Vercel serverless functions (backend exceptions) | See "Backend / serverless functions" below. `api/_lib/` = shared helpers, not routes |
| `server/` | Local-only manual Flask dev tool for Google Photos OAuth | NOT deployed with the site — unrelated to `api/` |

---

## Adding a new React page — ALL 5 steps required

1. `src/pages/YourPage.jsx` + `src/pages/YourPage.css`
2. Import in `src/App.jsx`
3. `<Route path="/your-path" element={<YourPage />} />` in App.jsx Routes block
4. ~~`<Link>` in Navbar.jsx~~ — no longer needed, the dropdown is generated (see step 5)
5. **Add it to `src/siteLinks.js`** — one entry in `SITE_LINKS`
   (`{ to, name, desc, icon, bg, accent, rgb }`; add `ext: true` for a `public/`
   link). This single entry produces BOTH the navbar dropdown item and the Home
   card, so steps 4 and 5 are now one step. A feature is not "done" until it is
   in `SITE_LINKS`.

Steps 4 and 5 have collapsed into step 5 — the navbar no longer has hand-written
`<Link>`s to edit.

6. **If the page/sub-app renders its OWN top bar, it must be the ONLY bar.**
   Put `<HubLink />` (`src/components/HubLink.jsx`) as the **first child** of
   that bar so the Astral Hub link sits far-left where the site logo would be,
   then add the route prefix to `OWN_TOPBAR_ROUTES` in
   `src/components/Navbar.jsx` so the global navbar is suppressed.
   **Both, or neither** — hiding the nav without the link strands the user with
   no way back. Centred hero headers use `<HubLink className="hub-link-pinned" />`
   plus `position: relative` on the header. Early returns for signed-out or
   loading states need the link too. Full pattern: `webdesign.md` §3.

---

## Adding a standalone tool (public/ — no React)
- Drop folder in `public/` → accessible at `/folder-name/index.html`
- In Navbar use plain `<a href="/folder-name/index.html">` NOT `<Link>` — Link will break it
- Current public/ tools: `birds/` (game), `chinese-idioms/` (standalone page), `lexicon/` (data + node scripts only)

---

## CSS rules — follow these exactly
- Every page has its own scoped CSS file. No cross-page style sharing except `SharedPages.css`.
- Sub-apps MUST namespace all their CSS classes with a prefix to prevent leaking into the rest of the app:
  - mymdb → `mdb-` prefix on every class
  - RS Market → `rs-` prefix on every class
  - New sub-apps → pick a short prefix and use it on everything
- Global styles only in `src/index.css` and `src/App.css`
- Do not add styles to existing global files for page-specific things

---

## Sub-app pattern (mymdb is the reference implementation)
When a feature needs its own internal pages/routes:
- Lives in `src/pages/yourapp/` subfolder
- Has a shell component (`YourAppApp.jsx`) that owns a nested `<Routes>` block
- Registered in App.jsx as `<Route path="/yourapp/*" element={<YourApp />} />`
- Manages shared state (toasts, etc.) via React Context inside the shell
- CSS scoped with a prefix (see above)
- See `src/pages/mymdb/` for the complete working example

---

## Current routes

Tools whose NAME is an abbreviation use that abbreviation as the URL, in
UPPERCASE. Those routes are declared `caseSensitive` so `/mft` does NOT silently
match `/MFT` — it falls through to `RouteFallback`, which redirects to the
canonical casing. Legacy paths redirect the same way. Both live in
`src/routeAliases.js`.

| Path | Component | Notes |
|---|---|---|
| `/` | Home.jsx | Tile grid, user-configurable (see below) |
| `/daily-idiom` | DailyIdiom.jsx | Pulls from public/chinese-idioms data |
| `/daily-idiom-widget` | DailyIdiomWidget.jsx | |
| `/lexicon` | Lexicon.jsx | Word study tool |
| `/google-photos` | GooglePhotos.jsx | |
| `/mymdb/*` | mymdb/MymdbApp.jsx | Movie/book library |
| `/MFT/*` | fitnesstracker/FitnessTrackerApp.jsx | was `/fitness-tracker`. `/MFT/schedule` is the recurring class week, transcribed from `G:\My Drive\SupplementalCourseDocs\ClassSchedule_2026Fall22.xlsx` ("Template" sheet) and laid out to match it — see `FitnessTrackerPlan.md` Phase 11. The calendar's right rail also reads TKB's `canvasSchedule.json` directly. |
| `/VV/*` | lang/LangApp.jsx | Vocab Vault — was `/vocab-vault`, `/lang` |
| `/TKB/*` | theknowledgebase/TkbApp.jsx | was `/tkb` |
| `/QA` | QATracker.jsx | was `/qa-tracker` |
| `/RS` | RSMarket.jsx | was `/rs-market` |
| `/POGO` | pgotracker/PgoTracker.jsx | **POGO Tracker** — was `/pgo-tracker` |
| `/POGO-ACCS/*` | pogoaccs/PogoAccsApp.jsx | was `/pogo-accs` |
| `/EFTsh/*` | eftShopping/EftShoppingApp.jsx | **EFT Shopping** — Tarkov hideout shopping list + raid companion. Built from BSG's own game files (SPT mirror) with tarkov.dev layered on top for prices only. `npm run eft:snapshot` regenerates the committed snapshot. Includes `/EFTsh/crafts`, a left-to-right craft flow chart — see the craft-data note below. `/EFTsh/uses` is the one-stop "what is this item used for" search (hideout/craft/quest/barter/armor) — see the barters + gear catalog note below. `/EFTsh/loops` finds the semi-infinite craft loops from data — see the craft-loops note below. |
| `/TT` | TranscriptTool/TranscriptToolApp.jsx | **Transcript / GPA what-if calculator.** Deliberately NOT in `SITE_LINKS` — URL-only, at Trey's request, so it appears in neither the navbar dropdown nor Home. `TT` is still in `CANONICAL_SEGMENTS` so `/tt` redirects rather than 404s. See the transcript-parsing note below. |
| `/medaldex/*` | medaldex/MedalDexApp.jsx | |
| `/stashmap/*` | stashmap/StashMapApp.jsx | |
| `/antiquityquest/*` | antiquityquest/AntiquityQuestApp.jsx | |
| `/timer-tool/*` | TimerTool/TimerToolApp.jsx | |
| `/league-build/*` | leagueBuild/LeagueBuildApp.jsx | |
| `/orbit/*` | orbit/OrbitApp.jsx | |
| `/planning-tool` | planningTool/PlanningToolApp.jsx | |
| `/pokered/*`, `/gitmon/*`, `/bashmon/*`, `/signal-lost/*`, `/python-game/*` | games | |
| `*` | RouteFallback.jsx | Alias redirect, else a real 404 |

**`RouteFallback` is not optional.** `vercel.json` rewrites every path to
`index.html`, so before it existed an unrouted URL rendered a blank white page
with no error anywhere. `/planning-tool` shipped in exactly that state — page
files committed, `<Route>` not — and the only symptom was nothing at all.

---

## Navbar + Home cards — ONE shared registry

Both read from **`src/siteLinks.js`** (`SITE_LINKS`). Do not hand-maintain two
lists again; they drifted before.

- **Navbar dropdown renders ALL of `SITE_LINKS`, always.** This is the guarantee
  that a tool stays reachable even when its Home card is hidden.
- **Home renders a user-chosen subset, in a user-chosen order.** `⚙ Customize`
  on the Home page toggles cards on/off and drags them into order.
  `src/homeLayout.js` persists it: localStorage always (works signed-out),
  mirrored to `users/{uid}/prefs/homeLayout` when signed in.
- A tool added to `SITE_LINKS` but missing from a saved layout is **appended
  visible** — new things show up rather than silently never appearing.

---

## Key files to know

| File | Why it matters |
|---|---|
| `src/App.jsx` | All routes live here. Entry point for understanding the whole app. |
| `src/components/Navbar.jsx` | All nav links. Link vs a distinction matters here. |
| `src/data/qaSkillsTracker.json` | Data for QA Tracker. Skills are `item.tool` inside `cat.items[]`. |
| `src/data/toolsToAdd.txt` | Scratch pad for skills to add to QA tracker later. Not used by app. |
| `src/pages/mymdb/mymdbStorage.js` | Reference for localStorage data layer pattern |
| `public/lexicon/words.json` | Word list for Lexicon page |
| `vercel.json` | SPA rewrite rule — don't remove or all deep links break on Vercel |

---

## State and data patterns
- **Page-local state**: `useState` / `useEffect` directly in the page component
- **Persistent data**: localStorage via a storage module (see mymdbStorage.js)
- **Shared state within a sub-app**: React Context (see ToastContext in MymdbApp.jsx)
- **Static data**: JSON files in `src/data/` imported directly, or in `public/` fetched at runtime

---

## Code style preferences
- No unnecessary abstractions. If something is used once, don't extract it.
- No comments explaining what code does. Only comments for non-obvious WHY.
- No error handling for things that can't fail internally.
- Keep CSS scoped — never reach outside a component's own file.

## BashMon / GitMon git branching strategy

**READ THIS BEFORE TOUCHING EITHER GAME.**

There are three branches:

| Branch | Purpose |
|---|---|
| `main` | Shared React/JSX/CSS + all non-game pages. The games live here as thin wrappers. |
| `red` | BashMon-only files: `src/pages/bashmon/content/*.json` + `bashmonEngine.js` |
| `blue` | GitMon-only files: `src/pages/gitmon/content/*.json` + `gitmonEngine.js` |

**Workflow:**
1. Bug fixes, shared logic, UI changes → commit to `main`
2. After `main` is stable → `git merge main` into `red` and `blue`
3. Bash-specific content/engine changes → `red` branch only
4. Git-specific content/engine changes → `blue` branch only
5. Never put bash/git command logic, move data, or area data on `main`

**What stays on main (shared):**
- `src/pages/shared/GameBattle.jsx` — unified battle component (NEVER put game-specific content here)
- `src/pages/bashmon/BashmonBattle.jsx` — thin wrapper, passes config to GameBattle
- `src/pages/gitmon/GitmonBattle.jsx` — thin wrapper, passes config to GameBattle
- All overworld JSX, starter select JSX, app shells

**What stays on red/blue (game-specific):**
- `src/pages/bashmon/content/pokemon.json`, `moves.json`, `gyms.json`
- `src/pages/bashmon/bashmonEngine.js`
- `src/pages/gitmon/content/pokemon.json`, `moves.json`, `gyms.json`, `items.json`
- `src/pages/gitmon/gitmonEngine.js`

The two games are ~99% identical. Keeping the engines/content on their own branches means a single feature landed on main (e.g., a new battle phase) propagates to both games with one merge. No 2x work.

---

## External data sources — never declare one "unavailable" from a sample of one

**Trigger: any time an external API/site/feed you planned to use is down, rate-limited, paywalled, or missing a field you need.**

Added 2026-08-09 after a real failure: tarkov.dev's API was down for a whole
session. Alternatives were researched for *structural* data (SPT game files were
found and used) but **zero searches were run for backup price sources**. The
result — "flea prices are unavailable" — was reported to Trey as an external
fact. It was not. It was an unresearched gap, and he already knew of a source.

Before you write, say, or build around "X is unavailable / there's no source for this":

1. **Search for alternatives, explicitly.** At minimum a web search for
   competitors/mirrors plus a direct probe of each candidate endpoint. Don't
   reason from memory about what exists.
2. **Check whether "alternatives" are actually independent.** Several Tarkov
   price sites just re-publish tarkov.dev — they share its outage and are not a
   backup. Verify the upstream before counting a source.
3. **Report the search, not just the conclusion.** Give the list of what was
   checked and what each returned. "I checked A, B, C; A needs a paid key, B is
   encrypted, C mirrors the dead one" is useful. "It's unavailable" is not.
4. **Escalate paid/keyed options as a question, never silently discard them.**
   A source that needs an API key or a subscription is a decision for Trey, not
   a dead end for you to quietly rule out.
5. **Frame it as your gap until proven otherwise.** Say "I couldn't find another
   source — do you know one?" rather than "no source exists." The second is a
   claim about the world you usually haven't earned.

This applies to data sources, libraries, assets, and docs alike.

## Game design — required reading

When creating or discussing a game, read `gamedesign.md` (same directory as this file) before doing anything else. It is the source of truth for all game work and should be iterated on as games evolve — changes to the workflow apply to all future games.

## Feature design & scope fidelity — required reading

When creating, extending, or "dropping a task" to build any **non-game feature/product**, read `featuredesign.md` (same directory) before doing anything else — it is the binding contract for feature work, the counterpart to `gamedesign.md`. Core rules:
- **Default = full build.** Unless the request is explicitly labeled *demo / sample / part-work / skeleton*, build the whole thing — across multiple sessions if needed. Never self-downgrade to a demo.
- **Completeness beats interpretation-correctness** — 120%-then-trim over a polished 20%.
- **Checklist first, then double it.** Derive a numbered MUST/SHOULD/COULD checklist, then re-read and expand it (recover downgraded / assumed-away items). On autonomous runs, post the checklist AND start building simultaneously — don't wait (plan mode is the path when the user wants to review first).
- **Never silently drop scope.** Still attempt a best guess — and report anything you can't fully meet as a **live blocker with its explanation**: what's blocked, why, what you actually tried (listed), and what would unblock it. "Say so plainly" is not enough; a bare "X is unavailable" reads as a settled fact and gets filed as resolved. Frame it as your gap ("I couldn't find one — do you know?"), and never quietly rule out an option just because it costs money or needs a key. See `featuredesign.md` → "Pushback, don't drop".
- **Mark every agent-initiated omission / deferral / downgrade with ✂️** so the user can scan or Ctrl-F for it.
- **Report coverage, not a demo** — a matrix of every requirement Done/Partial/Missing/Cut; correctness verification (build/tests/runtime) is a separate section and never a substitute.

## "Go further" phrasing is a literal instruction, not filler

When a request includes phrasing like **"go above and beyond," "get creative," "surprise me," "don't take shortcuts," "make it unique," or "think beyond what I've said"** — every one of these is a real, literal instruction. Never treat them as decoration to nod at while doing the minimum.

Reason through what's actually being asked and deliver genuinely more than the literal words: research the topic like a domain professional would, add real adjacent functionality, make substantive creative choices. A token gesture does not satisfy this — this has been an explicit, repeated complaint (2026-07-21: "I keep asking you to try and think further ahead and you keep just giving me the literal bare minimum").

Concrete pattern to watch for: when a new feature has multiple natural entry points (a new data type, a new panel, a toggle), wire it into every place a user would reasonably expect to reach it from — not just the one place the request happened to describe. Example of getting this wrong: building a "Goals" feature only reachable from a Dashboard tab, when the obvious adjacent need (adjust it and see the calendar update immediately, no tab-switching) should have been built in from the start.

## UI feature contract

Three shipped bugs (2026-07-21, FitnessTracker Goals/Meals) all trace back to the same class of mistake — codifying it here so it doesn't recur:
- **Don't lock an open-ended value behind a fixed-preset `<select>`.** If a value could reasonably be anything (a distance, a quantity, a name), give free-text entry — presets can exist as optional quick-pick buttons alongside it, never as the only path in.
- **A toggle must do the thing it claims, in every mode it claims to affect** — not silently no-op unless some other unrelated mode/tab is also active. If a feature only works from one specific sub-state, that's a bug, not a shippable v1.
- **"More detail at this zoom level" must actually change size/detail**, not just container height. If Week/Day views exist as more-zoomed-in alternatives to Month, their content (icons, text, chips) needs to visibly scale up too, or the zoom levels are cosmetic and pointless.
- **A feature must be genuinely usable with zero prior data**, not just usable once history has accumulated. Don't gate a primary action (e.g. "accept and save") behind an auto-estimated value that silently stays null for a new user — always give a manual override.

## subagent spawning
when using subagents use haiku more often for simple-er tasks ONLY. user does not trust haiku's work unless the tasks are very cut-and-dry and/or sonnet or higher agent will be verifying work.

Make sure that if i ask you to spin up subagents that we have planned it thoroughly enough using a higher level agent so that haiku can't mess up any of the complicated logic/reasoning.
Haiku to parse the data, something smarter to understand it

When you delegate feature work, pass the full requirement checklist verbatim to each sub-agent, give each explicit per-requirement ownership, and audit every line against their actual output before reporting — scope is most often lost at the hand-off (see `featuredesign.md`).

### 🔴 NEVER RUN MORE THAN 2 SUBAGENTS AT ONCE. DEFAULT TO 1.

Trey, 2026-09-11, verbatim: **"DON'T EVER GO OVER 2 PARALELL AGENTS (2+YOU) UNLESS TOLD TO. AND
NORMALLY JUST STICK WITH 1 + YOU."**

He said it after ten Sonnet agents were spawned at once to author AFOQT reading passages. Two
separate problems, and the second is the one that bites:

1. It is more concurrency than he wants running against his account without being asked.
2. **The ten-way fan-out is what exhausted the session rate limit**, which killed eight of them
   mid-flight and lost about an hour of work. Spawning wide did not go faster — it went to zero.
   Two at a time would have finished.

**The rule:** one agent, wait, audit, launch the next. Two only when the tasks are genuinely
independent and each is short. Splitting a big job into many agent-sized batches is still correct;
running those batches *simultaneously* is not — queue them.

**If a job looks like it wants more parallelism, ask first** — say how many and why. Do not scale
up on your own judgement. That is the decision he took away, and it is not yours to take back.

### 🔴 A SUBAGENT'S WORK ONLY EXISTS ONCE IT IS ON DISK — write incrementally, always

**Trigger: every single time you spawn an agent that produces content.** Added 2026-09-11 after
ten parallel Sonnet agents authoring AFOQT reading passages were all killed mid-flight by one
session rate limit (`429 · resets 4:20pm`). Roughly an hour of work. **Three survived and seven
were lost, and the only difference was whether the agent had already written a file.** The
survivors had saved their output; the losers were composing in context, planning one big write at
the end. One died on the literal sentence *"Now I'll assemble the full file with all six
passages."* Everything it had written was in its context window, and the context window is gone.

Trey: *"that happens WAY WAY too often... it will be more efficient than losing an hr of parallel
agent everytime."* He is right, and the fix costs nothing.

**The rule, in every prompt that asks an agent to produce content:**

1. **Write to the real destination file after EACH unit of work** — each passage, each function,
   each section — never once at the end. This is also the cheapest option: no scratch copies, no
   serialisation, no extra tokens. The file you were going to write anyway, written six times
   instead of once.
2. **Every intermediate save must be syntactically valid**, so a half-finished file is still
   usable rather than a parse error. Close the array, close the export, and append into it next
   time. Partial-but-valid is recoverable; partial-and-broken is the same as nothing.
3. **Never hold a completed unit in context waiting for its siblings.** If unit 3 of 8 is done,
   unit 3 belongs on disk before unit 4 starts.
4. **Say this in the prompt explicitly.** Agents default to composing then writing; they will not
   do it unless told. One sentence — *"write your file after each item, keeping it valid at every
   step; do not batch the write to the end"* — is the whole intervention.

**On the parent's side:**

- **Land finished work as soon as it is verified.** Do not hold three clean batches waiting for
  the other seven. Integrate and commit what passes; the rest can follow.
- **Design the unit of delegation so partial delivery is worth something.** Ten agents each
  owning a self-contained file meant losing seven cost exactly seven files, not the whole job.
  One agent owning all of it would have lost everything.
- **Check the disk before believing a failure report.** A "failed" agent may well have written
  most or all of its output — one of the three survivors here reported failure and its file was
  complete and passed every check. Never re-run a batch without looking first.
- **The scratchpad is fine for throwaways, but content belongs at its destination.** A file the
  parent has to go find and move is one more place the work can be dropped.

## use haiku more often for simple file reads. use sonnet for responding logicially. 

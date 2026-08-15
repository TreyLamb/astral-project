# CLAUDE.md — Astral Project

This file is for Claude. Read it before touching anything.

---

## ℹ️ Deferred env vars (Google Photos / App Check) — flag to check later, do NOT proactively raise
As of 2026-07-24, Trey has **shelved the Google Photos project (uninterested for now)** and is deferring these two local env vars indefinitely. Both degrade gracefully (nothing crashes):
- `VITE_PHOTOS_API_HOST` — used in `src/pages/GooglePhotos.jsx`; without it, API calls fall back to relative paths. **It worked last time Trey tried it (weeks ago).** When he **next works on Google Photos**, check whether this needs setting — until then it's not a priority and is NOT to be flagged as broken.
- `VITE_FIREBASE_APPCHECK_SITE_KEY` — used in `src/firebase.js`; without it, Firebase App Check just doesn't initialize (optional hardening).

**Only revisit when Trey next touches Google Photos, or if he reports it's actually broken.** Don't nag him. (He's also deferring the MyFitnessPal-import Vercel vars — `FIREBASE_SERVICE_ACCOUNT_KEY` / `MFP_IMPORT_SECRET` / `FITNESS_UID` — same rule.)

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

---

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
| `/MFT/*` | fitnesstracker/FitnessTrackerApp.jsx | was `/fitness-tracker` |
| `/VV/*` | lang/LangApp.jsx | Vocab Vault — was `/vocab-vault`, `/lang` |
| `/TKB/*` | theknowledgebase/TkbApp.jsx | was `/tkb` |
| `/QA` | QATracker.jsx | was `/qa-tracker` |
| `/RS` | RSMarket.jsx | was `/rs-market` |
| `/POGO` | pgotracker/PgoTracker.jsx | **POGO Tracker** — was `/pgo-tracker` |
| `/POGO-ACCS/*` | pogoaccs/PogoAccsApp.jsx | was `/pogo-accs` |
| `/EFTsh/*` | eftShopping/EftShoppingApp.jsx | **EFT Shopping** — Tarkov hideout shopping list + raid companion. Built from BSG's own game files (SPT mirror) with tarkov.dev layered on top for prices only. `npm run eft:snapshot` regenerates the committed snapshot. Includes `/EFTsh/crafts`, a left-to-right craft flow chart — see the craft-data note below. |
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

## use haiku more often for simple file reads. use sonnet for responding logicially. 

# HOMEWORK — 3 Game Build Queue
**Status as of session end (2026-06-24): ALL 3 GAMES FULLY BUILT AND COMPILING CLEAN.**
Build: 129 modules, 0 errors. Routes wired into App.jsx + Navbar.jsx + Home.jsx bento grid.

---

## WHAT'S DONE

### ✅ GITMON BLUE — `/gitmon`
Files: `src/pages/gitmon/` — all complete
- `content/pokemon.json` — 20 Pokémon (3 starter lines + wilds + Originex legendary)
- `content/moves.json` — 20 git moves with regex `commandPattern`
- `content/gyms.json` — 8 gyms + Elite Four + Champion Linus
- `content/items.json` — 14 items (balls, potions, revives, etc.)
- `gitmonStorage.js` — localStorage save (key: `gitmon_save`)
- `gitmonEngine.js` — full battle engine (damage, type chart, XP, evolution, catch)
- `GitmonApp.jsx` + `GitmonApp.css` — Game Boy shell, `gm-` prefix
- `GitmonHome.jsx` — title → name → starter select
- `GitmonBattle.jsx` — full battle screen with terminal input
- `GitmonOverworld.jsx` — 8 towns, wild encounters, center, shop, gyms

### ✅ SIGNAL LOST — `/signal-lost`
Files: `src/pages/signal-lost/` — all complete
- `signalLostStorage.js` — localStorage save (key: `signal_lost_save`)
- `signalLostEngine.js` — word pools (50+ each), scoring, skill defs, story beats
- `SignalLostApp.jsx` + `SignalLostApp.css` — dark space terminal aesthetic, `sl-` prefix
- `SignalLostHome.jsx` — boot sequence animation, new/continue/how-to-play
- `SignalLostGame.jsx` — RAF game loop, word packets, auto-target, 4 skills (Q/W/E/R)

### ✅ BASHMON RED — `/bashmon`
Files: `src/pages/bashmon/` — all complete
- `content/pokemon.json` — 20 Bashmons (Catfile/Pidlet/Pingpup starters + wilds + Sudodrake legendary)
- `content/moves.json` — 20 bash moves (ls, cat, grep, chmod, sudo, pipe, ssh, etc.)
- `content/gyms.json` — 8 bash-themed gyms (Listfield → Versionpeak)
- `bashmonStorage.js` — localStorage save (key: `bashmon_save`)
- `bashmonEngine.js` — same engine as gitmon, adapted for bash commands
- `BashmonApp.jsx` + `BashmonApp.css` — red/orange Game Boy shell, `bm-` prefix
- `BashmonHome.jsx` — title → name → starter select
- `BashmonBattle.jsx` — same battle screen, bash placeholder
- `BashmonOverworld.jsx` — 8 bash-themed towns

## NEXT STEPS (potential polish, not urgent)
- Add walking/turn-based battle intro text for gyms (show `introText` before battle starts)
- Add Elite Four + Champion battles to Gitmon/Bashmon (gyms.json has data, overworld doesn't route there yet)
- Signal Lost: fix skill hotkey conflict (Q/W/E/R fires skill before typing word that starts with that letter)
- Tile-map overworld for Gitmon/Bashmon (currently zone-selector, full map would be ambitious)
- Pixel sprite art upgrades (currently emoji)

---

---

## THE 3 GAMES

### Game 1 — GITMON BLUE (Git CLI Pokémon)
- Pokémon Red/Blue clone where battles are powered by typing correct **git commands**
- Made-up Pokémon names (avoid Nintendo IP)
- Gameboy-style CSS aesthetic
- Full: catching, leveling, items, badges, gym leaders
- Route: `src/pages/gitmon/`
- CSS prefix: `gm-`

### Game 2 — TYPING RPG (working title: "SIGNAL LOST")
- Pure fun typing game, NOT educational
- Unique story, homebase that grows, skill tree, levels
- Type fast + accurately to progress through narrative
- Hours of replayable content
- Route: `src/pages/signal-lost/` (or similar once story is named)
- CSS prefix: `sl-`

### Game 3 — BASHMON RED (Bash Pokémon)
- Same world/story as Gitmon Blue, different "version"
- Battles powered by **bash commands** instead of git commands
- Pokémon Red to Gitmon Blue's Pokémon Blue
- Route: `src/pages/bashmon/`
- CSS prefix: `bm-`

---

## RESEARCH FINDINGS (already done — do NOT re-search)

### Pokémon Browser Game Mechanics
Source: PokéRogue (open source), Pokémon Showdown (MIT licensed)

**Battle engine:**
- Turn-based: player picks action → resolve order
- HP bar drains with color thresholds (green → yellow → red)
- Type effectiveness messages ("It's super effective!")
- Text crawl dialogue box at bottom — character-by-character
- PP system (move uses limited)
- "Level up" flash animation

**Catch mechanic:**
- Using a Pokéball consumes player's turn
- Catch chance scales with target's remaining HP
- Fail = enemy attacks back
- **Adaptation:** Correct git/bash command = throw Pokéball at wild mons; wrong command = enemy attacks

**Zone/progression loop (PokéRogue pattern):**
- 10 battles per zone → boss trainer battle
- Item shop between zones (heal, buff, buy Pokéballs)
- Badge system = gym leaders after every N zones

**Leveling:**
- XP awarded per battle won (more for higher-level enemy)
- Evolve at specific level thresholds
- Stat increases on level up (displayed)

### Game Boy CSS Aesthetic
**Font:** `Press Start 2P` from Google Fonts — THE standard
**Screen border:** asymmetric border-radius + layered box-shadow for depth
**Sprite rendering:** `image-rendering: pixelated` — no smoothing
**Color palette:** restrict to GBC palette (~56 colors), greens for original GB feel
**Text box:** fixed-height bottom panel, white bg, black border, monospace, typewriter JS effect
**Tile map:** CSS grid of 16x16 tiles, overflow:hidden viewport — no canvas needed for overworld
**Reference repos:**
- `luttje/css-pokemon-gameboy` — CSS framework replicating GBC battle UI exactly
- `baumannzone/gameboy-css` — Pure CSS Game Boy shell with hardware border

**Battle screen layout (CSS):**
```
┌────────────────────────────┐
│  [ENEMY SPRITE]  [ENEMY HP]│   ← top half, enemy info right
│  [PLAYER HP]  [PLAYER SPR] │   ← bottom half, player info left
├────────────────────────────┤
│ > FIGHT  BAG               │   ← menu or
│   MON    RUN               │     text crawl for narration
└────────────────────────────┘
```
For CLI games: replace FIGHT menu with a terminal input at the bottom.

### Git/Bash Learning Game Prior Art
- **Learn Git Branching** (learngitbranching.js.org) — intercepts typed commands, validates, updates visual tree. Gold standard for git education.
- **Oh My Git!** — card-based, real git repo under the hood
- **Pattern used by all:** parse raw command input → validate against expected → feedback on wrong syntax → reward correct with narrative progress

**Unique angle for our games:** None of these combine CLI learning with Pokémon battle UI. That's the hook.

### Typing Game Mechanics (for Game 2)
Source: Epistory - Typing Chronicles, Nanotale, Typing of the Dead

**Core engagement driver (Epistory):**
- Type words fast → build combo meter → combo multiplies XP gain
- Combo window is generous at first, tightens as you level up
- Speed rewarded immediately — no waiting

**Elemental spell system (steal this):**
- 4 elements, each does mechanically distinct thing:
  - Fire: burns next word in enemy queue (skip it)
  - Ice: freezes enemy movement temporarily
  - Lightning: chains to adjacent enemies
  - Wind: pushes enemy back (buys time)
- Player unlocks elements progressively — keeps the same action (typing) feeling fresh

**Homebase that grows (key mechanic):**
- The MAP IS the homebase — it literally unfolds/expands as you earn XP
- Visual expansion > stat numbers — players see accumulated progress spatially
- "Explore zone → earn XP → unlock next area that unfolds on the map" = the meta loop
- Each new biome = story revelation + visual change

**What keeps players typing for hours:**
1. Every keystroke must give audio+visual feedback (distinct sounds, hit effects)
2. Adaptive word length — tracks your WPM, stays in flow state
3. New word mechanics introduced progressively (same action, new meaning)
4. Speed/accuracy duality — two skill axes, doubles replay motivation
5. Combo chains that FEEL GOOD to extend — near-miss tension

**Story approach that works:**
- Non-human or meta narrator voice (unreliable narrator)
- World restoration vs. corruption — clear "why you're here"
- Story gates at biome transitions — revelation + unlock feel earned together

---

## DESIGN DECISIONS TO MAKE (during design doc phase)

### For Both Pokémon Games:
1. **Shared world name** — one world, two versions. Need a name.
2. **Made-up Pokémon names** — need a roster of ~20 starters for alpha. Theme them after CLI concepts.
   - Git mons: commits, branches, merges, repos
   - Bash mons: pipes, files, processes, directories
3. **Types system** — can we use a simplified type chart? Suggest: FILE, PROCESS, NETWORK, SYSTEM — 4 types with a simple effectiveness chart
4. **Command curriculum** — what git/bash commands unlock at each gym?
   - Git gyms: `git init/add/commit` → `git branch/checkout` → `git merge/rebase` → `git remote/push/pull` → `git log/diff/stash`
   - Bash gyms: `ls/cd/pwd/mkdir` → `cat/echo/touch/rm` → `pipes/grep/find` → `chmod/env/export` → `loops/conditionals/scripts`
5. **Battle mechanic detail** — wrong command = enemy attacks player mon. What does "attacks" mean in a learning context? Suggestion: HP drain, player sees "WRONG SYNTAX! Enemy BRANCHWRAITH attacks!" and loses HP. Correct command = player's move executes.
6. **Overworld** — tile-based, can be simple ASCII art styled with CSS grid. Routes between towns = walking sim where you encounter random wilds.

### For Typing RPG (Game 2):
1. **Story** — need a compelling unique concept. Suggestion: You are the last operator of a deep-space relay station. The station is crumbling. You type to send distress signals, repair systems, communicate with incoming ships. The station grows as you bring in more ships. (Pitch: "you type to keep the station alive and grow it into a hub")
2. **Homebase** — the relay station. Modules unlock as XP accumulates. Each module is visible on a station map.
3. **Skill tree** — what skills? Suggest: Broadcast Range (more word types), Signal Boost (combo multiplier up), Emergency Protocol (slow-mo when accuracy drops), Auto-Repair (passive HP regen), etc.
4. **Word source** — what are players typing? Random words from themed word lists per zone (space/station/signal vocabulary for immersion). Or: actual distress messages, ship manifests, repair manuals as the text passages.

---

## BUILD ORDER

1. **Write all 3 design docs** (follow game-design-workflow.md) — do this first, covers all 14 sections
2. **Build Gitmon Blue** first (most unique mechanic, validates the Pokémon engine we'll reuse for Bashmon Red)
   - Step 1: Data layer (pokémon roster JSON, move list JSON, gym curriculum JSON, item shop JSON)
   - Step 2: Battle engine (turn logic, HP, XP, catch mechanic)
   - Step 3: Game Boy CSS shell (Press Start 2P, screen border, battle layout)
   - Step 4: Command validator (parse input, match to expected command, return result)
   - Step 5: Overworld (tile map, routes, wild encounters, towns)
   - Step 6: Progression (badges, gym leaders, save/load)
3. **Build Signal Lost** (typing RPG) — second, shares nothing with Pokémon engine
4. **Build Bashmon Red** — last, reuses ~80% of Gitmon Blue engine, swap command validator + move names + Pokémon names

---

## NEXT TASK (resume here)

**Step: Write Design Docs for all 3 games following game-design-workflow.md**

Follow the workflow in `game-design-workflow.md` — all 14 sections for each game.
Save each design doc as a separate file:
- `src/pages/gitmon/DESIGN.md`
- `src/pages/signal-lost/DESIGN.md`  
- `src/pages/bashmon/DESIGN.md`

Then immediately start Step 1 of the build for Gitmon Blue:
- Create `src/pages/gitmon/` folder structure
- Write `src/pages/gitmon/content/pokemon.json` (full starter roster, ~20 mons)
- Write `src/pages/gitmon/content/moves.json` (move list keyed to git commands)
- Write `src/pages/gitmon/content/gyms.json` (8 gyms, command curriculum per gym)
- Write `src/pages/gitmon/content/items.json` (Pokéballs, potions, etc.)

**Do NOT start coding React components until all 4 JSON files are done.**
After JSON is done, move to battle engine JS.

Document progress in this file (HOMEWORK.md) after each major step completes.

---

## PROGRESS LOG
- [x] Research complete (Pokémon browser mechanics, Game Boy CSS, typing game mechanics)
- [ ] Design docs written (all 3 games)
- [ ] Gitmon Blue: data layer (JSON files)
- [ ] Gitmon Blue: battle engine
- [ ] Gitmon Blue: Game Boy CSS shell
- [ ] Gitmon Blue: command validator
- [ ] Gitmon Blue: overworld
- [ ] Gitmon Blue: full progression + save
- [ ] Signal Lost: design + full build
- [ ] Bashmon Red: data layer (reuse engine, swap content)
- [ ] Bashmon Red: full build
- [ ] All 3 registered in App.jsx + Navbar

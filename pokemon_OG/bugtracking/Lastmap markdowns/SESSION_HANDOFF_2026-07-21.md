# Pokered → 100% — Session Handoff (2026-07-21)

**Purpose:** hand the next AI agent everything needed to continue the "wire all of
pokemon_OG into the port until it's 100%" effort at full context — no re-discovery, no
repeated mistakes, no shortcuts. The owner has repeatedly emphasized: **prior agents cut
corners; do not.** If a quest/dialogue/mechanic is broken, missing, or unfinished, the owner
did NOT want it that way — fix it faithfully to OG. If it looks intentional/custom (especially
commented "user-requested"), leave it and flag it.

---

## 0. READ THIS FIRST — load order for a new agent
1. `src/pages/pokered_page/CLAUDE.md` — pokered rules, verified architecture facts, gotchas.
   (Auto-loads when cwd is the game folder. Also registers two skills.)
2. `POKERED_CHECKLIST.md` (this folder) — live implementation status. Check before assuming
   anything is done/not-done. Sync it after any status change.
3. This file — what's done this session + what's left + the plan.
4. The user's auto-memory `pokered-completion-roadmap` + `pokered-project` (recalled
   automatically) — the phased roadmap and OG data-format notes.
5. Full plan file: `C:\Users\PCT\.claude\plans\have-haiku-run-a-composed-pnueli.md`.
6. Skills now available (invoke, don't paste): **`pokered-fully-wire`** (wire/audit a map
   cluster), **`pokered-bug-sweep`** (prove a fixed bug class doesn't recur).

**OG source of truth:** `pokemon_OG/PokeRed_OG/` (read-only). A map's behavior spans up to 5
files: `data/maps/objects/<Map>.asm`, `data/events/hidden_events.asm`, `scripts/<Map>.asm`,
`text/<Map>.asm` (or `data/text/text_*.asm`), `data/maps/headers/<Map>.asm` + tileset tables.
**Never infer behavior from a name — trace the consuming function.**

---

## 1. THE PLAN (phased roadmap — owner-approved)
Foundations first, audio/animations last. Two decisions locked with the owner:
(1) build the shared event-flag + quest-gate spine before grinding regions; (2) audio + battle
animations ARE in scope for 100% but sequenced last (they're a GB-sound→web conversion project).

- **Phase 0 — foundations** ✅ (see §2)
- **Phase 1 — Pallet→Pewter** ✅ audited (see §2)
- **Phases 2-8 — region-by-region** via `pokered-fully-wire`, in story order. Partially done
  (see §3).
- **Phase 9 — legendaries, Victory Road, endgame/Hall of Fame, global regression**
- **Phase 10 — audio + battle animations**

Region clusters (run 3-5 maps at a time, inventory first): Pallet→Pewter ✅ · Route3/MtMoon/
Cerulean/R24-25/Bill 🔶 · R5-6/Vermilion/SS Anne/R11 ⬜ · R9-10/RockTunnel/Lavender/Pokémon
Tower 🔶 · R7/Celadon/Rocket Hideout/Erika ⬜ · R16-18/Fuchsia/Safari 🔶(Snorlax done) ·
Saffron/Silph Co/Dojo ⬜ · R12-15/R19-21/Seafoam/Cinnabar 🔶(fossils/trades done).

---

## 2. DONE THIS SESSION (with commits — all build-verified via `npx vite build`)
Current HEAD: **`855079c`**. Chain: `855079c → 821913a → 7a3ae66 → 6faa6f2 (contains Agent 2 +
the foundation) → …`. NOTE: the git history got rewritten mid-session (see §5) — the foundation
commit `7f71dc3` and Agent 2's work are folded into `6faa6f2`'s ancestry.

**Phase 0 — foundations (all done):**
- **0a Event-flag system** — 507 OG flags → `extracted_og_data/event_flags.json`; `EVENT_FLAGS`
  Set + `hasEvent/setEvent/clearEvent` (typo-guarded) in `pokeredGameState.js`. Was dead code
  before (zero callers); now the fossil/Snorlax/Fuji work consumes it. **Use these real OG flag
  names for all new story gates.**
- **0c Battle audit** — flinch, confusion (exact 40-power), high-crit, Focus Energy were ALREADY
  implemented (checklist was stale → corrected). **No battle code changed** (owner is "100%
  comfortable unless MISSING"). Refinements parked in `BATTLE_MECHANICS_CHANGE_PROPOSALS.md`
  (Proposals 1-4) — DO NOT apply without owner approval. `growth_rates.json` extracted but unwired.
- **0d Warp integrity** — all 799 scanned; warpIdx 100% clean. Dir-refinement of the 556 `dir:0`
  warps is a DELIBERATE conservative state (see `public/pokered/WARP_DIR_LEGEND.md`), NOT a blanket
  target — refine per-door during region passes.
- **0e Map reconcile** — 221 real maps present; the ONE genuinely-missing map is
  **`UNDERGROUND_PATH_ROUTE_7`** (Route 7 warps into it; also from UndergroundPathWestEast). The
  Silph elevator's dangling `UNUSED_MAP_ED` warps are OG-faithful (runtime floor-select).
- **0b Quest primitives** — folded into region phases (built at point-of-use).

**Phase 1 (Pallet→Pewter) — audited, matches OG.** Warps/NPCs/positions/story-gates (Oak's Parcel,
old-man catching tutorial, Viridian Gym 7-badge lock, Pewter→R3 badge-gate, Brock, Old Amber) all
correct. Genuine gaps closed / found: **Route 2 Gate Oak's Aide FLASH gift wired** (was unwired).
Minor open: Pallet flavor hidden-events (bookcases/posters); ¥50 museum fee not charged.

**Parallel agent work (recovered after a crash — see §5):**
- **Pokémon Tower chain (Agent 2)** ✅ in main: Silph Scope ghost-reveal (`ghostDisguise:
  !hasSilphScope()`), Ghost Marowak (Tower 6F, Lv30, uncatchable), Mr. Fuji rescue
  (`EVENT_RESCUED_MR_FUJI`, gated via `toggleable_objects.asm`) → Poké Flute
  (`EVENT_GOT_POKE_FLUTE`), **Snorlax** on R12/R16 (NPCs added to game_data.json, flute-wake → Lv30
  battle → despawn). Spot-checked OG-correct; **not yet playtested.**
- **Cinnabar fossils + trades (Agent 3)** ✅ `7a3ae66`: fossil revival DOME→KABUTO / HELIX→OMANYTE
  / OLD_AMBER→AERODACTYL @ Lv30 (correct base forms — NOT Kabutops/Omastar), all 9 real in-game
  trades from `data/events/trades.asm`. Party-auto-select ✂️ simplification (no party-menu UI).
- **Cerulean region (Agent 1 — was LOST, I redid it)** ✅ `821913a`: Rocket Thief hide-after-defeat;
  **Nugget granted BEFORE the recruiter battle** (`ROUTE_24:1`, was never wired); **corrected a
  false premise** — the Trashed House guards have NO event gate in OG (only the rival is toggled);
  the door-block is a COLLISION/geometry issue, not a story gate (guards kept hidden for
  passability + their real flavor text wired at CERULEAN_CITY:6/:11; door geometry flagged for a
  LIVE test). Bill/S.S. Ticket already wired.

**Tooling reorg** `855079c`: the pokered wiring prompts became **skills**
(`.claude/skills/pokered-fully-wire`, `pokered-bug-sweep`); the pokered CLAUDE.md moved to
`src/pages/pokered_page/CLAUDE.md` (auto-loads); `promptfreeclaude.md` folded in.

---

## 3. WHAT'S LEFT (prioritized)

### A. Verification debt (do this SOON — it gates confidence in everything above)
- **NOTHING from the story-chain work has been playtested.** All of it is build-verified +
  static OG-correctness spot-checks only. Run the app (`npm run dev`) and walk through: Snorlax
  flute-wake on R12/R16, Silph Scope ghost reveal + Ghost Marowak in Pokémon Tower, Fuji→Poké
  Flute, fossil revival at Cinnabar Lab, an in-game trade, the Cerulean Rocket hide + Nugget grant.
- **Trashed House door geometry** (`CERULEAN_CITY`, warp (27,11), guards (27,12)/(28,12)): confirm
  in a live playthrough whether the door is reachable with the guards SHOWN. If yes, un-hide them
  (restore OG); if not, it's a `.blk`/collision issue to fix. Currently guards are hidden as a
  passability workaround (honest, documented) — this is the one place a faithful fix is pending.

### B. Missing real maps / data
- **Convert `UNDERGROUND_PATH_ROUTE_7`** (Route 7 entrance building) into game_data.json — Route 7's
  warp to it currently dead-ends. Belongs to the Celadon/Route 7 cluster.

### C. Region wiring not yet done (use `pokered-fully-wire`, inventory first)
- **Route 3 / Mt Moon / Route 4 / Cerulean / R24-25** — deep DIALOGUE + ITEM audit still owed
  (Agent 1's R5 was lost; only the story beats were redone). NPC dialogue for these is mostly wired
  (npc_dialogue.json done through Cerulean), but verify each vs OG + hidden items.
- **R5-6 / Vermilion / SS Anne / R11** — Surge gym trash-can switch puzzle; Bike Voucher (Fan Club)
  → Bike Shop; SS Anne already has ticket-gate + Cut (verify).
- **R7 / Celadon / Rocket Hideout / Erika** — **Lift Key** (Rocket Hideout elevator gate),
  Giovanni (Hideout), **Silph Scope acquisition** (it's currently a plain ground item — confirm it
  reaches the player), **Eevee gift** (Celadon Mansion), vending/prize-corner real logic,
  Erika gym.
- **Fuchsia / Safari Zone** — **whole Safari Zone** (entrance fee, 500-step counter, Safari Balls,
  Gold Teeth → Warden → **Surf**, Strength from Warden), Koga gym, Move Deleter. (Snorlax on
  R16 already done.)
- **Saffron / Silph Co / Fighting Dojo** — **Card Key** (Silph door gates), Silph Co Giovanni →
  **Lapras gift** + **Master Ball**, Sabrina teleport-tile gym puzzle, **Hitmonlee/Hitmonchan**
  gift (Dojo), Saffron guard drink-gate (already done — verify).

### D. Phase 9 — legendaries + endgame
- Static encounters: **Zapdos** (Power Plant), **Articuno** (Seafoam B4F), **Moltres** (Victory
  Road 2F), **Mewtwo** (Cerulean Cave, post-E4) — build a shared static-encounter system.
- Victory Road boulder/Strength puzzles; verify E4 → Champion → Hall of Fame end-to-end with the
  flag system; open trainer-overworld bugs (walk-up anim, post-battle position, turn-to-face,
  LOS-through-walls, exclamation bubble).

### E. Phase 10 — audio + battle animations (largest, last; own sub-plan)
- Battle animations (`data/battle_anims/` + `gfx/battle/`) → web layer.
- Audio (`audio/`: 46 music + 323 SFX + cries) → web audio. Scope its own design doc first.

### F. Owner-decision items (parked — do NOT unilaterally apply)
- `BATTLE_MECHANICS_CHANGE_PROPOSALS.md` Proposals 1-4 (base-speed crit; per-species XP curves via
  `growth_rates.json`; Toxic escalation; ghost-battle "scared/get out" flavor text). Review with owner.

---

## 4. THE REUSABLE WIRING PATTERN (how to actually wire a region)
Templates: the `VIRIDIAN_CITY:6` fisherman block and `ROUTE_2_GATE:1` Oak's Aide block in
`PokeredOverworld.jsx` `startDialogue`.
- Dialogue/gift NPCs → special-cased in `startDialogue(npc)`, keyed `here === 'MAP_ID:npcIndex'`,
  npcIndex = 1-based index in the map's `npcs` array (= OG object_event order).
- One-time gift: `giftId = npcTrainerId(ms.mapId, npc)` (=`map:x:y`); gate on
  `pickedUpRef.current.has(giftId)`; grant via `onPickUpItem(giftId, ITEM)` + `.add(giftId)`.
- **Every specific TM/HM reward → grant the single `'HM06'` teach-any-move key item** (no
  individual TM/HM items exist). Give a Pokémon → reuse the Magikarp path (`handleBuyMagikarp` in
  PokeredApp.jsx + `createPlayerPokemon`) or Agent 3's fossil `onGiveFossil`/`onCollectFossilMon`.
- Caught-species count = `gameState.dex.caught` (array). Simple flavor → `SCRIPTED_NPC_TEXT`
  (~line 1802). `<PLAYER>` is substituted; use `POKÉMON` (É = U+00C9). Trainer battles resolve via
  `trainerClass`/`trainerParties.js` — don't re-wire; hide-after-beaten uses `beatenTrainers`.

---

## 5. CRITICAL LESSONS FROM THIS SESSION (don't repeat these)
- **Parallel subagents hit the session usage limit and the git history was rewritten underneath
  them** — two of three worktree agents were killed mid-work and their branches/worktrees deleted;
  one agent's work was fully lost (had to be redone from scratch). **If you fan out agents again:**
  (1) commit the foundation to main first so worktrees branch from it; (2) prefer NOT-in-background
  or check in frequently; (3) expect to merge sequentially + resolve additive conflicts yourself +
  build after each; (4) audit every agent's diff against OG before trusting it (an agent's build
  passing ≠ correct). Consider single-threaded if limits are tight — safer, no loss risk.
- **Trace OG, never assume — the port's own comments can be wrong.** The Trashed House comment
  claimed an "SS-Ticket guard swap"; OG has no such thing. My own agent brief said fossils revive
  to Kabutops/Omastar; OG revives base forms (Kabuto/Omanyte). Both caught only by reading the
  actual `.asm`.
- **Verify haiku/subagent claims against the filesystem.** A haiku agent wrongly reported OG script
  files "don't exist" (OaksLab.asm is 1232 lines). Use haiku only for cut-and-dry parsing; verify.
- **The checklist was stale in multiple places** (flinch/confusion/crit marked missing but done).
  Verify against actual code, correct the checklist, don't trust it blindly.

---

## 6. HOW TO RESUME (next concrete action)
1. `npm run dev` and **playtest the story-chain work** (§3.A) — highest priority; it's all unverified.
2. Then pick the next region cluster and invoke **`pokered-fully-wire`** on it (inventory first).
   Recommended next: finish the Cerulean-region dialogue/item audit (§3.C first bullet) OR start
   Celadon/Rocket Hideout (Lift Key + Silph Scope acquisition — high story value).
3. After each region: build (`npx vite build`), sync `POKERED_CHECKLIST.md`, commit, update this
   handoff doc's §2/§3.
4. Keep the owner's rules: no shortcuts, OG is truth, don't touch working battle mechanics, park
   intentional/custom code, mark every ✂️ omission.

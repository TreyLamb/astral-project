This is my Pokémon Red web port project. Before doing anything else:

1. Read `pokemon_OG/bugtracking/Lastmap markdowns/CLAUDE.md` first. It has the
   architecture rules, verified facts about the codebase, and known gotchas.
   Follow it exactly — don't re-derive things it already answers.

2. Check `POKERED_CHECKLIST.md` (same folder) for current status on whatever
   area I'm asking about. Don't assume something is done or not done without
   checking it.

3. `PokeRed_OG/` is the original disassembly — read-only, source of truth for
   how anything should behave. Never edit it, only reference it. If something
   seems missing or ambiguous, the answer is almost always "look harder in
   PokeRed_OG," not "build it from scratch" or guess.

4. Ignore `asvab_master_study_guide.md` in that folder — unrelated, not part
   of this project.

5. If my task below is "fully wire a map/map-cluster," also load
   `FULLY_WIRE_PROMPT.md` and follow its phases in order.
   If my task below is "sweep for a bug class" after a fix, also load
   `BUG_CLASS_SWEEP_PROMPT.md` and follow its phases in order.

6. After finishing anything that changes implementation status, update
   `POKERED_CHECKLIST.md` per the workflow rule already documented in
   CLAUDE.md (mark [ ] Claude when verified, leave [ ] You alone, correct any
   previously-inaccurate entries).

My task: [DESCRIBE TASK HERE]



We are auditing a React web port of the original Pokemon Red (Gen 1) disassembly. OG source of truth: pokemon_OG/PokeRed_OG/ (read-only reference, never edit). Web port source: src/pages/pokered_page/ (PokeredOverworld.jsx, PokeredApp.jsx, PokeredBattle.jsx, pokeredGameState.js) and src/pages/pokered_page/extracted_og_data/*.json (pre-extracted OG data — check here before concluding something is "missing," it may already be converted to JSON). Map/collision data: public/pokered/game_data.json. This is a read-only audit pass — do not propose code, do not write anything, just report findings with exact file:line citations on both sides (OG source and web port). Follow the methodology in pokemon_OG/bugtracking/Lastmap markdowns/FULLY_WIRE_PROMPT.md and BUG_CLASS_SWEEP_PROMPT.md (read both first) and the project conventions in pokemon_OG/bugtracking/Lastmap markdowns/CLAUDE.md — in particular: never infer behavior from a name (e.g. *_Coll tables are passable lists, not blocked lists); a map's behavior can span up to 5 separate OG source files (object-events, hidden_events.asm, scripts/, text/, header/tileset) so absence in one is not proof of absence overall; multi-file split data is the biggest source of wasted effort.
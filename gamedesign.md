---
name: game-builder
description: Use this skill whenever the user wants to build, design, iterate on, or "make me a game" for any purpose — educational (SQL, Python, C#, math, vocab, typing) or entertainment (tower defense, base-builder, puzzle, narrative). Triggers include "build me a game", "make a [subject] game", "I want to make a game for X", "iterate on my game", "the game isn't fun enough", and any interactive experience. Also triggers for ports across subjects or genres ("now do this for Python", "build the tower-defense version"). This skill prevents failure modes: shipping a checklist disguised as a game, unclear progression, dead ends, hard blockers, unintended dominance, feature creep, and pacing collapse.
---

# game-builder

A comprehensive skill for designing and building games (educational or entertainment) that are coherent, playable, and clear — so only unforeseen issues arise, not preventable design failures.

---

# Part 0: Layout and Presentation — Required for Every Game

## Full-page rule (non-negotiable)

Every game page MUST fill the entire viewport below the top navbar. The navbar is 70px tall. Games must use `height: calc(100vh - 70px)` (or equivalent flex fill) so zero screen space is wasted.

**Do NOT:**
- Use a fixed-width game "shell" (e.g., a 380px "Game Boy device" skin) that centers in the page and wastes >50% of the viewport
- Use `min-height: 100vh` and then center a small widget inside it
- Set font sizes below 14px for any readable game text (Press Start 2P at sub-14px is illegible)

**DO:**
- Have the game container fill all available vertical space
- Keep decorative themes (color palettes, borders, fonts) but never let them constrain game size
- Scale the UI to the viewport — battle fields expand, text boxes grow, sprites get bigger
- Treat the full viewport as the game canvas. Pokemon emulator reference: the game fills the screen, text is readable, sprites are clearly visible.

If a decorative skin (like a Game Boy device) makes the game unreadably small, remove the skin and keep the color theme instead.

---

# Part 1: Core Philosophy and Principles

## Design from the player outward

The fundamental rule: start with what the player should *feel, understand, and accomplish* at each stage. Every mechanic, mode, progression system, and UI element exists to serve that experience.

Never assume a feature is good because it's clever, trendy, or technically impressive. Every design decision must serve clarity, playability, and the player's ability to understand and meaningfully interact with the game.

A game is not finished when it has enough content. A game is finished when the player can understand what to do, why to do it, how to recover from mistakes, and how the systems respond to their actions in a way that feels fair and engaging.

## Priority ladder (when a choice forces a tradeoff)

1. **Clarity** — player knows what matters, what changed, what to do, why they failed
2. **Playability** — game functions without external explanation; rules and goals are legible
3. **Player agency** — player makes meaningful choices that matter
4. **Feedback** — game tells the player what their actions mean
5. **Pacing** — rhythm of intensity and release, variation, not monotone
6. **Balance** — challenge and reward feel fair
7. **Scope control** — what to cut, defer, or keep
8. **Polish** — animation, sound, visual flourish

**When you must choose:** if a choice improves spectacle but harms clarity, prefer clarity. If a feature increases complexity without strengthening the core loop, remove it. If a system cannot be explained, tested, or iterated on, it is too vague to rely on.

---

# Part 2: Deep Dives — Theory and Substance

## Clarity: What it means and why it matters

Clarity is not simplicity. A complex game can be clear. A simple game can be confusing. Clarity means the player always understands:

**What to do**
- The goal is legible without external explanation or tutorial text
- The player can look at the game and understand what action is available right now
- Example: in Pokémon, "throw a ball at the monster" is obvious from the visual, not hidden
- Counter-example: a button that does something mysterious until you try it and fail

**Why to do it**
- There's a clear motivation tied to game systems, not just "because I said so"
- The player understands how this action serves their progression or goal
- Example: "I catch this Pokémon because I'm building a team to defeat the gym leader"
- Counter-example: "I catch this Pokémon because the game makes me" (no motivation)

**What changed**
- When the player takes an action, the consequence is visible and directly connected to that action
- The feedback is immediate (< 1 second for most actions)
- Example: "I clicked attack, the enemy took damage, my health bar went down"
- Counter-example: the player clicks something and nothing visibly happens until 5 seconds later

**How to recover from mistakes**
- When the player fails, the path to retrying is obvious and fast
- Failure doesn't trap them in an unwinnable state
- Example: "I died, I can retry the boss in 2 seconds"
- Counter-example: "I died, now I'm back at the beginning of the 20-minute level"

**What they can do**
- The affordances (buttons, interactions, mechanics) are visible or intuitive
- The player doesn't need to guess what's clickable or what's possible
- Example: buttons are visually distinct, text fields look like text fields
- Counter-example: a crucial action hidden under a right-click or in a menu three levels deep

**For educational games specifically:**
- If a challenge tests a subject (SQL, Python, vocab), the game has taught that subject before the challenge
- Or the failure message is specific enough to guide the player toward the correct answer
- If a player fails, they should never feel confused about whether the construct is genuinely hard or the game failed to teach it

## Feedback loops: The engine of engagement

Every game has feedback loops. They are how the game tells the player what their actions mean and whether they're winning or losing.

### Positive feedback loops (success amplifies advantage)

Positive feedback creates momentum and the feeling of growth.

**How it works:**
- Player succeeds → gains advantage → succeeds more easily → gains more advantage
- Example: beat a monster → gain XP → level up → unlock new ability → beat harder monsters → gain more XP
- The more the player wins, the more power they accumulate

**Why it works:**
- Creates a feeling of growth and escalation
- Makes the player want to keep playing to see what they unlock
- Provides immediate reward for good play

**The risk:**
- Runaway wins become boring or unbeatable
- If the player is too strong, there's no challenge, and challenge is engagement
- This is why negative feedback exists

### Negative feedback loops (dominance gets limited, tension restored)

Negative feedback prevents one strategy from breaking the game and keeps all options viable.

**How it works:**
- Player discovers a "cheese" strategy that trivializes challenges → game gets harder or that strategy becomes less rewarding → player must adapt
- Example: if the player spams one cheap attack, enemies gain armor against it, forcing adaptation
- Or: if a player hoards a resource indefinitely, resource sinks appear that force spending

**Why it works:**
- Prevents one strategy from dominating forever
- Keeps multiple playstyles viable
- Maintains challenge when the player has learned the game

**How to implement:**
- Difficulty scales with player power (bosses have more HP if the player is stronger)
- Dominant strategies become less rewarding (enemies adapt, or the reward changes)
- Resource sinks prevent infinite accumulation
- Time pressure increases as the player gets faster

### Recovery mechanics (getting back on track after failure)

Recovery mechanics create forgiveness so failure is a learning loop, not a spiral into frustration.

**How it works:**
- Player loses a boss fight → run ends, but meta-progress (level, unlocked abilities) stays → restart with tools learned
- Failure costs something (time, resources, streak) but never makes the game unwinnable
- The player can always retry quickly

**Why it works:**
- Failure feels like a learning moment instead of punishment
- Players are willing to try again instead of rage-quitting
- Mistakes don't cascade into unwinnable states

**What to avoid:**
- Failure that takes 10+ minutes to recover from (player gets frustrated)
- Failure that costs permanent progress outside the current attempt (unfair)
- Failure with no feedback on what went wrong (player can't learn)

**What to implement:**
- Retry in < 10 seconds
- If the player loses, they lose the run, not the meta-progress
- If the player fails a challenge, they can retry immediately
- Hints are available (possibly with a cost) so the player always has a path forward

### Feedback loop implementation for your design doc

When designing a game, explicitly answer:

**Positive feedback:**
- When the player succeeds, what gets easier or more powerful?
- What unlocks as a reward?
- How does early success lead to later success?

**Negative feedback:**
- If the player finds a "cheese" strategy, how does the game adapt?
- Does difficulty scale with the player's power?
- Are there resource sinks that prevent infinite hoarding?
- Do multiple strategies feel viable, or does one dominate?

**Recovery:**
- When the player fails, what do they lose?
- Can they retry immediately, or is there friction?
- Does failure teach them something for the next attempt?
- Is failure ever permanent/unrecoverable (and if so, is that intentional)?

## Stakes: Why failure matters

Without stakes, victory is meaningless. Without meaningful loss, victory is just point accumulation.

### Types of stakes

**HP / lives**
- Wrong answers or bad moves chip away at a pool
- Run ends when depleted
- Example: SQL game, wrong query damages the player
- Effective for: skill-testing, combat-based games

**Time pressure**
- Countdown that escalates or extends
- Wrong actions accelerate it; right actions extend it
- Example: typing game, timer counts down as you type
- Effective for: speedrun, arcade-style games

**Streak / multiplier**
- Long streak grants bonus rewards
- One failure resets the multiplier (not the total score)
- Example: get 5 enemies in a row right → 2x XP multiplier; one wrong answer resets the multiplier
- Effective for: skill practice, habit formation

**Resource / currency**
- Limited consumables (hints, shields, potions) spent on attempts
- Earned on success
- Example: start each boss fight with 3 shields; wrong answer costs 1 shield
- Effective for: resource management, strategic decision-making

**Permadeath of run** (not meta-progress)
- Boss fights / dungeon runs lose run-specific progress if failed
- But overall level / meta-progress stays
- Example: SQL dungeon, lose the floor, restart the floor, but keep your level
- Effective for: roguelikes, replayability loops

**The critical rule: the stake must be felt**

If losing all HP just shows "Game Over" and the player restarts identically, the stake wasn't real. Failure should change the next attempt.

**Examples of weak stakes:**
- "You got 10 points instead of 15 points" — doesn't matter
- "You failed, try again" with no consequence — no tension

**Examples of real stakes:**
- "You died, restart the fight with one less hint"
- "You failed the mission, the boss gains armor until you succeed"
- "You ran out of time, the multiplier resets"

## Pacing: Rhythm of intensity and variation

Pacing is the rhythm of tension and release. A game that is always intense becomes exhausting. A game that is always calm becomes dull. Good pacing varies intensity in a controlled way.

### What pacing does

Pacing controls how the player *feels* over time. It alternates between:
- Challenge and relief
- Action and reflection
- Complexity and simplicity
- Certainty and discovery
- Pressure and safety

### Early game pacing (learning phase)

**Goals:**
- Teach the core mechanics clearly
- Let the player understand before escalating
- Build confidence, not frustration
- Make mistakes feel like learning opportunities

**How it works:**
- Challenges are steady and predictable
- Introduces one new concept at a time
- Each challenge builds on the last
- Mistakes are teaching moments, not punishments

**Example (SQL game):**
- Level 1: teach SELECT
- Level 2: teach WHERE
- Level 3: combine SELECT and WHERE
- Level 4: introduce JOIN but with heavy scaffolding (fill-in-blank with hints)
- Level 5: write a JOIN unaided

**Example (tower defense):**
- Wave 1: one type of enemy, player places towers
- Wave 2: same type, more enemies, player upgrades towers
- Wave 3: new enemy type, player experiments with counters
- Wave 4: boss with mixed types, player adapts strategy

### Mid game pacing (mastery phase)

**Goals:**
- Challenges build on each other; player is actively learning combinations
- Mix easy wins with harder challenges to maintain engagement
- Keep the player in flow state (challenge matches skill)

**How it works:**
- Variety increases (no two challenges are identical)
- Difficulty escalates gradually, with occasional plateaus
- Rewards become more meaningful (unlocks matter more)

**Example (SQL game):**
- 2 easy enemies (single table, simple WHERE)
- 1 tough boss (JOIN + multiple tables)
- 1 puzzle variant (write a query to get a specific shape)
- Repeat with harder constructs

**Example (tower defense):**
- Mix of waves: 1 easy, 1 medium, 1 hard, 1 puzzle (protect specific area)
- Each wave teaches something new (new enemy, new tower type, new constraint)

### Late game pacing (expertise phase)

**Goals:**
- Prevent monotony
- Players expect different things each encounter
- Let skilled players discover depth or speed-run

**How it works:**
- Intensity varies widely: calm exploration, sudden spike, recovery, new spike
- Challenges change format, not just difficulty
- Optional challenges for players seeking more
- No challenge is repeated identically

**Example (SQL game):**
- 1v1 combat (single monster, write one query)
- 1v3 swarm (three monsters, write queries to manage both)
- Time trial (write as many queries as possible in 60s)
- Puzzle variant (write one query that does something unusual)
- Boss with hidden mechanics (player must discover weakness)

**Example (tower defense):**
- Escort mission (protect a unit moving across the map)
- Endless wave (how long until you lose?)
- Resource-constrained (limited gold, must be strategic)
- Boss fight with phases (each phase changes the ruleset)

### Pacing red flags

- **Early game:** every level feels identical; player is bored before the halfway point
- **Mid game:** sudden difficulty spike that feels unfair; no telegraphing of new challenge type
- **Late game:** same challenge repeated 10 times; player knows exactly what to expect

## Balance: Effort and fairness

Balance is not just numbers. It is the relationship between challenge, reward, pacing, and player agency. A balanced game feels like it is asking for effort without becoming arbitrary or oppressive.

### The balancing philosophy

**Avoid both:**
- "One obvious best option" — every strategy is dominated by one choice
- "Everything is equally good" — no choices matter

**Aim for:**
- Multiple viable strategies, each with tradeoffs
- Challenge matched to player skill
- Rewards proportional to difficulty
- No runaway dominance

### What to balance

**Progression scaling**
- If a weapon/spell/query does 1000 damage on level 2, what does it do on level 90?
- Should be: "almost nothing" (scaling with enemy HP) or "refined to a specific niche" (good for one scenario, bad for others)
- Not: "still the best choice 88 levels later"

**Dominant strategies**
- Are there multiple viable approaches, or does one dominate?
- Example: in SQL, are players mostly writing SELECT only, or using WHERE/JOIN/GROUP BY?
- Example: in tower defense, are players using different tower types, or only one?
- If one dominates, that's boring and needs adjustment

**Difficulty curve**
- Does difficulty escalate gradually?
- Are there spikes, and are they intentional?
- Example: boss fights are harder than regular enemies (intentional spike)
- Example: sudden difficulty spike with no warning (unintentional, bad)

**Resource economy**
- Can the player accumulate unlimited currency/XP/hints, or are there gates?
- Example: unlimited money breaks the economy; add money sinks
- Example: unlimited hints breaks the learning; limit hints per challenge

**Fail state friction**
- If the player loses, how long until they retry?
- < 10 seconds: good
- > 30 seconds: player quits
- Example: boss fight loss → back to main menu → click "retry boss" → 3 seconds, you're retrying (good)
- Example: boss fight loss → you're back at the start of the 20-minute dungeon (bad)

### Balance testing approach

**Never assume balance theoretically.** Balance must be observed in play.

For your game, when you playtests, watch for:
- [ ] Do you ever feel overpowered?
- [ ] Do you ever feel helpless?
- [ ] Is there one obvious best strategy, or multiple viable options?
- [ ] Do fail states feel punishing or learning-based?
- [ ] Do you want to retry immediately, or do you feel frustrated?

## Scope control: What to cut, defer, and keep

Scope creep is one of the main reasons games become unstable, unfinished, or incoherent. Separate features into categories to prevent it.

### Feature categories

**Core features** — necessary for the game to function as intended
- The feature is essential to the experience
- Removing it breaks the game
- Example (SQL game): challenge runner, validator, progression engine, tutorial
- Example (tower defense): tower placement, enemy waves, resource management

**Supporting features** — helpful additions that reinforce the core loop
- Nice to have; strengthen the experience but aren't essential
- Example: hint system, daily challenge, cosmetics, leaderboard
- Example: visual effects, sound, animations

**Exotic features** — interesting ideas that are risky, expensive, or not essential
- Sounds cool but might not work
- Takes significant time with unclear payoff
- Example: procedurally generated challenges (fun idea, but complex to implement)
- Example: voice acting (nice but expensive; skip until the game is successful)
- Example: AI-generated challenges (risky; may produce nonsense)

### The rule

Do NOT let exotic features displace the core. If a feature does not strengthen the player experience or core loop, postpone it, simplify it, or delete it.

**For your design:**
- List 5–7 core features only
- List 3 supporting features
- Write down exotic ideas, but defer them until after the core is playable

## Progression: Structures and archetypes

### Progression archetypes (pick one as the spine)

**Linear gated**
- Stages unlock in order
- Each gate requires demonstrating a specific skill
- Example: tutorial → floor 1 → floor 2 → floor 3 → boss
- Best for: tutorial floors, story modes, structured curricula
- Risk: feels like a checklist if not varied

**Level + unlock**
- Player has a level number
- Each level unlocks something concrete (new mode, new ability, new area)
- Example: level 3 unlocks JOIN constructs, level 5 unlocks dungeon mode
- Best for: the main meta-progression spine
- Use in combination with linear gating

**Mastery thresholds**
- Player must hit a competence threshold (e.g., 5 wins with a query type) before harder content unlocks
- Example: must defeat 5 WHERE-only monsters before JOIN monsters appear
- Best for: subjects with discrete sub-skills
- Encourages spaced repetition; prevents skipping prerequisites

**Run-based meta-progression**
- Each playthrough is its own short game
- Meta-progress accumulates across runs (unlocks, permanent upgrades)
- Example: roguelike where each death restarts the dungeon but you keep your level
- Best for: roguelikes, replayability, variety
- Each run feels different because of randomness or loadout choices

**Open world**
- Player picks where to go
- Some areas are harder than others
- No forced path
- Best for: advanced players or post-tutorial sandbox
- Risk: new players get lost or overwhelmed

### Progression questions for your design

- What is the core progression spine (linear, level, mastery, run-based, open)?
- What unlocks at each tier?
- Is progression front-loaded (early game is fast) or evenly paced?
- Can the player feel stuck at any point, or is there always a path forward?

## Replayability hooks: Why the player comes back

A game with one source of motivation gets boring fast. Stack multiple hooks.

1. **Skill mastery** — getting visibly better at the underlying skill
   - The base motivation of all learning games
   - Necessary but not sufficient
   - Example: "I'm getting faster at writing queries"

2. **Collection** — gather monsters, cards, achievements, lore entries
   - The Pokédex motivator; completionist appeal
   - Example: "I want to find all 151 Pokémon"

3. **Progression** — visible character growth, unlocked abilities, expanded options
   - Each level or upgrade feels meaningful
   - Example: "I unlocked a new spell type"

4. **Narrative** — story chapters that unlock with play
   - Often the "hidden curriculum" trick (story makes the curriculum invisible)
   - Example: SQL Island, where survival = queries

5. **Score / leaderboard** — chase personal best or others' best
   - Works for solo if framed as "PB" (personal best)
   - Example: "My high score is 10,000; I want 15,000"

6. **Build / loadout** — choices the player makes that shape future play
   - Deck-builders, RPG character builds, tower loadouts
   - Example: "I built my towers defensively; should I try offensively?"

7. **Daily / streak** — habit formation through daily rewards
   - One daily challenge that changes each day
   - Streak multiplier (2x XP for 5-day streak, etc.)

8. **Exploration** — a world / map / dungeon with hidden areas
   - Optional paths that reward discovery
   - Example: "What's down that side corridor?"

9. **Time pressure** — speedrun mode for skilled players
   - After the main game, "beat it faster"
   - Example: "My best time is 15 minutes"

10. **Optional challenges** — bonus objectives that reward elegance
    - Example: "Solve this in fewer characters for bonus XP"
    - Example: "Beat this without using the JOIN construct"

**Rule of thumb:** the primary mode should have at least 2 hooks stacked. The full game should hit 4–5 across all modes.

## Wayfinding and progression clarity

The player must always understand where they are, what's next, and what's optional.

### Wayfinding principles

Good wayfinding uses the game itself to communicate, not just text or tutorials.

- **Clear landmarks** — distinctive areas that help memory ("the forest zone" vs "the swamp zone")
- **Visual contrast** — important paths look important; optional paths look optional
- **Logical layout** — spatial logic that players can learn and predict
- **Sightlines** — the player can see where they're going, or at least that there's something ahead
- **Repeated patterns** — consistent UI / layout so learning carries forward

### Progression clarity

The player should know:
- [ ] What's the main path vs. optional?
- [ ] What's locked and why?
- [ ] What will unlocking this give me?
- [ ] Am I making progress toward my goal?

### For text/RPG games specifically

Wayfinding works differently without a visual space:
- **Clear goal state** — the player knows what "winning" looks like
- **Current progress** — "I'm on chapter 3 of 5" or "I've solved 15 of 20 challenges"
- **Next milestone** — "Level up to unlock a new query type"
- **Optional content** — clearly marked as side quests, extras, bonuses

## Dead ends and hard blockers: Prevention

### Dead ends

A dead end is a path the player can enter with no meaningful exit except failure.

**Bad dead ends (waste time, break pacing):**
- A side quest with no rewards and no path back
- A floor you can enter but can't escape with any positive outcome
- A dialog branch that leads nowhere

**Good dead ends (reward exploration, teach something):**
- Hidden loot in a side corridor
- Secret narrative discovery
- Optional challenge that teaches a new strategy
- Lore drop that enriches the world

**Prevention:**
- For every path or area, ask: "Why would the player enter this?"
- If the answer is "by accident" or "no reason," delete it or add a reward

### Hard blockers

A hard blocker is when the player cannot proceed because a requirement is unclear, unavailable, or unfairly hidden.

**Examples:**
- A challenge that tests a construct the tutorial didn't teach
- A locked door with no hint where the key is
- A boss that requires a strategy the game never shows

**Why it's bad:**
- Especially dangerous when the player has invested time and can't recover cleanly
- Feels arbitrary and unfair
- Player stops playing

**Prevention:**
- [ ] Has the game taught every construct before testing it in a challenge?
- [ ] If progression stalls, is there an alternative path?
- [ ] When the player fails, can they retry immediately?
- [ ] Is there a way to understand what went wrong?

A blocker should feel like a deliberate gate (player must master SELECT before JOIN), not a design accident (oops, you can't do this and I didn't tell you why).

---

# Part 3: The Build Workflow

## Overview

The workflow is 6 steps. Do NOT skip steps or write code before the design doc is approved. The design doc takes 10 minutes and prevents 5 rounds of corrections.

---

## Step 1: Intake and intent clarification

Confirm the following before proceeding.

### Subject / scope

- What is the game? What is the player doing?
- What is the target learner level? (new player, intermediate, advanced, or age range?)
- What does mastery look like?

### Learning intent

**Is this an educational game** (designed to teach a subject: SQL, Python, vocab, math, typing)?
- OR an **entertainment game** (designed to be fun; any learning is accidental)?

Important: A game can be both. Educational games SHOULD always be entertaining.

### Secondary learning layer (ask both)

**Hidden curriculum — what will the player learn without realizing they're learning?**

Example (educational game): SQL game explicitly teaches queries, implicitly teaches database design thinking, normalization, data literacy.

Example (entertainment game): Pokémon explicitly teaches type strategy, implicitly teaches vocabulary (move names), cause-and-effect thinking.

This is the hidden curriculum. For educational games, it should be intentional. For entertainment games, it's a bonus.

### Pedagogy style (educational games only)

Is the curriculum **explicit** (tutorial teaches constructs, clear right/wrong feedback)?
- OR **discovery-based** (player learns by trying things, feedback is organic to story)?

Both approaches teach. They just use different mechanisms.

---

## Step 2: Design doc (required approval before code)

Deliver the complete design doc. Stop. Wait for explicit approval before continuing.

### Design doc: Section 2.1 — Game intent and experience

**Intended player experience (1 paragraph)**

Describe what it feels like to play this game. What does the player *feel* when they succeed? When they struggle? What hooks keep them coming back?

Examples:
- SQL game: "The player feels like a hacker discovering a secret database. Right answers feel clever. Wrong answers feel like a learning moment, not a punishment. Progressing to the next floor feels like real achievement. The risk of losing HP keeps it tense."
- Tower defense: "The player feels the rush of barely holding the line, then the satisfaction of a clean victory. Waves escalate in ways that feel fair, not cheap. Finding the right tower combination feels like discovery."
- Vocab game: "The player feels like they're uncovering secrets hidden in language. New words feel valuable, not arbitrary. Beating a challenge feels smart, not lucky."

This description is your north star. Every design decision should serve this feeling.

### Design doc: Section 2.2 — Core loop

**The 30s–2min repeating cycle (required)**

Write it as: `Player does X → game responds with Y → player gets Z → repeat with escalating W`

Examples:
- Pokémon: Player picks move → game animates battle → player deals damage or takes damage → repeat with stronger opponents and new types to learn
- CodeCombat: Player writes code → world executes it visibly → player gets level cleared or visible failure → repeat with new mechanic introduced
- SQL dungeon: Player types query → game validates and animates combat → player damages monster or takes damage → repeat until floor cleared

**Why this matters:**
- If the loop is weak (e.g., "answer 10 questions → see score"), the game is weak
- The loop determines whether the game is fun
- Everything else (progression, story, modes) supports this loop
- Fix a weak loop before proceeding

### Design doc: Section 2.3 — Clarity checklist

Before shipping, the player must understand:

- [ ] **What to do** — the goal is legible without external explanation
- [ ] **Why to do it** — there's a clear motivation (progression, story, collection, challenge)
- [ ] **What changed** — when they take an action, the consequence is visible and connected to the action
- [ ] **How to recover from mistakes** — when they fail, the path to retrying is obvious
- [ ] **What they can do** — affordances (buttons, interactions, mechanics) are visible or intuitive
- [ ] **Subject clarity (educational only)** — if testing a subject, the game taught it before the challenge

For each unchecked box, describe how the design will address it.

### Design doc: Section 2.4 — Game type / genre

**Which of these best describes the core?**

See the taxonomy in Part 4 below. If the game blends types (progression + base-builder + narrative), name the primary and secondary.

### Design doc: Section 2.5 — Modes and their purpose

List every mode. For each:

- **Name and purpose** — what distinct experience does this mode offer?
- **Why pick this mode?** — when would the player choose this over others at this exact moment?
- **Distinct from other modes?** — is the gameplay loop different, or just cosmetic?

**Kill or merge cosmetic duplicates:**
- "Campaign" and "Quick Play" with identical gameplay but different names → merge
- "Ranked" and "Casual" with the same rules → merge
- Two modes where the only difference is a button label → kill one

**Good distinct modes:**
- Tutorial: player learns incrementally, cannot skip, hints are free
- Campaign: story-driven, preset challenges, narrative unlocks
- Dungeon: floor-based combat, escalating, permadeath of run (not meta)
- Blitz: time pressure, scoring based on speed + correctness, no story
- Sandbox: any unlocked content in any order

### Design doc: Section 2.6 — Progression structure

**What unlocks, and when?**

Be explicit. "Players unlock things" is vague. "Level 3 grants access to JOIN queries and the Aggregate Swamp zone" is clear.

**Progression spine (pick one or combine):**
- **Linear gated** — stages unlock in order, each requires mastery (tutorial/story)
- **Level + unlock** — player level determines access; each tier unlocks new abilities or areas
- **Mastery thresholds** — player must win N times with a construct before harder content unlocks
- **Run-based meta** — each playthrough is self-contained; meta-progress accumulates across runs (roguelikes)
- **Open world** — player picks where to go, harder content is optional (post-tutorial sandbox)

### Design doc: Section 2.7 — Feedback loops

Every game has feedback loops. Design them explicitly.

**Positive feedback** (success amplifies advantage)
- When the player succeeds, what gets easier or more powerful?
- What unlocks as a reward?
- How does early success lead to later success?
- Example: beat monster → XP → level → unlock new query type → beat harder monsters

**Negative feedback** (dominance gets limited)
- If the player finds a "cheese" strategy, how does the game adapt?
- Does difficulty scale with player power?
- Are there resource sinks that prevent infinite hoarding?
- Do multiple strategies feel viable?
- Example: if player spams one attack, enemies gain armor against it

**Recovery** (forgiveness after failure)
- When the player fails, what do they lose?
- Can they retry immediately, or is there friction?
- Does failure teach them something for the next attempt?
- Example: lose a run, lose the run-specific progress, keep your level

### Design doc: Section 2.8 — Stakes

**What does the player lose on failure?** (Pick at least one)

- **HP / lives** — wrong answers chip away; run ends when depleted
- **Time pressure** — countdown; wrong actions accelerate it
- **Streak / multiplier** — long streak grants bonus; one failure resets multiplier
- **Resource** — limited consumables (hints, shields, potions) spent on attempts
- **Permadeath of run** — run-specific progress lost if failed (but not meta-progress)

**Critical rule: the stake must be felt**

If losing all HP just shows "Game Over" and the player restarts identically, the stake wasn't real. Failure should change the next attempt.

### Design doc: Section 2.9 — Pacing

**How does intensity vary from beginning to end?**

**Early game (learning phase):**
- Steady and predictable
- Introduces one challenge at a time
- Each challenge teaches something new
- Mistakes are learning moments, not punishments

**Mid game (mastery phase):**
- Variety increases
- Mix easy wins with harder challenges
- Rewards become more meaningful

**Late game (expertise phase):**
- Intensity varies widely
- Challenges change format, not just difficulty
- No challenge is repeated identically
- Optional challenges for players seeking more

Examples:
- SQL: Level 1 teaches SELECT, level 2 teaches WHERE, level 3 combines them, level 4 introduces JOIN with scaffolding
- Tower defense: easy wave, medium wave, hard wave, puzzle wave (protect specific area)

### Design doc: Section 2.10 — Balance considerations

**Progression scaling**
- If a weapon/spell/query does 1000 damage on level 2, what does it do on level 90?
- (Should be: "almost nothing" or "refined to a niche")

**Dominant strategies**
- Is there one obvious best option, or multiple viable paths?
- Do players feel forced into one playstyle?

**Difficulty curve**
- Does difficulty escalate gradually?
- Are there spikes, and are they intentional?

**Resource economy**
- Can the player accumulate unlimited currency/XP/hints?
- (If so, add gates)

**Fail state friction**
- If the player loses, how long until they retry?
- (Should be < 10 seconds)

### Design doc: Section 2.11 — Scope: Core vs. supporting vs. exotic

**Core features** (5–7 only)
- Example (SQL): challenge runner, validator, progression engine, tutorial, dungeon mode

**Supporting features** (3)
- Example: hint system, daily challenge, cosmetics

**Exotic features** (defer until after core is playable)
- Example: procedurally generated challenges, procedural monster names

### Design doc: Section 2.12 — Surprise feature

**If the user invited surprise features** ("surprise me", "build it however you want", "use your judgment"):

A surprise feature is required. It is ONE feature the design doc doesn't mention.

- Amplifies the core loop (doesn't bloat it)
- Is justified in one sentence
- Is something the user did not explicitly ask for

The user can veto it. But it must be proposed.

Examples:
- SQL game: "Boss puzzles every 5 levels where the player combines 3 query types in one statement to defeat a 'query dragon'"
- Tower defense: "Procedural modifier events ('fast enemies this wave' or 'enemies gain 2x HP') so no two waves feel identical"
- Vocab game: "Procedural mini-boss: a thief stealing vocab words; player must retrieve them by solving flashcard chains"

### Design doc: Section 2.13 — Architecture sketch

**REUSABLE layer** (write once, copy across games)
- Game shell, mode router, progression engine, persistence, UI components, hint system, results screen

**SUBJECT-SPECIFIC layer** (rewrite per game)
- Validation function, content database, tier definitions, hint generator, lore/copy

For your design, name the reusable pieces used (e.g., "using DungeonMode, XPBar, ProgressionEngine") and the subject-specific pieces (e.g., "SQLValidator, challengeDB.json").

See `references/architecture-template.md` for the full separation.

### Design doc: Section 2.14 — Test plan (what to watch for)

When you play the first mode, watch for:

**Clarity issues:**
- [ ] Do you know what to do without thinking?
- [ ] When you fail, do you know why?
- [ ] Are there moments where you're confused about what changed?

**Dead ends / hard blockers:**
- [ ] Can you get stuck with no way out except quit?
- [ ] Do challenges test something the game taught?
- [ ] Is failure recoverable (< 10 seconds)?

**Pacing:**
- [ ] Does early game feel steady, or chaotic?
- [ ] Do late-game encounters vary, or repeat identically?
- [ ] Are there moments where you feel bored, rushed, or lost?

**Balance / dominance:**
- [ ] Is there one obvious best strategy, or multiple paths?
- [ ] Do you feel overpowered or helpless?
- [ ] Do fail states feel punishing or learning-based?

**Feedback:**
- [ ] When you succeed, do you feel rewarded?
- [ ] When you fail, does the feedback tell you how to improve?
- [ ] Is the game's response to your action visible and immediate?

After playing, flag which of these need attention before building the next mode.

---

## Step 3: Reference extraction

When the user names other games, extract mechanics, don't describe the games.

For each named game, write two lines:
- Line 1: the one mechanic that makes it stick
- Line 2: how it adapts to this subject

Example:
- CodeCombat → mechanic: cannot skip a level without demonstrating the skill, no shortcut around mastery. Adapts to SQL: tutorial floor refuses to advance until the player writes the correct query unaided.
- Pokémon → mechanic: collection + escalating opponents that require evolving strategy. Adapts to SQL: monster bestiary tied to query types, harder monsters require JOINs / subqueries / window functions.

See `references/reference-games.md` for more.

---

## Step 4: Architecture sketch

Sketch the reusable/subject-specific separation. Mark each piece as REUSABLE or SUBJECT-SPECIFIC.

This is the contract that makes subject swaps cheap.

See `references/architecture-template.md` for the full file structure and config contract.

---

## Step 5: Build in stages with gates

Once design + architecture are approved:

1. **Data layer** — challenges, content, schema (structure matters more than polish)
2. **Core game loop, one mode end-to-end** — pick the mode that most demonstrates the core loop, build it fully playable
3. **Meta-progression layer** — XP, unlocks, persistence
4. **Remaining modes** — tutorial last
5. **Polish** — animation, sound, UI flourish, theming

After Step 5.2 (first playable mode): show it, get feedback, then proceed.

---

## Step 6: Approval gates

**Gate 1: Design doc approval**
- The design doc is complete
- You've approved it
- Only then does architecture happen

**Gate 2: Architecture approval**
- The architecture separation is clear
- Reusable and subject-specific layers are distinct
- Only then does code happen

**Gate 3: First playable mode feedback**
- One mode is fully playable
- You've played it
- You've flagged what needs fixing before expansion

**Exception: BUILD IT FAST mode**
- User says "build it fast" → skeleton only
- Deliver a playable core loop with zero polish
- Skip non-essential features
- Gates still apply to design doc (the design doc is non-negotiable)

---

# Part 4: Game type taxonomy

Use this to define what you're building. A game can blend types.

| Type | Input loop | Reward loop | Failure state | Progression | Best for |
|---|---|---|---|---|---|
| **Text-based RPG / Interactive Fiction** | Choices / text parsing | Story reveals, stat growth | Game over / dead end | Branching story or linear with stats | narrative-driven, puzzle discovery |
| **Puzzle game** | Solve constraints | Level cleared, new mechanics | Can't solve / time limit | Escalating complexity | logic, spatial reasoning, rhythm |
| **Tower defense** | Place towers / units | Waves cleared, resources | Enemies reach goal | Escalating enemy power | tactics, resource management |
| **Base-builder / Base management** | Place / upgrade buildings, send units | Economy grows, new buildings unlock | Base destroyed / can't afford upgrades | Unlock chains (tech trees) | progression, economy, long-term planning |
| **Idle / Incremental** | Click or passive gains | Exponential number growth | None (or soft reset) | Exponential unlocks | satisfying growth, minimal engagement |
| **Auto-battler** | Set up units before battle | Win encounter, recruit units | Battle lost | Unit collection + tier upgrades | strategy, team composition |
| **Roguelike / Roguelite** | Play and die / restart, carry meta-progress | Clear run / defeat boss, earn permanent upgrades | Death / restart | Run-based + permanent unlocks | replayability, variety |
| **Narrative RPG** | Dialogue, choices, combat | Story chapter unlocks, character growth | Story branch end (may vary) | Character progression + story | storytelling, agency |
| **Resource management** | Balance multiple inputs | Survive / reach goal | Run out of resource | Unlock new resource types | planning, economy |
| **Time management / Juggling** | Rapid input, context switching | Complete tasks, score multiplier | Fail all active tasks | Unlock new task types, speed up | reflex, multitasking |
| **Typing game** | Type fast + accurately | Accuracy score + speed score | Time runs out / accuracy too low | Harder words / longer passages | skill, muscle memory |
| **Match-3 / Puzzle blast** | Swap / match tiles | Cascade + multiplier combos | Run out of moves | Unlock new mechanics / tiles | reflex, pattern recognition |
| **Card battler / Deckbuilder** | Build deck, play cards in battle | Win duel, earn new cards | Deck depleted / lose duel | Card unlocks + synergies | strategy, deck construction |
| **Survival / Progression** | Gather resources, defend | Survive waves, grow base | Resources depleted, base destroyed | Unlock new buildings / defenses | long-term planning, economy |
| **Educational game** (any subject) | Input varies by subject (queries, code, vocab, etc.) | Subject mastery + game progression | Fail challenge / curriculum gate | Unlock new constructs / areas | teach a subject + entertain |

---

# Part 5: Anti-patterns

Do not commit these. They are the failure modes from past builds.

### 1. Empty XP / empty levels

**The failure:** XP accumulates, levels increment, but nothing unlocks.

**Fix:** Every level must unlock something concrete: new mode, new area, new ability, new content, or cosmetic.

**Smell test:** Describe the unlock without using "XP" or "level". If you can't, it's empty.

### 2. Modes that don't differ

**The failure:** Multiple modes with the same gameplay loop, differentiated only by cosmetic framing.

**Fix:** For each mode, write: "the player picks this when they want X, which no other mode offers." If two modes share the same answer, kill or merge.

**Smell test:** If a player's reason for choosing mode A over mode B is "different background", you have one mode wearing three hats.

### 3. Educational checklist disguised as game

**The failure:** Wrapping a quiz in game language (XP, levels, achievements) without adding actual game mechanics.

**Fix:** Add real game mechanics: damage, unlocks, collection, exploration, base-building, loadout/build choices.

**Smell test:** If you strip out the educational content, is there still a game? If no, you have a checklist.

### 4. Tutorial that doesn't teach incrementally

**The failure:** Tutorial throws all mechanics at once, or assumes base knowledge.

**Fix:** Each step introduces ONE new construct. First instance is heavily scaffolded. Player demonstrates mastery before advancing. Hints are free. Cannot skip ahead (CodeCombat rule).

**Smell test:** Could a player who has never seen the subject start at step 1 and reach the end without external resources? If no, the tutorial is misnamed.

### 5. Ignoring "surprise me"

**The failure:** When the user explicitly invites unrequested design, shipping only the literally-stated requirements.

**Fix:** Propose ONE feature the user didn't ask for. Justify in one sentence. Ship it. Let them veto.

**Smell test:** List shipped features. Cross out everything the user explicitly requested. Is there anything left? If no, the surprise feature is missing.

### 6. Listing references instead of extracting mechanics

**The failure:** When the user names other games, returning a research summary instead of mechanic extraction.

**Fix:** For each game, extract the one mechanic that makes it stick (one line) and adapt it to the subject (one line).

**Smell test:** Strip out the game names. Does what's left tell you what to build? If no, you wrote an encyclopedia entry.

### 7. Building before designing

**The failure:** Writing code as soon as the user says "make a game." No design doc.

**Fix:** The design doc takes 10 minutes and prevents 5 rounds of corrections.

**Smell test:** Was there a design doc the user approved before any code was written? If no, the workflow was skipped.

### 8. Shipping the whole game in one dump

**The failure:** Building a 1,500-line artifact in one turn. User cannot give useful feedback on a finished product.

**Fix:** Build one mode end-to-end first. Show it. Get feedback. Then expand.

**Smell test:** Was the user shown a playable slice and asked for feedback before the rest was built? If no, expect a near-total rebuild.

### 9. Dead ends without purpose

**The failure:** Player enters a path and cannot escape except by failure. Path teaches nothing, rewards nothing.

**Fix:** Every path must have a purpose: loot, narrative discovery, optional challenge, pacing control, or teaching.

**Smell test:** For every area/path/content: "Why would the player enter this?" If "by accident" or "no reason", delete it or add a reward.

### 10. Hard blockers

**The failure:** Player cannot proceed because a requirement is unclear, unavailable, or unfairly hidden.

**Fix:** Ensure requirements are communicated clearly, progression dependencies are visible, fail states are recoverable, player is never trapped without options (unless intentional).

**Smell test:** If the player fails, can they immediately understand why and what to try next? If not, it's a hard blocker.

---

# Part 6: What to cut and when to iterate

## Feature creep prevention

**When you are tempted to add a feature:**
1. Does it strengthen the core loop?
2. Is it core, supporting, or exotic?
3. If exotic, can it wait until the core is playable?

If the answer to #1 is no, cut it. If the answer to #2 is exotic and #3 is no, defer it.

## Iteration approach

**Do not wait for polish before playtesting.**

The earlier a problem is found, the cheaper it is to fix.

**Iterative design means:**
- Start rough
- Test quickly
- Watch real behavior
- Identify failure points
- Change one important thing at a time
- Repeat

**Do not overvalue the original idea.** A weak idea that survives testing is better than a beautiful idea that fails in play.

---

# Part 7: Solo playtesting (you as the player)

You will be the only player for most games. Use this checklist as you develop.

**After building the first mode, play it and watch for:**

### Clarity

- Do you know what to do without thinking?
- When you fail, do you know why?
- Are there moments where you're confused about what changed?
- Can you understand the rules just by playing?

### Dead ends / hard blockers

- Can you get stuck with no way out except quit?
- Do challenges test something the game taught you?
- Is failure recoverable (< 10 seconds)?

### Pacing

- Does early game feel steady or chaotic?
- Do late-game encounters vary or repeat identically?
- Are there moments where you feel bored, rushed, or lost?

### Balance / dominance

- Is there one obvious best strategy?
- Do you feel overpowered or helpless at any point?
- Do fail states feel punishing or learning-based?
- If you found a "cheese" strategy, did the game adapt?

### Feedback

- When you succeed, do you feel rewarded?
- When you fail, does the feedback tell you how to improve?
- Is the game's response to your action visible and immediate?

**After playing, flag which of these need attention.**

---

# Part 8: Subject-swap pattern

This skill targets games where gameplay reduces to "type a thing, get validated feedback."

The reusable game structure does not change across subjects. Only the subject-specific layer changes:
- Validation function
- Content database
- Tier definitions
- Hint generator
- Subject-themed lore/copy

Everything else (game shell, mode router, progression engine, meta-layer, UI components) is shared in `games/shared/`.

When porting to a new subject, this separation is what makes it genuinely copy-paste-and-swap, not a rebuild.

---

# Part 9: When to ask for clarification or approval

**Ask for clarification if:**
- The subject is too vague ("make me a game" with no subject)
- The target learner level is unclear
- The user hasn't answered the learning intent question
- The user is torn between two very different directions

**Ask for approval if:**
- The design doc is complete
- The architecture sketch is drawn
- The first mode is playable and needs feedback before expansion

**Do NOT ask for approval on:**
- Small iterations during Step 5
- Polish passes
- Subject-specific content (challenge database, hint copy, etc.)

---

# Part 10: The contract with the user

**You deliver:**
- Design doc that answers all 14 sections
- Architecture sketch showing reusable/subject-specific separation
- Playable modes in stages, with gates between stages
- Test plan flagged upfront
- All the substance from this skill applied, not skipped

**The user delivers:**
- Explicit approval on design doc before code
- Explicit approval on architecture before full build
- Feedback on first playable mode before expansion
- Clarification when the design doc asks for it

If both sides honor this contract, the game will be coherent and functional by the time it's "done".


Game Design Patterns
The toolkit. When designing a game in Step 2 of the workflow, draw from here.
The core game loop
Every game has a loop. The shorter and tighter it is, the more addictive. Define yours explicitly in the design doc.
Loop length guide:
30 seconds — arcade / blitz / single combat encounter
1–2 minutes — single mission / floor / chapter
5–10 minutes — full run / dungeon clear
Session-long — full chapter of story, multi-stage build
Most learning games should target the 30s–2min inner loop with longer meta-loops layered on top.
Loop template:
Player does X → game responds with Y → player gets Z → repeat with escalating W
Examples:
Pokémon battle loop: Player picks move → game animates outcome → player gets damage dealt or KO → repeat with stronger Pokémon
CodeCombat loop: Player writes code → world executes it visibly → player gets level cleared or visible failure → repeat with new mechanic introduced
SQL Quest dungeon (v2): Player types query → game validates and animates combat → player gets monster damaged or self damaged → repeat with harder monsters until floor cleared
Replayability hooks (pick at least two)
A game with one source of motivation gets boring fast. Stack them.
Skill mastery — getting visibly better at the underlying skill. The base motivation of all learning games. Necessary but not sufficient.
Collection — gather monsters, cards, achievements, lore entries, recipes. The Pokédex motivator.
Progression — visible character growth, unlocked abilities, expanded options.
Narrative — story chapters that unlock with play. Often the "hidden curriculum" trick from SQL Island.
Score / leaderboard — chase personal best or others' best. Works for solo if framed as "PB" not "global rank".
Build / loadout — choices the player makes that shape future play (deck-builders, RPG character build).
Daily / streak — habit formation through daily rewards.
Exploration — a world / map / dungeon with hidden areas.
Time pressure — speedrun mode for skilled players.
Optional challenges — bonus objectives that reward elegant solutions (CodeCombat's bonus for concise code).
Rule of thumb: the primary mode of the game should have at least 2 of these stacked. The full game should hit 4–5 across all its modes.
Progression archetypes
Pick one as the spine.
Linear gated
Stages unlock in order. Each gate requires demonstrating a specific skill. Classic Mario / CodeCombat / tutorial-style.
Best for: tutorial floors, story modes, structured curricula.
Level + unlock
Player has a level number. Each level unlocks something concrete (new mode, new ability, new area).
Best for: the main meta-progression spine. Use in combination with linear gating.
Mastery thresholds
The player must hit a competence threshold (e.g., 5 wins on a query type) before harder content unlocks. Spaced-repetition friendly.
Best for: subjects with discrete sub-skills (each SQL keyword, each Python construct).
Run-based meta-progression
Each playthrough is its own short game; meta-progression accumulates across runs. Roguelike / Slay the Spire pattern.
Best for: subjects where varying the inputs each run keeps the gameplay fresh.
Open world
Player picks where to go. Some areas are harder. No forced path.
Best for: advanced players or post-tutorial sandbox. Bad as the entire structure for a new learner.
Stakes (pick at least one)
Without stakes, victory is meaningless. Without meaningful loss, victory is just point accumulation.
HP / lives — wrong answers chip away at a life pool. Run ends when depleted.
Time — countdown that wrong answers accelerate or right answers extend.
Streak — long streak with multiplier; wrong answer resets the multiplier (not the score).
Resource — currency or consumable items (hints, shields, potions) spent on attempts or earned on success.
Permadeath of progress — boss fights / dungeon runs that, if failed, lose run-specific progress (but not meta-progress).
Rule: the stake must be felt. If losing all HP just shows a "Game Over" screen and the player restarts identically, the stake wasn't real. Failure should change the next attempt — fewer hints, smaller window, lost optional rewards.
Surprise feature catalog (for Step 2)
If the user invites surprise features, draw from here or invent your own. Each one is a candidate, not a default.
Boss puzzles — periodic encounters that require a multi-part query / sequence
Daily rotating challenge — one specific construct gets a 2x XP day
Anti-pattern bestiary — wrong-but-common queries are themselves enemies (the "SELECT *" goblin)
Loadout system — pre-run, pick 3 query types to "specialize in" for the run, getting bonuses but constrained options
Elegant solution bonus — bonus XP for solving in fewer characters / lines than the par
Speedrun ghost — your previous best run plays alongside you
Boss replay journal — defeated bosses become entries in a journal, showing the queries you used to beat them
Procedural mini-bosses — randomly generated query challenges that scale with player level
Quest log — small, optional side objectives ("defeat 5 enemies using only WHERE clauses")
Lore drops — story snippets unlocked by demonstrating constructs ("ancient text fragment, write a JOIN to translate it")
What not to copy from real games
Some real-game mechanics translate badly to learning games.
Lootboxes / gacha — wastes the player's time on chance instead of skill
Energy / wait timers — friction with no skill payoff; works for retention in commercial games but kills learning games
Pay-to-skip — never relevant; no skipping the curriculum
PvP / leaderboards with strangers — discourages beginners; if used, restrict to personal-best or friends-only
How to use this file
In the design doc (Step 2), explicitly cite which patterns the design draws from. If the design doesn't cite any, ask why — it's probably a quiz with cosmetics.
Reference Games — Extracted Mechanics
When the user names a game, do not list it. Extract the one mechanic that makes it stick and adapt it to the subject. Use this catalog as a starting point and add to it.
Format for each entry:
Mechanic — one sentence, the single thing
Why it works — one sentence, the psychology
Adapts to learning game as — one sentence
CodeCombat
Mechanic — split-screen: write code, run it, watch the character execute it; cannot skip a level without demonstrating the skill.
Why it works — immediate visual feedback couples typing to consequence; no shortcut around mastery means the player actually learns rather than memorizes solutions.
Adapts as — tutorial floors refuse to advance until the player writes the correct construct unaided; query execution shown as a visible action in the game world (spell cast, attack landing).
Pokémon (Game Boy era)
Mechanic — collection of 151 monsters, each tied to a type system that creates a strategy puzzle; escalating opponents force the player to expand the collection and evolve their team.
Why it works — collection drive plus a deepening strategy layer creates two motivation sources stacked on the same loop.
Adapts as — monster/enemy bestiary keyed to query types (the SELECT slime, the JOIN ogre, the subquery dragon); harder enemies require harder constructs, naturally pulling the player up the curriculum.
Querymon (Codepip)
Mechanic — Pokédex-style index of 151 monsters that the player searches by writing increasingly complex SELECT / WHERE / LIKE / aggregate queries.
Why it works — wraps query practice in a search-and-discovery loop with completionist appeal.
Adapts as — a "bestiary search" sub-mode where the player completes a collection by querying a database; orthogonal motivation to the combat mode.
Mavis Beacon Teaches Typing
Mechanic — multiple themed mini-games (racing, falling-words, etc.) wrap the same underlying skill (typing accuracy + speed) in completely different shells.
Why it works — the same drill feels fresh in different visual containers; players self-select the framing they like best.
Adapts as — multiple visual wrappers around the same query-input mechanic: arcade falling-asteroid mode, dungeon combat mode, gauntlet timed mode — same skill, different feel.
SQL Island
Mechanic — survival narrative where every progression step is a query: hungry? query for food. Lost? query for the path.
Why it works — story stakes attach to skill execution; the curriculum is hidden inside a plot.
Adapts as — chapter-based story mode where the next paragraph of the story only unlocks on a correct query; the curriculum is invisible from the player's perspective.
Pokémon Go
Mechanic — daily streak rewards + location-tied catches make the game a daily habit, not a weekend binge.
Why it works — habit formation through daily bonuses creates retention that pure skill-progression doesn't.
Adapts as — daily challenge with a streak multiplier; one specific query type that rotates daily and grants outsized XP.
Duolingo
Mechanic — heart system (limited mistakes per day) creates artificial scarcity and stakes around an otherwise free activity.
Why it works — stakes on a skill drill keep the player focused; running out forces a break that paradoxically increases engagement.
Adapts as — limited-attempt boss fights where wrong queries cost a "shield" or "potion"; running out ends the run, scoring the player on what they accomplished.
Idle / Incremental games (Cookie Clicker, etc.)
Mechanic — exponential unlocks where each tier of upgrade dramatically expands what the player can do, with the next tier always visible just out of reach.
Why it works — visible-but-unreachable next-tier rewards drive sustained engagement far longer than linear progression.
Adapts as — query types are upgrades the player visibly sees locked at low levels (JOINs visible but greyed out until level 5); seeing the locked construct creates pull.
Slay the Spire / deck-builders
Mechanic — run-based progression where each run builds a different "deck" of choices; meta-progression unlocks new options across runs.
Why it works — replayability through combinatorial choice; no two runs are the same.
Adapts as — "loadouts" the player builds before a dungeon run (you can prep with 5 SELECT spells and 2 JOIN bombs); decisions before the run, execution during it.
How to use this catalog
When designing a game in Step 2 (design doc), pick 2–3 mechanics from this list (or extract new ones) and explicitly state which ones the design is using. If the design isn't drawing from any of these or similar, that's a flag — the design is probably defaulting to "quiz with cosmetics".
Architecture Template
The reason a "SQL game" should make porting to a "Python game" or "C# game" easy is structural: separate the reusable game shell from the subject-specific data. If the separation is right, a subject swap is 4 file changes, not a rebuild.
The two layers
REUSABLE layer (write once, copy across subjects)
These pieces should work identically regardless of subject. They take subject-specific data as input and don't know what subject they're serving.
Game shell — outer container, navbar, mode router, results screen
Mode router / state machine — switching between Menu / Tutorial / Dungeon / Campaign / etc.
Progression engine — XP, levels, unlocks, computed from a config table
Persistence layer — localStorage save/load of player state
Challenge runner — takes a challenge object, renders input UI, awaits answer, calls validator, renders feedback
Combat / dungeon UI — HP bars, animations, monster portraits, turn flow (the visual layer)
UI primitives — buttons, panels, modals, results screens, level-up overlay
Hint system UI — the framework for "request hint → reveal next tier"
Streak / score tracking — generic counters with multiplier logic
Achievement framework — list of earned achievements, unlock notifications
SUBJECT-SPECIFIC layer (rewrite per subject)
These pieces change for every new subject. Everything else stays.
Validation function — given the player's input and the challenge's expected answer, return correct/incorrect. For SQL, runs the query and compares result sets. For Python, runs code against test cases. For vocab, normalizes and string-matches.
Content database — the challenges themselves. Question text, expected answer, accepted variants, tier, tags.
Tier definitions — what's a beginner / intermediate / advanced challenge for this subject. What constructs unlock at each level.
Hint generator — subject-specific tier-1 / tier-2 / tier-3 hints. Can be templated.
Subject lore / copy — monster names ("JOIN Ogre"), spell names ("cast SELECT"), tutorial story, mode names if themed.
Validator UI affordances — does the input need a SQL editor with syntax highlighting? A Python REPL? A plain text field? This stays subject-specific but uses the same input slot in the challenge runner.
Suggested file structure
src/
├── games/
│   ├── shared/                       # REUSABLE LAYER
│   │   ├── GameShell.jsx              # outer container, mode router
│   │   ├── ChallengeRunner.jsx        # generic challenge UI + flow
│   │   ├── ProgressionEngine.js       # XP, levels, unlock logic
│   │   ├── PersistenceStore.js        # localStorage wrapper
│   │   ├── ModesRegistry.js           # Tutorial / Dungeon / etc. registration
│   │   ├── modes/
│   │   │   ├── TutorialMode.jsx
│   │   │   ├── DungeonMode.jsx
│   │   │   ├── CampaignMode.jsx
│   │   │   └── BlitzMode.jsx
│   │   ├── components/
│   │   │   ├── HPBar.jsx
│   │   │   ├── XPBar.jsx
│   │   │   ├── LevelUpOverlay.jsx
│   │   │   ├── HintPanel.jsx
│   │   │   ├── ResultsScreen.jsx
│   │   │   ├── MonsterPortrait.jsx
│   │   │   └── ...
│   │   └── hooks/
│   │       ├── usePlayerState.js
│   │       └── useChallengeRunner.js
│   │
│   └── sql-quest/                    # SUBJECT-SPECIFIC LAYER (example)
│       ├── index.jsx                  # mounts GameShell with this subject's config
│       ├── config.js                  # tiers, unlocks, mode list for this subject
│       ├── validator.js               # runs queries, compares result sets
│       ├── content/
│       │   ├── challenges.json        # all challenges, tagged by tier + construct
│       │   ├── monsters.json          # subject-themed monster bestiary
│       │   ├── tutorial.json          # tutorial steps
│       │   └── lore.json              # subject-themed copy strings
│       └── hints.js                   # subject-specific hint generator
│
└── games/python-game/                # NEXT SUBJECT — same shape
├── index.jsx
├── config.js
├── validator.js                   # runs code via Pyodide, compares to test cases
├── content/
│   └── ...
└── hints.js
The contract
The subject-specific config.js is the contract between the reusable shell and the subject. It exports a config object the shell consumes.
js// games/sql-quest/config.js
export default {
subjectName: "SQL",
tiers: [
{ id: "beginner",  unlocks: ["SELECT", "WHERE"],            requiredLevel: 1 },
{ id: "intermediate", unlocks: ["JOIN", "GROUP BY", "ORDER BY"], requiredLevel: 3 },
{ id: "advanced",  unlocks: ["subqueries", "window functions"],  requiredLevel: 6 },
],
modes: ["tutorial", "dungeon", "campaign", "blitz"],
// The two functions the shell calls into subject-specific code:
validator: validateSqlQuery,           // (playerInput, challenge) => { correct, feedback }
hintGenerator: generateSqlHint,        // (challenge, tier) => hintString
// Theming
monsterNames: ["SELECT Slime", "WHERE Wraith", "JOIN Ogre", ...],
spellLabel: "Query",                   // "cast Query" instead of "cast Spell"
inputComponent: SqlInputBox,           // the subject-specific input affordance
};
When porting to Python, the shape stays the same; only the values and validator change:
js// games/python-game/config.js
export default {
subjectName: "Python",
tiers: [
{ id: "beginner", unlocks: ["print", "variables", "if"], requiredLevel: 1 },
{ id: "intermediate", unlocks: ["loops", "functions", "lists"], requiredLevel: 3 },
{ id: "advanced", unlocks: ["classes", "comprehensions", "decorators"], requiredLevel: 6 },
],
modes: ["tutorial", "dungeon", "campaign", "blitz"],
validator: validatePythonCode,         // runs Pyodide, checks test cases
hintGenerator: generatePythonHint,
monsterNames: ["Print Slime", "Loop Wraith", "Class Ogre", ...],
spellLabel: "Script",
inputComponent: PythonInputBox,
};
The shell, modes, UI components, persistence, progression — all unchanged.
When the contract leaks
If, while building a new subject, you find yourself needing to modify files in games/shared/ — stop. Either:
a) The new requirement should be folded into the config interface (add a config option, not a hardcoded subject check), or
b) The shared layer is genuinely missing a feature and adding it benefits all subjects.
Subject-specific logic in games/shared/ is a contract leak and erodes the whole point of the separation. Catch it before it spreads.
What to commit to memory
The two-layer separation. Any time you build, ask: "is this shared or subject-specific?" Anything subject-specific goes in the subject folder. Anything shared goes in shared. This single discipline is what
Anti-Patterns — Don't Ship These
The catalog of failure modes, with concrete examples from past builds. Pattern-match against these BEFORE shipping anything. If any of these apply, fix before shipping.

Empty XP / empty levels

The failure — XP accumulates, levels increment, but leveling up doesn't unlock anything concrete. The player has no reason to care about the number going up.
Concrete example from the SQL Quest v1 build:
Tracked XP per challenge.
Showed "Level 3" on the player card.
Nothing different happened at Level 3 than Level 1. Same modes, same challenges, same UI.
Result: the user immediately called it out — "what's the point of XP, what's the point of levels."
The fix — every level (or every few levels) must unlock something concrete:
A new mode
A new area / floor / zone
A new ability / spell / construct (a new query type usable in combat)
A new piece of content (a new monster, a new story chapter)
A new cosmetic (acceptable as a tertiary unlock, not the only one)
The smell test — describe the unlock without using the word "XP" or "level". If you can't, it's empty.

Modes that don't differ

The failure — multiple modes that share the same gameplay loop, differentiated only by cosmetic framing or framing words like "Campaign" vs "Quick Play".
Concrete example from the SQL Quest v1 build:
"Campaign" mode: work through challenges sequentially.
"Quick Play" mode: do challenges with no time pressure.
"Blitz" mode: do challenges with a 90s timer.
Campaign and Quick Play were functionally identical. Blitz was actually distinct (added stakes via time).
Result: the user said the game wasn't a game yet.
The fix — for each mode, write one sentence: "the player picks this mode when they want X, which no other mode offers." If two modes share the same answer, kill or merge them.
The smell test — show me three modes. If a player explains why they're choosing mode A over mode B, and the reason is "I want a different background" or "I want a different timer length", you have one mode wearing three hats.

Educational checklist disguised as game

The failure — wrapping a quiz in game language (XP, levels, achievements) without adding any actual game mechanics. The gameplay is "answer question, get point."
Concrete example from the SQL Quest v1 build:
Player answered SQL questions.
Right answer awarded XP.
Wrong answer did nothing except not award XP.
A city skyline drew itself in the background as the player progressed.
This was a quiz with a skyline. Not a game.
The fix — add real game mechanics, not language:
Damage — wrong answers cost something tangible (HP, lives, time, currency)
Unlocks — right answers grant new capability, not just points
Collection — accumulate monsters / artifacts / cards / something
Exploration — a map / dungeon / world to move through
Base-building — something the player constructs and returns to
Loadout / build — choices the player makes about how to approach a challenge
The v2 rebuild fixed this by making the Dungeon mode where wrong answers damaged the player and right answers damaged the monster — actual stakes.
The smell test — if you strip out the educational content (replace SQL questions with "tap the button"), is there still a game? If the answer is no, you have a checklist.

Tutorial that doesn't teach incrementally

The failure — the tutorial throws all mechanics at the player at once, or it's "beginner" challenges that still assume base knowledge.
Concrete example from the SQL Quest v1 build:
Beginner difficulty: 8 challenges across SELECT, WHERE, fill-blank, multiple choice, write-the-query, debug-this.
A genuine beginner couldn't pass any of them because they hadn't been taught what a SELECT statement looks like first.
The user explicitly said: "I don't know how to do queries that well. I'm just gonna fail ten out of ten."
The fix — tutorial structure:
Each step introduces ONE new construct.
The first instance of any construct is heavily scaffolded (fill-in-blank with one missing word, or keyword-chip buttons that build the query for the player).
The player demonstrates mastery (writes it unaided once) before the tutorial advances.
Hints are free in the tutorial. No XP cost for help.
The player cannot skip ahead. The CodeCombat rule.
The smell test — could a player who has never seen SQL (or Python, or whatever the subject is) start at step 1 and reach the end of the tutorial without external resources? If no, the tutorial is misnamed.

Ignoring "surprise me"

The failure — when the user explicitly invites unrequested design ("surprise me", "build it however you want", "make it fun", "use your judgment"), shipping only the literally-stated requirements.
Concrete example from the SQL Quest v1 build:
User said: "I want you to fully have all autonomy with this... think about all these things as if you're designing this game... add features that are gonna surprise me, not just things that I'm just saying."
Shipped: exactly the requested modes (Campaign, Quick/Blitz), exactly the requested challenge types (fill-blank, multiple choice, write-query, debug, read), nothing beyond.
Missing: any feature the user hadn't named. No collection, no meta-layer, no story, no dungeon, no loadout — until the user pointed out the gap.
The fix — when invited, propose ONE feature the user did not ask for. Justify in one sentence why it amplifies the core loop. Ship it. Let them veto if they don't want it, but the proposal must be made.
The smell test — list the features in the shipped game. Cross out everything the user explicitly requested. Is there anything left? If no, the surprise feature is missing.

Listing references instead of extracting from them

The failure — when the user names other games, returning a research summary instead of an extraction.
Concrete example from the SQL Quest v1 build:
User said: "reference what already exists... Mavis Beacon. There's other games like Khan Academy, Code Combat... do some research, pull from different things."
Delivered: a paragraph each on Querymon, SQL Island, SQL Squid Game, SQL Police Department, Lost at SQL, CodeCombat.
Missing: what specifically to steal from each. The paragraphs described the games. They did not extract mechanics.
The fix — for each named game, write two lines:
Line 1: the one mechanic that makes it stick.
Line 2: how it adapts to the current subject.
See reference-games.md for the format.
The smell test — strip out the game names from the research section. Does what's left tell you what to build? If no, you wrote an encyclopedia entry, not extraction.

Dead ends without purpose

The failure — the player enters a path and cannot escape except by failure. The path teaches nothing, rewards nothing, and wastes time.
Concrete example from game design:
A side quest with no rewards and no exit
A floor you enter but can't escape with any meaningful outcome
A dialog branch that leads nowhere
The fix — every path must have a purpose:
Loot or reward
Narrative discovery / environmental storytelling
Optional challenge
Pacing control
Teaching something useful
If a path doesn't serve one of these, it's a mistake. Delete it.
The smell test — for every area, path, or side content: "Why would the player enter this?" If the answer is "by accident" or "no reason," it's a dead end without purpose.

Hard blockers

The failure — the player cannot proceed because a requirement is unclear, unavailable, or unfairly hidden.
Concrete example from game design:
A challenge that tests a construct the tutorial didn't teach
A locked door with no hint where the key is
A boss that requires a strategy the game never shows
Why it's bad — especially dangerous when the player has already invested time and cannot recover cleanly. Feels arbitrary and unfair.
The fix — ensure:
Requirements are communicated clearly
Progression dependencies are visible or learnable
Fail states are recoverable (player can retry without restarting the entire game)
Player is never trapped without options (unless that's the intentional design)
A blocker should feel like a deliberate gate, not a design accident.
The smell test — if the player fails a challenge, can they immediately understand why and what to try next? If not, it's a hard blocker.

Building before designing

The failure — writing React code as soon as the user says "make a game." No design doc. No architecture sketch. The build is reactive to whatever the user says next, never proactive.
Concrete example from the SQL Quest v1 build:
User said "build this game out however you want."
Immediately wrote the React artifact. No design doc. No architecture. No reference extraction.
Shipped a checklist disguised as a game (anti-pattern #3).
6+ rounds of corrections followed.
The fix — the design doc takes 10 minutes and prevents 5 rounds of corrections. The user is not asking for code on turn 1 — they are asking for a game. The path to a game is design first.
The smell test — for every game build, was there a design doc the user approved before any code was written? If no, the workflow was skipped.

Shipping the whole game in one dump

The failure — building a 1,500-line artifact in a single turn. The user cannot give useful feedback on a finished product; they can only give useful feedback on pieces as they're built.
Concrete example from the SQL Quest v1 build:
Built the entire game (three modes, challenge generation, XP, hint system, skyline animation) in one shot.
User feedback was about the whole game ("it's like 10% of what I was thinking"), which forced a near-total rebuild.
The fix — build one mode end-to-end first. Show it. Get feedback. Then add the next layer. The user's feedback after seeing one mode is far more actionable than their feedback on a finished game.
The smell test — was the user shown a playable slice and asked for feedback before the rest of the game was built? If no, expect a near-total rebuild on first feedback.

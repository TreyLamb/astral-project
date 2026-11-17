---
name: council
description: Convene a real multi-agent Council / Tree of Thoughts (ToT) deliberation on an important decision or hard problem. Use whenever the user says "council", "convene the council", "ToT", "tree of thoughts", "war-game this", "devil's advocate this", or asks for multiple agents to debate something. Spawns separate subagents with different mandates, runs independent positions, then cross-examination, a devil's-advocate attack and targeted investigation, then synthesizes a decision. Invoking this skill IS the user's explicit request to spawn subagents.
---

# The Council (with Tree of Thoughts)

> **Copies of this skill: keep them identical.** This file exists in two places:
> 1. `C:\Users\clown\.claude\skills\council\SKILL.md` (user-level, the canonical copy; loads in every Claude Code session on this PC, including the C: and H: drives)
> 2. `C:\Users\clown\projects\astral-project\.claude\skills\council\SKILL.md` (project copy, committed to git so web/cloud sessions and other machines have it)
>
> If you edit one, apply the same edit to the other in the same session and tell the user you did. If either path has moved, update this list.

The user calls the Council only for decisions that matter. A shallow pass is a failure, even if it looks tidy.
The user needs to trust three things:
1. **Separate agents actually ran.** Do not roleplay a panel in your own head.
2. **They argued with each other.** Each agent saw the others' positions and tried to break them.
3. **Someone went looking for the problem nobody wanted to find.**

Invoking this skill is explicit authorization to spawn subagents with the Agent tool, as many as the protocol below calls for. Do not ask permission again, and do not shrink the council to save tokens unless the user asked for a "quick" council.

## Non-negotiables

- **Real subagents.** Every seat is its own `Agent` call.
  - **If you are yourself a subagent** and have no Agent tool, do NOT simulate. Stop and tell your parent: "Council requested; I can't spawn agents as a subagent. Convene it from the main session."
  - **If you are the main agent** and cannot spawn agents in this environment (for example a claude.ai chat), say so up front. Then run the protocol single-agent and label the output **SIMULATED COUNCIL: lower confidence**.
- **Cold-start briefing.** Subagents know nothing about this conversation. Every seat gets the full Brief from Phase 0, not a one-line summary.
- **Independence first.** Round 1 runs in parallel, and no seat sees another's work. This prevents anchoring.
- **Evidence over opinion.** Seats investigate: they read the code or files, search, run things, and check numbers. A position without evidence is marked as such.
- **A devil's advocate always sits, and it cannot be soft.** Its job is to make the leading option lose. "Overall this looks good" from the devil's advocate is a failed round. Re-prompt it.
- **You are the chair, not a member.** Do not form or state your own conclusion until synthesis.
- **Dissent survives.** Unresolved disagreement goes in the final report. It is never smoothed into false consensus.
- **Keep a record.** Write the transcript to a file (see Record below).

## Phase 0: Frame (do this yourself before spawning anyone)

1. Gather the context. Reread the conversation, and read the relevant files, code, docs and prior decisions. The Council is only as good as the Brief.
2. If the question is ambiguous in a way that would change the answer, ask the user **once**, briefly, before spending the effort. Otherwise proceed.
3. Write the **Brief**. Every seat receives it verbatim:

```
QUESTION: <the actual decision or problem, one or two sentences>
WHY IT MATTERS: <stakes, what goes wrong if we get this wrong>
CONTEXT: <everything relevant: background, current state, file paths, prior attempts and why they failed>
CONSTRAINTS: <hard limits: budget, time, tech, people, non-negotiables the user stated>
WHAT A GOOD ANSWER LOOKS LIKE: <the deliverable: a choice, a plan, a diagnosis, a go/no-go>
KNOWN UNKNOWNS: <what we already know we don't know>
```

## Phase 1: Choose mode and seats

**Mode:**
- **Council.** The problem needs divergent *perspectives*: strategy, risk, trade-offs across domains or stakeholders.
- **ToT.** The problem needs divergent *solution paths* explored to depth: architecture, debugging, planning, "how do we do X".
- **Both (default for big decisions).** Seats generate and attack branches.

If the user said "ToT" or "Council", honor it. Otherwise pick one and state why in one line.

**Seats (4 to 6).** Tailor them to the problem. Generic seats like "performance expert" and "security expert" are only right when the problem is about those things. Always include:
- **Devil's Advocate / Red Team.** Attacks whatever is currently winning.
- **Pre-mortem.** "It's 6 months later and this failed. Why?" Works backward from failure.

Then add 2 to 4 seats from the problem's real tension lines. Examples:
- A **First-principles** seat ignores how it's usually done and rebuilds from fundamentals.
- A **Pragmatist / Operator** seat asks what is cheapest and fastest to ship and maintain, and who carries the burden.
- A **Domain specialist** seat covers the specific field in play: legal, finance, UX, infra, the specific library.
- A **Stakeholder** seat speaks as the end user, customer, future maintainer, or the user's future self.
- A **Contrarian-option** seat builds the strongest case for the option nobody is considering, including "do nothing".
- An **Evidence auditor** seat checks every factual claim the others make.

Use the strongest available model for seats (for example `model: "opus"`) unless the user says otherwise.

## Phase 2: Round 1, independent positions (parallel)

Spawn all seats in a single message so they run in parallel. Give each one a name so you can message it again. Prompt each seat with:

```
You are the <SEAT NAME> on a council deliberating an important decision.
Your mandate: <1-3 sentences: what you optimize for and what you're suspicious of>.

<THE BRIEF>

Instructions:
- Investigate before concluding. Read the files, search, run what you can, and check the facts. Cite what you found (file:line, URLs, command output).
- Do NOT hedge toward a balanced answer. Argue your mandate hard; other seats cover the other angles.
- [ToT mode] Generate 3-5 genuinely different approaches, not variations of one idea. Rate each SURE / MAYBE / IMPOSSIBLE with the reason. For every non-IMPOSSIBLE one, go one level deeper: what's the first hard sub-problem, and does it hold up?

Return exactly:
1. POSITION: your recommendation in one or two sentences
2. REASONING: the 3-5 strongest reasons, each with evidence
3. BRANCHES (ToT): each path, its rating, and why; pruned paths with the reason they died
4. BIGGEST RISK in your own recommendation
5. CONFIDENCE: low / medium / high, and why
6. WHAT WOULD CHANGE MY MIND: specific evidence or facts
7. OPEN QUESTIONS you could not resolve
```

Wait for every seat to report. Do not start Round 2 on partial results.

## Phase 3: Round 2, cross-examination

Load `SendMessage` (via ToolSearch if it is deferred) and continue **each seat with its context intact**. Send every seat all the other positions, attributed by seat name, with:

```
Here are the other council members' Round 1 positions: <positions>

1. For each other position: what is its strongest point, and what is its most serious flaw? Be specific.
2. What did they find that you missed? Does it change your view?
3. REVISED POSITION: hold, modify, or abandon your recommendation. Say which and why.
   Changing your mind is fine; holding firm is fine. Explain either one.
```

Send the **Devil's Advocate** an extra instruction: *"The current front-runner is <X>. Build the strongest possible case that it is wrong. Find the failure scenario, the hidden cost, the false assumption. If you cannot break it, say exactly what you tried."*

If SendMessage is unavailable, spawn fresh agents with the seat's charter, its Round 1 output and the others' positions pasted in.

## Phase 4: Crux hunt (repeat until done)

1. List the **cruxes**, the disagreements that would change the decision. Ignore the ones that don't.
2. Sort them:
   - **Factual cruxes** can be resolved by checking. Dispatch a targeted investigator agent, or send it back to the relevant seat, with a precise question: "Does library X support Y under load Z? Verify, don't guess."
   - **Value cruxes** depend on the user's priorities. Do not resolve these. Surface them to the user.
3. Feed the findings back to the affected seats for a short rebuttal round.
4. **Stop when** no seat raises a *new substantive* objection, or the remaining disagreements are all value cruxes, or 4 total rounds have run. If the ToT branches have all died, backtrack. Reopen the best pruned branch, or send a seat to generate new branches from the failure reasons.

Minimum: Round 1 plus Round 2 plus at least one crux pass. A council that "converged" in Round 1 has usually not been challenged. Push the devil's advocate once more before accepting that.

## Phase 5: Synthesis (report to the user)

Now you judge. Weigh the arguments by evidence, not by vote count. Report in this shape:

```
## Council verdict: <one-line answer>
Confidence: <low/med/high> - <why>

### Recommendation
<what to do, concretely, and the 3-5 reasons it won>

### How we got here
<seats convened, mode, rounds run, 3-6 bullets on the key turns: who changed their mind and why, what the investigation found>

### Rejected paths
<each serious alternative and the specific reason it lost>

### Unresolved dissent
<who still disagrees, their strongest argument; do not omit>

### Risks and mitigations
<top risks from the Pre-mortem and Devil's Advocate, and how to guard against each>

### Decisions only you can make
<value cruxes, framed as crisp choices>

### What would change this verdict
<the specific facts or events that should trigger a revisit>

### Next steps
<numbered, concrete>

Full transcript: <path>
```

## Record

Save the full deliberation (the Brief, each seat's charter, every round's raw output, crux findings and the verdict) to `council/YYYY-MM-DD-<short-slug>.md` in the current working directory, unless the user prefers elsewhere. Keep the raw outputs, not your paraphrase. The transcript is how the user audits whether the council really argued.

## Scaling

- **Default:** 4-6 seats, 2-4 rounds.
- **"Quick council":** 3 seats (one must be the Devil's Advocate), Round 1 plus one cross-examination round. Say that it is the quick version.
- **"Full council" / very high stakes:** 6 seats, an Evidence Auditor seat, and investigator agents for every factual crux.

## Failure modes to avoid

- A panel simulated in one response, labeled as a council.
- One-line briefs, so the seats reason about a problem they don't understand.
- Seats that are variations of the same view: 3 optimists and a mild skeptic.
- A devil's advocate that agrees.
- The chair deciding early and steering the seats toward it.
- Summarizing the seat outputs so aggressively that the specifics and evidence disappear.
- Stopping after Round 1 because everyone agreed.
- Burying dissent to make the verdict look cleaner.

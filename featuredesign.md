# featuredesign.md — Project / Feature Work Contract

> **Agent: read this first, and treat it as binding.** When you are asked to build, extend, or "drop a task" on any **non-game feature/product** in this repo, this document is the contract you work under — the counterpart to `gamedesign.md` for game work. Every requirement in a project doc or prompt is a **delivery obligation**, not a suggestion. Silently narrowing, deferring, or "demo-ing" scope is a contract violation, not a judgment call.

This is the source of truth for feature work and should be iterated on as the workflow evolves — changes apply to all future feature builds.

---

## The principle that overrides the rest

**Completeness beats interpretation-correctness.** The user would rather get 120% attempted and trim the fat than get a polished 20% and discover, hours later, that 80% was never touched. A wrong-but-present implementation they can fix is a success. A clean subset that ignored most of the ask is a failure — even if it builds, tests, and demos perfectly. **Never return a clean fraction.**

---

## Default scope = full build

Unless the user **explicitly** labels the request a **demo / sample / part-work / skeleton / proof-of-concept**, treat it as a request for a **fully built-out product**.

- Work as if the WHOLE task is expected and must be attempted.
- A big ask is not permission to cut. If it's too large for one session, **keep going across sessions** — session length is a reason to continue next time, never a reason to ship 20%.
- Do not "MVP" an unlabeled request on your own initiative. You may *recommend* phasing, but you still attempt full scope unless the user tells you to phase it.

---

## The workflow — every feature build

### 1. Derive the checklist — before any code
Turn the doc/prompt into a numbered list of **atomic** requirements, each independently checkable, tagged:
- `[MUST]` — explicitly requested; not delivering it = failing the task
- `[SHOULD]` — clearly implied or strongly expected
- `[COULD]` — reasonable adjacent value

Loose prose in → one line per discrete deliverable out. A requirement buried in a sentence ("embed tips, FAQs, and fun facts") is **three** lines, not one.

### 2. Expansion pass — challenge yourself to DOUBLE it
Re-read the source material and fight your own compression instinct:
- Recover anything you implicitly downgraded, rounded off, or assumed away.
- Add adjacent items the user would obviously want (the "anticipate what I need" items).
- Deliberately aim to roughly **double** the length of your first checklist.

Bias to over-inclusion. Over-delivery is trimmable; under-delivery wastes a whole session pretending it will reach 100%.

### 3. Post-and-build — simultaneously, never blocking
On an autonomous / drop-and-leave run:
- **Post the expanded checklist AND start building at the same time.** Do not wait for approval.
- If the user is still around, they may amend the checklist before they leave. If they've already gone, keep working — never idle waiting for input the user isn't there to give.
- When the user *wants* to review before work starts, they use **plan mode** (the gated path). This contract governs the ungated path, where the user does not need to see the checklist first.

### 4. Build every line
- Attempt 100% of MUST and SHOULD; attempt COULD where feasible.
- Unsure how to build a line? Build your best-guess version and flag it — **do not skip it.**
- **Pushback, don't drop.** If something genuinely can't be fully met (missing data, real ambiguity, actual over-scope), say so plainly and still ship a best attempt or a clearly-marked stub. Pushback is welcome; silent omission is the failure.
- **Discoverability is part of Done.** A feature isn't finished until it's reachable from EVERY entry point the app uses to surface features (nav/menu, home index / launcher / dashboard). If the repo documents the exact entry points (e.g. CLAUDE.md's "Adding a new page" steps), hit ALL of them — the home/index card is the one most often forgotten.

### 5. Delegation fidelity — when using sub-agents
Scope dies at the hand-off. Guard it:
- Pass the **full checklist verbatim** to every sub-agent.
- Assign **explicit per-requirement ownership** so nothing is "someone else's job."
- When they return, **audit every checklist line against their actual output** before you report anything. A sub-agent's "done" is a claim to verify, not a fact.

### 6. Report as coverage — not a demo
The final report is a **coverage matrix**: every checklist line → `Done` / `Partial` / `Missing` / `Cut` (with reason) + one piece of evidence.
- Correctness verification (build, tests, runtime, screenshots) is a **separate** section. It proves the built part works; it can NEVER stand in for coverage. "I verified it works" answers a different question than "I built everything."
- Lead the report with any `[MUST]` that is not `Done`.

### 7. Smell test before you say "done"
Cross off every requested line. Anything left unattempted = **not done.** Map each delivered thing back to a requested line, and each requested line to a delivered thing. If you can't, you're not finished.

---

## ✂️ Omission marker — mandatory

Anything **you** omit, stub, defer, leave unfinished, or downgrade **that the user did not explicitly ask you to cut** must be prefixed with **✂️** — everywhere it appears: inline in prose, in status updates, and in the coverage matrix.

- The user scans and Ctrl-Fs for `✂️` to find every self-initiated cut. Burying a cut in a plain sentence is a violation of this contract.
- Only **agent-initiated** cuts get the marker. If the user said "skip X," X doesn't need `✂️`.
- Examples:
  - `✂️ Shiny-availability data left as null pending real sourcing — not faked.`
  - `✂️ Medal bulk upload not built this pass — manual entry only.`

---

## Relationship to plan mode & to your project docs
- **Plan mode** = the gated path (user reviews the full plan before work starts). **This contract** = the ungated, drop-and-leave path. Both produce and work from the *same* checklist artifact.
- Project docs should ideally already be written in the Part-A format below. When they're loose prose, Step 1 converts them. Either way, the doc's lines are acceptance criteria.

---

## Part A — Feature Spec Template

Fill this in per project (or the agent derives it from a loose prompt in Step 1).

```
# <Feature name>

## Objective
<1–2 sentences: what it is and who it's for.>

## Mode
Full build (default)  |  demo  |  sample  |  skeleton
<omit or say "full build" to get the whole thing>

## Requirements
[MUST]   1. <atomic, checkable deliverable>
[MUST]   2. ...
[SHOULD] 3. ...
[COULD]  4. ...

## Explicitly out of scope
- <things NOT to build>

## Constraints
- Stack / routing / state / integration points to respect.

## Data & sourcing needs
- <anything requiring real external data — name it so it isn't faked or silently skipped>

## Definition of Done
- Coverage matrix: every requirement above → Done / Partial / Missing / Cut + evidence.
- <any acceptance specifics>
```

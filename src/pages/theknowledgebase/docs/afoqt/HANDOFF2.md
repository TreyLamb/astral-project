# AFOQT — PART DETAIL WRITING HANDOFF

**Purpose.** This document is sent to an agent after a Claude+Trey live design session
completes a new phase (engine written, chapters declared). The agent reads this file, reads
the files it names, and writes the PART DETAILs and board updates for the newly unlocked
parts — then hands the updated `HANDOFF.md` sections back. No code, no data rows, no lessons.
Only the instructions that future farmable agents will receive.

**Trey — before you send this, fill in the two marked placeholders below.**

---

## 1. The packet

Same zip as the main HANDOFF describes. Nothing extra is needed beyond the standard three:

```
package.json
scripts/afoqt*.mjs
src/pages/theknowledgebase/
```

Exclude `ResearchPics/`.

---

## 2. The prompt — paste this verbatim, fill the two placeholders

> Here is a zip of a React project. Everything you need is inside it. Do **not** run
> `npm install`. Do not ask me questions; work from the files.
>
> **You are writing PART DETAILs for a newly unlocked phase of the AFOQT project.**
> You are not writing code, data rows, or lesson markdown — you are writing the
> *instructions* that outside agents will later receive when they do that work.
>
> 1. Read exactly these files in this order, and nothing else until instructed:
>    - `src/pages/theknowledgebase/docs/afoqt/HANDOFF.md` — read the entire file.
>      The design records for PART 8 and PART 9 are the model for a design record.
>      The PART DETAILs for PARTS 10, 10B, 10C, 11, 11B, 12, and 13 are the model
>      for a farmable PART DETAIL. Match that standard exactly.
>    - `src/pages/theknowledgebase/CLAUDE.md` — full file.
>    - `src/pages/theknowledgebase/docs/afoqt/QUESTION-DOCTRINE.md` — full file.
>    - `src/pages/theknowledgebase/afoqt/curriculum/chapters.js` — find and read the
>      chapter entries for this phase's track only.
>    - **[FILL IN: the engine file(s) produced in this design session, e.g.
>      `src/pages/theknowledgebase/afoqt/engine/passage.js`]** — read the full file.
>      The registrar contract, template builder signature, and exported helpers are
>      what downstream data-row agents will be authoring against.
>
> 2. The parts you are writing details for are currently `[L]` stubs on THE BOARD under:
>    **[FILL IN: e.g. "Phase 11 — Reading Comprehension, PARTS 14-18"]**
>
> 3. Produce, in order:
>    a. Updated board entries for section 5 of HANDOFF.md — change unlocked parts from
>       `[L]` to `[ ]` and expand any stub that was a single-line placeholder.
>    b. A design record for the engine/Claude part (the `[C]` part), documenting the
>       registrar contract, template builder, and key decisions exactly as PART 9's
>       design record does.
>    c. Full PART DETAILs for every now-farmable part. Every detail must have:
>       **Agent**, **Read first**, **Do**, concept rules with pass/fail examples,
>       and **Verify** with exact npm commands and `--only=` template ids to sample.
>
> 4. Output the updated HANDOFF.md sections as replacement text (not a full-file rewrite).
>    After producing the text, run a self-check against section 3 of this document
>    (HANDOFF2.md) and list any item you could not satisfy and why.

---

## 3. Rules this writing agent obeys

1. **Ground every claim in a file you read.** If the engine file does not export a
   function, do not describe it. If a chapter does not declare a concept, do not mention
   it in a PART DETAIL. Invented curriculum is the failure HANDOFF.md section 4 exists to block.

2. **Match the PARTS 10-13 standard exactly.** Same heading depth, same block order
   (Agent → Read first → Do → concept rules → Verify), same style of pass/fail examples
   in concept rules, same Verify block structure.

3. **Every concept declared by a chapter must appear in at least one PART DETAIL's Do
   block.** An orphaned concept means a lesson with no questions, which `afoqt:coverage`
   will catch — but only after a data-row agent has already shipped wrong work.

4. **The Agent block is mandatory and must be specific.** Name the exact failure mode that
   rules out lighter models, not just the tier. "Haiku is not suitable" is not enough;
   "Haiku will produce cause-effect pairs with downstream rather than direct effects, which
   the validator cannot detect" is the standard.

5. **Do not split or renumber phases without asking Trey first.** If the design session's
   scope clearly warrants sub-parts (as the VA block gained 10B, 10C, 11B), propose the
   split with letter suffixes and confirm before writing the details.

6. **Do not touch engine files, template files, lesson files, or curriculum/chapters.js.**
   This task produces only documentation — HANDOFF.md section 5 board updates and section
   6 PART DETAIL blocks.

---

## 4. Agent tier language (use these terms, not others)

| Tier | When to use |
|---|---|
| **Sonnet / medium effort** | Data rows with invisible semantic failure modes; the validator catches structure but not meaning. Default for most farmable parts. |
| **Sonnet / high effort** | Highest-judgment data tasks — synonym/degree distinctions, concept rules with very fine lines between valid and invalid pairs. |
| **Gemini Pro** | Acceptable substitute for Sonnet where named explicitly. Always note any extra context it should be given. |
| **Haiku / high effort** or **Gemini Flash / high effort** | Only where (a) one concept with clear rules, (b) the validator catches every real structural error, AND (c) the task has no invisible semantic failure mode. Rare. |
| **Haiku / Flash / standard effort** | Almost never suitable. Name the specific failure mode. |
| **Grok / Perplexity** | Not suitable for any authoring task. Reasons to cite: markdown HTML output breaks react-markdown, unreliable JS object format compliance, hallucinated citations. |

---

## 5. Design record checklist — every engine `[C]` part needs all of these

- [ ] What was built: file path, exports list
- [ ] The full registrar contract: every required field, every validator throw, with the
      exact error message text so agents know what they are satisfying
- [ ] Template builder call signature: parameter names, what it produces per band
- [ ] The minimum-rows floor (e.g., "fewer than 5 rows at a band produces nothing")
- [ ] Format weighting if there are multiple question formats (e.g., "format 2 is 3:1
      over format 1 in real items — build format 2 first")
- [ ] What was deliberately left undeclared and why (prevents agents from adding it back)
- [ ] Any cross-subtest dependency (e.g., band cross-check against engine/words.js)
- [ ] What va-01-method-style chapters have no templates of their own and why

---

## 6. Farmable PART DETAIL checklist — every `[ ]` part needs all of these

- [ ] **Agent block** — tier + specific failure mode that rules out lighter agents
- [ ] **Read first block** — every file by path, with why
- [ ] **Do block** — file path, row/file count, band targets, concept-to-row mapping
- [ ] **Concept rules** — one rule per concept, one passing example, one failing example
- [ ] **Distractor arithmetic note** — wherever the engine has a minimum-per-band floor
      that silently disables a template if not met (this is always the silent killer)
- [ ] **One-file-exception note** — if the part must also touch `templates/index.js` or
      `curriculum/lessons.js`, name it explicitly
- [ ] **Verify block** — exact commands including `--only=` ids to sample and read aloud

---

## 7. Receiving work back

1. Read the returned HANDOFF.md sections against checklist items in sections 5 and 6
   above before accepting them.
2. Verify that every concept in `curriculum/chapters.js` for this phase appears in at
   least one PART DETAIL's Do block. A missed concept is a silent orphan.
3. Check that no Agent block says only "Sonnet" without naming a failure mode. Vague
   recommendations are useless at 11pm when you are deciding which session to open.
4. Paste the returned text into HANDOFF.md and run `npm run afoqt:coverage` — it should
   report the new `va-*` / `rc-*` / `ps-*` concepts as orphans (expected — no data rows
   exist yet), and nothing else should newly appear as an error.

# Claude Context Capture — Project Design

Status: **pre-build / options not yet decided.** No implementation has started. This doc is the durable source of truth for this project — keep it current as decisions get made. (A companion `HANDOFF_PROMPT.md` exists alongside this file purely to onboard a fresh AI session; it's disposable, this file is not.)

---

## Objective

Give Trey a reliable way to point an AI agent at a **specific region/element on a live webpage** and describe what should happen there — replacing a current workflow that doesn't work reliably.

## The actual problem (read this before proposing solutions)

Current workflow: screenshot the site with **ShareX**, draw a rectangle over the area in question, paste the annotated screenshot into a Claude Code conversation. **Claude frequently fails to notice or act on the hand-drawn rectangle** — it doesn't reliably treat the annotation as a pointer to a region. That unreliability is the bug being fixed. Nothing below is the goal in itself — it's all candidate fixes.

## Why this looks like a tooling problem (and why it might not be)

The idea that kicked this off: VS Code has a native "integrated browser → hover/click an element → Add element to chat" feature. Trey tried it expecting it to land in the Claude Code conversation; instead it opened VS Code's own native chat panel, backed by a **different agent (GPT-5 mini)**, entirely disconnected from Claude Code.

Investigation (done by reading the installed Claude Code extension's manifest directly, not guessing) found the structural reason: Claude Code (`anthropic.claude-code`, v2.1.215 at time of writing) declares an **empty `contributes.chatParticipants`** — it never registered itself as a participant in VS Code's generic/native chat system. That native "Add element to chat" button was never going to reach Claude Code, under any settings tweak. Full findings are in `HANDOFF_PROMPT.md` while it still exists; the load-bearing facts are repeated below so nothing is lost when that file is deleted.

Trey's own framing, unprompted, is the key design constraint: a tool that captures an element/region and hands off a **file** is not meaningfully more "live" than the ShareX screenshot — it's still a static artifact delivered after the fact. What actually needs to improve is **structural reliability**: something an AI agent can be told to consistently look for and parse, instead of eyeballing a hand-drawn rectangle in a flattened raster image. A perfect live-listening integration would be nice but is explicitly **not required** — Trey said outright it's fine if the result "doesn't hit the chat" automatically, as long as it produces something more parseable than the status quo.

That reframing means **Option C below (fix it with prompting/convention, no new tool) is a legitimate first-class candidate**, not a fallback — if it works, it may make the rest of this project unnecessary. Try it cheaply before investing in tooling.

---

## Mode

Design/decision doc only. **No building until an option is chosen and Trey confirms scope.** When work resumes, re-read this file, confirm the chosen option is still current, then apply the standard checklist workflow from `featuredesign.md` for the actual build.

---

## Options under consideration (undecided — pick one, or sequence them)

### Option A — Custom VS Code extension with an embedded/driven browser
Build a companion VS Code extension that opens a browser view (either a Webview with an iframe against the local dev server, or a real Chromium instance driven via Playwright/CDP — `playwright ^1.61.1` is already a devDependency of this repo). Add hover-highlight + click-to-select (CDP's `Overlay.setInspectMode` is the same primitive real DevTools "Inspect Element" uses). On selection, capture a screenshot crop + element metadata (outerHTML, selector, bounding rect, computed style) plus a typed comment.

**Delivery problem (unresolved):** Claude Code has no confirmed API to accept arbitrary captured content directly. The closest candidate is the command `claude-vscode.insertAtMention` (`claude-code.insertAtMentioned` in terminal mode) — but this is almost certainly the same mechanism behind the `@file`/`@folder` mention feature Trey already uses (i.e., it takes a **path reference**, not raw content). **Never confirmed by reading the actual call signature** — only inferred from the command's title and menu wiring. If pursuing Option A, resolving this is step one:
- Save the capture (image + sidecar `.json`/`.md` with comment/metadata) to a file, then call `insertAtMention` pointing at that file — plausible, unverified.
- Or write the screenshot straight to the OS clipboard and let Trey paste (Claude Code's chat input accepts pasted images) — simpler, sidesteps the unknown API entirely, costs one manual paste.

**Pros:** stays inside the IDE workflow Trey is already in.
**Cons:** doesn't satisfy the "must work smoothly in real Chrome" constraint (see below) unless it's literally driving real Chrome via CDP rather than a VS Code-embedded view; reinvents a chunk of browser UI; heaviest to build; delivery mechanism into Claude Code is unverified.

### Option B — Chrome extension
Toggle on, click or click-and-drag to select a region/element on the live page (real Chrome — Trey's daily browser, with all normal login state/extensions present), type a comment, hit Enter. Capture a screenshot crop (`chrome.tabs.captureVisibleTab` or offscreen canvas) + element metadata + the comment, and produce a **file**.

This is the option that directly matches Trey's stated desired UX: *"simply turn on, click/click-n-drag, leave comment, hit enter and file goes to claude."* Delivery to Claude does **not** need to be automatic — Trey explicitly said it's fine if it doesn't land in the chat by itself, as long as the output file is something an agent can reliably parse.

Sub-options for what happens to the file, roughly cheapest-to-build first:
- **B1 (simplest):** extension saves the capture locally (mirrors what ShareX already does) and copies a formatted reference (file path + comment, or the image itself) to the clipboard, so getting it into Claude Code is one paste/attach away — a direct, low-effort upgrade over the current ShareX+rectangle habit, with zero dependency on Claude Code's undocumented internals.
- **B2:** extension POSTs to a small local relay process (Node, same spirit as `AiCompressionAssist/`'s hook script) that writes the capture into the workspace, optionally in a location a Claude Code hook or file-watcher could notice.
- **B3:** investigate whether `insertAtMention` (see Option A) or some other Claude Code entry point could be triggered externally once its argument shape is known — would let a Chrome extension trigger delivery without any manual paste. Speculative; depends on unresolved investigation from Option A.

**Pros:** matches the stated UX exactly; works in real Chrome (the explicit hard requirement — "only worth it if it functions smoothly in chrome"); doesn't require reverse-engineering Claude Code internals if B1 is the target.
**Cons:** still produces a static file, same "not actually live" caveat Trey already flagged; B2/B3 add moving parts (a local server, or unverified internals).

### Option C — No new tool; fix the annotation convention / agent attention
Establish a strict, consistent visual convention for marking a region in a screenshot (e.g., a specific solid color + thickness, or some other reliably-detectable marker), and pair it with an explicit instruction (a rule in `CLAUDE.md`, a skill, or just habitually stating it) that tells the agent to always scan pasted images for that marker and treat the enclosed area as the target. Test whether that alone fixes the reliability problem before building anything.

**Pros:** costs nothing to try, no code, no new surface area to maintain; if it works, it fully resolves the actual problem and options A/B become unnecessary (or purely nice-to-have).
**Cons:** may not be reliable enough on its own — that's exactly what needs testing; doesn't reduce the manual screenshot-and-annotate step itself, only improves whether the agent notices the annotation.

**Recommendation for when work resumes:** try Option C first — it's nearly free and might close this out entirely. If it's not reliable enough, B1 is the next cheapest and most directly matches the requested UX and the hard Chrome constraint. A and B2/B3 are heavier investments and depend on unresolved unknowns about Claude Code's internals; don't start there.

---

## Explicitly out of scope (for now)
- Any solution that only works inside VS Code's own embedded/simulated browser and not real Chrome — fails the stated hard constraint.
- Deep reverse-engineering of the minified Claude Code `extension.js` bundle, unless Option A or B3 is actually chosen — don't do this speculatively.
- Automatic live delivery into the chat as a hard requirement — explicitly optional per Trey.

## Constraints
- Must function smoothly in real Chrome if it's a browser-capture tool at all (stated hard requirement).
- Should be at least as low-friction as the current ShareX workflow, or it's not worth using.
- Astral-project repo conventions apply once code is written here: see root `CLAUDE.md` (folder rules, sub-app pattern, no unnecessary abstractions) and `featuredesign.md` (full-build-by-default, checklist-first workflow) for whichever option gets built.
- This folder (`src/claude-context-capture/`) currently holds only design docs. If Option A or B end up needing app-side code (e.g., a page to configure/view captures), follow the standard "adding a new React page" steps in root `CLAUDE.md` — this doc does not replace that checklist.

## Data & sourcing needs
- None yet — no external data dependencies identified for any option.

## Open questions (resolve before/at build start)
1. Does `insertAtMention` accept arbitrary payloads or only path references? (Options A/B3 depend on this.)
2. Why did VS Code's native chat resolve to GPT-5 mini with no Copilot-family extension installed? (Not blocking, but worth understanding if Option A gets picked and deeper VS Code chat-system integration is ever reconsidered.)
3. Does Option C alone actually fix the reliability problem? This needs an empirical test, not a guess — try it and see before writing any tool code.

## Definition of Done (for this design phase)
- [x] Problem clearly documented separate from candidate solutions.
- [x] All three options captured with honest pros/cons, none prematurely eliminated.
- [ ] Trey has picked an option (or a sequence/combination) to pursue.
- [ ] Once picked, this doc gets a `## Requirements` section in the `featuredesign.md` Part-A checklist format (MUST/SHOULD/COULD) before any code is written.

> **This file is a disposable prompt, not project documentation.** It exists to hand a fresh AI (any model, any tool) enough context to pick up this project cold. The durable spec is [`projectdesign.md`](./projectdesign.md) in this same folder — read that too, and treat it as the source of truth for requirements. Once you (human or AI) have absorbed both, this file can be deleted; nothing here is meant to persist.

---

# Prompt: bring a fresh AI up to speed on "Claude Context Capture"

You're being looped into a project that hasn't started being built yet — it's still at the "figure out what we're actually building" stage. Below is the full context from the conversation that produced this. Read it, then go read `projectdesign.md` for the actual requirements/options doc, and pick up from there.

## The environment this came out of

The user (Trey) runs **Claude Code as a VS Code extension** (`anthropic.claude-code`, installed at `C:\Users\PCT\.vscode\extensions\anthropic.claude-code-2.1.215-win32-x64\` at time of writing) inside a repo called `astral-project` — a React + Vite single-page app. That Claude Code session is a separate, custom UI surface (its own sidebar/panel/editor-tab views) — it is **not** built on top of VS Code's generic native Chat panel.

## The triggering discovery

VS Code has a native, built-in browser/chat integration where you can open a live preview of a running page, hover/click an element, and hit **"Add element to chat."** The user tried this expecting it to reach the Claude Code conversation. It didn't — it opened a *different* chat panel, backed by a different agent entirely: **GPT-5 mini** (confirmed directly by the user, not a guess). This is VS Code's own native chat surface, separate from and unaware of Claude Code.

We investigated why, by reading the installed Claude Code extension's `package.json` manifest directly (not guessing):

- **`contributes.chatParticipants` is empty.** Claude Code does not register itself as a participant in VS Code's generic/native chat system at all. That's the root cause — it's not a misconfiguration, it's a missing integration point. No amount of clicking around in VS Code settings will route that native "Add element to chat" button to Claude Code, because Claude Code was never plugged into that extension point in the first place.
- Claude Code **does** expose a large number of its own commands under `claude-vscode.*` / `claude-code.*` namespaces (checkable via `Ctrl+Shift+P`), including things like `claude-vscode.newConversation`, `claude-vscode.focus`, `claude-vscode.terminal.open`, `claude-vscode.acceptProposedDiff`.
- One command stood out: **`claude-vscode.insertAtMention`** (title: "Insert @-Mention Reference"; the terminal-mode equivalent is `claude-code.insertAtMentioned`). This is very likely the same mechanism behind the `@public/`-style file/folder mentions the user already uses constantly when talking to Claude Code — i.e., it almost certainly takes a **file/folder path reference**, not arbitrary raw content (a screenshot blob, an HTML snippet, computed styles, etc). This was **not confirmed** by reading the actual argument signature — we only got as far as the manifest and light grepping of the 2.6MB minified `extension.js` bundle, which was inconclusive because it's minified into a handful of enormous single lines. **Pinning down its exact accepted argument shape (single URI? array? extra fields?) is unfinished investigation work**, not a settled fact — don't build on an assumption here without testing it first (e.g., trigger it from the Command Palette and see what UI/behavior results, or dig further into the bundle).
- Also worth knowing: `code --list-extensions` on this machine returned only: `anthropic.claude-code`, `mechatroner.rainbow-csv`, `ms-python.debugpy`, `ms-python.python`, `ms-python.vscode-pylance`, `ms-python.vscode-python-envs`, `ms-vscode.powershell`, `ms-vscode.live-server`... wait, actually `ritwickdey.liveserver`. No GitHub Copilot extension is installed, yet GPT-5 mini answered when the native chat opened. **This is an open, unresolved question** — it implies either VS Code now ships some default chat/model access independent of the extensions list, or there's a mechanism the extension list doesn't surface (different profile, bundled/hidden provider, etc). Don't assume you know why; if it matters to the eventual build, investigate fresh.

## The actual underlying problem (this is the part that matters most)

This whole investigation started because of a real, recurring workflow pain point, and it's important not to lose sight of it in favor of the shinier "live browser hover-click" idea:

The user currently uses **ShareX** to screenshot the site and draw a rectangle annotation over the area they want acted on, then pastes that screenshot into a Claude Code conversation. **Claude frequently fails to notice or act on the hand-drawn rectangle** — it doesn't reliably treat the annotation as a pointer to a specific region. That's the bug being solved. Everything downstream (VS Code integration, Chrome extension, whatever) is one candidate fix among several — not the goal itself.

The user's hypothesis for why a live "hover and click while Claude is listening" flow might work better: during a live session, the agent is actively listening for an event, versus having to visually parse a static raster image after the fact and correctly interpret an ad-hoc annotation. But the user also flagged, unprompted, the obvious tension in that reasoning: **any tool that captures-then-delivers a file (rather than truly streaming a live interaction into the conversation) is right back to being a static artifact** — no more "live" than the ShareX screenshot is. The user explicitly said this makes the tooling effort "questionable" on its own merits, and explicitly said: **if the actual fix turns out to be a prompting/attention problem solvable without any new tool at all, that's a totally acceptable outcome** ("If the agent can solve this problem then that's great").

**Practical implication:** treat the "just fix the prompting/convention so Claude reliably notices a marked region in a screenshot" path as a real, first-class candidate — possibly the one to try first, since it's nearly free to test and might make the rest of this project unnecessary. See `projectdesign.md` → Option C.

## Constraints the user stated explicitly

- Any new tool "is only worth it if it functions smoothly in **Chrome**" — the user's daily driver browser. A tool that only works inside VS Code's own embedded/simulated browser is a much weaker win than one that works in real Chrome, on any site, logged into everything, with all their normal extensions/state present.
- The desired UX for a Chrome-extension-shaped solution, in the user's own words: **"simply turn on, click/click-n-drag, leave comment, hit enter and file goes to claude."** Break that down:
  1. Toggle the extension on.
  2. Click, or click-and-drag, to select a point/region/element on the live page.
  3. Type a comment describing what should happen there.
  4. Hit Enter.
  5. A file is produced. It does **not** have to land automatically inside the live Claude Code chat — the user explicitly said that's optional ("it's ok if it doesn't hit the chat i guess"). Producing a well-structured file that the user can then attach/reference themselves is an acceptable outcome.
- Given point 5, the bar this tool has to clear isn't "achieve magic live delivery" — it's **"produce something more structurally reliable for an AI to parse than a hand-drawn rectangle in a flattened screenshot,"** while being at least as low-friction as ShareX to use.

## What NOT to assume

- Don't assume the VS Code extension route is the winning approach. It was the first idea, but the user's own follow-up steered toward Chrome-extension and pure-prompting alternatives being equally or more viable. `projectdesign.md` lists all three as open options — a decision has **not** been made yet.
- Don't assume `insertAtMention` accepts arbitrary content. Verify before relying on it.
- Don't start writing extension code from this prompt alone. Read `projectdesign.md`, and if a decision between the options still hasn't been made, that's the first thing to resolve with the user — not something to pick unilaterally.

## Useful pre-existing project facts (for whichever option gets picked)

- `playwright` (`^1.61.1`) is already a devDependency in the astral-project root `package.json` — relevant if a Chromium-driven/CDP approach is ever used (e.g., `Overlay.setInspectMode` is the same primitive real DevTools "inspect element" uses).
- The repo already has a precedent for a small local, deterministic, no-model dev tool wired into Claude Code via a hook: `AiCompressionAssist/` (a `PostToolUse` hook configured in `.claude/settings.json`, logs to `AiCompressionAssist/logs/`, fully local). Worth a look as an architectural reference if a local relay/watcher process ends up being part of the design (e.g., delivery option B2 in `projectdesign.md`).
- Dev server for this repo: `npm run dev` (Vite). At time of writing it served on `http://localhost:5174` because `5173` was already occupied by another running instance — worth checking for stale servers before assuming a port.

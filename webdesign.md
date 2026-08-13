# webdesign.md — layout rules for this site

Counterpart to `gamedesign.md` and `featuredesign.md`. **Read this before
building or restyling any page layout.** These are not preferences to re-litigate
each session; they are settled decisions that keep getting re-broken.

---

## 1. Stop centring everything in a narrow column

**This has been raised three separate times and keeps coming back. It is the
single most common layout mistake made on this site.**

The default instinct — `max-width: 1200px; margin: 0 auto;` — wraps a page in
enormous dead margins on a wide monitor. Trey runs a wide display. A tool that
uses 55% of the screen and pads the other 45% with background is wasting the
screen, and it reads as an unfinished template.

**Rules:**

- **Tool and app pages get the full window.** Padding is a gutter (12–24px), not
  a design feature. No `max-width` on the outer shell of a working tool.
- **A `max-width` is only justified for long-form prose**, where line length
  genuinely affects readability (~70ch). An article page may centre. A dashboard,
  a table, a map, a tracker, a grid of cards may not.
- **If content does not fill the width, that is a content problem, not a reason
  to shrink the container.** Widen the grid, add columns, let tables breathe,
  give panels more room. Do not pad the sides to hide it.
- **Canvas-type pages (maps, editors, games) take essentially the whole
  viewport.** Chrome around them should be measured in tens of pixels, not
  hundreds. Target ≥95% of the window for the working surface.

Before shipping a layout, look at it at 1920px wide and ask what fraction of the
window is doing work. If the answer is "about half", it is wrong.

---

## 2. Chrome collapses; the working surface does not

On any page whose point is a large working surface:

- Menus, tab bars, filter panels, and stat strips are **collapsed by default**
  and open on demand. They overlay the surface rather than shrinking it.
- Nothing decorative gets permanent vertical space. A stat strip that is nice to
  glance at once is a setting, not a fixture.
- Collapse state persists, so a layout the user closed stays closed.
- Reference how mapgenie.io and the Tarkov wiki do it: full-bleed map, a thin
  floating rail, everything else behind a toggle.

---

## 3. Site nav should not compete with a sub-app's own nav

When a sub-app renders its own top bar or tab row, the global Astral Hub navbar
is redundant and steals a whole band of vertical space at the very top of the
page — the most valuable band there is.

- A sub-app with its own chrome **hides the global navbar** and carries its own
  way home.
- That "way home" is a **small corner affordance at the level of the sub-app's
  own tab row**, not a full-width bar of its own.
- `src/components/Navbar.jsx` already has `OWN_TOPBAR_ROUTES` and
  `FULLSCREEN_ROUTES` for exactly this. Add the route there rather than
  inventing a new mechanism.

### ⏳ Open item — apply this across the rest of the site

**Status: agreed in principle 2026-08-13, not yet done. Revisit with Trey.**

Trey asked for the corner-nav treatment on **most of the other tools**, not just
EFT. Currently only games, `/MFT`, `/league-build`, `/orbit`, and `/EFTsh/map`
skip the global navbar. The remaining sub-apps (`/mymdb`, `/VV`, `/TKB`, `/QA`,
`/RS`, `/POGO`, `/POGO-ACCS`, `/medaldex`, `/stashmap`, `/antiquityquest`,
`/timer-tool`, `/planning-tool`) still render the full-width site navbar above
their own chrome.

Doing this properly means each of those needs its own in-app home affordance
first, or the user gets stranded with no way back. That is a per-app change and
was deliberately **not** bundled into the EFT map work. Pick it up as its own
task.

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

### How much gutter, exactly

Raised again 2026-08-14 on `/EFTsh`, which shipped with
`max-width: 1500px; margin: 0 auto`. The number is not a matter of taste:

- **5–10px of side padding.** That is the whole budget for a tool page. `8px` is
  the default; `18px` is already too much; anything with a `max-width` on the
  outer shell is wrong.
- **`width: 100%`, never `margin: 0 auto`.** Auto margins on a capped shell are
  exactly the pattern being banned. If you catch yourself writing
  `max-width: NNNNpx; margin: 0 auto;` on a shell, stop.
- This applies to the outer shell only. Inner panels, modals and prose blocks
  may still cap their own width where it genuinely helps.

---

## 1b. Responsive means fluid, not mobile-first

Pages should adapt to the screen they are on — **relative to the viewport**.
That is not the same as building everything for a phone and letting desktop
inherit the phone layout.

- **Design for the real screen first** (a wide desktop display), then let it
  reflow down. Don't design a 380px column and stretch it.
- **Prefer intrinsically fluid CSS over breakpoints**: `repeat(auto-fill,
  minmax(280px, 1fr))`, `flex-wrap`, `%`/`fr`/`vw` units, `clamp()`. A grid that
  reflows on its own beats three hand-written media queries.
- **Breakpoints are for genuine layout changes** — collapsing a two-column split
  into one, hiding a rail — not for re-specifying padding at every size.
- **A phone-sized layout must not leak upward.** Single-column stacks, giant tap
  targets and hidden columns belong inside a `max-width` media query, never in
  the base rules.

The test: the layout should look deliberate at 1920px AND usable at 400px,
without either one being a compromise made for the other.

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

## 3. One top bar per tool

**This is the standing pattern. Every tool follows it. Rolled out site-wide
2026-08-14 — do not reintroduce the two-bar layout on anything new.**

A tool that renders its own top bar must not ALSO show the global Astral Hub
navbar. Two stacked bars waste the most valuable band on the page and make the
tool look like it is embedded in something else.

The rule, in four parts:

1. **The tool's own bar is the only bar.** The global site nav is suppressed.
2. **The Astral Hub link is the first thing in that bar, far-left**, where the
   site logo would have been. Clicking it goes to `/`, exactly as the site logo
   does.
3. **It is styled by the tool, not by the hub.** `HubLink` renders with the
   near-styleless `.hub-link` class, which inherits font and colour from the bar
   it sits in. A tool that wants more control adds its own prefixed rule.
4. **The home page and bar-less pages keep the global navbar.** It is their only
   bar, and it already carries the logo far-left.

### How to apply it

```jsx
import HubLink from '../../components/HubLink';   // '../components/...' from src/pages/

<div className="yourtool-topbar">
  <HubLink className="yourtool-site-home" />      {/* FIRST child, always */}
  ...the rest of your bar...
</div>
```

Then add the route prefix to `OWN_TOPBAR_ROUTES` in
`src/components/Navbar.jsx`.

**Both steps or neither.** Suppressing the nav without adding the link strands
the user in a tool with no way out.

### Two layout cases

- **Flex-row bars** — the common case. `HubLink` goes in flow as the first
  child and needs no extra CSS.
- **Centred hero headers** (`text-align: center`, no flex row — stashmap,
  medaldex, POGO-ACCS) — a link in flow would push the title off-centre, so pass
  `className="hub-link-pinned"` and give the header `position: relative`. The
  link is then absolutely positioned top-left.

### Gated and loading screens count

If a tool returns early for a signed-out or loading state, **that branch needs
the link too**. MyMDB's sign-in screen was exactly this trap: it returns before
its top bar renders, so suppressing the site nav made it a dead end. Any early
`return` in a tool's render is a place a user can land.

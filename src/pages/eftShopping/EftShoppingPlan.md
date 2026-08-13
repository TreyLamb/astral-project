# EFT Shopping — feature spec & coverage checklist

## Objective
A companion tool for Escape from Tarkov: set the level of every hideout station,
get a live shopping list of everything still needed. Plus a rebuild of Trey's
manual `Tarkov_RAID Sheet.xlsx` (raid packing lists, ammo tiers, buy-below
thresholds, food price-per-slot, keep/don't-use reference, bail-out calculator).

## Mode
Full build.

## Constraints
- React 18/19 + Vite SPA, React Router v7 nested routes, sub-app pattern
  (`src/pages/eftShopping/`, shell owns a nested `<Routes>`).
- All CSS namespaced `eft-`.
- localStorage only (no Firestore) — user's choice.
- Data: tarkov.dev GraphQL live + committed snapshot fallback.

## Data & sourcing needs
- tarkov.dev GraphQL (`https://api.tarkov.dev/graphql`) — hideout stations,
  levels, item/trader/skill/station requirements, bonuses, crafts, item icons,
  flea + trader prices. Takes `gameMode: regular | pve`.
- `assets.tarkov.dev` — item icon CDN (independent of the API worker).
- Fallback source for snapshot regeneration if the API is down:
  SPT game files (`sp-tarkov/server` `hideout/areas.json` + `locales/global/en.json`).

---

## Requirements

### A. Data layer
- [MUST]   A1. GraphQL client hitting `api.tarkov.dev/graphql`.
- [MUST]   A2. `gameMode` (regular/pve) threaded through every query.
- [MUST]   A3. Committed snapshot JSON so the tool fully works offline / during an API outage.
- [MUST]   A4. localStorage cache of live data with TTL, "last updated" display, manual refresh.
- [SHOULD] A5. Snapshot generator script (`npm run eft:snapshot`) with the SPT game-file fallback source.
- [SHOULD] A6. Prices fetched on a short TTL separately from static hideout data (long TTL).
- [SHOULD] A7. Visible degraded-mode banner when running on snapshot data.

### B. Hideout core
- [MUST]   B1. Every hideout station listed with a current-level selector (0..max).
- [MUST]   B2. Shopping list = aggregated item requirements across the chosen scope.
- [MUST]   B3. Scope "EVERYTHING" — all remaining levels of all stations.
- [MUST]   B4. Scope "NEXT LEVEL ONLY".
- [MUST]   B5. Toggle individual stations out of / into the list.
- [MUST]   B6. Isolate a single station (solo).
- [MUST]   B7. Per-station target level (stop at N, not just max).
- [SHOULD] B8. Item icon on every shopping-list row.
- [SHOULD] B9. Group the list by item / by station / by item category.
- [SHOULD] B10. Text search + filters inside the shopping list.
- [SHOULD] B11. Found-in-raid marking on requirements that need FIR.
- [SHOULD] B12. Per-station completion progress bars.
- [SHOULD] B13. Copy / export the shopping list as text.
- [COULD]  B14. Print-friendly stylesheet.

### C. Inventory
- [MUST]   C1. Per-item on-hand count, persisted.
- [MUST]   C2. Shopping list nets on-hand out (need / have / short).
- [SHOULD] C3. Inline +/- on-hand editing straight from the shopping list.
- [SHOULD] C4. "Have all of this" one-click per row.
- [SHOULD] C5. Overall completion percentage.

### D. Blockers & build order
- [MUST]   D1. Trader loyalty requirements shown per upgrade.
- [MUST]   D2. Skill requirements shown per upgrade.
- [MUST]   D3. Prerequisite station levels shown per upgrade.
- [MUST]   D4. "Buildable right now" view.
- [SHOULD] D5. User profile of trader LLs + skill levels, used to compute blockers.
- [SHOULD] D6. Suggested build order (dependency-ordered).
- [SHOULD] D7. Construction time per upgrade, and cumulative for a plan.

### E. Costs
- [MUST]   E1. Flea price per item and a running ₽ total for the list.
- [SHOULD] E2. Best trader buy price, flag when a trader beats the flea.
- [SHOULD] E3. Flag flea-banned items.
- [SHOULD] E4. Cost broken down per station.
- [COULD]  E5. Barter availability flag.

### F. Upgrade payoff
- [MUST]   F1. Bonuses granted by each station level.
- [SHOULD] F2. Crafts unlocked at each station level.
- [SHOULD] F3. Construction time surfaced on the station card.

### G. Spreadsheet tabs rebuilt
- [MUST]   G1. Watchlist / buy-below thresholds (`crafts` tab + Sheet6) with live price verdict.
- [MUST]   G2. Food & hydration tier list, price-per-slot, auto-computed from live prices.
- [MUST]   G3. "Being frugal" keep / don't-use ingredient reference, seeded from the sheet.
- [MUST]   G4. Per-map raid packing checklist (Customs, Woods, Shoreline, Interchange, Reserve, Factory, Labs).
- [MUST]   G5. Ammo tier guide by caliber (Best / Garbage / Else + notes) from the sheet.
- [MUST]   G6. Loot value / bail-out calculator (container slots × ₽ per slot → verdict).
- [SHOULD] G7. Sights: like / meh / dogshit list.
- [SHOULD] G8. Ammo guide enriched with live penetration / damage / armour damage.
- [SHOULD] G9. Frugal reference auto-derived from the API (what each item is used to craft).
- [SHOULD] G10. Medstation notes from Sheet6 preserved.
- [SHOULD] G11. Everything seeded from the sheet is user-editable and persisted.

### H. Cross-cutting
- [MUST]   H1. Tarkov-styled theme, every class `eft-` prefixed.
- [MUST]   H2. PVE / PVP mode toggle that actually re-sources prices.
- [MUST]   H3. Registered in App.jsx, siteLinks.js, routeAliases.js.
- [MUST]   H4. All user state persisted to localStorage.
- [SHOULD] H5. Export / import the whole dataset as JSON (backup).
- [SHOULD] H6. Usable on a phone.
- [SHOULD] H7. Item detail popover with a wiki link.

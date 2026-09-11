# EFT prices — where the data actually comes from

Written 2026-09-10, after Trey asked whether PVE prices were impossible "because there's no data
for it publicly", and then pushed back on the answer:

> "The sources are 99% likely PUBLIC somewhere or else those sites using them are using bots to
> scan prices constantly - which seems excessive and unlikely."

**He was right.** There is a public, unauthenticated, live flea-price API serving all three game
modes, and it is the upstream that tarkov.dev itself consumes. This file exists so nobody repeats
the four hours of probing that found it.

---

## TL;DR — use this

```
GET https://publicfleaapi.asoloproject.xyz/api/v2/flea-advanced/{gameType}/items-overview
GET https://publicfleaapi.asoloproject.xyz/api/v2/flea-advanced/{gameType}/traders/offers
```

| our `GAME_MODES` id | `gameType` in the URL | verified |
|---|---|---|
| `regular` (PVP) | `eft` | 200, 11.4 MB, 3,837 items |
| `pve` | `pve` | 200, 14.4 MB, 3,837 items |
| *(not modelled yet)* `pvp-season` | `season` | 200, 12.3 MB |

**No API key. No auth header. All three return distinct data** (different MD5s — this was checked,
because two other endpoints silently ignore the mode; see the graveyard below).

Freshness, measured: PVE sample stamped `2026-09-10 19:54:18 UTC` when fetched at `20:18 UTC` —
**24 minutes old**. Not a stale dump.

Prices genuinely differ per mode, which is the whole point:

| Bolts | robustAvgPrice | minPrice | listings |
|---|---|---|---|
| PVP (`eft`) | 30,486.95 | 24,444 | 59 |
| **PVE** | **42,872.04** | 36,000 | 121 |

---

## How this was found

`the-hideout/tarkov-data-manager` is open source. Its
`src/tarkov-data-manager/jobs/update-flea-prices.mjs` calls `spApi.fleaPrices(gameMode)`, and
`modules/tarkov-data-sp.mjs` builds that URL. The `getGameType()` mapping above is copied from
that file, not guessed:

```js
const getGameType = (gameMode) => {
    if (gameMode === 'regular') return 'eft';
    if (gameMode === 'pvp-season') return 'season';
    return gameMode;
}
```

⚠ The same module has a **second** upstream, `SP_DUMPS_URL`, which *does* require
`x-api-key` + Cloudflare Access headers. That one is not usable. Only the `flea-advanced` path is
open — note `FleaApiRequest` passes no headers at all.

**So the answer to "are these sites running constant scanners?" is: yes, but not each of them
separately.** There is one scanning operation (asoloproject) and tarkov.dev is a *consumer* of it,
same as we would be. tarkov.dev's own `TarkovMonitor` app collects only raid queue times, not
prices — that was checked and is a dead end for pricing.

## Payload shape

`items-overview` returns `{ items: [...] }`. Per item:

- `tarkovId` — the BSG template id, so it joins directly to `itemNames.json` / `hideoutSnapshot`
- `shortName`, `localizedName`, `normalizedName`, `sellable`, `fleaLevelRequirement`
- `isStale`, `isLowConfidence` — **trust flags, use them**; don't display a stale price as live
- `latestPriceSample` — `robustAvgPrice`, `minPrice`, `maxPrice`, `listingCount`, `volumeUnits`,
  `sampleTimeEpoch`
- `lastValid30dPriceSample` — same shape, the last sample considered valid in 30 days
- `sparkLine` — 12 points of % change plus `totalChange`, for a trend arrow
- `traderPrices[]` — per trader, per loyalty level, with currency

⚠ **The response is 11–14 MB and most of it is `latestSupplyPressure`** — every individual live
offer, with seller nicknames and expiry timestamps. We want none of that. A fetch script must
strip to roughly `{tarkovId, robustAvgPrice, minPrice, listingCount, sampleTimeEpoch, isStale}`
plus trader prices; that should land in the low hundreds of KB.

⚠ **Be a good citizen.** tarkov.dev throttles its own calls to this host with a Bottleneck at
30 requests / 10s. We need **one request per mode per refresh**, so this is trivially satisfied —
but never put this behind a per-keystroke or per-render fetch. Cache it like every other snapshot
in this folder, and send a real User-Agent.

**Permission status:** the host's `robots.txt` is Cloudflare's content-signals boilerplate with
**zero actual directives** — no `Disallow`, and no content-signal set either way, which under its
own clause (c) "neither grants nor restricts". Combined with the name (`publicfleaapi`), the
absence of any auth, and its documented use by a public open-source project, there is nothing here
asking us not to. Contrast tarkov-market below, which explicitly says no.

---

## The graveyard — everything else probed, so it isn't re-probed

| Route | Result (2026-09-10) |
|---|---|
| `api.tarkov.dev/graphql` — what `pricesQuery()` already uses | **Down.** 400/422 `GraphQL server unavailable` for `pve` AND `regular`. `status.tarkov.dev` itself 523s. Never a PVE-specific problem. |
| `api.tarkov.dev/api/v1/items` | **Up**, 5,312 items, Tarkov-Market-shaped. But **PVP-only and stale** (rows dated 2026-09-05). `/api/v1/pve/items`, `/api/v1/items/pve`, `?mode=pve` and `/season/items` are **all byte-identical to it** — same MD5. The mode is silently ignored. Do not be fooled by the 200. |
| `tarkov.dev/api/graphql` | 405 Method Not Allowed on POST — static-site catch-all, not an API. |
| `cache.tarkov.dev` (their real caching service) | **401**, `www-authenticate: Basic realm="restricted"`. Internal only. |
| `api.tarkov-market.app/api/v1` | Genuine PVE + season support, but **401 `Access denied`** without a key; key requires paid "Pro". 300 req/min. |
| Scraping `tarkov-market.com` item pages | SSR HTML carries prices but **PVP only**, and there is **no anonymous PVE toggle on the page**. Every data fetch it makes goes to `/api/be/`, which **their `robots.txt` explicitly Disallows**. Don't. |
| `tarkovforge.com` | Republishes tarkov.dev (26 in-page references) — shares the outage. |
| `tarkovguide.net` | 429 to curl on three attempts across two UAs; **loads fine in a real browser** (so the 429 is bot-blocking, not an outage). Has a working PVE flea table — but 45 `tarkov.dev` references in-page, so it is a republisher too, and its best columns are paywalled "Premium Required". |
| `norvinsk-sys.ru` | 200 but a 9 KB client-rendered shell, no data in the HTML. |
| `eft.su` | 200, PVE toggle present but `disabled`; price history "available to subscribers". |

---

## What is wired up (2026-09-10)

`npm run eft:prices` → `data/priceSnapshot.json` (498 KB, dynamically imported so only the
page that needs it pays for it). `scripts/fetchEftPrices.mjs` pulls both endpoints for one
mode and strips them to what we use:

| key | shape | what it is |
|---|---|---|
| `flea[id]` | `[robustAvg, min, listings, flags, fleaLevelReq]` | flags: 1 stale, 2 low-confidence, **4 buildPriced** |
| `vendor[id]` | `[rub, traderName, loyalty]` | the best price any trader **pays you** |
| `offers[]` | `[itemId, traderIdx, loyalty, stack, unlimited, buyRestrictionMax, pay[]]` | the live assortment; `pay` entries are `["RUB"\|"USD"\|"EUR"\|<itemId>, count]` |
| `fx` | `{RUB:1, USD:170.36, EUR:199.14}` | **derived**, see below |

Three things in there were not obvious and cost time:

- ⚠️ **`traders/offers` is the whole trader assortment**, not just prices — cash AND barter
  offers, loyalty level, `unlimitedCount`, and `buyRestrictionMax` (the per-restock purchase
  cap). That last pair is what makes `eftCraftLoops.js` possible at all: an unlimited offer is
  what makes a craft repeatable, and the restriction is what makes it *semi*-infinite.
- ⚠️ **FX is derived from the data, never hardcoded.** Every offer carries `requirementsCost`,
  the RUB value of its price side, so a single-requirement cash offer states the rate directly.
  It is the **buy** rate and it differs from the one implied by `traderPrices` (~128 ₽/$, what
  Peacekeeper pays *you*); using the wrong one misprices every Peacekeeper input by a third.
  A currency with no derived rate makes its offers **skipped**, not priced at 1.
- ⚠️ **A weapon's `robustAvgPrice` is for MODDED BUILDS, not the bare gun.** A craft outputting
  a stock AKM looked like it netted 1.79 m. Matched on the exact handbook root `"Weapons"` —
  a loose `/weapon/i` also catches `"Weapon parts & mods"`, which is 2,244 items whose prices
  *are* the bare part, and mislabels 1,649 items instead of 433.

**Consumers:** `eftCraftLoops.js` (pure, tested) and `/EFTsh/loops`. The rest of the app still
runs on `eftApi.js`'s dead tarkov.dev GraphQL and still shows "NO PRICES" — merging this
snapshot into `loadEftData`'s `items` would light up every other view's price column, and is
the obvious next step. It is not done because 498 KB eagerly loaded on every EFT page is the
wrong trade without checking each view first.

## Open items
- 🔴 **`GAME_MODES` in `eftNormalize.js` has only `regular` and `pve`.** tarkov.dev's own
  `game-modes.mjs` declares **three**: `regular` (0), `pve` (1), `pvp-season` (2). The season
  profile is a separate economy with separate prices. Trey plays **PVE**, so this was left alone
  deliberately rather than missed — but the upstream serves `season` for free whenever it matters.
- `armorClass` is still null on every wiki-sourced gear row (see the root `CLAUDE.md`); this
  upstream does not carry it either.

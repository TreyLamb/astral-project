# pogofilters data — sources & curation log

Covers **`classification.json`** — the species→category map behind the Pokemon GO
search keywords `legendary`, `mythical` and `ultra beast` / `ultra beasts`, plus the
region-locked (`regional`) roster the "Low trash cp adding regionals" filter needs.

Every fact here was pulled from the live sources below on **2026-08-10** and
cross-referenced across at least two independent sources per category. Nothing in
this file comes from model memory. **`costume` is deliberately out of scope.**

Other files in this directory (`seed.json`, `buildSeed.mjs`) are not covered by
this log.

---

## Sources used

| Key | URL | Role |
|---|---|---|
| PokeMiners GAME_MASTER | `https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json` | **Primary** for legendary / mythical / ultraBeast. Carries Niantic's own `pokemonSettings.pokemonClass` field (`POKEMON_CLASS_LEGENDARY` / `_MYTHIC` / `_ULTRA_BEAST`) — this *is* the field the in-game search keyword reads, so it is not a proxy for the answer, it is the answer. |
| pogoapi rarity | `https://pogoapi.net/api/v1/pokemon_rarity.json` | Cross-check for the same three categories (`Legendary` / `Mythic` / `Ultra beast`). Independent GAME_MASTER mirror. |
| PvPoke gamemaster | `https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster.json` | Third cross-check (`tags: legendary / mythical / ultrabeast / regional`) and a `released` flag. **Hand-curated for PvP — treated as the weakest of the three** (see disagreements). |
| pokemongo.fandom — Legendary | `https://pokemongo.fandom.com/wiki/Legendary_Pok%C3%A9mon` | **Primary for release status.** Its Availability table lists every released form with dated raid/research windows (current through 2026-07-12). |
| pokemongo.fandom — Mythical | `https://pokemongo.fandom.com/wiki/Mythical_Pok%C3%A9mon` | Same, for mythicals. Marks unreleased entries explicitly. |
| pokemongo.fandom — Ultra Beast | `https://pokemongo.fandom.com/wiki/Ultra_Beast` | Same, for Ultra Beasts. Also states the UB region-locks in prose. |
| pokemongo.fandom — Region-exclusive | `https://pokemongo.fandom.com/wiki/Region-exclusive_Pok%C3%A9mon` | **Primary** for `regional`. |
| Serebii | `https://serebii.net/pokemongo/exclusives.shtml` | Cross-check for `regional`. |
| Niantic help / search-string guides | `https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/1486-searching-filtering-your-pokemon-inventory/` | Keyword wording. **The Niantic page 403s to scripted fetches**; wording was confirmed via secondary search-string guides instead — see "could-not-fully-verify". |

Wikitext was read through the MediaWiki API (`?action=parse&prop=wikitext`) because
both fandom and pokemongohub.net block plain page fetches (402 / 403).

---

## Authoritative source per category

| Category | Authoritative source | Cross-checked against | Result |
|---|---|---|---|
| `legendary` | GAME_MASTER `pokemonClass` | pogoapi rarity, PvPoke tags, fandom | 86 entries, **0 divergence** from GAME_MASTER |
| `mythical` | GAME_MASTER `pokemonClass` | pogoapi rarity, PvPoke tags, fandom | 25 entries (24 + Zeraora), **0 divergence** |
| `ultraBeast` | GAME_MASTER `pokemonClass` | pogoapi rarity, fandom | 11 entries, **0 divergence** |
| release status | pokemongo.fandom Availability tables | PvPoke `released`, presence in `species.json` | see below |
| `regional` | pokemongo.fandom Region-exclusive | Serebii exclusives, PvPoke `regional` tag | 63 entries / 55 distinct dex |

---

## Cross-check results

- **Class lists.** GAME_MASTER yields 203 / 75 / 22 classified *templates*
  (legendary / mythic / ultra beast) across all forms including unreleased ones.
  pogoapi independently lists 77 / 23 / 11 unique species names, and every name in
  pogoapi's list appears with the matching class in GAME_MASTER. **No name is
  classified differently by the two.**
- **Re-derivation check.** A validator re-derives the three class lists straight
  from the raw GAME_MASTER dump, maps them onto `species.json` ids, and diffs
  against the shipped file: `missing=none extra=none` for all three categories.
  So the curated lists are not hand-transcribed guesses — they are byte-equal to
  the authority.
- **Release status.** fandom's Availability tables (83 legendary rows, 33 mythical
  rows, 11 UB rows) agree with `species.json`'s membership on every entry shipped
  here, with one exception: **Zeraora** (see below).
- **Regionals.** fandom's page states "48 (54 if including evolutions)"
  region-exclusive Pokemon. The shipped `regional` list has **55 distinct dex
  numbers** = fandom's 54 + Squawkabilly (which fandom lists in its Paldea section
  but its headline count has not caught up to). Serebii's 76-row table agrees on
  every species except the three noted below.
- **Search keywords.** `legendary`, `mythical`, and `ultra beasts` (the older
  spaced-plural form, with `ultrabeast` also accepted) confirmed as real inventory
  search terms.

---

## Known discrepancies / could-not-fully-verify

- **Necrozma: PvPoke says Ultra Beast, Niantic says Legendary.** PvPoke tags all
  four Necrozma forms `ultrabeast`. GAME_MASTER says `POKEMON_CLASS_LEGENDARY` and
  pogoapi files Necrozma under *Legendary*, not *Ultra beast*. Because the in-game
  keyword reads `pokemonClass`, Necrozma is shipped under **`legendary`** and
  deliberately **not** under `ultraBeast`. This is the single most consequential
  judgement call in the file. If an in-game check shows Necrozma answering the
  `ultra beast` search, move it.
- **Type: Null / Silvally.** GAME_MASTER *and* pogoapi both class them Legendary
  (all 18 Silvally type-forms included), but they are **not released**: absent from
  fandom's Availability table, `released:false` in PvPoke, absent from
  `species.json`. Excluded; recorded in `_meta.uncertain`.
- **Buzzwole / Pheromosa / Xurkitree as regionals.** fandom lists all seven
  region-locked Ultra Beasts on *two* pages; Serebii's table lists only Celesteela,
  Kartana, Stakataka, Blacephalon. PvPoke tags them `ultrabeast` but not `regional`
  — however PvPoke's `regional` tag is demonstrably incomplete (it also omits Throh,
  Sawk, Mime Jr., Oricorio and Shellos), so it was not given a vote. **Included**
  on the two-page fandom evidence. Caveat: UB raid availability has repeatedly gone
  worldwide for event days.
- **Zeraora is released but missing from `species.json`.** fandom lists it as
  released (GO Fest 2026 Tokyo, 2026-05-29; global 2026-07-11/12) and PvPoke has
  `released:true`; GAME_MASTER and pogoapi both class it Mythic. It is absent from
  `species.json` because pogoapi's `released_pokemon` list — `species.json`'s source
  — lags. Shipped with id `zeraora` (dex 807) and flagged in `_meta.unmatched`.
- **Squawkabilly is released but missing from `species.json`**, same lag (released
  2026-06-23, Flying Taxi). Also only *partly* regional — see next item.
- **Partial regionals: Flabébé / Floette / Florges / Squawkabilly.** Each has
  released forms that spawn **worldwide** (White & Orange flower; Yellow & White
  plumage) alongside region-locked ones, and `species.json` carries one id per
  species with no form split — so the id cannot distinguish them. Shipped with
  `partial: true` and a per-entry note. **Do not treat these as hard regionals.**
- **Furfrou excluded.** Serebii's table lists six Furfrou trims by region; fandom's
  Region-exclusive page omits Furfrou entirely and PvPoke does not tag it regional.
  The *species* spawns worldwide — only the trim you can apply is region-gated
  (Dandy / Matron / Natural are global). Marking the single `furfrou` id regional
  would be wrong for every globally-caught Furfrou. Excluded, recorded in
  `_meta.uncertain`.
- **Cosmog / Cosmoem.** PvPoke says `released:false`; fandom's Availability table,
  pogoapi and `species.json` all say released. Resolved 3-to-1 as **released** —
  PvPoke's flag tracks PvP eligibility and neither can battle. This is also why
  PvPoke's `released` flag was not used as a release oracle anywhere in this build.
- **Three unreleased forms kept.** `necrozma_ultra`, `eternatus_eternamax`,
  `meloetta_pirouette` are in `species.json` and unambiguously classified, but
  fandom and PvPoke both say they are not obtainable. Shipped with
  `released: false`. Harmless (nobody can own one); drop them if a strictly-
  obtainable list is wanted.
- **Region *strings* are softer than region *membership*.** Heatmor/Durant swapped
  hemispheres unannounced on 2020-11-30; Lunatone/Solrock and Zangoose/Seviper have
  swapped before too. Membership is certain; the strings follow fandom and are
  corroborated by Serebii, but re-verify before branching on them.
- **Niantic's own help page could not be read** (403 to scripted fetch). Keyword
  wording therefore rests on secondary search-string guides plus the fandom
  "Pokémon search" page rather than a first-party quote. The *category membership*
  does not depend on this — it comes from `pokemonClass`.
- **Galarian / Alolan forms of regionals are deliberately excluded** from
  `regional`. Only the Kanto forms of Farfetch'd, Mr. Mime and Corsola are
  region-locked; the Galarian forms are global.
- **Unreleased-but-classified species, excluded and logged** in `_meta.uncertain`:
  Glastrier, Spectrier, Calyrex, the four Treasures of Ruin, Koraidon, Miraidon,
  Walking Wake, Iron Leaves, the Loyal Three, Ogerpon, the four Gen-9 paradox
  legendaries, Terapagos (legendary); Phione, Manaphy, Arceus, Magearna, Pecharunt
  (mythical). On fandom each renders with `ci=None`, the wiki's unreleased marker.

---

## Data-model notes for consumers

- Shape: `{ _meta, legendary[], mythical[], ultraBeast[], regional[] }`. Every entry
  is `{ id, dex, name }`; `regional` entries add `regions` (a human-readable string).
- **`id` is the `species.json` id** (`mewtwo`, `giratina_origin`, `paldea_aqua_tauros`)
  so entries join directly against `../../pogoaccs/data/species.json`. The two ids
  that do not resolve there are listed in `_meta.unmatched` with the reason.
- **Categories overlap on purpose.** Uxie / Mesprit / Azelf are legendary *and*
  regional; seven Ultra Beasts are ultraBeast *and* regional. `legendary` and
  `mythical` are mutually exclusive, and so are `legendary` and `ultraBeast`.
- **Mega and Primal forms sit under their base species' category** (`mega_rayquaza`
  under legendary, `mega_diancie` under mythical, `mega_kangaskhan` under regional).
  fandom lists them in those same tables, so this is source-backed, not inferred.
  Note the in-game search keyword matches the *stored* species, which is never a
  mega — these entries exist so an id-keyed lookup never returns "unclassified".
- **Two optional per-entry flags**, both meaning "do not trust this blindly":
  `partial: true` (only some released forms are region-locked — read `note`) and
  `released: false` (correctly classified, not obtainable yet).
- `regional` is **not** a Pokemon GO search keyword — there is no in-game term that
  returns region-exclusives. It is a curated roster and will drift as Niantic moves
  species around; `legendary` / `mythical` / `ultraBeast` are stable game data.
- `costume` is intentionally absent.

---

## Refresh procedure

There is no `refresh.mjs` for this file — it is curated by hand. To rebuild:

1. Pull `pokemonClass` out of the PokeMiners GAME_MASTER for the three class
   constants; that is `legendary` / `mythical` / `ultraBeast` in full.
2. Intersect with `species.json` ids (form-name normalisation needed:
   `ARTICUNO_GALARIAN` → `galarian_articuno`, `GIRATINA_ALTERED` → `giratina`,
   `TORNADUS_INCARNATE` → `tornadus`).
3. Gate on release using fandom's Availability tables — **not** PvPoke's `released`
   flag, which is wrong in both directions (front-runs megas, lags non-PvP species).
4. Re-scrape `regional` from fandom + Serebii; it is the only category that drifts.
5. Re-run the validator: entry counts, id resolution against `species.json`,
   dex/name agreement, duplicate detection, and a fresh GAME_MASTER re-derivation
   diff. It must report `missing=none extra=none` for all three class categories.

---

## Curation date log

- **2026-08-10** — Initial build. legendary 86, mythical 25, ultraBeast 11,
  regional 63 (55 distinct dex). 2 ids unresolved against `species.json`
  (`zeraora`, `squawkabilly` — both real, both released, both missing upstream).
  11 uncertainty/disagreement blocks recorded in `_meta.uncertain`.
  Validator: 0 problems; GAME_MASTER re-derivation diff clean for all three
  class categories.

// Finds the hideout's semi-infinite craft loops, generically, from data.
//
// THE THING BEING LOOKED FOR. Some crafts are fed entirely by things you can re-buy: a
// trader offer with `unlimitedCount`, or a flea listing that always exists. Those crafts
// never run out. 3x Scav Vest -> 2x Ripstop fabric and 1x PACA Soft Armor -> 2x Aramid
// fiber fabric are the canonical pair, and both of their outputs feed a third craft
// (1x Aramid + 1x Ripstop -> 1x BNTI Module-3M body armor). Buy, craft, sell, repeat, with
// no raid in the loop.
//
// NONE OF THAT IS HARD-CODED. This module is given the craft graph and a price snapshot and
// works the loops out itself, so it stays correct across a wipe that reshuffles every trader
// assortment and every price. Re-run `npm run eft:prices`, and the answers change with it.
// (`npm run eft:loops` prints them; the /EFTsh/loops tab draws them.)
//
// HOW IT WORKS — one fixed point, not a recursion.
//
//   unit[item] = min( cheapest way to BUY one, cheapest way to CRAFT one )
//
// Buying may itself be a barter ladder (Pack of Vita juice -> Slickers -> Scav Vest, all
// Jaeger LL1, all unlimited: 15,833 RUB against 26,500 RUB to buy the vest outright), and
// crafting values its inputs at `unit`, which may in turn be a barter. The two definitions
// are mutually recursive, so this relaxes them together — every route is a candidate, take
// the min, repeat until nothing improves. That terminates because costs only ever fall and
// are bounded below by zero, and it sidesteps the memoisation trap a DFS hits (a result
// computed under one cycle-guard stack is not valid for a different caller).
//
// WHAT MAKES A LOOP "SEMI-INFINITE" RATHER THAN INFINITE. `buyRestrictionMax` — how many of
// an offer you may buy per trader restock. The supply is endless but metered, so a farm has
// a real throughput ceiling, and quantifying it is the honest version of "it's basically
// infinite". A genuinely infinite loop would be a craft cycle that returns more of an item
// than it consumes; `findCycles` looks for exactly that and, so far, the game has none.
//
// WHAT THIS DELIBERATELY WILL NOT DO.
//   - Value a weapon off the flea. `robustAvgPrice` on a gun averages listings that are
//     mostly fully modded builds, so a craft outputting a bare rifle appears to net
//     millions. The price snapshot flags those `buildPriced` and they are sold to a trader
//     here instead.
//   - Model the flea sales fee. It has changed between patches and guessing at coefficients
//     would put invented numbers on the page. Flea revenue is GROSS and labelled as such.
//     The comparison this exists to answer — sell the intermediates raw, or craft the third
//     thing and sell that — is between two flea sales and is barely affected by it.
//   - Treat a limited-stock offer as a supply. If it is not `unlimitedCount` it cannot feed
//     a loop, whatever it costs.

/** Tunables. Every one of these is a judgement call, so none of them is buried. */
export const LOOP_DEFAULTS = {
  // A flea listing count below this is a thin market: the price is real but you cannot rely
  // on buying one whenever you want, which is the whole premise of a farm.
  minListings: 8,
  // Barter ladders are real but they get silly. Vita juice -> Slickers -> Scav Vest is 2.
  maxPasses: 24,
  // How many craft steps deep a single farm may go, and how many crafts it may involve in
  // total. Trey asked for cards, not craft trees: past three or so the card stops being
  // readable, and past four crafts it stops being one activity you sit down and do.
  maxChainDepth: 3,
  maxSteps: 4,
  // Scale a batch so feeder yields divide evenly, but not past this many runs of the
  // terminal craft. An lcm will otherwise happily ask for six Virtex processors (12x PC CPU,
  // 226 hours) so that a capacitor craft comes out whole, which is a spreadsheet, not a card.
  maxBatch: 4,
  // Below this, a "farm" is noise: flea prices move more than this between refreshes.
  minNetPerRun: 2000,
  // Gates. null means "don't filter" — an empty object would mean "you have nothing".
  traderLevels: null,   // { Prapor: 4, Ragman: 2, ... } by trader display name
  stationLevels: null,  // { workbench: 3, ... } by station normalizedName
  playerLevel: null,    // gates flea access (fleaLevelRequirement) — null means no gate
};

const CURRENCIES = ['RUB', 'USD', 'EUR'];
const FLAG_STALE = 1;
const FLAG_LOW_CONFIDENCE = 2;
const FLAG_BUILD_PRICED = 4;

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a / gcd(a, b)) * b;

// --- Reading the price snapshot --------------------------------------------
//
// The snapshot ships as positional arrays to keep it under half a megabyte (see
// scripts/fetchEftPrices.mjs `format`). Unpacking it once here means nothing downstream
// has to remember which slot is which.

/**
 * @param {object} prices the committed priceSnapshot.json
 * @returns {{flea:Map, vendor:Map, offers:Map, fx:object, meta:object}}
 */
export function readPrices(prices) {
  const flea = new Map();
  for (const [id, row] of Object.entries(prices?.flea || {})) {
    const [avg, min, listings, flags, level] = row;
    flea.set(id, {
      avg,
      min,
      listings,
      level,
      stale: !!(flags & FLAG_STALE),
      lowConfidence: !!(flags & FLAG_LOW_CONFIDENCE),
      buildPriced: !!(flags & FLAG_BUILD_PRICED),
    });
  }

  const vendor = new Map();
  for (const [id, row] of Object.entries(prices?.vendor || {})) {
    vendor.set(id, { rub: row[0], trader: row[1], level: row[2] });
  }

  const traders = prices?.traders || [];
  const offers = new Map();
  for (const row of prices?.offers || []) {
    const [itemId, traderIdx, level, stack, unlimited, limit, pay] = row;
    if (!offers.has(itemId)) offers.set(itemId, []);
    offers.get(itemId).push({
      itemId,
      trader: traders[traderIdx] || String(traderIdx),
      level,
      stack: stack || 1,
      unlimited: !!unlimited,
      limit: limit || 0,
      pay: (pay || []).map(([what, count]) => ({
        currency: CURRENCIES.includes(what) ? what : null,
        itemId: CURRENCIES.includes(what) ? null : what,
        count,
      })),
      barter: (pay || []).some(([what]) => !CURRENCIES.includes(what)),
    });
  }

  return {
    flea,
    vendor,
    offers,
    fx: prices?.fx || { RUB: 1 },
    meta: {
      mode: prices?.mode || null,
      generatedAt: prices?.generatedAt || null,
      scannedAt: prices?.scannedAt || {},
      source: prices?.source || null,
      counts: prices?.counts || {},
    },
  };
}

// --- The fixed point --------------------------------------------------------

/**
 * Cheapest repeatable way to hold one of every item, and how.
 *
 * `buy` is a purchase route (trader offer or flea). `make` is a craft route. `unit` is the
 * cheaper of the two and is what everything else is valued at — an input you would rather
 * craft than buy is priced at the craft.
 *
 * @param {object} craftIndex from eftCraftGraph.buildCraftIndex
 * @param {object} prices     the committed priceSnapshot.json
 * @param {object} [options]  see LOOP_DEFAULTS
 */
export function buildSupplyIndex(craftIndex, prices, options = {}) {
  const opts = { ...LOOP_DEFAULTS, ...options };
  const { flea, vendor, offers, fx, meta } = readPrices(prices);

  const traderAllowed = (offer) => {
    if (!opts.traderLevels) return true;
    const have = opts.traderLevels[offer.trader];
    return have == null ? false : have >= offer.level;
  };
  const stationAllowed = (craft) => {
    if (!opts.stationLevels) return true;
    const have = opts.stationLevels[craft.stationKey];
    return have == null ? false : have >= (craft.level || 1);
  };
  const fleaAllowed = (id) => {
    const row = flea.get(id);
    if (!row) return false;
    if (row.stale || row.listings < opts.minListings) return false;
    // fleaLevelRequirement is the account level BSG gates that item's flea listing behind.
    if (opts.playerLevel != null && row.level > opts.playerLevel) return false;
    return true;
  };

  // Crafts that could ever be part of a farm: they consume something and produce something.
  const craftable = (craftIndex.crafts || []).filter(
    (c) => (c.inputs || []).length && (c.outputs || []).length && stationAllowed(c),
  );

  const unit = new Map();
  const buy = new Map();
  const make = new Map();

  const priceOffer = (offer) => {
    let rub = 0;
    for (const part of offer.pay) {
      if (part.currency) {
        const rate = fx[part.currency];
        // No derived rate means we cannot honestly price this offer. Skipping it is right;
        // treating the rate as 1 would make a $200 item look like it costs 200 RUB.
        if (rate == null) return null;
        rub += part.count * rate;
        continue;
      }
      // Priced at `buy`, deliberately NOT at `unit`. A barter is a PURCHASE route, and
      // pricing its give-item at "or craft it, if that is cheaper" buries a craft inside
      // what the card presents as a shop trip — the ladder printed 15,833 RUB for a Slickers
      // bar while the vest it paid for came out at 15,770, which is nonsense on its face.
      // If crafting the give-item really is better, that is a chain for expandChain to find
      // and show as its own step, not a discount hidden in a price.
      const have = buy.get(part.itemId);
      if (have == null) return null;
      rub += part.count * have.rub;
    }
    return rub / offer.stack;
  };

  const priceCraft = (craft, outputId) => {
    let rub = 0;
    for (const input of craft.inputs) {
      const have = unit.get(input.itemId);
      if (have == null) return null;
      rub += have * (input.count || 1);
    }
    const yieldCount = craft.outputs.find((o) => o.itemId === outputId)?.count || 1;
    return { rub: rub / yieldCount, inputCost: rub, yieldCount };
  };

  let passes = 0;
  let converged = false;
  for (; passes < opts.maxPasses; passes += 1) {
    let changed = 0;
    const relax = (id, cost, route, into) => {
      if (cost == null || !Number.isFinite(cost)) return;
      const prev = into.get(id);
      if (prev != null && cost >= prev.rub - 0.005) return;
      into.set(id, { ...route, rub: cost });
      const best = unit.get(id);
      if (best == null || cost < best - 0.005) { unit.set(id, cost); changed += 1; }
    };

    for (const [id, list] of offers) {
      for (const offer of list) {
        // A limited-stock offer is a one-off, not a supply. It cannot feed a loop.
        if (!offer.unlimited || !traderAllowed(offer)) continue;
        relax(id, priceOffer(offer), { kind: offer.barter ? 'barter' : 'cash', offer }, buy);
      }
    }
    for (const [id] of flea) {
      if (!fleaAllowed(id)) continue;
      relax(id, flea.get(id).avg, { kind: 'flea', flea: flea.get(id) }, buy);
    }
    for (const craft of craftable) {
      for (const out of craft.outputs) {
        const priced = priceCraft(craft, out.itemId);
        if (!priced) continue;
        relax(out.itemId, priced.rub, { kind: 'craft', craft, ...priced }, make);
      }
    }

    if (!changed) { converged = true; break; }
  }

  // Which of the two won, per item — the thing every plan below branches on.
  const route = new Map();
  for (const [id, cost] of unit) {
    const b = buy.get(id);
    const m = make.get(id);
    route.set(id, m && (!b || m.rub <= b.rub) ? { ...m, via: 'make' } : { ...b, via: 'buy' });
    if (Math.abs((route.get(id).rub ?? cost) - cost) > 1) route.get(id).rub = cost;
  }

  return {
    unit, buy, make, route, flea, vendor, offers, fx, meta, opts,
    craftable,
    fleaAllowed,
    stats: { passes: passes + (converged ? 1 : 0), converged, priced: unit.size },
  };
}

// --- Selling ----------------------------------------------------------------

/**
 * What one of an item is worth, and where you would take it.
 *
 * Flea is gross of the sales fee (see the header). A weapon is never valued off the flea
 * because its listings are builds, not the bare item a craft hands you.
 */
export function sellValue(supply, itemId) {
  const options = [];
  const row = supply.flea.get(itemId);
  if (row && !row.stale && row.listings > 0 && !row.buildPriced
      && (supply.opts.playerLevel == null || row.level <= supply.opts.playerLevel)) {
    options.push({
      via: 'flea', rub: row.avg, listings: row.listings, gross: true,
      lowConfidence: row.lowConfidence,
    });
  }
  const v = supply.vendor.get(itemId);
  if (v) options.push({ via: 'trader', rub: v.rub, trader: v.trader, level: v.level });

  options.sort((a, b) => b.rub - a.rub);
  return {
    best: options[0] || null,
    options,
    // Surfaced so a card can say WHY a craftable gun is being valued at the vendor price.
    buildPriced: !!row?.buildPriced,
  };
}

// --- Farms ------------------------------------------------------------------

/**
 * Expands one craft into the whole chain that feeds it, following `route` — an input is a
 * feeder craft when crafting it beat buying it, and a purchase otherwise.
 *
 * Runs are kept as exact ratios and the whole batch is scaled at the end so every feeder
 * runs a whole number of times. Trey's example lands on 2: one Ripstop craft (3 vests -> 2)
 * and one Aramid craft (1 PACA -> 2) feed exactly two Module-3M runs, which reads far better
 * on a card than "0.5 runs of each".
 */
function expandChain(supply, terminal, opts) {
  const steps = [];
  const buys = new Map();
  const seen = new Set();
  let denom = 1;
  let truncated = false;

  const visit = (craft, outputId, runsNum, runsDen, depth) => {
    const key = `${craft.id}:${outputId}`;
    // A craft appearing twice in one chain is a cycle in the chosen routes. Stop and let
    // findCycles report it rather than unrolling forever.
    if (seen.has(key)) { truncated = true; return; }
    seen.add(key);
    steps.push({ craft, outputId, runsNum, runsDen, depth });
    denom = lcm(denom, runsDen);

    for (const input of craft.inputs) {
      const needNum = (input.count || 1) * runsNum;
      const route = supply.route.get(input.itemId);
      const canFeed = route?.via === 'make' && depth + 1 < opts.maxChainDepth;
      if (!canFeed) {
        const prev = buys.get(input.itemId) || { itemId: input.itemId, num: 0, den: runsDen };
        // Sum fractions over a common denominator so a mixed-yield chain still totals right.
        const den = lcm(prev.den, runsDen);
        buys.set(input.itemId, {
          itemId: input.itemId,
          num: prev.num * (den / prev.den) + needNum * (den / runsDen),
          den,
        });
        continue;
      }
      const feeder = route.craft;
      const yieldCount = feeder.outputs.find((o) => o.itemId === input.itemId)?.count || 1;
      visit(feeder, input.itemId, needNum, runsDen * yieldCount, depth + 1);
    }
  };

  visit(terminal, terminal.outputs[0].itemId, 1, 1, 0);
  for (const b of buys.values()) denom = lcm(denom, b.den);

  // Scale to whole runs, but never past maxBatch — an unlucky lcm can demand a dozen runs
  // just to make the arithmetic tidy, and a card asking for 12 runs is not a card.
  let batch = denom;
  let evenBatch = true;
  if (batch > opts.maxBatch) { batch = 1; evenBatch = false; }

  const scaled = steps.map((s) => {
    const exact = (s.runsNum * batch) / s.runsDen;
    return { ...s, runs: evenBatch ? exact : Math.ceil(exact), exactRuns: exact };
  });
  const buyList = [...buys.values()].map((b) => {
    const exact = (b.num * batch) / b.den;
    return { itemId: b.itemId, count: evenBatch ? exact : Math.ceil(exact), exactCount: exact };
  });

  return { steps: scaled, buys: buyList, batch, evenBatch, truncated };
}

/**
 * Puts the steps in the order you would actually run them: anything that makes an ingredient
 * comes before the step that eats it.
 *
 * `expandChain` walks terminal-first, which is the right way to DISCOVER a chain and the
 * wrong way to READ one — the Portable defibrillator card led with "3x Bundle of wires, made
 * above" when the wires were made two rows below. A plain topological pass fixes it, and any
 * step left in a knot (a cycle the chain expansion truncated) is appended rather than dropped.
 */
function orderSteps(steps) {
  const remaining = [...steps];
  const out = [];
  while (remaining.length) {
    const pending = new Set(remaining.map((s) => s.outputId));
    const i = remaining.findIndex(
      (s) => !s.craft.inputs.some((input) => input.itemId !== s.outputId && pending.has(input.itemId)),
    );
    out.push(...remaining.splice(i === -1 ? 0 : i, 1));
  }
  return out;
}

/**
 * Cost, revenue and time for one way of running a chain, from a MATERIAL BALANCE.
 *
 * You buy what the set consumes and does not produce; you sell what it produces and does not
 * consume. Deriving both from one balance rather than listing them separately is what keeps
 * a partial plan honest — the first version listed every feeder's whole output as revenue,
 * so a chain that made 9 Piles of meds and then ate 7 of them booked all nine as profit and
 * "sell the parts" won every single time. It also picks up leftovers for free: a feeder that
 * yields 2 where the chain needs 1 now sells the spare instead of pretending it vanished.
 */
function planFor(supply, steps, label, note) {
  const produced = new Map();
  const consumed = new Map();
  for (const step of steps) {
    for (const input of step.craft.inputs) {
      consumed.set(input.itemId, (consumed.get(input.itemId) || 0) + (input.count || 1) * step.runs);
    }
    for (const out of step.craft.outputs) {
      produced.set(out.itemId, (produced.get(out.itemId) || 0) + (out.count || 1) * step.runs);
    }
  }

  const buys = [];
  let cost = 0;
  let priceable = true;
  for (const [itemId, count] of consumed) {
    const net = count - (produced.get(itemId) || 0);
    if (net <= 0) continue;
    const route = supply.buy.get(itemId);
    const unitCost = route ? route.rub : supply.unit.get(itemId);
    if (unitCost == null) { priceable = false; continue; }
    cost += unitCost * net;
    buys.push({ itemId, count: net, unit: unitCost, route: route || null });
  }

  const sells = [];
  let revenue = 0;
  for (const [itemId, count] of produced) {
    const net = count - (consumed.get(itemId) || 0);
    if (net <= 0) continue;
    const value = sellValue(supply, itemId);
    if (!value.best) { priceable = false; continue; }
    revenue += value.best.rub * net;
    sells.push({ itemId, count: net, ...value });
  }
  buys.sort((a, b) => b.unit * b.count - a.unit * a.count);
  sells.sort((a, b) => b.best.rub * b.count - a.best.rub * a.count);

  // Crafts at the same station queue; different stations run at once. So wall time is the
  // busiest station, not the sum of everything.
  const perStation = new Map();
  for (const step of steps) {
    const key = step.craft.stationKey || step.craft.stationName;
    perStation.set(key, (perStation.get(key) || 0) + (step.craft.duration || 0) * step.runs);
  }
  const wallSeconds = perStation.size ? Math.max(...perStation.values()) : 0;
  const hours = wallSeconds / 3600;

  return {
    label,
    note,
    stepIds: steps.map((s) => s.craft.id),
    buys,
    sells,
    cost,
    revenue,
    net: revenue - cost,
    priceable,
    wallSeconds,
    perHour: hours > 0 ? (revenue - cost) / hours : null,
    margin: cost > 0 ? (revenue - cost) / cost : null,
  };
}

/**
 * How many of an item you can actually get between trader restocks, following the whole
 * barter ladder.
 *
 * The tightest link governs, not the last one. Scav Vest's own Jaeger offer allows 10 per
 * restock, but you pay for it in Slickers, whose offer allows 5, which you pay for in Vita
 * juice — so the true ceiling is 5, not 10. Reading only the top of the ladder overstates
 * every barter-fed farm's throughput, which is the one number the "semi" in semi-infinite
 * rests on.
 *
 * Returns Infinity for an uncapped offer or a flea purchase: those are limited by money and
 * by other players' listings, not by a restock clock.
 */
function perRestockSupply(supply, itemId, seen = new Set()) {
  if (seen.has(itemId)) return Infinity;
  const route = supply.buy.get(itemId);
  if (!route || route.kind === 'flea') return Infinity;

  const offer = route.offer;
  const stack = offer?.stack || 1;
  // buyRestrictionMax of 0 means BSG set no per-restock cap on this offer.
  let cap = offer?.limit ? offer.limit * stack : Infinity;

  if (route.kind === 'barter') {
    const next = new Set(seen).add(itemId);
    for (const part of offer.pay) {
      if (part.currency) continue;
      const have = perRestockSupply(supply, part.itemId, next);
      if (have === Infinity) continue;
      cap = Math.min(cap, Math.floor(have / part.count) * stack);
    }
  }
  return cap;
}

/**
 * Does getting this item touch the flea at any point, following the whole barter ladder?
 *
 * "Trader-fed" is a claim that nothing can break the loop — no other player has to be
 * listing anything. Checking only the item's own route breaks that claim silently: Scav Vest
 * is a Jaeger barter, which looks trader-fed, but it is paid for in Slickers, which is paid
 * for in Pack of Vita juice, which is only available on the flea. The card said trader-fed
 * and was wrong.
 */
function touchesFlea(supply, itemId, seen = new Set()) {
  if (seen.has(itemId)) return false;
  const route = supply.buy.get(itemId);
  if (!route) return true; // no repeatable source at all is worse than needing the flea
  if (route.kind === 'flea') return true;
  if (route.kind !== 'barter') return false;
  const next = new Set(seen).add(itemId);
  return route.offer.pay.some((p) => !p.currency && touchesFlea(supply, p.itemId, next));
}

/**
 * How many times a batch can be run before the traders need to restock, and what the binding
 * constraint is. This is the "semi" in semi-infinite.
 */
function throughputFor(supply, plan) {
  let limiter = null;
  let runs = Infinity;
  let anyFlea = false;
  let allTrader = true;

  for (const b of plan.buys) {
    const route = b.route;
    if (!route || touchesFlea(supply, b.itemId)) {
      anyFlea = true;
      allTrader = false;
      if (!route || route.kind === 'flea') continue;
    }
    const perRestock = perRestockSupply(supply, b.itemId);
    if (perRestock === Infinity) continue;
    const possible = Math.floor(perRestock / b.count);
    if (possible < runs) { runs = possible; limiter = { ...b, perRestock, possible }; }
  }

  return {
    runsPerRestock: Number.isFinite(runs) ? runs : null,
    limiter,
    // The strongest claim available: everything comes from an unlimited trader offer, so the
    // loop cannot be broken by the flea drying up or by anyone else's listings.
    traderFed: allTrader && plan.buys.length > 0,
    usesFlea: anyFlea,
  };
}

/**
 * Every farm the data supports, ranked.
 *
 * @returns {{farms:Array, cycles:Array, stats:object, supply:object}}
 */
export function findCraftLoops(craftIndex, prices, options = {}) {
  const opts = { ...LOOP_DEFAULTS, ...options };
  const supply = buildSupplyIndex(craftIndex, prices, opts);

  const farms = [];
  for (const craft of supply.craftable) {
    const output = craft.outputs[0];
    if (!output) continue;
    // Every input must have a repeatable source, or this is not a farm — it is a thing you
    // can make once with what you happened to bring home.
    if (!craft.inputs.every((i) => supply.unit.has(i.itemId))) continue;

    const chain = expandChain(supply, craft, opts);
    if (chain.steps.length > opts.maxSteps) continue;
    const feeders = chain.steps.slice(1);

    const plans = [planFor(supply, chain.steps, 'Craft it all', null)];
    if (feeders.length) {
      // The alternative Trey named: stop at the intermediates and sell those instead. Same
      // shopping list, one fewer craft, and often more money.
      plans.push(planFor(supply, feeders, 'Sell the parts', 'Skip the last craft and sell what feeds it'));
    }

    const usable = plans.filter((p) => p.priceable);
    if (!usable.length) continue;
    const best = usable.reduce((a, b) => (b.net > a.net ? b : a));
    if (best.net < opts.minNetPerRun) continue;

    // NAME A FARM BY WHAT IT SELLS, NOT BY THE CRAFT IT WAS FOUND FROM. When "sell the parts"
    // wins, the terminal craft is not run at all, and headlining the card with its output is
    // simply wrong — the Broken LCD farm was billed as "Working LCD", which is its INPUT.
    // The products are what you walk away holding.
    const inPlan = new Set(best.stepIds);
    const runSteps = orderSteps(chain.steps.filter((s) => inPlan.has(s.craft.id)));
    const products = best.sells.map((s) => s.itemId);

    // A terminal the winning plan skipped is the most interesting thing on the card: it is
    // the "or craft the third thing" branch, priced. Seed it as the first alternative.
    const alsoFeeds = [];
    if (!inPlan.has(craft.id)) {
      const full = usable.find((p) => p.stepIds.length === chain.steps.length);
      alsoFeeds.push({
        craft, output, net: full ? full.net : null, delta: full ? full.net - best.net : null,
      });
    }

    const stations = [...new Set(runSteps.map((s) => s.craft.stationName))];
    farms.push({
      id: craft.id,
      terminal: craft,
      output,
      products,
      runSteps,
      chain,
      plans: usable,
      best,
      throughput: throughputFor(supply, best),
      stations,
      // Repeating one recipe tanks hideout XP, so a farm you can alternate inside is worth
      // more than its rubles alone. Two crafts is the threshold Trey named. Counted over the
      // steps you actually RUN — a chain whose winner drops the terminal does not rotate on
      // the strength of a craft you were just told to skip.
      rotation: { crafts: runSteps.length, rotatable: runSteps.length >= 2 },
      depth: Math.max(...runSteps.map((s) => s.depth)) + 1,
      // Classified by the plan you would RUN, not by the chain that was explored. A two-step
      // chain whose winner drops the terminal is a single-step farm however it was found.
      kind: best.stepIds.length > 1 ? 'chain' : 'single',
      // Seeded above with a skipped terminal; extended by the dedupe below.
      alsoFeeds,
    });
  }

  farms.sort((a, b) => (b.best.perHour ?? -Infinity) - (a.best.perHour ?? -Infinity)
    || b.best.net - a.best.net);

  // COLLAPSE FARMS THAT ARE THE SAME ADVICE. Four separate armour crafts all consume ripstop
  // and aramid, and for all four the winning move is the same: make the two fabrics and sell
  // them raw. Ranked by the plan you would actually run, they are one farm listed four times.
  // Keying on the WINNING plan's steps (not the whole chain) folds them into one card, and
  // the terminals that lost are kept on it as `alsoFeeds` — because "this could also feed a
  // Module-3M, and that is worth 53k less" is the answer to the question, not clutter.
  const byPlan = new Map();
  for (const farm of farms) {
    const key = [...farm.best.stepIds].sort().join('|');
    const held = byPlan.get(key);
    if (!held) { byPlan.set(key, farm); continue; }
    const dropped = farm.best.stepIds.length < farm.chain.steps.length;
    if (dropped && !held.alsoFeeds.some((a) => a.craft.id === farm.terminal.id)) {
      const full = farm.plans.find((p) => p.stepIds.length === farm.chain.steps.length);
      held.alsoFeeds.push({
        craft: farm.terminal,
        output: farm.output,
        net: full ? full.net : null,
        delta: full ? full.net - held.best.net : null,
      });
    }
  }
  for (const farm of byPlan.values()) {
    farm.alsoFeeds.sort((a, b) => (b.net ?? -Infinity) - (a.net ?? -Infinity));
  }
  const unique = [...byPlan.values()];

  const cycles = findCycles(supply);

  return {
    farms: unique,
    cycles,
    supply,
    stats: {
      ...supply.stats,
      crafts: (craftIndex.crafts || []).length,
      considered: supply.craftable.length,
      candidates: farms.length,
      farms: unique.length,
      chains: unique.filter((f) => f.kind === 'chain').length,
      traderFed: unique.filter((f) => f.throughput.traderFed).length,
      mode: supply.meta.mode,
    },
  };
}

/**
 * True cycles: a craft chain that returns an item to its own ingredient list.
 *
 * There are ten of them in the current game files, and three multiply the item they cycle —
 * but every one of those three also eats something from outside the loop, so none is free.
 * `infinite` is the flag that would matter: more out than in, and nothing consumed from
 * outside. Nothing in the game satisfies it today, which is itself the answer to "is any of
 * this ACTUALLY infinite" — no, every loop here is metered by trader restock. Kept, and
 * tested, because a wipe could add one and nobody would think to look.
 */
export function findCycles(supply) {
  const producers = new Map();
  for (const craft of supply.craftable) {
    for (const out of craft.outputs) {
      if (!producers.has(out.itemId)) producers.set(out.itemId, []);
      producers.get(out.itemId).push(craft);
    }
  }

  const cycles = [];
  const seen = new Set();
  const MAX_LOOP = 6;

  // Walking backwards from a product to its ingredients. `path[k]` is made from `path[k+1]`
  // by `edges[k]`, so when an ingredient turns up already in the path the loop is that
  // suffix plus the edge that just closed it.
  const walk = (itemId, path, edges) => {
    for (const craft of producers.get(itemId) || []) {
      const outCount = craft.outputs.find((o) => o.itemId === itemId)?.count || 1;
      for (const input of craft.inputs) {
        const edge = {
          craft, from: input.itemId, to: itemId, inCount: input.count || 1, outCount,
        };
        const at = path.indexOf(input.itemId);
        if (at !== -1) {
          const loop = [...edges.slice(at), edge];
          const key = loop.map((e) => `${e.craft.id}:${e.from}>${e.to}`).sort().join('|');
          if (seen.has(key)) continue;
          seen.add(key);
          // The lap multiplier, followed ALONG THE CYCLE. Counting every input and output of
          // each craft instead (the first version) makes "1 power supply -> 6 capacitors"
          // look like a 6x multiplier when the capacitors never come back round, and it
          // reported eleven fictional infinite-money loops in the shipped snapshot.
          let ratio = 1;
          for (const e of loop) ratio *= e.outCount / e.inCount;

          // A lap can multiply the tracked item and STILL not be free, because the crafts
          // around the loop consume other things too. 1x Pile of meds -> 3x AI-2 medkit ->
          // 3x Pile of meds looks like 9x a lap, but the return leg also eats an aseptic
          // bandage and a pack of Augmentin, which you have to buy. Only a loop that
          // consumes nothing from outside itself is an actual infinite-money glitch, so the
          // side inputs are collected and that is a separate, much stronger flag.
          const inside = new Set(loop.map((e) => e.to));
          const sideInputs = new Map();
          for (const e of loop) {
            for (const input of e.craft.inputs) {
              if (inside.has(input.itemId)) continue;
              sideInputs.set(input.itemId, (sideInputs.get(input.itemId) || 0) + (input.count || 1));
            }
          }

          cycles.push({
            items: [...path.slice(at), input.itemId],
            crafts: loop.map((e) => e.craft),
            edges: loop,
            ratio,
            sideInputs: [...sideInputs].map(([itemId, count]) => ({ itemId, count })),
            selfContained: sideInputs.size === 0,
            multiplying: ratio > 1,
            // The only thing that would genuinely be free money: more comes out than went in,
            // and nothing else is consumed to do it.
            infinite: ratio > 1 && sideInputs.size === 0,
          });
          continue;
        }
        if (path.length < MAX_LOOP) walk(input.itemId, [...path, input.itemId], [...edges, edge]);
      }
    }
  };

  for (const itemId of producers.keys()) walk(itemId, [itemId], []);
  return cycles.sort((a, b) => (b.infinite ? 1 : 0) - (a.infinite ? 1 : 0)
    || (a.sideInputs.length - b.sideInputs.length)
    || b.ratio - a.ratio);
}

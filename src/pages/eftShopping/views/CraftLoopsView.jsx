// /EFTsh/loops — the semi-infinite craft loops, as cards.
//
// Deliberately NOT the craft tree. `CraftTreeView` answers "where does this item come from",
// which needs a graph you can pan around. This answers a different question — "what can I sit
// down and repeat forever" — and the answer is a shopping list, two or three crafts, and a
// price. That fits on a card, and a card is what was asked for.
//
// Every number here comes out of eftCraftLoops.js, which is pure and tested. This file only
// arranges it. The one judgement it adds is which controls exist, and those are the three
// that change the answer: what you sort by, whether flea-fed loops count, and whether to hide
// farms your hideout and traders cannot actually run yet.

import { useCallback, useMemo, useState } from 'react';

import { useEft } from '../eftContext';
import { itemIcon } from '../eftApi';
import { buildCraftIndex } from '../eftCraftGraph';
import { findCraftLoops } from '../eftCraftLoops';
import { Panel, Seg, Stat, fmtRub, fmtShort, fmtDuration, fmtAgo } from '../EftBits';

const SORTS = [
  { value: 'hour', label: '₽ / hour', title: 'Profit divided by how long the crafts take' },
  { value: 'batch', label: '₽ / batch', title: 'Profit from one run of the whole thing' },
  { value: 'margin', label: 'Return', title: 'Profit as a multiple of what you spend' },
];

const SUPPLY = [
  { value: 'all', label: 'Any supply', title: 'Trader stock and flea listings both count' },
  { value: 'trader', label: 'Trader-fed only', title: 'Every input from unlimited trader stock — nothing depends on other players listing things' },
];

const stamp = (epoch) => (epoch ? fmtAgo(epoch * 1000) : 'unknown');

// Flea prices move hourly and every number on this page is a profit calculation, so a
// day-old snapshot is not wrong so much as no longer load-bearing.
const STALE_AFTER_SECONDS = 24 * 3600;
const isStale = (epoch) => !epoch || (Date.now() / 1000 - epoch) > STALE_AFTER_SECONDS;

function Chip({ itemId, name, count, sub, tone }) {
  return (
    <span className={`eft-fl-chip${tone ? ` eft-is-${tone}` : ''}`}>
      <img
        className="eft-fl-chipicon"
        src={itemIcon(itemId)}
        alt=""
        loading="lazy"
        onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
      />
      <span className="eft-fl-chiptext">
        <span className="eft-fl-chipname">
          <b>{count}×</b> {name}
        </span>
        {sub ? <span className="eft-fl-chipsub">{sub}</span> : null}
      </span>
    </span>
  );
}

function FarmCard({ farm, nameOf, onShop }) {
  const { best } = farm;
  const t = farm.throughput;
  const [showAll, setShowAll] = useState(false);

  const sourceOf = (buy) => {
    const route = buy.route;
    if (!route) return null;
    if (route.kind === 'flea') return `flea · ${fmtRub(route.rub)}`;
    return `${route.offer.trader} LL${route.offer.level}${route.kind === 'barter' ? ' barter' : ''} · ${fmtRub(route.rub)}`;
  };
  const buyBy = new Map(best.buys.map((b) => [b.itemId, b]));
  const sellBy = new Map(best.sells.map((s) => [s.itemId, s]));

  return (
    <article className={`eft-fl-card${t.traderFed ? ' eft-is-traderfed' : ''}`}>
      <header className="eft-fl-head">
        <div className="eft-fl-title">
          <h3>{farm.products.map(nameOf).join('  +  ')}</h3>
          <div className="eft-fl-tags">
            {t.traderFed
              ? <span className="eft-fl-tag eft-is-good" title="Every input comes from unlimited trader stock. Nothing here depends on another player listing something.">trader-fed</span>
              : <span className="eft-fl-tag" title="At least one input has to be bought off the flea, so it depends on other players listing it.">needs the flea</span>}
            {farm.rotation.rotatable
              ? <span className="eft-fl-tag eft-is-good" title={`${farm.rotation.crafts} different recipes — alternate between them and the hideout XP penalty for repeating one craft never kicks in.`}>{farm.rotation.crafts} crafts · full XP</span>
              : <span className="eft-fl-tag eft-is-warn" title="One recipe on its own. Repeating a single craft cuts the hideout XP hard — pair this with another farm.">1 craft · pair it</span>}
            {t.runsPerRestock == null ? null : (
              <span className="eft-fl-tag" title={t.limiter ? `${nameOf(t.limiter.itemId)} is the bottleneck — ${t.limiter.perRestock} available per restock, and a batch needs ${t.limiter.count}.` : ''}>
                {t.runsPerRestock === 0 ? 'under 1 batch / restock' : `${t.runsPerRestock}× per restock`}
              </span>
            )}
            <span className="eft-fl-tag">{farm.stations.join(' + ')}</span>
            <span className="eft-fl-tag">{fmtDuration(best.wallSeconds)}</span>
          </div>
        </div>
        <div className="eft-fl-money">
          <div className="eft-fl-net">+{fmtShort(best.net)}</div>
          <div className="eft-fl-rate">
            {best.perHour != null ? `${fmtShort(best.perHour)}/hr` : '—'}
            {best.margin != null ? ` · ${Math.round(best.margin * 100)}%` : ''}
          </div>
        </div>
      </header>

      <ol className="eft-fl-steps">
        {farm.runSteps.map((step) => {
          const yieldCount = (step.craft.outputs.find((o) => o.itemId === step.outputId)?.count || 1) * step.runs;
          const sold = sellBy.get(step.outputId);
          return (
            <li key={`${step.craft.id}:${step.outputId}`} className="eft-fl-step">
              <div className="eft-fl-ins">
                {step.craft.inputs.map((input, i) => {
                  const buy = buyBy.get(input.itemId);
                  return (
                    <span key={input.itemId} className="eft-fl-inwrap">
                      {i ? <span className="eft-fl-plus">+</span> : null}
                      <Chip
                        itemId={input.itemId}
                        name={nameOf(input.itemId)}
                        count={(input.count || 1) * step.runs}
                        sub={buy ? sourceOf(buy) : 'made above'}
                        tone={buy ? null : 'made'}
                      />
                    </span>
                  );
                })}
              </div>
              <span className="eft-fl-arrow" aria-hidden="true">→</span>
              <div className="eft-fl-out">
                <Chip
                  itemId={step.outputId}
                  name={nameOf(step.outputId)}
                  count={yieldCount}
                  sub={sold ? `sell ${fmtRub(sold.best.rub)} ea · ${sold.best.via === 'flea' ? 'flea' : sold.best.trader}` : 'feeds the next step'}
                  tone={sold ? 'sell' : null}
                />
                <span className="eft-fl-where">
                  {step.craft.stationName} {step.craft.level} · {fmtDuration((step.craft.duration || 0) * step.runs)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="eft-fl-foot">
        <div className="eft-fl-sums">
          <span className="eft-fl-sum">
            spend <b>{fmtRub(best.cost)}</b>
          </span>
          <span className="eft-fl-arrow" aria-hidden="true">→</span>
          <span className="eft-fl-sum">
            back <b>{fmtRub(best.revenue)}</b>
          </span>
          <span className="eft-fl-sum eft-is-net">= <b>+{fmtRub(best.net)}</b></span>
          {best.sells.some((s) => s.best.via === 'flea') ? (
            <span className="eft-fl-note" title="The flea sales fee is not modelled — it has changed between patches and guessing at the coefficients would put invented numbers on this card. Trader prices are exact.">
              flea prices are before fee
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="eft-btn eft-btn-sm"
          onClick={() => onShop(farm)}
          title="Put this batch's whole shopping list on the ongoing list"
        >
          + Shopping list
        </button>
      </footer>

      {farm.alsoFeeds.length ? (
        <div className="eft-fl-also">
          <button
            type="button"
            className="eft-fl-alsotoggle"
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
          >
            {showAll ? '▾' : '▸'} these also feed {farm.alsoFeeds.length} craft{farm.alsoFeeds.length > 1 ? 's' : ''}
            {farm.alsoFeeds[0].delta != null && farm.alsoFeeds[0].delta < 0
              ? ' — all of them worth less than selling raw' : ''}
          </button>
          {showAll ? (
            <ul className="eft-fl-alsolist">
              {farm.alsoFeeds.map((alt) => (
                <li key={alt.craft.id}>
                  <span>{alt.output.count || 1}× {nameOf(alt.output.itemId)}</span>
                  <span className={alt.delta == null ? '' : alt.delta >= 0 ? 'eft-is-good' : 'eft-is-bad'}>
                    {alt.delta == null ? 'no price' : `${alt.delta >= 0 ? '+' : ''}${fmtRub(alt.delta)}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function CraftLoopsView() {
  // The raw snapshot, not the merged item fields: this engine needs the trader assortment and
  // the FX table, neither of which belongs on an item record. The shell already loaded it for
  // the mode in play, so there is nothing to fetch here.
  const {
    data, items, levels, profile, gameMode, status, priceSnapshot: prices,
    addToShoppingList, showToast,
  } = useEft();

  const [sort, setSort] = useState('hour');
  const [supplyMode, setSupplyMode] = useState('all');
  const [onlyMine, setOnlyMine] = useState(false);
  const [query, setQuery] = useState('');

  const nameOf = useCallback((id) => items?.[id]?.name || id, [items]);

  const result = useMemo(() => {
    if (!data || !prices) return null;
    const index = buildCraftIndex(data);
    return findCraftLoops(index, prices, {
      // Gating is opt-in: the default is "show me everything that exists", because a farm you
      // cannot run yet is still worth knowing about when you are choosing what to upgrade.
      stationLevels: onlyMine ? (levels || {}) : null,
      traderLevels: onlyMine ? traderLevelMap(profile, data) : null,
      playerLevel: onlyMine ? (profile?.playerLevel || null) : null,
    });
  }, [data, prices, onlyMine, levels, profile]);

  const farms = useMemo(() => {
    if (!result) return [];
    const q = query.trim().toLowerCase();
    let list = result.farms;
    if (supplyMode === 'trader') list = list.filter((f) => f.throughput.traderFed);
    if (q) {
      list = list.filter((f) => {
        const words = [
          ...f.products.map(nameOf),
          ...f.best.buys.map((b) => nameOf(b.itemId)),
          ...f.stations,
        ].join(' ').toLowerCase();
        return words.includes(q);
      });
    }
    const key = {
      hour: (f) => f.best.perHour ?? -Infinity,
      batch: (f) => f.best.net,
      margin: (f) => f.best.margin ?? -Infinity,
    }[sort];
    return [...list].sort((a, b) => key(b) - key(a));
  }, [result, sort, supplyMode, query, nameOf]);

  const shop = (farm) => {
    for (const buy of farm.best.buys) {
      addToShoppingList({ itemId: buy.itemId, name: nameOf(buy.itemId), need: Math.ceil(buy.count) });
    }
    showToast(`${farm.best.buys.length} item${farm.best.buys.length > 1 ? 's' : ''} → ongoing list`);
  };

  if (!data || status.loading) {
    return <Panel><p className="eft-empty">Loading craft loops…</p></Panel>;
  }

  if (!prices) {
    return (
      <Panel title="Craft loops">
        <p className="eft-empty">
          No price snapshot for the <b>{gameMode}</b> economy. This page needs one — a craft loop
          is a question about money, and without prices there is nothing to answer. Build it with{' '}
          <code>npm run eft:prices -- --mode={gameMode}</code>, then reload.
        </p>
      </Panel>
    );
  }

  const { stats, cycles, supply } = result;
  const chains = farms.filter((f) => f.kind === 'chain');
  const singles = farms.filter((f) => f.kind === 'single');
  const scanned = supply.meta.scannedAt?.flea;
  const stale = isStale(scanned);

  return (
    <div className="eft-fl">
      <Panel
        title="Craft loops"
        help={(
          <>
            <p>
              A <b>loop</b> is a craft whose inputs you can simply re-buy — a trader offer with
              unlimited stock, or a flea listing that is always there. Those crafts never run
              out, so you can sit and repeat them. Some feed each other, which is where the
              multi-step cards come from.
            </p>
            <p>
              Nothing here is hand-written. The engine reads the recipe graph and the live
              trader assortment and works the loops out, so it stays right through a wipe —
              re-run <code>npm run eft:prices</code> and the answers change with the economy.
              <code>npm run eft:loops</code> prints the same results in a terminal.
            </p>
            <p>
              <b>Sell the parts vs craft it all.</b> Each card is costed both ways and shows the
              winner. Often the last craft in a chain destroys value: the two fabrics are worth
              more raw than the armour they make. &ldquo;These also feed…&rdquo; lists every
              craft that could consume the output, with what taking that branch would cost you.
            </p>
            <p>
              <b>Per restock</b> is how many batches trader stock allows before it refreshes,
              following the whole barter ladder to its tightest link — that is the &ldquo;semi&rdquo;
              in semi-infinite. Flea prices are <b>gross</b>; the sales fee is not modelled,
              because guessing at its coefficients would put invented numbers on the page.
            </p>
          </>
        )}
        actions={(
          <div className="eft-fl-controls">
            <input
              className="eft-input eft-fl-search"
              type="search"
              value={query}
              placeholder="Filter by item or station…"
              onChange={(e) => setQuery(e.target.value)}
            />
            <Seg options={SORTS} value={sort} onChange={setSort} />
            <Seg options={SUPPLY} value={supplyMode} onChange={setSupplyMode} />
            <label className="eft-checkline" title="Hide farms your station levels, trader loyalty or player level cannot reach yet. Uses what you have set on the Hideout and Settings tabs.">
              <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
              Only what I can run
            </label>
          </div>
        )}
      >
        <div className="eft-stats">
          <Stat label="Farms" value={farms.length} sub={`${chains.length} multi-step`} />
          <Stat label="Trader-fed" value={stats.traderFed} sub="no flea needed" />
          <Stat
            label="Best"
            value={farms[0] ? `${fmtShort(farms[0].best.perHour)}/hr` : '—'}
            sub={farms[0] ? farms[0].products.map(nameOf).join(' + ') : null}
          />
          <Stat
            label="Prices"
            value={stamp(scanned)}
            sub={`${prices.mode} · traders ${stamp(supply.meta.scannedAt?.traders)}`}
            tone={stale ? 'warn' : null}
          />
        </div>

        {stale ? (
          <p className="eft-fl-warn">
            These prices were scanned <b>{scanned ? fmtAgo(scanned * 1000) : 'at an unknown time'}</b>.
            The flea moves hourly and every number on this page is a profit calculation, so
            rebuild before trusting the ranking: <code>npm run eft:prices</code>.
          </p>
        ) : null}
      </Panel>

      {farms.length === 0 ? (
        <Panel>
          <p className="eft-empty">
            Nothing matches. {onlyMine
              ? 'Try turning off “Only what I can run” — most farms need a station level or trader loyalty you have not recorded yet.'
              : 'Try a wider filter.'}
          </p>
        </Panel>
      ) : null}

      {chains.length ? (
        <section className="eft-fl-section">
          <h2 className="eft-fl-sectionhead">
            Chains <span>one craft feeding another — these rotate on their own</span>
          </h2>
          <div className="eft-fl-grid">
            {chains.map((farm) => (
              <FarmCard key={farm.id} farm={farm} nameOf={nameOf} onShop={shop} />
            ))}
          </div>
        </section>
      ) : null}

      {singles.length ? (
        <section className="eft-fl-section">
          <h2 className="eft-fl-sectionhead">
            Single crafts <span>buy, craft, sell — pair any two to keep the hideout XP up</span>
          </h2>
          <div className="eft-fl-grid">
            {singles.map((farm) => (
              <FarmCard key={farm.id} farm={farm} nameOf={nameOf} onShop={shop} />
            ))}
          </div>
        </section>
      ) : null}

      <Panel
        title="Is any of it actually infinite?"
        collapsible
        defaultOpen={false}
        help={(
          <p>
            A craft cycle returns an item to its own ingredient list. If one ever did that while
            consuming nothing from outside itself, it would be literal infinite money. This
            checks every wipe so nobody has to remember to look.
          </p>
        )}
      >
        <p className="eft-fl-verdict">
          {cycles.some((c) => c.infinite) ? (
            <><b className="eft-is-bad">Yes — found one.</b> A cycle below multiplies an item and
              consumes nothing else to do it.</>
          ) : (
            <><b>No.</b> {cycles.length} craft cycles exist and {cycles.filter((c) => c.multiplying).length} of
              them multiply the item they cycle, but every one also eats something from outside
              the loop. So no craft is free money — every farm on this page is metered by how
              fast traders restock.</>
          )}
        </p>
        <ul className="eft-fl-cycles">
          {cycles.map((cycle) => (
            <li key={cycle.crafts.map((c) => c.id).join('|')} className={cycle.infinite ? 'eft-is-bad' : ''}>
              <span className="eft-fl-cycleratio">{cycle.ratio.toFixed(2)}×</span>
              <span className="eft-fl-cyclepath">{cycle.items.map(nameOf).join(' → ')}</span>
              {cycle.sideInputs.length ? (
                <span className="eft-fl-cyclecost">
                  also eats {cycle.sideInputs.map((s) => `${s.count}× ${nameOf(s.itemId)}`).join(', ')}
                </span>
              ) : <span className="eft-fl-cyclecost eft-is-bad">consumes nothing else</span>}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/**
 * The store keys trader loyalty by normalized name (`ragman`); the price snapshot names them
 * as they appear in game (`Ragman`). The snapshot's own trader table is the bridge, so nobody
 * has to hand-maintain a second mapping that drifts.
 */
function traderLevelMap(profile, data) {
  const out = {};
  for (const trader of data?.traders || []) {
    const have = profile?.traders?.[trader.normalizedName];
    if (have != null) out[trader.name] = have;
  }
  return Object.keys(out).length ? out : null;
}

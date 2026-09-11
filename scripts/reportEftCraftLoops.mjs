// npm run eft:loops  [-- --top=20 --all --mode=pve|regular]
//
// Prints what eftCraftLoops.js finds, in the terminal, from the committed snapshots. This is
// the "run it one time and it tells you" surface Trey asked for; /EFTsh/loops draws the same
// results as cards.
//
// It imports the SAME pure module the app does — no second implementation, so a number that
// looks wrong here is wrong there too, and vice versa. Run `npm run eft:prices` first if the
// price snapshot is stale.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCraftIndex } from '../src/pages/eftShopping/eftCraftGraph.js';
import { findCraftLoops } from '../src/pages/eftShopping/eftCraftLoops.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'data');
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const flag = (name) => process.argv.includes(`--${name}`);

const rub = (n) => (n == null ? '—' : `${Math.round(n).toLocaleString('en-US')}`);
const short = (n) => {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}m`;
  if (abs >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
};
const hours = (s) => (s >= 3600 ? `${(s / 3600).toFixed(1)}h` : `${Math.round(s / 60)}m`);

function main() {
  const snapshot = read('hideoutSnapshot.json');
  const prices = read(`prices/${arg('mode', 'pve')}.json`);
  const nameRows = read('itemNames.json').rows;
  const NAME = new Map(nameRows.map((r) => [r[0], r[1]]));
  const nameOf = (id) => snapshot.items?.[id]?.name || NAME.get(id) || id;

  const index = buildCraftIndex(snapshot);
  const result = findCraftLoops(index, prices);
  const { farms, cycles, stats, supply } = result;

  const age = (epoch) => (epoch ? `${Math.round((Date.now() / 1000 - epoch) / 60)} min old` : 'unknown');
  console.log(`\nEFT craft loops — ${stats.mode} economy`);
  console.log(`  prices scanned ${age(supply.meta.scannedAt?.flea)}, traders ${age(supply.meta.scannedAt?.traders)}`);
  console.log(`  ${stats.crafts} recipes -> ${stats.considered} runnable -> ${stats.candidates} profitable `
    + `-> ${stats.farms} distinct farms after collapsing duplicate advice`);
  console.log(`  ${stats.chains} multi-step, ${stats.traderFed} fed entirely by unlimited trader stock`);
  console.log(`  supply fixed point: ${stats.priced} items priced in ${stats.passes} passes`
    + `${stats.converged ? '' : ' (DID NOT CONVERGE)'}`);

  const top = flag('all') ? farms.length : Number(arg('top', 12));
  const chains = farms.filter((f) => f.kind === 'chain');
  const singles = farms.filter((f) => f.kind === 'single');

  const printFarm = (farm, i) => {
    const { best } = farm;
    const t = farm.throughput;
    console.log(`\n${String(i + 1).padStart(3)}. ${farm.products.map(nameOf).join(' + ')}`
      + `  —  ${short(best.perHour)}/h, net ${rub(best.net)} per batch`);
    console.log(`     ${farm.stations.join(' + ')} · ${hours(best.wallSeconds)} wall · `
      + `${farm.rotation.crafts} craft${farm.rotation.crafts > 1 ? 's' : ''}`
      + `${farm.rotation.rotatable ? ' (rotatable — full hideout XP)' : ' (single recipe — XP falls off)'}`
      + `${t.traderFed ? ' · trader-fed' : t.usesFlea ? ' · needs the flea' : ''}`
      + `${t.runsPerRestock == null ? '' : t.runsPerRestock === 0
        ? ' · under one batch per restock' : ` · ${t.runsPerRestock}x per restock`}`);

    for (const step of farm.runSteps) {
      const ins = step.craft.inputs.map((x) => `${(x.count || 1) * step.runs}x ${nameOf(x.itemId)}`).join(' + ');
      const yieldCount = (step.craft.outputs.find((o) => o.itemId === step.outputId)?.count || 1) * step.runs;
      console.log(`       ${ins}  ->  ${yieldCount}x ${nameOf(step.outputId)}`
        + `   [${step.craft.stationName} L${step.craft.level}, ${hours((step.craft.duration || 0) * step.runs)}]`);
    }

    console.log(`     buy: ${best.buys.map((b) => `${b.count}x ${nameOf(b.itemId)} @ ${rub(b.unit)}`
      + `${b.route?.kind === 'flea' ? ' (flea)' : b.route ? ` (${b.route.offer.trader} LL${b.route.offer.level}${b.route.kind === 'barter' ? ', barter' : ''})` : ''}`).join(', ')}`);
    console.log(`     sell: ${best.sells.map((s) => `${s.count}x ${nameOf(s.itemId)} @ ${rub(s.best.rub)}`
      + ` (${s.best.via === 'flea' ? 'flea' : s.best.trader})`).join(', ')}  =  ${rub(best.revenue)}`);
    if (farm.plans.length > 1) {
      const other = farm.plans.filter((p) => p !== best);
      console.log(`     vs ${other.map((p) => `"${p.label}" ${rub(p.net)}`).join(', ')}`
        + `  ->  ${best.label} wins by ${rub(best.net - Math.max(...other.map((p) => p.net)))}`);
    }
    if (farm.alsoFeeds.length) {
      console.log(`     these also feed: ${farm.alsoFeeds.slice(0, 4).map((a) => `${nameOf(a.output.itemId)}`
        + `${a.delta != null ? ` (${a.delta >= 0 ? '+' : ''}${rub(a.delta)}/batch)` : ''}`).join(', ')}`);
    }
  };

  console.log(`\n${'='.repeat(78)}\nMULTI-STEP LOOPS — one craft feeding another (${chains.length})`);
  chains.slice(0, top).forEach(printFarm);

  console.log(`\n${'='.repeat(78)}\nSINGLE-STEP FARMS — buy, craft, sell (${singles.length})`);
  console.log('  Pair any two of these to keep hideout XP up.\n');
  singles.slice(0, top).forEach((farm, i) => {
    const step = farm.runSteps[0];
    const ins = step.craft.inputs.map((x) => `${(x.count || 1) * step.runs}x ${nameOf(x.itemId)}`).join(' + ');
    const out = (step.craft.outputs.find((o) => o.itemId === step.outputId)?.count || 1) * step.runs;
    console.log(`${String(i + 1).padStart(3)}. ${short(farm.best.perHour).padStart(6)}/h  `
      + `${ins} -> ${out}x ${nameOf(step.outputId)}`
      + `  [${step.craft.stationName} L${step.craft.level}]`
      + `${farm.throughput.traderFed ? ' ·trader-fed' : ''}`);
  });

  const free = cycles.filter((c) => c.infinite);
  console.log(`\n${'='.repeat(78)}\nTRUE CYCLES — a craft chain that feeds itself (${cycles.length})`);
  if (!free.length) {
    console.log('  No FREE one. Every cycle below consumes something from outside itself, so none of');
    console.log('  them is infinite money — the loops on this page are metered by trader restock.\n');
  }
  for (const c of cycles.slice(0, 10)) {
    const tag = c.infinite ? '🔴 FREE INFINITE LOOP' : c.multiplying ? 'multiplies' : 'breaks even';
    console.log(`  ${tag} ${c.ratio.toFixed(2)}x a lap — ${c.items.map(nameOf).join(' -> ')}`);
    for (const e of c.edges) {
      console.log(`      ${e.inCount}x ${nameOf(e.from)} -> ${e.outCount}x ${nameOf(e.to)}`
        + `  [${e.craft.stationName} L${e.craft.level}]`);
    }
    if (c.sideInputs.length) {
      console.log(`      but also eats: ${c.sideInputs.map((x) => `${x.count}x ${nameOf(x.itemId)}`).join(', ')}`);
    }
  }
  console.log('');
}

main();

#!/usr/bin/env node
// Prune old Vercel deployments to keep Deployment Storage under the 10 GB free-tier cap.
//
// THIS IS A BACKSTOP, NOT THE MAIN MECHANISM. Retention does the routine work: Settings ->
// Security -> Deployment Retention Policy is set to 1 week for Production (the only state
// that matters here - 139 of 141 deployments). An earlier version of this comment claimed
// Hobby retention "cannot be set longer OR shorter" than 30 days and justified a manual
// prune with it; that was wrong - the dropdown offers 30 days / 2 weeks / 1 week / 1 day.
//
// What retention still cannot do, and why this script exists: its exceptions keep ~30 builds
// permanently regardless of age (last 10 created, last 20 production Ready, last 20
// non-production Ready, production alias, live PR branch), and the sweep takes up to 48
// hours, so a heavy deploy day can bank a large daily peak before it runs.
//
// Expect most runs to find nothing to prune. That is the success case.
//
// NOTE ON READING THE RESULT: Vercel bills in GB-months by summing each day's MAXIMUM
// stored amount across the billing period, so the red dashboard total only ever rises
// within a cycle and a prune cannot lower it. Judge a run by the per-day figure in the
// Usage drill-in instead.
//
//   npm run vercel:prune -- --status     # print state + last-checked date, change nothing
//   npm run vercel:prune -- --dry-run    # show exactly what would be deleted
//   npm run vercel:prune                 # delete, then stamp the last-checked date
//
// Requires the Vercel CLI (`npm i -g vercel`) and `vercel login`.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = path.join(ROOT, 'VERCEL-DEPLOYMENTS.md');

const PROJECT = 'astral-project';
const SCOPE = 'treylambs-projects';
const KEEP = 30; // matches Vercel's own retention exceptions — fewer would be deleted anyway
const MIN_AGE_DAYS = 7; // hard floor: never delete anything newer than this, whatever KEEP says
const BATCH = 20; // vercel rm accepts up to 200 urls, but small batches fail smaller

const args = process.argv.slice(2);
const STATUS = args.includes('--status');
const DRY = args.includes('--dry-run');

// On Windows the global install is a `vercel.cmd` shim, and since the CVE-2024-27980 fix
// Node refuses to spawnSync a .cmd/.bat without a shell (EINVAL, not ENOENT). So Windows
// needs shell:true. Because that reintroduces shell parsing, every argument is validated
// against a conservative pattern first rather than trusted — deployment urls, flags and
// numbers all pass, anything with a quote, space or metacharacter aborts the run.
const WIN = process.platform === 'win32';
const SAFE_ARG = /^[A-Za-z0-9._:/=-]+$/;

const vercel = (extra) => {
  const argv = [...extra, '--scope', SCOPE];
  const bad = argv.find((a) => !SAFE_ARG.test(a));
  if (bad) throw new Error(`ABORT: unsafe argument for shell invocation: ${JSON.stringify(bad)}`);
  return execFileSync('vercel', argv, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
    shell: WIN,
  });
};

function lastChecked() {
  if (!fs.existsSync(DOC)) return null;
  const m = fs.readFileSync(DOC, 'utf8').match(/^\*\*Last checked:\*\* (\d{4}-\d{2}-\d{2})/m);
  return m ? m[1] : null;
}

// Local date, not UTC. toISOString() would stamp tomorrow's date for an evening run in a
// negative-offset zone, and then read back as "1d ago" on the very same day.
const localDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function stampToday(count, deleted) {
  if (!fs.existsSync(DOC)) return;
  const today = localDay();
  const src = fs.readFileSync(DOC, 'utf8');
  const line = /^\*\*Last checked:\*\* .*$/m;
  if (!line.test(src)) {
    console.warn('! could not find the "Last checked:" line in VERCEL-DEPLOYMENTS.md — not stamped');
    return;
  }
  const next = src.replace(
    line,
    `**Last checked:** ${today} — ${count} deployments remaining, ${deleted} deleted that run.`,
  );
  // Encode first, write temp, replace last. Never open the target for writing before the
  // new content exists — see the doc-writing rule in theknowledgebase/CLAUDE.md.
  const buf = Buffer.from(next, 'utf8');
  const tmp = `${DOC}.tmp`;
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, DOC);
  console.log(`stamped VERCEL-DEPLOYMENTS.md: ${today}`);
}

function fetchAll() {
  const out = [];
  let next = null;
  for (let page = 1; page <= 20; page++) {
    const extra = ['ls', PROJECT, '--json', '--limit', '100'];
    if (next) extra.push('-N', String(next));
    const data = JSON.parse(vercel(extra));
    out.push(...(data.deployments || []));
    next = data.pagination?.next;
    if (!next) break;
  }
  const seen = new Set();
  return out.filter((d) => !seen.has(d.url) && seen.add(d.url)).sort((a, b) => b.createdAt - a.createdAt);
}

const ageDays = (t) => (Date.now() - t) / 864e5;
const fmt = (t) => new Date(t).toISOString().slice(0, 16).replace('T', ' ');

const prev = lastChecked();
// Compare local midnight to local midnight so a same-day run reads as 0d, not 1d.
const staleDays = prev
  ? Math.round((Date.parse(`${localDay()}T00:00`) - Date.parse(`${prev}T00:00`)) / 864e5)
  : null;
console.log(`last checked: ${prev ?? '(never)'}${staleDays !== null ? ` (${staleDays}d ago)` : ''}`);

const all = fetchAll();
console.log(`deployments : ${all.length}`);
if (all.length) {
  console.log(`newest      : ${fmt(all[0].createdAt)} (${ageDays(all[0].createdAt).toFixed(1)}d)`);
  console.log(`oldest      : ${fmt(all.at(-1).createdAt)} (${ageDays(all.at(-1).createdAt).toFixed(1)}d)`);
}

if (STATUS) process.exit(0);

const kill = all.slice(KEEP).filter((d) => ageDays(d.createdAt) >= MIN_AGE_DAYS);
const skipped = all.slice(KEEP).length - kill.length;

if (!kill.length) {
  console.log(`\nnothing to prune (keeping newest ${KEEP}, min age ${MIN_AGE_DAYS}d).`);
  if (!DRY) stampToday(all.length, 0);
  process.exit(0);
}

console.log(`\nwould delete ${kill.length} of ${all.length} (keeping newest ${KEEP})`);
if (skipped) console.log(`  ${skipped} past the keep window but under ${MIN_AGE_DAYS}d — held back by the age floor`);
console.log(`  newest to go: ${fmt(kill[0].createdAt)} (${ageDays(kill[0].createdAt).toFixed(1)}d)`);
console.log(`  oldest to go: ${fmt(kill.at(-1).createdAt)} (${ageDays(kill.at(-1).createdAt).toFixed(1)}d)`);

// Safety rails. Each of these would mean the plan above is not what it claims to be.
if (all.length - kill.length < KEEP - skipped) throw new Error('ABORT: would leave fewer than the keep set');
if (kill.some((d) => ageDays(d.createdAt) < MIN_AGE_DAYS)) throw new Error('ABORT: kill list breached the age floor');
if (kill.some((d) => all.slice(0, KEEP).includes(d))) throw new Error('ABORT: kill list overlaps the keep set');

if (DRY) {
  console.log('\n--dry-run: nothing deleted.');
  process.exit(0);
}

let deleted = 0;
for (let i = 0; i < kill.length; i += BATCH) {
  const slice = kill.slice(i, i + BATCH);
  process.stdout.write(`  batch ${Math.floor(i / BATCH) + 1} (${slice.length})... `);
  try {
    vercel(['rm', ...slice.map((d) => d.url), '--yes']);
    deleted += slice.length;
    console.log('ok');
  } catch (err) {
    console.log('FAILED');
    console.error(String(err.stderr || err.message).split('\n').slice(0, 4).join('\n'));
  }
}

console.log(`\ndeleted ${deleted} of ${kill.length}`);
const after = fetchAll();
console.log(`deployments remaining: ${after.length}`);
stampToday(after.length, deleted);

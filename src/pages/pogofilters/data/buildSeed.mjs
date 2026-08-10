// Regenerates seed.json from the two markdown files that have been the source
// of truth for this project since 2026-07-18:
//   PogoFilters/Existingfilters.md   — the real saved filter queries
//   PogoFilters/ExistingLabels.md    — the label taxonomy
//
// Run:  node src/pages/pogofilters/data/buildSeed.mjs
//
// After the app is in use it owns the data (Firestore / localStorage) and this
// only matters for a fresh install or a reset. Same role as pogoaccs/data/refresh.mjs.
//
// Parsing rules, deliberately conservative — a query is copied VERBATIM, never
// rewritten. A line is a query if it contains '&'; a bare comma-list of words
// with no '&' is a species group (the MEGAS list), not a filter. Any non-query
// line immediately above becomes the name.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..', '..');
const srcDir = join(repoRoot, 'PogoFilters');

const filtersMd = readFileSync(join(srcDir, 'Existingfilters.md'), 'utf8');
const labelsMd = readFileSync(join(srcDir, 'ExistingLabels.md'), 'utf8');

// A trailing ':' always means a heading, even when it contains '&' — the md has
// "3&4 (no low star):" as a section title above its query. No real saved query
// ends in a colon.
const isHeading = (l) => l.endsWith(':');
const isQuery = (l) => !isHeading(l) && l.includes('&');
const isSpeciesList = (l) => !l.includes('&') && /^[a-z0-9]+(,[a-z0-9]+)+$/i.test(l) && l.split(',').length > 3;
// "Filter Query" is a literal echo of the in-game UI label in the md, not a name.
const isNoise = (l) => !l || /^filter query$/i.test(l) || /^[-=\s]+$/.test(l);

function parseFilters(md) {
  const lines = md.split(/\r?\n/).map((l) => l.trim());
  const filters = [];
  const groups = [];
  // Headings stack because the md titles some filters over two lines
  // ("Old- close" / "But not exact"). Keep the last two, nearest last.
  let pending = [];
  const takeName = () => (pending.length ? pending.slice(-2).join(' · ') : null);
  let unnamed = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isNoise(line)) continue;

    if (isSpeciesList(line)) {
      groups.push({
        id: `grp_${groups.length + 1}`,
        name: takeName() || `Species group ${groups.length + 1}`,
        members: line.split(',').map((s) => s.trim()).filter(Boolean),
        sourceLine: i + 1,
        notes: '',
      });
      pending = [];
      continue;
    }

    if (isQuery(line)) {
      let name = takeName();
      if (!name) {
        // Lines 71-84 of the md are a block of unnamed star/CP variants.
        // Derive something readable from the query itself rather than
        // inventing meaning: star band + CP threshold.
        const stars = /^!3\*&!4\*/.test(line) ? 'low ★'
          : /^0\*,1\*,2\*/.test(line) ? 'low ★'
          : /^3\*,4\*/.test(line) ? 'high ★'
          : /^3\*/.test(line) ? '3★'
          : 'any ★';
        const cp = line.match(/!?cp(\d+)-/);
        name = `${stars} · under ${cp ? cp[1] : '?'} cp (#${++unnamed})`;
      }
      filters.push({
        id: `flt_${filters.length + 1}`,
        name,
        query: line,
        sourceLine: i + 1,
        notes: '',
        group: '',
        managed: false,
        cpTier: null,
        starBand: null,
        managedTokens: [],
      });
      pending = [];
      continue;
    }

    // Anything else is a heading for whatever query comes next.
    pending.push(line.replace(/:$/, '').trim());
  }

  return { filters, groups };
}

function parseLabels(md) {
  const out = [];
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^labels:$/i.test(line) || line.startsWith('I don')) continue;
    // "Name: description" or bare "Name"
    const m = line.match(/^([A-Za-z][A-Za-z0-9]*)\s*:?\s*(.*)$/);
    if (!m) continue;
    const [, name, desc] = m;
    if (name.length > 24) continue; // prose line, not a label
    out.push({
      id: `lbl_${out.length + 1}`,
      name,
      notes: desc.trim(),
      color: null, // assigned deterministically at load time
      kind: 'label',
    });
  }
  return out;
}

const { filters, groups } = parseFilters(filtersMd);
const labels = parseLabels(labelsMd);

const seed = {
  _meta: {
    generated: new Date().toISOString().slice(0, 10),
    generator: 'src/pages/pogofilters/data/buildSeed.mjs',
    sources: ['PogoFilters/Existingfilters.md', 'PogoFilters/ExistingLabels.md'],
    note: 'Queries are copied verbatim. Nothing here is normalised or corrected — '
        + 'the app lints and rewrites on demand, never on import.',
  },
  filters,
  labels,
  groups,
};

writeFileSync(join(here, 'seed.json'), JSON.stringify(seed, null, 2) + '\n');

console.log(`filters: ${filters.length}`);
for (const f of filters) console.log(`  L${String(f.sourceLine).padStart(3)}  ${f.name}`);
console.log(`\ngroups: ${groups.length}`);
for (const g of groups) console.log(`  L${String(g.sourceLine).padStart(3)}  ${g.name} (${g.members.length} members)`);
console.log(`\nlabels: ${labels.length}`);
console.log('  ' + labels.map((l) => l.name).join(', '));

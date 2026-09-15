// Marker tooltips, formatted for a human.
//
// The tooltip used to be `<strong>title</strong><span>${marker.desc}</span>`, with the
// description injected exactly as mapgenie wrote it — which is wiki markdown. So a lock
// tooltip read:
//
//   **Key Required:** [RB-ORB1 Key](https://mapgenie.io/tarkov/maps/reserve?locationIds=66967) (+ Jackets/Scavs)
//
// as one unbroken run of text with the asterisks and the whole URL still in it. Trey,
// 2026-09-13: "The formatting is terrible for a tooltip like this. it's all jumbled. no
// formatting tbh. NO reason to link the mapgenie links."
//
// mapgenie uses ONE convention across every category — `**Label:**` sections, optionally
// with `-` bullets under them — measured on Streets at 435 of 1,540 descriptions, with
// labels like Location, Quest, Quest Giver, Requirements, Possible Spawns, Note and Leads
// To. So this is not a locked-door fix: parsing that convention once formats every
// tooltip on every map.
//
// Two rules hold whatever the source says:
//   - No URL ever reaches the tooltip. They are mapgenie deep links to a page the user is
//     not on, and they are unreadable inline. The link TEXT is kept; the target is dropped.
//   - Everything is escaped. The description is third-party text going into innerHTML.

import { splitSections, bodyLines, plainText, isLockCategory, LOCK_KIND } from '../eftLocks.js';

export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// mapgenie's spawn lists are "Spawn #1 (Shoreline)", "Spawn #2", ... repeated up to a
// dozen times. Collapsed to a count, because the individual entries were links and the
// links are gone — without the link there is nothing left to distinguish them.
const SPAWN_LINE = /^spawn\s*#?\d+/i;

function foldSpawnLines(lines) {
  const spawns = lines.filter((l) => SPAWN_LINE.test(l));
  if (spawns.length < 2) return lines;
  const rest = lines.filter((l) => !SPAWN_LINE.test(l));
  const where = [...new Set(
    spawns.map((l) => (l.match(/[([]([^)\]]+)[)\]]/) || [])[1]).filter(Boolean),
  )];
  const note = where.length
    ? `${spawns.length} known spawns (${where.join(', ')})`
    : `${spawns.length} known spawns`;
  return [...rest, note];
}

const KIND_NOTE = {
  [LOCK_KIND.KEYPAD]: 'Opened with a code, not a key',
  [LOCK_KIND.BREACH]: 'Breachable — no key needed',
  [LOCK_KIND.BUTTON]: 'Opened by a button or switch elsewhere',
  [LOCK_KIND.NONE]: 'Not obtainable in the current patch',
  [LOCK_KIND.UNKNOWN]: 'No known way in',
};

/**
 * A marker to the structured thing a tooltip should show.
 *
 * @param {object} marker    a committed markers/<map>.json entry
 * @param {object} category  its category row
 * @param {object} [lock]    the matching lockIndex record, when there is one
 */
export function tipModel(marker, category, lock) {
  const { lead, sections } = splitSections(marker?.desc || '');

  const rows = [];
  for (const section of sections) {
    const lines = foldSpawnLines(bodyLines(section.body));
    if (!lines.length) continue;
    rows.push({ label: plainText(section.label), lines });
  }

  const model = {
    title: plainText(marker?.title) || category?.title || 'Marker',
    category: category ? [category.group, category.title].filter(Boolean).join(' — ') : '',
    lead: plainText(lead),
    rows,
    key: null,
    note: '',
  };

  if (lock && isLockCategory(category)) {
    // The key is promoted out of the generic section list and given its own row, because
    // on a locked door it is the whole reason the marker is being hovered.
    model.rows = rows.filter((r) => !/^(key required|key|keys|requires|required|key card|keycard)$/i.test(r.label));
    model.key = lock.keyName
      ? { name: lock.itemName || lock.keyName, hint: lock.keyHint, kind: lock.kind, known: !!lock.itemId }
      : null;
    if (!lock.keyName) model.note = lock.mechanism || KIND_NOTE[lock.kind] || '';
  }

  return model;
}

/** The model as escaped HTML. Structure only — every colour and size lives in the CSS. */
export function renderTip(model) {
  const parts = [`<strong class="eft-tip-title">${escapeHtml(model.title)}</strong>`];

  if (model.key) {
    const hint = model.key.hint
      ? `<span class="eft-tip-key-hint">${escapeHtml(model.key.hint)}</span>`
      : '';
    parts.push(
      `<span class="eft-tip-key"><span class="eft-tip-key-glyph" aria-hidden="true"></span>`
      + `<span class="eft-tip-key-name">${escapeHtml(model.key.name)}</span>${hint}</span>`,
    );
  }

  if (model.note) parts.push(`<span class="eft-tip-note">${escapeHtml(model.note)}</span>`);
  if (model.lead) parts.push(`<span class="eft-tip-lead">${escapeHtml(model.lead)}</span>`);

  for (const row of model.rows) {
    const body = row.lines.length === 1
      ? `<span class="eft-tip-val">${escapeHtml(row.lines[0])}</span>`
      : `<ul class="eft-tip-list">${row.lines.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>`;
    parts.push(`<span class="eft-tip-row"><span class="eft-tip-lab">${escapeHtml(row.label)}</span>${body}</span>`);
  }

  if (model.category) parts.push(`<em class="eft-tip-cat">${escapeHtml(model.category)}</em>`);
  return parts.join('');
}

export const markerTipHtml = (marker, category, lock) => renderTip(tipModel(marker, category, lock));

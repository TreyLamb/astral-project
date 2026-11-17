// Pure helpers for the AFROTC page's search box. AfrotcApp.jsx gathers the entries from every section;
// nothing here knows about React, so it is tested on plain node.

export const headingId = (line) => `arc-h-${line}`;

const fold = (s) => String(s ?? '')
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/[–—]/g, '-')
  .toLowerCase();

const stripMd = (s) => s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`>|]/g, ' ').replace(/^#+\s*/gm, '');

/** Splits markdown into one entry per heading. `line` is the heading's 1-based line, which is also its element id. */
export function splitMarkdown(md) {
  const lines = md.split('\n');
  const out = [];
  const path = [];
  let cur = null;
  let fence = false;
  const flush = () => { if (cur && (cur.body.trim() || cur.level > 1)) out.push(cur); };
  lines.forEach((raw, i) => {
    if (/^\s*```/.test(raw)) fence = !fence;
    const m = !fence && /^(#{1,4})\s+(.+?)\s*#*\s*$/.exec(raw);
    if (m) {
      flush();
      const level = m[1].length;
      path.length = level - 1;
      const title = stripMd(m[2]).trim();
      path[level - 1] = title;
      cur = { title, where: path.slice(0, level - 1).join(' › '), level, line: i + 1, body: '' };
    } else if (cur) {
      cur.body += `${raw}\n`;
    }
  });
  flush();
  return out.filter((e) => e.body.trim()).map((e) => ({ title: e.title, where: e.where, line: e.line, text: e.body.trim() }));
}

export const tokens = (q) => fold(q).split(/[^a-z0-9/.'-]+/).map((t) => t.replace(/^[.'-]+|[.'-]+$/g, '')).filter(Boolean);

/** Every word must appear (as the start of a word or inside it); title hits and whole-phrase hits rank higher. */
export function searchEntries(entries, query, limit = 60) {
  const toks = tokens(query);
  if (!toks.length) return { total: 0, hits: [] };
  const phrase = fold(query).trim();
  const scored = [];
  for (const e of entries) {
    const title = fold(e.title);
    const body = fold(stripMd(`${e.text} ${e.where ?? ''} ${e.group ?? ''}`));
    let score = 0;
    let ok = true;
    for (const t of toks) {
      const inTitle = title.includes(t);
      const inBody = body.includes(t);
      if (!inTitle && !inBody) { ok = false; break; }
      if (inTitle) score += title.startsWith(t) || title.includes(` ${t}`) ? 8 : 5;
      if (inBody) score += new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(body) ? 2 : 1;
    }
    if (!ok) continue;
    if (toks.length > 1 && (title.includes(phrase) || body.includes(phrase))) score += 10;
    if (e.weight) score += e.weight;
    scored.push({ e, score });
  }
  scored.sort((a, b) => b.score - a.score || a.e.title.localeCompare(b.e.title));
  return { total: scored.length, hits: scored.slice(0, limit).map((s) => s.e) };
}

/** A short window of `text` around the first query word, as [{ t, hit }] parts for highlighting. */
export function snippet(text, query, radius = 110) {
  const plain = stripMd(text).replace(/\s+/g, ' ').trim();
  const toks = tokens(query);
  const low = fold(plain);
  let at = -1;
  for (const t of toks) {
    const i = low.indexOf(t);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  const start = at < 0 ? 0 : Math.max(0, at - radius);
  const end = Math.min(plain.length, (at < 0 ? 0 : at) + radius * 2);
  const slice = plain.slice(start, end);
  const parts = highlight(slice, toks);
  if (start > 0) parts.unshift({ t: '… ', hit: false });
  if (end < plain.length) parts.push({ t: ' …', hit: false });
  return parts;
}

export function highlight(text, toks) {
  if (!toks.length) return [{ t: text, hit: false }];
  const low = fold(text);
  if (low.length !== text.length) return [{ t: text, hit: false }];
  const mark =new Array(text.length).fill(false);
  for (const t of toks) {
    let i = low.indexOf(t);
    while (i >= 0) {
      for (let k = i; k < i + t.length && k < mark.length; k++) mark[k] = true;
      i = low.indexOf(t, i + t.length);
    }
  }
  const parts = [];
  for (let k = 0; k < text.length; k++) {
    const last = parts[parts.length - 1];
    if (last && last.hit === mark[k]) last.t += text[k];
    else parts.push({ t: text[k], hit: mark[k] });
  }
  return parts;
}

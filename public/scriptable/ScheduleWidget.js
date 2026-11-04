const BASE = 'https://astral-project.vercel.app';
const CACHE = 'trey-schedule-cache.json';

// ── parameter ──
const param = (args.widgetParameter || '').trim().toLowerCase();
const offset = /tomorrow/.test(param) ? 1 : (param.match(/\+(\d)/) ? Number(param.match(/\+(\d)/)[1]) : 0);
const part = /\btop\b/.test(param) ? 'top' : /\bbottom\b/.test(param) ? 'bottom' : 'whole';
// Share of the day the TOP widget carries: half by default (two equal widgets), two-thirds for Large over Medium.

// ── time helpers ──
const now = new Date();
const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
const pad = (n) => String(n).padStart(2, '0');
const key = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
const nowMin = now.getHours() * 60 + now.getMinutes();
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const ap = (t) => (Number(t.split(':')[0]) < 12 ? 'a' : 'p');
const bare = (t) => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${pad(m)}`; };
const clock = (t) => `${bare(t)}${ap(t)}`;
// "9:55–10:55a": the a/p is written once when both ends share it.
const range = (a, b) => (ap(a) === ap(b) ? `${bare(a)}–${bare(b)}${ap(b)}` : `${clock(a)}–${clock(b)}`);
// Asides like "(30 min)" are dropped on the widget; the full title is one tap away on the calendar.
const short = (t) => t.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

// ── data: fetch, fall back to the last good copy so the widget still works offline ──
const fm = FileManager.local();
const cachePath = fm.joinPath(fm.documentsDirectory(), CACHE);
let data = null;
let offline = false;
try {
  const req = new Request(`${BASE}/schedule.json?t=${Date.now()}`);
  req.timeoutInterval = 10;
  data = await req.loadJSON();
  fm.writeString(cachePath, JSON.stringify(data));
} catch (e) {
  offline = true;
  if (fm.fileExists(cachePath)) data = JSON.parse(fm.readString(cachePath));
}

const all = (data && data.days && data.days[key]) || [];
const blocks = all.filter((e) => e.start && e.end && e.kind !== 'due');
const dues = all.filter((e) => e.kind === 'due');
const isPast = (e) => offset === 0 && toMin(e.end) <= nowMin;
const isNow = (e) => offset === 0 && toMin(e.start) <= nowMin && nowMin < toMin(e.end);

// ── which blocks this widget shows ──
// v8 (Trey, 11-3): a title that does not fit on one line wraps to a SECOND line (never more). The top
// widget fills from the top until the next block would not fit whole; that block, and everything after it,
// goes to the bottom widget. A block is never cut in half across the two widgets.
// Heights are estimated in points at the fixed text size (13.5 pt titles): ~34 characters per title line
// on a Large widget; one line of text is ~16 pt, plus the row's padding and gap.
// v11 (Trey, 11-3): the time sits on its own small line ABOVE the title, so the title gets the full width
// (~46 characters a line at 13.5 pt instead of ~34 beside a time column). Same font sizes as before.
// v12: text one point bigger (14.5 pt titles, 12 pt times). Heights measured from Trey's v11 screenshot:
// a Large widget's list area is ~338 pt under the date header; a one-line block was 38.6 pt at the old size.
const CHARS_PER_LINE = 46;          // measured: ~6.3 pt per character at 13.5 pt, so ~6.8 at 14.5, over ~329 pt
const LINE = 17.5;                  // one 14.5 pt title line
const TIME_LINE = 14.5;             // the 12 pt time line above it
const ROW_EXTRA = 4 + 3;            // row padding + gap between rows (v14: 3, was 3.5, to pay for the bigger header)
const TOP_BUDGET = 331.5;           // list area under the header (v14: header is ~4.5 pt taller), small margin
const linesOf = (e) => (short(e.title).length > (isNow(e) ? CHARS_PER_LINE - 4 : CHARS_PER_LINE) ? 2 : 1);
const heightOf = (e) => TIME_LINE + linesOf(e) * LINE + ROW_EXTRA;
// v10: iOS would not wrap titles on the top widget even with room to spare (it did on the bottom one), so the
// script breaks the line itself, at the last space that fits. Two lines, no more; a long second line ends in "…".
const wrapped = (e) => {
  const t = short(e.title);
  if (linesOf(e) === 1) return t;
  const max = isNow(e) ? CHARS_PER_LINE - 4 : CHARS_PER_LINE;
  const at = t.lastIndexOf(' ', max);
  return at > 0 ? `${t.slice(0, at)}\n${t.slice(at + 1)}` : t;
};
let cut = 0;
for (let used = 0; cut < blocks.length && used + heightOf(blocks[cut]) <= TOP_BUDGET; cut++) used += heightOf(blocks[cut]);
let mine = part === 'top' ? blocks.slice(0, cut) : part === 'bottom' ? blocks.slice(cut) : blocks;
const showHeader = part !== 'bottom';
const showDues = part !== 'top';

const family = config.widgetFamily || 'large';
const CAP = { small: 6, medium: 6, large: 15, extraLarge: 15 }[family] || 15;
const dueRows = showDues ? Math.min(dues.length, 2) : 0;
const room = Math.max(2, CAP - dueRows - (showHeader ? 0 : -1));
let hiddenAfter = 0;
if (part === 'whole' && mine.length > room) {
  // One widget, long day: drop finished blocks first, keeping the one before "now" for context.
  const firstLive = mine.findIndex((e) => !isPast(e));
  const first = Math.max(0, Math.min((firstLive === -1 ? mine.length : firstLive) - 1, mine.length - room));
  mine = mine.slice(first);
}
if (mine.length > room) { hiddenAfter = mine.length - room; mine = mine.slice(0, room); }

// ── sizing: fewer rows -> bigger text and more air, so the list fills the widget ──
// v5: in a split, BOTH halves size from the same number (the bigger half + header + due lines), so the
// text, row spacing and time column match exactly and the list reads straight across the gap.
const n = part === 'whole'
  ? mine.length + dueRows + 1
  : Math.max(cut, blocks.length - cut) + Math.min(dues.length, 2) + 1;
const tall = family === 'large' || family === 'extraLarge';
// TEXT IS FIXED at version 3's settings (Trey, 11-3: "I want this text formatting"): 13.5 pt titles, 11 pt
// times, a 78 pt time column (narrow on purpose: it gives the titles room, even when a long range is cut).
// Only the gap between rows changes, so a shorter list spreads out to fill the widget instead of growing.
const S = tall
  ? { font: 14.5, time: 12, timeW: 78, gap: 3 }
  : { font: 12, time: 10, timeW: 70, gap: n <= 4 ? 5 : n <= 5 ? 3 : 1.5 };
if (family === 'small') { S.font = 11; S.time = 9.5; S.gap = 1; }
S.head = tall ? 17 : S.font + 2;

const C = {
  bg: new Color('#0b1220'), card: new Color('#16223a'), text: new Color('#e5ecf6'),
  dim: new Color('#64748b'), soft: new Color('#93a4bd'), due: new Color('#f87171'), warn: new Color('#fbbf24'),
};

const w = new ListWidget();
w.backgroundColor = C.bg;
// Same padding on every widget, so the bottom widget's list starts exactly where a fresh list would.
w.setPadding(12, 12, 10, 12);
w.url = `${BASE}/MFT?view=day&date=${key}`;

// Every widget lists from its top edge down (ListWidget would otherwise centre the content); the
// spacer at the end takes up whatever room is left.

if (showHeader) {
  const head = w.addStack();
  head.centerAlignContent();
  const ht = head.addText(target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase());
  // v14: the date reads as a bold header: heavier, larger, full-brightness white.
  ht.font = Font.heavySystemFont(S.head);
  ht.textColor = C.text;
  head.addSpacer();
  const tag = head.addText(offset === 0 ? 'TODAY' : offset === 1 ? 'TOMORROW' : `+${offset} DAYS`);
  tag.font = Font.semiboldSystemFont(S.head - 3);
  tag.textColor = offset === 0 ? new Color('#34d399') : C.warn;
  w.addSpacer(S.gap + 5);   // v14: a few more points between the date and the first block
}

if (!data) {
  const t = w.addText('No schedule yet: open Scriptable once with internet.');
  t.font = Font.systemFont(S.font);
  t.textColor = C.warn;
} else if (!blocks.length && part !== 'bottom') {
  const t = w.addText(offset === 0 ? 'Nothing planned today.' : 'Nothing planned yet.');
  t.font = Font.systemFont(S.font + 1);
  t.textColor = C.soft;
}

mine.forEach((e, i) => {
  const row = w.addStack();
  row.topAlignContent();
  row.setPadding(2, 4, 2, 4);
  // v13 (Trey, 11-3): the current block needs to stand out more: an amber outline and a warm tint.
  // (Widgets cannot draw a real glow/shadow; a border plus tint is the closest thing.)
  if (isNow(e)) {
    row.backgroundColor = new Color('#fbbf24', 0.13);
    row.borderColor = new Color('#fbbf24', 0.85);
    row.borderWidth = 1.5;
    row.cornerRadius = 7;
  }

  const bar = row.addStack();
  bar.size = new Size(3, family === 'small' ? S.font + 4 : TIME_LINE + linesOf(e) * LINE);
  bar.backgroundColor = new Color(e.color || '#64748b', isPast(e) ? 0.35 : 1);
  bar.cornerRadius = 1.5;
  row.addSpacer(6);

  // Time on its own line above the title. No flexible spacer inside this vertical stack: one there grows
  // downward and stretches the row (v8's "wild" bottom widget).
  const col = row.addStack();
  col.layoutVertically();
  const time = col.addText(family === 'small' ? clock(e.start) : range(e.start, e.end));
  time.font = Font.regularMonospacedSystemFont(S.time);
  time.textColor = isPast(e) ? C.dim : isNow(e) ? new Color('#fcd34d') : C.soft;
  time.lineLimit = 1;

  // v12: each title line is its own text element (a single string with a newline was collapsed back to one
  // line by iOS on the bottom widget).
  const lines = family === 'small' ? [short(e.title)] : wrapped(e).split('\n');
  for (const ln of lines) {
    const title = col.addText(ln);
    title.font = isNow(e) ? Font.boldSystemFont(S.font) : Font.systemFont(S.font);
    title.textColor = isPast(e) ? C.dim : C.text;
    title.lineLimit = 1;
  }
  row.addSpacer();
  if (i < mine.length - 1 || part !== 'top') w.addSpacer(S.gap);
});

if (hiddenAfter > 0) {
  const more = w.addText(`+${hiddenAfter} more · tap for the full day`);
  more.font = Font.systemFont(S.font - 2);
  more.textColor = C.dim;
}

w.addSpacer();

if (showDues) {
  for (const d of dues.slice(0, 2)) {
    const t = w.addText(d.title.replace(/^DUE[^:]*:\s*/, 'DUE: '));
    t.font = Font.semiboldSystemFont(S.font - 1.5);
    t.textColor = C.due;
    t.lineLimit = 1;
    t.minimumScaleFactor = 0.75;
  }
}
if (offline) {
  const t = w.addText('offline · showing last saved plan');
  t.font = Font.systemFont(S.font - 3);
  t.textColor = C.warn;
}

// Refresh at the next block boundary (so "now" moves on time), at most 15 minutes out.
const bounds = blocks.flatMap((e) => [toMin(e.start), toMin(e.end)]).filter((m) => offset === 0 && m > nowMin);
const nextMin = bounds.length ? Math.min(...bounds) : nowMin + 15;
w.refreshAfterDate = new Date(Date.now() + Math.max(1, Math.min(15, nextMin - nowMin)) * 60 * 1000);

if (config.runsInWidget) Script.setWidget(w);
else if (part === 'bottom') await w.presentMedium();
else await w.presentLarge();
Script.complete();

// Trey's Schedule: Scriptable widget for the iPhone home screen.
//
// SETUP (one time)
// 1. Scriptable app -> "+" -> paste this whole file -> name it "Schedule".
// 2. Home screen -> long-press -> "+" -> Scriptable -> pick a size (Large shows the whole day) -> Add.
// 3. Long-press the widget -> Edit Widget -> Script: Schedule. When Interacting: Open URL is set by the script.
// 4. Swipe between days: add a SECOND Scriptable widget with Parameter = tomorrow, then drag one onto the
//    other to make a Smart Stack. Swipe up/down on the stack to flip Today <-> Tomorrow.
//    (Scriptable widgets cannot be swiped sideways or tapped per-row; that is an iOS limit, not this script.)
//
// Data: https://astral-project.vercel.app/schedule.json, rebuilt from the plan on every site push.
// Tap the widget to open the MFT calendar on that day (Day view; switch to Week/Month there).
// Parameter options: (empty) = today, "tomorrow" or "+1" = tomorrow, "+2" = the day after.

const BASE = 'https://astral-project.vercel.app';
const CACHE = 'trey-schedule-cache.json';

const param = (args.widgetParameter || '').trim().toLowerCase();
const offset = param === 'tomorrow' ? 1 : /^\+?\d$/.test(param) ? Number(param.replace('+', '')) : 0;

const now = new Date();
const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
const pad = (n) => String(n).padStart(2, '0');
const key = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
const nowMin = now.getHours() * 60 + now.getMinutes();
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const clock = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return `${h % 12 || 12}:${pad(m)}${h < 12 ? 'a' : 'p'}`; };

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

const family = config.widgetFamily || 'large';
const SIZES = {
  small: { rows: 6, font: 10, head: 11 },
  medium: { rows: 6, font: 11, head: 12 },
  large: { rows: 15, font: 12.5, head: 14 },
  extraLarge: { rows: 15, font: 13, head: 15 },
};
const S = SIZES[family] || SIZES.large;

const C = {
  bg: new Color('#0b1220'),
  card: new Color('#16223a'),
  text: new Color('#e5ecf6'),
  dim: new Color('#64748b'),
  soft: new Color('#93a4bd'),
  due: new Color('#f87171'),
  warn: new Color('#fbbf24'),
};

const w = new ListWidget();
w.backgroundColor = C.bg;
w.setPadding(12, 12, 10, 12);
// Tap opens the MFT calendar on this day (Day view): the full calendar with every plan block on it.
w.url = `${BASE}/MFT?view=day&date=${key}`;

// ── header ──
const head = w.addStack();
head.centerAlignContent();
const dayName = target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
const ht = head.addText(dayName);
ht.font = Font.boldSystemFont(S.head);
ht.textColor = C.soft;
head.addSpacer();
const tag = head.addText(offset === 0 ? 'TODAY' : offset === 1 ? 'TOMORROW' : `+${offset} DAYS`);
tag.font = Font.semiboldSystemFont(S.head - 3);
tag.textColor = offset === 0 ? new Color('#34d399') : C.warn;
w.addSpacer(6);

// ── rows ──
const all = (data && data.days && data.days[key]) || [];
const blocks = all.filter((e) => e.start && e.end && e.kind !== 'due');
const dues = all.filter((e) => e.kind === 'due');
const isPast = (e) => offset === 0 && toMin(e.end) <= nowMin;
const isNow = (e) => offset === 0 && toMin(e.start) <= nowMin && nowMin < toMin(e.end);

const room = Math.max(2, S.rows - Math.min(dues.length, 2));
// Keep the day readable when it is longer than the widget: drop finished blocks first,
// keeping the one just before "now" for context.
let first = 0;
if (offset === 0 && blocks.length > room) {
  const firstLive = blocks.findIndex((e) => !isPast(e));
  first = Math.max(0, Math.min((firstLive === -1 ? blocks.length : firstLive) - 1, blocks.length - room));
}
const shown = blocks.slice(first, first + room);
const hiddenAfter = blocks.length - first - shown.length;

if (!data) {
  const t = w.addText('No schedule yet: open Scriptable once with internet.');
  t.font = Font.systemFont(S.font);
  t.textColor = C.warn;
} else if (!blocks.length) {
  const t = w.addText(offset === 0 ? 'Nothing planned today.' : 'Nothing planned yet.');
  t.font = Font.systemFont(S.font + 1);
  t.textColor = C.soft;
  const t2 = w.addText('Ask Claude to add this day to the plan.');
  t2.font = Font.systemFont(S.font - 1);
  t2.textColor = C.dim;
}

for (const e of shown) {
  const row = w.addStack();
  row.centerAlignContent();
  row.setPadding(2, 4, 2, 4);
  if (isNow(e)) { row.backgroundColor = C.card; row.cornerRadius = 6; }

  const bar = row.addStack();
  bar.size = new Size(3, S.font + 4);
  bar.backgroundColor = new Color(e.color || '#64748b', isPast(e) ? 0.35 : 1);
  bar.cornerRadius = 1.5;
  row.addSpacer(6);

  const time = row.addText(family === 'small' ? clock(e.start) : `${clock(e.start)}–${clock(e.end)}`);
  time.font = Font.regularMonospacedSystemFont(S.font - 1.5);
  time.textColor = isPast(e) ? C.dim : C.soft;
  time.lineLimit = 1;
  row.addSpacer(6);

  const title = row.addText(e.title);
  title.font = isNow(e) ? Font.boldSystemFont(S.font) : Font.systemFont(S.font);
  title.textColor = isPast(e) ? C.dim : C.text;
  title.lineLimit = 1;
  title.minimumScaleFactor = 0.8;
  w.addSpacer(family === 'large' || family === 'extraLarge' ? 3 : 1);
}

if (hiddenAfter > 0) {
  const more = w.addText(`+${hiddenAfter} more · tap for the full day`);
  more.font = Font.systemFont(S.font - 2);
  more.textColor = C.dim;
}

w.addSpacer();

for (const d of dues.slice(0, 2)) {
  const t = w.addText(d.title.replace(/^DUE[^:]*:\s*/, 'DUE: '));
  t.font = Font.semiboldSystemFont(S.font - 1.5);
  t.textColor = C.due;
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.75;
}
if (offline) {
  const t = w.addText('offline · showing last saved plan');
  t.font = Font.systemFont(S.font - 3);
  t.textColor = C.warn;
}

// Refresh at the next block boundary (so "now" moves on time), at most 15 minutes out.
const boundaries = blocks.flatMap((e) => [toMin(e.start), toMin(e.end)]).filter((m) => offset === 0 && m > nowMin);
const nextMin = boundaries.length ? Math.min(...boundaries) : nowMin + 15;
const wait = Math.max(1, Math.min(15, nextMin - nowMin));
w.refreshAfterDate = new Date(Date.now() + wait * 60 * 1000);

if (config.runsInWidget) Script.setWidget(w);
else await w.presentLarge();
Script.complete();

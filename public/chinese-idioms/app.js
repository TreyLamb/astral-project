// ╔═══════════════════════════════════════════════════════════════╗
// ║  DAILY ROTATION LOGIC — edit these lines to control timing   ║
// ╠═══════════════════════════════════════════════════════════════╣
// ║  Key lines:                                                   ║
// ║  Line  9 — IDIOM_INDEX_KEY  : localStorage key for position  ║
// ║  Line 10 — IDIOM_DATE_KEY   : localStorage key for date      ║
// ║  Line 19 — cutoff time      : "h === 0 && m < 1" = 12:01 AM ║
// ║  Line 30 — resolveIndex()   : decides which idiom to show    ║
// ║  Line 37 — (idx+1) % total  : advance + wrap-around reset   ║
// ╚═══════════════════════════════════════════════════════════════╝

// ── Storage keys (change to force a full reset for all users) ───
const IDIOM_INDEX_KEY = 'chineseIdiomIndex';   // LINE 9
const IDIOM_DATE_KEY  = 'chineseIdiomDate';    // LINE 10

// ── Returns a day label that only changes AFTER 12:01 AM ────────
function getDayLabel() {                        // LINE 14
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  if (h === 0 && m < 1) {                      // LINE 17 ← change "m < 1" for different cutoff
    // Before 12:01 AM → still counts as "yesterday"
    return new Date(now.getTime() - 86_400_000).toDateString();
  }
  return now.toDateString();                    // LINE 21 ← today's label (e.g. "Tue Jun 03 2026")
}

// ── Core index resolver: call every check to get today's slot ───
function resolveIndex(total) {                  // LINE 25
  const today  = getDayLabel();
  const lastDay = localStorage.getItem(IDIOM_DATE_KEY);
  let   idx    = parseInt(localStorage.getItem(IDIOM_INDEX_KEY) ?? '0', 10);

  if (lastDay !== today) {                      // LINE 30 ← new day detected
    if (lastDay === null) {
      idx = 0;                                  // LINE 32 ← very first visit → start at idiom 0
    } else {
      idx = (idx + 1) % total;                  // LINE 34 ← ADVANCE; wraps back to 0 after last idiom
    }
    localStorage.setItem(IDIOM_INDEX_KEY, idx); // LINE 36 ← save new position
    localStorage.setItem(IDIOM_DATE_KEY, today);// LINE 37 ← mark today as served
  }
  return idx;                                   // LINE 39
}
// ════════════════════════════════════════════════════════════════


// ── DOM refs ─────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const elCard        = $('idiom-card');
const elChar        = $('idiom-char');
const elPinyin      = $('pinyin');
const elYale        = $('yale');
const elMeaning     = $('meaning');
const elExSimplified= $('ex-simplified');
const elExTraditional=$('ex-traditional');
const elExEn        = $('ex-en');
const elTagsRow     = $('tags-row');
const elDayBadge    = $('day-badge');
const elCounter     = $('counter');
const elNextNote    = $('next-note');

// ── Render one idiom entry to the page ───────────────────────────
function render(idiom, dayNum, total) {
  elChar.textContent         = idiom.idiom         ?? '—';
  elPinyin.textContent       = idiom.pinyin        ?? '—';
  elYale.textContent         = idiom.yale          ?? '—';
  elMeaning.textContent      = idiom.meaning_en    ?? '—';
  elExSimplified.textContent = idiom.example_simplified  ?? '';
  elExTraditional.textContent= idiom.example_traditional ?? '';
  elExEn.textContent         = idiom.example_en   ?? '';
  elDayBadge.textContent     = `DAY ${dayNum + 1} OF ${total}`;
  elCounter.textContent      = String(total - dayNum - 1);

  // ── Tags ────────────────────────────────────────────────────────
  elTagsRow.innerHTML = '';
  const tags = [
    { label: idiom.register },
    { label: idiom.mandarin_usage?.replace(/_/g, ' ') },
    idiom.mandarin_only ? { label: 'MANDARIN ONLY' } : null,
    { label: idiom.confidence, cls: idiom.confidence },
  ];
  tags.filter(Boolean).forEach(t => {
    if (!t.label) return;
    const span = document.createElement('span');
    span.className = 'tag' + (t.cls ? ` ${t.cls}` : '');
    span.textContent = t.label.toUpperCase();
    elTagsRow.appendChild(span);
  });
}

// ── Countdown: update next-note with time until 12:01 AM ─────────
function updateCountdown() {
  const now  = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + (now.getHours() >= 0 && now.getMinutes() >= 1 ? 1 : 0));
  next.setHours(0, 1, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const diffMs  = next - now;
  const h  = Math.floor(diffMs / 3_600_000);
  const m  = Math.floor((diffMs % 3_600_000) / 60_000);
  const s  = Math.floor((diffMs % 60_000) / 1_000);
  elNextNote.textContent =
    `Next idiom in ${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}

// ── Boot ──────────────────────────────────────────────────────────
async function init() {
  elCard.classList.add('loading');

  let idioms;
  try {
    const res = await fetch('./idioms.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    idioms = await res.json();
  } catch (err) {
    elMeaning.textContent = '⚠ Could not load idioms.json — ' + err.message;
    elCard.classList.remove('loading');
    return;
  }

  const total = idioms.length;
  const idx   = resolveIndex(total);  // ← calls the rotation logic above
  const today = getDayLabel();

  render(idioms[idx], idx, total);
  elCard.classList.remove('loading');

  // Live countdown + re-check for midnight rollover
  updateCountdown();
  setInterval(() => {
    updateCountdown();
    // If the day label just changed (rolled past 12:01 AM), reload the page
    if (getDayLabel() !== today) location.reload();
  }, 1_000);
}

init();

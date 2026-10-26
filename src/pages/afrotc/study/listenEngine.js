// Pure helpers for the song page's "Listen & loop" player. No React, no DOM.

/** Any common YouTube link (watch, youtu.be, shorts, embed, live, music.) or a bare 11-character id -> id, else null. */
export function parseYouTubeId(input) {
  const s = String(input ?? '').trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  let u;
  try { u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); } catch { return null; }
  const host = u.hostname.replace(/^(www|m|music)\./, '');
  let id = null;
  if (host === 'youtu.be') id = u.pathname.split('/')[1];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else {
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?]+)/);
      id = m ? m[1] : null;
    }
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

/** 83.4 -> "1:23.4". Tenths because a loop mark is useless if it cannot be nudged finely. */
export function fmtTime(sec) {
  if (sec == null || Number.isNaN(sec)) return '--:--';
  const t = Math.max(0, sec);
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

/** True when a loop is armed (A set, B set after A) and playback has reached B. */
export function loopDue(time, a, b) {
  return a != null && b != null && b > a && time >= b;
}

/** Keep a mark inside [0, duration]; a missing duration only clamps the low end. */
export function nudge(t, delta, duration) {
  const v = Math.max(0, Math.round((t + delta) * 10) / 10);
  return duration ? Math.min(v, duration) : v;
}

/** "1:23.4", "83.4", "1:23" -> seconds; null if it is not a time. */
export function parseTime(input) {
  const s = String(input ?? '').trim();
  const m = s.match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const secs = Number(m[2]);
  if (m[1] != null && secs >= 60) return null;
  return Math.round(((m[1] ? Number(m[1]) * 60 : 0) + secs) * 10) / 10;
}

export const RATES = [0.25, 0.5, 0.75, 1];

/** What happens when playback reaches B: repeat from A, stop right there, or ignore the marks. */
export const END_MODES = [
  { id: 'loop', label: 'Loop A–B' },
  { id: 'once', label: 'Play A–B once' },
  { id: 'free', label: 'Free play' },
];

/** Index of the line being sung at time t: the last stamped line whose start is <= t, else -1. */
export function activeLine(stamps, t) {
  let at = -1;
  for (let i = 0; i < (stamps?.length ?? 0); i++) if (stamps[i] != null && stamps[i] <= t + 0.05) at = i;
  return at;
}

/** [start, end] of line i from its stamp to the next stamped line (or the track end); null if it is not stamped. */
export function lineSpan(stamps, i, duration) {
  const a = stamps?.[i];
  if (a == null) return null;
  const next = stamps.slice(i + 1).find((x) => x != null && x > a);
  const b = next ?? duration;
  return b && b > a ? [a, b] : null;
}

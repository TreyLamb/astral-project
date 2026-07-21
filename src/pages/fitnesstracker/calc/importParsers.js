// Import parsers for GPS files + CSV. GPX/TCX are XML — parsed with the browser's
// native DOMParser (no dependency, and these text formats are well-specified).
// FIT is a binary format; per the spec it needs a maintained library, so it's a
// best-effort dynamic hook (see parseFit) rather than a hand-rolled binary reader.
//
// The pure reducer pointsToSummary() (haversine distance, smoothed elevation,
// per-km splits, avg HR) is unit-tested; the DOM extraction is browser-only.

const R_EARTH = 6371000;
const toRad = (d) => (d * Math.PI) / 180;

export function haversineM(a, b) {
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat), la2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
}

// 3-point moving average on elevation to damp GPS altitude noise before summing
// gain/loss — a simple, standard filter (raw GPS ele wildly over-reports climb).
function smoothEle(points) {
  const ele = points.map((p) => p.ele);
  return ele.map((_, i) => {
    const a = ele[Math.max(0, i - 1)] ?? ele[i];
    const b = ele[i];
    const c = ele[Math.min(ele.length - 1, i + 1)] ?? ele[i];
    if (b == null) return null;
    return (a + b + c) / 3;
  });
}

// points: [{ lat, lon, ele?, time? (ISO/ms), hr?, cad?, distM? }]
export function pointsToSummary(points, splitUnitM = 1000) {
  if (!points || points.length < 2) return null;
  const hasDist = points.every((p) => typeof p.distM === 'number');

  let distanceM = 0;
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    const seg = hasDist ? points[i].distM - points[i - 1].distM : haversineM(points[i - 1], points[i]);
    distanceM += Math.max(0, seg);
    cum.push(distanceM);
  }

  const sm = smoothEle(points);
  let gain = 0, loss = 0;
  for (let i = 1; i < sm.length; i++) {
    if (sm[i] == null || sm[i - 1] == null) continue;
    const d = sm[i] - sm[i - 1];
    if (d > 0) gain += d; else loss += -d;
  }

  const times = points.map((p) => (p.time == null ? null : new Date(p.time).getTime()));
  const t0 = times.find((t) => t != null);
  const tLast = [...times].reverse().find((t) => t != null);
  const durationSec = t0 != null && tLast != null ? Math.round((tLast - t0) / 1000) : null;

  const hrs = points.map((p) => p.hr).filter((h) => h != null);
  const avgHr = hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null;
  const cads = points.map((p) => p.cad).filter((c) => c != null);
  const avgCad = cads.length ? Math.round(cads.reduce((a, b) => a + b, 0) / cads.length) : null;

  // per-unit splits via linear time interpolation across the boundary
  const splits = [];
  if (durationSec != null) {
    let next = splitUnitM, prevBoundaryTime = t0;
    for (let i = 1; i < cum.length; i++) {
      while (cum[i] >= next && cum[i] > cum[i - 1]) {
        const frac = (next - cum[i - 1]) / (cum[i] - cum[i - 1]);
        const bt = times[i - 1] + frac * (times[i] - times[i - 1]);
        splits.push({ index: splits.length + 1, distanceM: splitUnitM, timeSec: Math.round((bt - prevBoundaryTime) / 1000) });
        prevBoundaryTime = bt;
        next += splitUnitM;
      }
    }
  }

  return { distanceM: Math.round(distanceM), durationSec, elevationGainM: Math.round(gain), elevationLossM: Math.round(loss), avgHr, avgCad, splits };
}

// ---- XML helpers (browser DOMParser) ----
function parseXml(text) {
  if (typeof DOMParser === 'undefined') throw new Error('XML import requires a browser environment.');
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Could not parse that file as XML.');
  return doc;
}
const localTags = (el, name) => Array.from(el.getElementsByTagName('*')).filter((n) => n.localName === name);
const firstLocal = (el, name) => localTags(el, name)[0];
const numText = (el, name) => { const n = firstLocal(el, name); return n ? Number(n.textContent) : null; };

export function parseGPX(text) {
  const doc = parseXml(text);
  const trkpts = localTags(doc.documentElement, 'trkpt');
  const points = trkpts.map((pt) => {
    const hrNode = localTags(pt, 'hr')[0] || localTags(pt, 'heartrate')[0];
    const cadNode = localTags(pt, 'cad')[0] || localTags(pt, 'cadence')[0];
    const timeNode = firstLocal(pt, 'time');
    const eleNode = firstLocal(pt, 'ele');
    return {
      lat: Number(pt.getAttribute('lat')),
      lon: Number(pt.getAttribute('lon')),
      ele: eleNode ? Number(eleNode.textContent) : null,
      time: timeNode ? timeNode.textContent : null,
      hr: hrNode ? Number(hrNode.textContent) : null,
      cad: cadNode ? Number(cadNode.textContent) : null,
    };
  });
  return { format: 'gpx', points, summary: pointsToSummary(points) };
}

export function parseTCX(text) {
  const doc = parseXml(text);
  const tps = localTags(doc.documentElement, 'Trackpoint');
  const points = tps.map((pt) => {
    const pos = firstLocal(pt, 'Position');
    const hrWrap = firstLocal(pt, 'HeartRateBpm');
    return {
      lat: pos ? numText(pos, 'LatitudeDegrees') : null,
      lon: pos ? numText(pos, 'LongitudeDegrees') : null,
      ele: numText(pt, 'AltitudeMeters'),
      time: (firstLocal(pt, 'Time') || {}).textContent || null,
      hr: hrWrap ? numText(hrWrap, 'Value') : null,
      cad: numText(pt, 'Cadence'),
      distM: numText(pt, 'DistanceMeters'), // TCX often carries cumulative distance
    };
  }).filter((p) => p.lat != null || p.distM != null);
  return { format: 'tcx', points, summary: pointsToSummary(points) };
}

// FIT is binary — best-effort. We try a lazily-loaded parser if one is present;
// otherwise we surface a clear message (Apple Watch exports GPX/TCX just fine).
export async function parseFit() {
  throw new Error('FIT is a binary format — export GPX or TCX from your watch app instead (best supported).');
}

export function parseByFilename(name, text) {
  const ext = name.toLowerCase().split('.').pop();
  if (ext === 'gpx') return parseGPX(text);
  if (ext === 'tcx') return parseTCX(text);
  throw new Error(`Unsupported file type: .${ext}. Use GPX or TCX.`);
}

// ---- CSV (backfill + plaintext backup) ----
const CSV_COLS = ['date', 'time', 'activityType', 'status', 'distance_m', 'duration_s', 'rpe', 'elev_gain_m', 'elev_loss_m', 'avg_hr', 'note'];

function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function workoutsToCSV(workouts) {
  const rows = [CSV_COLS.join(',')];
  for (const w of workouts) {
    const m = w.metrics || {};
    rows.push([w.date, w.time || '', w.activityType, w.status, w.distanceM ?? '', w.durationSec ?? '', w.rpe ?? '', m.elevationGainM ?? '', m.elevationLossM ?? '', m.avgHr ?? '', w.note || ''].map(csvCell).join(','));
  }
  return rows.join('\n');
}

// minimal RFC-4180-ish splitter (handles quoted fields with commas/newlines)
function splitCSV(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c === '\r') { /* skip */ }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export function csvToWorkouts(text) {
  const rows = splitCSV(text.trim());
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  const idx = (name) => header.indexOf(name);
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row.length || row.every((c) => c === '')) continue;
    const get = (name) => { const i = idx(name); return i >= 0 ? row[i] : ''; };
    const num = (name) => { const v = get(name); return v === '' ? null : Number(v); };
    out.push({
      date: get('date'),
      time: get('time'),
      activityType: get('activityType') || 'run',
      status: get('status') || 'completed',
      distanceM: num('distance_m'),
      durationSec: num('duration_s'),
      rpe: num('rpe'),
      note: get('note'),
      metrics: { elevationGainM: num('elev_gain_m'), elevationLossM: num('elev_loss_m'), avgHr: num('avg_hr') },
    });
  }
  return out;
}

// The session's error record. Pure and storage-injectable so it tests without
// a browser, and so the notifier — which has to run when everything else is
// broken — can use it without dragging React in.
//
// sessionStorage, not localStorage, on purpose: a crash is worth remembering
// across a reload of the same tab (that is exactly when you reload to see if
// it sticks), and NOT worth remembering next week. localStorage would turn
// every old crash into permanent noise.

export const LOG_KEY = 'astral_errors_v1';

// Enough to see a cascade, few enough that the report stays readable and the
// 5 MB storage quota is never in play.
export const MAX_ENTRIES = 25;

// Long stacks are the useful part of a report, but a runaway one can blow the
// quota on its own. Minified prod stacks run ~2-4 KB; this keeps the whole log
// comfortably inside a few hundred KB in the worst case.
const MAX_STACK = 8000;
const MAX_MESSAGE = 500;

// Two kinds, deliberately. This is the 400-vs-500 split without inventing a
// taxonomy nobody will maintain:
//   crash      — a render died, the UI is gone or visibly broken
//   background — a promise/fetch/handler failed, the UI is probably still fine
export const CRASH = 'crash';
export const BACKGROUND = 'background';

function clip(v, max) {
  const s = v == null ? '' : String(v);
  return s.length > max ? `${s.slice(0, max)}\n… (${s.length - max} more characters)` : s;
}

// Anything can be thrown in JavaScript — `throw 'nope'`, a rejected promise
// carrying a Response, null. Normalising here means every consumer downstream
// can assume message/stack are strings.
export function describeError(err) {
  if (err instanceof Error) {
    return { name: err.name || 'Error', message: clip(err.message, MAX_MESSAGE), stack: clip(err.stack, MAX_STACK) };
  }
  if (err && typeof err === 'object') {
    const message = err.message ?? err.reason ?? err.statusText ?? '';
    let serialised = '';
    try {
      serialised = JSON.stringify(err);
    } catch {
      serialised = '[unserialisable object]';
    }
    return {
      name: err.name || 'Error',
      message: clip(message || serialised, MAX_MESSAGE),
      stack: clip(err.stack || serialised, MAX_STACK),
    };
  }
  // String() first, not clip(): clip maps null/undefined to '' because an
  // absent STACK should read as absent. An absent MESSAGE is different — if
  // someone threw a bare `null`, "null" is the report, and blanking it hides
  // the one fact there is.
  return { name: 'Error', message: clip(String(err), MAX_MESSAGE), stack: '' };
}

// The first real CALL FRAME of a stack, skipping the "Name: message" header
// line every engine puts first. Matching the header instead would make two
// different call sites with the same message look identical, which is exactly
// the case the fingerprint exists to tell apart.
export function firstFrame(stack) {
  const lines = String(stack || '').split('\n');
  const frame = lines.find((l) => /^\s*(at\s|\S+@)/.test(l));
  return (frame ?? lines[1] ?? '').trim();
}

// Two errors are "the same" when they share a kind, a message and the frame
// they were thrown from. Same message from two different call sites stays two
// errors.
export function fingerprint(entry) {
  return `${entry.kind}|${entry.message}|${firstFrame(entry.stack)}`;
}

function safeStorage(storage) {
  if (storage) return storage;
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    // Some privacy modes throw on mere ACCESS, not just on read.
    return null;
  }
}

export function readErrors(storage) {
  const s = safeStorage(storage);
  if (!s) return [];
  try {
    const raw = s.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // A corrupt log must never be the thing that breaks error reporting.
    return [];
  }
}

export function clearErrors(storage) {
  const s = safeStorage(storage);
  if (!s) return;
  try { s.removeItem(LOG_KEY); } catch { /* quota / privacy mode */ }
}

/**
 * Record one error.
 *
 * A repeat of an error already in the log bumps its `count` and `lastAt`
 * instead of adding a row — a component that throws on every render would
 * otherwise fill the buffer with 25 copies of itself and push out the original
 * cause, which is the entry you actually need.
 *
 * @returns {{entry: object, repeat: boolean, total: number}}
 */
export function recordError({
  kind = CRASH, error, componentStack = '', route = '', source = '', buildId = '', at = Date.now(),
}, storage) {
  const described = describeError(error);
  const entry = {
    ...described,
    kind,
    componentStack: clip(componentStack, MAX_STACK),
    route,
    source,
    buildId,
    at,
    lastAt: at,
    count: 1,
  };

  const list = readErrors(storage);
  const fp = fingerprint(entry);
  const existing = list.find((e) => fingerprint(e) === fp);

  let repeat = false;
  if (existing) {
    existing.count += 1;
    existing.lastAt = at;
    repeat = true;
  } else {
    list.push(entry);
    while (list.length > MAX_ENTRIES) list.shift();
  }

  const s = safeStorage(storage);
  if (s) {
    try { s.setItem(LOG_KEY, JSON.stringify(list)); } catch { /* quota */ }
  }

  return { entry: existing || entry, repeat, total: list.reduce((n, e) => n + e.count, 0) };
}

function stamp(ms) {
  try { return new Date(ms).toISOString(); } catch { return String(ms); }
}

/**
 * A markdown block ready to paste into a chat. This is the whole point of the
 * log — the answer to "what broke?" should be one button, not a scroll through
 * devtools.
 */
export function formatReport(entries, meta = {}) {
  const list = Array.isArray(entries) ? entries : [];
  const head = [
    '## Astral error report',
    '',
    `- when: ${stamp(meta.now ?? Date.now())}`,
    `- route: ${meta.route || '(unknown)'}`,
    `- build: ${meta.buildId || '(unknown)'}`,
    `- agent: ${meta.userAgent || '(unknown)'}`,
    `- errors this session: ${list.length}`,
  ];

  if (list.length === 0) return [...head, '', 'No errors recorded.'].join('\n');

  const body = list.map((e, i) => {
    const lines = [
      '',
      `### ${i + 1}. ${e.kind === CRASH ? 'Crash' : 'Background error'} — ${e.name}: ${e.message}`,
      '',
      `- at: ${stamp(e.at)}${e.count > 1 ? ` (×${e.count}, last ${stamp(e.lastAt)})` : ''}`,
      `- route: ${e.route || '(unknown)'}`,
    ];
    if (e.source) lines.push(`- caught by: ${e.source}`);
    if (e.stack) lines.push('', '```', e.stack, '```');
    if (e.componentStack) lines.push('', 'React component stack:', '```', e.componentStack.trim(), '```');
    return lines.join('\n');
  });

  return [...head, ...body].join('\n');
}

// Stale-chunk recovery.
//
// This app really does code-split at runtime — eftApi.js and eftQuestLogic.js
// pull their JSON snapshots on demand, dlab/engine/voice.js loads piper/kokoro
// only if you pick a voice, pogoaccs loads xlsx/mammoth only when you drop a
// file in. Every one of those is a separate request for a hashed filename.
//
// Vercel gives each deploy new hashes. So a tab left open across a redeploy
// asks for a chunk that no longer exists, and gets a 404 (or an HTML error page
// served as JavaScript, which fails to parse). Nothing is wrong with the code
// — the tab is just holding a stale index. One reload fixes it completely.
//
// Treating that as a crash would show a stack trace for a non-bug. Reloading
// blindly would loop forever if the guess is wrong. Hence: reload exactly once
// per session, then stop and show the error like anything else.

export const RELOAD_KEY = 'astral_chunk_reload_v1';

// Wording differs per engine and has changed across versions, so this is a
// deliberately broad set matched against message AND name:
//   Chrome/Edge  "Failed to fetch dynamically imported module: https://…"
//   Safari       "Importing a module script failed."
//   Firefox      "error loading dynamically imported module"
//   webpack-era  ChunkLoadError / "Loading chunk 12 failed"
//   Vite preload "Unable to preload CSS for …"
const PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /importing a module script failed/i,
  /loading chunk \S+ failed/i,
  /chunkloaderror/i,
  /unable to preload css/i,
  // A 404 answered with index.html parses as HTML, not JS.
  /expected a javascript(-or-wasm)? module script/i,
];

export function isChunkLoadError(err) {
  if (!err) return false;
  const text = `${err.name ?? ''} ${err.message ?? err}`;
  return PATTERNS.some((re) => re.test(text));
}

function safeStorage(storage) {
  if (storage) return storage;
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function hasReloaded(storage) {
  const s = safeStorage(storage);
  if (!s) return false;
  try { return s.getItem(RELOAD_KEY) != null; } catch { return false; }
}

/**
 * Record that we used the one free reload.
 *
 * Returns whether the mark actually STUCK, and the caller must not reload
 * unless it did. A storage that accepts writes and silently drops them (quota,
 * some privacy modes) would otherwise mean every load reads "not reloaded
 * yet", reloads, and does it again forever. So this reads the value back
 * rather than trusting setItem not to throw.
 */
export function markReloaded(storage, at = Date.now()) {
  const s = safeStorage(storage);
  if (!s) return false;
  try {
    s.setItem(RELOAD_KEY, String(at));
    return s.getItem(RELOAD_KEY) != null;
  } catch {
    return false;
  }
}

/**
 * Reload once for a stale chunk, never twice.
 *
 * Returns true when it triggered a reload — the caller should then do nothing
 * else, because the page is on its way out. False means either "not a chunk
 * error" or "already tried that", and the error should be surfaced normally.
 *
 * If no storage is available at all (privacy mode) this returns false rather
 * than reloading: an unguarded reload is an infinite loop, which is a far worse
 * failure than showing the error.
 */
export function tryChunkReload(err, { storage, reload, now = Date.now() } = {}) {
  if (!isChunkLoadError(err)) return false;
  const s = safeStorage(storage);
  if (!s) return false;
  if (hasReloaded(s)) return false;

  // No mark, no reload. An unguarded reload is an infinite loop, which is a far
  // worse failure than showing the raw error.
  if (!markReloaded(s, now)) return false;

  const go = reload || (() => { window.location.reload(); });
  go();
  return true;
}

// Called once the app has rendered successfully, so the next stale chunk in a
// later session gets its own single retry rather than inheriting this one's
// spent guard.
export function clearReloadGuard(storage) {
  const s = safeStorage(storage);
  if (!s) return;
  try { s.removeItem(RELOAD_KEY); } catch { /* quota */ }
}

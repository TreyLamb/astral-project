// Which saved keys belong to which tool.
//
// This exists for one specific failure that reloading cannot fix: a bad value
// in localStorage means load -> read it -> crash -> reload -> read the SAME bad
// value -> crash, forever. The tool is bricked until storage is cleared, and
// the only other cure is devtools.
//
// The map below is a CONVENIENCE, never load-bearing. `allKeys()` lists
// everything with no registry at all and can never go stale, so a tool missing
// from PREFIXES loses a shortcut, not a capability. Nothing here deletes
// anything on its own — the caller shows the keys first and asks twice.

// Route prefix -> the localStorage prefixes that tool owns. Derived by reading
// the storage modules, not guessed. Longest route wins, which is why
// /POGO-ACCS resolves before /POGO.
export const PREFIXES = {
  '/TT': ['tt-'],
  '/MFT': ['fitness_', 'ft.docs.'],
  '/EFTsh': ['eftsh_', 'eftsh-', 'eftmap_', 'eftmap-'],
  '/TKB': ['tkb_', 'afoqt_'],
  '/DLAB': ['dlab_'],
  '/VV': ['lang_'],
  '/QA': ['qa-'],
  '/RS': ['rs_'],
  '/POGO-ACCS': ['pogoaccs_'],
  '/POGO': ['pgo_'],
  '/pogo-filters': ['pogofilters_'],
  '/mymdb': ['mymdb_'],
  '/medaldex': ['medaldex_'],
  '/orbit': ['orbit_', 'orbit-'],
  '/stashmap': ['stashmap_'],
  '/league-build': ['league_build_'],
  '/timer-tool': ['astral_timer_tool_'],
  '/lexicon': ['lexicon_'],
  '/daily-idiom': ['chineseIdiom'],
  '/planning-tool': ['planningTool.'],
  '/antiquityquest': ['aq_'],
  '/python-game': ['ct_'],
  '/pokered': ['pkr_'],
  '/bashmon': ['bashmon_'],
  '/gitmon': ['gitmon_'],
  '/signal-lost': ['signal_lost_'],
};

// Site-wide keys that belong to no single tool. Matched EXACTLY, not by
// prefix — /timer-tool's keys start with `astral_` too, and a prefix rule here
// would quietly protect them from their own tool's reset button.
export const SITE_KEYS = new Set([
  'astral_home_layout_v1',
  'astral_signin_pending_v1',
  'astral_auth_diag_v1',
  'astral_welcome_choice_v1',
  'astral_errors_v1',
  'astral_chunk_reload_v1',
  'astral_error_alert',
]);

const ROUTES_BY_SPECIFICITY = Object.keys(PREFIXES).sort((a, b) => b.length - a.length);

export function prefixesForRoute(pathname = '') {
  const route = ROUTES_BY_SPECIFICITY.find((r) => pathname.startsWith(r));
  return route ? { route, prefixes: PREFIXES[route] } : { route: null, prefixes: [] };
}

function safeLocal(storage) {
  if (storage) return storage;
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function sizeOf(value) {
  return value == null ? 0 : value.length;
}

/**
 * Every localStorage key on the site, biggest first, each flagged with whether
 * it belongs to the given route and whether it is site-wide.
 *
 * Deliberately reads sizes: "mymdb_v1 — 112 KB" tells you what you are about to
 * lose in a way a bare key name does not.
 */
export function allKeys(pathname = '', storage) {
  const s = safeLocal(storage);
  if (!s) return [];
  const { prefixes } = prefixesForRoute(pathname);

  const out = [];
  let n = 0;
  try { n = s.length; } catch { return []; }

  for (let i = 0; i < n; i += 1) {
    let key;
    try { key = s.key(i); } catch { break; }
    if (key == null) continue;
    let value = null;
    try { value = s.getItem(key); } catch { value = null; }
    out.push({
      key,
      bytes: sizeOf(value),
      mine: prefixes.some((p) => key.startsWith(p)),
      site: SITE_KEYS.has(key),
    });
  }

  return out.sort((a, b) => b.bytes - a.bytes || a.key.localeCompare(b.key));
}

// Just this tool's keys — what the reset button pre-ticks.
export function keysForRoute(pathname = '', storage) {
  return allKeys(pathname, storage).filter((k) => k.mine && !k.site);
}

/**
 * Remove exactly the keys named. No prefix matching at this layer on purpose:
 * whatever was shown to the user is what gets deleted, so a bug in the registry
 * can never widen the blast radius past what they saw and approved.
 *
 * @returns {{removed: string[], failed: string[]}}
 */
export function removeKeys(keys, storage) {
  const s = safeLocal(storage);
  const removed = [];
  const failed = [];
  if (!s) return { removed, failed: [...(keys || [])] };
  for (const key of keys || []) {
    try {
      s.removeItem(key);
      removed.push(key);
    } catch {
      failed.push(key);
    }
  }
  return { removed, failed };
}

export function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

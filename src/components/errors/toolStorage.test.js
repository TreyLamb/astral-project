import { describe, it, expect } from 'vitest';
import {
  PREFIXES, SITE_KEYS, prefixesForRoute, allKeys, keysForRoute, removeKeys, fmtBytes,
} from './toolStorage';

function fakeStorage(obj) {
  const entries = Object.entries(obj);
  const map = new Map(entries);
  return {
    get length() { return map.size; },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

describe('prefixesForRoute', () => {
  it('finds a tool by its route', () => {
    expect(prefixesForRoute('/TT').prefixes).toEqual(['tt-']);
    expect(prefixesForRoute('/MFT/dashboard').prefixes).toContain('fitness_');
  });

  // /POGO-ACCS starts with /POGO. Shortest-match-wins would hand the accounts
  // tool the tracker's keys and vice versa.
  it('prefers the more specific route', () => {
    expect(prefixesForRoute('/POGO-ACCS/boxes').prefixes).toEqual(['pogoaccs_']);
    expect(prefixesForRoute('/POGO').prefixes).toEqual(['pgo_']);
  });

  it('returns nothing for an unregistered route rather than guessing', () => {
    expect(prefixesForRoute('/some-new-tool').prefixes).toEqual([]);
    expect(prefixesForRoute('/').prefixes).toEqual([]);
    expect(prefixesForRoute('').prefixes).toEqual([]);
  });
});

describe('allKeys', () => {
  const store = () => fakeStorage({
    'tt-whatif': 'x'.repeat(400),
    'tt-notes-v1': 'y'.repeat(100),
    mymdb_v1: 'z'.repeat(2000),
    astral_home_layout_v1: 'small',
  });

  // The registry is a convenience; this path needs no map and cannot go stale.
  it('lists everything regardless of route', () => {
    expect(allKeys('/TT', store())).toHaveLength(4);
    expect(allKeys('/nowhere', store())).toHaveLength(4);
  });

  it('sorts biggest first, so what you are about to lose is at the top', () => {
    expect(allKeys('/TT', store())[0].key).toBe('mymdb_v1');
  });

  it('flags which keys belong to the current tool', () => {
    const rows = allKeys('/TT', store());
    expect(rows.find((r) => r.key === 'tt-whatif').mine).toBe(true);
    expect(rows.find((r) => r.key === 'mymdb_v1').mine).toBe(false);
  });

  it('flags site-wide keys so they are never mistaken for a tool\'s own', () => {
    expect(allKeys('/TT', store()).find((r) => r.key === 'astral_home_layout_v1').site).toBe(true);
  });

  it('returns empty rather than throwing when storage is unavailable', () => {
    expect(allKeys('/TT', null)).toEqual([]);
  });
});

describe('keysForRoute', () => {
  it('narrows to just this tool', () => {
    const s = fakeStorage({ 'tt-whatif': 'a', mymdb_v1: 'b', fitness_goals_v1: 'c' });
    expect(keysForRoute('/TT', s).map((k) => k.key)).toEqual(['tt-whatif']);
  });

  // SITE_KEYS is matched exactly, not by prefix, precisely so that
  // /timer-tool's astral_timer_tool_* keys are NOT protected from their own
  // tool's reset button.
  it('excludes site-wide keys but not a tool that merely shares their prefix', () => {
    const s = fakeStorage({
      astral_home_layout_v1: 'site',
      astral_timer_tool_timers: 'tool',
    });
    expect(keysForRoute('/timer-tool', s).map((k) => k.key)).toEqual(['astral_timer_tool_timers']);
    expect(SITE_KEYS.has('astral_timer_tool_timers')).toBe(false);
  });

  it('is empty for a tool with no registered prefix', () => {
    expect(keysForRoute('/some-new-tool', fakeStorage({ a: '1' }))).toEqual([]);
  });
});

describe('removeKeys', () => {
  // No prefix matching at this layer on purpose: whatever was shown and
  // approved is exactly what gets deleted, so a wrong entry in PREFIXES can
  // never widen the blast radius.
  it('removes only the exact keys named', () => {
    const s = fakeStorage({ a: '1', b: '2', c: '3' });
    const { removed } = removeKeys(['a', 'c'], s);
    expect(removed).toEqual(['a', 'c']);
    expect([...s._map.keys()]).toEqual(['b']);
  });

  it('reports failures instead of throwing', () => {
    const hostile = { removeItem() { throw new Error('denied'); } };
    expect(removeKeys(['a'], hostile).failed).toEqual(['a']);
  });

  it('handles being given nothing', () => {
    expect(removeKeys(undefined, fakeStorage({})).removed).toEqual([]);
  });
});

describe('the registry itself', () => {
  it('has no route that shadows a more specific one by accident', () => {
    for (const route of Object.keys(PREFIXES)) {
      const resolved = prefixesForRoute(route).route;
      expect(resolved).toBe(route);
    }
  });

  it('never claims a site-wide key for a tool', () => {
    for (const key of SITE_KEYS) {
      for (const [route, prefixes] of Object.entries(PREFIXES)) {
        if (prefixes.some((p) => key.startsWith(p))) {
          // Allowed only if the tool genuinely owns it, which no site key is.
          throw new Error(`${route} claims site key ${key}`);
        }
      }
    }
  });
});

describe('fmtBytes', () => {
  it('reads at a glance at every scale', () => {
    expect(fmtBytes(0)).toBe('0 B');
    expect(fmtBytes(512)).toBe('512 B');
    expect(fmtBytes(2048)).toBe('2.0 KB');
    expect(fmtBytes(1024 * 1024 * 3)).toBe('3.0 MB');
  });
});

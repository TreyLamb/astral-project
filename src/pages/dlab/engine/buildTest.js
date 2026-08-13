// Assembles a complete sitting: one language, two independent item pools, and
// the rules brief that both are answerable from.
//
// WHY the pools are independent rather than the same items delivered twice:
// re-asking a written item in audio measures whether you remember your own
// earlier answer, not whether you can apply the rule. Sharing the LANGUAGE is
// essential — you cannot learn a new grammar halfway through a sitting — but
// sharing the ITEMS would quietly turn the second half into a recall test.

import { mulberry32 } from './rng.js';
import { rollDistinctLanguage, paramVector } from './language.js';
import { buildRulesBrief, markerTable } from './rulesBrief.js';
import { generateItem, tierCounts, TIERS, resetItemIds } from './questions.js';
import { validateItem, specSignature } from './validate.js';
import { buildDistractors } from './examSim.js';

export const PRESETS = [
  { id: 'quick', label: 'Quick Drill', written: 6, audio: 24, mc: false, timed: false, estMinutes: 25, desc: 'A short sitting weighted to listening.' },
  { id: 'writtenFocus', label: 'Written Focus', written: 30, audio: 0, mc: false, timed: false, estMinutes: 35, desc: '30 written items, no audio.' },
  { id: 'balanced', label: 'Balanced', written: 30, audio: 30, mc: false, timed: false, estMinutes: 75, desc: 'Equal halves.' },
  { id: 'dlabWeighted', label: 'DLAB-Weighted', written: 12, audio: 48, mc: false, timed: false, estMinutes: 70, desc: 'Matches the real exam\'s 1:4 visual-to-audio section ratio.', default: true },
  { id: 'examSim', label: 'Exam Sim', written: 26, audio: 100, mc: true, timed: true, timeLimitMin: 120, estMinutes: 120, desc: 'Full length, multiple choice, timed, scaled score.' },
];

export function presetById(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS.find((p) => p.default);
}

export const MAX_WRITTEN = 60;
export const MAX_AUDIO = 120;

function generatePool(lang, rng, seed, count, modality, briefRuleIds, seen, report) {
  if (count <= 0) return [];
  const counts = tierCounts(count);
  const out = [];

  for (const tier of TIERS) {
    for (let i = 0; i < counts[tier]; i++) {
      let accepted = null;

      for (let attempt = 0; attempt < 30; attempt++) {
        const candidate = generateItem(lang, rng, seed, tier, modality);
        if (!candidate) continue;

        const sig = specSignature(candidate);
        if (seen.has(sig)) {
          report.duplicatesRejected += 1;
          continue;
        }

        const v = validateItem(candidate, lang, briefRuleIds);
        if (!v.ok) {
          report.invalidRejected += 1;
          report.failures[v.failed] = (report.failures[v.failed] || 0) + 1;
          continue;
        }

        seen.add(sig);
        accepted = candidate;
        break;
      }

      if (!accepted) {
        // Every language can always produce a bare vocabulary item, so the pool
        // is never short. Counted so the selftest can assert this path is rare.
        report.degraded += 1;
        for (let attempt = 0; attempt < 40 && !accepted; attempt++) {
          const fallback = generateItem(lang, rng, seed, 'easy', modality);
          if (!fallback) continue;
          const sig = specSignature(fallback);
          if (seen.has(sig)) continue;
          if (!validateItem(fallback, lang, briefRuleIds).ok) continue;
          seen.add(sig);
          accepted = fallback;
        }
      }

      if (accepted) {
        accepted.pool = modality;
        accepted.requestedTier = tier;
        out.push(accepted);
      }
    }
  }

  return out;
}

/**
 * @param {Object} config
 * @param {number} config.seed
 * @param {number} config.written
 * @param {number} config.audio
 * @param {boolean} [config.mc] - Exam Sim only; generates distractors up front
 * @param {string} [config.presetId]
 * @param {Record<string, unknown>[]} [config.recentVectors]
 * @returns {object} the full sitting
 */
export function buildTest({ seed, written, audio, mc = false, presetId = null, recentVectors = [] }) {
  resetItemIds();

  const { language, forced } = rollDistinctLanguage(seed, recentVectors);
  const brief = buildRulesBrief(language);
  const markers = markerTable(language);
  const briefRuleIds = brief.ruleIds;

  // A generator stream separate from the language's own stream, so changing how
  // many items a preset asks for cannot change the language a seed produces.
  const rng = mulberry32((language.seed ^ 0x5bf03635) >>> 0);

  const report = { duplicatesRejected: 0, invalidRejected: 0, degraded: 0, failures: {} };
  const seen = new Set();

  const w = Math.max(0, Math.min(MAX_WRITTEN, written | 0));
  const a = Math.max(0, Math.min(MAX_AUDIO, audio | 0));

  const writtenItems = generatePool(language, rng, language.seed, w, 'written', briefRuleIds, seen, report);
  const audioItems = generatePool(language, rng, language.seed, a, 'audio', briefRuleIds, seen, report);

  const items = [...writtenItems, ...audioItems].map((it, i) => ({ ...it, index: i + 1 }));

  if (mc) {
    for (const it of items) it.choices = buildDistractors(it, language, rng);
  }

  return {
    id: `${language.seedCode}-${Date.now().toString(36)}`,
    seed: language.seed,
    seedCode: language.seedCode,
    createdAt: Date.now(),
    presetId,
    config: { written: w, audio: a, mc },
    language,
    paramVector: paramVector(language),
    forcedSimilar: forced,
    brief,
    markers,
    items,
    report,
  };
}

/**
 * Items in the order a sitting presents them, for one pool.
 * @param {object} test
 * @param {'written'|'audio'} pool
 */
export function poolItems(test, pool) {
  return test.items.filter((i) => i.pool === pool);
}

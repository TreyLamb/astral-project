const STORAGE_KEY = 'ct_player';

const DEFAULT_STATE = {
  level: 1,
  xp: 0,
  tutorialCompleted: [],
  unlockedFeatures: ['tutorial'],
};

export function loadPlayer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function savePlayer(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function computeLevel(xp, tiers) {
  let level = 1;
  for (const tier of tiers) {
    if (xp >= tier.xpRequired) level = tier.level;
    else break;
  }
  return level;
}

export function xpForNextLevel(xp, tiers) {
  for (const tier of tiers) {
    if (xp < tier.xpRequired) return { required: tier.xpRequired, level: tier.level };
  }
  return null;
}

export function addXP(state, amount, tiers) {
  const newXp = state.xp + amount;
  const newLevel = computeLevel(newXp, tiers);
  const leveled = newLevel > state.level;

  let newFeatures = [...state.unlockedFeatures];
  if (leveled) {
    for (const tier of tiers) {
      if (tier.level > state.level && tier.level <= newLevel) {
        newFeatures = [...new Set([...newFeatures, ...tier.unlocks])];
      }
    }
  }

  return { ...state, xp: newXp, level: newLevel, unlockedFeatures: newFeatures };
}

export function markChallengeComplete(state, challengeId) {
  if (state.tutorialCompleted.includes(challengeId)) return state;
  return { ...state, tutorialCompleted: [...state.tutorialCompleted, challengeId] };
}

export function isChallengeComplete(state, challengeId) {
  return state.tutorialCompleted.includes(challengeId);
}

export function hasFeature(state, feature) {
  return state.unlockedFeatures.includes(feature);
}

export function xpPercent(xp, tiers) {
  const next = xpForNextLevel(xp, tiers);
  if (!next) return 100;
  const current = tiers.find(t => t.level === computeLevel(xp, tiers));
  const base = current ? current.xpRequired : 0;
  return Math.round(((xp - base) / (next.required - base)) * 100);
}

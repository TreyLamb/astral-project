// Lifting: estimated 1RM + volume. Kept lean per the spec.
//
// Epley (1985):   1RM = w · (1 + reps/30)
// Brzycki (1993): 1RM = w · 36 / (37 − reps)
// Both are standard submaximal-to-1RM estimates; they agree closely up to ~10
// reps and diverge beyond, so we show both and their mean. reps=1 => the weight.

export function epley1RM(weightKg, reps) {
  if (!weightKg || !reps) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function brzycki1RM(weightKg, reps) {
  if (!weightKg || !reps || reps >= 37) return null;
  if (reps === 1) return weightKg;
  return weightKg * 36 / (37 - reps);
}

export function oneRepMax(weightKg, reps) {
  const e = epley1RM(weightKg, reps);
  const b = brzycki1RM(weightKg, reps);
  const vals = [e, b].filter((v) => v != null);
  return { epley: e, brzycki: b, avg: vals.length ? vals.reduce((a, c) => a + c, 0) / vals.length : null };
}

// sets: [{ reps, weightKg }]
export function setVolume(sets) {
  return (sets || []).reduce((a, s) => a + (Number(s.reps) || 0) * (Number(s.weightKg) || 0), 0);
}

// exercises: [{ name, sets: [{reps, weightKg}] }]
export function exercisesVolume(exercises) {
  return (exercises || []).reduce((a, ex) => a + setVolume(ex.sets), 0);
}

export function bestOneRepMax(exercises) {
  let best = null;
  for (const ex of exercises || []) {
    for (const s of ex.sets || []) {
      const orm = oneRepMax(Number(s.weightKg), Number(s.reps)).avg;
      if (orm != null && (!best || orm > best.orm)) best = { orm, exercise: ex.name, reps: Number(s.reps), weightKg: Number(s.weightKg) };
    }
  }
  return best;
}

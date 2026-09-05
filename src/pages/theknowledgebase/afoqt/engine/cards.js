// The daily vocabulary flashcard engine.
//
// Trey's spec, 2026-09-04, verbatim in the parts that matter:
//
//   "I want 30 new words a day. Every day 30 new words add in. Every day I open the review it
//    starts with my new words. I go through them 3 times, then all the new words and old words
//    mix into the same review. Max 5 days worth of words. On any day if I decide I need more
//    words I want a button to 'add x new words'. The next day still gets 30 words, adding words
//    doesn't change. Since max 5 days most recent worth of words, I then want a secondary flash
//    card deck that has all the words in it for when I want to mass review."
//
//   "This is all fast flash cards. No wrong or right. Just next or back. One tap."
//
// THIS IS NOT THE DRILL ENGINE AND MUST NOT BECOME IT. A drill scores you, tracks per-template
// mastery, injects a miss pool and builds five-option slates from named error modes. None of that
// belongs here: there is no answer to be right about, so there is nothing to grade, no accuracy to
// record, and no miss pool to feed. The only state this engine keeps is WHICH DAY a word was first
// introduced. Everything else is derived from that plus today's date.
//
// The separation is deliberate rather than incidental. Recognition ("I have met this word") and
// recall under a twelve-second clock ("I can pick its synonym from five") are different skills at
// different stages, and folding the first into the second is what makes a vocabulary tool feel
// like an exam you are failing. The drill stays the exam; this is the deck you flip on a bus.

/** New words introduced per day, and the default for the "add more" button. His number. */
export const WORDS_PER_DAY = 30;

/** How many times a day's NEW words are shown before old words mix in. His number. */
export const NEW_PASSES = 3;

/**
 * How many days of words stay in the daily rolling review.
 *
 * Counted in DAYS THAT HAVE WORDS, not calendar days. If he skips a Tuesday, Tuesday is not one
 * of the five - the window is his five most recent study days, which is what "5 days worth of
 * words" means to a person and is the behaviour that survives a missed day without silently
 * shrinking the deck.
 */
export const WINDOW_DAYS = 5;

const cardsOf = (progress) => progress?.cards ?? { days: {} };

/** Day keys that have words, oldest first. */
export const dayKeys = (progress) =>
  Object.keys(cardsOf(progress).days ?? {}).filter((d) => (cardsOf(progress).days[d] ?? []).length).sort();

/** Every word id ever introduced, in introduction order. */
export function introducedIds(progress) {
  const days = cardsOf(progress).days ?? {};
  return dayKeys(progress).flatMap((d) => days[d]);
}

/** The ids introduced on one specific day. */
export const idsForDay = (progress, day) => (cardsOf(progress).days ?? {})[day] ?? [];

/**
 * The rolling deck: the WINDOW_DAYS most recent study days, oldest first.
 *
 * Older days fall out of the daily review but are never deleted - they stay in `days` and remain
 * reachable through the full deck (`allDeck`), which is the whole point of his "secondary flash
 * card deck that has all the words in it".
 */
export function windowDays(progress, limit = WINDOW_DAYS) {
  const keys = dayKeys(progress);
  return keys.slice(Math.max(0, keys.length - limit));
}

/** Word ids in the rolling deck, oldest day first. */
export const windowIds = (progress, limit = WINDOW_DAYS) =>
  windowDays(progress, limit).flatMap((d) => idsForDay(progress, d));

/**
 * Choose the next `n` words a learner has not met.
 *
 * Ordered by BAND, hardest first. Trey's ranking puts bands 1-2 below the level the test asks and
 * band 4/5 at the level worth owning, so front-loading the hard tier is what he actually asked
 * for when he said to author from the highest tier only - it would be strange to author band 4-5
 * and then teach him band 2 first. Within a band the order is stable but arbitrary (by id), so a
 * day is a coherent slice rather than a reshuffle that makes "what did I get yesterday"
 * unanswerable.
 *
 * `pool` is the full WordRow list; `taken` is every id already introduced.
 */
export function nextWords(pool, taken, n) {
  const have = new Set(taken);
  return pool
    .filter((w) => !have.has(w.id))
    .sort((a, b) => (b.band ?? 0) - (a.band ?? 0) || a.id.localeCompare(b.id))
    .slice(0, n)
    .map((w) => w.id);
}

/** How many words are left to introduce. Shown in the UI so running dry is never a surprise. */
export const remainingCount = (pool, progress) => pool.length - introducedIds(progress).length;

/**
 * Introduce a day's words, once.
 *
 * IDEMPOTENT PER DAY, and that is the load-bearing property. This runs on every open of the view,
 * so a second visit on the same day must not hand out another thirty words - the spec is "30 new
 * words a day", not "30 per time you open it". `addMore` is the only way to exceed the daily
 * intake, which is exactly the distinction he drew: "The next day still gets 30 words, adding
 * words doesn't change."
 */
export function introduceDay(progress, pool, today, n = WORDS_PER_DAY) {
  const cards = cardsOf(progress);
  if ((cards.days?.[today] ?? []).length) return progress;
  const ids = nextWords(pool, introducedIds(progress), n);
  if (!ids.length) return progress;
  return { ...progress, cards: { ...cards, days: { ...cards.days, [today]: ids } } };
}

/**
 * Add more words to TODAY on demand - his "add x new words" button.
 *
 * They join today's batch, so they are treated as new: the session below re-runs the three new-word
 * passes over everything introduced today, including these. Tomorrow is untouched and still gets
 * its own WORDS_PER_DAY.
 */
export function addMore(progress, pool, today, n) {
  const cards = cardsOf(progress);
  const ids = nextWords(pool, introducedIds(progress), n);
  if (!ids.length) return progress;
  const existing = cards.days?.[today] ?? [];
  return { ...progress, cards: { ...cards, days: { ...cards.days, [today]: [...existing, ...ids] } } };
}

/**
 * Deterministic shuffle. Seeded off the day string so a session is stable if the view re-renders
 * or he reloads mid-deck - a card order that reshuffles under you is disorienting in a way a
 * scored drill's never is, because here you are navigating by memory of position.
 */
function seededShuffle(ids, seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Build today's session: the three new-word passes, then everything in the window, mixed.
 *
 * Returned as one flat queue with a `phase` per card, because the view is a single next/back walk
 * and should not have to know about stage boundaries - it just reports which phase it is in so the
 * header can say "New words, pass 2 of 3" rather than leaving him wondering why he is seeing the
 * same thirty words again.
 *
 * Pass 1 keeps introduction order (a first meeting reads better in a stable order); passes 2 and 3
 * are shuffled, because by then order itself has become a memory crutch.
 */
export function buildSession(progress, today) {
  const todays = idsForDay(progress, today);
  const queue = [];
  for (let pass = 0; pass < NEW_PASSES && todays.length; pass++) {
    const ids = pass === 0 ? todays : seededShuffle(todays, `${today}:${pass}`);
    for (const id of ids) queue.push({ id, phase: 'new', pass: pass + 1 });
  }
  const mixed = windowIds(progress);
  for (const id of seededShuffle(mixed, `${today}:mixed`)) queue.push({ id, phase: 'mixed', pass: null });
  return queue;
}

/**
 * The full deck - every word ever introduced, for mass review.
 *
 * Shuffled per call-seed rather than left in introduction order, which would otherwise make the
 * whole deck a chronological march through his study history: the first fifty cards always the
 * same fifty, every time.
 */
export const allDeck = (progress, seed = 'all') => seededShuffle(introducedIds(progress), seed);

import { describe, it, expect } from 'vitest';
import { COURSE_DECKS, MICR2065_SUBJECT, MICR2065_BLOOD_QUESTIONS, planDeckMerge } from './courseDecks';
import { SEED_QUESTIONS } from './tkbSeed';

describe('course decks', () => {
  it('every deck key, question id and subtopic reference is valid and unique', () => {
    const keys = COURSE_DECKS.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
    const seedIds = new Set(SEED_QUESTIONS.map((q) => q.id));
    const all = COURSE_DECKS.flatMap((d) => d.questions);
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
    for (const deck of COURSE_DECKS) {
      const subtopicIds = new Set(deck.subject.subtopics.map((st) => st.id));
      for (const q of deck.questions) {
        expect(seedIds.has(q.id)).toBe(false);
        expect(q.subjectId).toBe(deck.subject.id);
        expect(subtopicIds.has(q.subtopicId)).toBe(true);
        expect(q.question.trim().length).toBeGreaterThan(10);
        expect(q.answer.trim().length).toBeGreaterThan(0);
        expect(['basic', 'intermediate', 'advanced']).toContain(q.difficulty);
        expect(['main_recall', 'quick_fact']).toContain(q.pipeline);
        expect(q.status).toBe('active');
      }
    }
  });

  it('the MICR 2065 subject is named after the course code so the course page finds it', () => {
    expect(MICR2065_SUBJECT.name).toBe('MICR 2065');
    expect(MICR2065_BLOOD_QUESTIONS).toHaveLength(49);
    expect(MICR2065_SUBJECT.visibleToProfiles).toContain('focused_review');
  });

  it('a fresh account gets the subject and every card', () => {
    const plan = planDeckMerge(COURSE_DECKS[0], [], []);
    expect(plan.subject).toEqual(MICR2065_SUBJECT);
    expect(plan.questions).toHaveLength(49);
  });

  it('never re-adds cards the account already has, and changes nothing when complete', () => {
    const deck = COURSE_DECKS[0];
    const partial = planDeckMerge(deck, [deck.subject], deck.questions.slice(0, 10).map((q) => q.id));
    expect(partial.subject).toBeNull();
    expect(partial.questions).toHaveLength(39);
    const complete = planDeckMerge(deck, [deck.subject], deck.questions.map((q) => q.id));
    expect(complete.subject).toBeNull();
    expect(complete.questions).toHaveLength(0);
  });

  it('joins an existing same-name subject instead of making a duplicate', () => {
    const imported = { id: 'abc123', name: 'MICR 2065', subtopics: [{ id: 'x', name: 'Old' }] };
    const plan = planDeckMerge(COURSE_DECKS[0], [imported], []);
    expect(plan.subject.id).toBe('abc123');
    expect(plan.subject.subtopics[0].id).toBe('x');
    expect(plan.subject.subtopics).toHaveLength(1 + MICR2065_SUBJECT.subtopics.length);
    expect(plan.questions.every((q) => q.subjectId === 'abc123')).toBe(true);
  });
});

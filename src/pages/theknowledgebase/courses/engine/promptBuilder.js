// Assembles a copy-paste prompt for whatever free AI chat Trey already has
// open. This is Tier 3 of the question-generation strategy: zero API calls
// from this app, ever. The prompt asks for the exact JSON shape
// tkbStorage.importQuestions already accepts (the notesToQuestionsPrompt.md
// schema), so the output can be pasted straight into ImportGenerated.jsx with
// no reformatting.
//
// Used to also pull in CourseDocument summaries and captured RealQuestions as
// context — that feature (and the "focus on untested-taught tags" weighting)
// was removed 2026-08-28 along with Documents/Assessments. Trey types the
// topic/material himself into the free-text `context` field instead.

/**
 * @param {import('../coursesStorage').Course} course
 * @param {string} [context] - free-text: what material/topics to base questions on
 * @param {number} [count]
 * @returns {string}
 */
export function buildStudyPrompt(course, context = '', count = 40) {
  const lines = [];
  lines.push(`I'm studying for ${course.code} — ${course.title} (${course.term || 'current term'}).`);
  lines.push(`Generate ${count} study questions as a JSON array. Base them on the material below —`);
  lines.push(`do not invent facts about the subject that aren't implied by it.`);
  lines.push('');

  if (context.trim()) {
    lines.push('=== Material to base questions on ===');
    lines.push(context.trim());
    lines.push('');
  }

  lines.push('=== Required output format ===');
  lines.push('A raw JSON array (no markdown fences, no commentary), each item shaped exactly like:');
  lines.push(JSON.stringify({
    question: 'string — the question text',
    answer: 'string — the correct answer',
    answer_alternates: ['string — other acceptable phrasings, if any'],
    subject: course.code,
    subtopic: 'string — a short topic name, reused across related questions',
    difficulty: 'basic | intermediate | advanced',
    pipeline: 'main_recall',
    style_tags: ['string — topic tags, reused consistently so they match tags used elsewhere for this course'],
    source_note: 'string — say this was AI-generated study material, not an official question',
  }, null, 2));

  return lines.join('\n');
}

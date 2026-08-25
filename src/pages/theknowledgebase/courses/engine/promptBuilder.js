// Assembles a copy-paste prompt for whatever free AI chat Trey already has
// open. This is Tier 3 of the question-generation strategy: zero API calls
// from this app, ever. The prompt asks for the exact JSON shape
// tkbStorage.importQuestions already accepts (the notesToQuestionsPrompt.md
// schema), so the output can be pasted straight into ImportGenerated.jsx with
// no reformatting.

/**
 * @param {import('../coursesStorage').Course} course
 * @param {import('../coursesStorage').CourseDocument[]} documents
 * @param {import('../coursesStorage').RealQuestion[]} realQuestions
 * @param {string[]} [focusTags] - tags to weight toward (e.g. untested-taught tags)
 * @param {number} [count]
 * @returns {string}
 */
export function buildStudyPrompt(course, documents, realQuestions, focusTags = [], count = 40) {
  const courseDocs = documents.filter((d) => d.courseId === course.id);
  const courseQuestions = realQuestions.filter((q) => q.courseId === course.id);

  const lines = [];
  lines.push(`I'm studying for ${course.code} — ${course.title} (${course.term || 'current term'}).`);
  lines.push(`Generate ${count} study questions as a JSON array. Base them on the material below —`);
  lines.push(`do not invent facts about the subject that aren't implied by it.`);
  lines.push('');

  if (courseDocs.length) {
    lines.push('=== Material covered so far ===');
    for (const d of courseDocs) {
      const tagStr = d.tags?.length ? ` [tags: ${d.tags.join(', ')}]` : '';
      lines.push(`- (${d.kind}) ${d.title}${tagStr}${d.summary ? ` — ${d.summary}` : ''}`);
    }
    lines.push('');
  }

  if (courseQuestions.length) {
    lines.push('=== Real questions I have already been asked (match this style/difficulty) ===');
    for (const q of courseQuestions.slice(-25)) {
      lines.push(`- Q: ${q.verbatimText}${q.correctAnswer ? `  A: ${q.correctAnswer}` : ''}`);
    }
    lines.push('');
  }

  if (focusTags.length) {
    lines.push(`=== Weight extra toward these topics — they've been taught but not tested yet ===`);
    lines.push(focusTags.join(', '));
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

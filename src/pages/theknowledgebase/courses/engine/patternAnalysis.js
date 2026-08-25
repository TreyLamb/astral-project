// Pure counting over tags. No AI, no ML, no network — this is deliberate
// (see CLAUDE.md / TKBDesignDoc.md: pattern analysis is a secondary report,
// not the main purpose of Courses, and must never cost an API call).
//
// The join key everywhere here is the topic TAG: the same string a
// CourseDocument.tags entry and a RealQuestion.topicTags entry both use.
// Nothing here is smart about synonyms or spelling — tag consistently or the
// counts undercount. That's a content-entry discipline, not a code problem.

/**
 * @param {import('../coursesStorage').CourseDocument[]} documents
 * @param {string} courseId
 * @returns {Record<string, {tag: string, weeks: Record<string, number>, total: number}>}
 */
export function tagFrequencyByWeek(documents, courseId) {
  const out = {};
  for (const d of documents) {
    if (d.courseId !== courseId) continue;
    const week = d.weekId ?? '(unassigned)';
    for (const tag of d.tags ?? []) {
      if (!out[tag]) out[tag] = { tag, weeks: {}, total: 0 };
      out[tag].weeks[week] = (out[tag].weeks[week] ?? 0) + 1;
      out[tag].total += 1;
    }
  }
  return out;
}

/**
 * Cross-tab: how often a tag showed up in taught materials vs. how often it
 * was actually tested. hitRate is null (not 0) when a tag was never taught —
 * it can only be "tested but not taught," which is worth surfacing as-is
 * rather than silently reading as a 0% hit rate.
 * @param {import('../coursesStorage').CourseDocument[]} documents
 * @param {import('../coursesStorage').RealQuestion[]} realQuestions
 * @param {string} courseId
 * @returns {Array<{tag: string, timesTaught: number, timesTested: number, hitRate: number|null}>}
 */
export function tagHitRate(documents, realQuestions, courseId) {
  const taught = {};
  for (const d of documents) {
    if (d.courseId !== courseId) continue;
    for (const tag of d.tags ?? []) taught[tag] = (taught[tag] ?? 0) + 1;
  }
  const tested = {};
  for (const q of realQuestions) {
    if (q.courseId !== courseId) continue;
    for (const tag of q.topicTags ?? []) tested[tag] = (tested[tag] ?? 0) + 1;
  }
  const tags = new Set([...Object.keys(taught), ...Object.keys(tested)]);
  return [...tags].map((tag) => {
    const timesTaught = taught[tag] ?? 0;
    const timesTested = tested[tag] ?? 0;
    return { tag, timesTaught, timesTested, hitRate: timesTaught ? timesTested / timesTaught : null };
  }).sort((a, b) => b.timesTested - a.timesTested || b.timesTaught - a.timesTaught);
}

/**
 * Tags covered in materials with little/no test appearance so far, ranked by
 * most-recently-taught first — the "this hasn't come up yet" list.
 * @param {import('../coursesStorage').CourseDocument[]} documents
 * @param {import('../coursesStorage').RealQuestion[]} realQuestions
 * @param {string} courseId
 * @param {number} [maxTimesTested] - a tag tested this many times or fewer still counts as "untested"
 * @returns {Array<{tag: string, timesTaught: number, timesTested: number, lastTaughtAt: string}>}
 */
export function untestedTaughtTags(documents, realQuestions, courseId, maxTimesTested = 0) {
  const hitRates = tagHitRate(documents, realQuestions, courseId);
  const lastTaughtAt = {};
  for (const d of documents) {
    if (d.courseId !== courseId) continue;
    for (const tag of d.tags ?? []) {
      if (!lastTaughtAt[tag] || d.createdAt > lastTaughtAt[tag]) lastTaughtAt[tag] = d.createdAt;
    }
  }
  return hitRates
    .filter((r) => r.timesTaught > 0 && r.timesTested <= maxTimesTested)
    .map((r) => ({ ...r, lastTaughtAt: lastTaughtAt[r.tag] ?? '' }))
    .sort((a, b) => (b.lastTaughtAt > a.lastTaughtAt ? 1 : -1));
}

/**
 * Tags that recur across multiple assessments — "the professor keeps testing
 * this." minAssessments defaults to 2 (recurs at least once).
 * @param {import('../coursesStorage').Assessment[]} assessments
 * @param {import('../coursesStorage').RealQuestion[]} realQuestions
 * @param {string} courseId
 * @param {number} [minAssessments]
 * @returns {Array<{tag: string, assessmentIds: string[], count: number}>}
 */
export function recurringAcrossAssessments(assessments, realQuestions, courseId, minAssessments = 2) {
  const courseAssessmentIds = new Set(assessments.filter((a) => a.courseId === courseId).map((a) => a.id));
  const byTag = {};
  for (const q of realQuestions) {
    if (!courseAssessmentIds.has(q.assessmentId)) continue;
    for (const tag of q.topicTags ?? []) {
      if (!byTag[tag]) byTag[tag] = new Set();
      byTag[tag].add(q.assessmentId);
    }
  }
  return Object.entries(byTag)
    .map(([tag, ids]) => ({ tag, assessmentIds: [...ids], count: ids.size }))
    .filter((r) => r.count >= minAssessments)
    .sort((a, b) => b.count - a.count);
}

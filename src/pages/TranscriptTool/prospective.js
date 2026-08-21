// Building a course record for a class that does not exist yet. Its own module
// so the shape stays next to the constants that define it, and because a
// component file may only export components
// (react-refresh/only-export-components).
//
// The record has to match what parseTranscript.js emits field for field —
// every consumer (gpa.js, the sorts, the CSV export, the term table) reads
// real courses and prospective ones through the same code paths, and a missing
// field would surface as an unexplained blank cell rather than an error.

// The gen-ed attribute codes the registrar actually prints, mirroring
// GE_ATTRIBUTES in parseTranscript.js. A closed set defined by the university,
// so this one IS a picker — unlike credits or the course code, there is no
// sensible value outside the list.
export const GE_ATTRIBUTES = [
  'AI', 'AS', 'BB', 'CC', 'EN', 'FA', 'FE', 'FF', 'GE', 'GI', 'GM',
  'HH', 'IH', 'LH', 'PP', 'PS', 'QL', 'SS', 'TC', 'WA',
];

export const TERMS = ['SPRING', 'SUMMER', 'FALL'];
const TERM_SEQ = { SPRING: 1, SUMMER: 2, FALL: 3 };

// Sorts an undated class to the end of the Semester column rather than to
// 1970. Matches the sentinel the old planned-course form used.
export const UNDATED_ORDER = 999999;

// Matches parseTranscript.js, so a dated prospective class sorts among the
// real ones on the Semester column instead of piling up at one end.
export function termOrderOf(year, term) {
  // `Number('')` is 0, not NaN — a blank year would otherwise encode as 3 and
  // sort the class ahead of every real course instead of after them.
  const y = String(year ?? '').trim() === '' ? NaN : Number(year);
  if (!Number.isFinite(y) || y <= 0 || !TERM_SEQ[term]) return UNDATED_ORDER;
  return y * 10 + TERM_SEQ[term];
}

export const EMPTY_PROSPECTIVE = {
  subject: '',
  number: '',
  course: '',
  credits: '3',
  grade: 'A',
  attribute: '',
  year: String(new Date().getFullYear()),
  term: 'FALL',
  dated: true,
};

export function newProspectiveId() {
  return `extra-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Turn the form's fields into a course record.
 *
 * Credits is the only required field — it is the one the GPA cannot be
 * computed without. Everything else has a usable default, because a
 * prospective class with no name is still a real credit commitment and
 * refusing to add it would make the form harder to use for no gain.
 *
 * @returns {{course: object}|{error: string}}
 */
export function buildProspective(form) {
  const credits = Number(form.credits);
  if (!Number.isFinite(credits) || credits <= 0) {
    return { error: 'Credits has to be a number above zero — it is the one field the GPA cannot be computed without.' };
  }

  const subject = form.subject.trim().toUpperCase() || 'NEW';
  const number = form.number.trim().toUpperCase();
  const dated = !!form.dated && !!String(form.year).trim();

  return {
    course: {
      id: newProspectiveId(),
      isExtra: true,
      subject,
      number: number || null,
      code: number ? `${subject} ${number}` : subject,
      course: form.course.trim() || 'Prospective class',
      attribute: form.attribute || null,
      credits,
      grade: form.grade,
      // No registrar printed this, so there is no printed value to disagree
      // with. gpa.js derives points from the scale either way.
      printedPoints: null,
      repeatFlag: null,
      semester: dated ? `${form.year} ${form.term}` : 'Prospective',
      year: dated ? Number(form.year) || null : null,
      term: dated ? form.term : null,
      termOrder: dated ? termOrderOf(form.year, form.term) : UNDATED_ORDER,
    },
  };
}

// Column definitions shared by the table (which renders the headers and the
// filter row) and the shell (which owns sort/filter state). Its own file
// because a component module may only export components — see the
// react-refresh/only-export-components rule.
//
// `dir` is the direction a column takes on its FIRST click — the one that is
// actually useful. Grades sort worst-first, credits and impact biggest-first,
// semesters oldest-first. Clicking the same column again flips it.
export const COLUMNS = [
  { key: 'term', label: 'Semester', cls: 'tt-c-term', dir: 'asc', filter: 'semester' },
  { key: 'code', label: 'Course', cls: 'tt-c-code', dir: 'asc', filter: 'text' },
  { key: 'title', label: 'Title', cls: 'tt-c-title', dir: 'asc', filter: 'text' },
  { key: 'credits', label: 'Cr', cls: 'tt-c-num', dir: 'desc', filter: 'credits' },
  { key: 'actual', label: 'Actual', cls: 'tt-c-grade', dir: 'desc', filter: 'grade' },
  { key: 'whatif', label: 'What-if', cls: 'tt-c-what', dir: 'desc', filter: 'grade' },
  { key: 'points', label: 'Pts', cls: 'tt-c-num', dir: 'desc', filter: null },
  {
    key: 'impact',
    label: 'Impact',
    cls: 'tt-c-num',
    dir: 'desc',
    filter: 'impact',
    title: 'How far overall GPA would move if this course were an A',
  },
];

export const NO_FILTERS = Object.fromEntries(COLUMNS.map((c) => [c.key, '']));

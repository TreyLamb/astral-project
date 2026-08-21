// @vitest-environment jsdom
//
// A render smoke test, added 2026-08-20 after `band2 is not a function` took
// the whole site down.
//
// That bug was a row-local `const band = bandOf(...)` shadowing the
// module-level `band()` grade-letter helper, so `band(c.grade)` inside the row
// was calling a string. Nothing could catch it: the pure suites never render,
// `npm run build` only checks module-level bindings, and eslint has no reason
// to object to a legal shadow. It took loading the page.
//
// So this renders the real table with real-shaped rows and asserts the cells
// actually come out. It is deliberately shallow — the arithmetic is tested in
// creditBlocks/rowOrder/gpa — its whole job is "does this component execute".
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import CourseTable from './CourseTable';
import { NO_FILTERS } from './columns';

let container;
let root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  container.remove();
});

const course = (p) => ({
  id: 'ENGL-2010-2016-SPRING',
  subject: 'ENGL',
  number: '2010',
  code: 'ENGL 2010',
  course: 'Intermediate Writing',
  attribute: 'EN',
  credits: 3,
  grade: 'B+',
  repeatFlag: null,
  semester: '2016 SPRING',
  termOrder: 20161,
  ...p,
});

function renderTable(props = {}) {
  root = createRoot(container);
  act(() => root.render(
    <CourseTable
      rows={[course()]}
      overrides={{}}
      impacts={{}}
      scale="uvu"
      honorRepeats
      onGrade={() => {}}
      onRemoveExtra={() => {}}
      sort={{ key: 'impact', dir: 'desc' }}
      onSort={() => {}}
      filters={NO_FILTERS}
      onFilter={() => {}}
      semesters={['2016 SPRING']}
      creditValues={[3]}
      changedFirst={false}
      onChangedFirst={() => {}}
      changedCount={0}
      creditBlock={12}
      showBlocks
      onMoveRow={() => {}}
      {...props}
    />,
  ));
  return container;
}

describe('CourseTable renders', () => {
  it('draws a row without throwing', () => {
    const el = renderTable();
    expect(el.textContent).toContain('ENGL 2010');
    expect(el.textContent).toContain('Intermediate Writing');
    expect(el.textContent).toContain('2016 SPRING');
  });

  // The exact cell the shadowing bug blew up on: the grade pill's colour class
  // comes from gradeBand(c.grade), which was the call that stopped being a
  // function.
  it('colour-codes the actual grade, which is what the crash broke', () => {
    const el = renderTable();
    const pill = el.querySelector('.tt-g-B');
    expect(pill).not.toBeNull();
    expect(pill.textContent).toBe('B+');
  });

  it('colour-codes the what-if select and every option in it', () => {
    const el = renderTable();
    const select = el.querySelector('select.tt-sel');
    expect(select.className).toContain('tt-g-B');
    // 12 grades, no reset option until the row is actually changed.
    expect(select.querySelectorAll('option')).toHaveLength(12);
    expect(select.querySelector('option.tt-g-A')).not.toBeNull();
  });

  it('offers the reset option only once a row has been changed', () => {
    const c = course();
    const el = renderTable({ rows: [c], overrides: { [c.id]: 'A' }, changedCount: 1 });
    const opts = [...el.querySelectorAll('select.tt-sel option')].map((o) => o.textContent);
    expect(opts).toHaveLength(13);
    expect(opts[0]).toMatch(/reset to B\+/i);
  });

  it('renders every column of every row for a mixed table', () => {
    const rows = [
      course(),
      course({ id: 'x', code: 'MATH 1050', grade: 'E', credits: 4, repeatFlag: 'E' }),
      course({ id: 'p', code: 'NEW 1000', grade: 'A', isExtra: true, semester: 'Prospective' }),
    ];
    const el = renderTable({ rows, overrides: { x: 'C' }, changedCount: 1 });
    expect(el.querySelectorAll('tbody tr').length).toBeGreaterThanOrEqual(3);
    expect(el.textContent).toContain('MATH 1050');
    expect(el.textContent).toContain('NEW 1000');
  });

  it('handles an empty table', () => {
    const el = renderTable({ rows: [] });
    expect(el.textContent).toContain('No courses match these filters.');
  });

  it('draws the credit-block rule once the changed rows fill a block', () => {
    const rows = [
      course({ id: 'a', code: 'A 1000', credits: 12 }),
      course({ id: 'b', code: 'B 1000' }),
    ];
    const el = renderTable({ rows, overrides: { a: 'A' }, changedCount: 1 });
    expect(el.querySelector('.tt-break')).not.toBeNull();
    expect(el.textContent).toMatch(/Retake 1/);
    expect(el.textContent).toMatch(/untouched below/i);
  });

  it('marks prospective rows so they are visually distinct', () => {
    const rows = [course({ id: 'p', isExtra: true })];
    const el = renderTable({ rows });
    expect(el.querySelector('.tt-row-extra')).not.toBeNull();
  });

  it('gives orderable rows a drag grip and plain rows none', () => {
    const rows = [course({ id: 'a' }), course({ id: 'b', code: 'B 1000' })];
    const el = renderTable({ rows, overrides: { a: 'A' }, changedCount: 1 });
    expect(el.querySelectorAll('.tt-grip')).toHaveLength(1);
  });
});

import { describe, it, expect } from 'vitest';
import {
  buildCoursework, fromSnapshot, kindOf, leadDays, courseFromSummary, stripCourseTag,
  canvasAssignmentId, enrich, minutesOf, addDaysISO, daysBetween,
} from './courseworkModel.js';
import REAL_SNAPSHOT from '../data/canvasSchedule.json';
import { COURSEWORK_PATCHES } from '../data/manualCoursework.js';

const SNAP = {
  generatedAt: '2026-09-18T18:39:15.062Z',
  courses: {
    'CHEM 1210': {
      code: 'CHEM 1210',
      schedule: [
        { id: 1, kind: 'quiz', name: 'Quiz 13, Sec 4-5', due: '2026-10-05', dueTime: '12:30 PM', points: 8, status: 'todo', url: 'https://uvu.instructure.com/courses/640153/assignments/1' },
        { id: 2, kind: 'quiz', name: 'Quiz 14, Sec 4-6', due: '2026-10-07', dueTime: '12:30 PM', points: 8, status: 'todo', url: 'https://uvu.instructure.com/courses/640153/assignments/2' },
        { id: 3, kind: 'quiz', name: 'Quiz 5, Sec 2-1 to 2-3', due: '2026-09-08', dueTime: '12:30 PM', points: 8, status: 'missing' },
        { id: 4, kind: 'assignment', name: 'Exam 2', due: null, points: 125, status: 'todo' },
        { id: 5, kind: 'assignment', name: 'Attendance', due: null, points: 100, status: 'todo', score: 100 },
        { id: 6, kind: 'assignment', name: 'Exam 1', due: null, points: 100, status: 'todo', score: 76 },
        { id: 7, kind: 'quiz', name: 'Quiz 15, Sec 5-1 to 5-2', due: '2026-10-14', dueTime: '2:30 PM', points: 6, status: 'todo' },
      ],
    },
    'MICR 2060': {
      code: 'MICR 2060',
      schedule: [
        { id: 10, kind: 'quiz', name: 'Take Exam 2 on MMAHP Ch  6-8 or Equivalent ', due: '2026-10-14', dueTime: '11:59 PM', points: 135.84, unlock: '2026-10-11', status: 'todo' },
      ],
    },
  },
};

const TODAY = '2026-10-06';

describe('classification', () => {
  it('reads exams out of titles, whatever Canvas called them', () => {
    expect(kindOf('Exam 2', 'assignment')).toBe('exam');
    expect(kindOf('Take Exam 2 on MMAHP Ch 6-8', 'quiz')).toBe('exam');
    expect(kindOf('Final Exam', 'assignment')).toBe('exam');
    expect(kindOf('Module 6 Case Study', 'assignment')).toBe('assignment');
    expect(kindOf('Take OLQ 7', null)).toBe('quiz');
  });

  it('treats undated grade totals as buckets, not tasks', () => {
    const items = fromSnapshot(SNAP);
    expect(items.find((i) => i.name === 'Attendance').kind).toBe('bucket');
    expect(items.find((i) => i.name === 'Exam 2').kind).toBe('exam');
  });

  it('counts a scored "todo" as graded (Exam 1 came back that way)', () => {
    expect(fromSnapshot(SNAP).find((i) => i.name === 'Exam 1').status).toBe('graded');
  });

  it('scales lead time with stakes', () => {
    expect(leadDays({ kind: 'quiz', points: 8 })).toBe(1);
    expect(leadDays({ kind: 'quiz', points: 20 })).toBe(2);
    expect(leadDays({ kind: 'exam', points: 125 })).toBe(7);
    expect(leadDays({ kind: 'assignment', points: null })).toBe(2);
  });
});

describe('the two bugs the old MFT rail had (2026-10-06)', () => {
  it('a past-due item captured as "todo" stays visible as past-unverified instead of vanishing', () => {
    const cw = buildCoursework({ snapshot: SNAP, todayISO: TODAY });
    const q13 = cw.tasks.find((t) => t.name.startsWith('Quiz 13'));
    expect(q13.state).toBe('past-unverified');
    expect(cw.pastUnverified.map((t) => t.id)).toContain(q13.id);
  });

  it('an exam with no LMS date gets one from a sourced patch, and lands on the calendar', () => {
    const cw = buildCoursework({ snapshot: SNAP, todayISO: TODAY, patches: COURSEWORK_PATCHES });
    const ex2 = cw.tasks.find((t) => t.name === 'Exam 2');
    expect(ex2).toMatchObject({ due: '2026-10-07', kind: 'exam', state: 'upcoming' });
    expect(ex2.patchSource).toMatch(/Trey/);
    expect(cw.byDate['2026-10-07'].map((t) => t.name)).toEqual(['Quiz 14, Sec 4-6', 'Exam 2']);
  });
});

describe('states, windows and priority', () => {
  const cw = buildCoursework({ snapshot: SNAP, todayISO: TODAY, patches: COURSEWORK_PATCHES });

  it('keeps Canvas "missing" distinct from unverified', () => {
    expect(cw.missing.map((t) => t.name)).toEqual(['Quiz 5, Sec 2-1 to 2-3']);
  });

  it('never tells him to start locked WORK before it opens', () => {
    const it2 = enrich({ id: 'a', code: 'MICR 2060', kind: 'assignment', points: 40, due: '2026-10-14', opens: '2026-10-12', status: 'todo' }, TODAY);
    expect(it2.startBy).toBe('2026-10-12'); // 4-day lead says 10-10, but it is locked until 10-12
    expect(it2.inWindow).toBe(false);
  });

  it('but study for a locked EXAM starts on schedule (opens = when it can be taken)', () => {
    const ex = cw.tasks.find((t) => t.code === 'MICR 2060');
    expect(ex.opens).toBe('2026-10-11');
    expect(ex.startBy).toBe('2026-10-07');
    expect(ex.opensLater).toBe(true);
    expect(enrich(ex, '2026-10-07').inWindow).toBe(true);
  });

  it('keeps far-off exams out of "do next"', () => {
    const far = buildCoursework({ snapshot: SNAP, todayISO: TODAY, patches: COURSEWORK_PATCHES });
    expect(far.doNext(10).map((t) => t.name)).not.toContain('Final Exam');
  });

  it('puts a tomorrow quiz in the window and ranks the exam first', () => {
    const q14 = cw.tasks.find((t) => t.name.startsWith('Quiz 14'));
    expect(q14.inWindow).toBe(true);
    expect(cw.doNext(1)[0].name).toBe('Exam 2');
  });

  it('a check-off beats the LMS status in both directions', () => {
    const done = { 'canvas:2': { v: true, t: 1 }, 'canvas:6': { v: false, t: 2 } };
    const cw2 = buildCoursework({ snapshot: SNAP, todayISO: TODAY, done });
    expect(cw2.tasks.find((t) => t.id === 'canvas:2').state).toBe('done');
    expect(cw2.tasks.find((t) => t.id === 'canvas:6').state).toBe('undated');
  });

  it('computes % of grade against a course total', () => {
    const it = enrich({ id: 'x', code: 'CHEM 1210', kind: 'exam', points: 125, due: '2026-10-07', status: 'todo' }, TODAY, {}, { 'CHEM 1210': 1100 });
    expect(it.pctOfGrade).toBeCloseTo(11.36, 1);
  });
});

describe('Canvas feed merge', () => {
  const ids = { 640153: 'CHEM 1210' };
  it('parses the course tag and the assignment id', () => {
    expect(courseFromSummary('Quiz 14, Sec 4-6 [CHEM-1210-004 Fall 2026]')).toBe('CHEM 1210');
    expect(courseFromSummary('Discussion 2 [ESMG-3200-X01 Fall 2026]')).toBe('ESMG 3200');
    expect(stripCourseTag('Quiz 14, Sec 4-6 [CHEM-1210-004 Fall 2026]')).toBe('Quiz 14, Sec 4-6');
    expect(canvasAssignmentId({ uid: 'event-assignment-9205020' })).toBe('9205020');
    expect(canvasAssignmentId({ uid: 'x', url: 'https://u/courses/1/assignments/77' })).toBe('77');
    expect(ids[640153]).toBe('CHEM 1210');
  });

  it('refreshes a snapshot due date by assignment id, keeping status and points', () => {
    const feed = { events: [{ uid: 'event-assignment-2', summary: 'Quiz 14, Sec 4-6 [CHEM-1210-004 Fall 2026]', start: { date: '2026-10-08', time: '12:30 PM', at: 'x' } }] };
    const cw = buildCoursework({ snapshot: SNAP, canvasFeeds: [feed], todayISO: TODAY });
    const q14 = cw.tasks.find((t) => t.id === 'canvas:2');
    expect(q14).toMatchObject({ due: '2026-10-08', points: 8, status: 'todo' });
    expect(q14.sources).toEqual(['snapshot', 'canvas-feed']);
  });

  it('adds a course the snapshot never saw (ESMG via the feed)', () => {
    const feed = { events: [{ uid: 'event-assignment-555', summary: 'Module 3 Quiz [ESMG-3200-X01 Fall 2026]', url: 'https://uvu.instructure.com/courses/999/assignments/555', start: { date: '2026-10-09', time: '11:59 PM', at: 'x' } }] };
    const cw = buildCoursework({ snapshot: SNAP, canvasFeeds: [feed], todayISO: TODAY });
    expect(cw.tasks.find((t) => t.id === 'canvas:555')).toMatchObject({ code: 'ESMG 3200', kind: 'quiz', state: 'upcoming' });
    expect(cw.courses).toContain('ESMG 3200');
  });

  it('keeps non-assignment calendar events out of the task list', () => {
    const feed = { events: [{ uid: 'event-calendar-event-9', summary: 'Lab safety walk-through [MICR-2065-211 Fall 2026]', start: { date: '2026-10-09', time: null, at: null } }] };
    const cw = buildCoursework({ snapshot: SNAP, canvasFeeds: [feed], todayISO: TODAY });
    expect(cw.items.find((t) => t.id === 'canvas-ev:event-calendar-event-9').kind).toBe('event');
    expect(cw.tasks.find((t) => t.id === 'canvas-ev:event-calendar-event-9')).toBeUndefined();
  });
});

describe('Learning Suite feed', () => {
  it('files every entry under the course the feed was registered for', () => {
    const feed = { id: 'f1', course: 'AERO 2100', events: [{ uid: 'a', summary: 'Reading Quiz 4', start: { date: '2026-10-15', time: null, at: null } }] };
    const cw = buildCoursework({ snapshot: { courses: {} }, lsFeeds: [feed], todayISO: TODAY });
    expect(cw.tasks[0]).toMatchObject({ id: 'ls:f1:a', code: 'AERO 2100', kind: 'quiz', lms: 'learningsuite' });
  });
});

describe('date helpers', () => {
  it('sorts timed before untimed, and handles DST-free day math', () => {
    expect(minutesOf('12:30 PM')).toBe(750);
    expect(minutesOf('12:05 AM')).toBe(5);
    expect(minutesOf(null)).toBe(1440);
    expect(addDaysISO('2026-10-31', 2)).toBe('2026-11-02');
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
  });
});

describe('the real snapshot', () => {
  it('builds without throwing and every task has a course and a name', () => {
    const cw = buildCoursework({ snapshot: REAL_SNAPSHOT, todayISO: TODAY, patches: COURSEWORK_PATCHES });
    expect(cw.tasks.length).toBeGreaterThan(80);
    for (const t of cw.tasks) {
      expect(t.code).toBeTruthy();
      expect(t.name).toBeTruthy();
    }
    expect(cw.tasks.find((t) => t.code === 'CHEM 1210' && t.name === 'Exam 2').due).toBe('2026-10-07');
  });
});

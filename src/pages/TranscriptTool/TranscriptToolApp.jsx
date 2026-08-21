import { useState, useMemo, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import HubLink from '../../components/HubLink';
import DocsView from './DocsView';
import bundled from './transcript.data.json';
import { parseTranscript } from './parseTranscript';
import { gpaOf, impactOf, creditsToReach, isCounted, gradeOf, fmtGpa, GRADES, SCALES } from './gpa';
import { loadScenario, saveScenario, cleanView } from './transcriptStorage';
import CourseTable from './CourseTable';
import SidePanel from './SidePanel';
import ProspectiveModal from './ProspectiveModal';
import Boundary from '../../components/errors/Boundary';
import { COLUMNS, NO_FILTERS } from './columns';
import { clampCreditBlock, bandOf, BAND_PLAIN, BAND_RETAKE, BAND_PROSPECTIVE } from './creditBlocks';
import { manualRank, moveWithin, pruneOrder, hasManualOrder, manualCount, EMPTY_ORDER } from './rowOrder';
import './TranscriptTool.css';

// Reading order of the letter grades, worst last — so a bigger rank is a worse
// grade, and "sort descending" on a grade column means worst-first.
const GRADE_RANK = Object.fromEntries(GRADES.map((g, i) => [g, i]));

function encodeScenario(s) {
  try {
    const json = JSON.stringify({ o: s.overrides, e: s.extras, sc: s.scale, hr: s.honorRepeats, v: s.view });
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch { return ''; }
}

function decodeScenario(hash) {
  try {
    const b64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
    const d = JSON.parse(json);
    return {
      overrides: d.o && typeof d.o === 'object' ? d.o : {},
      extras: Array.isArray(d.e) ? d.e : [],
      scale: SCALES[d.sc] ? d.sc : 'uvu',
      honorRepeats: d.hr !== false,
      view: cleanView(d.v),
    };
  } catch { return null; }
}

export default function TranscriptToolApp() {
  // The bundled JSON is the committed output of `npm run tt:parse`. Pasting a
  // new transcript swaps it out through the very same pure parser.
  const [data, setData] = useState(bundled);
  const [scenario, setScenario] = useState(() => {
    const fromUrl = window.location.hash.startsWith('#s=') && decodeScenario(window.location.hash.slice(3));
    return fromUrl ? { ...loadScenario(), ...fromUrl } : loadScenario();
  });

  const [prosOpen, setProsOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteErr, setPasteErr] = useState(null);
  const [toast, setToast] = useState(null);

  const { overrides, extras, scale, honorRepeats, goal, view } = scenario;
  // Sorts and filters live in the saved scenario, not in component state, so
  // they survive closing the tab. `view` is validated on load — see
  // cleanView() — so a stale sort key can never render an unexplained empty
  // table. Review mode: worst grades first, but every course you've actually
  // touched pinned above them, since a grade raised to an A would otherwise
  // sink to the bottom of a worst-first list.
  const { sort, filters, chip, changedFirst, hideSuperseded, creditBlock, showBlocks, order } = view;

  useEffect(() => { saveScenario(scenario); }, [scenario]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const patch = useCallback((p) => setScenario((s) => ({ ...s, ...p })), []);
  const setView = useCallback((p) => setScenario((s) => ({ ...s, view: { ...s.view, ...p } })), []);

  const setOverride = useCallback((id, grade) => {
    setScenario((s) => {
      const next = { ...s.overrides };
      if (!grade) delete next[id];
      else next[id] = grade;
      return { ...s, overrides: next };
    });
  }, []);

  const courses = data.courses;
  const opts = useMemo(() => ({ scale, honorRepeats }), [scale, honorRepeats]);
  const whatIfCourses = useMemo(() => [...courses, ...extras], [courses, extras]);

  // Both numbers come out of the same function; "actual" is simply the run
  // with no overrides and no hypothetical courses, so the two can never drift.
  const actual = useMemo(() => gpaOf(courses, opts), [courses, opts]);
  const whatIf = useMemo(() => gpaOf(whatIfCourses, { ...opts, overrides }), [whatIfCourses, opts, overrides]);

  // Impact is measured against the CURRENT scenario, so it answers "what is
  // still left to gain from here", not "what would it have been at the start".
  const impacts = useMemo(() => {
    const map = {};
    for (const c of whatIfCourses) map[c.id] = impactOf(whatIfCourses, c, { ...opts, overrides });
    return map;
  }, [whatIfCourses, opts, overrides]);

  const changeCount = Object.keys(overrides).length + extras.length;
  const delta = whatIf.gpa - actual.gpa;

  // Credit hours riding on the what-if. Re-graded and planned hours are
  // counted separately because they behave differently: re-grading moves
  // points over a fixed denominator, while a planned course grows the
  // denominator too. An override on an excluded attempt is skipped — it
  // changes nothing, so it should not inflate the total.
  const estimated = useMemo(() => {
    const regraded = courses
      .filter((c) => overrides[c.id] && isCounted(c, honorRepeats))
      .reduce((s, c) => s + c.credits, 0);
    const planned = extras.reduce((s, e) => s + (Number(e.credits) || 0), 0);
    return { regraded, planned, total: regraded + planned };
  }, [courses, overrides, honorRepeats, extras]);

  const estimatedPct = whatIf.gpaHours > 0
    ? Math.round((estimated.total / whatIf.gpaHours) * 100)
    : 0;

  // Everything the column headers need to sort on, resolved once per row so
  // the comparator stays a plain value compare.
  const keyOf = useCallback((c, key) => {
    switch (key) {
      case 'term': return c.termOrder;
      case 'code': return c.code;
      case 'title': return c.course.toLowerCase();
      case 'credits': return c.credits;
      case 'actual': return GRADE_RANK[c.grade] ?? 99;
      case 'whatif': return GRADE_RANK[gradeOf(c, overrides)] ?? 99;
      case 'points': return isCounted(c, honorRepeats) ? SCALES[scale].points[gradeOf(c, overrides)] * c.credits : -1;
      default: return impacts[c.id] || 0;
    }
  }, [overrides, honorRepeats, scale, impacts]);

  // The saved order with anything no longer in that section dropped. Derived
  // rather than pruned on write, so undoing a re-grade forgets that row's
  // manual position the instant it leaves the section — put the course back
  // and it returns unranked, at the bottom, which is the documented way to
  // reset one row without clearing the whole order.
  const liveOrder = useMemo(() => {
    const byBand = { [BAND_RETAKE]: new Set(), [BAND_PROSPECTIVE]: new Set() };
    for (const c of whatIfCourses) {
      const set = byBand[bandOf(c, overrides)];
      if (set) set.add(c.id);
    }
    return pruneOrder(order, byBand);
  }, [whatIfCourses, overrides, order]);

  // Which of the three stacked sections a row belongs to: re-graded courses,
  // then prospective classes, then the transcript as printed.
  //
  // Prospective classes pin to their own band unconditionally, review mode or
  // not — they have no real position among the actual courses to sort into, so
  // scattering them through the table would be worse than grouping them. The
  // re-graded band only floats when review mode asks for it, which is why a
  // scenario with no prospective classes orders exactly as it always did.
  const bandRank = useCallback((c) => {
    if (c.isExtra) return 1;
    return changedFirst && overrides[c.id] ? 0 : 2;
  }, [overrides, changedFirst]);

  const rows = useMemo(() => {
    const matches = (c) => {
      const g = gradeOf(c, overrides);

      // "Hide superseded" drops the old attempts of a retaken course. Keyed off
      // isCounted, not the raw flag, so that unticking "honour repeat
      // exclusions" — which makes those attempts count again — stops hiding
      // rows that are contributing to the GPA.
      if (hideSuperseded && !isCounted(c, honorRepeats)) return false;

      if (filters.term && c.semester !== filters.term) return false;
      if (filters.code && !c.code.toLowerCase().includes(filters.code.toLowerCase())) return false;
      if (filters.title && !c.course.toLowerCase().includes(filters.title.toLowerCase())) return false;
      if (filters.credits && c.credits !== Number(filters.credits)) return false;

      for (const [key, value] of [['actual', c.grade], ['whatif', g]]) {
        const f = filters[key];
        if (!f) continue;
        if (f.startsWith('band:')) { if (value.charAt(0) !== f.slice(5)) return false; }
        else if (value !== f) return false;
      }

      if (filters.impact) {
        const i = impacts[c.id] || 0;
        if (filters.impact === 'gain' && i <= 0.0005) return false;
        if (filters.impact === 'big' && i < 0.01) return false;
        if (filters.impact === 'none' && i > 0.0005) return false;
      }

      if (chip === 'belowB') return GRADE_RANK[g] > GRADE_RANK['B'];
      if (chip === 'failing') return g === 'E';
      if (chip === 'repeats') return !!c.repeatFlag;
      if (chip === 'changed') return !!overrides[c.id] || c.isExtra;
      return true;
    };

    const mul = sort.dir === 'asc' ? 1 : -1;
    return whatIfCourses.filter(matches).sort((a, b) => {
      const ba = bandRank(a);
      const bb = bandRank(b);
      if (ba !== bb) return ba - bb;
      // A row you dragged outranks the column sort — it is the one ordering
      // the tool cannot work out for itself. Rows with no manual position have
      // rank Infinity and fall through to the sort below, so they collect at
      // the bottom of their own section rather than jumping into the middle.
      if (ba !== 2) {
        const band = bandOf(a, overrides);
        const ma = manualRank(liveOrder, band, a.id);
        const mb = manualRank(liveOrder, band, b.id);
        if (ma !== mb) return ma - mb;
      }

      const x = keyOf(a, sort.key);
      const y = keyOf(b, sort.key);
      if (x < y) return -1 * mul;
      if (x > y) return 1 * mul;
      // Stable, readable tiebreak: chronological, then by course code.
      return (a.termOrder - b.termOrder) || a.code.localeCompare(b.code);
    });
  }, [whatIfCourses, filters, chip, sort, keyOf, impacts, overrides, bandRank, liveOrder, hideSuperseded, honorRepeats]);

  // Dropping a row rewrites its whole band from what is on screen, so a single
  // drag also fixes the position of every row that had no manual place yet.
  // Only rows visible in this band take part — a filtered-out course keeps the
  // position it already had rather than being silently reshuffled.
  const moveRow = useCallback((dragId, overId, after) => {
    const row = rows.find((c) => c.id === dragId);
    const target = rows.find((c) => c.id === overId);
    if (!row || !target) return;
    const band = bandOf(row, overrides);
    if (band === BAND_PLAIN || band !== bandOf(target, overrides)) return;

    const visible = rows.filter((c) => bandOf(c, overrides) === band).map((c) => c.id);
    const next = moveWithin(visible, dragId, overId, after);
    const kept = (liveOrder[band] ?? []).filter((id) => !next.includes(id));
    setView({ order: { ...liveOrder, [band]: [...next, ...kept] } });
  }, [rows, overrides, liveOrder, setView]);

  const supersededCount = useMemo(
    () => courses.filter((c) => !isCounted(c, honorRepeats)).length,
    [courses, honorRepeats],
  );

  const activeFilters = COLUMNS.filter((c) => filters[c.key]).length
    + (chip ? 1 : 0) + (hideSuperseded ? 1 : 0) + (changedFirst ? 1 : 0);

  const topWin = useMemo(() => {
    const counted = whatIfCourses.filter((c) => isCounted(c, honorRepeats) && gradeOf(c, overrides) !== 'A');
    if (!counted.length) return null;
    return counted.reduce((best, c) => (impacts[c.id] > impacts[best.id] ? c : best), counted[0]);
  }, [whatIfCourses, impacts, honorRepeats, overrides]);

  const termRows = useMemo(() => data.terms.map((t) => {
    const inTerm = courses.filter((c) => c.semester === t.semester);
    return {
      ...t,
      actual: gpaOf(inTerm, opts),
      whatIf: gpaOf(inTerm, { ...opts, overrides }),
    };
  }), [data.terms, courses, opts, overrides]);

  const solver = useMemo(
    () => creditsToReach(whatIfCourses, Number(goal) || 0, { ...opts, overrides, targetGrade: 'A' }),
    [whatIfCourses, goal, opts, overrides],
  );

  const semesterOptions = useMemo(() => {
    const seen = [...new Set(whatIfCourses.map((c) => c.semester).filter(Boolean))];
    return seen.sort((a, b) => {
      const oa = whatIfCourses.find((c) => c.semester === a).termOrder;
      const ob = whatIfCourses.find((c) => c.semester === b).termOrder;
      return oa - ob;
    });
  }, [whatIfCourses]);

  const creditOptions = useMemo(
    () => [...new Set(whatIfCourses.map((c) => c.credits))].sort((a, b) => a - b),
    [whatIfCourses],
  );

  // First click sorts by the column's own useful direction (worst grade first,
  // biggest impact first, oldest semester first); clicking the same column
  // again flips it.
  function toggleSort(key) {
    setScenario((s) => {
      const cur = s.view.sort;
      const next = cur.key === key
        ? { key, dir: cur.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: COLUMNS.find((c) => c.key === key).dir };
      return { ...s, view: { ...s.view, sort: next } };
    });
  }

  function setFilter(key, value) {
    setScenario((s) => ({ ...s, view: { ...s.view, filters: { ...s.view.filters, [key]: value } } }));
  }

  function clearFilters() {
    setView({ filters: NO_FILTERS, chip: null, hideSuperseded: false, changedFirst: false });
  }

  // Turning review mode on also sets the ordering it implies — worst what-if
  // grade first — so it is one click rather than "toggle this, then also
  // remember to sort that column".
  function toggleChangedFirst() {
    setScenario((s) => ({
      ...s,
      view: {
        ...s.view,
        changedFirst: !s.view.changedFirst,
        sort: s.view.changedFirst ? s.view.sort : { key: 'whatif', dir: 'desc' },
      },
    }));
  }

  function bulkSet(predicate, grade) {
    const next = { ...overrides };
    let n = 0;
    for (const c of courses) {
      if (!isCounted(c, honorRepeats)) continue;
      if (!predicate(gradeOf(c, overrides))) continue;
      next[c.id] = grade;
      n++;
    }
    patch({ overrides: next });
    setToast(n ? `${n} course${n === 1 ? '' : 's'} set to ${grade}` : 'Nothing matched');
  }

  function resetAll() {
    setScenario((s) => ({ ...s, overrides: {}, extras: [] }));
    setToast('Reset to actual grades');
  }

  function applyPaste() {
    const result = parseTranscript(pasteText);
    if (!result.courses.length) {
      setPasteErr('No course rows recognised. Paste the text of a UVU transcript (SUBJ NO. TITLE CRED GRD PTS).');
      return;
    }
    setData(result);
    // Filters are cleared too: a saved semester filter like "2016 SPRING" will
    // not exist in someone else's transcript, and the result would be an empty
    // table with no obvious cause.
    setScenario((s) => ({
      ...s,
      overrides: {},
      extras: [],
      view: { ...s.view, filters: NO_FILTERS, chip: null },
    }));
    setPasteOpen(false);
    setPasteErr(null);
    setToast(`Loaded ${result.courses.length} courses across ${result.terms.length} terms`);
  }

  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}#s=${encodeScenario(scenario)}`;
    window.history.replaceState(null, '', `#s=${encodeScenario(scenario)}`);
    navigator.clipboard?.writeText(url).then(
      () => setToast('Scenario link copied'),
      () => setToast('Link is in the address bar'),
    );
  }

  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportCsv() {
    const head = ['Semester', 'Code', 'Course', 'Credits', 'Actual', 'WhatIf', 'Counted', 'Repeat'];
    const lines = whatIfCourses.map((c) => [
      c.semester, c.code, `"${c.course.replace(/"/g, '""')}"`, c.credits,
      c.grade, gradeOf(c, overrides), isCounted(c, honorRepeats) ? 'yes' : 'no', c.repeatFlag || '',
    ].join(','));
    download('gpa-whatif.csv', [head.join(','), ...lines].join('\n'), 'text/csv');
  }

  const printedTotal = data.totals?.institution;
  const matchesPrinted = printedTotal && fmtGpa(actual.gpa) === printedTotal.gpa.toFixed(2)
    && actual.gpaHours === printedTotal.gpaHours;

  return (
    <div className="tt-app">
      <header className="tt-bar">
        <HubLink className="tt-site-home" />
        <div className="tt-brand">
          <h1>GPA Calculator</h1>
          <span className="tt-brand-sub">Utah Valley University · {courses.length} courses</span>
        </div>

        <nav className="tt-tabs">
          <NavLink to="/TT" end className={({ isActive }) => `tt-tab${isActive ? ' active' : ''}`}>Calculator</NavLink>
          <NavLink to="/TT/documents" className={({ isActive }) => `tt-tab${isActive ? ' active' : ''}`}>Documents</NavLink>
        </nav>

        <div className="tt-readout">
          <div className="tt-read tt-read-actual">
            <span className="tt-read-label">Actual</span>
            <span className="tt-read-value">{fmtGpa(actual.gpa)}</span>
            <span className="tt-read-foot">{actual.gpaHours} GPA hrs</span>
          </div>
          <span className={`tt-read-arrow${delta > 0.0005 ? ' up' : delta < -0.0005 ? ' down' : ''}`}>→</span>
          <div className={`tt-read tt-read-whatif${changeCount ? ' active' : ''}`}>
            <span className="tt-read-label">What-if</span>
            <span className="tt-read-value">{fmtGpa(whatIf.gpa)}</span>
            <span className="tt-read-foot">
              {changeCount
                ? `${delta >= 0 ? '+' : ''}${delta.toFixed(3)} · ${changeCount} change${changeCount === 1 ? '' : 's'}`
                : 'no changes yet'}
            </span>
          </div>

          <div className={`tt-read tt-read-credits${estimated.total ? ' active' : ''}`}>
            <span className="tt-read-label">Estimated</span>
            <span className="tt-read-value">
              {estimated.total.toFixed(estimated.total % 1 ? 1 : 0)}<small>cr</small>
            </span>
            <span className="tt-read-foot">
              {estimated.total
                ? `${estimatedPct}% of ${whatIf.gpaHours} hrs${estimated.planned ? ` · ${estimated.planned} planned` : ''}`
                : 'nothing changed'}
            </span>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="documents" element={<DocsView />} />
        <Route index element={<>
      {!matchesPrinted && printedTotal && (
        <div className="tt-warn">
          ⚠ Computed actual GPA ({fmtGpa(actual.gpa)} over {actual.gpaHours} hrs) does not match the
          transcript's printed {printedTotal.gpa.toFixed(2)} over {printedTotal.gpaHours} hrs. Check the
          repeat rule and grade scale below.
        </div>
      )}
      {data.unparsed?.length > 0 && (
        <div className="tt-warn">
          ⚠ {data.unparsed.length} line{data.unparsed.length === 1 ? '' : 's'} could not be read and
          {data.unparsed.length === 1 ? ' is' : ' are'} not counted:{' '}
          {data.unparsed.slice(0, 3).map((u) => u.text).join(' · ')}
          {data.unparsed.length > 3 ? ' …' : ''}
        </div>
      )}

      <div className="tt-controls">
        <div className="tt-ctl-row">
          <span className="tt-ctl-label">Quick</span>
          <div className="tt-chips">
            {[
              ['belowB', 'Below B'],
              ['failing', 'Failing'],
              ['repeats', 'Repeats'],
              ['changed', 'Changed'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`tt-chip${chip === id ? ' on' : ''}`}
                onClick={() => setView({ chip: chip === id ? null : id })}
              >{label}</button>
            ))}
          </div>

          <button
            type="button"
            className={`tt-chip${hideSuperseded ? ' on' : ''}`}
            onClick={() => setView({ hideSuperseded: !hideSuperseded })}
            disabled={!supersededCount}
            title="Hide the old attempts of courses you retook — the superseded rows that contribute nothing to the GPA"
          >Hide retaken{supersededCount ? ` (${supersededCount})` : ''}</button>

          <button
            type="button"
            className="tt-btn"
            onClick={clearFilters}
            disabled={!activeFilters}
          >Clear filters{activeFilters ? ` (${activeFilters})` : ''}</button>

          <div className="tt-ctl-spacer" />

          <div className="tt-bulk">
            <button type="button" className="tt-btn" onClick={() => bulkSet((g) => g === 'E', 'C')}>Failing → C</button>
            <button type="button" className="tt-btn" onClick={() => bulkSet((g) => GRADE_RANK[g] > GRADE_RANK['B'], 'B')}>Below B → B</button>
            <button type="button" className="tt-btn tt-btn-warn" onClick={resetAll} disabled={!changeCount}>Reset all</button>
          </div>
        </div>
      </div>

      <main className="tt-main">
        <SidePanel
          actual={actual}
          whatIf={whatIf}
          termRows={termRows}
          courses={whatIfCourses}
          overrides={overrides}
          honorRepeats={honorRepeats}
          scale={scale}
          goal={goal}
          solver={solver}
          extras={extras}
          onScale={(v) => patch({ scale: v })}
          onHonorRepeats={(v) => patch({ honorRepeats: v })}
          onGoal={(v) => patch({ goal: v })}
          onOpenProspective={() => setProsOpen(true)}
          onRemoveExtra={(id) => patch({ extras: extras.filter((e) => e.id !== id) })}
          onCopyLink={copyLink}
          onExportCsv={exportCsv}
          onExportJson={() => download('gpa-whatif.json', JSON.stringify({ actual, whatIf, overrides, extras, scale, honorRepeats }, null, 2), 'application/json')}
          onOpenPaste={() => setPasteOpen(true)}
        />

        <section className="tt-tablewrap">
          <div className="tt-tablehead">
            {/* Filters now survive a reload, so the fact that a view is
                filtered has to be visible on arrival — otherwise you come back
                to 12 of 64 rows and read it as the whole transcript. */}
            <span className={activeFilters ? 'tt-count tt-count-filtered' : 'tt-count'}>
              {activeFilters ? '⚑ ' : ''}{rows.length} of {whatIfCourses.length} courses
              {activeFilters ? ` · ${activeFilters} filter${activeFilters === 1 ? '' : 's'} on` : ''}
            </span>
            <button type="button" className="tt-chip tt-chip-sm tt-chip-pros" onClick={() => setProsOpen(true)}>
              + Prospective class{extras.length ? ` (${extras.length})` : ''}
            </button>

            {hasManualOrder(liveOrder) && (
              <button
                type="button"
                className="tt-chip tt-chip-sm on"
                onClick={() => { setView({ order: EMPTY_ORDER }); setToast('Back to the column sort'); }}
                title="Drop the order you dragged and go back to sorting by the column headers"
              >⇅ manual order ({manualCount(liveOrder)}) — clear</button>
            )}

            {/* Free entry, not a preset list — a block is whatever a term
                looks like for you, and 12 is only the common answer. */}
            <span className="tt-blocks">
              <button
                type="button"
                className={`tt-chip tt-chip-sm${showBlocks ? ' on' : ''}`}
                onClick={() => setView({ showBlocks: !showBlocks })}
                aria-pressed={showBlocks}
                title="Rule off the courses you have changed into credit-sized blocks"
              >Credit breaks</button>
              <label className={`tt-blocks-lbl${showBlocks ? '' : ' off'}`}>
                every
                <input
                  type="number"
                  className="tt-blocks-in"
                  min="0.5"
                  max="99"
                  step="0.5"
                  value={creditBlock}
                  disabled={!showBlocks}
                  onChange={(e) => setView({ creditBlock: e.target.value })}
                  onBlur={(e) => setView({ creditBlock: clampCreditBlock(e.target.value) })}
                  aria-label="Credits per block"
                />
                cr
              </label>
            </span>
            {topWin && (
              <span className="tt-topwin">
                Biggest single win: <strong>{topWin.code}</strong> ({topWin.credits} cr,
                {' '}{gradeOf(topWin, overrides)}) → A is{' '}
                <strong>+{impacts[topWin.id].toFixed(3)}</strong>
              </span>
            )}
          </div>
          {/* Wrapped after the 2026-08-20 crash: a shadowed `band` binding
              made a helper unreachable and took the whole site down. The
              readouts, the side panel and the nav are all still useful when
              the table itself cannot render. */}
          <Boundary title="The course table stopped working." resetId={`${rows.length}-${changeCount}`}>
          <CourseTable
            rows={rows}
            overrides={overrides}
            impacts={impacts}
            scale={scale}
            honorRepeats={honorRepeats}
            onGrade={setOverride}
            onRemoveExtra={(id) => patch({ extras: extras.filter((e) => e.id !== id) })}
            sort={sort}
            onSort={toggleSort}
            filters={filters}
            onFilter={setFilter}
            semesters={semesterOptions}
            creditValues={creditOptions}
            changedFirst={changedFirst}
            onChangedFirst={toggleChangedFirst}
            changedCount={changeCount}
            creditBlock={Number(creditBlock) || 0}
            showBlocks={showBlocks}
            onMoveRow={moveRow}
          />
          </Boundary>
        </section>
      </main>
        </>} />
      </Routes>

      {prosOpen && (
        <ProspectiveModal
          onClose={() => setProsOpen(false)}
          onAdd={(c) => {
            patch({ extras: [...extras, c] });
            setToast(`Added ${c.code} — ${c.credits} cr assuming ${c.grade}`);
          }}
        />
      )}

      {pasteOpen && (
        <div className="tt-modal-back" onClick={() => setPasteOpen(false)}>
          <div className="tt-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Load a different transcript</h2>
            <p className="tt-modal-hint">
              Paste the text of a UVU transcript. It is parsed in the browser by the same code that
              built the bundled data — nothing is uploaded, and nothing is saved over the original.
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => { setPasteText(e.target.value); setPasteErr(null); }}
              placeholder={'2020 FALL\nABC 1234 Some Course GE 3.00 B+ 10.20\n…'}
              rows={14}
            />
            {pasteErr && <p className="tt-modal-err">{pasteErr}</p>}
            <div className="tt-modal-actions">
              <button type="button" className="tt-btn" onClick={() => { setData(bundled); setPasteOpen(false); setToast('Restored the original transcript'); }}>
                Restore original
              </button>
              <div className="tt-ctl-spacer" />
              <button type="button" className="tt-btn" onClick={() => setPasteOpen(false)}>Cancel</button>
              <button type="button" className="tt-btn tt-btn-primary" onClick={applyPaste} disabled={!pasteText.trim()}>Parse</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="tt-toast">{toast}</div>}
    </div>
  );
}

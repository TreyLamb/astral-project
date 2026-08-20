import { useState, useEffect, useRef } from 'react';
import { GRADES } from './gpa';

// The gen-ed attribute codes the registrar actually prints, mirroring
// GE_ATTRIBUTES in parseTranscript.js. Offered as a picker because this is a
// closed set defined by the university — unlike credits or the course code,
// there is no sensible value outside the list.
const GE_ATTRIBUTES = [
  'AI', 'AS', 'BB', 'CC', 'EN', 'FA', 'FE', 'FF', 'GE', 'GI', 'GM',
  'HH', 'IH', 'LH', 'PP', 'PS', 'QL', 'SS', 'TC', 'WA',
];

const TERMS = ['SPRING', 'SUMMER', 'FALL'];
const TERM_SEQ = { SPRING: 1, SUMMER: 2, FALL: 3 };

// Matches parseTranscript.js so a prospective class sorts among real ones on
// the Semester column instead of piling up at one end.
export function termOrderOf(year, term) {
  const y = Number(year);
  if (!Number.isFinite(y) || !TERM_SEQ[term]) return 999999;
  return y * 10 + TERM_SEQ[term];
}

const EMPTY = {
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

// A prospective class is a real course record with a grade you have not earned
// yet, so it carries every field parseTranscript.js emits. The one field with
// no counterpart on the transcript is `dated`: a class you have actually
// registered for has a term, and one you are only considering does not.
export default function ProspectiveModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState(null);
  const first = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setForm(EMPTY);
    setErr(null);
    first.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setErr(null);
  };

  function submit(e) {
    e.preventDefault();
    const credits = Number(form.credits);
    if (!Number.isFinite(credits) || credits <= 0) {
      setErr('Credits has to be a number above zero — that is the one field the GPA cannot be computed without.');
      return;
    }

    // Everything else has a usable default. A prospective class with no name
    // is still a real credit commitment, and refusing to add it would make the
    // form harder to use for no gain.
    const subject = form.subject.trim().toUpperCase() || 'NEW';
    const number = form.number.trim().toUpperCase();
    const semester = form.dated && form.year ? `${form.year} ${form.term}` : 'Prospective';

    onAdd({
      id: `extra-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      isExtra: true,
      subject,
      number: number || null,
      code: number ? `${subject} ${number}` : subject,
      course: form.course.trim() || 'Prospective class',
      attribute: form.attribute || null,
      credits,
      grade: form.grade,
      printedPoints: null,
      repeatFlag: null,
      semester,
      year: form.dated ? Number(form.year) || null : null,
      term: form.dated ? form.term : null,
      termOrder: form.dated ? termOrderOf(form.year, form.term) : 999999,
    });
    onClose();
  }

  return (
    <div className="tt-modal-back" onClick={onClose}>
      <form className="tt-modal tt-modal-pros" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Add a prospective class</h2>
        <p className="tt-modal-hint">
          A class you have not taken yet, with the grade you are assuming you will get. It joins the
          what-if column in its own section and never touches your actual GPA.
        </p>

        <div className="tt-form-grid">
          <label className="tt-field tt-f-subject">
            <span>Subject</span>
            <input
              ref={first}
              type="text" value={form.subject} onChange={set('subject')}
              placeholder="ENGL" maxLength={4} autoComplete="off"
            />
          </label>
          <label className="tt-field tt-f-number">
            <span>Number</span>
            <input type="text" value={form.number} onChange={set('number')} placeholder="2010" maxLength={5} autoComplete="off" />
          </label>
          <label className="tt-field tt-f-title">
            <span>Title</span>
            <input type="text" value={form.course} onChange={set('course')} placeholder="Intermediate Writing" autoComplete="off" />
          </label>

          <label className="tt-field tt-f-credits">
            <span>Credits</span>
            <input type="number" min="0.5" step="0.5" value={form.credits} onChange={set('credits')} required />
          </label>
          <label className="tt-field tt-f-grade">
            <span>Assumed grade</span>
            <select className={`tt-g-${form.grade.charAt(0)}`} value={form.grade} onChange={set('grade')}>
              {GRADES.map((g) => (
                <option key={g} value={g} className={`tt-g-${g.charAt(0)}`}>{g === 'E' ? 'E (fail)' : g}</option>
              ))}
            </select>
          </label>
          <label className="tt-field tt-f-attr">
            <span>Gen-ed attribute</span>
            <select value={form.attribute} onChange={set('attribute')}>
              <option value="">None</option>
              {GE_ATTRIBUTES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>

          <label className="tt-check tt-f-dated">
            <input type="checkbox" checked={form.dated} onChange={set('dated')} />
            <span>
              Put it in a term
              <em>Off = undated, and it sorts to the end of the Semester column.</em>
            </span>
          </label>
          <label className="tt-field tt-f-year">
            <span>Year</span>
            <input type="number" min="1990" max="2100" step="1" value={form.year} onChange={set('year')} disabled={!form.dated} />
          </label>
          <label className="tt-field tt-f-term">
            <span>Term</span>
            <select value={form.term} onChange={set('term')} disabled={!form.dated}>
              {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        {err && <p className="tt-modal-err">{err}</p>}

        <div className="tt-modal-actions">
          <div className="tt-ctl-spacer" />
          <button type="button" className="tt-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="tt-btn tt-btn-pros">Add class</button>
        </div>
      </form>
    </div>
  );
}

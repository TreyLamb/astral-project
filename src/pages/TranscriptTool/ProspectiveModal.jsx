import { useState, useEffect, useRef } from 'react';
import { GRADES } from './gpa';
import { GE_ATTRIBUTES, TERMS, EMPTY_PROSPECTIVE, buildProspective } from './prospective';

// A prospective class is a real course record with a grade you have not earned
// yet, so the form carries every field parseTranscript.js emits. The one field
// with no counterpart on the transcript is `dated`: a class you have actually
// registered for has a term, and one you are only considering does not.
//
// The parent mounts this only while it is open, so the form resets on close
// without an effect having to reach in and clear it.
export default function ProspectiveModal({ onClose, onAdd }) {
  const [form, setForm] = useState(EMPTY_PROSPECTIVE);
  const [err, setErr] = useState(null);
  const first = useRef(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setErr(null);
  };

  function submit(e) {
    e.preventDefault();
    const { course, error } = buildProspective(form);
    if (error) { setErr(error); return; }
    onAdd(course);
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

import { useState } from 'react';
import { useTkbData } from './TkbApp';
import { PROFILES } from './tkbPresets';
import './TkbBubbles.css';

const TIERS = ['basic', 'intermediate', 'advanced'];

function computeCoverage(subject, questions) {
  const result = { basic: 0, intermediate: 0, advanced: 0 };
  const subtopics = subject.subtopics ?? [];
  if (subtopics.length === 0) return result;

  TIERS.forEach(tier => {
    let total = 0;
    let sum = 0;
    subtopics.forEach(st => {
      const checklistLen = st.checklist?.[tier]?.length ?? 0;
      if (checklistLen === 0) return;
      const activeCount = questions.filter(
        q => q.subjectId === subject.id
          && q.subtopicId === st.id
          && q.difficulty === tier
          && q.status === 'active'
      ).length;
      sum += Math.min(1, activeCount / checklistLen);
      total += 1;
    });
    result[tier] = total > 0 ? sum / total : 0;
  });

  return result;
}

function daysSince(dateStr) {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function computeStaleness(subject, questions) {
  const subjectQuestions = questions.filter(q => q.subjectId === subject.id);
  const shownDates = subjectQuestions
    .map(q => q.stats?.lastShownAt)
    .filter(Boolean);
  if (shownDates.length === 0) return 31;
  const mostRecent = shownDates.sort().reverse()[0];
  return daysSince(mostRecent);
}

function staleColor(days) {
  if (days <= 3) return 'hsl(140, 45%, 48%)';
  if (days <= 10) return 'hsl(50, 70%, 50%)';
  if (days <= 20) return 'hsl(28, 70%, 50%)';
  return 'hsl(9, 60%, 50%)';
}

export default function TkbBubbles() {
  const { subjects, questions, updateSubject, removeSubject, mergeSubjects } = useTkbData();
  const [viewMode, setViewMode] = useState('coverage');
  const [openPopoverId, setOpenPopoverId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');

  function openPopover(subject) {
    if (openPopoverId === subject.id) {
      setOpenPopoverId(null);
      return;
    }
    setOpenPopoverId(subject.id);
    setRenameValue(subject.name);
    const others = subjects.filter(s => s.id !== subject.id);
    setMergeTarget(others[0]?.id ?? '');
  }

  function toggleProfileVisibility(subject, profileId) {
    const current = subject.visibleToProfiles ?? [];
    const next = current.includes(profileId)
      ? current.filter(id => id !== profileId)
      : [...current, profileId];
    updateSubject(subject.id, { visibleToProfiles: next });
  }

  return (
    <div>
      <div className="tkb-bubbles-toolbar">
        <button
          className={`tkb-btn ${viewMode === 'coverage' ? 'tkb-btn-primary' : 'tkb-btn-secondary'}`}
          onClick={() => setViewMode('coverage')}
        >
          Coverage
        </button>
        <button
          className={`tkb-btn ${viewMode === 'staleness' ? 'tkb-btn-primary' : 'tkb-btn-secondary'}`}
          onClick={() => setViewMode('staleness')}
        >
          Staleness
        </button>
      </div>

      <div className="tkb-bubbles">
        {subjects.map((subject, i) => {
          const questionCount = questions.filter(q => q.subjectId === subject.id).length;
          const size = Math.max(56, Math.min(160, 56 + Math.sqrt(questionCount) * 14));

          const style = {
            width: `${size}px`,
            height: `${size}px`,
            animationDelay: `${i * 0.4}s`,
            backgroundColor: subject.color,
          };

          let className = 'tkb-bubble';
          let countLabel = questionCount;

          if (viewMode === 'coverage') {
            className += ' tkb-bubble-coverage';
            const coverage = computeCoverage(subject, questions);
            style['--tkb-cov-basic'] = `${Math.round(coverage.basic * 100)}%`;
            style['--tkb-cov-mid'] = `${Math.round(coverage.intermediate * 100)}%`;
            style['--tkb-cov-adv'] = `${Math.round(coverage.advanced * 100)}%`;
          } else {
            className += ' tkb-bubble-staleness';
            const days = computeStaleness(subject, questions);
            style['--tkb-stale-color'] = staleColor(days);
            countLabel = `${days}d`;
          }

          return (
            <div key={subject.id} style={{ position: 'relative' }}>
              <button className={className} style={style} onClick={() => openPopover(subject)}>
                <span className="tkb-bubble-name">{subject.name}</span>
                <span className="tkb-bubble-count">{countLabel}</span>
              </button>

              {openPopoverId === subject.id && (
                <div className="tkb-popover">
                  <div className="tkb-popover-row">
                    <label>Rename</label>
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                    />
                    <button
                      className="tkb-btn tkb-btn-primary"
                      onClick={() => updateSubject(subject.id, { name: renameValue })}
                    >
                      Save
                    </button>
                  </div>

                  <div className="tkb-popover-row">
                    <label>Merge into</label>
                    <select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)}>
                      {subjects.filter(s => s.id !== subject.id).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button
                      className="tkb-btn tkb-btn-secondary"
                      onClick={() => {
                        if (mergeTarget) mergeSubjects(subject.id, mergeTarget);
                        setOpenPopoverId(null);
                      }}
                    >
                      Merge into selected
                    </button>
                  </div>

                  <div className="tkb-popover-row">
                    <label>Visible to profiles</label>
                    {PROFILES.map(p => (
                      <label key={p.id}>
                        <input
                          type="checkbox"
                          checked={(subject.visibleToProfiles ?? []).includes(p.id)}
                          onChange={() => toggleProfileVisibility(subject, p.id)}
                        />
                        {' '}{p.name}
                      </label>
                    ))}
                  </div>

                  <div className="tkb-popover-actions">
                    <button
                      className="tkb-btn tkb-btn-secondary"
                      onClick={() => {
                        if (window.confirm('Delete this subject and all its questions?')) {
                          removeSubject(subject.id);
                          setOpenPopoverId(null);
                        }
                      }}
                    >
                      Delete
                    </button>
                    <button className="tkb-btn tkb-btn-secondary" onClick={() => setOpenPopoverId(null)}>
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

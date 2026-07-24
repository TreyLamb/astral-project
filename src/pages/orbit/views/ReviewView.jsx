import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrbit } from '../orbitContext';
import TaskRow from './TaskRow';
import './ReviewView.css';

function formatWeekOf(weekOf) {
  const d = new Date(weekOf + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return weekOf;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatGeneratedAt(ms) {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// One read-only snapshot card. Sections only ever LINK OUT to normal task/
// project editing (TaskRow's own checkbox/pin/expand, or the project page) —
// nothing here writes back into the ReviewLog itself (see §4.6: "read-only
// summary; do NOT allow editing the log").
function ReviewLogCard({ log, tasksById, projectsById }) {
  const shippedTasks = log.shippedTaskIds.map((id) => tasksById.get(id)).filter(Boolean);
  const staleProjects = log.staleProjectIds.map((id) => projectsById.get(id)).filter(Boolean);
  const overdueTasks = log.overdueTaskIds.map((id) => tasksById.get(id)).filter(Boolean);

  return (
    <div className="orb-card orb-review-card">
      <div className="orb-review-card-head">
        <div>
          <div className="orb-review-week">Week of {formatWeekOf(log.weekOf)}</div>
          <div className="orb-review-generated">Generated {formatGeneratedAt(log.generatedAt)}</div>
        </div>
        {/* ✂️ No serverless endpoint for a review narrative yet — this stays a
            disabled affordance, never a faked summary. See §4.6. */}
        <button
          type="button"
          className="orb-btn orb-review-ai-btn"
          disabled
          title="AI review narrative isn't wired up yet — coming soon"
        >
          ✨ Tidy with AI · coming soon
        </button>
      </div>

      <div className="orb-review-sections">
        <div className="orb-review-section">
          <div className="orb-review-section-head">
            <span>Shipped</span>
            <span className="orb-review-count">{shippedTasks.length}</span>
          </div>
          {shippedTasks.length === 0 ? (
            <div className="orb-review-section-empty">Nothing shipped this week.</div>
          ) : (
            <ul className="orb-review-simple-list">
              {shippedTasks.map((t) => (
                <li key={t.id} className="orb-review-simple-item">
                  <span className="orb-review-check" aria-hidden="true">✓</span>
                  <span>{t.title || <em>untitled</em>}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="orb-review-section">
          <div className="orb-review-section-head">
            <span>Stale projects</span>
            <span className="orb-review-count">{staleProjects.length}</span>
          </div>
          {staleProjects.length === 0 ? (
            <div className="orb-review-section-empty">No stale projects.</div>
          ) : (
            <ul className="orb-review-simple-list">
              {staleProjects.map((p) => (
                <li key={p.id} className="orb-review-simple-item">
                  <Link to={`/orbit/project/${p.id}`} className="orb-review-link">
                    {p.name || <em>untitled</em>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="orb-review-section">
          <div className="orb-review-section-head">
            <span>Overdue</span>
            <span className="orb-review-count">{overdueTasks.length}</span>
          </div>
          {overdueTasks.length === 0 ? (
            <div className="orb-review-section-empty">Nothing overdue.</div>
          ) : (
            // Reuses the same TaskRow every other view acts on tasks through —
            // its checkbox/pin/expand-to-edit ARE the "open/pin" jump-to path.
            <div className="orb-review-task-list">
              {overdueTasks.map((t) => <TaskRow key={t.id} task={t} showProject />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReviewView() {
  const { reviewLogs, tasksById, projects, generateReview } = useOrbit();
  const [generating, setGenerating] = useState(false);

  const projectsById = new Map(projects.map((p) => [p.id, p]));
  const sortedLogs = [...reviewLogs].sort((a, b) => (a.weekOf < b.weekOf ? 1 : a.weekOf > b.weekOf ? -1 : 0));

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      await generateReview();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="orb-review">
      <div className="orb-review-head">
        <h2 className="orb-review-h2">Weekly Review</h2>
        <button
          type="button"
          className="orb-btn orb-btn-primary"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'Generating…' : "Generate this week's review now"}
        </button>
      </div>

      {sortedLogs.length === 0 ? (
        <div className="orb-review-empty orb-card">
          No reviews yet — one is generated automatically each Monday, or generate now.
        </div>
      ) : (
        <div className="orb-review-list">
          {sortedLogs.map((log) => (
            <ReviewLogCard key={log.id} log={log} tasksById={tasksById} projectsById={projectsById} />
          ))}
        </div>
      )}
    </div>
  );
}

// Lint issues for one filter. `error` means the query does not do what it looks
// like it does in game; `warning` means it probably doesn't; `info` is tidiness.
// An issue carrying a `fix` gets a one-click apply — it only ever edits the
// draft, never the saved filter, so nothing changes until Save.
export default function LintList({ issues, onFix }) {
  if (!issues?.length) return null;

  return (
    <div className="pgf-lint">
      {issues.map((issue, i) => (
        <div key={i} className={`pgf-lint-row pgf-lint-${issue.severity}`}>
          <span className="pgf-lint-badge">{issue.severity}</span>
          <span>{issue.message}</span>
          {issue.fix && onFix && (
            <button
              className="pgf-btn pgf-btn-sm pgf-lint-fix"
              onClick={() => onFix(issue.fix)}
              title={`Replace "${issue.fix.find}" with "${issue.fix.replace}"`}
            >
              Fix
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

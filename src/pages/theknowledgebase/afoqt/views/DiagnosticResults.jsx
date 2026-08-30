import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { latestDiagnostic } from '../afoqtStorage';
import DiagnosticReport from './DiagnosticReport';

// The persistent counterpart to DiagnosticRunner's one-shot 'report' phase - reads the last
// finished run straight out of stored progress, so it survives navigating away, a refresh, or
// coming back next week. Reachable from the dashboard and the curriculum map, not just the
// moment right after finishing.
export default function DiagnosticResults() {
  const navigate = useNavigate();
  const { progress } = useAfoqt();
  const diagnostic = latestDiagnostic(progress);

  if (!diagnostic) {
    return (
      <div className="afq-runner">
        <p>No diagnostic taken yet.</p>
        <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/diagnostic')}>
          Take the diagnostic
        </button>
      </div>
    );
  }

  return <DiagnosticReport results={diagnostic.results} takenAt={diagnostic.takenAt} />;
}

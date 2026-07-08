// Pure export/serialization helpers — operate on already-loaded data (from
// TkbDataContext) instead of reading a storage backend directly, so they
// work the same whether that data came from localStorage or Firestore.
import { SCHEMA_VERSION, todayStr } from './tkbStorage';

export function buildExportData({ subjects, questions, weights, cycles, sessions, settings }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    subjects,
    questions,
    weights,
    cycles,
    sessions,
    settings,
  };
}

export function buildRemovedQuestionsText(questions, subjects) {
  const removed = questions.filter((q) => q.status === 'retired');
  const subjectName = (id) => subjects.find((s) => s.id === id)?.name ?? '(unknown)';
  return removed
    .map((q) => `Q: ${q.question}\nA: ${q.answer}\nSubject: ${subjectName(q.subjectId)}\n`)
    .join('\n');
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(namePrefix, data) {
  download(`${namePrefix}-${todayStr()}.json`, JSON.stringify(data, null, 2), 'application/json');
}

export function downloadText(namePrefix, text) {
  download(`${namePrefix}-${todayStr()}.txt`, text, 'text/plain');
}

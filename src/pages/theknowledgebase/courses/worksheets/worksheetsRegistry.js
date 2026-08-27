// Registered worksheets available at /TKB/courses/worksheets. Each entry's
// `data` comes straight from a JSON file produced by a parser script under
// scripts/ (e.g. scripts/parseMciWorksheet.mjs for the MCI doc family) —
// nothing here fetches or parses source PDFs at runtime.
//
// To add a new worksheet from a future SupplementalCourseDocs file: run the
// matching parser script (or write a new one, for a differently-shaped doc)
// to produce a JSON file under data/, import it below, and add one entry.

import mmahpCh14 from './data/mmahp-ch1-4.json';
import { countQuestions } from './worksheetEngine';

const REGISTRY = [mmahpCh14].map((data) => ({
  id: data.id,
  title: data.title,
  courseCode: data.courseCode ?? null,
  sourceFile: data.sourceFile ?? null,
  chapterCount: data.chapters?.length ?? 0,
  questionCount: countQuestions(data),
  data,
}));

export function listWorksheets() {
  return REGISTRY;
}

export function getWorksheet(id) {
  return REGISTRY.find((w) => w.id === id) ?? null;
}

// Band-pooled SJT templates - the bands that are too thin PER CHAPTER to earn one.
//
// This file must be imported LAST of the sjt chapters (see templates/index.js): it pools rows
// that the chapter files have already registered, so it cannot run before them.
//
// WHY IT EXISTS. `scenarioTemplates()` builds one template per chapter+band and refuses a pool
// under five situations. That floor is right - a thin item space should be declared, not hidden -
// but SJT's rows are spread across six chapters and three bands, and the arithmetic stranded most
// of the subtest. Measured 2026-09-04:
//
//     band 2   10 rows across 5 chapters   ->  0 templates
//     band 3   36 rows across 6 chapters   ->  6 templates, all live
//     band 4   17 rows across 6 chapters   ->  0 templates
//
// 27 of 63 authored scenarios never appeared in a drill. Every one of them validated, coverage
// held, and the whole suite passed - the content was simply never asked. Chapter+band is the
// wrong grouping for a subtest this wide and this shallow, so bands 2 and 4 are pooled by BAND
// instead, which is the same chapter-scoped-vs-band-scoped split engine/words.js already makes
// between wordTemplates and methodTemplates.
//
// Band 3 is deliberately NOT pooled here: it already earns a template in every chapter, and
// adding a seventh drawing from the same rows would just double its share of a drill.

import { pooledScenarioTemplates } from '../../engine/judgment.js';

pooledScenarioTemplates({ band: 2, idBase: 'sjt-pool-b2', name: 'Judgment - straightforward calls' });
pooledScenarioTemplates({ band: 4, idBase: 'sjt-pool-b4', name: 'Judgment - genuinely contested calls' });

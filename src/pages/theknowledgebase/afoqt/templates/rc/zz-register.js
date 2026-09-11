// Turns the passage bank into templates. MUST be imported LAST of the rc/ files.
//
// This used to sit at the bottom of ch01-passages-set-A.js and again at the bottom of
// ch02-passages-set-B.js, each looping its own bands. That works for exactly two files and
// breaks on the third: `passageTemplates()` calls `registerTemplate()`, which throws on a
// duplicate id, so a third file looping a band an earlier file already covered would fail at
// import. It also meant set A's templates were built from `allPassages()` at a moment when only
// set A had registered - correct only by the accident of import order.
//
// So it is one call site now, run after every passage file has registered, exactly the way
// wk/pool-zz-register.js turns the word pool into templates. A new passage file registers
// passages and adds its import to templates/index.js. Nothing here changes as the bank grows.
//
// Three templates per band, splitting the five question types the way the curriculum chapters
// do. Band is a property of the PASSAGE, so a band with no passages registers nothing
// (passageTemplates returns [] on an empty pool, and again below its 5-eligible-question floor).

import { passageTemplates, allPassages } from '../../engine/passage.js';

for (const band of [2, 3, 4, 5]) {
  passageTemplates({
    chapter: 'rc-02-main-idea', band, idBase: `rc-main-idea-b${band}`, name: 'Main idea and author agreement',
    concepts: ['rc-main-idea', 'rc-author-agreement'], passages: allPassages(),
  });
  passageTemplates({
    chapter: 'rc-03-details', band, idBase: `rc-detail-b${band}`, name: 'Detail inference and paragraph function',
    concepts: ['rc-detail-inference', 'rc-function-of-paragraph'], passages: allPassages(),
  });
  passageTemplates({
    chapter: 'rc-04-vocabulary', band, idBase: `rc-vocabulary-b${band}`, name: 'Vocabulary in context',
    concepts: ['rc-vocabulary-in-context'], passages: allPassages(),
  });
}

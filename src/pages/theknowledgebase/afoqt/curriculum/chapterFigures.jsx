import AnglePairDiagram from '../render/AnglePairDiagram';

// Chapters whose lesson prose benefits from an actual picture, not just more words. Markdown
// lessons can't embed a live React component inline (react-markdown renders plain markdown, not
// JSX, and adding raw-HTML passthrough still wouldn't let a component compute its own angle
// math), so ChapterView renders whichever of these applies right above the lesson text instead -
// contextually attached to the chapter, not floating in the markdown.
//
// Keyed by chapter id so adding one for a future chapter is a one-line addition here, not a
// change to ChapterView itself.
export const CHAPTER_FIGURES = {
  'mk-09-geometry-foundations': {
    caption: 'Vertical angles and a linear pair, in one picture',
    Component: () => <AnglePairDiagram acute={38} />,
  },
};

export const DEFAULT_THEME = 'tavern';

// Every selectable dashboard theme, in Settings-picker display order.
// 'tavern' and 'gemini8v2' are both rendered by the same seat-based engine
// (themes/AqGemini8v2Theme.jsx) as different visual `skin`s — the seat
// geometry/zoom/card logic is identical, only the CSS look differs. See
// that file's `skin` prop. 'classic' has no entry pointing at a component —
// it's the original list layout already built directly into
// AntiquityQuestHost.jsx's PlayingScreen, kept as a plain inline fallback
// rather than extracted since nothing else reuses it yet.
export const AQ_THEMES = [
  { id: 'tavern', label: 'Tavern' },
  { id: 'gemini8v2', label: 'Round Table (Sci-Fi)' },
  { id: 'classic', label: 'Classic List' },
];

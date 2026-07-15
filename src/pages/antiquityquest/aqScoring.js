export const AQ_POINTS = {
  antiquity: 25,
  treasure: 50,
  remington: 100,
  tess: 100,
  perfectTreasure: 1500,
  perfectAntiquity: 1000,
  standardCollection: 500,
  mixedCollection: 250,
  wentOut: 500,
};

export function calculateRoundScore(inputs = {}) {
  const {
    perfectTreasures = 0,
    perfectAntiquities = 0,
    standardCollections = 0,
    mixedCollections = 0,
    individualAntiquities = 0,
    individualTreasures = 0,
    wentOut = false,
    heldAntiquities = 0,
    heldTreasures = 0,
    heldRemingtons = 0,
    heldTess = 0,
  } = inputs;

  // Nigel Remington and Tess Wynter only ever cost points if left unplayed —
  // there is no positive score for playing either, unlike Antiquity/Treasure
  // cards (Tess is a pure action card at the table; per-user confirmation,
  // she does carry the same -100 penalty as Remington if still in hand/cache
  // at round end, even though antiquityquest.md's formula omits it).
  const breakdown = {
    perfectTreasures: perfectTreasures * AQ_POINTS.perfectTreasure,
    perfectAntiquities: perfectAntiquities * AQ_POINTS.perfectAntiquity,
    standardCollections: standardCollections * AQ_POINTS.standardCollection,
    mixedCollections: mixedCollections * AQ_POINTS.mixedCollection,
    individualAntiquities: individualAntiquities * AQ_POINTS.antiquity,
    individualTreasures: individualTreasures * AQ_POINTS.treasure,
    wentOut: wentOut ? AQ_POINTS.wentOut : 0,
    heldAntiquities: 0 - heldAntiquities * AQ_POINTS.antiquity,
    heldTreasures: 0 - heldTreasures * AQ_POINTS.treasure,
    heldRemingtons: 0 - heldRemingtons * AQ_POINTS.remington,
    heldTess: 0 - heldTess * AQ_POINTS.tess,
  };

  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  return { total, breakdown };
}

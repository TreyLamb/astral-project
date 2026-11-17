// Chain of Command deck (Trey, 2026-10-30): every name on the knowledge list's chain of command as
// TWO cards - "Who is the Commander in Chief?" in plain text, and the same question with the
// official portrait. Nothing else on purpose: he ruled out duty-station cards, since the det's own
// study cards don't ask them.
//
// Names come from knowledgeListData.js so there is ONE place to update when leadership changes;
// this file only adds portraits. Ids are built from the position, never from a position in a list,
// so flags survive the roster changing.

import { SECTIONS } from './knowledgeListData';
import { photoFor } from './chainPhotos';

const chain = SECTIONS.find((s) => s.id === 'chain');
// The 11 positions only. Det 855 cadre and cadet staff are left out: Trey, 2026-10-30, "i know them."
const ROWS = chain.rows;

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function buildChainCards(rows = ROWS) {
  const out = [];
  for (const r of rows) {
    const id = `chain-${slug(r.k)}`;
    const front = `Who is the ${r.k}?`;
    out.push({ id: `${id}-who`, subject: 'chain', front, back: r.v, note: r.flag || r.note });
    const photo = photoFor(r.k);
    if (photo) {
      out.push({
        id: `${id}-face`, subject: 'chain', front,
        frontImg: photo,
        frontImgAlt: `Official portrait of the ${r.k}`,
        credit: 'Official portrait (U.S. Government)',
        back: r.v,
      });
    }
  }
  return out;
}

export const CHAIN_CARDS = buildChainCards();
export const CHAIN_PEOPLE = ROWS.length;

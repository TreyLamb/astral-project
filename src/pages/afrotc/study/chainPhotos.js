// Official portraits for the chain of command, keyed by the knowledge list's position name.
// U.S. government works (public domain), via Wikimedia Commons, saved 2026-10-30 to
// public/afrotc/chain/. Several are from an earlier grade; the face is what the card tests.
// No public portrait was found for the AFROTC Commander, the NW Region Director or Det 855.
export const CHAIN_PHOTOS = {
  'Commander in Chief': 'trump',
  'Secretary of War': 'hegseth',
  'Secretary of the Air Force': 'meink',
  'Chairman of the Joint Chiefs of Staff': 'caine',
  'Chief of Staff of the Air Force': 'wilsbach',
  'Chief of Space Operations': 'schiess',
  'AETC Commander': 'quinn',
  'AFAC Commander': 'nelson',
  'Holm Center Commander': 'lay',
};

export const photoFor = (position) => (CHAIN_PHOTOS[position] ? `/afrotc/chain/${CHAIN_PHOTOS[position]}.jpg` : null);

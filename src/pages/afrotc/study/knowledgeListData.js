// The knowledge list Trey was handed (pasted 2026-10-28), item for item and in the list's own order,
// as one source for the "Knowledge list" review (KnowledgeList.jsx; this file's name differs by more than case so Windows can resolve both): a cover-the-answer sheet,
// flashcards in both directions, and in-order recitation.
//
// The list's wording wins where it is the thing being recited ("Secretary of War", "Special General =
// Fleet Admiral"); where it disagrees with the statute or the official spelling, the row keeps the
// list's answer and says so in a note, the same rule RecitationSheet.jsx uses: give what your cadre
// teaches and show you know the rest.
//
// The two songs are pointed at, not printed: their lyrics are still under copyright, which is why the
// Song & Creed tab has the cadet paste them in. The Airman's Creed is a government work and ships.

import cadetWing from '../docs/cadetWing.json';
import { AIRMANS_CREED } from './creedText';
import { photoFor } from './chainPhotos';

const wing = Object.fromEntries(cadetWing.people.map((p) => [p.symbol, p]));
const cadet = (sym) => (wing[sym] ? `${wing[sym].rank} ${wing[sym].name.replace(/,.*$/, '')}` : '');

export const LIST_DATE = '28 Oct 2026';

export const SECTIONS = [
  {
    id: 'chain',
    title: 'Chain of Command',
    cols: ['Position', 'Name'],
    order: true,
    rows: [
      { k: 'Commander in Chief', v: 'President Donald J. Trump' },
      {
        k: 'Secretary of War', v: 'The Honorable Peter B. Hegseth',
        note: 'Recite it as your list does. The statutory title is still Secretary of Defense; "Secretary of War" is a secondary title authorized by Executive Order 14347 (5 Sep 2025).',
      },
      { k: 'Secretary of the Air Force', v: 'The Honorable Troy E. Meink' },
      {
        k: 'Chairman of the Joint Chiefs of Staff', v: 'General Dan Caine',
        note: 'On the list, but he is the principal military advisor, not a link in the chain. If asked, the operational chain runs President, Secretary of War, combatant commanders.',
      },
      { k: 'Chief of Staff of the Air Force', v: 'General Kenneth S. Wilsbach', flag: 'Replaced Gen. Allvin. Older slides still say Allvin.' },
      { k: 'Chief of Space Operations', v: 'General Douglas A. Schiess', flag: 'Took over from Gen. Saltzman on 3 Sep 2026.' },
      { k: 'AETC Commander', v: 'Lt. Gen. Clark J. Quinn' },
      {
        k: 'AFAC Commander', v: 'Maj. Gen. Jeffrey W. Nelson',
        note: 'AFAC = Air Force Accessions Center (he also commands Air Force Recruiting Service). The Holm Center has reported here, not to Air University, since 8 Oct 2024.',
      },
      { k: 'Holm Center Commander', v: 'Brig. Gen. Christopher Lay' },
      { k: 'AFROTC Commander', v: 'Col. Michael Fleming' },
      {
        k: 'NW Region Director', v: 'Col. Sandra Coble',
        note: `From your list (${LIST_DATE}). No public source names her yet, so this one rests on cadre.`,
      },
    ],
    extra: {
      title: 'Det 855 cadre and wing staff (the list says these "can be included")',
      note: `Cadet names from the Fall 2026 OPLAN (${cadetWing.source.dated}). Billets rotate; check the Cadet Wing Who's Who tab before reciting.`,
      rows: [
        { k: 'Det 855 Commander (Det/CC)', v: 'Col. Trig Randall', note: 'Named in the OPLAN as issuing the attendance memo. Confirm he is still Det/CC.' },
        { k: 'Operations Flight Commander (OFC)', v: 'Capt. Lucas Parker', note: 'Certified the Fall 2026 OPLAN as the Det 855 OFC.' },
        { k: 'Cadet Wing Commander', v: cadet('CW/CC') },
        { k: 'Cadet Wing Deputy Commander', v: cadet('CW/CD') },
        { k: 'Training Group Commander', v: cadet('TG/CC') },
        { k: 'Yankee Squadron Commander', v: cadet('Y SQ/CC') },
        { k: 'Charlie Flight Commander', v: cadet('C FLT/CC') },
      ].filter((r) => r.v),
    },
    forward: (r) => `Who is the ${r.k}?`,
    reverse: (r) => `${r.v} holds which position?`,
  },
  {
    id: 'birthdays',
    title: 'Birthdays',
    cols: ['Service', 'Birthday'],
    rows: [
      { k: 'Air Force birthday', v: '18 September 1947', note: 'Became a separate service under the National Security Act of 1947.' },
      { k: 'Space Force birthday', v: '20 December 2019', note: 'Created when the FY2020 National Defense Authorization Act was signed.' },
    ],
    forward: (r) => `What is the ${r.k}?`,
    reverse: (r) => `${r.v} is whose birthday?`,
  },
  {
    id: 'honor',
    title: 'Cadet Honor Code',
    cols: ['', 'Verbatim'],
    rows: [{ k: 'Cadet Honor Code', v: 'We will not lie, steal, or cheat, nor tolerate among us anyone who does.' }],
    cards: [
      { front: 'Recite the Cadet Honor Code.', back: 'We will not lie, steal, or cheat, nor tolerate among us anyone who does.' },
      { front: 'Honor Code: "We will not ___, ___, or ___ …"', back: 'lie, steal, or cheat' },
      { front: 'Honor Code: how does it end, after "lie, steal, or cheat"?', back: '"…nor tolerate among us anyone who does."' },
    ],
  },
  {
    id: 'tiers',
    title: 'Airmen / NCOs / SNCOs',
    cols: ['Tier', 'Grades'],
    order: true,
    rows: [
      { k: 'Airmen', v: 'E-1 through E-4', note: 'Airman Basic, Airman, Airman First Class, Senior Airman. A Senior Airman (E-4) is NOT an NCO.' },
      { k: 'NCOs (Noncommissioned Officers)', v: 'E-5 and E-6', note: 'Staff Sergeant, Technical Sergeant.' },
      { k: 'SNCOs (Senior Noncommissioned Officers)', v: 'E-7 through E-9', note: 'Master Sergeant, Senior Master Sergeant, Chief Master Sergeant.' },
    ],
    forward: (r) => `${r.k}: which pay grades?`,
    reverse: (r) => `${r.v}: which tier?`,
    cards: [
      { front: 'E-4 (Senior Airman): Airman or NCO?', back: 'Airman. The first NCO grade is E-5, Staff Sergeant.' },
      { front: 'What is the first NCO grade?', back: 'E-5, Staff Sergeant.' },
      { front: 'What is the first SNCO grade?', back: 'E-7, Master Sergeant.' },
    ],
  },
  {
    id: 'officers',
    title: 'AF / SF / Army / Marine officer ranks',
    cols: ['Grade', 'Title (same in all four)', 'AF/SF', 'Army', 'Marines'],
    order: true,
    rows: [
      { k: 'O-1', v: 'Second Lieutenant', af: '2d Lt', army: '2LT', usmc: '2ndLt' },
      { k: 'O-2', v: 'First Lieutenant', af: '1st Lt', army: '1LT', usmc: '1stLt' },
      { k: 'O-3', v: 'Captain', af: 'Capt', army: 'CPT', usmc: 'Capt' },
      { k: 'O-4', v: 'Major', af: 'Maj', army: 'MAJ', usmc: 'Maj' },
      { k: 'O-5', v: 'Lieutenant Colonel', af: 'Lt Col', army: 'LTC', usmc: 'LtCol' },
      { k: 'O-6', v: 'Colonel', af: 'Col', army: 'COL', usmc: 'Col' },
      { k: 'O-7', v: 'Brigadier General', af: 'Brig Gen', army: 'BG', usmc: 'BGen' },
      { k: 'O-8', v: 'Major General', af: 'Maj Gen', army: 'MG', usmc: 'MajGen' },
      { k: 'O-9', v: 'Lieutenant General', af: 'Lt Gen', army: 'LTG', usmc: 'LtGen' },
      { k: 'O-10', v: 'General', af: 'Gen', army: 'GEN', usmc: 'Gen' },
    ],
    note: 'The Air Force, Space Force, Army and Marine Corps share the same officer titles; only the written abbreviations differ.',
    forward: (r) => `${r.k} in the Air Force, Space Force, Army or Marines?`,
    reverse: (r) => `${r.v} is which pay grade?`,
  },
  {
    id: 'cgofgo',
    title: 'Company Grade and Field Grade Officers',
    cols: ['Group', 'Grades'],
    rows: [
      { k: 'Company Grade Officers (CGOs)', v: 'O-1 through O-3: Second Lieutenant, First Lieutenant, Captain', note: 'Your list writes "2nd Lt"; the Air Force writes 2d Lt.' },
      { k: 'Field Grade Officers (FGOs)', v: 'O-4 through O-6: Major, Lieutenant Colonel, Colonel' },
    ],
    forward: (r) => `${r.k}: which grades?`,
    reverse: null,
    cards: [
      { front: 'A Captain (O-3): company grade or field grade?', back: 'Company grade, the senior CGO.' },
      { front: 'A Major (O-4): company grade or field grade?', back: 'Field grade, the first FGO.' },
      { front: 'What comes above field grade?', back: 'General officers, O-7 through O-10 (not on your list, but the next question).' },
    ],
  },
  {
    id: 'navy',
    title: 'Navy officer ranks',
    cols: ['Grade', 'Navy title'],
    order: true,
    rows: [
      { k: 'O-1', v: 'Ensign', abbr: 'ENS' },
      { k: 'O-2', v: 'Lieutenant Junior Grade', abbr: 'LTJG' },
      { k: 'O-3', v: 'Lieutenant', abbr: 'LT', note: 'Equal to an Air Force Captain, not an Air Force lieutenant.' },
      { k: 'O-4', v: 'Lieutenant Commander', abbr: 'LCDR' },
      { k: 'O-5', v: 'Commander', abbr: 'CDR' },
      { k: 'O-6', v: 'Captain', abbr: 'CAPT', note: 'Equal to an Air Force Colonel, three grades above an Air Force Captain. The #1 cross-service trap.' },
      { k: 'O-7', v: 'Rear Admiral Lower Half', abbr: 'RDML', note: '1 star.' },
      { k: 'O-8', v: 'Rear Admiral Upper Half', abbr: 'RADM', note: '2 stars.' },
      { k: 'O-9', v: 'Vice Admiral', abbr: 'VADM', note: '3 stars.' },
      { k: 'O-10', v: 'Admiral', abbr: 'ADM', note: '4 stars.' },
      {
        k: 'Special', v: 'Fleet Admiral', abbr: 'FADM',
        note: 'Your list calls it "Special General." It is the five-star grade above O-10, used only in wartime and not held since World War II. Army equivalent: General of the Army; Air Force: General of the Air Force (only Hap Arnold).',
      },
    ],
    forward: (r) => (r.k === 'Special' ? 'Navy: the special five-star rank above Admiral?' : `Navy ${r.k}?`),
    reverse: (r) => `Navy ${r.v} is which grade?`,
    cards: [
      { front: 'A Navy Captain is equal to which Air Force rank?', back: 'Colonel (O-6).' },
      { front: 'A Navy Lieutenant is equal to which Air Force rank?', back: 'Captain (O-3).' },
      { front: 'Rear Admiral Lower Half vs Upper Half: which is which grade?', back: 'Lower Half = O-7 (1 star). Upper Half = O-8 (2 stars).' },
    ],
  },
  {
    id: 'creed',
    title: "Airman's Creed",
    lines: AIRMANS_CREED.split('\n').filter((l) => l.trim()),
    order: true,
    note: 'Recite it a line at a time in the In order view; the Song & Creed tab drills it with the full player.',
  },
  {
    id: 'values',
    title: 'Air Force Core Values',
    cols: ['#', 'Core value'],
    order: true,
    rows: [
      { k: '1', v: 'Integrity First' },
      { k: '2', v: 'Service Before Self' },
      { k: '3', v: 'Excellence In All We Do' },
    ],
    forward: (r) => `Air Force Core Value #${r.k}?`,
    reverse: null,
    cards: [{ front: 'Name all three Air Force Core Values, in order.', back: 'Integrity First · Service Before Self · Excellence In All We Do' }],
  },
  {
    id: 'songs',
    title: 'Air Force and Space Force songs',
    cols: ['Song', 'Line'],
    rows: [
      { k: 'Air Force Song, opening line', v: 'Off we go into the wild blue yonder,' },
      { k: 'Air Force Song, closing line', v: 'Nothing’ll stop the U.S. Air Force!' },
      { k: 'Space Force Song, opening line', v: 'We’re the mighty watchful eye,' },
      { k: 'Space Force Song, closing line', v: 'We’re the Space Force from on high.' },
    ],
    note: 'Only the first and last lines are here. The full lyrics are still under copyright, so the Song & Creed tab has you paste them in and then drills them line by line with the recordings.',
    forward: (r) => `${r.k}?`,
    reverse: null,
    link: 'song',
  },
  {
    id: 'responses',
    title: '7 Basic Responses',
    cols: ['#', 'Response'],
    order: true,
    rows: [
      { k: '1', v: 'Yes, Sir/Ma’am.' },
      { k: '2', v: 'No, Sir/Ma’am.' },
      { k: '3', v: 'No excuse, Sir/Ma’am.' },
      { k: '4', v: 'Sir/Ma’am, I do not know.' },
      { k: '5', v: 'Sir/Ma’am, I do not understand.' },
      { k: '6', v: 'Sir/Ma’am, may I make a statement?' },
      { k: '7', v: 'Sir/Ma’am, may I ask a question?' },
    ],
    note: 'Order as printed in the Det 855 handbook. Detachments vary the order; all seven words have to be there.',
    forward: (r) => `Basic response #${r.k}?`,
    reverse: null,
    cards: [{ front: 'All seven basic responses?', back: 'Yes, Sir/Ma’am · No, Sir/Ma’am · No excuse, Sir/Ma’am · Sir/Ma’am, I do not know · Sir/Ma’am, I do not understand · Sir/Ma’am, may I make a statement? · Sir/Ma’am, may I ask a question?' }],
  },
  {
    id: 'majcoms',
    title: 'MAJCOMs (Air Force)',
    cols: ['Major command', 'Headquarters'],
    order: true,
    rows: [
      { k: 'Air Combat Command (ACC)', v: 'Joint Base Langley-Eustis, Virginia' },
      { k: 'Air Education and Training Command (AETC)', v: 'Joint Base San Antonio-Randolph, Texas', note: 'Randolph AFB, San Antonio. AFROTC’s parent MAJCOM.' },
      { k: 'Air Force Global Strike Command (AFGSC)', v: 'Barksdale AFB, Louisiana' },
      { k: 'Air Force Materiel Command (AFMC)', v: 'Wright-Patterson AFB, Ohio', note: 'Spelled "Materiel" (equipment), not "Material".' },
      { k: 'Air Force Reserve Command (AFRC)', v: 'Robins AFB, Georgia' },
      { k: 'Air Force Special Operations Command (AFSOC)', v: 'Hurlburt Field, Florida' },
      { k: 'Air Mobility Command (AMC)', v: 'Scott AFB, Illinois' },
      { k: 'Pacific Air Forces (PACAF)', v: 'Joint Base Pearl Harbor-Hickam, Hawaii' },
      { k: 'U.S. Air Forces in Europe – Air Forces Africa (USAFE-AFAFRICA)', v: 'Ramstein Air Base, Germany', note: 'The only MAJCOM headquartered outside the United States.' },
    ],
    forward: (r) => `Where is ${r.k} headquartered?`,
    reverse: (r) => `Which MAJCOM is headquartered at ${r.v}?`,
    cards: [
      { front: 'Which MAJCOM is the only one headquartered outside the U.S.?', back: 'USAFE-AFAFRICA, at Ramstein Air Base, Germany.' },
      { front: 'How many Air Force MAJCOMs are on the list?', back: 'Nine.' },
    ],
  },
  {
    id: 'sfcommands',
    title: 'MAJCOMs (Space Force)',
    cols: ['Field command', 'Headquarters'],
    order: true,
    rows: [
      { k: 'Space Systems Command (SSC)', v: 'Los Angeles AFB, California', note: 'Acquisition: develops, buys, fields and sustains space capabilities.' },
      {
        k: 'Combat Forces Command (CFC)', v: 'Peterson SFB, Colorado',
        flag: 'Renamed from Space Operations Command (SpOC) on 3 Nov 2025. Many study guides still say SpOC.',
      },
      { k: 'Space Training and Readiness Command (STARCOM)', v: 'Patrick SFB, Florida', note: 'Education, training, doctrine and test.' },
    ],
    note: 'The Space Force calls these field commands, its MAJCOM-level echelon.',
    forward: (r) => `Where is ${r.k} headquartered?`,
    reverse: (r) => `Which Space Force field command is at ${r.v}?`,
    cards: [
      { front: 'Name the Space Force’s three MAJCOM-level (field) commands.', back: 'Space Systems Command (SSC), Combat Forces Command (CFC), Space Training and Readiness Command (STARCOM).' },
      { front: 'What was Combat Forces Command called before 3 Nov 2025?', back: 'Space Operations Command (SpOC).' },
    ],
  },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);
export const sectionById = (id) => SECTIONS.find((s) => s.id === id);

const rowsOf = (s) => s.rows ?? [];

/** The rows a sheet shows for a section, the optional Det 855 block included. */
export function sheetRows(s, withExtra = true) {
  return withExtra && s.extra ? [...rowsOf(s), ...s.extra.rows] : rowsOf(s);
}

/**
 * Flashcards for the chosen sections. `dir` is 'both' | 'forward' | 'reverse'. A section with no
 * reverse question deals its forward cards in every direction, and the hand-written cards always
 * come along, so no section drops out of a one-way deck.
 */
export function cardsFor(sectionIds, dir = 'both', withExtra = true) {
  const out = [];
  for (const s of SECTIONS) {
    if (!sectionIds.includes(s.id)) continue;
    if (s.lines) {
      s.lines.forEach((line, i) => {
        if (i === 0) return;
        out.push({ id: `kl-${s.id}-l${i}`, section: s.id, front: `${s.title}: what comes after "${s.lines[i - 1]}"`, back: line });
      });
      continue;
    }
    sheetRows(s, withExtra).forEach((r, i) => {
      const extra = i >= rowsOf(s).length;
      const tag = `${s.id}-${extra ? 'x' : 'r'}${extra ? i - rowsOf(s).length : i}`;
      const fwd = s.forward ? s.forward(r) : `${r.k}?`;
      const back = s.id === 'navy' && r.abbr ? `${r.v} (${r.abbr})` : r.v;
      if (dir !== 'reverse' || !s.reverse) out.push({ id: `kl-${tag}-f`, section: s.id, front: fwd, back, note: r.note ?? r.flag });
      // Trey, 2026-10-30: every chain-of-command name twice, once in text and once with the portrait.
      const photo = s.id === 'chain' && dir !== 'reverse' ? photoFor(r.k) : null;
      if (photo) out.push({ id: `kl-${tag}-p`, section: s.id, front: fwd, frontImg: photo, frontImgAlt: `Official portrait of the ${r.k}`, credit: 'Official portrait (U.S. Government)', back });
      if (dir !== 'forward' && s.reverse) out.push({ id: `kl-${tag}-r`, section: s.id, front: s.reverse(r), back: r.k, note: r.note ?? r.flag });
    });
    (s.cards ?? []).forEach((c, i) => out.push({ id: `kl-${s.id}-c${i}`, section: s.id, ...c }));
  }
  return out;
}

/** An ordered recitation: the list's items as a sequence of lines, the way they are said aloud. */
export function sequenceFor(id, withExtra = true) {
  const s = sectionById(id);
  if (!s || !s.order) return [];
  if (s.lines) return s.lines.map((text, i) => ({ id: `${id}-${i}`, label: String(i + 1), text }));
  return sheetRows(s, withExtra).map((r, i) => ({
    id: `${id}-${i}`,
    label: r.k,
    text: s.id === 'navy' && r.abbr ? `${r.v} (${r.abbr})` : r.v,
  }));
}

/** First letter of every word: a nudge that does not give the answer away. */
export function initials(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const m = w.match(/[A-Za-z0-9]/);
      return m ? m[0] + '…' : w;
    })
    .join(' ');
}

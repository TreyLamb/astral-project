// Chapter 2 — Latin and Greek roots.
//
// The highest-leverage chapter in the subtest, and the only strategy that works on a word you
// have never seen. Step 3 of the method worked out in every official OATTS item is "use word
// parts if unsure", and their own solutions do exactly that: ard- (to burn), bene- (good),
// curs- from Latin currere (to run), co- + agent (to drive together).
//
// A memorised word earns you the one item that happens to use it. A memorised root earns you
// every word built on it - and on a 25-question subtest drawn from an unbounded vocabulary,
// that is the only thing that scales.
//
// CONFUSIONS ARE DECLARED, not drawn. `bene-` lists `mal-` because a candidate who half-recalls
// "something to do with character" picks the wrong direction, which is the same error mode the
// vocabulary rows model with their antonym option. See engine/morphology.js.
//
// AUTHORING RULES (registerMorphemes enforces them):
//   - at least two `examples`, and each example word must VISIBLY contain the form - the whole
//     point is that the candidate can see the part inside the word
//   - `sense` is what the part means, phrased so it reads naturally as an answer option
//   - `confusions` may only reference morphemes in the SAME chapter, or the distractor silently
//     does nothing

import { registerMorphemes, morphemeTemplates } from '../../engine/morphology.js';

const CH = 'wk-02-roots';
const LATIN = ['wk-latin-roots'];
const GREEK = ['wk-greek-roots'];

registerMorphemes([
  // ---- band 2: roots an educated adult already half-recognises ------------------------------
  {
    id: 'wk-root-port', chapter: CH, concepts: LATIN, band: 2,
    form: 'port-', kind: 'root', origin: 'Latin', sense: 'to carry',
    examples: [
      { word: 'import', gloss: 'to bring goods in from another country' },
      { word: 'export', gloss: 'to send goods out to another country' },
      { word: 'portable', gloss: 'able to be carried from place to place' },
    ],
  },
  {
    id: 'wk-root-dict', chapter: CH, concepts: LATIN, band: 2,
    form: 'dict-', kind: 'root', origin: 'Latin', sense: 'to say',
    examples: [
      { word: 'predict', gloss: 'to say what will happen before it does' },
      { word: 'dictionary', gloss: 'a book listing words and what they mean' },
      { word: 'verdict', gloss: 'the decision a jury announces at the end of a trial' },
    ],
  },
  {
    id: 'wk-root-spec', chapter: CH, concepts: LATIN, band: 2,
    form: 'spec-', kind: 'root', origin: 'Latin', sense: 'to look, to watch',
    examples: [
      { word: 'spectator', gloss: 'someone who watches an event without taking part' },
      { word: 'inspect', gloss: 'to look at something closely' },
      { word: 'spectacle', gloss: 'a striking sight worth watching' },
    ],
  },
  {
    id: 'wk-root-aud', chapter: CH, concepts: LATIN, band: 2,
    form: 'aud-', kind: 'root', origin: 'Latin', sense: 'to hear',
    examples: [
      { word: 'audience', gloss: 'the group of people listening to or watching something' },
      { word: 'audible', gloss: 'loud enough to be heard' },
      { word: 'auditorium', gloss: 'a large room built for people to hear a performance' },
    ],
  },
  {
    id: 'wk-root-scrib', chapter: CH, concepts: LATIN, band: 2,
    form: 'scrib-', kind: 'root', origin: 'Latin', sense: 'to write',
    examples: [
      { word: 'describe', gloss: 'to write or say what something is like' },
      { word: 'subscribe', gloss: 'to sign up to receive something regularly' },
      { word: 'scribble', gloss: 'to write quickly and carelessly' },
    ],
  },
  {
    id: 'wk-root-mit', chapter: CH, concepts: LATIN, band: 2,
    form: 'mit-', kind: 'root', origin: 'Latin', sense: 'to send',
    examples: [
      { word: 'permit', gloss: 'to allow something to happen' },
      { word: 'transmit', gloss: 'to send out a signal or message' },
      { word: 'admit', gloss: 'to allow someone to enter' },
    ],
  },
  {
    id: 'wk-root-manu', chapter: CH, concepts: LATIN, band: 2,
    form: 'manu-', kind: 'root', origin: 'Latin', sense: 'hand',
    examples: [
      { word: 'manual', gloss: 'operated by hand rather than automatically' },
      { word: 'manufacture', gloss: 'to make something, originally by hand' },
      { word: 'manuscript', gloss: 'a document written out by hand or typed, before printing' },
    ],
  },
  {
    id: 'wk-root-photo', chapter: CH, concepts: GREEK, band: 2,
    form: 'photo-', kind: 'root', origin: 'Greek', sense: 'light',
    examples: [
      { word: 'photograph', gloss: 'an image captured using light' },
      { word: 'photocopy', gloss: 'a copy made using a light-based machine' },
      { word: 'photosynthesis', gloss: 'the process plants use to turn light into food' },
    ],
  },
  {
    id: 'wk-root-tele', chapter: CH, concepts: GREEK, band: 2,
    form: 'tele-', kind: 'root', origin: 'Greek', sense: 'far off, distant',
    examples: [
      { word: 'television', gloss: 'a device that shows pictures broadcast from far away' },
      { word: 'telescope', gloss: 'an instrument for viewing distant objects' },
      { word: 'telegram', gloss: 'a short message sent over a long distance' },
    ],
  },
  {
    id: 'wk-root-phon', chapter: CH, concepts: GREEK, band: 2,
    form: 'phon-', kind: 'root', origin: 'Greek', sense: 'sound',
    examples: [
      { word: 'telephone', gloss: 'a device that carries sound over a distance' },
      { word: 'microphone', gloss: 'a device that picks up and amplifies sound' },
      { word: 'saxophone', gloss: 'a brass wind instrument known for its sound' },
    ],
  },

  // ---- band 3: standard AFOQT level ----------------------------------------------------------
  {
    id: 'wk-root-bene', chapter: CH, concepts: LATIN, band: 3,
    form: 'bene-', kind: 'root', origin: 'Latin', sense: 'good, well',
    examples: [
      { word: 'benevolent', gloss: 'kind and generous' },
      { word: 'benefactor', gloss: 'someone who gives help or money' },
    ],
    confusions: ['wk-root-mal'],
  },
  {
    id: 'wk-root-mal', chapter: CH, concepts: LATIN, band: 3,
    form: 'mal-', kind: 'root', origin: 'Latin', sense: 'bad, badly',
    examples: [
      { word: 'malevolent', gloss: 'wishing harm on others' },
      { word: 'malady', gloss: 'an illness' },
    ],
    confusions: ['wk-root-bene'],
  },
  {
    id: 'wk-root-loqu', chapter: CH, concepts: LATIN, band: 3,
    form: 'loqu-', kind: 'root', origin: 'Latin', sense: 'to speak',
    examples: [
      { word: 'loquacious', gloss: 'very talkative' },
      { word: 'eloquent', gloss: 'fluent and persuasive in speech' },
    ],
  },
  {
    id: 'wk-root-curs', chapter: CH, concepts: LATIN, band: 3,
    form: 'curs-', kind: 'root', origin: 'Latin', sense: 'to run',
    examples: [
      { word: 'cursory', gloss: 'done quickly and without attention to detail' },
      { word: 'precursor', gloss: 'something that comes before another' },
    ],
  },
  {
    id: 'wk-root-chron', chapter: CH, concepts: GREEK, band: 3,
    form: 'chron-', kind: 'root', origin: 'Greek', sense: 'time',
    examples: [
      { word: 'chronology', gloss: 'the order in which events occurred' },
      { word: 'chronic', gloss: 'lasting for a long time' },
    ],
  },
  {
    id: 'wk-root-anthrop', chapter: CH, concepts: GREEK, band: 3,
    form: 'anthrop-', kind: 'root', origin: 'Greek', sense: 'human being',
    examples: [
      { word: 'anthropology', gloss: 'the study of human societies' },
      { word: 'misanthrope', gloss: 'someone who dislikes people in general' },
    ],
  },
  {
    id: 'wk-root-ped', chapter: CH, concepts: LATIN, band: 3,
    form: 'ped-', kind: 'root', origin: 'Latin', sense: 'foot',
    examples: [
      { word: 'pedestrian', gloss: 'a person traveling on foot' },
      { word: 'pedal', gloss: 'a lever worked by the foot' },
      { word: 'pedometer', gloss: 'a device that counts how many steps you take' },
    ],
  },
  {
    id: 'wk-root-sequ', chapter: CH, concepts: LATIN, band: 3,
    form: 'sequ-', kind: 'root', origin: 'Latin', sense: 'to follow',
    examples: [
      { word: 'sequence', gloss: 'a set of things that follow one after another' },
      { word: 'sequel', gloss: 'a book or film that follows an earlier one' },
      { word: 'consequence', gloss: 'a result that follows from an action' },
    ],
  },
  {
    id: 'wk-root-derm', chapter: CH, concepts: GREEK, band: 3,
    form: 'derm-', kind: 'root', origin: 'Greek', sense: 'skin',
    examples: [
      { word: 'dermatology', gloss: 'the medical study of the skin' },
      { word: 'epidermis', gloss: 'the outer layer of the skin' },
      { word: 'dermatologist', gloss: 'a doctor who treats skin conditions' },
    ],
  },
  {
    id: 'wk-root-bio', chapter: CH, concepts: GREEK, band: 3,
    form: 'bio-', kind: 'root', origin: 'Greek', sense: 'life',
    examples: [
      { word: 'biology', gloss: 'the scientific study of living things' },
      { word: 'biography', gloss: 'a book telling the true story of a real life' },
      { word: 'biodegradable', gloss: 'able to break down naturally over time' },
    ],
  },

  // ---- band 4: the harder end ------------------------------------------------------------------
  {
    id: 'wk-root-vinc', chapter: CH, concepts: LATIN, band: 4,
    form: 'vinc-', kind: 'root', origin: 'Latin', sense: 'to conquer, to overcome',
    examples: [
      { word: 'convince', gloss: 'to persuade someone that something is true' },
      { word: 'invincible', gloss: 'impossible to conquer or defeat' },
    ],
  },
  {
    id: 'wk-root-pug', chapter: CH, concepts: LATIN, band: 4,
    form: 'pug-', kind: 'root', origin: 'Latin', sense: 'to fight',
    examples: [
      { word: 'pugnacious', gloss: 'eager to argue or fight' },
      { word: 'pugilist', gloss: 'a boxer, someone who fights with fists' },
      { word: 'repugnant', gloss: 'so unpleasant it feels like something to fight against' },
    ],
  },
  {
    id: 'wk-root-luc', chapter: CH, concepts: LATIN, band: 4,
    form: 'luc-', kind: 'root', origin: 'Latin', sense: 'light, to shine',
    examples: [
      { word: 'lucid', gloss: 'clear and easy to understand, as if lit up' },
      { word: 'translucent', gloss: 'allowing light to pass through partially' },
      { word: 'elucidate', gloss: 'to make something clear by shedding light on it' },
    ],
  },
  {
    id: 'wk-root-sanct', chapter: CH, concepts: LATIN, band: 4,
    form: 'sanct-', kind: 'root', origin: 'Latin', sense: 'holy, sacred',
    examples: [
      { word: 'sanctuary', gloss: 'a sacred or protected place' },
      { word: 'sanctify', gloss: 'to make something holy' },
      { word: 'sacrosanct', gloss: 'regarded as too sacred to be changed' },
    ],
  },
  {
    id: 'wk-root-tempor', chapter: CH, concepts: LATIN, band: 4,
    form: 'tempor-', kind: 'root', origin: 'Latin', sense: 'time',
    examples: [
      { word: 'temporary', gloss: 'lasting only for a limited time' },
      { word: 'contemporary', gloss: 'existing at the same time as something else' },
      { word: 'temporal', gloss: 'relating to time rather than to space or spirit' },
    ],
  },
  {
    id: 'wk-root-somn', chapter: CH, concepts: LATIN, band: 4,
    form: 'somn-', kind: 'root', origin: 'Latin', sense: 'sleep',
    examples: [
      { word: 'insomnia', gloss: 'a repeated inability to fall asleep' },
      { word: 'somnolent', gloss: 'feeling drowsy and close to sleep' },
      { word: 'somnambulist', gloss: 'a person who walks while still asleep' },
    ],
  },
  {
    id: 'wk-root-ver', chapter: CH, concepts: LATIN, band: 4,
    form: 'ver-', kind: 'root', origin: 'Latin', sense: 'true',
    examples: [
      { word: 'verify', gloss: 'to check that something is true' },
      { word: 'veracity', gloss: 'the quality of being truthful' },
      { word: 'veritable', gloss: 'rightly named, genuinely deserving the title' },
    ],
  },
  {
    id: 'wk-root-xen', chapter: CH, concepts: GREEK, band: 4,
    form: 'xen-', kind: 'root', origin: 'Greek', sense: 'stranger, foreigner',
    examples: [
      { word: 'xenophobia', gloss: 'a fear or dislike of strangers or foreigners' },
      { word: 'xenophile', gloss: 'someone drawn to foreign people and cultures' },
    ],
  },
  {
    id: 'wk-root-path', chapter: CH, concepts: GREEK, band: 4,
    form: 'path-', kind: 'root', origin: 'Greek', sense: 'feeling, suffering',
    examples: [
      { word: 'empathy', gloss: 'the ability to understand what another person is feeling' },
      { word: 'sympathy', gloss: 'a feeling of care for someone who is suffering' },
      { word: 'pathetic', gloss: 'arousing pity through weakness or suffering' },
    ],
  },
  {
    id: 'wk-root-ortho', chapter: CH, concepts: GREEK, band: 4,
    form: 'ortho-', kind: 'root', origin: 'Greek', sense: 'straight, correct',
    examples: [
      { word: 'orthodox', gloss: 'following the correct or traditional beliefs' },
      { word: 'orthopedic', gloss: 'relating to the correction of bone and joint problems' },
      { word: 'orthodontist', gloss: 'a dentist who straightens teeth' },
    ],
  },
]);

for (const band of [2, 3, 4]) {
  morphemeTemplates({ chapter: CH, band, idBase: `wk-02-b${band}`, name: 'Roots' });
}

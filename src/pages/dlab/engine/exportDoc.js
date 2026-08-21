// The two standalone documents a sitting can be exported as: the written test
// with its answer key, and the audio drill's read-aloud script.
//
// These exist so a sitting is not trapped in the app. The written export is a
// complete, self-contained quiz — rules, word list, questions, then the key with
// the step-by-step logic — printable or pasteable anywhere. The audio export is
// TTS-ready plain text for anyone who wants to run it through their own voice.
//
// Both are generated from the same test object the UI renders, so a document can
// never disagree with what the app showed.

import { poolItems } from './buildTest.js';
import { audioScriptToText } from './audioScript.js';

const TIER_LABEL = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
  extreme: 'EXTREME',
};

function ruleSheet(test) {
  const lines = [];
  lines.push('## The language', '');
  for (const s of test.brief.sections) {
    if (s.ruleId === 'vocabulary') continue;
    lines.push(`### ${s.title}`, '', s.body, '');
    if (s.examples.length) {
      lines.push('```');
      for (const ex of s.examples) lines.push(ex);
      lines.push('```', '');
    }
  }
  return lines;
}

function wordList(test) {
  const lines = ['## Word list', ''];
  const byPos = {};
  for (const v of test.brief.vocabulary) (byPos[v.pos] ||= []).push(v);

  for (const [pos, words] of Object.entries(byPos)) {
    lines.push(`**${pos}**`, '', '| English | Word | Syllables |', '|---|---|---|');
    for (const w of words) lines.push(`| ${w.meaning} | ${w.form} | ${w.syllabified} |`);
    lines.push('');
  }

  if (test.markers.length) {
    lines.push('## Grammatical markers', '', '| Meaning | Form |', '|---|---|');
    for (const m of test.markers) lines.push(`| ${m.label} | ${m.form} |`);
    lines.push('');
  }
  return lines;
}

// Prompts carry newlines and indented sentence blocks for on-screen layout.
// In Markdown a bare indented block becomes a code fence, so the embedded
// sentence is emitted as one deliberately rather than by accident.
function promptToMarkdown(prompt) {
  const parts = prompt.split('\n').map((l) => l.trim()).filter((l) => l !== '');
  return parts
    .map((line, i) => (i > 0 && !line.endsWith('.') && !line.endsWith('?') && !/^(Write|Rewrite|Then)/.test(line)
      ? `\n    ${line}\n`
      : line))
    .join('\n\n');
}

function questionBlock(items, heading) {
  const lines = [`## ${heading}`, ''];
  let lastTier = null;
  for (const it of items) {
    if (it.tier !== lastTier) {
      lines.push(`### ${TIER_LABEL[it.tier]}`, '');
      lastTier = it.tier;
    }
    lines.push(`**${it.index}.** ${promptToMarkdown(it.prompt)}`, '');
    if (it.scene) {
      lines.push(`> *Picture: ${describeScene(it.scene)}*`, '');
    }
    if (it.spoken) {
      lines.push(`> *Spoken aloud:* \`${it.spoken}\``, '');
    }
    lines.push('    Answer: ______________________________', '');
  }
  return lines;
}

// Pictorial items are never definite — see buildPictorial. A text export of the
// picture therefore never needs an article, which is what keeps the exported
// document answerable without the picture in front of you.
/** Plain-English description of a pictorial item's scene, for the text export. */
export function describeScene(scene) {
  const bits = [scene.count > 1 ? String(scene.count) : 'one'];
  if (scene.size) bits.push(scene.size);
  if (scene.color) bits.push(scene.color);
  bits.push(scene.count > 1 ? `${scene.noun}s` : scene.noun);
  return bits.join(' ');
}

function answerKey(test) {
  const lines = ['---', '', '# Answer key', '',
    'Each answer is followed by the rules that produce it, in the order they apply.', ''];

  for (const it of test.items) {
    lines.push(`### ${it.index}. ${TIER_LABEL[it.tier]} · ${it.pool} · ${it.type}`, '');
    lines.push(`**Answer:** \`${it.answer}\``, '');
    if (it.alternates?.length) {
      lines.push(`Also accepted: ${it.alternates.map((a) => `\`${a}\``).join(', ')}`, '');
    }
    if (it.trace?.length) {
      const steps = dedupeTrace(it.trace);
      for (let i = 0; i < steps.length; i++) {
        lines.push(`${i + 1}. **${steps[i].label}** — ${steps[i].detail}`);
      }
      lines.push('');
    }
  }
  return lines;
}

/**
 * Collapses runs of identical consecutive trace steps.
 *
 * A morphophonological rule genuinely fires at every affix boundary, so a
 * five-affix word emits the same "sound change at the join" note five times.
 * That is accurate but unreadable — the run is collapsed with a count so the
 * explanation stays honest about how many times it applied.
 */
export function dedupeTrace(trace) {
  const out = [];
  for (const step of trace) {
    const prev = out[out.length - 1];
    if (prev && prev.label === step.label && prev.detail === step.detail) {
      prev.repeats = (prev.repeats || 1) + 1;
      prev.detail = `${step.detail} (applies ${prev.repeats}×)`;
      prev.baseDetail = step.detail;
      continue;
    }
    out.push({ ...step, baseDetail: step.detail });
  }
  return out;
}

/**
 * The written test as a complete standalone Markdown document.
 * @param {object} test
 * @param {{includeKey?: boolean}} [opts]
 * @returns {string}
 */
export function writtenTestToMarkdown(test, { includeKey = true } = {}) {
  const written = poolItems(test, 'written');
  const audio = poolItems(test, 'audio');

  const lines = [
    '# DLAB Practice Test',
    '',
    `**Language code:** \`${test.seedCode}\`  ·  **Written:** ${written.length}  ·  **Audio:** ${audio.length}`,
    '',
    'Every question is open response. Nothing is multiple choice — produce each',
    'answer yourself. Read the rules and the word list first; everything you need',
    'to answer is in them.',
    '',
    'This language is generated fresh for every test. Nothing here carries over.',
    '',
    '---',
    '',
    ...ruleSheet(test),
    '---',
    '',
    ...wordList(test),
    '---',
    '',
  ];

  if (written.length) lines.push(...questionBlock(written, 'Written questions'));
  if (audio.length) {
    lines.push(
      '---',
      '',
      '## Audio questions',
      '',
      'These are meant to be **heard, not read**. The spoken form is printed under',
      'each one only so this document stays self-contained — cover it, or use the',
      'audio script export instead.',
      '',
      ...questionBlock(audio, 'Audio questions').slice(2),
    );
  }

  if (includeKey) lines.push(...answerKey(test));
  return lines.join('\n');
}

/**
 * The audio drill as a TTS-ready plain-text script.
 * @param {object} test
 * @returns {string}
 */
export function audioDrillToText(test) {
  return audioScriptToText(test);
}

/**
 * @param {object} test
 * @param {'written'|'audio'} which
 * @returns {{filename: string, mime: string, body: string}}
 */
export function exportFile(test, which) {
  if (which === 'audio') {
    return {
      filename: `dlab-${test.seedCode}-audio-script.txt`,
      mime: 'text/plain',
      body: audioDrillToText(test),
    };
  }
  return {
    filename: `dlab-${test.seedCode}-test.md`,
    mime: 'text/markdown',
    body: writtenTestToMarkdown(test),
  };
}

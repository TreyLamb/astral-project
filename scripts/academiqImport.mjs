// Turn an AcademiQ capture into readable per-chapter markdown.
//
//   npm run academiq:import                       reads ~/Downloads/academiq-capture.json
//   npm run academiq:import -- --from <file>
//   npm run academiq:import -- --out "<dir>"
//
// STRUCTURE (confirmed against the real capture 2026-09-02):
//   courses[0].detail.chapters[]           10 chapters
//                     .sections[]          55 sections total
//                       .title / .content  content is HTML, ~861k chars in all
//                       .hasCheckpoint     a graded checkpoint sits on the section
//                       .quizUrl           null throughout this capture
// The sections are INLINE in the course detail, so no /api/sections/:id call is needed - the
// earlier scripts fetched them separately and found none, because the ids live under `chapters`
// rather than under any key matching /section/i.
//
// Images are referenced as /api/storage/objects/uploads/<uuid>.png and are NOT downloaded here;
// they need the session cookie. Links are rewritten to absolute URLs so they at least resolve in
// a browser where Trey is logged in.
//
// HOW THE CONTENT MAY BE USED (Trey, 2026-09-02): private repo, private deployment, audience is
// him and his study group, on his own enrolled course. "Ruler, not corpus" forbids mirroring the
// book wholesale into the REPO; it does not forbid quoting. Exact definitions, exact terminology
// and real quiz questions must stay exact in a study guide. Full rule: courses/AGENT-PROMPT.md
// section 2 rule 5. Output goes to the Drive folder, not the repo.

import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://learn-ai-danielscott26.replit.app';
const DEFAULT_OUT = 'G:/My Drive/SupplementalCourseDocs/CHEM 1210/_academiq';

const argv = process.argv.slice(2);
const arg = (f, d = null) => {
  const i = argv.indexOf(f);
  return i === -1 ? d : (argv[i + 1] ?? d);
};

const FROM = arg('--from', path.join(process.env.USERPROFILE ?? process.env.HOME ?? '.', 'Downloads', 'academiq-capture.json'));
const OUT = arg('--out', DEFAULT_OUT);

if (!fs.existsSync(FROM)) {
  console.error(`Capture not found: ${FROM}`);
  console.error('Run scripts/browser/academiqCapture.js in the book tab first, or pass --from <file>.');
  process.exit(1);
}

const cap = JSON.parse(fs.readFileSync(FROM, 'utf8'));
const course = cap.courses?.[0];
const chapters = course?.detail?.chapters ?? [];
if (!chapters.length) {
  console.error('No chapters in that capture. Expected courses[0].detail.chapters[].');
  process.exit(1);
}

const slug = (s) => String(s).toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

/**
 * HTML -> markdown. Deliberately small: this content is prose, headings, lists, tables and
 * images, and pulling in a parser for that is not worth the dependency. Order matters -
 * block-level replacements run before the catch-all tag strip.
 */
function html2md(html) {
  if (!html) return '';
  let s = String(html);

  // Images first, so their src survives the tag strip.
  s = s.replace(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi,
    (_, src, alt) => `\n\n![${alt || 'figure'}](${src.startsWith('/') ? BASE + src : src})\n\n`);
  s = s.replace(/<img[^>]*src="([^"]+)"[^>]*>/gi,
    (_, src) => `\n\n![figure](${src.startsWith('/') ? BASE + src : src})\n\n`);

  s = s.replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, text) => `[${text.replace(/<[^>]+>/g, '').trim()}](${href.startsWith('/') ? BASE + href : href})`);

  s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `\n\n# ${t.replace(/<[^>]+>/g, '').trim()}\n\n`);
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `\n\n## ${t.replace(/<[^>]+>/g, '').trim()}\n\n`);
  s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `\n\n### ${t.replace(/<[^>]+>/g, '').trim()}\n\n`);
  s = s.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, t) => `\n\n#### ${t.replace(/<[^>]+>/g, '').trim()}\n\n`);

  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => `**${t.replace(/<[^>]+>/g, '').trim()}**`);
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => `*${t.replace(/<[^>]+>/g, '').trim()}*`);
  s = s.replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, '$1');
  s = s.replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, '^$1');

  s = s.replace(/<li[^>]*>/gi, '\n- ').replace(/<\/li>/gi, '');
  s = s.replace(/<\/(ul|ol)>/gi, '\n');
  s = s.replace(/<tr[^>]*>/gi, '\n| ').replace(/<\/t[dh]>\s*<t[dh][^>]*>/gi, ' | ');
  s = s.replace(/<\/tr>/gi, ' |').replace(/<t[dh][^>]*>/gi, '').replace(/<\/t[dh]>/gi, '');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>/gi, '\n\n');

  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;|&rsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–').replace(/&deg;/g, '°').replace(/&times;/g, '×').replace(/&rarr;/g, '→');

  return s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

fs.mkdirSync(OUT, { recursive: true });

const index = [`# ${course.detail.title ?? 'AcademiQ'} — book index`,
  `_Imported ${new Date().toISOString().slice(0, 10)} from AcademiQ. ${chapters.length} chapters._`,
  '', '| # | Chapter | Sections | Chars |', '|---|---|---|---|'];

let totalSections = 0;
let totalChars = 0;

for (const ch of chapters) {
  const secs = ch.sections ?? [];
  const num = String((ch.order ?? 0) + 1).padStart(2, '0');
  const file = `ch${num}-${slug(ch.title.replace(/^Chapter\s*\d+:\s*/i, ''))}.md`;

  const lines = [`# ${ch.title}`];
  if (ch.description) lines.push('', `_${ch.description}_`);

  let chars = 0;
  for (const s of secs) {
    const body = html2md(s.content);
    chars += body.length;
    lines.push('', '---', '', `## ${s.title}`);
    if (s.hasCheckpoint) lines.push('', '> ⚑ **Graded checkpoint on this section.**');
    lines.push('', body);
  }

  fs.writeFileSync(path.join(OUT, file), lines.join('\n') + '\n');
  index.push(`| ${num} | [${ch.title}](${file}) | ${secs.length} | ${(chars / 1000).toFixed(0)}k |`);
  totalSections += secs.length;
  totalChars += chars;
  console.log(`  ${file.padEnd(46)} ${String(secs.length).padStart(2)} sections  ${(chars / 1000).toFixed(0)}k`);
}

index.push('', `**${chapters.length} chapters · ${totalSections} sections · ${(totalChars / 1000).toFixed(0)}k characters**`);
index.push('', 'Figures are linked back to AcademiQ and need a logged-in browser to render.');
fs.writeFileSync(path.join(OUT, 'INDEX.md'), index.join('\n') + '\n');

fs.writeFileSync(path.join(OUT, 'book.json'), JSON.stringify({
  importedAt: new Date().toISOString(),
  courseId: course.detail.id,
  title: course.detail.title,
  chapters: chapters.map((ch) => ({
    id: ch.id, order: ch.order, title: ch.title,
    sections: (ch.sections ?? []).map((s) => ({
      id: s.id, order: s.order, title: s.title, hasCheckpoint: !!s.hasCheckpoint, chars: (s.content ?? '').length,
    })),
  })),
}, null, 2) + '\n');

console.log(`\n${chapters.length} chapters, ${totalSections} sections, ${(totalChars / 1000).toFixed(0)}k chars`);
console.log(`Wrote ${OUT}`);
console.log('\nNext:  npm run courses:scan');

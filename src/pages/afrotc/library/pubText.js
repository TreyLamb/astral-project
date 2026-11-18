// Turns a publication's extracted page text into searchable sections. Pure; used by scripts/afrotcPubs.mjs and
// tested in pubText.test.js.
//
// Air Force publications number every paragraph (1.10., 3.2.1.), so a section is one numbered paragraph and a
// search hit can name it ("DAFI 36-2903 para 3.1.2, page 19"). A document without that numbering (a detachment
// manual, a handbook) falls back to one section per page.

const MONTH = '(?:JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)';
// "AFROTCI36-2011V3   13 JANUARY 2025   13" and "4 DAFI36-2903 29 FEBRUARY 2024": the running header on every page.
const RUNNING_HEAD = new RegExp(`^\\s*(\\d+\\s+)?[A-Z][A-Za-z0-9_-]{2,40}(\\s+[A-Z]{2,10})?\\s+\\d{1,2}\\s+${MONTH}\\s+\\d{4}(\\s+\\d+)?\\s*$`);
const PAGE_NUMBER = /^\s*(page\s+)?\d{1,4}(\s+of\s+\d{1,4})?\s*$/i;
const TOC_LINE = /(\.\s?){6,}\s*\d*\s*$/;
const PARA = /^(\d{1,2}(?:\.\d{1,3}){1,6})\.\s+(\S.*)$/;
const CHAPTER = /^(Chapter|CHAPTER)\s+(\d{1,2})\b\s*[—–-]?\s*(.*)$/;
const ATTACHMENT = /^(Attachment|ATTACHMENT)\s+(\d{1,2})\b\s*[—–-]?\s*(.*)$/;
const SECTION_HEAD = /^Section\s+\d{1,2}[A-Z]?\s*[—–-]\s*\S.*$/;
// A real heading's title is in capitals ("GROOMING AND APPEARANCE STANDARDS"); a sentence that happens to start a line
// with "Chapter 4" or "Attachment 10" is a cross-reference and is not.
const isCapsTitle = (s) => {
  const letters = String(s).replace(/[^A-Za-z]/g, '');
  return letters.length >= 3 && /^[A-Z(]/.test(s.trim()) && letters.replace(/[^A-Z]/g, '').length / letters.length >= 0.8;
};
const LIST_START = /^(\d{1,2}\.|[a-z]\.|\(\d{1,2}\)|\([a-z]\)|[•▪●◦-]|Table\s+\d|Figure\s+\d|Note:|NOTE:)\s/;
const MAX_SECTION = 6000;

export function cleanLines(pageText) {
  return String(pageText ?? '')
    .replace(/\t+/g, ' ')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l.trim() && !RUNNING_HEAD.test(l) && !PAGE_NUMBER.test(l) && !TOC_LINE.test(l));
}

function appendLine(text, line) {
  const l = line.trim();
  if (!text) return l;
  if (LIST_START.test(l)) return `${text}\n${l}`;
  if (/[A-Za-z]-$/.test(text) && /^[a-z]/.test(l)) return text.slice(0, -1) + l;
  return `${text} ${l}`;
}

/** "Commander (AFROTC/CC). Commanders hold..." -> "Commander (AFROTC/CC)". Falls back to the opening words. */
export function titleOf(text) {
  const m = /^([A-Z][^.]{1,90}?)\.(\s|$)/.exec(text);
  if (m && m[1].split(/\s+/).length <= 12) return m[1].trim();
  const words = text.split(/\s+/).slice(0, 10).join(' ');
  return words.length < text.length ? `${words} …` : words;
}

function splitLong(sec) {
  if (sec.text.length <= MAX_SECTION) return [sec];
  const out = [];
  let rest = sec.text;
  let part = 0;
  while (rest.length) {
    let cut = rest.length <= MAX_SECTION ? rest.length : rest.lastIndexOf(' ', MAX_SECTION);
    if (cut <= 0) cut = MAX_SECTION;
    out.push({ ...sec, title: part ? `${sec.title} (continued)` : sec.title, text: rest.slice(0, cut).trim() });
    rest = rest.slice(cut).trim();
    part += 1;
  }
  return out;
}

function byParagraph(pages) {
  const sections = [];
  let cur = { para: null, title: 'Cover, summary of changes and contents', where: '', page: 1, text: '' };
  let chapter = '';
  let pendingChapterTitle = false;
  const push = () => { if (cur.text.trim()) sections.push(cur); };
  pages.forEach((pageText, i) => {
    const page = i + 1;
    for (const line of cleanLines(pageText)) {
      const t = line.trim();
      if (pendingChapterTitle) {
        pendingChapterTitle = false;
        if (!PARA.test(t) && t.length < 120 && isCapsTitle(t)) { chapter = `${chapter}: ${t}`; cur.title = chapter; continue; }
      }
      const ch = CHAPTER.exec(t) || ATTACHMENT.exec(t);
      // "Chapter 2 ROLES AND RESPONSIBILITIES 14" is a contents line (it ends in a page number): not a heading.
      if (ch && (ch[3] ? isCapsTitle(ch[3]) && !/\s\d{1,3}$/.test(ch[3]) : true)) {
        push();
        chapter = `${ch[1][0].toUpperCase()}${ch[1].slice(1).toLowerCase()} ${ch[2]}${ch[3] ? `: ${ch[3]}` : ''}`;
        pendingChapterTitle = !ch[3];
        cur = { para: null, title: chapter, where: '', page, text: '' };
        continue;
      }
      if (SECTION_HEAD.test(t)) continue;
      const m = PARA.exec(t);
      if (m) {
        push();
        cur = { para: m[1], title: '', where: chapter, page, text: m[2] };
        continue;
      }
      cur.text = appendLine(cur.text, t);
    }
  });
  push();
  return sections.map((s) => ({ ...s, title: s.title || titleOf(s.text) }));
}

function byPage(pages) {
  return pages.map((pageText, i) => {
    const lines = cleanLines(pageText);
    const text = lines.reduce(appendLine, '');
    const first = lines.find((l) => l.trim().length > 3)?.trim() ?? '';
    return { para: null, title: first.length > 80 ? `${first.slice(0, 80)} …` : first || `Page ${i + 1}`, where: '', page: i + 1, text };
  }).filter((s) => s.text.trim());
}

/** pages: one string per PDF page. Returns { mode, sections: [{ id, para, title, where, page, text }] }. */
export function splitPublication(pages) {
  const numbered = pages.reduce((n, p) => n + cleanLines(p).filter((l) => PARA.test(l.trim())).length, 0);
  const mode = numbered >= pages.length * 0.6 ? 'paragraphs' : 'pages';
  const raw = mode === 'paragraphs' ? byParagraph(pages) : byPage(pages);
  const sections = raw.flatMap(splitLong).map((s, i) => ({ id: `s${i}`, ...s }));
  return { mode, sections };
}

/** How a section is named in a result or citation: "para 3.1.2, page 19" or "page 19". */
export const sectionRef = (s) => (s.para ? `para ${s.para}, page ${s.page}` : `page ${s.page}`);

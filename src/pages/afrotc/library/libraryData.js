// Loads the publications' text (public/afrotc/pubs/<slug>.json) on demand and turns it into search entries.
// Nothing is fetched until someone opens a publication or starts searching.
import { PUBS } from './pubCatalog.js';
import status from './pubStatus.json';
import { sectionRef } from './pubText.js';

export const isHosted = (slug) => Boolean(status[slug]);
export const hostedInfo = (slug) => status[slug] ?? null;
export const pdfUrl = (slug, page) => {
  const s = status[slug];
  if (!s) return null;
  return page ? `${s.pdf}#page=${page}` : s.pdf;
};

const cache = new Map();
export function loadPub(slug) {
  if (!cache.has(slug)) {
    cache.set(slug, fetch(`/afrotc/pubs/${slug}.json`).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).catch((e) => { cache.delete(slug); throw e; }));
  }
  return cache.get(slug);
}

export const sectionAnchor = (sid) => `lib-${sid}`;

/** The section a citation points at: the first with that paragraph number, else the first on that page. */
export function findSection(sections, { para, page }) {
  if (para) {
    const hit = sections.find((s) => s.para === para);
    if (hit) return hit;
  }
  if (page) return sections.find((s) => s.page >= Number(page)) ?? null;
  return null;
}

let ENTRIES = null;
export function getLibraryEntries() {
  if (ENTRIES) return ENTRIES;
  const hosted = PUBS.filter((p) => isHosted(p.slug) && status[p.slug].sections > 0);
  ENTRIES = Promise.all(hosted.map((p) => loadPub(p.slug).then((d) => ({ p, d })).catch(() => null))).then((all) => {
    const out = [];
    for (const item of all) {
      if (!item) continue;
      const { p, d } = item;
      for (const s of d.sections) {
        out.push({
          id: `lib:${p.slug}:${s.id}`, slug: 'library', group: p.id,
          title: `${s.para ? `${s.para} ` : ''}${s.title}`,
          where: [sectionRef(s), s.where].filter(Boolean).join(' · '),
          text: s.text, at: sectionAnchor(s.id), extra: { p: p.slug },
          href: pdfUrl(p.slug, s.page), hrefLabel: `PDF, page ${s.page}`,
          weight: p.superseded ? -3 : p.official === false ? -1 : 0,
        });
      }
    }
    return out;
  });
  return ENTRIES;
}

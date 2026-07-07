/**
 * tagTaxonomy.js — Canonical tag registry and mapping functions for TKB.
 * Maps question patterns from various sources (OpenTDB, Trivia API, MMLU) to a canonical tag set.
 */

/**
 * CANONICAL_STYLE_TAGS: Registry of question pattern tags.
 * These describe the SHAPE of a question, not the subject matter.
 */
export const CANONICAL_STYLE_TAGS = [
  'date',
  'definition',
  'formula',
  'calculation',
  'translation',
  'capital-city',
  'count',
  'fact',
  'person',
  'event',
  'location',
  'comparison',
  'classification',
  'sequence',
  'measurement',
  'vocabulary',
  'multiple-choice-source',
  'true-false-style',
  'cause-effect',
  'identification',
  'author',
  'title',
  'year',
  'equation',
  'list',
  'acronym',
  'abbreviation',
  'example',
  'principle',
  'quotation',
];

/**
 * normalizeTag: Utility to lowercase, replace underscores/spaces with hyphens, trim.
 */
export function normalizeTag(tag) {
  return tag.toLowerCase().replace(/[_\s]+/g, '-').trim();
}

/**
 * mapOpenTdbCategoryToTags: Maps OpenTDB category strings to 1-3 canonical tags.
 * OpenTDB categories include things like "Entertainment: Video Games", "Science: Mathematics", etc.
 */
export function mapOpenTdbCategoryToTags(category) {
  const categoryMap = {
    'general knowledge': ['fact'],
    'entertainment: books': ['identification', 'author', 'title'],
    'entertainment: film': ['identification', 'person', 'fact'],
    'entertainment: music': ['identification', 'person', 'year'],
    'entertainment: musicals & theatres': ['identification', 'person'],
    'entertainment: television': ['identification', 'person', 'fact'],
    'entertainment: video games': ['identification', 'person', 'fact'],
    'entertainment: board games': ['identification', 'fact'],
    'entertainment: comics': ['identification', 'person', 'author'],
    'entertainment: japanese anime & manga': ['identification', 'person', 'author'],
    'entertainment: cartoon & animations': ['identification', 'person'],
    'science & nature': ['fact', 'definition', 'measurement'],
    'science: computers': ['definition', 'acronym', 'fact'],
    'science: mathematics': ['calculation', 'formula', 'equation'],
    'science: gadgets': ['definition', 'identification', 'fact'],
    'mythology': ['person', 'event', 'fact'],
    'sports': ['person', 'event', 'year', 'measurement'],
    'geography': ['location', 'capital-city', 'fact'],
    'history': ['event', 'date', 'person', 'fact'],
    'politics': ['person', 'event', 'fact'],
    'art': ['identification', 'person', 'author', 'year'],
    'celebrities': ['person', 'identification', 'fact'],
    'animals': ['classification', 'fact', 'definition'],
    'vehicles': ['identification', 'classification', 'fact'],
  };

  const normalized = category.toLowerCase();
  return categoryMap[normalized] || ['fact'];
}

/**
 * mapTriviaApiTagsToCanonical: Maps Trivia API native tags to 1-3 canonical tags.
 * Trivia API tags are lowercase, sometimes with underscores/hyphens.
 * Strategy: map known ones, pass through already-canonical ones, normalize + include unrecognized.
 */
export function mapTriviaApiTagsToCanonical(nativeTags) {
  const tagMapping = {
    'geography': 'location',
    'cities': 'location',
    'countries': 'location',
    'usa': 'location',
    'languages': 'translation',
    'songs': 'identification',
    'one_hit_wonders': 'identification',
    'music': 'identification',
    'movies': 'identification',
    'films': 'identification',
    'actors': 'person',
    'history': 'event',
    'science': 'fact',
    'general_knowledge': 'fact',
    'animals': 'classification',
    'vehicles': 'identification',
    'sports': 'fact',
    'food': 'identification',
    'television': 'identification',
    'cartoons': 'identification',
    'games': 'identification',
    'comics': 'identification',
    'celebrities': 'person',
    'books': 'identification',
    'authors': 'person',
    'years': 'year',
    'dates': 'date',
    'events': 'event',
    'math': 'calculation',
    'mathematics': 'calculation',
    'physics': 'measurement',
    'chemistry': 'definition',
    'biology': 'classification',
    'law': 'definition',
    'medicine': 'definition',
    'technology': 'fact',
    'computer_science': 'definition',
    'engineering': 'definition',
  };

  const normalized = Array.isArray(nativeTags) ? nativeTags : [];
  const mapped = [];
  const seen = new Set();

  for (const tag of normalized) {
    if (mapped.length >= 3) break; // Cap at 3

    const lower = tag.toLowerCase();

    // Check if it maps to a canonical tag
    if (tagMapping[lower]) {
      const canonical = tagMapping[lower];
      if (!seen.has(canonical)) {
        mapped.push(canonical);
        seen.add(canonical);
      }
    }
    // Check if the tag is already canonical
    else if (CANONICAL_STYLE_TAGS.includes(lower)) {
      if (!seen.has(lower)) {
        mapped.push(lower);
        seen.add(lower);
      }
    }
    // Otherwise normalize and include as-is
    else {
      const normalized = normalizeTag(tag);
      if (!seen.has(normalized)) {
        mapped.push(normalized);
        seen.add(normalized);
      }
    }
  }

  return mapped.length > 0 ? mapped : ['fact'];
}

/**
 * mapMmluSubjectToTags: Maps MMLU subject slugs to 1-2 canonical tags.
 * Uses simple string matching on the slug.
 */
export function mapMmluSubjectToTags(subjectSlug) {
  const slug = subjectSlug.toLowerCase();

  if (slug.includes('algebra') || slug.includes('calculus') || slug.includes('math') || slug.includes('statistics')) {
    return ['calculation', 'formula'];
  }
  if (slug.includes('law') || slug.includes('medicine') || slug.includes('engineering') || slug.includes('accounting') || slug.includes('psychology')) {
    return ['definition'];
  }
  if (slug.includes('history')) {
    return ['event', 'date'];
  }
  if (slug.includes('biology') || slug.includes('chemistry') || slug.includes('physics')) {
    return ['definition', 'measurement'];
  }
  if (slug.includes('geography') || slug.includes('world')) {
    return ['location', 'fact'];
  }

  return ['fact'];
}

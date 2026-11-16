import rawData from './concordance.json';

export interface ConcordanceEntry {
  snippet: string;
  book: string;
  chapter: number;
  verse: number;
}

export interface ConcordanceTerm {
  term: string;
  entries: ConcordanceEntry[];
}

export interface ConcordanceCategory {
  id: string;
  name: string;
  terms: ConcordanceTerm[];
}

export const CONCORDANCE_CATEGORIES: ConcordanceCategory[] = (rawData as { categories: ConcordanceCategory[] }).categories;

/** Normalizes text by lowercasing and stripping accents for quick search matching. */
export function normalizeQuery(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Finds terms across all categories matching a search query. */
export function searchTerms(query: string): { category: ConcordanceCategory; term: ConcordanceTerm }[] {
  const q = normalizeQuery(query);
  if (!q) return [];
  const results: { category: ConcordanceCategory; term: ConcordanceTerm }[] = [];
  for (const cat of CONCORDANCE_CATEGORIES) {
    for (const term of cat.terms) {
      if (normalizeQuery(term.term).includes(q)) {
        results.push({ category: cat, term });
      }
    }
  }
  return results;
}

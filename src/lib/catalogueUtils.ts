import { Product } from '@/types';

/**
 * Extracts integer number from product codes (e.g. 'F1' -> 1, 'F-12' -> 12, 'F99' -> 99)
 */
export function getProductCodeNumber(code: string): number {
  if (!code) return 0;
  const match = code.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Formats a product code to clean F{number} format without hyphens (e.g. 'F-1' -> 'F1')
 */
export function formatProductCode(code: string): string {
  if (!code) return '';
  const num = getProductCodeNumber(code);
  return num > 0 ? `F${num}` : code.replace(/^F-?/i, 'F');
}

/**
 * Sorts products in strict natural numeric order: F1, F2, F3, ..., F10, F11, ..., F99
 */
export function sortProductsNaturally<T extends { code: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const numA = getProductCodeNumber(a.code);
    const numB = getProductCodeNumber(b.code);
    if (numA !== numB) {
      return numA - numB;
    }
    return a.code.localeCompare(b.code);
  });
}

/**
 * Robust search query matcher that supports both 'F1' and 'F-1', synonyms, sizes, etc.
 */
export function matchesProductSearch(product: Product, rawQuery: string): boolean {
  if (!rawQuery || !rawQuery.trim()) return true;
  const query = rawQuery.toLowerCase().trim();
  const strippedQuery = query.replace(/[^a-z0-9]/g, '');
  const strippedCode = (product.code || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const matchesCode =
    (product.code || '').toLowerCase().includes(query) ||
    (strippedQuery.length > 0 && strippedCode.includes(strippedQuery));

  const matchesName = (product.name || '').toLowerCase().includes(query);
  const matchesCategory = (product.category || '').toLowerCase().includes(query);
  const matchesMaterial = (product.material || '').toLowerCase().includes(query);
  const matchesStandard = (product.standard || '').toLowerCase().includes(query);
  const matchesSizeMm = (product.sizeMm || '').toLowerCase().includes(query);
  const matchesSizeInch = (product.sizeInch || '').toLowerCase().includes(query);
  const matchesTags = (product.tags || []).some((t: string) => t.toLowerCase().includes(query));

  // Intelligent synonyms
  const matchesSynonyms =
    (query.includes('one inch') && (product.sizeInch?.includes('1"') || product.tags?.includes('1 inch'))) ||
    (query.includes('half inch') && (product.sizeInch?.includes('1/2"') || product.tags?.includes('1/2 inch'))) ||
    (query.includes('hot water') && product.material === 'CPVC');

  return (
    matchesCode ||
    matchesName ||
    matchesCategory ||
    matchesMaterial ||
    matchesStandard ||
    matchesSizeMm ||
    matchesSizeInch ||
    matchesTags ||
    matchesSynonyms
  );
}

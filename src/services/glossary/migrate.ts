import { type Glossary, type GlossaryItem } from '@/types/glossary';
import { detectGlossaryLanguage } from '@/services/utils/language';
import { validateGlossaryItem } from '@/services/glossary/validator';

/**
 * Drop malformed terms from a persisted glossary.
 *
 * Earlier versions persisted AI-extracted terms without type validation, so a
 * corrupt `term` (e.g. a nested {term, translation, notes} object) can already
 * live on disk and crashes every session it is merged/rendered (MIOSUB-76/6Y).
 * This cleans such items on load so the fix is retroactive, not just forward.
 */
export function sanitizeGlossaryTerms(glossary: Glossary): {
  glossary: Glossary;
  changed: boolean;
} {
  const terms = Array.isArray(glossary.terms) ? glossary.terms : [];
  const cleaned: GlossaryItem[] = [];
  for (const t of terms) {
    const valid = validateGlossaryItem(t);
    if (valid) cleaned.push(valid);
  }
  const changed = cleaned.length !== terms.length;
  return changed ? { glossary: { ...glossary, terms: cleaned }, changed } : { glossary, changed };
}

/**
 * Migrate a glossary to include targetLanguage if missing.
 *
 * - If targetLanguage is already set, returns as-is.
 * - If glossary has terms, detects language from translations via ELD.
 * - If glossary is empty, uses the provided fallback language.
 */
export function migrateGlossaryLanguage(glossary: Glossary, fallbackLanguage?: string): Glossary {
  if (glossary.targetLanguage) return glossary;

  const detectedLanguage =
    glossary.terms.length > 0 ? detectGlossaryLanguage(glossary) : fallbackLanguage || 'en';

  return { ...glossary, targetLanguage: detectedLanguage };
}

/**
 * Migrate all glossaries in-place. Returns the array and whether any were changed.
 */
export function migrateAllGlossaries(
  glossaries: Glossary[],
  fallbackLanguage?: string
): { glossaries: Glossary[]; changed: boolean } {
  let changed = false;
  const result = glossaries.map((g) => {
    let current = g;

    // 1. Sanitize malformed terms (runs regardless of targetLanguage state).
    const sanitized = sanitizeGlossaryTerms(current);
    if (sanitized.changed) {
      current = sanitized.glossary;
      changed = true;
    }

    // 2. Backfill targetLanguage for legacy glossaries.
    if (!current.targetLanguage) {
      current = migrateGlossaryLanguage(current, fallbackLanguage);
      changed = true;
    }

    return current;
  });
  return { glossaries: result, changed };
}

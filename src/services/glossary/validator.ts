import { type GlossaryItem } from '@/types/glossary';

/**
 * Validate and clean glossary item
 */
export function validateGlossaryItem(item: GlossaryItem): GlossaryItem | null {
  // Defensive: LLM / third-party API responses can violate the declared string
  // schema (e.g. `term` arriving as a nested {term, translation, notes} object or
  // a number). `?.` only guards null/undefined, so a non-string here would still
  // throw on `.trim()`. Coerce strictly: only genuine strings survive.
  const term = typeof item?.term === 'string' ? item.term.trim() : '';
  const translation = typeof item?.translation === 'string' ? item.translation.trim() : '';

  if (!term || !translation) {
    return null;
  }

  return {
    term,
    translation,
    notes: typeof item?.notes === 'string' ? item.notes.trim() || undefined : undefined,
  };
}

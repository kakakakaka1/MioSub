/**
 * Sanitizers for user-entered credentials and API endpoints.
 *
 * These guard the two failure modes seen in production (see the 2026-06 user
 * behavior report, §6.7):
 *   1. Keys pasted with surrounding non-ASCII text crash `fetch()` with
 *      "String contains non ISO-8859-1 code point" when placed in an
 *      Authorization header.
 *   2. Endpoints pasted with stray whitespace (e.g. "yunwu.ai  https://…")
 *      or a trailing version segment produce malformed request URLs.
 */

/**
 * Strip characters that break HTTP header construction from an API key.
 *
 * API keys are always printable ASCII (`[A-Za-z0-9_-]` plus a little
 * punctuation for relay keys). When a user pastes a key together with
 * surrounding text (e.g. "密钥: sk-abc123" or a full-width space), the extra
 * characters survive a plain `.trim()` and later crash `fetch()` in the
 * Authorization header. Removing every code point outside printable ASCII
 * (0x21–0x7E) — which also drops all whitespace — is safe for every real key.
 */
export function sanitizeApiKey(raw: string): string {
   
  return raw.replace(/[^\x21-\x7E]/g, '');
}

/**
 * Normalize a user-entered API endpoint URL by removing ALL whitespace.
 *
 * Internal whitespace is almost always a paste artifact (two strings pasted
 * together, an accidental trailing space) and never valid in a URL. Path
 * normalization (e.g. a stray trailing `/v1`) is intentionally left to the
 * provider adapter, which knows the correct base path for its SDK.
 */
export function sanitizeEndpoint(raw: string): string {
  return raw.replace(/\s+/g, '');
}

/**
 * True when a string is a well-formed http(s) URL. An empty string is
 * considered valid because it means "use the provider's default endpoint".
 */
export function isValidEndpoint(url: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

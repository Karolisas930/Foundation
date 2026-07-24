/**
 * Lightweight text sanitization helpers.
 *
 * These are defense-in-depth utilities intended to run BEFORE persisting
 * user-provided text to the database. They are not a replacement for:
 *   - Parameterized queries / ORM bindings (which prevent SQL injection).
 *   - Output-side escaping / React's default JSX escaping (which prevents XSS
 *     when rendering).
 *
 * Use these when you need to store a "plain text" field and want to guarantee
 * that no HTML/script fragments, control characters, or absurdly long inputs
 * make it into the database.
 */

const SCRIPT_TAG = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;
const STYLE_TAG = /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi;
const ANY_TAG = /<\/?[a-zA-Z][^>]*>/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const EVENT_HANDLER_ATTR = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URI = /javascript\s*:/gi;

export interface SanitizeTextOptions {
  /** Maximum length after trimming. Defaults to 5000. Extra chars are dropped. */
  maxLength?: number;
  /** Collapse consecutive whitespace to a single space. Defaults to true. */
  collapseWhitespace?: boolean;
}

/**
 * Strip dangerous HTML, script fragments, event handlers, javascript: URIs,
 * and control characters from a user-supplied string. Returns a safe plain
 * text value suitable for storage in a text/varchar column.
 */
export function sanitizeText(input: unknown, options: SanitizeTextOptions = {}): string {
  if (input === null || input === undefined) return "";
  let value = typeof input === "string" ? input : String(input);

  value = value
    .replace(HTML_COMMENT, "")
    .replace(SCRIPT_TAG, "")
    .replace(STYLE_TAG, "")
    .replace(EVENT_HANDLER_ATTR, "")
    .replace(JAVASCRIPT_URI, "")
    .replace(ANY_TAG, "")
    .replace(CONTROL_CHARS, "");

  if (options.collapseWhitespace !== false) {
    value = value.replace(/\s+/g, " ");
  }

  value = value.trim();

  const maxLength = options.maxLength ?? 5000;
  if (value.length > maxLength) value = value.slice(0, maxLength);

  return value;
}

/**
 * Recursively sanitize every string in an object/array. Non-string leaves are
 * left untouched. Useful for request bodies before writing to the DB.
 */
export function sanitizeDeep<T>(value: T, options?: SanitizeTextOptions): T {
  if (typeof value === "string") {
    return sanitizeText(value, options) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeDeep(v, options)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeDeep(v, options);
    }
    return out as unknown as T;
  }
  return value;
}

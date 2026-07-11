/**
 * Parse text into lines (trimmed, non-empty).
 */
export function parseLines(text) {
  return String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

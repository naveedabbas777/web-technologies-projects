/**
 * Parse text into lines (trimmed, non-empty).
 */
export function parseLines(text) {
  return String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * Return a preview of the first N non-empty lines and whether the text was truncated.
 * Falls back to a character limit when the text has few explicit line breaks.
 */
export function getTextPreview(text, maxLines = 2, maxChars = 220) {
  const normalizedText = String(text || '');
  const lines = parseLines(normalizedText);
  const previewLines = lines.slice(0, maxLines);

  if (lines.length > maxLines) {
    return {
      preview: previewLines.join('\n'),
      isTruncated: true,
      totalLines: lines.length,
    };
  }

  if (normalizedText.length > maxChars) {
    return {
      preview: `${normalizedText.slice(0, maxChars).trimEnd()}...`,
      isTruncated: true,
      totalLines: lines.length,
    };
  }

  return {
    preview: previewLines.join('\n'),
    isTruncated: false,
    totalLines: lines.length,
  };
}

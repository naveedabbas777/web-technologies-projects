/**
 * Normalize common Google Drive URL forms to a clean public URL.
 * Handles: file/d/ID, open?id=, uc?export=view&id=, googleusercontent.com
 * Raw GitHub / other URLs are returned as-is (trimmed).
 */
export function normalizeImageUrl(url) {
  if (url == null || typeof url !== 'string') return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';

  try {
    let m = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;

    m = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;

    m = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;

    const parsed = new URL(trimmed);
    if (parsed.hostname === 'github.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 5 && parts[2] === 'blob') {
        const owner = parts[0];
        const repo = parts[1];
        const branch = parts[3];
        const filePath = parts.slice(4).join('/');
        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      }

      if (parts.length >= 5 && parts[2] === 'raw') {
        const owner = parts[0];
        const repo = parts[1];
        const branch = parts[3];
        const filePath = parts.slice(4).join('/');
        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      }

      if (parts.length >= 2 && parts[0] === 'user-attachments') {
        return `https://github.com${parsed.pathname}`;
      }
    }

    if (parsed.hostname === 'raw.githubusercontent.com') {
      parsed.hash = '';
      return parsed.toString();
    }

    if (parsed.hostname === 'media.githubusercontent.com') {
      parsed.hash = '';
      return parsed.toString();
    }

    if (parsed.hostname?.endsWith('googleusercontent.com')) {
      parsed.search = '';
      return parsed.toString();
    }
  } catch (e) {
    // Invalid URL (e.g. typo) – return trimmed so it can still be stored
  }
  return trimmed;
}

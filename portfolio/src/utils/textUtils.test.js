import { getTextPreview } from './textUtils';

describe('getTextPreview', () => {
  it('returns the first two lines as preview when the text is longer', () => {
    const result = getTextPreview('First line\nSecond line\nThird line\nFourth line', 2);

    expect(result.preview).toBe('First line\nSecond line');
    expect(result.isTruncated).toBe(true);
  });

  it('returns the full text for short content without truncation', () => {
    const result = getTextPreview('Short copy', 2);

    expect(result.preview).toBe('Short copy');
    expect(result.isTruncated).toBe(false);
  });

  it('truncates long single-line text by characters', () => {
    const longText = 'A'.repeat(300);
    const result = getTextPreview(longText, 2, 100);

    expect(result.preview).toBe('A'.repeat(100) + '...');
    expect(result.isTruncated).toBe(true);
  });
});

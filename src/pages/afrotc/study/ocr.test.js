import { describe, it, expect } from 'vitest';
import { cleanScan } from './ocr.js';

describe('cleanScan', () => {
  it('straightens quotes, drops page numbers and stray marks, keeps verse breaks', () => {
    const raw = '22\r\nOne fine line,\n  Another ‘line’ here  |\n\n\n\n_\nNew verse start\n23\n';
    expect(cleanScan(raw)).toBe("One fine line,\nAnother 'line' here\n\nNew verse start");
  });
  it('is safe on empty input', () => {
    expect(cleanScan('')).toBe('');
    expect(cleanScan(null)).toBe('');
  });
});

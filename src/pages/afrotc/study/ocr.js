// Photo-to-text for the lyrics editor, so the cadet can scan the page of his own handbook instead of typing it.
// The reader (tesseract.js) runs in the browser and is loaded from a CDN only when the button is used, so it
// adds nothing to the app bundle, and the photo never leaves the device.

let loading = null;
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
      s.onload = () => resolve(window.Tesseract);
      s.onerror = () => { loading = null; reject(new Error('The photo reader could not be loaded. Check your connection.')); };
      document.head.appendChild(s);
    });
  }
  return loading;
}

/** Tidy raw OCR output: straight quotes, no page numbers or stray marks, one blank line between verses. */
export function cleanScan(raw) {
  const lines = String(raw ?? '')
    .replace(/\r/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .split('\n')
    .map((l) => l.replace(/[|_~]+/g, ' ').replace(/\s+/g, ' ').trim())
    .map((l) => (/^\d{1,3}$/.test(l) || (l.length === 1 && !/[A-Za-z]/.test(l)) ? '' : l));
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** One or more photos -> cleaned text, joined in order. onProgress gets 0..1 across all photos. */
export async function scanPhotos(files, onProgress) {
  const T = await loadTesseract();
  const parts = [];
  for (let i = 0; i < files.length; i++) {
    const r = await T.recognize(files[i], 'eng', {
      logger: (m) => { if (m.status === 'recognizing text') onProgress?.((i + m.progress) / files.length); },
    });
    parts.push(cleanScan(r.data.text));
  }
  return parts.filter(Boolean).join('\n\n');
}

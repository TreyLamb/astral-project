export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const GRADIENTS = [
  ['#667eea','#764ba2'], ['#f093fb','#f5576c'], ['#4facfe','#00f2fe'],
  ['#43e97b','#38f9d7'], ['#fa709a','#fee140'], ['#a18cd1','#fbc2eb'],
  ['#ffecd2','#fcb69f'], ['#84fab0','#8fd3f4'], ['#d299c2','#fef9d7'],
  ['#f6d365','#fda085'], ['#89f7fe','#66a6ff'], ['#fddb92','#d1fdff'],
];

export function coverGradient(title = '') {
  const idx = (title.charCodeAt(0) || 0) % GRADIENTS.length;
  return `linear-gradient(145deg, ${GRADIENTS[idx][0]}, ${GRADIENTS[idx][1]})`;
}

// Extracts YouTube video ID from any common YouTube URL format.
// Returns null if the URL is not a YouTube link.
export function getYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/shorts/')[1].split('/')[0];
      if (u.pathname.startsWith('/embed/'))  return u.pathname.split('/embed/')[1].split('/')[0];
      return u.searchParams.get('v');
    }
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0];
  } catch {
    return null;
  }
  return null;
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const STATUS_LABELS = {
  plan:        'Plan to Watch / Read',
  'in-progress': 'In Progress',
  completed:   'Completed',
};

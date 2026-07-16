// lib/liveLink.js
// Validation for the weekly Facebook Live link.
//
// This matters more than it looks: /live is an open door on our own domain.
// Without a host allowlist, anyone who got into the admin could point
// live.erendirasboutique.com at any site on the internet — and the link would
// carry our domain's trust with it. Only Facebook hosts get through.

const ALLOWED_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'web.facebook.com',
  'fb.watch',
  'fb.me',
]);

// Where /live sends people when no link is set yet.
export const FALLBACK_URL = 'https://www.facebook.com/erendirasboutique';

export function normalizeLiveUrl(input) {
  const raw = typeof input === 'string' ? input.trim() : '';

  if (!raw) {
    return { ok: false, error: 'Paste a Facebook link first.' };
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: "That isn't a complete URL. It should start with https://" };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'The link has to start with https://' };
  }

  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) {
    return {
      ok: false,
      error: `${host} isn't a Facebook address. Copy the link straight from the video.`,
    };
  }

  // Strip Facebook's tracking junk so the stored link stays readable.
  parsed.searchParams.delete('__cft__[0]');
  parsed.searchParams.delete('__tn__');
  parsed.searchParams.delete('mibextid');
  parsed.hash = '';

  return { ok: true, url: parsed.toString() };
}

export function describeAge(updatedAt) {
  if (!updatedAt) return null;

  const then = new Date(updatedAt).getTime();
  if (Number.isNaN(then)) return null;

  const minutes = Math.floor((Date.now() - then) / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

// The lives are weekly, so anything older than 8 days is probably stale.
export function isStale(updatedAt) {
  if (!updatedAt) return true;
  const then = new Date(updatedAt).getTime();
  if (Number.isNaN(then)) return true;
  return Date.now() - then > 8 * 24 * 60 * 60 * 1000;
}

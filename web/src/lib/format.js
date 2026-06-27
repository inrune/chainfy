// Display helpers shared across the app.

export const SOL_USD = 140.5; // approximate; for display only on devnet

export const cls = (...a) => a.filter(Boolean).join(' ');

export function fmtSol(n) {
  const v = Number(n) || 0;
  return v.toFixed(v < 1 ? 3 : 2);
}

export function fmtUsd(sol) {
  return ((Number(sol) || 0) * SOL_USD).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function short(s, head = 4, tail = 4) {
  if (!s || s.length <= head + tail + 1) return s || '';
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export function timeAgo(ts) {
  const d = Date.now() - ts;
  const s = Math.floor(d / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(ts) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
